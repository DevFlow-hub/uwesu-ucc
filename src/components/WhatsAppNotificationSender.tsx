import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const WhatsAppNotificationSender = () => {
  const [message, setMessage] = useState<string>("");

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

  const openWhatsApp = (whatsappNumber: string, countryCode: string) => {
    if (!message.trim()) {
      toast.error("Please enter a message first");
      return;
    }

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
            Compose a message and send it to members via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here... (e.g., Welcome to UWESU-UCC, event announcements, important notices)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          {message.trim() && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Message Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {message}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {message.trim() && (
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