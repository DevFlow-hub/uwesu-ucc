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
    <section id="about" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block mb-4">
            <span className="text-sm font-bold tracking-wider text-secondary uppercase">Who We Are</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-extrabold text-foreground mb-6 leading-tight">
            About Our Union
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-display font-light leading-relaxed">
            We are the heart of student life and the champion of our collective voice. Our Union is built on a foundation of unity in diversity, where every culture is not just welcomed but cherished, upheld, and celebrated. We believe that our rich tapestry of backgrounds is our greatest strength. By bringing students together, we create a powerful force for positive change—fostering personal development, impacting lives through meaningful support and advocacy, and building an inclusive community where every student can thrive. We are more than an organization; we are a united family dedicated to making our university experience transformative for all.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card 
            className="group relative overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-elevated bg-gradient-card hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-10 relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                  <div className="relative p-4 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Eye className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-3xl font-heading font-extrabold text-foreground">Our Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {unionInfo.vision || "Loading vision statement..."}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="group relative overflow-hidden border-2 border-border hover:border-secondary/50 transition-all duration-300 shadow-card hover:shadow-elevated bg-gradient-card hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-10 relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-secondary/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                  <div className="relative p-4 bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-colors">
                    <Target className="h-8 w-8 text-secondary" />
                  </div>
                </div>
                <h3 className="text-3xl font-heading font-extrabold text-foreground">Our Mission</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {unionInfo.mission || "Loading mission statement..."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default About;
