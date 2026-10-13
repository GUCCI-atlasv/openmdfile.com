/**
 * Cloudflare Pages middleware — © 2026 CCC Studio
 * 1) Internal repo files (docs, notes, logs, patches, backups, manifests, .git) are never served:
 *    Pages keeps serving files removed from a deployment for ~7 days, so hard-404 them here.
 * 2) One-hop canonical: any www.openmdfile.com or http:// request → 301 https://openmdfile.com + path + query.
 *    (If the zone's "Always Use HTTPS" fires first at the edge, http:// is upgraded before this runs.)
 * 3) The site is English-only; legacy ?lang= URLs 301 to the same path without that parameter
 *    (folded into the same hop as rule 2).
 */
const CANONICAL_HOST = 'openmdfile.com';

const INTERNAL_PATH = /^\/(?:docs|notes|backups?|patches|scripts|functions|node_modules|\.git|\.wrangler)(?:\/|$)|\.(?:md|markdown|log|bak|orig|patch|diff|swp|map|tgz|zip|tar|gz)$|^\/(?:package(?:-lock)?\.json|LICENSE(?:\.\w+)?|README(?:\.\w+)?|CHANGELOG(?:\.\w+)?|\.gitignore|\.env[^/]*|\.DS_Store|deploy-meta\.json|filelist\.txt|wrangler\.(?:toml|json|jsonc))$/i;

async function notFound(context, reqUrl) {
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' };
  try {
    const page = await context.env.ASSETS.fetch(new URL('/404', reqUrl.origin));
    if (page.ok) return new Response(page.body, { status: 404, headers });
  } catch (_) {}
  return new Response('Not found', { status: 404, headers });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  const wrongHost = host === 'www.' + CANONICAL_HOST || (host === CANONICAL_HOST && url.protocol === 'http:');
  const legacyLang = url.searchParams.has('lang');
  if (wrongHost || legacyLang) {
    if (wrongHost) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      url.port = '';
    }
    if (legacyLang) url.searchParams.delete('lang');
    return new Response(null, { status: 301, headers: { Location: url.toString(), 'Cache-Control': 'public, max-age=3600' } });
  }

  if (INTERNAL_PATH.test(url.pathname)) return notFound(context, url);

  return context.next();
}
