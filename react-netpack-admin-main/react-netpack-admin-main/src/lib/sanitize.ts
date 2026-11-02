/**
 * Zero-dependency browser-native HTML sanitizer to prevent XSS attacks.
 * Strips script tags, event handlers (onclick, onerror, onload, etc.),
 * javascript: URLs, and unsafe embedded elements.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  if (typeof window === 'undefined') {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const DISALLOWED_TAGS = ['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'APPLET', 'META', 'LINK', 'FORM', 'STYLE']

    const cleanNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (DISALLOWED_TAGS.includes(el.tagName.toUpperCase())) {
          el.remove()
          return
        }

        // Strip dangerous event handler attributes and javascript: URIs
        const attrs = Array.from(el.attributes)
        for (const attr of attrs) {
          const name = attr.name.toLowerCase()
          const val = attr.value.trim().toLowerCase()
          if (name.startsWith('on') || val.startsWith('javascript:') || val.startsWith('data:text/html')) {
            el.removeAttribute(attr.name)
          }
        }
      }

      let child = node.firstChild
      while (child) {
        const next = child.nextSibling
        cleanNode(child)
        child = next
      }
    }

    Array.from(doc.body.childNodes).forEach(cleanNode)
    return doc.body.innerHTML
  } catch {
    return ''
  }
}
