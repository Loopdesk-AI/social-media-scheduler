import { EventCard } from './EventCard';
import { useState, useEffect, useRef } from 'react';

interface WeekViewProps {
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
    daysToShow?: number; // Default to 7
}

export function WeekView({ selectedDate, events, onEventClick, daysToShow = 7 }: WeekViewProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update current time indicator every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        // Scroll to current time on mount
        if (scrollContainerRef.current) {
            const currentHour = new Date().getHours();
            const scrollPosition = Math.max(0, (currentHour - 1) * 60); // Scroll to 1 hour before now
            scrollContainerRef.current.scrollTop = scrollPosition;
        }

        return () => clearInterval(interval);
    }, []);

    const getDays = () => {
        const start = new Date(selectedDate);

        if (daysToShow === 7) {
            // Start from Sunday for Week view
            const day = start.getDay();
            const diff = start.getDate() - day;
            start.setDate(diff);
        }
        // For 4-day view, start from selectedDate

        const days = [];
        for (let i = 0; i < daysToShow; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const days = getDays();
    const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours
    const today = new Date();

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

    const formatDayHeader = (date: Date) => {
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return {
            day: dayNames[date.getDay()],
            date: date.getDate()
        };
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden">
            {/* Header */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0 ml-16">
                {days.map((day, index) => {
                    const { day: dayName, date } = formatDayHeader(day);
                    const isTodayDate = isToday(day);

                    return (
                        <div key={index} className="flex-1 py-3 text-center border-l border-transparent">
                            <div className="flex flex-col items-center gap-1">
                                <span className={`text-[11px] font-medium ${isTodayDate
                                    ? 'text-blue-600'
                                    : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {dayName}
                                </span>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${isTodayDate
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}>
                                    {date}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* All Day Section (Placeholder for now) */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 flex-shrink-0 ml-16 min-h-[20px]">
                {/* Add all-day events here later */}
            </div>

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto relative" ref={scrollContainerRef}>
                <div className="flex relative min-h-[1440px]"> {/* 24h * 60px */}
                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 bg-white dark:bg-black sticky left-0 z-10">
                        {timeSlots.map(hour => (
                            <div
                                key={hour}
                                className="h-[60px] relative"
                            >
                                <span className="absolute -top-2.5 right-2 text-[10px] text-gray-500 dark:text-gray-400 font-medium bg-white dark:bg-black px-1">
                                    {hour === 0 ? '' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    <div className="flex flex-1 relative">
                        {/* Horizontal Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none">
                            {timeSlots.map(hour => (
                                <div
                                    key={hour}
                                    className="h-[60px] border-b border-gray-100 dark:border-gray-800 w-full"
                                />
                            ))}
                        </div>

                        {/* Vertical Day Columns */}
                        {days.map((day, dayIndex) => {
                            const dayEvents = getEventsForDay(day);

                            // --- Smart Layout Algorithm ---
                            // 1. Sort events by start time, then duration (longer first)
                            const sortedEvents = [...dayEvents].sort((a, b) => {
                                if (a.startTime.getTime() !== b.startTime.getTime()) {
                                    return a.startTime.getTime() - b.startTime.getTime();
                                }
                                return (b.endTime.getTime() - b.startTime.getTime()) - (a.endTime.getTime() - a.startTime.getTime());
                            });

                            // 2. Calculate positions
                            const eventsWithLayout = sortedEvents.map(event => ({
                                ...event,
                                start: event.startTime.getHours() * 60 + event.startTime.getMinutes(),
                                end: event.endTime.getHours() * 60 + event.endTime.getMinutes(),
                                width: 100,
                                left: 0,
                                zIndex: 1
                            }));

                            // Group overlapping events
                            // eventsWithLayout is Event[]
                            // columns needs to be Event[][]
                            type LayoutEvent = typeof eventsWithLayout[number];
                            const columns: LayoutEvent[][] = [];
                            let lastEnd = -1;

                            eventsWithLayout.forEach(event => {
                                if (event.start >= lastEnd) {
                                    packEvents(columns);
                                    columns.length = 0;
                                    lastEnd = -1;
                                }

                                let placed = false;
                                for (let i = 0; i < columns.length; i++) {
                                    const col = columns[i];
                                    if (col.length === 0 || col[col.length - 1].end <= event.start) {
                                        col.push(event);
                                        placed = true;
                                        break;
                                    }
                                }

                                if (!placed) {
                                    columns.push([event]);
                                }

                                if (lastEnd === -1 || event.end > lastEnd) {
                                    lastEnd = event.end;
                                }
                            });

                            if (columns.length > 0) {
                                packEvents(columns);
                            }

                            function packEvents(columns: LayoutEvent[][]) {
                                const n = columns.length;
                                for (let i = 0; i < n; i++) {
                                    const col = columns[i];
                                    for (let j = 0; j < col.length; j++) {
                                        const event = col[j];
                                        event.width = 100 / n;
                                        event.left = (100 / n) * i;
                                        event.zIndex = i + 1;
                                    }
                                }
                            }
                            // --- End Algorithm ---

                            return (
                                <div
                                    key={dayIndex}
                                    className="flex-1 border-l border-gray-100 dark:border-gray-800 relative min-w-[100px]"
                                >
                                    {/* Events */}
                                    {eventsWithLayout.map(event => {
                                        const top = event.start;
                                        const duration = event.end - event.start;
                                        const height = Math.max(24, duration);

                                        return (
                                            <div
                                                key={event.id}
                                                className="absolute z-10 transition-all duration-200"
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: `${event.left}%`,
                                                    width: `${event.width}%`,
                                                    zIndex: event.zIndex,
                                                    paddingRight: '4px', // Gap between events
                                                    paddingLeft: event.left > 0 ? '2px' : '0'
                                                }}
                                            >
                                                <EventCard
                                                    event={event}
                                                    onClick={() => onEventClick?.(event.id)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* Current Time Indicator */}
                        {(() => {
                            const isTodayVisible = days.some(day => isToday(day));

                            if (!isTodayVisible) return null;

                            const hours = currentTime.getHours();
                            const minutes = currentTime.getMinutes();
                            const top = (hours * 60) + minutes;

                            return (
                                <div
                                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                    style={{ top: `${top}px` }}
                                >
                                    <div className="w-full h-[2px] bg-red-500 shadow-sm relative">
                                        <div className="absolute -left-1.5 -top-1 w-3 h-3 rounded-full bg-red-500"></div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
