declare global {
  interface Window {
    toast?: ToastFunction;
  }
}

type ToastType = "success" | "info" | "warning" | "error" | "loading" | "";

type Position = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

type Theme = "light" | "dark" | "system";

type Direction = "ltr" | "rtl" | "auto";

type SwipeDirection = "up" | "down" | "left" | "right";

type OffsetValue = string | number | Partial<Record<"top" | "right" | "bottom" | "left", string | number>>;

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

export interface PromiseData<T = unknown> {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string | ((error: unknown) => string);
  description?: string | ((data: unknown) => string);
  finally?: () => void;
}

export interface ToasterConfig {
  position: Position;
  theme: Theme;
  richColors: boolean;
  expand: boolean;
  closeButton: boolean;
  invert: boolean;
  duration: number;
  gap: number;
  visibleToasts: number;
  offset: OffsetValue;
  mobileOffset: OffsetValue;
  dir: Direction;
  hotkey: string[];
  containerAriaLabel: string;
  swipeDirections: SwipeDirection[] | null;
  flushDelay: number;
  burstWindow: number;
  burstLinger: number;
}

interface ToastState {
  id: number;
  type: ToastType;
  title: string;
  description: string;
  html: string;
  duration: number;
  dismissible: boolean;
  el: HTMLLIElement;
  groupKey: string;
  remainingTime: number;
  closeTimerStart: number;
  timeout: ReturnType<typeof setTimeout> | null;
  offsetBeforeRemove: number;
  initialHeight: number;
  promise: boolean | null;
  onDismiss: ((toast: Toast) => void) | null;
  onAutoClose: ((toast: Toast) => void) | null;
  action: ToastAction | null;
  cancel: ToastAction | null;
}

interface HeightEntry {
  toastId: number;
  height: number;
}

interface GroupState {
  key: string;
  listEl: HTMLOListElement;
  heights: HeightEntry[];
  expanded: boolean;
  interacting: boolean;
  lastToastTime: number;
  autoCollapseTimeout: ReturnType<typeof setTimeout> | null;
}

interface ParsedPosition {
  y: "top" | "bottom";
  x: "left" | "center" | "right";
}

interface BuildToastParams {
  type: ToastType;
  title: string;
  description: string;
  html: string;
  richColors: boolean;
  closeButton: boolean;
  dismissible: boolean;
  action: ToastAction | null;
  cancel: ToastAction | null;
  pos: ParsedPosition;
  promise?: boolean;
  invert: boolean;
}

interface SwipeState {
  direction: "x" | "y" | null;
  outDirection: SwipeDirection | null;
  startX: number;
  startY: number;
  startTime: Date | null;
}

export interface ToastData extends ToastOptions {
  type?: ToastType;
  promise?: boolean;
}

export interface ConfigureOptions {
  position?: Position;
  theme?: Theme;
  richColors?: boolean;
  expand?: boolean;
  closeButton?: boolean;
  invert?: boolean;
  duration?: number;
  gap?: number;
  visibleToasts?: number;
  offset?: OffsetValue;
  mobileOffset?: OffsetValue;
  dir?: Direction;
  hotkey?: string[];
  containerAriaLabel?: string;
  swipeDirections?: SwipeDirection[] | null;
  flushDelay?: number;
  burstWindow?: number;
  burstLinger?: number;
}

export interface ToastFunction {
  (msg: string, data?: ToastOptions): number;
  (data: ToastOptions): number;
  message: (msg: string, data?: ToastOptions) => number;
  success: (msg: string, data?: ToastOptions) => number;
  info: (msg: string, data?: ToastOptions) => number;
  warning: (msg: string, data?: ToastOptions) => number;
  error: (msg: string, data?: ToastOptions) => number;
  loading: (msg: string, data?: ToastOptions) => number;
  promise: <T>(p: Promise<T> | (() => Promise<T>), data: PromiseData<T>) => number | undefined;
  dismiss: (id?: number) => number | undefined | null;
  configure: (opts: ConfigureOptions) => void;
  reset: () => void;
  destroy: () => void;
  getToasts: () => Toast[];
}

export const DEFAULTS: ToasterConfig = {
  position: "bottom-right",
  theme: "system",
  richColors: false,
  expand: false,
  closeButton: false,
  invert: false,
  duration: 4000,
  gap: 14,
  visibleToasts: 3,
  offset: "24px",
  mobileOffset: "16px",
  dir: "ltr",
  hotkey: ["altKey", "KeyT"],
  containerAriaLabel: "Notifications",
  swipeDirections: null,
  flushDelay: 200,
  burstWindow: 500,
  burstLinger: 3000,
};

const TOAST_WIDTH: number = 356;
const SWIPE_THRESHOLD: number = 45;
const TIME_BEFORE_UNMOUNT: number = 200;

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

export const LEVELS: Set<string> = new Set(["success", "info", "warning", "error", "loading"]);

export const LEVEL_MAP: Record<string, ToastType> = {
  debug: "info",
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function toPublicToast(t: ToastState): Toast {
  return {
    id: t.id,
    type: t.type,
    title: t.title,
    description: t.description,
    html: t.html,
    duration: t.duration,
    dismissible: t.dismissible,
    promise: t.promise,
    action: t.action,
    cancel: t.cancel,
  };
}



export const OBSERVED_ATTRIBUTES = [
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
] as const;

export class SonnerToaster {
  #config: ToasterConfig = { ...DEFAULTS };
  #resolvedTheme: "light" | "dark" = "light";
  #toasts: ToastState[] = [];
  #groups: Map<string, GroupState> = new Map();
  #documentHidden: boolean = false;
  #idCounter: number = 0;
  #sectionEl: HTMLElement;

  constructor(root: ShadowRoot) {
    const sectionEl = document.createElement("section");
    sectionEl.setAttribute("tabindex", "-1");
    sectionEl.setAttribute("aria-live", "polite");
    sectionEl.setAttribute("aria-relevant", "additions text");
    sectionEl.setAttribute("aria-atomic", "false");
    root.appendChild(sectionEl);
    this.#sectionEl = sectionEl;

    for (const name of OBSERVED_ATTRIBUTES) {
      const value = root.host.getAttribute(name);
      if (value !== null) {
        this.applyAttribute(name, value);
      }
    }

    this.applyAttribute("container-aria-label", null);
    this.#resolveTheme();

    if (this.#config.dir === "auto" || !this.#config.dir) {
      this.#config.dir = this.#getDocumentDirection() as Direction;
    }

    const pos = this.#getPosition();
    this.#getOrCreateGroup(pos);
  }

  get flushDelay(): number {
    return this.#config.flushDelay;
  }

  handleVisibilityChange(hidden: boolean): void {
    this.#documentHidden = hidden;
    for (const t of this.#toasts) {
      const g = this.#groups.get(t.groupKey);
      if (this.#documentHidden) {
        this.#pauseTimer(t);
      } else if (!g?.expanded && !g?.interacting) {
        this.#startTimer(t);
      }
    }
  }

  handleKeydown(e: KeyboardEvent, activeElement: Element | null): void {
    const pressed =
      this.#config.hotkey.length > 0 &&
      this.#config.hotkey.every((key) => (e as unknown as Record<string, unknown>)[key] || e.code === key);
    if (pressed) {
      for (const g of this.#groups.values()) {
        g.expanded = true;
      }
      const defaultGroup = this.#groups.get(
        this.#positionKey(this.#getPosition()),
      );
      if (defaultGroup) defaultGroup.listEl.focus();
      this.#updateAll();
    }
    if (e.code === "Escape") {
      for (const g of this.#groups.values()) {
        if (
          activeElement === g.listEl ||
          g.listEl.contains(activeElement)
        ) {
          g.expanded = false;
          break;
        }
      }
      this.#updateAll();
    }
  }

  handleThemeChange(isDark: boolean): void {
    this.#resolvedTheme = isDark ? "dark" : "light";
    for (const group of this.#groups.values()) {
      group.listEl.setAttribute("data-sonner-theme", this.#resolvedTheme);
    }
  }

  get usesSystemTheme(): boolean {
    return this.#config.theme === "system";
  }

  #resolveTheme(): void {
    if (this.#config.theme !== "system") {
      this.#resolvedTheme = this.#config.theme;
      return;
    }
    if (window.matchMedia) {
      this.#resolvedTheme = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches
        ? "dark"
        : "light";
    }
  }

  applyAttribute(name: string, value: string | null): void {
    switch (name) {
      case "position":
        this.#config.position = (value || DEFAULTS.position) as Position;
        break;
      case "theme":
        this.#config.theme = (value || DEFAULTS.theme) as Theme;
        break;
      case "rich-colors":
        this.#config.richColors = value !== null && value !== "false";
        break;
      case "expand":
        this.#config.expand = value !== null && value !== "false";
        break;
      case "close-button":
        this.#config.closeButton = value !== null && value !== "false";
        break;
      case "invert":
        this.#config.invert = value !== null && value !== "false";
        break;
      case "duration": {
        const n = Number(value);
        this.#config.duration =
          n === Infinity || Number.isFinite(n) ? n : DEFAULTS.duration;
        break;
      }
      case "gap": {
        const n = Number(value);
        this.#config.gap = Number.isFinite(n) ? n : DEFAULTS.gap;
        break;
      }
      case "visible-toasts": {
        const n = Number(value);
        this.#config.visibleToasts = Number.isFinite(n) ? n : DEFAULTS.visibleToasts;
        break;
      }
      case "offset":
        if (value) {
          try {
            this.#config.offset = JSON.parse(value);
          } catch {
            this.#config.offset = value;
          }
        } else {
          this.#config.offset = DEFAULTS.offset;
        }
        break;
      case "mobile-offset":
        if (value) {
          try {
            this.#config.mobileOffset = JSON.parse(value);
          } catch {
            this.#config.mobileOffset = value;
          }
        } else {
          this.#config.mobileOffset = DEFAULTS.mobileOffset;
        }
        break;
      case "dir":
        this.#config.dir = (value || DEFAULTS.dir) as Direction;
        break;
      case "container-aria-label": {
        this.#config.containerAriaLabel = value || DEFAULTS.containerAriaLabel;
        const hotkeyLabel = this.#config.hotkey
          .join("+")
          .replace(/Key/g, "")
          .replace(/Digit/g, "");
        this.#sectionEl.setAttribute(
          "aria-label",
          `${this.#config.containerAriaLabel} ${hotkeyLabel}`,
        );
        break;
      }
      case "flush-delay": {
        const n = Number(value);
        if (!Number.isFinite(n)) {
          console.warn(`[sonner-toaster] flush-delay must be a number, got "${value}". Using default (${DEFAULTS.flushDelay}).`);
          this.#config.flushDelay = DEFAULTS.flushDelay;
        } else if (n < 0) {
          console.warn(`[sonner-toaster] flush-delay must be >= 0, got ${n}. Using 0.`);
          this.#config.flushDelay = 0;
        } else {
          this.#config.flushDelay = n;
        }
        break;
      }
      case "burst-window": {
        const n = Number(value);
        this.#config.burstWindow = Number.isFinite(n) && n >= 0
          ? n
          : DEFAULTS.burstWindow;
        break;
      }
      case "burst-linger": {
        const n = Number(value);
        this.#config.burstLinger = Number.isFinite(n) && n >= 0
          ? n
          : DEFAULTS.burstLinger;
        break;
      }
    }
  }

  handleAttributeChange(): void {
    if (this.#groups.size === 0) return;
    this.#resolveTheme();
    const dir = this.#config.dir === "auto"
      ? this.#getDocumentDirection()
      : this.#config.dir;
    for (const group of this.#groups.values()) {
      group.listEl.setAttribute("data-sonner-theme", this.#resolvedTheme);
      if (dir) group.listEl.setAttribute("dir", dir);
    }
    this.#updateAllGroupStyles();
    this.#updateAll();
  }

  configure(opts: ConfigureOptions): void {
    if (!opts) return;
    for (const [k, v] of Object.entries(opts)) {
      if (v !== undefined) (this.#config as unknown as Record<string, unknown>)[k] = v;
    }
  }

  reset(): void {
    for (const t of this.#toasts) {
      if (t.timeout) clearTimeout(t.timeout);
    }
    this.#toasts = [];
    const defaultKey = this.#positionKey(this.#getPosition());
    const keysToDelete = [];
    for (const [key, group] of this.#groups) {
      group.heights = [];
      group.expanded = false;
      group.interacting = false;
      if (group.autoCollapseTimeout) clearTimeout(group.autoCollapseTimeout);
      group.autoCollapseTimeout = null;
      if (key === defaultKey) {
        group.listEl.innerHTML = "";
      } else {
        group.listEl.remove();
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.#groups.delete(key);
    }
  }

  destroy(): void {
    for (const t of this.#toasts) {
      if (t.timeout) clearTimeout(t.timeout);
    }
    this.#toasts = [];
    this.#groups.clear();
  }

  getToasts(): Toast[] {
    return this.#toasts.map(toPublicToast);
  }

  add(level: ToastType, message: string | ToastOptions, options?: ToastOptions): number {
    if (typeof message === "object" && message !== null) {
      options = message;
      message = options.title || options.message || "";
    }
    const data: ToastData = { ...options, type: level, title: message };
    return this.#createToast(data);
  }

  dismiss(id?: number | null): number | undefined | null {
    if (id !== undefined && id !== null) {
      const t = this.#findToast(id);
      if (t) {
        t.onDismiss?.(toPublicToast(t));
        this.#deleteToast(id);
      }
    } else {
      for (const t of this.#toasts.slice()) {
        t.onDismiss?.(toPublicToast(t));
        this.#deleteToast(t.id);
      }
    }
    return id;
  }

  promise<T>(promise: Promise<T> | (() => Promise<T>), data: PromiseData<T>): number | undefined {
    if (!data) return;

    let id: number | undefined;
    if (data.loading !== undefined) {
      id = this.#createToast({
        type: "loading",
        title: data.loading,
        description:
          typeof data.description === "string" ? data.description : undefined,
        promise: true,
        duration: Infinity,
      });
    }

    const p = typeof promise === "function" ? promise() : promise;

    Promise.resolve(p)
      .then((response) => {
        const res = response as unknown as { ok?: boolean; status?: number };
        if (res?.ok === false) {
          const msg =
            typeof data.error === "function"
              ? data.error(`HTTP error! status: ${res.status}`)
              : data.error;
          this.#createToast({
            id,
            type: "error",
            title: msg || "Error",
            description:
              typeof data.description === "function"
                ? data.description(response)
                : data.description,
          });
        } else if (data.success !== undefined) {
          const msg =
            typeof data.success === "function"
              ? data.success(response as NonNullable<Awaited<T>>)
              : data.success;
          this.#createToast({
            id,
            type: "success",
            title: msg,
            description:
              typeof data.description === "function"
                ? data.description(response)
                : data.description,
          });
        }
      })
      .catch((error: unknown) => {
        if (data.error !== undefined) {
          const msg =
            typeof data.error === "function" ? data.error(error) : data.error;
          this.#createToast({
            id,
            type: "error",
            title: msg || "Error",
            description:
              typeof data.description === "function"
                ? data.description(error)
                : data.description,
          });
        }
      })
      .finally(() => data.finally?.());

    return id;
  }

  flushChildToasts(children: NodeListOf<Element>): void {
    for (const el of children) {
      const rawLevel = el.getAttribute("level") || "info";
      const level = (LEVEL_MAP[rawLevel] || rawLevel) as ToastType;
      const description = el.getAttribute("description") || undefined;
      const hasElements = el.querySelector("*") !== null;
      if (hasElements) {
        this.add(level, "", { html: el.innerHTML.trim(), description });
      } else {
        const message = el.textContent?.trim() || "";
        if (message) this.add(level, message, { description });
      }
      el.remove();
    }
  }

  #getDocumentDirection(): string {
    const dir = document.documentElement.getAttribute("dir");
    if (dir === "auto" || !dir) {
      return (
        window.getComputedStyle(document.documentElement).direction || "ltr"
      );
    }
    return dir;
  }

  #getPosition(positionStr?: string): ParsedPosition {
    const str = positionStr || this.#config.position;
    const parts = str.split("-");
    return { y: parts[0] as ParsedPosition["y"], x: (parts[1] || "right") as ParsedPosition["x"] };
  }

  #positionKey(pos: ParsedPosition): string {
    return `${pos.y}-${pos.x}`;
  }

  #getOrCreateGroup(pos: ParsedPosition): GroupState {
    const key = this.#positionKey(pos);
    if (this.#groups.has(key)) return this.#groups.get(key)!;

    const listEl = document.createElement("ol");
    listEl.setAttribute("data-sonner-toaster", "");
    listEl.setAttribute("data-sonner-theme", this.#resolvedTheme);
    listEl.setAttribute("data-y-position", pos.y);
    listEl.setAttribute("data-x-position", pos.x);
    listEl.setAttribute("dir", this.#config.dir);
    listEl.setAttribute("tabindex", "-1");
    listEl.setAttribute("popover", "manual");

    const group: GroupState = {
      key,
      listEl,
      heights: [],
      expanded: false,
      interacting: false,
      lastToastTime: 0,
      autoCollapseTimeout: null,
    };

    listEl.addEventListener("mouseenter", () => {
      group.expanded = true;
      this.#updateAll();
    });
    listEl.addEventListener("mousemove", () => {
      if (!group.expanded) {
        group.expanded = true;
        this.#updateAll();
      }
    });
    listEl.addEventListener("mouseleave", () => {
      if (!group.interacting && !group.autoCollapseTimeout) {
        group.expanded = false;
        this.#updateAll();
      }
    });
    listEl.addEventListener("pointerdown", (e) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.dataset.dismissible === "false"
      )
        return;
      group.interacting = true;
    });
    listEl.addEventListener("pointerup", () => {
      group.interacting = false;
    });

    this.#groups.set(key, group);
    this.#updateGroupStyles(group);
    this.#sectionEl.appendChild(listEl);
    listEl.showPopover();
    return group;
  }

  #removeGroupIfEmpty(group: GroupState): void {
    const defaultKey = this.#positionKey(this.#getPosition());
    if (group.key === defaultKey) return;
    const hasToasts = this.#toasts.some(
      (t) => t.groupKey === group.key && t.el.getAttribute("data-state") !== "removing",
    );
    if (!hasToasts) {
      group.listEl.remove();
      this.#groups.delete(group.key);
    }
  }

  #getDefaultSwipeDirections(positionKey: string): string[] {
    if (this.#config.swipeDirections) return this.#config.swipeDirections;
    const pos = this.#getPosition(positionKey);
    const dirs = [];
    if (pos.y) dirs.push(pos.y);
    if (pos.x && pos.x !== "center") dirs.push(pos.x);
    return dirs;
  }

  #computeOffsetStyles(): Record<string, string> {
    const styles: Record<string, string> = {};
    const offsets: Array<{ value: OffsetValue; prefix: string; fallback: string }> = [
      {
        value: this.#config.offset,
        prefix: "--offset",
        fallback: DEFAULTS.offset as string,
      },
      {
        value: this.#config.mobileOffset,
        prefix: "--mobile-offset",
        fallback: DEFAULTS.mobileOffset as string,
      },
    ];
    const sides = ["top", "right", "bottom", "left"] as const;
    for (const o of offsets) {
      const val = o.value;
      if (typeof val === "number" || typeof val === "string") {
        const v = typeof val === "number" ? `${val}px` : val;
        for (const k of sides) styles[`${o.prefix}-${k}`] = v;
      } else if (typeof val === "object" && val !== null) {
        for (const k of sides) {
          const s = val[k as keyof typeof val];
          styles[`${o.prefix}-${k}`] =
            s !== undefined
              ? typeof s === "number"
                ? `${s}px`
                : s
              : o.fallback;
        }
      } else {
        for (const k of sides) styles[`${o.prefix}-${k}`] = o.fallback;
      }
    }
    return styles;
  }

  #updateGroupStyles(group: GroupState): void {
    if (!group?.listEl) return;
    const frontHeight =
      group.heights.length > 0 ? group.heights[0].height : 0;
    const offsets = this.#computeOffsetStyles();
    const parts = [
      `--front-toast-height:${frontHeight}px`,
      `--width:${TOAST_WIDTH}px`,
      `--gap:${this.#config.gap}px`,
    ];
    for (const [k, v] of Object.entries(offsets)) {
      parts.push(`${k}:${v}`);
    }
    group.listEl.setAttribute("style", parts.join(";"));
  }

  #updateAllGroupStyles(): void {
    for (const group of this.#groups.values()) {
      this.#updateGroupStyles(group);
    }
  }

  #createToast(data: ToastData): number {
    const id = data.id ?? ++this.#idCounter;

    const existing = this.#findToast(id);
    if (existing) return this.#updateToast(existing, data);

    const type = data.type || "";
    const title = data.title || data.message || "";
    const description = data.description || "";
    const duration = data.duration ?? this.#config.duration;
    const dismissible = data.dismissible ?? true;
    const richColors = data.richColors ?? this.#config.richColors;
    const closeButton = data.closeButton ?? this.#config.closeButton;
    const action = data.action || null;
    const cancel = data.cancel || null;
    const pos = data.position
      ? this.#getPosition(data.position)
      : this.#getPosition();
    const group = this.#getOrCreateGroup(pos);

    const html = data.html || "";

    const el = this.#buildToastElement({
      type,
      title,
      description,
      html,
      richColors,
      closeButton,
      dismissible,
      action,
      cancel,
      pos,
      promise: data.promise,
      invert: data.invert ?? this.#config.invert,
    });

    const t: ToastState = {
      id,
      type,
      title,
      description,
      html,
      duration,
      dismissible,
      el,
      groupKey: group.key,
      remainingTime: duration,
      closeTimerStart: 0,
      timeout: null,
      offsetBeforeRemove: 0,
      initialHeight: 0,
      promise: data.promise || null,
      onDismiss: data.onDismiss || null,
      onAutoClose: data.onAutoClose || null,
      action,
      cancel,
    };

    if (closeButton) {
      el.querySelector("[data-slot='close']")?.addEventListener("click", () => {
        if (dismissible) {
          this.#deleteToast(id);
          t.onDismiss?.(toPublicToast(t));
        }
      });
    }
    if (cancel?.onClick) {
      el.querySelector("[data-button='cancel']")?.addEventListener("click", (e) => {
        if (!dismissible) return;
        cancel.onClick(e as MouseEvent);
        this.#deleteToast(id);
      });
    }
    if (action?.onClick) {
      el.querySelector("[data-button='action']")?.addEventListener("click", (e) => {
        action.onClick(e as MouseEvent);
        if (!e.defaultPrevented) this.#deleteToast(id);
      });
    }

    this.#attachSwipeHandlers(el, t);

    this.#toasts.unshift(t);
    group.listEl.prepend(el);

    const measuredHeight = el.getBoundingClientRect().height;
    t.initialHeight = measuredHeight;
    group.heights.unshift({ toastId: id, height: measuredHeight });

    this.#updateAll();

    // Auto-expand when toasts arrive in quick succession
    const now = Date.now();
    if (this.#config.burstWindow > 0 && now - group.lastToastTime < this.#config.burstWindow) {
      group.expanded = true;
      if (group.autoCollapseTimeout) clearTimeout(group.autoCollapseTimeout);
      group.autoCollapseTimeout = setTimeout(() => {
        group.autoCollapseTimeout = null;
        if (!group.interacting) {
          // Align dismiss timers so burst toasts leave together
          for (const t of this.#toasts) {
            if (t.groupKey === group.key && t.type !== "loading" && t.duration !== Infinity) {
              t.remainingTime = t.duration || this.#config.duration;
            }
          }
          group.expanded = false;
          this.#updateAll();
        }
      }, this.#config.burstLinger);
      this.#updateAll();
    }
    group.lastToastTime = now;

    requestAnimationFrame(() => {
      el.setAttribute("data-state", "mounted");
      this.#startTimer(t);
    });

    return id;
  }

  #buildToastElement({
    type,
    title,
    description,
    html,
    richColors,
    closeButton,
    dismissible,
    action,
    cancel,
    promise,
    invert,
  }: BuildToastParams): HTMLLIElement {
    const el = document.createElement("li");
    el.setAttribute("tabindex", "0");
    el.setAttribute("data-sonner-toast", "");
    el.setAttribute("data-type", type);
    el.setAttribute("data-state", "mounting");
    el.setAttribute("data-visible", "true");
    el.setAttribute("data-index", "0");
    el.setAttribute("data-swipe", "idle");
    el.setAttribute("data-dismissible", String(dismissible));
    el.setAttribute("data-expanded", String(this.#config.expand));
    el.setAttribute("data-rich-colors", String(richColors));
    el.setAttribute("data-promise", String(!!promise));
    el.setAttribute("data-invert", String(!!invert));

    let markup = "";

    if (closeButton && type !== "loading") {
      markup += `<button aria-label="Close toast" data-slot="close">${CLOSE_ICON}</button>`;
    }

    const iconHtml =
      type === "loading" ? LOADER_HTML : (ICONS[type] || "");
    if (iconHtml) markup += `<div data-slot="icon">${iconHtml}</div>`;

    if (html) {
      markup += '<div data-slot="content"></div>';
    } else {
      markup += '<div data-slot="title"></div>';
      if (description) markup += '<div data-slot="description"></div>';
    }

    if (cancel?.label || action?.label) {
      markup += '<div data-slot="buttons">';
      if (cancel?.label)
        markup += `<button data-button="cancel">${escapeHtml(cancel.label)}</button>`;
      if (action?.label)
        markup += `<button data-button="action">${escapeHtml(action.label)}</button>`;
      markup += '</div>';
    }

    el.innerHTML = markup;

    if (html) {
      const contentEl = el.querySelector("[data-slot='content']");
      if (contentEl) contentEl.innerHTML = html;
    } else {
      const titleEl = el.querySelector("[data-slot='title']");
      if (titleEl) titleEl.textContent = title;

      const descEl = el.querySelector("[data-slot='description']");
      if (descEl) descEl.textContent = description;
    }

    return el;
  }

  #attachSwipeHandlers(el: HTMLLIElement, t: ToastState): void {
    const swipe: SwipeState = {
      direction: null,
      outDirection: null,
      startX: 0,
      startY: 0,
      startTime: null,
    };

    el.addEventListener("pointerdown", (e) => {
      if (e.button === 2 || t.type === "loading" || !t.dismissible) return;
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
      if (!swipe.startTime || !t.dismissible) return;
      if ((window.getSelection?.()?.toString().length ?? 0) > 0) return;

      const xDelta = e.clientX - swipe.startX;
      const yDelta = e.clientY - swipe.startY;
      const allowed = this.#getDefaultSwipeDirections(t.groupKey);

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

      if (Math.abs(amount.x) > 0 || Math.abs(amount.y) > 0) {
        // displacement tracked via data-swipe="active"
      }
      el.style.setProperty("--swipe-amount-x", `${amount.x}px`);
      el.style.setProperty("--swipe-amount-y", `${amount.y}px`);
    });

    el.addEventListener("pointerup", () => {
      if (!swipe.startTime || !t.dismissible) return;

      const amtX =
        parseFloat(el.style.getPropertyValue("--swipe-amount-x")) || 0;
      const amtY =
        parseFloat(el.style.getPropertyValue("--swipe-amount-y")) || 0;
      const elapsed = Date.now() - swipe.startTime.getTime();
      const amount = swipe.direction === "x" ? amtX : amtY;
      const velocity = Math.abs(amount) / elapsed;

      if (Math.abs(amount) >= SWIPE_THRESHOLD || velocity > 0.11) {
        swipe.outDirection =
          swipe.direction === "x"
            ? amtX > 0
              ? "right"
              : "left"
            : amtY > 0
              ? "down"
              : "up";
        el.setAttribute("data-swipe", "committed");
        el.setAttribute("data-swipe-direction", swipe.outDirection);
        t.onDismiss?.(toPublicToast(t));
        this.#deleteToast(t.id);
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

  #updateToast(t: ToastState, data: ToastData): number {
    if (data.type !== undefined) t.type = data.type;
    if (data.title !== undefined || data.message !== undefined) {
      t.title = data.title || data.message || "";
    }
    if (data.description !== undefined) t.description = data.description;
    if (data.html !== undefined) t.html = data.html;
    if (data.duration !== undefined) {
      t.duration = data.duration;
      t.remainingTime = data.duration;
    }

    const el = t.el;
    if (t.type) el.setAttribute("data-type", t.type);
    if (data.promise !== undefined) {
      el.setAttribute("data-promise", String(!!data.promise));
    }

    const iconEl = el.querySelector("[data-slot='icon']");
    if (iconEl) {
      const type: ToastType = t.type;
      iconEl.innerHTML =
        type === "loading" ? LOADER_HTML : (ICONS[type] || "");
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
      if (titleEl) titleEl.textContent = t.title;

      const descEl = el.querySelector("[data-slot='description']");
      if (t.description && !descEl) {
        const titleEl2 = el.querySelector("[data-slot='title']");
        if (titleEl2) {
          const newDesc = document.createElement("div");
          newDesc.setAttribute("data-slot", "description");
          newDesc.textContent = t.description;
          titleEl2.after(newDesc);
        }
      } else if (descEl) {
        descEl.textContent = t.description || "";
      }
    }

    const newHeight = el.getBoundingClientRect().height;
    t.initialHeight = newHeight;
    const group = this.#groups.get(t.groupKey);
    if (group) {
      const h = group.heights.find((h) => h.toastId === t.id);
      if (h) h.height = newHeight;
    }

    if (t.type !== "loading") {
      if (t.duration === Infinity) {
        t.duration = this.#config.duration;
      }
      if (t.timeout) clearTimeout(t.timeout);
      t.remainingTime = t.duration || this.#config.duration;
      this.#startTimer(t);
    }

    this.#updateAll();
    return t.id;
  }

  #deleteToast(id: number): void {
    const t = this.#findToast(id);
    if (!t) return;

    const group = this.#groups.get(t.groupKey);

    t.offsetBeforeRemove = this.#getToastOffset(t);
    t.el.setAttribute("data-state", "removing");
    t.el.style.setProperty("--offset", `${t.offsetBeforeRemove}px`);

    if (group) {
      group.heights = group.heights.filter((h) => h.toastId !== id);
    }
    this.#updateAll();
    if (t.timeout) clearTimeout(t.timeout);

    setTimeout(() => {
      this.#toasts = this.#toasts.filter((x) => x.id !== id);
      t.el.remove();
      if (group) {
        const remaining = this.#toasts.filter(
          (x) => x.groupKey === group.key,
        );
        if (remaining.length <= 1) group.expanded = false;
        this.#removeGroupIfEmpty(group);
      }
      this.#updateAll();
    }, TIME_BEFORE_UNMOUNT);
  }

  #findToast(id: number): ToastState | null {
    return this.#toasts.find((t) => t.id === id) || null;
  }

  #getToastOffset(t: ToastState): number {
    const group = this.#groups.get(t.groupKey);
    if (!group) return 0;
    const heightIdx = group.heights.findIndex((h) => h.toastId === t.id);
    if (heightIdx < 0) return 0;

    let before = 0;
    for (let i = 0; i < heightIdx; i++) {
      before += group.heights[i].height;
    }
    return heightIdx * this.#config.gap + before;
  }

  #updateAll(): void {
    for (const group of this.#groups.values()) {
      this.#updateGroupStyles(group);

      const groupToasts = this.#toasts.filter(
        (t) => t.groupKey === group.key,
      );

      for (let i = 0; i < groupToasts.length; i++) {
        const t = groupToasts[i];
        const el = t.el;
        const isVisible = i < this.#config.visibleToasts;
        const isExpanded = group.expanded || this.#config.expand;

        el.setAttribute("data-visible", String(isVisible));
        el.setAttribute("data-expanded", String(isExpanded));
        el.setAttribute("data-index", String(i));

        let offset = this.#getToastOffset(t);
        if (el.getAttribute("data-state") === "removing") {
          offset = t.offsetBeforeRemove;
        }

        el.style.setProperty("--index", String(i));
        el.style.setProperty("--toasts-before", String(i));
        el.style.setProperty("--z-index", String(groupToasts.length - i));
        el.style.setProperty("--offset", `${offset}px`);
        el.style.setProperty(
          "--initial-height",
          isExpanded ? "auto" : `${t.initialHeight}px`,
        );

        if (el.getAttribute("data-state") !== "removing") {
          if (isExpanded || group.interacting || this.#documentHidden) {
            this.#pauseTimer(t);
          } else {
            this.#startTimer(t);
          }
        }
      }
    }
  }

  #startTimer(t: ToastState): void {
    if (!t || t.type === "loading" || t.duration === Infinity) return;
    const group = this.#groups.get(t.groupKey);
    if (group?.expanded || group?.interacting || this.#documentHidden) return;
    if (t.closeTimerStart && t.timeout) return;
    if (t.remainingTime <= 0) {
      t.remainingTime = t.duration || this.#config.duration;
    }
    if (t.timeout) clearTimeout(t.timeout);
    t.closeTimerStart = Date.now();
    t.timeout = setTimeout(() => {
      t.onAutoClose?.(toPublicToast(t));
      this.#deleteToast(t.id);
    }, t.remainingTime);
  }

  #pauseTimer(t: ToastState): void {
    if (!t?.closeTimerStart) return;
    if (t.timeout) clearTimeout(t.timeout);
    t.timeout = null;
    const elapsed = Date.now() - t.closeTimerStart;
    t.remainingTime = Math.max(0, t.remainingTime - elapsed);
    t.closeTimerStart = 0;
  }
}
