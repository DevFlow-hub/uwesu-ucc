import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Trash2, MessageSquare, ExternalLink, Mail, Send } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCountdown from "@/components/EventCountdown";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Events = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEventForNotification, setSelectedEventForNotification] = useState<any | null>(null);
  const [notificationChannel, setNotificationChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // All hooks must be called before any conditional returns
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: pastEvents } = useQuery({
    queryKey: ["past-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .lt("event_date", new Date().toISOString())
        .order("event_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: whatsappMembers } = useQuery({
    queryKey: ["members-with-whatsapp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, whatsapp_number, country_code")
        .not("whatsapp_number", "is", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: emailMembers } = useQuery({
    queryKey: ["members-with-email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .not("email", "is", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // All mutation hooks must be called BEFORE any conditional returns
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["past-events"] });
      toast.success("Event deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete event");
    },
  });

  useEffect(() => {
    const checkAuthAndAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });
      
      setIsAdmin(!!data);
      setLoading(false);
    };

    checkAuthAndAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Now conditional return is safe - all hooks have been called
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 space-y-8">
          <div className="h-16 w-80 bg-muted animate-pulse rounded-lg mx-auto" />
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete);
      setEventToDelete(null);
    }
  };

  const members = notificationChannel === "whatsapp" ? whatsappMembers : emailMembers;

  const generateWhatsAppMessage = (event: any) => {
    if (!event) return "";
    
    const eventDate = new Date(event.event_date);
    const dateStr = format(eventDate, "MMMM d, yyyy");
    const timeStr = format(eventDate, "h:mm a");

    return `UWESU-UCC

${event.title}

📅 Date: ${dateStr}
⏰ Time: ${timeStr}
📍 Venue: ${event.venue || 'Venue TBA'}
📝 Purpose: ${event.description || 'Event details coming soon.'}`;
  };

  const openWhatsApp = (whatsappNumber: string, countryCode: string, event: any) => {
    const message = generateWhatsAppMessage(event);
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const fullNumber = `${countryCode}${cleanNumber}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success("Opening WhatsApp...");
  };

  const sendEventEmail = async (email: string, memberName: string, event: any) => {
    console.log('sendEventEmail called with:', { email, memberName, eventTitle: event?.title });
    
    if (!email) {
      toast.error('No email address provided');
      return;
    }
    
    setSendingEmail(email);
    try {
      const eventDate = new Date(event.event_date);
      const dateStr = format(eventDate, "MMMM d, yyyy");
      const timeStr = format(eventDate, "h:mm a");

      console.log('Invoking send-email function...');
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: `📅 Upcoming Event: ${event.title} - UWESU-UCC`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">UWESU-UCC Union</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Event Notification</p>
              </div>
              
              <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">${event.title}</h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 10px 0; color: #555;">
                    <strong style="color: #667eea;">📅 Date:</strong> ${dateStr}
                  </p>
                  <p style="margin: 10px 0; color: #555;">
                    <strong style="color: #667eea;">⏰ Time:</strong> ${timeStr}
                  </p>
                  <p style="margin: 10px 0; color: #555;">
                    <strong style="color: #667eea;">📍 Venue:</strong> ${event.venue || 'Venue TBA'}
                  </p>
                </div>
                
                ${event.description ? `
                  <div style="margin: 20px 0;">
                    <h3 style="color: #333; font-size: 16px;">Event Details:</h3>
                    <p style="color: #555; line-height: 1.6;">${event.description}</p>
                  </div>
                ` : ''}
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #666; font-size: 12px; margin: 0;">
                    This event notification was sent from UWESU-UCC Union Administration
                  </p>
                </div>
              </div>
            </div>
          `,
        },
      });

      console.log('Email function response:', { data, error });

      if (error) {
        console.error('Email function error:', error);
        throw error;
      }
      
      toast.success(`✅ Email sent successfully to ${memberName}`);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(`❌ Failed to send email: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingEmail(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Union Events</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay updated with our upcoming meetings and activities
          </p>
        </div>

        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : events && events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEventForNotification(event);
                              setNotificationChannel("whatsapp");
                            }}
                            className="animate-pulse-glow"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Notify
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(event.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <EventCountdown eventDate={event.event_date} />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(event.event_date), "MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(event.event_date), "h:mm a")}</span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.venue}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No upcoming events at the moment</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Past Events */}
        {pastEvents && pastEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Past Events</h2>
            <div className="grid gap-4">
              {pastEvents.map((event) => (
                <Card key={event.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!selectedEventForNotification} onOpenChange={() => setSelectedEventForNotification(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Event Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a channel and send notifications to members about this event
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedEventForNotification && (
            <div className="space-y-4">
              <Tabs value={notificationChannel} onValueChange={(v) => setNotificationChannel(v as "whatsapp" | "email")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">
                    {notificationChannel === "whatsapp" ? "WhatsApp Message" : "Email"} Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notificationChannel === "whatsapp" ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {generateWhatsAppMessage(selectedEventForNotification)}
                    </pre>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Subject:</p>
                        <p className="text-sm font-medium">📅 Upcoming Event: {selectedEventForNotification.title} - UWESU-UCC</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Preview:</p>
                        <p className="text-sm">Professional HTML email with event details, date, time, and venue</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold">Members ({members?.length || 0})</h3>
                {members && members.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                        <div>
                          <p className="font-medium text-sm">{member.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {notificationChannel === "whatsapp"
                              ? `${(member as any).country_code} ${(member as any).whatsapp_number}`
                              : (member as any).email}
                          </p>
                        </div>
                        {notificationChannel === "whatsapp" ? (
                          <Button
                            onClick={() => openWhatsApp((member as any).whatsapp_number!, (member as any).country_code!, selectedEventForNotification)}
                            variant="default"
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send WhatsApp
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => sendEventEmail((member as any).email!, member.full_name, selectedEventForNotification)}
                            variant="default"
                            size="sm"
                            disabled={sendingEmail === (member as any).email}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendingEmail === (member as any).email ? "Sending..." : "Send Email"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    {notificationChannel === "whatsapp"
                      ? "No members with WhatsApp numbers yet"
                      : "No members with email addresses yet"}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Events;