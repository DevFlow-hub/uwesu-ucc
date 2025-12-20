import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, User, Award, Sparkles, BookOpen, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Executive {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  avatar_url: string | null;
  bio: string | null;
  program: string | null;
  level: string | null;
}

const Executives = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);

  useEffect(() => {
    const fetchExecutives = async () => {
      const { data } = await supabase
        .from("executives")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("designation");

      if (data) {
        setExecutives(data);
      }
    };

    fetchExecutives();
  }, []);

  return (
    <section id="executives" className="py-24 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced header section */}
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-gradient-to-r from-secondary/10 via-secondary/5 to-secondary/10 rounded-full border border-secondary/20 shadow-lg">
            <Award className="w-4 h-4 text-secondary" />
            <span className="text-sm font-bold tracking-wider text-secondary uppercase">Leadership</span>
            <Sparkles className="w-4 h-4 text-secondary" />
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 mb-6 leading-tight">
            Our Leadership Team
          </h2>
          
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 rounded-2xl blur-xl" />
            <p className="relative text-lg md:text-xl lg:text-2xl text-slate-700 font-light leading-relaxed px-6 py-4">
              Meet the dedicated individuals leading our union forward
            </p>
          </div>
        </div>

        {executives.length === 0 ? (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-700">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-2xl opacity-50" />
              <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 p-8 rounded-full">
                <User className="h-16 w-16 text-slate-400" />
              </div>
            </div>
            <p className="text-xl text-slate-600 font-medium">
              No executives added yet. Leadership team information will appear here.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {executives.map((exec, index) => (
              <Card
                key={exec.id}
                className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 border-slate-200 hover:border-secondary/40 hover:-translate-y-3 bg-white backdrop-blur-sm animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                
                <CardContent className="p-8 relative">
                  <div className="flex flex-col items-center text-center">
                    {/* Enhanced avatar with glow effect */}
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse" />
                      <Avatar className="relative h-28 w-28 border-4 border-white shadow-xl group-hover:border-secondary/30 transition-all duration-500 group-hover:scale-110 ring-4 ring-slate-100 group-hover:ring-secondary/20">
                        <AvatarImage src={exec.avatar_url || undefined} alt={exec.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-slate-700 text-xl font-bold">
                          {exec.full_name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <h3 className="text-xl font-heading font-bold text-slate-900 mb-2 group-hover:text-secondary transition-colors duration-300">
                      {exec.full_name}
                    </h3>
                    
                    {exec.designation && (
                      <div className="mb-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full border border-secondary/20">
                          <Award className="h-3.5 w-3.5 text-secondary" />
                          <p className="text-sm font-semibold text-secondary">
                            {exec.designation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bio Data Section */}
                    {(exec.program || exec.level) && (
                      <div className="w-full mb-4 space-y-2">
                        {exec.program && (
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span className="font-medium">{exec.program}</span>
                          </div>
                        )}
                        
                        {exec.level && (
                          <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            <span className="font-medium">Level {exec.level}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Enhanced contact information */}
                    <div className="w-full space-y-3 pt-6 border-t-2 border-slate-100 group-hover:border-secondary/20 transition-colors duration-300">
                      <div className="flex items-center gap-3 text-sm text-slate-600 group/item hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50">
                        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg group-hover/item:bg-primary/20 transition-colors">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <a 
                          href={`mailto:${exec.email}`} 
                          className="flex-1 text-left break-all font-medium hover:underline"
                        >
                          {exec.email}
                        </a>
                      </div>
                      
                      {exec.phone && (
                        <div className="flex items-center gap-3 text-sm text-slate-600 group/item hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50">
                          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg group-hover/item:bg-primary/20 transition-colors">
                            <Phone className="h-4 w-4 text-primary" />
                          </div>
                          <a 
                            href={`tel:${exec.phone}`} 
                            className="flex-1 text-left font-medium hover:underline"
                          >
                            {exec.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Card>
            ))}
          </div>
        )}

        {/* Decorative bottom element */}
        {executives.length > 0 && (
          <div className="mt-20 flex justify-center">
            <div className="h-1 w-32 bg-gradient-to-r from-transparent via-secondary/50 to-transparent rounded-full" />
          </div>
        )}
      </div>
    </section>
  );
};

export default Executives;