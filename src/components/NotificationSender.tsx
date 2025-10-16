import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Send, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationSchema } from "@/lib/validation-schemas";
import { z } from "zod";

export const NotificationSender = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("Notification deleted");
    },
  });

  const handleSend = async () => {
    setSending(true);
    
    try {
      // Validate inputs
      const validated = notificationSchema.parse({ title, message });
      // Insert notification into database (for real-time subscribers)
      const { data, error: dbError } = await supabase
        .from("notifications")
        .insert({ title: validated.title, message: validated.message })
        .select()
        .single();

      if (dbError) throw dbError;

      // Send push notifications to all subscribed users
      const { error: pushError } = await supabase.functions.invoke("send-push-notification", {
        body: {
          payload: {
            title: validated.title,
            body: validated.message,
          },
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
      
      // Refetch notifications
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error sending notification:", error);
        toast.error(error.message || "Failed to send notification");
      }
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (notif: any) => {
    setSending(true);
    try {
      // Insert notification into database (for real-time subscribers)
      const { error: dbError } = await supabase
        .from("notifications")
        .insert({ title: notif.title, message: notif.message });

      if (dbError) throw dbError;

      // Send push notifications
      const { error: pushError } = await supabase.functions.invoke("send-push-notification", {
        body: {
          payload: {
            title: notif.title,
            body: notif.message,
          },
        },
      });

      if (pushError) {
        console.error("Push notification error:", pushError);
        toast.warning("Notification resent but push notifications may have failed");
      } else {
        toast.success("Notification resent!");
      }
    } catch (error: any) {
      console.error("Error resending notification:", error);
      toast.error(error.message || "Failed to resend notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Sent Notifications</CardTitle>
          <CardDescription>
            View, resend, or delete previous notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {(showAllNotifications ? notifications : notifications.slice(0, 5)).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <Bell className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{notif.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleResend(notif)}
                      disabled={sending}
                      title="Resend notification"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteNotificationMutation.mutate(notif.id)}
                      disabled={deleteNotificationMutation.isPending}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {notifications.length > 5 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAllNotifications(!showAllNotifications)}
                  className="w-full"
                >
                  {showAllNotifications ? "Show Less" : `Show More (${notifications.length - 5} more)`}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No notifications sent yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};