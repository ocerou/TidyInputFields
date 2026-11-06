// Pages « Getting started ».
import type { Page } from '../page.ts'

const group = 'Getting started'

export const gettingStarted: Page[] = [
  {
    id: 'introduction',
    group,
    title: 'Introduction',
    lead: 'Tidy, dependency-free form input components — plain JavaScript and CSS. Bootstrap-friendly, translated, and ready for React.',
    blocks: [
      {
        text: `
          <div class="bd-features">
            <div><b>Zero dependencies</b>One script, one stylesheet. No framework, no date library, no icon font.</div>
            <div><b>Real form fields</b>Values live in native fields: forms, validation and autofill keep working.</div>
            <div><b>Three ways to use</b>A tag, a <code>data-tif</code> attribute on an existing field, or the JavaScript API.</div>
            <div><b>Bootstrap-friendly</b>Picks up Bootstrap's colours, dark mode and validation classes when it is on the page.</div>
            <div><b>Translated</b>English, French, German, Spanish and Italian built in; plug i18next or any library.</div>
            <div><b>Keyboard first</b>Quick typing, arrows, Enter and Escape everywhere; WAI-ARIA patterns.</div>
          </div>`,
      },
      { heading: 'Quick start' },
      {
        text: '<p>Load the stylesheet and the script, then write the tags. Each tag creates a native field inside itself, so the form sends its value as usual.</p>',
      },
      {
        code: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tidyinputfields/dist/tidyinputfields.css">
<script src="https://cdn.jsdelivr.net/npm/tidyinputfields/dist/tidyinputfields.min.js"></script>`,
        language: 'html',
      },
      {
        example: 'quick-start',
        text: 'A text field, a date and a segmented choice in a form. Switch to the <b>React</b> tab to see — and run — the same thing in React.',
      },
      { heading: 'Components' },
      {
        text: `<ul>
          <li><a href="#/text">Text, number, text area</a>, <a href="#/select">select</a>, <a href="#/switch">switch</a>: native fields, dressed.</li>
          <li><a href="#/unit">Unit</a>: a number followed by its unit, agreed with it (“1 month”, “12 months”).</li>
          <li><a href="#/selector">Selector</a>: a required choice among a few options, side by side.</li>
          <li><a href="#/date">Date</a>, <a href="#/time">time</a>, <a href="#/date-time">date and time</a>, <a href="#/period">period</a>: quick typing, calendar, clock, relative periods.</li>
          <li><a href="#/search-select">Search select</a>, <a href="#/multi-select">multi select</a>, <a href="#/lookup">lookup</a>: long lists, remote sources.</li>
          <li><a href="#/sortable-list">Sortable list</a>: objects attached to a main object, reordered by drag and drop.</li>
          <li><a href="#/color-picker">Colour picker</a>: range, intensity, transparency, RGB and hex, eyedropper.</li>
        </ul>`,
      },
    ],
  },
  {
    id: 'installation',
    group,
    title: 'Installation',
    lead: 'One stylesheet and one script, from npm or a CDN. Nothing else to install.',
    blocks: [
      { heading: 'npm' },
      { code: 'npm install tidyinputfields', language: 'bash' },
      {
        code: `// Registers every component, declares the <tif-…> tags and initialises data-tif fields.
import * as Tif from 'tidyinputfields'
import 'tidyinputfields/css'`,
        language: 'ts',
      },
      { heading: 'CDN' },
      {
        text: '<p>The classic script exposes everything on a global <code>Tif</code> object, like Bootstrap exposes <code>bootstrap</code>.</p>',
      },
      {
        code: `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tidyinputfields/dist/tidyinputfields.css">
<script src="https://cdn.jsdelivr.net/npm/tidyinputfields/dist/tidyinputfields.min.js"></script>
<script>
  Tif.setLocale('fr')
</script>`,
        language: 'html',
      },
      { heading: 'What is in the package' },
      {
        table: [
          ['<code>dist/tidyinputfields.js</code>', 'ES module, for bundlers and <code>&lt;script type="module"&gt;</code>.'],
          ['<code>dist/tidyinputfields.min.js</code>', 'Classic script, global <code>Tif</code>.'],
          ['<code>dist/tidyinputfields.css</code>', 'The stylesheet.'],
          ['<code>dist/locales/*.json</code>', 'Built-in translations, to load into i18next or another library.'],
          ['<code>dist/types/</code>', 'TypeScript types.'],
        ],
        columns: ['File', 'Use'],
      },
      {
        text: '<div class="bd-callout">Zero runtime dependency: no framework, no date library, no icon font. Icons are Bootstrap Icons (MIT), copied into the script at build time.</div>',
      },
    ],
  },
  {
    id: 'usage',
    group,
    title: 'Usage',
    lead: 'Every component can be used in three ways, Bootstrap style: a tag, a <code>data-tif</code> attribute, or the JavaScript API.',
    blocks: [
      { heading: 'A tag' },
      {
        text: '<p>The tag creates the native field inside itself. Options are attributes, written in kebab-case (<code>input-id</code> for <code>inputId</code>).</p>',
      },
      { example: 'usage-tag' },
      { heading: 'A data-tif attribute' },
      {
        text: '<p>Put <code>data-tif="unit"</code> on an existing field: it is dressed in place at page load, and its options are <code>data-tif-*</code> attributes. Server-rendered pages need nothing else.</p>',
      },
      { example: 'usage-data' },
      { heading: 'The JavaScript API' },
      {
        text: '<p><code>new Tif.TifUnit(element, options)</code>, then <code>getInstance</code>, <code>getOrCreateInstance</code> and <code>dispose</code>, as in Bootstrap 5. Options that are functions or arrays (a unit that agrees with the number, a remote source…) are given here.</p>',
      },
      { example: 'usage-js' },
      { heading: 'Options' },
      {
        text: '<p>From the weakest to the strongest: the defaults, the <code>data-tif-*</code> attributes, then the JavaScript options. Change them later with <code>setOptions()</code>; a tag follows its attributes.</p>',
      },
      { heading: 'Events' },
      {
        text: '<p>The field that holds the value sends the native <code>input</code> and <code>change</code> events, so forms and frameworks see the changes. Panels add lifecycle events named <code>show.tif.&lt;component&gt;</code> (cancelable with <code>preventDefault()</code>), <code>shown</code> and <code>hidden</code>.</p>',
      },
      { example: 'usage-events' },
      { heading: 'Fields added later' },
      {
        text: '<p>Tags take care of themselves. For <code>data-tif</code> fields added after the page load (a dialog, a table row, HTMX or Turbo), call <code>Tif.init(container)</code>, or let <code>Tif.observe()</code> initialise and dispose them automatically.</p>',
      },
      {
        code: `Tif.observe()                // follows the whole page
Tif.init(dialog)             // or once, on a container
Tif.dispose(row)             // frees every component of a subtree

// With jQuery on the page, each component is also a plugin:
$('.due').tifDate({ required: true })
$('.due').tifDate('dispose')`,
        language: 'ts',
      },
      {
        table: [
          ['<code>Tif.init(root?)</code>', 'Creates the components of the <code>data-tif</code> fields under <code>root</code> (the page by default).'],
          ['<code>Tif.observe(root?)</code>', 'Follows added and removed fields; returns the function that stops.'],
          ['<code>Tif.dispose(root)</code>', 'Frees every component of a subtree.'],
          ['<code>X.getInstance(el)</code>', 'The component on an element (or a selector), or null.'],
          ['<code>X.getOrCreateInstance(el, options?)</code>', 'Same, created when missing.'],
          ['<code>instance.value</code>', 'Value, to read or write (writing sends no event).'],
          ['<code>instance.setOptions(options)</code>', 'Changes options afterwards.'],
          ['<code>instance.dispose()</code>', 'Frees the component and gives the original field back.'],
        ],
        columns: ['Method', 'Description'],
      },
      {
        text: '<p>Turn the automatic initialisation off with <code>&lt;html data-tif-auto="false"&gt;</code>, and the jQuery bridge with <code>&lt;body data-tif-no-jquery&gt;</code>.</p>',
      },
    ],
  },
  {
    id: 'react',
    group,
    title: 'React',
    lead: '<code>tidyinputfields/react</code>: <code>TifField</code> for controlled fields, <code>useTif</code> to dress a field React renders.',
    blocks: [
      {
        text: '<p>React is an optional peer dependency: the library itself does not need it, only this entry point imports it. Every example of this documentation has a <b>React</b> tab that runs it.</p>',
      },
      { code: 'npm install tidyinputfields react', language: 'bash' },
      { heading: 'TifField' },
      {
        text: '<p><code>TifField</code> renders the <code>&lt;tif-…&gt;</code> tag. Text, number and boolean props become attributes; options that are arrays, objects or functions (a list of options, a remote source, a unit that agrees with the number) go through <code>options</code>. <code>value</code> and <code>onChange</code> make it a controlled field.</p>',
      },
      {
        code: `import { TifField } from 'tidyinputfields/react'
import 'tidyinputfields/css'

<TifField component="date" name="due" value={due} onChange={(value) => setDue(String(value))} />
<TifField component="search-select" name="owner" options={{ options: owners, groupOrder: ['Teams'] }} />`,
        language: 'tsx',
      },
      {
        table: [
          ['<code>component</code>', 'Component name: <code>date</code>, <code>search-select</code>, <code>sortable-list</code>… (typed).'],
          ['<code>value</code>', 'Controlled value; leave it undefined for an uncontrolled field.'],
          ['<code>onChange(value)</code>', 'Called with the new value after each change made by the user.'],
          ['<code>options</code>', 'Options that are not text, applied with <code>setOptions()</code>.'],
          ['any other prop', 'An attribute of the tag: <code>name</code>, <code>required</code>, <code>placeholder</code>, <code>label</code>, <code>input-id</code>…'],
        ],
        columns: ['Prop', 'Description'],
      },
      { example: 'quick-start' },
      { heading: 'useTif' },
      {
        text: '<p><code>useTif(Component, ref, options)</code> dresses a field rendered by React and gives it back before React removes it (it runs in <code>useLayoutEffect</code>: some components wrap the field in their own frame). It returns a ref to the instance.</p>',
      },
      { example: 'usage-data' },
    ],
  },
  {
    id: 'theming',
    group,
    title: 'Theming',
    lead: 'CSS variables, light and dark themes, a quiet look for record pages.',
    blocks: [
      {
        text: '<p>Set the <code>--tif-*</code> variables anywhere — <code>:root</code>, a card, a single field. Without them, the components take Bootstrap\'s variables when Bootstrap is on the page, otherwise their own.</p>',
      },
      { example: 'theme-variables' },
      {
        table: [
          ['<code>--tif-accent</code>', 'Primary colour (selected option, focus border).', '<code>--bs-primary</code>'],
          ['<code>--tif-focus-ring</code>', 'Halo around the focused field.', '<code>--bs-focus-ring-color</code>'],
          ['<code>--tif-surface</code>, <code>--tif-alt</code>, <code>--tif-sunk</code>', 'Backgrounds.', '<code>--bs-body-bg</code>, <code>--bs-tertiary-bg</code>, <code>--bs-secondary-bg</code>'],
          ['<code>--tif-ink</code>, <code>--tif-ink-soft</code>, <code>--tif-ink-mute</code>', 'Texts.', '<code>--bs-body-color</code>, <code>--bs-secondary-color</code>'],
          ['<code>--tif-line</code>, <code>--tif-line-strong</code>', 'Borders.', '<code>--bs-border-color</code>'],
          ['<code>--tif-ok</code>, <code>--tif-warn</code>, <code>--tif-crit</code>', 'States (valid, missing, invalid).', '<code>--bs-success</code>, <code>--bs-warning-*</code>, <code>--bs-danger</code>'],
          ['<code>--tif-radius</code>, <code>--tif-radius-sm</code>, <code>--tif-radius-lg</code>', 'Corners.', '<code>--bs-border-radius*</code>'],
          ['<code>--tif-font</code>, <code>--tif-font-size</code>, <code>--tif-mono</code>', 'Fonts.', '<code>--bs-body-font-*</code>'],
          ['<code>--tif-field-h</code>', 'Height of a field (by default, the height of a Bootstrap <code>.form-control</code> at the same font size).', ''],
          ['<code>--tif-z-panel</code>', 'Layer of the floating panels (1075: above Bootstrap modals).', ''],
        ],
        columns: ['Variable', 'Use', 'Bootstrap fallback'],
      },
      { heading: 'Dark theme' },
      {
        text: '<p>The components follow <code>prefers-color-scheme</code>, and <code>data-tif-theme="dark"</code> or Bootstrap\'s <code>data-bs-theme="dark"</code> on any element — the whole page or a single card.</p>',
      },
      { heading: 'Quiet fields' },
      {
        text: '<p>With <code>quiet</code>, a field has no frame until it is hovered or focused: reading and editing look the same on a record page.</p>',
      },
      { example: 'theme-quiet' },
      { heading: 'Sizes and states' },
      {
        text: '<p><code>.tif-sm</code> and <code>.tif-lg</code> (or Bootstrap\'s <code>-sm</code> / <code>-lg</code> classes), <code>.is-invalid</code>, <code>.is-valid</code>, <code>.was-validated</code> on the form, and <code>.tif-missing</code> for a required field still empty.</p>',
      },
    ],
  },
  {
    id: 'bootstrap',
    group,
    title: 'Bootstrap',
    lead: 'Made to sit next to Bootstrap 5.3 without importing it.',
    blocks: [
      {
        text: `<ul>
          <li><b>Look</b>: colours, corners, fonts and focus ring come from Bootstrap's CSS variables; a field is as high as a <code>.form-control</code>.</li>
          <li><b>Dark mode</b>: <code>data-bs-theme="dark"</code> is followed, on the page or a part of it.</li>
          <li><b>Validation</b>: <code>.is-invalid</code>, <code>.is-valid</code> and <code>.was-validated</code> work as in Bootstrap.</li>
          <li><b>Fields already styled by Bootstrap</b> (<code>.form-control</code>, <code>.form-select</code>, <code>.form-check-input</code>) keep Bootstrap's look when dressed.</li>
          <li><b>Modals</b>: panels and confirmations opened from a modal hang inside it, so Bootstrap's focus trap keeps working; Escape closes the panel, not the modal.</li>
          <li><b>Same conventions</b>: <code>data-tif-*</code> attributes, <code>getInstance</code>, <code>getOrCreateInstance</code>, <code>dispose</code>, events <code>show.tif.date</code>, jQuery plugins.</li>
        </ul>`,
      },
      {
        code: `<div class="modal fade" id="edit">
  <div class="modal-dialog"><div class="modal-content"><div class="modal-body">
    <tif-date name="due" class="tif-sm"></tif-date>
    <select name="owner" class="form-select" data-tif="search-select"></select>
  </div></div></div>
</div>`,
        language: 'html',
      },
      {
        text: '<p>The repository\'s test page <code>demo/bootstrap.html</code> runs every component inside a Bootstrap page and a Bootstrap modal.</p>',
      },
    ],
  },
  {
    id: 'translations',
    group,
    title: 'Translations',
    lead: 'English, French, German, Spanish and Italian built in. Add languages, or plug your own translation library.',
    blocks: [
      {
        text: '<p>The language comes from <code>Tif.setLocale()</code>, otherwise from <code>&lt;html lang&gt;</code>, otherwise from the browser. Dates, numbers, the first day of the week and the date pattern follow it, through <code>Intl</code>.</p>',
      },
      { example: 'i18n-locale' },
      { heading: 'Adding a language' },
      {
        code: `Tif.addTranslations('pt', {
  datePicker: { today: 'Hoje', clear: 'Limpar' },
  common: { cancel: 'Cancelar' },
})
Tif.setLocale('pt')`,
        language: 'ts',
      },
      { heading: 'With i18next (or any library)' },
      {
        text: '<p>The built-in dictionaries ship as JSON (<code>dist/locales/fr.json</code>…), with i18next\'s <code>{{variable}}</code> and <code>_one</code> / <code>_other</code> plurals. Load them as a namespace, and hand the translation over:</p>',
      },
      {
        code: `import i18next from 'i18next'
import fr from 'tidyinputfields/locales/fr.json'
import * as Tif from 'tidyinputfields'

i18next.addResourceBundle('fr', 'tif', fr)
Tif.setTranslator((key, params) => i18next.t(\`tif:\${key}\`, params))
i18next.on('languageChanged', Tif.setLocale)`,
        language: 'ts',
      },
      {
        text: '<p>A key the translator does not know falls back to the built-in text. The same works with vue-i18n, FormatJS, Angular or Polyglot: <code>setTranslator</code> takes any <code>(key, params) =&gt; string</code>.</p>',
      },
    ],
  },
]
