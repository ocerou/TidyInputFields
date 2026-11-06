// Fenêtre de confirmation (retrait d'un élément d'une liste…), sur un <dialog> natif. Ouverte depuis une modale
// Bootstrap, elle s'y accroche pour que son piège à focus ne lui retire pas le clavier.
import { t } from '../i18n/i18n.ts'
import { h, uid } from './dom.ts'
import { containerFor } from './floating.ts'

export interface ConfirmOptions {
  title: string
  /** Texte ou contenu sous le titre. */
  message?: string | Node
  /** Libellé du bouton de validation (« Confirmer » par défaut). */
  confirmLabel?: string
  /** Libellé du bouton d'abandon (« Annuler » par défaut). */
  cancelLabel?: string
  /** Bouton de validation en rouge (retrait, suppression). */
  danger?: boolean
  /** Élément d'où part la demande : la fenêtre s'accroche à la modale qui le contient. */
  anchor?: Element
}

/** Demande une confirmation ; rend true si elle est donnée, false si on annule (bouton, Échap). */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const titleId = uid('tif-dialog-title')
    let answer = false
    const cancel = h('button', { type: 'button', class: 'tif-btn', value: 'cancel' }, options.cancelLabel ?? t('common.cancel'))
    const ok = h(
      'button',
      { type: 'button', class: `tif-btn ${options.danger ? 'tif-btn-danger' : 'tif-btn-primary'}`, value: 'confirm' },
      options.confirmLabel ?? t('common.confirm'),
    )
    const dialog = h(
      'dialog',
      { class: 'tif-dialog', 'aria-labelledby': titleId },
      h('h2', { class: 'tif-dialog-title', id: titleId }, options.title),
      options.message != null && h('div', { class: 'tif-dialog-body' }, options.message),
      h('div', { class: 'tif-dialog-actions' }, cancel, ok),
    )
    cancel.addEventListener('click', () => dialog.close())
    ok.addEventListener('click', () => {
      answer = true
      dialog.close()
    })
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        // Échap annule la confirmation sans fermer la modale qui la contient.
        event.stopPropagation()
      }
    })
    dialog.addEventListener('close', () => {
      dialog.remove()
      resolve(answer)
    })
    ;(options.anchor ? containerFor(options.anchor) : document.body).append(dialog)
    dialog.showModal()
    ok.focus()
  })
}
