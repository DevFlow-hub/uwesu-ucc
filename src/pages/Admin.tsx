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
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
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

          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle>Manage Gallery</CardTitle>
                <CardDescription>Create categories and manage images</CardDescription>
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
          </TabsContent>

          <TabsContent value="sms">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Manual SMS</CardTitle>
                  <CardDescription>Send custom SMS messages to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const phone = formData.get("phone") as string;
                    const message = formData.get("message") as string;
                    
                    try {
                      const { error } = await supabase.functions.invoke("send-sms", {
                        body: { to: phone, message }
                      });
                      
                      if (error) throw error;
                      
                      toast({ title: "SMS sent successfully" });
                      e.currentTarget.reset();
                    } catch (error: any) {
                      toast({
                        title: "Failed to send SMS",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+233..." required />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" name="message" rows={4} required />
                    </div>
                    <Button type="submit">Send SMS</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Reminders</CardTitle>
                  <CardDescription>Send SMS reminders for upcoming events</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={async () => {
                    try {
                      const { data, error } = await supabase.functions.invoke("event-reminders");
                      
                      if (error) throw error;
                      
                      toast({
                        title: "Event reminders sent",
                        description: `Sent ${data.sentCount} SMS messages for ${data.eventCount} upcoming events`
                      });
                    } catch (error: any) {
                      toast({
                        title: "Failed to send reminders",
                        description: error.message,
                        variant: "destructive"
                      });
                    }
                  }}>
                    Send Event Reminders Now
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sends SMS to all users with phone numbers about events happening in the next 24 hours.
                  </p>
                </CardContent>
              </Card>
            </div>
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