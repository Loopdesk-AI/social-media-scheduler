import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { isValidTimeFormat } from '../lib/dateUtils';
import { MultiPlatformSelector } from './MultiPlatformSelector';
import { PostTypeSelector } from './PostTypeSelector';

interface SchedulingFormProps {
  onPlatformSelectionChange?: (selectedPlatforms: string[]) => void;
  onPlatformContentChange?: (platformId: string, content: string) => void;
  onScheduledTimeChange?: (date: Date, time: string, period: 'AM' | 'PM') => void;
  initialPostContent?: string;
  onPostContentChange?: (content: string) => void;
  onVideoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedVideo?: { path: string; name: string } | null;
  uploading?: boolean;
  selectedPlatforms?: string[];
  integrations?: Array<{ id: string; providerIdentifier: string; name: string }>;
  onInstagramMediaUrlChange?: (url: string) => void; // New prop for Instagram media URL
}

export function SchedulingForm({
  onPlatformSelectionChange,
  onPlatformContentChange,
  onScheduledTimeChange,
  initialPostContent = '',
  onPostContentChange,
  onVideoUpload,
  uploadedVideo,
  uploading = false,
  selectedPlatforms = [],
  integrations = [],
  onInstagramMediaUrlChange // New prop
}: SchedulingFormProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [postContent, setPostContent] = useState(initialPostContent);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timeInputValue, setTimeInputValue] = useState('12:00');
  const [instagramMediaUrl, setInstagramMediaUrl] = useState(''); // New state for Instagram media URL
  const [postTypes, setPostTypes] = useState<Record<string, string>>({}); // Track post type per platform
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Detect media type from uploaded video
  const detectMediaType = (): { type: 'image' | 'video' | 'mixed' | 'none'; count: number } => {
    if (!uploadedVideo) return { type: 'none', count: 0 };

    const videoType = (uploadedVideo as any).type ||
      (uploadedVideo.name.match(/\.(mp4|mov|avi|webm|mkv)$/i) ? 'video' :
        uploadedVideo.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'unknown');

    return {
      type: videoType as 'image' | 'video',
      count: 1
    };
  };

  const mediaInfo = detectMediaType();

  // Notify parent when Instagram media URL changes
  useEffect(() => {
    if (onInstagramMediaUrlChange) {
      // console.log('Instagram media URL changed:', instagramMediaUrl);
      onInstagramMediaUrlChange(instagramMediaUrl);
    }
  }, [instagramMediaUrl, onInstagramMediaUrlChange]);

  // Set default time to current time in IST
  useEffect(() => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60; // IST is UTC+5:30
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (istOffset * 60000));

    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();

    // Convert 24-hour to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    const timeString = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setSelectedTime(timeString);
    setTimeInputValue(timeString);
    setSelectedPeriod(period);
  }, []);

  // Close time picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setIsTimePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if Instagram is selected
  const isInstagramSelected = selectedPlatforms.some(platformId => {
    const integration = integrations.find(i => i.id === platformId);
    return integration?.providerIdentifier === 'instagram';
  });

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

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    if (onScheduledTimeChange) {
      onScheduledTimeChange(date, selectedTime, selectedPeriod);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    setTimeInputValue(time);
    if (onScheduledTimeChange) {
      onScheduledTimeChange(selectedDate, time, selectedPeriod);
    }
    setIsTimePickerOpen(false);
  };

  const handlePeriodChange = (period: 'AM' | 'PM') => {
    setSelectedPeriod(period);
    if (onScheduledTimeChange) {
      onScheduledTimeChange(selectedDate, selectedTime, period);
    }
  };

  const handlePostContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setPostContent(content);
    if (onPostContentChange) {
      onPostContentChange(content);
    }
  };

  const handleTimeInputFocus = () => {
    setIsTimePickerOpen(true);
  };

  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeInputValue(value);

    // If the input matches a valid time format, update the selected time
    if (isValidTimeFormat(value)) {
      setSelectedTime(value);
      if (onScheduledTimeChange) {
        onScheduledTimeChange(selectedDate, value, selectedPeriod);
      }
    }
  };

  const handleTimeInputBlur = () => {
    // If the input is not a valid time format, reset to the selected time
    if (!isValidTimeFormat(timeInputValue)) {
      setTimeInputValue(selectedTime);
    }
  };

  // Generate time options for the dropdown (every 5 minutes for better UX)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 1; hour <= 12; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Filter time options based on input
  const filteredTimeOptions = timeOptions.filter(time =>
    time.replace(':', '').includes(timeInputValue.replace(':', ''))
  );

  // Handle post type change
  const handlePostTypeChange = (platformId: string, postType: string) => {
    setPostTypes(prev => ({
      ...prev,
      [platformId]: postType
    }));
  };

  return <div className="flex gap-6">
    {/* Left side - Account selection and video preview */}
    <div className="flex-1 space-y-4">
      <p className="text-sm text-gray-400">
        Select the social accounts you would like to post from. You may select
        multiple accounts from the same social platforms.
      </p>

      <MultiPlatformSelector
        onSelectionChange={onPlatformSelectionChange}
        onPlatformContentChange={onPlatformContentChange}
        selectedMediaType={mediaInfo.type}
        selectedMediaCount={mediaInfo.count}
      />

      {/* Post Type Selectors for each selected platform */}
      {selectedPlatforms.length > 0 && (
        <div className="space-y-3">
          <label className="block text-white text-sm font-medium">Post Type</label>
          {selectedPlatforms.map(platformId => {
            const integration = integrations.find(i => i.id === platformId);
            if (!integration) return null;

            return (
              <div key={platformId} className="space-y-2">
                <div className="text-xs text-gray-500 capitalize">{integration.name}</div>
                <PostTypeSelector
                  platformIdentifier={integration.providerIdentifier}
                  value={postTypes[platformId] || 'standard'}
                  onChange={(type) => handlePostTypeChange(platformId, type)}
                  selectedMediaType={mediaInfo.type}
                  selectedMediaCount={mediaInfo.count}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Instagram Media URL Field */}
      {isInstagramSelected && (
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 p-4">
          <label htmlFor="instagram-media-url" className="block text-white text-sm font-medium mb-2">
            Instagram Media URL
          </label>
          <input
            id="instagram-media-url"
            type="url"
            value={instagramMediaUrl}
            onChange={(e) => setInstagramMediaUrl(e.target.value)}
            placeholder="https://example.com/video.mp4 or https://example.com/image.jpg"
            className="w-full bg-[#0a0a0a] text-white rounded-lg p-3 border border-gray-800/50 focus:border-gray-700 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a publicly accessible URL for your media. Instagram requires media to be accessible from their servers.
          </p>
        </div>
      )}

      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 p-4">
        <label htmlFor="post-content" className="block text-white text-sm font-medium mb-2">
          Caption
        </label>
        <textarea
          id="post-content"
          value={postContent}
          onChange={handlePostContentChange}
          placeholder="Write a caption..."
          className="w-full bg-[#0a0a0a] text-white rounded-lg p-3 border border-gray-800/50 focus:border-gray-700 focus:outline-none min-h-[120px]"
        />

        {/* Video Upload Button */}
        {onVideoUpload && (
          <div className="mt-3">
            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={onVideoUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="video-upload"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${uploading
                ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                : uploadedVideo
                  ? 'bg-green-900/20 border-green-700 text-green-400 hover:bg-green-900/30'
                  : 'bg-blue-900/20 border-blue-700 text-blue-400 hover:bg-blue-900/30'
                }`}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </>
              ) : uploadedVideo ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-sm">{uploadedVideo.name}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <span className="text-sm">Upload Video (for YouTube)</span>
                </>
              )}
            </label>
            {uploadedVideo && !uploading && (
              <p className="text-xs text-gray-500 mt-1">Video ready for YouTube upload</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-800/50">
        <div className="flex items-center gap-3">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elon" alt="Elon Musk" className="w-10 h-10 rounded-full" />
          <span className="text-sm font-medium text-white">
            Elon Musk
          </span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 text-gray-300 transition-colors border rounded-lg hover:text-white border-gray-800/50 hover:border-gray-700">
        <Plus size={16} />
        Add Account
      </button>
    </div>
    {/* Right side - Calendar and time picker */}
    <div className="w-[320px] flex-shrink-0">
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goToPreviousMonth} className="p-1 text-gray-400 transition-colors hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium text-white">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button onClick={goToNextMonth} className="p-1 text-gray-400 transition-colors hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(day => <div key={day} className="py-1 text-xs text-center text-gray-500">
            {day}
          </div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => <button
            key={index}
            onClick={() => day.isCurrentMonth && handleDateChange(day.fullDate)}
            className={`
                  aspect-square flex items-center justify-center text-sm rounded-md transition-colors
                  ${!day.isCurrentMonth ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-gray-800 cursor-pointer'}
                  ${isSelectedDate(day.fullDate) ? 'bg-white !text-black font-medium hover:bg-gray-100' : ''}
                `}
            disabled={!day.isCurrentMonth}
          >
            {day.date}
          </button>)}
        </div>
        <div className="pt-4 mt-4 border-t border-gray-800/50">
          <div className="flex items-center justify-center gap-2 mb-3">
            {/* Custom time picker with input and dropdown */}
            <div className="relative" ref={timePickerRef}>
              <div className="relative">
                <input
                  type="text"
                  value={timeInputValue}
                  onChange={handleTimeInputChange}
                  onBlur={handleTimeInputBlur}
                  onFocus={handleTimeInputFocus}
                  placeholder="HH:MM"
                  className="bg-[#0a0a0a] text-white py-2 px-3 rounded border border-gray-800/50 focus:outline-none focus:border-gray-700 w-20 text-center"
                />
                <button
                  onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                  className="absolute inset-y-0 right-0 flex items-center px-2"
                >
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
              </div>

              {/* Time picker dropdown */}
              {isTimePickerOpen && (
                <div className="absolute z-10 mt-1 w-full bg-[#0a0a0a] border border-gray-800/50 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredTimeOptions.length > 0 ? (
                    filteredTimeOptions.map(time => (
                      <button
                        key={time}
                        onClick={() => handleTimeChange(time)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-800 ${time === selectedTime ? 'bg-gray-800 text-white' : 'text-gray-300'
                          }`}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No matching times</div>
                  )}
                </div>
              )}
            </div>

            {/* AM/PM toggle */}
            <div className="flex rounded-md overflow-hidden border border-gray-800/50">
              <button
                onClick={() => handlePeriodChange('AM')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${selectedPeriod === 'AM'
                  ? 'bg-white text-black'
                  : 'bg-[#0a0a0a] text-gray-300 hover:text-white'
                  }`}
              >
                AM
              </button>
              <button
                onClick={() => handlePeriodChange('PM')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${selectedPeriod === 'PM'
                  ? 'bg-white text-black'
                  : 'bg-[#0a0a0a] text-gray-300 hover:text-white'
                  }`}
              >
                PM
              </button>
            </div>
          </div>
          <div className="text-sm text-center text-gray-500">
            IST (India Standard Time)
          </div>
        </div>
      </div>
      <button className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 text-gray-300 transition-colors border rounded-lg hover:text-white border-gray-800/50 hover:border-gray-700">
        <RefreshCw size={16} />
        Regenerate All
      </button>
    </div>
  </div>;
}