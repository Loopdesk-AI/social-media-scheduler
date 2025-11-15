import React, { useState } from 'react';
import { ChevronDown, Plus, RefreshCw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { getCurrentTimezone } from '../lib/dateUtils';
import { SchedulingDay } from '../types';
import { CharacterCounter } from './CharacterCounter';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { getCharacterLimit } from '../lib/constants';

type SchedulingFormProps = {
  clipTitle: string;
  clipNumber: number;
};

export function SchedulingForm({
}: SchedulingFormProps) {
  const today = new Date();
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [postContent, setPostContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('x'); // Default platform
  const [showAIPanel, setShowAIPanel] = useState(false);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthDays - i)
      });
    }
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: new Date(year, month, day)
      });
    }
    // Next month days
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i)
      });
    }
    return days;
  };
  const days = getDaysInMonth();
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const isSelectedDate = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  const handleInsertSuggestion = (content: string) => {
    setPostContent(content);
    setShowAIPanel(false);
  };

  return <div className="flex gap-6">
      {/* Left side - Account selection and video preview */}
      <div className="flex-1 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the social accounts you would like to post from. You may select
          multiple accounts from the same social platforms.
        </p>
        <div className="relative">
          <button onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)} className="flex items-center justify-between w-full bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-[#222] transition-colors border border-gray-300 dark:border-gray-800/50">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                <rect x="2" y="2" width="8" height="8" rx="2" />
                <rect x="14" y="2" width="8" height="8" rx="2" />
                <rect x="2" y="14" width="8" height="8" rx="2" />
                <rect x="14" y="14" width="8" height="8" rx="2" />
              </svg>
              <span className="text-sm font-medium">All platforms</span>
            </div>
            <ChevronDown size={18} className={`text-gray-600 dark:text-gray-400 transition-transform ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elon" alt="Elon Musk" className="w-10 h-10 rounded-full" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Elon Musk
            </span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-gray-800/50 p-4">
          <div className="flex items-start gap-3">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elon" alt="Elon Musk" className="flex-shrink-0 w-10 h-10 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Video</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                Stay Ahead of the Game! 🚀 Get Ahead of the Curve with Our
                Membership! Discover the secret to success in our membership and
                gain access to exclusive insights from top thought leaders in
                the industry. Keep...
              </p>
            </div>
          </div>
        </div>
        
        {/* Post Content Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Post Content
            </span>
            <button
              onClick={() => setShowAIPanel(!showAIPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                showAIPanel
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Sparkles size={14} />
              {showAIPanel ? 'Hide AI' : 'AI Assist'}
            </button>
          </div>

          {showAIPanel && (
            <div className="mb-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg">
              <AISuggestionsPanel
                onInsertSuggestion={handleInsertSuggestion}
                currentPlatform={selectedPlatform}
              />
            </div>
          )}

          <label className="block">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Write your post content here or use AI Assist..."
              className="w-full min-h-[120px] px-4 py-3 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-gray-400 dark:focus:border-gray-700 resize-y transition-colors"
              maxLength={getCharacterLimit(selectedPlatform) + 100} // Allow slight overflow for UX
            />
          </label>
          
          <CharacterCounter
            count={postContent.length}
            limit={getCharacterLimit(selectedPlatform)}
            platform={selectedPlatform.toUpperCase()}
          />
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 transition-colors border rounded-lg hover:text-gray-900 dark:hover:text-white border-gray-300 dark:border-gray-800/50 hover:border-gray-400 dark:hover:border-gray-700">
          <Plus size={16} />
          Add Account
        </button>
      </div>
      {/* Right side - Calendar and time picker */}
      <div className="w-[320px] flex-shrink-0">
        <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-lg border border-gray-300 dark:border-gray-800/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPreviousMonth} className="p-1 text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white">
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium text-gray-900 dark:text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={goToNextMonth} className="p-1 text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => <div key={day} className="py-1 text-xs text-center text-gray-600 dark:text-gray-500">
                {day}
              </div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => <button key={index} onClick={() => day.isCurrentMonth && setSelectedDate(day.fullDate)} className={`
                  aspect-square flex items-center justify-center text-sm rounded-md transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800'}
                  ${isSelectedDate(day.fullDate) ? 'bg-black dark:bg-white text-white dark:text-black font-medium' : ''}
                `}>
                {day.date}
              </button>)}
          </div>
          <div className="pt-4 mt-4 border-t border-gray-300 dark:border-gray-800/50">
            <div className="flex items-center justify-center gap-2 mb-3">
              <input 
                type="text" 
                value={selectedHour} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                    setSelectedHour(value.padStart(2, '0').slice(0, 2));
                  }
                }}
                className="w-12 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-center py-2 rounded border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-gray-400 dark:focus:border-gray-700" 
                maxLength={2}
                aria-label="Hours"
              />
              <span className="text-gray-600 dark:text-gray-500">:</span>
              <input 
                type="text" 
                value={selectedMinute} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                    setSelectedMinute(value.padStart(2, '0').slice(0, 2));
                  }
                }}
                className="w-12 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white text-center py-2 rounded border border-gray-300 dark:border-gray-800/50 focus:outline-none focus:border-gray-400 dark:focus:border-gray-700" 
                maxLength={2}
                aria-label="Minutes"
              />
              <button onClick={() => setSelectedPeriod(selectedPeriod === 'AM' ? 'PM' : 'AM')} className="px-3 py-2 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors" aria-label="Toggle AM/PM">
                {selectedPeriod}
              </button>
            </div>
            <div className="text-sm text-center text-gray-600 dark:text-gray-500">{getCurrentTimezone()}</div>
          </div>
        </div>
        <button className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-gray-700 dark:text-gray-300 transition-colors border rounded-lg hover:text-gray-900 dark:hover:text-white border-gray-300 dark:border-gray-800/50 hover:border-gray-400 dark:hover:border-gray-700">
          <RefreshCw size={16} />
          Regenerate All
        </button>
      </div>
    </div>;
}