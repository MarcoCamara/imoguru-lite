import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PropertyForm from "./pages/PropertyForm";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import ShareTemplates from "./pages/ShareTemplates";
import AuthorizationTemplates from "./pages/AuthorizationTemplates";
import PropertyAuthorizations from "./pages/PropertyAuthorizations";
import PrintTemplates from "./pages/PrintTemplates";
import PublicPropertyView from "./pages/PublicPropertyView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/property/new" element={<PropertyForm />} />
            <Route path="/property/:id" element={<PropertyForm />} />
            <Route path="/property/:id/authorizations" element={<PropertyAuthorizations />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/share-templates" element={<ShareTemplates />} />
            <Route path="/authorization-templates" element={<AuthorizationTemplates />} />
            <Route path="/print-templates" element={<PrintTemplates />} />
            <Route path="/imovel/:id" element={<PublicPropertyView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
