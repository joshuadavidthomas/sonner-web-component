/**
 * sonner-web-component — A web component port of Sonner.
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

interface ToasterConfig {
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

interface ToastData extends ToastOptions {
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

const DEFAULTS: ToasterConfig = {
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

const LEVELS: Set<string> = new Set(["success", "info", "warning", "error", "loading"]);

const LEVEL_MAP: Record<string, ToastType> = {
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

// loaded into Shadow DOM via `adoptedStyleSheets`
const STYLES = `
:host {
  display: contents;
}

[data-sonner-toaster][dir='ltr'] {
  --toast-icon-margin-start: -3px;
  --toast-icon-margin-end: 4px;
  --toast-svg-margin-start: -1px;
  --toast-svg-margin-end: 0px;
  --toast-button-margin-start: auto;
  --toast-button-margin-end: 0;
  --toast-close-button-start: 0;
  --toast-close-button-end: unset;
  --toast-close-button-transform: translate(-35%, -35%);
}

[data-sonner-toaster][dir='rtl'] {
  --toast-icon-margin-start: 4px;
  --toast-icon-margin-end: -3px;
  --toast-svg-margin-start: 0px;
  --toast-svg-margin-end: -1px;
  --toast-button-margin-start: 0;
  --toast-button-margin-end: auto;
  --toast-close-button-start: unset;
  --toast-close-button-end: 0;
  --toast-close-button-transform: translate(35%, -35%);
}

[data-sonner-toaster] {
  position: fixed;
  width: var(--width);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial,
    Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
  --gray1: hsl(0, 0%, 99%);
  --gray2: hsl(0, 0%, 97.3%);
  --gray3: hsl(0, 0%, 95.1%);
  --gray4: hsl(0, 0%, 93%);
  --gray5: hsl(0, 0%, 90.9%);
  --gray6: hsl(0, 0%, 88.7%);
  --gray7: hsl(0, 0%, 85.8%);
  --gray8: hsl(0, 0%, 78%);
  --gray9: hsl(0, 0%, 56.1%);
  --gray10: hsl(0, 0%, 52.3%);
  --gray11: hsl(0, 0%, 43.5%);
  --gray12: hsl(0, 0%, 9%);
  --border-radius: 8px;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  list-style: none;
  outline: none;
  /* Reset UA popover defaults — top layer handles stacking */
  border: none;
  background: transparent;
  color: inherit;
  overflow: visible;
  inset: unset;
}

@media (hover: none) and (pointer: coarse) {
  [data-sonner-toaster][data-lifted='true'] {
    transform: none;
  }
}

[data-sonner-toaster][data-x-position='right'] {
  right: var(--offset-right);
}

[data-sonner-toaster][data-x-position='left'] {
  left: var(--offset-left);
}

[data-sonner-toaster][data-x-position='center'] {
  left: 50%;
  transform: translateX(-50%);
}

[data-sonner-toaster][data-y-position='top'] {
  top: var(--offset-top);
}

[data-sonner-toaster][data-y-position='bottom'] {
  bottom: var(--offset-bottom);
}

[data-sonner-toast] {
  --y: translateY(100%);
  --lift-amount: calc(var(--lift) * var(--gap));
  z-index: var(--z-index);
  position: absolute;
  opacity: 0;
  transform: var(--y);
  touch-action: none;
  transition: transform 400ms, opacity 400ms, height 400ms, box-shadow 200ms;
  box-sizing: border-box;
  outline: none;
  overflow-wrap: anywhere;
}

[data-sonner-toast] {
  padding: 16px;
  background: var(--normal-bg);
  border: 1px solid var(--normal-border);
  color: var(--normal-text);
  border-radius: var(--border-radius);
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  width: var(--width);
  font-size: 13px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  column-gap: 6px;
  row-gap: 2px;
  align-items: center;
}

[data-sonner-toast]:focus-visible {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(0, 0, 0, 0.2);
}

[data-y-position='top'] [data-sonner-toast] {
  top: 0;
  --y: translateY(-100%);
  --lift: 1;
  --lift-amount: calc(1 * var(--gap));
}

[data-y-position='bottom'] [data-sonner-toast] {
  bottom: 0;
  --y: translateY(100%);
  --lift: -1;
  --lift-amount: calc(var(--lift) * var(--gap));
}

[data-sonner-toast] [data-slot='description'] {
  font-weight: 400;
  line-height: 1.4;
  color: #3f3f3f;
  grid-column: 2;
  grid-row: 2;
}

[data-rich-colors='true'][data-sonner-toast] [data-slot='description'] {
  color: inherit;
}

[data-sonner-toaster][data-sonner-theme='dark'] [data-slot='description'] {
  color: hsl(0, 0%, 91%);
}

[data-sonner-toast] [data-slot='title'] {
  font-weight: 500;
  line-height: 1.5;
  color: inherit;
  grid-column: 2;
  grid-row: 1;
}

[data-sonner-toast] [data-slot='content'] {
  line-height: 1.5;
  color: inherit;
  grid-column: 2;
  grid-row: 1 / -1;
}

[data-sonner-toast] [data-slot='content']:first-child {
  grid-column: 1 / 3;
}

[data-sonner-toast] [data-slot='icon'] {
  display: flex;
  height: 16px;
  width: 16px;
  position: relative;
  justify-content: flex-start;
  align-items: center;
  flex-shrink: 0;
  margin-left: var(--toast-icon-margin-start);
  margin-right: var(--toast-icon-margin-end);
  grid-column: 1;
  grid-row: 1;
}

[data-sonner-toast][data-promise='true'] [data-slot='icon'] > svg {
  opacity: 0;
  transform: scale(0.8);
  transform-origin: center;
  animation: sonner-fade-in 300ms ease forwards;
}

[data-sonner-toast] [data-slot='icon'] > * {
  flex-shrink: 0;
}

[data-sonner-toast] [data-slot='icon'] svg {
  margin-left: var(--toast-svg-margin-start);
  margin-right: var(--toast-svg-margin-end);
}

[data-sonner-toast] [data-slot='title']:first-child {
  grid-column: 1 / 3;
}

[data-sonner-toast] [data-slot='title']:first-child ~ [data-slot='description'] {
  grid-column: 1 / 3;
}

[data-sonner-toast] [data-button] {
  grid-column: 3;
  border-radius: 4px;
  padding-left: 8px;
  padding-right: 8px;
  height: 24px;
  font-size: 12px;
  color: var(--normal-bg);
  background: var(--normal-text);
  margin-left: var(--toast-button-margin-start);
  margin-right: var(--toast-button-margin-end);
  border: none;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: opacity 400ms, box-shadow 200ms;
}

[data-sonner-toast] [data-button]:focus-visible {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.4);
}

[data-sonner-toast] [data-button]:first-of-type {
  margin-left: var(--toast-button-margin-start);
  margin-right: var(--toast-button-margin-end);
}

[data-sonner-toast] [data-button='cancel'] {
  color: var(--normal-text);
  background: rgba(0, 0, 0, 0.08);
}

[data-sonner-toaster][data-sonner-theme='dark'] [data-sonner-toast] [data-button='cancel'] {
  background: rgba(255, 255, 255, 0.3);
}

[data-sonner-toast] [data-slot='close'] {
  position: absolute;
  left: var(--toast-close-button-start);
  right: var(--toast-close-button-end);
  top: 0;
  height: 20px;
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  color: var(--normal-text);
  background: var(--normal-bg);
  border: 1px solid var(--normal-border);
  transform: var(--toast-close-button-transform);
  border-radius: 50%;
  cursor: pointer;
  z-index: 1;
  transition: opacity 100ms, background 200ms, border-color 200ms;
}

[data-sonner-toast] [data-slot='close']:focus-visible {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(0, 0, 0, 0.2);
}


[data-sonner-toast]:hover [data-slot='close']:hover {
  background: var(--gray2);
  border-color: var(--gray5);
}

[data-sonner-toast][data-swipe='active']::before {
  content: '';
  position: absolute;
  left: -100%;
  right: -100%;
  height: 100%;
  z-index: -1;
}

[data-y-position='top'] [data-sonner-toast][data-swipe='active']::before {
  bottom: 50%;
  transform: scaleY(3) translateY(50%);
}

[data-y-position='bottom'] [data-sonner-toast][data-swipe='active']::before {
  top: 50%;
  transform: scaleY(3) translateY(-50%);
}

[data-sonner-toast][data-state='removing']:not([data-swipe='active'])::before {
  content: '';
  position: absolute;
  inset: 0;
  transform: scaleY(2);
}

[data-sonner-toast][data-expanded='true']::after {
  content: '';
  position: absolute;
  left: 0;
  height: calc(var(--gap) + 1px);
  bottom: 100%;
  width: 100%;
}

[data-sonner-toast][data-state='mounted'] {
  --y: translateY(0);
  opacity: 1;
}

[data-sonner-toast][data-expanded='false']:not([data-index='0']) {
  --scale: var(--toasts-before) * 0.05 + 1;
  --y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));
  height: var(--front-toast-height);
}

[data-sonner-toast] > * {
  transition: opacity 400ms;
}

[data-x-position='right'] [data-sonner-toast] {
  right: 0;
}

[data-x-position='left'] [data-sonner-toast] {
  left: 0;
}

[data-sonner-toast][data-expanded='false']:not([data-index='0']) > * {
  opacity: 0;
}

[data-sonner-toast][data-visible='false'] {
  opacity: 0;
  pointer-events: none;
}

[data-sonner-toast][data-state='mounted'][data-expanded='true'] {
  --y: translateY(calc(var(--lift) * var(--offset)));
  height: var(--initial-height);
}

[data-sonner-toast][data-state='removing'][data-index='0']:not([data-swipe='committed']) {
  --y: translateY(calc(var(--lift) * -100%));
  opacity: 0;
}

[data-sonner-toast][data-state='removing']:not([data-index='0']):not([data-swipe='committed'])[data-expanded='true'] {
  --y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));
  opacity: 0;
}

[data-sonner-toast][data-state='removing']:not([data-index='0']):not([data-swipe='committed'])[data-expanded='false'] {
  --y: translateY(40%);
  opacity: 0;
  transition: transform 500ms, opacity 200ms;
}

[data-sonner-toast][data-state='removing']:not([data-index='0'])::before {
  height: calc(var(--initial-height) + 20%);
}

[data-sonner-toast][data-swipe='active'] {
  transform: var(--y) translateY(var(--swipe-amount-y, 0px)) translateX(var(--swipe-amount-x, 0px));
  transition: none;
  -webkit-user-select: none;
  user-select: none;
}

[data-y-position='bottom'] [data-sonner-toast][data-swipe='committed'],
[data-y-position='top'] [data-sonner-toast][data-swipe='committed'] {
  animation-duration: 200ms;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}

[data-sonner-toast][data-swipe='committed'][data-swipe-direction='left'] {
  animation-name: swipe-out-left;
}

[data-sonner-toast][data-swipe='committed'][data-swipe-direction='right'] {
  animation-name: swipe-out-right;
}

[data-sonner-toast][data-swipe='committed'][data-swipe-direction='up'] {
  animation-name: swipe-out-up;
}

[data-sonner-toast][data-swipe='committed'][data-swipe-direction='down'] {
  animation-name: swipe-out-down;
}

@keyframes swipe-out-left {
  from {
    transform: var(--y) translateX(var(--swipe-amount-x));
    opacity: 1;
  }
  to {
    transform: var(--y) translateX(calc(var(--swipe-amount-x) - 100%));
    opacity: 0;
  }
}

@keyframes swipe-out-right {
  from {
    transform: var(--y) translateX(var(--swipe-amount-x));
    opacity: 1;
  }
  to {
    transform: var(--y) translateX(calc(var(--swipe-amount-x) + 100%));
    opacity: 0;
  }
}

@keyframes swipe-out-up {
  from {
    transform: var(--y) translateY(var(--swipe-amount-y));
    opacity: 1;
  }
  to {
    transform: var(--y) translateY(calc(var(--swipe-amount-y) - 100%));
    opacity: 0;
  }
}

@keyframes swipe-out-down {
  from {
    transform: var(--y) translateY(var(--swipe-amount-y));
    opacity: 1;
  }
  to {
    transform: var(--y) translateY(calc(var(--swipe-amount-y) + 100%));
    opacity: 0;
  }
}

@media (max-width: 600px) {
  [data-sonner-toaster] {
    position: fixed;
    right: var(--mobile-offset-right);
    left: var(--mobile-offset-left);
    width: 100%;
  }

  [data-sonner-toaster][dir='rtl'] {
    left: calc(var(--mobile-offset-left) * -1);
  }

  [data-sonner-toaster] [data-sonner-toast] {
    left: 0;
    right: 0;
    width: calc(100% - var(--mobile-offset-left) * 2);
  }

  [data-sonner-toaster][data-x-position='left'] {
    left: var(--mobile-offset-left);
  }

  [data-sonner-toaster][data-y-position='bottom'] {
    bottom: var(--mobile-offset-bottom);
  }

  [data-sonner-toaster][data-y-position='top'] {
    top: var(--mobile-offset-top);
  }

  [data-sonner-toaster][data-x-position='center'] {
    left: var(--mobile-offset-left);
    right: var(--mobile-offset-right);
    transform: none;
  }
}

[data-sonner-toaster][data-sonner-theme='light'] {
  --normal-bg: #fff;
  --normal-border: var(--gray4);
  --normal-text: var(--gray12);

  --success-bg: hsl(143, 85%, 96%);
  --success-border: hsl(145, 92%, 87%);
  --success-text: hsl(140, 100%, 27%);

  --info-bg: hsl(208, 100%, 97%);
  --info-border: hsl(221, 91%, 93%);
  --info-text: hsl(210, 92%, 45%);

  --warning-bg: hsl(49, 100%, 97%);
  --warning-border: hsl(49, 91%, 84%);
  --warning-text: hsl(31, 92%, 45%);

  --error-bg: hsl(359, 100%, 97%);
  --error-border: hsl(359, 100%, 94%);
  --error-text: hsl(360, 100%, 45%);
}

[data-sonner-toaster][data-sonner-theme='light'] [data-sonner-toast][data-invert='true'] {
  --normal-bg: #000;
  --normal-border: hsl(0, 0%, 20%);
  --normal-text: var(--gray1);
}

[data-sonner-toaster][data-sonner-theme='dark'] [data-sonner-toast][data-invert='true'] {
  --normal-bg: #fff;
  --normal-border: var(--gray3);
  --normal-text: var(--gray12);
}

[data-sonner-toaster][data-sonner-theme='dark'] {
  --normal-bg: #000;
  --normal-bg-hover: hsl(0, 0%, 12%);
  --normal-border: hsl(0, 0%, 20%);
  --normal-border-hover: hsl(0, 0%, 25%);
  --normal-text: var(--gray1);

  --success-bg: hsl(150, 100%, 6%);
  --success-border: hsl(147, 100%, 12%);
  --success-text: hsl(150, 86%, 65%);

  --info-bg: hsl(215, 100%, 6%);
  --info-border: hsl(223, 43%, 17%);
  --info-text: hsl(216, 87%, 65%);

  --warning-bg: hsl(64, 100%, 6%);
  --warning-border: hsl(60, 100%, 9%);
  --warning-text: hsl(46, 87%, 65%);

  --error-bg: hsl(358, 76%, 10%);
  --error-border: hsl(357, 89%, 16%);
  --error-text: hsl(358, 100%, 81%);
}

[data-sonner-toaster][data-sonner-theme='dark'] [data-sonner-toast] [data-slot='close'] {
  background: var(--normal-bg);
  border-color: var(--normal-border);
  color: var(--normal-text);
}

[data-sonner-toaster][data-sonner-theme='dark'] [data-sonner-toast] [data-slot='close']:hover {
  background: var(--normal-bg-hover);
  border-color: var(--normal-border-hover);
}

[data-rich-colors='true'][data-sonner-toast][data-type='success'] {
  background: var(--success-bg);
  border-color: var(--success-border);
  color: var(--success-text);
}

[data-rich-colors='true'][data-sonner-toast][data-type='success'] [data-slot='close'] {
  background: var(--success-bg);
  border-color: var(--success-border);
  color: var(--success-text);
}

[data-rich-colors='true'][data-sonner-toast][data-type='info'] {
  background: var(--info-bg);
  border-color: var(--info-border);
  color: var(--info-text);
}

[data-rich-colors='true'][data-sonner-toast][data-type='info'] [data-slot='close'] {
  background: var(--info-bg);
  border-color: var(--info-border);
  color: var(--info-text);
}

[data-rich-colors='true'][data-sonner-toast][data-type='warning'] {
  background: var(--warning-bg);
  border-color: var(--warning-border);
  color: var(--warning-text);
}

[data-rich-colors='true'][data-sonner-toast][data-type='warning'] [data-slot='close'] {
  background: var(--warning-bg);
  border-color: var(--warning-border);
  color: var(--warning-text);
}

[data-rich-colors='true'][data-sonner-toast][data-type='error'] {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: var(--error-text);
}

[data-rich-colors='true'][data-sonner-toast][data-type='error'] [data-slot='close'] {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: var(--error-text);
}

.sonner-loading-wrapper {
  --size: 16px;
  height: var(--size);
  width: var(--size);
  position: absolute;
  inset: 0;
  z-index: 10;
}

.sonner-loading-wrapper[data-visible='false'] {
  transform-origin: center;
  animation: sonner-fade-out 0.2s ease forwards;
}

.sonner-spinner {
  position: relative;
  top: 50%;
  left: 50%;
  height: var(--size);
  width: var(--size);
}

.sonner-loading-bar {
  animation: sonner-spin 1.2s linear infinite;
  background: var(--gray11);
  border-radius: 6px;
  height: 8%;
  left: -10%;
  position: absolute;
  top: -3.9%;
  width: 24%;
}

.sonner-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center;
  transition: opacity 200ms, transform 200ms;
}

.sonner-loader[data-visible='false'] {
  opacity: 0;
  transform: scale(0.8) translate(-50%, -50%);
}

@keyframes sonner-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes sonner-fade-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.8);
  }
}

@keyframes sonner-spin {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.15;
  }
}

@media (prefers-reduced-motion) {
  [data-sonner-toast],
  [data-sonner-toast] > *,
  .sonner-loading-bar {
    transition: none !important;
    animation: none !important;
  }
}
`;

// created once and shared across all instances via `adoptedStyleSheets`
let sharedSheet: CSSStyleSheet | null = null;

function getSheet(): CSSStyleSheet {
  if (sharedSheet) return sharedSheet;
  sharedSheet = new CSSStyleSheet();
  sharedSheet.replaceSync(STYLES);
  return sharedSheet;
}

class SonnerToaster extends HTMLElement {
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

  #config: ToasterConfig = { ...DEFAULTS };
  #resolvedTheme: "light" | "dark" = "light";
  #toasts: ToastState[] = [];
  #groups: Map<string, GroupState> = new Map();
  #documentHidden: boolean = false;
  #idCounter: number = 0;
  #sectionEl: HTMLElement | null = null;
  #abortController: AbortController | null = null;
  #connected: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (this.#connected) return;
    this.#connected = true;

    this.#syncAttributesToConfig();

    this.shadowRoot!.adoptedStyleSheets = [getSheet()];

    this.#resolveTheme();

    if (this.#config.dir === "auto" || !this.#config.dir) {
      this.#config.dir = this.#getDocumentDirection() as Direction;
    }

    const pos = this.#getPosition();
    const hotkeyLabel = this.#config.hotkey
      .join("+")
      .replace(/Key/g, "")
      .replace(/Digit/g, "");

    this.#sectionEl = document.createElement("section");
    this.#sectionEl.setAttribute(
      "aria-label",
      `${this.#config.containerAriaLabel} ${hotkeyLabel}`,
    );
    this.#sectionEl.setAttribute("tabindex", "-1");
    this.#sectionEl.setAttribute("aria-live", "polite");
    this.#sectionEl.setAttribute("aria-relevant", "additions text");
    this.#sectionEl.setAttribute("aria-atomic", "false");

    this.shadowRoot!.appendChild(this.#sectionEl);

    this.#getOrCreateGroup(pos);

    this.#abortController = new AbortController();
    const { signal } = this.#abortController;

    document.addEventListener(
      "visibilitychange",
      () => {
        this.#documentHidden = document.hidden;
        for (const t of this.#toasts) {
          const g = this.#groups.get(t.groupKey);
          if (this.#documentHidden) {
            this.#pauseTimer(t);
          } else if (!g?.expanded && !g?.interacting) {
            this.#startTimer(t);
          }
        }
      },
      { signal },
    );

    document.addEventListener(
      "keydown",
      (e) => {
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
              this.shadowRoot!.activeElement === g.listEl ||
              g.listEl.contains(this.shadowRoot!.activeElement)
            ) {
              g.expanded = false;
              break;
            }
          }
          this.#updateAll();
        }
      },
      { signal },
    );

    if (this.#config.theme === "system" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener(
        "change",
        (e) => {
          this.#resolvedTheme = e.matches ? "dark" : "light";
          for (const group of this.#groups.values()) {
            group.listEl.setAttribute(
              "data-sonner-theme",
              this.#resolvedTheme,
            );
          }
        },
        { signal },
      );
    }

    if (!SonnerToaster.instance) {
      SonnerToaster.instance = this;
    }

    if (this.getAttribute("window") !== "false") {
      window.toast = toast as ToastFunction;
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

    // Consume <sonner-toast> children after the page settles visually.
    // The delay prevents toast enter-animations from competing with
    // initial page paint/layout, which causes stutter.
    const delay = this.#config.flushDelay;
    window.addEventListener(
      "load",
      () => setTimeout(() => this.#flushChildMessages(), delay),
      { once: true, signal },
    );
  }

  disconnectedCallback() {
    this.#connected = false;
    for (const t of this.#toasts) {
      if (t.timeout) clearTimeout(t.timeout);
    }
    this.#toasts = [];
    this.#groups.clear();
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
    if (SonnerToaster.instance === this) {
      SonnerToaster.instance = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    this.#applyAttribute(name, newValue);
    if (this.#connected && this.#groups.size > 0) {
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
  }

  static instance: SonnerToaster | null = null;

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

  configure(opts: ConfigureOptions): void {
    if (!opts) return;
    for (const [k, v] of Object.entries(opts)) {
      if (v !== undefined) (this.#config as unknown as Record<string, unknown>)[k] = v;
    }
    // Sync config back to attributes for the ones we observe
    if (opts.position !== undefined) this.setAttribute("position", opts.position);
    if (opts.theme !== undefined) this.setAttribute("theme", opts.theme);
    if (opts.richColors !== undefined) this.toggleAttribute("rich-colors", opts.richColors);
    if (opts.expand !== undefined) this.toggleAttribute("expand", opts.expand);
    if (opts.closeButton !== undefined) this.toggleAttribute("close-button", opts.closeButton);
    if (opts.duration !== undefined) this.setAttribute("duration", String(opts.duration));
    if (opts.gap !== undefined) this.setAttribute("gap", String(opts.gap));
    if (opts.visibleToasts !== undefined) this.setAttribute("visible-toasts", String(opts.visibleToasts));
    if (opts.offset !== undefined) this.setAttribute("offset", typeof opts.offset === "object" ? JSON.stringify(opts.offset) : String(opts.offset));
    // The attributeChangedCallback handles the rest
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

  #syncAttributesToConfig(): void {
    for (const name of SonnerToaster.observedAttributes) {
      const value = this.getAttribute(name);
      if (value !== null) {
        this.#applyAttribute(name, value);
      }
    }
  }

  #applyAttribute(name: string, value: string | null): void {
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
        this.#config.duration = Number.isFinite(n) ? n : DEFAULTS.duration;
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
      case "container-aria-label":
        this.#config.containerAriaLabel = value || DEFAULTS.containerAriaLabel;
        if (this.#sectionEl) {
          const hotkeyLabel = this.#config.hotkey
            .join("+")
            .replace(/Key/g, "")
            .replace(/Digit/g, "");
          this.#sectionEl.setAttribute(
            "aria-label",
            `${this.#config.containerAriaLabel} ${hotkeyLabel}`,
          );
        }
        break;
      case "window":
        if (value === "false") {
          if (window.toast === (toast as unknown)) delete (window as Partial<Window>).toast;
        } else {
          window.toast = toast as ToastFunction;
        }
        break;
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

    const group = {
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
    this.#sectionEl!.appendChild(listEl);
    listEl.showPopover();
    return group;
  }

  #removeGroupIfEmpty(group: GroupState): void {
    const defaultKey = this.#positionKey(this.#getPosition());
    if (group.key === defaultKey) return; // keep default group
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

  // Child message consumption

  #flushChildMessages(): void {
    const children = this.querySelectorAll("sonner-toast");
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

    if (cancel?.label)
      markup += `<button data-button="cancel">${escapeHtml(cancel.label)}</button>`;
    if (action?.label)
      markup += `<button data-button="action">${escapeHtml(action.label)}</button>`;

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
      // Switching to or updating HTML content
      const contentEl = el.querySelector("[data-slot='content']");
      if (contentEl) {
        contentEl.innerHTML = data.html;
      } else {
        // Remove title/description, add content div
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
    // Don't restart a timer that's already running
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

// <sonner-toast> is a data carrier consumed by <sonner-toaster>.
// It never renders anything itself.
class SonnerToast extends HTMLElement {
  connectedCallback() {
    this.style.display = "none";
  }
}

customElements.define("sonner-toaster", SonnerToaster);
customElements.define("sonner-toast", SonnerToast);

function getDefault(): SonnerToaster {
  if (SonnerToaster.instance) return SonnerToaster.instance;
  // Auto-create a toaster if none exists
  const el = document.createElement("sonner-toaster");
  document.body.appendChild(el);
  return SonnerToaster.instance!;
}

interface ToastFunction {
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
  const el = SonnerToaster.instance;
  if (el?.parentNode) el.parentNode.removeChild(el);
};
toast.getToasts = (): Toast[] => getDefault().getToasts();

export { toast, LEVELS };
export default toast;
