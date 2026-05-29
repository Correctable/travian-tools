/**
 * TravianTools API Worker
 * travian-api.sonybukansoni.workers.dev
 *
 * Endpoints:
 *   GET /api/statistics?server=ts5&type=players&page=1
 *   GET /api/statistics?server=ts5&type=alliances&page=1
 *   GET /api/player?server=ts5&id={id}
 *   GET /api/player?server=ts5&name={name}
 *   GET /api/alliance?server=ts5&id={id}
 *   GET /api/alliance?server=ts5&name={name}
 *   GET /api/inactive?server=ts5&days=7
 *   GET /api/oasis?server=ts5&page=1
 *   GET /api/villages?server=ts5&crops=15,9&page=1   (village finder)
 *   GET /api/search?server=ts5&q=playerName&type=player
 */

// ── CORS HEADERS ──────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': 'https://travian.sonybukansoni.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── LIMITS ────────────────────────────────────────────────────────────────────
const LIMITS = {
  statistics:    50,
  oasis:         1000,   // free preview cap
  villageFinder: 1000,   // free preview cap
  inactive:      200,
  search:        8,
};

// ── VALID SERVERS ─────────────────────────────────────────────────────────────
const VALID_SERVERS = ['ts5', 'ts1'];

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (request.method !== 'GET') {
      return jsonError('Method not allowed', 405);
    }

    const url    = new URL(request.url);
    const path   = url.pathname;
    const params = url.searchParams;

    // Only handle /api/* routes
    if (!path.startsWith('/api/')) {
      return jsonError('Not found', 404);
    }

    // Rate limiting via IP (basic)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    try {
      const route = path.replace('/api/', '');

      switch (route) {
        case 'statistics': return await handleStatistics(params, env);
        case 'player':     return await handlePlayer(params, env);
        case 'alliance':   return await handleAlliance(params, env);
        case 'inactive':   return await handleInactive(params, env);
        case 'oasis':      return await handleOasis(params, env);
        case 'villages':   return await handleVillages(params, env);
        case 'search':     return await handleSearch(params, env);
        default:           return jsonError('Unknown endpoint', 404);
      }
    } catch (err) {
      console.error('Worker error:', err);
      return jsonError('Internal server error', 500);
    }
  }
};

// ── TURSO QUERY ───────────────────────────────────────────────────────────────
async function turso(env, sql, args = []) {
  const res = await fetch(`${env.TURSO_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.TURSO_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: args.map(toTursoArg) } },
        { type: 'close' }
      ]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const result = data.results?.[0];
  if (result?.type === 'error') throw new Error(result.error?.message || 'Query error');

  const cols = result?.response?.result?.cols?.map(c => c.name) || [];
  const rows = result?.response?.result?.rows || [];

  return rows.map(row =>
    Object.fromEntries(cols.map((col, i) => [col, row[i]?.value ?? null]))
  );
}

function toTursoArg(v) {
  if (v === null || v === undefined) return { type: 'null' };
  if (typeof v === 'number') return { type: 'integer', value: String(v) };
  return { type: 'text', value: String(v) };
}

// ── VALIDATE SERVER ───────────────────────────────────────────────────────────
function validateServer(server) {
  if (!server) return null;
  // Accept both 'ts5' and 'ts5.x1.asia' formats
  const slug = server.split('.')[0].toLowerCase();
  return VALID_SERVERS.includes(slug) ? slug : null;
}

// ── STATISTICS ────────────────────────────────────────────────────────────────
async function handleStatistics(params, env) {
  const server = validateServer(params.get('server'));
  const type   = params.get('type') || 'players'; // players | alliances
  const page   = Math.max(1, parseInt(params.get('page') || '1'));
  const limit  = LIMITS.statistics;
  const offset = (page - 1) * limit;

  if (!server) return jsonError('Invalid server', 400);
  if (!['players', 'alliances'].includes(type)) return jsonError('Invalid type', 400);

  let rows;

  if (type === 'players') {
    rows = await turso(env, `
      SELECT p.player_id, p.player_name, p.tribe, p.population, p.village_count,
             p.rank, a.alliance_tag
      FROM players p
      LEFT JOIN alliances a ON p.alliance_id = a.alliance_id AND p.server = a.server
      WHERE p.server = ?
      ORDER BY p.rank ASC
      LIMIT ? OFFSET ?
    `, [server, limit, offset]);
  } else {
    rows = await turso(env, `
      SELECT alliance_id, alliance_name, alliance_tag, population, member_count, rank
      FROM alliances
      WHERE server = ?
      ORDER BY rank ASC
      LIMIT ? OFFSET ?
    `, [server, limit, offset]);
  }

  return jsonOk({ type, page, limit, rows });
}

// ── PLAYER ────────────────────────────────────────────────────────────────────
async function handlePlayer(params, env) {
  const server = validateServer(params.get('server'));
  const id     = params.get('id');
  const name   = params.get('name');

  if (!server) return jsonError('Invalid server', 400);
  if (!id && !name) return jsonError('id or name required', 400);

  const [player, villages, history, villageEvents, allianceEvents] = await Promise.all([
    // Player info
    id
      ? turso(env, `SELECT p.*, a.alliance_tag, a.alliance_name FROM players p LEFT JOIN alliances a ON p.alliance_id=a.alliance_id AND p.server=a.server WHERE p.player_id=? AND p.server=?`, [id, server])
      : turso(env, `SELECT p.*, a.alliance_tag, a.alliance_name FROM players p LEFT JOIN alliances a ON p.alliance_id=a.alliance_id AND p.server=a.server WHERE LOWER(p.player_name)=LOWER(?) AND p.server=?`, [name, server]),

    // Villages (max 8)
    id
      ? turso(env, `SELECT * FROM villages WHERE player_id=? AND server=? ORDER BY is_capital DESC, population DESC`, [id, server])
      : turso(env, `SELECT v.* FROM villages v JOIN players p ON v.player_id=p.player_id AND v.server=p.server WHERE LOWER(p.player_name)=LOWER(?) AND v.server=?`, [name, server]),

    // History
    id
      ? turso(env, `SELECT snap_date, population, village_count FROM player_history WHERE player_id=? AND server=? ORDER BY snap_date ASC`, [id, server])
      : [],

    // Village events
    id
      ? turso(env, `SELECT * FROM village_events WHERE (old_player_id=? OR new_player_id=?) AND server=? ORDER BY event_date DESC LIMIT 50`, [id, id, server])
      : [],

    // Alliance events
    id
      ? turso(env, `SELECT * FROM alliance_events WHERE player_id=? AND server=? ORDER BY event_date DESC LIMIT 30`, [id, server])
      : [],
  ]);

  if (!player.length) return jsonError('Player not found', 404);

  return jsonOk({ player: player[0], villages, history, villageEvents, allianceEvents });
}

// ── ALLIANCE ──────────────────────────────────────────────────────────────────
async function handleAlliance(params, env) {
  const server = validateServer(params.get('server'));
  const id     = params.get('id');
  const name   = params.get('name');

  if (!server) return jsonError('Invalid server', 400);
  if (!id && !name) return jsonError('id or name required', 400);

  const where  = id ? 'a.alliance_id=?' : 'LOWER(a.alliance_tag)=LOWER(?)';
  const val    = id || name;

  const [alliance, members, history, events] = await Promise.all([
    turso(env, `SELECT * FROM alliances a WHERE ${where} AND a.server=?`, [val, server]),
    turso(env, `
      SELECT p.player_id, p.player_name, p.tribe, p.population, p.village_count,
             ph.population as prev_pop
      FROM players p
      LEFT JOIN (
        SELECT player_id, population FROM player_history
        WHERE server=? AND snap_date=(SELECT MAX(snap_date) FROM player_history WHERE server=? AND snap_date < DATE('now'))
      ) ph ON p.player_id=ph.player_id
      WHERE p.alliance_id=(SELECT alliance_id FROM alliances WHERE ${where} AND server=?) AND p.server=?
      ORDER BY p.population DESC
    `, [server, server, val, server, server]),
    turso(env, `SELECT snap_date, population, member_count, village_count FROM alliance_history WHERE alliance_id=(SELECT alliance_id FROM alliances WHERE ${where} AND server=?) AND server=? ORDER BY snap_date ASC`, [val, server, server]),
    turso(env, `SELECT * FROM alliance_events WHERE alliance_id=(SELECT alliance_id FROM alliances WHERE ${where} AND server=?) AND server=? ORDER BY event_date DESC LIMIT 50`, [val, server, server]),
  ]);

  if (!alliance.length) return jsonError('Alliance not found', 404);

  return jsonOk({ alliance: alliance[0], members, history, events });
}

// ── INACTIVE SEARCH ───────────────────────────────────────────────────────────
async function handleInactive(params, env) {
  const server = validateServer(params.get('server'));
  const days   = Math.min(14, Math.max(1, parseInt(params.get('days') || '7')));
  const minPop = parseInt(params.get('minPop') || '0');
  const maxPop = parseInt(params.get('maxPop') || '999999');
  const tribe  = params.get('tribe') || 'all';

  if (!server) return jsonError('Invalid server', 400);

  // Get latest N snapshot dates
  const snaps = await turso(env,
    `SELECT DISTINCT snap_date FROM village_history WHERE server=? ORDER BY snap_date DESC LIMIT ?`,
    [server, days]
  );

  if (!snaps.length) return jsonError('No snapshot data available', 404);

  const dates       = snaps.map(s => s.snap_date);
  const placeholders = dates.map(() => '?').join(',');

  // Get village history for those dates — SERVER-SIDE filter by pop range
  const history = await turso(env, `
    SELECT village_id, village_name, x, y, tribe, player_id, player_name,
           alliance_id, alliance_tag, population, snap_date, is_capital
    FROM village_history
    WHERE server=?
      AND snap_date IN (${placeholders})
      AND population BETWEEN ? AND ?
      ${tribe !== 'all' ? 'AND tribe=?' : ''}
    ORDER BY village_id, snap_date DESC
  `, [server, ...dates, minPop, maxPop, ...(tribe !== 'all' ? [tribe] : [])]);

  // Get current player populations
  const players = await turso(env,
    `SELECT player_id, population FROM players WHERE server=?`,
    [server]
  );

  const playerPop = {};
  for (const p of players) playerPop[p.player_id] = Number(p.population);

  // Group by village, detect inactive
  const byVillage = {};
  for (const row of history) {
    if (!byVillage[row.village_id]) byVillage[row.village_id] = [];
    byVillage[row.village_id].push(row);
  }

  const results = [];
  for (const [vid, snapshots] of Object.entries(byVillage)) {
    if (snapshots.length < 2) continue;
    const latest = snapshots[0];
    const oldest = snapshots[snapshots.length - 1];
    const popChange = Number(latest.population) - Number(oldest.population);

    // Check if player population also unchanged (better inactive signal)
    const currentPop = playerPop[latest.player_id] ?? null;
    const isInactive = popChange === 0;
    if (!isInactive) continue;

    results.push({
      ...latest,
      pop_change: popChange,
      snap_count: snapshots.length,
      current_player_pop: currentPop,
    });
  }

  // Sort by population desc, limit
  results.sort((a, b) => Number(b.population) - Number(a.population));
  const limited = results.slice(0, LIMITS.inactive);

  return jsonOk({
    server,
    days,
    snap_count: dates.length,
    total_inactive: results.length,
    results: limited,
  });
}

// ── OASIS DATA ────────────────────────────────────────────────────────────────
async function handleOasis(params, env) {
  const server  = validateServer(params.get('server'));
  const page    = Math.max(1, parseInt(params.get('page') || '1'));
  const sort    = params.get('sort') || 'max_bonus';
  const type    = params.get('type') || 'all';
  const limit   = LIMITS.oasis;
  const offset  = (page - 1) * limit;

  if (!server) return jsonError('Invalid server', 400);

  const validSorts = ['max_bonus', 'x', 'y'];
  const sortCol = validSorts.includes(sort) ? sort : 'max_bonus';

  const typeFilter = type !== 'all' ? 'AND type_name=?' : '';
  const typeArgs   = type !== 'all' ? [type] : [];

  const rows = await turso(env, `
    SELECT x, y, type_name, bonus_str, resources, max_bonus
    FROM oases
    WHERE server=? ${typeFilter}
    ORDER BY ${sortCol} DESC
    LIMIT ? OFFSET ?
  `, [server, ...typeArgs, limit, offset]);

  // Get total count for pagination info
  const countRows = await turso(env,
    `SELECT COUNT(*) as total FROM oases WHERE server=? ${typeFilter}`,
    [server, ...typeArgs]
  );
  const total = Number(countRows[0]?.total || 0);

  return jsonOk({
    server, page, limit,
    total, total_pages: Math.ceil(total / limit),
    is_preview: true,
    preview_cap: LIMITS.oasis,
    rows,
  });
}

// ── VILLAGE FINDER ────────────────────────────────────────────────────────────
async function handleVillages(params, env) {
  const server    = validateServer(params.get('server'));
  const cropsRaw  = params.get('crops') || '15';
  const page      = Math.max(1, parseInt(params.get('page') || '1'));
  const limit     = LIMITS.villageFinder;
  const offset    = (page - 1) * limit;

  if (!server) return jsonError('Invalid server', 400);

  // Validate crops param — only allow numbers
  const crops = cropsRaw.split(',')
    .map(c => parseInt(c.trim()))
    .filter(c => [4,5,6,7,8,9,10,11,12,13,14,15].includes(c));

  if (!crops.length) return jsonError('Invalid crops parameter', 400);

  const cropPlaceholders = crops.map(() => '?').join(',');

  // Server for tiles uses different slug format
  const serverTiles = server + '.x1.asia';

  const [tiles, villages, oases] = await Promise.all([
    turso(env, `
      SELECT x, y, crop, wood, clay, iron, field_label
      FROM village_tiles
      WHERE server=? AND crop IN (${cropPlaceholders})
      LIMIT ?
    `, [serverTiles, ...crops, limit]),

    turso(env, `
      SELECT x, y, village_name, player_id, player_name,
             alliance_id, alliance_tag, population
      FROM villages
      WHERE server=?
    `, [server]),

    turso(env, `
      SELECT x, y, type_name, bonus_str, resources, max_bonus
      FROM oases
      WHERE server=?
    `, [serverTiles]),
  ]);

  // Total count for preview notice
  const countRows = await turso(env,
    `SELECT COUNT(*) as total FROM village_tiles WHERE server=? AND crop IN (${cropPlaceholders})`,
    [serverTiles, ...crops]
  );
  const total = Number(countRows[0]?.total || 0);

  return jsonOk({
    server, crops, page, limit,
    total, is_preview: tiles.length < total,
    tiles, villages, oases,
  });
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
async function handleSearch(params, env) {
  const server = validateServer(params.get('server'));
  const q      = (params.get('q') || '').trim();
  const type   = params.get('type') || 'player'; // player | alliance

  if (!server) return jsonError('Invalid server', 400);
  if (q.length < 2) return jsonError('Query too short', 400);
  if (!['player', 'alliance'].includes(type)) return jsonError('Invalid type', 400);

  let rows;
  if (type === 'player') {
    rows = await turso(env, `
      SELECT player_id, player_name, tribe, population, village_count
      FROM players
      WHERE server=? AND player_name LIKE ?
      ORDER BY population DESC
      LIMIT ?
    `, [server, `%${q}%`, LIMITS.search]);
  } else {
    rows = await turso(env, `
      SELECT alliance_id, alliance_name, alliance_tag, population, member_count
      FROM alliances
      WHERE server=? AND (alliance_name LIKE ? OR alliance_tag LIKE ?)
      ORDER BY population DESC
      LIMIT ?
    `, [server, `%${q}%`, `%${q}%`, LIMITS.search]);
  }

  return jsonOk({ type, q, rows });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function jsonOk(data) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
