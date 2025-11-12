import React, { useState } from 'react';
import { SocialAccountsModal } from './components/SocialAccountsModal';
import { Navigation } from './components/Navigation';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { Toaster } from 'sonner';
import { ViewType } from './types';

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('calendar');

  const handleNavigationClick = (view: ViewType) => {
    if (view === 'social') {
      setIsModalOpen(true);
    } else {
      setActiveView(view);
    }
  };
  return <div className="flex w-full min-h-screen bg-black">
      <Toaster position="top-right" theme="dark" />
      <Navigation activeView={activeView} onNavigate={handleNavigationClick} />
      <div className="flex-1 p-8">
        {activeView === 'calendar' && <CalendarView />}
        {activeView === 'analytics' && <AnalyticsView />}
      </div>
      {isModalOpen && <SocialAccountsModal onClose={() => setIsModalOpen(false)} />}
    </div>;
}