"""
import_oases.py
==============
Import oases.json ke Turso (tabel oases).
Dijalankan sekali saat server baru dibuka.

Usage:
    python import_oases.py path/to/oases.json
    python import_oases.py https://raw.githubusercontent.com/user/repo/main/oases.json

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
        with urllib.request.urlopen(req, timeout=120) as resp:
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
        # Konversi GitHub blob URL ke raw URL kalau perlu
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
        print("Usage: python import_oases.py <path/to/oases.json atau URL>")
        sys.exit(1)

    data       = load_json(sys.argv[1])
    oases      = data["oases"]
    fetched_at = data["fetchedAt"]
    server     = SERVER_CODE or data["server"]

    print("=" * 55)
    print(f"  Oases Importer")
    print(f"  Server    : {server}")
    print(f"  Fetched at: {fetched_at}")
    print(f"  Total     : {len(oases):,} oases")
    print("=" * 55)

    # Cek progress import sejauh ini
    result   = turso_execute([turso_stmt("SELECT COUNT(*) as cnt FROM oases WHERE server = ?", [server])])
    rows     = result.get("results", [{}])[0].get("response", {}).get("result", {}).get("rows", [])
    existing = int(rows[0][0]["value"]) if rows else 0
    if existing > 0:
        print(f"\n📊 Sudah ada {existing:,} oases di DB — melanjutkan import...")

    print(f"\n📤 Insert {len(oases):,} oases ke Turso...")
    stmts = [
        turso_stmt(
            """INSERT OR REPLACE INTO oases
               (x, y, server, type_name, bonus_str, resources, bonuses, max_bonus, is_double, fetched_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            [o["x"], o["y"], server, o["typeName"], o["bonusStr"],
             json.dumps(o["resources"]), json.dumps(o["bonuses"]),
             o["maxBonus"], 1 if o["isDouble"] else 0, fetched_at]
        )
        for o in oases
    ]
    errors = turso_batch(stmts, batch_size=150)

    print("=" * 55)
    print(f"  {'✅ Import selesai!' if not errors else '⚠️  Selesai dengan error'}")
    print(f"  Oases  : {len(oases):,}")
    print(f"  Errors : {errors}")
    print("=" * 55)

if __name__ == "__main__":
    main()
