[Switch to Chinese (切换到中文)](README_zh.md)

# SwiftBiu Plugin Development Guide (v1.1.1)

Welcome to the world of SwiftBiu plugin development! With our hybrid plugin system, you can use the best tools for your task—whether it's a simple native script or a feature-rich JavaScript solution—to add powerful custom actions to SwiftBiu.

## Core Plugin Concepts

All SwiftBiu plugins consist of a core file, `manifest.json`, and one or more script files, ultimately packaged into a `.swiftbiux` file.

### `manifest.json` Explained

`manifest.json` is the "ID card" of your plugin. It describes the plugin's metadata and the **one or more actions** it contains.

| Key             | Type   | Required | Description                                                                                                                                                                          |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `identifier`    | String | Yes      | The unique identifier for the plugin, recommended to be in reverse domain name format.                                                                                               |
| `name`          | String | Yes      | The plugin name displayed in menus and settings.                                                                                                                                     |
| `version`       | String | Yes      | The version number of the plugin, e.g., `1.0`.                                                                                                                                       |
| `actions`       | Array  | Yes      | An array defining one or more actions provided by the plugin.                                                                                                                        |
| `author`        | String | No       | The name of the plugin author.                                                                                                                                                       |
| `description`   | String | No       | A brief description of the plugin's functionality.                                                                                                                                   |
| `icon`          | String | No       | The default icon name for the plugin. Can be an SF Symbol (e.g., `swift`) or a filename within the plugin package. PNG format is recommended, with a suggested size of 32x32 pixels. |
| `iconType`      | String | No       | Defines the type of the `icon` field. Possible values are `"sfSymbol"` or `"file"`.                                                                                                  |
| `permissions`   | Array  | No       | Declares the system permissions required by the plugin (see "Sandbox & Permissions" section).                                                                                        |
| `configuration` | Array  | No       | An array defining parameters that require user configuration, used to auto-generate a settings UI.                                                                                   |

---

### Plugin Configuration (`configuration`) Explained

If your plugin requires user input, you can define a `configuration` array in `manifest.json`. SwiftBiu will automatically generate a feature-rich configuration interface for your plugin based on this definition.

Each object in the `configuration` array represents an input item.

#### Common Keys

All configuration items support the following common keys:

| Key           | Type   | Required | Description                                                                            |
| ------------- | ------ | -------- | -------------------------------------------------------------------------------------- |
| `key`         | String | Yes      | The unique key used to store and retrieve this configuration item.                     |
| `label`       | String | Yes      | The title of the input field displayed to the user in the settings UI.                 |
| `description` | String | No       | Detailed explanatory text for the option, displayed below the input field.             |
| `type`        | String | No       | **Core field**. Defines the UI type of the configuration item. Defaults to `"string"`. |

#### Configuration Types (`type`)

##### 1. `string` (Default)
*   **UI**: A standard single-line text field (`NSTextField`).
*   **Additional Keys**:
    *   `placeholder` (String, No): The placeholder text displayed in the input field.
    *   `default` (String, No): The default value.

##### 2. `secure`
*   **UI**: A secure text field (`NSSecureTextField`) for passwords, with an "eye" button to toggle visibility.
*   **Additional Keys**:
    *   `placeholder` (String, No): The placeholder text displayed in the input field.

##### 3. `boolean`
*   **UI**: A switch (`NSSwitch`).
*   **Additional Keys**:
    *   `default` (Boolean, No): The default state (`true` or `false`).

##### 4. `option`
*   **UI**: A pop-up button (`NSPopUpButton`) for dropdown selection.
*   **Additional Keys**:
    *   `options` (Array, **Yes**): Defines the dropdown options. Each object in the array requires:
        *   `label` (String, Yes): The text displayed in the menu item.
        *   `value` (String, Yes): The actual value stored when the item is selected.
    *   `default` (String, No): The `value` of the default selected item.

##### 5. `radioList`
*   **UI**: A dynamic, editable list where each row contains a radio button, a multi-line text view, and a delete button. Users can add new rows dynamically.
*   **Functionality**: Ideal for complex scenarios where users need to configure a set of rules and activate one at a time.
*   **Additional Keys**:
    *   `defaultItems` (Array, No): Defines the initial default items for the list. Each object requires:
        *   `enabled` (Boolean, Yes): Whether the radio button for this item is selected by default.
        *   `value` (String, Yes): The default content of the text view.

---

## Plugin Installation & Directory Structure

### Installing Plugins

The following methods are supported for installing `.swiftbiux` plugin packages:

1.  **Install via Menu**: In the SwiftBiu menu bar icon, select "Install Plugin...", then choose your `.swiftbiux` file in the file selection window.
2.  **Install by Double-Clicking**: After setting SwiftBiu as the default application for `.swiftbiux` files, you can simply double-click a `.swiftbiux` file in Finder to trigger the installation process.

### Plugin Directory

The storage location for plugins depends on the version of SwiftBiu you are using:

*   **Website Version (Non-sandboxed)**:
    Plugins will be installed at:
    `~/Library/Application Support/SwiftBiu/Plugins/`

*   **App Store Version (Sandboxed)**:
    Due to the sandboxing mechanism, the actual physical path of the plugins will be redirected by the system to:
    `~/Library/Containers/cn.bewords.swiftbiu/Data/Library/Application Support/SwiftBiu/Plugins/`

---

## Sandbox & Permissions: Important Notice

SwiftBiu is available in two versions: the **non-sandboxed version (Website)** from our official website and the **sandboxed version (App Store)** from the Mac App Store. The sandbox is a core security feature of macOS that strictly limits an application's ability to access system resources. **A plugin's functionality is significantly affected by whether the application is running in a sandbox.**

### Core Differences

| Feature            | Website Version (Non-sandboxed) | App Store Version (Sandboxed) | Impact on Plugin Developers                                                                                                                                                |
| ------------------ | ------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File System**    | **Unrestricted**                | **Strictly Limited**          | Plugins cannot directly read or write files outside the sandbox.                                                                                                           |
| **Network Access** | **Unrestricted**                | **Requires Declaration**      | The plugin's `manifest.json` must include the `"network"` permission to make outbound network connections.                                                                 |
| **AppleScript**    | **Powerful**                    | **Limited**                   | Can only interact with applications that are adapted for sandboxing and have defined AppleScript interfaces. Interaction with Finder and System Events is greatly reduced. |
| **Shell Scripts**  | **Unrestricted**                | **Strictly Limited**          | Cannot execute commands that require access to files outside the sandbox or sensitive system directories.                                                                  |

### Development Best Practices

To ensure your plugin works well in both versions of the application, please follow these principles:

1.  **Principle of Least Privilege**: In the `permissions` array of `manifest.json`, only request the permissions that your plugin actually needs.
2.  **Prefer `SwiftBiu` APIs**: Whenever possible, use the APIs provided by the `SwiftBiu` object (e.g., `SwiftBiu.fetch`) instead of directly calling Shell or AppleScript, as the former are already adapted and optimized for the sandboxed environment.
3.  **Graceful Degradation**: Before performing sensitive operations, you can check the `SwiftBiu.isSandboxed` boolean property. If it is `true`, you can choose to disable certain features or provide an alternative for the user.

---

## Mode One: Native Script Plugins (Recommended for Simple Tasks)

If your plugin only needs to call an AppleScript or a Shell script, this mode is the simplest and quickest.

### `actions` Object Explained (Native Scripts)

| Key               | Type   | Description                                                    |
| ----------------- | ------ | -------------------------------------------------------------- |
| `title`           | String | The action name displayed in the menu item.                    |
| `appleScriptFile` | String | **(Choose one)** The name of the AppleScript file to execute.  |
| `shellScriptFile` | String | **(Choose one)** The name of the Shell script file to execute. |
| `icon`            | String | (Optional) The icon for this specific action.                  |

**Note**: The capabilities of these scripts are severely limited in a sandboxed environment.

---

## Mode Two: JavaScript Plugins (Recommended for Complex Tasks)

When you need to interact with web APIs, handle complex logic, or display custom UI, JavaScript plugins offer unparalleled flexibility and cross-environment compatibility.

### The `SwiftBiu` Global API Object

We inject a global object named `SwiftBiu` into the JavaScript runtime environment, which provides all the necessary capabilities to interact with the main application and the macOS system. **It is strongly recommended to prioritize using these APIs to ensure plugin compatibility with the sandbox.**

*   `SwiftBiu.isSandboxed`: (Read-only, Boolean) Determines if the current application is running in a sandbox.
*   `SwiftBiu.getConfig(key)`: **(Sync)** Reads a value configured by the user for the plugin. Returns a string.
*   `SwiftBiu.fetch(url, options, onSuccess, onError)`: **(Async)** Makes a network request.
    *   `onSuccess`: Success callback function, receives a `response` object containing `{status: Int, data: String}`.
    *   `onError`: Error callback function, receives an `error` object containing `{error: String}`.
*   `SwiftBiu.openURL(url)`: Opens a link in the browser.
*   `SwiftBiu.writeToClipboard(text)`: Writes text to the clipboard.
*   `SwiftBiu.getClipboard()`: **(Sync)** Reads the content of the clipboard. Returns a string.
*   `SwiftBiu.pasteText(text)`: Pastes the specified text into the current frontmost application. **Important: This action will overwrite the user's current clipboard content.**
*   `SwiftBiu.showNotification(message, [position])`: Displays a system notification.
    *   `message`: (String) The content of the notification to be displayed.
    *   `position`: (Optional, Object) An object containing `{x: Double, y: Double}` to specify the notification's position.
*   `SwiftBiu.showImage(base64String, [position], [context])`: **(Advanced API)** Displays a floating notification with an image.
*   `SwiftBiu.showLoadingIndicator([position])`: Displays a global loading indicator.
    *   `position`: (Optional, Object) An object containing `{x: Double, y: Double}` to specify the indicator's position.
*   `SwiftBiu.hideLoadingIndicator()`: Hides the loading indicator.
*   `SwiftBiu.runAppleScript(script, [context])`: **(Sync)** Executes an AppleScript script. Returns the script's output or `nil`.
*   `SwiftBiu.runShellScript(script, [context])`: **(Sync)** Executes a Shell script. Returns the script's output or `nil`.
*   `SwiftBiu.openFileInPreview(path)`: **(Advanced API)** Opens a local file at the specified path in the default application.
*   `SwiftBiu.openImageInPreview(base64String)`: **(Advanced API)** Decodes a Base64 encoded image and opens it in the default preview application.

### Plugin Tiers: Basic vs. Advanced

To provide a trial experience for free users while ensuring value for Pro users, SwiftBiu automatically categorizes plugins as **Basic** or **Advanced** based on the APIs they call.

*   **Basic Plugins**: Primarily for text processing and simple system interactions. All APIs are considered basic by default.
*   **Advanced Plugins**: Call at least one API explicitly marked as "Advanced." These APIs typically involve more complex UI or file system interactions.

**Currently, the APIs defined as Advanced include:**
*   `showImage`
*   `openFileInPreview`
*   `openImageInPreview`

**Impact for Developers:**
*   This classification is **automatic**; you do not need to declare it in `manifest.json`.
*   Free users have a **limited** number of daily uses for Advanced plugins. When the limit is reached, the action will be blocked, and the user will be prompted to upgrade.
*   Therefore, please use Advanced APIs only when necessary.

### Permissions (`permissions`)

Declare the permissions your plugin needs in `manifest.json` to function correctly in the sandboxed version:

*   `"network"`: Allows making network requests (`SwiftBiu.fetch`).
*   `"clipboardWrite"`: Allows writing to the clipboard (`SwiftBiu.writeToClipboard`).
*   `"clipboardRead"`: Allows reading from the clipboard (`SwiftBiu.getClipboard`).
*   `"paste"`: Allows pasting content into other applications (`SwiftBiu.pasteText`).
*   `"notifications"`: Allows displaying system notifications (`SwiftBiu.showNotification`, `SwiftBiu.showImage`).
*   `"runAppleScript"`: Allows executing AppleScript (`SwiftBiu.runAppleScript`).
*   `"runShellScript"`: Allows executing Shell scripts (`SwiftBiu.runShellScript`).

---

## How to Distribute Plugins (`.swiftbiux`)

### Packaging Your Plugin

To simplify distribution, all plugins must be packaged into a `.swiftbiux` file.

1.  **Technical Specification**: A `.swiftbiux` file is a standard **ZIP archive**.
2.  **Internal Structure**: The **root directory** of the archive must directly contain `manifest.json` and all script files. **Do not** place all files inside a top-level folder before compressing.

**Correct Structure:**
```
.swiftbiux (ZIP Archive)
├── manifest.json
└── script.js
```

**Incorrect Structure:**
```
.swiftbiux (ZIP Archive)
└── MyPlugin/      <-- Incorrect top-level folder
    ├── manifest.json
    └── script.js
```

### Creation Steps
1.  Place your plugin files (`manifest.json`, `script.js`, etc.) in a folder.
2.  **Enter that folder**, and select all the files.
3.  Right-click and choose "Compress".
4.  Rename the resulting `.zip` file to `YourPluginName.swiftbiux`.

Happy coding!