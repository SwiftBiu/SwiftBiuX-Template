[Switch to English](DEVELOPMENT_GUIDE.md)

# SwiftBiu 插件开发指南

欢迎来到 SwiftBiu 插件开发的世界！本指南将帮助您使用现代 Web 技术创建功能强大的插件。

借助 SwiftBiu 的“富 Web 应用”模型，您可以使用 HTML、CSS 和 JavaScript 构建具有自定义用户界面的插件，为用户提供无缝、接近原生的体验。

## 快速上手

本模板提供了您开始所需的一切。核心开发工作流程如下：

1.  **定义 `manifest.json`**：配置您插件的元数据、动作以及任何您需要的设置。
2.  **构建您的 UI**：在 `ui/index.html` 中实现插件的界面和业务逻辑。
3.  **打包与测试**：打包您的插件并在 SwiftBiu 中加载它，以查看实际效果。

## 打包与分发

您可以通过两种方式获取您的插件包 (`.swiftbiux` 文件)：通过我们的自动化 CI 构建（推荐给大多数用户），或为本地测试手动打包。

### 自动化构建 (推荐)

此模板中的所有插件都会被自动构建和打包到一个 **Nightly Build** 版本中。这是获取最新版本最简单、最直接的方式。

您可以随时访问本仓库的 **[Releases 页面](https://github.com/SwiftBiu/SwiftBiuX-Template/releases)** 来查找最新的插件包。每当 `main` 分支有更新时，`nightly-build` 版本都会被自动更新。

### 手动本地打包

对于本地开发和快速测试，您可以使用我们提供的 `build_plugin.sh` 脚本来打包您的插件。

1.  打开您的终端。
2.  导航到本模板的根目录。
3.  运行脚本，并将您的插件文件夹名作为参数传入。

```bash
# 例如，如果您的插件在名为 "MyAwesomePlugin" 的文件夹中
./scripts/build_plugin.sh MyAwesomePlugin

# 成功！您可以在根目录找到您可分发的插件文件：
# MyAwesomePlugin.swiftbiux
```

## 两种插件动作类型

SwiftBiu 支持两种不同复杂度的动作类型。

### 类型一：纯逻辑 JavaScript 动作

适用于需要自定义逻辑（如API调用）但**不需要自定义界面**的场景。此动作由您插件根目录下的 `script.js` 文件驱动。

#### `manifest.json` 配置
为了触发 JavaScript 后台，该动作**必须**包含一个 `"script": "script.js"` 键。

```json
"actions": [
  {
    "title": "查询IP地址信息",
    "script": "script.js"
  }
]
```

#### `script.js` 开发
您需要实现两个函数：
*   `isAvailable(context)`: **(同步)** 判断动作是否应在当前上下文显示。必须返回一个对象：`{ isAvailable: Boolean, isContextMatch: Boolean }`。为保证性能，此函数应快速同步执行。
*   `performAction(context)`: 当用户点击动作时执行。如果需要执行网络请求等操作。

### 类型二：富 Web 应用动作 (推荐)

最强大的类型，适用于需要完全自定义用户界面的插件。此模式将您的 UI 视为一个完整的 Web 应用。

#### `manifest.json` 配置
一个富 Web 应用动作由 `manifest.json` 中的两个关键部分定义：
1.  一个根级别的 `ui` 对象，指向您的 HTML 文件。
2.  `actions` 数组中的一个动作，其中包含 `"script": "script.js"` 键。这是**必须的**，用于初始化插件的后台 JavaScript 环境。

```json
"actions": [
  {
    "title": "高级翻译器",
    "script": "script.js"
  }
],
"ui": {
  "main": "ui/index.html"
}
```

#### `script.js` 开发 (关键步骤)

与纯逻辑动作不同，富 Web 应用**不会自动显示 UI**。您必须在 `script.js` 的 `performAction` 函数中显式调用 `swiftBiu.displayUI()` 来启动窗口。

```javascript
function performAction(context) {
    // 定义窗口尺寸
    const width = 400;
    const height = 300;

    // 获取屏幕尺寸以计算位置（例如右上角）
    const screenSize = swiftBiu.screenSize;
    const position = {
        x: screenSize.width - width,
        y: 0
    };

    // 显式启动 UI
    swiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: width,
        height: height,
        isFloating: true, // 是否为浮动窗口
        title: "插件标题",
        position: position
    });
}
```

---

## 核心 API 参考

### `manifest.json` 详解

这个文件是您插件的“身份证”。以下是其中最重要的几个键：

| 键 (Key)        | 类型   | 是否必须 | 描述                                                                                                        |
| --------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `identifier`    | String | 是       | 插件的唯一 ID，例如 `com.yourname.plugin`。**此 ID 必须全局唯一，因为标识符重复的插件会覆盖已安装的插件。** |
| `name`          | String | 是       | 插件的显示名称。                                                                                            |
| `author`        | String | 是       | 插件的作者。                                                                                                |
| `description`   | String | 是       | 插件的介绍。                                                                                                |
| `version`       | String | 是       | 插件的版本号，例如 `1.0`。                                                                                  |
| `actions`       | Array  | 是       | 定义插件提供的一个或多个动作的数组（目前只支持一个动作）。                                                  |
| `icon`          | String | 否       | **(根级别)** SF Symbol 的名称 (如 `swift`) 或本地 PNG 文件名。这将作为整个插件的默认图标。                  |
| `iconType`      | String | 否       | **(根级别)** 定义根级别 `icon` 的类型。可选值为 `"sfSymbol"` 或 `"file"`。                                  |
| `configuration` | Array  | 否       | 为您的插件定义一个可由用户配置的设置界面。                                                                  |
| `permissions`   | Array  | 否       | 声明插件运行所需的系统权限。                                                                                |

### 插件配置 (`configuration`)

如果您的插件需要用户提供设置（例如 API 密钥），请在 `configuration` 数组中定义它们。SwiftBiu 将自动为您生成设置界面。

**一个文本输入框的示例：**
```json
"configuration": [
  {
    "key": "api_key",
    "label": "API 密钥",
    "description": "您的秘密 API 密钥。",
    "type": "secure",
    "placeholder": "在此输入您的密钥"
  }
]
```

支持的 `type` 值包括：`string` (文本)、`secure` (密码)、`boolean` (开关)、`option` (下拉菜单) 和 `radioList`。

##### `option`
*   **UI**: 一个下拉选择菜单。
*   **功能**: 允许用户从一组预定义的选项中选择一个值。
*   **额外键**:
    *   `options` (Array, 是): 定义下拉菜单中的选项。数组中的每个对象都需要以下键：
        *   `label` (String, 是): 选项在 UI 中显示的文本。
        *   `value` (String, 是): 选项的实际值，会存储并在脚本中通过 `storage.get()` 获取。
    *   `defaultValue` (String, 否): 默认选中的选项的 `value`。

**下拉菜单 (`option`) 示例：**
```json
"configuration": [
  {
    "key": "targetLanguage",
    "label": "目标语言",
    "type": "option",
    "defaultValue": "Python (Requests)",
    "options": [
      { "label": "Python (Requests)", "value": "Python (Requests)" },
      { "label": "JavaScript (Fetch)", "value": "JavaScript (Fetch)" }
    ]
  }
]
```

##### `radioList`
*   **UI**: 一个动态的、可编辑的列表。每一行包含一个单选按钮、一个多行文本输入框和一个删除按钮。用户可以动态添加新行。
*   **功能**: 用于需要用户配置一组规则，并从中激活一个的复杂场景（例如，多个翻译提示词）。
*   **额外键**:
    *   `defaultItems` (Array, 否): 定义列表的初始默认项。数组中的每个对象都需要以下键：
        *   `enabled` (Boolean, 是): 该项的单选按钮是否默认选中。
        *   `value` (String, 是): 文本框中的默认内容。

### JavaScript API (双环境)

SwiftBiu 为插件提供了两个不同的 JavaScript 上下文，每个上下文都拥有自己专属的 API 对象。理解它们的区别至关重要：

1.  **后台脚本 (`script.js`)**:
    *   **API 对象**: `SwiftBiu` (全局可用)
    *   **用途**: 用于实现插件的核心逻辑，例如网络请求、数据处理、调用系统功能等。此环境**没有 DOM**，不能直接操作 UI。
    *   **关键 API**: `SwiftBiu.displayUI()`, `SwiftBiu.showNotification()`, `SwiftBiu.pasteText()`, `SwiftBiu.writeToClipboard()` 等。

2.  **UI 脚本 (`ui/index.html`)**:
    *   **API 对象**: `window.swiftBiu`
    *   **用途**: 专门用于控制和响应插件的 Web UI 界面。此环境拥有完整的浏览器 DOM API。
    *   **关键 API**: `window.swiftBiu.copyText()`, `window.swiftBiu.closeWindow()`, `window.swiftBiu.ui.resizeWindow()` 等。

**核心区别**: `copyText` 仅存在于 UI 环境的 `window.swiftBiu` 对象中，因为它通常与用户的界面交互（如点击“复制”按钮）相关联。而后台脚本应使用功能更底层的 `SwiftBiu.writeToClipboard()` (仅写入剪贴板) 或 `SwiftBiu.pasteText()` (写入并粘贴)。

---

### UI 环境 API (`window.swiftBiu`)

当您的插件 UI 显示时，SwiftBiu 会向您的 `index.html` 的 JavaScript 上下文中注入一个强大的 `window.swiftBiu` 对象。

#### 1. 初始化您的 UI

您**必须**在您的 `ui/index.html` 中定义一个全局函数 `window.swiftBiu_initialize`。当您的 UI 加载完毕后，SwiftBiu 会调用此函数，并传入初始的 `context` (例如选中的文本)。

```javascript
// 在您的 ui/index.html 的 <script> 标签中
window.swiftBiu_initialize = function(context) {
  console.log("UI 已初始化，上下文为:", context);
  // context -> { selectedText: "你好世界", sourceAppBundleID: "com.apple.TextEdit" }
  const text = context.selectedText;
  // 在这里开始您的业务逻辑...
};
```

#### 2. 核心功能

*   **`swiftBiu.fetch(url, options)`**:  发起一个网络请求。`options` 支持 `method`, `headers`, 和 `body`。
    *   **返回**: `Promise<{ status: Int, data: String }>`
    *   **示例**: `swiftBiu.fetch('https://api.example.com/data').then(response => { /* ... */ });`

*   **`swiftBiu.copyText(text)`**:  将给定的文本复制到系统剪贴板。

*   **`swiftBiu.closeWindow()`**: (同步) 关闭当前的插件 UI 窗口。

#### 3. UI 控制与最佳实践

*   **`swiftBiu.ui.resizeWindow({ height: Number })`**:  调整插件窗口的高度。这对于创建内容动态变化的 UI至关重要。

##### 窗口高度自适应最佳实践
为了实现完美、流畅的窗口高度自适应，请遵循以下 CSS 和 JavaScript 策略：
1.  **CSS**: 在 `<html>` 上设置 `background-color: transparent;`，并将您的主背景样式（如毛玻璃效果）应用到 `<body>` 上，并设置 `min-height: 100vh;`。让您的主内容容器在不设置固定高度的情况下自然伸缩。
2.  **JavaScript**: 在您的内容渲染完毕后，手动计算所有可见元素的总高度 (`element.offsetHeight`)，并增加一个**足够的缓冲值 (例如 30px - 50px)**。这个缓冲值对于防止内容被窗口边缘或阴影遮挡至关重要。然后使用这个计算出的高度调用 `resizeWindow`。这种方法比单独使用 `ResizeObserver` 或 `document.body.scrollHeight` 更可靠。

#### 4. 存储

*   **`swiftBiu.storage.get(key)`**:  从您的插件配置中读取一个值。`key` 必须与 `manifest.json` 中定义的一个相匹配。
    *   **返回**: `Promise<{ result: String }>`
    *   **示例**: `swiftBiu.storage.get('api_key').then(response => { const apiKey = response.result; /* ... */ });`

#### 5. 系统交互

*   `swiftBiu.showImage(...)`: 显示图片。
*   `swiftBiu.openFileInPreview(...)`: 在预览中打开文件。

*   **`swiftBiu.runShellScript(command, context)`**: (异步) 执行一个 Shell 命令。此 API 通过 SwiftBiu 主应用的 `Process` API 调用 `/bin/zsh` 来执行命令。
    *   **重要：沙盒限制 (主要针对 App Store 版本)**:
        *   此 API 的行为**取决于 SwiftBiu 的版本**。在 **App Store 版本**中，它受到 App Sandbox 的严格限制，子进程会继承所有沙盒规则。
        *   **可以做什么 (App Store 版本)**: 您可以安全地执行那些通过标准输入/输出（stdin/stdout）处理数据的、自包含的命令行工具（例如 `md5`, `shasum`, `base64`, `grep`, `awk` 等），因为它们不访问沙盒外的受限资源。
        *   **不能做什么 (App Store 版本)**: 您无法访问沙盒外的文件、进行未经授权的网络连接、或通过 `osascript` 等工具控制其他应用（除非主应用有特定授权）。
        *   **官网版本**: 未来的官网版本可能会移除沙盒限制，从而赋予此 API 更大的能力。请留意版本更新说明。
    *   **权限**: 您必须在 `manifest.json` 的 `permissions` 数组中声明 `"runShellScript"` 权限。
    *   **安全**: 无论在哪个版本中，都务必谨慎处理传入命令的任何变量，以防范潜在的命令注入风险。
    *   **返回**: `Promise<{ result: String }>`
    *   **示例**:
        ```javascript
        // manifest.json 必须包含 "runShellScript" 权限
        // "permissions": ["runShellScript"]

        // script.js
        const text = context.selectedText;
        // 为了安全地在 shell 命令中使用，需要对单引号进行转义
        const escapedText = text.replace(/'/g, "'\\''");
        const ctx = { "text": escapedText };

        // 使用 printf %s 将文本通过管道传给 md5，这在沙盒内是安全的
        const md5Result = SwiftBiu.runShellScript("printf %s '{text}' | md5", ctx);
        console.log(md5Result.result); // 输出 MD5 哈希值
        ```
## 权限 (`permissions`)

为确保您的插件正常工作（尤其是在沙盒化的 App Store 版 SwiftBiu 中），您必须在 `manifest.json` 中声明它需要的权限。

*   `"network"`: `swiftBiu.fetch` 需要此权限。
*   `"clipboardWrite"`: `swiftBiu.copyText` 需要此权限。
*   以及其他权限，如 `"paste"`, `"notifications"` 等。

## 调试与日志

您 UI 的 JavaScript 中的任何 `console.log()` 信息都会被自动桥接到 SwiftBiu 的原生日志系统中。您可以在 SwiftBiu 的“日志查看器”中查看这些日志。它们会以 `[UI]` 和您的插件标识符作为前缀，极大地简化了端到端的调试过程。

## 示例

请查看此模板中包含的示例插件，以了解这些概念的实际应用。阅读它们的源代码是很好的学习方式。

祝您编码愉快！

---

## 贡献指南

为了保证项目历史的质量和清晰度，本仓库强制要求所有提交信息都遵循 **Conventional Commits** 规范。

### 自动化校验

我们提供了一个 Git 钩子，可以自动检查您的提交信息格式。要启用它，您**必须**在克隆仓库后运行一次以下命令：

```bash
./scripts/install-hooks.sh
```

安装后，任何不符合规范的 `git commit` 都将被自动拒绝，并提供有用的格式指引。

### 提交信息格式

您的提交信息必须遵循以下结构：

```
<类型>(<范围>): <描述>
```

*   **类型**: 必须是以下之一：`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`。
*   **范围**: (可选) 受变更影响的模块（例如 `Gemini`, `UI`, `build`）。
*   **描述**: 对变更的简短、清晰的描述。

**示例:**
```bash
git commit -m "feat(Gemini): 增加对流式响应的支持"