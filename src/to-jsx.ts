import type {Root} from 'hast'
import {toJsxRuntime, type Options as ToJsxOptions} from 'hast-util-to-jsx-runtime'
import {Fragment, jsx, jsxs} from 'react/jsx-runtime'

import type {Components} from './types.js'

/**
 * Render a hast root to React using the automatic JSX runtime.
 */
export function toJsx(tree: Root, components?: Components | null): unknown {
  const options: ToJsxOptions = {
    Fragment,
    ignoreInvalidStyle: true,
    jsx,
    jsxs,
    passKeys: true,
    passNode: true
  }

  if (components) {
    options.components = components as never
  }

  return toJsxRuntime(tree, options)
}
