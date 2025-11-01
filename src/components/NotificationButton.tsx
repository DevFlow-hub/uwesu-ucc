import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { subscribeToPushNotifications, unsubscribeFromPushNotifications, isPushSubscribed } from "@/lib/push-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const NotificationButton = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkStatus();
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
    
    if (user) {
      const subscribed = await isPushSubscribed();
      setIsSubscribed(subscribed);
    }
  };

  const handleToggle = async () => {
    if (!isLoggedIn) {
      toast.error("Please log in to enable notifications");
      return;
    }

    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPushNotifications();
        setIsSubscribed(false);
        toast.success("Notifications disabled");
      } else {
        await subscribeToPushNotifications();
        setIsSubscribed(true);
        toast.success("Notifications enabled!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isSubscribed ? "secondary" : "default"}
      className="gap-2"
    >
      {isSubscribed ? (
        <>
          <Bell className="h-4 w-4" />
          Notifications On
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          Enable Notifications
        </>
      )}
    </Button>
  );
};
