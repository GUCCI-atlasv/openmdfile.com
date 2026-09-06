/**
 * GET /geo  — returns the visitor's country as seen by the Cloudflare edge.
 * Used only to preset the interface language on a first visit.
 * No IP address is read, stored or logged by us; the country code is not persisted.
 * © 2026 CCC Studio
 */
export function onRequest(context) {
  const req = context.request;
  const country =
    req.headers.get('CF-IPCountry') ||
    (req.cf && req.cf.country) ||
    'XX';
  return new Response(JSON.stringify({ country }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  });
}
