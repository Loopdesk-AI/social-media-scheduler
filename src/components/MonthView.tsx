import { EventCard } from './EventCard';
import { useState } from 'react';

interface MonthViewProps {
    selectedDate: Date;
    events: {
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        category: 'design' | 'development' | 'launch' | 'appointment' | 'reminder' | 'meeting';
        participants?: { id: string; name: string; avatar?: string }[];
    }[];
    onEventClick?: (eventId: string) => void;
    onDayClick?: (date: Date) => void;
}

export function MonthView({ selectedDate, events, onEventClick, onDayClick }: MonthViewProps) {
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

    const toggleDayExpansion = (date: Date) => {
        const dateStr = date.toISOString();
        const newExpanded = new Set(expandedDays);
        if (newExpanded.has(dateStr)) {
            newExpanded.delete(dateStr);
        } else {
            newExpanded.add(dateStr);
        }
        setExpandedDays(newExpanded);
    };

    const getDaysInMonth = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
        const days = [];

        // Previous month days
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
            days.push({ date: prevMonthDay, isCurrentMonth: false });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push({ date: new Date(year, month, day), isCurrentMonth: true });
        }

        // Next month days to fill grid
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        }

        return days;
    };

    const days = getDaysInMonth();
    const today = new Date();
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const isToday = (date: Date) => {
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getEventsForDay = (date: Date) => {
        return events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            {/* Day names header */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                    >
                        {day.substring(0, 3)}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {days.map((day, index) => {
                    const dayEvents = getEventsForDay(day.date);
                    const isTodayDate = isToday(day.date);
                    const dateStr = day.date.toISOString();
                    const isExpanded = expandedDays.has(dateStr);
                    const visibleEvents = isExpanded ? dayEvents : dayEvents.slice(0, 3);
                    const hasMore = dayEvents.length > 3;

                    return (
                        <div
                            key={index}
                            onClick={() => onDayClick?.(day.date)}
                            className={`border-r border-b border-gray-200 dark:border-gray-800/50 p-2 cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10 flex flex-col gap-1
                                ${!day.isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/20' : ''} 
                                ${isTodayDate ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} 
                                ${index % 7 === 6 ? 'border-r-0' : ''}
                                ${isExpanded ? 'row-span-2 min-h-[200px] z-10 shadow-lg bg-white dark:bg-gray-900' : ''}
                            `}
                        >
                            {/* Date number */}
                            <div className={`text-sm font-semibold mb-1 flex justify-between items-center ${isTodayDate
                                ? 'w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center'
                                : day.isCurrentMonth
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-400 dark:text-gray-600'
                                }`}>
                                <span>{day.date.getDate()}</span>
                            </div>

                            {/* Events */}
                            <div className="space-y-1 flex-1">
                                {visibleEvents.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        variant="compact"
                                        onClick={() => onEventClick?.(event.id)}
                                    />
                                ))}
                            </div>

                            {/* Show More / Less Button */}
                            {hasMore && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDayExpansion(day.date);
                                    }}
                                    className="text-xs text-center text-blue-600 dark:text-blue-400 font-medium py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors w-full mt-auto"
                                >
                                    {isExpanded ? 'Show less' : `+${dayEvents.length - 3} more`}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
