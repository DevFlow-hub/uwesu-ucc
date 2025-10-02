import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const [unionInfo, setUnionInfo] = useState({
    vision: "",
    mission: "",
  });

  useEffect(() => {
    const fetchUnionInfo = async () => {
      const { data } = await supabase
        .from("union_info")
        .select("key, value")
        .in("key", ["vision", "mission"]);

      if (data) {
        const infoMap = data.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>);

        setUnionInfo({
          vision: infoMap.vision || "",
          mission: infoMap.mission || "",
        });
      }
    };

    fetchUnionInfo();
  }, []);

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            About Our Union
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Dedicated to protecting workers' rights and building a stronger community
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-elevated">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Our Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {unionInfo.vision}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-secondary/50 transition-all duration-300 shadow-card hover:shadow-elevated">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Target className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {unionInfo.mission}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default About;
