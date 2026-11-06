// Pages de la documentation, dans l'ordre du menu.
import type { Page } from '../page.ts'
import { components } from './components.ts'
import { gettingStarted } from './getting-started.ts'
import { utilities } from './utilities.ts'

export const pages: Page[] = [...gettingStarted, ...components, ...utilities]
