import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  Tag, 
  Calendar, 
  List, 
  Upload,
  Download,
  Menu,
  X,
  Moon,
  Sun,
  BarChart3,
  Save,
  AlertCircle
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Dashboard from './components/Dashboard';
import HangoutForm from './components/HangoutForm';
import FriendsList from './components/FriendsList';
import CategoryManager from './components/CategoryManager';
import GroupManager from './components/GroupManager';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import CSVImport from './components/CSVImport';
import CSVExport from './components/CSVExport';
import Insights from './components/Insights';
import { cn } from './utils/cn';
import { isSupabaseConfigured } from './lib/supabase';
import * as db from './lib/db';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'add', label: 'Log Hangout', icon: PlusCircle },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'list', label: 'History', icon: List },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'import', label: 'Import CSV', icon: Upload },
  { id: 'export', label: 'Export CSV', icon: Download },
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [hangouts, setHangouts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [darkMode, setDarkMode] = useLocalStorage('ftt-dark-mode', true);

  // Load all data from Supabase on startup (single source of truth)
  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) {
        setLoadError(
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the dev server.'
        );
        setIsLoading(false);
        return;
      }
      try {
        const data = await db.loadAll();
        setHangouts(data.hangouts);
        setFriends(data.friends);
        setCategories(data.categories);
        setGroups(data.groups);
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
        setLoadError(err.message || 'Failed to load data from Supabase.');
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // On a failed write, surface the error and re-sync local state from Supabase.
  const reportError = async (err) => {
    console.error('Supabase write failed:', err);
    alert('Failed to save changes to Supabase: ' + (err?.message || err));
    try {
      const data = await db.loadAll();
      setHangouts(data.hangouts);
      setFriends(data.friends);
      setCategories(data.categories);
      setGroups(data.groups);
    } catch (e) {
      console.error('Failed to re-sync after error:', e);
    }
  };

  const handleAddHangout = async (hangout) => {
    setHangouts(prev => [...prev, hangout]);
    try { await db.addHangout(hangout); } catch (err) { reportError(err); }
  };

  const handleUpdateHangout = async (updated) => {
    setHangouts(prev => prev.map(h => h.id === updated.id ? updated : h));
    try { await db.updateHangout(updated); } catch (err) { reportError(err); }
  };

  const handleDeleteHangout = async (id) => {
    setHangouts(prev => prev.filter(h => h.id !== id));
    try { await db.deleteHangout(id); } catch (err) { reportError(err); }
  };

  const handleAddFriend = async (friend) => {
    setFriends(prev => [...prev, friend]);
    try { await db.addFriend(friend); } catch (err) { reportError(err); }
  };

  const handleUpdateFriend = async (updated) => {
    setFriends(prev => prev.map(f => f.id === updated.id ? updated : f));
    try { await db.updateFriend(updated); } catch (err) { reportError(err); }
  };

  const handleDeleteFriend = async (id) => {
    setFriends(prev => prev.filter(f => f.id !== id));
    setHangouts(prev => prev.filter(h => h.friendId !== id));
    try { await db.deleteFriend(id); } catch (err) { reportError(err); }
  };

  const handleAddCategory = async (category) => {
    setCategories(prev => [...prev, category]);
    try { await db.addCategory(category); } catch (err) { reportError(err); }
  };

  const handleUpdateCategory = async (updated) => {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    try { await db.updateCategory(updated); } catch (err) { reportError(err); }
  };

  const handleDeleteCategory = async (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    try { await db.deleteCategory(id); } catch (err) { reportError(err); }
  };

  const handleAddGroup = async (group) => {
    setGroups(prev => [...prev, group]);
    try { await db.addGroup(group); } catch (err) { reportError(err); }
  };

  const handleUpdateGroup = async (updated) => {
    setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
    try { await db.updateGroup(updated); } catch (err) { reportError(err); }
  };

  const handleDeleteGroup = async (id) => {
    // Friends that need their group_ids updated in the DB
    const affected = friends
      .filter(f => (f.groupIds || []).includes(id))
      .map(f => ({ ...f, groupIds: (f.groupIds || []).filter(gId => gId !== id) }));
    setGroups(prev => prev.filter(g => g.id !== id));
    setFriends(prev => prev.map(f => ({
      ...f,
      groupIds: (f.groupIds || []).filter(gId => gId !== id)
    })));
    try {
      await db.deleteGroup(id);
      await db.updateFriendsBulk(affected);
    } catch (err) { reportError(err); }
  };

  const handleImportHangouts = async (imported) => {
    setHangouts(prev => [...prev, ...imported]);
    setActiveTab('list');
    try { await db.addHangouts(imported); } catch (err) { reportError(err); }
  };

  // Manual safety-net backup: download current data as JSON.
  const handleExportBackup = () => {
    const payload = {
      hangouts, friends, categories, groups, darkMode,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `friend-time-tracker-backup-${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard hangouts={hangouts} friends={friends} categories={categories} groups={groups} />;
      case 'add':
        return (
          <HangoutForm
            friends={friends}
            categories={categories}
            groups={groups}
            onAddHangout={handleAddHangout}
            onAddFriend={handleAddFriend}
            onAddCategory={handleAddCategory}
            onComplete={() => setActiveTab('dashboard')}
          />
        );
      case 'calendar':
        return <CalendarView hangouts={hangouts} friends={friends} categories={categories} />;
      case 'list':
        return (
          <ListView
            hangouts={hangouts}
            friends={friends}
            categories={categories}
            onUpdateHangout={handleUpdateHangout}
            onDeleteHangout={handleDeleteHangout}
            onAddHangout={handleAddHangout}
          />
        );
      case 'insights':
        return (
          <Insights
            hangouts={hangouts}
            friends={friends}
            categories={categories}
            groups={groups}
          />
        );
      case 'friends':
        return (
          <FriendsList
            friends={friends}
            hangouts={hangouts}
            groups={groups}
            onUpdateFriend={handleUpdateFriend}
            onDeleteFriend={handleDeleteFriend}
          />
        );
      case 'groups':
        return (
          <GroupManager
            groups={groups}
            friends={friends}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
          />
        );
      case 'categories':
        return (
          <CategoryManager
            categories={categories}
            hangouts={hangouts}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        );
      case 'import':
        return (
          <CSVImport
            friends={friends}
            categories={categories}
            onImport={handleImportHangouts}
            onAddFriend={handleAddFriend}
            onAddCategory={handleAddCategory}
          />
        );
      case 'export':
        return (
          <CSVExport
            hangouts={hangouts}
            friends={friends}
            categories={categories}
          />
        );
      default:
        return null;
    }
  };

  // Show loading screen while data loads from Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Surface configuration / connection errors instead of a blank app
  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Couldn't load your data</h2>
          <p className="text-gray-400 text-sm whitespace-pre-line">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen', darkMode ? 'dark bg-gray-900' : 'bg-gray-50')}>
      {/* Mobile Header */}
      <header className={cn(
          'lg:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b',
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}>
        <div className={cn('text-lg font-bold', darkMode ? 'text-white' : 'text-gray-900')}>
          Friend Time Tracker
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            'p-2 rounded-lg',
            darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 border-r transform transition-transform lg:transform-none flex flex-col h-screen lg:h-auto',
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          <div className={cn('p-6 border-b hidden lg:block', darkMode ? 'border-gray-700' : 'border-gray-100')}>
            <h1 className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-gray-900')}>Friend Time Tracker</h1>
            <p className={cn('text-sm mt-1', darkMode ? 'text-gray-400' : 'text-gray-500')}>Track time with friends</p>
          </div>
          <nav className="p-4 mt-14 lg:mt-0 flex-1">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive 
                          ? (darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-700')
                          : (darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className={cn('p-4 border-t', darkMode ? 'border-gray-700' : 'border-gray-100')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? (
                  <Moon className="w-4 h-4 text-blue-400" />
                ) : (
                  <Sun className="w-4 h-4 text-yellow-500" />
                )}
                <span className={cn('text-sm font-medium', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                  {darkMode ? 'Dark' : 'Light'}
                </span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                )}
                role="switch"
                aria-checked={darkMode}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
            <button
              onClick={handleExportBackup}
              className={cn(
                'mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
              )}
              title="Download a JSON backup of your current data"
            >
              <Save className="w-4 h-4" />
              Export Backup
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn('flex-1 p-4 lg:p-8 min-h-screen', darkMode ? 'bg-gray-900' : '')}>
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
