/**
 * htmx bridge
 *
 * Listens for the "toast" event dispatched by htmx from the HX-Trigger
 * header and renders them as toasts.
 */
import { toast, LEVELS } from "../index.js"

interface ToastPayload {
  message?: string;
  title?: string;
  level?: string;
  type?: string;
}

interface ToastDetail {
  value?: ToastPayload | ToastPayload[];
}

document.body.addEventListener('toast', function (e: Event) {
  const ce = e as CustomEvent<ToastDetail | ToastPayload | ToastPayload[]>
  const detail = ce.detail
  const d = detail && typeof detail === "object" && "value" in detail ? detail.value : detail
  if (!d) return
  const items: ToastPayload[] = Array.isArray(d) ? d : [d as ToastPayload]
  items.forEach(function (t: ToastPayload) {
    if (!t || (!t.message && !t.title)) return
    const level = LEVELS.has(t.level || t.type || "") ? (t.level || t.type)! : "info"
    const method = toast[level as keyof typeof toast]
    if (typeof method === "function") {
      (method as (msg: string) => number)(t.message || t.title || "")
    }
  })
})
