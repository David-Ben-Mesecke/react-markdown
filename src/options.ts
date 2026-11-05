import type {ReactNode} from 'react'
import type {Observable} from 'rxjs'
import type {PluggableList} from 'unified'
import type {Options as RemarkRehypeOptions} from 'remark-rehype'

import type {
  AllowElement,
  Components,
  UrlTransform
} from './types.js'

/**
 * Configuration accepted by the markdown pipeline and components.
 */
export interface Options {
  /** Filter elements (used after `allowedElements`/`disallowedElements`). */
  allowElement?: AllowElement | null | undefined
  /** Tag names to allow. Cannot be combined with `disallowedElements`. */
  allowedElements?: ReadonlyArray<string> | null | undefined
  /** Markdown source for the static renderers. */
  children?: string | null | undefined
  /** Map tag names to components. */
  components?: Components | null | undefined
  /** Tag names to disallow (default `[]`). Cannot be combined with `allowedElements`. */
  disallowedElements?: ReadonlyArray<string> | null | undefined
  /** Rehype plugins applied after remark-rehype converts the tree to hast. */
  rehypePlugins?: PluggableList | null | undefined
  /** Remark plugins applied while parsing markdown into mdast. */
  remarkPlugins?: PluggableList | null | undefined
  /** Options passed through to `remark-rehype`. */
  remarkRehypeOptions?: Readonly<RemarkRehypeOptions> | null | undefined
  /** Ignore raw HTML in the markdown completely (default `false`). */
  skipHtml?: boolean | undefined
  /** Replace a disallowed element by its children instead of dropping them. */
  unwrapDisallowed?: boolean | undefined
  /** Transform URLs found in url-bearing properties (default `defaultUrlTransform`). */
  urlTransform?: UrlTransform | null | undefined
}

/**
 * Props for the streaming `<Markdown>` component.
 *
 * Extends {@link Options} with a reactive markdown source and rendering knobs.
 */
export interface StreamingProps extends Omit<Options, 'children'> {
  /**
   * Live stream of markdown text. Each emission re-renders the accumulated
   * document (throttled to `frameMs`) so AI chat output appears in real time.
   */
  source$: Observable<string>
  /** Minimum spacing between re-renders while streaming, in ms (default `80`). */
  frameMs?: number | undefined
  /** Rendered while waiting for the first chunk. */
  fallback?: ReactNode | null | undefined
}
