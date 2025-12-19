import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Menu, X, Home, Info, Award, Image, Calendar, MessageSquare, Shield, LogOut, UserPlus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeSwitcher } from "./ThemeSwitcher";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const menuItems = [
    { name: "Home", path: "/", section: null, icon: Home },
    { name: "About", path: "/", section: "about", icon: Info },
    { name: "Executives", path: "/", section: "executives", icon: Award },
    { name: "Gallery", path: "/gallery", section: null, icon: Image },
    { name: "Events", path: "/events", section: null, icon: Calendar },
    { name: "Comments", path: "/comments", section: null, icon: MessageSquare },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof menuItems[0]) => {
    if (item.section) {
      e.preventDefault();
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(item.section);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(data || false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/");
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-200 transition-all duration-300">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo with enhanced styling - more compact on mobile */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
                <div className="relative p-1.5 sm:p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="text-xs sm:text-sm md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 whitespace-nowrap">
                UWESU-UCC
              </span>
            </Link>
            
            {/* Admin badge - visible on mobile when user is admin */}
            {user && isAdmin && (
              <Link to="/admin" className="md:hidden">
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-secondary/20 to-secondary/10 rounded-full border border-secondary/30 hover:from-secondary/30 hover:to-secondary/20 transition-all">
                  <Shield className="h-3 w-3 text-secondary" />
                  <span className="text-[10px] font-bold text-secondary">Admin</span>
                </div>
              </Link>
            )}
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={(e) => handleNavClick(e, item)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-slate-700 hover:text-primary hover:bg-primary/10 transition-all duration-300 relative group"
                >
                  <item.icon className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                  {item.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side buttons - simplified for mobile */}
          <div className="flex items-center gap-1">
            {/* Theme switcher - hidden on small mobile, visible on larger screens */}
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>
            
            {/* Admin button - only on desktop */}
            {user && isAdmin && (
              <Link to="/admin" className="hidden md:block">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-9 px-3 md:px-4 text-xs font-semibold bg-gradient-to-r from-secondary/20 to-secondary/10 hover:from-secondary/30 hover:to-secondary/20 border border-secondary/30"
                >
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Admin
                </Button>
              </Link>
            )}
            
            {/* Auth buttons - only on desktop */}
            {user ? (
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                size="sm" 
                className="hidden md:flex h-9 px-3 md:px-4 text-xs font-semibold border-2 hover:bg-slate-50 hover:border-primary"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            ) : (
              <Link to="/auth" className="hidden md:block">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-9 px-3 md:px-4 text-xs font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-lg transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Sign Up
                </Button>
              </Link>
            )}
            
            {/* Enhanced hamburger button - always visible on mobile */}
            <button
              className="md:hidden relative p-2 text-slate-700 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 animate-in slide-in-from-top duration-300">
            <div className="space-y-1 pt-4">
              {/* Menu items */}
              {menuItems.map((item, index) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="block animate-in slide-in-from-left duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={(e) => {
                    handleNavClick(e, item);
                    setIsOpen(false);
                  }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm font-medium text-slate-700 hover:text-primary hover:bg-primary/10 transition-all duration-300 group h-12"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="flex-1 text-left">{item.name}</span>
                      <div className="w-2 h-2 bg-primary/20 rounded-full group-hover:bg-primary group-hover:scale-150 transition-all" />
                    </div>
                  </Button>
                </Link>
              ))}

              {/* Mobile-only buttons */}
              <div className="pt-3 space-y-2 border-t border-slate-200 mt-3">
                {/* Theme switcher in mobile menu */}
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Theme</span>
                  <ThemeSwitcher />
                </div>

                {/* Admin button for mobile */}
                {user && isAdmin && (
                  <Link to="/admin" onClick={() => setIsOpen(false)}>
                    <Button 
                      variant="secondary" 
                      className="w-full justify-start h-12 bg-gradient-to-r from-secondary/20 to-secondary/10 hover:from-secondary/30 hover:to-secondary/20 border border-secondary/30"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 bg-secondary/20 rounded-lg">
                          <Shield className="h-4 w-4 text-secondary" />
                        </div>
                        <span className="flex-1 text-left font-semibold">Admin Panel</span>
                      </div>
                    </Button>
                  </Link>
                )}

                {/* Auth buttons for mobile */}
                {user ? (
                  <Button 
                    onClick={handleLogout} 
                    variant="outline" 
                    className="w-full justify-start h-12 border-2 hover:bg-slate-50 hover:border-primary"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <LogOut className="h-4 w-4 text-primary" />
                      </div>
                      <span className="flex-1 text-left font-semibold">Logout</span>
                    </div>
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button 
                      variant="default" 
                      className="w-full justify-start h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 bg-white/20 rounded-lg">
                          <UserPlus className="h-4 w-4 text-white" />
                        </div>
                        <span className="flex-1 text-left font-semibold">Sign Up</span>
                      </div>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Mobile menu footer with decorative element */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-12 bg-gradient-to-r from-transparent to-primary/50 rounded-full" />
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <div className="h-1 w-12 bg-gradient-to-l from-transparent to-secondary/50 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;