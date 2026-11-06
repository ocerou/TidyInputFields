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
- **Themeable** through CSS custom properties (`--tif-*`), light and dark, with low-specificity `tif-` classes.
- **Keyboard first** and accessible (WAI-ARIA patterns), RTL-aware, CSP-safe (no `innerHTML`, no injected styles).

## Getting started

With a bundler:

```js
import * as Tif from 'tidyinputfields'
import 'tidyinputfields/css'
```

Or with plain `<script>` and `<link>` tags (global `Tif`):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tidyinputfields/dist/tidyinputfields.css" />
<script src="https://cdn.jsdelivr.net/npm/tidyinputfields/dist/tidyinputfields.min.js"></script>
```

Language and translations:

```js
Tif.setLocale('fr') // otherwise <html lang>, then the browser language
Tif.addTranslations('pt', { common: { cancel: 'Cancelar' } })
// Or plug your own library, e.g. i18next with the shipped dictionaries/locales/*.json as namespace "tif":
Tif.setTranslator((key, params) => i18next.t(`tif:${key}`, params))
i18next.on('languageChanged', Tif.setLocale)
```

Elements added later (dialogs, HTMX, Turbo): `Tif.observe()` initialises and disposes them automatically.

## Development

```bash
npm install
npm run dev        # catalogue on http://localhost:5180 (and /bootstrap.html)
npm run check      # lint, types, unit tests, build
npm run test:e2e   # browser tests (Playwright; locally with the installed Edge)
```

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
