# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project attempts to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!--
## [${version}]
### Added - for new features
### Changed - for changes in existing functionality
### Deprecated - for soon-to-be removed features
### Removed - for now removed features
### Fixed - for any bug fixes
### Security - in case of vulnerabilities
[${version}]: https://github.com/joshuadavidthomas/sonner-web-component/releases/tag/v${version}
-->

## [Unreleased]

### Fixed

- Fixed loader spinner being invisible in dark mode by using theme-aware text color instead of hardcoded dark color

## [0.1.3]

### Changed

- Separated toast logic (`SonnerToaster` in `toaster.ts`) from custom element lifecycle (`SonnerToasterElement`/`SonnerToastElement` in `index.ts`)
- Moved CSS from inline template literal to a standalone `styles.css` file

## [0.1.2]

### Fixed

- Setting `duration="Infinity"` on `<sonner-toaster>` now correctly prevents auto-dismissal instead of silently falling back to the default 4000ms

## [0.1.1]

### Fixed

- Action and cancel buttons now render side-by-side instead of stacking vertically

## [0.1.0]

### Added

- `<sonner-toaster>` web component with Shadow DOM encapsulation
- `toast()` API: `success`, `error`, `info`, `warning`, `loading`, `promise`, `dismiss`, `reset`, `destroy`
- Server-rendered `<sonner-toast>` children consumed on page load
- Declarative `data-toast-*` click triggers
- Per-toast position overrides with automatic grouping
- Action and cancel buttons
- Swipe-to-dismiss with configurable directions
- Burst detection: rapid toasts auto-expand the stack
- Light, dark, and system theme support
- Rich colors mode
- RTL support
- Keyboard navigation (hotkey focus, Escape to collapse)
- `prefers-reduced-motion` respected
- Bridges: htmx (`HX-Trigger`), fetch (`X-Toasts` header), Alpine.js (`$toast` magic)

### New Contributors

- Josh Thomas <josh@joshthomas.dev> (maintainer)

[unreleased]: https://github.com/joshuadavidthomas/sonner-web-component/compare/v0.1.3...HEAD
[0.1.0]: https://github.com/joshuadavidthomas/sonner-web-component/releases/tag/v0.1.0
[0.1.1]: https://github.com/joshuadavidthomas/sonner-web-component/releases/tag/v0.1.1
[0.1.2]: https://github.com/joshuadavidthomas/sonner-web-component/releases/tag/v0.1.2
[0.1.3]: https://github.com/joshuadavidthomas/sonner-web-component/releases/tag/v0.1.3
