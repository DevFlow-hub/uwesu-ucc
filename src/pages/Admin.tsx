import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from 'uuid';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import UserActivityNotifications from "@/components/UserActivityNotifications";
import { WhatsAppNotificationSender } from "@/components/WhatsAppNotificationSender";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { RealtimeNotifications } from "@/components/RealtimeNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, Edit, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExecutiveEditor } from "@/components/ExecutiveEditor";
import { UserManagementSection } from "@/components/UserManagementSection";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { checkAuth } from "../auth";


const Admin = () => {
  // ===== ALL STATE HOOKS FIRST =====
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [editingExecutive, setEditingExecutive] = useState<any>(null);
  const [deletingExecutive, setDeletingExecutive] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [executiveData, setExecutiveData] = useState<any>({
  full_name: "",
  designation: "",
  phone: "",
  email: "",
  program: "",
  level: "",
  avatar: null,
});
  const [uploadForm, setUploadForm] = useState<HTMLFormElement | null>(null);

  // ===== ALL REF HOOKS =====
  const formRef = useRef<HTMLFormElement>(null);

  // ===== ALL CONTEXT HOOKS (useNavigate, useToast, useQueryClient) =====
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ===== ALL QUERY HOOKS =====
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

  const { data: executives, refetch: refetchExecutives } = useQuery({
  queryKey: ["executives"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("executives")
      .select("*")  // ✅ Select all fields
      .order("display_order", { ascending: true, nullsFirst: false })  // ✅ Use display_order
      .order("designation");

    if (error) throw error;
    return data;
  },
});

  const { data: galleryImages } = useQuery({
    queryKey: ["gallery-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // ===== ALL MUTATION HOOKS =====
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

  const uploadImageMutation = useMutation({
  mutationFn: async ({ files, title, eventName, categoryId }: any) => {
    console.log('Uploading files:', files.length);
    
    const results = [];
    
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          console.error('Upload error for file:', file.name, uploadError);
          results.push({ success: false, file: file.name, error: uploadError });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('gallery_images')
          .insert({
            title: title || null,
            event_name: eventName || null,
            category_id: categoryId,
            image_url: publicUrl,
          });

        if (dbError) {
          console.error('Database error for file:', file.name, dbError);
          results.push({ success: false, file: file.name, error: dbError });
          continue;
        }
        
        results.push({ success: true, file: file.name });
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
        results.push({ success: false, file: file.name, error });
      }
    }
    
    return results;
  },
  onSuccess: (results) => {
    queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
    const successCount = results.filter((r: any) => r.success).length;
    const failCount = results.length - successCount;
    
    if (uploadForm) {
      uploadForm.reset();
      setSelectedCategoryId("");
      setUploadForm(null);
    }
    
    toast({ 
      title: "Upload complete",
      description: `${successCount} image(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
    });
  },
  onError: (error: any) => {
    toast({
      title: "Upload failed",
      description: error.message,
      variant: "destructive",
    });
  },
});

  const createExecutiveMutation = useMutation({
  mutationFn: async (executiveData: any) => {
    const { avatar, ...profileData } = executiveData;

    let avatar_url = null;

    if (avatar) {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('executives-avatars')  // Changed from 'avatars' to 'executives-avatars'
        .upload(filePath, avatar);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('executives-avatars')  // Changed from 'avatars' to 'executives-avatars'
        .getPublicUrl(filePath);

      avatar_url = publicUrl;
    }

    const { error } = await supabase
      .from("executives")
      .insert({
        ...profileData,
        avatar_url,
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
        .from("executives")
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

  // Add this with your other mutations
const updateTotalMembersMutation = useMutation({
  mutationFn: async (newCount: string) => {
    const { error } = await supabase.rpc('update_total_members', {
      new_count: parseInt(newCount)
    });
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["union-info"] });
    toast({ title: "Total members updated" });
  },
  onError: (error: any) => {
    toast({
      title: "Update failed",
      description: error.message,
      variant: "destructive",
    });
  },
});
  
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({ title: "Image deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete image",
        description: error.message,
        variant: "destructive",
      });
    },
  });
const createEventMutation = useMutation({
  mutationFn: async (eventData: any) => {
    const { error } = await supabase
      .from("events")
      .insert([eventData]);
    
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["events"] });
    toast({
      title: "Success",
      description: "Event created successfully",
    });
  },
  onError: (error: any) => {
    toast({
      title: "Error",
      description: error.message || "Failed to create event",
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

  // ===== ALL EFFECT HOOKS =====
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const authenticatedUser = await checkAuth();
        console.log("✅ Authenticated user:", authenticatedUser);
        // Check both role and email for admin access
        const isAdminUser = authenticatedUser?.role === "admin" || 
                           authenticatedUser?.email === "admin@example.com";
        console.log("✅ Is admin?", isAdminUser);
        setUser(authenticatedUser);
        setIsAdmin(isAdminUser);
        setLoading(false);
      } catch (error) {
        console.error("❌ Auth error:", error);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        navigate("/login");
      }
    };
    verifyUser();
  }, [navigate]);

  useEffect(() => {
  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log("🔍 Current logged in user:", user);
    console.log("🔍 User ID:", user?.id);
    console.log("🔍 User Email:", user?.email);
  };
  checkCurrentUser();
}, []);

  // ===== ALL OTHER HOOKS (useSensors) =====
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ===== NOW CONDITIONAL RETURNS CAN HAPPEN =====
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 space-y-8">
          <div className="h-16 w-96 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-6">
            <div className="h-12 bg-muted animate-pulse rounded-lg" />
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // ===== ALL EVENT HANDLERS AND REGULAR FUNCTIONS =====
  const handleExecutiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setExecutiveData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleExecutiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const { id, avatar, full_name, designation, phone, email } = executiveData;

      let avatar_url = id ? executiveData.avatar_url : null;
      if (avatar && avatar instanceof File) {
        const fileExt = avatar.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('executives-avatars')
          .upload(fileName, avatar);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('executives-avatars')
          .getPublicUrl(fileName);

        avatar_url = publicUrl;
      }

      const payload = {
  full_name,
  designation,
  phone,
  email,
  program: executiveData.program || null,
  level: executiveData.level || null,
  avatar_url
};
      if (id) {
        const { error } = await supabase
          .from('executives')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        toast({ title: "Success", description: "Executive updated successfully" });
      } else {
        const { error } = await supabase
          .from('executives')
          .insert([payload]);

        if (error) throw error;
        toast({ title: "Success", description: "Executive created successfully" });
      }

      setExecutiveData({ 
  full_name: "", 
  designation: "", 
  phone: "", 
  email: "",
  program: "",
  level: "",
  avatar: null 
});
      formRef.current?.reset();
      queryClient.invalidateQueries(['executives']); 

    } catch (err: any) {
      console.error("Failed to submit executive:", err);
      toast({ 
        title: "Error", 
        description: err.message || "An error occurred while saving the executive." 
      });
    } finally {
      setIsCreating(false);
    }
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

  
  const handleImageUpload = async (e: React.FormEvent<HTMLFormElement>) => {
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

    const title = formData.get("title") as string;
    const eventName = formData.get("event_name") as string;
    const categoryId = selectedCategoryId;

    setUploadForm(e.currentTarget);

    uploadImageMutation.mutate({
      files,
      title,
      eventName,
      categoryId,
    });
  };

  const handleUnionInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  try {
    // Call the database function
    const { error } = await supabase.rpc('update_total_members', {
      new_count: parseInt(totalMembers)
    });
    
    if (error) throw error;
    
    toast({ 
      title: "✅ Success!", 
      description: `Total members updated to ${totalMembers}` 
    });
    
    // FIXED: Clear the input field safely
    const input = document.getElementById('total_members') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
    
  } catch (error: any) {
    toast({
      title: "❌ Failed",
      description: error.message,
      variant: "destructive",
    });
  }
};

  const handleRefreshActiveMembers = async () => {
  try {
    // Call the updated function (counts distinct users)
    const { data: result, error } = await supabase.rpc('update_active_members_count');
    
    if (error) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    
    // Get the updated value from database
    const { data: dbValue, error: fetchError } = await supabase
      .from('union_info')
      .select('value')
      .eq('key', 'active_members_30_days')
      .single();
    
    if (fetchError) {
      toast({
        title: "❌ Fetch Error",
        description: fetchError.message,
        variant: "destructive",
      });
      return;
    }
    
    // Update the display
    const display = document.getElementById('active-members-display');
    if (display && dbValue?.value) {
      display.textContent = dbValue.value;
    }
    
    toast({ 
      title: "✅ Active Members Updated!", 
      description: `Now showing: ${dbValue?.value || '0'} unique active users` 
    });
    
  } catch (error: any) {
    toast({
      title: "❌ Failed",
      description: error.message,
      variant: "destructive",
    });
  }
};
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !executives) return;

    const oldIndex = executives.findIndex((exec) => exec.id === active.id);
    const newIndex = executives.findIndex((exec) => exec.id === over.id);

    const reorderedExecutives = arrayMove(executives, oldIndex, newIndex);

    queryClient.setQueryData(["executives"], reorderedExecutives);

    try {
      const updates = reorderedExecutives.map((exec, index) => 
        supabase
          .from("executives")
          .update({ display_order: index })
          .eq("id", exec.id)
      );

      await Promise.all(updates);
      
      toast({ title: "Order updated successfully" });
    } catch (error: any) {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["executives"] });
    }
  };

  // ===== JSX RETURN =====
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

        <Tabs defaultValue="events" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="events" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Events
            </TabsTrigger>
            <TabsTrigger value="executives" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Executives
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Members
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Gallery
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="info" className="data-[state=active]:bg-background data-[state=active]:shadow-md">
              Union Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6 pt-2">
            <Card className="border-2">
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
                  <Button type="submit" variant="3d">Create Event</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executives" className="space-y-6 pt-2">
            <div className="grid gap-6">
              <Card className="border-2">
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
                        onChange={handleExecutiveChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={executiveData.full_name}
                        onChange={handleExecutiveChange}
                        placeholder="Enter executive's full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="designation">Position/Designation</Label>
                      <Input
                        id="designation"
                        name="designation"
                        value={executiveData.designation}
                        onChange={handleExecutiveChange}
                        placeholder="e.g., President, Secretary, Treasurer"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={executiveData.phone || ""}
                        onChange={handleExecutiveChange}
                        placeholder="024 XXX XXXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={executiveData.email || ""}
                        onChange={handleExecutiveChange}
                        placeholder="example@gmail.com"
                      />
                    </div>
                      <div>
                      <Label htmlFor="program">Program of Study</Label>
                      <Input
                        id="program"
                        name="program"
                        value={executiveData.program || ""}
                        onChange={handleExecutiveChange}
                        placeholder="e.g., Computer Science, Business Administration"
                      />
                    </div>

                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Input
                        id="level"
                        name="level"
                        value={executiveData.level || ""}
                        onChange={handleExecutiveChange}
                        placeholder="e.g., 100, 200, 300, 400"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {executiveData.id ? "Update Executive" : "Add Executive"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Current Executives</CardTitle>
                  <CardDescription>Manage and reorder executive profiles by dragging</CardDescription>
                </CardHeader>
                <CardContent>
                  {executives && executives.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={executives.map((exec) => exec.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {executives.map((exec) => (
                            <SortableExecutiveItem
                              key={exec.id}
                              executive={exec}
                              onEdit={() => setEditingExecutive(exec)}
                              onDelete={() => setDeletingExecutive(exec)}
                              isDeleting={deleteExecutiveMutation.isPending}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <p className="text-muted-foreground">No executives added yet</p>
                  )}
                </CardContent>
              </Card>
              
              <ExecutiveEditor
                executive={editingExecutive}
                open={!!editingExecutive}
                onClose={() => setEditingExecutive(null)}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["executives"] });
                  toast({ title: "Executive updated successfully" });
                }}
              />
              
              <AlertDialog open={!!deletingExecutive} onOpenChange={() => setDeletingExecutive(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Executive Profile?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove <strong>{deletingExecutive?.full_name}</strong> ({deletingExecutive?.designation}) from the executives list? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (deletingExecutive) {
                          deleteExecutiveMutation.mutate(deletingExecutive.id);
                          setDeletingExecutive(null);
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6 pt-2">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-6 pt-2">
            <div className="grid gap-6">
              <Card className="border-2">
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
                    <Button type="submit" variant="3d">Create Category</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-2">
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
                            variant="3d-destructive"
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

              <Card className="border-2">
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
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" variant="3d" disabled={uploadImageMutation.isPending}>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadImageMutation.isPending ? "Uploading..." : "Upload Image"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Uploaded Images</CardTitle>
                  <CardDescription>Manage your gallery images</CardDescription>
                </CardHeader>
                <CardContent>
                  {galleryImages && galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {galleryImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img 
                            src={image.image_url} 
                            alt={image.title || 'Gallery image'} 
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2">
                            <p className="text-white text-sm font-semibold text-center mb-2">{image.title}</p>
                            {image.event_name && (
                              <p className="text-white/80 text-xs text-center mb-2">{image.event_name}</p>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete "${image.title}"?`)) {
                                  deleteImageMutation.mutate(image.id);
                                }
                              }}
                              disabled={deleteImageMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No images uploaded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 pt-2">
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 via-background to-background border-2 border-primary/20">
              <WhatsAppNotificationSender />
            </div>
            
            <Card className="border-2">
              <CardHeader>
                <CardTitle>User Activity Notifications</CardTitle>
                <CardDescription>Recent user signups and logins</CardDescription>
              </CardHeader>
              <CardContent>
                <UserActivityNotifications />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-6 pt-2">
            <div className="grid gap-6">
              <Card className="border-2">
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Active Members (Last 30 Days)</Label>
                      <p className="text-2xl font-bold text-primary" id="active-members-display">
                        0 {/* We'll update this via JavaScript */}
                      </p>
                                            <p className="text-sm text-muted-foreground">
                        Automatically calculated based on user interactions
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" variant="3d">
                        Update Total Members
                      </Button>
                      <Button 
                        type="button" 
                        variant="3d-secondary"
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

interface SortableExecutiveItemProps {
  executive: any;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const SortableExecutiveItem = ({ executive, onEdit, onDelete, isDeleting }: SortableExecutiveItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: executive.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      
      <Avatar className="h-16 w-16">
        <AvatarImage src={executive.avatar_url || undefined} alt={executive.full_name} />
        <AvatarFallback className="bg-primary/10 text-primary">
          {executive.full_name.split(" ").map((n: string) => n[0]).join("")}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <h3 className="font-semibold">{executive.full_name}</h3>
        <p className="text-sm text-muted-foreground">{executive.designation}</p>
        {executive.email && <p className="text-sm text-muted-foreground">{executive.email}</p>}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="3d-secondary"
          size="icon"
          onClick={onEdit}
          title="Edit executive"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="3d-destructive"
          size="icon"
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete executive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Admin;