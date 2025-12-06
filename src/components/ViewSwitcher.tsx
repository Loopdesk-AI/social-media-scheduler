import { ChevronDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type CalendarViewType =
  | "day"
  | "week"
  | "month"
  | "year"
  | "schedule"
  | "4day";

interface ViewSwitcherProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const views: { id: CalendarViewType; label: string; shortcut: string }[] = [
    { id: "day", label: "Day", shortcut: "D" },
    { id: "week", label: "Week", shortcut: "W" },
    { id: "month", label: "Month", shortcut: "M" },
    { id: "year", label: "Year", shortcut: "Y" },
    { id: "schedule", label: "Schedule", shortcut: "A" },
    { id: "4day", label: "4 days", shortcut: "X" },
  ];

  const currentLabel = views.find((v) => v.id === currentView)?.label || "Week";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span>{currentLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {views.map((view) => (
          <DropdownMenuItem
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="w-4">
                {currentView === view.id && <Check className="h-4 w-4" />}
              </span>
              {view.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {view.shortcut}
            </span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          View Options
        </DropdownMenuLabel>

        <DropdownMenuCheckboxItem checked={true}>
          Show weekends
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={true}>
          Show declined events
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
