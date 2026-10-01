/* ==========================================================================
   Livebestand — loads the pharmacy's current stock from the shop API and
   renders (a) the hero spec card + live stats, (b) a filterable product grid,
   (c) live counts on the strain cards and filter chips.

   Fully client-side. The shop resolves the pharmacy by its own domain and
   sends CORS headers for cannanova-langen.de, so no custom header is needed
   (a custom header would force a cross-subdomain CORS preflight).
   ========================================================================== */

const CONFIG = {
  apiBase: "https://shop.cannanova-langen.de/api/shop/v1",
  shopBase: "https://shop.cannanova-langen.de",
  fetchSize: 100,   // the whole live stock fits in one page
  pageSize: 8,      // cards shown per "Weitere anzeigen" step
};

// Shop genetic enum (camelCase from the API) -> label + strain accent token.
const GENETIC = {
  indica:               { label: "Indica",          color: "var(--color-strain-indica)" },
  hybridIndicaDominant: { label: "Indica-dominant", color: "var(--color-strain-indica)" },
  hybrid:               { label: "Hybrid",          color: "var(--color-strain-hybrid)" },
  hybridSativaDominant: { label: "Sativa-dominant", color: "var(--color-strain-sativa)" },
  sativa:               { label: "Sativa",          color: "var(--color-strain-sativa)" },
};

const COUNTRY = {
  CA: "Kanada", PT: "Portugal", DK: "Dänemark", CO: "Kolumbien", MK: "Nordmazedonien",
  DE: "Deutschland", NL: "Niederlande", ES: "Spanien", AU: "Australien", UY: "Uruguay",
  IL: "Israel", ZA: "Südafrika", GR: "Griechenland", CZ: "Tschechien", MT: "Malta",
  CH: "Schweiz", AT: "Österreich", LS: "Lesotho", JM: "Jamaika", PL: "Polen",
};

const UNIT_LABEL = { grams: "g", milligrams: "mg", milliliters: "ml" };

const THC_TIERS = {
  all:  () => true,
  low:  (t) => t < 20,
  mid:  (t) => t >= 20 && t < 25,
  high: (t) => t >= 25,
};

const state = { items: [], genetic: "all", thc: "all", unirradiated: false, shown: CONFIG.pageSize };

const euro = (cent) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format((cent ?? 0) / 100);

// Escape user-supplied strings before inserting into markup.
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );

const pct = (v) => (v === null || v === undefined || v === "" ? "–" : `${String(v).replace(".", ",")} %`);
const geneticOf = (p) => GENETIC[p.genetic] ?? { label: p.genetic ?? "Sorte", color: "var(--color-brand)" };
const productUrl = (p) => (p.slug ? `${CONFIG.shopBase}/products/${encodeURIComponent(p.slug)}` : `${CONFIG.shopBase}/products`);
const displayName = (p) => p.strain || p.name || "Produkt";

// Pick a reasonably sized responsive image; fall back to original.
function imageFor(product) {
  const responsive = product.images?.responsive;
  if (Array.isArray(responsive) && responsive.length) {
    const pick = responsive.find((r) => r.width >= 480) ?? responsive[responsive.length - 1];
    return pick.url;
  }
  return product.images?.original || null;
}

function productCard(p) {
  const genetic = geneticOf(p);
  const unit = UNIT_LABEL[p.unit] ?? esc(p.unit ?? "");
  const img = imageFor(p);
  const name = displayName(p);
  const alt = esc(`${p.name ?? name} von ${p.manufacturer ?? "unbekanntem Hersteller"}`);
  const origin = COUNTRY[p.country] ?? p.country;
  const terpenes = Array.isArray(p.terpenes) ? p.terpenes.slice(0, 3) : [];

  return `
    <article class="card product-card" style="--genetic-color: ${genetic.color};">
      <a class="product-card__media" href="${esc(productUrl(p))}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
        ${img
          ? `<img src="${esc(img)}" alt="" width="480" height="360" loading="lazy">`
          : `<svg class="product-card__placeholder" aria-hidden="true"><use href="#cn-mark"/></svg>`}
      </a>
      <div class="product-card__body">
        <p class="product-card__meta">
          <span class="product-card__genetic">${esc(genetic.label)}</span>
          ${p.irradiation === false ? `<span class="product-card__tag">unbestrahlt</span>` : ""}
        </p>
        <h3 class="product-card__name"><a href="${esc(productUrl(p))}" target="_blank" rel="noopener" aria-label="${alt} im Shop ansehen">${esc(name)}</a></h3>
        <p class="product-card__manufacturer">${esc(p.manufacturer ?? "")}${origin ? ` · ${esc(origin)}` : ""}</p>
        <p class="product-card__stats">
          <span class="stat">THC <span>${esc(pct(p.thc))}</span></span>
          <span class="stat">CBD <span>${esc(pct(p.cbd))}</span></span>
        </p>
        ${terpenes.length ? `<p class="product-card__terpenes">${terpenes.map(esc).join(" · ")}</p>` : ""}
        <div class="product-card__foot">
          <span class="product-card__price">${euro(p.priceCent)}<span class="unit"> / ${unit}</span></span>
          <a class="link-arrow" href="${esc(productUrl(p))}" target="_blank" rel="noopener" aria-label="${esc(name)} im Shop ansehen">Im Shop</a>
        </div>
      </div>
    </article>`;
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

/* ---- Filtering ---------------------------------------------------------- */
function matches(p, { genetic = state.genetic, thc = state.thc, unirradiated = state.unirradiated } = {}) {
  if (genetic !== "all" && p.genetic !== genetic) return false;
  if (!THC_TIERS[thc](Number(p.thc) || 0)) return false;
  if (unirradiated && p.irradiation !== false) return false;
  return true;
}

function renderGrid() {
  const grid = document.getElementById("livebestand-grid");
  const count = document.getElementById("inventory-count");
  const more = document.getElementById("inventory-more");
  const results = state.items.filter((p) => matches(p));

  if (!results.length) {
    grid.innerHTML = `<p class="inventory__notice">Keine Sorte passt zu dieser Auswahl. Setze einen Filter zurück, um mehr Ergebnisse zu sehen.</p>`;
    count.textContent = `0 von ${state.items.length} Sorten`;
    more.hidden = true;
    return;
  }

  grid.innerHTML = results.slice(0, state.shown).map(productCard).join("");
  count.textContent = `${results.length} von ${state.items.length} Sorten`;
  more.hidden = results.length <= state.shown;
}

// Live counts on chips: how many results each option would give, given the other filters.
function renderChipCounts() {
  document.querySelectorAll(".chips[data-filter]").forEach((group) => {
    const key = group.dataset.filter;
    group.querySelectorAll(".chip").forEach((chip) => {
      const n = state.items.filter((p) => matches(p, { [key]: chip.dataset.value })).length;
      let badge = chip.querySelector(".chip__n");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "chip__n";
        chip.append(badge);
      }
      badge.textContent = n;
    });
  });
}

function setFilter(key, value) {
  state[key] = value;
  state.shown = CONFIG.pageSize;
  document.querySelectorAll(`.chips[data-filter="${key}"] .chip`).forEach((chip) => {
    chip.setAttribute("aria-pressed", String(chip.dataset.value === value));
  });
  renderGrid();
  renderChipCounts();
}

function bindFilters() {
  document.querySelectorAll(".chips[data-filter]").forEach((group) => {
    group.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) setFilter(group.dataset.filter, chip.dataset.value);
    });
  });

  const toggle = document.getElementById("filter-unirradiated");
  toggle?.addEventListener("change", () => {
    state.unirradiated = toggle.checked;
    state.shown = CONFIG.pageSize;
    renderGrid();
    renderChipCounts();
  });

  document.getElementById("inventory-more")?.addEventListener("click", () => {
    state.shown += CONFIG.pageSize;
    renderGrid();
  });

  // Strain cards set the genetic filter, then the link scrolls to the grid.
  document.querySelectorAll("[data-set-genetic]").forEach((link) => {
    link.addEventListener("click", () => setFilter("genetic", link.dataset.setGenetic));
  });
}

/* ---- Hero: spec card + live stats -------------------------------------- */
function renderHeroSpec(p) {
  const el = document.getElementById("hero-spec");
  if (!el) return;
  const nameEl = el.querySelector(".spec__name");
  const dds = el.querySelectorAll(".spec__data dd");
  const priceEl = el.querySelector(".spec__price");
  const linkEl = el.querySelector(".spec__foot a");
  el.classList.remove("spec--loading");

  if (!p) {
    nameEl.textContent = "Aktueller Bestand im Shop";
    dds.forEach((d) => { d.textContent = "–"; });
    priceEl.textContent = "";
    return;
  }

  const unit = UNIT_LABEL[p.unit] ?? String(p.unit ?? "");
  const terpenes = Array.isArray(p.terpenes) && p.terpenes.length ? p.terpenes.slice(0, 3).join(", ") : "–";
  const values = [geneticOf(p).label, pct(p.thc), pct(p.cbd), COUNTRY[p.country] ?? p.country ?? "–", terpenes];

  nameEl.textContent = p.name ?? displayName(p);
  dds.forEach((d, i) => { d.textContent = values[i] ?? "–"; });
  priceEl.innerHTML = `${euro(p.priceCent)}<span class="unit"> / ${esc(unit)}</span>`;
  if (linkEl) {
    linkEl.href = productUrl(p);
    linkEl.textContent = "Im Shop ansehen";
  }
}

function renderStats(items) {
  const set = (key, text) => {
    const el = document.querySelector(`#hero-stats [data-stat="${key}"]`);
    if (el) el.textContent = text;
  };
  if (!items.length) {
    set("count", "–"); set("min", "–"); set("updated", "–");
    return;
  }
  const minCent = Math.min(...items.map((p) => p.priceCent).filter((c) => c > 0));
  const latest = items.reduce((max, p) => (p.updatedAt && p.updatedAt > max ? p.updatedAt : max), "");
  set("count", String(items.length));
  set("min", `${euro(minCent)}/g`);

  if (latest) {
    const d = new Date(latest);
    const today = new Date().toDateString() === d.toDateString();
    set("updated", today
      ? `heute, ${d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
      : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }));
  }

  // Strain cards: live count per genetic group.
  document.querySelectorAll("[data-count-for]").forEach((el) => {
    const n = items.filter((p) => p.genetic === el.dataset.countFor).length;
    el.textContent = n ? `${n} ${n === 1 ? "Sorte" : "Sorten"} im Livebestand` : "";
  });
}

/* ---- Load ---------------------------------------------------------------- */
async function loadInventory() {
  const grid = document.getElementById("livebestand-grid");
  if (!grid) return;

  bindFilters();
  grid.innerHTML = skeletons(4);

  const url = new URL(`${CONFIG.apiBase}/pharmacy-shop/products`);
  url.searchParams.set("sort", "newest");
  url.searchParams.set("pageSize", String(CONFIG.fetchSize));
  url.searchParams.set("page", "1");

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const items = (Array.isArray(body.data) ? body.data : []).filter((p) => p.available !== false);

    state.items = items;
    renderStats(items);
    renderHeroSpec(items[0] ?? null);

    if (!items.length) {
      grid.innerHTML = `<p class="inventory__notice">Aktuell sind keine Produkte im Livebestand verfügbar. Schau bald wieder vorbei.</p>`;
      return;
    }
    renderGrid();
    renderChipCounts();
  } catch (err) {
    grid.innerHTML =
      `<p class="inventory__notice">Der Livebestand konnte gerade nicht geladen werden. Den aktuellen Bestand findest Du jederzeit <a href="${CONFIG.shopBase}/products" target="_blank" rel="noopener">direkt im Shop</a>.</p>`;
    renderHeroSpec(null);
    renderStats([]);
    console.error("[livebestand] load failed:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadInventory);
} else {
  loadInventory();
}
