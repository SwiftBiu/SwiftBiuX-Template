# SwiftBiu Plugin Development Guide (v1.0)

Welcome to the world of SwiftBiu plugin development! With our hybrid plugin system, you can use the best tools for your task—whether it's a simple native script or a feature-rich JavaScript solution—to add powerful custom actions to SwiftBiu.

## Core Plugin Concepts

All SwiftBiu plugins consist of a core file, `manifest.json`, and one or more script files, ultimately packaged into a `.swiftbiux` file.

### `manifest.json` Explained

`manifest.json` is the "ID card" of your plugin. It describes the plugin's metadata and the **one or more actions** it contains.

| Key             | Type    | Required | Description                                                                                    |
| --------------- | ------- | -------- | ---------------------------------------------------------------------------------------------- |
| `identifier`    | String  | Yes      | The unique identifier for the plugin, recommended to be in reverse domain name format.         |
| `name`          | String  | Yes      | The plugin name displayed in menus and settings.                                               |
| `version`       | String  | Yes      | The version number of the plugin, e.g., `1.0`.                                                 |
| `actions`       | Array   | Yes      | An array defining one or more actions provided by the plugin.                                  |
| `author`        | String  | No       | The name of the plugin author.                                                                 |
| `description`   | String  | No       | A brief description of the plugin's functionality.                                             |
| `icon`          | String  | No       | The default icon name for the plugin. Can be an SF Symbol (e.g., `swift`) or a filename within the plugin package (e.g., `icon.png`). |
| `iconType`      | String  | No       | Defines the type of the `icon` field. Possible values are `"sfSymbol"` or `"file"`.            |
| `permissions`   | Array   | No       | Declares the system permissions required by the plugin (see "Sandbox & Permissions" section).  |
| `configuration` | Array   | No       | An array defining parameters that require user configuration, used to auto-generate a settings UI. |

---

### Plugin Configuration (`configuration`) Explained

If your plugin requires user input (such as API keys, custom URLs, etc.), you can define a `configuration` array in `manifest.json`. SwiftBiu will automatically generate a configuration interface for your plugin based on this definition.

Each object in the `configuration` array represents an input field with the following structure:

| Key           | Type    | Required | Description                                                                 |
| ------------- | ------- | -------- | --------------------------------------------------------------------------- |
| `key`         | String  | Yes      | The unique key used to store and retrieve this configuration item.          |
| `label`       | String  | Yes      | The title of the input field displayed to the user in the settings UI.      |
| `placeholder` | String  | No       | The gray placeholder text displayed in the input field.                     |
| `description` | String  | No       | Detailed explanatory text for the option, displayed below the input field.  |
| `isSecure`    | Boolean | No       | If `true`, the input field will be treated as a password field, hiding its content. Defaults to `false`. |

---

### Complete `manifest.json` Example

This is an example of a translation plugin configured with an API key input field and using an SF Symbol as its icon.

```json
{
  "identifier": "com.example.api-translator",
  "name": "API Translator",
  "version": "1.2",
  "author": "Your Name",
  "description": "Translates text using a custom API.",
  "icon": "globe.asia.australia.fill",
  "iconType": "sfSymbol",
  "actions": [
    {
      "title": "Translate",
      "script": "script.js"
    }
  ],
  "permissions": [
    "network",
    "notifications",
    "ui"
  ],
  "configuration": [
    {
      "key": "apiKey",
      "label": "API Key",
      "placeholder": "Enter your API key here",
      "description": "Your personal API key for the translation service.",
      "isSecure": true
    }
  ]
}
```

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

| Feature         | Website Version (Non-sandboxed) | App Store Version (Sandboxed) | Impact on Plugin Developers                                                                                             |
| --------------- | ------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **File System** | **Unrestricted**                | **Strictly Limited**          | Plugins cannot directly read or write files outside the sandbox.                                                        |
| **Network Access**| **Unrestricted**                | **Requires Declaration**      | The plugin's `manifest.json` must include the `"network"` permission to make outbound network connections.              |
| **AppleScript** | **Powerful**                    | **Limited**                   | Can only interact with applications that are adapted for sandboxing and have defined AppleScript interfaces. Interaction with Finder and System Events is greatly reduced. |
| **Shell Scripts** | **Unrestricted**                | **Strictly Limited**          | Cannot execute commands that require access to files outside the sandbox or sensitive system directories.               |

### Development Best Practices

To ensure your plugin works well in both versions of the application, please follow these principles:

1.  **Principle of Least Privilege**: In the `permissions` array of `manifest.json`, only request the permissions that your plugin actually needs.
2.  **Prefer `SwiftBiu` APIs**: Whenever possible, use the APIs provided by the `SwiftBiu` object (e.g., `SwiftBiu.fetch`, `SwiftBiu.readFromFile`) instead of directly calling Shell or AppleScript, as the former are already adapted and optimized for the sandboxed environment.
3.  **Graceful Degradation**: Before performing sensitive operations, you can check the `SwiftBiu.isSandboxed` boolean property. If it is `true`, you can choose to disable certain features or provide an alternative for the user.

---

## Mode One: Native Script Plugins (Recommended for Simple Tasks)

If your plugin only needs to call an AppleScript or a Shell script, this mode is the simplest and quickest.

### `actions` Object Explained (Native Scripts)

| Key               | Type   | Description                                           |
| ----------------- | ------ | ----------------------------------------------------- |
| `title`           | String | The action name displayed in the menu item.           |
| `appleScriptFile` | String | **(Choose one)** The name of the AppleScript file to execute. |
| `shellScriptFile` | String | **(Choose one)** The name of the Shell script file to execute.   |
| `icon`            | String | (Optional) The icon for this specific action.         |

**Note**: The capabilities of these scripts are severely limited in a sandboxed environment.

---

## Mode Two: JavaScript Plugins (Recommended for Complex Tasks)

When you need to interact with web APIs, handle complex logic, or display custom UI, JavaScript plugins offer unparalleled flexibility and cross-environment compatibility.

### `script.js` Entry Point

```javascript
// script.js

// Action function
async function translate(context) {
    // Read the apiKey entered by the user in settings via the API
    const apiKey = await SwiftBiu.getConfig("apiKey");
    if (!apiKey) {
        SwiftBiu.showNotification("Error", "Please enter your API Key in the plugin settings first.");
        return;
    }

    // Show loading indicator
    SwiftBiu.showLoadingIndicator();

    const query = context.selectedText;
    try {
        // Use the fetch API optimized for sandboxing
        const response = await SwiftBiu.fetch(`https://api.example.com/translate?q=${encodeURIComponent(query)}&key=${apiKey}`);
        SwiftBiu.showNotification("Translation Result", response.translatedText);
    } catch (error) {
        SwiftBiu.showNotification("Translation Failed", error.message);
    } finally {
        // Hide loading indicator
        SwiftBiu.hideLoadingIndicator();
    }
}

// Export your action
export { translate };
```

### The `SwiftBiu` Global API Object

We inject a global object named `SwiftBiu` into the JavaScript runtime environment, which provides all the necessary capabilities to interact with the main application and the macOS system. **It is strongly recommended to prioritize using these APIs to ensure plugin compatibility with the sandbox.**

*   `SwiftBiu.isSandboxed`: (Read-only, Boolean) Determines if the current application is running in a sandbox.
*   `SwiftBiu.getConfig(key)`: (Async) Reads a value configured by the user for the plugin.
*   `SwiftBiu.fetch(url, options)`: (Async) Makes a network request, handling network permissions under the sandbox.
*   `SwiftBiu.openURL(url)`: Opens a link in the browser.
*   `SwiftBiu.writeToClipboard(text)`: Writes text to the clipboard.
*   `SwiftBiu.getClipboard()`: Reads the content of the clipboard.
*   `SwiftBiu.pasteText(text)`: Pastes the specified text into the current frontmost application.
*   `SwiftBiu.showNotification(title, body)`: Displays a system notification.
*   `SwiftBiu.showLoadingIndicator()`: Displays a global loading indicator.
*   `SwiftBiu.hideLoadingIndicator()`: Hides the loading indicator.
*   `SwiftBiu.runAppleScript(script, context)`: (Async) Executes an AppleScript script.
*   `SwiftBiu.runShellScript(script, context)`: (Async) Executes a Shell script.

### Permissions (`permissions`)

Declare the permissions your plugin needs in `manifest.json` to function correctly in the sandboxed version:

*   `"network"`: Allows making network requests (`SwiftBiu.fetch`).
*   `"clipboardWrite"`: Allows writing to the clipboard (`SwiftBiu.writeToClipboard`).
*   `"clipboardRead"`: Allows reading from the clipboard (`SwiftBiu.getClipboard`).
*   `"paste"`: Allows pasting content into other applications (`SwiftBiu.pasteText`).
*   `"notifications"`: Allows displaying system notifications (`SwiftBiu.showNotification`).
*   `"ui"`: Allows displaying custom UI elements, like loading indicators (`SwiftBiu.showLoadingIndicator`).
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

---

## Plugin Examples

To help you better understand the plugin development process, we provide several example plugins with different functionalities. You can find their complete source code directly in the `SwiftBiuX-Template` project.

### Example 1: CNY - RMB Currency Converter

This is a simple but very practical tool that demonstrates:
- How to read the user's selected text (`context.selectedText`).
- How to perform data processing (converting numbers to Chinese characters).
- How to write the result to the clipboard (`SwiftBiu.writeToClipboard`).
- How to display feedback on the operation (`SwiftBiu.showNotification`).

#### `cny/manifest.json`

```json
{
  "identifier": "com.SwiftBiu.rmbconverter",
  "name": "CNY",
  "author": "SwiftBiu",
  "description": "Converts the selected numerical amount to uppercase Chinese RMB and copies it to the clipboard.",
  "version": "1.0",
  "actions": [
    {
      "title": "CNY",
      "script": "script.js",
      "icon": "dollarsign.circle"
    }
  ],
  "iconType": "sfSymbol",
  "permissions": [
    "clipboardWrite",
    "notifications"
  ]
}
```

#### `cny/script.js`

```javascript
/**
 * @param {object} context - The context object containing all information about the current selection.
 */
function performAction(context) {
    const selectedText = context.selectedText;

    if (!selectedText || isNaN(parseFloat(selectedText))) {
        SwiftBiu.showNotification("Operation Failed", "Please select a valid number.");
        return;
    }

    const rmb = convertToRMB(selectedText);
    if (rmb) {
        SwiftBiu.writeToClipboard(rmb);
        SwiftBiu.showNotification("Conversion Successful", `${selectedText} has been converted to uppercase RMB and copied to the clipboard.`);
    } else {
        SwiftBiu.showNotification("Operation Failed", "Could not convert the number.");
    }
}

/**
 * Converts a numerical amount to uppercase Chinese RMB.
 * @param {string} money - The number string.
 * @returns {string} - The uppercase Chinese RMB string.
 */
function convertToRMB(money) {
    var numberValue = new String(Math.round(money * 100)); // Numerical amount
    var chineseValue = ""; // Converted Chinese amount
    var String1 = "零壹贰叁肆伍陆柒捌玖"; // Chinese numerals
    var String2 = "万仟佰拾亿仟佰拾万仟佰拾元角分"; // Corresponding units
    var len = numberValue.length; // Length of the numberValue string
    var Ch1; // Chinese reading of the digit
    var Ch2; // Chinese reading of the digit's place
    var nZero = 0; // Counter for consecutive zeros
    var String3; // Value at a specific position
    if (len > 15) {
        return "Exceeds calculation range";
    }
    if (numberValue == 0) {
        chineseValue = "零元整";
        return chineseValue;
    }
    String2 = String2.substr(String2.length - len, len); // Get the corresponding units from STRING2
    for (var i = 0; i < len; i++) {
        String3 = parseInt(numberValue.substr(i, 1), 10); // Get the value of the digit to be converted
        if (i != (len - 3) && i != (len - 7) && i != (len - 11) && i != (len - 15)) {
            if (String3 == 0) {
                Ch1 = "";
                Ch2 = "";
                nZero = nZero + 1;
            } else if (String3 != 0 && nZero != 0) {
                Ch1 = "零" + String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            } else {
                Ch1 = String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            }
        } else { // This is a key position like ten thousand, billion, etc.
            if (String3 != 0 && nZero != 0) {
                Ch1 = "零" + String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            } else if (String3 != 0 && nZero == 0) {
                Ch1 = String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            } else if (String3 == 0 && nZero >= 3) {
                Ch1 = "";
                Ch2 = "";
                nZero = nZero + 1;
            } else {
                Ch1 = "";
                Ch2 = String2.substr(i, 1);
                nZero = nZero + 1;
            }
            if (i == (len - 11) || i == (len - 3)) { // If it's the billion or yuan position, it must be written
                Ch2 = String2.substr(i, 1);
            }
        }
        chineseValue = chineseValue + Ch1 + Ch2;
    }
    if (String3 == 0) { // If the last digit (fen) is 0, add "整"
        chineseValue = chineseValue + "整";
    }
    return chineseValue;
}
```

### Example 2: Gemini - AI Chat Assistant

This plugin demonstrates a more complex scenario and is an excellent example for learning advanced features:
- **User Configuration**: Uses the `configuration` field to let users enter sensitive information like API keys.
- **API Calls**: Interacts with the Google Gemini API using `SwiftBiu.fetch`.
- **State Management**: Maintains a `messages` array in memory to save conversation history, enabling continuous dialogue.
- **Loading Indicators**: Provides immediate visual feedback with `SwiftBiu.showLoadingIndicator` and `SwiftBiu.hideLoadingIndicator`.
- **Custom Icons**: Uses an `.svg` file within the plugin package as an icon.

#### `Gemini/manifest.json`

```json
{
  "identifier": "com.SwiftBiu.gemini",
  "name": "Gemini",
  "author": "SwiftBiu",
  "description": "Send the selected text to Google Gemini and get the response.",
  "version": "1.0",
  "actions": [
    {
      "title": "Gemini",
      "script": "script.js",
      "icon": "gemini-icon.svg"
    }
  ],
  "icon": "gemini-icon.svg",
  "iconType": "file",
  "permissions": [
    "network",
    "paste",
    "notifications"
  ],
  "configuration": [
    {
      "key": "apikey",
      "label": "Gemini API Key",
      "placeholder": "Enter your Gemini API key",
      "description": "Obtain an API key from Google AI Studio.",
      "isSecure": true
    },
    {
      "key": "resetMinutes",
      "label": "Reset Timer (minutes)",
      "placeholder": "e.g., 15",
      "description": "Reset the conversation if idle for this many minutes. Set blank to disable.",
      "isSecure": false
    }
  ]
}
```

#### `Gemini/script.js` (Core Logic)

```javascript
// Array to hold the conversation history
const messages = [];
// Timestamp of the last interaction
let lastChatDate = new Date();

/**
 * Main entry point function
 * @param {object} context - The context object
 */
function performAction(context) {
    // 1. Read user configuration
    const apiKey = SwiftBiu.getConfig("apikey");
    const resetMinutes = parseInt(SwiftBiu.getConfig("resetMinutes"), 10);

    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please set your Gemini API Key in the plugin settings.");
        return;
    }

    // 2. Handle manual reset command
    if (context.selectedText.trim().toLowerCase() === "reset chat") {
        messages.length = 0;
        SwiftBiu.showNotification("Gemini Conversation Reset", "The chat history has been cleared.");
        return;
    }

    // 3. Handle automatic timeout reset
    if (!isNaN(resetMinutes) && resetMinutes > 0) {
        const resetInterval = resetMinutes * 60 * 1000;
        if (new Date().getTime() - lastChatDate.getTime() > resetInterval) {
            messages.length = 0; // Silent reset
        }
    }

    // 4. Add user input to history
    messages.push({ role: "user", content: context.selectedText });

    // 5. Prepare and send API request
    const requestBody = convertMessagesToGeminiFormat(); // Convert messages to Gemini format
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    SwiftBiu.showLoadingIndicator();
    SwiftBiu.fetch(
        apiUrl,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        },
        (response) => { // Success callback
            SwiftBiu.hideLoadingIndicator();
            try {
                const responseData = JSON.parse(response.data);
                const assistantText = responseData.candidates.at(0).content.parts.at(0).text;
                
                // Add assistant's response to history
                messages.push({ role: "model", content: assistantText });
                lastChatDate = new Date();

                // Paste the result and notify the user
                const newContent = context.selectedText + "\n\n" + assistantText;
                SwiftBiu.pasteText(newContent);
                SwiftBiu.showNotification("Gemini Response Pasted", "The assistant's reply has been pasted.");
            } catch (e) {
                SwiftBiu.showNotification("API Error", `Failed to parse response: ${e.message}`);
                messages.pop(); // Remove the last user message on failure to allow retry
            }
        },
        (error) => { // Error callback
            SwiftBiu.hideLoadingIndicator();
            SwiftBiu.showNotification("API Request Failed", `Error: ${error.error}`);
            messages.pop();
        }
    );
}

/**
 * Converts the message history to the format required by the Gemini API.
 * @returns {object} The contents object for the Gemini API request.
 */
function convertMessagesToGeminiFormat() {
    return {
        contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
    };
}
```

### Example 3: GeminiImage - AI Image Generator

This plugin further demonstrates how to interact with more specialized API endpoints, especially for handling non-text data:
- **Calling an Image Generation API**: Sends a request to Gemini's image generation model.
- **Handling Base64 Data**: Parses the streamed JSON data returned by the API to extract Base64-encoded image information.
- **Invoking Native UI**: Uses the special `SwiftBiu.openImageInPreview(base64Image)` API to directly call a native SwiftBiu feature to display an image preview window, providing a more native user experience than a webpage.

#### `GeminiImage/manifest.json`

```json
{
    "identifier": "com.swiftbiu.gemini-image",
    "name": "AI Drawing New",
    "author": "SwiftBiu",
    "description": "Generates an image based on the selected text using the Gemini API.",
    "version": "1.0",
    "actions": [
        {
            "title": "AI Drawing",
            "script": "script.js",
            "icon": "nano-banana.svg"
        }
    ],
    "permissions": [
        "network",
        "ui",
        "notifications"
    ],
    "icon": "nano-banana.svg",
    "iconType": "file",
    "configuration": [
        {
            "key": "apiKey",
            "label": "Gemini API Key",
            "placeholder": "Enter your Google AI Studio API Key",
            "description": "Required for generating images.",
            "isSecure": true
        }
    ]
}
```

#### `GeminiImage/script.js` (Core Logic)

```javascript
/**
 * @param {object} context - The context object
 */
function performAction(context) {
    const apiKey = SwiftBiu.getConfig("apiKey");
    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Gemini API Key is not set.");
        return;
    }

    const prompt = context.selectedText;
    if (!prompt) {
        SwiftBiu.showNotification("Input Error", "Please select some text to generate an image.");
        return;
    }

    const modelId = "gemini-1.5-flash-preview-image-generation";
    const apiMethod = "streamGenerateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:${apiMethod}?key=${apiKey}`;

    const requestBody = {
        "contents": [{"role": "user", "parts": [{"text": `A high-quality, detailed image of: ${prompt}`}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
    };

    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    };

    SwiftBiu.showLoadingIndicator();

    SwiftBiu.fetch(url, options,
        (response) => { // Success callback
            try {
                const chunks = JSON.parse(response.data);
                let base64Image = null;

                // Find and extract image data from the streamed response
                for (const chunk of chunks) {
                    const part = chunk.candidates?.at(0)?.content?.parts?.at(0);
                    if (part && part.inlineData && part.inlineData.data) {
                        base64Image = part.inlineData.data;
                        break;
                    }
                }

                if (base64Image) {
                    SwiftBiu.hideLoadingIndicator();
                    // Call the native API to open the image in a preview window
                    SwiftBiu.openImageInPreview(base64Image);
                } else {
                    SwiftBiu.hideLoadingIndicator();
                    SwiftBiu.showNotification("API Error", "No image data found in response.");
                }
            } catch (e) {
                SwiftBiu.hideLoadingIndicator();
                SwiftBiu.showNotification("API Error", "Could not process image data from the server.");
            }
        },
        (error) => { // Error callback
            SwiftBiu.hideLoadingIndicator();
            SwiftBiu.showNotification("Network Error", "Failed to connect to the Gemini API.");
        }
    );