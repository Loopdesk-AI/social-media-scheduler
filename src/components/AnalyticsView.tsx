import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { api, AnalyticsResponse } from "../lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AnalyticsView() {
  const { integrations, loading: integrationsLoading } = useApp();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(
    null,
  );
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(30);

  const socialIntegrations = integrations.filter(
    (integration) =>
      integration.providerIdentifier !== "google-drive" &&
      integration.providerIdentifier !== "dropbox",
  );

  useEffect(() => {
    if (socialIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(socialIntegrations[0].id);
    }
  }, [socialIntegrations]);

  useEffect(() => {
    if (selectedIntegration) {
      fetchAnalytics();
    }
  }, [selectedIntegration, period]);

  const fetchAnalytics = async () => {
    if (!selectedIntegration) return;

    setLoading(true);
    try {
      const data = await api.getAnalytics(selectedIntegration, period);
      setAnalytics(data);
    } catch (error: any) {
      console.error("Failed to fetch analytics:", error);
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("follower") || lower.includes("subscriber"))
      return Users;
    if (
      lower.includes("reach") ||
      lower.includes("view") ||
      lower.includes("impression")
    )
      return Eye;
    if (lower.includes("like") || lower.includes("favorite")) return Heart;
    if (lower.includes("comment") || lower.includes("repl"))
      return MessageCircle;
    if (lower.includes("share") || lower.includes("retweet")) return Share2;
    return TrendingUp;
  };

  const calculateTotal = (data: Array<{ total: number; date: string }>) => {
    return data.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateChange = (data: Array<{ total: number; date: string }>) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-7).reduce((sum, item) => sum + item.total, 0);
    const previous = data
      .slice(-14, -7)
      .reduce((sum, item) => sum + item.total, 0);
    if (previous === 0) return 0;
    return ((recent - previous) / previous) * 100;
  };

  if (integrationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (socialIntegrations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">Analytics</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg mb-2">
              No Connected Accounts
            </CardTitle>
            <CardDescription>
              Connect a social media account to view analytics
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={period === days ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriod(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>

        {/* Integration selector */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {socialIntegrations.map((integration) => (
            <Button
              key={integration.id}
              variant={
                selectedIntegration === integration.id ? "default" : "outline"
              }
              onClick={() => setSelectedIntegration(integration.id)}
              className="flex items-center gap-3 h-auto py-3 flex-shrink-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={integration.picture} alt={integration.name} />
                <AvatarFallback>
                  {integration.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-medium text-sm">{integration.name}</div>
                <div
                  className={`text-xs capitalize ${
                    selectedIntegration === integration.id
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {integration.providerIdentifier}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Analytics content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.analytics.map((metric, index) => {
                const Icon = getMetricIcon(metric.label);
                const total = calculateTotal(metric.data);
                const change = calculateChange(metric.data);
                const isPositive = change >= 0;

                return (
                  <Card
                    key={index}
                    className="hover:border-primary/50 transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        {change !== 0 && (
                          <Badge
                            variant="secondary"
                            className={
                              isPositive
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            }
                          >
                            <TrendingUp
                              className={`h-3 w-3 mr-1 ${!isPositive ? "rotate-180" : ""}`}
                            />
                            {Math.abs(change).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-1">
                        {total.toLocaleString()}
                      </div>
                      <CardDescription>{metric.label}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.analytics.map((metric, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {metric.label} Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end gap-1">
                      {metric.data.slice(-period).map((point, i) => {
                        const maxValue = Math.max(
                          ...metric.data.map((d) => d.total),
                        );
                        const height =
                          maxValue > 0 ? (point.total / maxValue) * 100 : 0;

                        return (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div
                                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-all cursor-pointer"
                                style={{
                                  height: `${height}%`,
                                  minHeight: "4px",
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">
                                {point.total.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(point.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                      <span>
                        {new Date(analytics.period.from).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                      <span>
                        {new Date(analytics.period.to).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Period info */}
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Showing data from{" "}
                  <span className="font-medium text-foreground">
                    {new Date(analytics.period.from).toLocaleDateString()}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {new Date(analytics.period.to).toLocaleDateString()}
                  </span>
                </span>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg mb-2">
                No Analytics Available
              </CardTitle>
              <CardDescription className="max-w-md text-center">
                {selectedIntegration &&
                socialIntegrations.find((i) => i.id === selectedIntegration)
                  ?.providerIdentifier === "linkedin" ? (
                  <>
                    LinkedIn does not provide analytics for personal profiles
                    through their API. Analytics are only available for company
                    pages.
                    <br />
                    <br />
                    To view your personal profile analytics, please visit{" "}
                    <a
                      href="https://www.linkedin.com/analytics/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      LinkedIn Analytics
                    </a>
                  </>
                ) : (
                  "Analytics data will appear here once available"
                )}
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
