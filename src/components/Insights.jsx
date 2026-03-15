import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input, Label } from './ui/Input';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Plus, X, TrendingUp, MessageSquare, Users, Hash, Calendar, Flame, Camera, UsersRound } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, getDay, differenceInDays, eachDayOfInterval, isWithinInterval } from 'date-fns';

// Common words to ignore when analyzing keywords
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who',
  'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
  'once', 'if', 'about', 'after', 'before', 'above', 'below', 'up', 'down', 'out',
  'off', 'over', 'under', 'again', 'further', 'into', 'through', 'during', 'until',
  'while', 'got', 'get', 'went', 'go', 'going', 'played', 'play', 'playing', 'did',
  'made', 'make', 'making', 'came', 'come', 'coming', 'took', 'take', 'taking',
  'really', 'pretty', 'much', 'many', 'lot', 'lots', 'bit', 'little', 'big', 'small',
  'good', 'great', 'nice', 'fun', 'time', 'today', 'yesterday', 'tomorrow', 'week',
  'day', 'night', 'morning', 'afternoon', 'evening', 'hour', 'hours', 'minute', 'minutes'
]);

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export function Insights({ hangouts, friends, categories, groups = [] }) {
  const [trackedKeywords, setTrackedKeywords] = useState([
    'Dungeons and Dragons', 'D&D', 'Riftbound', 'board game', 'movie', 'dinner'
  ]);
  const [newKeyword, setNewKeyword] = useState('');

  const getFriendName = (id) => friends.find(f => f.id === id)?.name || 'Unknown';
  const getGroupName = (id) => groups.find(g => g.id === id)?.name || 'Unknown';
  const getGroupColor = (id) => groups.find(g => g.id === id)?.color || '#3B82F6';

  // Hours per group
  const hoursPerGroup = useMemo(() => {
    const groupHours = {};
    
    groups.forEach(g => {
      groupHours[g.id] = { name: g.name, color: g.color, hours: 0, hangoutCount: 0 };
    });

    hangouts.forEach(h => {
      const friend = friends.find(f => f.id === h.friendId);
      if (!friend?.groupIds) return;
      
      friend.groupIds.forEach(gId => {
        if (groupHours[gId]) {
          groupHours[gId].hours += h.hours || 0;
          groupHours[gId].hangoutCount += 1;
        }
      });
    });

    return Object.values(groupHours)
      .filter(g => g.hours > 0)
      .sort((a, b) => b.hours - a.hours);
  }, [hangouts, friends, groups]);

  // Group activity over time (last 6 months)
  const groupActivityTrends = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthLabel = format(month, 'MMM');
      
      const dataPoint = { month: monthLabel };
      
      groups.forEach(group => {
        const count = hangouts.filter(h => {
          if (!h.date) return false;
          const hangoutDate = parseISO(h.date);
          if (hangoutDate < monthStart || hangoutDate > monthEnd) return false;
          
          const friend = friends.find(f => f.id === h.friendId);
          return friend?.groupIds?.includes(group.id);
        }).length;
        dataPoint[group.name] = count;
      });
      
      return dataPoint;
    });
  }, [hangouts, friends, groups]);

  // Group member breakdown - top friends per group
  const groupMemberStats = useMemo(() => {
    return groups.map(group => {
      const memberHours = {};
      
      hangouts.forEach(h => {
        const friend = friends.find(f => f.id === h.friendId);
        if (!friend?.groupIds?.includes(group.id)) return;
        
        if (!memberHours[friend.id]) {
          memberHours[friend.id] = { name: friend.name, hours: 0, count: 0 };
        }
        memberHours[friend.id].hours += h.hours || 0;
        memberHours[friend.id].count += 1;
      });

      const topMembers = Object.values(memberHours)
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5);

      return {
        group,
        totalHours: topMembers.reduce((sum, m) => sum + m.hours, 0),
        members: topMembers
      };
    }).filter(g => g.members.length > 0);
  }, [hangouts, friends, groups]);

  // Day of week patterns
  const dayOfWeekStats = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayHours = [0, 0, 0, 0, 0, 0, 0];

    hangouts.forEach(h => {
      if (!h.date) return;
      const dayIndex = getDay(parseISO(h.date));
      dayCounts[dayIndex]++;
      dayHours[dayIndex] += h.hours || 0;
    });

    return days.map((day, idx) => ({
      day,
      hangouts: dayCounts[idx],
      hours: Math.round(dayHours[idx] * 10) / 10
    }));
  }, [hangouts]);

  // Hangout streaks
  const streakStats = useMemo(() => {
    if (hangouts.length === 0) return { current: 0, longest: 0, thisWeek: 0 };

    const sortedDates = [...new Set(hangouts.map(h => h.date))]
      .filter(Boolean)
      .sort();
    
    if (sortedDates.length === 0) return { current: 0, longest: 0, thisWeek: 0 };

    let longestStreak = 1;
    let currentStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const diff = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i - 1]));
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else if (diff > 1) {
        tempStreak = 1;
      }
    }

    // Calculate current streak from today
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const lastDate = sortedDates[sortedDates.length - 1];
    const daysSinceLast = differenceInDays(today, parseISO(lastDate));

    if (daysSinceLast <= 1) {
      currentStreak = 1;
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const diff = differenceInDays(parseISO(sortedDates[i + 1]), parseISO(sortedDates[i]));
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    // This week count
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const thisWeek = sortedDates.filter(d => parseISO(d) >= weekStart).length;

    return { current: currentStreak, longest: longestStreak, thisWeek };
  }, [hangouts]);

  // Photo stats
  const photoStats = useMemo(() => {
    const hangoutsWithPhotos = hangouts
      .filter(h => h.photos && h.photos.length > 0)
      .map(h => ({
        ...h,
        friendName: getFriendName(h.friendId),
        photoCount: h.photos.length
      }))
      .sort((a, b) => b.photoCount - a.photoCount);

    const totalPhotos = hangoutsWithPhotos.reduce((sum, h) => sum + h.photoCount, 0);
    const topHangouts = hangoutsWithPhotos.slice(0, 5);

    return { totalPhotos, hangoutsWithPhotos: hangoutsWithPhotos.length, topHangouts };
  }, [hangouts, friends]);

  // Analyze keywords in notes
  const keywordAnalysis = useMemo(() => {
    const analysis = {};
    
    trackedKeywords.forEach(keyword => {
      analysis[keyword.toLowerCase()] = {
        keyword,
        count: 0,
        friends: {},
        hangouts: []
      };
    });

    hangouts.forEach(h => {
      if (!h.notes) return;
      const notesLower = h.notes.toLowerCase();
      
      trackedKeywords.forEach(keyword => {
        const keyLower = keyword.toLowerCase();
        if (notesLower.includes(keyLower)) {
          analysis[keyLower].count++;
          analysis[keyLower].hangouts.push(h);
          
          const friendName = getFriendName(h.friendId);
          analysis[keyLower].friends[friendName] = (analysis[keyLower].friends[friendName] || 0) + 1;
        }
      });
    });

    return Object.values(analysis)
      .filter(a => a.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [hangouts, trackedKeywords, friends]);

  // Auto-discover frequent keywords in notes (each line is a keyword)
  const discoveredKeywords = useMemo(() => {
    const keywordCounts = {};
    
    hangouts.forEach(h => {
      if (!h.notes) return;
      // Split by newlines - each line is a separate keyword
      const lines = h.notes.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      lines.forEach(line => {
        const keyLower = line.toLowerCase();
        keywordCounts[keyLower] = (keywordCounts[keyLower] || 0) + 1;
      });
    });

    return Object.entries(keywordCounts)
      .filter(([keyword, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ word: keyword, count }));
  }, [hangouts]);

  // Keyword trends over time (last 6 months)
  const keywordTrends = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthLabel = format(month, 'MMM');
      
      const dataPoint = { month: monthLabel };
      
      trackedKeywords.slice(0, 5).forEach(keyword => {
        const keyLower = keyword.toLowerCase();
        const count = hangouts.filter(h => {
          if (!h.notes || !h.date) return false;
          const hangoutDate = parseISO(h.date);
          return hangoutDate >= monthStart && 
                 hangoutDate <= monthEnd && 
                 h.notes.toLowerCase().includes(keyLower);
        }).length;
        dataPoint[keyword] = count;
      });
      
      return dataPoint;
    });
  }, [hangouts, trackedKeywords]);

  // Friend activity by category
  const friendCategoryMatrix = useMemo(() => {
    const matrix = {};
    
    friends.forEach(f => {
      matrix[f.id] = { name: f.name, categories: {} };
      categories.forEach(c => {
        matrix[f.id].categories[c.id] = 0;
      });
    });

    hangouts.forEach(h => {
      if (matrix[h.friendId] && h.categoryId) {
        matrix[h.friendId].categories[h.categoryId] = 
          (matrix[h.friendId].categories[h.categoryId] || 0) + h.hours;
      }
    });

    return Object.values(matrix)
      .map(f => ({
        name: f.name,
        ...Object.fromEntries(
          categories.map(c => [c.name, f.categories[c.id] || 0])
        )
      }))
      .filter(f => Object.values(f).some(v => typeof v === 'number' && v > 0));
  }, [hangouts, friends, categories]);

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    if (!trackedKeywords.some(k => k.toLowerCase() === newKeyword.toLowerCase())) {
      setTrackedKeywords([...trackedKeywords, newKeyword.trim()]);
    }
    setNewKeyword('');
  };

  const removeKeyword = (keyword) => {
    setTrackedKeywords(trackedKeywords.filter(k => k !== keyword));
  };

  return (
    <div className="space-y-6">
      {/* Hours per Group */}
      {hoursPerGroup.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5" />
              Hours by Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursPerGroup} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9CA3AF" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value} hrs`, 'Hours']}
                  />
                  <Bar 
                    dataKey="hours" 
                    radius={[0, 4, 4, 0]}
                    fill="#3B82F6"
                  >
                    {hoursPerGroup.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Activity Trends */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Group Activity Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={groupActivityTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {groups.map((group, idx) => (
                    <Line
                      key={group.id}
                      type="monotone"
                      dataKey={group.name}
                      stroke={group.color || COLORS[idx % COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: group.color || COLORS[idx % COLORS.length] }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Member Breakdown */}
      {groupMemberStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Friends by Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupMemberStats.map(({ group, totalHours, members }) => (
                <div 
                  key={group.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 dark:text-white">{group.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{totalHours}h total</span>
                  </div>
                  <div className="space-y-2">
                    {members.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{member.name}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {member.hours}h ({member.count} hangouts)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day of Week Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Day of Week Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hangouts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              No hangouts logged yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    formatter={(value, name) => [value, name === 'hangouts' ? 'Hangouts' : 'Hours']}
                  />
                  <Legend />
                  <Bar dataKey="hangouts" fill="#3B82F6" name="Hangouts" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hours" fill="#10B981" name="Hours" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hangout Streaks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Hangout Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-3xl font-bold text-orange-500">{streakStats.current}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Current Streak</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">consecutive days</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-3xl font-bold text-blue-500">{streakStats.longest}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Longest Streak</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">consecutive days</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-3xl font-bold text-green-500">{streakStats.thisWeek}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">This Week</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">hangout days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Stats */}
      {photoStats.totalPhotos > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photo Memories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-3xl font-bold text-purple-500">{photoStats.totalPhotos}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Photos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="text-3xl font-bold text-pink-500">{photoStats.hangoutsWithPhotos}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Hangouts with Photos</div>
              </div>
            </div>
            {photoStats.topHangouts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Hangouts by Photos</h4>
                <div className="space-y-2">
                  {photoStats.topHangouts.map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                      <span className="text-gray-700 dark:text-gray-300">
                        {h.friendName} - {format(parseISO(h.date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-purple-500 font-medium">{h.photoCount} photos</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tracked Keywords Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Tracked Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {trackedKeywords.map(keyword => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a keyword to track..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
              className="flex-1"
            />
            <Button onClick={addKeyword}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Frequency Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Keyword Mentions in Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywordAnalysis.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              No keyword matches found in your hangout notes yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordAnalysis} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis 
                    type="category" 
                    dataKey="keyword" 
                    stroke="#9CA3AF" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyword-Friend Association */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who You Do Things With
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywordAnalysis.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              Add notes to your hangouts to see keyword-friend associations
            </div>
          ) : (
            <div className="space-y-4">
              {keywordAnalysis.map((item, idx) => (
                <div key={item.keyword} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.keyword}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({item.count} mention{item.count !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.friends)
                      .sort((a, b) => b[1] - a[1])
                      .map(([friend, count]) => (
                        <span
                          key={friend}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-500"
                        >
                          {friend}
                          <span className="text-xs text-gray-400">×{count}</span>
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keyword Trends Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Activity Trends (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keywordTrends.every(m => trackedKeywords.slice(0, 5).every(k => m[k] === 0)) ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              Not enough data to show trends yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={keywordTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                  <Legend />
                  {trackedKeywords.slice(0, 5).map((keyword, idx) => (
                    <Line
                      key={keyword}
                      type="monotone"
                      dataKey={keyword}
                      stroke={COLORS[idx]}
                      strokeWidth={2}
                      dot={{ fill: COLORS[idx] }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-discovered Keywords */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Used Words in Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {discoveredKeywords.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              Add more notes to discover frequent topics
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {discoveredKeywords.map(({ word, count }) => (
                <button
                  key={word}
                  onClick={() => {
                    if (!trackedKeywords.some(k => k.toLowerCase() === word)) {
                      setTrackedKeywords([...trackedKeywords, word]);
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm transition-colors"
                  title="Click to track this keyword"
                >
                  {word}
                  <span className="text-xs text-gray-400">({count})</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friend-Category Breakdown */}
      {friendCategoryMatrix.length > 0 && categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hours by Friend & Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={friendCategoryMatrix} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#9CA3AF" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#F9FAFB' }}
                  />
                  <Legend />
                  {categories.map((cat, idx) => (
                    <Bar 
                      key={cat.id} 
                      dataKey={cat.name} 
                      stackId="a" 
                      fill={cat.color || COLORS[idx % COLORS.length]} 
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Insights;
