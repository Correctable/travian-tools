# TravianTools — Village Planner: Ringkasan Project

## Konteks Project

Ini adalah bagian dari website **TravianTools** (travian.sonybukansoni.com) yang sedang dikembangkan. Sebelumnya sudah selesai dibuat fitur **Field Production** (simulasi produksi resource per jam). Sekarang giliran **Village Planner** — fitur untuk merencanakan bangunan dalam desa dan menghitung total biayanya.

---

## Apa itu Village Planner

Simulasi perencanaan bangunan desa di game Travian: Legends. User bisa:
- Memilih bangunan apa saja yang ingin dibangun di desa
- Menentukan target level tiap bangunan
- Melihat total biaya resource kumulatif (Lumber, Clay, Iron, Crop)

Berbeda dengan Field Production yang menghitung **produksi per jam**, Village Planner menghitung **total biaya pembangunan**.

---

## Yang Sudah Disepakati

### 1. Slot Bangunan
- Total slot visual di peta desa = **22 slot**
- **3 slot fixed** (sudah ada, tidak bisa dihapus): Main Building, Rally Point, Wall
- **19 slot bebas** yang bisa diisi user

### 2. Layout UI — Dashboard Style
```
┌─────────────────────────────┬──────────────────────────────┐
│                             │  COST SUMMARY TABLE          │
│   VILLAGE MAP               │  ┌──────────┬──────┬──────┐  │
│   (22 slot visual)          │  │ Building │ Lvl  │ Cost │  │
│                             │  ├──────────┼──────┼──────┤  │
│   Klik slot kosong          │  │ Barracks │  10  │ ...  │  │
│   → Building Picker         │  ├──────────┼──────┼──────┤  │
│                             │  │ TOTAL    │      │ ...  │  │
│                             │  └──────────┴──────┴──────┘  │
│                             │                              │
│                             │  🪵 Lumber: xxx              │
│                             │  🧱 Clay:   xxx              │
│                             │  ⚙️  Iron:   xxx              │
│                             │  🌾 Crop:   xxx              │
└─────────────────────────────┴──────────────────────────────┘
```

### 3. Cara Input Bangunan — 2 Opsi
- **Opsi 1:** Klik slot kosong di peta desa → Building Picker modal muncul
- **Opsi 2:** Tombol "+ Add Building" → Building Grid → assign ke slot otomatis
- Keduanya bermuara ke state yang sama

### 4. Constraints Bangunan (harus di-enforce)
- Max 1 instance per bangunan (tidak bisa 2 Marketplace)
- Prerequisites harus dipenuhi (misal Academy butuh Main Building lv3 + Barracks lv3)
- Tribe restriction (Brewery hanya Teuton, Trapper hanya Gaul, dll)
- Capital restriction (Great Barracks, Great Stable hanya di capital)
- Mutual exclusion (Residence vs Palace tidak bisa bersamaan)

### 5. Fitur — Fase 1 (scope sekarang)
- **Total biaya kumulatif** dari level 0 → target level semua bangunan
- Breakdown per resource dan per bangunan
- Belum termasuk: build order suggestion, export/share

### 6. Tribe yang Didukung — 7 Tribe
`roman`, `teuton`, `gaul`, `egyptian`, `hun`, `spartan`, `viking`

### 7. Icon Bangunan — CDN Travian
```
Base:   https://cdn.legends.travian.com/gpack/456.6/img_ltr/themes/default/buildings/{tribe}/g{gid}.png
Wall:   g{gid}Top.png + g{gid}Bottom.png  (gid 31, 32, 33)
WoW:    g40_1.png s/d g40_5.png (5 fase)
```
Tribe slug: `roman`, `teuton`, `gaul` (tribe baru perlu dicek apakah ada di CDN yang sama)

---

## Daftar GID Bangunan

| GID | Nama | Catatan |
|-----|------|---------|
| gid5 | Sawmill | Resource factory |
| gid6 | Brickyard | Resource factory |
| gid7 | Iron Foundry | Resource factory |
| gid8 | Grain Mill | Resource factory |
| gid9 | Bakery | Resource factory |
| gid10 | Warehouse | |
| gid11 | Granary | |
| gid13 | Smithy | |
| gid14 | Tournament Square | |
| gid15 | Main Building | Fixed slot |
| gid16 | Rally Point | Fixed slot |
| gid17 | Marketplace | |
| gid18 | Embassy | |
| gid19 | Barracks | |
| gid20 | Stable | |
| gid21 | Workshop | |
| gid22 | Academy | |
| gid23 | Cranny | |
| gid24 | Town Hall | |
| gid25 | Residence | Mutual excl. dengan Palace |
| gid26 | Palace | Mutual excl. dengan Residence, 1 per account |
| gid27 | Treasury | |
| gid28 | Trade Office | |
| gid29 | Great Barracks | Capital only |
| gid30 | Great Stable | Capital only |
| gid31 | City Wall | Roman only, fixed slot |
| gid32 | Earth Wall | Teuton only, fixed slot |
| gid33 | Palisade | Gaul only, fixed slot |
| gid34 | Stonemason's Lodge | Capital only |
| gid35 | Brewery | Teuton only |
| gid36 | Trapper | Gaul only |
| gid37 | Hero's Mansion | |
| gid38 | Great Warehouse | Capital only |
| gid39 | Great Granary | Capital only |
| gid40 | Wonder of the World | Capital only, 5 fase |
| gid41 | Horse Drinking Trough | Roman only |

---

## Format Data JSON yang Disepakati

```json
{
  "gid": 22,
  "name": "Academy",
  "category": "military",
  "unique": true,
  "tribes": "all",
  "capitalOnly": false,
  "maxLevel": 20,
  "prerequisites": [
    { "gid": 15, "level": 3 },
    { "gid": 19, "level": 3 }
  ],
  "levels": [
    {
      "level": 1,
      "cost": [220, 160, 90, 40],
      "pop": 4,
      "cp": 5,
      "time": 1000
    }
  ]
}
```

- `cost` = array `[lumber, clay, iron, crop]`
- `time` = detik, base speed 1x, Main Building level 0
- `tribes` = `"all"` atau array `["teuton", "roman"]`

### Formula Waktu dengan Main Building
```
actualTime = baseTime / (1 + mainBuildingLevel * 0.05)
```

---

## Sumber Data

| Sumber | Status | Kegunaan |
|--------|--------|----------|
| kirilloid.ru/build.php | ✅ Bisa dibuka di browser, data via JS | Sumber utama cost & time per level |
| knowledgebase.legends.travian.com | ❌ Tidak bisa di-fetch | Referensi manual prerequisites |
| CDN Travian legends | ✅ URL pattern jelas | Icon bangunan |
| kirilloid GitHub repo | ⚠️ Source TypeScript tersedia | Backup jika perlu |

---

## Rencana Pengumpulan Data (Excel)

Data dikumpulkan manual dari kirilloid ke file Excel dengan format:

### Sheet `buildings_meta`
| gid | name | category | unique | capital_only | max_level | tribes | prerequisites |
|-----|------|----------|--------|--------------|-----------|--------|---------------|
| 22 | Academy | military | TRUE | FALSE | 20 | all | 15:3,19:3 |

- `prerequisites` = format `gid:level` dipisah koma
- `tribes` = "all" atau nama tribe dipisah koma

### Sheet per Bangunan (nama sheet = nama bangunan)
| level | lumber | clay | iron | crop | pop | cp | time |
|-------|--------|------|------|------|-----|----|------|
| 1 | 220 | 160 | 90 | 40 | 4 | 5 | 0:16:40 |

- `time` boleh format `h:mm:ss` dari kirilloid langsung, akan dikonversi ke detik saat processing
- Tidak perlu catat kolom `total` dan baris `∑`

### Urutan Prioritas Pengisian Data
```
Batch 1 — Infrastructure dasar (semua tribe):
  Warehouse, Granary, Main Building, Rally Point,
  Marketplace, Embassy, Cranny, Town Hall, Hero's Mansion

Batch 2 — Military (semua tribe):
  Smithy, Tournament Square, Barracks, Stable,
  Workshop, Academy

Batch 3 — Settlement & expansion:
  Residence, Palace, Treasury, Trade Office,
  Stonemason's Lodge

Batch 4 — Tribe-specific:
  Brewery (Teuton), Trapper (Gaul),
  Horse Drinking Trough (Roman),
  Great Barracks, Great Stable, Great Warehouse,
  Great Granary (capital only)
```

---

## Urutan Pengerjaan Teknis

```
1. ✅ Diskusi & kerangka (selesai)
2. 🔄 Pengumpulan data → Excel (sedang berjalan)
3. ⏳ Konversi Excel → JSON final
4. ⏳ Komponen UI: Village Map + Slot system
5. ⏳ Building Picker modal
6. ⏳ Cost Summary table (panel kanan)
7. ⏳ Constraint validation engine
8. ⏳ Integrasi ke website TravianTools
```

---

## Catatan Teknis Tambahan

- **Tech stack website** mengikuti Field Production yang sudah ada (screenshot menunjukkan React/Next.js style)
- **Wall (gid31-33)** punya 2 gambar: `Top` dan `Bottom`, tribe-specific
- **WoW (gid40)** punya 5 fase gambar: `g40_1.png` s/d `g40_5.png`
- Tribe baru (Egyptian, Hun, Spartan, Viking) — perlu dicek apakah CDN icon menggunakan slug berbeda
- Data cost bangunan **sama untuk semua tribe**, yang berbeda hanya bangunan tribe-specific
