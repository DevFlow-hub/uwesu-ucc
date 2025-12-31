import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ExternalLink, Mail, Send, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const WhatsAppNotificationSender = () => {
  const [message, setMessage] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailPreview, setEmailPreview] = useState<string>("");
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<Set<string>>(new Set());
  const [lastEmailSentTime, setLastEmailSentTime] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: () => void;
    memberName: string;
    channel: "whatsapp" | "email";
  }>({ open: false, action: () => {}, memberName: "", channel: "whatsapp" });
  const [blockedDialog, setBlockedDialog] = useState<{
    open: boolean;
    memberName: string;
  }>({ open: false, memberName: "" });

  const EMAIL_COOLDOWN_MS = 10000; // 10 seconds between emails

  const { data: whatsappMembers } = useQuery({
    queryKey: ["members-with-whatsapp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, whatsapp_number, country_code, blocked, user_id")
        .not("whatsapp_number", "is", null)
        .not("user_id", "is", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: emailMembers } = useQuery({
    queryKey: ["members-with-email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, blocked, user_id")
        .not("email", "is", null)
        .not("user_id", "is", null)
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const openWhatsApp = (whatsappNumber: string, countryCode: string, memberName: string, isBlocked: boolean) => {
    if (isBlocked) {
      setBlockedDialog({ open: true, memberName });
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message first");
      return;
    }

    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    const fullNumber = `${countryCode}${cleanNumber}`;
    
    // DON'T encode the message - WhatsApp handles emojis natively
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success(`Opening WhatsApp for ${memberName}`);
  };

  const sendEmail = async (email: string, memberName: string, isBlocked: boolean) => {
    if (isBlocked) {
      setBlockedDialog({ open: true, memberName });
      return;
    }

    if (!message.trim() || !emailSubject.trim()) {
      toast.error("Please enter both subject and message");
      return;
    }

    // Check if already sent to this email in this session
    if (emailSentTo.has(email)) {
      toast.error(`Already sent to ${memberName}`, {
        description: "You've already sent an email to this person. Refresh the page to send again."
      });
      return;
    }

    // Check cooldown period
    const now = Date.now();
    const timeSinceLastEmail = now - lastEmailSentTime;
    if (timeSinceLastEmail < EMAIL_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((EMAIL_COOLDOWN_MS - timeSinceLastEmail) / 1000);
      toast.error("⏳ Please wait", {
        description: `Wait ${remainingSeconds} seconds before sending another email`
      });
      return;
    }

    setSendingEmail(email);
    try {
      const emailBody = emailPreview || message;
      
      // Convert plain text line breaks to HTML
      const htmlBody = emailBody.replace(/\n/g, '<br>');
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 0.5px; white-space: nowrap;">UWESU-UCC</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">Union Administration</p>
              </div>
              <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="color: #333; line-height: 1.8; font-size: 16px;">${htmlBody}</p>
              </div>
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 12px; margin: 0;">
                  This message was sent from UWESU-UCC Union Administration
                </p>
              </div>
            </div>
          `,
        },
      });

      if (error) throw error;
      
      // Mark as sent and update cooldown
      setEmailSentTo(prev => new Set([...prev, email]));
      setLastEmailSentTime(now);
      
      toast.success(`✅ Email sent to ${memberName}`);
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error("Failed to send email", {
        description: error.message || `Cannot send email to ${memberName}`
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const members = channel === "whatsapp" ? whatsappMembers : emailMembers;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Notifications</CardTitle>
          <CardDescription>
            Choose a channel and compose your message to members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={channel} onValueChange={(v) => setChannel(v as "whatsapp" | "email")}>
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

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder={channel === "whatsapp" 
                ? "Type your WhatsApp message here..." 
                : "Type your email message here..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
              {channel === "whatsapp" }
            </p>
          </div>

          {message.trim() && (channel === "email" ? emailSubject.trim() : true) && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Message Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {channel === "email" && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Subject:</p>
                    <p className="text-sm font-medium">{emailSubject}</p>
                  </div>
                )}
                <div>
                  {channel === "email" && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="email-preview" className="text-xs font-semibold">
                          Email Body (Click to edit)
                        </Label>
                        <Textarea
                          id="email-preview"
                          value={emailPreview || message}
                          onChange={(e) => setEmailPreview(e.target.value)}
                          rows={6}
                          className="text-sm font-sans border-2 focus:border-primary"
                          placeholder="Edit email preview..."
                        />
                        <p className="text-xs text-muted-foreground italic">
                          You can edit the email body above before sending
                        </p>
                      </div>
                      {emailPreview && emailPreview !== message && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEmailPreview("")}
                          className="mt-2"
                        >
                          Reset to original
                        </Button>
                      )}
                    </>
                  )}
                  {channel === "whatsapp" && (
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {message}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spam Prevention Notice */}
          {channel === "email" && emailSentTo.size > 0 && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  📧 Emails sent this session: {emailSentTo.size}
                  <br />
                  <span className="text-xs">Refresh the page to reset and send again</span>
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {((message.trim() && (channel === "email" ? emailSubject.trim() : true)) || channel === "email") && (
        <Card>
          <CardHeader>
            <CardTitle>Members ({members?.length || 0})</CardTitle>
            <CardDescription>
              {channel === "whatsapp" 
                ? "Click to open WhatsApp with the pre-filled message" 
                : "Click to send email to each member"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members && members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => {
                  const isBlocked = (member as any).blocked;
                  const alreadySent = channel === "email" && emailSentTo.has((member as any).email);
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{member.full_name}</p>
                          {isBlocked && (
                            <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                              Blocked
                            </span>
                          )}
                          {alreadySent && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              ✓ Sent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {channel === "whatsapp" 
                            ? `${(member as any).country_code} ${(member as any).whatsapp_number}`
                            : (member as any).email}
                        </p>
                      </div>
                      {channel === "whatsapp" ? (
                        <Button
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              action: () => openWhatsApp(
                                (member as any).whatsapp_number!, 
                                (member as any).country_code!, 
                                member.full_name,
                                isBlocked
                              ),
                              memberName: member.full_name,
                              channel: "whatsapp"
                            });
                          }}
                          variant="default"
                          size="sm"
                          disabled={!message.trim()}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send WhatsApp
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              action: () => sendEmail((member as any).email!, member.full_name, isBlocked),
                              memberName: member.full_name,
                              channel: "email"
                            });
                          }}
                          variant={alreadySent ? "outline" : "default"}
                          size="sm"
                          disabled={sendingEmail === (member as any).email || !message.trim() || !emailSubject.trim() || alreadySent}
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
              <p className="text-center text-muted-foreground py-8">
                {channel === "whatsapp" 
                  ? "No members with WhatsApp numbers yet"
                  : "No members with email addresses yet"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Send</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send this {confirmDialog.channel === "whatsapp" ? "WhatsApp message" : "email"} to {confirmDialog.memberName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmDialog.action();
              setConfirmDialog({ ...confirmDialog, open: false });
            }}>
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={blockedDialog.open} onOpenChange={(open) => setBlockedDialog({ ...blockedDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              User Blocked
            </DialogTitle>
            <DialogDescription>
              Cannot send message to {blockedDialog.memberName} because this user is blocked. 
              Please unblock the user first if you want to send them messages.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setBlockedDialog({ ...blockedDialog, open: false })}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};