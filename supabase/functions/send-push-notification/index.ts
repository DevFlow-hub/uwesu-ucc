import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VAPID keys for web push
const VAPID_PUBLIC_KEY = 'BJRcTOeWpTqbceWrwiaBWtcD8tIXHvpj3pKka16ccIUSdmisTkev8tScwZNdN4d1dsL0soZqUh85EFSliKfwb1Y';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = 'mailto:admin@unionengage.com';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

interface SendPushRequest {
  userIds?: string[];
  payload: PushPayload;
}


async function sendPushToSubscription(subscription: any, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured');
  }
  
  try {
    console.log('Sending push notification');
    console.log('Subscription:', JSON.stringify(subscription));
    console.log('Payload:', JSON.stringify(payload));
    
    // Configure web-push with VAPID keys
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    
    // Send notification using web-push library
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    
    console.log('Push notification sent successfully:', result.statusCode);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a client with the user's auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Check if user has admin role
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });
    
    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    const { userIds, payload }: SendPushRequest = await req.json();

    if (!payload || !payload.title) {
      throw new Error('Missing required fields: payload with title');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch push subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    
    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      throw new Error('Failed to fetch subscriptions');
    }

    let successCount = 0;
    let errorCount = 0;

    // Send push notifications
    for (const sub of subscriptions || []) {
      try {
        await sendPushToSubscription(sub.subscription, payload);
        successCount++;
      } catch (error) {
        console.error('Failed to send push to subscription:', error);
        errorCount++;
      }
    }

    console.log(`Push notifications sent: ${successCount} successful, ${errorCount} failed`);

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
    console.error('Error in send-push-notification function:', error);
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
