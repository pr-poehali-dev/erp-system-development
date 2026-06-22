
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CompanySelect />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/measurements" element={<Measurements />} />
          <Route path="/control-measurements" element={<ControlMeasurements />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/supply" element={<Supply />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/production" element={<Production />} />
          <Route path="/logistics" element={<Logistics />} />
          <Route path="/installation" element={<Installation />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
