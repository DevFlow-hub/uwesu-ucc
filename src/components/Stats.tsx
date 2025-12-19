import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Sparkles } from "lucide-react";

const Stats = () => {
  
  const [stats, setStats] = useState({
    total: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("union_info")
        .select("key, value")
        .in("key", ["total_members"]);

      if (data) {
        const statsMap = data.reduce((acc, item) => {
          acc[item.key] = parseInt(item.value) || 0;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          total: statsMap.total_members || 0,
        });
      }
    };

    fetchStats();
  }, []);

  const statItems = [
    {
      icon: Users,
      label: "Total Members",
      value: stats.total,
      color: "text-primary",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary/15 to-secondary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/15 to-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-full blur-3xl" />
        
        {/* Floating particles effect */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-secondary/30 rounded-full animate-ping" style={{ animationDelay: '1.5s', animationDuration: '3s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-primary/30 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '3s' }} />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-full border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold tracking-wider text-primary uppercase">Our Impact</span>
            <Sparkles className="w-4 h-4 text-secondary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            Growing Together
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-md mx-auto">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className="group relative text-center p-12 bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-700 border-2 border-slate-200 hover:border-primary/40 hover:scale-105 overflow-hidden animate-in fade-in zoom-in duration-1000"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>

              {/* Rotating border glow */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 blur-xl animate-pulse" />
              </div>
              
              <div className="relative">
                {/* Icon container with enhanced glow */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-full blur-3xl group-hover:blur-[40px] transition-all duration-700 animate-pulse" />
                  <div className="relative inline-flex p-6 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 rounded-2xl group-hover:from-primary/30 group-hover:to-secondary/20 transition-all duration-700 shadow-lg">
                    <item.icon className={`h-16 w-16 ${item.color} group-hover:scale-110 transition-transform duration-700 drop-shadow-2xl`} />
                  </div>
                  
                  {/* Decorative rings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 border-2 border-primary/20 rounded-full group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 border border-primary/10 rounded-full group-hover:scale-110 transition-transform duration-700" style={{ animationDelay: '0.1s' }} />
                  </div>
                </div>
                
                {/* Number display with counter animation effect */}
                <div className="mb-4">
                  <div className="relative inline-block">
                    <div className="text-6xl md:text-7xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-primary to-secondary mb-2 group-hover:scale-110 transition-transform duration-700">
                      {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                    </div>
                    {/* Animated underline */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-1 w-16 bg-gradient-to-r from-primary via-secondary to-primary rounded-full group-hover:w-24 transition-all duration-700" />
                  </div>
                </div>
                
                {/* Label with badge style */}
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-full border border-slate-200 group-hover:border-primary/30 transition-all duration-700">
                  <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse" />
                  <div className="text-slate-700 font-display font-bold text-lg tracking-wide group-hover:text-primary transition-colors duration-700">
                    {item.label}
                  </div>
                  <div className="w-2 h-2 bg-gradient-to-r from-secondary to-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>

              {/* Bottom decorative line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
          ))}
        </div>

        {/* Decorative bottom element */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent to-primary/50 rounded-full" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="h-1 w-16 bg-gradient-to-l from-transparent to-secondary/50 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;