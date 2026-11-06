// A small React wrapper for TidyInputFields — copy it into your project.
// It renders the <tif-…> tag, keeps its value in sync and calls onChange with the new value.
// Text, number and boolean props become attributes; arrays, objects and functions (options, source…) go
// through `options`, which is applied with setOptions().
import { createElement, useEffect, useRef, type CSSProperties } from 'react'
import type { Component } from 'tidyinputfields'
import 'tidyinputfields' // declares the <tif-…> tags

type TifTag = HTMLElement & { instance: Component | null; value: unknown }

export type TifFieldProps = {
  /** Component name: 'date', 'search-select', 'sortable-list'… */
  component: string
  /** Controlled value (leave undefined for an uncontrolled field). */
  value?: unknown
  /** Called with the new value after each change made by the user. */
  onChange?: (value: unknown) => void
  /** Options that are not plain text: arrays, objects, functions. */
  options?: Record<string, unknown>
  className?: string
  style?: CSSProperties
  /** Any other attribute: name, required, placeholder, label, input-id… */
  [attribute: string]: unknown
}

export function TifField({ component, value, onChange, options, ...attributes }: TifFieldProps) {
  const ref = useRef<TifTag>(null)
  const latest = useRef(onChange)
  latest.current = onChange

  // Non-text options, applied once the tag has created its component, then on each change.
  useEffect(() => {
    if (options) {
      ref.current?.instance?.setOptions(options)
    }
  }, [options])

  // Controlled value: pushed to the component when it differs.
  useEffect(() => {
    const tag = ref.current
    if (tag && value !== undefined && JSON.stringify(tag.value) !== JSON.stringify(value)) {
      tag.value = value
    }
  }, [value])

  // The native change event bubbles up from the field inside the tag.
  useEffect(() => {
    const tag = ref.current
    if (!tag) {
      return
    }
    const listener = () => latest.current?.(tag.value)
    tag.addEventListener('change', listener)
    return () => tag.removeEventListener('change', listener)
  }, [])

  return createElement(`tif-${component}`, { ref, ...attributes })
}
