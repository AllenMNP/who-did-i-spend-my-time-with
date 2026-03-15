import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import Badge from './ui/Badge';
import { formatDate } from '../utils/helpers';

export function CalendarView({ hangouts, friends, categories }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const getFriendName = (id) => friends.find(f => f.id === id)?.name || 'Unknown';
  const getCategory = (id) => categories.find(c => c.id === id);

  const hangoutsByDate = useMemo(() => {
    const map = {};
    hangouts.forEach(h => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    });
    return map;
  }, [hangouts]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedDateHangouts = selectedDate 
    ? hangoutsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium min-w-[140px] text-center text-gray-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div 
                key={day} 
                className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayHangouts = hangoutsByDate[dateStr] || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button
                  key={idx}
                  onClick={() => dayHangouts.length > 0 && setSelectedDate(day)}
                  className={`
                    relative p-2 min-h-[80px] border rounded-lg text-left transition-colors
                    ${isCurrentMonth ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'}
                    ${isToday ? 'border-blue-500 border-2' : 'border-gray-100 dark:border-gray-700'}
                    ${dayHangouts.length > 0 ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : 'cursor-default'}
                  `}
                >
                  <span className={`text-sm ${isToday ? 'font-bold text-blue-600 dark:text-blue-400' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayHangouts.slice(0, 2).map((h, i) => {
                      const category = getCategory(h.categoryId);
                      return (
                        <div 
                          key={i}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{ 
                            backgroundColor: (category?.color || '#gray') + '20',
                            color: category?.color || '#666'
                          }}
                        >
                          {getFriendName(h.friendId)}
                        </div>
                      );
                    })}
                    {dayHangouts.length > 2 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        +{dayHangouts.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? formatDate(format(selectedDate, 'yyyy-MM-dd')) : ''}
      >
        <div className="space-y-3">
          {selectedDateHangouts.map((h, idx) => {
            const category = getCategory(h.categoryId);
            return (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">{getFriendName(h.friendId)}</span>
                  <Badge color={category?.color}>{category?.name || 'Unknown'}</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {h.hours} hour{h.hours !== 1 ? 's' : ''}
                </div>
                {h.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{h.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}

export default CalendarView;
