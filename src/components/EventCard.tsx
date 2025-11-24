

interface EventCardProps {
    event: {
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        category: 'design' | 'development' | 'launch' | 'appointment' | 'reminder' | 'meeting';
        participants?: { id: string; name: string; avatar?: string }[];
    };
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: () => void;
    onClick?: () => void;
    variant?: 'default' | 'compact';
}

const categoryStyles = {
    design: {
        bgLight: '#F2F0FF', // Very light purple
        bgDark: '#2D264F',  // Deep purple
        border: '#7C4DFF',  // Vivid purple
        textLight: '#4A148C', // Dark purple text
        textDark: '#E1BEE7'   // Light purple text
    },
    development: {
        bgLight: '#E3F2FD', // Very light blue
        bgDark: '#0D47A1',  // Deep blue
        border: '#2196F3',  // Vivid blue
        textLight: '#0D47A1', // Dark blue text
        textDark: '#BBDEFB'   // Light blue text
    },
    launch: {
        bgLight: '#E8F5E9', // Very light green
        bgDark: '#1B5E20',  // Deep green
        border: '#4CAF50',  // Vivid green
        textLight: '#1B5E20', // Dark green text
        textDark: '#C8E6C9'   // Light green text
    },
    appointment: {
        bgLight: '#FCE4EC', // Very light pink
        bgDark: '#880E4F',  // Deep pink
        border: '#E91E63',  // Vivid pink
        textLight: '#880E4F', // Dark pink text
        textDark: '#F8BBD0'   // Light pink text
    },
    reminder: {
        bgLight: '#FFFDE7', // Very light yellow
        bgDark: '#F57F17',  // Deep yellow/orange
        border: '#FFC107',  // Vivid yellow
        textLight: '#F57F17', // Dark orange text
        textDark: '#FFF9C4'   // Light yellow text
    },
    meeting: {
        bgLight: '#E0F7FA', // Very light cyan
        bgDark: '#006064',  // Deep cyan
        border: '#00BCD4',  // Vivid cyan
        textLight: '#006064', // Dark cyan text
        textDark: '#B2EBF2'   // Light cyan text
    }
};

export function EventCard({ event, onDragStart, onDragEnd, onClick, variant = 'default' }: EventCardProps) {
    const styles = categoryStyles[event.category];

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase().replace(' ', '');
    };

    const duration = Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60)); // minutes
    // In compact mode, use fixed height. In default mode, calculate based on duration.
    const height = variant === 'compact' ? 'auto' : Math.max(24, (duration / 60) * 60);
    const isShort = variant === 'compact' || duration <= 30;

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClick}
            className={`group relative rounded-[4px] shadow-sm hover:shadow-lg hover:z-50 transition-all duration-200 cursor-pointer overflow-hidden
                       bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] text-[var(--text-light)] dark:text-[var(--text-dark)]
                       ${variant === 'compact' ? 'px-1.5 py-0.5 hover:-translate-y-0.5' : 'px-2 py-1 hover:-translate-y-0.5'}`}
            style={{
                borderLeft: `3px solid ${styles.border}`,
                minHeight: typeof height === 'number' ? `${height}px` : height,
                // CSS Variables for theming
                ['--bg-light' as any]: styles.bgLight,
                ['--bg-dark' as any]: styles.bgDark,
                ['--text-light' as any]: styles.textLight,
                ['--text-dark' as any]: styles.textDark,
            }}
        >
            <div className="relative z-10 flex flex-col h-full justify-center">
                {isShort ? (
                    <div className="flex items-center gap-1 text-xs leading-none w-full">
                        {/* In compact mode, maybe just show title or dot + title? Google Calendar month view is just title. */}
                        {variant === 'compact' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-light)] dark:bg-[var(--text-dark)] flex-shrink-0 opacity-70"></span>
                        )}
                        <span className={`font-bold truncate flex-1 min-w-0 ${variant === 'compact' ? 'text-[11px]' : ''}`}>
                            {event.title}
                        </span>
                        {variant !== 'compact' && (
                            <span className="opacity-80 flex-shrink-0 text-[10px] font-medium whitespace-nowrap">
                                {formatTime(event.startTime)}
                            </span>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="text-xs font-bold leading-tight mb-0.5 line-clamp-2">
                            {event.title}
                        </div>
                        <div className="text-[10px] font-semibold opacity-90">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                    </>
                )}
            </div>

            {/* Drag indicator - hide in compact mode */}
            {variant !== 'compact' && (
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-0.5">
                        <div className="w-0.5 h-0.5 rounded-full bg-current opacity-50"></div>
                        <div className="w-0.5 h-0.5 rounded-full bg-current opacity-50"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
