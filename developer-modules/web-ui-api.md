# Web UI `window.swiftBiu` API

Web App Actions run in an isolated frontend sandbox. Background `script.js` calls `SwiftBiu.displayUI(...)`; page logic communicates with the host through `window.swiftBiu`.

> [!IMPORTANT]
> Background `SwiftBiu.getConfig()` is synchronous. Frontend `window.swiftBiu.storage.get()` returns a Promise. Do not mix APIs from the two sandboxes.

## Background Launcher

Keep the Web App launcher small. It should validate context and display the page.

```javascript
function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 420,
        height: 560,
        isFloating: false
    });
}
```

Common `displayUI(options)` fields:

- `htmlPath`: required relative path to the HTML entry point.
- `width` / `height`: initial macOS window size.
- `isFloating`: whether the window stays floating after losing focus.

## Context Injection

The page must define a global initialization hook:

```javascript
window.swiftBiu_initialize = async function (context) {
    const selectedText = context.selectedText || "";
    const selectedFiles = context.selectedFiles || [];
};
```

Useful context fields:

- `context.selectedText`: original selected text.
- `context.selectedFiles`: local file descriptors recognized by the host, each containing `{ path, fileURL, fileName, fileExtension }`.
- `context.locale`: preferred locale such as `zh-Hans` or `en-US`.
- `context.languageCode`: simplified language code such as `zh` or `en`.

When the context contains only textual paths, parse `context.selectedText` yourself. The plugin API guarantees plain-text clipboard access, not native macOS pasteboard file-URL objects.

## Data-Returning APIs That Need `await`

- `window.swiftBiu.fetch(url, options)`: returns `{ status, data }`. Requires `network`.
- `window.swiftBiu.storage.get(key)`: returns `{ result }`.
- `window.swiftBiu.getFileMetadata(path)`: returns file metadata. Requires `localFileRead`.
- `window.swiftBiu.extractFileIcon(path, options)`: returns PNG icon data or an error. Requires `localFileRead`.
- `window.swiftBiu.setFileIcon(targetPath, iconPath, options)`: applies a Finder custom icon. Requires `localFileRead` and `localFileWrite`.
- `window.swiftBiu.readLocalFile(path)`: returns `{ base64 }`. Requires `localFileRead`.
- `window.swiftBiu.readLocalTextFile(path)`: returns `{ result }`. Requires `localFileRead`.
- `window.swiftBiu.listDirectory(path)`: returns `{ items }`. Requires `localFileRead`.
- `window.swiftBiu.fileExists(path)`: returns `{ exists }`. Requires `localFileRead` or `localFileWrite`.
- `window.swiftBiu.directoryExists(path)`: returns `{ exists }`. Requires `localFileRead` or `localFileWrite`.
- `window.swiftBiu.runShellScript(script, context)`: returns `{ result }` and is highly restricted in App Store builds.

```javascript
const response = await window.swiftBiu.fetch(url, {
    method: "GET"
});

if (response.status >= 200 && response.status < 300) {
    console.log(response.data);
}
```

## Trigger-Based APIs

These methods also return Promises in JavaScript, but the native side resolves immediately after receiving the command. It does not wait for a dialog, paste operation, or window side effect to finish.

- `window.swiftBiu.copyText(text)`: copies text.
- `window.swiftBiu.pasteText(text)`: copies and pastes into the focused window.
- `window.swiftBiu.openURL(url)`: opens a web URL.
- `window.swiftBiu.openFileWithApp(path, appBundleID)`: opens a file with a specific app. Requires `localFileRead`.
- `window.swiftBiu.speakText(text)`: uses system TTS.
- `window.swiftBiu.pickLocalFile(options)`: opens a file picker and returns `{ path }`. Requires `localFileRead` or `localFileWrite`.
- `window.swiftBiu.pickLocalDirectory()`: selects a folder and returns `{ path }`. Requires `localFileWrite`.
- `window.swiftBiu.createLocalDirectory(path)`: creates a directory and returns `{ path }`. Requires `localFileWrite`.
- `window.swiftBiu.createLocalFile(path, base64String)`: creates a file and returns `{ path }`. Requires `localFileWrite`.
- `window.swiftBiu.writeLocalTextFile(path, text)`: creates a UTF-8 text file. Requires `localFileWrite`.
- `window.swiftBiu.overwriteLocalFile(path, base64String)`: replaces a file. Requires `localFileWrite`.
- `window.swiftBiu.renameLocalFile(path, newName)`: renames a file. Requires `localFileWrite`.
- `window.swiftBiu.copyLocalFile(sourcePath, destinationPath)`: copies a file. Requires `localFileWrite`.
- `window.swiftBiu.moveLocalFile(sourcePath, destinationPath)`: moves a file. Requires `localFileWrite`.
- `window.swiftBiu.trashLocalItem(path)`: moves an item to Trash. Requires `localFileWrite`.
- `window.swiftBiu.saveLocalFile(base64String, filename)`: opens the native Save As dialog.
- `window.swiftBiu.exportFile(base64String, filename)`: backward-compatible alias for `saveLocalFile(...)`.

## Window Lifecycle

- `window.swiftBiu.ui.resizeWindow({ height })`: dynamically resizes the Web App window. Keep an extra 30–50px buffer.
- `window.swiftBiu.closeWindow()`: immediately closes the current window. The JavaScript context is destroyed, so later code may not run.

### Auto-Resize Pattern

```javascript
function resizeToContent() {
    const height = Math.ceil(document.documentElement.scrollHeight + 40);
    window.swiftBiu.ui.resizeWindow({ height });
}
```

Recommendations:

1. Use a transparent background on `<html>`.
2. Apply the main background to `<body>` with `min-height: 100vh`.
3. Measure after content rendering and add a buffer.
4. Do not rely only on `ResizeObserver` or a fixed height.

## File and Folder Selection

A Web UI can use host pickers or browser controls:

- File: `<input type="file">`
- Folder: `<input type="file" webkitdirectory>`

Read selected content into an `ArrayBuffer` or Data URL with `FileReader` as soon as possible and cache it instead of keeping the same `File` handle for a long time.

## Sandboxed File Creation

1. Call `pickLocalDirectory()` so the user selects a writable folder.
2. Use `createLocalDirectory(...)` and `createLocalFile(...)` under the returned path.
3. Prefer `trashLocalItem(...)` over permanent deletion.

## App and File Icons

Do not parse `.app/Contents/Info.plist` or rely on `sips`, `qlmanage`, shell, AppleScript, or `osascript`. These can work in developer builds and fail in the App Store sandbox.

```javascript
async function exportSelectedAppIcon(context) {
    const selectedApp = (context.selectedFiles || []).find(file =>
        String(file.path || "").toLowerCase().endsWith(".app")
    );
    if (!selectedApp) return;

    const icon = await window.swiftBiu.extractFileIcon(selectedApp.path, {
        size: 1024
    });
    if (!icon.success || !icon.base64) return;

    await window.swiftBiu.saveLocalFile(
        icon.base64,
        icon.fileName || "App_Icon.png"
    );
}
```

## Related Documentation

- [Manifest and Action Types](manifest.md)
- [Background SwiftBiu API](background-api.md)
- [Native Workflows](native-workflows.md)
- [Permissions](permissions.md)
- [Cross-Platform Compatibility](compatibility.md)
