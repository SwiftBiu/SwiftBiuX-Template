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
| `actions` | Array | Yes | Actions provided by the plugin. Each action can have its own extension kind and AI configuration. |
| `icon` | String | No | Root icon. Supports SF Symbols, image files, Lottie JSON, text, Iconify, and `data:` URIs. |
| `iconType` | String | No | `sfSymbol`, `file`, `lottie`, `text`, `iconify`, or `data`. |
| `iconLottieStillFrame` | String or Number | No | Resting frame for a Lottie icon: `"first"`, `"last"`, or a frame number. |
| `iconScale` | Number | No | Icon scale. SwiftBiu normalizes it to the supported `0.5`–`2.0` range. |
| `extensionKind` | String | Yes | `textAction` or `fileAction`. Also declare it on every action. |
| `configuration` | Array | No | User-editable settings. |
| `permissions` | Array | No | Required host and system capabilities. |
| `requiredShortcuts` | Array | No | Apple Shortcuts required by legacy AppleScript/Shortcut bridges. |
| `ui` | Object | No | Web UI entry point, currently `{ "main": "ui/index.html" }`. |
| `shareTargets` | Array | No | Declarative native sharing targets. Actions may be empty when the plugin only exposes share targets. |
| `network` | Object | No | Declared outbound domains and their purpose/data/credential metadata. |
| `ai` | Object | No | SwiftBiu-managed AI use case, provider/model configuration keys, and optional provider allowlist. |

Each action can declare `title`, `icon`, `description`, `script`, `appleScriptFile`, `shellScriptFile`, `requiredShortcut`, `rules.regex`, `supportedFileExtensions`, `extensionKind`, and `ai`. An action-level `ai` declaration replaces the root `ai` declaration for that action.

### SwiftBiu-Managed AI Metadata

```json
{
  "ai": {
    "useCase": "chat",
    "providerKey": "chatProvider",
    "modelKey": "chatModel",
    "allowedProviders": ["codex", "custom-endpoint"]
  }
}
```

- `useCase`: `chat` / `textGeneration`, `imageGeneration`, `vision`, `videoGeneration`, `tts`, or `stt`. `role` is a compatible alias.
- `providerKey` and `modelKey`: configuration keys that SwiftBiu renders as native provider/model pickers.
- `allowedProviders`: optional provider-only allowlist. SwiftBiu filters the picker and validates every native AI proxy request again at runtime.
- Provider-specific plugins should keep the same allowlist in each action-level `ai` override. Add `custom-endpoint` only when the extension's actual protocol is compatible.

See [Configuration](configuration.md) and the [SwiftBiu-managed AI contract](../references/native-ai.md) for examples and API mapping.

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

### Lottie Dynamic Icon

Package the Lottie JSON in the extension and reference it from the manifest:

```json
{
  "icon": "spark-motion.json",
  "iconType": "lottie",
  "iconLottieStillFrame": "first",
  "iconScale": 1.1
}
```

`iconLottieStillFrame` accepts `"first"`, `"last"`, or a numeric frame. `iconScale` is normalized to `0.5`–`2.0`. In SwiftBiu, the user can choose whether dynamic toolbar icons animate on hover or play automatically; a static icon remains still, which preserves a clear visual contrast.

<div class="swiftbiu-native-demo" data-demo-start="icons" data-demo-modes="icons"></div>

### Parsing Rules and Recommendations

- Explicit prefixes take priority over `iconType`.
- For released plugins, prefer a clean Iconify name with `iconType: "iconify"`.
- Keep file icons inside the plugin package and reference them by filename.
- Keep text icons short so they remain balanced in toolbars and lists.
- Prefer vectors, transparent backgrounds, optical padding, and high contrast at 18–24px sizes.

## Reviewable Source Sharing in 1.3.9

SwiftBiu uses two related package formats:

| Format | Purpose |
| --- | --- |
| `.swiftbiux` | Installable plugin archive |
| `.swiftbiuxs` | Reviewable UTF-8 source container for saving, system sharing, and read-only iCloud links |

From **Installed Extensions**, the user can export an extension with **Save to File…**, **Share…**, or **Copy iCloud Link**. SwiftBiu combines the manifest, scripts, UI, and assets into one sealed source document, records per-file and bundle SHA-256 integrity data, and excludes saved configuration and credentials.

The recipient reviews the plugin name, author, version, files, requested permissions, and integrity state before confirming installation. An iCloud link transports the sealed source; it does not bypass validation or execute remote code.

<div class="swiftbiu-native-demo" data-demo-start="sharing" data-demo-modes="sharing"></div>

## Continue Reading

- [Configuration](configuration.md): settings, defaults, and documented convention keys.
- [Background SwiftBiu API](background-api.md): host capabilities available to `script.js`.
- [Native Workflows](native-workflows.md): file task panel and AI response bubble.
- [Web UI API](web-ui-api.md): `window.swiftBiu`, window lifecycle, and file interaction.
- [Cross-Platform Compatibility](compatibility.md): macOS, iOS, and App Store sandbox behavior.
- [Permissions](permissions.md): declare the minimum permissions for these capabilities.
