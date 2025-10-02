import { Button } from "@/components/ui/button";
import { Users, Info, ImageIcon, Calendar, LogIn } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Workers Union</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("home")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("executives")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Executives
            </button>
            <Button onClick={() => navigate("/auth")} size="sm" className="bg-gradient-hero">
              <LogIn className="h-4 w-4 mr-2" />
              Member Login
            </Button>
          </div>

          <div className="md:hidden">
            <Button onClick={() => navigate("/auth")} size="sm" variant="outline">
              <LogIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
