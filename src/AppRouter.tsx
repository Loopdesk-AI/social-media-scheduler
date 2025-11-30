import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App";
import { OAuthCallback } from "./components/OAuthCallback";
import { AppProvider } from "./contexts/AppContext";
import { Toaster } from "sonner";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <AppProvider>
        <Routes>
          {/* OAuth callback routes */}
          <Route
            path="/integrations/social/:provider"
            element={<OAuthCallback />}
          />
          <Route
            path="/integrations/storage/:provider"
            element={<OAuthCallback />}
          />

          {/* Main app route */}
          <Route path="/" element={<App />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
