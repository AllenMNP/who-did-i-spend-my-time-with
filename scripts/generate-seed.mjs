// Generates supabase/seed.sql from the newest data/backup-*.json file.
// Usage: node scripts/generate-seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dataDir = path.join(root, 'data');
const outFile = path.join(root, 'supabase', 'seed.sql');

function newestBackup() {
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.startsWith('backup-') && f.endsWith('.json'))
    .map((f) => ({ f, t: fs.statSync(path.join(dataDir, f)).mtime.getTime() }))
    .sort((a, b) => b.t - a.t);
  if (files.length === 0) throw new Error('No backup files found in data/');
  return path.join(dataDir, files[0].f);
}

// SQL literal helpers
const q = (v) =>
  v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`;
const num = (v) => (v === null || v === undefined || v === '' ? 'null' : Number(v));
const jsonb = (v) => `'${JSON.stringify(v ?? []).replace(/'/g, "''")}'::jsonb`;

function main() {
  const src = newestBackup();
  const data = JSON.parse(fs.readFileSync(src, 'utf-8'));
  const friends = data.friends ?? [];
  const categories = data.categories ?? [];
  const groups = data.groups ?? [];
  const hangouts = data.hangouts ?? [];

  const lines = [];
  lines.push('-- Friend Time Tracker - data seed');
  lines.push(`-- Generated from: ${path.basename(src)}`);
  lines.push('-- Run AFTER schema.sql in the Supabase SQL Editor. Idempotent.');
  lines.push('begin;');
  lines.push('');

  lines.push('-- friends');
  for (const f of friends) {
    lines.push(
      `insert into public.friends (id, name, group_ids) values (${q(f.id)}, ${q(
        f.name
      )}, ${jsonb(f.groupIds)}) on conflict (id) do update set name = excluded.name, group_ids = excluded.group_ids;`
    );
  }
  lines.push('');

  lines.push('-- categories');
  for (const c of categories) {
    lines.push(
      `insert into public.categories (id, name, color) values (${q(c.id)}, ${q(
        c.name
      )}, ${q(c.color)}) on conflict (id) do update set name = excluded.name, color = excluded.color;`
    );
  }
  lines.push('');

  lines.push('-- groups');
  for (const g of groups) {
    lines.push(
      `insert into public.groups (id, name) values (${q(g.id)}, ${q(
        g.name
      )}) on conflict (id) do update set name = excluded.name;`
    );
  }
  lines.push('');

  lines.push('-- hangouts');
  for (const h of hangouts) {
    lines.push(
      `insert into public.hangouts (id, friend_id, date, category_id, notes, hours, group_id, photos) values (` +
        `${q(h.id)}, ${q(h.friendId)}, ${q(h.date)}, ${q(h.categoryId)}, ${q(
          h.notes
        )}, ${num(h.hours)}, ${q(h.groupId)}, ${jsonb(h.photos)}) ` +
        `on conflict (id) do update set friend_id = excluded.friend_id, date = excluded.date, ` +
        `category_id = excluded.category_id, notes = excluded.notes, hours = excluded.hours, ` +
        `group_id = excluded.group_id, photos = excluded.photos;`
    );
  }
  lines.push('');
  lines.push('commit;');
  lines.push('');

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');
  console.log(
    `Wrote ${outFile}\n friends=${friends.length} categories=${categories.length} groups=${groups.length} hangouts=${hangouts.length}`
  );
}

main();
