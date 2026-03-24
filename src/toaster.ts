declare global {
  interface Window {
    toast?: ToastFunction;
  }
}

import { SonnerToast, TIME_BEFORE_UNMOUNT } from "./toast.js";
import type { ToastType, Position, SwipeDirection, Toast, ToastOptions, ToastAction, ToastData } from "./toast.js";

type Theme = "light" | "dark" | "system";

type Direction = "ltr" | "rtl" | "auto";

type OffsetValue = string | number | Partial<Record<"top" | "right" | "bottom" | "left", string | number>>;

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

export const LEVELS: Set<string> = new Set(["success", "info", "warning", "error", "loading"]);

export const LEVEL_MAP: Record<string, ToastType> = {
  debug: "info",
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

export class SonnerToaster {
  #config: ToasterConfig = { ...DEFAULTS };
  #resolvedTheme: "light" | "dark" = "light";
  #toasts: SonnerToast[] = [];
  #groups: Map<string, GroupState> = new Map();
  #documentHidden: boolean = false;
  #idCounter: number = 0;
  #sectionEl: HTMLElement;

  constructor(root: ShadowRoot) {
    this.#sectionEl = document.createElement("section");
    this.#sectionEl.setAttribute("tabindex", "-1");
    this.#sectionEl.setAttribute("aria-live", "polite");
    this.#sectionEl.setAttribute("aria-relevant", "additions text");
    this.#sectionEl.setAttribute("aria-atomic", "false");
    root.appendChild(this.#sectionEl);

    for (const { name, value } of root.host.attributes) {
      this.applyAttribute(name, value);
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
        t.pauseTimer();
      } else if (!g?.expanded && !g?.interacting) {
        t.startTimer();
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
      t.clearTimer();
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
      t.clearTimer();
    }
    this.#toasts = [];
    this.#groups.clear();
  }

  getToasts(): Toast[] {
    return this.#toasts.map((t) => t.toPublic());
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
      if (t) t.dismiss();
    } else {
      for (const t of this.#toasts.slice()) {
        t.dismiss();
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
      (t) => t.groupKey === group.key && !t.isRemoving,
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

    const t = new SonnerToast({
      id,
      groupKey: group.key,
      type,
      title,
      description,
      html,
      duration,
      dismissible,
      richColors,
      closeButton,
      expand: this.#config.expand,
      invert: data.invert ?? this.#config.invert,
      action,
      cancel,
      promise: data.promise || null,
      onDismiss: data.onDismiss || null,
      onAutoClose: data.onAutoClose || null,
      onRemove: (id) => this.#deleteToast(id),
      getAllowedSwipeDirections: () => this.#getDefaultSwipeDirections(group.key),
    });

    this.#toasts.unshift(t);
    group.listEl.prepend(t.el);

    const height = t.measureHeight();
    group.heights.unshift({ toastId: id, height });

    this.#updateAll();

    // Auto-expand when toasts arrive in quick succession
    const now = Date.now();
    if (this.#config.burstWindow > 0 && now - group.lastToastTime < this.#config.burstWindow) {
      group.expanded = true;
      if (group.autoCollapseTimeout) clearTimeout(group.autoCollapseTimeout);
      group.autoCollapseTimeout = setTimeout(() => {
        group.autoCollapseTimeout = null;
        if (!group.interacting) {
          for (const t of this.#toasts) {
            if (t.groupKey === group.key) {
              t.resetTimer(this.#config.duration);
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
      t.mount();
      t.startTimer();
    });

    return id;
  }

  #updateToast(t: SonnerToast, data: ToastData): number {
    t.update(data, this.#config.duration);

    const group = this.#groups.get(t.groupKey);
    if (group) {
      const h = group.heights.find((h) => h.toastId === t.id);
      if (h) h.height = t.initialHeight;
    }

    this.#updateAll();
    return t.id;
  }

  #deleteToast(id: number): void {
    const t = this.#findToast(id);
    if (!t) return;

    const group = this.#groups.get(t.groupKey);
    const offset = this.#getToastOffset(t);
    t.beginRemoval(offset);

    if (group) {
      group.heights = group.heights.filter((h) => h.toastId !== id);
    }
    this.#updateAll();

    setTimeout(() => {
      this.#toasts = this.#toasts.filter((x) => x.id !== id);
      t.remove();
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

  #findToast(id: number): SonnerToast | null {
    return this.#toasts.find((t) => t.id === id) || null;
  }

  #getToastOffset(t: SonnerToast): number {
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
        const isVisible = i < this.#config.visibleToasts;
        const isExpanded = group.expanded || this.#config.expand;

        const offset = t.isRemoving
          ? t.offsetBeforeRemove
          : this.#getToastOffset(t);
        t.updateLayout(i, offset, isVisible, isExpanded, groupToasts.length);

        if (!t.isRemoving) {
          if (isExpanded || group.interacting || this.#documentHidden) {
            t.pauseTimer();
          } else {
            t.startTimer();
          }
        }
      }
    }
  }
}

export type { Toast, ToastOptions, ToastData, ToastAction, ToastType, Position, SwipeDirection };
