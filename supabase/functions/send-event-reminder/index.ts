import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendReminderRequest {
  eventId: string;
  method: 'email' | 'push';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (roleError || !isAdmin) {
      console.error('Authorization error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { eventId, method }: SendReminderRequest = await req.json();

    // Validate inputs
    if (!eventId || typeof eventId !== 'string') {
      throw new Error('Invalid eventId');
    }
    if (!method || !['email', 'push'].includes(method)) {
      throw new Error('Invalid method - must be email or push');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Fetch all users with emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .not('email', 'is', null);

    if (profilesError) {
      throw new Error('Failed to fetch user profiles');
    }

    let successCount = 0;
    let errorCount = 0;

    if (method === 'email') {
      // Send emails
      for (const profile of profiles || []) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: profile.email,
              subject: `Reminder: ${event.title}`,
              html: `
                <h1>Event Reminder</h1>
                <p>Hello ${profile.full_name || 'Member'},</p>
                <p>This is a reminder for the upcoming event:</p>
                <h2>${event.title}</h2>
                <p>${event.description || ''}</p>
                <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleString()}</p>
                ${event.venue ? `<p><strong>Venue:</strong> ${event.venue}</p>` : ''}
                <p>Looking forward to seeing you there!</p>
              `,
            },
          });

          if (emailError) {
            console.error('Failed to send email to', profile.email, emailError);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error sending email to', profile.email, error);
          errorCount++;
        }
      }
    } else {
      // Send push notifications
      const { data: subscriptions, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('*');

      if (subsError) {
        throw new Error('Failed to fetch push subscriptions');
      }

      // Call the push notification function
      const { data: pushResult, error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          payload: {
            title: `Event Reminder: ${event.title}`,
            body: `${event.description || 'Upcoming event'} - ${new Date(event.event_date).toLocaleString()}`,
            url: '/events'
          }
        }
      });

      if (pushError) {
        console.error('Failed to send push notifications:', pushError);
        errorCount = subscriptions?.length || 0;
      } else {
        successCount = pushResult?.sent || 0;
        errorCount = pushResult?.failed || 0;
      }
    }

    console.log(`Reminders sent: ${successCount} successful, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: errorCount 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in send-event-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
};

serve(handler);
