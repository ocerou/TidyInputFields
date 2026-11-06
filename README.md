# TidyInputFields

Tidy, dependency-free form input components — plain JavaScript and CSS.

> Work in progress. Nothing is published yet.

## Goals

- **Zero runtime dependencies.**
- **No framework required**: works in plain HTML, server-rendered pages, React, Vue, Angular, HTMX or anything else.
- **Progressive enhancement**: values live in native `<input>` elements, so forms, validation and autofill keep working.
- **Three ways to use each component**, Bootstrap style:
  - JavaScript API: `new TifDate(element, options)`, `TifDate.getInstance(element)`, `dispose()`;
  - data attributes: `<input data-tif="date">`, initialised automatically;
  - custom elements: `<tif-date name="due"></tif-date>`.
- **Bootstrap-friendly without importing it**: picks up Bootstrap's CSS variables, dark mode and validation classes
  when Bootstrap is on the page.
- **Translated**: built-in dictionaries (en, fr, de, es, it), or plug in your own translator (i18next, vue-i18n,
  FormatJS…) with `Tif.setTranslator()`.
- **Themeable** through CSS custom properties (`--tif-*`) in a `@layer tif` cascade layer, light and dark.
- **Keyboard first** and accessible (WAI-ARIA patterns), RTL-aware, CSP-safe.

## Planned components

| Group | Components |
|---|---|
| Native wrappers | text, number, textarea, select, switch |
| Simple | unit, selector |
| Date and time | date, time, date-time, period |
| Lists | search-select, multi-select, lookup, sortable-list |
| Colour | color-picker |

## Licence

[MIT](LICENSE) © 2026 Olivier CEROU
