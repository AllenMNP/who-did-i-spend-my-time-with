import { useState, useEffect, useCallback } from 'react';
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
  BarChart3
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

const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(isElectron);
  
  const [hangouts, setHangouts] = useLocalStorage('ftt-hangouts', []);
  const [friends, setFriends] = useLocalStorage('ftt-friends', []);
  const [categories, setCategories] = useLocalStorage('ftt-categories', []);
  const [groups, setGroups] = useLocalStorage('ftt-groups', []);
  const [darkMode, setDarkMode] = useLocalStorage('ftt-dark-mode', true);

  // Load data from Electron on startup
  useEffect(() => {
    async function loadElectronData() {
      if (isElectron) {
        try {
          const data = await window.electronAPI.loadData();
          if (data) {
            if (data.hangouts) setHangouts(data.hangouts);
            if (data.friends) setFriends(data.friends);
            if (data.categories) setCategories(data.categories);
            if (data.groups) setGroups(data.groups);
            if (data.darkMode !== undefined) setDarkMode(data.darkMode);
          }
        } catch (err) {
          console.error('Failed to load Electron data:', err);
        }
        setIsLoading(false);
      }
    }
    loadElectronData();
  }, []);

  // Save to Electron whenever data changes
  const saveToElectron = useCallback(async (newHangouts, newFriends, newCategories, newGroups, newDarkMode) => {
    if (isElectron) {
      try {
        await window.electronAPI.saveData({
          hangouts: newHangouts,
          friends: newFriends,
          categories: newCategories,
          groups: newGroups,
          darkMode: newDarkMode,
          savedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to save to Electron:', err);
      }
    }
  }, []);

  // Save to Electron after state changes
  useEffect(() => {
    if (!isLoading) {
      saveToElectron(hangouts, friends, categories, groups, darkMode);
    }
  }, [hangouts, friends, categories, groups, darkMode, isLoading, saveToElectron]);

  const handleAddHangout = (hangout) => {
    setHangouts(prev => [...prev, hangout]);
  };

  const handleUpdateHangout = (updated) => {
    setHangouts(prev => prev.map(h => h.id === updated.id ? updated : h));
  };

  const handleDeleteHangout = (id) => {
    setHangouts(prev => prev.filter(h => h.id !== id));
  };

  const handleAddFriend = (friend) => {
    setFriends([...friends, friend]);
  };

  const handleUpdateFriend = (updated) => {
    setFriends(friends.map(f => f.id === updated.id ? updated : f));
  };

  const handleDeleteFriend = (id) => {
    setFriends(friends.filter(f => f.id !== id));
    setHangouts(hangouts.filter(h => h.friendId !== id));
  };

  const handleAddCategory = (category) => {
    setCategories([...categories, category]);
  };

  const handleUpdateCategory = (updated) => {
    setCategories(categories.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleAddGroup = (group) => {
    setGroups([...groups, group]);
  };

  const handleUpdateGroup = (updated) => {
    setGroups(groups.map(g => g.id === updated.id ? updated : g));
  };

  const handleDeleteGroup = (id) => {
    setGroups(groups.filter(g => g.id !== id));
    // Remove group from all friends
    setFriends(friends.map(f => ({
      ...f,
      groupIds: (f.groupIds || []).filter(gId => gId !== id)
    })));
  };

  const handleImportHangouts = (imported) => {
    setHangouts([...hangouts, ...imported]);
    setActiveTab('list');
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

  // Show loading screen while Electron loads data
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

  return (
    <div className={cn('min-h-screen', darkMode ? 'dark bg-gray-900' : 'bg-gray-50')}>
      {/* Mobile Header */}
      <header className={cn(
          'lg:hidden px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b',
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        )}>
        <h1 className={cn('text-lg font-bold', darkMode ? 'text-white' : 'text-gray-900')}>Friend Time Tracker</h1>
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
