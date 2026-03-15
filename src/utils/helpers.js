import { formatDistanceToNow, format, parseISO } from 'date-fns';

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

export function formatDate(dateString) {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function formatDateShort(dateString) {
  return format(parseISO(dateString), 'MM/dd/yy');
}

export function getLastSeenText(dateString) {
  if (!dateString) return 'Never';
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

export function getDaysSince(dateString) {
  if (!dateString) return null;
  const date = parseISO(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getTotalHours(hangouts) {
  // Count grouped hangouts only once (they share the same groupId)
  const seenGroups = new Set();
  let total = 0;
  
  hangouts.forEach(h => {
    if (h.groupId) {
      // If this hangout is part of a group, only count it once
      if (!seenGroups.has(h.groupId)) {
        seenGroups.add(h.groupId);
        total += h.hours || 0;
      }
    } else {
      // Solo hangout, count normally
      total += h.hours || 0;
    }
  });
  
  return total;
}

export function getUniqueHangoutCount(hangouts) {
  // Count grouped hangouts as one session
  const seenGroups = new Set();
  let count = 0;
  
  hangouts.forEach(h => {
    if (h.groupId) {
      if (!seenGroups.has(h.groupId)) {
        seenGroups.add(h.groupId);
        count++;
      }
    } else {
      count++;
    }
  });
  
  return count;
}

export function getHoursPerFriend(hangouts, friends) {
  const hoursMap = {};
  hangouts.forEach(h => {
    hoursMap[h.friendId] = (hoursMap[h.friendId] || 0) + h.hours;
  });
  
  return friends.map(f => ({
    name: f.name,
    hours: hoursMap[f.id] || 0
  })).sort((a, b) => b.hours - a.hours);
}

export function getHoursPerCategory(hangouts, categories) {
  // Count grouped hangouts only once per category
  const hoursMap = {};
  const seenGroups = {};
  
  hangouts.forEach(h => {
    const catId = h.categoryId;
    if (h.groupId) {
      // Track seen groups per category
      if (!seenGroups[catId]) seenGroups[catId] = new Set();
      if (!seenGroups[catId].has(h.groupId)) {
        seenGroups[catId].add(h.groupId);
        hoursMap[catId] = (hoursMap[catId] || 0) + h.hours;
      }
    } else {
      hoursMap[catId] = (hoursMap[catId] || 0) + h.hours;
    }
  });
  
  return categories.map(c => ({
    name: c.name,
    hours: hoursMap[c.id] || 0,
    color: c.color
  })).filter(c => c.hours > 0);
}

export function getLastHangoutDate(friendId, hangouts) {
  const friendHangouts = hangouts.filter(h => h.friendId === friendId);
  if (friendHangouts.length === 0) return null;
  
  const sorted = friendHangouts.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  return sorted[0].date;
}

export const PRESET_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];
