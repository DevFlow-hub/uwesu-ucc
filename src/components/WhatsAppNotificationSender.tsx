import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export const WhatsAppNotificationSender = () => {
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

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
  });

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  const generateWhatsAppMessage = () => {
    if (!selectedEvent) return "";
    
    const eventDate = new Date(selectedEvent.event_date);
    const dateStr = format(eventDate, "MMMM d, yyyy");
    const timeStr = format(eventDate, "h:mm a");

    return `📅 UNION EVENT (UWESU-UCC)

${selectedEvent.title}

📅 Date: ${dateStr}
⏰ Time: ${timeStr}
📍 Venue: ${selectedEvent.venue || 'Venue TBA'}
📝 Purpose: ${selectedEvent.description || 'Event details coming soon.'}`;
  };

  const openWhatsApp = (whatsappNumber: string, countryCode: string) => {
    if (!selectedEventId) {
      toast.error("Please select an event first");
      return;
    }

    const message = generateWhatsAppMessage();
    // Remove any spaces or special characters from the phone number
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const fullNumber = `${countryCode}${cleanNumber}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Send WhatsApp Notifications</CardTitle>
          </div>
          <CardDescription>
            Select an event and send personalized WhatsApp messages to members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Event</label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event to announce" />
              </SelectTrigger>
              <SelectContent>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {new Date(event.event_date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEvent && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Message Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {generateWhatsAppMessage()}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle>Members ({members?.length || 0})</CardTitle>
            <CardDescription>
              Click "Send WhatsApp" to open WhatsApp with the pre-filled message
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members && members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.country_code} {member.whatsapp_number}
                      </p>
                    </div>
                    <Button
                      onClick={() => openWhatsApp(member.whatsapp_number!, member.country_code!)}
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
              <p className="text-center text-muted-foreground py-8">
                No members with WhatsApp numbers yet
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};