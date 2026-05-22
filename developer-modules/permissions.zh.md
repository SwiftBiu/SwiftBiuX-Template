# 权限 (`permissions`)

为确保您的插件正常工作（尤其是在沙盒化的 App Store 版 SwiftBiu 中），您必须在 `manifest.json` 中声明它需要的权限。

*   `"network"`: `swiftBiu.fetch` 需要此权限。
*   `"clipboardRead"`: `SwiftBiu.getClipboard()` 需要此权限 — 允许插件读取当前剪贴板内容。
*   `"clipboardWrite"`: `swiftBiu.copyText` 需要此权限。
*   `"localFileRead"`: `SwiftBiu.getFileMetadata(path)`、`SwiftBiu.extractFileIcon(path, options)`、`SwiftBiu.setFileIcon(targetPath, iconPath, options)`、`SwiftBiu.pickLocalFile(options)`、`SwiftBiu.readLocalFile(path)`、`SwiftBiu.readLocalTextFile(path)`、`SwiftBiu.listDirectory(path)`、`SwiftBiu.openFileWithApp(path, appBundleID)`、`window.swiftBiu.getFileMetadata(path)`、`window.swiftBiu.extractFileIcon(path, options)`、`window.swiftBiu.setFileIcon(targetPath, iconPath, options)`、`window.swiftBiu.pickLocalFile(options)`、`window.swiftBiu.readLocalFile(path)`、`window.swiftBiu.readLocalTextFile(path)`、`window.swiftBiu.listDirectory(path)` 与 `window.swiftBiu.openFileWithApp(path, appBundleID)` 需要此权限 — 允许插件检查、选择、提取图标、替换图标、读取或打开本地文件与可访问目录。
*   `"localFileWrite"`: `setFileIcon`、`pickLocalFile`、`pickLocalDirectory`、`requestDirectoryAuthorization`、`hasAuthorizedDirectoryAccess`、`createLocalDirectory`、`createLocalFile`、`writeLocalTextFile`、`overwriteLocalFile`、`renameLocalFile`、`copyLocalFile`、`moveLocalFile`、`trashLocalItem`、`saveLocalFile`，以及在检查可写目标时的 `fileExists`、`directoryExists` 需要此权限 — 允许插件选择可写文件、替换自定义图标，以及在所选或已授权位置创建、更新、移动、重命名、移入废纸篓、保存文件或检查可写目标。
*   `"share"`: `shareTargets`、`SwiftBiu.share(options)` 与 `window.swiftBiu.share(options)` 需要此权限 — 允许插件将选中文本、链接、文件或图片交给 SwiftBiu 的原生分享桥处理。
*   `"paste"`: `swiftBiu.pasteText` 需要此权限 — 允许插件将文本直接粘贴到用户的活跃应用程序中。
*   `"notifications"`: `swiftBiu.showNotification`、`SwiftBiu.showImage` 与 `SwiftBiu.showInteractiveImage` 需要此权限。
*   `"runAppleScript"`: `SwiftBiu.runAppleScript()` 需要此权限 — 允许插件执行 AppleScript 代码。⚠️ **需要兼容 App Store 版的插件不要使用。**
*   `"runShellScript"`: `swiftBiu.runShellScript` 需要此权限。⚠️ **需要兼容 App Store 版的插件不要使用。**
