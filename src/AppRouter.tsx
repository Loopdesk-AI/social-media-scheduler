import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { App } from "./App";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { OAuthCallback } from "./components/OAuthCallback";
import { AppProvider, useApp } from "./contexts/AppContext";

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

import { Toaster } from "sonner";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" theme="dark" />
      <AppProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* OAuth callback routes */}
          <Route
            path="/integrations/social/:provider"
            element={
              <ProtectedRoute>
                <OAuthCallback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations/storage/:provider"
            element={
              <ProtectedRoute>
                <OAuthCallback />
              </ProtectedRoute>
            }
          />

          {/* Main app route */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}