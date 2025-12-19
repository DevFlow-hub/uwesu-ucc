import { Users, Mail, Phone, MapPin, Facebook } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLinkClick = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-foreground rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary-foreground rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/10 rounded-lg backdrop-blur-sm">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold leading-tight">UPPER WEST STUDENTS UNION</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Empowering students from the Upper West Region at the University of Cape Coast.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <div className="h-1 w-8 bg-primary-foreground/30 rounded"></div>
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  onClick={() => handleLinkClick('home')} 
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:translate-x-1 transition-all duration-200 text-left inline-flex items-center gap-2"
                >
                  <span className="text-primary-foreground/50">→</span> Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('about')} 
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:translate-x-1 transition-all duration-200 text-left inline-flex items-center gap-2"
                >
                  <span className="text-primary-foreground/50">→</span> About
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('executives')} 
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:translate-x-1 transition-all duration-200 text-left inline-flex items-center gap-2"
                >
                  <span className="text-primary-foreground/50">→</span> Executives
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/gallery')} 
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:translate-x-1 transition-all duration-200 text-left inline-flex items-center gap-2"
                >
                  <span className="text-primary-foreground/50">→</span> Gallery
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/events')} 
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:translate-x-1 transition-all duration-200 text-left inline-flex items-center gap-2"
                >
                  <span className="text-primary-foreground/50">→</span> Events
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/comments')} 
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:translate-x-1 transition-all duration-200 text-left inline-flex items-center gap-2"
                >
                  <span className="text-primary-foreground/50">→</span> Comments
                </button>
              </li>
            </ul>
          </div>
          
          {/* Contact Section */}
          <div>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <div className="h-1 w-8 bg-primary-foreground/30 rounded"></div>
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-primary-foreground/80 group">
                <div className="p-2 bg-primary-foreground/10 rounded-lg group-hover:bg-primary-foreground/20 transition-colors mt-0.5">
                  <Mail className="h-4 w-4" />
                </div>
                <a 
                  href="mailto:upperweststudentsunionucclocal@gmail.com"
                  className="hover:text-primary-foreground transition-colors break-all"
                >
                  upperweststudentsunionucclocal@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/80 group">
                <div className="p-2 bg-primary-foreground/10 rounded-lg group-hover:bg-primary-foreground/20 transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <a 
                  href="tel:+233594582488"
                  className="hover:text-primary-foreground transition-colors"
                >
                  +233 59 458 2488
                </a>
              </li>
              <li className="flex items-start gap-3 text-primary-foreground/80">
                <div className="p-2 bg-primary-foreground/10 rounded-lg mt-0.5">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>University of Cape Coast, Ghana</span>
              </li>
              <li className="flex items-center gap-3 text-primary-foreground/80 group">
                <div className="p-2 bg-primary-foreground/10 rounded-lg group-hover:bg-primary-foreground/20 transition-colors">
                  <Facebook className="h-4 w-4" />
                </div>
                <a 
                  href="https://www.facebook.com/share/1CtHjbJjJs/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground transition-colors"
                >
                  UWESU UCC
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8">
          <div className="text-center text-sm text-primary-foreground/60 space-y-3">
            <p>&copy; {new Date().getFullYear()} UPPER WEST STUDENTS UNION. All rights reserved.</p>
            <div className="overflow-hidden">
              <p className="animate-crawl whitespace-nowrap text-primary-foreground/50">
                Developed by the 2025/2026 Executive Board
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;