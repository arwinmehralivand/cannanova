/* ==========================================================================
   CannaNova Worker — serves the static site and one small data endpoint.

   /livebestand.json  The shop's current stock, fetched server-side and served
                      from our own domain. Browser privacy extensions often
                      block cross-site requests to another domain's /api/, so
                      the page reads this first-party copy instead.
   everything else    Static files (HTML, CSS, JS, images) via env.ASSETS.
   ========================================================================== */

const UPSTREAM =
  "https://shop.cannanova-langen.de/api/shop/v1/pharmacy-shop/products?sort=newest&pageSize=100&page=1";
const CACHE_SECONDS = 60;

async function livebestand() {
  try {
    const res = await fetch(UPSTREAM, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    });
    if (!res.ok) throw new Error(`upstream HTTP ${res.status}`);
    return new Response(res.body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": `public, max-age=${CACHE_SECONDS}`,
      },
    });
  } catch (err) {
    console.error("[livebestand]", err);
    return new Response(JSON.stringify({ error: "upstream_unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/livebestand.json") return livebestand();
    return env.ASSETS.fetch(request);
  },
};
