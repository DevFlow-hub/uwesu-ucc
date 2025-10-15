import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationSender = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title || !message) {
      toast.error("Please fill in both title and message");
      return;
    }

    setSending(true);
    
    try {
      // Insert notification into database (for real-time subscribers)
      const { data, error: dbError } = await supabase
        .from("notifications")
        .insert({ title, message })
        .select()
        .single();

      if (dbError) throw dbError;

      // Send push notifications to all subscribed users
      const { error: pushError } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title,
          body: message,
        },
      });

      if (pushError) {
        console.error("Push notification error:", pushError);
        toast.warning("Notification saved but push notifications may have failed");
      } else {
        toast.success("Notification sent to all members!");
      }

      // Clear form
      setTitle("");
      setMessage("");
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Send Notification to All Members</CardTitle>
        </div>
        <CardDescription>
          Notify members both on-site (real-time) and via push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notification-title">Title</Label>
          <Input
            id="notification-title"
            placeholder="Event Reminder"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={sending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notification-message">Message</Label>
          <Textarea
            id="notification-message"
            placeholder="General meeting starts at 3 PM today..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            rows={4}
          />
        </div>
        <Button 
          onClick={handleSend} 
          disabled={sending || !title || !message}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? "Sending..." : "Send Notification"}
        </Button>
      </CardContent>
    </Card>
  );
};