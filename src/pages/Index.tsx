import { useEffect } from "react";
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
  useEffect(() => {
    trackActivity("page_view_home");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ScrollingTagline />
      <Hero />
      <div className="container mx-auto px-4 py-6 flex justify-center">
        <NotificationButton />
      </div>
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
