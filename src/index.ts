/**
 * Sonner Web Component — A web component port of Sonner.
 *
 * Usage:
 *   <script type="module" src="sonner-web-component.js"></script>
 *   <sonner-toaster position="bottom-right" theme="light"></sonner-toaster>
 *
 * ES module API:
 *   import { toast } from "sonner-web-component"
 *   toast.success("Saved!")
 *
 * window.toast is set by default. Opt out:
 *   <sonner-toaster window="false"></sonner-toaster>
 */

import type { Toast, ToastOptions, PromiseData, ConfigureOptions, ToastFunction } from "./toaster.js";
import { SonnerToaster, LEVELS } from "./toaster.js";
import STYLES from "./styles.css" with { type: "text" };

// created once and shared across all instances via `adoptedStyleSheets`
let sharedSheet: CSSStyleSheet | null = null;

function getSheet(): CSSStyleSheet {
  if (sharedSheet) return sharedSheet;
  sharedSheet = new CSSStyleSheet();
  sharedSheet.replaceSync(STYLES);
  return sharedSheet;
}
class SonnerToasterElement extends HTMLElement {
  static observedAttributes = [
    "position",
    "theme",
    "rich-colors",
    "expand",
    "close-button",
    "invert",
    "duration",
    "gap",
    "visible-toasts",
    "offset",
    "mobile-offset",
    "dir",
    "container-aria-label",
    "flush-delay",
    "burst-window",
    "burst-linger",
    "window",
  ];

  #toaster: SonnerToaster | null = null;
  #abortController: AbortController | null = null;
  #connected: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (this.#connected) return;
    this.#connected = true;

    this.shadowRoot!.adoptedStyleSheets = [getSheet()];

    this.#toaster = new SonnerToaster(
      this.shadowRoot!,
      SonnerToasterElement.observedAttributes,
      (name) => this.getAttribute(name),
    );

    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    document.addEventListener(
      "visibilitychange",
      () => this.#toaster!.handleVisibilityChange(document.hidden),
      { signal },
    );

    document.addEventListener(
      "keydown",
      (e) => this.#toaster!.handleKeydown(e, this.shadowRoot!.activeElement),
      { signal },
    );

    if (this.#toaster!.usesSystemTheme && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener(
        "change",
        (e) => this.#toaster!.handleThemeChange(e.matches),
        { signal },
      );
    }

    const TRIGGER_TYPES = ["success", "info", "warning", "error", "message"] as const;
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target as Element | null;
        if (!target) return;
        for (const type of TRIGGER_TYPES) {
          const attr = `data-toast-${type}`;
          const trigger = target.closest(`[${attr}]`);
          if (!trigger) continue;
          const msg = trigger.getAttribute(attr) || "";
          const description = trigger.getAttribute("data-toast-description");
          const opts: ToastOptions | undefined = description ? { description } : undefined;
          if (type === "message") {
            toast(msg, opts);
          } else {
            toast[type](msg, opts);
          }
          break;
        }
      },
      { signal },
    );

    if (!SonnerToasterElement.instance) {
      SonnerToasterElement.instance = this;
    }

    if (this.getAttribute("window") !== "false") {
      window.toast = toast as ToastFunction;
    }

    // Consume <sonner-toast> children after the page settles visually.
    const delay = this.#toaster!.flushDelay;
    window.addEventListener(
      "load",
      () => setTimeout(() => this.#flushChildMessages(), delay),
      { once: true, signal },
    );
  }

  disconnectedCallback() {
    this.#connected = false;
    this.#toaster?.destroy();
    this.#toaster = null;
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
    if (SonnerToasterElement.instance === this) {
      SonnerToasterElement.instance = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    // "window" attribute is handled by the element, not the toaster
    if (name === "window") {
      if (newValue === "false") {
        if (window.toast === (toast as unknown)) delete (window as Partial<Window>).toast;
      } else {
        window.toast = toast as ToastFunction;
      }
      return;
    }

    if (!this.#toaster) return;
    this.#toaster.applyAttribute(name, newValue);
    if (this.#connected) {
      this.#toaster.handleAttributeChange();
    }
  }

  static instance: SonnerToasterElement | null = null;

  reset(): void {
    this.#toaster?.reset();
  }

  configure(opts: ConfigureOptions): void {
    if (!opts || !this.#toaster) return;
    this.#toaster.configure(opts);
    // Reflect config back to attributes
    if (opts.position !== undefined) this.setAttribute("position", opts.position);
    if (opts.theme !== undefined) this.setAttribute("theme", opts.theme);
    if (opts.richColors !== undefined) this.toggleAttribute("rich-colors", opts.richColors);
    if (opts.expand !== undefined) this.toggleAttribute("expand", opts.expand);
    if (opts.closeButton !== undefined) this.toggleAttribute("close-button", opts.closeButton);
    if (opts.duration !== undefined) this.setAttribute("duration", String(opts.duration));
    if (opts.gap !== undefined) this.setAttribute("gap", String(opts.gap));
    if (opts.visibleToasts !== undefined) this.setAttribute("visible-toasts", String(opts.visibleToasts));
    if (opts.offset !== undefined) this.setAttribute("offset", typeof opts.offset === "object" ? JSON.stringify(opts.offset) : String(opts.offset));
  }

  getToasts(): Toast[] {
    return this.#toaster?.getToasts() ?? [];
  }

  add(level: string, message: string | ToastOptions, options?: ToastOptions): number {
    return this.#toaster!.add(level as Parameters<SonnerToaster["add"]>[0], message, options);
  }

  dismiss(id?: number | null): number | undefined | null {
    return this.#toaster!.dismiss(id);
  }

  promise<T>(promise: Promise<T> | (() => Promise<T>), data: PromiseData<T>): number | undefined {
    return this.#toaster!.promise(promise, data);
  }

  #flushChildMessages(): void {
    const children = this.querySelectorAll("sonner-toast");
    if (children.length === 0) return;
    this.#toaster?.flushChildToasts(children);
  }
}

// <sonner-toast> is a data carrier consumed by <sonner-toaster>.
// It never renders anything itself.
class SonnerToastElement extends HTMLElement {
  connectedCallback() {
    this.style.display = "none";
  }
}

customElements.define("sonner-toaster", SonnerToasterElement);
customElements.define("sonner-toast", SonnerToastElement);

function getDefault(): SonnerToasterElement {
  if (SonnerToasterElement.instance) return SonnerToasterElement.instance;
  const el = document.createElement("sonner-toaster");
  document.body.appendChild(el);
  return SonnerToasterElement.instance!;
}

function toast(msg: string | ToastOptions, data?: ToastOptions): number {
  return getDefault().add("", msg, data);
}
toast.message = (msg: string, data?: ToastOptions): number => getDefault().add("", msg, data);
toast.success = (msg: string, data?: ToastOptions): number => getDefault().add("success", msg, data);
toast.info = (msg: string, data?: ToastOptions): number => getDefault().add("info", msg, data);
toast.warning = (msg: string, data?: ToastOptions): number => getDefault().add("warning", msg, data);
toast.error = (msg: string, data?: ToastOptions): number => getDefault().add("error", msg, data);
toast.loading = (msg: string, data?: ToastOptions): number => getDefault().add("loading", msg, data);
toast.promise = <T>(p: Promise<T> | (() => Promise<T>), data: PromiseData<T>): number | undefined => getDefault().promise(p, data);
toast.dismiss = (id?: number): number | undefined | null => getDefault().dismiss(id);
toast.configure = (opts: ConfigureOptions): void => getDefault().configure(opts);
toast.reset = (): void => getDefault().reset();
toast.destroy = (): void => {
  const el = SonnerToasterElement.instance;
  if (el?.parentNode) el.parentNode.removeChild(el);
};
toast.getToasts = (): Toast[] => getDefault().getToasts();

export { toast, LEVELS };
export type { Toast, ToastOptions, PromiseData, ConfigureOptions, ToastFunction };
export default toast;
