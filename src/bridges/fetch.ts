/**
 * Fetch bridge
 *
 * Monkey-patches window.fetch to automatically read the X-Toasts header
 * from every response and render them as toasts.
 */
import { toast, LEVELS } from "../index.js"

interface ToastPayload {
  message?: string;
  title?: string;
  level?: string;
  type?: string;
}

const HEADER = "x-toasts"
const originalFetch = window.fetch.bind(window)

window.fetch = function (...args: Parameters<typeof fetch>): Promise<Response> {
  return originalFetch(...args).then(function (response: Response): Response {
    const raw = response.headers.get(HEADER)
    if (raw) {
      try {
        let items: ToastPayload | ToastPayload[] = JSON.parse(raw)
        if (!Array.isArray(items)) items = [items]
        items.forEach(function (t: ToastPayload) {
          if (!t || (!t.message && !t.title)) return
          const level = LEVELS.has(t.level || t.type || "") ? (t.level || t.type)! : "info"
          const method = toast[level as keyof typeof toast]
          if (typeof method === "function") {
            (method as (msg: string) => number)(t.message || t.title || "")
          }
        })
      } catch {
        // ignore malformed
      }
    }
    return response
  })
}
