// Pages des composants : exemples, options (lues dans DEFAULTS), événements, méthodes.
import * as Tif from 'tidyinputfields'
import type { Page, Row } from '../page.ts'

const forms = 'Forms'
const dates = 'Dates and times'
const lists = 'Lists'

/** Descriptions des options communes aux champs natifs. */
const field: Record<string, string> = {
  name: 'Name sent with the form.',
  value: 'Initial value.',
  placeholder: 'Text shown while the field is empty.',
  required: 'The field must be filled (native validation).',
  disabled: 'The field cannot be changed and is not sent.',
  readonly: 'The field cannot be changed, but is sent.',
  label: 'Accessible name (<code>aria-label</code>), when no visible label is linked.',
  inputId: 'Id of the native field the component creates, for <code>&lt;label for&gt;</code>.',
  quiet: 'No frame until hovered or focused.',
}

const nativeEvents: Row[] = [
  ['<code>input</code>, <code>change</code>', 'Native events of the field, which bubble: forms and frameworks see them.'],
]

const panelEvents = (name: string): Row[] => [
  [`<code>show.tif.${name}</code>`, 'The panel is about to open. <code>preventDefault()</code> keeps it closed.'],
  [`<code>shown.tif.${name}</code>`, 'The panel is open.'],
  [`<code>hidden.tif.${name}</code>`, 'The panel is closed.'],
  ['<code>input</code>, <code>change</code>', 'The value changed (once validated): sent by the hidden field that holds it.'],
]

const keyboard = (rows: Row[]) => ({ table: rows, columns: ['Key', 'Action'] as [string, string] })

export const components: Page[] = [
  {
    id: 'text',
    group: forms,
    title: 'Text, number, text area',
    lead: 'Native fields, dressed: <code>&lt;tif-text&gt;</code>, <code>&lt;tif-number&gt;</code>, <code>&lt;tif-textarea&gt;</code>.',
    blocks: [
      { example: 'text-basic', title: 'Examples' },
      { example: 'text-dress', title: 'Dressing existing fields', text: 'On an existing field, the component adds its classes and gives them back on <code>dispose()</code>. A field that already carries Bootstrap\'s <code>.form-control</code> keeps Bootstrap\'s look.' },
      { example: 'text-validation', title: 'Validation', text: 'Native validation works as usual; add <code>.was-validated</code> to the form (as in Bootstrap) to show it.' },
      { heading: 'Options' },
      { text: '<p><b>Text</b> — <code>&lt;tif-text&gt;</code>, <code>data-tif="text"</code>, <code>Tif.TifText</code></p>' },
      { options: Tif.TifText, descriptions: { ...field, type: '<code>text</code>, <code>email</code>, <code>search</code>, <code>url</code>, <code>tel</code> or <code>password</code>.', autocomplete: 'Native autocomplete hint.', maxlength: 'Maximum length (0: none).' } },
      { text: '<p><b>Number</b> — <code>&lt;tif-number&gt;</code>; digits in a monospaced font. <code>instance.number</code> gives the value as a number.</p>' },
      { options: Tif.TifNumber, descriptions: { ...field, min: 'Smallest value.', max: 'Largest value.', step: 'Step of the arrows.' } },
      { text: '<p><b>Text area</b> — <code>&lt;tif-textarea&gt;</code></p>' },
      { options: Tif.TifTextarea, descriptions: { ...field, rows: 'Visible lines.', maxlength: 'Maximum length (0: none).' } },
      { heading: 'Events' },
      { table: nativeEvents, columns: ['Event', 'Description'] },
    ],
  },
  {
    id: 'select',
    group: forms,
    title: 'Select',
    lead: 'The native drop-down list, dressed, for short lists. For long lists, see <a href="#/search-select">search select</a>.',
    blocks: [
      { example: 'select-basic', title: 'Examples', text: 'Options come from the <code>&lt;option&gt;</code> written in the tag, from the dressed <code>&lt;select&gt;</code>, or from the <code>options</code> array (with groups).' },
      { heading: 'Options' },
      { options: Tif.TifSelect, descriptions: { ...field, placeholder: 'Empty first choice, shown while nothing is chosen and not offered in the list.', options: 'Choices: <code>{ value, label, group?, disabled? }[]</code>.' } },
      { heading: 'Events' },
      { table: nativeEvents, columns: ['Event', 'Description'] },
    ],
  },
  {
    id: 'switch',
    group: forms,
    title: 'Switch',
    lead: 'A yes / no choice: a native checkbox shown as a switch (<code>role="switch"</code>).',
    blocks: [
      { example: 'switch-basic', title: 'Examples', text: 'The component\'s value is the checked state (<code>true</code> / <code>false</code>); the form sends the <code>value</code> option (<code>on</code>) when checked, like a checkbox. <code>instance.toggle()</code> switches it as a click would.' },
      { heading: 'Options' },
      { options: Tif.TifSwitch, descriptions: { ...field, value: 'Value sent when checked.', checked: 'Initially checked.' } },
      { heading: 'Events' },
      { table: nativeEvents, columns: ['Event', 'Description'] },
    ],
  },
  {
    id: 'unit',
    group: forms,
    title: 'Unit',
    lead: 'A number followed by its unit, in grey, which moves with the digits and agrees with the number (“1 month”, “12 months”).',
    blocks: [
      { example: 'unit-basic', title: 'Examples', text: 'The unit never goes into the label. <code>Tif.unitValue(value, unit)</code> renders the same thing read-only. <code>align="right"</code> right-aligns the number and its unit, in a table.' },
      { heading: 'Options' },
      { options: Tif.TifUnit, descriptions: { ...field, unit: 'Unit: a text, or a function of the number (JavaScript only) to agree with it.', align: '<code>left</code> or <code>right</code>.' } },
    ],
  },
  {
    id: 'selector',
    group: forms,
    title: 'Selector',
    lead: 'A required choice among a few options, side by side like radio buttons. Every option is as wide as the longest; the chosen one takes the primary colour.',
    blocks: [
      { example: 'selector-basic', title: 'Examples', text: 'The value lives in a <code>&lt;select&gt;</code>: the dressed one (hidden), or a hidden one created in the tag. The arrow keys move from one option to the next.' },
      keyboard([
        ['← → ↑ ↓', 'Previous / next option (reversed left and right in right-to-left pages).'],
        ['Tab', 'Leaves the selector (only the chosen option is in the tab order).'],
      ]),
      { heading: 'Options' },
      {
        options: Tif.TifSelector,
        descriptions: { name: field.name, value: field.value, disabled: field.disabled, label: field.label, options: 'Options: <code>{ value, label, title?, icon? }[]</code> (otherwise the <code>&lt;option&gt;</code>).' },
      },
    ],
  },
  {
    id: 'date',
    group: dates,
    title: 'Date',
    lead: 'Quick typing, a calendar that zooms out to months and years, and the date format of the language. The form receives ISO dates.',
    blocks: [
      { example: 'date-basic', title: 'Examples', text: 'Type <code>1/1/27</code>, <code>15</code> (this month), <code>3-4</code> (this year) or <code>010127</code>: the date is read in the order of the language and rewritten when leaving the field. Placed on an <code>&lt;input type="date"&gt;</code>, the component turns it into the hidden field that holds the value, and gives it back on <code>dispose()</code>.' },
      keyboard([
        ['Alt + ↓', 'Opens the calendar.'],
        ['Enter', 'Validates the typing (the form is still submitted).'],
        ['Escape', 'Closes the calendar, or cancels the typing.'],
        ['Click on the title', 'Zooms out: days → months → years.'],
      ]),
      { heading: 'Options' },
      { options: Tif.TifDate, descriptions: { ...field, value: 'Initial value, <code>YYYY-MM-DD</code>.', firstDay: 'First day of the week: 1 Monday … 7 Sunday; 0 takes the one of the language.' } },
      { heading: 'Events' },
      { table: panelEvents('date'), columns: ['Event', 'Description'] },
      { example: 'usage-events', title: 'Listening to the events' },
    ],
  },
  {
    id: 'time',
    group: dates,
    title: 'Time',
    lead: 'Quick typing (<code>2</code>, <code>930</code>, <code>14h30</code>), arrows to step, and a clock with hours, minutes and shortcuts.',
    blocks: [
      { example: 'time-basic', title: 'Examples' },
      keyboard([
        ['↑ ↓', 'One minute more or less (Shift: 15).'],
        ['Alt + ↓', 'Opens the clock: an hour keeps it open, a minute closes it.'],
        ['Enter / Escape', 'Validates / cancels the typing.'],
      ]),
      { heading: 'Options' },
      { options: Tif.TifTime, descriptions: { ...field, value: 'Initial value, <code>HH:mm</code>.', minuteStep: 'Step of the minutes offered by the clock.' } },
      { heading: 'Events' },
      { table: panelEvents('time'), columns: ['Event', 'Description'] },
    ],
  },
  {
    id: 'date-time',
    group: dates,
    title: 'Date and time',
    lead: 'A date and a time side by side; the time zone, at the end, only when it is not the default one.',
    blocks: [
      { example: 'date-time-basic', title: 'Examples', text: 'The value is <code>YYYY-MM-DDTHH:mm</code>: a date without a time takes 00:00, clearing the date clears everything, and the time stays disabled while there is no date.' },
      { heading: 'Options' },
      {
        options: Tif.TifDateTime,
        descriptions: { ...field, value: 'Initial value, <code>YYYY-MM-DDTHH:mm</code>.', timeZone: 'Time zone of the value (<code>America/New_York</code>), shown when it differs from <code>defaultTimeZone</code>.', defaultTimeZone: 'Time zone not shown; the browser\'s by default.' },
      },
    ],
  },
  {
    id: 'period',
    group: dates,
    title: 'Period',
    lead: 'A period filter: shortcuts, past dates, months, quarters and years around the current one, or specific dates.',
    blocks: [
      { example: 'period-basic', title: 'Examples', text: 'Months, quarters and years are relative: saved in a view, “this month” follows the calendar. <code>instance.range</code> gives today\'s bounds. The form receives the period as JSON.' },
      {
        code: `{ "operator": "period", "unit": "month", "from": 0, "to": 0 }    // this month
{ "operator": "period", "unit": "quarter", "from": -1, "to": -1 } // last quarter
{ "operator": "past" }                                             // before today
{ "operator": "between", "from": "2026-01-01", "to": "2026-03-31" }`,
        language: 'json',
      },
      keyboard([
        ['↑ ↓', 'Moves in the list.'],
        ['Enter or →', 'Chooses, or opens a sub-menu (month, quarter, year, specific dates).'],
        ['← or Escape', 'Back to the first list; Escape there closes.'],
      ]),
      { heading: 'Options' },
      {
        options: Tif.TifPeriod,
        descriptions: { name: field.name, value: 'Initial period (object or JSON).', field: 'Name of the filtered date (“Signature”), shown before the period.', allLabel: 'Label without a period (“All signatures”); also the accessible name.', relativeOnly: 'Removes past dates and specific dates.', disabled: field.disabled, quiet: field.quiet },
      },
    ],
  },
  {
    id: 'search-select',
    group: lists,
    title: 'Search select',
    lead: 'A drop-down list with a search: every typed word must be in the label, in any order, without accents or case.',
    blocks: [
      { example: 'search-basic', title: 'Examples', text: 'At rest, a classic drop-down list. A letter typed on the closed list opens it and starts the search. <code>empty-label</code> adds a choice to empty the field; <code>required</code> turns it orange while empty.' },
      { example: 'search-groups', title: 'Groups, pills, deactivated options', text: 'Options are grouped under headings (<code>groupOrder</code> first), carry a pill, and deactivated ones are hidden behind a switch in the footer — the current choice always stays offered.' },
      { example: 'search-remote', title: 'Remote source', text: 'For a list too long to be loaded: the <code>source</code> function is called after each keystroke and returns the first matches and their total (“first 20 of 300: refine the search”). The label can be a link, and a <b>New</b> button sends <code>create.tif.search-select</code>.' },
      keyboard([
        ['A letter', 'Opens the list and starts the search.'],
        ['↑ ↓', 'Moves in the list.'],
        ['Enter', 'Chooses.'],
        ['Escape / Tab', 'Closes.'],
      ]),
      { heading: 'Options' },
      {
        options: Tif.TifSearchSelect,
        descriptions: {
          name: field.name,
          value: field.value,
          options: 'Options: <code>{ value, label, group?, pill?, inactive? }[]</code> (otherwise the <code>&lt;option&gt;</code>, with <code>data-pill</code> and <code>data-inactive</code>).',
          emptyLabel: 'Label of the empty choice; without it, the field cannot be emptied.',
          groupOrder: 'Groups shown first, in this order.',
          searchThreshold: 'Number of options from which the search is shown (0: always).',
          required: 'Orange while empty.',
          missing: 'Orange anyway.',
          disabled: field.disabled,
          label: field.label,
          placeholder: 'Text of the button without a choice.',
          quiet: field.quiet,
          create: 'A <b>New</b> button in the footer, which sends <code>create.tif.search-select</code>.',
          link: 'Link of the current choice: <code>{value}</code> is replaced.',
          linkTitle: 'Tooltip of the link.',
          source: '<code>(query, { limit, onlyActive, signal }) =&gt; Promise&lt;{ options, total? }&gt;</code>.',
          sourceLabel: '<code>(value) =&gt; Promise&lt;string | null&gt;</code>: label of the current value.',
          limit: 'Number of results asked from the source.',
          activeFilter: 'Label of a footer switch, on by default, passed to the source as <code>onlyActive</code>.',
        },
      },
      { heading: 'Events' },
      { table: [...panelEvents('search-select'), ['<code>create.tif.search-select</code>', 'The <b>New</b> button was clicked; <code>detail.search</code> holds the search.']], columns: ['Event', 'Description'] },
    ],
  },
  {
    id: 'multi-select',
    group: lists,
    title: 'Multi select',
    lead: 'A multiple choice for filters: “All sectors” when nothing is checked, the label of a single choice, “3 sectors” beyond.',
    blocks: [
      { example: 'multi-basic', title: 'Examples', text: 'Options are checked without closing the panel. The values live in a <code>&lt;select multiple&gt;</code>: the form sends all of them.' },
      { example: 'multi-shortcuts', title: 'Shortcuts', text: 'An option with <code>selects</code> is a shortcut without a box: it replaces the selection with its values, or empties it when they are already exactly chosen.' },
      keyboard([
        ['↑ ↓', 'Moves in the list.'],
        ['Enter or Space', 'Checks or unchecks.'],
        ['Escape / Tab', 'Closes.'],
      ]),
      { heading: 'Options' },
      {
        options: Tif.TifMultiSelect,
        descriptions: {
          name: field.name,
          value: 'Checked values: array, JSON or comma-separated text.',
          options: 'Options: <code>{ value, label, group?, selects? }[]</code>.',
          label: 'Label when nothing is checked; also the accessible name.',
          unit: 'Plural for “3 sectors”; by default the label without “All”.',
          groupOrder: 'Groups shown first.',
          searchThreshold: 'Number of options from which the search is shown.',
          disabled: field.disabled,
          quiet: field.quiet,
        },
      },
    ],
  },
  {
    id: 'lookup',
    group: lists,
    title: 'Lookup',
    lead: 'Choosing a record in a list too long for a menu: type a few letters, choose among the first matches.',
    blocks: [
      { example: 'lookup-basic', title: 'Examples', text: 'The field then shows the label of the choice; the cross removes it. The value — the record\'s id — lives in a hidden field.' },
      keyboard([
        ['↑ ↓', 'Moves in the suggestions.'],
        ['Enter', 'Chooses.'],
        ['Escape', 'Closes, or restores the label of the choice.'],
      ]),
      { heading: 'Options' },
      {
        options: Tif.TifLookup,
        descriptions: {
          ...field,
          minChars: 'Number of letters before searching.',
          limit: 'Number of suggestions asked.',
          source: '<code>(query, { limit, signal }) =&gt; Promise&lt;options&gt;</code>.',
          sourceLabel: '<code>(value) =&gt; Promise&lt;string | null&gt;</code>: label of a value.',
        },
      },
    ],
  },
  {
    id: 'sortable-list',
    group: lists,
    title: 'Sortable list',
    lead: 'Objects attached to a main object: each one is removed by its cross after a confirmation, added by the “+”, and reordered by drag and drop.',
    blocks: [
      { example: 'sortable-basic', title: 'Examples', text: 'With <code>name</code>, the form receives the keys in order. The grip also moves an item with the up and down arrows.' },
      { example: 'sortable-rich', title: 'Rich content', text: 'Content can be any node: extra text, a pill, a link (<code>href</code>, with a tooltip). A <code>fixed</code> item moves but cannot be removed.' },
      { heading: 'Options' },
      {
        options: Tif.TifSortableList,
        descriptions: {
          name: 'Name under which the form sends the keys, in order.',
          items: 'Items: <code>{ key, label, content?, href?, title?, fixed? }[]</code> (otherwise the <code>&lt;li data-key&gt;</code>).',
          numbered: 'Shows the rank of each item.',
          reorderable: 'Grip, drag and drop and arrow keys.',
          readonly: 'Neither grip nor buttons.',
          add: 'A “+” button under the list, which sends <code>add.tif.sortable-list</code>.',
          addLabel: 'Label of the “+” button.',
          removeTitle: 'Title of the removal dialog.',
          removeDetail: 'Detail under the question (what the removal does not do).',
          confirmRemove: 'Asks for a confirmation before removing.',
          emptyLabel: 'Text of the empty list; without it, an empty list shows only the “+”.',
          required: 'Orange while empty.',
          label: field.label,
        },
      },
      { heading: 'Events and methods' },
      {
        table: [
          ['<code>add.tif.sortable-list</code>', 'The “+” was clicked: open your dialog, then call <code>add(item)</code>.'],
          ['<code>remove.tif.sortable-list</code>', 'An item is about to be removed (after confirmation); <code>preventDefault()</code> keeps it. <code>detail: { key, item }</code>.'],
          ['<code>reorder.tif.sortable-list</code>', 'The order changed; <code>detail.keys</code>.'],
          ['<code>change</code>', 'Any change, on the element.'],
          ['<code>add(item)</code>, <code>remove(key, ask?)</code>, <code>move(key, index)</code>, <code>setItems(items)</code>', 'Methods; <code>items</code> and <code>value</code> (the keys) to read.'],
        ],
        columns: ['Event / method', 'Description'],
      },
    ],
  },
]
