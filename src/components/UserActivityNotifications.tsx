import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, LogIn, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  user_email: string;
  user_name: string | null;
  event_type: "signup" | "login";
  created_at: string;
}

const UserActivityNotifications = () => {
  const [showAll, setShowAll] = useState(false);
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>;
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No activity notifications yet</p>
      </div>
    );
  }

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 10);

  return (
    <div>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <div className={`p-2 rounded-full ${
                notification.event_type === "signup" 
                  ? "bg-green-100 dark:bg-green-900/20" 
                  : "bg-blue-100 dark:bg-blue-900/20"
              }`}>
                {notification.event_type === "signup" ? (
                  <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <LogIn className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">
                    {notification.user_name || "New User"}
                  </p>
                  <Badge variant={notification.event_type === "signup" ? "default" : "secondary"}>
                    {notification.event_type === "signup" ? "Signup" : "Login"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {notification.user_email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {notifications.length > 10 && (
        <Button
          variant="outline"
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3"
        >
          {showAll ? "Show Less" : `Show More (${notifications.length - 10} more)`}
        </Button>
      )}
    </div>
  );
};

export default UserActivityNotifications;