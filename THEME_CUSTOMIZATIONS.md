# Horizon Theme — Mega Menu Customizations

Forked from `Horizon UI2026 Live` (theme #186166247809). Working theme is
`Horizon UI2026 Live (MegaMenu Dev)` (#186338935169).

When Shopify ships a new Horizon version, use this document as the checklist
of what to re-verify after pulling the update.

## Workflow for Horizon updates

1. In Shopify admin, **duplicate** the new live theme
2. Pull the dupe locally into a fresh dir (clean of any local edits)
3. `git init`, baseline commit
4. `git remote add ours https://github.com/doideaco/horizon-menu.git && git fetch ours`
5. Cherry-pick our commits one by one: `git cherry-pick <sha>` for each commit
   from oldest to newest. Resolve conflicts as they arise.
6. Push to a new dev theme, QA the menu thoroughly, then publish.

## Files we own (created from scratch — Shopify won't conflict)

- `blocks/_mega-menu-brand-grid.liquid`
- `blocks/_mega-menu-cta-banner.liquid`
- `blocks/_mega-menu-featured-products.liquid`
- `snippets/mega-menu-brand-grid-block.liquid`
- `snippets/mega-menu-cta-banner-block.liquid`
- `snippets/submenu-font-sizes.liquid`

## Files we modified (Horizon may also modify these)

| File | What we changed | Risk |
|---|---|---|
| `blocks/_header-menu.liquid` | Schema: column/gap/typography/padding settings + `blocks` array. Liquid: per-link enhancement branching, mega-menu heading at top of every menu, `submenu-font-sizes` wired to `<header-menu>`. CSS: gap/padding fallbacks, More-menu unified typography, chevron indicator, span-5/6, `.mega-menu__columns`, ~290 lines of enhanced-block CSS, heading + tightened gap rules. | High — Shopify refactored this heavily once already |
| `snippets/mega-menu-list.liquid` | Flat-list rendering mode, configurable `links_before_wrap_setting` parameter | Medium |
| `snippets/submenu-font-styles.liquid` | Added `extra_small` (12px) option to `menu_font_style` | Low |
| `snippets/overflow-list.liquid` | Added `<slot name="overflow-heading">` inside `[part="overflow"]` | Medium — generic component shared by filters & swatches |
| `assets/header-menu.js` | Broadened `isMovingToOverflowMenu` check in `deactivate()` so the More menu doesn't close when cursor moves to the heading or other slotted content | High — Shopify rewrites JS frequently |
| `blocks/_mega-menu-collection-list.liquid` | Forward-ported (extra fields, view-all, more aspect ratios) | Medium |
| `blocks/_mega-menu-custom-links.liquid` | 10 links (was 6), heading URL, view-all | Medium |
| `blocks/_mega-menu-promo-image.liquid` | text_position, overlay_color settings | Medium |
| `snippets/mega-menu-collection-list-block.liquid` | Matches updated block schema | Medium |
| `snippets/mega-menu-custom-links-block.liquid` | 10-link rendering | Medium |
| `snippets/mega-menu-featured-products-block.liquid` | Updated rendering | Medium |
| `snippets/mega-menu-promo-image.liquid` | Overlay variants | Medium |
| `assets/custom.css` | Globo Mega Menu CSS blocking (defense-in-depth even though app embed is disabled) | Low |
| `config/settings_data.json` | Globo Mega Menu app embed `disabled: true`. Header block `menu: "main-menu-horizon"` | Low |

## Specific edits to verify after a Horizon update

### `_header-menu.liquid` schema settings
Search for: `mega_menu_columns`, `mega_menu_horizontal_gap`, `mega_menu_padding`,
`mega_menu_links_per_column`. All 6 mega-menu setting groups should be present
(Mega menu layout, Mega menu spacing).

### `_header-menu.liquid` rendering
Search for: `assign has_enhancements`. The per-link enhancement check should
wrap the call to `mega-menu-list`. The heading `<h3 class="mega-menu__heading">`
should sit just inside `.mega-menu__grid`.

### `_header-menu.liquid` CSS
Look for these rules — they're the visible UX fixes:
- `.menu-list { --menu-horizontal-gap: var(--mega-menu-h-gap, ...) }`
- `.overflow-menu::part(overflow-list) { grid-template-columns: minmax(auto, 250px) 1fr }`
- `.menu-list__link[aria-haspopup='true']::after { transform: rotate(45deg) }` (chevron)
- `.mega-menu__heading { font-weight: 700 }`
- `.mega-menu__grid > .mega-menu__heading { margin-block-end: calc(... * -0.5) }` (gap halver)

### `header-menu.js`
Search for `isMovingToOverflowMenu`. Our broadened check uses
`this.overflowMenu?.contains(event.relatedTarget)` instead of just the
parent-matches check.

### Globo Mega Menu app
In `config/settings_data.json`, search for `globo-mega-menu`. Must have
`"disabled": true`.

## Known Horizon-internal patterns we must NOT break

- Safety-box `::after` on `.menu-list__link` (Horizon's Safari pointer-tracking
  pseudo-element). Our chevron `::after` uses `[aria-haspopup='true']` selector
  to avoid clashing.
- `header-drawer` render args (`block:`, `section:`) — keep these.
- `menu-font-styles` snippet expects `menu_type` arg — keep passing it.

## Theme IDs (urbanindustrystore)

- `186166247809` — Live
- `186338935169` — MegaMenu Dev (this repo)
