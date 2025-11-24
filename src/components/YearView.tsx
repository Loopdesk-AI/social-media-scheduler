import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearViewProps {
    currentDate: Date;
    onMonthClick: (date: Date) => void;
    onDayClick: (date: Date) => void;
}

export function YearView({ currentDate, onMonthClick, onDayClick }: YearViewProps) {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const year = currentDate.getFullYear();
    const today = new Date();

    const getDaysInMonth = (month: number, year: number) => {
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const getMonthData = (month: number) => {
        const days = getDaysInMonth(month, year);
        const firstDay = days[0].getDay(); // 0 = Sunday
        const blanks = Array(firstDay).fill(null);
        return [...blanks, ...days];
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="h-full overflow-y-auto bg-white dark:bg-black p-8 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 max-w-7xl mx-auto">
                {months.map((month) => {
                    const days = getMonthData(month);
                    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

                    return (
                        <div
                            key={month}
                            className="flex flex-col"
                        >
                            <button
                                onClick={() => onMonthClick(new Date(year, month, 1))}
                                className={`text-left font-medium text-xl mb-4 hover:text-blue-600 transition-colors ${isCurrentMonth ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'
                                    }`}
                            >
                                {monthNames[month]}
                            </button>

                            <div className="grid grid-cols-7 gap-y-2 text-center">
                                {/* Weekday Headers */}
                                {weekDays.map(day => (
                                    <div key={day} className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                        {day}
                                    </div>
                                ))}

                                {/* Days */}
                                {days.map((date, index) => {
                                    if (!date) return <div key={`blank-${index}`} />;

                                    const isToday = date.getDate() === today.getDate() &&
                                        date.getMonth() === today.getMonth() &&
                                        date.getFullYear() === today.getFullYear();

                                    return (
                                        <div key={date.toISOString()} className="flex justify-center">
                                            <button
                                                onClick={() => onDayClick(date)}
                                                className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-full transition-all duration-200
                          ${isToday
                                                        ? 'bg-blue-600 text-white font-bold hover:bg-blue-700'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                                    }
                        `}
                                            >
                                                {date.getDate()}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
