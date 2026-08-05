// Verifies Supabase connectivity and row counts using .env values.
// Usage: node scripts/check-supabase.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadEnv() {
  const envPath = path.join(root, '.env');
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const env = loadEnv();
const url = (env.VITE_SUPABASE_URL || '').replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}
console.log('URL:', url);

const supabase = createClient(url, key, { auth: { persistSession: false } });
const tables = ['friends', 'categories', 'groups', 'hangouts'];

let ok = true;
for (const t of tables) {
  const { data, count, error, status } = await supabase
    .from(t)
    .select('*', { count: 'exact' })
    .limit(3);
  if (error) {
    ok = false;
    console.error(`  ${t}: status=${status} ERROR -> ${error.code || ''} ${error.message}`);
    if (error.details) console.error(`      details: ${error.details}`);
    if (error.hint) console.error(`      hint: ${error.hint}`);
  } else {
    console.log(`  ${t}: status=${status} count=${count} sample=${data?.length ?? 0}`);
  }
}
process.exit(ok ? 0 : 2);
