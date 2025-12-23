import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Gallery from "./pages/Gallery";
import Events from "./pages/Events";
import Comments from "./pages/Comments";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { LogoutHelper } from "./components/LogoutHelper";
import BlockedUserCheck from "./components/BlockedUserCheck";
import LoadingScreen from "./components/LoadingScreen";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setTimeout(() => setLoading(false), 3000);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <BlockedUserCheck />
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
            <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />
            <Route path="/" element={user ? <Index /> : <Navigate to="/auth" replace />} />
            <Route path="/gallery" element={user ? <Gallery /> : <Navigate to="/auth" replace />} />
            <Route path="/events" element={user ? <Events /> : <Navigate to="/auth" replace />} />
            <Route path="/comments" element={user ? <Comments /> : <Navigate to="/auth" replace />} />
            <Route path="/admin" element={user ? <Admin /> : <Navigate to="/auth" replace />} />
            <Route path="/logout" element={<LogoutHelper />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;