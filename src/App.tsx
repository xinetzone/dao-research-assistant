import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider} from "react-router-dom";
import { routers } from "./router";
import { useTranslation } from 'react-i18next';
import { AuthProvider } from "@/contexts/AuthContext";
import { PasswordResetModal } from "@/components/PasswordResetModal";

const queryClient = new QueryClient();
const router = createBrowserRouter(routers);

const App = () => {
  const { ready } = useTranslation();
  
  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
          {/* Global password recovery modal — shown when user arrives via reset-password email link */}
          <PasswordResetModal />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
};

export default App;
