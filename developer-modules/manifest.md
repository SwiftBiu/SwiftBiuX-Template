# Manifest & Configuration

### `manifest.json` Explained

This file is the "ID card" for your plugin. Here are the most important keys:

| Key             | Type   | Required | Description                                                                                                                                                     |
| --------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`    | String | Yes      | A unique ID for your plugin, e.g., `com.yourname.plugin`. **Must be globally unique, as a plugin with a duplicate identifier will overwrite any existing one.** |
| `name`          | String | Yes      | The display name of your plugin.                                                                                                                                |
| `author`        | String | Yes      | Author of the plugin.                                                                                                                                    |
| `description`   | String | Yes      | Short introduction to the plugin.                                                                                                                          |
| `version`       | String | Yes      | The plugin's version, e.g., `1.0`.                                                                                                                              |
| `extensionKind` | String | Yes      | Extension category. Use `textAction` or `fileAction`.                                                                                                           |
| `actions`       | Array  | Yes      | Script-backed actions the plugin provides. Use an empty array when the plugin only provides declarative `shareTargets`.                                  |
| `shareTargets`  | Array  | No       | Declarative native sharing actions powered by SwiftBiu, such as system share picker, AirDrop, URL schemes, or opening selected files with a target app. |
| `icon`          | String | No       | **(Root Level)** The default icon for the entire plugin. Supports SF Symbols, packaged image files, text icons, Iconify icons, or a `data:` URI payload.        |
| `iconType`      | String | No       | **(Root Level)** Defines how `icon` should be interpreted. Supported values: `"sfSymbol"`, `"file"`, `"text"`, `"iconify"`, and `"data"`.                        |
| `configuration` | Array  | No       | Defines a user-configurable settings UI for your plugin.                                                                                                        |
| `permissions`   | Array  | No       | Declares system permissions required by the plugin.                                                                                                             |

Routing note: SwiftBiu classifies file-like content before plain text. Local file URLs, Finder file copies, temporary files materialized from rich clipboard/image/HTML/WebArchive payloads, and remote file-like URLs route to `fileAction`. Plain text-only contexts route to `textAction`. File-capable plugins should check both `context.selectedFiles` and `context.selectedRemoteFiles`.

### Declarative Native Share Targets

Use `shareTargets` when your plugin only needs to hand selected content to native macOS sharing routes instead of running JavaScript. Supported `kind` values are `systemPicker`, `airDrop`, `urlScheme`, and `openWithApp`. Supported content values are `text`, `url`, `file`, and `image`.

```json
{
  "actions": [],
  "permissions": ["share", "localFileRead"],
  "shareTargets": [
    {
      "id": "whatsapp",
      "name": { "en": "Share to WhatsApp", "zh": "分享到 WhatsApp" },
      "kind": "urlScheme",
      "supportedContent": ["text", "url"],
      "urlTemplate": "whatsapp://send?text={{encodedText}}",
      "webFallback": "https://wa.me/?text={{encodedText}}"
    },
    {
      "id": "wechat",
      "name": { "en": "Open in WeChat", "zh": "用微信打开" },
      "kind": "openWithApp",
      "supportedContent": ["file", "image"],
      "bundleIdentifiers": ["com.tencent.xinWeChat", "com.tencent.WeChat"]
    }
  ]
}
```

### Plugin Icon Formats

SwiftBiu now supports multiple icon source types for the root-level plugin icon.

#### 1. SF Symbol
Use any valid SF Symbol name:

```json
{
  "icon": "sparkles",
  "iconType": "sfSymbol"
}
```

If `iconType` is omitted and the value does not look like an image file, SwiftBiu treats it as an SF Symbol by default.

#### 2. Packaged Image File
Use an image file bundled inside your plugin package. Common formats such as `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`, `.tif`, `.tiff`, `.heic`, `.icns`, `.pdf`, and `.svg` are supported.

```json
{
  "icon": "icon.png",
  "iconType": "file"
}
```

If `iconType` is omitted and the file name ends in a supported image extension, SwiftBiu will also infer it as a file icon automatically.

#### 3. Text Icon
Use short text such as initials or a compact label:

```json
{
  "icon": "AI",
  "iconType": "text"
}
```

You can also use the explicit prefix form:

```json
{
  "icon": "text:AI"
}
```

Notes:
* Up to 2 visible characters are rendered.
* Alphanumeric text is automatically uppercased.
* Text icons are best for compact labels like `AI`, `EN`, or `123`.

#### 4. Iconify Icon
Use any Iconify icon name, for example `solar:flag-bold` or `mdi:robot-happy`:

```json
{
  "icon": "solar:flag-bold",
  "iconType": "iconify"
}
```

You can also use the explicit prefix form:

```json
{
  "icon": "iconify:solar:flag-bold"
}
```

If you omit the `iconify:` prefix, make sure `iconType` is set to `"iconify"`.

#### 5. Data URI Icon
Use an inline `data:` URL when you want to embed the icon content directly in `manifest.json`:

```json
{
  "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "iconType": "data"
}
```

This is useful when your icon is generated dynamically or you want to avoid shipping a separate file.

#### Parsing Rules and Recommendations
* Explicit prefixes take priority over `iconType`. For example, `text:AI`, `iconify:solar:flag-bold`, and `data:image/png;base64,...` are recognized even if `iconType` is omitted or mismatched.
* For `Iconify`, prefer storing the clean icon name plus `iconType: "iconify"` in released plugins. The prefixed form is also valid and convenient for quick testing.
* For `file` icons, keep the asset inside the plugin package and reference it by file name.
* For `text` icons, keep the text short so it stays visually balanced in toolbars and lists.

#### Icon Design Best Practices

To ensure your plugin feels native and premium within the macOS environment:

*   **Prioritize Vectors**: Use SF Symbols or Iconify icons whenever possible. They scale perfectly and automatically adapt to system theme changes (Light/Dark mode) and user accent colors.
*   **Transparency is Key**: For custom image files, always use PNG or WebP with alpha transparency. Avoid solid backgrounds, as they won't blend seamlessly with the toolbar's vibrant materials.
*   **Optical Padding**: Leave approximately 10-15% empty padding around the main shape of your icon. This "breathing room" ensures the icon doesn't look cramped in the toolbar or menu bar rows.
*   **Design for Small Sizes**: Toolbar icons are typically rendered between 18px and 24px. Avoid complex details, fine textures, or small text that might become illegible or blurry.
*   **High Contrast**: Ensure your icon remains recognizable against both light and dark translucent backgrounds.

### Plugin Configuration (`configuration`)

If your plugin needs user-provided settings (like an API key), define them in the `configuration` array. SwiftBiu will automatically generate a settings UI.

**Example of a text input field:**
```json
"configuration": [
  {
    "key": "api_key",
    "label": "API Key",
    "description": "Your secret API key.",
    "type": "secure",
    "placeholder": "Enter your key here"
  }
]
```

Supported `type` values include: `string`, `secure` (for passwords), `boolean` (for switches), `option` (for dropdowns), and `fileExtensionAppRules` (for suffix-to-app rule editors).
Legacy `radioList` configurations are no longer supported. Migrate those cases to a normal `string` field or duplicate the extension for each fixed prompt variant.

Common optional fields:
*   `group` (String): Groups related settings into the same section in the native settings UI.
*   `placeholder` (String): Placeholder text for `string` / `secure` style inputs.
*   `description` (String): Long-form explanatory copy shown under the label.

#### Configuration UI Layout
Settings are rendered in a **vertical stack**. This design ensures that long labels and detailed descriptions are fully visible.
*   **Label**: Displayed at the top in a medium font.
*   **Description**: Displayed immediately below the label in a smaller, secondary font. This is the recommended place for detailed instructions or model-specific notes.
*   **Control**: The interactive element (text field, switch, etc.) is placed at the bottom.

> **⚠️ Important: All configuration values are returned as strings.**
>
> When you read a configuration value via `SwiftBiu.getConfig(key)` (background) or `swiftBiu.storage.get(key)` (UI), the result is **always a string**, regardless of the configuration type. This is by design — all settings are stored uniformly as strings in `UserDefaults` (or Keychain for `secure` type). You must convert them in your JavaScript code:
>
> | Type | Returns | How to Use |
> |------|---------|------------|
> | `string` / `secure` | The stored string | Use directly |
> | `boolean` | `"true"` or `"false"` | `SwiftBiu.getConfig("key") === "true"` |
> | `option` | The `value` of the selected option | Use directly |
> | `fileExtensionAppRules` | JSON string like `{"rules":[{"fileExtension":"pdf","appBundleID":"com.apple.Preview"}]}` | Parse with `JSON.parse(...)` and pass `appBundleID` to `SwiftBiu.openFileWithApp(...)` |

##### `option`
*   **UI**: A dropdown selection menu.
*   **Functionality**: Allows the user to select a value from a predefined set of options.
*   **Additional Keys**:
    *   `options` (Array, Yes): Defines the options in the dropdown. Each object in the array requires the following keys:
        *   `label` (String, Yes): The text displayed for the option in the UI.
        *   `value` (String, Yes): The actual value of the option, which is stored and retrieved in scripts via `storage.get()`.
    *   `defaultValue` (String, No): The `value` of the option that is selected by default.

**Example of a dropdown menu (`option`):**
```json
"configuration": [
  {
    "key": "targetLanguage",
    "label": "Target Language",
    "type": "option",
    "defaultValue": "Python (Requests)",
    "options": [
      { "label": "Python (Requests)", "value": "Python (Requests)" },
      { "label": "JavaScript (Fetch)", "value": "JavaScript (Fetch)" }
    ]
  }
]
```

##### `fileExtensionAppRules`
*   **UI**: A native suffix-rule editor. Users add one or more file suffixes on the left and choose one macOS app per suffix on the right.
*   **Functionality**: Best for file actions that need to open selected files with specific apps without asking users to type bundle identifiers.
*   **Stored value**: A JSON string with a `rules` array. Each rule uses `fileExtension` and `appBundleID`.
*   **Default value**: Optional stringified JSON in the same format.

**Example of suffix-to-app rules:**
```json
"configuration": [
  {
    "key": "rules",
    "label": "File Suffix Rules",
    "type": "fileExtensionAppRules",
    "description": "Add suffixes and choose the app used to open each one.",
    "defaultValue": "{\"rules\":[{\"fileExtension\":\"pdf\",\"appBundleID\":\"com.apple.Preview\"}]}"
  }
]
```

#### Configuration Keys: Generic vs Recognized Conventions
Most configuration `key` values are entirely plugin-defined. SwiftBiu stores them and returns them through `getConfig(...)`, but their meaning is decided by your own script.

Examples of **plugin-level conventions** used by the current AI text templates:
*   `pasteBehavior`: Read by the template script to decide the default apply mode (`append` vs `replace`).
*   `enableAIResponseUI`: Read by the template script to decide whether to open the native AI response bubble or directly paste the final text.
    *   By itself, this key does nothing at the native layer.
    *   It becomes effective only when your `script.js` explicitly checks `SwiftBiu.getConfig("enableAIResponseUI")` and branches into `showAIResponseBubble(...)` instead of the legacy direct-paste flow.
    *   In other words, this is a documented template convention, not a universal built-in manifest switch.

Examples of **currently recognized AI bubble convention keys**:
*   `responseSystemPrompt`: When `showAIResponseBubble(...)` is called without an explicit `systemPrompt`, the native layer will first look for this config value as the default system prompt.

Current fallback order for the bubble's default system prompt:
1. `responseSystemPrompt`
2. The manifest default for `responseSystemPrompt`

Recommendation:
*   If a key is only used by your own script, you may rename it freely as long as the script stays in sync.
*   If you rename `responseSystemPrompt`, you must also update the script and any native fallback assumptions you rely on.
*   If you need multiple fixed prompt personas, prefer duplicating the extension and customizing each copy instead of adding an in-extension preset switcher.
*   Treat these AI-related names as **documented conventions for the current native AI response workflow**, not as universal reserved keywords for every plugin.

### Core API Reference

The APIs available to your plugin depend entirely on which plugin architecture (Action Type) you chose in your `manifest.json`.

#### 1. Standard Action API (Logic-Only)
In a Standard Action, all code executes globally in the background `script.js`. You have direct access to the system-injected **`SwiftBiu`** (or its lowercase alias **`swiftBiu`**) object. The methods here are predominantly synchronous property reads or Callback-based asynchronous functions.

**Available API List:**
*   **Environment Context (Synchronous):**
    *   `SwiftBiu.isSandboxed`: (`Boolean`) Whether the app is currently running inside the macOS App Sandbox (restricted App Store version).
    *   `SwiftBiu.getConfig(key: String)`: (`String`) Synchronously reads user preference values defined in `manifest.json`.
*   **Native Capabilities (Synchronous):**
    *   `SwiftBiu.writeToClipboard(text: String)`: Writes text to the system clipboard. *(Requires: `clipboardWrite`)*
    *   `SwiftBiu.copyImage(base64String: String, options?: Object)`: Writes image output to the system clipboard and returns `Boolean`. Accepts raw Base64 or `data:image/...;base64,...`; `options` may include `{ mimeType, filename, fileBacked }`. With the default `fileBacked: true`, SwiftBiu writes a temporary file URL plus Finder-compatible filenames to the pasteboard, so users can paste into Finder/Desktop as an image file. Pass `fileBacked: false` for image-data-only writes to image editors. Use this for generated image output instead of browser clipboard APIs. *(Requires: `clipboardWrite`)*
    *   `SwiftBiu.pasteText(text: String)`: Writes text to the clipboard and immediately pastes it into the active window. *(Requires: `paste`)*
    *   `SwiftBiu.getClipboard()`: Retrieves plain text from the system clipboard. *(Requires: `clipboardRead`)*
    *   `SwiftBiu.getFileMetadata(path: String)`: Returns metadata for the selected local file, including size, timestamps, and content type. *(Requires: `localFileRead`)*
    *   `SwiftBiu.extractFileIcon(path: String, options?: Object)`: Extracts the selected file or application icon through SwiftBiu's native host process and returns `{ success, base64, fileName, width, height, format }` for PNG output, or `{ success: false, error }`. Use this for App Store-compatible icon extraction instead of shell, AppleScript, `sips`, `qlmanage`, or `osascript`. *(Requires: `localFileRead`)*
    *   `SwiftBiu.setFileIcon(targetPath: String, iconPath: String, options?: Object)`: Applies an accessible image as the custom Finder icon for an accessible file, folder, or `.app` bundle through SwiftBiu's native host process. Use this instead of shell tools when targeting the App Store sandbox. *(Requires: `localFileRead` and `localFileWrite`)*
    *   `SwiftBiu.readLocalFile(path: String)`: Reads any currently selected local file and returns its contents as a Base64 string. *(Requires: `localFileRead`)*
    *   `SwiftBiu.readLocalTextFile(path: String)`: Convenience API for decoding the current selected file as UTF-8 text. *(Requires: `localFileRead`)*
    *   `SwiftBiu.listDirectory(path: String)`: Lists items in an accessible directory and returns metadata objects for each child. *(Requires: `localFileRead`)*
    *   `SwiftBiu.fileExists(path: String)`: Returns whether an accessible path exists and is a file. *(Requires: `localFileRead` or `localFileWrite`)*
    *   `SwiftBiu.directoryExists(path: String)`: Returns whether an accessible path exists and is a directory. *(Requires: `localFileRead` or `localFileWrite`)*
    *   `SwiftBiu.pickLocalFile(options?: Object)`: Opens a native file picker, persists authorization for the selected item, and returns its path. Supports `kind: "application"` or `kind: "image"` and `allowedExtensions`. *(Requires: `localFileRead` or `localFileWrite`)*
    *   `SwiftBiu.pickLocalDirectory()`: Opens the macOS folder picker, stores the user's authorization, and returns the chosen folder path. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.createLocalDirectory(path: String)`: Creates a directory inside a selected or authorized location and returns the created path. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.createLocalFile(path: String, base64String: String)`: Creates a new file from Base64 data inside a selected or authorized location and returns the created path. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.writeLocalTextFile(path: String, text: String)`: Creates a new UTF-8 text file inside a selected or authorized location and returns the created path. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.overwriteLocalFile(path: String, base64String: String)`: Replaces the contents of an existing accessible file and returns the file path. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.renameLocalFile(path: String, newName: String)`: Renames a selected local file within its current directory. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.copyLocalFile(sourcePath: String, destinationPath: String)`: Copies a selected local file to an accessible destination path. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.moveLocalFile(sourcePath: String, destinationPath: String)`: Moves a selected local file to an accessible destination path. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.requestDirectoryAuthorization(path: String)`: Opens the native folder authorization panel, stores the chosen directories, and returns the first authorized path. Use this instead of pretending success when sandbox access is missing. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.hasAuthorizedDirectoryAccess(path: String)`: Returns whether a path is already covered by a persisted writable folder authorization. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.trashLocalItem(path: String)`: Moves a selected local file or an item inside an authorized directory to the macOS Trash. *(Requires: `localFileWrite`)*
    *   `SwiftBiu.openURL(urlString: String)`: Launches the default browser to open a link.
    *   `SwiftBiu.openFileInPreview(filePath: String)`: Opens a file using the macOS default app (e.g., Preview).
    *   `SwiftBiu.openFileWithApp(filePath: String, appBundleID: String)`: Opens an accessible selected or authorized file with the specified macOS app bundle ID. Returns `Boolean`. *(Requires: `localFileRead`)*
    *   `SwiftBiu.share(options?: Object)`: Uses SwiftBiu's native sharing bridge. With no target it opens the macOS share picker; with `{ target: "id" }` it runs a `shareTargets` entry from `manifest.json`. Returns `{ success, message? }`. *(Requires: `share`)*
    *   `SwiftBiu.showNotification(title: String, body: String)`: Sends a system-level notification. *(Requires: `notifications`)*
    *   `SwiftBiu.showImage(imageSource: String, position?: Object, context?: Object)`: Displays the native image toast card. `imageSource` accepts either a Base64 string or an `http/https` URL. *(Requires: `notifications`)*
    *   `SwiftBiu.showInteractiveImage(options, onRegenerate)`: Creates an interactive image session and returns a `sessionID`. Use it when you need regenerate/update behavior from the same image card. *(Requires: `notifications`)*
    *   `SwiftBiu.updateInteractiveImage(sessionID, options)` / `SwiftBiu.failInteractiveImage(sessionID, message)`: Updates or fails an existing interactive image session.
    *   `SwiftBiu.showLoadingIndicator(position: Object)` / `SwiftBiu.hideLoadingIndicator()`: Displays a native loading spinner at the specified coordinates. Recommended only for lightweight non-UI quick actions. For `displayUI(...)`, AI bubble, or image card flows, manage loading state inside your own UI/session.
*   **Advanced Operations:**
    *   `SwiftBiu.setConfig(key: String, value: String)`: (Synchronous) Persists a plugin configuration value back to native storage.
    *   `SwiftBiu.fetch(url, options, onSuccess, onError)`: (Callback Async) Initiates a low-level network request. *(Requires: `network`)*
    *   `SwiftBiu.fetchStream(url, options, onEvent, onError)`: (Synchronous Create) Starts a streaming network request and returns a `streamID`. *(Requires: `network`)*
    *   `SwiftBiu.cancelFetchStream(streamID: String)`: (Synchronous Cancel) Cancels an active streaming request created by `fetchStream(...)`.
    *   `SwiftBiu.runShellScript(script, context)`: (Synchronous) Executes a Bash/Zsh script and returns the output. Avoid this for App Store-compatible plugins because sandboxed builds can block subprocess execution and file-system access. *(Requires: `runShellScript`)*

#### 1.4 Native File Task Progress Panel (Background Script)
For file organizers, compressors, exporters, and other write-heavy actions, prefer the native file task panel instead of chaining multiple notifications.

These APIs are available directly in background `script.js`:

*   `SwiftBiu.beginFileTask(options)`: Creates a native file-processing session and returns a `sessionID`.
*   `SwiftBiu.updateFileTask(sessionID, options)`: Pushes incremental progress, logs, and structured status updates.
*   `SwiftBiu.finishFileTask(sessionID, options)`: Marks the task as completed.
*   `SwiftBiu.failFileTask(sessionID, options)`: Marks the task as failed and keeps the panel honest.

Recommended `options` fields:

*   Core progress: `headlineText`, `detailText`, `totalCount`, `completedCount`, `skippedCount`, `progress`, `batchItems`
*   Rich log stream: `activityEntries` with `{ message, category, isPinned }`
*   Plan preview: `summaryChips` with `{ title, count, tone }`
*   Grouped failures: `failureGroups` with `{ identifier, title, count, items, detailText }`
*   Native panel labels: `sectionTitles` with `planTitle`, `logTitle`, `fileTitle`, `failureTitle`, `actionTitle`
*   Completion actions: `actionButtons` with supported `kind` values `revealTargets` and `undoMoves`
*   Action payloads: `targetDirectoryPaths` and `undoOperations`

Recommended UX contract for file-processing plugins:

1. Show the category plan before the first write happens.
2. Ask for native folder authorization immediately when access is missing, then stop cleanly on cancel.
3. Stream structural milestones such as folder creation, move start, conflict skip, and category completion.
4. Group conflicts and permission failures separately instead of flattening everything into one “failed” bucket.
5. Offer lightweight completion actions such as “open target folder” and “undo this run” only after you have the required payloads.

#### 1.5 Native AI Response Bubble (Background Script)
For AI plugins such as Doubao, OpenAI, or Gemini, prefer SwiftBiu's native AI response bubble instead of building a second floating window from scratch.

These APIs are available directly in background `script.js` and require the `ui` permission:

*   `SwiftBiu.showAIResponseBubble(options, onEvent)`: (Synchronous Create) Displays the native AI response bubble and returns a `sessionID`.
*   `SwiftBiu.updateAIResponseBubble(sessionID, options)`: (Synchronous Update) Updates state, status, generated text, and button availability.
*   `SwiftBiu.failAIResponseBubble(sessionID, message)`: (Synchronous Update) Switches the bubble into a failed state with a message.
*   `SwiftBiu.closeAIResponseBubble(sessionID)`: (Synchronous Close) Closes the current bubble session.

Useful `onEvent(event)` values:

*   `configChanged`: The user changed `mode`, `systemPrompt`, `userPrompt`, or section visibility.
*   `submit`: The user confirmed applying the current text. The event includes `text`, `mode`, `systemPrompt`, and `userPrompt`.
*   `regenerate`: The user requested a fresh generation using the current prompt values.
*   `previewPoster` / `sharePoster`: Poster preview and share actions from the native bubble.

Recommended background workflow:

1. Call `showAIResponseBubble(...)` with the minimal fields your plugin truly needs, usually `title`, `mode`, and an `onEvent` handler.
2. For one-shot APIs, use `SwiftBiu.fetch(...)` and update the bubble once on completion.
3. For true streaming APIs, use `SwiftBiu.fetchStream(...)`, parse SSE or chunked output in your script, and repeatedly call `updateAIResponseBubble(...)` with the cumulative full text.
4. When handling `configChanged`, persist settings such as `mode` or custom prompts through `SwiftBiu.setConfig(...)`.
5. When handling `regenerate`, cancel any in-flight stream via `cancelFetchStream(...)` before starting a new request.
6. When handling `submit`, let the background script decide whether to replace or append, then apply the text with `pasteText(...)`.

Best-practice defaults:

*   Omit `systemPrompt` when you want the native layer to resolve it from plugin configuration. The current fallback order is `responseSystemPrompt` -> manifest default.
*   Omit `promptVisible` and `userPromptVisible` if you want both prompt editors hidden by default.
*   Omit `submitLabel`, `replaceLabel`, and `appendLabel` unless you truly need a plugin-specific override. Native localization should own those labels.
*   Only pass `state` or `status` when your plugin needs a custom state transition or custom wording.

#### 2. Web App Action API (Custom UI)
Web App Actions employ a physically isolated dual-sandbox system. Under this architecture, APIs are strictly divided into the **"Background Launcher"** and the **"User Frontend Interface"**, isolating them from one another:

> [!IMPORTANT]
> **Are the APIs Interchangeable?**
> They are **NOT interchangeable**. They are distinct and mutually exclusive. For instance, obtaining a plugin configuration is called `SwiftBiu.getConfig()` (Synchronous) in the background sandbox, but `window.swiftBiu.storage.get()` (Async Promise) in the frontend sandbox. Ensure you are **referencing the correct API for the sandbox your code is currently running in**.

##### A. Background Launcher API (`script.js`)
In a Web App's background script, complex business logic is omitted. Its primary responsibility is gathering context and launching the web page.

*   **`SwiftBiu.displayUI(options: Object)`**
    *   **Purpose**: Called during the `performAction` lifecycle to explicitly trigger the rendering of `index.html`.
    *   **Parameters `options`**:
        *   `htmlPath` (String, Required): Relative path strictly to the main HTML document (e.g., `"ui/index.html"`).
        *   `width` (Number, Optional) / `height` (Number, Optional): Initial window dimensions for the web popup.
        *   `isFloating` (Boolean, Optional): Should the window continue floating on top after losing focus (Default `false`).
    *   *Note: You may still utilize the `SwiftBiu.screenSize` property to help compute the popup's initial `position` parameter.*

##### B. Web UI API (`window.swiftBiu`)
Once the HTML UI is successfully displayed, the system assumes control and injects a bridging object into the page’s global scope to communicate natively. **It is highly recommended to prefix calls with `window.` to explicitly state the scope.**

*   **Data Injection Hook (Core)**:
    *   `window.swiftBiu_initialize = async function(context) { ... }` : You MUST define this global function in your HTML. After the page finishes loading, the system automatically calls it and injects the `context` parameter (such as highlighted text or selected local files) from the background.
    *   `context.selectedText`: The original selected text.
    *   `context.selectedFiles`: An array of inferred local file descriptors from the current selection. It can contain native local files and temporary files materialized by SwiftBiu from rich clipboard image data, HTML data URIs, or WebArchive resources. Each item contains `{ path, fileURL, fileName, fileExtension }`.
    *   `context.selectedRemoteFiles`: An array of remote file-like URL descriptors recognized from the current selection or HTML clipboard payloads. Each item contains `{ url, fileURL, fileName, fileExtension }`. These are not local files and cannot be passed to local-file APIs.
    *   `context.locale`: The user's preferred locale identifier, such as `zh-Hans` or `en-US`.
    *   `context.languageCode`: A simplified language code such as `zh` or `en`.
    *   Selection and file context notes:
        *   SwiftBiu classifies file-like content before plain text. If a pasteboard payload contains both a display name string and a file resource, `fileAction` routing wins.
        *   Use `context.selectedFiles` when the host has already recognized local files for the current context. Treat materialized temporary paths as read-only inputs for the current action; do not assume they are the user's original file locations.
        *   Use `context.selectedRemoteFiles` for file-like web URLs. Fetch or open them through network/URL workflows instead of `readLocalFile(...)`.
        *   If the user context only contains text-form paths (for example, newline-separated POSIX paths or `file://` URLs), your plugin may still parse `context.selectedText` or the result of `SwiftBiu.getClipboard()` itself.
        *   On macOS, some sources such as Finder file copies may provide both display text and native file URLs. SwiftBiu preserves those native file URLs when possible and maps them into `context.selectedFiles` even if `context.selectedText` only contains file names.
        *   Plugin JavaScript can currently read **plain text** from the clipboard via `SwiftBiu.getClipboard()`. Reading native file-URL objects directly from the macOS pasteboard, like some built-in native actions do, is not guaranteed by the current plugin API.
*   **Bridge Capabilities (Mind the Async Boundaries)**:
    *While the bridge code wraps all these APIs in a Promise (meaning you can technically `await` all of them), on the native Swift side they are strictly divided into **Data-Returning** (true async await) and **Trigger-Based** (Fire-and-Forget, no `await` needed).*
    *   **Methods that REQUIRE `await` for data:**
        *   `window.swiftBiu.fetch(url, options)`: Returns `{ status: Number, data: String }`. *(Requires: `network`)*
        *   `window.swiftBiu.storage.get(key)`: Returns `{ result: String }`.
        *   `window.swiftBiu.getFileMetadata(path)`: Returns a metadata object for the selected local file. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.extractFileIcon(path, options)`: Returns `{ success, base64, fileName, width, height, format }` or `{ success: false, error }`. Use this host-mediated PNG icon extraction API for App Store sandbox compatibility. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.setFileIcon(targetPath, iconPath, options)`: Returns `{ success, targetPath, iconPath }` or `{ success: false, error }`. Applies an accessible image as a custom Finder icon for an accessible file, folder, or `.app` bundle. *(Requires: `localFileRead` and `localFileWrite`)*
        *   `window.swiftBiu.readLocalFile(path)`: Returns `{ base64: String }`. Reads any local file from the current `context.selectedFiles` only; do not pass `context.selectedRemoteFiles`. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.readLocalTextFile(path)`: Returns `{ result: String }`. Convenience API for decoding the current selected file as UTF-8 text. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.listDirectory(path)`: Returns `{ items: Array<Object> }`. Lists direct children of an accessible directory. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.fileExists(path)`: Returns `{ exists: Boolean }`. Checks whether an accessible path exists as a file. *(Requires: `localFileRead` or `localFileWrite`)*
        *   `window.swiftBiu.directoryExists(path)`: Returns `{ exists: Boolean }`. Checks whether an accessible path exists as a directory. *(Requires: `localFileRead` or `localFileWrite`)*
        *   `window.swiftBiu.copyImage(base64String, options)`: Returns `Boolean`. Writes image output to the system clipboard. Accepts raw Base64 or `data:image/...;base64,...`; `options` may include `{ mimeType, filename, fileBacked }`. With the default `fileBacked: true`, SwiftBiu writes a temporary file URL plus Finder-compatible filenames to the pasteboard, so users can paste into Finder/Desktop as an image file. Pass `fileBacked: false` for image-data-only writes to image editors. Use this instead of `navigator.clipboard.write(...)` for generated images; browser `ClipboardItem({ "image/png": ... })` writes image pixels, not a Finder-pasteable file. *(Requires: `clipboardWrite`)*
        *   `window.swiftBiu.runShellScript(script, context)`: Returns `{ result: String }`. Do not rely on this for App Store-compatible plugins. *(Highly restricted by App Store sandbox).*
    *   **Trigger-Based Methods (No `await` needed):**
        *(Although they return a JS Promise, the native side resolves them immediately upon receiving the command without blocking to wait for side-effects like dialogs. Treat them as synchronous triggers.)*
        *   `window.swiftBiu.copyText(text)`: Copies text to the system clipboard.
        *   `window.swiftBiu.pasteText(text)`: Copies and actively pastes text into the focused window.
        *   `window.swiftBiu.openURL(url)`: Opens a Web URL via the default browser.
        *   `window.swiftBiu.openFileWithApp(path, appBundleID)`: Returns `{ success: Boolean }`. Opens an accessible selected or authorized file with the specified macOS app bundle ID. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.share(options)`: Returns `{ success, message? }`. Opens the native share picker or runs a manifest-declared `shareTargets` entry. *(Requires: `share`)*
        *   `window.swiftBiu.speakText(text)`: Utilizes the macOS native TTS to speak the given text aloud.
        *   `window.swiftBiu.pickLocalFile(options)`: Returns `{ path: String }`. Opens the native file picker and persists authorization for the selected item. Supports `kind: "application"` or `kind: "image"`. *(Requires: `localFileRead` or `localFileWrite`)*
        *   `window.swiftBiu.pickLocalDirectory()`: Returns `{ path: String }`. Opens the native folder picker and persists the chosen writable location. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.createLocalDirectory(path)`: Returns `{ path: String }`. Creates a directory inside a selected or authorized location. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.createLocalFile(path, base64String)`: Returns `{ path: String }`. Creates a new file from Base64 data inside a selected or authorized location. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.writeLocalTextFile(path, text)`: Returns `{ path: String }`. Creates a new UTF-8 text file inside a selected or authorized location. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.overwriteLocalFile(path, base64String)`: Returns `{ path: String }`. Replaces the contents of an existing accessible file. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.renameLocalFile(path, newName)`: Returns `{ path: String }`. Renames a selected local file in place. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.copyLocalFile(sourcePath, destinationPath)`: Returns `{ path: String }`. Copies a selected local file to an accessible destination path. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.moveLocalFile(sourcePath, destinationPath)`: Returns `{ path: String }`. Moves a selected local file to an accessible destination path. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.trashLocalItem(path)`: Returns `{ success: Boolean }`. Moves a selected local file or an item in an authorized location to the macOS Trash. *(Requires: `localFileWrite`)*
        *   `window.swiftBiu.saveLocalFile(base64String, filename)`: Triggers the macOS native "Save As" dialogue for arbitrary file data.
        *   `window.swiftBiu.exportFile(base64String, filename)`: Backward-compatible alias for `saveLocalFile(...)`.
*   **Window Lifecycles and Fluid Control (Trigger-Based):**
    *   `window.swiftBiu.ui.resizeWindow({ height: Number })`: Dynamically adjusts the height of the Web App window for responsive popups. (Recommend leaving a 30px buffer).
    *   `window.swiftBiu.closeWindow()`: (Trigger-Based) Closes its own Web UI window instantly. *(Note: The JS context immediately dies; code after this call may not execute).*

##### Best Practice for Auto-Resizing Height
To achieve perfect, smooth resizing, follow this CSS and JavaScript strategy:
1.  **CSS**: Set `background-color: transparent;` on `<html>` and apply your main background styles (like frosted glass) to `<body>` with `min-height: 100vh;`. Let your main content container resize naturally without a fixed height.
2.  **JavaScript**: After your content is rendered, manually calculate the total height of all visible elements (`element.offsetHeight`) and add a **sufficient buffer (e.g., 30px - 50px)**. This buffer is crucial to prevent content from being clipped by window edges or shadows. Call `resizeWindow` with this calculated height. This is more reliable than `ResizeObserver` or `document.body.scrollHeight` alone.

##### Native File and Folder Selection
Plugins can trigger native macOS file and folder selection dialogs directly from the Web UI.
*   **File Selection**: Use a standard `<input type="file">`.
*   **Folder Selection**: Add the `webkitdirectory` attribute: `<input type="file" webkitdirectory>`.
*(Best Practice: use the `FileReader` API to read the file content as an `ArrayBuffer` or `DataURL` as soon as the user selects the files, and cache that data. Avoid relying on the same `File` object for too long).*

##### Best Practice for Sandboxed File Creation
When a plugin needs to create files or folders inside the App Store sandbox, prefer this flow:
1. Call `pickLocalDirectory()` so the user explicitly chooses a writable folder.
2. Create subfolders with `createLocalDirectory(...)` and files with `createLocalFile(...)` underneath that returned path.
3. Use `trashLocalItem(...)` instead of permanently deleting content.

##### Best Practice for App Icon and File Icon Extraction
If a plugin needs to export a selected app's icon, do not inspect `.app/Contents/Info.plist` yourself or invoke external tools such as `sips`, `qlmanage`, shell scripts, AppleScript, or `osascript`. Those paths may work in the website/developer build and fail in the App Store sandbox.

Use the host-mediated API instead:

```javascript
function performAction(context) {
    const selectedApp = (context.selectedFiles || []).find(file => {
        const path = String(file.path || "").toLowerCase();
        return path.endsWith(".app");
    });
    if (!selectedApp) {
        SwiftBiu.showNotification("Extract App Icon", "Select a .app first.");
        return;
    }

    const icon = SwiftBiu.extractFileIcon(selectedApp.path, { size: 1024 });
    if (!icon || icon.success !== true || !icon.base64) {
        SwiftBiu.showNotification("Extract App Icon", icon && icon.error ? icon.error : "Icon extraction failed.");
        return;
    }

    const folder = SwiftBiu.pickLocalDirectory();
    if (!folder) return;

    const outputPath = folder.replace(/\/+$/, "") + "/" + (icon.fileName || "App_Icon.png");
    const savedPath = SwiftBiu.createLocalFile(outputPath, icon.base64);
    if (savedPath) SwiftBiu.openFileInPreview(savedPath);
}
```
