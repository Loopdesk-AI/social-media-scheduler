import { EventCard } from './EventCard';
import { useState, useEffect, useRef } from 'react';

interface DayViewProps {
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
    onTimeSlotClick?: (date: Date) => void;
}

export function DayView({ selectedDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Update current time indicator every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    // Scroll to current time on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            const currentHour = new Date().getHours();
            const scrollPosition = Math.max(0, (currentHour - 1) * 60); // Scroll to 1 hour before current time
            scrollContainerRef.current.scrollTop = scrollPosition;
        }
    }, []);

    // Generate 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const today = new Date();
    const isToday = selectedDate.getDate() === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear();

    const getEventsForDay = () => {
        return events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.getDate() === selectedDate.getDate() &&
                eventDate.getMonth() === selectedDate.getMonth() &&
                eventDate.getFullYear() === selectedDate.getFullYear();
        });
    };

    const dayEvents = getEventsForDay();

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

    const formatTime = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour} ${period}`;
    };

    // Calculate current time position (in pixels)
    const getCurrentTimePosition = () => {
        if (!isToday) return null;
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        return hours * 60 + minutes;
    };

    const currentTimePosition = getCurrentTimePosition();

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black">
            {/* Day header */}
            <div className="flex-none px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-start">
                    <span className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                    <div className={`flex items-baseline gap-2 ${isToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                        <span className="text-4xl font-bold">
                            {selectedDate.getDate()}
                        </span>
                        <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Time grid */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto relative scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800"
            >
                <div className="flex min-h-[1440px]"> {/* 24 hours * 60px */}
                    {/* Time column */}
                    <div className="w-16 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-black sticky left-0 z-20">
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="h-[60px] relative"
                            >
                                <span className="absolute -top-3 right-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {hour !== 0 && formatTime(hour)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Events area */}
                    <div className="flex-1 relative min-w-0">
                        {/* Grid lines */}
                        {hours.map((hour) => (
                            <div
                                key={hour}
                                className="h-[60px] border-b border-gray-100 dark:border-gray-800"
                                onClick={() => {
                                    const slotDate = new Date(selectedDate);
                                    slotDate.setHours(hour, 0, 0, 0);
                                    onTimeSlotClick?.(slotDate);
                                }}
                            />
                        ))}

                        {/* Events */}
                        {eventsWithLayout.map((event) => {
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
                                        paddingRight: '4px',
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

                        {/* Current time indicator */}
                        {currentTimePosition !== null && (
                            <div
                                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                style={{ top: `${currentTimePosition}px` }}
                            >
                                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-sm"></div>
                                <div className="flex-1 h-[2px] bg-red-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
