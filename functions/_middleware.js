/**
 * Cloudflare Pages middleware — © 2026 CCC Studio
 * 301 www.openmdfile.com → https://openmdfile.com (preserve path + query)
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.openmdfile.com') {
    url.hostname = 'openmdfile.com';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
