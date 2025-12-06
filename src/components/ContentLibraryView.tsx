import { useState, useEffect } from "react";
import { StorageFileBrowser } from "./StorageFileBrowser";
import { storageProviders, StorageProvider } from "@/data/storageProviders";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  HardDrive,
  Plus,
  AlertCircle,
  Cloud,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ContentLibraryView() {
  const { storageIntegrations, refreshStorageIntegrations } = useApp();
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  // Select the first integration by default if available and none selected
  useEffect(() => {
    if (storageIntegrations.length > 0 && !selectedIntegration) {
      setSelectedIntegration(storageIntegrations[0]);
    }
  }, [storageIntegrations, selectedIntegration]);

  const connectedIntegrations = storageIntegrations.filter((integration: any) =>
    storageProviders.some(
      (provider: StorageProvider) =>
        provider.identifier === integration.providerIdentifier,
    ),
  );

  const availableProviders = storageProviders.filter(
    (provider: StorageProvider) =>
      !storageIntegrations.some(
        (integration: any) =>
          integration.providerIdentifier === provider.identifier,
      ),
  );

  const handleConnect = async (providerIdentifier: string) => {
    try {
      const response = await api.getStorageAuthUrl(providerIdentifier);
      window.location.href = response.url;
    } catch (error) {
      console.error("Failed to connect storage provider:", error);
      toast.error("Failed to connect storage provider");
    }
  };

  const handleDisconnect = async (
    integrationId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to disconnect this provider?")) return;

    try {
      await api.deleteStorageIntegration(integrationId);
      await refreshStorageIntegrations();
      if (selectedIntegration?.id === integrationId) {
        setSelectedIntegration(null);
      }
      toast.success("Storage provider disconnected");
    } catch (error) {
      console.error("Failed to disconnect storage provider:", error);
      toast.error("Failed to disconnect storage provider");
    }
  };

  const handleReconnect = async (
    providerIdentifier: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      const response = await api.getStorageAuthUrl(providerIdentifier);
      window.location.href = response.url;
    } catch (error) {
      console.error("Failed to reconnect storage provider:", error);
      toast.error("Failed to reconnect storage provider");
    }
  };

  const handleFileSelect = (file: any) => {
    console.log(`✅ File selected:`, file);
    toast.success(`Selected file: ${file.name}`);
  };

  return (
    <TooltipProvider>
      <div className="flex h-full overflow-hidden bg-background">
        {/* Left Sidebar - Storage Providers */}
        <div className="w-80 border-r border-border flex flex-col bg-muted/30">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Cloud className="h-6 w-6 text-primary" />
              Storage
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your cloud files
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Connected Providers */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                  Connected
                </h3>
                <div className="space-y-2">
                  {connectedIntegrations.map((integration: any) => {
                    const isSelected =
                      selectedIntegration?.id === integration.id;
                    const provider = storageProviders.find(
                      (p) => p.identifier === integration.providerIdentifier,
                    );

                    return (
                      <Card
                        key={integration.id}
                        onClick={() => setSelectedIntegration(integration)}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent"
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isSelected
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <HardDrive className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    isSelected ? "text-primary" : ""
                                  }`}
                                >
                                  {provider?.name ||
                                    integration.providerIdentifier}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {integration.accountEmail || "Connected"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {integration.refreshNeeded && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-amber-500"
                                      onClick={(e) =>
                                        handleReconnect(
                                          integration.providerIdentifier,
                                          e,
                                        )
                                      }
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Reconnect required
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={(e) =>
                                      handleDisconnect(integration.id, e)
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
                    );
                  })}

                  {connectedIntegrations.length === 0 && (
                    <p className="text-sm text-muted-foreground px-2 italic">
                      No providers connected
                    </p>
                  )}
                </div>
              </div>

              {/* Available Providers */}
              {availableProviders.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                    Add Account
                  </h3>
                  <div className="space-y-2">
                    {availableProviders.map((provider: StorageProvider) => (
                      <Button
                        key={provider.identifier}
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-3 border-dashed hover:border-primary hover:bg-primary/5"
                        onClick={() => handleConnect(provider.identifier)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Plus className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">
                          Connect {provider.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {selectedIntegration ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {storageProviders.find(
                      (p) =>
                        p.identifier === selectedIntegration.providerIdentifier,
                    )?.name || "Storage"}
                  </h1>
                  {selectedIntegration.refreshNeeded && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Reconnect Required
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedIntegration.accountEmail}
                </span>
              </div>

              <div className="flex-1 overflow-hidden">
                {selectedIntegration.refreshNeeded ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                      <RefreshCw className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      Connection Expired
                    </h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Your connection to {selectedIntegration.providerName} has
                      expired. Please reconnect to continue accessing your
                      files.
                    </p>
                    <Button
                      onClick={(e) =>
                        handleReconnect(
                          selectedIntegration.providerIdentifier,
                          e,
                        )
                      }
                    >
                      Reconnect Account
                    </Button>
                  </div>
                ) : (
                  <StorageFileBrowser
                    integrationId={selectedIntegration.id}
                    onFileSelect={handleFileSelect}
                    filterTypes={["image", "video", "audio"]}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Cloud className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Select a Storage Provider
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Choose a connected storage provider from the sidebar to browse
                and manage your media files.
              </p>
              {connectedIntegrations.length === 0 && (
                <Card className="max-w-md border-primary/20 bg-primary/5">
                  <CardContent className="py-4">
                    <p className="text-sm text-primary">
                      Get started by connecting your Google Drive or Dropbox
                      account using the sidebar.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
