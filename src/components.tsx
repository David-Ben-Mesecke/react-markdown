import {Suspense, use, useMemo} from 'react'
import type {ReactNode} from 'react'
import {useObservablePromise} from 'react-rx'

import type {Options, StreamingProps} from './options.js'
import {markdownStream$} from './pipeline.js'

/**
 * Render a live stream of AI chat output as real-time markdown.
 *
 * `source$` is an observable that emits text chunks (typically token-by-token).
 * Chunks are accumulated and re-rendered at most every `frameMs`, so the
 * document grows in place without reparsing on every keystroke. Rendering uses
 * react-rx's Suspense protocol: the first chunk may briefly suspend through
 * {@link StreamingProps.fallback}, then later chunks update synchronously
 * without re-suspending.
 */
export function Markdown(props: StreamingProps): ReactNode {
  const {source$, frameMs, fallback = null, ...options} = props

  // react-rx caches its settled promise per observable identity, so the stream
  // must stay stable across renders. Key it on a serialized signature of the
  // (rarely-changing) options rather than their object reference.
  const signature = useMemo(() => JSON.stringify(options), [options])

  const element$ = useMemo(
    () => markdownStream$(source$, options, frameMs),
    [source$, options, frameMs] // eslint-disable-line react-hooks/exhaustive-deps
  )

  void signature

  // The hook subscribes at commit (this component stays mounted). Its promise
  // is read by the child via `use()`, with a Suspense boundary in between.
  const data = useObservablePromise(element$)

  return (
    <Suspense fallback={fallback}>
      <ResolvedMarkdown data={data} />
    </Suspense>
  )
}

/**
 * Thin child that reads the react-rx promise with React's `use()`. Kept in its
 * own component so a Suspense boundary separates it from the hook.
 */
function ResolvedMarkdown({data}: {data: Promise<ReactNode>}): ReactNode {
  const element = use(data)
  return element ?? null
}

// Re-exported for convenience so consumers can type their own stream options.
export type {Options}
