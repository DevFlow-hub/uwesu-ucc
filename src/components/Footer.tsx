import { Users, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-6 w-6" />
              <span className="text-xl font-bold">UPPER WEST STUDENTS UNION</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Unity In Diversity
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>
                <a href="#home" className="hover:text-primary-foreground transition-colors">Home</a>
              </li>
              <li>
                <a href="#about" className="hover:text-primary-foreground transition-colors">About</a>
              </li>
              <li>
                <a href="#executives" className="hover:text-primary-foreground transition-colors">Executives</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>uwesu-ucc@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+233 59 458 2488</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>University of Cape Coast</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} UPPER WEST STUDENTS UNION. All rights reserved.</p>
          <p className="mt-2">Developed by the 2025/2026 Executive Board</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
