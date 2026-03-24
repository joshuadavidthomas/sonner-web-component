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

export interface ToastOptions extends Partial<Omit<Toast, "type" | "promise">> {
  richColors?: boolean;
  closeButton?: boolean;
  position?: Position;
  invert?: boolean;
  onDismiss?: (toast: Toast) => void;
  onAutoClose?: (toast: Toast) => void;
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

function createLoader(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "sonner-loading-wrapper";
  const spinner = document.createElement("div");
  spinner.className = "sonner-spinner";
  for (let i = 0; i < 12; i++) {
    const bar = document.createElement("div");
    bar.className = "sonner-loading-bar";
    bar.style.animationDelay = `${-1.2 + i * 0.1}s`;
    bar.style.transform = `rotate(${i * 30}deg) translate(146%)`;
    spinner.appendChild(bar);
  }
  wrapper.appendChild(spinner);
  return wrapper;
}

const SPINNER_BARS = 12;
const SPINNER_OPACITIES = Array.from({ length: SPINNER_BARS }, (_, i) =>
  (1 - (i / SPINNER_BARS) * 0.85).toFixed(2),
);

function createSvgLoader(): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.className = "sonner-loading-wrapper";
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.classList.add("sonner-svg-spinner");
  for (let i = 0; i < SPINNER_BARS; i++) {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", "12");
    line.setAttribute("y1", "2");
    line.setAttribute("x2", "12");
    line.setAttribute("y2", "6.5");
    line.setAttribute("stroke", "currentColor");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("opacity", SPINNER_OPACITIES[i]);
    line.setAttribute("transform", `rotate(${i * 30} 12 12)`);
    svg.appendChild(line);
  }
  wrapper.appendChild(svg);
  return wrapper;
}

export interface SonnerToastInit extends Toast {
  groupKey: string;
  richColors: boolean;
  closeButton: boolean;
  expand: boolean;
  invert: boolean;
  onDismiss: ((toast: Toast) => void) | null;
  onAutoClose: ((toast: Toast) => void) | null;
  onRemove: (id: number) => void;
  getAllowedSwipeDirections: () => string[];
}

export class SonnerToast implements Toast {
  readonly id: number;
  readonly el: HTMLLIElement;
  readonly groupKey: string;

  type: ToastType;
  title: string;
  description: string;
  html: string;
  duration: number;
  dismissible: boolean;
  promise: boolean | null;
  action: ToastAction | null;
  cancel: ToastAction | null;
  initialHeight: number = 0;
  offsetBeforeRemove: number = 0;

  #remainingTime: number;
  #closeTimerStart: number = 0;
  #timeout: ReturnType<typeof setTimeout> | null = null;
  #onDismiss: ((toast: Toast) => void) | null;
  #onAutoClose: ((toast: Toast) => void) | null;
  #onRemove: (id: number) => void;
  #getAllowedSwipeDirections: () => string[];

  #iconEl: HTMLDivElement | null = null;
  #titleEl: HTMLDivElement | null = null;
  #descEl: HTMLDivElement | null = null;
  #contentEl: HTMLDivElement | null = null;

  constructor(init: SonnerToastInit) {
    this.id = init.id;
    this.groupKey = init.groupKey;
    this.type = init.type;
    this.title = init.title;
    this.description = init.description;
    this.html = init.html;
    this.duration = init.duration;
    this.dismissible = init.dismissible;
    this.promise = init.promise;
    this.action = init.action;
    this.cancel = init.cancel;
    this.#remainingTime = init.duration;
    this.#onDismiss = init.onDismiss;
    this.#onAutoClose = init.onAutoClose;
    this.#onRemove = init.onRemove;
    this.#getAllowedSwipeDirections = init.getAllowedSwipeDirections;

    this.el = document.createElement("li");
    this.el.tabIndex = 0;
    this.el.dataset.sonnerToast = "";
    this.el.dataset.type = init.type;
    this.el.dataset.state = "mounting";
    this.el.dataset.visible = "true";
    this.el.dataset.index = "0";
    this.el.dataset.swipe = "idle";
    this.el.dataset.dismissible = String(init.dismissible);
    this.el.dataset.expanded = String(init.expand);
    this.el.dataset.richColors = String(init.richColors);
    this.el.dataset.promise = String(!!init.promise);
    this.el.dataset.invert = String(!!init.invert);

    if (init.closeButton && init.type !== "loading") {
      this.#addCloseButton();
    }

    this.#addIcon(init.type);

    if (init.html) {
      this.#addContent(init.html);
    } else {
      this.#addTitle(init.title);
      if (init.description) this.#addDescription(init.description);
    }

    if (init.cancel?.label || init.action?.label) {
      this.#addButtons(init.cancel, init.action);
    }

    this.#attachSwipeHandlers();
  }

  get isRemoving(): boolean {
    return this.el.dataset.state === "removing";
  }

  mount(): void {
    this.el.dataset.state = "mounted";
  }

  measureHeight(): number {
    const height = this.el.getBoundingClientRect().height;
    this.initialHeight = height;
    return height;
  }

  dismiss(): void {
    this.#onDismiss?.(this);
    this.#onRemove(this.id);
  }

  updateLayout(index: number, offset: number, visible: boolean, expanded: boolean, totalInGroup: number): void {
    const el = this.el;
    el.dataset.visible = String(visible);
    el.dataset.expanded = String(expanded);
    el.dataset.index = String(index);
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
      this.#onAutoClose?.(this);
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
    this.el.dataset.state = "removing";
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

    if (this.type) this.el.dataset.type = this.type;
    if (data.promise !== undefined) {
      this.promise = data.promise || null;
      this.el.dataset.promise = String(!!data.promise);
    }

    if (this.#iconEl) {
      if (this.type === "loading") {
        this.#iconEl.replaceChildren(createSvgLoader());
      } else {
        this.#iconEl.innerHTML = ICONS[this.type] || "";
      }
    }

    if (data.html !== undefined) {
      if (this.#contentEl) {
        this.#contentEl.innerHTML = data.html;
      } else {
        this.#titleEl?.remove();
        this.#titleEl = null;
        this.#descEl?.remove();
        this.#descEl = null;
        const div = document.createElement("div");
        div.dataset.slot = "content";
        div.innerHTML = data.html;
        this.#contentEl = div;
        if (this.#iconEl) {
          this.#iconEl.after(div);
        } else {
          this.el.prepend(div);
        }
      }
    } else {
      if (this.#titleEl) this.#titleEl.textContent = this.title;

      if (this.description && !this.#descEl && this.#titleEl) {
        const div = document.createElement("div");
        div.dataset.slot = "description";
        div.textContent = this.description;
        this.#descEl = div;
        this.#titleEl.after(div);
      } else if (this.#descEl) {
        this.#descEl.textContent = this.description || "";
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

  #addCloseButton(): void {
    const btn = document.createElement("button");
    btn.ariaLabel = "Close toast";
    btn.dataset.slot = "close";
    btn.innerHTML = CLOSE_ICON;
    btn.addEventListener("click", () => {
      if (this.dismissible) this.dismiss();
    });
    this.el.appendChild(btn);
  }

  #addIcon(type: ToastType): void {
    if (type !== "loading" && !ICONS[type]) return;
    const div = document.createElement("div");
    div.dataset.slot = "icon";
    if (type === "loading") {
      div.appendChild(createSvgLoader());
    } else {
      div.innerHTML = ICONS[type];
    }
    this.#iconEl = div;
    this.el.appendChild(div);
  }

  #addTitle(text: string): void {
    const div = document.createElement("div");
    div.dataset.slot = "title";
    div.textContent = text;
    this.#titleEl = div;
    this.el.appendChild(div);
  }

  #addDescription(text: string): void {
    const div = document.createElement("div");
    div.dataset.slot = "description";
    div.textContent = text;
    this.#descEl = div;
    this.el.appendChild(div);
  }

  #addContent(html: string): void {
    const div = document.createElement("div");
    div.dataset.slot = "content";
    div.innerHTML = html;
    this.#contentEl = div;
    this.el.appendChild(div);
  }

  #addButtons(cancel: ToastAction | null, action: ToastAction | null): void {
    const container = document.createElement("div");
    container.dataset.slot = "buttons";
    if (cancel?.label) {
      const btn = document.createElement("button");
      btn.dataset.button = "cancel";
      btn.textContent = cancel.label;
      btn.addEventListener("click", (e) => {
        if (!this.dismissible) return;
        cancel.onClick(e as MouseEvent);
        this.#onRemove(this.id);
      });
      container.appendChild(btn);
    }
    if (action?.label) {
      const btn = document.createElement("button");
      btn.dataset.button = "action";
      btn.textContent = action.label;
      btn.addEventListener("click", (e) => {
        action.onClick(e as MouseEvent);
        if (!e.defaultPrevented) this.#onRemove(this.id);
      });
      container.appendChild(btn);
    }
    this.el.appendChild(container);
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
      el.dataset.swipe = "active";
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
        el.dataset.swipe = "committed";
        el.dataset.swipeDirection = outDirection;
        this.dismiss();
        return;
      }

      el.style.setProperty("--swipe-amount-x", "0px");
      el.style.setProperty("--swipe-amount-y", "0px");
      el.dataset.swipe = "idle";
      swipe.direction = null;
      swipe.startTime = null;
    });

    el.addEventListener("dragend", () => {
      el.dataset.swipe = "idle";
      swipe.direction = null;
      swipe.startTime = null;
    });
  }
}
