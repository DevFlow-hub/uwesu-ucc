import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserProfileEditor } from "./UserProfileEditor";
import { Search, Edit, Eye, EyeOff, ChevronDown, ChevronUp, Shield, Ban } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  whatsapp_number?: string;
  country_code?: string;
  avatar_url?: string;
  bio?: string;
  designation?: string;
  is_executive: boolean;
  blocked: boolean;
  joined_at?: string;
}

export function UserManagementSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["all-user-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("joined_at", { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const { data: adminRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (error) throw error;
      return data.map((r) => r.user_id);
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ profileId, currentBlocked }: { profileId: string; currentBlocked: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ blocked: !currentBlocked })
        .eq("id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-profiles"] });
      toast.success("User status updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  const filteredProfiles = profiles.filter((profile) => {
    const query = searchQuery.toLowerCase();
    return (
      profile.full_name?.toLowerCase().includes(query) ||
      profile.email?.toLowerCase().includes(query) ||
      profile.phone?.toLowerCase().includes(query)
    );
  });

  const toggleExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const maskSensitiveData = (data: string | undefined) => {
    if (!data) return "N/A";
    if (showSensitiveData) return data;
    return "••••••••";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Profile Management</CardTitle>
          <CardDescription>Search and edit member profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Privacy Toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-sensitive"
                checked={showSensitiveData}
                onCheckedChange={setShowSensitiveData}
              />
              <Label htmlFor="show-sensitive" className="flex items-center gap-2 cursor-pointer">
                {showSensitiveData ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Show Sensitive Data
              </Label>
            </div>
          </div>

          {/* User List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading profiles...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No profiles found</div>
          ) : (
            <div className="space-y-3">
              {filteredProfiles.map((profile) => {
                const isExpanded = expandedUsers.has(profile.id);
                const isAdmin = adminRoles.includes(profile.user_id);

                return (
                  <Card key={profile.id} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url} />
                          <AvatarFallback>{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{profile.full_name}</h4>
                            {isAdmin && <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
                            {profile.is_executive && <Badge variant="outline">Executive</Badge>}
                            {profile.blocked && <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Blocked</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{maskSensitiveData(profile.email)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProfile(profile)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(profile.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Phone:</span>
                            <span className="ml-2">{maskSensitiveData(profile.phone)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">WhatsApp:</span>
                            <span className="ml-2">{maskSensitiveData(profile.whatsapp_number)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Country Code:</span>
                            <span className="ml-2">{profile.country_code || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Designation:</span>
                            <span className="ml-2">{profile.designation || "N/A"}</span>
                          </div>
                          {profile.bio && (
                            <div className="col-span-full">
                              <span className="text-muted-foreground">Bio:</span>
                              <p className="ml-2 mt-1">{profile.bio}</p>
                            </div>
                          )}
                          <div className="col-span-full flex items-center gap-2">
                            <Button
                              variant={profile.blocked ? "default" : "destructive"}
                              size="sm"
                              onClick={() => toggleBlockMutation.mutate({ 
                                profileId: profile.id, 
                                currentBlocked: profile.blocked 
                              })}
                            >
                              {profile.blocked ? "Unblock User" : "Block User"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <UserProfileEditor
        profile={editingProfile}
        open={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["all-user-profiles"] });
        }}
      />
    </div>
  );
}
