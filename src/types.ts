import type {ComponentType} from 'react'

/**
 * Element passed as the `node` field when rendering with custom components.
 */
export interface ExtraProps {
  node?: import('hast').Element | undefined
}

type IntrinsicElements = import('react').JSX.IntrinsicElements

/**
 * Map tag names to React components (or intrinsic element names) used during
 * rendering. Keys and props are checked against React's intrinsic elements.
 */
export type Components = {
  [Key in keyof IntrinsicElements]?:
    ComponentType<IntrinsicElements[Key] & ExtraProps> | keyof IntrinsicElements
}

/**
 * Callback filtering elements. Returning `false` (or nothing) removes the element.
 */
export type AllowElement = (
  element: import('hast').Element,
  index: number,
  parent: import('hast').Parents | undefined
) => boolean | null | undefined

/**
 * Transform every URL found in url-bearing properties. Return `''` to strip it.
 */
export type UrlTransform = (
  url: string,
  key: string,
  node: import('hast').Element
) => string | null | undefined
