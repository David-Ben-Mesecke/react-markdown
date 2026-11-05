import { urlAttributes } from 'html-url-attributes';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { defaultUrlTransform } from './default-url-transform.js';
const emptyPlugins = [];
// remark-rehype drops raw HTML by default; AGGI's renderer keeps it so the
// transform stage can decide between rendering text or skipping (skipHtml).
const dangerousHtml = { allowDangerousHtml: true };
/**
 * Build a unified processor that parses markdown into an mdast tree,
 * applying any remark plugins.
 */
export function createRemarkProcessor(options) {
    return applyPlugins(unified().use(remarkParse), options?.remarkPlugins);
}
/**
 * Build a unified processor that converts an existing mdast tree to hast
 * (via remark-rehype) and applies any rehype plugins.
 */
export function createHastProcessor(options) {
    const merged = options?.remarkRehypeOptions
        ? { ...options.remarkRehypeOptions, ...dangerousHtml }
        : dangerousHtml;
    // Cast through `unknown` to sidestep remark-rehype's plugin-generic overloads.
    const withBridge = unified().use(remarkRehype, merged);
    return applyPlugins(withBridge, options?.rehypePlugins);
}
/**
 * Apply a pluggable list onto an existing processor by calling `.use` for each
 * entry (unified accumulates plugins on the same instance). Returns the input.
 */
function applyPlugins(base, list) {
    if (!list || list.length === 0)
        return base;
    const proc = base;
    proc.use(list);
    return base;
}
/**
 * Transform a hast tree in place:
 *
 * - resolve raw HTML nodes (skip or textify depending on `skipHtml`),
 * - sanitize url-bearing properties,
 * - drop / unwrap elements filtered by allowed/disallowed lists and `allowElement`.
 */
export function transformTree(tree, options) {
    const skipHtml = Boolean(options.skipHtml);
    const disallowedElements = options.disallowedElements;
    const unwrapDisallowed = Boolean(options.unwrapDisallowed);
    const allowElement = options.allowElement ?? null;
    const allowedElements = options.allowedElements;
    const urlTransform = options.urlTransform ?? defaultUrlTransform;
    walk(tree);
    function walk(node) {
        if (!Array.isArray(node.children))
            return;
        const children = node.children;
        let index = 0;
        while (index < children.length) {
            const child = children[index];
            // Raw HTML nodes come from `allowDangerousHtml`. Either skip them or
            // render their value as plain text.
            if (child.type === 'raw') {
                const raw = child;
                if (skipHtml) {
                    children.splice(index, 1);
                }
                else {
                    children[index] = {
                        type: 'text',
                        value: String(raw.value ?? '')
                    };
                }
                index += 1;
                continue;
            }
            // Sanitize url-bearing properties on elements.
            if (child.type === 'element') {
                const element = child;
                for (const key of Object.keys(urlAttributes)) {
                    const attribute = urlAttributes[key];
                    const value = element.properties?.[key];
                    if (value !== undefined &&
                        (attribute === null || attribute.includes(element.tagName))) {
                        element.properties[key] = urlTransform(String(value), key, element);
                    }
                }
                // Apply the allow/disallow filter. The element's own container is this
                // node (its children are what we iterate).
                let remove = allowedElements
                    ? !allowedElements.includes(element.tagName)
                    : disallowedElements
                        ? disallowedElements.includes(element.tagName)
                        : false;
                if (!remove && allowElement) {
                    const container = node;
                    remove = Boolean(allowElement(element, index, container)) === false;
                }
                if (remove) {
                    if (unwrapDisallowed && element.children?.length) {
                        children.splice(index, 1, ...element.children);
                    }
                    else {
                        children.splice(index, 1);
                    }
                    continue;
                }
            }
            walk(child);
            index += 1;
        }
    }
}
//# sourceMappingURL=processor.js.map