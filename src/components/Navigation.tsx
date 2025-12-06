import {
  Calendar,
  BarChart3,
  Users,
  LogOut,
  FolderOpen,
  Sun,
  Moon,
} from "lucide-react";
import { ViewType } from "../types";
import { useApp } from "../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type NavigationProps = {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onOpenAccount: () => void;
};

export function Navigation({
  activeView,
  onNavigate,
  onOpenAccount,
}: NavigationProps) {
  const { logout, user } = useApp();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      id: "calendar" as const,
      icon: Calendar,
      label: "Calendar",
    },
    {
      id: "analytics" as const,
      icon: BarChart3,
      label: "Analytics",
    },
    {
      id: "content-library" as const,
      icon: FolderOpen,
      label: "Content Library",
    },
    {
      id: "social" as const,
      icon: Users,
      label: "Social Accounts",
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed left-0 top-0 h-screen w-16 bg-background border-r border-border flex flex-col items-center py-6 gap-2 z-40">
        {/* User Avatar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenAccount}
              className="mb-4 p-0 h-10 w-10 rounded-full"
            >
              <Avatar className="h-10 w-10 bg-primary hover:bg-primary/90 transition-colors">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{user?.email || "View Profile"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Navigation items */}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onNavigate(item.id)}
                  className="h-10 w-10"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{theme === "dark" ? "Light Mode" : "Dark Mode"}</p>
          </TooltipContent>
        </Tooltip>

        <Separator className="my-2 w-8" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Logout</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
