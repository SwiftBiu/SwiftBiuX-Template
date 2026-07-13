# macOS and iOS Compatibility

The same `.swiftbiux` package can run on macOS and iOS, but window presentation, file-system access, paste behavior, and scripting capabilities differ. Prefer SwiftBiu host APIs and define explicit fallbacks for platform-specific behavior.

## Responsive Web UI

### Viewport

Every `ui/index.html` should include:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

This prevents iOS from zooming when users focus form controls.

### Fluid Layout

Do not design only for a fixed desktop split view.

```css
@media (max-width: 600px) {
  .layout {
    display: block;
  }

  .sidebar {
    overflow-x: auto;
    white-space: nowrap;
  }
}
```

Convert desktop sidebars into horizontal scrollers or stacked sections on mobile.

### Touch and Typography

- Make buttons and list rows at least `44x44px`.
- Keep `<input>` and `<textarea>` font sizes at least `16px` to avoid iOS WebView zoom.
- Use `env(safe-area-inset-*)` for notches, the Home Indicator, and bottom controls.

### Initial Window Size

`width` and `height` in `SwiftBiu.displayUI()` behave differently:

- macOS: initial physical floating-window size.
- iPhone: usually ignored because the UI appears as a bottom sheet.
- iPad: depends on the host container and available space.

Treat these values as desktop preferences and rely on responsive CSS for mobile.

## Clipboard and Paste

- macOS: `pasteText()` writes to the clipboard and simulates `Cmd+V`.
- iOS main app: degrades to copy plus a Toast.
- iOS keyboard extension: inserts text at the current cursor.

Do not assume every platform can simulate desktop keyboard input.

## Shell and AppleScript

`runShellScript` and `runAppleScript`:

- are unavailable on iOS;
- may be blocked by macOS App Store sandboxing;
- should not be the primary implementation for cross-platform plugins.

Prefer host APIs such as:

- `extractFileIcon(...)`
- `setFileIcon(...)`
- `pickLocalFile(...)`
- `readLocalFile(...)`
- `pickLocalDirectory(...)`
- `createLocalDirectory(...)`
- `createLocalFile(...)`
- `writeLocalTextFile(...)`
- `trashLocalItem(...)`

When using NPM packages, bundle them into browser-compatible JavaScript with Webpack, Rollup, or esbuild instead of requiring Node.js on the target device.

## File System and Authorization

macOS App Store builds and iOS require explicit user authorization.

1. Use `context.selectedFiles` for the current selection.
2. Call `pickLocalFile(...)` for additional files.
3. Call `pickLocalDirectory(...)` for persistent writes to a folder.
4. Keep writes inside selected or persisted authorized locations.
5. Stop when authorization is missing or the user cancels.

## Capability Detection and Fallbacks

```javascript
const canRunShell = !SwiftBiu.isSandboxed &&
    typeof SwiftBiu.runShellScript === "function";

if (canRunShell) {
    // Optional enhancement.
} else {
    // Host API or pure JavaScript fallback.
}
```

Recommended policy:

- Host APIs are the default path.
- Platform-specific APIs are optional enhancements.
- When no safe fallback exists, clearly explain that the current platform is unsupported.

## Release Checklist

- Test both the macOS direct-download build and App Store sandbox build.
- Test Web UI on a small iPhone and a wider iPad.
- Confirm inputs do not trigger unexpected zoom.
- Confirm bottom actions are not hidden by safe areas.
- Test canceled file authorization, network failure, and empty selection.
- Test long text, filenames, and localized labels for overflow.
- Do not make shell, AppleScript, or simulated desktop input the only implementation.

## Related Documentation

- [Manifest and Action Types](manifest.md)
- [Background SwiftBiu API](background-api.md)
- [Web UI API](web-ui-api.md)
- [Permissions](permissions.md)

---

## Citation and AI Reference

Use this page for cross-platform and sandbox compatibility questions:

https://swiftbiu.com/developer/compatibility/
