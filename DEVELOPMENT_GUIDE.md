[Switch to Chinese (切换到中文)](DEVELOPMENT_GUIDE_zh.md)

# SwiftBiu Plugin Development Guide

Welcome to the SwiftBiu plugin development world! This guide will help you create powerful plugins using modern web technologies.

With SwiftBiu's "Rich Web Application" model, you can build plugins with custom user interfaces using HTML, CSS, and JavaScript, providing a seamless, native-like experience for users.

## Quick Start

This template provides everything you need to get started. Here's the core development workflow:

1.  **Define `manifest.json`**: Configure your plugin's metadata, actions, and any settings you need.
2.  **Build Your UI**: Implement your plugin's interface and business logic in `ui/index.html`.
3.  **Package and Test**: Package your plugin and load it in SwiftBiu to see it in action.

## Packaging & Distribution

You can get your plugin package (`.swiftbiux` file) in two ways: through our automated CI builds (recommended for most users) or by packaging it manually for local testing.

### Automated Builds (Recommended)

All plugins in this template are automatically built and packaged into a **Nightly Build** release. This is the easiest and most visible way to get the latest versions.

You can always find the latest plugin packages by visiting the **[Releases page](https://github.com/SwiftBiu/SwiftBiuX-Template/releases)** of this repository. The `nightly-build` release is automatically updated every time changes are pushed to the `main` branch.

### Manual Local Packaging

For local development and rapid testing, you can use the included `build_plugin.sh` script to package your plugin.

1.  Open your terminal.
2.  Navigate to the root directory of this template.
3.  Run the script, passing your plugin's folder name as an argument.

```bash
# For example, if your plugin is in a folder named "MyAwesomePlugin"
./scripts/build_plugin.sh MyAwesomePlugin

# Success! Find your distributable file at:
# MyAwesomePlugin.swiftbiux
```

## Two Types of Plugin Actions

SwiftBiu supports two types of actions with varying complexity.

### Type 1: JavaScript Action (Logic-only)

Use this for custom logic (like API calls) that **does not require a custom UI**. The action is powered by the `script.js` file in your plugin's root.

#### `manifest.json` Configuration
To trigger the JavaScript backend, the action **must** include a `"script": "script.js"` key.

```json
"actions": [
  {
    "title": "Look Up IP Info",
    "script": "script.js"
  }
]
```

#### `script.js` Development
You need to implement two functions:
*   `isAvailable(context)`: **(Sync)** Determines if the action should be visible. Must return an object: `{ isAvailable: Boolean, isContextMatch: Boolean }`. For performance reasons, this function should execute quickly and synchronously.
*   `performAction(context)`: Executes when the user clicks the action. 

### Type 2: Rich Web App Action (Recommended)

The most powerful type, for plugins that need a fully custom user interface. This model treats your UI as a complete web application.

#### `manifest.json` Configuration
A Rich Web App Action is defined by two key parts in `manifest.json`:
1.  A root-level `ui` object that points to your HTML file.
2.  An action in the `actions` array that includes a `"script": "script.js"` key. This is **required** to initialize the plugin's backend JavaScript environment.

```json
"actions": [
  {
    "title": "Advanced Translator",
    "script": "script.js"
  }
],
"ui": {
  "main": "ui/index.html"
}
```

---

## Core API Reference

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

##### `radioList`
*   **UI**: A dynamic, editable list where each row contains a radio button, a multi-line text view, and a delete button. Users can add new rows.
*   **Functionality**: Ideal for complex scenarios where users need to configure a set of rules and activate one at a time (e.g., multiple translation prompts).
*   **Additional Keys**:
    *   `defaultItems` (Array, No): Defines the initial default items for the list. Each object requires:
        *   `enabled` (Boolean, Yes): Whether the radio button for this item is selected by default.
        *   `value` (String, Yes): The default content of the text view.

### JavaScript API (`window.swiftBiu`)

When your plugin's UI is displayed, SwiftBiu injects a powerful `window.swiftBiu` object into your JavaScript context. 

#### 1. Initializing Your UI

You **must** define a global function `window.swiftBiu_initialize` in your `ui/index.html`. SwiftBiu calls this function and passes the initial `context` (like selected text) once your UI is loaded.

```javascript
// In your ui/index.html <script> tag
window.swiftBiu_initialize = function(context) {
  console.log("UI Initialized with context:", context);
  // context -> { selectedText: "Hello World", sourceAppBundleID: "com.apple.TextEdit" }
  const text = context.selectedText;
  // Start your business logic here...
};
```

#### 2. Core Functions

*   **`swiftBiu.fetch(url, options)`**:  Makes a network request. `options` supports `method`, `headers`, and `body`.
    *   **Returns**: `Promise<{ status: Int, data: String }>`
    *   **Example**: `swiftBiu.fetch('https://api.example.com/data').then(response => { /* ... */ });`

*   **`swiftBiu.copyText(text)`**:  Copies the given text to the system clipboard.

*   **`swiftBiu.closeWindow()`**: (Sync) Closes the current plugin UI window.

#### 3. UI Control & Best Practices

*   **`swiftBiu.ui.resizeWindow({ height: Number })`**:  Adjusts the height of the plugin window. This is crucial for creating UIs with dynamic content.

##### Best Practice for Auto-Resizing Height
To achieve perfect, smooth resizing, follow this CSS and JavaScript strategy:
1.  **CSS**: Set `background-color: transparent;` on `<html>` and apply your main background styles (like frosted glass) to `<body>` with `min-height: 100vh;`. Let your main content container resize naturally without a fixed height.
2.  **JavaScript**: After your content is rendered, manually calculate the total height of all visible elements (`element.offsetHeight`) and add a small buffer. Call `resizeWindow` with this calculated height. This is more reliable than `ResizeObserver` or `document.body.scrollHeight` alone.

#### 4. Storage

*   **`swiftBiu.storage.get(key)`**:  Reads a value from your plugin's configuration. The `key` must match one defined in `manifest.json`.
    *   **Returns**: `Promise<{ result: String }>`
    *   **Example**: `swiftBiu.storage.get('api_key').then(response => { const apiKey = response.result; /* ... */ });`

#### 5. System Interactions

*   `swiftBiu.showImage(...)`: Displays an image.
*   `swiftBiu.openFileInPreview(...)`: Opens a file in Preview.

## Permissions (`permissions`)

To ensure your plugin functions correctly, especially in the sandboxed App Store version of SwiftBiu, you must declare the permissions it needs in `manifest.json`.

*   `"network"`: Required for `swiftBiu.fetch`.
*   `"clipboardWrite"`: Required for `swiftBiu.copyText`.
*   And others like `"paste"`, `"notifications"`, etc.

## Debugging & Logging

Any `console.log()` message from your UI's JavaScript is automatically bridged to SwiftBiu's native logging system. You can view these logs in SwiftBiu's "Log Viewer". They will be prefixed with `[UI]` and your plugin's identifier, making end-to-end debugging much easier.

## Examples

Check out the example plugins included in this template to see these concepts in action. Reading their source code is a great way to learn.

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
*   **Scope**: (Optional) The module affected by the change (e.g., `Gemini`, `UI`, `build`).
*   **Subject**: A short, clear description of the change.

**Example:**
```bash
git commit -m "feat(Gemini): add support for streaming responses"