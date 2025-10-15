import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { subscribeToPushNotifications, isPushSubscribed } from "@/lib/push-notifications";
import { toast } from "sonner";

export const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
    
    // Listen for login event to show prompt
    const handleLoginEvent = () => {
      checkSubscriptionStatus();
    };
    
    window.addEventListener('user-logged-in', handleLoginEvent);
    return () => window.removeEventListener('user-logged-in', handleLoginEvent);
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await isPushSubscribed();
    setIsSubscribed(subscribed);
    
    // Check if user just logged in
    const justLoggedIn = sessionStorage.getItem('just-logged-in');
    const dismissed = localStorage.getItem('push-notification-dismissed');
    
    if (!subscribed && justLoggedIn && !dismissed) {
      setShowPrompt(true);
      sessionStorage.removeItem('just-logged-in');
    }
  };

  const handleEnable = async () => {
    try {
      await subscribeToPushNotifications();
      setIsSubscribed(true);
      setShowPrompt(false);
      toast.success("Push notifications enabled!");
    } catch (error: any) {
      toast.error(error.message || "Failed to enable notifications");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push-notification-dismissed', 'true');
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Enable Notifications</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Stay updated with event reminders and important announcements
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleEnable} className="flex-1">
            Enable
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Not Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
