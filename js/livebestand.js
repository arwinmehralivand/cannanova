/* ==========================================================================
   Livebestand — fetches the most recent products from the pharmacy shop API
   and renders them into the #livebestand-grid on the landing page.

   Fully client-side: the static site calls the public shop API directly.
   The API resolves the pharmacy via the `x-pharmacy-id` header and supports
   `sort=newest` + `pageSize` to return the latest N items.
   ========================================================================== */

const CONFIG = {
  apiBase: "https://api-pharmacy.cannaflow.de/api/shop/v1",
  pharmacyId: "F2KR8J9Y2",
  count: 4,
};

// Map shop genetic enum -> human label + the accent color token used elsewhere.
const GENETIC = {
  indica: { label: "Indica", color: "var(--color-strain-indica)" },
  sativa: { label: "Sativa", color: "var(--color-strain-sativa)" },
  hybrid: { label: "Hybrid", color: "var(--color-strain-hybrid)" },
  "hybrid-indica-dominant": { label: "Hybrid · Indica-dominant", color: "var(--color-strain-indica)" },
  "hybrid-sativa-dominant": { label: "Hybrid · Sativa-dominant", color: "var(--color-strain-sativa)" },
};

const UNIT_LABEL = { grams: "g", milligrams: "mg", milliliters: "ml" };

const euro = (cent) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cent ?? 0) / 100);

// Escape user-supplied strings before inserting into markup.
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );

// Pick a reasonably sized responsive image; fall back to original/imageSrc.
function imageFor(product) {
  const responsive = product.images?.responsive;
  if (Array.isArray(responsive) && responsive.length) {
    const pick = responsive.find((r) => r.width >= 480) ?? responsive[responsive.length - 1];
    return pick.url;
  }
  return product.images?.original || product.imageSrc || null;
}

function productCard(p) {
  const genetic = GENETIC[p.genetic] ?? { label: p.genetic ?? "Sorte", color: "var(--color-brand)" };
  const unit = UNIT_LABEL[p.unit] ?? esc(p.unit ?? "");
  const img = imageFor(p);
  const alt = esc(`${p.name ?? "Produkt"} – ${p.manufacturer ?? ""}`.trim());
  // The shop itself lives at shop.cannanova-langen.de (provided by cannaflow.de);
  // this repo is only the landing page, so product links point at that storefront.
  const href = p.slug
    ? `https://shop.cannanova-langen.de/${encodeURIComponent(p.slug)}`
    : null;

  const media = img
    ? `<img src="${esc(img)}" alt="${alt}" width="480" height="360" loading="lazy">`
    : "";

  const card = `
    <article class="card product-card" style="--genetic-color: ${genetic.color};">
      <div class="product-card__media">${media}</div>
      <div class="product-card__body">
        <p class="product-card__meta">
          <span class="product-card__genetic">${esc(genetic.label)}</span>
          <span aria-hidden="true">·</span>
          <span>${esc(p.category ?? "")}</span>
        </p>
        <h3 class="product-card__name">${esc(p.name ?? "")}</h3>
        <p class="product-card__manufacturer">${esc(p.manufacturer ?? "")}${p.country ? " · " + esc(p.country) : ""}</p>
        <p class="product-card__stats">
          <span class="stat">THC <span>${esc(p.thc ?? "–")}%</span></span>
          <span class="stat">CBD <span>${esc(p.cbd ?? "–")}%</span></span>
        </p>
        <div class="product-card__foot">
          <span class="product-card__price">${euro(p.priceCent)}<span class="unit"> / ${unit}</span></span>
          ${href ? `<a class="link-arrow" href="${esc(href)}" rel="noopener">Im Shop</a>` : ""}
        </div>
      </div>
    </article>`;

  return card;
}

function skeletons(n) {
  const one = `
    <article class="card product-card product-card--skeleton" aria-hidden="true">
      <div class="product-card__media"></div>
      <div class="product-card__body">
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-90"></div>
        <div class="skeleton-line w-70"></div>
        <div class="skeleton-line w-40"></div>
      </div>
    </article>`;
  return Array.from({ length: n }, () => one).join("");
}

async function loadInventory() {
  const grid = document.getElementById("livebestand-grid");
  if (!grid) return;

  grid.innerHTML = skeletons(CONFIG.count);

  const url = new URL(`${CONFIG.apiBase}/pharmacy-shop/products`);
  url.searchParams.set("sort", "newest");
  url.searchParams.set("pageSize", String(CONFIG.count));
  url.searchParams.set("page", "1");

  try {
    const res = await fetch(url, { headers: { "x-pharmacy-id": CONFIG.pharmacyId } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const items = Array.isArray(body.data) ? body.data : [];

    if (!items.length) {
      grid.innerHTML =
        `<p class="inventory__notice">Aktuell sind keine Produkte im Livebestand verfügbar. Schau bald wieder vorbei.</p>`;
      return;
    }

    grid.innerHTML = items.slice(0, CONFIG.count).map(productCard).join("");
  } catch (err) {
    grid.innerHTML =
      `<p class="inventory__notice">Der Livebestand konnte gerade nicht geladen werden. Bitte versuche es später erneut.</p>`;
    // Surface the reason for debugging without breaking the page.
    console.error("[livebestand] load failed:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadInventory);
} else {
  loadInventory();
}
