import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Kunden from "./pages/admin/Kunden";
import Autos from "./pages/admin/Autos";
import Kanzleien from "./pages/admin/Kanzleien";
import Bankkonten from "./pages/admin/Bankkonten";
import Speditionen from "./pages/admin/Speditionen";
import InsolventeUnternehmen from "./pages/admin/InsolventeUnternehmen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="kunden" element={<Kunden />} />
              <Route path="autos" element={<Autos />} />
              <Route path="kanzleien" element={<Kanzleien />} />
              <Route path="bankkonten" element={<Bankkonten />} />
              <Route path="speditionen" element={<Speditionen />} />
              <Route path="insolvente-unternehmen" element={<InsolventeUnternehmen />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
