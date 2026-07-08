---
name: swiftbiux-plugin-development
description: Use when creating, modifying, or reviewing SwiftBiuX extensions (plugins) for SwiftBiu. Covers plugin type selection, local-vs-network/API decisions, manifest permissions, JavaScript environments, file workflows, Web UI, and App Store-compatible implementation rules.
---

# SwiftBiuX Extension Development Skill

Use this skill when creating or modifying SwiftBiuX plugins. Plugin code can be created in any workspace directory the user prefers.

## How to Use This Skill

Read this file first for the core workflow, manifest contract, permission mapping, and runtime API rules. Do not load every reference by default. Use `ai/docs-index.json` as the routing map when you need to decide which extra document to load.

Load the smallest reference that matches the user's request:

- `references/scenarios.md`: when the user describes a plugin idea in plain language and needs the right plugin type, prompt shape, or examples.
- `references/manifest-basics.md`: when the task only needs the minimal `manifest.json` contract, `extensionKind`, action wiring, or basic permission mapping.
- `references/manifest-icons.md`: when the task only needs to choose or explain plugin icon formats.
- `references/file-workflows.md`: when the plugin reads, creates, updates, renames, copies, moves, saves, opens, or trashes local files.
- `references/network-api-checklist.md`: when the plugin uses AI, translation, image generation, live web data, company APIs, or any third-party service.
- `references/ui-patterns.md`: when the plugin needs a Web UI, preview panel, settings-like form, progress view, native AI/image surface, or direct-open behavior.
- `references/configuration.md`: when the plugin needs settings, API keys, option fields, file-extension app rules, packaging, or catalog entries.
- `developer-modules/debugging.md`: when the user reports build, installation, runtime, logging, or Web Inspector problems.

## Generation Decision Flow

Before writing plugin files, classify the request in this order:

1. **User input**: selected text, selected local files, selected remote files, clipboard, manual UI input, or share target.
2. **Result source**: local rules, SwiftBiu host API, third-party API, or AI/API. File reading, text editing, and UI display do not automatically require network access.
3. **Interaction surface**: logic-only `script.js`, Web UI with `ui/index.html`, declarative `shareTargets`, native AI/image surface, or Apple Shortcuts bridge.
4. **Extension kind**: `textAction` for text-first workflows, `fileAction` for file-first workflows. If both text and files may appear, file-like data wins.
5. **Output**: paste, copy, show notification, display UI, save file, open file, share, move/copy, rename, or move to Trash.
6. **Permissions**: declare the minimal permissions matching the APIs used. Do not add broad permissions just in case.

### UI Surface Rule

Prefer logic-only `script.js` plugins by default. Do not create a Rich Web App just because the plugin is "AI-assisted" or processes files.

Use a Rich Web App only when the request genuinely needs preview, editable forms, batch confirmation, progress dashboards, complex result panels, or a persistent interactive surface. If a pure JS action can finish the job with paste/copy/notification/save/open, keep it pure JS.

### Local-First Rule

Prefer local implementation when the task can be solved by deterministic rules:

- Text cleanup, case conversion, slug creation, JSON/CSV/Markdown formatting, regex extraction, hash/base64 conversion.
- File metadata reports, word/line counts, heading extraction, CSV row/column counts, JSON key inspection, batch rename previews, copy/move organization, template file creation.
- App icon extraction/replacement and open-with rules through SwiftBiu host APIs.

Do not call network or AI APIs for these unless the user explicitly asks for semantic understanding, generation, translation, remote lookup, or a third-party service.

### External API Documentation Gate

If a request needs AI rewriting, AI summarization, translation, image generation, live web lookup, or integration with a service such as OpenAI, Gemini, DeepL, Notion, GitHub, Slack, Feishu, or an internal company API:

- Ask for or use provided API documentation before implementing provider-specific calls.
- Do not invent endpoint URLs, request bodies, model names, auth headers, rate-limit rules, or response schemas.
- Put secrets in `manifest.json` `configuration` entries with `"type": "secure"` and read them through `SwiftBiu.getConfig(...)` or `window.swiftBiu.storage.get(...)`.
- Add `network` permission only when `SwiftBiu.fetch(...)` or `window.swiftBiu.fetch(...)` is used.
- If the request could be local or network-based, state the assumption in code comments or user-facing setup notes and choose local unless external semantics are required.

### Safety and Consent Rules

- Never permanently delete user files. Use `trashLocalItem(...)` after a preview and confirmation step.
- For batch file changes, show a before/after preview and handle name conflicts, skipped files, and partial failures.
- For writes outside selected files, ask the user to choose or authorize a destination with `pickLocalDirectory(...)`, `pickLocalFile(...)`, or `requestDirectoryAuthorization(...)`.
- For App Store-compatible plugins, prefer SwiftBiu host APIs over shell, AppleScript, `osascript`, `sips`, `qlmanage`, Node, or Python.
- UI plugins must work with no selected text because users can open them directly from the extension list.

## Before-Code Checklist

Before returning plugin code, verify:

- `manifest.json` includes root `extensionKind` and every `actions[].extensionKind`.
- Permissions exactly match the APIs used.
- Network/AI plugins include secure API key configuration and do not hard-code secrets.
- `script.js` uses callbacks for `SwiftBiu.fetch(...)` and does not use `async/await` or modern JS features unsupported by JavaScriptCore.
- Web UI code uses `window.swiftBiu`, may use `async/await`, includes the viewport meta tag, supports dark mode and mobile touch targets, and calls `swiftBiu.ui.resizeWindow(...)` when needed.
- File plugins distinguish `context.selectedFiles` from `context.selectedRemoteFiles`.
- File write/delete flows preview changes, request authorization when needed, and use Trash for deletion.
- Generated files are complete: `manifest.json`, `script.js`, optional `ui/index.html`, optional bundled assets, and any catalog entry only if the user asked to publish.
- If working inside the SwiftBiuX template repository or another workspace that has a packaging script, package the finished plugin into a `.swiftbiux` file automatically. If packaging is not possible in the current environment, provide the exact manual packaging command instead of a vague explanation.

## Installation & Development Workflow

If you are an AI code assistant, you do not need to run npm. Generate complete plugin files directly in the user's workspace:

- `manifest.json`
- `script.js`
- `ui/index.html` only for Rich Web App plugins

After generating the files, package the plugin when possible:

```bash
./scripts/build_plugin.sh <PluginDirectory>
```

Only skip packaging when the current environment does not contain the packaging script or cannot run shell commands. In that case, tell the user the exact command to run.

If the user explicitly wants CLI scaffolding:

```bash
npx create-swiftbiux-plugin <PluginName>
```

## Plugin Types & Boilerplate

When generating a plugin from scratch, use the following boilerplates based on the type:

### Extension Kind Contract (Required)

SwiftBiu routes extension actions by classified selection content:
- Plain text-only selection triggers `textAction` extensions.
- File-like selection triggers `fileAction` extensions. This includes native local file URLs, Finder file copies, temporary files materialized from rich clipboard/image/HTML/WebArchive payloads, and remote file-like URLs.
- If both text and file-like data are present, `fileAction` wins.

Every plugin manifest must explicitly declare:
- Root-level `extensionKind`
- Per-action `actions[].extensionKind`

Use one of:
- `textAction` for text-first extensions
- `fileAction` for file-first extensions

File-capable plugins should check both `context.selectedFiles` and `context.selectedRemoteFiles`. Only `selectedFiles` can be passed to local-file APIs such as `readLocalFile(...)`; remote file URLs require network or URL-opening workflows.

### 1. Logic-Only (No UI)
For text processing, API calls that return a notification or paste result.
**`script.js` template:**
```javascript
function isAvailable(context) { return context.selectedText && context.selectedText.length > 0; }
function performAction(context) {
    SwiftBiu.pasteText(context.selectedText.toUpperCase()); // Or showNotification
}
```

### 2. Rich Web App (With UI)
For plugins that need a custom window (e.g., currency converter, chat UI).
**`script.js` template:**
```javascript
function isAvailable(context) {
    const hasSelection = Boolean(context && context.selectedText && context.selectedText.trim());
    return { isAvailable: true, isContextMatch: hasSelection };
}

function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html", width: 400, height: 500, isFloating: true,
        title: "My Web App", position: { x: SwiftBiu.screenSize.width - 400, y: 0 }
    });
}
```

### Direct-Open Standard for UI Extensions

SwiftBiu shows an explicit Open button for extensions that expose an interactive surface: `manifest.ui`, `SwiftBiu.displayUI(...)`, `SwiftBiu.showAIResponseBubble(...)`, `SwiftBiu.showInteractiveImage(...)`, or `SwiftBiu.openNativeGeminiImageStudio(...)`.

Those extensions must treat `context.selectedText` as optional because a user can launch them from the extension list, a shortcut, or another non-selection entry point.

- For Web UI plugins, return `{ isAvailable: true, isContextMatch: hasSelection }` and always call `displayUI(...)`. Let `ui/index.html` initialize with `context.selectedText || ""`.
- For AI response bubbles, open the bubble in a ready/manual-input state when there is no selected text. Do not show "please select text" unless the native bubble API is unavailable.
- For image UI plugins, open an editable image prompt card/studio when there is no selected text. Generate only after the user enters a prompt.
- For append/replace flows, if there is no source text, paste/apply only the generated result instead of prefixing blank lines.
- Only logic-only quick actions should hard-require selected text in `isAvailable` or `performAction`.

For complete responsive UI templates and CSS rules, read `references/ui-patterns.md`.

## manifest.json Reference

```json
{
  "identifier": "com.yourname.pluginname",   // REQUIRED, globally unique
  "name": "Plugin Display Name",             // REQUIRED, supports TranslatableString
  "author": "Your Name",                     // REQUIRED
  "description": "What this plugin does.",   // REQUIRED, supports TranslatableString
  "version": "1.0",                          // REQUIRED
  "extensionKind": "textAction",             // REQUIRED: "textAction" | "fileAction"
  "icon": "swift",                           // Default plugin icon (see supported formats below)
  "iconType": "sfSymbol",                    // "sfSymbol" | "file" | "text" | "iconify" | "data"
  "actions": [                               // JS/native script actions. May be [] when using shareTargets only
    {
      "title": "Action Title",               // Supports TranslatableString
      "script": "script.js",                 // REQUIRED for JS plugins
      "extensionKind": "textAction",         // REQUIRED: keep consistent with action intent
      "rules": {                             // Optional: contextual availability
        "regex": "^https?://"                // Show action only when text matches regex
      }
    }
  ],
  "shareTargets": [                          // Optional declarative native sharing actions
    {
      "id": "whatsapp",
      "name": { "en": "Share to WhatsApp", "zh": "分享到 WhatsApp" },
      "kind": "urlScheme",                   // "systemPicker" | "airDrop" | "urlScheme" | "openWithApp"
      "supportedContent": ["text", "url"],   // "text" | "url" | "file" | "image"
      "urlTemplate": "whatsapp://send?text={{encodedText}}",
      "webFallback": "https://wa.me/?text={{encodedText}}"
    }
  ],
  "permissions": [],                         // See Permissions section
  "configuration": [],                       // See Configuration section
  "requiredShortcuts": [                     // For AppleScript+Shortcut plugins only
    {
      "name": "ShortcutName",
      "description": "What this shortcut does",
      "icloudLink": "https://www.icloud.com/shortcuts/..."
    }
  ],
  "ui": {                                    // Only for Rich Web App
    "main": "ui/index.html"
  }
}
```

### Stable and Beta Catalog Channels

To avoid impacting the current App Store plugin catalog, keep two channels:
- Stable catalog: `catalog/plugins.json` + `catalog/webPlugins.json`
- Beta catalog: `catalog/plugins.beta.json` + `catalog/webPlugins.beta.json`

Beta builds should publish `.swiftbiux` assets to beta prereleases and generate beta catalogs with a beta-only download base URL.

### Plugin Icon Formats (`icon` / `iconType`)

SwiftBiu supports multiple icon formats for the root-level plugin icon:
- `sfSymbol`: SF Symbol name, e.g. `"sparkles"`.
- `file`: Image file bundled in the plugin package, e.g. `"icon.png"` (common formats like png/jpg/pdf/svg supported).
- `text`: Short text label rendered as an icon, e.g. `"AI"`.
- `iconify`: Iconify icon name, e.g. `"solar:flag-bold"` or `"mdi:robot-happy"`.
- `data`: A `data:` URI payload, e.g. `"data:image/png;base64,..."`.

Prefix rules:
- Prefix forms are always recognized even if `iconType` is omitted: `text:AI`, `iconify:solar:flag-bold`, `data:image/png;base64,...`.
- If you omit the `iconify:` prefix, set `"iconType": "iconify"` and use the plain name like `"solar:flag-bold"`.

### TranslatableString
Many fields in `manifest.json` support the `TranslatableString` type, which allows providing different values for different languages.
- **Simple Format**: `"name": "My Plugin"`
- **Localized Format**: `"name": { "en": "My Plugin", "zh": "我的插件" }`
- **Fallback**: System language -> English -> First available key.

### Permissions (from `PluginPermission` enum in source)

| Permission       | Required For                           | Notes                          |
|------------------|----------------------------------------|--------------------------------|
| `network`        | `SwiftBiu.fetch` / `swiftBiu.fetch`    | Network requests               |
| `clipboardWrite` | `SwiftBiu.writeToClipboard`, `SwiftBiu.copyImage`, `window.swiftBiu.copyText`, `window.swiftBiu.copyImage` | Write text or images to clipboard |
| `clipboardRead`  | `SwiftBiu.getClipboard`               | Read clipboard content         |
| `localFileRead`  | `SwiftBiu.getFileMetadata`, `SwiftBiu.extractFileIcon`, `SwiftBiu.setFileIcon`, `SwiftBiu.pickLocalFile`, `SwiftBiu.readLocalFile`, `SwiftBiu.readLocalTextFile`, `SwiftBiu.listDirectory`, `SwiftBiu.openFileWithApp`, `window.swiftBiu.getFileMetadata`, `window.swiftBiu.extractFileIcon`, `window.swiftBiu.setFileIcon`, `window.swiftBiu.pickLocalFile`, `window.swiftBiu.readLocalFile`, `window.swiftBiu.readLocalTextFile`, `window.swiftBiu.listDirectory`, `window.swiftBiu.openFileWithApp` | Inspect, select, extract icons from, replace icons for, read, list, or open currently selected local files and accessible files/directories |
| `localFileWrite` | `setFileIcon`, `pickLocalFile`, `pickLocalDirectory`, `requestDirectoryAuthorization`, `hasAuthorizedDirectoryAccess`, `createLocalDirectory`, `createLocalFile`, `writeLocalTextFile`, `overwriteLocalFile`, `renameLocalFile`, `copyLocalFile`, `moveLocalFile`, `trashLocalItem`, `saveLocalFile`, `fileExists`, `directoryExists` | Select writable files, replace custom icons, create, update, move, rename, trash, save, or inspect writable destinations in selected or authorized locations |
| `share`          | `shareTargets`, `SwiftBiu.share`, `window.swiftBiu.share` | Share selected text, links, files, or images through SwiftBiu's native sharing bridge |
| `paste`          | `SwiftBiu.pasteText` / `swiftBiu.pasteText` | Write + paste to active app. On iOS main app, degrades gracefully to a Toast Notification. Works properly on iOS Keyboard Extension |
| `notifications`  | `SwiftBiu.showNotification` / `showImage` | Show toast/image notifications |
| `ui`             | `SwiftBiu.showAIResponseBubble`, `SwiftBiu.updateAIResponseBubble`, `SwiftBiu.closeAIResponseBubble`, `SwiftBiu.failAIResponseBubble` | Display and update native AI response UI |
| `runShellScript` | `SwiftBiu.runShellScript`              | Execute shell commands. ⚠️ macOS ONLY. Do not use for App Store-compatible plugins; sandboxed builds may block process execution and file access |
| `runAppleScript` | `SwiftBiu.runAppleScript`              | Execute AppleScript. ⚠️ macOS ONLY. Do not use for App Store-compatible plugins; sandboxed builds may block automation |

### Cross-Platform (macOS & iOS) Compatibility
The `.swiftbiux` packages are universal, but you must keep iOS limitations in mind:
1. **Scripting Limit**: No embedded node or python on iOS. App Store macOS builds are also sandboxed, so plugins that need OS resources should prefer SwiftBiu host APIs such as `extractFileIcon(...)`, `setFileIcon(...)`, `pickLocalFile(...)`, `readLocalFile(...)`, and `createLocalFile(...)` instead of shell, AppleScript, or `osascript`. If using NPM packages, bundle them into vanilla `script.js` via Rollup/Webpack. For heavy OS tasks on iOS, leverage Apple Shortcuts.
2. **Viewport Lock (Crucial)**: ALWAYS include `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` in `ui/index.html` to prevent aggressive zoom-in when tapping an `<input>`.
3. **Fluid UI**: Do NOT use fixed layouts. `width` and `height` from `displayUI` dictate window size ONLY on macOS floating windows. On iOS, the view is presented as a Sheet. You MUST use CSS media queries `@media (max-width: 600px)` to collapse sidebars and stack elements.
4. **Touch Targets**: Any clickable buttons or list rows should be at least `44x44px` tall on mobile screens. Ensure inputs have a `font-size: 16px` minimum to avert iOS auto-zoom behavior.

### App Store-Compatible Native Resource Workflows

When a plugin needs data that only the host app can safely access in the App Store sandbox, call a SwiftBiu host API from JavaScript instead of launching a subprocess.

For file and app-icon examples, read `references/file-workflows.md`. Do not implement App icon extraction by reading `.app/Contents/Info.plist`, calling `sips`, `qlmanage`, shell scripts, AppleScript, or `osascript` when the plugin must work in the App Store build.

### Configuration Types

| Field          | Type     | Required | Notes |
|----------------|----------|----------|-------|
| `key`          | String   | ✅       | Unique identifier, used with `getConfig(key)` / `storage.get(key)` |
| `label`        | TranslatableString | ✅       | Display label in settings UI |
| `type`         | String   | ✅       | One of: `string`, `secure`, `boolean`, `option`, `fileExtensionAppRules` |
| `placeholder`  | String   | ❌       | Hint text for `string`/`secure` fields |
| `description`  | TranslatableString | ❌       | **Sub-label / Help text**. Displays in a smaller font below the main label. |
| `defaultValue` | Any      | ❌       | Default value (String/Bool/Int/Double) |
| `group`        | String   | ❌       | Group name for visual grouping (default: "General") |
| `options`      | Array    | ❌       | For `option` type only: `[{label (TranslatableString), value}]` |

> [!NOTE]
> **Configuration UI Layout**: Settings are rendered in a **vertical stack**. Each item occupies the full width, with the label on top, followed by the description (if present), and the control at the bottom. This ensures long labels and descriptions are fully visible without being truncated.

> [!CAUTION]
> Legacy `radioList` configurations are no longer supported. If you need multiple fixed prompts, duplicate the extension and customize each copy instead.

> [!CAUTION]
> The JSON key is `"defaultValue"`, **NOT** `"default"`. Using `"default"` will be silently ignored.

For complete configuration examples, read `references/configuration.md`.

### `getConfig` Return Value Types

> [!IMPORTANT]
> `SwiftBiu.getConfig(key)` always returns a **String**. The format depends on the configuration type:

| Config Type | Return Value | Example |
|-------------|-------------|----------|
| `string`    | The stored string | `"https://api.example.com"` |
| `secure`    | The stored string (from Keychain) | `"sk-abc123"` |
| `boolean`   | `"true"` or `"false"` (string!) | `"true"` |
| `option`    | The `value` of the selected option | `"gpt-4o"` |
| `fileExtensionAppRules` | JSON string with a `rules` array of `{fileExtension, appBundleID}` objects | `{"rules":[{"fileExtension":"pdf","appBundleID":"com.apple.Preview"}]}` |

**Parsing examples in `script.js`:**
```javascript
// boolean
var autoPaste = SwiftBiu.getConfig("auto_paste") === "true";

// string
var systemPrompt = SwiftBiu.getConfig("system_prompt") || "You are a helpful assistant.";
```

> [!NOTE]
> **为什么所有配置值都返回字符串？** 这是统一存储架构的设计决策：所有配置类型都以 `String` 存入 `UserDefaults`（`secure` 类型存入 Keychain），`getConfig` 通过 JSExport 协议暴露给 JavaScript 时也统一返回 `String`。这简化了内部的读写逻辑，代价是插件开发者需要在 JS 端做简单的类型转换（如 `=== "true"` 或 `JSON.parse()`）。

## Dual JavaScript Environments

> [!CAUTION]
> There are TWO separate JS environments with DIFFERENT APIs. Never mix them up.

### Background Script (`script.js`) — JavaScriptCore

API object: **`SwiftBiu`** (also accessible as `swiftBiu`, both are injected)

**Must implement:**
- `isAvailable(context)` → `{ isAvailable: Bool, isContextMatch: Bool }` or `Bool`
- `performAction(context)` → void

**Context object passed to both functions:**
```javascript
{
  selectedText: "user selected text",
  sourceAppBundleID: "com.apple.TextEdit",
  selectedFiles: [
    { path: "/Users/name/Desktop/note.md", fileURL: "file:///Users/name/Desktop/note.md", fileName: "note.md", fileExtension: "md" }
  ],
  selectedRemoteFiles: [
    { url: "https://example.com/report.pdf", fileURL: "https://example.com/report.pdf", fileName: "report.pdf", fileExtension: "pdf" }
  ],
  screenPosition: { x: 100, y: 200 }  // may be absent
}
```

`selectedFiles` may include temporary files materialized by SwiftBiu from rich clipboard image data, HTML data URIs, or WebArchive resources. Treat those paths as read-only inputs for the current action. `selectedRemoteFiles` are file-like web URLs and cannot be passed to local-file APIs.

**Available APIs (from `PluginAPIExports` protocol):**

| API | Signature | Notes |
|-----|-----------|-------|
| `SwiftBiu.screenSize` | Property → `{width, height}` | Main screen dimensions |
| `SwiftBiu.isSandboxed` | Property → `Bool` | Whether running in App Store sandbox |
| `SwiftBiu.openURL(url)` | Sync | Opens URL in default browser |
| `SwiftBiu.share(options)` | Sync → `{success, message?}` | Requires `share`. With no target, opens the macOS share picker. With `{target: "id"}`, runs a manifest-declared `shareTargets` entry |
| `SwiftBiu.writeToClipboard(text)` | Sync | Requires `clipboardWrite` |
| `SwiftBiu.copyImage(base64String, options)` | Sync → Bool | Requires `clipboardWrite`. Accepts raw Base64 or `data:image/...;base64,...`; `options` may include `{ mimeType, filename, fileBacked }`. With the default `fileBacked: true`, SwiftBiu writes a temporary file URL plus Finder-compatible filenames to the pasteboard so Finder/Desktop paste creates an image file. Pass `fileBacked: false` for image-data-only clipboard writes to image editors |
| `SwiftBiu.pasteText(text)` | Sync | Requires `paste`. Writes to clipboard then simulates Cmd+V |
| `SwiftBiu.getClipboard()` | Sync → String | Requires `clipboardRead` |
| `SwiftBiu.getConfig(key)` | Sync → String | Read configuration value. **NOT** `storage.get()` |
| `SwiftBiu.setConfig(key, value)` | Sync | Persist a known manifest configuration key. Useful for native AI bubble `configChanged` events |
| `SwiftBiu.showNotification(message)` | Sync | Requires `notifications`. Also: `showNotification(title, message)` |
| `SwiftBiu.showLoadingIndicator(position)` | Sync | `position: {x, y}` or use `context.screenPosition`. Prefer only for lightweight non-UI actions |
| `SwiftBiu.hideLoadingIndicator()` | Sync | Hide the loading spinner. For `displayUI` / AI bubble / image-card flows, handle loading in your own UI |
| `SwiftBiu.fetch(url, options, onSuccess, onError)` | **Callback-based** | Requires `network`. See below |
| `SwiftBiu.fetchStream(url, options, onEvent, onError)` | Sync create → `streamID` | Requires `network`. Use for SSE or chunked providers; update UI with cumulative text |
| `SwiftBiu.cancelFetchStream(streamID)` | Sync | Cancels a stream created by `fetchStream(...)` |
| `SwiftBiu.downloadRemoteFile(url, options, onSuccess, onError)` | Callback-based | Requires `network`. Downloads a remote file-like URL and returns a transient local file result |
| `SwiftBiu.materializeSelectedRemoteFiles(options, onSuccess, onError)` | Callback-based | Requires `network`. Downloads `context.selectedRemoteFiles` into transient local files for the current action |
| `SwiftBiu.showImage(source, position, context)` | Sync | `source`: URL string or base64. Requires `notifications` |
| `SwiftBiu.showInteractiveImage(options, onRegenerate)` | Sync create → `sessionID` | Requires `notifications`. Native image card with regenerate/update behavior |
| `SwiftBiu.updateInteractiveImage(sessionID, options)` | Sync | Updates an existing interactive image session |
| `SwiftBiu.failInteractiveImage(sessionID, message)` | Sync | Marks an interactive image session as failed |
| `SwiftBiu.openFileInPreview(path)` | Sync | Opens file in Preview.app |
| `SwiftBiu.openFileWithApp(path, appBundleID)` | Sync → Bool | Requires `localFileRead`. Opens an accessible selected or authorized file with the specified macOS app bundle ID |
| `SwiftBiu.openImageInPreview(base64)` | Sync | Opens base64 image in Preview.app |
| `SwiftBiu.getFileMetadata(path)` | Sync → Object | Requires `localFileRead`. Returns size, timestamps, content type, etc. |
| `SwiftBiu.extractFileIcon(path, options)` | Sync → Object | Requires `localFileRead`. Returns `{success, base64, fileName, width, height, format}` or `{success: false, error}`. Use this for App Store-compatible icon extraction instead of shell/osascript |
| `SwiftBiu.setFileIcon(targetPath, iconPath, options)` | Sync → Object | Requires `localFileRead` + `localFileWrite`. Uses the host App to apply an image as the custom Finder icon for an accessible file/folder/app. Prefer this over shell tools for App Store compatibility |
| `SwiftBiu.readLocalFile(path)` | Sync → Base64 String | Requires `localFileRead`. Path must come from `context.selectedFiles` or a user-authorized location; do not pass `context.selectedRemoteFiles` |
| `SwiftBiu.readLocalTextFile(path)` | Sync → String | Requires `localFileRead`. Convenience UTF-8 text decoder for selected or authorized files |
| `SwiftBiu.listDirectory(path)` | Sync → `Array<Object>` | Requires `localFileRead`. Lists direct children of an accessible directory |
| `SwiftBiu.fileExists(path)` | Sync → Bool | Requires `localFileRead` or `localFileWrite`. Checks whether an accessible path is a file |
| `SwiftBiu.directoryExists(path)` | Sync → Bool | Requires `localFileRead` or `localFileWrite`. Checks whether an accessible path is a directory |
| `SwiftBiu.pickLocalFile(options)` | Sync → String | Requires `localFileRead` or `localFileWrite`. Opens a native file picker, persists the selected item authorization, and returns its path. Supports `kind: "application"` or `kind: "image"` plus `allowedExtensions` |
| `SwiftBiu.pickLocalDirectory()` | Sync → String | Requires `localFileWrite`. Opens the native folder picker and persists directory authorization |
| `SwiftBiu.requestDirectoryAuthorization(path)` | Sync → String | Requires `localFileWrite`. Prompts the user to authorize one or more folders and returns the first authorized path |
| `SwiftBiu.hasAuthorizedDirectoryAccess(path)` | Sync → Bool | Requires `localFileWrite`. Checks whether a path is covered by a persisted writable folder authorization |
| `SwiftBiu.createLocalDirectory(path)` | Sync → String | Requires `localFileWrite`. Creates a directory in a selected or authorized location |
| `SwiftBiu.createLocalFile(path, base64String)` | Sync → String | Requires `localFileWrite`. Creates a new file from Base64 data in a selected or authorized location |
| `SwiftBiu.writeLocalTextFile(path, text)` | Sync → String | Requires `localFileWrite`. Creates a new UTF-8 text file |
| `SwiftBiu.overwriteLocalFile(path, base64String)` | Sync → String | Requires `localFileWrite`. Replaces the contents of an existing accessible file |
| `SwiftBiu.renameLocalFile(path, newName)` | Sync → String | Requires `localFileWrite`. Renames within the current directory |
| `SwiftBiu.copyLocalFile(sourcePath, destinationPath)` | Sync → String | Requires `localFileWrite`. Destination must be accessible |
| `SwiftBiu.moveLocalFile(sourcePath, destinationPath)` | Sync → String | Requires `localFileWrite`. Destination must be accessible |
| `SwiftBiu.trashLocalItem(path)` | Sync → Bool | Requires `localFileWrite`. Moves a selected file or an item in an authorized directory to the macOS Trash |
| `SwiftBiu.saveLocalFile(base64, filename)` | Sync | Opens a native Save panel for arbitrary file data |
| `SwiftBiu.exportFile(base64, filename)` | Sync | Backward-compatible alias of `saveLocalFile(...)` |
| `SwiftBiu.beginFileTask(options)` | Sync create → `sessionID` | Native progress panel for write-heavy file tasks |
| `SwiftBiu.updateFileTask(sessionID, options)` | Sync | Updates file task progress, logs, and structured status |
| `SwiftBiu.finishFileTask(sessionID, options)` | Sync | Marks a file task as completed |
| `SwiftBiu.failFileTask(sessionID, options)` | Sync | Marks a file task as failed |
| `SwiftBiu.runShellScript(script, context)` | Sync → String | Requires `runShellScript`. Context vars: `{text}` → replaced in script. Avoid for App Store-compatible plugins |
| `SwiftBiu.runAppleScript(script, context)` | Sync → String | Requires `runAppleScript`. Avoid for App Store-compatible plugins |
| `SwiftBiu.displayUI(options, onMessage)` | Sync → windowID | Launch Rich Web App UI window |
| `SwiftBiu.postMessageToUI(windowID, message)` | Sync | Send data to UI (calls `window.__swiftBiu_receiveMessage`) |
| `SwiftBiu.closeUI(windowID)` | Sync | Close a UI window |
| `SwiftBiu.openNativeGeminiImageStudio(options)` | Sync | Requires `network`. Opens SwiftBiu's native Gemini image studio with optional `{prompt, triggerSource}` |
| `SwiftBiu.showAIResponseBubble(options, onEvent)` | Sync create → `sessionID` | Requires `ui`. Native AI response UI for rewrite/summarize/apply flows |
| `SwiftBiu.updateAIResponseBubble(sessionID, options)` | Sync | Requires `ui`. Updates native AI bubble state, status, text, and button availability |
| `SwiftBiu.failAIResponseBubble(sessionID, message)` | Sync | Requires `ui`. Shows failure state in the native AI bubble |
| `SwiftBiu.closeAIResponseBubble(sessionID)` | Sync | Requires `ui`. Closes the native AI bubble |

**`displayUI` options:**
```javascript
SwiftBiu.displayUI({
  htmlPath: "ui/index.html",   // REQUIRED
  width: 400,                   // default: 400
  height: 300,                  // default: 300
  title: "Window Title",        // default: plugin name
  isFloating: true,             // default: false. Window stays on top
  position: { x: 100, y: 0 }   // default: centered. Top-left coordinate system
}, onMessage);
```

> [!CAUTION]
> **`async/await` and `Promise` are FORBIDDEN in `script.js`!** JavaScriptCore does not support them.
> Use callback-based `SwiftBiu.fetch(url, options, onSuccess, onError)` instead.

**Fetch pattern in script.js (callback-based, UI owns loading state):**
```javascript
function performAction(context) {
    SwiftBiu.fetch(
        'https://api.example.com/data',
        { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: context.selectedText}) },
        function(response) {  // onSuccess: { status: Int, data: String }
            var result = JSON.parse(response.data);
            SwiftBiu.pasteText(result.text);
        },
        function(error) {     // onError: { error: String }
            SwiftBiu.showNotification("Error", error.error);
        }
    );
}
```

### UI Script (`ui/index.html`) — WKWebView

API object: **`window.swiftBiu`** (injected via WebViewBridge.js)

**Must implement:**
```javascript
window.swiftBiu_initialize = function(context) {
  // context -> { selectedText: "...", sourceAppBundleID: "...", selectedFiles: [...], selectedRemoteFiles: [...] }
};
```

**Available APIs (from `WebViewBridge.js` + `PluginHost.handleAPICall`):**

| API | Signature | Notes |
|-----|-----------|-------|
| `window.swiftBiu.fetch(url, options)` | Promise → `{status, data}` | Requires `network` |
| `window.swiftBiu.getFileMetadata(path)` | Promise → `Object` | Requires `localFileRead` |
| `window.swiftBiu.extractFileIcon(path, options)` | Promise → `Object` | Requires `localFileRead`. Returns PNG Base64 icon data from the host App; preferred for App Store sandbox compatibility |
| `window.swiftBiu.setFileIcon(targetPath, iconPath, options)` | Promise → `Object` | Requires `localFileRead` + `localFileWrite`. Applies an image as the custom Finder icon for an accessible file/folder/app |
| `window.swiftBiu.readLocalFile(path)` | Promise → `{base64: String}` | Requires `localFileRead`. Path must come from `context.selectedFiles` or a user-authorized location; do not pass `context.selectedRemoteFiles` |
| `window.swiftBiu.readLocalTextFile(path)` | Promise → `{result: String}` | Requires `localFileRead`. Convenience UTF-8 text decoder for selected or authorized files |
| `window.swiftBiu.listDirectory(path)` | Promise → `{items: Array<Object>}` | Requires `localFileRead` |
| `window.swiftBiu.fileExists(path)` | Promise → `{exists: Boolean}` | Requires `localFileRead` or `localFileWrite` |
| `window.swiftBiu.directoryExists(path)` | Promise → `{exists: Boolean}` | Requires `localFileRead` or `localFileWrite` |
| `window.swiftBiu.copyText(text)` | Promise | Requires `clipboardWrite` |
| `window.swiftBiu.copyImage(base64, options)` | Promise → Boolean | Requires `clipboardWrite`. Accepts raw Base64 or `data:image/...;base64,...`; `options` may include `{ mimeType, filename, fileBacked }`. Use this for generated image clipboard writes instead of `navigator.clipboard.write(...)`; browser `ClipboardItem({ "image/png": ... })` writes image pixels, not a Finder-pasteable file. With the default `fileBacked: true`, SwiftBiu writes a temporary file URL for Finder/Desktop paste |
| `window.swiftBiu.pasteText(text)` | Promise | Requires `paste` |
| `window.swiftBiu.pickLocalFile(options)` | Promise → `{path: String}` | Requires `localFileRead` or `localFileWrite`. Lets the user select and authorize a file/package such as `.app` or an image |
| `window.swiftBiu.pickLocalDirectory()` | Promise → `{path: String}` | Requires `localFileWrite`. Lets the user choose a writable folder first |
| `window.swiftBiu.createLocalDirectory(path)` | Promise → `{path: String}` | Requires `localFileWrite` |
| `window.swiftBiu.createLocalFile(path, base64String)` | Promise → `{path: String}` | Requires `localFileWrite` |
| `window.swiftBiu.writeLocalTextFile(path, text)` | Promise → `{path: String}` | Requires `localFileWrite` |
| `window.swiftBiu.overwriteLocalFile(path, base64String)` | Promise → `{path: String}` | Requires `localFileWrite` |
| `window.swiftBiu.renameLocalFile(path, newName)` | Promise → `{path: String}` | Requires `localFileWrite` |
| `window.swiftBiu.copyLocalFile(sourcePath, destinationPath)` | Promise → `{path: String}` | Requires `localFileWrite` |
| `window.swiftBiu.moveLocalFile(sourcePath, destinationPath)` | Promise → `{path: String}` | Requires `localFileWrite` |
| `window.swiftBiu.trashLocalItem(path)` | Promise → `{success: Boolean}` | Requires `localFileWrite` |
| `window.swiftBiu.saveLocalFile(base64, filename)` | Promise | Trigger Save Panel to save arbitrary file data |
| `window.swiftBiu.exportFile(base64, filename)` | Promise | Backward-compatible alias of `saveLocalFile` |
| `window.swiftBiu.speakText(text)` | Promise | Text-to-speech using system voice (NSSpeechSynthesizer) |
| `window.swiftBiu.openURL(url)` | Promise | Opens in default browser |
| `window.swiftBiu.openFileWithApp(path, appBundleID)` | Promise → `{success: Boolean}` | Requires `localFileRead`. Opens an accessible selected or authorized file with the specified macOS app bundle ID |
| `window.swiftBiu.share(options)` | Promise → `{success, message?}` | Requires `share`. Uses the same native sharing bridge as `SwiftBiu.share(...)` |
| `window.swiftBiu.closeWindow()` | Promise | Close the plugin window |
| `window.swiftBiu.storage.get(key)` | Promise → `{result: String}` | Read config (internally calls `getConfig`) |
| `window.swiftBiu.ui.resizeWindow({height})` | Promise | Resize window height only |

### Native File Selection (Plugin UI)
The plugin UI supports native file and folder selection using standard HTML `<input type="file">`.
- **Single/Multiple Files**: `<input type="file">` or `<input type="file" multiple>`
- **Folder Selection**: `<input type="file" webkitdirectory>` (supported via `WKUIDelegate`)
- **Reliability**: The system automatically ensures the app is activated and the window is brought to the front when the file picker is triggered, even if the user has switched to another application.

> [!IMPORTANT]
> **Performance Tip**: In `WKWebView`, `File` objects can become stale if you try to read them multiple times or after the window loses context. For long-running operations like zipping (e.g., in the Packager), it is recommended to read the file contents into memory (using `FileReader`) immediately after selection and use the cached data for processing.

> [!IMPORTANT]
> In the UI environment, APIs return **Promises** (unlike the background script). `async/await` IS supported here because it runs in WKWebView (full browser engine).

> [!IMPORTANT]
> `swiftBiu.copyText` exists **only** in the UI environment. In background script, use `SwiftBiu.writeToClipboard`.
> `copyImage` is available in both environments: use `SwiftBiu.copyImage(...)` in background scripts and `window.swiftBiu.copyImage(...)` in Web UI. Pass a real `filename` when possible so Finder/Desktop paste creates a friendly image file name. `createLocalFile(...)` and `saveLocalFile(...)` save bytes to disk but do not put that saved file on the pasteboard; call `copyImage(..., { fileBacked: true })` when users need to paste the generated image into Finder/Desktop.
> `SwiftBiu.getConfig` exists **only** in the background script. In UI, use `swiftBiu.storage.get`.
> `swiftBiu.speakText` exists **only** in the UI environment. No permission required.

## Critical Pitfalls

1. **Never use `async/await` in `script.js`** — JavaScriptCore doesn't support it. Use callbacks.
2. **`getConfig` vs `storage.get`** — Background uses `SwiftBiu.getConfig(key)` (sync, returns string). UI uses `swiftBiu.storage.get(key)` (async, returns `{result}`).
3. **Declare ALL required permissions** — API calls silently fail without proper permissions.
4. **Avoid `.at()` and other modern JS** — Use `array[0]` not `array.at(0)`. JavaScriptCore compatibility is limited.
5. **Log objects with `JSON.stringify`** — `console.log("data:", JSON.stringify(obj, null, 2))` for complete output.
6. **Window height auto-resize** — Set `<html>` bg to transparent, `<body>` with `min-height: 100vh`. Calculate height manually with `offsetHeight + 30~50px buffer`, then call `swiftBiu.ui.resizeWindow({height})`.
7. **Icon specs** — SF Symbols preferred. If using PNG: 64×64 or 128×128, transparent background, named `icon.png`.
8. **`boolean` config returns string** — `SwiftBiu.getConfig("myBool")` returns `"true"` / `"false"` (string), not native bool. Compare with `=== "true"`.
9. **Use one prompt per extension** — If you need multiple fixed prompt variants, duplicate the extension and customize each copy instead of building an in-extension preset switcher.
10. **`secure` fields stored in Keychain** — `getConfig` automatically reads from Keychain for `secure` type fields. No extra handling needed in JS.

## UI, Packaging, and Catalog Details

- For CSS and responsive UI rules, read `references/ui-patterns.md`.
- For packaging commands and catalog entry shape, read `references/configuration.md`.
- Only add or update catalog entries when the user explicitly asks to publish or prepare distribution metadata.
