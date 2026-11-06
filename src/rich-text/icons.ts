// Icônes de l'éditeur riche : Bootstrap Icons (MIT), au trait, copiées à la construction comme celles de la librairie.
import at from 'bootstrap-icons/icons/at.svg?raw'
import check2Square from 'bootstrap-icons/icons/check2-square.svg?raw'
import chevronDown from 'bootstrap-icons/icons/chevron-down.svg?raw'
import codeSlash from 'bootstrap-icons/icons/code-slash.svg?raw'
import copy from 'bootstrap-icons/icons/copy.svg?raw'
import emojiSmile from 'bootstrap-icons/icons/emoji-smile.svg?raw'
import eraser from 'bootstrap-icons/icons/eraser.svg?raw'
import fonts from 'bootstrap-icons/icons/fonts.svg?raw'
import gripHorizontal from 'bootstrap-icons/icons/grip-horizontal.svg?raw'
import gripVertical from 'bootstrap-icons/icons/grip-vertical.svg?raw'
import hr from 'bootstrap-icons/icons/hr.svg?raw'
import image from 'bootstrap-icons/icons/image.svg?raw'
import link45deg from 'bootstrap-icons/icons/link-45deg.svg?raw'
import listOl from 'bootstrap-icons/icons/list-ol.svg?raw'
import listUl from 'bootstrap-icons/icons/list-ul.svg?raw'
import person from 'bootstrap-icons/icons/person.svg?raw'
import plusLg from 'bootstrap-icons/icons/plus-lg.svg?raw'
import quote from 'bootstrap-icons/icons/quote.svg?raw'
import table from 'bootstrap-icons/icons/table.svg?raw'
import textCenter from 'bootstrap-icons/icons/text-center.svg?raw'
import textLeft from 'bootstrap-icons/icons/text-left.svg?raw'
import textRight from 'bootstrap-icons/icons/text-right.svg?raw'
import trash from 'bootstrap-icons/icons/trash.svg?raw'
import typeBold from 'bootstrap-icons/icons/type-bold.svg?raw'
import typeH1 from 'bootstrap-icons/icons/type-h1.svg?raw'
import typeH2 from 'bootstrap-icons/icons/type-h2.svg?raw'
import typeH3 from 'bootstrap-icons/icons/type-h3.svg?raw'
import typeItalic from 'bootstrap-icons/icons/type-italic.svg?raw'
import typeStrikethrough from 'bootstrap-icons/icons/type-strikethrough.svg?raw'
import typeUnderline from 'bootstrap-icons/icons/type-underline.svg?raw'
import arrowUp from 'bootstrap-icons/icons/arrow-up.svg?raw'
import arrowDown from 'bootstrap-icons/icons/arrow-down.svg?raw'
import arrowLeft from 'bootstrap-icons/icons/arrow-left.svg?raw'
import arrowRight from 'bootstrap-icons/icons/arrow-right.svg?raw'
import { svgIcon } from 'tidyinputfields'

const sources = {
  text: fonts,
  heading1: typeH1,
  heading2: typeH2,
  heading3: typeH3,
  bulletList: listUl,
  orderedList: listOl,
  taskList: check2Square,
  quote,
  code: codeSlash,
  table,
  divider: hr,
  image,
  mention: at,
  emoji: emojiSmile,
  bold: typeBold,
  italic: typeItalic,
  underline: typeUnderline,
  strike: typeStrikethrough,
  link: link45deg,
  clear: eraser,
  alignLeft: textLeft,
  alignCenter: textCenter,
  alignRight: textRight,
  duplicate: copy,
  delete: trash,
  person,
  plus: plusLg,
  grip: gripVertical,
  gripHorizontal,
  chevronDown,
  up: arrowUp,
  down: arrowDown,
  left: arrowLeft,
  right: arrowRight,
}

export type RichIconName = keyof typeof sources

/** Icône de l'éditeur. */
export const richIcon = (name: RichIconName) => svgIcon(sources[name], name)
