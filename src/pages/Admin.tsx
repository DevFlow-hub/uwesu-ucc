import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
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
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(filePath, file);

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

      // Create or update profile
      const { error } = await supabase
        .from("profiles")
        .upsert({
          ...profileData,
          avatar_url,
          is_executive: true,
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

  const handleExecutiveSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const avatarFile = formData.get("avatar") as File;
    
    createExecutiveMutation.mutate({
      user_id: crypto.randomUUID(), // Generate a new UUID for the profile
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
    const files = formData.getAll("images") as File[];
    
    if (files.length === 0 || files.every(f => f.size === 0)) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload",
        variant: "destructive",
      });
      return;
    }

    uploadImageMutation.mutate({
      files,
      title: formData.get("title"),
      eventName: formData.get("event_name"),
      categoryId: formData.get("category_id"),
    });
    
    e.currentTarget.reset();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage union content and settings</p>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-4xl">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="executives">Executives</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="info">Union Info</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
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

          <TabsContent value="executives">
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
                          <img 
                            src={exec.avatar_url || "/placeholder.svg"} 
                            alt={exec.full_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold">{exec.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{exec.designation}</p>
                            <p className="text-sm text-muted-foreground">{exec.email}</p>
                          </div>
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

          <TabsContent value="gallery">
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
                      <Select name="category_id" required>
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

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Event reminders are sent via email and push notifications through the Events page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  To send event reminders:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Go to the Events page</li>
                  <li>Click "Send Reminder" on any upcoming event</li>
                  <li>Choose Email or Push Notification</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-4">
                  Users will receive notifications about upcoming events if they have enabled notifications in their browser.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Update Union Information</CardTitle>
                <CardDescription>Manage vision, mission, and other union details</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Use the backend to manage union information directly.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;