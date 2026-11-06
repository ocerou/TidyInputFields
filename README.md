# TidyInputFields

Tidy, framework-free form input components — plain JavaScript and CSS.

> Work in progress. Nothing is published yet.

## Goals

- **No framework required**: works in plain HTML, server-rendered pages, React, Vue or anything else.
- **Progressive enhancement**: values live in native `<input>` elements, so forms, validation and autofill keep working.
- **Three ways to use each component**:
  - JavaScript API, Bootstrap style: `new TifDate(element, options)`, `TifDate.getInstance(element)`, `dispose()`;
  - data attributes: `<input data-tif="date">`, initialised automatically;
  - custom elements: `<tif-date name="due"></tif-date>`.
- **Themeable** through CSS custom properties (`--tif-*`), light and dark.
- **Keyboard first** and accessible.
- **Translated**: built-in dictionaries, `setLocale()`.

## Planned components

| Group | Components |
|---|---|
| Native wrappers | text, number, textarea, select, switch |
| Simple | unit, selector |
| Date and time | date, time, date-time, period |
| Lists | search-select, multi-select, lookup, sortable-list |
| Colour | color-picker |
| Rich text (separate package) | rich-text (TipTap) |

## Licence

[MIT](LICENSE) © 2026 Olivier CEROU
