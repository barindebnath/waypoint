# A dashboard design language: floating panels, charcoal and lime

The app used a "paper and lamplight" look: a top bar, a centered column, square-ish corners, and a serif or mono heading font. We replaced it with a dashboard look that fills the screen: a dark desk with two floating, rounded panels (the sidebar and the page), soft outline icons, solid pastel pills, and one lime accent. The Board lanes use the full height of the panel and scroll inside it, and the timesheet bar is the last row of the panel.

Tokens carry the whole look, so a theme change touches `globals.css` and nothing else. The layers are `--desk` < `--bg` (a panel) < `--surface` (a card) < `--surface2` (a field) < `--surface3` (a hover or a track). The Board adds `--lane` and `--card`. `--accent` is the fill (lime, with dark text on it). `--accent-fg` is the same colour as text, darker in light mode so it keeps its contrast. The corner radii are one scale plus four named roles (`rounded-panel`, `rounded-lane`, `rounded-card`, `rounded-control`), so one value changes the shape of the whole app. Pastel pills (`Chip`) keep a fixed dark ink in every theme.

Decisions that surprise a reader of the code:

- The palette `lime` is the new default. The old default `forest` is retired. A saved `forest` value maps to `lime` in `normalizeColorTheme` and in the pre-paint script in `layout.tsx`, so no data change is needed. The palettes `paper`, `nord` and `royal` stay and use the same layers.
- The default heading font is now the sans font (Inter). A saved `mono` or `serif` choice is respected. Migration 0009 changes only the column defaults for new accounts (`lime`, `sans`). It does not touch existing rows.
- The icons are inline SVG components in `src/components/icons.tsx`. We did not add an icon library, to keep the dependency list short.
- Global base rules (for example the link colour) are in `@layer base`, so a utility class always wins over them. The old code needed `!text-*` for this.
- The sidebar state (expanded or collapsed) is a data attribute on `<html>`, set before first paint. The sidebar CSS reads it, so a reload does not flash.
