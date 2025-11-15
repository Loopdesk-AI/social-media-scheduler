import React from 'react';
import { Calendar, BarChart3, Users } from 'lucide-react';
import { ViewType } from '../types';
import { DarkModeToggle } from './DarkModeToggle';

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
  return <div className="w-16 bg-gray-50 dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800/50 flex flex-col items-center py-6 gap-4 transition-colors duration-200">
      {navItems.map(item => {
      const Icon = item.icon;
      const isActive = activeView === item.id;
      return <button key={item.id} onClick={() => onNavigate(item.id)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800/50'}`} title={item.label}>
            <Icon size={20} />
          </button>;
    })}
      <div className="mt-auto">
        <DarkModeToggle />
      </div>
    </div>;
}