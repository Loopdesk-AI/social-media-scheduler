import { Check, ChevronRight } from 'lucide-react';

interface CalendarFiltersProps {
    filters: {
        id: string;
        name: string;
        enabled: boolean;
        color: string;
    }[];
    onToggleFilter: (id: string) => void;
}

export function CalendarFilters({ filters, onToggleFilter }: CalendarFiltersProps) {
    const categories = [
        { name: 'Design', color: '#B4A7F5' },
        { name: 'Development', color: '#A7D7F5' },
        { name: 'Launch', color: '#C8E6C9' },
        { name: 'Appointments', color: '#F5A7E1' },
        { name: 'Reminders', color: '#FFF9C4' },
        { name: 'Meetings', color: '#B2EBF2' }
    ];

    return (
        <div className="space-y-6">
            {/* My Calendars */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                    My Calendars
                    <ChevronRight size={14} className="text-gray-400" />
                </h3>
                <div className="space-y-2">
                    {filters.map(filter => (
                        <label
                            key={filter.id}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={filter.enabled}
                                    onChange={() => onToggleFilter(filter.id)}
                                    className="sr-only"
                                />
                                <div
                                    className={`w-4 h-4 rounded border-2 transition-all ${filter.enabled
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
                                        }`}
                                >
                                    {filter.enabled && (
                                        <Check size={12} className="text-white" />
                                    )}
                                </div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {filter.name}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Favorites */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between cursor-pointer hover:text-blue-600 transition-colors">
                    Favorites
                    <ChevronRight size={14} className="text-gray-400" />
                </h3>
            </div>

            {/* Categories */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                    Categories
                    <ChevronRight size={14} className="text-gray-400" />
                </h3>
                <div className="space-y-2">
                    {categories.map(category => (
                        <div
                            key={category.name}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {category.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
