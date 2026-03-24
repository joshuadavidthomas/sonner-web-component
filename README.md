# Sonner Web Component

A web component port of [Sonner](https://sonner.emilkowal.ski/). No framework required — use it with Django, Rails, Laravel, htmx, Alpine.js, or plain HTML.

## Installation

Add the script tag to your page:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/index.js"></script>
```

Or install via npm with your preferred package manager:

```bash
npm install sonner-web-component
```

## Getting Started

Add `<sonner-toaster>` to your page.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/index.js"></script>

<sonner-toaster></sonner-toaster>
```

Render a toast.

```html
<script type="module">
  import { toast } from "https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/index.js"
  toast("Hello!")
</script>
```

## Usage

There are three ways to create toasts: server-rendered HTML, declarative `data-toast-*` attributes, and the JavaScript `toast()` API. `window.toast` is set by default, or you can `import { toast }` from the module.

### Toaster

`<sonner-toaster>` is the custom element that manages and renders all toasts. Place it once on your page — everything else builds on it. Configure it with attributes.

```html
<sonner-toaster position="top-center" theme="dark" rich-colors close-button></sonner-toaster>
```

Or from JavaScript:

```js
toast.configure({ duration: 5000, position: "top-center" })
```

Each toaster renders into its own [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM). Styles are fully encapsulated — they won't leak into your page and your page's styles won't affect toasts.

#### Multiple toasters

You can place multiple `<sonner-toaster>` elements on a page, each with its own configuration. The global `toast()` API targets the first one — to reach others, call `.add()` on the element directly.

```html
<sonner-toaster id="alerts" position="top-center" theme="dark"></sonner-toaster>
<sonner-toaster id="notifications" position="bottom-right"></sonner-toaster>

<script type="module">
  document.getElementById("alerts").add("error", "Something went wrong.")
</script>
```

#### API reference

| Attribute | Type | Default | Description |
|---|---|---|---|
| `position` | `string` | `bottom-right` | `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` |
| `theme` | `string` | `system` | `light`, `dark`, `system` |
| `rich-colors` | `boolean` | `false` | Colored backgrounds based on toast type |
| `expand` | `boolean` | `false` | Expand toasts by default |
| `close-button` | `boolean` | `false` | Show close button on toasts |
| `invert` | `boolean` | `false` | Invert default colors |
| `duration` | `number` | `4000` | Auto-dismiss duration in ms |
| `gap` | `number` | `14` | Gap between toasts in px |
| `visible-toasts` | `number` | `3` | Max visible toasts in stack |
| `offset` | `string \| number \| object` | `24px` | Distance from viewport edge |
| `mobile-offset` | `string \| number \| object` | `16px` | Distance from viewport edge on mobile |
| `dir` | `string` | `ltr` | Text direction (`ltr`, `rtl`, `auto`) |
| `window` | `boolean` | `true` | Set `window.toast` globally. Use `window="false"` to opt out |
| `flush-delay` | `number` | `200` | Delay in ms before consuming `<sonner-toast>` children after page load |
| `burst-window` | `number` | `500` | Time window in ms — toasts arriving within this interval auto-expand the stack |
| `burst-linger` | `number` | `3000` | How long in ms the stack stays expanded after a burst before collapsing |

The element also exposes methods for creating and managing toasts directly. Use these to target a specific toaster when you have more than one.

| Method | Description |
|---|---|
| `.add(level, message, options?)` | Create a toast. `level` is `"success"`, `"error"`, `"info"`, `"warning"`, `"loading"`, or `""` |
| `.dismiss(id?)` | Dismiss one toast by ID, or all |
| `.promise(promise, data)` | Create a promise toast |
| `.configure(opts)` | Update configuration |
| `.reset()` | Clear all toasts |
| `.getToasts()` | Get all active toasts |

### Server-rendered

Nest `<sonner-toast>` elements inside `<sonner-toaster>`. They display as toasts on page load. Works with any templating language.

```html
<sonner-toaster>
  <sonner-toast level="success">Item saved.</sonner-toast>
  <sonner-toast level="error">Something went wrong.</sonner-toast>
</sonner-toaster>
```

### Declarative Triggers

Elements with `data-toast-*` attributes trigger toasts on click.

```html
<button data-toast-success="Saved!">Save</button>
<button data-toast-error="Failed." data-toast-description="Please try again.">Delete</button>
```

### Toast JavaScript API

You can call it with just a string, or provide an options object as the second argument.

```js
toast("Hello!")
toast("Hello!", { description: "This is a description.", duration: 5000 })
```

#### Position

Override the toaster's default position on a per-toast basis. The toaster creates a separate group for each position.

```js
toast.success("Saved!", { position: "top-center" })
toast.error("Failed.", { position: "bottom-right" })
```

#### Types

Each type renders a corresponding icon.

```js
toast.success("Saved!")
toast.error("Something went wrong.")
toast.info("FYI.")
toast.warning("Careful.")
toast.loading("Working...")
```

#### Action and cancel buttons

Action renders a primary button, cancel renders a secondary button. Cancel always closes the toast. Action closes the toast unless you call `event.preventDefault()` in the `onClick` callback.

```js
toast("File deleted", {
  action: { label: "Undo", onClick: () => restore() },
  cancel: { label: "Dismiss", onClick: () => {} },
})
```

#### Promise

Starts in a loading state and updates automatically after the promise resolves or fails. You can pass a function to the success/error messages to use the result.

```js
toast.promise(fetch("/api/save"), {
  loading: "Saving...",
  success: "Saved!",
  error: "Failed to save.",
})
```

#### Dismiss

Each toast returns an ID you can use to dismiss it. Call without an ID to dismiss all toasts.

```js
const id = toast.success("Saved!")
toast.dismiss(id)  // dismiss one
toast.dismiss()    // dismiss all
```

#### Reset

Clears all toasts but keeps the toaster on the page.

```js
toast.reset()
```

#### Destroy

Removes the toaster element from the DOM entirely. A new one is created automatically on the next `toast()` call.

```js
toast.destroy()
```

#### Get toasts

Returns all active toasts.

```js
toast.getToasts()
```

#### API reference

| Option | Type | Default | Description |
|---|---|---|---|
| `description` | `string` | `-` | Secondary text below the title |
| `duration` | `number` | `4000` | Auto-dismiss time in ms (`Infinity` to persist) |
| `dismissible` | `boolean` | `true` | Whether the toast can be swiped/dismissed |
| `richColors` | `boolean` | toaster default | Colored backgrounds based on toast type |
| `closeButton` | `boolean` | toaster default | Show close button on this toast |
| `invert` | `boolean` | toaster default | Invert default colors for this toast |
| `position` | `string` | `bottom-right` | Override position for this toast |
| `id` | `number` | `-` | Reuse an ID to update an existing toast |
| `html` | `string` | `-` | Raw HTML content (trusted content only) |
| `action` | `{ label, onClick }` | `-` | Action button |
| `cancel` | `{ label, onClick }` | `-` | Cancel button |
| `onDismiss` | `function` | `-` | Called when dismissed by user |
| `onAutoClose` | `function` | `-` | Called when dismissed by timer |

### Bridges

Bridges connect Sonner Web Component to other libraries. Each bridge is a side-effect import — add the script tag and it wires itself up. No configuration needed.

#### htmx

The htmx bridge listens for `toast` events on `document`, which is how htmx dispatches events from the [`HX-Trigger`](https://htmx.org/headers/hx-trigger/) response header (they bubble up from `document.body`). Set the header on any htmx response and toasts appear automatically.

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.x.x/dist/htmx.min.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/index.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/bridges/htmx.js"></script>

<sonner-toaster></sonner-toaster>

<button hx-post="/save" hx-swap="none">Save</button>
```

Your server sets the `HX-Trigger` response header with a `toast` event:

```http
HTTP/1.1 200 OK
HX-Trigger: {"toast": {"level": "success", "message": "Saved!"}}
```

Multiple toasts can be sent at once:

```http
HTTP/1.1 200 OK
HX-Trigger: {"toast": [{"level": "success", "message": "Saved!"}, {"level": "info", "message": "Notified team."}]}
```

#### fetch

The fetch bridge lets your server trigger toasts from any `fetch` call — form submissions, API requests, or anything else that uses `fetch`. It also works as a way to connect an SPA to a server-rendered page that hosts the toaster. It monkey-patches `window.fetch` to read the `X-Toasts` header from every response. If the header is present, the toasts are rendered automatically.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/index.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/bridges/fetch.js"></script>

<sonner-toaster></sonner-toaster>

<script type="module">
  // toasts from the response header appear automatically
  const response = await fetch("/api/save", { method: "POST" })
</script>
```

Your server includes the `X-Toasts` response header:

```http
HTTP/1.1 200 OK
X-Toasts: [{"level": "success", "message": "Saved!"}]
```

The `level` field accepts `"success"`, `"info"`, `"warning"`, or `"error"`. The response body is unaffected — the bridge only reads the header.

#### Alpine.js

The Alpine.js bridge registers a `$toast` [magic](https://alpinejs.dev/magics) that exposes the full toast API inside Alpine expressions.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/index.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/sonner-web-component@0.1.3/dist/bridges/alpine.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>

<sonner-toaster></sonner-toaster>

<div x-data>
  <button @click="$toast.success('Saved!')">Save</button>
  <button @click="$toast.error('Failed.')">Delete</button>
  <button @click="$toast('Hello!', { description: 'A plain toast.' })">Toast</button>
</div>
```

The `$toast` magic supports all the same methods: `$toast.success()`, `$toast.error()`, `$toast.info()`, `$toast.warning()`, `$toast.loading()`, `$toast.promise()`, and `$toast.dismiss()`.

## License

Sonner Web Component is licensed under the MIT license. See the [`LICENSE`](LICENSE) file for more information.

Sonner is licensed under the MIT license and is Copyright (c) 2023 Emil Kowalski.
