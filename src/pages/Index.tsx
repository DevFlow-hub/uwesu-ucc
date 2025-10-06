import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import About from "@/components/About";
import Executives from "@/components/Executives";
import Footer from "@/components/Footer";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Stats />
      <About />
      <Executives />
      <Footer />
      <PushNotificationPrompt />
    </div>
  );
};

export default Index;
