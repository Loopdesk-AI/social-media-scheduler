import { MiniCalendar } from './MiniCalendar';
import { CalendarFilters } from './CalendarFilters';
import { Plus } from 'lucide-react';

interface CalendarSidebarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    filters: {
        id: string;
        name: string;
        enabled: boolean;
        color: string;
    }[];
    onToggleFilter: (id: string) => void;
}

export function CalendarSidebar({ selectedDate, onDateSelect, filters, onToggleFilter }: CalendarSidebarProps) {
    // Mock user avatars
    const users = [
        { id: 1, name: 'User 1', color: '#FF6B6B' },
        { id: 2, name: 'User 2', color: '#4ECDC4' },
        { id: 3, name: 'User 3', color: '#45B7D1' },
        { id: 4, name: 'User 4', color: '#FFA07A' }
    ];

    return (
        <div className="w-[280px] h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto">
            {/* Mini Calendar */}
            <div className="border-b border-gray-200 dark:border-gray-800">
                <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />
            </div>

            {/* User Avatars */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    {users.map(user => (
                        <div
                            key={user.id}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:scale-110 transition-transform shadow-md"
                            style={{ backgroundColor: user.color }}
                            title={user.name}
                        >
                            {user.name.charAt(0)}
                        </div>
                    ))}
                    <button className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Plus size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 flex-1">
                <CalendarFilters filters={filters} onToggleFilter={onToggleFilter} />
            </div>

            {/* Team Members at Bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center -space-x-2">
                        {users.slice(0, 5).map(user => (
                            <div
                                key={user.id}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-950 cursor-pointer hover:scale-110 transition-transform"
                                style={{ backgroundColor: user.color }}
                                title={user.name}
                            >
                                {user.name.charAt(0)}
                            </div>
                        ))}
                    </div>
                    <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
                            <circle cx="2" cy="2" r="2" />
                            <circle cx="2" cy="8" r="2" />
                            <circle cx="2" cy="14" r="2" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
