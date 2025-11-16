import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react';
import { SchedulePostModal } from './SchedulePostModal';
import { UploadVideoModal } from './UploadVideoModal';
import { CalendarDay } from '../types';
import { useApp } from '../contexts/AppContext';

export function CalendarView() {
  const { posts, refreshPosts } = useApp();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Refresh posts when month changes
  useEffect(() => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
    refreshPosts({ startDate, endDate });
  }, [currentDate]);

  // Group posts by date
  const postsByDate = posts.reduce((acc, post) => {
    const date = new Date(post.publishDate).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(post);
    return acc;
  }, {} as Record<string, typeof posts>);
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
          <button onClick={() => setIsScheduleModalOpen(true)} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black">
            <Plus size={18} />
            Schedule post
          </button>
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#252525] active:bg-[#2a2a2a] transition-colors border border-gray-800/50 hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-black">
            <Upload size={18} />
            Upload local video
          </button>
        </div>
      </div>
      <div className="bg-[#0a0a0a] rounded-xl border border-gray-800/50 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
          <button onClick={goToPreviousMonth} className="text-gray-400 hover:text-white active:text-gray-300 transition-colors p-2 hover:bg-gray-800/50 active:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600" aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-white text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={goToNextMonth} className="text-gray-400 hover:text-white active:text-gray-300 transition-colors p-2 hover:bg-gray-800/50 active:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600" aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7">
          {daysOfWeek.map(day => <div key={day} className="text-gray-400 text-xs font-medium py-2 text-center border-b border-gray-800/50">
              {day.slice(0, 3)}
            </div>)}
          {days.map((day, index) => {
            const dayPosts = postsByDate[day.date.toDateString()] || [];
            return (
              <div key={index} className={`min-h-[85px] p-1.5 border-r border-b border-gray-800/50 ${!day.isCurrentMonth ? 'bg-[#050505]' : ''} ${index % 7 === 6 ? 'border-r-0' : ''}`}>
                <div className={`text-xs font-medium mb-1 inline-flex ${day.isCurrentMonth ? 'text-white' : 'text-gray-600'} ${isToday(day.date) ? 'bg-white !text-black w-5 h-5 rounded-full items-center justify-center text-[10px]' : ''}`}>
                  {day.date.getDate()}
                </div>
                {dayPosts.length > 0 && (
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className="text-xs p-2 rounded bg-[#1a1a1a] border border-gray-800/50 hover:border-gray-600 hover:bg-[#222] transition-all cursor-pointer group"
                        title={post.content}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <img
                            src={post.integration.picture}
                            alt={post.integration.name}
                            className="w-4 h-4 rounded-full ring-1 ring-gray-700"
                          />
                          <span className="text-gray-400 group-hover:text-gray-300 truncate text-[10px]">
                            {new Date(post.publishDate).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          {post.state === 'PUBLISHED' && (
                            <span className="ml-auto text-green-500 text-[10px]">✓</span>
                          )}
                          {post.state === 'QUEUE' && (
                            <span className="ml-auto text-blue-400 text-[10px]">⏱</span>
                          )}
                        </div>
                        <div className="text-white group-hover:text-gray-100 truncate font-medium">{post.content}</div>
                        {post.state === 'ERROR' && (
                          <div className="text-red-400 text-[10px] mt-1 font-medium">⚠ Failed</div>
                        )}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayPosts.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {isScheduleModalOpen && <SchedulePostModal onClose={() => setIsScheduleModalOpen(false)} />}
      {isUploadModalOpen && <UploadVideoModal onClose={() => setIsUploadModalOpen(false)} />}
    </div>;
}