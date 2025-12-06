import { useState } from "react";
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Key,
  Sparkles,
  Download,
  Trash2,
  LogOut,
  Zap,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  Plus,
  AlertTriangle,
  RefreshCw,
  Settings,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { platforms } from "../data/platforms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper to get brand color for platforms
const getPlatformColor = (id: string) => {
  const colors: Record<string, string> = {
    youtube: "#FF0000",
    instagram: "#E1306C",
    twitter: "#1DA1F2",
    linkedin: "#0A66C2",
    facebook: "#1877F2",
  };
  return colors[id] || "#666666";
};

type AccountViewProps = {
  initialSection?:
    | "social-connected"
    | "social-add"
    | "profile"
    | "preferences"
    | "security"
    | "stats";
};

export function AccountView({
  initialSection = "social-connected",
}: AccountViewProps) {
  const {
    user,
    logout,
    integrations,
    connectIntegration,
    disconnectIntegration,
    loading,
  } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(initialSection);

  const socialIntegrations = integrations.filter(
    (integration) =>
      integration.providerIdentifier !== "google-drive" &&
      integration.providerIdentifier !== "dropbox",
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const handleConnectPlatform = async (platformId: string) => {
    await connectIntegration(platformId);
  };

  const handleDisconnect = async (id: string) => {
    if (confirm("Are you sure you want to disconnect this account?")) {
      await disconnectIntegration(id);
    }
  };

  // Mock stats data
  const stats = {
    totalPosts: 1247,
    scheduledPosts: 89,
    publishedToday: 12,
    aiSuggestionsUsed: 342,
    accountsConnected: socialIntegrations.length,
    storageUsed: "2.4 GB",
    memberSince: new Date(
      (user as any)?.createdAt || Date.now(),
    ).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };

  const menuItems = [
    {
      section: "Social Connections",
      items: [
        {
          id: "social-connected" as const,
          label: "Connected",
          icon: CheckCircle2,
          badge: socialIntegrations.length || undefined,
        },
        {
          id: "social-add" as const,
          label: "Add New",
          icon: Plus,
          badge: undefined,
        },
      ],
    },
    {
      section: "Account Settings",
      items: [
        {
          id: "profile" as const,
          label: "Profile",
          icon: User,
          badge: undefined,
        },
        {
          id: "preferences" as const,
          label: "Preferences",
          icon: Palette,
          badge: undefined,
        },
        {
          id: "security" as const,
          label: "Security",
          icon: Shield,
          badge: undefined,
        },
        {
          id: "stats" as const,
          label: "Statistics",
          icon: TrendingUp,
          badge: undefined,
        },
      ],
    },
  ];

  const sectionTitles: Record<string, { title: string; description: string }> =
    {
      "social-connected": {
        title: "Active Connections",
        description: "Manage and monitor your connected social profiles",
      },
      "social-add": {
        title: "Available Platforms",
        description: "Select a platform to connect a new account",
      },
      profile: {
        title: "Profile Settings",
        description: "Update your personal information",
      },
      preferences: {
        title: "App Preferences",
        description: "Customize your application experience",
      },
      security: {
        title: "Security Settings",
        description: "Manage your password and account security",
      },
      stats: {
        title: "Account Statistics",
        description: "Overview of your account activity",
      },
    };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-border flex flex-col bg-muted/30">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Accounts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your social connections
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {menuItems.map((group) => (
              <div key={group.section}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                  {group.section}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 ${
                          isActive ? "bg-primary/10 text-primary" : ""
                        }`}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge !== undefined && (
                          <Badge variant="secondary" className="ml-auto">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Security Tip */}
        <div className="p-4 border-t border-border">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-bold">Security Tip</span>
              </div>
              <p className="text-[11px] text-primary/80 leading-relaxed">
                We use official APIs for all connections. Your credentials are
                never stored on our servers.
              </p>
            </CardContent>
          </Card>
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="px-8 py-6 border-b border-border bg-background">
          <h1 className="text-2xl font-bold">
            {sectionTitles[activeSection]?.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {sectionTitles[activeSection]?.description}
          </p>
        </div>

        <ScrollArea className="flex-1 p-8">
          {/* Social Connected View */}
          {activeSection === "social-connected" && (
            <div className="space-y-4 max-w-3xl">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              ) : socialIntegrations.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg mb-2">
                      No accounts connected
                    </CardTitle>
                    <CardDescription className="max-w-xs mb-6">
                      Connect your social media profiles to start scheduling and
                      publishing content.
                    </CardDescription>
                    <Button onClick={() => setActiveSection("social-add")}>
                      Connect Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {socialIntegrations.map((integration) => (
                    <Card
                      key={integration.id}
                      className="group hover:border-primary/50 transition-colors"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="h-14 w-14 rounded-xl">
                                <AvatarImage
                                  src={integration.picture}
                                  alt={integration.name}
                                />
                                <AvatarFallback className="rounded-xl">
                                  {integration.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                                {integration.refreshNeeded ? (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-lg">
                                {integration.name}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="capitalize">
                                  {integration.providerIdentifier}
                                </span>
                                {integration.profile?.username && (
                                  <>
                                    <span>•</span>
                                    <span>@{integration.profile.username}</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                {integration.refreshNeeded && (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                  >
                                    Reconnect Needed
                                  </Badge>
                                )}
                                {integration.disabled && (
                                  <Badge variant="secondary">Disabled</Badge>
                                )}
                                {!integration.refreshNeeded &&
                                  !integration.disabled && (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                                    >
                                      Active
                                    </Badge>
                                  )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {integration.refreshNeeded && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-amber-500"
                                    onClick={() =>
                                      handleConnectPlatform(
                                        integration.providerIdentifier,
                                      )
                                    }
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reconnect</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Settings</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:text-destructive"
                                  onClick={() =>
                                    handleDisconnect(integration.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Disconnect</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Social Add View */}
          {activeSection === "social-add" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
              {platforms.map((platform) => (
                <Card
                  key={platform.id}
                  className="group cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                  onClick={() => handleConnectPlatform(platform.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: getPlatformColor(platform.id),
                        }}
                      >
                        <span className="font-bold text-lg">
                          {platform.name.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{platform.name}</h4>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Connect your {platform.name} account
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Profile View */}
          {activeSection === "profile" && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-6 mb-8">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge className="mt-2 gap-1">
                    <Sparkles className="h-3 w-3" />
                    Pro Plan
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user?.name || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc+5:30">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc+0">UTC+0 (London)</SelectItem>
                      <SelectItem value="utc+5:30">UTC+5:30 (India)</SelectItem>
                      <SelectItem value="utc-8">UTC-8 (Los Angeles)</SelectItem>
                      <SelectItem value="utc-5">UTC-5 (New York)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="mt-4">Save Changes</Button>
              </div>
            </div>
          )}

          {/* Preferences View */}
          {activeSection === "preferences" && (
            <div className="space-y-4 max-w-2xl">
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Toggle app appearance
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about scheduled posts
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred language
                      </p>
                    </div>
                  </div>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security View */}
          {activeSection === "security" && (
            <div className="space-y-6 max-w-2xl">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-start gap-3 py-4">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-primary mb-1">
                      Your account is secure
                    </p>
                    <p className="text-sm text-primary/80">
                      Last sign-in: Today at 11:42 PM from India
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

                <Button className="mt-4">Update Password</Button>
              </div>

              <Separator />

              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          )}

          {/* Stats View */}
          {activeSection === "stats" && (
            <div className="space-y-6 max-w-3xl">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <p className="text-sm text-primary mb-2">
                      Connected Accounts
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      {stats.accountsConnected}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                  <CardContent className="p-6">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                      Storage Used
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.storageUsed}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        Total Posts
                      </span>
                    </div>
                    <p className="text-xl font-bold">{stats.totalPosts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-muted-foreground">
                        Scheduled
                      </span>
                    </div>
                    <p className="text-xl font-bold">{stats.scheduledPosts}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">
                        Published
                      </span>
                    </div>
                    <p className="text-xl font-bold">{stats.publishedToday}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-pink-600" />
                      <span className="text-xs text-muted-foreground">
                        AI Assists
                      </span>
                    </div>
                    <p className="text-xl font-bold">
                      {stats.aiSuggestionsUsed}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <Card className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Export Data</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Download your data
                    </span>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:bg-accent transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">API Access</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Manage API keys
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
