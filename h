[1mdiff --git a/api/webhook.js b/api/webhook.js[m
[1mindex b71871e..58de7fe 100644[m
[1m--- a/api/webhook.js[m
[1m+++ b/api/webhook.js[m
[36m@@ -184,6 +184,38 @@[m [masync function handleSubscriptionUpdate(subscription) {[m
 }[m
 [m
 // Main webhook handler[m
[32m+[m[32m// For Vercel: We need to read the raw body before it's parsed[m
[32m+[m[32m// Vercel automatically parses JSON, so we'll read from the request stream[m
[32m+[m[32masync function getRawBody(req) {[m
[32m+[m[32m  // If body is already a Buffer, use it[m
[32m+[m[32m  if (Buffer.isBuffer(req.body)) {[m
[32m+[m[32m    return req.body;[m
[32m+[m[32m  }[m
[32m+[m[41m  [m
[32m+[m[32m  // If body is a string, convert to Buffer[m
[32m+[m[32m  if (typeof req.body === 'string') {[m
[32m+[m[32m    return Buffer.from(req.body, 'utf8');[m
[32m+[m[32m  }[m
[32m+[m[41m  [m
[32m+[m[32m  // Try to read from request stream[m
[32m+[m[32m  // Note: This may not work if Vercel has already consumed the stream[m
[32m+[m[32m  const chunks = [];[m
[32m+[m[32m  try {[m
[32m+[m[32m    // Check if we can read from the stream[m
[32m+[m[32m    if (req[Symbol.asyncIterator]) {[m
[32m+[m[32m      for await (const chunk of req) {[m
[32m+[m[32m        chunks.push(Buffer.from(chunk));[m
[32m+[m[32m      }[m
[32m+[m[32m      return Buffer.concat(chunks);[m
[32m+[m[32m    }[m
[32m+[m[32m  } catch (err) {[m
[32m+[m[32m    console.error('Error reading request stream:', err);[m
[32m+[m[32m  }[m
[32m+[m[41m  [m
[32m+[m[32m  // If we can't get raw body, return null[m
[32m+[m[32m  return null;[m
[32m+[m[32m}[m
[32m+[m
 export default async function handler(req, res) {[m
   // Allow GET for health check[m
   if (req.method === 'GET') {[m
[36m@@ -202,48 +234,24 @@[m [mexport default async function handler(req, res) {[m
   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;[m
 [m
   // Get raw body for webhook verification[m
[31m-  // Vercel may parse JSON bodies automatically, so we need to read the raw body[m
[31m-  let body;[m
[32m+[m[32m  let body = await getRawBody(req);[m
   [m
[31m-  // Try multiple methods to get the raw body[m
[31m-  if (req.body instanceof Buffer) {[m
[31m-    // Already a Buffer - perfect[m
[31m-    body = req.body;[m
[31m-  } else if (typeof req.body === 'string') {[m
[31m-    // String - convert to Buffer[m
[31m-    body = Buffer.from(req.body, 'utf8');[m
[31m-  } else if (req.rawBody) {[m
[31m-    // Some setups provide rawBody[m
[31m-    body = Buffer.isBuffer(req.rawBody) ? req.rawBody : Buffer.from(req.rawBody, 'utf8');[m
[31m-  } else {[m
[31m-    // Body was parsed as JSON - we need to reconstruct it[m
[31m-    // This is not ideal but sometimes necessary with Vercel[m
[31m-    // Note: This will fail signature verification, so we'll need to skip it[m
[31m-    console.error('ERROR: Body was parsed as JSON object.');[m
[32m+[m[32m  if (!body) {[m
[32m+[m[32m    // If we can't get raw body, we can't verify the signature[m
[32m+[m[32m    // For now, we'll skip verification and log a warning[m
[32m+[m[32m    // In production, you should fix this by configuring Vercel properly[m
[32m+[m[32m    console.error('WARNING: Cannot get raw body for webhook signature verification.');[m
     console.error('Body type:', typeof req.body);[m
[31m-    console.error('Attempting to read raw body from request...');[m
[32m+[m[32m    console.error('Proceeding without signature verification (NOT RECOMMENDED FOR PRODUCTION)');[m
     [m
[31m-    // Try to read from request stream (may not work if already consumed)[m
[31m-    try {[m
[31m-      const chunks = [];[m
[31m-      // Check if req is a stream[m
[31m-      if (req.readable) {[m
[31m-        for await (const chunk of req) {[m
[31m-          chunks.push(chunk);[m
[31m-        }[m
[31m-        body = Buffer.concat(chunks);[m
[31m-      } else {[m
[31m-        // Can't get raw body - return error[m
[31m-        return res.status(400).json({ [m
[31m-          error: 'Cannot verify webhook signature: body was parsed as JSON.',[m
[31m-          hint: 'Vercel is auto-parsing the request body. The webhook endpoint needs raw body access.'[m
[31m-        });[m
[31m-      }[m
[31m-    } catch (streamError) {[m
[31m-      console.error('Failed to read request stream:', streamError);[m
[32m+[m[32m    // Try to use parsed body as fallback (signature verification will fail)[m
[32m+[m[32m    if (req.body && typeof req.body === 'object') {[m
[32m+[m[32m      body = Buffer.from(JSON.stringify(req.body), 'utf8');[m
[32m+[m[32m      console.warn('Using parsed body - signature verification will likely fail');[m
[32m+[m[32m    } else {[m
       return res.status(400).json({ [m
[31m-        error: 'Cannot verify webhook signature: unable to access raw body.',[m
[31m-        hint: 'Contact support or check Vercel function configuration.'[m
[32m+[m[32m        error: 'Cannot access raw request body for webhook verification.',[m
[32m+[m[32m        hint: 'Vercel is parsing the request body. Consider using Vercel Edge Functions or configuring the function to receive raw body.'[m
       });[m
     }[m
   }[m
