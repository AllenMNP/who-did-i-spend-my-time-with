import { supabase } from './supabase';

// -- Row <-> app-object mappers --
const fromFriend = (r) => ({ id: r.id, name: r.name, groupIds: r.group_ids ?? [] });
const toFriend = (f) => ({ id: f.id, name: f.name, group_ids: f.groupIds ?? [] });

const fromCategory = (r) => ({ id: r.id, name: r.name, color: r.color });
const toCategory = (c) => ({ id: c.id, name: c.name, color: c.color });

const fromGroup = (r) => ({
  id: r.id,
  name: r.name,
  color: r.color,
  cadenceDays: r.cadence_days ?? null,
  exceptionIds: r.exception_ids ?? [],
});
const toGroup = (g) => ({
  id: g.id,
  name: g.name,
  color: g.color ?? null,
  cadence_days: g.cadenceDays ?? null,
  exception_ids: g.exceptionIds ?? [],
});

const fromHangout = (r) => ({
  id: r.id,
  friendId: r.friend_id,
  date: r.date,
  categoryId: r.category_id,
  notes: r.notes,
  hours: r.hours,
  groupId: r.group_id,
  photos: r.photos ?? [],
});
const toHangout = (h) => ({
  id: h.id,
  friend_id: h.friendId ?? null,
  date: h.date ?? null,
  category_id: h.categoryId ?? null,
  notes: h.notes ?? null,
  hours: h.hours ?? null,
  group_id: h.groupId ?? null,
  photos: h.photos ?? [],
});

function check(error) {
  if (error) throw error;
}

// -- Load everything on startup --
export async function loadAll() {
  const [friends, categories, groups, hangouts] = await Promise.all([
    supabase.from('friends').select('*').order('name', { ascending: true }),
    supabase.from('categories').select('*'),
    supabase.from('groups').select('*'),
    supabase.from('hangouts').select('*').order('date', { ascending: true }),
  ]);
  check(friends.error);
  check(categories.error);
  check(groups.error);
  check(hangouts.error);
  return {
    friends: (friends.data ?? []).map(fromFriend),
    categories: (categories.data ?? []).map(fromCategory),
    groups: (groups.data ?? []).map(fromGroup),
    hangouts: (hangouts.data ?? []).map(fromHangout),
  };
}

// -- Friends --
export async function addFriend(friend) {
  const { error } = await supabase.from('friends').insert(toFriend(friend));
  check(error);
}
export async function updateFriend(friend) {
  const { error } = await supabase.from('friends').update(toFriend(friend)).eq('id', friend.id);
  check(error);
}
export async function deleteFriend(id) {
  // hangouts are removed by ON DELETE CASCADE
  const { error } = await supabase.from('friends').delete().eq('id', id);
  check(error);
}
export async function updateFriendsBulk(friends) {
  if (friends.length === 0) return;
  const { error } = await supabase.from('friends').upsert(friends.map(toFriend));
  check(error);
}

// -- Categories --
export async function addCategory(category) {
  const { error } = await supabase.from('categories').insert(toCategory(category));
  check(error);
}
export async function updateCategory(category) {
  const { error } = await supabase.from('categories').update(toCategory(category)).eq('id', category.id);
  check(error);
}
export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  check(error);
}

// -- Groups --
export async function addGroup(group) {
  const { error } = await supabase.from('groups').insert(toGroup(group));
  check(error);
}
export async function updateGroup(group) {
  const { error } = await supabase.from('groups').update(toGroup(group)).eq('id', group.id);
  check(error);
}
export async function deleteGroup(id) {
  const { error } = await supabase.from('groups').delete().eq('id', id);
  check(error);
}

// -- Hangouts --
export async function addHangout(hangout) {
  const { error } = await supabase.from('hangouts').insert(toHangout(hangout));
  check(error);
}
export async function addHangouts(hangouts) {
  if (hangouts.length === 0) return;
  const { error } = await supabase.from('hangouts').insert(hangouts.map(toHangout));
  check(error);
}
export async function updateHangout(hangout) {
  const { error } = await supabase.from('hangouts').update(toHangout(hangout)).eq('id', hangout.id);
  check(error);
}
export async function deleteHangout(id) {
  const { error } = await supabase.from('hangouts').delete().eq('id', id);
  check(error);
}
