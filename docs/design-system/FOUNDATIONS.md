# Relok8 Design System Foundations

**Status:** Step 3A foundation  
**Principle:** Extend the existing Relok8 interface incrementally. Do not redesign working journeys merely to adopt a component.

## Foundations

The source of truth for visual tokens is `src/index.css`. Components should use semantic tokens or established Tailwind semantic colours instead of introducing new raw values.

| Purpose | Token | Current value |
|---|---|---|
| Canvas | `--color-bg` | `#FAFAFB` |
| Surface | `--color-surface` | `#FFFFFF` |
| Primary text | `--color-text` | `#0F172A` |
| Secondary text | `--color-text-muted` | `#5B6678` |
| Primary action | `--color-primary` | `#4F46E5` |
| Secondary surface | `--color-secondary` | `#EEF0FF` |
| Success | `--color-success` | `#047857` |
| Warning | `--color-warning` | `#B45309` |
| Danger | `--color-danger` | `#B42318` |

Spacing follows a 4px base scale through `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-6`, and `--space-8`.

Interactive controls use:

- 36px for compact secondary controls;
- 44px for standard controls and mobile touch targets;
- 48px for prominent actions.

## Shared components

Shared primitives live in `src/components/ui/`.

### Button

- Variants: `primary`, `secondary`, `ghost`, `danger`.
- Sizes: `sm`, `md`, `lg`.
- Use `md` or `lg` for mobile primary actions.
- Always provide visible action text.
- Do not use disabled buttons as explanatory text; include a nearby reason when the reason is not obvious.

### IconButton

- Use only for familiar icon actions.
- `label` is mandatory and becomes the accessible name.
- Standard size provides a 44px target.
- Do not place important text only inside the icon.

### Badge

- Tones: neutral, primary, success, warning, danger.
- Badges communicate state; they are not buttons.
- State must remain understandable from text, not colour alone.

### Surface

- Use for cards, sections, articles, and asides.
- Padding variants follow the spacing scale.
- Avoid nesting multiple bordered surfaces unless the hierarchy requires it.

### EmptyState

- Requires a clear title.
- Description should explain why the area is empty and the next useful action.
- Use `compact` inside operational panels such as Messages.

### FormField

- Requires a visible label and matching `htmlFor`/control ID.
- Adds hint/error associations and `aria-invalid` automatically.
- Errors should explain how to correct the value.

## Navigation rules

- Every mobile navigation target is at least 44px tall.
- Active destinations use `aria-current="page"`.
- Popup controls expose expanded state and close with Escape.
- Focus must return to the trigger when a popup closes with Escape.
- Icons that repeat visible labels are hidden from assistive technology.

## Motion and accessibility

- The global reduced-motion rule disables non-essential movement.
- Interactive controls require visible keyboard focus.
- Normal text targets WCAG AA contrast of 4.5:1.
- Do not communicate state with colour alone.
- Test at 320, 390, 768, 1024, and 1440px widths.

## Governance

1. Reuse an existing primitive before adding a new one.
2. Add variants only when at least two real product uses require them.
3. Preserve semantic naming; do not name tokens after a page or current colour value.
4. Include loading, empty, error, disabled, focus, and reduced-motion behaviour where applicable.
5. Run `npm run check` and `npm run smoke:production` before declaring a shared-component change verified.
