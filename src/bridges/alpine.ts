/**
 * Alpine.js bridge
 *
 * Registers the $toast magic:
 *   $toast("Hello")
 *   $toast.success("Saved!")
 *   $toast.error("Failed.")
 *   $toast.warning("Careful.")
 *   $toast.info("FYI.")
 *   $toast.loading("Working...")
 *   $toast.promise(fetch("/api"), { loading: "...", success: "Done!", error: "Failed." })
 *   $toast.dismiss(id)
 *   $toast.dismiss()  // dismiss all
 */
import { toast } from "../index.js"
import type { ToastOptions, PromiseData } from "../index.js"

declare global {
  interface Window {
    Alpine: {
      magic: (name: string, callback: () => unknown) => void;
    };
  }
}

interface ToastMagic {
  (msg: string, data?: ToastOptions): number;
  success: (msg: string, data?: ToastOptions) => number;
  info: (msg: string, data?: ToastOptions) => number;
  warning: (msg: string, data?: ToastOptions) => number;
  error: (msg: string, data?: ToastOptions) => number;
  loading: (msg: string, data?: ToastOptions) => number;
  promise: <T>(promise: Promise<T> | (() => Promise<T>), data: PromiseData<T>) => number | undefined;
  dismiss: (id?: number) => number | undefined | null;
}

document.addEventListener('alpine:init', function () {
  window.Alpine.magic('toast', function (): ToastMagic {
    const fn = function (msg: string, data?: ToastOptions) { return toast(msg, data) } as ToastMagic
    fn.success = function (msg: string, data?: ToastOptions) { return toast.success(msg, data) }
    fn.info = function (msg: string, data?: ToastOptions) { return toast.info(msg, data) }
    fn.warning = function (msg: string, data?: ToastOptions) { return toast.warning(msg, data) }
    fn.error = function (msg: string, data?: ToastOptions) { return toast.error(msg, data) }
    fn.loading = function (msg: string, data?: ToastOptions) { return toast.loading(msg, data) }
    fn.promise = function <T>(promise: Promise<T> | (() => Promise<T>), data: PromiseData<T>) { return toast.promise(promise, data) }
    fn.dismiss = function (id?: number) { return toast.dismiss(id) }
    return fn
  })
})
