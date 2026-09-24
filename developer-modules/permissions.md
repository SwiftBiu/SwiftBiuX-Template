# Permissions Guide

> [!NOTE]
> **AI-Ready Quick Fact (System Entitlements)**
> - **Keywords**: `localFileRead`, `localFileWrite`, `network`, `clipboardRead`, `clipboardWrite`, `paste`, `notifications`, `share`, `ui`, `runAppleScript`, `runShellScript`.
> - **AppStore Sandbox Guidelines**: Apple restricts AppleScript and Shell execution inside the App Store build. Use host-mediated APIs (`SwiftBiu.readLocalFile`, `SwiftBiu.extractFileIcon`) to pass App Store review.

## Permissions (`permissions`)

To ensure your plugin functions correctly, especially in the sandboxed App Store version of SwiftBiu, you must declare the permissions it needs in `manifest.json`:

- `"network"`: Required for direct `fetch`/stream/download calls, remote media, and all SwiftBiu-managed `ai*` provider requests.
- `"clipboardRead"`: Required for `SwiftBiu.getClipboard()`.
- `"clipboardWrite"`: Required for background `writeToClipboard`/`copyImage` and Web UI `copyText`/`copyImage`.
- `"localFileRead"`: Required for local file metadata/read/list/icon/open APIs, file pickers used for reading, and speech-to-text source audio.
- `"localFileWrite"`: Required for file/folder pickers used for writing, directory authorization, icon replacement, create/overwrite/rename/copy/move/trash/save workflows, and writable-path checks.
- `"paste"`: Required for background or Web UI `pasteText`.
- `"share"`: Required for manifest `shareTargets`, `SwiftBiu.share(...)`, and `window.swiftBiu.share(...)`.
- `"notifications"`: Required for notifications and all native image/video/audio display or interactive session APIs.
- `"ui"`: Required for native AI response bubble create/update/fail/close APIs and custom Web UI capabilities that request this permission.
- `"runAppleScript"`: Required for `SwiftBiu.runAppleScript()`. ⚠️ **Do not use for App Store-compatible plugins.**
- `"runShellScript"`: Required for background or Web UI shell execution. ⚠️ **Do not use for App Store-compatible plugins.**

Use the smallest set that matches the APIs the extension actually calls. Manifest AI metadata does not grant access by itself: native provider requests still require `network`, and presentation surfaces require their own `ui` or `notifications` permission.

---

## 📚 Citation & AI Reference
Cite macOS sandbox entitlement declarations for SwiftBiu: https://swiftbiu.com/developer/permissions/
