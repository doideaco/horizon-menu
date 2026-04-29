# Horizon Mega Menu

A heavily extended mega menu for Shopify's **Horizon** theme — built for
[urbanindustrystore.myshopify.com](https://urbanindustrystore.myshopify.com).

This repo is a fork of the live theme (`Horizon UI2026 Live`) with
substantial customizations to the header navigation, removing the need for
a third-party mega menu app and giving merchants fine-grained control over
layout, typography, spacing, and rich block content — all from the
Shopify admin.

---

## Why this exists

Horizon's stock mega menu is functional but minimal: a flat link list with
limited layout configuration. To work around this, the store had been
running [Globo Mega Menu](https://globosoftware.net) — adding load weight,
runtime DOM injection, conflicting CSS, and locking the merchant into a
third-party UI.

This fork:

- **Disables the Globo app embed** (no more app injection)
- **Wires the native Horizon menu** to the merchant's existing `main-menu-horizon`
  link list (the comprehensive nested menu the client built)
- **Extends the native mega menu** with the configurability that was missing:
  column counts, gaps, typography, custom block content per top-level item, etc.

The result: a faster, more maintainable mega menu controlled entirely from
the theme editor.

---

## Features

### Layout configuration (per header)

Settings in the theme editor → Header → Menu block:

- **Desktop columns** (4 / 5 / 6 / 8)
- **Tablet columns** (2 / 3 / 4)
- **Links before column break** (4–20)
- **Column gap** (5 sizes)
- **Row gap** (5 sizes)
- **Dropdown padding** (4 sizes)
- **Submenu size** — now includes an `Extra small (12px)` option

### Per-menu-item enhancement blocks

Add Shopify theme blocks to the header menu, scoped to a specific top-level
nav item (e.g. attach a CTA banner to "Sale", a brand grid to "Brands"):

| Block type | What it renders |
|---|---|
| `_mega-menu-promo-image` | Image card with heading, description, CTA, optional overlay (dark/light/none), positioned start or end |
| `_mega-menu-collection-list` | 1–6 collections with images, titles, optional view-all link, configurable aspect ratio |
| `_mega-menu-featured-products` | Featured products from a collection with optional price/vendor |
| `_mega-menu-custom-links` | Up to 10 custom links with a heading and view-all |
| `_mega-menu-brand-grid` | Up to 8 brand logos in a grid, configurable per-row count, optional grayscale-to-color hover |
| `_mega-menu-cta-banner` | Promotional banner with optional background image, CTA button, color scheme |

Each block has a `menu_item_title` setting — match it to a top-level link's
title to attach. Blocks render in the start or end position relative to the
nav links inside that menu's dropdown.

### Visual polish

- **Bold heading** at the top of every mega menu showing the menu name
- **Right-aligned chevron indicator** on overflow ("More") items that have submenus
- **Unified typography**: all dropdown links use the same size scale, eliminating
  the previous "More menu looked different" problem
- **Tightened gap** between heading and menu items across the board
- **Right-column alignment** of the "More" panel heading with its overflow list

### Better mouse UX

Patched `header-menu.js` so the More menu doesn't deactivate prematurely when
the user moves the cursor from the More trigger into the panel — including
into the slotted heading. Any movement into the overflow-list web component
keeps the menu open.

---

## Local development

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli/install) (`shopify`)
- Authenticated against `urbanindustrystore.myshopify.com`

### Quick start

```bash
git clone https://github.com/doideaco/horizon-menu.git /Users/alexmorris/git/shopify
cd /Users/alexmorris/git/shopify
shopify theme dev --store urbanindustrystore --theme 186338935169
```

Open http://localhost:9292 to preview. Edits hot-reload in place.

### Push to the dev theme

```bash
shopify theme push --store urbanindustrystore --theme 186338935169
```

### Theme IDs

| Theme | ID | Role |
|---|---|---|
| `Horizon UI2026 Live` | `186166247809` | **Live** — never push directly |
| `Horizon UI2026 Live (MegaMenu Dev)` | `186338935169` | This repo's working dev theme |

---

## Repo structure (what we touched)

```
blocks/
  _header-menu.liquid                      ← heavy: schema + CSS + render branching
  _mega-menu-brand-grid.liquid             ← new
  _mega-menu-cta-banner.liquid             ← new
  _mega-menu-featured-products.liquid      ← new
  _mega-menu-collection-list.liquid        ← forward-ported (richer schema)
  _mega-menu-custom-links.liquid           ← forward-ported (10 links)
  _mega-menu-promo-image.liquid            ← forward-ported (overlay options)

snippets/
  mega-menu-list.liquid                    ← flat-list mode + configurable wrap
  submenu-font-styles.liquid               ← extra_small option
  submenu-font-sizes.liquid                ← new (typography unification)
  overflow-list.liquid                     ← added overflow-heading slot
  mega-menu-brand-grid-block.liquid        ← new
  mega-menu-cta-banner-block.liquid        ← new
  mega-menu-collection-list-block.liquid   ← forward-ported
  mega-menu-custom-links-block.liquid      ← forward-ported (10 links)
  mega-menu-featured-products-block.liquid ← forward-ported
  mega-menu-promo-image.liquid             ← forward-ported (overlay variants)

assets/
  header-menu.js                           ← broadened deactivate check for More
  custom.css                               ← Globo CSS-level blocking (defense-in-depth)

config/
  settings_data.json                       ← Globo app embed disabled, menu wired

sections/
  header-group.json                        ← header menu wired to main-menu-horizon

THEME_CUSTOMIZATIONS.md                    ← upgrade checklist (read this when Shopify ships an update)
```

---

## Upgrading when Shopify ships a new Horizon

Horizon updates can refactor files we've modified — between March and April 2026,
Horizon shrunk `_header-menu.liquid` by ~500 lines. Plan accordingly.

The upgrade workflow:

1. Duplicate the new live Horizon theme in Shopify admin
2. Pull the dupe locally into a fresh dir
3. `git init`, baseline commit on a new branch
4. Add this repo as a remote and cherry-pick our commits over the new base:
   ```bash
   git remote add ours https://github.com/doideaco/horizon-menu.git
   git fetch ours
   git cherry-pick ours/main~16..ours/main      # all 17 customization commits
   ```
5. Resolve any conflicts (most likely in `_header-menu.liquid` and `header-menu.js`)
6. Push to a new dev theme, QA the menu thoroughly, then publish

See `THEME_CUSTOMIZATIONS.md` for a per-file checklist and risk assessment.

---

## Architecture notes

### Why a `header-menu` patch and not a Custom Element override

The store still benefits from Horizon's Safari pointer-tracking ("safety box")
which is built into `header-menu.js`. We want to keep that. Instead of forking
the whole class, we make a single-line patch to `deactivate()` so the More
menu treats slotted heading + shadow-DOM content as "still inside" the menu.

### Why slot-based heading injection

The `<overflow-list>` web component renders the More panel inside its shadow
DOM. We can't easily reach in from outside Liquid. Instead, we added a
`<slot name="overflow-heading">` to `overflow-list.liquid` and prepended a
`<h3 slot="overflow-heading">` to the children passed in by `_header-menu.liquid`.
Light-DOM CSS styles the slotted h3 directly.

### Why `data-overflow-expanded` for visibility

Slotted content's visibility doesn't reliably inherit through shadow DOM
across browsers. Rather than rely on CSS cascade, we tie the heading's
opacity/visibility explicitly to `header-menu[data-overflow-expanded='true']`
— an attribute the existing `activate()` method already sets.

### CSS nesting gotchas

Horizon's `_header-menu.liquid` uses CSS nesting heavily. When adding rules
*inside* a parent block, the nested selectors get prepended with the parent.
A common error pattern is `.parent .parent .child` — this matches nothing.
Always write nested rules using only the relative descendant.

---

## Acknowledgements

- Built on Shopify's [Horizon](https://shopify.dev/docs/storefronts/themes/architecture)
  theme architecture
- Mega menu structure preserves Horizon's `<header-menu>` and `<overflow-list>`
  custom elements (no fork of the JS classes)
