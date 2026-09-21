// Vercel Edge Middleware — geo block.
//
// Sacred Sampling Solutions ships within the United States only. This blocks
// requests from countries in BLOCKED before they reach any page or API route.
// Vercel sets the visitor's country in the `x-vercel-ip-country` header (an
// ISO-3166-1 alpha-2 code) and overwrites any client-supplied value, so it
// can't be spoofed. Add or remove ISO codes in BLOCKED to adjust.

export const config = {
  // Run on everything except Vercel's internal assets.
  matcher: '/((?!_vercel/).*)',
};

var BLOCKED = ['NG']; // NG = Nigeria

export default function middleware(request) {
  var country = request.headers.get('x-vercel-ip-country') || '';
  if (BLOCKED.indexOf(country) !== -1) {
    return new Response(
      'Sacred Sampling Solutions is available to visitors in the United States only.',
      { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } }
    );
  }
  // Not blocked → let the request continue to the static site.
}
