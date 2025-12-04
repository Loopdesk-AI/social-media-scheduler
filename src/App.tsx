import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { Navigation } from "./components/Navigation";
import { CalendarView } from "./components/CalendarView";
import { AnalyticsView } from "./components/AnalyticsView";
import { ContentLibraryView } from "./components/ContentLibraryView";
import { AccountView } from "./components/AccountView";
import { toast } from "sonner";
import { ViewType } from "./types";
import { useApp } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatInterface } from "./components/Chatbot/ChatInterface";
import { SettingsModal } from "./components/SettingsModal";
import { TooltipProvider } from "@/components/ui/tooltip";

export function App() {
  const [activeView, setActiveView] = useState<ViewType>("calendar");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshIntegrations, loading } = useApp();

  // Handle OAuth callback
  useEffect(() => {
    const integration = searchParams.get("integration");
    const error = searchParams.get("error");
    const provider = searchParams.get("provider");
    const connected = searchParams.get("connected");

    if (integration === "success") {
      toast.success(`${provider || "Account"} connected successfully!`);
      refreshIntegrations();
      // Clear query params
      setSearchParams({});
    } else if (connected === "true" && provider) {
      // Handle storage provider connection success
      toast.success(`${provider} connected successfully!`);
      refreshIntegrations();
      // Switch to content library view
      setActiveView("content-library");
      // Clear query params
      setSearchParams({});
    } else if (error) {
      toast.error(`Integration failed: ${decodeURIComponent(error)}`);
      // Clear query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refreshIntegrations]);

  const handleNavigationClick = (view: ViewType) => {
    setActiveView(view);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={0}>
        <div className="flex w-full min-h-screen bg-background transition-colors duration-200">
          <Navigation
            activeView={activeView}
            onNavigate={handleNavigationClick}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onOpenAccount={() => setActiveView("account")}
          />
          <div className="flex-1 ml-16 p-8">
            {activeView === "calendar" && <CalendarView />}
            {activeView === "analytics" && <AnalyticsView />}
            {activeView === "content-library" && <ContentLibraryView />}
            {activeView === "account" && (
              <AccountView key="account" initialSection="profile" />
            )}
            {activeView === "social" && (
              <AccountView key="social" initialSection="social-connected" />
            )}
          </div>

          <ChatInterface
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
          {isSettingsOpen && (
            <SettingsModal onClose={() => setIsSettingsOpen(false)} />
          )}
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
