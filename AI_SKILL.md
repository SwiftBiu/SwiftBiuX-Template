---
description: How to develop SwiftBiuX extensions (plugins) for the SwiftBiu app
---

# SwiftBiuX Extension Development Skill

Use this skill when creating or modifying SwiftBiuX plugins. Plugin code can be created in any workspace directory the user prefers.

## Installation & Development Workflow

### Option 1: AI Auto-Generation (For LLMs)
If you are an AI Code Assistant reading this, you do NOT need to run NPM. You can generate the plugin directly for the user by creating the following files in the user's workspace:
1. `manifest.json` (See Reference below)
2. `script.js` (See Boilerplate below)
3. `ui/index.html` (Only if it's a Rich Web App)

### Option 2: CLI Scaffolding (For Humans)
You can instantly scaffold a new plugin anywhere using our official CLI tool:
```bash
npx create-swiftbiux-plugin <PluginName>
```
*The CLI will automatically generate the directory, manifest, and responsive UI boilerplate.*

## Plugin Types & Boilerplate

When generating a plugin from scratch, use the following boilerplates based on the type:

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
function isAvailable(context) { return true; }
function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html", width: 400, height: 500, isFloating: true,
        title: "My Web App", position: { x: SwiftBiu.screenSize.width - 400, y: 0 }
    });
}
```
**`ui/index.html` mobile-responsive template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 20px; color: #1d1d1f; }
        @media (prefers-color-scheme: dark) { body { color: #f5f5f7; } }
        /* 📱 iOS/Mobile Responsive Styles */
        @media (max-width: 600px) { 
            body { padding: 16px; min-height: 100vh; } 
            button { min-height: 44px; font-size: 16px; margin-top: auto; } /* HIG Touch Target & Prevent Tap Zoom */
        }
    </style>
</head>
<body>
    <div id="content">Loading...</div>
    <script>
        window.swiftBiu_initialize = function(context) {
            document.getElementById('content').innerText = context.selectedText || "Ready";
            window.swiftBiu.ui.resizeWindow({ height: document.body.offsetHeight + 40 });
        };
    </script>
</body>
</html>
```

## manifest.json Reference

```json
{
  "identifier": "com.yourname.pluginname",   // REQUIRED, globally unique
  "name": "Plugin Display Name",             // REQUIRED, supports TranslatableString
  "author": "Your Name",                     // REQUIRED
  "description": "What this plugin does.",   // REQUIRED, supports TranslatableString
  "version": "1.0",                          // REQUIRED
  "icon": "swift",                           // Default plugin icon (see supported formats below)
  "iconType": "sfSymbol",                    // "sfSymbol" | "file" | "text" | "iconify" | "data"
  "actions": [                               // REQUIRED, currently only one action
    {
      "title": "Action Title",               // Supports TranslatableString
      "script": "script.js",                 // REQUIRED for JS plugins
      "rules": {                             // Optional: contextual availability
        "regex": "^https?://"                // Show action only when text matches regex
      }
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
| `clipboardWrite` | `SwiftBiu.writeToClipboard` / `swiftBiu.copyText` | Write to clipboard   |
| `clipboardRead`  | `SwiftBiu.getClipboard`               | Read clipboard content         |
| `localFileRead`  | `SwiftBiu.readLocalFile`, `SwiftBiu.readLocalTextFile`, `window.swiftBiu.readLocalFile`, `window.swiftBiu.readLocalTextFile` | Read currently selected local files (binary as Base64 or UTF-8 text) |
| `localFileWrite` | `pickLocalDirectory`, `createLocalDirectory`, `createLocalFile`, `renameLocalFile`, `copyLocalFile`, `moveLocalFile`, `trashLocalItem`, `saveLocalFile` | Create, move, rename, trash, or save files in selected or authorized locations |
| `paste`          | `SwiftBiu.pasteText` / `swiftBiu.pasteText` | Write + paste to active app. On iOS main app, degrades gracefully to a Toast Notification. Works properly on iOS Keyboard Extension |
| `notifications`  | `SwiftBiu.showNotification` / `showImage` | Show toast/image notifications |
| `runShellScript` | `SwiftBiu.runShellScript`              | Execute shell commands. ⚠️ macOS ONLY. Not available on iOS or App Store (sandbox) build |
| `runAppleScript` | `SwiftBiu.runAppleScript`              | Execute AppleScript. ⚠️ macOS ONLY. Not available on iOS or App Store (sandbox) build |

### Cross-Platform (macOS & iOS) Compatibility
The `.swiftbiux` packages are universal, but you must keep iOS limitations in mind:
1. **Scripting Limit**: No embedded node or python on iOS. If using NPM packages, you must bundle them into vanilla `script.js` via Rollup/Webpack. For heavy OS tasks on iOS, leverage Apple Shortcuts. 
2. **Viewport Lock (Crucial)**: ALWAYS include `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` in `ui/index.html` to prevent aggressive zoom-in when tapping an `<input>`.
3. **Fluid UI**: Do NOT use fixed layouts. `width` and `height` from `displayUI` dictate window size ONLY on macOS floating windows. On iOS, the view is presented as a Sheet. You MUST use CSS media queries `@media (max-width: 600px)` to collapse sidebars and stack elements.
4. **Touch Targets**: Any clickable buttons or list rows should be at least `44x44px` tall on mobile screens. Ensure inputs have a `font-size: 16px` minimum to avert iOS auto-zoom behavior.

### Configuration Types

| Field          | Type     | Required | Notes |
|----------------|----------|----------|-------|
| `key`          | String   | ✅       | Unique identifier, used with `getConfig(key)` / `storage.get(key)` |
| `label`        | TranslatableString | ✅       | Display label in settings UI |
| `type`         | String   | ✅       | One of: `string`, `secure`, `boolean`, `option` |
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

**Complete examples for all 5 types:**

```json
"configuration": [
  {
    "key": "api_key",
    "label": "API Key",
    "type": "secure",
    "placeholder": "Enter your API key",
    "description": "Stored securely in Keychain.",
    "group": "Authentication"
  },
  {
    "key": "api_url",
    "label": "API URL",
    "type": "string",
    "placeholder": "https://api.example.com/v1",
    "description": "Custom API endpoint. Leave blank for default.",
    "defaultValue": "https://api.example.com/v1",
    "group": "Authentication"
  },
  {
    "key": "auto_paste",
    "label": "Auto Paste Result",
    "type": "boolean",
    "description": "Automatically paste the result into the active app.",
    "defaultValue": true,
    "group": "General"
  },
  {
    "key": "model",
    "label": "Model",
    "type": "option",
    "description": "The AI model to use.",
    "defaultValue": "gpt-4o",
    "options": [
      { "label": "GPT-4o", "value": "gpt-4o" },
      { "label": "GPT-4o Mini", "value": "gpt-4o-mini" },
      { "label": "GPT-3.5 Turbo", "value": "gpt-3.5-turbo" }
    ],
    "group": "Model"
  },
  {
    "key": "system_prompt",
    "label": "System Prompt",
    "type": "string",
    "description": "One prompt per extension is recommended. Duplicate the extension if you want multiple personas.",
    "defaultValue": "You are a helpful assistant.",
    "group": "Model"
  }
]
```

### `getConfig` Return Value Types

> [!IMPORTANT]
> `SwiftBiu.getConfig(key)` always returns a **String**. The format depends on the configuration type:

| Config Type | Return Value | Example |
|-------------|-------------|----------|
| `string`    | The stored string | `"https://api.example.com"` |
| `secure`    | The stored string (from Keychain) | `"sk-abc123"` |
| `boolean`   | `"true"` or `"false"` (string!) | `"true"` |
| `option`    | The `value` of the selected option | `"gpt-4o"` |

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
  screenPosition: { x: 100, y: 200 }  // may be absent
}
```

**Available APIs (from `PluginAPIExports` protocol):**

| API | Signature | Notes |
|-----|-----------|-------|
| `SwiftBiu.screenSize` | Property → `{width, height}` | Main screen dimensions |
| `SwiftBiu.isSandboxed` | Property → `Bool` | Whether running in App Store sandbox |
| `SwiftBiu.openURL(url)` | Sync | Opens URL in default browser |
| `SwiftBiu.writeToClipboard(text)` | Sync | Requires `clipboardWrite` |
| `SwiftBiu.pasteText(text)` | Sync | Requires `paste`. Writes to clipboard then simulates Cmd+V |
| `SwiftBiu.getClipboard()` | Sync → String | Requires `clipboardRead` |
| `SwiftBiu.getConfig(key)` | Sync → String | Read configuration value. **NOT** `storage.get()` |
| `SwiftBiu.showNotification(message)` | Sync | Requires `notifications`. Also: `showNotification(title, message)` |
| `SwiftBiu.showLoadingIndicator(position)` | Sync | `position: {x, y}` or use `context.screenPosition`. Prefer only for lightweight non-UI actions |
| `SwiftBiu.hideLoadingIndicator()` | Sync | Hide the loading spinner. For `displayUI` / AI bubble / image-card flows, handle loading in your own UI |
| `SwiftBiu.fetch(url, options, onSuccess, onError)` | **Callback-based** | Requires `network`. See below |
| `SwiftBiu.showImage(source, position, context)` | Sync | `source`: URL string or base64. Requires `notifications` |
| `SwiftBiu.openFileInPreview(path)` | Sync | Opens file in Preview.app |
| `SwiftBiu.openImageInPreview(base64)` | Sync | Opens base64 image in Preview.app |
| `SwiftBiu.getFileMetadata(path)` | Sync → Object | Requires `localFileRead`. Returns size, timestamps, content type, etc. |
| `SwiftBiu.readLocalFile(path)` | Sync → Base64 String | Requires `localFileRead`. Path must come from `context.selectedFiles` |
| `SwiftBiu.readLocalTextFile(path)` | Sync → String | Requires `localFileRead`. Convenience UTF-8 text decoder for `context.selectedFiles` |
| `SwiftBiu.listDirectory(path)` | Sync → `Array<Object>` | Requires `localFileRead`. Lists direct children of an accessible directory |
| `SwiftBiu.fileExists(path)` | Sync → Bool | Requires `localFileRead` or `localFileWrite`. Checks whether an accessible path is a file |
| `SwiftBiu.directoryExists(path)` | Sync → Bool | Requires `localFileRead` or `localFileWrite`. Checks whether an accessible path is a directory |
| `SwiftBiu.pickLocalDirectory()` | Sync → String | Requires `localFileWrite`. Opens the native folder picker and persists directory authorization |
| `SwiftBiu.createLocalDirectory(path)` | Sync → String | Requires `localFileWrite`. Creates a directory in a selected or authorized location |
| `SwiftBiu.createLocalFile(path, base64String)` | Sync → String | Requires `localFileWrite`. Creates a new file from Base64 data in a selected or authorized location |
| `SwiftBiu.writeLocalTextFile(path, text)` | Sync → String | Requires `localFileWrite`. Creates a new UTF-8 text file |
| `SwiftBiu.overwriteLocalFile(path, base64String)` | Sync → String | Requires `localFileWrite`. Replaces the contents of an existing accessible file |
| `SwiftBiu.renameLocalFile(path, newName)` | Sync → String | Requires `localFileWrite`. Renames within the current directory |
| `SwiftBiu.copyLocalFile(sourcePath, destinationPath)` | Sync → String | Requires `localFileWrite`. Destination must be accessible |
| `SwiftBiu.moveLocalFile(sourcePath, destinationPath)` | Sync → String | Requires `localFileWrite`. Destination must be accessible |
| `SwiftBiu.trashLocalItem(path)` | Sync → Bool | Requires `localFileWrite`. Moves a selected file or an item in an authorized directory to the macOS Trash |
| `SwiftBiu.runShellScript(script, context)` | Sync → String | Requires `runShellScript`. Context vars: `{text}` → replaced in script |
| `SwiftBiu.runAppleScript(script, context)` | Sync → String | Requires `runAppleScript` |
| `SwiftBiu.displayUI(options, onMessage)` | Sync → windowID | Launch Rich Web App UI window |
| `SwiftBiu.postMessageToUI(windowID, message)` | Sync | Send data to UI (calls `window.__swiftBiu_receiveMessage`) |
| `SwiftBiu.closeUI(windowID)` | Sync | Close a UI window |

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
  // context -> { selectedText: "...", sourceAppBundleID: "...", selectedFiles: [...] }
};
```

**Available APIs (from `WebViewBridge.js` + `PluginHost.handleAPICall`):**

| API | Signature | Notes |
|-----|-----------|-------|
| `window.swiftBiu.fetch(url, options)` | Promise → `{status, data}` | Requires `network` |
| `window.swiftBiu.getFileMetadata(path)` | Promise → `Object` | Requires `localFileRead` |
| `window.swiftBiu.readLocalFile(path)` | Promise → `{base64: String}` | Requires `localFileRead`. Path must come from `context.selectedFiles` |
| `window.swiftBiu.readLocalTextFile(path)` | Promise → `{result: String}` | Requires `localFileRead`. Convenience UTF-8 text decoder |
| `window.swiftBiu.listDirectory(path)` | Promise → `{items: Array<Object>}` | Requires `localFileRead` |
| `window.swiftBiu.fileExists(path)` | Promise → `{exists: Boolean}` | Requires `localFileRead` or `localFileWrite` |
| `window.swiftBiu.directoryExists(path)` | Promise → `{exists: Boolean}` | Requires `localFileRead` or `localFileWrite` |
| `window.swiftBiu.copyText(text)` | Promise | Requires `clipboardWrite` |
| `window.swiftBiu.pasteText(text)` | Promise | Requires `paste` |
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

## CSS Best Practice for Plugin UI

```css
html { background-color: transparent; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  background-color: var(--card-bg); /* or transparent for frosted glass */
  min-height: 100vh;
  color: var(--text-primary);
}
/* Support dark mode */
@media (prefers-color-scheme: dark) {
  :root { --card-bg: #1c1c1e; --text-primary: #f5f5f7; }
}

/* 📱 iOS/Mobile Responsive Styles */
@media (max-width: 600px) {
  body { padding: 0; }
  .card, .container {
    border-radius: 0;
    border: none;
    box-shadow: none;
    min-height: 100vh;
    padding: 24px 16px;
  }
  button, select, input {
    min-height: 44px; /* HIG Touch Target */
    font-size: 16px; /* Prevent tap zoom */
  }
}
```

## Packaging & Testing

```bash
cd <YourPluginFolder>
# If using the standard template setup:
./scripts/build_plugin.sh <PluginFolderName>

# Or if an NPM scaffolding tool is used:
# npm run build

# Output: <PluginFolderName>.swiftbiux
# Double-click to install in SwiftBiu
```

## Plugin Catalog (`catalog/plugins.json`)

After creating a plugin, add an entry to the official plugin catalog:
```json
{
  "id": "com.yourname.pluginname",
  "name": "Plugin Name",
  "description": { "en": "English desc", "zh": "中文描述" },
  "icon": "sfSymbolName",
  "version": "1.0",
  "type": "Web App",
  "author": "Author Name",
  "downloadUrl": "https://github.com/your-repo/releases/latest/download/PluginName.swiftbiux",
  "categoryId": "text-processing|devtools|productivity|online-services|data-creative|system"
}
```

Catalog icon notes:
- `catalog/plugins.json` currently stores `icon` only (no `iconType`). Use one of these forms:
- SF Symbol name: `"sparkles"`.
- File icon by extension: `"icon.png"` (or other supported image extensions).
- Explicit prefixes: `"text:AI"`, `"iconify:solar:flag-bold"`, `"data:image/png;base64,..."`.
