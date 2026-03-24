export type ToastType = "success" | "info" | "warning" | "error" | "loading" | "";

export type Position = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export type SwipeDirection = "up" | "down" | "left" | "right";

export interface ToastAction {
  label: string;
  onClick: (e: MouseEvent) => void;
}

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  description: string;
  html: string;
  duration: number;
  dismissible: boolean;
  promise: boolean | null;
  action: ToastAction | null;
  cancel: ToastAction | null;
}

export interface ToastOptions {
  id?: number;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  richColors?: boolean;
  closeButton?: boolean;
  position?: Position;
  html?: string;
  action?: ToastAction;
  cancel?: ToastAction;
  invert?: boolean;
  onDismiss?: (toast: Toast) => void;
  onAutoClose?: (toast: Toast) => void;
  title?: string;
  message?: string;
}

export interface ToastData extends ToastOptions {
  type?: ToastType;
  promise?: boolean;
}

export const TIME_BEFORE_UNMOUNT = 200;

const SWIPE_THRESHOLD = 45;

const ICONS: Record<string, string> = {
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>',
  error:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>',
  debug:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/></svg>',
};

const CLOSE_ICON: string =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

const LOADER_HTML: string = (() => {
  let bars = "";
  for (let i = 0; i < 12; i++) {
    bars += `<div class="sonner-loading-bar" style="animation-delay:${-1.2 + i * 0.1}s;transform:rotate(${i * 30}deg) translate(146%)"></div>`;
  }
  return `<div class="sonner-loading-wrapper"><div class="sonner-spinner">${bars}</div></div>`;
})();

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

export interface SonnerToastInit {
  id: number;
  groupKey: string;
  type: ToastType;
  title: string;
  description: string;
  html: string;
  duration: number;
  dismissible: boolean;
  richColors: boolean;
  closeButton: boolean;
  expand: boolean;
  invert: boolean;
  action: ToastAction | null;
  cancel: ToastAction | null;
  promise: boolean | null;
  onDismiss: ((toast: Toast) => void) | null;
  onAutoClose: ((toast: Toast) => void) | null;
  onRemove: (id: number) => void;
  getAllowedSwipeDirections: () => string[];
}

export class SonnerToast {
  readonly id: number;
  readonly el: HTMLLIElement;
  readonly groupKey: string;

  type: ToastType;
  title: string;
  description: string;
  html: string;
  duration: number;
  dismissible: boolean;
  initialHeight: number = 0;
  offsetBeforeRemove: number = 0;

  #remainingTime: number;
  #closeTimerStart: number = 0;
  #timeout: ReturnType<typeof setTimeout> | null = null;
  #promise: boolean | null;
  #onDismiss: ((toast: Toast) => void) | null;
  #onAutoClose: ((toast: Toast) => void) | null;
  #onRemove: (id: number) => void;
  #getAllowedSwipeDirections: () => string[];
  #action: ToastAction | null;
  #cancel: ToastAction | null;

  constructor(init: SonnerToastInit) {
    this.id = init.id;
    this.groupKey = init.groupKey;
    this.type = init.type;
    this.title = init.title;
    this.description = init.description;
    this.html = init.html;
    this.duration = init.duration;
    this.dismissible = init.dismissible;
    this.#remainingTime = init.duration;
    this.#promise = init.promise;
    this.#onDismiss = init.onDismiss;
    this.#onAutoClose = init.onAutoClose;
    this.#onRemove = init.onRemove;
    this.#getAllowedSwipeDirections = init.getAllowedSwipeDirections;
    this.#action = init.action;
    this.#cancel = init.cancel;

    this.el = this.#buildElement(init);
    this.#attachEventHandlers(init);
    this.#attachSwipeHandlers();
  }

  get isRemoving(): boolean {
    return this.el.getAttribute("data-state") === "removing";
  }

  toPublic(): Toast {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      html: this.html,
      duration: this.duration,
      dismissible: this.dismissible,
      promise: this.#promise,
      action: this.#action,
      cancel: this.#cancel,
    };
  }

  mount(): void {
    this.el.setAttribute("data-state", "mounted");
  }

  measureHeight(): number {
    const height = this.el.getBoundingClientRect().height;
    this.initialHeight = height;
    return height;
  }

  dismiss(): void {
    this.#onDismiss?.(this.toPublic());
    this.#onRemove(this.id);
  }

  updateLayout(index: number, offset: number, visible: boolean, expanded: boolean, totalInGroup: number): void {
    const el = this.el;
    el.setAttribute("data-visible", String(visible));
    el.setAttribute("data-expanded", String(expanded));
    el.setAttribute("data-index", String(index));
    el.style.setProperty("--index", String(index));
    el.style.setProperty("--toasts-before", String(index));
    el.style.setProperty("--z-index", String(totalInGroup - index));
    el.style.setProperty("--offset", `${offset}px`);
    el.style.setProperty("--initial-height", expanded ? "auto" : `${this.initialHeight}px`);
  }

  startTimer(): void {
    if (this.type === "loading" || this.duration === Infinity) return;
    if (this.#closeTimerStart && this.#timeout) return;
    if (this.#remainingTime <= 0) {
      this.#remainingTime = this.duration;
    }
    if (this.#timeout) clearTimeout(this.#timeout);
    this.#closeTimerStart = Date.now();
    this.#timeout = setTimeout(() => {
      this.#onAutoClose?.(this.toPublic());
      this.#onRemove(this.id);
    }, this.#remainingTime);
  }

  pauseTimer(): void {
    if (!this.#closeTimerStart) return;
    if (this.#timeout) clearTimeout(this.#timeout);
    this.#timeout = null;
    const elapsed = Date.now() - this.#closeTimerStart;
    this.#remainingTime = Math.max(0, this.#remainingTime - elapsed);
    this.#closeTimerStart = 0;
  }

  clearTimer(): void {
    if (this.#timeout) clearTimeout(this.#timeout);
    this.#timeout = null;
    this.#closeTimerStart = 0;
  }

  resetTimer(fallbackDuration: number): void {
    if (this.type === "loading" || this.duration === Infinity) return;
    this.#remainingTime = this.duration || fallbackDuration;
  }

  beginRemoval(offset: number): void {
    this.offsetBeforeRemove = offset;
    this.el.setAttribute("data-state", "removing");
    this.el.style.setProperty("--offset", `${offset}px`);
    this.clearTimer();
  }

  remove(): void {
    this.el.remove();
  }

  update(data: ToastData, defaultDuration: number): void {
    if (data.type !== undefined) this.type = data.type;
    if (data.title !== undefined || data.message !== undefined) {
      this.title = data.title || data.message || "";
    }
    if (data.description !== undefined) this.description = data.description;
    if (data.html !== undefined) this.html = data.html;
    if (data.duration !== undefined) {
      this.duration = data.duration;
      this.#remainingTime = data.duration;
    }

    const el = this.el;
    if (this.type) el.setAttribute("data-type", this.type);
    if (data.promise !== undefined) {
      this.#promise = data.promise || null;
      el.setAttribute("data-promise", String(!!data.promise));
    }

    const iconEl = el.querySelector("[data-slot='icon']");
    if (iconEl) {
      iconEl.innerHTML =
        this.type === "loading" ? LOADER_HTML : (ICONS[this.type] || "");
    }

    if (data.html !== undefined) {
      const contentEl = el.querySelector("[data-slot='content']");
      if (contentEl) {
        contentEl.innerHTML = data.html;
      } else {
        el.querySelector("[data-slot='title']")?.remove();
        el.querySelector("[data-slot='description']")?.remove();
        const newContent = document.createElement("div");
        newContent.setAttribute("data-slot", "content");
        newContent.innerHTML = data.html;
        const icon = el.querySelector("[data-slot='icon']");
        if (icon) {
          icon.after(newContent);
        } else {
          el.prepend(newContent);
        }
      }
    } else {
      const titleEl = el.querySelector("[data-slot='title']");
      if (titleEl) titleEl.textContent = this.title;

      const descEl = el.querySelector("[data-slot='description']");
      if (this.description && !descEl) {
        const titleEl2 = el.querySelector("[data-slot='title']");
        if (titleEl2) {
          const newDesc = document.createElement("div");
          newDesc.setAttribute("data-slot", "description");
          newDesc.textContent = this.description;
          titleEl2.after(newDesc);
        }
      } else if (descEl) {
        descEl.textContent = this.description || "";
      }
    }

    this.measureHeight();

    if (this.type !== "loading") {
      if (this.duration === Infinity) {
        this.duration = defaultDuration;
      }
      this.clearTimer();
      this.#remainingTime = this.duration || defaultDuration;
    }
  }

  #buildElement(init: SonnerToastInit): HTMLLIElement {
    const el = document.createElement("li");
    el.setAttribute("tabindex", "0");
    el.setAttribute("data-sonner-toast", "");
    el.setAttribute("data-type", init.type);
    el.setAttribute("data-state", "mounting");
    el.setAttribute("data-visible", "true");
    el.setAttribute("data-index", "0");
    el.setAttribute("data-swipe", "idle");
    el.setAttribute("data-dismissible", String(init.dismissible));
    el.setAttribute("data-expanded", String(init.expand));
    el.setAttribute("data-rich-colors", String(init.richColors));
    el.setAttribute("data-promise", String(!!init.promise));
    el.setAttribute("data-invert", String(!!init.invert));

    let markup = "";

    if (init.closeButton && init.type !== "loading") {
      markup += `<button aria-label="Close toast" data-slot="close">${CLOSE_ICON}</button>`;
    }

    const iconHtml =
      init.type === "loading" ? LOADER_HTML : (ICONS[init.type] || "");
    if (iconHtml) markup += `<div data-slot="icon">${iconHtml}</div>`;

    if (init.html) {
      markup += '<div data-slot="content"></div>';
    } else {
      markup += '<div data-slot="title"></div>';
      if (init.description) markup += '<div data-slot="description"></div>';
    }

    if (init.cancel?.label || init.action?.label) {
      markup += '<div data-slot="buttons">';
      if (init.cancel?.label)
        markup += `<button data-button="cancel">${escapeHtml(init.cancel.label)}</button>`;
      if (init.action?.label)
        markup += `<button data-button="action">${escapeHtml(init.action.label)}</button>`;
      markup += '</div>';
    }

    el.innerHTML = markup;

    if (init.html) {
      const contentEl = el.querySelector("[data-slot='content']");
      if (contentEl) contentEl.innerHTML = init.html;
    } else {
      const titleEl = el.querySelector("[data-slot='title']");
      if (titleEl) titleEl.textContent = init.title;

      const descEl = el.querySelector("[data-slot='description']");
      if (descEl) descEl.textContent = init.description;
    }

    return el;
  }

  #attachEventHandlers(init: SonnerToastInit): void {
    if (init.closeButton) {
      this.el.querySelector("[data-slot='close']")?.addEventListener("click", () => {
        if (this.dismissible) {
          this.dismiss();
        }
      });
    }
    if (init.cancel?.onClick) {
      const cancel = init.cancel;
      this.el.querySelector("[data-button='cancel']")?.addEventListener("click", (e) => {
        if (!this.dismissible) return;
        cancel.onClick(e as MouseEvent);
        this.#onRemove(this.id);
      });
    }
    if (init.action?.onClick) {
      const action = init.action;
      this.el.querySelector("[data-button='action']")?.addEventListener("click", (e) => {
        action.onClick(e as MouseEvent);
        if (!e.defaultPrevented) this.#onRemove(this.id);
      });
    }
  }

  #attachSwipeHandlers(): void {
    const el = this.el;
    const swipe = {
      direction: null as "x" | "y" | null,
      startX: 0,
      startY: 0,
      startTime: null as Date | null,
    };

    el.addEventListener("pointerdown", (e) => {
      if (e.button === 2 || this.type === "loading" || !this.dismissible) return;
      swipe.startTime = new Date();
      swipe.direction = null;
      const target = e.target as HTMLElement;
      target.setPointerCapture(e.pointerId);
      if (target.tagName === "BUTTON") return;
      el.setAttribute("data-swipe", "active");
      swipe.startX = e.clientX;
      swipe.startY = e.clientY;
    });

    el.addEventListener("pointermove", (e) => {
      if (!swipe.startTime || !this.dismissible) return;
      if ((window.getSelection?.()?.toString().length ?? 0) > 0) return;

      const xDelta = e.clientX - swipe.startX;
      const yDelta = e.clientY - swipe.startY;
      const allowed = this.#getAllowedSwipeDirections();

      if (
        !swipe.direction &&
        (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)
      ) {
        swipe.direction =
          Math.abs(xDelta) > Math.abs(yDelta) ? "x" : "y";
      }

      const amount = { x: 0, y: 0 };
      const dampen = (delta: number): number => 1 / (1.5 + Math.abs(delta) / 20);

      if (swipe.direction === "y") {
        if (
          allowed.includes("top") ||
          allowed.includes("bottom")
        ) {
          if (
            (allowed.includes("top") && yDelta < 0) ||
            (allowed.includes("bottom") && yDelta > 0)
          ) {
            amount.y = yDelta;
          } else {
            const d = yDelta * dampen(yDelta);
            amount.y = Math.abs(d) < Math.abs(yDelta) ? d : yDelta;
          }
        }
      } else if (swipe.direction === "x") {
        if (
          allowed.includes("left") ||
          allowed.includes("right")
        ) {
          if (
            (allowed.includes("left") && xDelta < 0) ||
            (allowed.includes("right") && xDelta > 0)
          ) {
            amount.x = xDelta;
          } else {
            const d = xDelta * dampen(xDelta);
            amount.x = Math.abs(d) < Math.abs(xDelta) ? d : xDelta;
          }
        }
      }

      el.style.setProperty("--swipe-amount-x", `${amount.x}px`);
      el.style.setProperty("--swipe-amount-y", `${amount.y}px`);
    });

    el.addEventListener("pointerup", () => {
      if (!swipe.startTime || !this.dismissible) return;

      const amtX =
        parseFloat(el.style.getPropertyValue("--swipe-amount-x")) || 0;
      const amtY =
        parseFloat(el.style.getPropertyValue("--swipe-amount-y")) || 0;
      const elapsed = Date.now() - swipe.startTime.getTime();
      const amount = swipe.direction === "x" ? amtX : amtY;
      const velocity = Math.abs(amount) / elapsed;

      if (Math.abs(amount) >= SWIPE_THRESHOLD || velocity > 0.11) {
        const outDirection: SwipeDirection =
          swipe.direction === "x"
            ? amtX > 0
              ? "right"
              : "left"
            : amtY > 0
              ? "down"
              : "up";
        el.setAttribute("data-swipe", "committed");
        el.setAttribute("data-swipe-direction", outDirection);
        this.dismiss();
        return;
      }

      el.style.setProperty("--swipe-amount-x", "0px");
      el.style.setProperty("--swipe-amount-y", "0px");
      el.setAttribute("data-swipe", "idle");
      swipe.direction = null;
      swipe.startTime = null;
    });

    el.addEventListener("dragend", () => {
      el.setAttribute("data-swipe", "idle");
      swipe.direction = null;
      swipe.startTime = null;
    });
  }
}
