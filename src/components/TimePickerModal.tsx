import { useState } from "react";
import { Clock, Check, ChevronUp, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TimePickerModalProps {
  initialDate: Date;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

export function TimePickerModal({
  initialDate,
  onClose,
  onConfirm,
}: TimePickerModalProps) {
  const [hours, setHours] = useState(initialDate.getHours() % 12 || 12);
  const [minutes, setMinutes] = useState(initialDate.getMinutes());
  const [period, setPeriod] = useState<"AM" | "PM">(
    initialDate.getHours() >= 12 ? "PM" : "AM",
  );

  const handleConfirm = () => {
    const newDate = new Date(initialDate);
    let newHours = hours;

    if (period === "PM" && hours !== 12) newHours += 12;
    if (period === "AM" && hours === 12) newHours = 0;

    newDate.setHours(newHours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    onConfirm(newDate);
  };

  const incrementHours = () => setHours((h) => (h === 12 ? 1 : h + 1));
  const decrementHours = () => setHours((h) => (h === 1 ? 12 : h - 1));

  const incrementMinutes = () => setMinutes((m) => (m + 5) % 60);
  const decrementMinutes = () => setMinutes((m) => (m - 5 + 60) % 60);

  const togglePeriod = () => setPeriod((p) => (p === "AM" ? "PM" : "AM"));

  const presets = [
    { label: "Morning", hours: 9, minutes: 0, period: "AM" as const },
    { label: "Afternoon", hours: 1, minutes: 0, period: "PM" as const },
    { label: "Evening", hours: 6, minutes: 0, period: "PM" as const },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Set Time
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className="flex items-center gap-4 mb-8">
            {/* Hours */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={incrementHours}
                className="h-8 w-8"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <div className="w-20 h-20 rounded-xl border bg-muted flex items-center justify-center text-4xl font-bold">
                {hours.toString().padStart(2, "0")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={decrementHours}
                className="h-8 w-8"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Hour
              </span>
            </div>

            <div className="text-4xl font-bold text-muted-foreground pb-6">
              :
            </div>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={incrementMinutes}
                className="h-8 w-8"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
              <div className="w-20 h-20 rounded-xl border bg-muted flex items-center justify-center text-4xl font-bold">
                {minutes.toString().padStart(2, "0")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={decrementMinutes}
                className="h-8 w-8"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Minute
              </span>
            </div>

            {/* Period */}
            <div className="flex flex-col items-center gap-2 ml-2">
              <div
                onClick={togglePeriod}
                className="h-20 flex flex-col rounded-xl border overflow-hidden cursor-pointer"
              >
                <div
                  className={`flex-1 px-4 flex items-center justify-center font-bold transition-colors ${
                    period === "AM"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  AM
                </div>
                <div
                  className={`flex-1 px-4 flex items-center justify-center font-bold transition-colors ${
                    period === "PM"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  PM
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Period
              </span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="w-full grid grid-cols-3 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setHours(preset.hours);
                  setMinutes(preset.minutes);
                  setPeriod(preset.period);
                }}
                className="text-muted-foreground"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Check className="h-4 w-4" />
            Confirm Time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
