import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import UserActivityNotifications from "@/components/UserActivityNotifications";
import { NotificationSender } from "@/components/NotificationSender";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    const { data: adminStatus } = await supabase.rpc("has_role", {
      _user_id: session.user.id,
      _role: "admin",
    });

    if (!adminStatus) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { error } = await supabase.from("events").insert(eventData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Event created successfully" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const { error } = await supabase.from("gallery_categories").insert(categoryData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast({ title: "Category created successfully" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // First check if there are images in this category
      const { data: images } = await supabase
        .from("gallery_images")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1);

      if (images && images.length > 0) {
        throw new Error("Cannot delete category with existing images. Please remove all images first.");
      }

      const { error } = await supabase
        .from("gallery_categories")
        .delete()
        .eq("id", categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["gallery-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ files, title, eventName, categoryId }: any) => {
      const uploadPromises = files.map(async (file: File) => {
        // Upload file to storage with quality preservation
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(filePath);

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            title,
            event_name: eventName,
            category_id: categoryId,
            image_url: publicUrl,
          });

        if (dbError) throw dbError;
      });

      await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({ title: "Images uploaded successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: executives } = useQuery({
    queryKey: ["executives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_executive", true)
        .order("designation");
      if (error) throw error;
      return data;
    },
  });

  const createExecutiveMutation = useMutation({
    mutationFn: async (executiveData: any) => {
      const { avatar, ...profileData } = executiveData;
      
      let avatar_url = null;
      
      // Upload avatar if provided
      if (avatar) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        avatar_url = publicUrl;
      }

      // Create profile (user_id can be null for executives without auth accounts)
      const { error } = await supabase
        .from("profiles")
        .insert({
          ...profileData,
          avatar_url,
          is_executive: true,
          user_id: null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
      toast({ title: "Executive profile created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create executive profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteExecutiveMutation = useMutation({
    mutationFn: async (executiveId: string) => {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", executiveId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executives"] });
      toast({ title: "Executive removed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove executive",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: unionInfo } = useQuery({
    queryKey: ["union-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("union_info")
        .select("key, value")
        .in("key", ["total_members", "active_members"]);
      
      if (error) throw error;
      
      return data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
    },
  });

  const updateUnionInfoMutation = useMutation({
    mutationFn: async (totalMembers: string) => {
      const { error } = await supabase
        .from("union_info")
        .update({ value: totalMembers })
        .eq("key", "total_members");
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["union-info"] });
      toast({ title: "Total members updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update total members",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshActiveMembersMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("update_active_members_count");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["union-info"] });
      toast({ title: "Active members count refreshed" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh active members",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecutiveSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const avatarFile = formData.get("avatar") as File;
    
    createExecutiveMutation.mutate({
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      designation: formData.get("designation"),
      avatar: avatarFile?.size > 0 ? avatarFile : null,
    });
    
    e.currentTarget.reset();
  };

  const handleEventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEventMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      event_date: formData.get("event_date"),
      venue: formData.get("venue"),
      created_by: user.id,
    });
    e.currentTarget.reset();
  };

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createCategoryMutation.mutate({
      name: formData.get("name"),
      description: formData.get("description"),
    });
    e.currentTarget.reset();
  };

  const handleImageUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCategoryId) {
      toast({
        title: "No category selected",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    uploadImageMutation.mutate({
      files,
      title: formData.get("title"),
      eventName: formData.get("event_name"),
      categoryId: selectedCategoryId,
    });
    
    e.currentTarget.reset();
    setSelectedCategoryId("");
  };

  const handleUnionInfoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const totalMembers = formData.get("total_members") as string;
    
    if (!totalMembers || parseInt(totalMembers) < 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid number",
        variant: "destructive",
      });
      return;
    }
    
    updateUnionInfoMutation.mutate(totalMembers);
  };

  const handleRefreshActiveMembers = () => {
    refreshActiveMembersMutation.mutate();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <RealtimeNotifications />
      <PushNotificationPrompt />
      
      <main className="container mx-auto px-4 py-24">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage union content and settings</p>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-4xl">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="executives">Executives</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                const infoTab = document.querySelector('[value="info"]') as HTMLButtonElement;
                infoTab?.click();
              }}
              className="w-full sm:w-auto"
            >
              Union Info
            </Button>
          </div>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Event</CardTitle>
                <CardDescription>Add upcoming events for members</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <div>
                    <Label htmlFor="event_date">Date & Time</Label>
                    <Input id="event_date" name="event_date" type="datetime-local" required />
                  </div>
                  <div>
                    <Label htmlFor="venue">Venue</Label>
                    <Input id="venue" name="venue" />
                  </div>
                  <Button type="submit">Create Event</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executives" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Executive</CardTitle>
                  <CardDescription>Create portfolio positions and add executive details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExecutiveSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="avatar">Profile Picture</Label>
                      <Input 
                        id="avatar" 
                        name="avatar" 
                        type="file" 
                        accept="image/*"
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" name="full_name" required />
                    </div>
                    <div>
                      <Label htmlFor="designation">Position/Designation</Label>
                      <Input 
                        id="designation" 
                        name="designation" 
                        placeholder="e.g., President, Secretary, Treasurer"
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" />
                    </div>
                    <Button type="submit" disabled={createExecutiveMutation.isPending}>
                      <Upload className="h-4 w-4 mr-2" />
                      {createExecutiveMutation.isPending ? "Creating..." : "Add Executive"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Executives</CardTitle>
                  <CardDescription>Manage existing executive profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  {executives && executives.length > 0 ? (
                    <div className="space-y-4">
                      {executives.map((exec) => (
                        <div key={exec.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={exec.avatar_url || undefined} alt={exec.full_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {exec.full_name.split(" ").map((n: string) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{exec.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{exec.designation}</p>
                            <p className="text-sm text-muted-foreground">{exec.email}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteExecutiveMutation.mutate(exec.id)}
                            disabled={deleteExecutiveMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No executives added yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Category</CardTitle>
                  <CardDescription>Add new gallery categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Category Name</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" />
                    </div>
                    <Button type="submit">Create Category</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manage Categories</CardTitle>
                  <CardDescription>View and delete existing categories</CardDescription>
                </CardHeader>
                <CardContent>
                  {categories && categories.length > 0 ? (
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                            disabled={deleteCategoryMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No categories created yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload Image</CardTitle>
                  <CardDescription>Add new images to the gallery</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleImageUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="images">Image Files (Multiple)</Label>
                      <Input 
                        id="images" 
                        name="images" 
                        type="file" 
                        accept="image/*"
                        multiple
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-title">Image Title</Label>
                      <Input id="image-title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="event_name">Event Name (Optional)</Label>
                      <Input id="event_name" name="event_name" />
                    </div>
                    <div>
                      <Label htmlFor="category_id">Category</Label>
                      <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" disabled={uploadImageMutation.isPending}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadImageMutation.isPending ? "Uploading..." : "Upload Image"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSender />
            
            <Card>
              <CardHeader>
                <CardTitle>User Activity Notifications</CardTitle>
                <CardDescription>Recent user signups and logins</CardDescription>
              </CardHeader>
              <CardContent>
                <UserActivityNotifications />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Member Statistics</CardTitle>
                  <CardDescription>Update total member count and view active members</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUnionInfoSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="total_members">Total Members</Label>
                      <Input 
                        id="total_members" 
                        name="total_members" 
                        type="number" 
                        placeholder="Enter total number of members"
                        defaultValue={unionInfo?.total_members || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Active Members (Last 30 Days)</Label>
                      <p className="text-2xl font-bold text-primary">
                        {unionInfo?.active_members || "0"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Automatically calculated based on user interactions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={updateUnionInfoMutation.isPending}>
                        Update Total Members
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleRefreshActiveMembers}
                        disabled={refreshActiveMembersMutation.isPending}
                      >
                        Refresh Active Count
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;