

interface ScheduleViewProps {
    events: {
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        category: 'design' | 'development' | 'launch' | 'appointment' | 'reminder' | 'meeting';
    }[];
    onEventClick?: (eventId: string) => void;
}

const categoryColors = {
    design: 'bg-[#B4A7F5]',
    development: 'bg-[#A7D7F5]',
    launch: 'bg-[#C8E6C9]',
    appointment: 'bg-[#F5A7E1]',
    reminder: 'bg-[#FFF9C4]',
    meeting: 'bg-[#B2EBF2]'
};

export function ScheduleView({ events, onEventClick }: ScheduleViewProps) {
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Group events by date
    const groupedEvents: Record<string, typeof events> = {};
    sortedEvents.forEach(event => {
        const dateKey = event.startTime.toDateString();
        if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = [];
        }
        groupedEvents[dateKey].push(event);
    });

    // Get sorted date keys
    const dateKeys = Object.keys(groupedEvents).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return (
        <div className="h-full overflow-y-auto bg-white dark:bg-black">
            {dateKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p>No events scheduled</p>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto pb-20">
                    {dateKeys.map(dateKey => {
                        const dateEvents = groupedEvents[dateKey];
                        const date = new Date(dateKey);
                        const today = new Date();
                        const isDateToday = date.toDateString() === today.toDateString();

                        return (
                            <div key={dateKey} className="group">
                                {/* Sticky Header for Date */}
                                <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 py-4 px-6 flex items-baseline gap-4 transition-colors">
                                    <div className={`text-sm font-medium uppercase w-12 ${isDateToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={`text-2xl font-medium ${isDateToday ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                                        {date.getDate()}
                                    </div>
                                    {isDateToday && (
                                        <div className="text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full ml-2">
                                            Today
                                        </div>
                                    )}
                                </div>

                                {/* Events List */}
                                <div className="py-2">
                                    {dateEvents.map(event => (
                                        <div
                                            key={event.id}
                                            onClick={() => onEventClick?.(event.id)}
                                            className="flex items-start gap-4 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors group/event"
                                        >
                                            <div className="w-24 text-xs text-gray-500 pt-1 text-right flex-shrink-0">
                                                {event.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            </div>

                                            <div className="flex-1 flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${categoryColors[event.category]} flex-shrink-0`} />
                                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover/event:text-blue-600 transition-colors">
                                                    {event.title}
                                                </div>
                                                <div className="text-xs text-gray-400 ml-auto">
                                                    {event.endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
