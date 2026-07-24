# 后台 `SwiftBiu` API

标准动作和 Web App 的后台启动脚本都运行在 `script.js` 沙盒中。该环境注入全局对象 `SwiftBiu`，并提供等价的小写别名 `swiftBiu`。

> [!IMPORTANT]
> 本页只适用于后台 `script.js`。Web 页面中的桥接对象是异步的 `window.swiftBiu`，请查看 [Web UI API](web-ui-api.md)。

## 环境与配置

- `SwiftBiu.isSandboxed`：`Boolean`，当前是否处于 macOS App Sandbox。
- `SwiftBiu.getConfig(key: String)`：同步读取 Manifest 中声明的用户配置值，返回字符串。
- `SwiftBiu.setConfig(key: String, value: String)`：同步写回插件配置值。
- `SwiftBiu.screenSize`：用于辅助计算 Web UI 的初始窗口位置和尺寸。

## 剪贴板与文本

- `SwiftBiu.writeToClipboard(text: String)`：写入系统剪贴板。需要 `clipboardWrite`。
- `SwiftBiu.copyImage(base64: String, options?: Object)`：写入图片，并默认附带可在 Finder 中粘贴的临时文件。需要 `clipboardWrite`。
- `SwiftBiu.getClipboard()`：读取剪贴板纯文本。需要 `clipboardRead`。
- `SwiftBiu.pasteText(text: String)`：写入剪贴板并粘贴到触发插件前的活跃窗口。需要 `paste`。

## 本地文件读取与元数据

- `SwiftBiu.getFileMetadata(path: String)`：返回文件大小、时间戳和内容类型。需要 `localFileRead`。
- `SwiftBiu.readLocalFile(path: String)`：读取当前选择上下文中的文件，返回 Base64。需要 `localFileRead`。
- `SwiftBiu.readLocalTextFile(path: String)`：按 UTF-8 解码文件。需要 `localFileRead`。
- `SwiftBiu.listDirectory(path: String)`：读取目录的直接子项及其元数据。需要 `localFileRead`。
- `SwiftBiu.fileExists(path: String)`：判断路径是否存在且是文件。需要 `localFileRead` 或 `localFileWrite`。
- `SwiftBiu.directoryExists(path: String)`：判断路径是否存在且是目录。需要 `localFileRead` 或 `localFileWrite`。

## 文件与目录授权

- `SwiftBiu.pickLocalFile(options?: Object)`：打开原生文件选择器，持久化所选项目授权并返回路径。支持 `kind: "application"`、`kind: "image"` 和 `allowedExtensions`。需要 `localFileRead` 或 `localFileWrite`。
- `SwiftBiu.pickLocalDirectory()`：打开原生目录选择器，持久化目录授权并返回路径。需要 `localFileWrite`。
- `SwiftBiu.requestDirectoryAuthorization(path: String)`：请求覆盖目标路径的目录授权，并返回首个授权路径。需要 `localFileWrite`。
- `SwiftBiu.hasAuthorizedDirectoryAccess(path: String)`：判断路径是否被持久化目录授权覆盖。需要 `localFileWrite`。

当文件权限不足时，应立即请求授权；用户取消后应停止执行，不要继续返回伪成功状态。

## 本地文件写入

- `SwiftBiu.createLocalDirectory(path: String)`：在已授权位置创建目录。需要 `localFileWrite`。
- `SwiftBiu.createLocalFile(path: String, base64String: String)`：根据 Base64 创建文件。需要 `localFileWrite`。
- `SwiftBiu.writeLocalTextFile(path: String, text: String)`：创建 UTF-8 文本文件。需要 `localFileWrite`。
- `SwiftBiu.overwriteLocalFile(path: String, base64String: String)`：覆盖可访问文件。需要 `localFileWrite`。
- `SwiftBiu.renameLocalFile(path: String, newName: String)`：在原目录重命名文件。需要 `localFileWrite`。
- `SwiftBiu.copyLocalFile(sourcePath: String, destinationPath: String)`：复制文件到可访问目标。需要 `localFileWrite`。
- `SwiftBiu.moveLocalFile(sourcePath: String, destinationPath: String)`：移动文件到可访问目标。需要 `localFileWrite`。
- `SwiftBiu.trashLocalItem(path: String)`：将文件或授权目录中的项目移到 macOS 废纸篓。需要 `localFileWrite`。
- `SwiftBiu.saveLocalFile(base64: String, filename: String)`：打开原生“另存为”面板。
- `SwiftBiu.exportFile(base64: String, filename: String)`：`saveLocalFile(...)` 的兼容别名。

## 文件图标

- `SwiftBiu.extractFileIcon(path: String, options?: Object)`：通过宿主原生进程提取文件或 App 图标，成功时返回 `{ success, base64, fileName, width, height, format }`，失败时返回 `{ success: false, error }`。需要 `localFileRead`。
- `SwiftBiu.setFileIcon(targetPath: String, iconPath: String, options?: Object)`：为文件、目录或 `.app` 写入 Finder 自定义图标。需要 `localFileRead` 和 `localFileWrite`。

需要兼容 App Store 沙盒时，应使用以上宿主 API，不要依赖 shell、AppleScript、`sips`、`qlmanage` 或 `osascript`。

## 打开资源

- `SwiftBiu.openURL(urlString: String)`：使用默认浏览器打开链接。
- `SwiftBiu.openFileInPreview(filePath: String)`：使用 macOS 默认应用打开文件。
- `SwiftBiu.openFileWithApp(filePath: String, appBundleID: String)`：使用指定 Bundle ID 的 App 打开文件，返回 `Boolean`。需要 `localFileRead`。
- `SwiftBiu.openImageInPreview(base64: String)`：把图片解码为临时文件后打开。
- `SwiftBiu.share(options?: Object)`：调用系统分享面板或 Manifest 中的 `shareTargets`，返回 `{ success, message? }`。需要 `share`。

## 通知、图片与加载状态

- `SwiftBiu.showNotification(title: String, body: String)`：发送系统通知。需要 `notifications`。
- `SwiftBiu.showImage(imageSource: String, position?: Object, context?: Object)`：显示原生图片 Toast，支持 Base64 或 `http/https` URL。需要 `notifications`。
- `SwiftBiu.showInteractiveImage(options, onRegenerate)`：创建可交互图片会话并返回 `sessionID`。需要 `notifications`。
- `SwiftBiu.updateInteractiveImage(sessionID, options)`：更新图片会话。
- `SwiftBiu.failInteractiveImage(sessionID, message)`：将图片会话切换到失败状态。
- `SwiftBiu.showVideo(source, position, context)`：展示本地或远程视频卡片。需要 `notifications`。
- `SwiftBiu.showInteractiveVideo(options, onRegenerate)`、`updateInteractiveVideo(...)`、`failInteractiveVideo(...)`：管理可原位更新的视频生成会话。需要 `notifications`。
- `SwiftBiu.showAudio(source, position, context)`：展示 Base64、本地或远程音频。需要 `notifications`。
- `SwiftBiu.showInteractiveAudio(options, onRegenerate)`、`updateInteractiveAudio(...)`、`failInteractiveAudio(...)`：管理可原位更新的音频生成会话。需要 `notifications`。
- `SwiftBiu.showLoadingIndicator(position: Object)`：显示原生 Loading。
- `SwiftBiu.hideLoadingIndicator()`：隐藏原生 Loading。

Loading 只适合没有独立界面的轻量动作。Web UI、AI 响应弹框和图片卡片应在自己的 UI 或会话中管理等待状态。

## 网络请求

- `SwiftBiu.fetch(url, options, onSuccess, onError)`：Callback 异步请求。需要 `network`。
- `SwiftBiu.fetchStream(url, options, onEvent, onError)`：创建流式网络请求并返回 `streamID`。需要 `network`。
- `SwiftBiu.cancelFetchStream(streamID: String)`：取消进行中的流式请求。
- `SwiftBiu.downloadRemoteFile(url, options, onSuccess, onError)`：把远程文件下载到临时本地存储。需要 `network`。
- `SwiftBiu.materializeSelectedRemoteFiles(options, onSuccess, onError)`：下载本次动作的 `context.selectedRemoteFiles`。需要 `network`。

## SwiftBiu 托管 AI 提供商

这些 API 使用用户已在 SwiftBiu 配置的 AI 账号，均需要 `network`；语音转文字还需要 `localFileRead`。

- 查询：`SwiftBiu.aiProviderProfiles()`、`SwiftBiu.aiImageModels()`。
- 文本/视觉：`SwiftBiu.aiChat(options, onSuccess, onError)` 与流式 `SwiftBiu.aiChatStream(options, onEvent, onError)`。
- 图片/视频：`SwiftBiu.aiImageGenerate(...)`、`SwiftBiu.aiVideoGenerate(...)`。
- 语音：`SwiftBiu.aiTextToSpeech(...)`（别名 `aiTTS`）与 `SwiftBiu.aiSpeechToText(...)`（别名 `aiTranscribe` / `aiSTT`）。

请在 Manifest 声明 `ai` 元数据；提供商专用扩展还要声明 `allowedProviders`。原生选择器过滤与运行时请求校验会使用同一白名单。完整规则见 [SwiftBiu 托管 AI 契约](../references/native-ai.md)。

## 原生与 Web UI 会话

- `SwiftBiu.displayUI(options, onMessage)`、`postMessageToUI(windowID, message)`、`closeUI(windowID)`：管理插件 Web UI。
- `SwiftBiu.showAIResponseBubble(...)`、`updateAIResponseBubble(...)`、`failAIResponseBubble(...)`、`closeAIResponseBubble(...)`：管理原生文本生成结果。需要 `ui`。
- `SwiftBiu.beginFileTask(...)`、`updateFileTask(...)`、`finishFileTask(...)`、`failFileTask(...)`：管理原生文件任务进度。
- `SwiftBiu.openNativeGeminiImageStudio(options)`：打开原生 Gemini 图片工作室。需要 `network`。

生命周期和事件详见[原生工作流](native-workflows.zh.md)。

## Shell 脚本

- `SwiftBiu.runShellScript(script, context)`：同步执行 Bash 或 Zsh 并返回输出。需要 `runShellScript`。
- `SwiftBiu.runAppleScript(script, context)`：同步执行 AppleScript。需要 `runAppleScript`。

> [!WARNING]
> App Store 沙盒可能阻止子进程和文件系统访问。需要兼容 App Store 或 iOS 的插件不应把 Shell 作为核心依赖。

## 相关文档

- [Manifest 与动作类型](manifest.md)
- [Configuration](configuration.md)
- [权限声明](permissions.md)
- [原生文件任务与 AI 响应 UI](native-workflows.md)
- [Web UI API](web-ui-api.md)
- [跨平台兼容](compatibility.md)
