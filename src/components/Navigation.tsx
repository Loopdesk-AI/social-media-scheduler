// React import not required with the automatic JSX runtime
import { Calendar, BarChart3, Users } from 'lucide-react';
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
  return <div className="w-16 bg-[#0a0a0a] border-r border-gray-800/50 flex flex-col items-center py-6 gap-4">
      {navItems.map(item => {
      const Icon = item.icon;
      const isActive = activeView === item.id;
      return <button key={item.id} onClick={() => onNavigate(item.id)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`} title={item.label}>
            <Icon size={20} />
          </button>;
    })}
    </div>;
}