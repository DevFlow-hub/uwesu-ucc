import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Target, Eye, Users, Sparkles } from "lucide-react";
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
    <section id="about" className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -right-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -left-20 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Enhanced header section */}
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold tracking-wider text-primary uppercase">Who We Are</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 mb-6 leading-tight">
            About Our Union
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-2xl blur-xl" />
              <p className="relative text-base md:text-lg lg:text-xl text-slate-700 leading-relaxed p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
                We are the heart of student life and the champion of our collective voice. Our Union is built on a foundation of unity in diversity, where every culture is not just welcomed but cherished, upheld, and celebrated. We believe that our rich tapestry of backgrounds is our greatest strength. By bringing students together, we create a powerful force for positive change—fostering personal development, impacting lives through meaningful support and advocacy, and building an inclusive community where every student can thrive. We are more than an organization; we are a united family dedicated to making our university experience transformative for all.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced cards grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">
          {/* Vision Card */}
          <Card 
            className="group relative overflow-hidden border-2 border-slate-200 hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-2xl bg-white hover:scale-[1.03] animate-in fade-in slide-in-from-left duration-700"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            
            <CardContent className="p-8 lg:p-10 relative">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative flex-shrink-0">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse" />
                  
                  {/* Icon container */}
                  <div className="relative p-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 shadow-lg">
                    <Eye className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 mb-2 group-hover:text-primary transition-colors duration-300">
                    Our Vision
                  </h3>
                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/50 rounded-full group-hover:w-24 transition-all duration-500" />
                </div>
              </div>
              
              <p className="text-slate-700 leading-relaxed text-base lg:text-lg font-medium">
                {unionInfo.vision || (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    Loading vision statement...
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Mission Card */}
          <Card 
            className="group relative overflow-hidden border-2 border-slate-200 hover:border-secondary/50 transition-all duration-500 shadow-xl hover:shadow-2xl bg-white hover:scale-[1.03] animate-in fade-in slide-in-from-right duration-700"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            
            <CardContent className="p-8 lg:p-10 relative">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative flex-shrink-0">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-secondary/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500 animate-pulse" />
                  
                  {/* Icon container */}
                  <div className="relative p-5 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl group-hover:from-secondary/30 group-hover:to-secondary/20 transition-all duration-500 shadow-lg">
                    <Target className="h-10 w-10 text-secondary group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-heading font-extrabold text-slate-900 mb-2 group-hover:text-secondary transition-colors duration-300">
                    Our Mission
                  </h3>
                  <div className="h-1 w-16 bg-gradient-to-r from-secondary to-secondary/50 rounded-full group-hover:w-24 transition-all duration-500" />
                </div>
              </div>
              
              <p className="text-slate-700 leading-relaxed text-base lg:text-lg font-medium">
                {unionInfo.mission || (
                  <span className="inline-flex items-center gap-2 text-slate-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary" />
                    Loading mission statement...
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Decorative bottom element */}
        <div className="mt-16 flex justify-center">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default About;