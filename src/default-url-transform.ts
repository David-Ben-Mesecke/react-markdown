import type {UrlTransform} from './types.js'

// Same as <https://github.com/micromark/micromark/blob/main/packages/micromark-util-sanitize-uri/dev/index.js#L34>,
// but without the `encode` part.
const safeProtocol = /^(?:https?|ircs?|mailto|xmpp)$/i

/**
 * Make a URL safe, following how GitHub works: allows `http`, `https`,
 * `irc(s)`, `mailto`, `xmpp` and protocol-relative (`/...`) URLs.
 */
export const defaultUrlTransform: UrlTransform = (value) => {
  const colon = value.indexOf(':')
  const questionMark = value.indexOf('?')
  const numberSign = value.indexOf('#')
  const slash = value.indexOf('/')

  if (
    // If there is no protocol, it's relative.
    colon === -1 ||
    // If the first colon is after a `?`, `#`, or `/`, it's not a protocol.
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    // It is a protocol, and it should be allowed.
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value
  }

  return ''
}
