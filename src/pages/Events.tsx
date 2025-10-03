import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

const Events = () => {
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
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
    </div>
  );
};

export default Events;