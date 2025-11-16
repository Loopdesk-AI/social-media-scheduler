import { Calendar, BarChart3, Users, LogOut } from 'lucide-react';
import { ViewType } from '../types';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

type NavigationProps = {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
};

export function Navigation({
  activeView,
  onNavigate
}: NavigationProps) {
  const { logout, user } = useApp();
  const navigate = useNavigate();

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
    id: 'social' as const,
    icon: Users,
    label: 'Social Accounts'
  }];

  return (
    <div className="w-16 bg-[#0a0a0a] border-r border-gray-800/50 flex flex-col items-center py-6 gap-4">
      {/* User info at top */}
      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium mb-4" title={user?.email}>
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </div>

      {/* Navigation items */}
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              isActive ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
            title={item.label}
          >
            <Icon size={20} />
          </button>
        );
      })}

      {/* Logout button at bottom */}
      <div className="flex-1" />
      <button
        onClick={handleLogout}
        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-800/50 transition-colors"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
}