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
| `author`        | String | Yes       | Author of the plugin.                                                                   |
| `description`        | String | Yes       | Introduction to Plug-ins.                                                                  |

| `version`       | String | Yes      | The plugin's version, e.g., `1.0`.                                                                                                                              |
| `actions`       | Array  | Yes      | An array defining one actions the plugin provides.                                                                                                      |
| `icon`          | String | No       | **(Root Level)** An SF Symbol name (e.g., `swift`) or a local PNG file name. This serves as the default icon for the entire plugin.                             |
| `iconType`      | String | No       | **(Root Level)** Defines the type of the root `icon`. Can be `"sfSymbol"` or `"file"`.                                                                          |
| `configuration` | Array  | No       | Defines a user-configurable settings UI for your plugin.                                                                                                        |
| `permissions`   | Array  | No       | Declares system permissions required by the plugin.                                                                                                             |

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

Supported `type` values include: `string`, `secure` (for passwords), `boolean` (for switches), `option` (for dropdowns), and `radioList`.

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
> | `radioList` | JSON string: `[{"enabled":true,"value":"..."}]` | `JSON.parse(SwiftBiu.getConfig("key"))` |

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

##### `radioList`
*   **UI**: A dynamic, editable list where each row contains a radio button, a multi-line text view, and a delete button. Users can add new rows.
*   **Functionality**: Ideal for complex scenarios where users need to configure a set of rules and activate one at a time (e.g., multiple translation prompts).
*   **Additional Keys**:
    *   `defaultItems` (Array, No): Defines the initial default items for the list. Each object requires:
        *   `enabled` (Boolean, Yes): Whether the radio button for this item is selected by default.
        *   `value` (String, Yes): The default content of the text view.

> [!WARNING]
> **Visibility Requirement**: For a `radioList` to be visible in the settings UI, it **must** have at least one item defined in `defaultItems` or already stored in the preferences. If `defaultItems` is empty (`[]`) and there's no saved data, the setting will not appear.

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
    *   `SwiftBiu.openURL(urlString: String)`: Launches the default browser to open a link.
    *   `SwiftBiu.openFileInPreview(filePath: String)`: Opens a file using the macOS default app (e.g., Preview).
    *   `SwiftBiu.showNotification(title: String, body: String)`: Sends a system-level notification. *(Requires: `notifications`)*
    *   `SwiftBiu.showLoadingIndicator(position: Object)` / `SwiftBiu.hideLoadingIndicator()`: Displays a native loading spinner at the specified coordinates.
*   **Advanced Operations:**
    *   `SwiftBiu.fetch(url, options, onSuccess, onError)`: (Callback Async) Initiates a low-level network request. *(Requires: `network`)*
    *   `SwiftBiu.runShellScript(script, context)`: (Synchronous) Executes a Bash/Zsh script and returns the output. *(Requires: `runShellScript`)*


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
    *   `window.swiftBiu_initialize = async function(context) { ... }` : You MUST define this global function in your HTML. After the page finishes loading, the system automatically calls it and injects the `context` parameter (such as highlighted text) from the background.
*   **Bridge Capabilities (Mind the Async Boundaries)**:
    *While the bridge code wraps all these APIs in a Promise (meaning you can technically `await` all of them), on the native Swift side they are strictly divided into **Data-Returning** (true async await) and **Trigger-Based** (Fire-and-Forget, no `await` needed).*
    *   **Methods that REQUIRE `await` for data:**
        *   `window.swiftBiu.fetch(url, options)`: Returns `{ status: Number, data: String }`. *(Requires: `network`)*
        *   `window.swiftBiu.storage.get(key)`: Returns `{ result: String }`.
        *   `window.swiftBiu.runShellScript(script, context)`: Returns `{ result: String }`. *(Highly restricted by App Store sandbox).*
    *   **Trigger-Based Methods (No `await` needed):**
        *(Although they return a JS Promise, the native side resolves them immediately upon receiving the command without blocking to wait for side-effects like dialogs. Treat them as synchronous triggers.)*
        *   `window.swiftBiu.copyText(text)`: Copies text to the system clipboard.
        *   `window.swiftBiu.pasteText(text)`: Copies and actively pastes text into the focused window.
        *   `window.swiftBiu.openURL(url)`: Opens a Web URL via the default browser.
        *   `window.swiftBiu.speakText(text)`: Utilizes the macOS native TTS to speak the given text aloud.
        *   `window.swiftBiu.exportFile(base64String, filename)`: Triggers the macOS native "Save As" dialogue.
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
*   `"paste"`: Required for `swiftBiu.pasteText` — allows the plugin to paste text directly into the user's active application.
*   `"notifications"`: Required for `swiftBiu.showNotification`.
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

### 2. Isolate Environment APIs and Read Configuration

> [!WARNING]
> Do not mix up the APIs for the background script (`script.js`) and the frontend interface (`ui/index.html`).

*   To read user configuration in the background script, you **must** use the synchronous `SwiftBiu.getConfig('your_key')`.
*   `window.swiftBiu.storage.get(key)` is an asynchronous API specifically designed for the stateless Web UI environment to safely read persisted data from the native layer.

### 3. Declare Permissions Precisely

> [!IMPORTANT]
> Plugin functionality is strictly limited by the requirements declared in `manifest.json`. Undeclared permissions will cause API calls to be blocked.

*   To **paste** text directly at the cursor: use `SwiftBiu.pasteText(text)` -> requires `"paste"` permission.
*   To write text only to the system **clipboard**: use `SwiftBiu.writeToClipboard(text)` -> requires `"clipboardWrite"` permission.

### 4. JavaScript Environment Compatibility

> [!CAUTION]
> The background script (`script.js`) runs in the native `JavaScriptCore` engine.

Avoid using bleeding-edge ECMAScript syntax proposals (such as the array `.at()` method or bleeding-edge RegEx features) in background scripts. This may cause runtime errors on older macOS systems. We recommend using standard ES6 syntax to ensure the broadest compatibility across different macOS versions.

### 5. Native Callback Mechanism for Background Requests

> [!NOTE]
> The native `fetch` interface injected into background scripts by SwiftBiu uses a **Callback** pattern.

If your Standard Action requires time-consuming network requests in `script.js`, please strictly follow this lifecycle pattern to avoid silent failures or UI blocking:
1. Before the request starts, call `SwiftBiu.showLoadingIndicator(context.screenPosition)` for visual feedback.
2. Call `SwiftBiu.fetch(url, options, onSuccess, onError)` to initiate the request.
3. Inside the success or error callback, immediately execute `SwiftBiu.hideLoadingIndicator()`.
4. Call `SwiftBiu.showNotification(...)` to inform the user of the result.

*(Note: If you prefer modern JS, you can manually wrap this in a Promise in your script to use async/await. On the Web UI side, the global `window.swiftBiu.fetch` is already a pure Promise API.)*

### 6. Background Debugging: Log Complex Objects Fully

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