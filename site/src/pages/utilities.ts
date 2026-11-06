// Pages des utilitaires : confirmation, panneaux flottants, icônes.
import type { Page } from '../page.ts'

const group = 'Utilities'

export const utilities: Page[] = [
  {
    id: 'confirm',
    group,
    title: 'Confirmation',
    lead: '<code>Tif.confirm()</code>: a native <code>&lt;dialog&gt;</code> that returns a promise.',
    blocks: [
      { example: 'confirm-basic', text: 'Enter or the button confirms, Escape cancels. Opened from a Bootstrap modal (<code>anchor</code>), it hangs inside it and Escape does not close the modal.' },
      {
        table: [
          ['<code>title</code>', 'Question.'],
          ['<code>message</code>', 'Text or node under the title.'],
          ['<code>confirmLabel</code>, <code>cancelLabel</code>', 'Button labels (translated defaults).'],
          ['<code>danger</code>', 'Red confirmation button.'],
          ['<code>anchor</code>', 'Element the request comes from.'],
        ],
        columns: ['Option', 'Description'],
      },
    ],
  },
  {
    id: 'floating',
    group,
    title: 'Floating panel',
    lead: 'The panel service behind every calendar and list, available for your own content.',
    blocks: [
      { example: 'floating-basic', text: 'Placed below the field, or above when there is no room, kept inside the window; closed by an outside click, a page scroll that moves the field, or Escape. Panels opened from inside a panel are its children: a click in them does not close the parent, and Escape closes the most recent only.' },
      {
        table: [
          ['<code>placement</code>', '<code>bottom-start</code>, <code>bottom-end</code>, <code>top-start</code>, <code>top-end</code>.'],
          ['<code>matchWidth</code>', 'At least as wide as the field.'],
          ['<code>onClose(reason)</code>', '<code>outside</code>, <code>scroll</code>, <code>escape</code> or <code>api</code>.'],
          ['<code>onEscape()</code>', 'Return <code>true</code> to keep the panel open (back to a previous screen).'],
          ['<code>returnFocus</code>', 'Element focused again after Escape.'],
        ],
        columns: ['Option', 'Description'],
      },
    ],
  },
  {
    id: 'icons',
    group,
    title: 'Icons',
    lead: 'Bootstrap Icons (MIT), outlined, copied into the script — no icon font. Replace them with <code>Tif.setIcons()</code>.',
    blocks: [
      { example: 'icons-grid' },
      {
        code: `// Any SVG made of path, circle, rect, ellipse, line, polyline or polygon elements.
Tif.setIcons({ calendar: '<svg viewBox="0 0 24 24"><path d="…"/></svg>' })`,
        language: 'ts',
      },
    ],
  },
]
