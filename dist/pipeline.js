import { bufferTime, defer, filter, from, map, of, switchMap } from 'rxjs';
import { VFile } from 'vfile';
import { createHastProcessor, createRemarkProcessor, transformTree } from './processor.js';
import { toJsx } from './to-jsx.js';
/** Turn any accepted markdown source into a virtual file. */
function toVFile(source) {
    if (source instanceof VFile)
        return source;
    const file = new VFile();
    if (typeof source !== 'string') {
        throw new Error(`Unexpected value \`${String(source)}\` for markdown, expected \`string\``);
    }
    file.value = source;
    return file;
}
/**
 * Stage operator: parse markdown text into an mdast tree.
 *
 * Reusable on its own; the composed {@link markdown$} wires it together with
 * the hast + JSX stages.
 */
export function parseMarkdown$(source, options) {
    return defer(() => {
        const file = toVFile(source);
        const processor = createRemarkProcessor(options);
        return from(processor.run(processor.parse(file), file));
    });
}
/**
 * Stage operator: convert an mdast tree into a hast tree (remark-rehype +
 * rehype plugins + the element/URL transform).
 */
export function toHast$(tree, options) {
    return defer(async () => {
        const processor = createHastProcessor(options);
        // remark-rehype converts in place and hands back the hast root; rehype
        // plugins then run on that same tree.
        const hastTree = (await processor.run(tree, new VFile()));
        transformTree(hastTree, options ?? {});
        return hastTree;
    });
}
/**
 * Stage operator: render a hast tree to a React element via the JSX runtime.
 */
export function renderToReact$(tree, options) {
    return of(toJsx(tree, options?.components ?? undefined));
}
/**
 * Render a single markdown source to an observable that emits the rendered
 * element once (supports async remark/rehype plugins).
 */
export function markdown$(source, options) {
    return parseMarkdown$(source, options).pipe(switchMap((tree) => toHast$(tree, options)), switchMap((tree) => renderToReact$(tree, options)));
}
/**
 * Render a live stream of markdown text chunks.
 *
 * Chunks are accumulated and re-rendered as the document grows (batched every
 * `frameMs`) so partial markdown — including syntax split across chunk
 * boundaries — shows up in real time. The last buffered value is always
 * flushed, even when the source completes inside a window.
 */
export function markdownStream$(source$, options, frameMs = 80) {
    let acc = '';
    return source$.pipe(map((chunk) => (acc += chunk)), bufferTime(frameMs), filter((batch) => batch.length > 0), map((batch) => batch[batch.length - 1]), switchMap((text) => markdown$(text, options)));
}
//# sourceMappingURL=pipeline.js.map