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
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-6 w-6" />
              <span className="text-xl font-bold">UPPER WEST STUDENTS UNION</span>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <button 
                  onClick={() => handleLinkClick('home')} 
                  className="hover:text-primary-foreground transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('about')} 
                  className="hover:text-primary-foreground transition-colors text-left"
                >
                  About
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('executives')} 
                  className="hover:text-primary-foreground transition-colors text-left"
                >
                  Executives
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/gallery')} 
                  className="hover:text-primary-foreground transition-colors text-left"
                >
                  Gallery
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/events')} 
                  className="hover:text-primary-foreground transition-colors text-left"
                >
                  Events
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/comments')} 
                  className="hover:text-primary-foreground transition-colors text-left"
                >
                  Comments
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>upperweststudentsunionucclocal@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+233 59 458 2488</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>University of Cape Coast, Ghana</span>
              </li>
              <li className="flex items-center gap-2">
                <Facebook className="h-4 w-4" />
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
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} UPPER WEST STUDENTS UNION. All rights reserved.</p>
          <div className="mt-2 overflow-hidden">
            <p className="animate-crawl whitespace-nowrap">Developed by the 2025/2026 Executive Board</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
