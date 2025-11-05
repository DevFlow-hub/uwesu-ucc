import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BlockedUserCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkBlockedStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("blocked")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking blocked status:", error);
        return;
      }

      if (profile?.blocked) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "Your account has been blocked. Please contact an administrator.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    checkBlockedStatus();

    // Check on auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkBlockedStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  return null;
};

export default BlockedUserCheck;
