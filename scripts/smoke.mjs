import assert from 'node:assert/strict'
import {renderToStaticMarkup} from 'react-dom/server'
import {firstValueFrom, interval, map, of, take} from 'rxjs'

import {markdown$, markdownStream$, defaultUrlTransform} from '../dist/index.js'

// (top-level await below is fine in an .mjs script)

// --- Single-source pipeline ------------------------------------------------
const el = await firstValueFrom(markdown$('# Hi\n\n**bold**'))
const html = renderToStaticMarkup(el)
assert.match(html, /<h1>Hi<\/h1>/, `expected h1, got: ${html}`)
assert.match(html, /<strong>bold<\/strong>/, `expected strong, got: ${html}`)

// --- Streaming: chunks split across boundaries are accumulated ------------
const streamed = await firstValueFrom(
  markdownStream$(of('# ', 'Hello', ' *world*'), undefined, 1)
)
const html2 = renderToStaticMarkup(streamed)
assert.match(
  html2,
  /<h1>Hello <em>world<\/em><\/h1>/,
  `expected streamed heading+emphasis, got: ${html2}`
)

// --- Real-time: progressive re-renders as chunks arrive ----------------------
const rendered = []
markdownStream$(
  interval(5).pipe(
    map((i) => (i === 0 ? '# ' : i.toString())),
    take(4)
  ),
  undefined,
  1
).subscribe({
  next: (el) => rendered.push(el),
  error: () => {}
})
await new Promise((resolve) => setTimeout(resolve, 100))
assert.ok(
  rendered.length >= 2,
  `expected multiple progressive renders over time, got ${rendered.length}`
)

// --- url transform + skipHtml ---------------------------------------------
const safe = await firstValueFrom(markdown$('[x](javascript:alert(1))'))
assert.equal(
  renderToStaticMarkup(safe).match(/href="([^"]*)"/)[1],
  '',
  'unsafe javascript: URL should be stripped'
)
assert.ok(
  defaultUrlTransform('https://dev.aggi.space') === 'https://dev.aggi.space'
)

console.log('smoke ok')
