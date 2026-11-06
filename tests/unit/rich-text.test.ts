import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from '../../src/core/dom.ts'
import { setLocale, t } from '../../src/i18n/i18n.ts'
import { TifRichText, cleanPastedHtml, plainText, sanitizeHtml } from '../../src/rich-text/index.ts'

beforeEach(() => setLocale('en'))
afterEach(() => {
  for (const element of document.querySelectorAll<HTMLElement>('*')) {
    TifRichText.getInstance(element)?.dispose()
  }
  document.body.replaceChildren()
  setLocale(null)
})

describe('rich text HTML', () => {
  it('keeps the editor formatting and drops the rest', () => {
    const html = sanitizeHtml('<p onclick="x()">Hi <strong>there</strong><script>alert(1)</script></p><object data="x"></object>')
    expect(html).toBe('<p>Hi <strong>there</strong></p>')
  })

  it('keeps safe links and images only', () => {
    expect(sanitizeHtml('<p><a href="javascript:alert(1)">x</a><a href="https://e.com">y</a></p>')).toBe(
      '<p><a target="_blank" rel="noopener noreferrer">x</a><a href="https://e.com" target="_blank" rel="noopener noreferrer">y</a></p>',
    )
    expect(sanitizeHtml('<img src="javascript:x">')).toBe('')
    expect(sanitizeHtml('<img src="https://e.com/a.png" width="120" onerror="x()">')).toBe('<img src="https://e.com/a.png" alt="" width="120">')
    expect(sanitizeHtml('<img data-image-id="img-42">')).toBe('<img data-image-id="img-42" alt="">')
  })

  it('turns plain text into paragraphs', () => {
    expect(sanitizeHtml('one\ntwo <b>')).toBe('<p>one</p><p>two &lt;b&gt;</p>')
    expect(plainText('<p>One</p><p>Two <em>three</em></p>')).toBe('One Two three')
  })

  it('cleans what is pasted from Word', () => {
    const pasted = '<html><head><style>p{}</style></head><body><!--x--><p class="MsoNormal" style="font-family:Calibri"><span style="font-weight:bold">Bold</span> text<o:p></o:p></p><h5>Small title</h5></body></html>'
    const clean = cleanPastedHtml(pasted)
    expect(clean).toContain('<strong>Bold</strong>')
    expect(clean).toContain('<h3>Small title</h3>')
    expect(clean).not.toContain('Mso')
    expect(clean).not.toContain('Calibri')
  })
})

describe('TifRichText', () => {
  it('registers its translations', () => {
    setLocale('fr')
    expect(t('richText.blocks.title')).not.toBe('richText.blocks.title')
    expect(t('richText.toolbar.tools.bold')).toBe('Gras (Ctrl+B)')
  })

  it('edits HTML and fills a hidden field', () => {
    const host = h('div')
    document.body.append(host)
    const editor = new TifRichText(host, { name: 'notes', value: '<p>Hello <strong>world</strong></p>' })
    const hidden = host.querySelector<HTMLInputElement>('input[type=hidden]')!
    expect(hidden.name).toBe('notes')
    expect(hidden.value).toBe('<p>Hello <strong>world</strong></p>')
    expect(editor.value).toBe('<p>Hello <strong>world</strong></p>')
    expect(editor.text).toBe('Hello world')
    editor.value = 'plain text'
    expect(editor.value).toBe('<p>plain text</p>')
    editor.value = ''
    expect(editor.value).toBe('')
    expect(hidden.value).toBe('')
  })

  it('reads the HTML written in the element', () => {
    const host = h('div', {}, h('p', {}, 'Written'), h('script', {}, 'alert(1)'))
    document.body.append(host)
    const editor = new TifRichText(host)
    expect(editor.value).toBe('<p>Written</p>')
    expect(host.querySelector('script')).toBeNull()
  })

  it('replaces a textarea and gives it back on dispose', () => {
    const form = h('form')
    const textarea = h('textarea', { name: 'body' })
    textarea.value = 'First line\nSecond line'
    form.append(textarea)
    document.body.append(form)
    const editor = new TifRichText(textarea)
    expect(textarea.hidden).toBe(true)
    expect(textarea.value).toBe('<p>First line</p><p>Second line</p>')
    expect(new FormData(form).get('body')).toBe('<p>First line</p><p>Second line</p>')
    editor.dispose()
    expect(textarea.hidden).toBe(false)
    expect(form.querySelector('.tif-rich-text')).toBeNull()
  })

  it('cannot be edited when disabled or read-only', () => {
    const host = h('div')
    document.body.append(host)
    const editor = new TifRichText(host, { readonly: true })
    const content = host.querySelector('.tif-rich-content')!
    expect(content.getAttribute('contenteditable')).toBe('false')
    editor.setOptions({ readonly: false })
    expect(content.getAttribute('contenteditable')).toBe('true')
    editor.setOptions({ disabled: true })
    expect(content.getAttribute('contenteditable')).toBe('false')
    expect(host.querySelector<HTMLInputElement>('input[type=hidden]')!.disabled).toBe(true)
  })

  it('keeps image identifiers rather than addresses', () => {
    const host = h('div')
    document.body.append(host)
    const editor = new TifRichText(host, { value: '<p>a</p><img data-image-id="img-1" alt="Plan" width="200">', imageSrc: (id: string) => `https://cdn.example/${id}.png` })
    expect(editor.value).toContain('data-image-id="img-1"')
    expect(editor.value).toContain('width="200"')
    expect(editor.value).not.toContain('src=')
    expect(host.querySelector<HTMLImageElement>('.tif-rich-image img')!.src).toBe('https://cdn.example/img-1.png')
  })

  it('keeps mentions with their kind', () => {
    const host = h('div')
    document.body.append(host)
    const editor = new TifRichText(host, { value: '<p>Hi <span data-type="mention" data-id="u1" data-label="Ada" data-kind="USER">@Ada</span></p>' })
    expect(editor.value).toContain('data-id="u1"')
    expect(editor.value).toContain('data-kind="USER"')
  })

  it('is created by its tag', async () => {
    const tag = document.createElement('tif-rich-text')
    tag.setAttribute('name', 'memo')
    tag.setAttribute('value', '<p>From the tag</p>')
    document.body.append(tag)
    await Promise.resolve()
    const editor = TifRichText.getInstance(tag)!
    expect(editor).not.toBeNull()
    expect(editor.value).toBe('<p>From the tag</p>')
    expect(tag.querySelector<HTMLInputElement>('input[name=memo]')!.value).toBe('<p>From the tag</p>')
  })
})
