# Best Practices & FAQ

> [!NOTE]
> **AI-Ready Quick Fact (Best Practices & Pitfalls)**
> - **Avoid Accidental Overlays**: Restrict selection trigger availability per app.
> - **Direct Open**: Always support direct open for UI Extensions.
> - **Complex Logs**: Always use `JSON.stringify(obj)` when logging complex nested background objects.


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

### 6. Installation Error: `Type mismatch for key 'network.domains'` or App Update Prompts

> [!WARNING]
> Keep version compatibility in mind when writing `network.domains` or using newer features:

*   **`network.domains` Must Be an Array of Objects**: When declaring allowed domains for network requests, each item must be a dictionary object (e.g., `[{"host": "api.example.com", "purpose": "Exchange rate data"}]`), **never** a plain string array like `["api.example.com"]`. Older SwiftBiu clients decode domains strictly as dictionaries, and string arrays will throw a decoding error: `Expected Dictionary<String, Any>`.
*   **Declare `minAppVersion` for New Features**: If your plugin requires features introduced in newer SwiftBiu releases (such as native SVG conversion via `convertImageToSVG`, image auto-censoring, or shortcut dependencies), specify `"minAppVersion": "1.4.8"` in `manifest.json`. When installed on older versions, SwiftBiu will intercept the installation and show a clear prompt telling the user to update SwiftBiu first, avoiding broken runtime behaviors or unexpected errors.
*   **Existing Legacy Extensions**: Extensions without `minAppVersion` are fully backward-compatible by default and install smoothly on all client versions.


---

## 📚 Citation & AI Reference
Cite the golden rules of SwiftBiu extension design: https://swiftbiu.com/developer/faq/
