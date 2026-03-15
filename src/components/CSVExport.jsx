import { useState } from 'react';
import { Download, FileText, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Label, Select } from './ui/Input';

export function CSVExport({ hangouts, friends, categories }) {
  const [exportType, setExportType] = useState('hangouts');
  const [exported, setExported] = useState(false);

  const getFriendName = (id) => friends.find(f => f.id === id)?.name || 'Unknown';
  const getCategoryName = (id) => categories.find(c => c.id === id)?.name || '';

  const exportHangouts = () => {
    const headers = ['Date', 'Friend', 'Category', 'Hours', 'Notes'];
    const rows = hangouts.map(h => [
      h.date,
      getFriendName(h.friendId),
      getCategoryName(h.categoryId),
      h.hours,
      h.notes || ''
    ]);

    return { headers, rows, filename: 'hangouts' };
  };

  const exportFriends = () => {
    const headers = ['Name', 'Total Hours', 'Hangout Count', 'Created At'];
    const rows = friends.map(f => {
      const friendHangouts = hangouts.filter(h => h.friendId === f.id);
      const totalHours = friendHangouts.reduce((sum, h) => sum + h.hours, 0);
      return [
        f.name,
        totalHours.toFixed(1),
        friendHangouts.length,
        f.createdAt?.split('T')[0] || ''
      ];
    });

    return { headers, rows, filename: 'friends' };
  };

  const exportCategories = () => {
    const headers = ['Name', 'Color', 'Total Hours', 'Usage Count'];
    const rows = categories.map(c => {
      const categoryHangouts = hangouts.filter(h => h.categoryId === c.id);
      const totalHours = categoryHangouts.reduce((sum, h) => sum + h.hours, 0);
      return [
        c.name,
        c.color,
        totalHours.toFixed(1),
        categoryHangouts.length
      ];
    });

    return { headers, rows, filename: 'categories' };
  };

  const exportAll = () => {
    const data = {
      hangouts: hangouts.map(h => ({
        ...h,
        friendName: getFriendName(h.friendId),
        categoryName: getCategoryName(h.categoryId)
      })),
      friends,
      categories
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `friend-time-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleExport = () => {
    let data;
    
    if (exportType === 'all') {
      exportAll();
      return;
    }

    switch (exportType) {
      case 'hangouts':
        data = exportHangouts();
        break;
      case 'friends':
        data = exportFriends();
        break;
      case 'categories':
        data = exportCategories();
        break;
      default:
        return;
    }

    const csv = [data.headers, ...data.rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const getRecordCount = () => {
    switch (exportType) {
      case 'hangouts':
        return hangouts.length;
      case 'friends':
        return friends.length;
      case 'categories':
        return categories.length;
      case 'all':
        return `${hangouts.length} hangouts, ${friends.length} friends, ${categories.length} categories`;
      default:
        return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
      </CardHeader>
      <CardContent>
        {exported ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">Export Complete!</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Your file has been downloaded.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Export your data</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download your hangout data as CSV or create a full backup
                </p>
              </div>
            </div>

            <div>
              <Label>What to export</Label>
              <Select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                <option value="hangouts">Hangouts (CSV)</option>
                <option value="friends">Friends (CSV)</option>
                <option value="categories">Categories (CSV)</option>
                <option value="all">Full Backup (JSON)</option>
              </Select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Records to export: {getRecordCount()}
              </p>
            </div>

            <Button onClick={handleExport} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export {exportType === 'all' ? 'Backup' : 'CSV'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CSVExport;
