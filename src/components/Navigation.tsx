import { BarChart3, Calendar, Users } from 'lucide-react';
import { useTheme } from '../lib/useTheme';
import { ViewType } from '../types';

type NavigationProps = {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
};
export function Navigation({
  activeView,
  onNavigate
}: NavigationProps) {
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
  return <div className="w-16 border-r flex flex-col items-center py-6 gap-4" style={{ background: 'hsl(var(--background))', borderRightColor: 'hsl(var(--border))' }}>
      <div className="mb-4">
        <ThemeToggle />
      </div>
      {navItems.map(item => {
      const Icon = item.icon;
      const isActive = activeView === item.id;
      return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        title={item.label}
        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
        style={isActive ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : { color: 'hsl(var(--muted-foreground))' }}
      >
        <Icon size={20} />
      </button>
      );
    })}
    <div className="mt-auto" />
    </div>;
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors text-gray-400 hover:text-white hover:bg-gray-800/50"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}