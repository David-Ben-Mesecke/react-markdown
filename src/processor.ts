import type {Element, Nodes} from 'hast'
import {urlAttributes} from 'html-url-attributes'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type {Options as RemarkRehypeOptions} from 'remark-rehype'
import {unified} from 'unified'
import type {PluggableList} from 'unified'

import {defaultUrlTransform} from './default-url-transform.js'
import type {Options} from './options.js'
import type {UrlTransform} from './types.js'

const emptyPlugins: PluggableList = []
// remark-rehype drops raw HTML by default; AGGI's renderer keeps it so the
// transform stage can decide between rendering text or skipping (skipHtml).
const dangerousHtml = {allowDangerousHtml: true} satisfies RemarkRehypeOptions

/**
 * Build a unified processor that parses markdown into an mdast tree,
 * applying any remark plugins.
 */
export function createRemarkProcessor(options?: Options) {
  return applyPlugins(unified().use(remarkParse), options?.remarkPlugins)
}

/**
 * Build a unified processor that converts an existing mdast tree to hast
 * (via remark-rehype) and applies any rehype plugins.
 */
export function createHastProcessor(options?: Options) {
  const merged = options?.remarkRehypeOptions
    ? {...options.remarkRehypeOptions, ...dangerousHtml}
    : dangerousHtml
  // Cast through `unknown` to sidestep remark-rehype's plugin-generic overloads.
  const withBridge = (
    unified() as unknown as {
      use(plugin: never, options?: unknown): ReturnType<typeof unified>
    }
  ).use(remarkRehype as never, merged)

  return applyPlugins(withBridge, options?.rehypePlugins)
}

/**
 * Apply a pluggable list onto an existing processor by calling `.use` for each
 * entry (unified accumulates plugins on the same instance). Returns the input.
 */
function applyPlugins<P>(base: P, list?: PluggableList | null): P {
  if (!list || list.length === 0) return base
  const proc = base as unknown as {use(list: PluggableList): void}
  proc.use(list)
  return base
}

/**
 * Transform a hast tree in place:
 *
 * - resolve raw HTML nodes (skip or textify depending on `skipHtml`),
 * - sanitize url-bearing properties,
 * - drop / unwrap elements filtered by allowed/disallowed lists and `allowElement`.
 */
export function transformTree(tree: Nodes, options: Options): void {
  const skipHtml = Boolean(options.skipHtml)
  const disallowedElements = options.disallowedElements
  const unwrapDisallowed = Boolean(options.unwrapDisallowed)
  const allowElement = options.allowElement ?? null
  const allowedElements = options.allowedElements
  const urlTransform: UrlTransform = options.urlTransform ?? defaultUrlTransform

  walk(tree)

  function walk(node: Nodes): void {
    if (!Array.isArray((node as {children?: unknown}).children)) return

    const children = (node as {children: Nodes[]}).children
    let index = 0

    while (index < children.length) {
      const child = children[index]

      // Raw HTML nodes come from `allowDangerousHtml`. Either skip them or
      // render their value as plain text.
      if ((child as unknown as {type: string}).type === 'raw') {
        const raw = child as unknown as {value?: unknown}
        if (skipHtml) {
          children.splice(index, 1)
        } else {
          children[index] = {
            type: 'text',
            value: String(raw.value ?? '')
          } as Nodes
        }
        index += 1
        continue
      }

      // Sanitize url-bearing properties on elements.
      if ((child as unknown as {type: string}).type === 'element') {
        const element = child as Element

        for (const key of Object.keys(urlAttributes)) {
          const attribute = urlAttributes[key]
          const value = element.properties?.[key]

          if (
            value !== undefined &&
            (attribute === null || attribute.includes(element.tagName))
          ) {
            element.properties![key] = urlTransform(String(value), key, element)
          }
        }

        // Apply the allow/disallow filter. The element's own container is this
        // node (its children are what we iterate).
        let remove: boolean = allowedElements
          ? !allowedElements.includes(element.tagName)
          : disallowedElements
            ? disallowedElements.includes(element.tagName)
            : false

        if (!remove && allowElement) {
          const container = node as import('hast').Parents
          remove = Boolean(allowElement(element, index, container)) === false
        }

        if (remove) {
          if (unwrapDisallowed && element.children?.length) {
            children.splice(index, 1, ...(element.children as Nodes[]))
          } else {
            children.splice(index, 1)
          }
          continue
        }
      }

      walk(child)
      index += 1
    }
  }
}
