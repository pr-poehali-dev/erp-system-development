import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/hooks/useToast";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ChatProvider } from "@/hooks/useChat";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import CompanySelect from "./pages/CompanySelect";
import Planner from "./pages/Planner";
import Reports from "./pages/Reports";
import Proposals from "./pages/Proposals";
import CRM from "./pages/CRM";
import Measurements from "./pages/Measurements";
import ControlMeasurements from "./pages/ControlMeasurements";
import Clients from "./pages/Clients";
import Orders from "./pages/Orders";
import Production from "./pages/Production";
import Supply from "./pages/Supply";
import Warehouse from "./pages/Warehouse";
import Logistics from "./pages/Logistics";
import Installation from "./pages/Installation";
import Finance from "./pages/Finance";
import Marketing from "./pages/Marketing";
import Staff from "./pages/Staff";
import Technology from "./pages/Technology";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const withLayout = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <ToastProvider>
          <AuthProvider>
            <ChatProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={withLayout(<CompanySelect />)} />
                  <Route path="/dashboard" element={withLayout(<Index />)} />
                  <Route path="/crm" element={withLayout(<CRM />)} />
                  <Route path="/clients" element={withLayout(<Clients />)} />
                  <Route path="/measurements" element={withLayout(<Measurements />)} />
                  <Route path="/control-measurements" element={withLayout(<ControlMeasurements />)} />
                  <Route path="/proposals" element={withLayout(<Proposals />)} />
                  <Route path="/orders" element={withLayout(<Orders />)} />
                  <Route path="/technology" element={withLayout(<Technology />)} />
                  <Route path="/supply" element={withLayout(<Supply />)} />
                  <Route path="/warehouse" element={withLayout(<Warehouse />)} />
                  <Route path="/production" element={withLayout(<Production />)} />
                  <Route path="/logistics" element={withLayout(<Logistics />)} />
                  <Route path="/installation" element={withLayout(<Installation />)} />
                  <Route path="/planner" element={withLayout(<Planner />)} />
                  <Route path="/marketing" element={withLayout(<Marketing />)} />
                  <Route path="/finance" element={withLayout(<Finance />)} />
                  <Route path="/reports" element={withLayout(<Reports />)} />
                  <Route path="/staff" element={withLayout(<Staff />)} />
                  <Route path="/settings" element={withLayout(<Settings />)} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ChatProvider>
          </AuthProvider>
        </ToastProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
