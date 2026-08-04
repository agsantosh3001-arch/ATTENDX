# DESIGN.md — AttendX Mobile Design System

## Status: PLACEHOLDER

This file will be replaced with the full design system document.
When the real DESIGN.md is attached to this directory, the AI agent
(Antigravity, Claude, or Gemini) must:

1. Read the new DESIGN.md in full before modifying any component.
2. Extract the color palette and map it to the CSS variables in globals.css.
3. Extract the typography choices and update tailwind.config.ts font families.
4. Extract the spacing system and enforce it across all components.
5. Extract the signature element and implement it on the primary interaction
   (the check-in experience).
6. Audit every component against the new design tokens and update them.
7. Do NOT change any functionality, routing, API calls, or business logic.
   Only change visual presentation.

## Interim Design Direction

Until the real DESIGN.md is provided, follow these principles:

**Philosophy:** This is a tool people open every morning and use for 30 seconds.
It must feel instant, effortless, and satisfying — like tapping a transit card,
not like navigating enterprise software. Every screen has one primary action and
everything else is secondary. No clutter. No walls of text. No feature overload.

**Color:** Use a neutral foundation (near-white backgrounds, soft grays for
secondary surfaces) with a single strong accent color for the primary action
(check-in/check-out button). Status colors: green for present, amber for late,
red for absent, slate for weekend/holiday. Dark mode: deep charcoal backgrounds,
not pure black.

**Typography:** Two weights of one clean sans-serif font is enough. Bold for
numbers, stats, and the timer. Regular for everything else. The live timer
should be the largest text element on the employee dashboard — it is the
hero of the mobile experience.

**Spacing:** Generous. Mobile screens have less space but fingers are bigger
than cursors. Touch targets minimum 44x44px. Card padding 16–20px. Gaps
between sections 24px. Page padding 16px horizontal. No cramming.

**Motion:** Page transitions (slide left/right for navigation, fade for modals).
Check-in button press animation (scale down on press, spring back on release).
Timer digit transitions (subtle roll or fade when digits change). Pull-to-refresh
on the dashboard. No gratuitous animation on every element.

**Shape:** Rounded corners (12–16px radius on cards, full-round on buttons
and avatars). Soft shadows (no hard box-shadows). No sharp edges anywhere.
