import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// Helper to convert base64url to Uint8Array
function base64UrlToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Helper to convert Uint8Array to base64url
function uint8ArrayToBase64Url(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create VAPID JWT token
async function createVapidAuthToken(endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };
  
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: VAPID_SUBJECT
  };
  
  const encodedHeader = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  
  const publicKeyBytes = base64UrlToUint8Array(VAPID_PUBLIC_KEY);
  const privateKeyBytes = base64UrlToUint8Array(VAPID_PRIVATE_KEY!);
  
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33)),
    y: uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65)),
    d: uint8ArrayToBase64Url(privateKeyBytes),
  };
  
  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  
  const encodedSignature = uint8ArrayToBase64Url(new Uint8Array(signature));
  return `${unsignedToken}.${encodedSignature}`;
}

// Encrypt payload using Web Push encryption protocol
async function encryptPayload(
  payload: string,
  userPublicKey: string,
  userAuth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; publicKey: Uint8Array }> {
  const payloadBytes = new TextEncoder().encode(payload);
  
  // Generate local key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Import user's public key
  const userPublicKeyBytes = base64UrlToUint8Array(userPublicKey);
  const importedUserPublicKey = await crypto.subtle.importKey(
    'raw',
    userPublicKeyBytes as BufferSource,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
  
  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: importedUserPublicKey },
    localKeyPair.privateKey,
    256
  );
  
  // Export local public key
  const localPublicKey = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKeyBytes = new Uint8Array(localPublicKey);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Import auth secret
  const authBytes = base64UrlToUint8Array(userAuth);
  
  // Create PRK (Pseudo-Random Key)
  const authSecret = await crypto.subtle.importKey(
    'raw',
    authBytes as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const ikm = new Uint8Array(await crypto.subtle.sign('HMAC', authSecret, new Uint8Array(sharedSecret)));
  
  // Derive encryption key and nonce
  const info = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const saltKey = await crypto.subtle.importKey(
    'raw',
    salt as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', saltKey, ikm));
  
  // Import PRK for HKDF
  const prkKey = await crypto.subtle.importKey(
    'raw',
    prk as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Derive CEK (Content Encryption Key)
  const cekInfo = new Uint8Array([...info, 1]);
  const cek = new Uint8Array((await crypto.subtle.sign('HMAC', prkKey, cekInfo)).slice(0, 16));
  
  // Derive nonce
  const nonceInfo = new Uint8Array([...new TextEncoder().encode('Content-Encoding: nonce\0'), 1]);
  const nonce = new Uint8Array((await crypto.subtle.sign('HMAC', prkKey, nonceInfo)).slice(0, 12));
  
  // Import CEK for AES-GCM
  const cekCryptoKey = await crypto.subtle.importKey(
    'raw',
    cek as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Add padding
  const paddingLength = 0;
  const paddedPayload = new Uint8Array(2 + paddingLength + payloadBytes.length);
  paddedPayload[0] = paddingLength >> 8;
  paddedPayload[1] = paddingLength & 0xff;
  paddedPayload.set(payloadBytes, 2 + paddingLength);
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    cekCryptoKey,
    paddedPayload
  );
  
  return {
    ciphertext: new Uint8Array(ciphertext),
    salt,
    publicKey: localPublicKeyBytes
  };
}

async function sendPushToSubscription(subscription: any, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID keys not configured');
  }
  
  try {
    const endpoint = subscription.endpoint;
    console.log('Sending push to:', endpoint);
    console.log('Payload:', JSON.stringify(payload));
    
    const vapidToken = await createVapidAuthToken(endpoint);
    const payloadString = JSON.stringify(payload);
    
    // Encrypt the payload
    const { ciphertext, salt, publicKey } = await encryptPayload(
      payloadString,
      subscription.keys.p256dh,
      subscription.keys.auth
    );
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Encoding': 'aes128gcm',
        'Encryption': `salt=${uint8ArrayToBase64Url(salt)}`,
        'Crypto-Key': `dh=${uint8ArrayToBase64Url(publicKey)};p256ecdsa=${VAPID_PUBLIC_KEY}`,
        'TTL': '86400',
      },
      body: ciphertext as BodyInit,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Push failed:', response.status, errorText);
      throw new Error(`Push failed: ${response.status}`);
    }

    console.log('Push sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending push:', error);
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
