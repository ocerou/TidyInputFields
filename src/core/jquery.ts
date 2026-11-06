// Pont jQuery, comme dans Bootstrap 5 : si jQuery est chargé dans la page, chaque composant devient aussi un plugin
// jQuery — $('.x').tifDate({...}), $('.x').tifDate('dispose'). jQuery n'est jamais importé.
import type { Component, ComponentClass, Options } from './component.ts'
import { camel, onReady } from './dom.ts'

type JQueryLike = { fn: Record<string, unknown> }

/** Nom du plugin : « search-select » → « tifSearchSelect ». */
export const jQueryName = (name: string) => `tif${camel(name).replace(/^./, (c) => c.toUpperCase())}`

/** Branche le composant sur jQuery quand le document est prêt, si jQuery est présent et pas désactivé. */
export function defineJQueryPlugin(type: ComponentClass): void {
  onReady(() => {
    const $ = (window as unknown as { jQuery?: JQueryLike }).jQuery
    if (!$ || document.body?.hasAttribute('data-tif-no-jquery')) {
      return
    }
    const name = jQueryName(type.NAME)
    const previous = $.fn[name]
    const plugin = function (this: Iterable<HTMLElement> & { each: (fn: (this: HTMLElement) => void) => unknown }, config?: Options | string) {
      return this.each(function () {
        const instance = type.getOrCreateInstance(this, typeof config === 'object' ? config : {})
        if (typeof config === 'string') {
          const method = (instance as unknown as Record<string, unknown>)[config]
          if (config.startsWith('_') || config === 'constructor' || typeof method !== 'function') {
            throw new TypeError(`No method named "${config}"`)
          }
          ;(method as (this: Component) => void).call(instance)
        }
      })
    }
    Object.assign(plugin, {
      Constructor: type,
      noConflict: () => {
        $.fn[name] = previous
        return plugin
      },
    })
    $.fn[name] = plugin
  })
}
