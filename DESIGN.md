---
version: alpha
name: Prive Admin Quiet Precision
description: A calm, trustworthy operations workspace for appointments, customers, salons, finance, reporting, and administration.
colors:
  ink: "#202522"
  ink-muted: "#66706A"
  ink-subtle: "#8B948F"
  canvas: "#F4F5F2"
  surface: "#FFFFFF"
  surface-subtle: "#F8F9F7"
  surface-strong: "#EEF1ED"
  border: "#DCE2DD"
  border-strong: "#C5CEC7"
  accent: "#486B62"
  accent-strong: "#2F5149"
  on-accent: "#FFFFFF"
  success: "#2F7659"
  success-surface: "#EAF5EF"
  warning: "#9A6818"
  warning-surface: "#FFF4DD"
  danger: "#B24A4A"
  danger-surface: "#FCEDEC"
  info: "#3E6E9B"
  info-surface: "#EAF2FA"
  dark:
    ink: "#F2F5F1"
    ink-muted: "#B5C0B9"
    ink-subtle: "#89958D"
    canvas: "#171C19"
    surface: "#202722"
    surface-subtle: "#252E28"
    surface-strong: "#2C3730"
    border: "#3B473F"
    border-strong: "#536158"
    accent: "#9CC6B8"
    accent-strong: "#B8D8CD"
    on-accent: "#14201B"
    success: "#8ED0AE"
    success-surface: "#1E3529"
    warning: "#F0BF68"
    warning-surface: "#3D301B"
    danger: "#F09A98"
    danger-surface: "#3E2425"
    info: "#9BC5EB"
    info-surface: "#213344"
typography:
  display:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2.25rem, 4vw, 4rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  heading:
    fontFamily: "Manrope, Avenir Next, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, Avenir Next, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  body-strong:
    fontFamily: "Manrope, Avenir Next, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.45
  label:
    fontFamily: "Manrope, Avenir Next, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "0.08em"
  data:
    fontFamily: "IBM Plex Mono, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    fontFeature: "tnum"
  caption:
    fontFamily: "Manrope, Avenir Next, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  none: 0
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  pill: "999px"
spacing:
  xxs: "0.25rem"
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  3xl: "4.5rem"
motion:
  fast:
    duration: 120ms
    timingFunction: ease-out
  standard:
    duration: 180ms
    timingFunction: ease-out
  entrance:
    duration: 260ms
    timingFunction: cubic-bezier(0.22, 1, 0.36, 1)
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 {spacing.md}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 40px
    padding: "0 {spacing.md}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 42px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  status-success:
    backgroundColor: "{colors.success-surface}"
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
  status-warning:
    backgroundColor: "{colors.warning-surface}"
    textColor: "{colors.warning}"
    rounded: "{rounded.pill}"
  status-danger:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.pill}"
---

## Overview

Prive Admin is a quiet operations workspace. It should help people finish real work with less cognitive noise: schedule an appointment, understand a financial movement, find a customer, reconcile a record, or administer access.

The product combines two qualities that must remain together:

- **Quiet and reassuring:** stable surfaces, restrained color, predictable feedback, generous breathing room around decisions, and language that never panics the user.
- **Precise and analytical:** clear hierarchy, aligned data, explicit units, useful comparisons, durable filters, and no ambiguity about status or consequence.

The system is for working sessions, not a marketing homepage. A screen should feel composed at first glance and dependable after the hundredth interaction.

### Design principles

1. **Calm is a usability feature.** Reduce visual competition so the next important action is obvious.
2. **Precision earns trust.** Show exact dates, times, currencies, units, ownership, and status wherever a decision depends on them.
3. **Structure before decoration.** Use grouping, alignment, and typography before color, gradients, or illustration.
4. **Every action has a visible outcome.** Saved, pending, failed, and recoverable states are part of the design.
5. **Respect the operator’s attention.** Prefer progressive disclosure to hiding essential context or filling every surface with cards.
6. **Warmth comes from clarity.** The interface can feel human without becoming playful, chatty, or imprecise.

## Colors

Use colors by role, not by component preference. Ink and surfaces carry most of the interface. Accent is reserved for primary actions, active navigation, selected states, and meaningful emphasis. Semantic colors communicate state and must never be used only as decoration.

- **Ink:** primary text, headings, key values, and high-confidence information.
- **Ink muted/subtle:** supporting metadata, timestamps, helper text, and inactive chrome. Never use muted text for required information.
- **Canvas:** the quiet page field behind work surfaces.
- **Surface:** cards, panels, menus, dialogs, and inputs where work happens.
- **Surface strong:** selected rows, grouped control areas, and emphasized secondary regions.
- **Border:** separation without visual heaviness. Prefer borders to shadows for dense data.
- **Accent:** the primary action and the current location in the product. Do not use it for every link or badge.
- **Success, warning, danger, info:** semantic feedback with a tinted surface and a text/icon label. Never communicate status by color alone.

Light and dark modes should preserve the same role relationships, not invert every token mechanically. Maintain readable contrast for body text, controls, focus indicators, and status labels. Avoid pure black, pure white, neon accents, rainbow charts, and decorative gradients in operational views.

## Typography

Typography should make the interface feel composed while keeping data easy to scan.

- Use the display face sparingly for page-level moments, summaries, and human context. Do not use it for dense tables, controls, or small labels.
- Use the interface face for navigation, headings, labels, body copy, and controls.
- Use the data face for amounts, IDs, timestamps, counts, rates, and values that benefit from alignment. Use tabular numerals and align numbers by meaning.
- Labels are short, sentence-like, and descriptive. Uppercase tracking is reserved for small metadata labels, never paragraphs or primary actions.
- Use one clear heading per page, then a predictable heading hierarchy. Do not make every card title a competing headline.
- Never encode hierarchy with font size alone; combine type, spacing, grouping, and position.

Default body copy should be comfortable to read at 15–16px with a line height around 1.5. Dense data can be smaller only when row height, contrast, and scanability remain strong.

## Layout

Pages use a stable frame: global navigation, page heading and context, primary work surface, and supporting actions. The work surface owns the visual emphasis; chrome should recede.

- Use a readable content measure for prose and a wider measure for tables, calendars, and analytical summaries.
- Align page headings, filters, tables, and detail content to shared vertical rails.
- Use the spacing scale consistently. Large gaps separate tasks or sections; small gaps group labels with their values.
- Establish a density appropriate to the task. Financial tables and admin lists may be compact; onboarding, destructive confirmation, and empty states need more room.
- Keep primary actions near the context they affect. A page-level create action belongs in the page header; row actions belong with the row.
- Make filters persistent and legible. Show active filters, offer a clear reset, and do not hide important scope in an unlabeled icon.

### Responsive behavior

Responsive layouts preserve task priority, not desktop geometry. On narrow screens:

- Keep the page title, primary action, and current scope visible first.
- Collapse secondary navigation without hiding the current location.
- Transform tables into labeled records or prioritized columns; do not force unreadable horizontal scrolling for essential information.
- Turn multi-column forms into a single logical sequence while preserving section grouping.
- Convert calendars to the most useful view for the available width and keep date navigation obvious.
- Move low-frequency actions into a menu, but keep destructive actions explicit and discoverable.

## Elevation & Depth

Use depth to explain hierarchy, not to make every element look floating. The default hierarchy is canvas → surface → raised surface → modal/temporary layer.

- Prefer a subtle border and a quiet surface difference for adjacent regions.
- Use a small shadow for cards and popovers, a stronger shadow for dialogs, and no shadow for ordinary table rows.
- Overlays should dim and slightly soften the underlying context without making it feel lost.
- Do not stack cards inside cards unless the inner region represents a distinct task or entity.
- Avoid glassmorphism, persistent blur, and heavy drop shadows in data-heavy views.

## Shapes

Moderate radii balance hospitality with operational precision. Use the scale consistently: small for compact controls and badges, medium for buttons and fields, large for cards and panels, pill only for statuses or tags.

- Buttons, inputs, selects, and tabs use the medium radius.
- Cards and dialogs use the large radius.
- Status badges and compact filters may use a pill shape.
- Tables remain mostly rectangular so columns and rows align clearly.
- Do not mix multiple unrelated radii on one surface or use very round shapes to make a serious workflow feel playful.

## Motion & Micro-interaction

Motion is quiet confirmation. It should clarify a state change, preserve spatial continuity, or acknowledge an action.

- Use fast motion for hover, focus, and control feedback.
- Use standard motion for menus, tabs, filter changes, and inline updates.
- Use entrance motion only for meaningful surfaces such as dialogs or a newly revealed section.
- Prefer opacity, color, and small positional changes. Avoid bouncing, elastic motion, parallax, and automatic animated decoration.
- Preserve context when content updates: do not unnecessarily scroll, reorder, or flash a whole page.
- Respect `prefers-reduced-motion`; state changes must remain understandable without animation.

## Voice & Content Strategy

The voice is calm, direct, respectful, and specific. It assumes the user is capable and busy.

- Use plain verbs: “Save changes”, “Assign account”, “Retry upload”, “Delete transaction”.
- Name the object and consequence in confirmations: “Delete this cash transaction? This cannot be undone.”
- Explain what happened and what to do next in errors. Avoid “Something went wrong” without recovery.
- Use neutral language for empty states: “No appointments in this range” followed by the useful next action.
- Never use urgency, blame, jokes, exclamation marks, or vague success messages for operational work.
- Format dates, times, currencies, percentages, and time zones explicitly when ambiguity is possible.
- Keep labels stable across screens. A customer, appointment, transaction, or salon should not change names based on the component displaying it.

## Components

### Navigation

Navigation should make location, scope, and access obvious. Show the current section with a restrained accent treatment and a readable label. Keep global navigation stable across authenticated work. Admin-only destinations should be clearly separated from everyday operations without looking forbidden or alarming.

### Buttons and actions

Use one primary action per context. Secondary actions are quiet and bordered; tertiary actions are text or icon actions with accessible labels. Destructive actions use the danger semantic treatment and require confirmation when the consequence is irreversible or difficult to recover.

Buttons must have a visible focus state, a disabled state that remains legible, and a pending state that prevents duplicate submission while explaining what is happening. Do not use a filled primary button for every action.

### Inputs and forms

Every field has a visible label. Helper text explains format or consequence, not the obvious. Validation appears close to the field, persists until resolved, and does not rely on color alone. Preserve entered values when a submission fails. Group related fields, show requiredness consistently, and put the primary submit action at the end of the logical flow.

Search should say what it searches. Filters should show current scope and offer a reset. Date and currency inputs must make format and unit clear.

### Tables and lists

Tables are analytical tools, not decoration. Use a clear header, stable column order, adequate row height, aligned numeric values, and restrained dividers. Keep the most decision-relevant columns visible first. Use row hover only as a cue, not as the sole indication that a row is interactive.

When a list has no results, distinguish “no records exist” from “filters hide records”. Preserve the user’s filter state during refresh. Show pagination or result count when the dataset is bounded or paged.

### Cards and summaries

Cards group a decision or related facts. A summary card should answer one question, name its time range, and expose the relevant detail path. Avoid grids of identical cards that force the user to compare isolated numbers. A chart must have a title, units, time scope, legible labels, and an accessible textual summary.

### Calendars and schedules

Calendars prioritize time, ownership, and status. Make the current date and active range obvious. Appointment blocks should expose the minimum useful context and use semantic cues redundantly. Provide a list or detail path for users who cannot rely on spatial calendar scanning. Avoid letting color alone distinguish people, statuses, or appointment types.

### Detail views and records

A record page starts with identity, status, and the primary action, then presents facts in labeled groups. Keep immutable metadata distinct from editable fields. Surface related records through clear relationships rather than nested visual noise. Show last updated information and ownership where it affects trust.

### Dialogs and drawers

Use a dialog for a focused decision or short form; use a drawer when the user needs to retain context from the underlying list or calendar. The title states the task, the body explains only what is needed, and actions have a clear order. Do not put a complete multi-step workflow in a small dialog.

### Feedback states

- **Loading:** preserve layout and context; use reserved space or a quiet skeleton only when it improves orientation. Avoid replacing the whole page with a spinner.
- **Saving:** show the affected action as pending and prevent duplicates. Confirm success near the action and, where useful, in the record status.
- **Empty:** explain the scope, state the absence plainly, and provide one useful next step.
- **Error:** identify the failed operation, preserve user input, offer retry or recovery, and provide a support path for persistent failures.
- **Partial data:** label what is unavailable rather than presenting a misleading complete-looking surface.

## Operational patterns

### Dashboard

Dashboards begin with scope and time range, then show the few signals needed to decide what to do next. Put comparisons and trends beside their definition. Use a short narrative summary only when it improves interpretation. Do not fill unused space with decorative charts or arbitrary KPI tiles.

### List to detail

Lists support scanning, filtering, selection, and a clear path to detail. Detail views preserve the originating context where possible and provide a clear return path. After create, update, or delete, show the resulting state and keep the user’s scope predictable.

### Create and edit

Create flows ask only for information needed to create a valid record. Edit flows distinguish fields that can change from system-managed facts. On success, show the created or updated record and its status. On failure, keep the form usable and explain the specific correction.

### Financial and analytical work

Amounts always include currency. Dates and ranges include enough context to avoid ambiguity. Positive/negative meaning is expressed with sign, label, and optionally semantic color. Never hide a rounding rule, calculation scope, import status, or reconciliation state behind a tooltip alone.

### Permissions and administration

Permission-sensitive actions explain why they are unavailable when that explanation is safe to show. Impersonation, deletion, assignment, and access changes are explicit, auditable, and reversible when possible. Avoid visual punishment for restricted actions; clarity is safer than mystery.

## Accessibility & trust

- Meet WCAG AA contrast for text, controls, focus indicators, and status labels.
- Every interactive element works with keyboard navigation and has a visible focus state.
- Do not rely on color, hover, animation, position, or icon shape alone to convey meaning.
- Use semantic headings, labels, live announcements for important async outcomes, and descriptive accessible names for icon actions.
- Preserve logical reading order on responsive layouts.
- Keep touch targets large enough for reliable use and do not place destructive actions beside primary actions without separation.
- Make timestamps, time zones, currencies, and decimal precision explicit where a wrong interpretation could cause harm.
- Provide a path to recover from failed saves, failed imports, accidental changes, and interrupted workflows.

## Do’s and Don’ts

### Do

- Do lead with the user’s current scope, task, and next decision.
- Do use alignment, grouping, and typography to make data legible.
- Do reserve accent color for meaningful emphasis.
- Do make status, ownership, units, and timestamps explicit.
- Do design loading, empty, partial, error, and success states with the same care as the default state.
- Do make narrow layouts prioritize the most important task and information.

### Don’t

- Don’t default to a generic purple-gradient SaaS dashboard.
- Don’t turn every section into a floating card or every metric into a giant number.
- Don’t use bright color, dense borders, or animation to manufacture urgency.
- Don’t hide essential financial or permission context in hover states or tooltips.
- Don’t use color alone for statuses, chart series, validation, or ownership.
- Don’t replace clear copy with clever labels, unexplained icons, or vague toasts.
- Don’t add a new pattern when an existing pattern can express the task clearly.

When a future feature introduces a genuinely new interaction, extend this document with the role, rationale, concrete tokens, accessibility behavior, and a short example before spreading the pattern across the product.
