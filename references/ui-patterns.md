# UI Pattern Reference

Use this reference when a plugin needs a custom surface, preview, confirmation step, progress display, or direct-open behavior.

## Choose the Surface

Use logic-only `script.js` when:

- The action is instant.
- No preview or confirmation is needed.
- The output can be pasted, copied, opened, shared, or shown as a notification.

Use Web UI when:

- Users need forms, options, previews, editing, progress, batch review, or multiple actions.
- The plugin needs to work even when launched with no current selection.

Use native surfaces when:

- The host API provides a native AI response bubble, interactive image card, or image studio flow.
- You want a fast native interaction without building a full HTML UI.

Native surface permissions:

- AI response bubble: `ui`
- Interactive image card: `notifications`
- Native Gemini image studio: `network`

## Direct-Open Behavior

Interactive plugins must be launchable with no selected text or files.

In `isAvailable(context)` return:

```javascript
function isAvailable(context) {
    var hasSelection = Boolean(context && context.selectedText && context.selectedText.trim());
    return { isAvailable: true, isContextMatch: hasSelection };
}
```

Then open the UI and let it initialize with empty input:

```javascript
function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 420,
        height: 520,
        title: "Plugin",
        isFloating: true
    });
}
```

## Web UI Requirements

Every `ui/index.html` should include:

- Viewport meta tag with `maximum-scale=1.0` and `viewport-fit=cover`.
- Dark mode styles.
- Mobile layout for `max-width: 600px`.
- Touch targets at least 44px tall.
- Inputs with at least `font-size: 16px`.
- Loading, empty, success, and error states for non-trivial work.

Use `window.swiftBiu_initialize = function(context) { ... }` to receive selection context.

Use `window.swiftBiu.ui.resizeWindow({ height })` after rendering dynamic content on macOS.

## Minimal Responsive Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <style>
    :root { --card-bg: #ffffff; --text-primary: #1d1d1f; }
    html { background-color: transparent; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
      background-color: var(--card-bg);
      min-height: 100vh;
      margin: 0;
      color: var(--text-primary);
    }
    @media (prefers-color-scheme: dark) {
      :root { --card-bg: #1c1c1e; --text-primary: #f5f5f7; }
    }
    @media (max-width: 600px) {
      body { min-height: 100vh; }
      button, select, input {
        min-height: 44px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <main id="content">Ready</main>
  <script>
    window.swiftBiu_initialize = function(context) {
      document.getElementById("content").textContent = context.selectedText || "Ready";
      window.swiftBiu.ui.resizeWindow({ height: document.body.offsetHeight + 40 });
    };
  </script>
</body>
</html>
```

## API Separation

Background script uses `SwiftBiu`:

- Sync APIs
- Callback-based `SwiftBiu.fetch(...)`
- `SwiftBiu.getConfig(...)`
- No `async/await`

Web UI uses `window.swiftBiu`:

- Promise APIs
- `window.swiftBiu.fetch(...)`
- `window.swiftBiu.storage.get(...)`
- `async/await` is allowed

Never mix these environments.

## Batch Preview UI

For rename, copy, move, overwrite, icon replacement, or Trash workflows:

- Show source path and proposed destination/action.
- Mark conflicts before applying.
- Require explicit confirmation.
- Disable the apply button while work is running.
- Show completed, skipped, and failed counts.

## Native AI and Image Surfaces

Use native AI response bubble for generated text workflows that need preview, regenerate, replace, append, or copy.

Use interactive image card for generated image workflows that need preview and regenerate without a full Web UI.

Use native Gemini image studio only for Gemini image workflows and only when the plugin has a documented provider setup and `network` permission.
