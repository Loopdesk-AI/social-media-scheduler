import { ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react';
import { useState } from 'react';
import { SchedulePostModal } from './SchedulePostModal';
import { UploadVideoModal } from './UploadVideoModal';

export function CalendarView() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false
      });
    }
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    // Add days from next month to complete the grid
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    return days;
  };
  const days = getDaysInMonth(currentDate);
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Calendar</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            <Plus size={18} />
            Schedule post
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border"
            style={{ background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', borderColor: 'hsl(var(--border))' }}
          >
            <Upload size={18} />
            Upload local video
          </button>
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
      >
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid', borderBottomColor: 'hsl(var(--border))' }}>
          <button onClick={goToPreviousMonth} className="p-2 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">
            {currentDate.getFullYear()}/{monthNames[currentDate.getMonth()]}
          </h2>
          <button onClick={goToNextMonth} className="p-2 rounded-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7">
          {daysOfWeek.map(day => (
            <div
              key={day}
              className="text-sm font-medium p-4 text-center"
              style={{ color: 'hsl(var(--muted-foreground))', borderBottom: '1px solid', borderBottomColor: 'hsl(var(--border))' }}
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const isNotCurrent = !day.isCurrentMonth;
            const cellStyle: React.CSSProperties = {
              minHeight: 120,
              padding: 12,
              borderRight: index % 7 === 6 ? '0' : '1px solid',
              borderBottom: '1px solid',
              borderRightColor: 'hsl(var(--border))',
              borderBottomColor: 'hsl(var(--border))',
              background: isNotCurrent ? 'hsl(var(--muted))' : 'transparent',
              color: isNotCurrent ? 'hsl(var(--muted-foreground))' : 'hsl(var(--card-foreground))'
            };

            const dateCircleStyle: React.CSSProperties = isToday(day.date)
              ? { background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', width: 24, height: 24, borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
              : {};

            return (
              <div key={index} style={cellStyle}>
                <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
                  <span style={dateCircleStyle}>{day.date.getDate()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isScheduleModalOpen && <SchedulePostModal onClose={() => setIsScheduleModalOpen(false)} />}
      {isUploadModalOpen && <UploadVideoModal onClose={() => setIsUploadModalOpen(false)} />}
    </div>
  );
}
 