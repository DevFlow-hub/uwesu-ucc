import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all upcoming events
    const now = new Date();

    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', now.toISOString())
      .order('event_date', { ascending: true });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} upcoming events`);

    // Get all profiles with phone numbers
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .not('phone', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles with phone numbers`);

    let sentCount = 0;
    const errors: any[] = [];

    // Send SMS for each event to each user
    for (const event of upcomingEvents || []) {
      const eventDate = new Date(event.event_date);
      const formattedDate = eventDate.toLocaleDateString();
      const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const message = `Event Reminder: "${event.title}" is scheduled for ${formattedDate} at ${formattedTime}. Venue: ${event.venue || 'TBA'}`;

      for (const profile of profiles || []) {
        try {
          const smsResponse = await supabase.functions.invoke('send-sms', {
            body: {
              to: profile.phone,
              message: message
            }
          });

          if (smsResponse.error) {
            console.error(`Failed to send SMS to ${profile.phone}:`, smsResponse.error);
            errors.push({ phone: profile.phone, error: smsResponse.error });
          } else {
            sentCount++;
            console.log(`SMS sent to ${profile.phone}`);
          }
        } catch (error: any) {
          console.error(`Exception sending SMS to ${profile.phone}:`, error);
          errors.push({ phone: profile.phone, error: error.message });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventCount: upcomingEvents?.length || 0,
        recipientCount: profiles?.length || 0,
        sentCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in event-reminders function:', error);
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
