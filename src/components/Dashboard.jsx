import { useMemo } from 'react';
import { Users, Clock, Calendar, TrendingUp, AlertCircle, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getTotalHours, getUniqueHangoutCount, getHoursPerFriend, getHoursPerCategory, formatDate } from '../utils/helpers';
import Badge from './ui/Badge';
import { differenceInDays, parseISO } from 'date-fns';

function StatCard({ title, value, icon: Icon, subtitle }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard({ hangouts, friends, categories, groups = [] }) {
  const totalHours = getTotalHours(hangouts);
  const uniqueHangoutCount = getUniqueHangoutCount(hangouts);
  const hoursPerFriend = getHoursPerFriend(hangouts, friends);
  const hoursPerCategory = getHoursPerCategory(hangouts, categories);
  
  const avgHoursPerHangout = uniqueHangoutCount > 0 
    ? (totalHours / uniqueHangoutCount).toFixed(1) 
    : 0;

  const getGroupById = (id) => groups.find(g => g.id === id);
  const getCategoryById = (id) => categories.find(c => c.id === id);

  // Calculate catch-up reminders
  const catchUpReminders = useMemo(() => {
    const reminders = [];
    const today = new Date();

    friends.forEach(friend => {
      const friendGroupIds = friend.groupIds || [];
      
      // Get groups with cadence settings
      const groupsWithCadence = friendGroupIds
        .map(gId => getGroupById(gId))
        .filter(g => g && g.cadenceDays);

      if (groupsWithCadence.length === 0) return;

      // Find last hangout for this friend
      const friendHangouts = hangouts
        .filter(h => h.friendId === friend.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const lastHangout = friendHangouts[0];
      const daysSinceLastHangout = lastHangout 
        ? differenceInDays(today, parseISO(lastHangout.date))
        : Infinity;

      // Check each group's cadence
      groupsWithCadence.forEach(group => {
        // Skip if friend is in the exception list for this group
        const exceptions = group.exceptionIds || [];
        if (exceptions.includes(friend.id)) return;

        if (daysSinceLastHangout > group.cadenceDays) {
          reminders.push({
            friend,
            group,
            daysSinceLastHangout: lastHangout ? daysSinceLastHangout : null,
            lastHangout,
            daysOverdue: lastHangout ? daysSinceLastHangout - group.cadenceDays : null
          });
        }
      });
    });

    // Sort by most overdue first
    return reminders.sort((a, b) => {
      if (a.daysOverdue === null) return -1;
      if (b.daysOverdue === null) return 1;
      return b.daysOverdue - a.daysOverdue;
    });
  }, [friends, hangouts, groups]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Hours" 
          value={totalHours.toFixed(1)} 
          icon={Clock}
          subtitle="Time spent with friends"
        />
        <StatCard 
          title="Total Hangouts" 
          value={uniqueHangoutCount} 
          icon={Calendar}
          subtitle="Logged sessions"
        />
        <StatCard 
          title="Friends" 
          value={friends.length} 
          icon={Users}
          subtitle="People tracked"
        />
        <StatCard 
          title="Avg Duration" 
          value={`${avgHoursPerHangout} hours`} 
          icon={TrendingUp}
          subtitle="Per hangout"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hours per Friend</CardTitle>
          </CardHeader>
          <CardContent>
            {hoursPerFriend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hoursPerFriend.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [`${value} hours`, 'Time']}
                  />
                  <Bar dataKey="hours" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                No hangout data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {hoursPerCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={hoursPerCategory}
                    dataKey="hours"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => 
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {hoursPerCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} hours`, 'Time']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                No hangout data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catch Up Reminders */}
      {catchUpReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
              Catch Up Reminders ({catchUpReminders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {catchUpReminders.map((reminder, idx) => {
                const category = reminder.lastHangout ? getCategoryById(reminder.lastHangout.categoryId) : null;
                return (
                  <div 
                    key={`${reminder.friend.id}-${reminder.group.id}`}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {reminder.friend.name}
                          </span>
                          <Badge color={reminder.group.color} size="sm">
                            {reminder.group.name}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {reminder.lastHangout ? (
                            <>
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Last seen: {formatDate(reminder.lastHangout.date)}
                                {category && (
                                  <span className="flex items-center gap-1 ml-2">
                                    <Tag className="w-3 h-3" />
                                    {category.name}
                                  </span>
                                )}
                              </p>
                              {reminder.lastHangout.notes && (
                                <p className="mt-1 text-gray-400 dark:text-gray-500 truncate max-w-md">
                                  "{reminder.lastHangout.notes.split('\n')[0]}"
                                </p>
                              )}
                            </>
                          ) : (
                            <p>Never hung out yet!</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {reminder.daysSinceLastHangout !== null 
                            ? `${reminder.daysSinceLastHangout} days ago`
                            : 'Never'
                          }
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {reminder.daysOverdue !== null 
                            ? `${reminder.daysOverdue} days overdue`
                            : `Goal: every ${reminder.group.cadenceDays} days`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
