import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
/**
 * Render a hast root to React using the automatic JSX runtime.
 */
export function toJsx(tree, components) {
    const options = {
        Fragment,
        ignoreInvalidStyle: true,
        jsx,
        jsxs,
        passKeys: true,
        passNode: true
    };
    if (components) {
        options.components = components;
    }
    return toJsxRuntime(tree, options);
}
//# sourceMappingURL=to-jsx.js.map