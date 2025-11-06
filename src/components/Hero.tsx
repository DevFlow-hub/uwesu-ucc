import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBanner from "@/assets/hero-banner.png";

const Hero = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check initial session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBanner}
          alt="Union solidarity"
          className="w-full h-full object-cover scale-105 animate-[zoom_20s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-primary/90" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center text-primary-foreground">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full border-2 border-secondary/50 shadow-elevated hover:shadow-glow transition-smooth hover:scale-105 cursor-default animate-glow-pulse">
            <Users className="h-5 w-5 text-secondary animate-pulse" />
            <span className="text-sm font-semibold tracking-wide text-secondary">Stronger Together</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-extrabold leading-tight tracking-tight animate-bounce-in">
            UPPER WEST
            <span className="block bg-gradient-to-r from-secondary via-secondary-glow to-secondary bg-clip-text text-transparent mt-3 drop-shadow-lg">
              STUDENTS UNION
            </span>
          </h1>
          
          <div className="relative overflow-hidden max-w-2xl mx-auto py-4">
            <div className="flex whitespace-nowrap animate-scroll">
              {[...Array(10)].map((_, i) => (
                <span key={i} className="text-xl md:text-2xl text-primary-foreground/95 font-display font-light mx-8">
                  Unity In Diversity
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            {!isAuthenticated && (
              <Button 
                size="lg" 
                variant="3d-secondary"
                className="text-lg px-10 py-6 font-semibold rounded-xl"
                onClick={() => navigate("/auth")}
              >
                Join Our Union
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
            <Button 
              size="lg" 
              variant="3d-secondary"
              className="text-lg px-10 py-6 font-semibold rounded-xl animate-glow-pulse"
              onClick={() => {
                const element = document.getElementById("about");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
      
      {/* Floating decorative shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: "0s" }} />
      <div className="absolute bottom-40 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: "1s" }} />
    </section>
  );
};

export default Hero;
