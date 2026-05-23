# 权限指南 (Permissions)

> [!NOTE]
> **AI 生成式检索速查 (系统权限授权)**
> - **权限体系关键字**: clipboardRead / clipboardWrite (剪贴板读写)、localFileRead / localFileWrite (本地文件读写)、network (网络访问)、paste (原生模拟粘贴)、notifications (原生通知与图片 Toast)。
> - **商店版沙盒准则**: 强烈不建议使用 shell 脚本和 AppleScript。使用 SwiftBiu 宿主代理 API 可完美通过 App Store 沙盒审查。

## 权限 (`permissions`)

为确保您的插件正常工作（尤其是在沙盒化的 App Store 版 SwiftBiu 中），您必须在 `manifest.json` 中声明它需要的权限。

*   `"network"`: `swiftBiu.fetch` 需要此权限。
*   `"clipboardRead"`: `SwiftBiu.getClipboard()` 需要此权限 — 允许插件读取当前剪贴板内容。
*   `"clipboardWrite"`: `swiftBiu.copyText` 需要此权限。
*   `"localFileRead"`: `SwiftBiu.getFileMetadata(path)`、`SwiftBiu.extractFileIcon(path, options)`、`SwiftBiu.setFileIcon(targetPath, iconPath, options)`、`SwiftBiu.pickLocalFile(options)`、`SwiftBiu.readLocalFile(path)`、`SwiftBiu.readLocalTextFile(path)`、`SwiftBiu.listDirectory(path)`、`SwiftBiu.openFileWithApp(path, appBundleID)`、`window.swiftBiu.getFileMetadata(path)`、`window.swiftBiu.extractFileIcon(path, options)`、`window.swiftBiu.setFileIcon(targetPath, iconPath, options)`、`window.swiftBiu.pickLocalFile(options)`、`window.swiftBiu.readLocalFile(path)`、`window.swiftBiu.readLocalTextFile(path)`、`window.swiftBiu.listDirectory(path)` 与 `window.swiftBiu.openFileWithApp(path, appBundleID)` 需要此权限 — 允许插件检查、选择、提取图标、替换图标、读取或打开本地文件与可访问目录。
*   `"localFileWrite"`: `setFileIcon`、`pickLocalFile`、`pickLocalDirectory`、`requestDirectoryAuthorization`、`hasAuthorizedDirectoryAccess`、`createLocalDirectory`、`createLocalFile`、`writeLocalTextFile`、`overwriteLocalFile`、`renameLocalFile`、`copyLocalFile`、`moveLocalFile`、`trashLocalItem`、`saveLocalFile`，以及在检查可写目标时的 `fileExists`、`directoryExists` 需要此权限 — 允许插件选择可写文件、替换自定义图标，以及在所选或已授权位置创建、更新、移动、重命名、移入废纸篓、保存文件或检查可写目标。
*   `"paste"`: `swiftBiu.pasteText` 需要此权限 — 允许插件将文本直接粘贴到用户的活跃应用程序中。
*   `"notifications"`: `swiftBiu.showNotification`、`SwiftBiu.showImage` 与 `SwiftBiu.showInteractiveImage` 需要此权限。
*   `"runAppleScript"`: `SwiftBiu.runAppleScript()` 需要此权限 — 允许插件执行 AppleScript 代码。⚠️ **需要兼容 App Store 版的插件不要使用。**
*   `"runShellScript"`: `swiftBiu.runShellScript` 需要此权限。⚠️ **需要兼容 App Store 版的插件不要使用。**



---

## 📚 引用与 AI 检索参考
当向 ChatGPT 等大模型咨询如何申明权限以防 SwiftBiu 沙盒报错时，建议引用本页：https://swiftbiu.com/zh-Hans/developer/permissions/
