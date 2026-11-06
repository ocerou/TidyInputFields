# Plan de TidyInputFields

Librairie open-source de zones de saisie en JS + CSS sans framework, tirée des composants `Input…` de MyCRM
(`MyCRM/web/src/common/inputs/`). MyCRM n'est pas modifié pendant la création.

## Décisions

- Nom : **TidyInputFields**. Préfixe : **`tif-`** (balises, attributs `data-tif`, variables `--tif-*`).
- Licence **MIT**, au nom d'Olivier CEROU.
- Code et documentation publique en anglais, commentaires en français. Icônes au trait (Bootstrap Icons, MIT).
- Architecture :
  1. **Plugin à la Bootstrap 5** au cœur : `new TifX(el, options)`, `getInstance`, `getOrCreateInstance`,
     `dispose`, événements `change.tif.x`. Le composant crée son interface dans son conteneur et nulle part ailleurs ;
     la valeur vit dans un `<input>` natif (caché pour les composants sans équivalent natif).
  2. **Initialisation par attributs** `data-tif="…"`, optionnelle, avec un `MutationObserver` pour les champs ajoutés
     après coup.
  3. **Balise** `<tif-x>` : enveloppe fine qui crée le plugin dans `connectedCallback` et le libère dans
     `disconnectedCallback`. Pas de Shadow DOM.
- Sortie : TypeScript compilé par Vite (mode librairie) en un module ES + `tidy-input-fields.css`. L'éditeur riche,
  qui dépend de TipTap, est un paquet à part.

## Sources dans MyCRM

| Groupe | Composants | Lignes |
|---|---|---|
| Champs natifs | InputText, InputNumber, InputTextArea, InputSelect, InputSwitch | 6 chacun |
| Simples | InputUnit, InputSelector | ~90 |
| Dates et heures | InputDate, InputTime, InputDateTime, InputPeriod | ~940 |
| Listes | InputSearchSelect, InputMultiSelect, InputLookup, InputSortableList | ~850 |
| Couleur | InputColorPicker + ColorPanel | ~150 + panneau |
| Éditeur riche | InputRichText | 1 152 |

Liens avec MyCRM à couper : React, react-i18next, `callApi` (remplacé par une fonction `source(query)` asynchrone
fournie par l'appelant), react-router, `recordLink`, `ConfirmDialog`, et pour l'éditeur riche `pages/records`
(TableTools, SelectionToolbar, fontSize, EditableCard). Utilitaires repris presque tels quels : `dateInput`,
`timeInput`, `datePeriod`, `optionSearch`, `unit`, `dragOrder`, `images`, `richText`. CSS à extraire de `index.css`.

## Étapes

1. **Socle** : Vite en mode librairie, classe de base des plugins, data-api, fabrique des balises, variables CSS
   (clair et sombre), i18n intégrée (5 langues, `setLocale()`), icônes SVG intégrées, gestionnaire des panneaux
   flottants (placement, ouverture vers le haut, fermeture au clic dehors ou au défilement), boîte de confirmation.
2. **Champs simples** : text, number, textarea, select, switch, unit, selector.
3. **Dates et heures** : date, time, date-time (fuseau), period.
4. **Listes** : search-select, multi-select, lookup, sortable-list.
5. **Couleur** : color-picker et son panneau, avec la pipette.
6. **Éditeur riche** dans un paquet séparé, détaché de MyCRM ; mentions et envoi des images fournis par l'appelant.
7. **Catalogue et tests** : page de démo qui sert de documentation, Vitest sur les utilitaires, Playwright pour le
   clavier et le rendu.
8. **Plus tard, sur demande** : réintégration dans MyCRM via des enveloppes React.

## À décider

- Réservation du nom : paquet npm, organisation GitHub, domaine.
