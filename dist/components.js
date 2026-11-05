import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense, use, useMemo } from 'react';
import { useObservablePromise } from 'react-rx';
import { markdownStream$ } from './pipeline.js';
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
export function Markdown(props) {
    const { source$, frameMs, fallback = null, ...options } = props;
    // react-rx caches its settled promise per observable identity, so the stream
    // must stay stable across renders. Key it on a serialized signature of the
    // (rarely-changing) options rather than their object reference.
    const signature = useMemo(() => JSON.stringify(options), [options]);
    const element$ = useMemo(() => markdownStream$(source$, options, frameMs), [source$, options, frameMs] // eslint-disable-line react-hooks/exhaustive-deps
    );
    void signature;
    // The hook subscribes at commit (this component stays mounted). Its promise
    // is read by the child via `use()`, with a Suspense boundary in between.
    const data = useObservablePromise(element$);
    return (_jsx(Suspense, { fallback: fallback, children: _jsx(ResolvedMarkdown, { data: data }) }));
}
/**
 * Thin child that reads the react-rx promise with React's `use()`. Kept in its
 * own component so a Suspense boundary separates it from the hook.
 */
function ResolvedMarkdown({ data }) {
    const element = use(data);
    return element ?? null;
}
//# sourceMappingURL=components.js.map