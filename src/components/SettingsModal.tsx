import { useState, useEffect } from "react";
import { Key, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API Key");
      return;
    }
    localStorage.setItem("gemini_api_key", apiKey.trim());
    toast.success("Settings saved successfully");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your API keys and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API Key"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and used only for
              AI features.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
