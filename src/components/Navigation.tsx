import { Calendar, BarChart3, Users, LogOut, FolderOpen, Settings, Sparkles, Sun, Moon } from 'lucide-react';
import { ViewType } from '../types';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

type NavigationProps = {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenSettings: () => void;
  onToggleChat: () => void;
  onOpenAccount: () => void;
};

export function Navigation({
  activeView,
  onNavigate,
  onOpenSettings,
  onToggleChat,
  onOpenAccount
}: NavigationProps) {
  const { logout, user } = useApp();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [{
    id: 'calendar' as const,
    icon: Calendar,
    label: 'Calendar'
  }, {
    id: 'analytics' as const,
    icon: BarChart3,
    label: 'Analytics'
  }, {
    id: 'content-library' as const,
    icon: FolderOpen,
    label: 'Content Library'
  }, {
    id: 'social' as const,
    icon: Users,
    label: 'Social Accounts'
  }];

  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800/50 flex flex-col items-center py-6 gap-4 z-40">
      {/* User info at top - CLICKABLE */}
      <button
        onClick={onOpenAccount}
        className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white text-sm font-medium mb-4 transition-all hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl cursor-pointer"
        title={`${user?.email} - Click to view profile`}
      >
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </button>

      {/* Navigation items */}
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            title={item.label}
          >
            <Icon size={20} />
          </button>
        );
      })}

      {/* Bottom buttons */}
      <div className="flex-1" />

      <button
        onClick={onOpenSettings}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        title="Settings"
      >
        <Settings size={20} />
      </button>
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button
        onClick={onToggleChat}
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-600/20"
        title="Super Intelligence"
      >
        <Sparkles size={20} />
      </button>
      <button
        onClick={handleLogout}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
}