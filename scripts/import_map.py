"""
import_map.py
============
Download map.sql dari server Travian, parse, lalu push ke Turso (libSQL).

Dijalankan oleh GitHub Actions setiap hari otomatis.
Bisa juga dijalankan manual:
    python scripts/import_map.py

Environment variables yang dibutuhkan:
    TURSO_DATABASE_URL  — libsql://travian-stats-xxx.turso.io
    TURSO_AUTH_TOKEN    — token dari Turso dashboard
"""

import csv
import io
import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timezone

# ── Konfigurasi ───────────────────────────────────────────────────────────────

MAP_SQL_URL  = "http://ts5.x1.asia.travian.com/map.sql"
SERVER_CODE  = "ts5"

TURSO_URL    = os.environ.get("TURSO_DATABASE_URL", "").rstrip("/")
TURSO_TOKEN  = os.environ.get("TURSO_AUTH_TOKEN", "")

TRIBE_NAMES  = {
    "1": "Roman",
    "2": "Teuton",
    "3": "Gaul",
    "4": "Nature",
    "5": "Natarian",
    "6": "Egyptian",
    "7": "Hun",
}

# ── Turso HTTP API ─────────────────────────────────────────────────────────────

def turso_execute(statements: list[dict]) -> dict:
    """
    Kirim batch statements ke Turso via HTTP API (v2 pipeline).
    statements = list of dict hasil turso_stmt()
    """
    if not TURSO_URL or not TURSO_TOKEN:
        raise RuntimeError("TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN belum di-set!")

    # Turso API endpoint: ganti libsql:// → https://
    api_url = TURSO_URL.replace("libsql://", "https://") + "/v2/pipeline"

    # Format resmi Turso v2 pipeline
    payload = {
        "requests": [
            {"type": "execute", "stmt": stmt} for stmt in statements
        ] + [{"type": "close"}]
    }

    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        api_url,
        data    = data,
        headers = {
            "Authorization": f"Bearer {TURSO_TOKEN}",
            "Content-Type":  "application/json",
        },
        method = "POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Turso HTTP {e.code}: {body[:300]}") from e


def turso_stmt(sql: str, params: list = None) -> dict:
    """
    Buat statement dict sesuai format Turso v2.
    Format args: [{"type": "text"|"integer"|"null", "value": ...}]
    """
    stmt = {"sql": sql}
    if params:
        args = []
        for v in params:
            if v is None:
                args.append({"type": "null", "value": None})
            elif isinstance(v, bool):
                args.append({"type": "integer", "value": str(1 if v else 0)})
            elif isinstance(v, int):
                args.append({"type": "integer", "value": str(v)})
            else:
                args.append({"type": "text", "value": str(v)})
        stmt["args"] = args
    return stmt


def turso_batch(stmts: list[dict], batch_size: int = 100):
    """Kirim statements dalam batch supaya tidak timeout."""
    total  = len(stmts)
    sent   = 0
    errors = 0
    for i in range(0, total, batch_size):
        chunk = stmts[i : i + batch_size]
        try:
            result = turso_execute(chunk)
            # Cek error di response
            for r in result.get("results", []):
                if r.get("type") == "error":
                    msg = r.get("error", {}).get("message", "?")
                    print(f"  ⚠️  Turso row error: {msg}")
                    errors += 1
        except RuntimeError as e:
            print(f"  ❌ Batch error (chunk {i}–{i+batch_size}): {e}")
            errors += 1
            # Hentikan jika error fatal (bukan row error)
            break
        sent += len(chunk)
        pct   = sent * 100 // total
        print(f"  [{pct:3d}%] {sent}/{total} statements dikirim...", end="\r")
    print()
    return errors


# ── Download ───────────────────────────────────────────────────────────────────

def download_map_sql() -> str:
    print(f"📥 Download map.sql dari {MAP_SQL_URL} ...")
    req = urllib.request.Request(MAP_SQL_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        content = resp.read().decode("utf-8", errors="replace")
    size_kb = len(content) / 1024
    print(f"   ✅ {size_kb:.1f} KB didownload")
    return content


# ── Parse ──────────────────────────────────────────────────────────────────────

def parse_map_sql(content: str) -> list[dict]:
    """
    Parse INSERT INTO `x_world` VALUES (...) dari map.sql.
    Handle edge case: village_name mengandung koma.
    Return list of dict per desa.
    """
    pattern = re.compile(r"INSERT INTO `x_world` VALUES \((.+)\);")
    rows    = []
    skipped = 0

    for line in content.splitlines():
        m = pattern.match(line.strip())
        if not m:
            continue

        raw    = m.group(1)
        reader = csv.reader(io.StringIO(raw))
        parsed = None
        for r in reader:
            parsed = [v.strip("'") for v in r]

        if parsed is None:
            skipped += 1
            continue

        # Handle village_name dengan koma (kolom lebih dari 16)
        n = len(parsed)
        if n == 16:
            cols = parsed
        elif n > 16:
            prefix     = parsed[:5]          # mapid, x, y, tribe, village_id
            suffix     = parsed[-(16-6):]    # player_id s/d col15 (10 kolom)
            vname      = ",".join(parsed[5 : n - (16-6)])
            cols       = prefix + [vname] + suffix
        else:
            skipped += 1
            continue

        rows.append({
            "mapid":        int(cols[0]),
            "x":            int(cols[1]),
            "y":            int(cols[2]),
            "tribe":        int(cols[3]),
            "village_id":   int(cols[4]),
            "village_name": cols[5],
            "player_id":    int(cols[6]),
            "player_name":  cols[7],
            "alliance_id":  int(cols[8]),
            "alliance_tag": cols[9],
            "population":   int(cols[10]),
            "is_capital":   1 if cols[12] == "TRUE" else 0,
        })

    print(f"   ✅ {len(rows):,} desa di-parse, {skipped} baris dilewati")
    return rows


# ── Aggregate ──────────────────────────────────────────────────────────────────

def aggregate(rows: list[dict], snap_date: str) -> tuple[dict, dict]:
    """Kalkulasi data player & alliance dari list desa."""
    players   = {}
    alliances = {}

    for r in rows:
        pid = r["player_id"]
        if pid != 0:
            if pid not in players:
                players[pid] = {
                    "player_id":    pid,
                    "player_name":  r["player_name"],
                    "tribe":        r["tribe"],
                    "alliance_id":  r["alliance_id"],
                    "alliance_tag": r["alliance_tag"],
                    "population":   0,
                    "village_count": 0,
                    "snap_date":    snap_date,
                }
            players[pid]["population"]    += r["population"]
            players[pid]["village_count"] += 1

        aid = r["alliance_id"]
        if aid != 0 and r["alliance_tag"]:
            if aid not in alliances:
                alliances[aid] = {
                    "alliance_id":  aid,
                    "alliance_tag": r["alliance_tag"],
                    "population":   0,
                    "village_count": 0,
                    "members":      set(),
                    "snap_date":    snap_date,
                }
            alliances[aid]["population"]    += r["population"]
            alliances[aid]["village_count"] += 1
            if pid != 0:
                alliances[aid]["members"].add(pid)

    return players, alliances


# ── Push ke Turso ──────────────────────────────────────────────────────────────

def check_already_imported(snap_date: str) -> bool:
    """Cek apakah snapshot hari ini sudah ada (anti-duplikat)."""
    try:
        result = turso_execute([
            turso_stmt(
                "SELECT id FROM snapshots WHERE server = ? AND snap_date = ? LIMIT 1",
                [SERVER_CODE, snap_date]
            )
        ])
        rows = (result.get("results", [{}])[0]
                      .get("response", {})
                      .get("result", {})
                      .get("rows", []))
        return len(rows) > 0
    except RuntimeError as e:
        print(f"❌ Gagal koneksi ke Turso: {e}")
        raise


def push_to_turso(rows: list[dict], players: dict, alliances: dict, snap_date: str):
    imported_at = datetime.now(timezone.utc).isoformat()
    total_pop   = sum(r["population"] for r in rows)

    print(f"\n📤 Push ke Turso ({snap_date}) ...")

    # ── 1. Insert snapshot ────────────────────────────────────────────────────
    print("   [1/6] Insert snapshot...")
    turso_execute([turso_stmt(
        """INSERT OR IGNORE INTO snapshots
           (server, snap_date, imported_at, total_villages, total_players, total_alliances, total_population)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        [SERVER_CODE, snap_date, imported_at,
         len(rows), len(players), len(alliances), total_pop]
    )])

    # ── 2. Clear tabel "current" ──────────────────────────────────────────────
    print("   [2/6] Clear tabel current...")
    turso_execute([
        turso_stmt("DELETE FROM villages  WHERE server = ?", [SERVER_CODE]),
        turso_stmt("DELETE FROM players   WHERE server = ?", [SERVER_CODE]),
        turso_stmt("DELETE FROM alliances WHERE server = ?", [SERVER_CODE]),
    ])

    # ── 3. Insert villages ────────────────────────────────────────────────────
    print(f"   [3/6] Insert {len(rows):,} villages...")
    stmts = [
        turso_stmt(
            """INSERT INTO villages
               (village_id, server, mapid, x, y, tribe, village_name,
                player_id, player_name, alliance_id, alliance_tag,
                population, is_capital, snap_date)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            [r["village_id"], SERVER_CODE, r["mapid"], r["x"], r["y"],
             r["tribe"], r["village_name"], r["player_id"], r["player_name"],
             r["alliance_id"], r["alliance_tag"], r["population"],
             r["is_capital"], snap_date]
        )
        for r in rows
    ]
    errors = turso_batch(stmts, batch_size=150)
    print(f"   {'✅' if not errors else '⚠️ '} Villages selesai ({errors} error)")

    # ── 4. Insert players ─────────────────────────────────────────────────────
    print(f"   [4/6] Insert {len(players):,} players...")
    stmts = [
        turso_stmt(
            """INSERT INTO players
               (player_id, server, player_name, tribe, alliance_id, alliance_tag,
                population, village_count, snap_date)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            [p["player_id"], SERVER_CODE, p["player_name"], p["tribe"],
             p["alliance_id"], p["alliance_tag"], p["population"],
             p["village_count"], snap_date]
        )
        for p in players.values()
    ]
    errors = turso_batch(stmts, batch_size=150)
    print(f"   {'✅' if not errors else '⚠️ '} Players selesai ({errors} error)")

    # ── 5. Insert alliances ───────────────────────────────────────────────────
    print(f"   [5/6] Insert {len(alliances):,} alliances...")
    stmts = [
        turso_stmt(
            """INSERT INTO alliances
               (alliance_id, server, alliance_tag, member_count, village_count,
                population, snap_date)
               VALUES (?,?,?,?,?,?,?)""",
            [a["alliance_id"], SERVER_CODE, a["alliance_tag"],
             len(a["members"]), a["village_count"], a["population"], snap_date]
        )
        for a in alliances.values()
    ]
    errors = turso_batch(stmts, batch_size=150)
    print(f"   {'✅' if not errors else '⚠️ '} Alliances selesai ({errors} error)")

    # ── 6. Insert history (append-only) ──────────────────────────────────────
    print(f"   [6/6] Insert history...")
    stmts = []
    for p in players.values():
        stmts.append(turso_stmt(
            """INSERT OR IGNORE INTO player_history
               (player_id, server, snap_date, player_name, alliance_id,
                alliance_tag, population, village_count)
               VALUES (?,?,?,?,?,?,?,?)""",
            [p["player_id"], SERVER_CODE, snap_date, p["player_name"],
             p["alliance_id"], p["alliance_tag"], p["population"],
             p["village_count"]]
        ))
    for a in alliances.values():
        stmts.append(turso_stmt(
            """INSERT OR IGNORE INTO alliance_history
               (alliance_id, server, snap_date, alliance_tag, member_count,
                village_count, population)
               VALUES (?,?,?,?,?,?,?)""",
            [a["alliance_id"], SERVER_CODE, snap_date, a["alliance_tag"],
             len(a["members"]), a["village_count"], a["population"]]
        ))
    errors = turso_batch(stmts, batch_size=150)
    print(f"   {'✅' if not errors else '⚠️ '} History selesai ({errors} error)")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    snap_date = date.today().isoformat()  # 'YYYY-MM-DD'

    print("=" * 55)
    print(f"  Travian Map Importer")
    print(f"  Server : {SERVER_CODE}")
    print(f"  Tanggal: {snap_date}")
    print("=" * 55)

    # Anti-duplikat: skip jika sudah diimport hari ini
    if check_already_imported(snap_date):
        print(f"⏭️  Snapshot {snap_date} sudah ada di database. Skip.")
        sys.exit(0)

    # Pipeline utama
    content          = download_map_sql()
    rows             = parse_map_sql(content)
    players, alliances = aggregate(rows, snap_date)
    push_to_turso(rows, players, alliances, snap_date)

    print("\n" + "=" * 55)
    print(f"  ✅ Import selesai!")
    print(f"  Desa    : {len(rows):,}")
    print(f"  Players : {len(players):,}")
    print(f"  Alliance: {len(alliances):,}")
    print("=" * 55)


if __name__ == "__main__":
    main()
