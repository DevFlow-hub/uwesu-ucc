import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ScrollingTagline from "@/components/ScrollingTagline";
import Stats from "@/components/Stats";
import About from "@/components/About";
import Executives from "@/components/Executives";
import Footer from "@/components/Footer";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import { NotificationButton } from "@/components/NotificationButton";
import { trackActivity } from "@/lib/activity-tracker";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        trackActivity("page_view_home");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ScrollingTagline />
      <Hero />
      <Stats />
      <About />
      <Executives />
      <Footer />
      <PushNotificationPrompt />
      <RealtimeNotifications />
    </div>
  );
};

export default Index;
