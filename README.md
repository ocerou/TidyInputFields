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

Three ways to get the same field:

```html
<!-- A tag: it creates the native field inside, the form sends it -->
<tif-unit name="duration" unit="months" value="12"></tif-unit>

<!-- An attribute on an existing field, dressed in place -->
<select name="size" data-tif="selector"><option>S</option><option selected>M</option></select>
```

```js
// The JavaScript API, Bootstrap style
const unit = new Tif.TifUnit(element, { name: 'duration', unit: (n) => (n === 1 ? 'month' : 'months') })
Tif.TifUnit.getInstance(element) === unit
unit.value = '3'
unit.dispose()
```

Fields that already carry Bootstrap classes (`.form-control`, `.form-select`, `.form-check-input`) keep Bootstrap's look.

Language and translations:

```js
Tif.setLocale('fr') // otherwise <html lang>, then the browser language
Tif.addTranslations('pt', { common: { cancel: 'Cancelar' } })
// Or plug your own library, e.g. i18next with the shipped dictionaries/locales/*.json as namespace "tif":
Tif.setTranslator((key, params) => i18next.t(`tif:${key}`, params))
i18next.on('languageChanged', Tif.setLocale)
```

Elements added later (dialogs, HTMX, Turbo): `Tif.observe()` initialises and disposes them automatically.

In React, `tidyinputfields/react` (React as an optional peer dependency):

```tsx
import { TifField } from 'tidyinputfields/react'

<TifField component="date" name="due" value={due} onChange={(value) => setDue(String(value))} />
```

## Documentation

**https://ocerou.github.io/TidyInputFields/** — every component, each example in three ways (tag, `data-tif` attributes, JavaScript API) and in React, with options, events and keyboard.

```bash
npm run docs       # documentation on http://localhost:5181
npm run docs:build # one self-contained file, site-dist/index.html, that opens with a double-click
```

## Development

```bash
npm install
npm run dev        # test catalogue on http://localhost:5180 (and /bootstrap.html)
npm run check      # lint, types, unit tests, build
npm run test:e2e   # browser tests (Playwright; locally with the installed Edge)
```

## Components

| Group | Components | Status |
|---|---|---|
| Native fields | `text`, `number`, `textarea`, `select`, `switch` | available |
| Simple | `unit` (number followed by its unit), `selector` (segmented choice) | available |
| Date and time | `date`, `time`, `date-time`, `period` | available |
| Lists | `search-select`, `multi-select`, `lookup`, `sortable-list` | available |
| Colour | `color-picker` | available |

Common options of the native fields: `name`, `value`, `placeholder`, `required`, `disabled`, `readonly`, `label`
(aria-label), `inputId` (id of the created field, attribute `input-id`), `quiet` (frameless until hover or focus).

Dates and times show the format of the language (`22/11/2027`, `11/22/2027`, `22.11.2027`) and send ISO values
(`2027-11-22`, `14:30`, `2027-11-22T14:30`) through a hidden field. Quick typing: `1/1/27`, `15` (this month),
`010127`, `1430`, `14h30`. Alt+↓ opens the calendar or the clock; ↑ ↓ step the time by one minute (Shift: 15).
Placed on an existing `<input type="date">`, the component turns it into that hidden field and gives it back on
`dispose()`. A `period` sends its value as JSON: `{"operator":"period","unit":"month","from":0,"to":0}` (this
month, follows the calendar), `{"operator":"past"}` or `{"operator":"between","from":"…","to":"…"}`.

## Licence

[MIT](LICENSE) © 2026 Olivier CEROU
