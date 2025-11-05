import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { UserPlus, LogIn, Bell, Shield, ShieldOff, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  event_type: "signup" | "login";
  created_at: string;
}

interface UserProfile {
  user_id: string;
  blocked: boolean;
}

const UserActivityNotifications = () => {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: adminRoles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (error) throw error;
      return new Set(data.map((r) => r.user_id));
    },
  });

  const { data: blockedUsers } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, blocked")
        .eq("blocked", true);

      if (error) throw error;
      return new Set(data.map((u) => u.user_id));
    },
  });

  const grantAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast({ title: "Admin role granted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to grant admin role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast({ title: "Admin role revoked successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to revoke admin role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ blocked: true })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      toast({ title: "User blocked successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to block user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ blocked: false })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      toast({ title: "User unblocked successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unblock user",
        description: error.message,
        variant: "destructive",
      });
    },
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
  const isUserAdmin = (userId: string) => adminRoles?.has(userId);
  const isUserBlocked = (userId: string) => blockedUsers?.has(userId);

  return (
    <div>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {displayedNotifications.map((notification) => {
            const isAdmin = isUserAdmin(notification.user_id);
            const isBlocked = isUserBlocked(notification.user_id);
            
            return (
              <div
                key={notification.id}
                className="flex flex-col sm:flex-row items-start gap-4 p-4 border rounded-lg hover:bg-accent/5 transition-colors"
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
                
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {notification.user_name || "New User"}
                    </p>
                    <Badge variant={notification.event_type === "signup" ? "default" : "secondary"}>
                      {notification.event_type === "signup" ? "Signup" : "Login"}
                    </Badge>
                    {isAdmin && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {isBlocked && (
                      <Badge variant="destructive" className="text-xs">
                        <Ban className="h-3 w-3 mr-1" />
                        Blocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {notification.user_email}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto sm:flex-col">
                  {isAdmin ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeAdminMutation.mutate(notification.user_id)}
                      disabled={revokeAdminMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <ShieldOff className="h-4 w-4 mr-1" />
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => grantAdminMutation.mutate(notification.user_id)}
                      disabled={grantAdminMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Make Admin
                    </Button>
                  )}
                  
                  {isBlocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unblockUserMutation.mutate(notification.user_id)}
                      disabled={unblockUserMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Unblock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => blockUserMutation.mutate(notification.user_id)}
                      disabled={blockUserMutation.isPending}
                      className="flex-1 sm:flex-none"
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Block
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
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