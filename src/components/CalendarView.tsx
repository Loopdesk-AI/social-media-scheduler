import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Upload } from 'lucide-react';
import { CalendarSidebar } from './CalendarSidebar';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { DayView } from './DayView';
import { ScheduleView } from './ScheduleView';
import { YearView } from './YearView';
import { ViewSwitcher, CalendarViewType } from './ViewSwitcher';
import { SchedulePostModal } from './SchedulePostModal';
import { UploadVideoModal } from './UploadVideoModal';
import { DayDetailModal } from './DayDetailModal';
import { TimePickerModal } from './TimePickerModal';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';

export function CalendarView() {
  const { posts, refreshPosts, deletePost } = useApp();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentView, setCurrentView] = useState<CalendarViewType>('week');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [pendingDropDate, setPendingDropDate] = useState<Date | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [filters, setFilters] = useState([
    { id: 'daily-tasks', name: 'Daily Tasks', enabled: true, color: '#3B82F6' },
    { id: 'birthdays', name: 'Birthdays', enabled: true, color: '#F59E0B' },
    { id: 'tasks', name: 'Tasks', enabled: true, color: '#10B981' }
  ]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
    refreshPosts({ startDate, endDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]); // Only re-fetch when month changes

  const events = posts.map(post => {
    const startTime = new Date(post.publishDate);
    const endTime = new Date(startTime.getTime() + 30 * 60000);

    const platformCategoryMap: Record<string, any> = {
      'youtube': 'design',
      'instagram': 'appointment',
      'linkedin': 'development',
      'twitter': 'meeting',
      'facebook': 'launch'
    };

    return {
      id: post.id,
      title: post.content.substring(0, 50) || 'Untitled Post',
      startTime,
      endTime,
      category: platformCategoryMap[post.integration.providerIdentifier] || 'reminder',
      participants: []
    };
  });

  const handleToggleFilter = (id: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    if (currentView === 'month') {
      setCurrentView('week');
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentView('day');
  };

  const handleTimeSlotClick = (date: Date) => {
    setPendingDropDate(date);
    setIsTimePickerOpen(true);
  };

  const handleEventClick = (eventId: string) => {
    const post = posts.find(p => p.id === eventId);
    if (post) {
      handleEditPost(post);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setModalMode('edit');
    setIsScheduleModalOpen(true);
  };

  const handleDuplicatePost = (post: any) => {
    setEditingPost(post);
    setModalMode('duplicate');
    setIsScheduleModalOpen(true);
  };

  const handleOpenScheduleModal = () => {
    setEditingPost(null);
    setModalMode('create');
    setIsScheduleModalOpen(true);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <CalendarSidebar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        filters={filters}
        onToggleFilter={handleToggleFilter}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-8 py-6 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedDate(new Date());
                    setCurrentDate(new Date());
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Today
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPreviousMonth}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-all"
                  >
                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <h1 className="text-xl font-normal text-gray-900 dark:text-white ml-2">
                  {currentView === 'year'
                    ? currentDate.getFullYear()
                    : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  }
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />

              <div className="flex gap-3">
                <button
                  onClick={handleOpenScheduleModal}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                             bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700
                             text-white shadow-lg shadow-blue-500/30
                             transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={20} />
                  Schedule Post
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium
                             bg-gray-200 dark:bg-gray-800/50
                             border border-gray-300 dark:border-gray-700
                             hover:bg-gray-300 dark:hover:bg-gray-700/50
                             text-gray-900 dark:text-white
                             transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Upload size={20} />
                  Upload Video
                </button>
              </div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Schedule and manage your social media posts
          </p>
        </div>

        <div className="flex-1 overflow-hidden p-8">
          {currentView === 'week' && (
            <WeekView
              selectedDate={selectedDate}
              events={events}
              onEventClick={handleEventClick}
              daysToShow={7}
            />
          )}
          {currentView === '4day' && (
            <WeekView
              selectedDate={selectedDate}
              events={events}
              onEventClick={handleEventClick}
              daysToShow={4}
            />
          )}
          {currentView === 'month' && (
            <MonthView
              selectedDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
          {currentView === 'day' && (
            <DayView
              selectedDate={selectedDate}
              events={events}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
            />
          )}
          {currentView === 'schedule' && (
            <ScheduleView
              events={events}
              onEventClick={handleEventClick}
            />
          )}
          {currentView === 'year' && (
            <YearView
              currentDate={currentDate}
              onMonthClick={(date) => {
                setCurrentDate(date);
                setCurrentView('month');
              }}
              onDayClick={(date) => {
                setSelectedDate(date);
                setCurrentDate(date);
                setCurrentView('day');
              }}
            />
          )}
        </div>
      </div>

      {isScheduleModalOpen && (
        <SchedulePostModal
          onClose={() => {
            setIsScheduleModalOpen(false);
            setEditingPost(null);
            setModalMode('create');
          }}
          initialPost={editingPost}
          mode={modalMode}
        />
      )}
      {isUploadModalOpen && <UploadVideoModal onClose={() => setIsUploadModalOpen(false)} />}
      {selectedDay && (
        <DayDetailModal
          date={selectedDay}
          posts={posts.filter(p => {
            const postDate = new Date(p.publishDate);
            return postDate.toDateString() === selectedDay.toDateString();
          })}
          onClose={() => setSelectedDay(null)}
          onDeletePost={handleDeletePost}
          onEditPost={handleEditPost}
          onDuplicatePost={handleDuplicatePost}
          onAddPost={handleOpenScheduleModal}
        />
      )}
      {isTimePickerOpen && pendingDropDate && (
        <TimePickerModal
          initialDate={pendingDropDate}
          onClose={() => {
            setIsTimePickerOpen(false);
            setPendingDropDate(null);
          }}
          onConfirm={async () => {
            setIsTimePickerOpen(false);
            setPendingDropDate(null);
            setIsScheduleModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
