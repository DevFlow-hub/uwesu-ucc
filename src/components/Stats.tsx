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
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {statItems.map((item, index) => (
            <div
              key={item.label}
              className="text-center p-8 bg-card rounded-xl shadow-card hover:shadow-elevated transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <item.icon className={`h-12 w-12 mx-auto mb-4 ${item.color}`} />
              <div className="text-4xl font-bold text-foreground mb-2">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </div>
              <div className="text-muted-foreground font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
