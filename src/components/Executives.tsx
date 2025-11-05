import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Executive {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Executives = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);

  useEffect(() => {
    const fetchExecutives = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_executive", true)
        .order("designation");

      if (data) {
        setExecutives(data);
      }
    };

    fetchExecutives();
  }, []);

  return (
    <section id="executives" className="py-24 bg-gradient-subtle relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="text-sm font-bold tracking-wider text-secondary uppercase">Leadership</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold text-foreground mb-6 leading-tight">
            Our Leadership Team
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-display font-light leading-relaxed">
            Meet the dedicated individuals leading our union forward
          </p>
        </div>

        {executives.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">
              No executives added yet. Leadership team information will appear here.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {executives.map((exec) => (
              <Card
                key={exec.id}
                className="group overflow-hidden hover:shadow-elevated transition-all duration-300 border-2 border-border hover:border-secondary/50 hover:scale-105 bg-gradient-card"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4 border-4 border-primary/10 group-hover:border-secondary/30 transition-all duration-300 group-hover:scale-110">
                      <AvatarImage src={exec.avatar_url || undefined} alt={exec.full_name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {exec.full_name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-xl font-heading font-bold text-foreground mb-1">
                      {exec.full_name}
                    </h3>
                    
                    {exec.designation && (
                      <p className="text-sm font-medium text-secondary mb-4">
                        {exec.designation}
                      </p>
                    )}
                    
                    <div className="w-full space-y-2 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 text-primary" />
                        <a href={`mailto:${exec.email}`} className="hover:text-foreground transition-colors">
                          {exec.email}
                        </a>
                      </div>
                      
                      {exec.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-primary" />
                          <a href={`tel:${exec.phone}`} className="hover:text-foreground transition-colors">
                            {exec.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Executives;
