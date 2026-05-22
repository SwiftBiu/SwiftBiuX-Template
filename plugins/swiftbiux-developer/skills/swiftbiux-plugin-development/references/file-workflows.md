# File Workflow Reference

Use this reference for plugins that read, create, update, rename, copy, move, save, open, or trash files.

## Input Rules

- Local files are in `context.selectedFiles`.
- Remote file-like URLs are in `context.selectedRemoteFiles`.
- Only local selected files or user-authorized paths can be passed to local file APIs.
- Do not pass `selectedRemoteFiles` to `readLocalFile(...)`, `readLocalTextFile(...)`, `getFileMetadata(...)`, or write APIs.

## Read Workflows

Use `localFileRead` when reading selected or authorized local files.

Preferred APIs:

- `SwiftBiu.readLocalTextFile(path)` for UTF-8 text.
- `SwiftBiu.readLocalFile(path)` for Base64 data.
- `SwiftBiu.getFileMetadata(path)` for size, dates, and content type.
- `SwiftBiu.listDirectory(path)` for direct children.

Local report examples:

- Count words, lines, headings, CSV rows/columns, JSON keys.
- Detect empty files, unsupported extensions, likely malformed JSON/CSV.
- Produce a Markdown report without network access.

For remote file-like inputs:

- Use `context.selectedRemoteFiles` only for URL-aware workflows.
- Use `downloadRemoteFile(...)` or `materializeSelectedRemoteFiles(...)` only when the plugin has `network` permission and the user expects remote downloads.
- Treat downloaded transient paths as current-action inputs, not permanent storage.

## Create and Save Workflows

Use `localFileWrite` when creating or saving files.

Preferred APIs:

- `SwiftBiu.pickLocalDirectory()` to choose a writable destination.
- `SwiftBiu.writeLocalTextFile(path, text)` for text files.
- `SwiftBiu.createLocalFile(path, base64String)` for binary or generated data.
- `window.swiftBiu.saveLocalFile(base64, filename)` in Web UI when a save panel is enough.

Always handle collisions:

- If `fileExists(path)` or `directoryExists(path)` is true, ask for a different name, append a suffix, or skip with a clear reason.

## Update, Rename, Copy, Move

Use a Web UI for batch operations that need review.

Required behavior:

- Show before/after preview.
- Let the user confirm before applying.
- Skip conflicts rather than overwriting unexpectedly.
- Report success, skipped items, and errors.

Preferred APIs:

- `renameLocalFile(path, newName)`
- `copyLocalFile(sourcePath, destinationPath)`
- `moveLocalFile(sourcePath, destinationPath)`
- `overwriteLocalFile(path, base64String)` only after clear confirmation.

## Delete or Clean Workflows

Never permanently delete. Use `trashLocalItem(path)` only after preview and confirmation.

Required behavior:

- Explain what will be moved to Trash.
- Allow cancel.
- Move only selected or authorized items.
- Report items that were skipped.

## Native File Task Panel

For file organizers, exporters, compressors, or any write-heavy batch job, prefer the native file task panel over chained notifications.

Preferred APIs:

- `SwiftBiu.beginFileTask(options)`
- `SwiftBiu.updateFileTask(sessionID, options)`
- `SwiftBiu.finishFileTask(sessionID, options)`
- `SwiftBiu.failFileTask(sessionID, options)`

Recommended `options` fields:

- Progress: `headlineText`, `detailText`, `totalCount`, `completedCount`, `skippedCount`, `progress`, `batchItems`
- Logs: `activityEntries` with `{ message, category, isPinned }`
- Preview summary: `summaryChips` with `{ title, count, tone }`
- Failure groups: `failureGroups` with `{ identifier, title, count, items, detailText }`
- Completion actions: `actionButtons`, `targetDirectoryPaths`, `undoOperations`

Show the plan before writing, update progress during work, and separate conflicts from permission failures.

## Authorization

When the destination is outside the selected file's accessible area:

- Use `pickLocalDirectory()` for user-chosen writable output.
- Use `requestDirectoryAuthorization(path)` when a known folder needs access.
- Use `hasAuthorizedDirectoryAccess(path)` before assuming a folder is writable.

## App Store Compatibility

Prefer SwiftBiu host APIs for native resource tasks:

- `extractFileIcon(...)`
- `setFileIcon(...)`
- `pickLocalFile(...)`
- `readLocalFile(...)`
- `createLocalFile(...)`

Avoid shell, AppleScript, `osascript`, `sips`, `qlmanage`, Node, and Python for plugins that must work in App Store builds.

Example: extract a selected `.app` icon and save it as PNG.

```javascript
function performAction(context) {
    var app = (context.selectedFiles || []).find(function(file) {
        var path = String(file.path || "").toLowerCase();
        return path.endsWith(".app");
    });
    if (!app) {
        SwiftBiu.showNotification("Extract App Icon", "Select a .app first.");
        return;
    }

    var result = SwiftBiu.extractFileIcon(app.path, { size: 1024 });
    if (!result || result.success !== true || !result.base64) {
        SwiftBiu.showNotification("Extract App Icon", result && result.error ? result.error : "Icon extraction failed.");
        return;
    }

    var folder = SwiftBiu.pickLocalDirectory();
    if (!folder) return;

    var outputPath = folder.replace(/\/+$/, "") + "/" + (result.fileName || "App_Icon.png");
    var savedPath = SwiftBiu.createLocalFile(outputPath, result.base64);
    if (savedPath) SwiftBiu.openFileInPreview(savedPath);
}
```
