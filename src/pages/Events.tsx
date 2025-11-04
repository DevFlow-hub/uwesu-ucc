import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Trash2, MessageSquare, ExternalLink } from "lucide-react";
import { format } from "date-fns";
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEventForWhatsApp, setSelectedEventForWhatsApp] = useState<any | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      setIsAdmin(!!data);
    };

    checkAdmin();
  }, []);

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

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete);
      setEventToDelete(null);
    }
  };

  const { data: members } = useQuery({
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

  const generateWhatsAppMessage = (event: any) => {
    if (!event) return "";
    
    const eventDate = new Date(event.event_date);
    const dateStr = eventDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = eventDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    return `📅 UNION EVENT

${event.title}
${dateStr} • ${timeStr}
${event.venue || 'Venue TBA'}

${event.description || 'Event details coming soon.'}`;
  };

  const openWhatsApp = (whatsappNumber: string, countryCode: string, event: any) => {
    const message = generateWhatsAppMessage(event);
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const fullNumber = `${countryCode}${cleanNumber}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Union Events</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay updated with our upcoming meetings, elections, and activities
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
                            onClick={() => setSelectedEventForWhatsApp(event)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send WhatsApp
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

      <AlertDialog open={!!selectedEventForWhatsApp} onOpenChange={() => setSelectedEventForWhatsApp(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Send WhatsApp Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Click "Send WhatsApp" for each member to open WhatsApp with a pre-filled message about this event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedEventForWhatsApp && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Message Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {generateWhatsAppMessage(selectedEventForWhatsApp)}
                  </pre>
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
                            {member.country_code} {member.whatsapp_number}
                          </p>
                        </div>
                        <Button
                          onClick={() => openWhatsApp(member.whatsapp_number!, member.country_code!, selectedEventForWhatsApp)}
                          variant="default"
                          size="sm"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send WhatsApp
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    No members with WhatsApp numbers yet
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