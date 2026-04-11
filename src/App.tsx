import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ExecutiveProtectedRoute } from "@/components/ExecutiveProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Existing pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EmailConfirmation from "./pages/EmailConfirmation";
import ResetPassword from "./pages/ResetPassword";
import IndividualDashboard from "./pages/IndividualDashboard";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import Ranking from "./pages/Ranking";
import Vendas from "./pages/Vendas";
import Abordagens from "./pages/Abordagens";
import NovaAbordagem from "./pages/NovaAbordagem";
import RegistrarVenda from "./pages/RegistrarVenda";
import Clientes from "@/pages/Clientes";
import Documentos from "@/pages/Documentos";
import WorkBoard from "@/pages/WorkBoard";
import Perfil from "@/pages/Perfil";
import Configuracoes from "@/pages/Configuracoes";
import Formularios from "@/pages/Formularios";
import TeamMembers from "./pages/TeamMembers";
import NotFound from "./pages/NotFound";

// New pages
import HomePage from "./pages/HomePage";
import CRMPage from "./pages/CRMPage";
import PlaybooksPage from "./pages/PlaybooksPage";
import ClosingPage from "./pages/ClosingPage";
import TrafficPage from "./pages/TrafficPage";
import TrafficNewPage from "./pages/TrafficNewPage";
import WorkboardAdminPage from "./pages/WorkboardAdminPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Root redirect */}
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />

                {/* Home (all roles) */}
                <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

                {/* Individual dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute><IndividualDashboard /></ProtectedRoute>} />

                {/* Executive-only */}
                <Route path="/executive" element={<ExecutiveProtectedRoute><ExecutiveDashboard /></ExecutiveProtectedRoute>} />
                <Route path="/team-members" element={<ExecutiveProtectedRoute><TeamMembers /></ExecutiveProtectedRoute>} />
                <Route path="/workboard/admin" element={<ExecutiveProtectedRoute><WorkboardAdminPage /></ExecutiveProtectedRoute>} />

                {/* Sales & approaches */}
                <Route path="/vendas" element={<ProtectedRoute><Vendas /></ProtectedRoute>} />
                <Route path="/vendas/nova" element={<ProtectedRoute><RegistrarVenda /></ProtectedRoute>} />
                <Route path="/abordagens" element={<ProtectedRoute><Abordagens /></ProtectedRoute>} />
                <Route path="/abordagens/nova" element={<ProtectedRoute><NovaAbordagem /></ProtectedRoute>} />

                {/* Closing (closer + executive) */}
                <Route path="/closing" element={<ProtectedRoute><ClosingPage /></ProtectedRoute>} />

                {/* CRM (bdr + executive) */}
                <Route path="/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />

                {/* Playbooks (sdr, closer, executive) */}
                <Route path="/playbooks" element={<ProtectedRoute><PlaybooksPage /></ProtectedRoute>} />

                {/* Traffic (traffic_manager + executive) */}
                <Route path="/traffic" element={<ProtectedRoute><TrafficPage /></ProtectedRoute>} />
                <Route path="/traffic/new" element={<ProtectedRoute><TrafficNewPage /></ProtectedRoute>} />

                {/* General */}
                <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
                <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
                <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
                <Route path="/formularios" element={<ProtectedRoute><Formularios /></ProtectedRoute>} />
                <Route path="/workboard" element={<ProtectedRoute><WorkBoard /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
