# PR2 — Base UI components: executable plan

Expands the PR2 section of [tailwind-migration-plan.md](./tailwind-migration-plan.md). Goal (revised 2026-07-06): **zero react-bootstrap imports** after this PR, all interaction behavior preserved; the visual target is **nearest-native Tailwind/Base UI**, no longer pixel-identical — see the master plan's §Strategy revision. Where a spec below quotes an arbitrary bracket value or a sass-exact formula obligation, the revision supersedes it: build the nearest-native equivalent (censuses, site lists, APIs, and interaction requirements remain authoritative). Everything here was re-verified against the codebase and Base UI's live docs on 2026-07-03.

Scope decisions locked with sox:
1. This dedicated doc; the master plan's PR2 section is a summary + link.
2. **Broad Base UI adoption** — beyond replacing react-bootstrap, hand-rolled components with a matching Base UI primitive get rebuilt too (Table B).
3. `ui/button.js` builds on **Base UI Button** (render prop, `focusableWhenDisabled`, `[data-disabled]`), not a bare `<button>`.

## 0. Progress track

- **🔄 Strategy revision 2026-07-06 (read first — supersedes value specs below).** Decided with sox: native-first, no pixel parity (master plan §Strategy revision). Locked: hybrid module skins **stay** (keystone 6, now with a native-values rule); `@theme` gets `--text-base: .93rem` + `--text-base--line-height: 1.75` (type identity as a token); subtle ~150ms native transitions **adopted** (keystone 5 rewritten — affects C3+ popup chrome; write `data-starting-style` CSS now, with `prefers-reduced-motion` off-switch); `rounded-sn` → stock `rounded-md` (drop token + cn.js classGroup); Container → single `max-w-4xl`.
  **C2.5 native-value rework ✅ done (2026-07-06, same day; sox eyeball QA pending — light + dark + branded territory).** As landed:
  - **Tokens**: `@theme` gains `--text-base: .93rem` + `--text-base--line-height: 1.75` (pre-landing grep confirmed 0 existing `text-base` uses); `--sn-radius`/`--radius-sn` deleted (zero consumers outside tailwind.css); `lib/cn.js` drops the `rounded-sn` classGroup (`font-bolder`/`text-reset` stay — in use).
  - **Button**: BASE `text-base rounded-md` (line-height rides the token pair); sm `px-2 py-1 text-sm rounded-sm` (paddings were already native), md `px-4 py-1.5` (nearest steps to .42rem/1.1rem), lg `px-4 py-2 text-lg rounded-lg`; the 14 module skins untouched. ⚠️ **C9a**: inputs must use md's `px-4 py-1.5` or InputGroups misalign (comment carried in button.js).
  - **Badge**: `px-2 py-0.5 text-xs rounded-md` (em-scaling dropped); call-site nudges: `ms-[0.1rem]`→`ms-0.5` (kept — badges would touch preceding text without), all `-mt-px` vertical nudges deleted. `leading-none` still wins over text-xs's paired line-height (verified in compiled output order).
  - **Alert**: `Alert.Heading` fluid clamp → `text-xl leading-tight`. **Container**: `max-w-4xl` (896px; the 540/720 tablet tiers are gone — 576–992px viewports gain width).
  - **Sweep**: `text-[1.1625rem]`→`text-lg` ×8 consumer sites, `text-[0.93rem]`→`text-base` ×1, fs-4 clamp→`text-xl` ×1 (wallets layout), `font-[monospace]`→`font-mono` ×29/16 files (**intended delta**: renders the Menlo/SFMono `--font-mono` stack now, not browser-default monospace), `rounded-sn`→`rounded-md` ×6 sites.
  - **Codemod map**: fs-1..6 → `text-4xl/3xl/2xl/xl/lg/base` (fs-1..4 matched on desktop caps; named steps now carry paired line-heights — intended), `rounded`/`rounded-2`→`rounded-md`, `rounded-4`/`-5`→`rounded-2xl`/`rounded-4xl` (exact 1rem/2rem), `text-monospace`→`font-mono`.
  - **Left as deliberate one-offs**: `lg:z-[900]` (rewards page; rewire to `var(--sn-z-sticky)` at PR3), playground `max-w-[1100px]`, badge `[--sn-badge-opacity:0.75]` (a var write, not a value), alert module's hand-drawn border-radius.
  - **Gates**: residue grep 0 across components/pages/wallets/lib/scripts; `npx standard` clean on all 36 touched files; compiled-CSS check (standalone CLI 4.3.1 — host node_modules lacks the darwin lightningcss binary, app builds in Docker) confirms `.text-base` emits the .93rem/1.75 tokens and `rounded-sn`/`--radius-sn` are gone from output.
- **C0 ✅ done (2026-07-05).** `@base-ui/react@1.6.0` + `tailwind-merge@3.6.0` installed. `lib/cn.js` ships `extendTailwindMerge` teaching it our custom tokens (`rounded-sn`, `font-bolder`, `text-reset`) — **every future custom theme token needs a matching classGroups entry or overrides silently stop merging** (unknown `text-*` is misclassified as a color). z-ladder landed with one addition over plan: `--sn-z-drawer-backdrop: 1040` (Drawer.Backdrop must sit under the modal backdrop, per compiled `$zindex-offcanvas-backdrop`). Four aliases added to `:root`: `--sn-primary-text`, `--sn-secondary-text`, `--sn-link-color`, `--sn-link-hover-color` (link pair deliberately NOT named `--sn-link` — dodges the PR3 `--theme-link` rename collision).
- **C1 ✅ done (2026-07-05, QA passed same day: per-variant hover parity, branded-territory retint light+dark, link weight/dark-mode color, notifications retry, post buttons, ots `<a>` downloads).** `ui/button.js` (Base UI Button; `buttonClasses({ variant, size, className })` cva-shape recipe; `href`/`as` render shim) + `button.module.css` with **14 variant skins** — the census said 12, but `outline-warning` (notifications.js) and `outline-grey` (territory-header.js ×2) were hidden inside stuffed `variant` props (utilities smuggled into the prop string — all 3 PR1-flagged sites now unstuffed). Skin design: hover/active hoisted into one `color-mix` formula (verified value-exact vs compiled CSS; `--sn-btn-mix` flips shade/tint), variant class names = variant strings (`styles[variant]`, Next's `exportLocalsConvention: 'asIs'`). Swept: 28/35 import swaps, all §4b `btn btn-*` string sites, all §4c link-Buttons (post.js was 9 nested sites, not 6), notifications inline `--bs-btn-*` → `--sn-btn-hover-color`, `size='md'` confirmed a phantom (no `.btn-md` ever existed — `md` ≡ default, keep it that way). Deferred whole-file per risk 7a: `user-header.js`, `item-act.js`, `pages/settings/index.js`, `pages/rewards/index.js`, `wallets/.../home/actions.js`, `form.js` → C9a; `login-button.js` → C5 (ButtonGroup = same corner-joining trap). **Note:** the Button `href`/`as` shim now has zero consumers — when C9a converts `actions.js:55`, decide whether to drop it.
- **C2 🔨 in progress.** Spec expanded in §11 (censused 2026-07-05): Badge 16 sites/7 files (§4b's "~14 raw badge strings" was a miscount — zero raw strings exist), Alert 11 sites/9 files (`info`/`danger`/`warning` only), Container 10 sites/9 files, Row/Col 8 files, Image 8 sites/5 files. Key design call in §11.0: badge/alert **colors stay module-side** because layered-`!important` utilities would beat even the consumers' `!important` module skins.
  - **Badge ✅ done 2026-07-06** per §11.1 (as revised): `ui/badge.js` + 7 variants incl. `.grey`, which absorbs the `item.module.css .newComment` + `notifications.module.css .badge` shout-skins (deleted, along with item `.badge` + comment `.op`); all 16 sites swapped; gates pass (react-bootstrap Badge grep 0, `bg-opacity` grep 0, standard clean). Visual QA passed 2026-07-06.
  - **Alert ✅ done 2026-07-06** per §11.2, with the devtools check done by direct sass compile instead (same method as the tokens doc): all six light/dark color-mix values verified value-exact against emitted CSS, and both §11.2 open questions resolved — `$btn-close-bg: none` (globals.scss:96) already kills Bootstrap's svg, but `opacity: .5`/hover `.75` ARE painted. So `.close` **deviates from the §11.2 sketch by design**: `color: #000` + `.5`/`.75` opacities + gold focus ring `rgba(250,218,94,.25)` + dark `color: #fff` (≡ today's `invert(1)` filter on #000), NOT `color: inherit`. All 11 sites/9 files swapped (import-only); globals `.btn-close` rules kept — offcanvas still consumes them until Drawer (C4). Gates pass (react-bootstrap Alert grep 0, standard clean). Visual QA passed 2026-07-06.
  - **Container ✅ done 2026-07-06** per §11.3, verbatim from the sketch: `ui/container.js` Tailwind-only recipe (`w-full mx-auto px-4 sm:max-w-[540px] md:max-w-[720px] lg:max-w-[900px]`, polymorphic `as`, no `fluid`). All 10 sites/9 files swapped (import-only; JSX untouched — sticky-bar.js and static.js keep `{ Nav, Navbar }` rb imports). §11.3's open question resolved: PullToRefresh **does** forward `className` onto its `<main>` (pull-to-refresh.js:80) — it doesn't spread other props, but layout.js passes only `className`+children so nothing is dropped. Also verified: no SN stylesheet keys off the `.container` selector (logger.module.css's `.container` is a scoped local class), so the class name vanishing from the DOM breaks nothing; the tailwind.css:41 `container` blocklist stays until PR3 but is no longer load-bearing. Gates pass (react-bootstrap Container grep 0, standard clean). Visual QA passed 2026-07-06.
  - **Next (handoff to fresh session): Row/Col (§11.4)**, then Image (§11.5), fee-button Table (§11.6), territory-header CardFooter (§11.7) — that exhausts C2; close with the §11.9 gates + visual-diff pass. Working pattern established by Badge/Alert/Container: recipe lives in `components/ui/<name>.js` (+ `<name>.module.css` only when colors/state need a skin, per §11.0), consumers import from `@/components/ui/<name>`, JSX prop surfaces stay verbatim; per-family gates = import grep → 0 + `npx standard` on touched files; log each family here with date, deviations, gates, QA status. Open items a new session must not skip:
    - §11.4 Row/Col is **no wrapper — inline utilities** per the swap table + per-site map (8 files, including §11.8's swept deferred files form.js + pages/rewards/index.js). Before/while swapping: (1) check lightning-auth.js callers — if only `md=12 lg=6` defaults are ever passed, fold to `lg:w-1/2` and delete the props; (2) verify once in compiled CSS that a consumer longhand (`ps-0`) beats the recipe shorthand (`px-4`) — both layered-important, only Tailwind's shorthand-before-longhand output order decides (§11.10 risk 2).
    - §11.5 Image includes user-header.js:102 per §11.8; job-form.js:45 `roundedCircle` → `rounded-full` is the one non-verbatim swap.
    - §11.6 Table needs the two fee-button.module.css additions (border-collapse; td line-height/vertical-align) — they're load-bearing, not cosmetic.
    - §11.7 CardFooter has one devtools check left (does today's footer paint `.card-footer:last-child` bottom radius inside AccordianCard → if yes, add the border-radius line).
- **C3+ ⬜ not started.**

## 1. Ground rules

All six master-plan keystones bind. The two that component commits trip over most:

- **Subtle native motion** (keystone 5, revised 2026-07-06): popups (menu, tooltip, popover, dialog, drawer, collapsible) get ~150ms ease-out fade (+slight scale where Base UI's docs examples use it) via `data-starting-style`/`data-ending-style` CSS in their chrome modules, disabled under `@media (prefers-reduced-motion: reduce)`. Toast slide/progress keeps its keyframes; Drawer's 450ms default is shortened into the ~150ms family, not zeroed.
- **Hybrid styling** (keystone 6): module.css answers "what does this look like in each state" (variant skins via `data-variant` + `var(--sn-*)`, state via Base UI data attributes, popup chrome/shadow/z-index); Tailwind answers "how is this instance arranged" (layout, spacing, consumer overrides). Recipe shape: `cn(styles.root, styles[variant], '<layout utilities>', className)` with `cn = (...args) => twMerge(classNames(...args))` from `lib/cn.js`. One property, one source — never declare the same CSS property in both the module skin and the utility string. Two failure modes when violated: `twMerge` is blind to module classes, so it can't resolve the conflict; and worse, a layered-`!important` utility beats the module's *state* rules too — `:hover`, `[data-highlighted]`, `[data-disabled]` selectors are just as unlayered as the base rule — so a stray `bg-*`/`p-*` in a recipe silently freezes hover retint and disabled styling in every state while the default state looks fine. **Values rule (2026-07-06):** recipe strings and new module declarations use native-scale classes or brand tokens only — no arbitrary brackets except deliberate SN one-offs (alert border-radius); nearest-native supersedes value-exact.

**File-placement rule:** a `components/ui/x.js` file exists only when there are ≥2 consumers or a react-bootstrap prop-shim is needed. Single-consumer adoptions use `@base-ui/react/*` parts inline at the call site, skins in the nearest existing module.css. Keeps `ui/` from becoming a re-export museum.

**State-attribute glossary** (so commits don't re-derive it): `[data-popup-open]` `[data-highlighted]` `[data-checked]` `[data-pressed]` `[data-selected]` `[data-disabled]` `[data-invalid]` `[data-panel-open]`. (`[data-starting-style]`/`[data-ending-style]` exist but stay unused — no animations.)

## 2. Commit 0 — dependencies & infra

- `npm i @base-ui/react@^1.6.0 tailwind-merge`. **Base UI is NOT currently installed** (the master plan previously said otherwise — stale). The package is `@base-ui/react`; do NOT install the dead `@base-ui-components/react` (stopped at 1.0.0-rc.0). Peers: `react ^17||^18||^19` — repo is on React 19.2.6 ✓; `date-fns`/`@date-fns/tz` peers are optional, no extra installs.
- `lib/cn.js` (new).
- z-index ladder as tokens in `styles/tailwind.css` `:root`: `--sn-z-sticky: 900; --sn-z-dropdown: 1000; --sn-z-drawer-backdrop: 1040; --sn-z-drawer: 1045; --sn-z-backdrop: 1050; --sn-z-modal: 1055; --sn-z-popover: 1070; --sn-z-tooltip: 1080; --sn-z-toast: 1090`. Base UI portals popups to `<body>`, so this ladder is the single stacking authority; all popup-chrome modules consume these vars.
- `Tooltip.Provider` lands in the Tooltip commit (C3), not here. No Base UI Toast viewport ever (deviation D2).
- State in the PR description: **Menu/dropdowns are `modal={false}` everywhere** (Bootstrap dropdowns never scroll-locked); Dialog and Drawer stay modal (Bootstrap modal/offcanvas do lock scroll + backdrop).

## 3. Directory & file layout

```
lib/cn.js
components/ui/
  button.js + button.module.css      # Base UI Button; 14 variant skins (12 census + outline-warning/outline-grey
                                     # found in stuffed variant props), CSS-var indirection per master plan;
                                     # ALSO exports buttonClasses() for link-as-button sites (§4b/§4c) and Toggle/Menu triggers
  alert.js  + alert.module.css       # color variants + lightning-font X dismiss
  badge.js  + badge.module.css       # color variants
  container.js                       # Tailwind-only; compiled max-widths (sm 540/md 720/lg 900 — verify in devtools)
  tooltip.js + tooltip.module.css    # the fadeIn keyframe lives here
  popover.js + popover.module.css    # chrome + arrow; shared by hoverable-popover, upvote, ToC, link editor
  dropdown.js + dropdown.module.css  # Menu-based; .dropdown-menu/.dropdown-item chrome duplicated under local names
  drawer.js  + drawer.module.css     # placements: end | bottom; backdrop; zero transitions
  nav.js     + nav.module.css        # plain markup + active-key context; .nav-link colors duplicated
  tabs.js                            # thin Base UI Tabs structural wrapper (skin stays consumer-side)
  collapsible.js                     # thin wrapper with no-animation defaults (AccordianItem + pills share it)
components/form/                     # form.js becomes a barrel over this dir
  index.js  use-formik-field.js  use-field-draft.js  field.js  form.js
  input.js  input-group.js  checkbox.js  checkbox-group.js  select.js
  range.js (Slider+NumberField)  multi-input.js (OTP Field)  password-input.js
  copy.js  variable-input.js  submit-button.js  suggest.js  sn-input.js
  date-picker.js  multi-select.js (react-select until C13)
components/form.js                   # barrel: re-exports ./form/index — webpack resolves form.js
                                     # before form/, so zero consumer import changes
```

- **Inline adoptions (no `ui/` file):** Toggle Group in `components/item-act.js`; Switch in `wallets/client/components/form/capability-test-ui.js`; Toolbar/Separator/Menu in `components/editor/plugins/toolbar/index.js`; Popover in `components/editor/plugins/link/editor.js`; Collapsible in `components/payIn/bolt11-info.js` and `wallets/client/components/send/max-fee-field.js` (via `ui/collapsible.js`).
- **Wrappers keep paths + public APIs** (internals only): `components/modal.js` (+ new `modal.module.css` with the `.modal-*` chrome duplicated from globals), `toast.js`, `action-dropdown.js`, `action-tooltip.js`, `hoverable-popover.js`, `accordian-item.js`, `table-of-contents.js`, `login-button.js`, `long-pressable.js`.
- Existing `components/dropdown.module.css` (`dropdownExtra*` skins used by editor toolbar + login-button) stays — SN-custom, not Bootstrap; its `.active` selectors gain `[data-highlighted]` equivalents where Bootstrap drove them.
- **`components/form.js` export surface that must survive the barrel (25):** `Form, Input, ClientInput, VariableInput, Checkbox, ClientCheckbox, CheckboxGroup, Select, Range, DatePicker, DateTimeInput, PasswordInput, MultiInput, SubmitButton, CopyButton, CopyInput, SNInput, BaseSuggest, InputUserSuggest, InputTerritorySuggest, DualAutocompleteWrapper, useDualAutocomplete, MultiSelect (re-export), SessionRequiredError, StorageKeyPrefixContext`.

## 4. Table A — react-bootstrap → replacement

Fresh sweep 2026-07-03: **96 files** import react-bootstrap (the older audit missed `wallets/` and the editor plugins).

| react-bootstrap | Fresh count | Replacement | Commit |
|---|---|---|---|
| Button | 35 files | `ui/button.js` on **Base UI Button** — `render` replaces `as=`, `focusableWhenDisabled`, `[data-disabled]` skin; variant module with CSS-var indirection + `color-mix` hover copied from the Sass mixins (territory retint survives) | C1 |
| Badge ×7 / Alert ×9 / Image ×5 / Row ×8 / Col ×8 / Table ×1 (`fee-button.js`) / CardFooter ×1 (`territory-header.js`) | ~30 | plain markup + Tailwind recipes; `ui/badge.js`, `ui/alert.js`; no wrapper for Image/Row/Col/Table/CardFooter | C2 |
| Container ×9 | 9 | `ui/container.js`, compiled max-widths (globals.scss overrides Bootstrap's map) | C2 |
| Tooltip ×3 + OverlayTrigger ×5 | 8 | `ui/tooltip.js` on Base UI Tooltip; `Tooltip.Provider` in `_app.js`; `side='bottom'` default, collisions off (popper parity), touch-disabled by design; `action-tooltip.js` internals swap | C3 |
| Popover ×3 + Overlay ×1 (`upvote.js`) | 4 | `ui/popover.js`; hover cards → **Preview Card** `delay=500 closeDelay=300` via `hoverable-popover.js` internals; upvote = detached-anchor controlled Popover (§6.9) | C4 |
| Dropdown ×20 (Item ×77, Menu ×16, Toggle ×12, Divider ×7) | 20 | `ui/dropdown.js` on Menu — `modal={false}` mandatory, `align='start'`, sideOffset 2, dual-mode `Dropdown.Item` (context-check: in-menu → `Menu.Item`, outside → plain styled element); incl. split login (§6.8), ToC (§6.5), mentions render swap (§6.4) | C5 |
| Modal — 1 wrapper, ~25 consumers via `useShowModal` | 1 | single controlled `Dialog.Root`, content-swap in one popup; ALL stack/back/keepOpen/persistOnNavigate/fullScreen/overflow logic stays in `modal.js` (`keepOpen` = ignore `onOpenChange(false)`) | C6 |
| Toast — 1 wrapper, ~42 consumers via `useToast` | 1 | deviation D2: state machine byte-for-byte, render plain divs `role='status'` | C7 |
| Form (direct) ×7 (`.Control`×16 `.Text`×18 `.Label`×8 `.Group`×6 `.Check`×6 `.Select`×2 `.Range`×2) + FormControl ×1 (`table-of-contents.js`) | 8 | `components/form/*`: Base UI `Field`/`Input`/`Checkbox`/`Radio` via `useFormikField`; native `<select>` styled to `.form-select` spec (D6) | C9a/C9b |
| InputGroup ×16 (`.Text` ×62) | 16 | `form/input-group.js` flex composition, compound API preserved | C9a |
| Nav ×14 / Navbar ×10 (`Nav.Link`×46, `Nav.Item`×44) | ~22 | `ui/nav.js` plain markup + active-key context (editor mode switch leaves this set in C8a) | C10 |
| Offcanvas ×2 — `nav/mobile/offcanvas.js` (`placement='end'`) **and** `wallets/client/components/home/index.js` (`placement='bottom'`, a bottom sheet) | 2 | `ui/drawer.js` on Base UI **Drawer** (Root/Portal/Backdrop/Viewport/Popup), controlled, swipe off, transitions zeroed, **both placements** | C10 |
| Accordion — 1 wrapper (`accordian-item.js`), 16 consumers | 1 | Base UI **Collapsible** via `ui/collapsible.js`; kills `useAccordionButton`+`AccordionContext` toggle | C11 |
| ButtonGroup ×1 (`login-button.js` split button) | 1 | flex-group Tailwind recipe + Menu (§6.8) | C5 |

Files the old plan missed, now in scope: `components/editor/plugins/mentions.js`, `components/editor/plugins/toolbar/index.js`, `components/editor/plugins/toolbar/switch.js`, `components/table-of-contents.js`, ~9 `wallets/client/**` files (Button ×3, Alert, InputGroup ×4, Form, Offcanvas). Wallets files ride their component-family commits — no separate wallets commit; C11's grep is the backstop.

### 4b. Raw Bootstrap class strings in JSX (the import sweep is blind to these)

~25 files put Bootstrap (or globals.scss-defined) *component classes* directly in `className` strings — no react-bootstrap import involved, so neither the 96-file sweep nor the `grep react-bootstrap` gate sees them. PR3 deletes the globals.scss blocks that style them (each deletion is gated on the class being gone from JSX), so **every one of these must die in PR2** with its component family. Census 2026-07-04 (token counts approximate — some hits are `styles.*` false positives):

| Class family | ~Count | Where | Dies in |
|---|---|---|---|
| `btn btn-*` on `Link`s | 5 sites + 1 dynamic | `pages/wallets/[id]/receive.js`, `wallets/client/components/layout.js`, `wallets/.../form/index.js`, `wallets/.../send/send-success.js`; **dynamic `btn-${isLurker ? 'grey' : 'primary'}` at `nav/common.js:400`** (PR1 deferred it here) | C1 — swap to `buttonClasses({ variant, size })`; the dynamic site becomes a variant ternary |
| `badge` | **0** (census corrected 2026-07-05) | no raw `badge` class strings exist — the ~14 were react-bootstrap `<Badge>` sites (16, Table A) plus 4 CSS-module skins (`styles.badge`/`styles.newComment`, which stay). The one raw Bootstrap *utility* riding a badge is `bg-opacity-75` (`comment.js:252`) | C2 — §11.1 |
| `btn-close`, `alert-dismissible` | 2+2 | `upvote.js` popover headers | C4 — popover close chrome moves into `ui/popover.module.css` under local names |
| `dropdown-item`, `dropdown-divider` | 4+8 | `item-info.js` Links inside menus, nav | C5 — dual-mode `Dropdown.Item` / local divider class |
| `modal-btn`, `modal-back`, `modal-close`, `modal-overflow` | 8 | `modal.js` chrome (SN-custom, defined in globals.scss `.modal-*` blocks) | C6 — move into `modal.module.css` as `styles.*` |
| `form-label` | ~9 | `territory-branding.js`, `job-form.js` raw `<label>`s | C9a — `field.js` label recipe class |
| `form-control` | 4 | `form.js`: Range ∞ chip (:797), clouds skeleton (:982), DateTimeInput (:1062, :1107) | C9a/C9b — Input recipe class |
| `invalid-feedback` | 2 | `form.js:692` (CheckboxGroup feedback) | C9a/C9b — `field.js` error recipe |
| `nav-link` | ~34 | `footer.js` (bulk), `footer-rewards.js`, `cancel-button.js` | C10 — `ui/nav.module.css` local class, mechanical swap |

**Gate (C11, second gate alongside the import grep):** extend PR1's AST-based `scripts/codemods/bs-utility-check.js` with a component-class blocklist (`btn`, `btn-*`, `form-control`, `form-select`, `form-label`, `form-check*`, `invalid-feedback`, `dropdown-item`, `dropdown-divider`, `nav-link`, `modal-*`, `alert-*`, `btn-close`, `badge`, `input-group*`) and require zero hits — it already tokenizes string literals, template chunks, and `classNames()` calls correctly, which a plain grep can't (must not flag `styles.badge` etc.).

### 4c. `Button` used as a link (fix in C1, once `ui/button.js` exists)

Base UI's `Button` doesn't support link semantics (no `href`, no anchor rendering) — deliberately deferred until `ui/button.js` lands, since fixing these now against the react-bootstrap `Button` would just be thrown away. Census 2026-07-05:

| Pattern | Where | Fix |
|---|---|---|
| `<Button href=...>` direct | `components/item-job.js:132-136` ("apply"), `pages/items/[id]/ots.js:45` + `:47` (preimage/ots downloads) | style `<a>`/`<Link>` with `buttonClasses()` instead |
| `<Button as={Link} href=...>` | `wallets/client/components/home/actions.js:55` ("configure") | same file's line 46 already does this correctly on a plain `<Link>` — copy that pattern |
| `<Button>` nested inside `<Link>` (Link owns the `href`, Button is just the visual skin — same underlying problem, and invalid HTML nesting today regardless) | `components/post.js:56-58, 65-67, 72-74, 75-77, 80-82, 83-85` (poll/bounty/link/discussion), `components/territory-header.js:130-132` ("edit territory") | same fix — style the `Link` directly, drop the nested `Button` |

`ui/button.js` exports `buttonClasses()` per §3, so every row above resolves to the same one-line swap: `<Link href={...} className={buttonClasses({ variant, size })}>label</Link>`. Do this sweep as part of C1 once `buttonClasses()` exists, not before.

**✅ Done (2026-07-05), with census corrections:** post.js had **9** nested sites, not 6 (lines 40/48 and the `job` button at :128 were missed); `onClick={checkSession}` moved onto the Links that had it on the inner Button. `territory-header.js:131` doubled as a stuffed-variant site (`variant='outline-grey border-2 …'`) — unstuffed to `variant='outline-grey'` + utilities in `className`. `actions.js:55` rides C9a with its deferred file — last consumer of Button's `href`/`as` shim; drop the shim then.

## 5. Table B — hand-rolled → Base UI (broad adoption)

| Hand-rolled today | File | Base UI parts | What dies | Commit |
|---|---|---|---|---|
| `ToolbarDropdown` (`Dropdown drop='up'` + `MenuAlternateDimension` portal-to-body hack) | `components/editor/plugins/toolbar/index.js` | `Toolbar.Root/Button` + `Menu.Root > Portal > Positioner side='top' > Popup > Item`; trigger composed `Toolbar.Button render={<Menu.Trigger/>}` | `MenuAlternateDimension`, `useIsClient` guard, manual `show`/`onToggle` | C8b |
| toolbar dividers (`<span className={styles.divider}/>`) | same | `Toolbar.Separator` (keeps `styles.divider`) | nothing — gains `role='separator'` | C8b |
| mode switch (`Nav variant='tabs'` write/compose) | `components/editor/plugins/toolbar/switch.js` | `Tabs.Root value onValueChange` + `Tabs.List > Tabs.Tab` (no Panels — the editor body is the panel) | `eventKey`/`onSelect`, `disabled={active}` hack | C8a |
| Lexical link editor (getBoundingClientRect + rAF repositioning + focusout pair + Escape) | `components/editor/plugins/link/editor.js` | controlled `Popover.Root modal={false}` + `Positioner anchor={() => editor.getElementByKey(nodeKey)}` + `Popup initialFocus={false}` | `setFloatingElemPosition` calls, rAF/scroll/resize listeners, manual focusout pair | C8c |
| capability switch (`<label><input role='switch'>` + track) | `wallets/client/components/form/capability-test-ui.js` | `Switch.Root checked onCheckedChange` + `Switch.Thumb`; re-target `wallet.module.css` `:checked` → `[data-checked]` | manual role/track markup | C12 |
| `CheckboxGroup` (feedback-only wrapper) | `components/form.js` (consumer: `territory-form.js` postTypes) | `CheckboxGroup value onValueChange` + child `Checkbox.Root value` reading group context | per-checkbox Formik array plumbing | C9b |
| `Range` (native range + synced number input + ∞ sentinel) | `components/form.js:753` | `Slider.Root/Control/Track/Indicator/Thumb` + `NumberField.Root/Group/Input` (§6.6) | native range styling, `hide-spinners` hack, hand-rolled blur-clamp | C9b |
| `MultiInput` (OTP-style segmented code input) | `components/form.js:1293` (sole consumer: `pages/email.js`) | `OTPField.Root(length, value, onValueChange, validationType)/Input` | ~80 lines of paste/backspace/arrow focus bookkeeping | C9b |
| `ExpandableDetailPill` + more/less chips | `components/payIn/bolt11-info.js` | `Collapsible.Root/Trigger/Panel` (§6.7) | manual `aria-expanded`, `{open && …}` | C12 |
| max-fee toggle | `wallets/client/components/send/max-fee-field.js` | `Collapsible` (controlled — icon swap reads the state) | manual `aria-expanded` | C12 |
| zap `Tips` chips | `components/item-act.js:23` | `ToggleGroup` + `Toggle render={<button className={buttonClasses({size:'sm'})}>}` (§6.12) | nothing removed — **adds** pressed-state affordance (D9) | C12 |
| `LongPressable` (class component) | `components/long-pressable.js` | none — functional rewrite, same props | `React.PureComponent`, PropTypes | C11 |

## 6. Per-component design notes (new-scope specifics)

Existing-scope components (Dialog/modal stack, Toast render layer, dual-mode Dropdown.Item, Tooltip defaults, Preview Card delays, Container widths, native select, Drawer parity) follow the master plan's notes. New scope:

### 6.1 Editor toolbar (C8b)
`Toolbar.Root` wraps the `styles.toolbarFormatting` row — the `toolbarRef` overflow ResizeObserver and `showToolbar` logic stay untouched. Each `ToolbarButton` → `Toolbar.Button` with the `styles.toolbarItem` skin. **Keep `onPointerDown={e => e.preventDefault()}` on every trigger and item** — that's what preserves the Lexical selection today. `ToolbarDropdown` → `Menu.Root modal={false}` with `dropdownOpen` state kept only to feed `ActionTooltip disable`; `Menu.Positioner side='top' align='start' sideOffset={2}`; popup + items keep the `dropdownExtra*` skins; toolbar state drives item active styling (not Menu highlight). Risks: verify the editor selection survives a menu-driven block format (pointer-down prevention should carry it — test explicitly); Toolbar's roving tabindex is a deliberate a11y upgrade over today's keyboard-inert spans (D8).

### 6.2 Mode switch (C8a)
`Tabs.Root value={mode} onValueChange={v => editor.dispatchCommand(TOGGLE_MODE_COMMAND, v)}` + `Tabs.List > Tabs.Tab`. Keep `onMouseDown preventDefault` on the list. Drop the `disabled={activeTab}` hack (the command handler already no-ops same-mode). Selected styling via `[data-selected]` re-targeting the active rules in `lib/lexical/theme/editor.module.css`.

### 6.3 Link editor (C8c)
Controlled `Popover.Root open modal={false}` per nodeKey. `Positioner anchor={() => editor.getElementByKey(nodeKey)} side='bottom' align='start' sideOffset={8}` — floating-ui auto-updates on scroll/resize, killing the rAF machinery. `Popup initialFocus={false}` — view mode must NOT steal editor focus; the edit-mode `inputRef.focus()/select()` effect stays. Map `onOpenChange(false, details)` reasons (`outside-press`, `escape-key`) to the existing `handleCancel()` (which still strips empty/default-URL links via `TOGGLE_LINK_COMMAND null`). **Keep** the Lexical `KEY_ESCAPE_COMMAND` handler — the Popover only sees Escape when focus is inside the popup. All `$updateLink`/autolink-conversion logic stays. `linkeditor.module.css` keeps skins minus positioning/opacity rules. Risk: verify the popup's focus guards don't fire Lexical's `BLUR_COMMAND` (the mentions plugin closes on blur).

### 6.4 Mentions (C5 — deviation D4)
NOT Base UI Menu: `LexicalTypeaheadMenuPlugin` owns the anchor rect and keyboard (arrows/Enter flow through editor commands); Menu would double-manage focus. Swap the `<Dropdown show>` shell for `div[role='listbox']` + `div[role='option'] aria-selected` styled by the dropdown chrome module + existing `styles.suggestionsMenu`; keep `createPortal(…, anchorElementRef.current)`, `onMouseDown preventDefault`, z via `var(--sn-z-dropdown)`.

### 6.5 Table of contents (C5 — deviation D5)
Popover, not Menu — Menu's typeahead eats printable keys and an `<input>` inside `Menu.Popup` fights item highlight (master risk 5). `Popover.Trigger render={<a>}` kills the forwardRef `CustomToggle`; the popup is an SN `Input`-recipe filter field + a plain list of heading links (kills `CustomMenu`); controlled `open` so a heading click closes before emitting navigation.

### 6.6 Range → Slider + Number Field (C9b)
Formik stays the single source of truth; both widgets are controlled from `field.value`. Slider: `min={allOption ? min - step : min}`; `value={isAll ? sliderMin : field.value}`; `onValueChange` maps `v <= sliderMin → setValue(null)` — the ∞ sentinel transfers verbatim (`null` ⇒ thumb pinned one step below min ⇒ ∞ chip rendered instead of the number field, exactly as today). NumberField: `min/max/step`, **`format={{ useGrouping: false }}`** (Intl grouping would print `1,000` where the old input printed `1000`), clamp-on-blur is native (replaces the hand-rolled handler). The `hide-spinners` hack dies (NumberField.Input is a text input). Tick-label percent math stays under `Slider.Control`. Only write Formik from user events — never sync widget→widget (echo-loop risk 3). Consumers: `territory-form.js`, `pages/settings/index.js`.

### 6.7 Collapsible pills (C12)
`ExpandableDetailPill`: uncontrolled `Collapsible.Root` + `Trigger render={<button>}` (free `aria-expanded`; the `+/-` indicator flips via `[data-panel-open]` CSS). The more/less chip row: controlled `Collapsible.Root` with the chip as Trigger and **`Collapsible.Panel className='contents'`** so the panel div doesn't break the flex-wrap chip row. No height animation (keystone 5). Same recipe for `max-fee-field.js`.

### 6.8 Split login button (C5)
`inline-flex w-full` group: [SN Button `variant='success'` grow `rounded-e-none`] + `Menu.Root modal={false}` with `Menu.Trigger render={<button className={cn(buttonClasses({ variant: 'success' }), 'rounded-s-none max-w-[42px]')}>}`. Replicate Bootstrap's `.btn-group > .btn` −1px border collapse with `-ms-px` if the compiled skin has borders. Menu items keep the `dropdownExtraItem` skins. Kills the last `ButtonGroup` import.

### 6.9 Upvote walkthrough popovers (C4/C5)
`UpvotePopover`/`TipPopover` → controlled `Popover.Root open={show} onOpenChange={o => !o && handleClose()} modal={false}` with **no Trigger**; `Positioner anchor={target.current} side='right'` (matches `Overlay placement='right'`); `Popup` reuses `ui/popover.module.css` chrome + the existing lightning-X close button. The file's `Dropdown` import swaps in C5 (file completes there).

### 6.10 Radios (C9a)
SN's `Checkbox` supports `type='radio'` — sole consumer is `territory-form.js` (billingType ×3, shared `name`). Keep the public API. Implementation choice at C9a: (a) native `<input type='radio'>` styled to the compiled `.form-check-input` spec — zero consumer diffs, Formik's native radio semantics and browser arrow-key group nav for free (same pragmatism as native `<select>`, D6); or (b) Base UI `Radio.Root`/`Radio.Indicator` under a `RadioGroup` bound once to the shared field — data-attribute styling consistency, but the one consumer needs a group wrapper. Default to (a) unless the checkbox skin work makes (b) free.

### 6.11 Nav Indicator (C10)
`nav/common.js:165` composes `` bg-${variant} `` at runtime (reachable: `secondary`, `danger`) — invisible to Tailwind's scanner, currently served by Bootstrap's CSS. C10 rewrites it as a literal ternary (`variant === 'danger' ? 'bg-danger' : 'bg-secondary'`) so the scanner sees full class names; this removes both from PR3's runtime-class safelist burden (PR3 §8b then only carries the `text-*` family).

### 6.12 Tips → Toggle Group (C12)
Selection is **derived, not stored**: `const [{ value: amount }] = useField('amount')` inside `Tips` (it renders within the ItemAct form). `ToggleGroup value={tips.includes(Number(amount)) ? [String(amount)] : []} onValueChange={v => v.length && setOValue(Number(v[0]))}` — ignore empty arrays so clicking the pressed chip is a visual no-op. Typing a custom amount naturally clears the pressed state; typing a preset amount lights its chip. `[data-pressed]` skin is a deliberate new affordance (D9). localStorage custom-tips logic untouched.

## 7. Table C — deliberate deviations

| # | Thing | Decision | Why |
|---|---|---|---|
| D1 | modal stack | one controlled `Dialog.Root`, content swap | nested Dialogs can't express back/keepOpen/overflow semantics (modal.js:39–42 ordering comment is load-bearing) |
| D2 | toast | state machine byte-for-byte; plain divs `role='status'` | Base UI Toast lacks tag-dedup "(N) msg", progress `animationDelay` resync, persistOnNavigate |
| D3 | BaseSuggest @/~ | logic 100%; render → caret-anchored `role='listbox'` | Base UI Autocomplete can't anchor to a textarea caret with foreign focus; kills the `opacity !important` workaround |
| D4 | mentions menu | plain listbox inside Lexical typeahead | Lexical owns keyboard + anchor; Menu would double-manage focus |
| D5 | table of contents | Popover + filter input, not Menu | Menu typeahead steals printable keys from the filter field |
| D6 | Form.Select | native `<select>` styled to `.form-select` spec | optgroups + native mobile picker parity |
| D7 | react-datepicker, qr-scanner, countdown, carousel, pull-to-refresh, comment collapse, `useOverflow`, dark-mode hook | untouched | no Base UI equivalent / localStorage- or hardware-coupled |
| D8 | toolbar keyboard nav | Toolbar roving focus added | strict a11y upgrade over keyboard-inert spans — intended delta |
| D9 | Tips pressed state | `[data-pressed]` visual added | intended affordance upgrade (locked decision) |
| D10 | MultiSelect | react-select until optional C13 (Combobox `multiple`) | droppable, doesn't block PR3 |

## 8. Commit order (each leaves the app shippable)

| # | Commit | Contents | Gate |
|---|---|---|---|
| C0 ✅ | infra | `npm i @base-ui/react@^1.6.0 tailwind-merge`; `lib/cn.js`; `--sn-z-*` ladder; conventions in PR description | build passes |
| C1 ✅ | Button | `ui/button.js` (+module, 14 skins) on Base UI Button; swap 35 files incl. wallets (7 deferred per risk 7a/§0; Tips stay Buttons until C12); §4b `btn btn-*` string sites → `buttonClasses()` incl. the dynamic `nav/common.js:400` ternary; §4c link-Button sweep | branded-territory hover retint, light+dark ✓ QA 2026-07-05 |
| C2 | static leaves | Badge/Alert/Image/Container + Row/Col utility swaps + Table (`fee-button.js`) + CardFooter (`territory-header.js`) — **full spec §11** | visual diff |
| C3 | Tooltip | `ui/tooltip.js`; `Tooltip.Provider` in `_app.js`; `action-tooltip.js` internals; direct files | fadeIn = only surviving popup animation |
| C4 | Popover/PreviewCard | `ui/popover.js`; `hoverable-popover.js` internals; upvote Overlay → anchored Popover | hover cards 500/300 delays |
| C5 | Dropdown/Menu | `ui/dropdown.js` (`modal={false}`, dual-mode Item); `action-dropdown.js`; 20 files incl. split login (§6.8), ToC (§6.5), mentions (§6.4); upvote.js finishes | no scroll-lock; viewport-edge collision |
| C6 | Dialog | `modal.js` internals + `modal.module.css`; ~25 consumers untouched | zap→QR→back stack; keepOpen |
| C7 | Toast | render layer only | dedup count + progress resync |
| C8a | editor: Tabs | mode switch → `ui/tabs.js` + `switch.js` rewrite | write/compose parity, no focus loss |
| C8b | editor: Toolbar | Toolbar+Menu+Separator rewrite; `MenuAlternateDimension` dies | selection survives menu format |
| C8c | editor: link Popover | `link/editor.js` rewrite (§6.3) | link-editor checklist (§9) |
| C9a | form core + barrel | `components/form/` split (25 exports), `form.js` barrel; Input/Field/Checkbox/native-select/InputGroup on Base UI; suggest render swap (D3); Range/CheckboxGroup/MultiInput moved but legacy-shaped | drafts persist; invalid-after-submit-only |
| C9b | form semantics | Range → Slider+NumberField (§6.6); CheckboxGroup; MultiInput → OTP Field | ∞ sentinel; `/email` code entry |
| C10 | Nav/Navbar/Drawer | `ui/nav.js` + ~22 files; `ui/drawer.js` **end + bottom**; both Offcanvas consumers; §4b `nav-link` string sweep (footer); Indicator literal ternary (§6.11) | offcanvas snap, backdrop, bottom sheet |
| C11 | **rb-zero** | `ui/collapsible.js` + `accordian-item.js` internals (last import); `long-pressable` functional rewrite | `grep -rn "react-bootstrap" components pages wallets lib` → **0**; extended `bs-utility-check.js` component-class gate (§4b) → **0** |
| C12 | broad-adoption upgrades | capability Switch (§Table B); bolt11 + max-fee Collapsible (§6.7); Tips Toggle Group (§6.12) | §9 additions |
| C13 | optional | MultiSelect → Combobox `multiple` + chips | — |

Editor work is split three ways (C8a/b/c) because each piece is independently shippable and reviewably small; C8 sits after C3 (needs ActionTooltip) and C5 (needs menu chrome). C12 sits **after** the rb-zero gate — pure hand-rolled→Base UI upgrades, off the migration-critical path.

## 9. Interaction-parity checklist (additions for the new scope)

Master plan's checklist (modal stack, toast dedup, dropdown edges, @/~ keyboard, offcanvas, form validation/drafts, datepicker, territory retint, dark toggle, iOS zoom) still applies. Add:

- **Toolbar**: menu opens above (`side='top'`); pointer format keeps Lexical selection and applies; tooltips suppressed while a menu is open; Escape closes menu, focus returns to editor; arrow-key roving focus (new, expected).
- **Mode switch**: toggles sync Formik; upload-in-progress still blocks with toast; same-tab click no-ops; no editor focus loss.
- **Link editor**: view-mode open steals no focus; edit mode focuses+selects input; Enter confirms / Escape cancels from both popup and editor; outside click cancels and strips empty links; autolink→link conversion; position tracks scroll/resize; icon clicks don't dismiss.
- **Mentions**: `@`/`~` opens at caret; Lexical arrows/Enter/Escape; editor blur closes; click-select keeps editor focus.
- **ToC**: filter input receives all printable keys; heading click closes then navigates.
- **Tips**: chip click sets amount; pressed chip = current amount; typed custom amount clears pressed; clicking the pressed chip keeps the value; localStorage custom tips appear sorted.
- **Range**: slider to floor with `allOption` → null/∞ in both directions; typed number moves slider; blur clamps; no digit grouping; territory + settings forms submit identical values.
- **CheckboxGroup**: postTypes array membership toggles; error only after submit.
- **OTP (`/email`)**: type-advance, backspace-retreat, paste-fill, uppercase; do NOT enable `autoSubmit` (parity).
- **Capability switch**: toggles `${key}.enabled`; label reflects state.
- **Collapsible pills**: more/less expands inline with no flex-row layout shift; `aria-expanded` correct; zero animation.
- **Drawer**: right nav drawer + wallets bottom sheet; backdrop click and X close; no swipe.
- **Split login**: renders as one visual button; main routes, caret opens account menu.
- **Upvote walkthrough**: popovers anchor right of the bolt; dismiss X; show-once flags persist.

## 10. PR2-specific risks

1. **Lexical focus vs Base UI popups** — toolbar Menu focus-return and link-editor focus guards vs `BLUR_COMMAND`; mitigations in §6.1/§6.3; test mentions + link editor together.
2. **NumberField Intl formatting** — `format={{ useGrouping: false }}`; verify iOS numeric keyboard (`inputMode`).
3. **Slider⇄Formik echo loops** — single-direction writes only (user events → Formik).
4. **`Collapsible.Panel` wrapper div in flex-wrap rows** — `className='contents'`.
5. **Menu default scroll-lock** — `modal={false}` everywhere (repeat of master risk 5, it will bite otherwise).
6. **Barrel-split regressions** — C9a is move-only + Input swap; review the diff keyed on the 25-export list.
7. **InputGroup corner-joining vs the utility cascade** — Bootstrap flattens grouped children's inner corners with unlayered-normal rules; the Button recipe's `rounded-sn` is layered-`!important` and beats them. Two consequences: (a) **C1 must NOT swap Buttons nested inside live InputGroups** — resolved by deferring the WHOLE files (single-import cleanliness): user-header.js, item-act.js, pages/settings/index.js, pages/rewards/index.js, wallets home/actions.js, form.js → C9a; login-button.js → C5 (ButtonGroup, same trap); (b) the new `form/input-group.js` cannot flatten child corners from its module (same cascade loss) — it must inject `rounded-s-none`/`rounded-e-none` utilities into first/middle/last children.

## 11. C2 expansion — static leaves (censused 2026-07-05)

Fresh per-site censuses of every C2 family, verified against globals.scss and compiled Bootstrap. Headline numbers: **Badge 7 files / 16 sites** (only `bg` + `className` are ever passed — no `pill`/`text`/`as`), **Alert 9 files / 11 sites** (variants `info`/`danger`/`warning` only; no site uses `show`), **Container 9 files / 10 sites** (none `fluid`; 4 need `as=`), **Row/Col 8 files** (no `align`/`justify`/`g-*` anywhere in the codebase), **Image 5 files / 8 sites** (none `fluid`; one `roundedCircle`), **Table ×1**, **CardFooter ×1**. `components/badge.js` (user-badge SVG icons, `Badges` export) is unrelated to react-bootstrap Badge — the new file is `components/ui/badge.js`; don't confuse them in imports.

### 11.0 The cascade rule that shapes everything below

Badge is the first component whose consumers override the skin from **module CSS**, not just `className` utilities: `item.module.css .newComment` and `notifications.module.css .badge` both carry `color`/`background !important` written to beat Bootstrap's unlayered `.badge`. Our Tailwind utilities are layered-`!important`, and for `!important` declarations layer order **inverts**: a layered-important utility beats even an unlayered `!important` module declaration. Consequence: **any property named in a recipe's utility string is unoverridable by consumer module CSS.** So C2 recipes split like this:

- Properties consumer skins override today (`color`, `background-color`) live in the ui module as plain unlayered declarations. The existing `!important` skins keep beating them exactly as they beat Bootstrap today — independent of CSS-module import order, which follows the webpack import graph and is NOT a reliable cascade tool. *(Revised 2026-07-06: the two badge shout-skins ended up **absorbed** into badge.module.css as the `.grey` variant instead — same-module var assignments need no `!important`, and the skins' `!important` had nothing left to beat once the swapped spans stop carrying Bootstrap's literal `badge` class. The bucket rule still binds for any consumer skin that stays outside the ui module.)*
- Everything else (box metrics) goes in recipe utilities per keystone 6.
- Consumer-skin declarations that are *not* `!important` today and only win by globals-before-modules load order (`vertical-align`, negative margins) move to call-site utilities — they're layout anyway.

This regime is **transitional** (decided 2026-07-05): the utility `!important` exists only to out-shout Bootstrap's unlayered CSS, and is scheduled for removal after PR3 — see the master plan's post-migration **cascade de-escalation** cleanup (drops the flag *paired* with wrapping skins in `@layer components`, preserving the utilities-win contract without `!important`). Until then the buckets above bind; the var-based skins C2 builds are already the shape the end-state needs.

### 11.1 `ui/badge.js` + `badge.module.css`

API mirrors Button: `badgeClasses({ variant, className })` + default-export `<Badge variant className>` rendering a `<span>`. Unlike react-bootstrap there is **no default variant** (rb defaults to `primary`; every SN site passes `bg` explicitly or `bg={null}`) — omitted `variant` ⇒ skin-only badge, background transparent.

Recipe: `cn(styles.badge, variant && styles[variant], BASE, className)` with
`BASE = 'inline-block py-[0.35em] px-[0.65em] text-[0.75em] font-bold leading-none text-center whitespace-nowrap rounded-sn'`
(compiled `.badge`: padding `.35em .65em`, font-size `.75em` — em units on purpose, badges scale with context — weight 700, line-height 1, radius `.4rem` = `rounded-sn`). `vertical-align: baseline` is the initial value — deliberately NOT declared; sites that need `middle`/`text-top` set it per-site via call-site utilities (`align-middle`/`align-text-top`).

```css
.badge { color: var(--sn-badge-color, #fff); background-color: var(--sn-badge-bg, transparent); }
.badge:empty { display: none; }  /* Bootstrap parity */
.grey {
  --sn-badge-color: var(--theme-grey);
  --sn-badge-bg: var(--theme-clickToContextColor);
}
.secondary { --sn-badge-bg: rgba(var(--bs-secondary-rgb), var(--sn-badge-opacity, 1)); }
.boost     { --sn-badge-bg: rgba(var(--bs-boost-rgb), var(--sn-badge-opacity, 1)); }
.danger    { --sn-badge-bg: var(--sn-danger); }
.success   { --sn-badge-bg: var(--sn-success); }
.warning   { --sn-badge-bg: var(--sn-warning); }
.info      { --sn-badge-bg: var(--sn-info); }
```

- `.secondary`/`.boost` use the `--bs-*-rgb` triplets so (a) the branded-territory retint flows through (custom-css.js overrides `--bs-secondary-rgb` at `:root`; territory-header's nsfw badge renders on exactly those pages) and (b) the one `bg-opacity-75` site keeps its 75% alpha via `--sn-badge-opacity`. `boost` is in `$theme-colors` (globals.scss:21) so `--bs-boost-rgb` exists until PR3.
- `.grey` (added 2026-07-06) **absorbs the two copy-pasted legacy shout-skins** — `item.module.css .newComment` and `notifications.module.css .badge` had identical grey-on-clickToContext `!important` colors (only their margins differed; those move to call-site utilities, see the table). Named for its value (`--theme-grey`), matching Button's grey family. Dark mode is free — both `--theme-*` vars already flip with the theme, which is why the old skins never needed a dark selector. This pre-empts the master plan's de-escalation follow-up (3) for badge.
- Text is `#fff` for every *Bootstrap-derived* variant (Bootstrap badge has no YIQ). Parity — do NOT "fix" secondary with `--sn-secondary-text`. `.grey` is the one variant that sets `--sn-badge-color`, by design.
- Drop `.btn .badge { top: -1px }` (no badge-in-button sites exist).
- Only build these 7 variants (`primary` is unused).

Site-by-site (16):

| Sites | Today | C2 swap |
|---|---|---|
| item-info.js:175/181/184/190, comment.js:54, item-job.js:92 | `bg={null} className={styles.newComment}` | `variant='grey' className='align-middle -mt-px ms-[0.1rem]'`; **delete `.newComment` from item.module.css** (revised 2026-07-06 — absorbed as `.grey`; the `!important` only existed to beat Bootstrap's `.badge`, which stops matching post-swap). Check comment.js's `itemStyles` import for deadness after |
| notifications.js:586 | `bg={null} className={styles.badge}` | `variant='grey' className='align-middle ms-2'` (this copy's margin was `0.5rem`, no top nudge); **delete `.badge` from notifications.module.css** |
| item-job.js:97 | `bg='info' className={styles.badge}` (item.module.css:62, **no** `!important`) | `variant='info' className='align-middle -mt-px ms-[0.1rem]'`; delete `.badge` from item.module.css (sole consumer) — its non-important declarations would be order-dependent vs our module base |
| comment.js:252 | `` bg={op === 'fwd' ? 'secondary' : 'boost'} className={`${styles.op} bg-opacity-75`} `` | `variant={op === 'fwd' ? 'secondary' : 'boost'} className='align-text-top -mt-px [--sn-badge-opacity:0.75]'`; delete `.op` from comment.module.css (sole consumer, same order-dependence); `bg-opacity-75` is a Bootstrap utility and must not survive C2 |
| territory-header.js:38/:39 | `bg='danger'`/`bg='secondary'` + `ms-2` | mechanical `variant=` swap, keep `ms-2` |
| territory-domains.js:33/35/55/56 | `bg='success'/'warning'/'secondary'/'success'` | mechanical |
| territory-form.js:291 | `bg='secondary'` | mechanical |

`styles/satistics.module.css .badge` (and `satistics_old`) match the skin shape but no JSX in components/pages/wallets applies them — treat as dead, leave for PR3's module sweep.

### 11.2 `ui/alert.js` + `alert.module.css`

Keep the compound API so consumers are drop-in: default export `Alert({ variant, dismissible, onClose, className, children, ...props })` plus `Alert.Heading` and `Alert.Link` assigned as properties (plain function properties, no classes). No `show` prop — zero sites use it (all gate with conditional rendering), and rb without `show` never animates, so keystone 5 is satisfied for free.

```jsx
<div role='alert' className={cn(styles.alert, styles[variant], dismissible && styles.dismissible, className)} {...props}>
  {children}
  {dismissible && <button type='button' className={styles.close} onClick={onClose} aria-label='Close alert'>X</button>}
</div>
```

```css
.alert {
  position: relative;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 33% 2% / 11% 74%;  /* $alert-border-radius; $alert-border-width: 0 → no border rule at all */
  color: color-mix(in srgb, #000 60%, var(--sn-alert-base));            /* = shade-color($c, 60%) */
  background-color: color-mix(in srgb, #fff 80%, var(--sn-alert-base)); /* = tint-color($c, 80%) */
}
:global([data-bs-theme='dark']) .alert {
  color: color-mix(in srgb, #fff 40%, var(--sn-alert-base));            /* = tint-color($c, 40%) */
  background-color: color-mix(in srgb, #000 80%, var(--sn-alert-base)); /* = shade-color($c, 80%) */
}
.info    { --sn-alert-base: var(--sn-info); }
.danger  { --sn-alert-base: var(--sn-danger); }
.warning { --sn-alert-base: var(--sn-warning); }
.dismissible { padding-right: 3rem; }
.close {
  position: absolute; top: 0; right: 0; z-index: 2;
  padding: 1.25rem 1rem;
  background: none; border: 0; color: inherit; cursor: pointer;
  font-family: lightning; font-weight: 300; font-size: 150%; line-height: 1;
}
```

- **Dark mode is real**: `$enable-dark-mode` is not overridden and `components/dark-mode.js` drives `data-bs-theme` on `:root`, so Bootstrap emits dark `-bg-subtle`/`-text-emphasis` tokens today. The `:global([data-bs-theme='dark'])` block reproduces them (module-file precedent: linkeditor.module.css). `color-mix` in srgb ≡ Sass `mix()` — same equivalence C1 verified value-exact for Button hovers. Expected light values to eyeball in devtools before deleting: info `#cce5f2`/`#00324c`, danger `#f2d6d3`/`#4d140d`, warning `#fde9d2`/`#623a0c`.
- **Close chrome**: today's dismiss is Bootstrap `.btn-close` restyled by globals.scss:753-789 (lightning font, `::after { content: 'X' }`). We render the glyph as a literal child like modal.js:112 does. **Devtools check before building**: whether Bootstrap's residual svg `background-image` and `opacity: .5`/hover `.75` are visibly part of today's paint — replicate what's actually painted, not what the scss reads like ($close-color/$close-text-shadow in globals are dead Bootstrap-4 var names).
- `Alert.Heading` = `<div className={cn('text-reset font-medium leading-[1.2] mb-2', H4, className)}>` where `H4` is the fs-4/h4 fluid clamp from [bootstrap-tailwind-tokens.md](./bootstrap-tailwind-tokens.md) (rb renders `.alert-heading.h4`; `.alert-heading` is just `color: inherit`).
- `Alert.Link` = `<a className={cn('font-bold text-reset', className)} {...props}>` — compiled `.alert-link` color equals the alert text color, so inherit reproduces it; `$link-decoration: none` means no underline handling; layered-important `text-reset` also beats globals' `a:hover`, matching today (alert links don't change color on hover).

Site-by-site (11) — all keep `variant`/`dismissible`/`onClose`/`className` verbatim, only the import changes; notes on the non-mechanical ones:

| Site | variant | Notes |
|---|---|---|
| banners.js:9 (MadnessBanner) | info | dismissible; uses `Alert.Heading` + `Alert.Link` ×4 — compound API keeps it drop-in |
| banners.js:40 (AuthBanner) | danger | plain `next/link` child, untouched |
| snl.js:27 | info | `onClose` writes localStorage — behavior stays in consumer |
| post.js:104 | danger | `className='absolute'` + inline `top: -6rem` — the utility (layered-important) beats module `position: relative` exactly as it beats Bootstrap today |
| delete.js:71, login.js:118, notifications.js:799, settings/logins.js:188 | danger | mechanical |
| territory-payment-due.js:37 | danger | not dismissible; `Alert.Heading` ×2; contains a `<Form>` + FeeButton — untouched |
| notifications.js:808 | info | embeds two `styles.alertBtn` buttons — untouched |
| wallets/.../send-error.js:11 | **dynamic** `{error.variant}` → `warning`\|`danger` | both skins exist; `classNames(styles.fields, 'mt-4 mb-0')` composes through cn (`mb-0` utility beats module `margin-bottom`) |

### 11.3 `ui/container.js` (Tailwind-only)

```jsx
export default function Container ({ as: As = 'div', className, ...props }) {
  return <As className={cn('w-full mx-auto px-4 sm:max-w-[540px] md:max-w-[720px] lg:max-w-[900px]', className)} {...props} />
}
```

- `px-4` = 1rem = half of SN's `$grid-gutter-width: 2rem` override (globals.scss:94 — **not** stock Bootstrap's 1.5rem).
- Max-width map verified at globals.scss:72-76: sm 540 / md 720 / lg 900, **no xl/xxl tiers** — 900px holds for all ≥992px viewports, which `lg:max-w-[900px]` reproduces since nothing overrides it above. Tailwind's `@theme` breakpoints already equal Bootstrap's (576/768/992).
- `fluid` is unused — don't build it. `as=` is used at 4 sites, keep the polymorphic render.
- Consumer overrides compose: `px-0` drops the recipe's `px-4` via twMerge; `sm:px-0` coexists with base `px-4` (different modifier), matching today's semantics exactly.

Sites (10): layout.js:21 `as={PullToRefresh}` + `` `sm:px-0 ${styles.contain} ...` `` (verify PullToRefresh spreads className — it receives it from rb today); nostr-auth.js:245 and lightning-auth.js:52 (no props); search.js:70 `px-0` + module; footer.js:156 `mb-4`; nav/desktop/header.js:8 `as='header' px-0`; nav/mobile/header.js:8 `as='header' sm:px-0`; nav/static.js:9 `as='header' sm:px-0`; nav/sticky-bar.js:32 `px-0 hidden md:block` and :48 `sm:px-0 block md:hidden`.

### 11.4 Row/Col swap map (no wrapper — inline utilities)

With the 2rem gutter, `.row` margins are −1rem and col padding 1rem ⇒ Tailwind step `4`:

| Bootstrap output | Utilities |
|---|---|
| `.row` | `flex flex-wrap -mx-4` |
| every `<Col>` | `shrink-0 px-4` plus one of ↓ |
| `.col` (bare, incl. `xs` and no-prop `<Col>`) | `grow basis-0` (compiles `flex: 1 0 0%`; with basis 0 the `.row > *` width:100% never matters) |
| `.col-auto` (`xs='auto'`) | `w-auto` |
| `.col-{n}` | `w-1/2` (6) / `w-1/3` (4) / `w-1/4` (3) |
| `.col-md` (bare responsive) | `w-full md:grow md:basis-0` (`w-full` reproduces the stacked-below-breakpoint state) |
| `.col-md-{n}` / `.col-sm-auto` | `w-full md:w-…` / `sm:w-auto` |

Per-site:
- **nostr-auth.js** — Row:251 (`w-full text-muted`); Col:252 `md` + `ps-0 mb-6` → `shrink-0 px-4 w-full md:grow md:basis-0 ps-0 mb-6`; Row:257 plain → Col:258 bare; Row:301 plain → Col:302 `xs` (= bare); Col:323 `md` + `mx-auto` + `style={{maxWidth:'300px'}}` (style stays).
- **lightning-auth.js** — same shapes, but `<Col md={md} lg={lg}>` takes `md=12 lg=6` from component props. **Check callers first**: if only defaults are ever passed, `col-md-12` is a no-op (`.row > *` is already full width) ⇒ `shrink-0 px-4 w-full lg:w-1/2 …` and delete the props.
- **job-form.js** — Row:65 `me-0` ⇒ write `flex flex-wrap -ms-4` (fold the dead right margin instead of stacking `-mx-4 me-0` and betting on output order); Col:66 bare; Col:73 `xs='auto'` + `flex ps-0`.
- **territory-form.js** — Row:178; Col ×4 `xs={4} sm='auto'` ⇒ `shrink-0 px-4 w-1/3 sm:w-auto`.
- **pages/satistics/graphs/[when].js** — Row:62 `my-6` → Col ×3 `xs={6} md={4} text-center mb-4` ⇒ `w-1/2 md:w-1/3`; Rows :98/:108 plain → bare Cols with `mt-4`.
- **pages/stackers/[sub]/[when].js** — same shapes with `md={3}` ⇒ `md:w-1/4`; Rows :128/:138/:148 plain → bare Cols `mt-4`.
- **form.js** (Row:395/Col:396 bare; Col:671 `xs='auto' flex ps-0`; Row:681 `mb-2`/Col:682) and **pages/rewards/index.js** (Row:85 `pb-4`/Col:86) — swept here per §11.8.

Longhand note: recipes stack `px-4` + consumer `ps-0`. Tailwind sorts shorthands before longhands so `ps-0` should win — **verify once in compiled output** (risk 2 below), since both are layered-important and only source order decides.

### 11.5 Image (plain `<img>`, no wrapper)

rb `Image` without boolean props renders a bare `<img>` with no added class — all sites are 1:1 tag swaps keeping `src`/`width`/`height`/`className`/`onClick`: item-job.js:28, user-list.js:41/:69/:120/:204, user-header.js:102 (§11.8), nav/mobile/offcanvas.js:18 (has `onClick`). Exception: job-form.js:45 `roundedCircle` → `rounded-full` (50% vs 9999px — identical on a 135×135 square).

### 11.6 fee-button Table → plain `<table>`

`<Table className={styles.receipt} borderless size='sm'>` → `<table className={styles.receipt}>`. The module already re-declares almost everything Bootstrap contributed (width, bg, td padding — which beats globals' ≥899px `.table-sm` padding by load order today — colors, tfoot border; `margin: auto` already neutralizes `.table`'s `margin-bottom`). Add to fee-button.module.css what silently came from elsewhere:
- `.receipt { border-collapse: collapse; }` (currently Bootstrap reboot; PR3 deletes reboot — do it now)
- `.receipt td { line-height: 1.2rem; vertical-align: top; }` (currently globals.scss:459 `.table-sm` rule; vertical-align is belt-and-suspenders — single-line rows can't visibly differ)

`borderless`/`size='sm'` drop with nothing to preserve. The deprecated `align='right'` td attributes stay (parity, out of scope).

### 11.7 territory-header CardFooter → plain `<div>`

`<CardFooter className={`py-1 ${styles.other}`}>` → `<div className={`py-1 px-4 ${styles.other} ${styles.cardFooter}`}>` with an item.module.css addition (nearest existing module, already imported as `styles` there):

```css
.cardFooter {
  background-color: rgba(var(--bs-body-color-rgb), 0.03);   /* --bs-card-cap-bg */
  border-top: 1px solid var(--bs-border-color-translucent);
}
```

Compiled `.card-footer` padding is `.5rem 1rem`; `py-1` already overrode y, so x becomes `px-4`. Both `--bs-*` vars flip with `data-bs-theme`, so dark mode rides along until PR3. Devtools check: whether today's footer visibly gets `.card-footer:last-child`'s bottom radius inside the AccordianCard — if so, add `border-radius: 0 0 calc(0.4rem - 1px) calc(0.4rem - 1px)`.

### 11.8 Deferred-file overlap — decision

Three §0-deferred files carry C2 families: form.js (Row/Col ×3 clusters), pages/rewards/index.js (Row/Col ×1), user-header.js (Image ×1). **C2 sweeps them.** The risk-7a deferral protects Buttons inside live InputGroups; Row/Col/Image swaps touch neither buttons nor corner-joining, and pre-cleaning form.js keeps C9a's "move-only" diff pure (the barrel split then carries plain markup). Their react-bootstrap import lines survive until C9a/C5 regardless — C11's grep is the gate that cares.

### 11.9 Gates & QA

- Import grep: `grep -rnE "from 'react-bootstrap" components pages wallets lib | grep -E "\b(Badge|Alert|Container|Row|Col|Image|Table|CardFooter)\b"` → **0**.
- Raw-utility grep: `grep -rn "bg-opacity" components pages wallets` → **0**.
- Alert compiled-color parity: devtools-compare all three variants, light **and** dark, against the color-mix values before deleting anything.
- Visual-diff pass (light + dark): item rows + a comment thread (grey `variant='grey'` chips — subName/nsfw/freebie/downsats; OP badge `fwd` vs `boost` incl. the 75% alpha); job item (stopped chip + company logo); territory header **on a branded custom domain** (nsfw badge must retint via `--bs-secondary-rgb`); territory domains settings (verified/pending/HOLD/active); territory form (nsfw badge in copy; postTypes Row at <576/≥576); notifications (error alert, notify-prompt alert with its Yes/No buttons, autowithdraw chip); login page + lightning/nostr auth at <768/≥768/≥992 (Row/Col grids); post error alert (absolute, `top: -6rem`); wallet send error (warning **and** danger); settings/logins error alert; fee receipt popover (td line-height 1.2rem); territory info footer chrome; all headers + footer + search + sticky bar (container caps 540/720/900, `as=` sites still render `header`/PullToRefresh); satistics + stackers stat grids across the md breakpoint; mobile offcanvas avatar.

### 11.10 C2-specific risks

1. **The §11.0 inversion** — never add `text-*`/`bg-*` utilities to `badgeClasses` BASE or to call sites; a layered-important utility beats the module color declarations (even `!important` ones) and freezes the variant in every state.
2. **`px-4` + `ps-0` longhand ordering** — verify once in compiled CSS that the longhand wins (both layered-important; Tailwind's shorthand-first sort should handle it).
3. **Alert dark tokens + close-button chrome** — devtools before/after; don't trust the scss reading (dead BS4 `$close-*` vars, possible residual `.btn-close` svg/opacity).
4. **`as={PullToRefresh}`** (layout.js) — confirm className passthrough so the container padding/max-width land on the wrapper element.
5. **lightning-auth `md`/`lg` props** may be dead parameters — verify callers before hardcoding `lg:w-1/2`.
6. **CSS-module import order is not a cascade tool** (§11.0) — anything that must beat the ui module base needs `!important` or call-site utilities; that's why item.module.css `.badge`/`.newComment`, comment.module.css `.op`, and notifications.module.css `.badge` are all deleted (absorbed into variants or replaced by utilities) rather than left to race.

### 11.11 PR3 handoff notes

C2 skins newly consume four `--bs-*` vars that PR3's variable sweep must alias or replace: `--bs-secondary-rgb`, `--bs-boost-rgb` (badge), `--bs-body-color-rgb`, `--bs-border-color-translucent` (card footer). Grep `--bs-` under `components/ui/` + item.module.css when PR3 starts. The alert module's `[data-bs-theme='dark']` selector also survives into PR3's theme mechanism. badge.module.css additionally reads `--theme-grey` + `--theme-clickToContextColor` (`.grey` variant) — SN-owned vars that survive PR3; no action needed, listed so the var-grep result isn't a surprise.
