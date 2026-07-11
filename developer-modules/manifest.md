# Manifest and Plugin Action Types

> [!NOTE]
> **Use this page to choose the plugin structure first.**
> - `identifier` must be globally unique so an installation cannot overwrite another plugin.
> - Standard Actions run in the background `script.js` sandbox. Web App Actions run in the isolated `ui/index.html` frontend sandbox.
> - Configuration, background APIs, native workflows, Web UI APIs, and compatibility now have dedicated reference pages.

## Two Types of Plugin Actions

SwiftBiu supports two plugin architectures. The following currency-converter example shows when to use each one.

### 1. Standard Action (Logic-Only)

**Example:** `CurrencyConverterLite`

Use this for API calls, text extraction, calculations, and other background work that does not require a custom interface. Return results through native capabilities such as notifications, clipboard actions, or direct paste.

#### `manifest.json`

```json
"actions": [
  {
    "title": "Lite: Convert Currency",
    "script": "script.js"
  }
]
```

#### `script.js`

A background action implements two hooks:

- `isAvailable(context)`: decides whether the action is available and whether it should be prioritized with `isContextMatch: true`.
- `performAction(context)`: runs the action and returns the result through host APIs.

```javascript
function performAction(context) {
    // ... fetch rates and calculate ...
    const result = "720 CNY";
    SwiftBiu.copyText(result);
    SwiftBiu.showNotification("Success", `Copied: ${result}`);
}
```

### 2. Web App Action (Custom UI)

**Example:** `CurrencyConverter`

Use this for forms, complex interaction, animation, or a complete visual interface. The plugin packages HTML, CSS, and JavaScript as a small Web App.

#### `manifest.json`

```json
"actions": [
  {
    "title": "Pro: Currency Panel",
    "script": "script.js"
  }
],
"ui": {
  "main": "ui/index.html"
}
```

#### Launch Flow and Sandbox Isolation

First, launch the page from the background script:

```javascript
function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 320,
        height: 480
    });
}
```

Then receive context inside the page:

```javascript
window.swiftBiu_initialize = async function (context) {
    const text = context.selectedText || "";
    const selectedFiles = context.selectedFiles || [];
    console.log("User selected:", text);
};
```

> [!IMPORTANT]
> Background `SwiftBiu` and frontend `window.swiftBiu` belong to different sandboxes. Their APIs are not interchangeable.

## `manifest.json` Reference

`manifest.json` is the plugin's identity and capability declaration.

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | String | Yes | Globally unique ID such as `com.yourname.plugin`. Duplicate identifiers overwrite existing plugins. |
| `name` | String | Yes | Display name. |
| `author` | String | Yes | Plugin author. |
| `description` | String | Yes | Short plugin description. |
| `version` | String | Yes | Version such as `1.0`. |
| `actions` | Array | Yes | Actions provided by the plugin. Currently one action is supported. |
| `icon` | String | No | Root icon. Supports SF Symbols, image files, text, Iconify, and `data:` URIs. |
| `iconType` | String | No | `sfSymbol`, `file`, `text`, `iconify`, or `data`. |
| `configuration` | Array | No | User-editable settings. |
| `permissions` | Array | No | Required host and system capabilities. |

## Plugin Icon Formats

### SF Symbol

```json
{
  "icon": "sparkles",
  "iconType": "sfSymbol"
}
```

When `iconType` is omitted and the value does not look like an image filename, SwiftBiu treats it as an SF Symbol.

### Packaged Image File

Supported formats include `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.tif`, `.tiff`, `.heic`, `.icns`, `.pdf`, and `.svg`.

```json
{
  "icon": "icon.png",
  "iconType": "file"
}
```

Prefer transparent assets and provide a high-resolution source such as `64x64` or `128x128`.

### Text Icon

```json
{
  "icon": "AI",
  "iconType": "text"
}
```

The explicit prefix form is also supported:

```json
{
  "icon": "text:AI"
}
```

Up to two visible characters are rendered. Alphanumeric content is automatically uppercased.

### Iconify Icon

```json
{
  "icon": "solar:flag-bold",
  "iconType": "iconify"
}
```

Or use the explicit prefix:

```json
{
  "icon": "iconify:solar:flag-bold"
}
```

### Data URI Icon

```json
{
  "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "iconType": "data"
}
```

This is useful for generated icons or packages that should not ship a separate image asset.

### Parsing Rules and Recommendations

- Explicit prefixes take priority over `iconType`.
- For released plugins, prefer a clean Iconify name with `iconType: "iconify"`.
- Keep file icons inside the plugin package and reference them by filename.
- Keep text icons short so they remain balanced in toolbars and lists.
- Prefer vectors, transparent backgrounds, optical padding, and high contrast at 18–24px sizes.

## Continue Reading

- [Configuration](configuration.md): settings, defaults, and documented convention keys.
- [Background SwiftBiu API](background-api.md): host capabilities available to `script.js`.
- [Native Workflows](native-workflows.md): file task panel and AI response bubble.
- [Web UI API](web-ui-api.md): `window.swiftBiu`, window lifecycle, and file interaction.
- [Cross-Platform Compatibility](compatibility.md): macOS, iOS, and App Store sandbox behavior.
- [Permissions](permissions.md): declare the minimum permissions for these capabilities.
