// ---------- online leaderboard (Supabase) ----------
// Off until the project URL and its public (anon) key are filled in below.
// The database side is in supabase/schema.sql. The table is never touched
// directly: the game only calls two functions, submit_score and top_scores.
export const SUPABASE_URL = '';
export const SUPABASE_KEY = '';
export const ONLINE = !!(SUPABASE_URL && SUPABASE_KEY);

const get = (k, d) => { try { const v = localStorage.getItem('nb_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const set = (k, v) => { try { localStorage.setItem('nb_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

// a random id that identifies this device on the leaderboard (never shown)
function playerId() {
  let id = get('player', null);
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
      const r = (Math.random() * 16) | 0; return (ch === 'x' ? r : (r & 3) | 8).toString(16);
    });
    set('player', id);
  }
  return id;
}

export const NAME_RE = /^[A-Z0-9]{3,10}$/;
export const getName = () => get('name', '');
export function setName(n) { set('name', n); flush(); }

async function rpc(fn, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) { const e = new Error('rpc ' + fn + ' ' + r.status); e.status = r.status; throw e; }
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

// Finished runs wait in a queue until they are sent (no internet, no name yet).
export function submitRun(run) {
  if (!ONLINE) return;
  const q = get('queue', []);
  q.push(run);
  set('queue', q.slice(-10));
  flush();
}

let flushing = false;
export async function flush() {
  if (!ONLINE || flushing || !NAME_RE.test(getName())) return;
  flushing = true;
  try {
    let q = get('queue', []);
    while (q.length) {
      const r = q[0];
      try {
        await rpc('submit_score', { p_player: playerId(), p_name: getName(), p_score: r.score, p_cleared: r.cleared, p_stage: r.stage, p_version: r.version });
      } catch (e) {
        if (!e.status || e.status >= 500) break;   // offline or server down: try again later
        // 4xx: refused by the server (e.g. impossible score): drop it
      }
      q = q.slice(1);
      set('queue', q);
    }
  } finally { flushing = false; }
}

// { rows: [{ pos, name, score, stage }], me: { pos, score } | null }
export async function fetchTop(period) {
  return rpc('top_scores', { p_period: period, p_player: playerId() });
}

if (ONLINE) { window.addEventListener('online', flush); setTimeout(flush, 3000); }
