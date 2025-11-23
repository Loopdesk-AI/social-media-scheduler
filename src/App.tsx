import { TemplateProvider } from "./components/TemplateContext";
import SchedulePostModal from "./components/SchedulePostModal";
import ThemeToggle from "./components/theme/ThemeToggle";
import CalendarView from "./components/CalendarView";
import { useState } from "react";
import { Button } from "./components/ui/button";

export function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <TemplateProvider>
      <div className="p-6">
        <ThemeToggle />
        <Button onClick={() => setModalOpen(true)}>Schedule Post</Button>
        <SchedulePostModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
        <div className="mt-6">
          <CalendarView />
        </div>
      </div>
    </TemplateProvider>
  );
}

export default App;
