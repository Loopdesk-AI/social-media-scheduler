import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react';
import SchedulePostModal from './SchedulePostModal';
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
  return <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-white text-3xl font-semibold">Calendar</h1>
        <div className="flex gap-3">
          <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            <Plus size={18} />
            Schedule post
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#252525] transition-colors border border-gray-800/50">
            <Upload size={18} />
            Upload local video
          </button>
        </div>
      </div>
      <div className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <button onClick={goToPreviousMonth} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/50 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-white text-lg font-semibold">
            {currentDate.getFullYear()}/{monthNames[currentDate.getMonth()]}
          </h2>
          <button onClick={goToNextMonth} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/50 rounded-lg">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7">
          {daysOfWeek.map(day => <div key={day} className="text-gray-400 text-sm font-medium p-4 text-center border-b border-gray-800/50">
              {day}
            </div>)}
          {days.map((day, index) => <div key={index} className={`min-h-[120px] p-3 border-r border-b border-gray-800/50 ${!day.isCurrentMonth ? 'bg-[#050505]' : ''} ${index % 7 === 6 ? 'border-r-0' : ''}`}>
              <div className={`text-sm font-medium mb-2 ${day.isCurrentMonth ? 'text-white' : 'text-gray-600'} ${isToday(day.date) ? 'bg-white text-black w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                {day.date.getDate()}
              </div>
            </div>)}
        </div>
      </div>
  {isScheduleModalOpen && <SchedulePostModal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} />}
      {isUploadModalOpen && <UploadVideoModal onClose={() => setIsUploadModalOpen(false)} />}
    </div>;
}