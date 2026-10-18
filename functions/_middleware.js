// Cloudflare Pages Function: live reverse proxy for the main public website.
// This is NOT a complete proxy for authenticated apps or other subdomains.
const ORIGIN = 'https://geagroupau.com';

export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const upstream = new URL(incoming.pathname + incoming.search, ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete('host');
  // Do not forward browser cookies for the mirror host to the upstream domain.
  headers.delete('cookie');
  headers.delete('authorization');
  const method = request.method;
  const response = await fetch(upstream.toString(), {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
    redirect: 'manual'
  });
  const outputHeaders = new Headers(response.headers);
  // Prevent origin-domain cookies being set on the mirror host.
  outputHeaders.delete('set-cookie');
  const location = outputHeaders.get('location');
  if (location) {
    const resolved = new URL(location, upstream);
    if (resolved.origin === ORIGIN) {
      resolved.protocol = incoming.protocol;
      resolved.host = incoming.host;
      outputHeaders.set('location', resolved.toString());
    }
  }
  // Avoid embedding this mirror in third-party frames.
  outputHeaders.set('x-content-type-options', 'nosniff');
  return new Response(response.body, { status: response.status, headers: outputHeaders });
}
