/**
 * HTTP Security Headers - PontoCerto Security Module
 *
 * Sets essential security headers for every response.
 *
 * CSP NOTE: For production, consider implementing a nonce-based CSP by
 * generating a random nonce per request in boot.ts middleware and passing
 * it to the HTML template. This would allow removing 'unsafe-inline' from
 * script-src and style-src directives.
 */

const ALLOWED_ORIGINS = [
  "https://pontocerto.pages.dev",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8788",
];

export function getSecurityHeaders(
  req: Request
): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",

    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",

    "Referrer-Policy": "strict-origin-when-cross-origin",

    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://pontocerto.pages.dev",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),

    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
        "Content-Length": "0",
      },
    });
  }
  return null;
}
