# Cannanova — Project Guidelines

Static landing-page website. Plain HTML/CSS (no build step). Edits are made
directly and pushed to `main`, which is the live production site (see
**Workflow** below).

When doing any visual or layout work, invoke the **`frontend-design`** skill
(in `.claude/skills/`) for aesthetic direction — but every choice it produces
must still conform to the design system defined below.

---

## Scope — landing page only

**This repository is purely the landing page (the marketing/front page).** It is
not the shop.

- **The shop (storefront, product catalog, cart, checkout) is provided by
  cannaflow.de** and is hosted at **`shop.cannanova-langen.de`**. It is a
  separate system — not part of this repo.
- Do **not** build shopping/checkout/account functionality here. Anything that
  is "the shop" belongs to cannaflow.de at `shop.cannanova-langen.de`.
- The landing page may **read** from the cannaflow pharmacy API (e.g. the
  Livebestand "latest products" widget) and may **link out** to
  `shop.cannanova-langen.de`, but it does not host the shop itself.
- When a product or "buy"/"order" action is needed, link to the shop at
  `shop.cannanova-langen.de` rather than implementing it in this repo.

---

## Design System (single source of truth)

Develop the whole site against **one** design system and keep it consistent
across every page. Define the system once, then reuse it — never re-invent
styles per page.

### Where the system lives

- All design tokens live as **CSS custom properties** in a single global
  stylesheet (e.g. `css/tokens.css`), imported by every page.
- Shared component styles live in `css/components.css`. Pages may add only
  page-specific layout, never new colors, fonts, or spacing values.
- **Never hardcode** a color, font, size, radius, or shadow inline or per-page.
  If a value isn't a token, add it to the token file first, then reference it.

### Tokens to define and always use

- **Color:** brand, accent, neutrals, background, text, success/error/warning.
  Reference only via `var(--color-*)`.
- **Typography:** a deliberate display + body pairing, a fixed type scale
  (e.g. `--font-size-xs … --font-size-3xl`), weights, and line-heights.
  Set the type scale once; do not introduce ad-hoc font sizes.
- **Spacing:** one spacing scale (`--space-1 … --space-12`). All margins,
  paddings, and gaps come from it — no magic pixel values.
- **Radius, shadows, borders, breakpoints, motion durations/easings:** tokenized
  and reused.

### Consistency rules

- Same header and footer on every page, from a shared source — do not copy-paste
  divergent variants.
- Buttons, links, cards, form fields, and section spacing look and behave
  identically site-wide. One component = one canonical style.
- A control says exactly what it does; an action keeps the same name through the
  whole flow (the button that says "Add to cart" leads to a "cart" — not "bag").
- Responsive at every breakpoint; respect `prefers-reduced-motion`; keyboard
  accessible (visible focus states, logical tab order).
- Before adding a new pattern, check whether an existing component covers it.
  Extend the system deliberately; don't fork it.

---

## SEO — ecommerce landing page best practices

Apply on every page. SEO is a requirement, not an afterthought.

### Per-page metadata

- One unique, descriptive `<title>` per page (~50–60 chars), front-loading the
  primary keyword and including the brand.
- Unique `<meta name="description">` (~150–160 chars) with a clear value
  proposition and a soft call to action.
- One — and only one — `<h1>` per page stating the page's core offer. Logical
  `<h2>/<h3>` hierarchy below it; never skip levels for styling.
- Canonical tag (`<link rel="canonical">`) on every page to avoid duplicates.
- `<meta name="robots">` set appropriately (index,follow for public pages).

### Social / sharing

- Open Graph tags: `og:title`, `og:description`, `og:image`, `og:url`,
  `og:type` (`product` for product pages, `website` otherwise).
- Twitter Card tags (`summary_large_image`).
- `og:image` is a real, correctly sized image (1200×630) that exists in the repo.

### Structured data (JSON-LD)

- Add schema.org JSON-LD appropriate to the page:
  - `Organization` + `WebSite` on the home page.
  - `Product` with `offers` (price, currency, availability) on product/offer
    pages; `AggregateRating`/`Review` only if the data is real.
  - `BreadcrumbList` where breadcrumbs exist.
- Never fabricate ratings, prices, or stock — structured data must match the
  visible page, or it's a penalty risk.

### Content & on-page

- Write copy for humans first; weave the primary keyword naturally into the H1,
  first paragraph, and one subheading. No keyword stuffing.
- Every image has meaningful, specific `alt` text (also helps accessibility).
- Descriptive, lowercase, hyphenated URLs (`/cbd-oil` not `/page2`).
- Internal links between related pages with descriptive anchor text.
- A clear primary CTA above the fold on the landing page.

### Technical SEO

- Fast: optimized/compressed images, `width`/`height` on `<img>` to prevent
  layout shift, lazy-load below-the-fold media (`loading="lazy"`).
- Mobile-first and fully responsive (Google indexes mobile).
- Semantic HTML5 landmarks (`header`, `nav`, `main`, `footer`, `section`).
- `lang` attribute on `<html>`.
- Maintain `sitemap.xml` and `robots.txt` at the site root; add new pages to the
  sitemap.
- Valid, accessible markup — accessibility and SEO reinforce each other.

### Compliance note

This site sells cannabis-related products. Keep claims factual and avoid
unverifiable health/medical claims in copy or structured data — both for legal
compliance and because Google penalizes deceptive ecommerce content.

---

## Responsiveness & mobile (requirement, not optional)

Most visitors are on phones, and Google indexes the mobile version. Every change
must look and work well on mobile first.

- **Mobile-first:** design and verify the small-screen layout first, then scale
  up. Test at least 360px (small phone), 768px (tablet), and 1280px (desktop).
- **No horizontal scroll** at any width. Nothing overflows the viewport; long
  words/URLs wrap. Use fluid widths (`%`, `fr`, `minmax`, `clamp`) over fixed
  pixel widths for layout.
- **Multi-column grids collapse** to fewer columns (and to a single column on
  phones). Reference only the tokenized breakpoints — no ad-hoc media queries
  with magic pixel values.
- **Tap targets ≥ 44×44px** with enough spacing; don't rely on hover for
  anything essential (phones have no hover).
- **Readable type on mobile:** body text ≥ 16px, comfortable line length and
  line-height from the type scale.
- **Images are responsive:** never overflow their container, always carry
  `width`/`height` (prevent layout shift), and lazy-load below the fold.
- **Respect `prefers-reduced-motion`** and keep keyboard focus states visible.
- Verify in a real mobile viewport (or DevTools device mode) before publishing —
  a desktop check is not enough.

---

## Workflow — publishing live to production

This site is maintained largely by **non-technical users**, and the goal is
simply to **update the live website in production**. Optimize the workflow for
that: small, direct, low-ceremony changes.

- **We always push directly to `main`.** `main` is the live production site —
  committing and pushing to `main` publishes the change. There is no separate
  release step.
- **No PR / branch dance required.** Do not create feature branches or open pull
  requests for routine content and layout edits; commit to `main` and push.
- **No build step:** edit HTML/CSS/JS directly and open the page in a browser
  (or the local static server) to verify before pushing.
- **Because every push goes live, verify first.** Before pushing to `main`:
  check the page renders correctly, including on mobile (see Responsiveness
  above), and that nothing is broken.
- **Keep changes small and self-contained** so a non-technical user can review
  the rendered result at a glance and so any single change is easy to undo
  (revert the commit) if something looks wrong in production.
- Write clear, plain-language commit messages describing what changed on the
  site, so non-technical maintainers can scan the history.
