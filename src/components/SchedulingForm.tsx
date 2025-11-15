import { ChevronDown, ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { getCurrentTimezone } from '../lib/dateUtils';

type SchedulingFormProps = {
  clipTitle: string;
  clipNumber: number;
};

export function SchedulingForm({
  clipTitle,
  clipNumber
}: SchedulingFormProps) {
  const today = new Date();
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
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
  return <div className="flex gap-6">
      {/* Left side - Account selection and video preview */}
      <div className="flex-1 space-y-4">
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Select the social accounts you would like to post from. You may select
          multiple accounts from the same social platforms.
        </p>
        <div className="relative">
          <button onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)} className="flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors border" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <rect x="2" y="2" width="8" height="8" rx="2" />
                <rect x="14" y="2" width="8" height="8" rx="2" />
                <rect x="2" y="14" width="8" height="8" rx="2" />
                <rect x="14" y="14" width="8" height="8" rx="2" />
              </svg>
              <span className="text-sm font-medium">All platforms</span>
            </div>
            <ChevronDown size={18} className={`transition-transform ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center gap-3">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elon" alt="Elon Musk" className="w-10 h-10 rounded-full" />
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              Elon Musk
            </span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="rounded-lg border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-start gap-3">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elon" alt="Elon Musk" className="flex-shrink-0 w-10 h-10 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>Video</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Stay Ahead of the Game! 🚀 Get Ahead of the Curve with Our
                Membership! Discover the secret to success in our membership and
                gain access to exclusive insights from top thought leaders in
                the industry. Keep...
              </p>
            </div>
          </div>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 transition-colors border rounded-lg" 
          style={{ color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }} 
          onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--foreground))'; }} 
          onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>
      {/* Right side - Calendar and time picker */}
      <div className="w-[320px] flex-shrink-0">
        <div className="rounded-lg border p-4" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPreviousMonth} className="p-1 transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--foreground))'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
              <ChevronLeft size={20} />
            </button>
            <span className="font-medium" style={{ color: 'hsl(var(--card-foreground))' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={goToNextMonth} className="p-1 transition-colors" style={{ color: 'hsl(var(--muted-foreground))' }} onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--foreground))'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map(day => <div key={day} className="py-1 text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {day}
              </div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => <button 
                key={index} 
                onClick={() => day.isCurrentMonth && setSelectedDate(day.fullDate)} 
                className="aspect-square flex items-center justify-center text-sm rounded-md transition-colors" 
                style={{ 
                  color: !day.isCurrentMonth ? 'hsl(var(--muted-foreground))' : (isSelectedDate(day.fullDate) ? 'hsl(var(--primary-foreground))' : 'hsl(var(--card-foreground))'),
                  background: isSelectedDate(day.fullDate) ? 'hsl(var(--primary))' : 'transparent', 
                  fontWeight: isSelectedDate(day.fullDate) ? '500' : 'normal' 
                }}
              >
                {day.date}
              </button>)}
          </div>
          <div className="pt-4 mt-4 border-t" style={{ borderTopColor: 'hsl(var(--border))' }}>
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
                className="w-12 text-center py-2 rounded border focus:outline-none" 
                style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                maxLength={2}
                aria-label="Hours"
              />
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>:</span>
              <input 
                type="text" 
                value={selectedMinute} 
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                    setSelectedMinute(value.padStart(2, '0').slice(0, 2));
                  }
                }}
                className="w-12 text-center py-2 rounded border focus:outline-none" 
                style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }}
                maxLength={2}
                aria-label="Minutes"
              />
              <button onClick={() => setSelectedPeriod(selectedPeriod === 'AM' ? 'PM' : 'AM')} className="px-3 py-2 rounded border transition-colors" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', borderColor: 'hsl(var(--border))' }} aria-label="Toggle AM/PM">
                {selectedPeriod}
              </button>
            </div>
            <div className="text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>{getCurrentTimezone()}</div>
          </div>
        </div>
        <button 
          className="flex items-center justify-center w-full gap-2 px-4 py-2 mt-4 transition-colors border rounded-lg" 
          style={{ color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }} 
          onMouseEnter={(e) => { e.currentTarget.style.color = 'hsl(var(--foreground))'; }} 
          onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(var(--muted-foreground))'; }}
        >
          <RefreshCw size={16} />
          Regenerate All
        </button>
      </div>
    </div>;
}