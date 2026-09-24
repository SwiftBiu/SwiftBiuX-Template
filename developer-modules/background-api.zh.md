# 后台 `SwiftBiu` API

<!-- 官网源文件。改本文件和 background-api.md。不要手改 SwiftBiuWeb/**/developer/background-api/index.html。 -->

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

## 文件图标与本地图片处理

- `SwiftBiu.extractFileIcon(path: String, options?: Object)`：通过宿主原生进程提取文件或 App 图标，成功时返回 `{ success, base64, fileName, width, height, format }`，失败时返回 `{ success: false, error }`。需要 `localFileRead`。
- `SwiftBiu.setFileIcon(targetPath: String, iconPath: String, options?: Object)`：为文件、目录或 `.app` 写入 Finder 自定义图标。需要 `localFileRead` 和 `localFileWrite`。
- `SwiftBiu.convertImageToSVG(path: String, options?: Object)`：在设备本地把图片矢量化为 SVG，返回 `{ success, svg, format, width, height, colors, shapeCount, groupCount, objectCount, path, fileName }` 或 `{ success: false, error }`。需要 `localFileRead`。可选参数包括 `maxColors`（2–64，限制纯色调色板）、`maxDimension`（64–1024）、`minArea`（1–256）、`curveMode`（`spline`、`polygon`、`pixel`）、`layerMode`（`stacked`、`cutout`）、`curveTolerance`（0.05–2 px）、`cornerThreshold`（20–150 度）和 `gradientMode`（`auto`、`off`，默认 `auto`）；同时支持 snake_case 别名。引擎保留透明度和透明孔洞，共享相邻区域的三次边界，将拟合准确的线性或径向明暗合并为 SVG 渐变填充。渐变使用两个色标和恒定透明度；复杂明暗仍输出为色块。像素模式不识别渐变。返回的 `svg` 需另行调用文件写入 API 保存。
- `SwiftBiu.censorLocalImage(path: String, options?: Object)`：对本地图片进行智能隐私打码遮挡，返回 `{ success, outputPath?, error? }`。需要 `localFileRead`。

SVG 还支持 `groupMode: "objects" | "geometric"`（别名 `group_mode`，API 默认 `geometric`）。实验性的对象模式分离可能的画布背景，将相连色块和归属明显的邻近小部件组成对象候选，相似实例保留为集合内的独立对象，内部包含关系形成部件层级。该模式不识别语义类别，也不恢复被遮挡的几何。存在遮挡顺序冲突时，会输出共享 `data-object` 且带有 `data-split="true"` 的多个分片。`objectCount` 按逻辑候选计数，分片不重复计入；`groupCount` 统计所有 `data-kind` 分组，包括部件、集合、背景和分片。几何模式下两项计数均为 0。

`paintMode`（别名 `paint_mode`）可设为 `faithful`（API 默认）、`editable` 或 `minimal`。便于编辑与极简两档依次扩大可合并的相邻小色块范围，但要求 OKLab 色差和透明度接近；透明孔洞及高对比细节保留。像素边界模式跳过该简化。ImageToSVG 插件默认使用便于编辑档。`minArea: 1` 只关闭原有的纯面积杂点过滤；若要保留此前的色块细节，请选 `faithful`。减少图形数量可能增加回渲染误差。

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

本地图片预览可直接传文件引用：`showImage` 接受正确编码的 `file://` URL，`showInteractiveImage` 和 `updateInteractiveImage` 接受 `{ filePath: "/path/to/image.png" }`，无需先调用 `readLocalFile` 转 Base64。本地路径额外需要 `localFileRead`，且必须属于当前运行实例选中的文件、登记的临时文件或用户已授权目录。插件 ID 和图片会话 ID 本身不授予文件权限。`filePath` 优先于 `imageSource`，待生成占位状态仍优先；原有 Base64 和 HTTP 图片输入继续支持。此处接口属于后台 JavaScriptCore API。

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
- `SwiftBiu.downloadRemoteFile(url, options, onSuccess, onError)`：下载远程文件。默认落到临时存储；传入 `destinationPath` 或 `directoryPath` 可直接保存。需要 `network`；直接保存还需要 `localFileWrite`。
- `SwiftBiu.materializeSelectedRemoteFiles(options, onSuccess, onError)`：下载本次动作的 `context.selectedRemoteFiles`。需要 `network`。
- `SwiftBiu.releaseTemporaryFile(path)`：删除 `downloadRemoteFile` 创建的临时文件。

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
