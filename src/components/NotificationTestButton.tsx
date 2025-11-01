import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { subscribeToPushNotifications } from "@/lib/push-notifications";
import { toast } from "sonner";

export const NotificationTestButton = () => {
  const handleTest = async () => {
    try {
      console.log('Testing push notification permission...');
      
      // Check if notifications are supported
      if (!('Notification' in window)) {
        toast.error('Notifications not supported in this browser');
        return;
      }

      console.log('Current permission:', Notification.permission);
      
      // Request permission
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        await subscribeToPushNotifications();
        toast.success("Push notifications enabled!");
      } else {
        toast.error("Notification permission denied");
      }
    } catch (error: any) {
      console.error('Test failed:', error);
      toast.error(error.message || "Failed to enable notifications");
    }
  };

  return (
    <Button 
      onClick={handleTest}
      className="fixed bottom-4 left-4 z-50"
      size="lg"
    >
      <Bell className="h-5 w-5 mr-2" />
      Test Notifications
    </Button>
  );
};
