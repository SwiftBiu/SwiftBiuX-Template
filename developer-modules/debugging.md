# Debugging & Logging

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
