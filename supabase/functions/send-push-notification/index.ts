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


// Encrypt payload for web push using aes128gcm
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; publicKey: Uint8Array }> {
  // Generate ephemeral key pair
  const ephemeralKey = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Import user's public key
  const p256dhBytes = base64UrlToUint8Array(p256dh);
  const userPublicKey = await crypto.subtle.importKey(
    'raw',
    p256dhBytes.buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userPublicKey },
    ephemeralKey.privateKey,
    256
  );
  
  // Import auth secret
  const authSecret = base64UrlToUint8Array(auth);
  
  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive PRK
  const prkInfoBuf = new TextEncoder().encode('WebPush: info\x00');
  const prkInfo = new Uint8Array(prkInfoBuf.length + authSecret.length + new Uint8Array(sharedSecret).length);
  prkInfo.set(prkInfoBuf);
  prkInfo.set(authSecret, prkInfoBuf.length);
  prkInfo.set(new Uint8Array(sharedSecret), prkInfoBuf.length + authSecret.length);
  
  const importedAuth = await crypto.subtle.importKey(
    'raw',
    authSecret.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const prk = await crypto.subtle.sign(
    'HMAC',
    importedAuth,
    new Uint8Array(sharedSecret)
  );
  
  // Derive content encryption key
  const cekInfo = new TextEncoder().encode('Content-Encoding: aes128gcm\x00');
  const cekHkdf = new Uint8Array(cekInfo.length + 1);
  cekHkdf.set(cekInfo);
  cekHkdf[cekInfo.length] = 1;
  
  const importedPrk = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(prk),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const cek = await crypto.subtle.sign('HMAC', importedPrk, cekHkdf);
  const contentEncryptionKey = new Uint8Array(cek).slice(0, 16);
  
  // Derive nonce
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\x00');
  const nonceHkdf = new Uint8Array(nonceInfo.length + 1);
  nonceHkdf.set(nonceInfo);
  nonceHkdf[nonceInfo.length] = 1;
  
  const nonceKey = await crypto.subtle.sign('HMAC', importedPrk, nonceHkdf);
  const nonce = new Uint8Array(nonceKey).slice(0, 12);
  
  // Prepare plaintext with padding
  const paddingLength = 0;
  const plaintext = new Uint8Array(2 + paddingLength + new TextEncoder().encode(payload).length);
  const view = new DataView(plaintext.buffer);
  view.setUint16(0, paddingLength, false);
  plaintext.set(new TextEncoder().encode(payload), 2 + paddingLength);
  
  // Encrypt
  const importedKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    importedKey,
    plaintext
  );
  
  // Export ephemeral public key
  const rawPublicKey = await crypto.subtle.exportKey('raw', ephemeralKey.publicKey);
  
  return {
    ciphertext: new Uint8Array(ciphertext),
    salt,
    publicKey: new Uint8Array(rawPublicKey)
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
    
    // Encrypt the payload
    const payloadString = JSON.stringify(payload);
    const { ciphertext, salt, publicKey } = await encryptPayload(
      payloadString,
      subscription.keys.p256dh,
      subscription.keys.auth
    );
    
    // Construct the body with salt and public key
    const body = new Uint8Array(salt.length + 4 + 1 + publicKey.length + ciphertext.length);
    let offset = 0;
    
    // Add salt
    body.set(salt, offset);
    offset += salt.length;
    
    // Add record size (4096)
    const recordSize = new DataView(body.buffer);
    recordSize.setUint32(offset, 4096, false);
    offset += 4;
    
    // Add public key length
    body[offset] = publicKey.length;
    offset += 1;
    
    // Add public key
    body.set(publicKey, offset);
    offset += publicKey.length;
    
    // Add ciphertext
    body.set(ciphertext, offset);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body,
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
