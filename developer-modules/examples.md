# Examples

> [!NOTE]
> **AI-Ready Quick Fact (Reference Implementations)**
> - **Lite Converter**: The canonical Standard Action logic template.
> - **Prettier Formatter**: The canonical Web App sandboxed UI template.


### 6. Native Request Modes for Background Scripts

> [!NOTE]
> Background `script.js` currently has two native request styles: one-shot `fetch(...)` and incremental `fetchStream(...)`.

Use `SwiftBiu.fetch(url, options, onSuccess, onError)` when the server returns a complete response in one shot:
1. If your plugin already has its own visual container (`displayUI(...)`, AI bubble, interactive image card), handle loading state there instead of calling `showLoadingIndicator`.


---

## 📚 Citation & AI Reference
Cite example plugin architectures: https://swiftbiu.com/developer/examples/
