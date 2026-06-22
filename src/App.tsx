
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
import Placeholder from "./pages/Placeholder";
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
          <Route path="/planner" element={<Planner />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/proposals" element={<Proposals />} />
          <Route path="/crm" element={<Placeholder title="CRM / Сделки" icon="Users" subtitle="Воронка продаж и канбан сделок" />} />
          <Route path="/clients" element={<Placeholder title="Клиенты" icon="Contact" subtitle="База клиентов и история коммуникаций" />} />
          <Route path="/measurements" element={<Placeholder title="Замеры" icon="Ruler" subtitle="Первичные замеры и чек-листы" />} />
          <Route path="/control-measurements" element={<Placeholder title="Контрольные замеры" icon="ClipboardCheck" subtitle="Контроль перед производством" />} />
          <Route path="/orders" element={<Placeholder title="Заказы" icon="ClipboardList" subtitle="Полный цикл заказа" />} />
          <Route path="/technology" element={<Placeholder title="Технология" icon="Cog" subtitle="Чертежи и согласования" />} />
          <Route path="/supply" element={<Placeholder title="Снабжение" icon="PackageSearch" subtitle="Закупки и резервирование материалов" />} />
          <Route path="/warehouse" element={<Placeholder title="Склад" icon="Warehouse" subtitle="Остатки и интеграция с 1С" />} />
          <Route path="/production" element={<Placeholder title="Производство" icon="Factory" subtitle="Этапы, сроки, фотоотчёты" />} />
          <Route path="/logistics" element={<Placeholder title="Логистика" icon="Truck" subtitle="График отгрузок и доставка" />} />
          <Route path="/installation" element={<Placeholder title="Монтаж" icon="Wrench" subtitle="Бригады, акты, фото до/после" />} />
          <Route path="/marketing" element={<Placeholder title="Маркетинг" icon="Megaphone" subtitle="Каналы, бюджет, план" />} />
          <Route path="/finance" element={<Placeholder title="Финансы и себестоимость" icon="CircleDollarSign" subtitle="Маржа и план/факт" />} />
          <Route path="/staff" element={<Placeholder title="Сотрудники" icon="UserCog" subtitle="Команда и роли" />} />
          <Route path="/settings" element={<Placeholder title="Настройки" icon="Settings" subtitle="Параметры системы" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;