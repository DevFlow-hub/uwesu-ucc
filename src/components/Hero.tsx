import { Button } from "@/components/ui/button";
import { ArrowRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBanner}
          alt="Union solidarity"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/75" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center text-primary-foreground">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-secondary/20 backdrop-blur-sm px-4 py-2 rounded-full border border-secondary/30">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Stronger Together</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            United for Workers'
            <span className="block bg-gradient-accent bg-clip-text text-transparent mt-2">
              Rights & Dignity
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto">
            Building a fair workplace through solidarity, advocacy, and collective action for all members.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Join Our Union
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-lg px-8 backdrop-blur-sm"
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
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
