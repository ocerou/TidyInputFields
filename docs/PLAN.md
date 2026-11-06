# Plan de TidyInputFields

Librairie open-source de zones de saisie en JS + CSS sans framework, tirée des composants `Input…` de MyCRM
(`MyCRM/web/src/common/inputs/`). MyCRM n'est pas modifié pendant la création.

## Décisions

- Nom : **TidyInputFields**, paquet npm `tidyinputfields`. Préfixe : **`tif-`** (balises, attributs `data-tif-*`,
  variables `--tif-*`, objet global `Tif`).
- Licence **MIT**, au nom d'Olivier CEROU.
- Code et documentation publique en anglais, commentaires en français. Icônes au trait (Bootstrap Icons, MIT).
- Comportement repris fidèlement de MyCRM ; les idées d'amélioration sont notées à part, pas faites en passant.
- **Éditeur riche écarté pour l'instant** (il dépend de TipTap). On verra plus tard.

## Architecture

1. **Plugin à la Bootstrap 5** au cœur : `new TifX(el, options)`, `getInstance`, `getOrCreateInstance`, `dispose`.
   Options : valeurs par défaut < attributs `data-tif-*` < options JS. Le composant crée son interface dans son
   conteneur et nulle part ailleurs.
2. **Valeur** dans un `<input>` natif (caché pour les composants sans équivalent natif), qui émet les événements natifs
   `input` et `change`. Événements de cycle à la Bootstrap : `show.tif.x` et `hide.tif.x` (annulables), `shown.tif.x`,
   `hidden.tif.x`.
3. **Initialisation par attributs** : `Tif.init(root)` au chargement, `Tif.observe()` optionnel (MutationObserver) pour
   les champs ajoutés ou retirés après coup.
4. **Balise** `<tif-x>` : enveloppe fine qui crée le plugin dans `connectedCallback` et le libère dans
   `disconnectedCallback`. Pas de Shadow DOM : le composant crée ses champs natifs dans la balise, donc les formulaires
   et la validation les voient sans `ElementInternals` (décidé au lot 1, plus simple et sans doublon de valeur).
5. **Pont jQuery** optionnel : si jQuery est présent, `$('.x').tifDate()`, comme Bootstrap 5.

Sortie : TypeScript compilé par Vite en `tidyinputfields.js` (module ES), `tidyinputfields.min.js` (script classique,
global `Tif`) et `tidyinputfields.css`, plus les dictionnaires en JSON (`locales/xx.json`).

## Principes

### Zéro dépendance

Aucune dépendance à l'exécution. Les outils de développement (Vite, TypeScript, Vitest, Playwright, oxlint) ne sont
pas livrés.

- Icônes : SVG de Bootstrap Icons copiés à la construction, mention MIT conservée ; `Tif.setIcons()` pour un autre jeu.
- Dates et nombres : `Intl` du navigateur et chaînes ISO (`2026-11-06`, `14:30`), aucune librairie de dates.
- Glisser-déposer, recherche, placement des panneaux : écrits dans la librairie.

### Compatible Bootstrap, sans l'importer

- Variables : `--tif-accent: var(--bs-primary, …)`, et de même pour rayons, police, bordures, focus. Avec Bootstrap,
  les champs en prennent l'allure ; sans lui, ils gardent la leur.
- Mode sombre : `data-bs-theme="dark"` en plus de `prefers-color-scheme`.
- Validation : `.is-invalid`, `.is-valid`, `.was-validated` ; tailles `-sm` / `-lg`.
- Fenêtres modales : le panneau d'un champ placé dans une modale est créé dans la modale, sinon le piège à focus de
  Bootstrap lui retire le clavier.

### Compatible avec les librairies de traduction

- Dictionnaires intégrés (fr, en, de, es, it), anglais par défaut, langue lue sur `<html lang>`.
- `Tif.setTranslator((key, params) => …)` pour brancher i18next, vue-i18n, FormatJS, Angular, Polyglot… Exemple :
  ``Tif.setTranslator((k, p) => i18next.t(`tif:${k}`, p))`` et `i18next.on('languageChanged', Tif.setLocale)`.
- `Tif.addTranslations()` ; dictionnaires livrés aussi en JSON, chargeables comme espace de noms `tif`.
- `Tif.setLocale()` met à jour les champs ouverts ; formats (premier jour de semaine, séparateur décimal) par `Intl`.

### Autres compatibilités

- React, Vue, Angular, Svelte : via les balises `<tif-…>` ; enveloppes typées plus tard.
- HTMX, Turbo, Livewire : `Tif.observe()` initialise et libère les champs.
- Tailwind et CSS maison : classes préfixées `tif-` de faible spécificité, réglages par variables `--tif-*`. Pas de
  `@layer` (abandonné au lot 1) : les règles hors couche l'emportent toujours, et le reboot de Bootstrap
  (`button { border-radius: 0 }`, `mark`, `h2`…) écrasait la librairie.
- Rendu côté serveur : l'import ne touche jamais à `window`.
- CSP stricte : ni `eval`, ni `<style>` injecté.
- Droite à gauche : propriétés CSS logiques, `dir="rtl"` respecté.
- Accessibilité : motifs WAI-ARIA (combobox, listbox, grille pour le calendrier, dialog).

## Sources dans MyCRM

| Groupe | Composants | Lignes |
|---|---|---|
| Champs natifs | InputText, InputNumber, InputTextArea, InputSelect, InputSwitch | 6 chacun |
| Simples | InputUnit, InputSelector | ~90 |
| Dates et heures | InputDate, InputTime, InputDateTime, InputPeriod | ~940 |
| Listes | InputSearchSelect, InputMultiSelect, InputLookup, InputSortableList | ~850 |
| Couleur | InputColorPicker + ColorPanel | ~150 + 294 |

Liens avec MyCRM à couper : React, react-i18next (~100 clés : datePicker, timePicker, period, search, multi,
sortable, colorPanel, colorPicker…), `callApi` (remplacé par une fonction `source(query)` asynchrone fournie par
l'appelant), react-router, `recordLink`, `ConfirmDialog`. Utilitaires repris presque tels quels : `dateInput`,
`timeInput`, `datePeriod`, `optionSearch` (sans React), `unit`, `dragOrder`. Le placement des panneaux, recopié dans
4 composants de MyCRM, devient un service commun. CSS à extraire de `index.css` (~40 variables).

## Étapes

0. **Outillage** : paquet, Vite (mode librairie), TypeScript, oxlint, Vitest, Playwright, CI GitHub Actions.
1. **Socle** : classe de base, data-api, fabrique de balises, pont jQuery, panneaux flottants, traductions, icônes,
   boîte de confirmation (`<dialog>`), variables CSS (clair, sombre, pont Bootstrap), utilitaires et leurs tests,
   catalogue de démo (qui sert de documentation).
2. **Champs simples** : text, number, textarea, select, switch, unit, selector.
3. **Dates et heures** : date, time, date-time (fuseau), period. → publication `0.1.0`.
4. **Listes** : search-select, multi-select, lookup, sortable-list.
5. **Couleur** : color-picker et son panneau, avec la pipette. → publication `1.0.0`.
6. **Documentation** (ajoutée à la demande d'Olivier) : site `site/` à la manière de Bootstrap ; chaque exemple de
   composant en trois façons (balise, data-tif, API JavaScript) plus React.

7. **Nouveaux composants** (choisis par Olivier le 06/11, absents de MyCRM), un commit chacun :
   - `tags` : étiquettes ; Entrée ou virgule crée, Retour arrière retire la dernière, collage découpé, sans doublon,
     suggestions facultatives (`options`), `allowNew`, `max` ; le formulaire reçoit une valeur par étiquette.
   - `range` : curseur natif habillé, valeur affichée (avec unité), min / max / step, graduations facultatives.
   - `rating` : note en étoiles de 0 à `max`, clavier (flèches, Origine, Fin, 0), lecture seule, demi-étoiles en lecture.
   - `money` : montant mis en forme dans la langue en quittant la zone (séparateurs, décimales de la devise), saisie
     brute au focus, devise fixe ou choisie dans une liste ; valeur envoyée en nombre (`1234.5`) et code devise.
   - `file` : zone de dépôt + bouton, liste des fichiers (nom, taille, retrait), `accept`, `multiple`, `maxSize`,
     `maxFiles` ; les fichiers restent dans le `<input type="file">` natif (DataTransfer) : le formulaire les envoie.
   - Écarté : le téléphone (une mise en forme juste demande une base de numérotation par pays, ~150 Ko).
8. **Éditeur riche** : InputRichText de MyCRM en sous-chemin `tidyinputfields/rich-text` (choix d'Olivier le 06/11),
   Tiptap 2 (MIT) embarqué dans `dist/rich-text.js` (rien à installer, la librairie principale reste sans dépendance),
   licences dans `dist/rich-text.licenses.md`. Barre de sélection, « / », « @ » (rappel `mentions`), « /: », poignée
   des blocs, tableaux à la Notion, images par rappel `uploadImage` (`{ src, id? }`, `imageSrc(id)`), collage nettoyé.
   Ce qui était propre à MyCRM (annuaire, table Image, contacts du compte) devient des rappels.

Chaque lot : reprise du composant, section du catalogue, tests, commit.

**État au 2026-11-06 : les lots 0 à 8 sont faits** (20 composants + l'éditeur riche, 137 tests unitaires, 36 tests navigateur,
CI GitHub Actions). Documentation en ligne : https://ocerou.github.io/TidyInputFields/ (publiée par la CI).
`tidyinputfields/react` livré (TifField, useTif). Rien sur npm pour l'instant (décision d'Olivier).

## À décider

- Publication npm : version (`0.1.0` ou `1.0.0`), compte npm d'Olivier — plus tard.
- Réservation du nom : paquet npm, domaine.
