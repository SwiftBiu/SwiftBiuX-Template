[Switch to Chinese (切换到中文)](DEVELOPMENT_GUIDE_zh.md)

# SwiftBiu Plugin Development Guide

Welcome to the SwiftBiu plugin development world! This guide will help you create powerful plugins using modern web technologies.

With SwiftBiu's "Rich Web Application" model, you can build plugins with custom user interfaces using HTML, CSS, and JavaScript, providing a seamless, native-like experience for users.

## 🤖 AI-Assisted Development

Want AI to generate plugin code for you instantly?

This template repository includes our official **AI Skill** document located at `AI_SKILL.md`. This file contains the complete SwiftBiuX plugin development specifications (including cross-platform UI responsiveness rules, permission mechanisms, and API degradation strategies).

**How to use it:**
Simply provide the `AI_SKILL.md` file as context to your favorite AI code assistant (like **Cursor**, **GitHub Copilot**, or **Smart AI**) and describe your idea in natural language.
*Prompt Example:*
> "Read the `AI_SKILL.md` file. Build a Rich Web App plugin named `TextCounter` that provides real-time character and word counting."

The AI will intelligently follow our guidelines to generate flawless, mobile-ready plugin code for you!

---

## Quick Start

This section will guide you to create and run your first "Hello World" plugin within 5 minutes.

> **💡 Tip**: SwiftBiu supports two plugin complexities (UI-less logic plugins, and Web App plugins with native interfaces). To help you experience the full workflow as fast as possible, this tutorial will guide you in writing the simplest **Logic-only Action Plugin (Standard Plugin)**.

## 🚀 Quick Start (Recommended)

The easiest way to start building a SwiftBiuX plugin is using our official CLI scaffolding tool. It generates a ready-to-use, cross-platform template in seconds.

```bash
npx create-swiftbiux-plugin <YourPluginName>
```

Alternatively, if you prefer to clone this entire repository:

### Step 1: Get the Development Template
To jumpstart your development, we provide an out-of-the-box plugin template repository with built-in packaging scripts and directory structures.
Open your terminal, clone the template to your local machine, and enter the directory:

```bash
git clone https://github.com/SwiftBiu/SwiftBiuX-Template.git
cd SwiftBiuX-Template
```

### Step 2: Write Hello World
Inside the repository directory, create a new folder named `HelloWorld`. A minimalistic SwiftBiu plugin requires at least two files.

**1. Create `manifest.json` (Plugin Configuration)**
This is the identity card of your plugin. Create this file in the `HelloWorld` directory and paste the following:

```json
{
  "identifier": "com.yourname.helloworld",
  "name": "Hello World",
  "author": "Your Name",
  "version": "1.0",
  "description": "My first SwiftBiu plugin",
  "icon": "sparkles",
  "iconType": "sfSymbol",
  "actions": [
    {
      "title": "Say Hello",
      "script": "script.js"
    }
  ]
}
```

**2. Create `script.js` (Core Logic)**
Still in the `HelloWorld` directory, create `script.js`. When a user clicks your plugin in SwiftBiu, this code will execute:

```javascript
function isAvailable(context) {
    // Returning true means this plugin action is always visible in the menu
    return true; 
}

function performAction(context) {
    // Pop up a system notification
    SwiftBiu.showNotification("🎉 Hello!", "Welcome to the world of SwiftBiu plugin development!");
}
```

### Step 3: Package and Witness the Magic
The code is ready! Return to the repository root directory (which contains the `scripts` folder) and run the packaging script in your terminal, passing your plugin folder name as an argument:

```bash
./scripts/build_plugin.sh HelloWorld
```

**🎉 Success!**
Once the command finishes, you will find a generated `HelloWorld.swiftbiux` distribution file in the directory.
Simply **double-click** this file, and SwiftBiu will automatically launch and install your plugin. Bring up the SwiftBiu menu, click the "Say Hello" button, and look at the notification popping up in the top right corner!

> Once you've mastered the basic flow, you can continue reading the next section to learn about deeper plugin architecture design.

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
| `version`       | String | Yes      | The plugin's version, e.g., `1.0`.                                                                                                                              |
| `actions`       | Array  | Yes      | An array defining the actions the plugin provides.                                                                                                        |
| `icon`          | String | No       | **(Root Level)** The default icon for the entire plugin. Supports SF Symbols, packaged image files, text icons, Iconify icons, or a `data:` URI payload.        |
| `iconType`      | String | No       | **(Root Level)** Defines how `icon` should be interpreted. Supported values: `"sfSymbol"`, `"file"`, `"text"`, `"iconify"`, and `"data"`.                        |
| `configuration` | Array  | No       | Defines a user-configurable settings UI for your plugin.                                                                                                        |
| `permissions`   | Array  | No       | Declares system permissions required by the plugin.                                                                                                             |

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
    *   `SwiftBiu.readLocalFile(path: String)`: Reads any currently selected local file and returns its contents as a Base64 string. *(Requires: `localFileRead`)*
    *   `SwiftBiu.readLocalTextFile(path: String)`: Convenience API for decoding the current selected file as UTF-8 text. *(Requires: `localFileRead`)*
    *   `SwiftBiu.listDirectory(path: String)`: Lists items in an accessible directory and returns metadata objects for each child. *(Requires: `localFileRead`)*
    *   `SwiftBiu.fileExists(path: String)`: Returns whether an accessible path exists and is a file. *(Requires: `localFileRead` or `localFileWrite`)*
    *   `SwiftBiu.directoryExists(path: String)`: Returns whether an accessible path exists and is a directory. *(Requires: `localFileRead` or `localFileWrite`)*
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
    *   `SwiftBiu.showLoadingIndicator(position: Object)` / `SwiftBiu.hideLoadingIndicator()`: Displays a native loading spinner at the specified coordinates. Recommended only for lightweight non-UI quick actions. For `displayUI(...)`, AI bubble, or image card flows, manage loading state inside your own UI/session.
*   **Advanced Operations:**
    *   `SwiftBiu.setConfig(key: String, value: String)`: (Synchronous) Persists a plugin configuration value back to native storage.
    *   `SwiftBiu.fetch(url, options, onSuccess, onError)`: (Callback Async) Initiates a low-level network request. *(Requires: `network`)*
    *   `SwiftBiu.fetchStream(url, options, onEvent, onError)`: (Synchronous Create) Starts a streaming network request and returns a `streamID`. *(Requires: `network`)*
    *   `SwiftBiu.cancelFetchStream(streamID: String)`: (Synchronous Cancel) Cancels an active streaming request created by `fetchStream(...)`.
    *   `SwiftBiu.runShellScript(script, context)`: (Synchronous) Executes a Bash/Zsh script and returns the output. *(Requires: `runShellScript`)*

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
        *   `window.swiftBiu.readLocalFile(path)`: Returns `{ base64: String }`. Reads any local file from the current `context.selectedFiles` only. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.readLocalTextFile(path)`: Returns `{ result: String }`. Convenience API for decoding the current selected file as UTF-8 text. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.listDirectory(path)`: Returns `{ items: Array<Object> }`. Lists direct children of an accessible directory. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.fileExists(path)`: Returns `{ exists: Boolean }`. Checks whether an accessible path exists as a file. *(Requires: `localFileRead` or `localFileWrite`)*
        *   `window.swiftBiu.directoryExists(path)`: Returns `{ exists: Boolean }`. Checks whether an accessible path exists as a directory. *(Requires: `localFileRead` or `localFileWrite`)*
        *   `window.swiftBiu.runShellScript(script, context)`: Returns `{ result: String }`. *(Highly restricted by App Store sandbox).*
    *   **Trigger-Based Methods (No `await` needed):**
        *(Although they return a JS Promise, the native side resolves them immediately upon receiving the command without blocking to wait for side-effects like dialogs. Treat them as synchronous triggers.)*
        *   `window.swiftBiu.copyText(text)`: Copies text to the system clipboard.
        *   `window.swiftBiu.pasteText(text)`: Copies and actively pastes text into the focused window.
        *   `window.swiftBiu.openURL(url)`: Opens a Web URL via the default browser.
        *   `window.swiftBiu.openFileWithApp(path, appBundleID)`: Returns `{ success: Boolean }`. Opens an accessible selected or authorized file with the specified macOS app bundle ID. *(Requires: `localFileRead`)*
        *   `window.swiftBiu.speakText(text)`: Utilizes the macOS native TTS to speak the given text aloud.
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
## Cross-Platform (macOS & iOS) Compatibility

With SwiftBiu expanding to iOS, your plugins can run seamlessly across both platforms with the exact same `.swiftbiux` package. However, you must adhere to the following responsive design and API graceful degradation practices:

### 1. Responsive Web UI (Rich Web Apps)
- **Viewport Meta (Required)**: You *must* include `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` in your `index.html` to prevent iOS from automatically zooming in when users tap input fields.
- **Fluid Layouts**: Do not fixate on desktop split-views. Use CSS `@media (max-width: 600px)` to transition desktop sidebars into horizontal scrolling areas or stacked vertical layouts on mobile.
- **Touch Targets & Font Size**: Enlarge clickable elements (buttons, list rows) to at least `44x44px`. Ensure `<input>` and `<textarea>` font sizes are at least `16px` to avoid unexpected iOS WebView zoom behaviors.
- **Initial Window Size**: `width` and `height` in `displayUI()` are respected on macOS for the physical floating window. On iOS (iPhone), they are ignored, and the UI is presented as a bottom Sheet. Treat these parameters as the "Desktop Preferred Size" and rely on fluid CSS for mobile bounding.

### 2. API Graceful Degradations
- **Clipboard & Paste**: On macOS, `swiftBiu.pasteText()` writes to the clipboard and simulates `Cmd+V`. On the iOS Main App, this degrades gracefully to a "Copied to Clipboard" action with a Toast notification. However, if the user triggers the plugin inside the iOS Keyboard Extension, it will insert text directly at the cursor as expected.
- **Unsupported APIs**: `runShellScript` and `runAppleScript` are strictly macOS-only due to iOS sandbox restrictions. If your plugin relies heavily on Node.js, consider using Webpack/Rollup to bundle JS dependencies directly into your `script.js`, or utilize Apple Shortcuts integration for complex iOS automation.

## Permissions (`permissions`)


To ensure your plugin functions correctly, especially in the sandboxed App Store version of SwiftBiu, you must declare the permissions it needs in `manifest.json`.

*   `"network"`: Required for `swiftBiu.fetch`.
*   `"clipboardRead"`: Required for `SwiftBiu.getClipboard()` — allows the plugin to read the current clipboard content.
*   `"clipboardWrite"`: Required for `swiftBiu.copyText`.
*   `"localFileRead"`: Required for `SwiftBiu.getFileMetadata(path)`, `SwiftBiu.readLocalFile(path)`, `SwiftBiu.readLocalTextFile(path)`, `SwiftBiu.listDirectory(path)`, `SwiftBiu.openFileWithApp(path, appBundleID)`, `window.swiftBiu.getFileMetadata(path)`, `window.swiftBiu.readLocalFile(path)`, `window.swiftBiu.readLocalTextFile(path)`, `window.swiftBiu.listDirectory(path)`, and `window.swiftBiu.openFileWithApp(path, appBundleID)` — allows the plugin to inspect, read, or open the currently selected local files or accessible directories.
*   `"localFileWrite"`: Required for `pickLocalDirectory`, `createLocalDirectory`, `createLocalFile`, `writeLocalTextFile`, `overwriteLocalFile`, `renameLocalFile`, `copyLocalFile`, `moveLocalFile`, `trashLocalItem`, `saveLocalFile`, `fileExists`, and `directoryExists` when checking writable destinations — allows the plugin to create, update, move, rename, trash, or save files in selected or authorized locations.
*   `"paste"`: Required for `swiftBiu.pasteText` — allows the plugin to paste text directly into the user's active application.
*   `"notifications"`: Required for `swiftBiu.showNotification`, `SwiftBiu.showImage`, and `SwiftBiu.showInteractiveImage`.
*   `"runAppleScript"`: Required for `SwiftBiu.runAppleScript()` — allows the plugin to execute AppleScript code. ⚠️ **Not available in the App Store (sandboxed) version.**
*   `"runShellScript"`: Required for `swiftBiu.runShellScript`. ⚠️ **Not available in the App Store (sandboxed) version.**

## Internationalization (i18n)

SwiftBiu supports multi-language plugins. Key fields in `manifest.json` can be provided as either a simple string or a dictionary of translations.

### Supported Fields
The following fields support the `TranslatableString` format:
- Root-level: `name`, `description`
- Actions: `title`
- Configuration items: `label`, `description`
- Configuration options: `label`

### Formatting Translations
To provide multiple languages, use a dictionary where keys are [ISO 639-1 language codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) (e.g., `en`, `zh`).

**Example:**
```json
{
  "name": {
    "en": "AI Polisher",
    "zh": "AI 润色"
  },
  "description": {
    "en": "Advanced text polishing using AI models.",
    "zh": "使用 AI 模型进行高级文本润色。"
  },
  "actions": [
    {
      "title": {
        "en": "Polish Text",
        "zh": "润色文本"
      },
      "script": "script.js"
    }
  ]
}
```

### Fallback Logic
The system selects the best string based on the user's system language:
1. Matches the current system language code (e.g., `zh`).
2. Falls back to English (`en`).
3. Falls back to the first available translation in the dictionary.
4. If a simple string is provided, it is used for all languages.

### Recommended Resource Strategy For Rich UI
For custom pages, native file-task copy, and any larger plugin-owned text surface, we recommend a stricter workflow than the manifest fallback alone:

*   Keep one source file per locale, for example `Resources/i18n/en.json`, `Resources/i18n/zh-Hans.json`, `Resources/i18n/ja.json`.
*   Translate and review each language independently. Do not copy English strings into another locale file as a placeholder just to “fill the matrix”.
*   Treat untranslated locales as absent rather than shipping mixed-language UI.
*   Use `context.locale` / `context.languageCode` in background scripts to choose the correct copy for progress panels, destructive confirmations, and structured file-task metadata.
*   For Web UI, load the matching locale resource first, then fall back only inside your own explicitly chosen default locale policy.

Recommended template shape:

```text
Resources/
  i18n/
    en.json
    zh-Hans.json
    zh-Hant.json
ui/
  locales.js
script.js
```

For logic-only plugins, keep the same per-language separation even if you eventually bundle the strings into `script.js` during build time. The important part is the authoring model: one locale, one reviewed translation source.

## Debugging & Logging

SwiftBiu provides two complementary debugging methods tailored for its dual-environment architecture.

### 1. SwiftBiu Built-in Log Viewer
Whether in the background script (`script.js`) or the Web UI (`index.html`), calls to `console.log()`, `console.warn()`, and `console.error()` are captured and bridged to SwiftBiu's native logging system.
*   **How to view**: Click the SwiftBiu icon in the menu bar -> select **"Log Viewer"**.
*   **Cross-Environment Tracking**: Logs originating from the UI layer automatically carry a `[UI]` prefix alongside your plugin identifier, allowing you to clearly trace front-to-back communication in a single console.
*   *(Tip: When printing complex objects in the background script, it's recommended to use `console.log(JSON.stringify(obj, null, 2))` to ensure full readability in the native log console)*.

### 2. Safari Web Inspector (For Web UI Views)
When developing a **Web App Action**, encountering CSS layout issues or needing to directly debug the DOM or network requests is common. Pushing logs to the native console alone is insufficient. You can directly leverage macOS's built-in Safari Developer Tools for this.

1.  Open the **Safari browser**.
2.  Open the **"Develop"** tab in the menu bar (If you don't see it, go to Safari Preferences -> Advanced, and check "Show features for web developers").
3.  Trigger and keep your SwiftBiu plugin's Web UI open.
4.  Under Safari's Develop menu, locate your Mac's device name (e.g., `Your-MacBook-Pro`). In the expanded list, find the `SwiftBiu` process, and click the `index.html` below it to open the powerful Web Inspector!
5.  *Note: This native debugging capability relies on the developer version of SwiftBiu (The App Store sandbox version may block Safari inspector attachment due to system security policies).*

---

## Best Practices & FAQ

Through the development process, we've identified some common pitfalls and recommended best practices. Following these tips can help you avoid unnecessary debugging and build more robust, user-friendly plugins.

### 1. Precisely Control Plugin Visibility and Priority

> [!TIP]
> Fully leverage the return object of the `isAvailable(context)` function `{ isAvailable: Boolean, isContextMatch: Boolean }`, instead of just returning a boolean.

*   **`isAvailable` (Visibility)**: Controls whether the plugin should appear in this context at all. For example, a code formatting plugin returns `false` when selected text contains no code features, keeping the toolbar clean.
*   **`isContextMatch` (Priority)**: Controls sorting in the toolbar. For example, a translate plugin detects selected text and returns `isContextMatch: true`, ensuring its icon jumps to the very front of the toolbar for immediate access.

### 2. Support Direct Open for UI Extensions

SwiftBiu shows an explicit Open button for extensions that expose an interactive surface, including `manifest.ui`, `SwiftBiu.displayUI(...)`, `SwiftBiu.showAIResponseBubble(...)`, `SwiftBiu.showInteractiveImage(...)`, and `SwiftBiu.openNativeGeminiImageStudio(...)`.

These plugins may be launched without a text selection. Treat `context.selectedText` as optional:

*   Web UI plugins should return `{ isAvailable: true, isContextMatch: hasSelection }` and always call `displayUI(...)`. The UI can initialize empty with `context.selectedText || ""`.
*   AI bubble plugins should open the bubble in a ready/manual-input state when no selected text exists. Start a request only after the user submits a prompt.
*   Image UI plugins should open an editable prompt card/studio when no selected text exists. Start image generation only after the user enters a prompt.
*   Append-mode actions should paste/apply only the generated result when the source text is empty; do not prepend blank lines.
*   Logic-only quick actions may still require selected text and return `isAvailable: false` when no meaningful input exists.

Recommended `isAvailable` shape for UI extensions:

```javascript
function isAvailable(context) {
    const hasSelection = Boolean(context && context.selectedText && context.selectedText.trim());
    return {
        isAvailable: true,
        isContextMatch: hasSelection
    };
}
```

### 3. Isolate Environment APIs and Read Configuration

> [!WARNING]
> Do not mix up the APIs for the background script (`script.js`) and the frontend interface (`ui/index.html`).

*   To read user configuration in the background script, you **must** use the synchronous `SwiftBiu.getConfig('your_key')`.
*   `window.swiftBiu.storage.get(key)` is an asynchronous API specifically designed for the stateless Web UI environment to safely read persisted data from the native layer.

### 4. Declare Permissions Precisely

> [!IMPORTANT]
> Plugin functionality is strictly limited by the requirements declared in `manifest.json`. Undeclared permissions will cause API calls to be blocked.

*   To **paste** text directly at the cursor: use `SwiftBiu.pasteText(text)` -> requires `"paste"` permission.
*   To write text only to the system **clipboard**: use `SwiftBiu.writeToClipboard(text)` -> requires `"clipboardWrite"` permission.

### 5. JavaScript Environment Compatibility

> [!CAUTION]
> The background script (`script.js`) runs in the native `JavaScriptCore` engine.

Avoid using bleeding-edge ECMAScript syntax proposals (such as the array `.at()` method or bleeding-edge RegEx features) in background scripts. This may cause runtime errors on older macOS systems. We recommend using standard ES6 syntax to ensure the broadest compatibility across different macOS versions.

### 6. Native Request Modes for Background Scripts

> [!NOTE]
> Background `script.js` currently has two native request styles: one-shot `fetch(...)` and incremental `fetchStream(...)`.

Use `SwiftBiu.fetch(url, options, onSuccess, onError)` when the server returns a complete response in one shot:
1. If your plugin already has its own visual container (`displayUI(...)`, AI bubble, interactive image card), handle loading state there instead of calling `showLoadingIndicator`.
2. For non-UI quick actions, you may still wrap the request with `SwiftBiu.showLoadingIndicator(...)` and `SwiftBiu.hideLoadingIndicator()`.
3. Call `SwiftBiu.fetch(url, options, onSuccess, onError)` to initiate the request.
4. Call `SwiftBiu.showNotification(...)` or update your bubble/UI with the final result.

Use `SwiftBiu.fetchStream(url, options, onEvent, onError)` when the provider supports SSE or chunked responses:
1. Start the request and store the returned `streamID` if you may need to cancel or replace it later.
2. Handle `response` to inspect status and headers before data arrives.
3. Handle each `data` event by parsing the provider-specific chunk format and appending it to your accumulated output.
4. On `complete`, finalize UI state such as `ready`, enable submit buttons, or persist final metadata.
5. If the user cancels or regenerates, call `SwiftBiu.cancelFetchStream(streamID)` before launching the next stream.

*(If you prefer modern JS, you can manually wrap `fetch(...)` in a Promise for async/await style. On the Web UI side, the global `window.swiftBiu.fetch` is already a Promise API.)*

### 7. Background Debugging: Log Complex Objects Fully

> [!TIP]
> Printing complex objects with native logs might result in truncation or simply `[object Object]`.

When using `console.log()` in the background script, it is highly recommended to use `JSON.stringify` to format complex arrays or JSON objects:
```javascript
// ✅ Excellent debugging practice, readable at a glance
console.log("API Response:", JSON.stringify(result, null, 2));

// ❌ Complex hierarchies may fail to expand natively
console.log("API Response:", result);
```

## Examples

Please check out and clone the official [SwiftBiu Plugin Development Template Repository (SwiftBiuX-Template)](https://github.com/SwiftBiu/SwiftBiuX-Template) to get the complete source code of the example plugins. Reading these real-world examples is the fastest way to understand the underlying concepts and best practices.

Happy coding!

---

## Contributing Guidelines

To ensure the quality and clarity of the project's history, this repository enforces the **Conventional Commits** specification for all commit messages.

### Automated Validation

We provide a Git hook that automatically checks your commit message format. To enable it, you **must** run the following command once after cloning the repository:

```bash
./scripts/install-hooks.sh
```

After installation, any `git commit` with a non-compliant message will be automatically rejected with a helpful guide.

### Commit Message Format

Your commit message must follow this structure:

```
<type>(<scope>): <subject>
```

*   **Type**: Must be one of the following: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.
*   **Scope**: (Optional) The module affected by the change (e.g., `Smart AI`, `UI`, `build`).
*   **Subject**: A short, clear description of the change.

**Example:**
```bash
git commit -m "feat(Smart AI): add support for streaming responses"
