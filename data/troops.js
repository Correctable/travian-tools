/**
 * troops.js — TravianTools Troop Data
 * Single source of truth untuk semua data unit Travian.
 *
 * CARA PAKAI:
 *   <script src="/data/troops.js"></script>
 *   (Load SEBELUM navbar.js dan script halaman lain)
 *
 * EKSPOR GLOBAL — window.TT:
 *   TT.troops               Array semua troop
 *   TT.troopByClass['u1']   Lookup by class_id
 *   TT.troopByName['phalanx'] Lookup by nama lowercase
 *   TT.troopsByTribe['gaul']  Array troop per tribe
 *   TT.tribes               Array config tribe
 *   TT.getSpriteStyle(class_id)          → CSS string sprite
 *   TT.getSpriteStyleByName(name, tribe) → CSS string sprite (untuk parser)
 *   TT.ICONS                Semua URL icon combat & resource
 *
 * CATATAN NPC:
 *   Nature  — isNPC: true, canCapture: true  (bisa ditangkap di oasis, def only)
 *   Natar   — isNPC: true, canCapture: false (tidak bisa ditangkap, atk+def)
 *   Hero    — isHero: true, stats dinamis (tidak ada di sini)
 */

(function () {
  'use strict';

  /* ── CDN ── */
  const CDN_SPRITE = 'https://cdn.legends.travian.com/gpack/456.8/img_ltr/global/units';
  const CDN_LEGACY = 'https://cdn.legends.travian.com/gpack/467.4/img_ltr/legacy/global';
  const CDN_RES    = 'https://cdn.legends.travian.com/gpack/467.4/img_ltr/global/resources';
  const SPRITE_SIZE = 26;
  const ICON_SIZE   = 26;

  /* ── TRIBE CONFIG ── */
  const TRIBES = [
    { id:'roman',    label:'Romans',    folder:'roman',    u_start:1,  display_order:0, isNPC:false, canCapture:false },
    { id:'teuton',   label:'Teutons',   folder:'teuton',   u_start:11, display_order:1, isNPC:false, canCapture:false },
    { id:'gaul',     label:'Gauls',     folder:'gaul',     u_start:21, display_order:2, isNPC:false, canCapture:false },
    { id:'egyptian', label:'Egyptians', folder:'egyptian', u_start:51, display_order:3, isNPC:false, canCapture:false },
    { id:'hun',      label:'Huns',      folder:'hun',      u_start:61, display_order:4, isNPC:false, canCapture:false },
    { id:'nature',   label:'Nature',    folder:'nature',   u_start:31, display_order:5, isNPC:true,  canCapture:true,
      note:'Defender only. Can be captured at oasis and used as defender — cannot attack.' },
    { id:'natar',    label:'Natars',    folder:'natar',    u_start:41, display_order:6, isNPC:true,  canCapture:false,
      note:'NPC attacker and defender. Cannot be captured by players.' },
  ];

  /* ── RAW DATA ──
   * [class_id, tribe, slot, name,
   *  wood, clay, iron, crop,
   *  attack, def_inf, def_cav,
   *  speed, carry, upkeep, training_time, prerequisites]
   *
   * training_time = base lvl 1 building, format 'H:MM:SS'
   * Nature & Natar cost = 0 (non-trainable)
   * Nature & Natar training_time = '' (non-applicable)
   */
  const RAW = [
    // ── ROMAN ──
    ['u1',  'roman',0, 'Legionnaire',        120,  100,  150,   30,  40,  35,  50,  6,   50, 1, '0:26:40', 'Barracks Level 1'],
    ['u2',  'roman',1, 'Praetorian',         100,  130,  160,   70,  30,  65,  35,  5,   20, 1, '0:29:20', 'Academy Level 1, Smithy Level 1'],
    ['u3',  'roman',2, 'Imperian',           150,  160,  210,   80,  70,  40,  25,  7,   50, 1, '0:32:00', 'Academy Level 5, Smithy Level 1'],
    ['u4',  'roman',3, 'Equites Legati',     140,  160,   20,   40,   0,  20,  10, 16,    0, 2, '0:22:40', 'Stable Level 1, Academy Level 5'],
    ['u5',  'roman',4, 'Equites Imperatoris',550,  440,  320,  100, 120,  65,  50, 14,  100, 3, '0:44:00', 'Stable Level 5, Academy Level 5'],
    ['u6',  'roman',5, 'Equites Caesaris',   550,  640,  800,  180, 180,  80, 105, 10,   70, 4, '0:58:40', 'Stable Level 10, Academy Level 15'],
    ['u7',  'roman',6, 'Battering Ram',      900,  360,  500,   70,  60,  30,  75,  4,    0, 3, '1:16:40', 'Academy Level 10, Workshop Level 1'],
    ['u8',  'roman',7, 'Fire Catapult',      950, 1350,  600,   90,  75,  60,  10,  3,    0, 6, '2:30:00', 'Workshop Level 10, Academy Level 15'],
    ['u9',  'roman',8, 'Senator',          30750,27200,45000,37500,  50,  40,  30,  4,    0, 5, '25:11:40','Rally Point Level 10, Academy Level 20'],
    ['u10', 'roman',9, 'Settler',           4600, 4200, 5800, 4400,   0,  80,  80,  5, 3000, 1, '7:28:20', 'Residence Level 10 or Palace Level 10'],

    // ── TEUTON ──
    ['u11', 'teuton',0, 'Clubswinger',        95,   75,   40,   40,  40,  20,   5,  7,   60, 1, '0:12:00', 'Barracks Level 1'],
    ['u12', 'teuton',1, 'Spearman',          145,   70,   85,   40,  10,  35,  60,  7,   40, 1, '0:18:40', 'Academy Level 1, Barracks Level 3'],
    ['u13', 'teuton',2, 'Axeman',            130,  120,  170,   70,  60,  30,  30,  6,   50, 1, '0:20:00', 'Academy Level 3, Smithy Level 1'],
    ['u14', 'teuton',3, 'Scout',             160,  100,   50,   50,   0,  10,   5,  9,    0, 1, '0:18:40', 'Academy Level 1, Main Building Level 5'],
    ['u15', 'teuton',4, 'Paladin',           370,  270,  290,   75,  55, 100,  40, 10,  110, 2, '0:40:00', 'Academy Level 5, Stable Level 3'],
    ['u16', 'teuton',5, 'Teutonic Knight',   450,  515,  480,   80, 150,  50,  75,  9,   80, 3, '0:49:20', 'Academy Level 15, Stable Level 10'],
    ['u17', 'teuton',6, 'Ram',              1000,  300,  350,   70,  65,  30,  80,  4,    0, 3, '1:10:00', 'Academy Level 10, Workshop Level 1'],
    ['u18', 'teuton',7, 'Catapult',          900, 1200,  600,   60,  50,  60,  10,  3,    0, 6, '2:30:00', 'Workshop Level 10, Academy Level 15'],
    ['u19', 'teuton',8, 'Chief',           35500,26600,25000,27200,  40,  60,  40,  4,    0, 4, '19:35:00','Rally Point Level 5, Academy Level 20'],
    ['u20', 'teuton',9, 'Settler',          5800, 4400, 4600, 5200,  10,  80,  80,  5, 3000, 1, '8:36:40', 'Residence Level 10 or Palace Level 10'],

    // ── GAUL ──
    ['u21', 'gaul',0, 'Phalanx',            100,  130,   55,   30,  15,  40,  50,  7,   35, 1, '0:17:20', 'Barracks Level 1'],
    ['u22', 'gaul',1, 'Swordsman',          140,  150,  185,   60,  65,  35,  20,  6,   45, 1, '0:24:00', 'Academy Level 3, Smithy Level 1'],
    ['u23', 'gaul',2, 'Pathfinder',         170,  150,   20,   40,   0,  20,  10, 17,    0, 2, '0:22:40', 'Academy Level 5, Stable Level 1'],
    ['u24', 'gaul',3, 'Theutates Thunder',  350,  450,  230,   60, 100,  25,  40, 19,   75, 2, '0:41:20', 'Academy Level 5, Stable Level 3'],
    ['u25', 'gaul',4, 'Druidrider',         360,  330,  280,  120,  45, 115,  55, 16,   35, 2, '0:42:40', 'Academy Level 5, Stable Level 5'],
    ['u26', 'gaul',5, 'Haeduan',            500,  620,  675,  170, 140,  60, 165, 13,   65, 3, '0:52:00', 'Academy Level 15, Stable Level 10'],
    ['u27', 'gaul',6, 'Ram',                950,  555,  330,   75,  50,  30, 105,  4,    0, 3, '1:23:20', 'Academy Level 10, Workshop Level 1'],
    ['u28', 'gaul',7, 'Trebuchet',          960, 1450,  630,   90,  70,  45,  10,  3,    0, 6, '2:30:00', 'Workshop Level 10, Academy Level 15'],
    ['u29', 'gaul',8, 'Chieftain',        30750,45400,31000,37500,  40,  50,  50,  5,    0, 4, '25:11:40','Rally Point Level 10, Academy Level 20'],
    ['u30', 'gaul',9, 'Settler',           4400, 5600, 4200, 3900,   0,  80,  80,  5, 3000, 1, '6:18:20', 'Residence Level 10 or Palace Level 10'],

    // ── NATURE (NPC — canCapture: true) ──
    ['u31', 'nature',0, 'Rat',       0,0,0,0,  10,  25,  20, 20, 0, 0, '', ''],
    ['u32', 'nature',1, 'Spider',    0,0,0,0,  20,  35,  40, 20, 0, 0, '', ''],
    ['u33', 'nature',2, 'Snake',     0,0,0,0,  60,  40,  60, 20, 0, 0, '', ''],
    ['u34', 'nature',3, 'Bat',       0,0,0,0,  80,  66,  50, 20, 0, 0, '', ''],
    ['u35', 'nature',4, 'Wild Boar', 0,0,0,0,  50,  70,  33, 20, 0, 0, '', ''],
    ['u36', 'nature',5, 'Wolf',      0,0,0,0, 100,  80,  70, 20, 0, 0, '', ''],
    ['u37', 'nature',6, 'Bear',      0,0,0,0, 250, 140, 200, 20, 0, 0, '', ''],
    ['u38', 'nature',7, 'Crocodile', 0,0,0,0, 450, 380, 240, 20, 0, 0, '', ''],
    ['u39', 'nature',8, 'Tiger',     0,0,0,0, 200, 170, 250, 20, 0, 0, '', ''],
    ['u40', 'nature',9, 'Elephant',  0,0,0,0, 600, 440, 520, 20, 0, 0, '', ''],

    // ── NATAR (NPC — canCapture: false) ──
    ['u41', 'natar',0, 'Pikeman',           100, 100, 100,  50,  20,  35,  50,  6,   10, 1, '0:04:00', ''],
    ['u42', 'natar',1, 'Thorned Warrior',   100, 100, 100,  50,  65,  30,  10,  7,   10, 1, '0:04:00', ''],
    ['u43', 'natar',2, 'Guardsman',         150, 150, 150, 150, 100,  90,  75,  6,   10, 1, '0:06:00', ''],
    ['u44', 'natar',3, 'Birds Of Prey',      50,  50,  50,  75,   0,  10,   0, 25,   10, 1, '0:02:00', ''],
    ['u45', 'natar',4, 'Axerider',          300, 150, 150, 100, 155,  80,  50, 14,   10, 2, '0:08:00', ''],
    ['u46', 'natar',5, 'Natarian Knight',   250, 250, 400, 150, 170, 140,  80, 12,   10, 3, '0:10:00', ''],
    ['u47', 'natar',6, 'War Elephant',      400, 300, 300, 400, 250, 120, 150,  5,   10, 4, '0:12:00', ''],
    ['u48', 'natar',7, 'Ballista',          200, 200, 200, 100,  60,  45,  10,  3,   10, 5, '0:10:00', ''],
    ['u49', 'natar',8, 'Natarian Emperor', 1000,1000,1000,1000,  80,  50,  50,  5,   10, 1, '0:30:00', ''],
    ['u50', 'natar',9, 'Settler',           200, 200, 200, 200,  30,  40,  40,  5, 3000, 1, '0:30:00', ''],

    // ── EGYPTIAN ──
    ['u51', 'egyptian',0, 'Slave Militia',    45,   60,   30,   15,  10,  30,  20,  7,   15, 1, '0:08:50', 'Barracks Level 1'],
    ['u52', 'egyptian',1, 'Ash Warden',      115,  100,  145,   60,  30,  55,  40,  6,   50, 1, '0:23:00', 'Academy Level 1, Smithy Level 1'],
    ['u53', 'egyptian',2, 'Khopesh Warrior', 170,  180,  220,   80,  65,  50,  20,  7,   45, 1, '0:24:00', 'Academy Level 5, Smithy Level 1'],
    ['u54', 'egyptian',3, 'Sopdu Explorer',  170,  150,   20,   40,   0,  20,  10, 16,    0, 2, '0:22:40', 'Stable Level 1, Academy Level 5'],
    ['u55', 'egyptian',4, 'Anhur Guard',     360,  330,  280,  120,  50, 110,  50, 15,   50, 2, '0:42:40', 'Stable Level 5, Academy Level 5'],
    ['u56', 'egyptian',5, 'Resheph Chariot', 450,  560,  610,  180, 110, 120, 150, 10,   70, 3, '0:54:00', 'Stable Level 10, Academy Level 15'],
    ['u57', 'egyptian',6, 'Ram',             995,  575,  340,   80,  55,  30,  95,  4,    0, 3, '1:20:00', 'Academy Level 10, Workshop Level 1'],
    ['u58', 'egyptian',7, 'Stone Catapult',  980, 1510,  660,  100,  65,  55,  10,  3,    0, 6, '2:30:00', 'Workshop Level 10, Academy Level 15'],
    ['u59', 'egyptian',8, 'Nomarch',       34000,50000,34000,42000,  40,  50,  50,  4,    0, 4, '25:11:40','Rally Point Level 10, Academy Level 20'],
    ['u60', 'egyptian',9, 'Settler',        5040, 6510, 4830, 4620,   0,  80,  80,  5, 3000, 1, '6:53:20', 'Residence Level 10 or Palace Level 10'],

    // ── HUN ──
    ['u61', 'hun',0, 'Mercenary',      130,   80,   40,   40,  35,  40,  30,  6,   50, 1, '0:13:30', 'Barracks Level 1'],
    ['u62', 'hun',1, 'Bowman',         140,  110,   60,   60,  50,  30,  10,  6,   30, 1, '0:18:40', 'Academy Level 3, Smithy Level 1'],
    ['u63', 'hun',2, 'Spotter',        170,  150,   20,   40,   0,  20,  10, 19,    0, 2, '0:22:40', 'Academy Level 5, Stable Level 1'],
    ['u64', 'hun',3, 'Steppe Rider',   290,  370,  190,   45, 120,  30,  15, 16,   75, 2, '0:40:00', 'Academy Level 5, Stable Level 3'],
    ['u65', 'hun',4, 'Marksman',       320,  350,  330,   50, 110,  80,  70, 15,  105, 2, '0:41:20', 'Academy Level 5, Stable Level 5'],
    ['u66', 'hun',5, 'Marauder',       450,  560,  610,  140, 180,  60,  40, 14,   80, 3, '0:49:50', 'Academy Level 15, Stable Level 10'],
    ['u67', 'hun',6, 'Ram',           1060,  330,  360,   70,  65,  30,  90,  4,    0, 3, '1:13:20', 'Academy Level 10, Workshop Level 1'],
    ['u68', 'hun',7, 'Catapult',       950, 1280,  620,   60,  45,  55,  10,  3,    0, 6, '2:30:00', 'Workshop Level 10, Academy Level 15'],
    ['u69', 'hun',8, 'Logades',      37200,27600,25200,27600,  50,  40,  30,  5,    0, 4, '25:11:40','Rally Point Level 10, Academy Level 20'],
    ['u70', 'hun',9, 'Settler',        6100, 4600, 4800, 5400,  10,  80,  80,  5, 3000, 1, '8:02:30', 'Residence Level 10 or Palace Level 10 or Command Center Level 10'],

    // ── HERO (stats dinamis — hanya placeholder untuk icon & lookup) ──
    ['uhero', 'default', 0, 'Hero', 0,0,0,0, 0,0,0, 0, 0, 1, '', ''],
  ];

  /* ── PARSE RAW → OBJECTS ── */
  const tribeById = {};
  for (const t of TRIBES) tribeById[t.id] = t;

  const troops = RAW.map(r => {
    const tribeData = tribeById[r[1]] || null;
    return {
      class_id:      r[0],
      tribe:         r[1],
      tribe_display: tribeData?.label || r[1],
      tribe_display_order: tribeData?.display_order ?? 99,
      slot:          r[2],
      name:          r[3],
      isNPC:         tribeData?.isNPC  || false,
      canCapture:    tribeData?.canCapture || false,
      isHero:        r[0] === 'uhero',
      cost: {
        wood:  r[4], clay: r[5], iron: r[6], crop: r[7],
        total: r[4] + r[5] + r[6] + r[7],
      },
      stats: {
        attack:    r[8],
        def_inf:   r[9],
        def_cav:   r[10],
        speed:     r[11],
        carry:     r[12],
        upkeep:    r[13],
        training:  r[14] || '',
      },
      prerequisites: r[15] || '',
    };
  });

  /* ── LOOKUP MAPS ── */
  const troopByClass  = {};
  const troopByName   = {};
  const troopsByTribe = {};

  for (const t of troops) {
    troopByClass[t.class_id] = t;
    troopByName[t.name.toLowerCase()] = t;

    // Also index common abbreviations / alternate spellings
    if (!troopsByTribe[t.tribe]) troopsByTribe[t.tribe] = [];
    troopsByTribe[t.tribe].push(t);
  }

  // Extra aliases for battle report parser (ingame text variations)
  const ALIASES = {
    'battering ram':        'u7',
    'fire catapult':        'u8',
    'teutonic knight':      'u16',
    'theutates thunder':    'u24',
    'equites legati':       'u4',
    'equites imperatoris':  'u5',
    'equites caesaris':     'u6',
    'slave militia':        'u51',
    'ash warden':           'u52',
    'khopesh warrior':      'u53',
    'sopdu explorer':       'u54',
    'anhur guard':          'u55',
    'resheph chariot':      'u56',
    'stone catapult':       'u58',
    'steppe rider':         'u64',
    'wild boar':            'u35',
    'thorned warrior':      'u42',
    'birds of prey':        'u44',
    'axerider':             'u45',
    'natarian knight':      'u46',
    'war elephant':         'u47',
    'natarian emperor':     'u49',
  };
  for (const [alias, cid] of Object.entries(ALIASES)) {
    if (!troopByName[alias]) troopByName[alias] = troopByClass[cid];
  }

  /* ── SPRITE HELPERS ── */
  function getSpriteStyle(class_id) {
    if (class_id === 'uhero') {
      const url = `${CDN_SPRITE}/default/icon/hero_medium.png`;
      return `background-image:url('${url}');background-position:0 0;` +
             `background-size:${ICON_SIZE}px ${ICON_SIZE}px;` +
             `width:${ICON_SIZE}px;height:${ICON_SIZE}px;display:inline-block;`;
    }
    const t = troopByClass[class_id];
    if (!t) return null;
    const td = tribeById[t.tribe];
    if (!td) return null;
    const url  = `${CDN_SPRITE}/${td.folder}/icon/${td.folder}_medium.png`;
    const bgY  = -(t.slot * SPRITE_SIZE);
    return `background-image:url('${url}');background-position:0 ${bgY}px;` +
           `background-size:${ICON_SIZE}px ${ICON_SIZE * 10}px;` +
           `width:${ICON_SIZE}px;height:${ICON_SIZE}px;display:inline-block;`;
  }

  function getSpriteStyleByName(name, tribeHint) {
    const key = (name || '').toLowerCase().trim();

    if (key === 'hero') return getSpriteStyle('uhero');

    let t = troopByName[key];

    // Settler — same name across tribes, resolve by hint
    if (!t && key === 'settler' && tribeHint) {
      const td = tribeById[tribeHint];
      if (td) t = troopByClass[`u${td.u_start + 9}`];
    }
    // Generic ram/catapult — resolve by tribe hint
    if (!t && (key === 'ram' || key === 'catapult') && tribeHint) {
      const ramSlots    = { roman:6, teuton:6, gaul:6, egyptian:6, hun:6, natar:6 };
      const catSlots    = { teuton:7, hun:7, natar:7 };
      const slotMap     = key === 'ram' ? ramSlots : catSlots;
      const slot        = slotMap[tribeHint];
      const td          = tribeById[tribeHint];
      if (td && slot !== undefined) t = troopByClass[`u${td.u_start + slot}`];
    }

    if (!t) return null;
    return getSpriteStyle(t.class_id);
  }

  /* ── ICONS ── */
  const ICONS = {
    // Combat row labels
    sent:      `${CDN_LEGACY}/combat/troopCount_small.png`,
    dead:      `${CDN_LEGACY}/combat/troopDead_small.png`,
    wounded:   `${CDN_LEGACY}/combat/troopWounded_small.png`,
    // Stats header
    offence:   `${CDN_LEGACY}/combat/offence_medium.png`,
    defence:   `${CDN_LEGACY}/combat/defence_medium.png`,
    // Resources
    freeCrop:  `${CDN_RES}/freeCrop_small.png`,
    resources: `${CDN_RES}/resources_medium.png`,
    wood:      `${CDN_RES}/lumber_tiny.png`,
    clay:      `${CDN_RES}/clay_tiny.png`,
    iron:      `${CDN_RES}/iron_tiny.png`,
    crop:      `${CDN_RES}/crop_tiny.png`,
  };

  /* ── EXPOSE ── */
  window.TT = window.TT || {};
  Object.assign(window.TT, {
    troops,
    troopByClass,
    troopByName,
    troopsByTribe,
    tribes: TRIBES,
    getSpriteStyle,
    getSpriteStyleByName,
    ICONS,
    SPRITE_SIZE,
    ICON_SIZE,
    CDN_SPRITE,
    CDN_LEGACY,
  });

})();