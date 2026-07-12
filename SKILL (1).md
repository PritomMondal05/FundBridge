---
name: design-system-fundbridge-bangladeshi-student-innovators
description: Creates implementation-ready design-system guidance with local tokens, component behavior, and accessibility standards for FundBridge.
---

<!-- TYPEUI_SH_MANAGED_START -->

# FundBridge — Bridging Student Innovators & Alumni Backers

## Mission
Deliver implementation-ready design-system guidance for FundBridge that can be applied consistently across crowdfunding marketplace interfaces, workspace directories, and transaction dashboards.

## Brand
- Product/brand: FundBridge
- Target Audience: Bangladeshi university student entrepreneurs, young graduates, corporate alumni angel investors, and platform administrators.
- Product surface: trust-focused fundraising marketplace, milestone dashboards, real-time negotiation spaces, and administration panels.

## Style Foundations
- Visual Style: high-tech, organic growth hybrid (clean sky zenith fading into dense natural forest vectors), highly modern, structural, and secure.
- Main Font Style: `font.family.primary=HelveticaNowDisplay`, `font.family.stack=HelveticaNowDisplay, Helvetica Neue, Arial, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=1.6`, `font.letterSpacing.headers=-0.02em`
- Typography Scale:
  - `font.size.xs=12px` (micro-badges, currency tags)
  - `font.size.sm=13px` (dashboard table meta data)
  - `font.size.md=14px` (input labels, support descriptors)
  - `font.size.lg=16px` (main body text, description blocks)
  - `font.size.xl=18px` (milestone titles, card sub-headers)
  - `font.size.2xl=20px` (workspace system tabs, modal headers)
  - `font.size.3xl=24px` (promotional card primary headers, statistic metric nodes)
  - `font.size.4xl=36px` (section display headers, sub-hero callouts)
  - `font.size.5xl=48px` (massive hero main headline typography)
- Color Palette (Horizon Sky-Blue & Lush Pine Green Theme):
  - `color.sky.primary=#2A82E4` (Vibrant Sky Horizon Blue zenith)
  - `color.sky.light=#7EC1FA` (Misty transition gradient blue)
  - `color.obsidian.base=#000000` (True Pitch Black for active state containers & primary CTAs)
  - `color.obsidian.dark=#0A0A0C` (Obsidian Charcoal matte black for capabilities grid backdrop)
  - `color.pine.deep=#0D3D1F` (Grounding Forest Pine green base representing growth)
  - `color.pine.medium=#1D5A34` (Mid-tone forest vector margin green)
  - `color.neon.mint=#00E575` (High-energy active tag mint for Live checkmarks and fully funded progress indicators)
  - `color.text.charcoal=#2D3748` (Slate charcoal for optimal high-contrast readability on light bases)
  - `color.text.muted=#94A3B8` (Cool slate gray for descriptions set against dark capabilities blocks)
  - `color.surface.clean=#FFFFFF` (Pure white base background for dashboard frame layers)
  - `color.surface.cool=#F3F4F6` (Cool-toned gray accents for sidebar workspace panels)
  - `color.border.default=#E5E7EB` (Clean gray boundary dividers)
  - `color.border.strong=#2A303a` (High-contrast dark border lines for dark grid plates)
- Spacing Scale:
  - `space.1=4px`
  - `space.2=8px`
  - `space.3=12px`
  - `space.4=16px` (Standard layout card padding)
  - `space.5=20px`
  - `space.6=24px` (Row & list grid spacing gap)
  - `space.7=32px` (Desktop sidebar separation padding)
  - `space.8=48px` (Standard global section padding gaps)
- Radius/Shadow/Motion Tokens:
  - `radius.xs=8px` (Compact tags, live badges, small pill blocks)
  - `radius.sm=12px` (Workspace options, feature card boundaries)
  - `radius.md=9999px` (Pill actions, round profile avatar elements)
  - `shadow.soft=0px 10px 30px rgba(0, 0, 0, 0.05)`
  - `shadow.blur=backdrop-filter: blur(12px)` (Frosted glass containers)
  - `motion.duration.instant=10ms`
  - `motion.duration.fast=150ms` (Hover transitions on secondary button outlines)
  - `motion.duration.normal=500ms` (Carousel track sliding animations)

## Accessibility
- Target standard: WCAG 2.2 AA.
- Contrast limits: All text content must maintain a contrast ratio of &ge; 4.5:1 against underlying backdrops (3.0:1 for headers scaling above 24px).
- Keyboard interaction: All interactive controls (buttons, links, form inputs, carousel arrows) must support full focus navigation states with a visible custom keyboard outline indicator.
- Live region monitoring: Active progress updates or success triggers must implement explicit live announcements using aria-live containers.

## Writing Tone
Direct, confident, security-first, supportive, and localized to the Bangladeshi context (e.g., proper reference to BDT symbol "৳" and native MFS gateways like bKash, Nagad, Rocket).

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
