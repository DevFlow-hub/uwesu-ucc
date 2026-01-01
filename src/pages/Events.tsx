import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
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
  const [pastEventsLimit, setPastEventsLimit] = useState(5);
  
  const [emailsSentForEvent, setEmailsSentForEvent] = useState<Record<string, Set<string>>>(() => {
    const saved = localStorage.getItem('event_emails_sent');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        const result: Record<string, Set<string>> = {};
        Object.keys(data).forEach(key => {
          result[key] = new Set(data[key]);
        });
        return result;
      } catch (e) {
        return {};
      }
    }
    return {};
  });
  const [lastEmailSentTime, setLastEmailSentTime] = useState<number>(() => {
    const saved = localStorage.getItem('event_last_email_time');
    return saved ? parseInt(saved) : 0;
  });
  
  const EMAIL_COOLDOWN_MS = 5000;
  const queryClient = useQueryClient();

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
    queryKey: ["past-events", pastEventsLimit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .lt("event_date", new Date().toISOString())
        .order("event_date", { ascending: false })
        .limit(pastEventsLimit);
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
        .not("user_id", "is", null)
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
        .not("user_id", "is", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

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

    return "*UWESU-UCC Event Alert*\n\n" +
      "*" + event.title + "*\n\n" +
      "Date: " + dateStr + "\n" +
      "Time: " + timeStr + "\n" +
      "Venue: " + (event.venue || 'Venue TBA') + "\n" +
      "Details: " + (event.description || 'Event details coming soon.') + "\n\n" +
      "_See you there!_";
  };

  const generateEmailPreview = (event: any) => {
    if (!event) return "";
    
    const eventDate = new Date(event.event_date);
    const dateStr = format(eventDate, "MMMM d, yyyy");
    const timeStr = format(eventDate, "h:mm a");

    return "UWESU-UCC Event Alert\n\n" +
      event.title + "\n\n" +
      "Date: " + dateStr + "\n" +
      "Time: " + timeStr + "\n" +
      "Venue: " + (event.venue || 'Venue TBA') + "\n" +
      "Details: " + (event.description || 'Event details coming soon.') + "\n\n" +
      "See you there!\n\n" +
      "Note: Professional HTML email with emojis and styling will be sent.";
  };

  const openWhatsApp = (whatsappNumber: string, countryCode: string, event: any) => {
    const message = generateWhatsAppMessage(event);
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const fullNumber = countryCode + cleanNumber;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = 'https://wa.me/' + fullNumber + '?text=' + encodedMessage;
    
    window.open(whatsappUrl, '_blank');
    toast.success("Opening WhatsApp!");
  };

  const sendEventEmail = async (email: string, memberName: string, event: any) => {
    console.log('sendEventEmail called with:', { email, memberName, eventTitle: event?.title });
    
    if (!email) {
      toast.error('No email address provided');
      return;
    }

    const eventId = event.id;
    
    if (emailsSentForEvent[eventId]?.has(email)) {
      toast.error('Already sent to ' + memberName, {
        description: "You've already notified this person about this event",
        duration: 5000
      });
      console.log('Email spam prevented: ' + email + ' already notified for event ' + eventId);
      return;
    }

    const now = Date.now();
    const timeSinceLastEmail = now - lastEmailSentTime;
    if (lastEmailSentTime > 0 && timeSinceLastEmail < EMAIL_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((EMAIL_COOLDOWN_MS - timeSinceLastEmail) / 1000);
      toast.error("Please wait", {
        description: 'Wait ' + remainingSeconds + ' seconds before sending another email',
        duration: 3000
      });
      console.log('Cooldown active: ' + remainingSeconds + 's remaining');
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
          subject: 'Upcoming Event: ' + event.title,
          html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
            '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">' +
            '<h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 0.5px; white-space: nowrap;">UWESU-UCC</h1>' +
            '<p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">Event Notification</p>' +
            '</div>' +
            '<div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">' +
            '<h2 style="color: #333; margin-top: 0; font-size: 24px;">' + event.title + '</h2>' +
            '<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">' +
            '<p style="margin: 10px 0; color: #555; font-size: 16px;"><strong style="color: #667eea;">📅 Date:</strong> ' + dateStr + '</p>' +
            '<p style="margin: 10px 0; color: #555; font-size: 16px;"><strong style="color: #667eea;">⏰ Time:</strong> ' + timeStr + '</p>' +
            '<p style="margin: 10px 0; color: #555; font-size: 16px;"><strong style="color: #667eea;">📍 Venue:</strong> ' + (event.venue || 'Venue TBA') + '</p>' +
            '</div>' +
            (event.description ? '<div style="margin: 20px 0;"><h3 style="color: #333; font-size: 18px;">📝 Event Details:</h3><p style="color: #555; line-height: 1.6; font-size: 15px;">' + event.description + '</p></div>' : '') +
            '<div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">' +
            '<p style="color: #1976d2; margin: 0; font-size: 16px;">👋 See you there!</p>' +
            '</div>' +
            '<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">' +
            '<p style="color: #666; font-size: 12px; margin: 0;">This event notification was sent from UWESU-UCC Administration</p>' +
            '</div>' +
            '</div>' +
            '</div>',
        },
      });

      console.log('Email function response:', { data, error });

      if (error) {
        console.error('Email function error:', error);
        throw error;
      }

      const newSentEmails = {
        ...emailsSentForEvent,
        [eventId]: new Set([...(emailsSentForEvent[eventId] || []), email])
      };
      setEmailsSentForEvent(newSentEmails);
      setLastEmailSentTime(now);

      const toSave: Record<string, string[]> = {};
      Object.keys(newSentEmails).forEach(key => {
        toSave[key] = Array.from(newSentEmails[key]);
      });
      localStorage.setItem('event_emails_sent', JSON.stringify(toSave));
      localStorage.setItem('event_last_email_time', now.toString());
      
      toast.success('Email sent successfully to ' + memberName, {
        description: "Cannot send to this person again for this event",
        duration: 3000
      });
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email: ' + (error.message || 'Unknown error'));
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

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading events...</p>
          ) : events && events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{event.title}</CardTitle>
                        <CardDescription className="mt-1">{event.description}</CardDescription>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedEventForNotification(event);
                              setNotificationChannel("whatsapp");
                            }}
                            className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Notify
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(event.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-110 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 rounded-lg border-2 border-primary/20">
                      <EventCountdown eventDate={event.event_date} />
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group/item">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover/item:bg-primary/20 transition-colors">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{format(new Date(event.event_date), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group/item">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover/item:bg-primary/20 transition-colors">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{format(new Date(event.event_date), "h:mm a")}</span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group/item">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover/item:bg-primary/20 transition-colors">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{event.venue}</span>
                        </div>
                      )}
                    </div>
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

        {pastEvents && pastEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Past Events</h2>
            <div className="grid gap-4">
              {pastEvents.map((event) => (
                <Card key={event.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.event_date), "MMM d, yyyy")}
                        </span>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(event.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            
            {pastEvents.length >= pastEventsLimit && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setPastEventsLimit(prev => prev + 5)}
                  className="min-w-[200px]"
                >
                  See More Past Events
                </Button>
              </div>
            )}
            
            {pastEventsLimit > 5 && (
              <div className="mt-2 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setPastEventsLimit(5)}
                  className="text-sm"
                >
                  Show Less
                </Button>
              </div>
            )}
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
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {notificationChannel === "whatsapp" 
                      ? generateWhatsAppMessage(selectedEventForNotification)
                      : generateEmailPreview(selectedEventForNotification)
                    }
                  </pre>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold">Members ({members?.length || 0})</h3>
                {members && members.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {members.map((member) => {
                      const eventId = selectedEventForNotification.id;
                      const alreadySent = notificationChannel === "email" && emailsSentForEvent[eventId]?.has((member as any).email);
                      
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{member.full_name}</p>
                              {alreadySent && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Sent
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {notificationChannel === "whatsapp"
                                ? (member as any).country_code + ' ' + (member as any).whatsapp_number
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
                              variant={alreadySent ? "outline" : "default"}
                              size="sm"
                              disabled={sendingEmail === (member as any).email || alreadySent}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {sendingEmail === (member as any).email ? "Sending..." : alreadySent ? "Already Sent" : "Send Email"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
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
      <BackToTop />
    </div>
  );
};

export default Events;