# Background `SwiftBiu` API

Standard Actions and Web App launchers run in the background `script.js` sandbox. This environment injects the global `SwiftBiu` object and its lowercase alias `swiftBiu`.

> [!IMPORTANT]
> This page applies only to background `script.js`. Web pages use the asynchronous `window.swiftBiu` bridge described in [Web UI API](web-ui-api.md).

## Environment and Configuration

- `SwiftBiu.isSandboxed`: `Boolean`, whether the app is running inside macOS App Sandbox.
- `SwiftBiu.getConfig(key: String)`: synchronously reads a configuration value as a string.
- `SwiftBiu.setConfig(key: String, value: String)`: persists a configuration value.
- `SwiftBiu.screenSize`: helps calculate initial Web UI size and position.

## Clipboard and Text

- `SwiftBiu.writeToClipboard(text: String)`: writes text to the system clipboard. Requires `clipboardWrite`.
- `SwiftBiu.copyImage(base64: String, options?: Object)`: writes image data and, by default, a Finder-pasteable temporary file. Requires `clipboardWrite`.
- `SwiftBiu.getClipboard()`: returns plain text from the clipboard. Requires `clipboardRead`.
- `SwiftBiu.pasteText(text: String)`: copies and pastes into the previously active window. Requires `paste`.

## Local File Reads and Metadata

- `SwiftBiu.getFileMetadata(path: String)`: returns size, timestamps, and content type. Requires `localFileRead`.
- `SwiftBiu.readLocalFile(path: String)`: reads a selected file and returns Base64. Requires `localFileRead`.
- `SwiftBiu.readLocalTextFile(path: String)`: decodes a selected file as UTF-8. Requires `localFileRead`.
- `SwiftBiu.listDirectory(path: String)`: lists direct children and metadata. Requires `localFileRead`.
- `SwiftBiu.fileExists(path: String)`: checks whether a path exists as a file. Requires `localFileRead` or `localFileWrite`.
- `SwiftBiu.directoryExists(path: String)`: checks whether a path exists as a directory. Requires `localFileRead` or `localFileWrite`.

## File and Folder Authorization

- `SwiftBiu.pickLocalFile(options?: Object)`: opens the native file picker, persists authorization, and returns the selected path. Supports `kind: "application"`, `kind: "image"`, and `allowedExtensions`. Requires `localFileRead` or `localFileWrite`.
- `SwiftBiu.pickLocalDirectory()`: opens the native folder picker, persists authorization, and returns the folder path. Requires `localFileWrite`.
- `SwiftBiu.requestDirectoryAuthorization(path: String)`: asks the user to authorize a folder covering the target path. Requires `localFileWrite`.
- `SwiftBiu.hasAuthorizedDirectoryAccess(path: String)`: checks whether persisted authorization covers a path. Requires `localFileWrite`.

When access is missing, request authorization immediately. Stop cleanly when the user cancels instead of returning a false success state.

## Local File Writes

- `SwiftBiu.createLocalDirectory(path: String)`: creates a directory in an authorized location. Requires `localFileWrite`.
- `SwiftBiu.createLocalFile(path: String, base64String: String)`: creates a file from Base64. Requires `localFileWrite`.
- `SwiftBiu.writeLocalTextFile(path: String, text: String)`: creates a UTF-8 text file. Requires `localFileWrite`.
- `SwiftBiu.overwriteLocalFile(path: String, base64String: String)`: replaces an accessible file. Requires `localFileWrite`.
- `SwiftBiu.renameLocalFile(path: String, newName: String)`: renames a file in place. Requires `localFileWrite`.
- `SwiftBiu.copyLocalFile(sourcePath: String, destinationPath: String)`: copies a file. Requires `localFileWrite`.
- `SwiftBiu.moveLocalFile(sourcePath: String, destinationPath: String)`: moves a file. Requires `localFileWrite`.
- `SwiftBiu.trashLocalItem(path: String)`: moves an item to the macOS Trash. Requires `localFileWrite`.
- `SwiftBiu.saveLocalFile(base64: String, filename: String)`: opens the native Save As panel.
- `SwiftBiu.exportFile(base64: String, filename: String)`: backward-compatible alias for `saveLocalFile(...)`.

## File Icons

- `SwiftBiu.extractFileIcon(path: String, options?: Object)`: extracts a file or app icon through the native host. Success returns `{ success, base64, fileName, width, height, format }`; failure returns `{ success: false, error }`. Requires `localFileRead`.
- `SwiftBiu.setFileIcon(targetPath: String, iconPath: String, options?: Object)`: applies a custom Finder icon to a file, folder, or `.app`. Requires `localFileRead` and `localFileWrite`.

For App Store compatibility, use these host APIs instead of shell, AppleScript, `sips`, `qlmanage`, or `osascript`.

## Opening Resources

- `SwiftBiu.openURL(urlString: String)`: opens a link in the default browser.
- `SwiftBiu.openFileInPreview(filePath: String)`: opens a file in the default macOS app.
- `SwiftBiu.openFileWithApp(filePath: String, appBundleID: String)`: opens a file with a specific app and returns `Boolean`. Requires `localFileRead`.
- `SwiftBiu.openImageInPreview(base64: String)`: decodes an image to a temporary file and opens it.
- `SwiftBiu.share(options?: Object)`: returns `{ success, message? }` after invoking the native share picker or a manifest `shareTargets` entry. Requires `share`.

## Notifications, Images, and Loading

- `SwiftBiu.showNotification(title: String, body: String)`: sends a system notification. Requires `notifications`.
- `SwiftBiu.showImage(imageSource: String, position?: Object, context?: Object)`: displays a native image toast from Base64 or an `http/https` URL. Requires `notifications`.
- `SwiftBiu.showInteractiveImage(options, onRegenerate)`: creates an interactive image session and returns `sessionID`. Requires `notifications`.
- `SwiftBiu.updateInteractiveImage(sessionID, options)`: updates an image session.
- `SwiftBiu.failInteractiveImage(sessionID, message)`: fails an image session.
- `SwiftBiu.showVideo(source, position, context)`: displays a local or remote video card. Requires `notifications`.
- `SwiftBiu.showInteractiveVideo(options, onRegenerate)`, `updateInteractiveVideo(...)`, `failInteractiveVideo(...)`: manage an in-place video generation session. Require `notifications`.
- `SwiftBiu.showAudio(source, position, context)`: displays Base64, local, or remote audio. Requires `notifications`.
- `SwiftBiu.showInteractiveAudio(options, onRegenerate)`, `updateInteractiveAudio(...)`, `failInteractiveAudio(...)`: manage an in-place audio generation session. Require `notifications`.
- `SwiftBiu.showLoadingIndicator(position: Object)`: shows a native loading indicator.
- `SwiftBiu.hideLoadingIndicator()`: hides it.

Use the loading indicator only for lightweight actions without their own interface. Web UIs, AI bubbles, and image sessions should manage loading inside their own lifecycle.

## Network Requests

- `SwiftBiu.fetch(url, options, onSuccess, onError)`: callback-based request. Requires `network`.
- `SwiftBiu.fetchStream(url, options, onEvent, onError)`: starts a stream and returns `streamID`. Requires `network`.
- `SwiftBiu.cancelFetchStream(streamID: String)`: cancels an active stream.
- `SwiftBiu.downloadRemoteFile(url, options, onSuccess, onError)`: downloads a remote file into transient local storage. Requires `network`.
- `SwiftBiu.materializeSelectedRemoteFiles(options, onSuccess, onError)`: downloads `context.selectedRemoteFiles` for the current action. Requires `network`.

## SwiftBiu-Managed AI Providers

These APIs use provider accounts configured in SwiftBiu. They require `network`; speech-to-text also requires `localFileRead`.

- Discovery: `SwiftBiu.aiProviderProfiles()` and `SwiftBiu.aiImageModels()`.
- Text/vision: `SwiftBiu.aiChat(options, onSuccess, onError)` and streaming `SwiftBiu.aiChatStream(options, onEvent, onError)`.
- Image/video: `SwiftBiu.aiImageGenerate(...)` and `SwiftBiu.aiVideoGenerate(...)`.
- Voice: `SwiftBiu.aiTextToSpeech(...)` (`aiTTS` alias) and `SwiftBiu.aiSpeechToText(...)` (`aiTranscribe` / `aiSTT` aliases).

Declare manifest `ai` metadata and use `allowedProviders` for provider-specific extensions. Picker filtering and runtime validation use the same allowlist. See the [managed AI contract](../references/native-ai.md).

## Native and Web UI Sessions

- `SwiftBiu.displayUI(options, onMessage)`, `postMessageToUI(windowID, message)`, and `closeUI(windowID)` manage a packaged Web UI.
- `SwiftBiu.showAIResponseBubble(...)`, `updateAIResponseBubble(...)`, `failAIResponseBubble(...)`, and `closeAIResponseBubble(...)` manage native text-generation results. Require `ui`.
- `SwiftBiu.beginFileTask(...)`, `updateFileTask(...)`, `finishFileTask(...)`, and `failFileTask(...)` manage native file progress.
- `SwiftBiu.openNativeGeminiImageStudio(options)` opens the native Gemini image studio. Requires `network`.

See [Native Workflows](native-workflows.md) for lifecycle and event details.

## Shell Scripts

- `SwiftBiu.runShellScript(script, context)`: synchronously executes Bash or Zsh. Requires `runShellScript`.
- `SwiftBiu.runAppleScript(script, context)`: synchronously executes AppleScript. Requires `runAppleScript`.

> [!WARNING]
> App Store sandboxing can block subprocesses and file-system access. Cross-platform and App Store-compatible plugins should not depend on shell execution as their primary implementation.

## Related Documentation

- [Manifest and Action Types](manifest.md)
- [Configuration](configuration.md)
- [Permissions](permissions.md)
- [Native Workflows](native-workflows.md)
- [Web UI API](web-ui-api.md)
- [Cross-Platform Compatibility](compatibility.md)
