import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import PublicCompanyPage from "./pages/PublicCompanyPage"; // Importar o novo componente
import CompanyPublicPageSettings from "./pages/CompanyPublicPageSettings";
import PropertyPublicPageSettings from "./pages/PropertyPublicPageSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/property/new" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
          <Route path="/property/:id" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
          <Route path="/property/:id/authorizations" element={<ProtectedRoute><PropertyAuthorizations /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/company-public-page" element={<ProtectedRoute><CompanyPublicPageSettings /></ProtectedRoute>} />
          <Route path="/settings/property-public-page" element={<ProtectedRoute><PropertyPublicPageSettings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/share-templates" element={<ProtectedRoute><ShareTemplates /></ProtectedRoute>} />
          <Route path="/authorization-templates" element={<ProtectedRoute><AuthorizationTemplates /></ProtectedRoute>} />
          <Route path="/print-templates" element={<ProtectedRoute><PrintTemplates /></ProtectedRoute>} />
          <Route path="/imovel/:id" element={<PublicPropertyView />} />
          <Route path="/public-company/:companySlug" element={<PublicCompanyPage />} />
          <Route path="/public-property/:companySlug" element={<PublicCompanyPage />} />
          <Route path="/public-property/:companySlug/property/:propertyId" element={<PublicPropertyView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
