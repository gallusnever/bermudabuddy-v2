# Design System

- Theme: Dark-first with slate/neutral surfaces and emerald accents.
- Typography: Inter for body; numeric UI leverages tabular-nums.
- Motion: 150–200ms ease-out transitions; respects reduced motion.
- Tokens: CSS variables in `@bermuda/ui/src/styles.css` drive colors, radii, shadows.
- Components: Button, Card, Chip, Drawer, Input, Select, Tooltip, Badge implemented with consistent focus rings.

Usage
- Import `@bermuda/ui/src/styles.css` once in the app layout.
- Compose components; avoid raw HTML controls to maintain consistency and accessibility.
