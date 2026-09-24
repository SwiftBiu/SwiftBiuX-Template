# Manifest, Configuration & Core APIs

> [!NOTE]
> **AI-Ready Quick Fact (Manifest Schema & Core APIs)**
> - **Unique ID**: `identifier` (e.g. `com.author.plugin`) must be unique to prevent system overwrites.
> - **Action Isolation**: Standard Actions (background `script.js` sandbox) vs Web App Actions (physically isolated `ui/index.html` frontend sandbox).
> - **Native Bridges**: `SwiftBiu.beginFileTask(options)` for Progress Panel, `SwiftBiu.showAIResponseBubble(...)` for Streaming AI panel, `window.swiftBiu` for Web UI async data bindings.

---

## Two Types of Plugin Actions

To meet different complexity requirements, SwiftBiu supports two distinct plugin architectures. To intuitively understand their differences, let's compare two implementations of a "Currency Converter" feature:

### 1. Standard Action (Logic-Only)
**Example**: `CurrencyConverterLite` (Minimalist Converter)

Suitable for scenarios that only need background logic execution (API calls, text extraction, data calculation) and **absolutely no custom user interface**. All interactions are completed using native system components (like system notifications, native input fields, or pasting directly to the clipboard).

#### `manifest.json` Configuration
Define the action in the `actions` array. No `ui` node is needed:

```json
"actions": [
  {
    "title": "Lite: Convert Currency",
    "script": "script.js" 
  }
]
```

#### `script.js` Core Logic
Running in a global background sandbox, you must implement two hook functions:

*   `isAvailable(context)`: The action trigger. You can analyze `context.selectedText` (e.g., using regex to check if "100 USD" is selected) to determine whether the action should be **highlighted at the very front of the toolbar** (`isContextMatch: true`).
*   `performAction(context)`: The core functionality. After making a network request for the latest rates and calculating "720 CNY", since there is no custom UI, you **must use native APIs** to feed the result back to the user:
    ```javascript
    function performAction(context) {
        // ... (API calculation logic) ...
        const result = "720 CNY";
        
        // Use native Clipboard API to return the result
        SwiftBiu.copyText(result); 
        // Use native Notification API to alert the user
        SwiftBiu.showNotification("Success", `Copied: ${result}`);
    }
    ```

---

### 2. Web App Action (Custom UI)

**Example**: `CurrencyConverter` (Advanced Converter Panel)

This is the most powerful and flexible mode. Suitable for scenarios requiring complex interactions, form inputs, animations, or full visual presentations. This mode turns your plugin into a complete mini Web App packaged with HTML/CSS/JS.

#### `manifest.json` Configuration
In addition to the script configuration used in Standard Actions, you must declare the entry point for your Web UI via a root-level `ui` attribute:

```json
"actions": [
  {
    "title": "Pro: Currency Panel",
    "script": "script.js" // Receives the click event and launches the UI
  }
],
"ui": {
  "main": "ui/index.html" // The Web App's entry page
}
```

#### Launch Flow & Architecture Isolation (Core Difference)
In Web App mode, the background script (`script.js`) no longer handles business calculations; it acts solely as a "Launcher". The flow is divided into two clear steps, and **the frontend and backend run in two physically isolated sandboxes**:

**Step 1: Background Trigger** 
You must explicitly call `SwiftBiu.displayUI()` within `performAction` in `script.js`:
```javascript
function performAction(context) {
    const screenSize = SwiftBiu.screenSize;
    // Launch the custom web window hosting index.html
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 320,
        height: 480,
        // ... other configs
    });
}
```

**Step 2: Frontend Takeover & Context Injection**
Once `displayUI()` is called, the user-facing interface is completely taken over by the frontend code in `index.html`. Furthermore, you **do not need to manually pass data between these two isolated sandboxes**.
SwiftBiu automatically injects the identical `context` (like the selected text) directly into the page's global window object. You simply need to define a `swiftBiu_initialize` hook in your `ui/index.html` to receive it:

```javascript
// In ui/index.html
window.swiftBiu_initialize = async function (context) {
    // The UI receives the context directly!
    const text = context.selectedText || "";
    const selectedFiles = context.selectedFiles || [];
    console.log("User selected:", text);
    
    // You can now proceed to use window.swiftBiu.fetch for API calls 
    // and update the DOM with the results...
};
```


---

## Manifest & Configuration

### `manifest.json` Explained

This file is the "ID card" for your plugin. Here are the most important keys:

| Key             | Type   | Required | Description                                                                                                                                                     |
| --------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identifier`    | String | Yes      | A unique ID for your plugin, e.g., `com.yourname.plugin`. **Must be globally unique, as a plugin with a duplicate identifier will overwrite any existing one.** |
| `name`          | String | Yes      | The display name of your plugin.                                                                                                                                |
| `author`        | String | Yes      | Author of the plugin.                                                                                                                                    |
| `description`   | String | Yes      | Short introduction to the plugin.                                                                                                                          |
| `version`              | String        | Yes      | The plugin's version, e.g., `1.0.0`. Increment when changing permissions or domains.                                            |
| `minAppVersion`        | String        | No       | Minimum required SwiftBiu client version (e.g. `"1.2.0"`). Old clients will prompt user to update instead of failing decoding. |
| `actions`              | Array         | Yes      | An array defining the actions the plugin provides.                                                                              |
| `icon`                 | String        | No       | **(Root Level)** The default icon for the entire plugin. Supports SF Symbols, packaged image files, text icons, Iconify icons, or a `data:` URI payload.        |
| `iconType`             | String        | No       | **(Root Level)** Defines how `icon` should be interpreted. Supported values: `"sfSymbol"`, `"file"`, `"text"`, `"iconify"`, and `"data"`.                        |
| `iconLottieStillFrame` | String/Number | No       | Optional static frame for Lottie icon: `"first"`, `"last"`, or frame number.                                                   |
| `iconScale`            | Number        | No       | Optional scale factor for plugin icons (`0.5`–`2.0`).                                                                           |
| `extensionKind`        | String        | Yes      | Root action context: `textAction` or `fileAction`. Repeat it on every action.                                                   |
| `configuration`        | Array         | No       | Defines a user-configurable settings UI for your plugin.                                                                        |
| `permissions`          | Array         | No       | Declares system permissions required by the plugin.                                                                             |
| `requiredShortcuts`    | Array         | No       | Declares required system Shortcuts dependencies for AppleScript+Shortcut plugins.                                               |
| `ui`                   | Object        | No       | Packaged Web UI entry point.                                                                                                    |
| `shareTargets`         | Array         | No       | Declarative native sharing targets.                                                                                             |
| `network`              | Object        | No       | Declared outbound domain metadata.                                                                                              |
| `ai`                   | Object        | No       | SwiftBiu-managed AI use case, provider/model keys, and optional `allowedProviders`.                                             |

For native AI extensions, declare `ai.useCase`, `providerKey`, and `modelKey`. Provider-specific extensions should also declare `allowedProviders`; SwiftBiu applies the same allowlist to the native picker and every runtime proxy request. Action-level `ai` replaces the root declaration for that action, so repeat all required fields. See the [SwiftBiu-managed AI provider contract](references/native-ai.md).

### Network Domains & Runtime Security Policy (`network`)

If your extension makes external network requests (`SwiftBiu.fetch`, `SwiftBiu.fetchStream`, Web UI fetch, external redirects, etc.), you must:
1. Include `"network"` in `permissions`;
2. Explicitly declare all destination hostnames in `network.domains`:

```json
"network": {
  "domains": [
    {
      "host": "api.frankfurter.app",
      "purpose": "Live currency conversion rates"
    }
  ]
}
```

- **Runtime Security Enforcement**: SwiftBiu evaluates every network request and redirect (301/302). Undeclared hosts are blocked by the runtime with a security alert guiding the user to update the extension.
- **Version Bumping Rule**: Whenever you modify `permissions`, `network.domains`, or `configuration`, you **must increment the `version` field in `manifest.json`** (e.g. `"version": "1.0.1"` -> `"1.0.2"`).
- **Packaging and Distribution**: After bumping the version, run `./scripts/build_plugin.sh <PluginDirectory>` to regenerate the `.swiftbiux` bundle, then execute `node scripts/generate_catalog.js` to refresh official catalog metadata.

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
    *   `SwiftBiu.showNotification(title: String, body: String)`: Sends a system-level notification. *(Requires: `notifications`)*
    *   `SwiftBiu.showImage(imageSource: String, position?: Object, context?: Object)`: Displays the native image toast card. `imageSource` accepts either a Base64 string or an `http/https` URL. *(Requires: `notifications`)*
    *   `SwiftBiu.showInteractiveImage(options, onRegenerate)`: Creates an interactive image session and returns a `sessionID`. Use it when you need regenerate/update behavior from the same image card. *(Requires: `notifications`)*
    *   `SwiftBiu.updateInteractiveImage(sessionID, options)` / `SwiftBiu.failInteractiveImage(sessionID, message)`: Updates or fails an existing interactive image session.
    *   `SwiftBiu.showVideo(...)` / `showInteractiveVideo(...)` / `updateInteractiveVideo(...)` / `failInteractiveVideo(...)`: Displays and updates native video result sessions. *(Requires: `notifications`)*
    *   `SwiftBiu.showAudio(...)` / `showInteractiveAudio(...)` / `updateInteractiveAudio(...)` / `failInteractiveAudio(...)`: Displays and updates native audio result sessions. *(Requires: `notifications`)*
    *   `SwiftBiu.showLoadingIndicator(position: Object)` / `SwiftBiu.hideLoadingIndicator()`: Displays a native loading spinner at the specified coordinates. Recommended only for lightweight non-UI quick actions. For `displayUI(...)`, AI bubble, or image card flows, manage loading state inside your own UI/session.
*   **Advanced Operations:**
    *   `SwiftBiu.setConfig(key: String, value: String)`: (Synchronous) Persists a plugin configuration value back to native storage.
    *   `SwiftBiu.fetch(url, options, onSuccess, onError)`: (Callback Async) Initiates a low-level network request. *(Requires: `network`)*
    *   `SwiftBiu.fetchStream(url, options, onEvent, onError)`: (Synchronous Create) Starts a streaming network request and returns a `streamID`. *(Requires: `network`)*
    *   `SwiftBiu.cancelFetchStream(streamID: String)`: (Synchronous Cancel) Cancels an active streaming request created by `fetchStream(...)`.
    *   SwiftBiu-managed AI: `aiProviderProfiles`, `aiImageModels`, `aiChat`, `aiChatStream`, `aiImageGenerate`, `aiVideoGenerate`, `aiTextToSpeech` / `aiTTS`, and `aiSpeechToText` / `aiTranscribe` / `aiSTT`. Provider requests require `network`; STT also requires `localFileRead`. See [Native AI Contract](references/native-ai.md).
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
    *   `context.selectedFiles`: An array of inferred local file descriptors from the current selection. It can contain any local file type. Each item contains `{ path, fileURL, fileName, fileExtension }`.
    *   `context.locale`: The user's preferred locale identifier, such as `zh-Hans` or `en-US`.
    *   `context.languageCode`: A simplified language code such as `zh` or `en`.
        *   Use this when the host has already recognized local files for the current context. If the user context only contains text-form paths (for example, newline-separated POSIX paths or `file://` URLs), your plugin should parse `context.selectedText` or the result of `SwiftBiu.getClipboard()` itself.
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
        *   `window.swiftBiu.readLocalFile(path)`: Returns `{ base64: String }`. Reads any local file from the current `context.selectedFiles` only. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.readLocalTextFile(path)`: Returns `{ result: String }`. Convenience API for decoding the current selected file as UTF-8 text. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.listDirectory(path)`: Returns `{ items: Array<Object> }`. Lists direct children of an accessible directory. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.fileExists(path)`: Returns `{ exists: Boolean }`. Checks whether an accessible path exists as a file. *(Requires: `localFileRead` or `localFileWrite`)*
        *   `window.swiftBiu.directoryExists(path)`: Returns `{ exists: Boolean }`. Checks whether an accessible path exists as a directory. *(Requires: `localFileRead` or `localFileWrite`)*
        *   `window.swiftBiu.runShellScript(script, context)`: Returns `{ result: String }`. Do not rely on this for App Store-compatible plugins. *(Highly restricted by App Store sandbox).*
    *   **Trigger-Based Methods (No `await` needed):**
        *(Although they return a JS Promise, the native side resolves them immediately upon receiving the command without blocking to wait for side-effects like dialogs. Treat them as synchronous triggers.)*
        *   `window.swiftBiu.copyText(text)`: Copies text to the system clipboard.
        *   `window.swiftBiu.pasteText(text)`: Copies and actively pastes text into the focused window.
        *   `window.swiftBiu.openURL(url)`: Opens a Web URL via the default browser.
        *   `window.swiftBiu.openFileWithApp(path, appBundleID)`: Returns `{ success: Boolean }`. Opens an accessible selected or authorized file with the specified macOS app bundle ID. *(Requires: `localFileRead`)*
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


---

## 📚 Citation & AI Reference
Cite the manifest schema and background sandbox specifications: https://swiftbiu.com/developer/manifest/
