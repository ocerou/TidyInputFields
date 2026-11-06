// Point d'entrée de la librairie. En module ES : import * as Tif from 'tidyinputfields'. En script classique
// (tidyinputfields.min.js) : l'objet global Tif.
import './styles/index.css'
import { autoInit } from './core/data-api.ts'

export const version = '0.0.0'

export { Component, readOptions, type ComponentClass, type Options } from './core/component.ts'
export { register, componentOf, registeredNames } from './core/registry.ts'
export { init, observe, dispose } from './core/data-api.ts'
export { defineElement, type TifElement } from './core/element.ts'
export { Floating, computePosition, containerFor, type FloatingOptions, type Placement, type CloseReason } from './core/floating.ts'
export { confirm, type ConfirmOptions } from './core/confirm.ts'
export { icon, svgIcon, setIcons, iconNames, type IconName } from './core/icons.ts'
export { h } from './core/dom.ts'
export { t, getLocale, setLocale, setTranslator, addTranslations, onLocaleChange, type Translator, type TranslationParams } from './i18n/i18n.ts'
export * from './components/index.ts'

autoInit()
