"""
import_village_tiles.py
=======================
Import villages.json ke Turso (tabel village_tiles).
Dijalankan sekali saat server baru dibuka.

Usage:
    python import_village_tiles.py path/to/villages.json
    python import_village_tiles.py https://raw.githubusercontent.com/user/repo/main/villages.json

Environment variables:
    TURSO_DATABASE_URL
    TURSO_AUTH_TOKEN
    SERVER_CODE  (opsional, default ambil dari JSON)
"""

import json
import os
import sys
import urllib.request

TURSO_URL   = os.environ.get("TURSO_DATABASE_URL", "").rstrip("/")
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")
SERVER_CODE = os.environ.get("SERVER_CODE", "")

# ── Turso HTTP API ─────────────────────────────────────────────────────────────

def turso_execute(statements):
    if not TURSO_URL or not TURSO_TOKEN:
        raise RuntimeError("TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN belum di-set!")
    api_url = TURSO_URL.replace("libsql://", "https://") + "/v2/pipeline"
    payload = {
        "requests": [{"type": "execute", "stmt": stmt} for stmt in statements]
        + [{"type": "close"}]
    }
    data = json.dumps(payload).encode("utf-8")
    req  = urllib.request.Request(
        api_url, data=data,
        headers={"Authorization": f"Bearer {TURSO_TOKEN}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Turso HTTP {e.code}: {body[:300]}") from e


def turso_stmt(sql, params=None):
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


def turso_batch(stmts, batch_size=100):
    total  = len(stmts)
    sent   = 0
    errors = 0
    for i in range(0, total, batch_size):
        chunk = stmts[i : i + batch_size]
        try:
            result = turso_execute(chunk)
            for r in result.get("results", []):
                if r.get("type") == "error":
                    print(f"  ⚠️  Turso row error: {r.get('error', {}).get('message', '?')}")
                    errors += 1
        except RuntimeError as e:
            print(f"  ❌ Batch error: {e}")
            errors += 1
            break
        sent += len(chunk)
        print(f"  [{sent*100//total:3d}%] {sent}/{total} dikirim...", end="\r")
    print()
    return errors

# ── Load JSON (file lokal atau URL) ───────────────────────────────────────────

def load_json(source):
    if source.startswith("http://") or source.startswith("https://"):
        if "github.com" in source and "/blob/" in source:
            source = source.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/")
        print(f"🌐 Fetch dari URL: {source}")
        req = urllib.request.Request(source, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    else:
        print(f"📖 Membaca file: {source}")
        with open(source, "r", encoding="utf-8") as f:
            return json.load(f)

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python import_village_tiles.py <path/to/villages.json atau URL>")
        sys.exit(1)

    data       = load_json(sys.argv[1])
    villages   = data["villages"]
    fetched_at = data["fetchedAt"]
    server     = SERVER_CODE or data["server"]
    summary    = data.get("summary", {})

    print("=" * 55)
    print(f"  Village Tiles Importer")
    print(f"  Server    : {server}")
    print(f"  Fetched at: {fetched_at}")
    print(f"  Total     : {len(villages):,} tiles")
    print("=" * 55)

    if summary:
        print("\n📊 Breakdown field type:")
        max_count = max(summary.values()) if summary else 1
        for label, count in sorted(summary.items(), key=lambda x: -x[1]):
            bar = "█" * (count * 20 // max_count)
            print(f"  {label:10s} {bar:20s} {count:,}")

    # Cek apakah sudah pernah diimport
    result   = turso_execute([turso_stmt("SELECT COUNT(*) as cnt FROM village_tiles WHERE server = ?", [server])])
    rows     = result.get("results", [{}])[0].get("response", {}).get("result", {}).get("rows", [])
    existing = int(rows[0][0]["value"]) if rows else 0
    if existing > 0:
        print(f"\n⚠️  Sudah ada {existing:,} tiles untuk server '{server}' di DB.")
        confirm = input("Lanjut dan overwrite? (y/N): ").strip().lower()
        if confirm != "y":
            print("❌ Dibatalkan.")
            sys.exit(0)
        print("🗑️  Menghapus data lama...")
        turso_execute([turso_stmt("DELETE FROM village_tiles WHERE server = ?", [server])])

    known   = sum(1 for v in villages if v.get("fieldType"))
    unknown = len(villages) - known
    print(f"\n  Known field type          : {known:,}")
    print(f"  Unknown (occupied at fetch): {unknown:,}")
    print(f"\n📤 Insert {len(villages):,} tiles ke Turso...")

    stmts = [
        turso_stmt(
            """INSERT OR REPLACE INTO village_tiles
               (x, y, server, field_type, field_label, wood, clay, iron, crop, fetched_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            [v["x"], v["y"], server,
             v.get("fieldType")  or None,
             v.get("fieldLabel") or None,
             v.get("wood")       if v.get("wood")  is not None else None,
             v.get("clay")       if v.get("clay")  is not None else None,
             v.get("iron")       if v.get("iron")  is not None else None,
             v.get("crop")       if v.get("crop")  is not None else None,
             fetched_at]
        )
        for v in villages
    ]
    errors = turso_batch(stmts, batch_size=150)

    print("=" * 55)
    print(f"  {'✅ Import selesai!' if not errors else '⚠️  Selesai dengan error'}")
    print(f"  Total tiles : {len(villages):,}")
    print(f"  Errors      : {errors}")
    print("=" * 55)

if __name__ == "__main__":
    main()
