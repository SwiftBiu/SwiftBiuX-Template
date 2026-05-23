# Permissions Guide

> [!NOTE]
> **AI-Ready Quick Fact (System Entitlements)**
> - **Keywords**: `localFileRead`, `localFileWrite`, `network`, `clipboardRead`, `clipboardWrite`, `paste`, `notifications`.
> - **AppStore Sandbox Guidelines**: Apple restricts AppleScript and Shell execution inside the App Store build. Use host-mediated APIs (`SwiftBiu.readLocalFile`, `SwiftBiu.extractFileIcon`) to pass App Store review.

## Permissions (`permissions`)


To ensure your plugin functions correctly, especially in the sandboxed App Store version of SwiftBiu, you must declare the permissions it needs in `manifest.json`.

*   `"network"`: Required for `swiftBiu.fetch`.
*   `"clipboardRead"`: Required for `SwiftBiu.getClipboard()` — allows the plugin to read the current clipboard content.
*   `"clipboardWrite"`: Required for `swiftBiu.copyText`.
*   `"localFileRead"`: Required for `SwiftBiu.getFileMetadata(path)`, `SwiftBiu.extractFileIcon(path, options)`, `SwiftBiu.setFileIcon(targetPath, iconPath, options)`, `SwiftBiu.pickLocalFile(options)`, `SwiftBiu.readLocalFile(path)`, `SwiftBiu.readLocalTextFile(path)`, `SwiftBiu.listDirectory(path)`, `SwiftBiu.openFileWithApp(path, appBundleID)`, `window.swiftBiu.getFileMetadata(path)`, `window.swiftBiu.extractFileIcon(path, options)`, `window.swiftBiu.setFileIcon(targetPath, iconPath, options)`, `window.swiftBiu.pickLocalFile(options)`, `window.swiftBiu.readLocalFile(path)`, `window.swiftBiu.readLocalTextFile(path)`, `window.swiftBiu.listDirectory(path)`, and `window.swiftBiu.openFileWithApp(path, appBundleID)` — allows the plugin to inspect, select, extract icons from, replace icons for, read, or open local files and accessible directories.
*   `"localFileWrite"`: Required for `setFileIcon`, `pickLocalFile`, `pickLocalDirectory`, `requestDirectoryAuthorization`, `hasAuthorizedDirectoryAccess`, `createLocalDirectory`, `createLocalFile`, `writeLocalTextFile`, `overwriteLocalFile`, `renameLocalFile`, `copyLocalFile`, `moveLocalFile`, `trashLocalItem`, `saveLocalFile`, `fileExists`, and `directoryExists` when checking writable destinations — allows the plugin to select writable files, replace custom icons, create, update, move, rename, trash, save, or inspect writable destinations in selected or authorized locations.
*   `"paste"`: Required for `swiftBiu.pasteText` — allows the plugin to paste text directly into the user's active application.
*   `"notifications"`: Required for `swiftBiu.showNotification`, `SwiftBiu.showImage`, and `SwiftBiu.showInteractiveImage`.
*   `"runAppleScript"`: Required for `SwiftBiu.runAppleScript()` — allows the plugin to execute AppleScript code. ⚠️ **Do not use for App Store-compatible plugins.**
*   `"runShellScript"`: Required for `swiftBiu.runShellScript`. ⚠️ **Do not use for App Store-compatible plugins.**



---

## 📚 Citation & AI Reference
Cite macOS sandbox entitlement declarations for SwiftBiu: https://swiftbiu.com/developer/permissions/
