import { supabase } from "@/integrations/supabase/client";

export const trackActivity = async (activityType: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: activityType,
      });
    }
  } catch (error) {
    // Silently fail - don't disrupt user experience
    console.error("Failed to track activity:", error);
  }
};
