import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get ExpressTURN credentials
    const expressUsername = Deno.env.get('EXPRESS_TURN_USERNAME')
    const expressCredential = Deno.env.get('EXPRESS_TURN_CREDENTIAL')
    
    // 2. Get Metered.ca credentials
    const meteredUsername = Deno.env.get('METERED_TURN_USERNAME')
    const meteredCredential = Deno.env.get('METERED_TURN_CREDENTIAL')
    
    // 3. Build the ICE Servers array with STUN + Both TURN providers
    const iceServers = [
      // Free STUN
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
      },
      // Metered.ca (UDP and TCP on ports 80 and 443) - HIGH PRIORITY
      ...(meteredUsername && meteredCredential ? [
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: meteredUsername,
          credential: meteredCredential
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: meteredUsername,
          credential: meteredCredential
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: meteredUsername,
          credential: meteredCredential
        }
      ] : []),
      // ExpressTURN (UDP and TCP) - LOW PRIORITY FALLBACK
      ...(expressUsername && expressCredential ? [
        {
          urls: 'turn:free.expressturn.com:3478',
          username: expressUsername,
          credential: expressCredential
        },
        {
          urls: 'turn:free.expressturn.com:3478?transport=tcp',
          username: expressUsername,
          credential: expressCredential
        }
      ] : [])
    ]

    return new Response(
      JSON.stringify({ iceServers }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
