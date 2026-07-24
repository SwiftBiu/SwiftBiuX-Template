# Web UI `window.swiftBiu` API

Web App 动作运行在独立的前台沙盒中。后台 `script.js` 负责调用 `SwiftBiu.displayUI(...)`，页面中的业务逻辑通过 `window.swiftBiu` 与宿主通信。

> [!IMPORTANT]
> 后台 `SwiftBiu.getConfig()` 是同步 API；前台 `window.swiftBiu.storage.get()` 返回 Promise。两个沙盒的 API 不可混用。

## 后台启动器

Web App 的后台脚本应保持精简，主要负责检查上下文并显示页面。

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

`displayUI(options)` 常用字段：

- `htmlPath`：必填，页面入口相对路径。
- `width` / `height`：macOS 初始窗口尺寸。
- `isFloating`：失去焦点后是否继续悬浮。

## 上下文注入

页面必须定义全局初始化函数：

```javascript
window.swiftBiu_initialize = async function (context) {
    const selectedText = context.selectedText || "";
    const selectedFiles = context.selectedFiles || [];
};
```

常用上下文字段：

- `context.selectedText`：原始选中文本。
- `context.selectedFiles`：宿主识别到的本地文件数组，每项包含 `{ path, fileURL, fileName, fileExtension }`。
- `context.locale`：用户 Locale，例如 `zh-Hans`、`en-US`。
- `context.languageCode`：简化语言代码，例如 `zh`、`en`。

如果上下文只包含文本路径，请自行解析 `context.selectedText`。插件 API 只保证 `SwiftBiu.getClipboard()` 能读取纯文本，不保证直接读取 macOS Pasteboard 中的原生文件 URL 对象。

## 需要 `await` 的数据返回 API

- `window.swiftBiu.fetch(url, options)`：返回 `{ status, data }`。需要 `network`。
- `window.swiftBiu.storage.get(key)`：返回 `{ result }`。
- `window.swiftBiu.storage.set(key, value)`：保存 Manifest 中已声明的配置值。
- `window.swiftBiu.downloadRemoteFile(url, options)`：返回临时本地文件结果。需要 `network`。
- `window.swiftBiu.materializeSelectedRemoteFiles(options)`：下载当前动作中的远程文件选择。需要 `network`。
- `window.swiftBiu.getFileMetadata(path)`：返回文件元数据。需要 `localFileRead`。
- `window.swiftBiu.extractFileIcon(path, options)`：返回 PNG 图标信息或错误。需要 `localFileRead`。
- `window.swiftBiu.setFileIcon(targetPath, iconPath, options)`：写入 Finder 自定义图标。需要 `localFileRead` 与 `localFileWrite`。
- `window.swiftBiu.readLocalFile(path)`：返回 `{ base64 }`。需要 `localFileRead`。
- `window.swiftBiu.readLocalTextFile(path)`：返回 `{ result }`。需要 `localFileRead`。
- `window.swiftBiu.listDirectory(path)`：返回 `{ items }`。需要 `localFileRead`。
- `window.swiftBiu.fileExists(path)`：返回 `{ exists }`。需要 `localFileRead` 或 `localFileWrite`。
- `window.swiftBiu.directoryExists(path)`：返回 `{ exists }`。需要 `localFileRead` 或 `localFileWrite`。
- `window.swiftBiu.runShellScript(script, context)`：返回 `{ result }`，App Store 沙盒中高度受限。

```javascript
const response = await window.swiftBiu.fetch(url, {
    method: "GET"
});

if (response.status >= 200 && response.status < 300) {
    console.log(response.data);
}
```

## SwiftBiu 托管 AI

以下 Promise API 使用用户已在 SwiftBiu 配置的 AI 账号：

- `window.swiftBiu.ai.providers()` → `{ providers }`
- `window.swiftBiu.ai.imageModels()` → `{ models }`
- `window.swiftBiu.ai.chat(options)`
- `window.swiftBiu.ai.imageGenerate(options)`
- `window.swiftBiu.ai.videoGenerate(options)`
- `window.swiftBiu.ai.textToSpeech(options)` / `window.swiftBiu.ai.tts(options)`
- `window.swiftBiu.ai.speechToText(options)` / `window.swiftBiu.ai.stt(options)` / `window.swiftBiu.ai.transcribe(options)`

所有提供商请求都需要 `network`；语音转文字还需要 `localFileRead`。Web UI 桥接目前不提供流式聊天，需要流式输出时请从后台调用 `SwiftBiu.aiChatStream(...)`。

Manifest 的 `ai.allowedProviders` 同时控制原生提供商选择器和运行时请求校验。完整规则见 [SwiftBiu 托管 AI 契约](../references/native-ai.md)。

## 触发型 API

这些方法在 JavaScript 侧也返回 Promise，但原生层收到指令后会立即 resolve，不会等待窗口、对话框或粘贴动作完成。可以把它们当作触发命令。

- `window.swiftBiu.copyText(text)`：复制文本。
- `window.swiftBiu.copyImage(base64, options)`：复制图片，并可附带可在 Finder 中粘贴的临时图片文件。
- `window.swiftBiu.pasteText(text)`：复制并粘贴到焦点窗口。
- `window.swiftBiu.showNotification(titleOrMessage, messageOrOptions, options)`：显示原生通知。需要 `notifications`。
- `window.swiftBiu.openURL(url)`：打开网页。
- `window.swiftBiu.openFileWithApp(path, appBundleID)`：使用指定 App 打开文件。需要 `localFileRead`。
- `window.swiftBiu.share(options)`：调用原生分享目标并返回 `{ success, message? }`。需要 `share`。
- `window.swiftBiu.speakText(text)`：系统 TTS 朗读。
- `window.swiftBiu.pickLocalFile(options)`：打开文件选择器并返回 `{ path }`。需要 `localFileRead` 或 `localFileWrite`。
- `window.swiftBiu.pickLocalDirectory()`：选择目录并返回 `{ path }`。需要 `localFileWrite`。
- `window.swiftBiu.createLocalDirectory(path)`：创建目录并返回 `{ path }`。需要 `localFileWrite`。
- `window.swiftBiu.createLocalFile(path, base64String)`：创建文件并返回 `{ path }`。需要 `localFileWrite`。
- `window.swiftBiu.writeLocalTextFile(path, text)`：创建 UTF-8 文本文件。需要 `localFileWrite`。
- `window.swiftBiu.overwriteLocalFile(path, base64String)`：覆盖文件。需要 `localFileWrite`。
- `window.swiftBiu.renameLocalFile(path, newName)`：重命名文件。需要 `localFileWrite`。
- `window.swiftBiu.copyLocalFile(sourcePath, destinationPath)`：复制文件。需要 `localFileWrite`。
- `window.swiftBiu.moveLocalFile(sourcePath, destinationPath)`：移动文件。需要 `localFileWrite`。
- `window.swiftBiu.trashLocalItem(path)`：移到废纸篓。需要 `localFileWrite`。
- `window.swiftBiu.saveLocalFile(base64String, filename)`：打开“另存为”。
- `window.swiftBiu.exportFile(base64String, filename)`：`saveLocalFile(...)` 的兼容别名。

## 窗口生命周期

- `window.swiftBiu.ui.resizeWindow({ height })`：动态调整 Web App 窗口高度，建议额外保留 30–50px 缓冲。
- `window.swiftBiu.closeWindow()`：立即关闭当前窗口。调用后 JavaScript 环境会被销毁，后续代码不保证执行。

### 高度自适应

```javascript
function resizeToContent() {
    const height = Math.ceil(document.documentElement.scrollHeight + 40);
    window.swiftBiu.ui.resizeWindow({ height });
}
```

建议：

1. `<html>` 使用透明背景。
2. 主背景放在 `<body>`，设置 `min-height: 100vh`。
3. 内容渲染完成后计算可见高度并增加缓冲。
4. 不要只依赖 `ResizeObserver` 或固定高度。

## 文件与目录选择

Web UI 可以调用宿主选择器，也可以使用浏览器标准控件：

- 文件：`<input type="file">`
- 文件夹：`<input type="file" webkitdirectory>`

选择后应尽快使用 `FileReader` 读取为 `ArrayBuffer` 或 Data URL，并缓存数据，避免长时间持有同一个 `File` 句柄。

## 沙盒文件创建流程

1. 调用 `pickLocalDirectory()` 让用户选择可写目录。
2. 在返回路径下使用 `createLocalDirectory(...)` 和 `createLocalFile(...)`。
3. 删除时优先使用 `trashLocalItem(...)`，避免硬删除。

## App 与文件图标

不要自行解析 `.app/Contents/Info.plist`，也不要依赖 `sips`、`qlmanage`、shell、AppleScript 或 `osascript`。这些方式可能在开发版可用，但会在 App Store 沙盒中失败。

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

## 相关文档

- [Manifest 与动作类型](manifest.md)
- [后台 SwiftBiu API](background-api.md)
- [原生文件任务与 AI 响应 UI](native-workflows.md)
- [权限声明](permissions.md)
- [跨平台兼容](compatibility.md)
