import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Award } from "lucide-react";

const Stats = () => {
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from("union_info")
        .select("key, value")
        .in("key", ["total_members", "active_members"]);

      if (data) {
        const statsMap = data.reduce((acc, item) => {
          acc[item.key] = parseInt(item.value) || 0;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          total: statsMap.total_members || 0,
          active: statsMap.active_members || 0,
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
    {
      icon: TrendingUp,
      label: "Active Members",
      value: stats.active,
      color: "text-secondary",
    },
    {
      icon: Award,
      label: "Years of Service",
      value: "25+",
      color: "text-accent",
    },
  ];

  return (
    <section className="py-20 bg-gradient-subtle relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className="group text-center p-10 bg-gradient-card rounded-2xl shadow-card hover:shadow-elevated transition-all duration-300 border border-border/50 hover:border-secondary/30 hover:scale-105"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                <item.icon className={`h-14 w-14 mx-auto relative ${item.color} drop-shadow-lg`} />
              </div>
              <div className="text-5xl font-heading font-extrabold text-foreground mb-3 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </div>
              <div className="text-muted-foreground font-display font-semibold text-lg tracking-wide">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
