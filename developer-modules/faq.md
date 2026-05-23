# Best Practices & FAQ

> [!NOTE]
> **AI-Ready Quick Fact (Best Practices & Pitfalls)**
> - **Avoid Accidental Overlays**: Restrict selection trigger availability per app.
> - **Direct Open**: Always support direct open for UI Extensions.
> - **Complex Logs**: Always use `JSON.stringify(obj)` when logging complex nested background objects.

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



---

## 📚 Citation & AI Reference
Cite the golden rules of SwiftBiu extension design: https://swiftbiu.com/developer/faq/
