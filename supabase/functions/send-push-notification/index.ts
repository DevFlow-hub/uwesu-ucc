import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push requires VAPID keys - generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
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

  // Create the notification payload
  const notificationPayload = JSON.stringify(payload);

  // In production, use a proper web-push library
  // For now, we'll just log it
  console.log('Would send push notification:', {
    subscription,
    payload: notificationPayload
  });

  // TODO: Implement actual web push using web-push library
  // const webpush = require('web-push');
  // webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  // await webpush.sendNotification(subscription, notificationPayload);
  
  return true;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
