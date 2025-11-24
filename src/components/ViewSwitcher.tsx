import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type CalendarViewType = 'day' | 'week' | 'month' | 'year' | 'schedule' | '4day';

interface ViewSwitcherProps {
    currentView: CalendarViewType;
    onViewChange: (view: CalendarViewType) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const views: { id: CalendarViewType; label: string; shortcut: string }[] = [
        { id: 'day', label: 'Day', shortcut: 'D' },
        { id: 'week', label: 'Week', shortcut: 'W' },
        { id: 'month', label: 'Month', shortcut: 'M' },
        { id: 'year', label: 'Year', shortcut: 'Y' },
        { id: 'schedule', label: 'Schedule', shortcut: 'A' },
        { id: '4day', label: '4 days', shortcut: 'X' },
    ];

    const currentLabel = views.find(v => v.id === currentView)?.label || 'Week';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
            >
                <span>{currentLabel}</span>
                <ChevronDown size={16} className="text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {views.map((view) => (
                        <button
                            key={view.id}
                            onClick={() => {
                                onViewChange(view.id);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-4">
                                    {currentView === view.id && <Check size={14} />}
                                </span>
                                {view.label}
                            </span>
                            <span className="text-gray-400 text-xs">{view.shortcut}</span>
                        </button>
                    ))}

                    <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        View Options
                    </div>

                    <label className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" />
                        Show weekends
                    </label>
                    <label className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3" />
                        Show declined events
                    </label>
                </div>
            )}
        </div>
    );
}
