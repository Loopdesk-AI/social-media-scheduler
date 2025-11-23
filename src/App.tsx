import { TemplateProvider } from "./components/TemplateContext";
import SchedulePostModal from "./components/SchedulePostModal";
import { useState } from "react";
import { Button } from "./components/ui/button";

export function App() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <TemplateProvider>
      <div className="p-6">
        <Button onClick={() => setModalOpen(true)}>Schedule Post</Button>
        <SchedulePostModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </TemplateProvider>
  );
}

export default App;
