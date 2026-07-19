import type { VercelResponse } from '@vercel/node';

export function applyHtmlSecurityHeaders(res: VercelResponse, cacheControl = 'no-store'): void {
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' https://quickchart.io data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}
