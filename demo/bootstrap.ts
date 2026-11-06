// Catalogue avec Bootstrap 5.3 et jQuery chargés dans la page, pour vérifier la compatibilité : couleurs reprises de
// Bootstrap, mode sombre data-bs-theme, panneaux et confirmations dans une modale.
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import jQuery from 'jquery'

Object.assign(window, { jQuery, $: jQuery })

await import('./catalogue.ts')
