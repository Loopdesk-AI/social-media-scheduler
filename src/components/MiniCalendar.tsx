import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const getDaysInMonth = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
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

    const isToday = (date: Date) => {
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date: Date) => {
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
        <div className="p-4">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <div className="flex gap-1">
                    <button
                        onClick={goToPreviousMonth}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    const isTodayDate = isToday(day.date);
                    const isSelectedDate = isSelected(day.date);

                    return (
                        <button
                            key={index}
                            onClick={() => onDateSelect(day.date)}
                            className={`
                w-8 h-8 rounded-lg flex items-center justify-center text-xs
                transition-all duration-200
                ${!day.isCurrentMonth
                                    ? 'text-gray-400 dark:text-gray-600'
                                    : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                }
                ${isTodayDate
                                    ? 'bg-yellow-100 dark:bg-yellow-900/50 font-bold ring-2 ring-yellow-400 dark:ring-yellow-600'
                                    : ''
                                }
                ${isSelectedDate && !isTodayDate
                                    ? 'bg-green-50 dark:bg-green-900/30 ring-2 ring-green-500 font-semibold'
                                    : ''
                                }
              `}
                        >
                            {day.date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
