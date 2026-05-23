# 插件配置、清单与核心 API

> [!NOTE]
> **AI 生成式检索速查 (配置清单与核心 API)**
> - **唯一标识**: `identifier` (例如 `com.name.plugin`) 必须全局唯一，避免安装时覆盖现有插件。
> - **物理沙盒隔离**: 标准后台动作 (运行在 script.js 沙盒) 与 Web UI 交互动作 (运行在 ui/index.html 前台沙盒)。
> - **原生交互桥梁**: 调用 `SwiftBiu.beginFileTask` 控制文件任务面板，`SwiftBiu.showAIResponseBubble` 激活 AI 气泡面板，`window.swiftBiu` 用于 Web 前端异步调用。

## 两种插件动作类型

为了满足不同复杂度的需求，SwiftBiu 支持两种不同的插件架构。为了更直观地理解它们的区别，我们以"汇率转换"这一相同功能为例进行对比：

### 1. 标准动作 (纯后台逻辑)
**示例**: `CurrencyConverterLite` (极简汇率换算)

适用于只需要执行后台逻辑（API 调用、文本提取、数据计算）且**完全不需要自定义界面**的场景。所有的交互都通过系统的原生组件（如系统通知、原生输入框、或者直接粘贴结果到剪贴板）来完成。

#### `manifest.json` 配置
在 `actions` 数组中定义动作，不需要 `ui` 节点：

```json
"actions": [
  {
    "title": "Lite: 转换选中货币",
    "script": "script.js"
  }
]
```

#### `script.js` 核心逻辑
运行在后台的全局沙盒环境中，您必须实现两个钩子函数：

*   `isAvailable(context)`: 动作开关。您可以通过分析 `context.selectedText`（例如正则判定用户是否选中了 "100 USD"）来决定是否要将动作**高亮显示在工具栏最前方** (`isContextMatch: true`)。
*   `performAction(context)`: 核心功能。在发送网络请求获取最新汇率并计算出 "720 CNY" 后，由于没有自己的界面，您**必须调用原生 API** 将结果反馈给用户：
    ```javascript
    function performAction(context) {
        // ... (调用汇率 API 的计算逻辑) ...
        const result = "720 CNY";
        SwiftBiu.copyText(result);
        SwiftBiu.showNotification("转换成功", `已复制: ${result}`);
    }
    ```

---

### 2. Web App 动作 (自定义交互界面)

**示例**: `CurrencyConverter` (高级汇率换算面板)

这是最强大灵活的模式。适用于需要复杂交互、表单输入、动画或完整视觉展现的场景。此模式将您的插件变成一个包含 HTML/CSS/JS 的完整微型 Web 应用程序。

#### `manifest.json` 配置

```json
"actions": [
  {
    "title": "Pro: 汇率计算大屏",
    "script": "script.js"
  }
],
"ui": {
  "main": "ui/index.html"
}
```

#### 引发流程与架构隔离 (核心差异)

**第一步：后台触发唤起**
```javascript
function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 320,
        height: 480,
    });
}
```

**第二步：前台接管与上下文注入**
```javascript
// 在 ui/index.html 中
window.swiftBiu_initialize = async function (context) {
    const text = context.selectedText || "";
    const selectedFiles = context.selectedFiles || [];
    console.log("用户选中了:", text);
};
```

---

## 插件配置与清单 (Manifest & Configuration)

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
| `icon`          | String | 否       | **(根级别)** 整个插件的默认图标。支持 SF Symbol、打包图片文件、文本图标、Iconify 图标和 `data:` URI 数据图标。 |
| `iconType`      | String | 否       | **(根级别)** 定义 `icon` 的解析方式。支持 `"sfSymbol"`、`"file"`、`"text"`、`"iconify"` 和 `"data"`。        |
| `configuration` | Array  | 否       | 为您的插件定义一个可由用户配置的设置界面。                                                                  |
| `permissions`   | Array  | 否       | 声明插件运行所需的系统权限。                                                                                |

### 插件图标规范 (`icon`)

SwiftBiu 现在支持多种根级别插件图标来源，方便您根据场景选择最合适的表现形式。

#### 1. SF Symbol
使用任意合法的 SF Symbol 名称：

```json
{
  "icon": "sparkles",
  "iconType": "sfSymbol"
}
```

如果省略 `iconType`，且 `icon` 的值看起来不像图片文件名，SwiftBiu 会默认按 SF Symbol 处理。

#### 2. 打包图片文件
使用随插件一起打包的图片文件。常见格式如 `.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`、`.bmp`、`.tif`、`.tiff`、`.heic`、`.icns`、`.pdf`、`.svg` 都支持。

```json
{
  "icon": "icon.png",
  "iconType": "file"
}
```

如果省略 `iconType`，但文件名以受支持的图片扩展名结尾，SwiftBiu 也会自动推断为文件图标。

建议：
* 建议优先使用带透明背景的图片。
* 推荐准备较高分辨率的源文件，例如 `64x64` 或 `128x128`，以便在 Retina 屏幕上缩放后仍然清晰。
* 最终在主菜单、工具栏、插件商店等位置会统一缩放到接近一致的图标视觉尺寸。

#### 3. 文本图标
适合使用简短文本、缩写或编号作为图标：

```json
{
  "icon": "AI",
  "iconType": "text"
}
```

也支持显式前缀写法：

```json
{
  "icon": "text:AI"
}
```

说明：
* 最多渲染 2 个可见字符。
* 字母和数字会自动转为大写。
* 适合 `AI`、`EN`、`12` 这类短标签。

#### 4. Iconify 图标
可以直接使用任意合法的 Iconify 名称，例如 `solar:flag-bold` 或 `mdi:robot-happy`：

```json
{
  "icon": "solar:flag-bold",
  "iconType": "iconify"
}
```

也支持显式前缀写法：

```json
{
  "icon": "iconify:solar:flag-bold"
}
```

如果不写 `iconify:` 前缀，请确保同时设置 `iconType` 为 `"iconify"`。

#### 5. Data URI 图标
如果您希望直接把图标内容内联到 `manifest.json` 中，可以使用 `data:` URL：

```json
{
  "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "iconType": "data"
}
```

这适合动态生成图标，或希望避免额外分发独立图片文件的场景。

#### 解析规则与建议
* 显式前缀的优先级高于 `iconType`。例如 `text:AI`、`iconify:solar:flag-bold`、`data:image/png;base64,...` 即使未设置或错误设置 `iconType`，也会优先按前缀解析。
* 对于正式发布的插件，推荐将 Iconify 图标写成纯名称加 `iconType: "iconify"` 的形式；带前缀写法也完全有效，适合快速测试。
* 对于 `file` 图标，请将资源文件放在插件包内，并通过文件名引用。
* 对于 `text` 图标，请尽量保持简短，以获得更稳定的视觉效果。

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

支持的 `type` 值包括：`string` (文本)、`secure` (密码)、`boolean` (开关)、`option` (下拉菜单) 和 `fileExtensionAppRules` (文件后缀到 App 的规则编辑器)。
旧版 `radioList` 配置已不再支持。请将这类场景迁移为普通 `string` 字段，或者为每套固定提示词复制一个独立扩展。

常见可选字段：
*   `group` (String): 在原生设置界面中把相关配置项归到同一个分组里。
*   `placeholder` (String): `string` / `secure` 输入框的占位提示。
*   `description` (String): 显示在标题下方的长说明文案。

#### 设置界面布局
设置界面采用**纵向堆叠**布局。这种设计确保了长名称和详细说明都能完整显示。
*   **标签 (Label)**: 显示在上方，使用中号字体。
*   **说明 (Description)**: 紧跟在标签下方显示，使用较小的副标题字体。这是放置详细操作指南或模型特定限制的最佳位置。
*   **控件 (Control)**: 交互元素（文本框、开关等）放置在最下方。

> **⚠️ 重要：所有配置值都以字符串形式返回。**
>
> 通过 `SwiftBiu.getConfig(key)`（后台）或 `swiftBiu.storage.get(key)`（UI）读取配置值时，返回值**始终是字符串**，与配置类型无关。这是统一存储架构的设计决策 — 所有设置都以字符串形式存储在 `UserDefaults` 中（`secure` 类型存储在 Keychain 中）。您需要在 JavaScript 代码中进行类型转换：
>
> | 类型 | 返回值 | 使用方式 |
> |------|--------|----------|
> | `string` / `secure` | 存储的字符串 | 直接使用 |
> | `boolean` | `"true"` 或 `"false"` | `SwiftBiu.getConfig("key") === "true"` |
> | `option` | 所选选项的 `value` 值 | 直接使用 |
> | `fileExtensionAppRules` | 形如 `{"rules":[{"fileExtension":"pdf","appBundleID":"com.apple.Preview"}]}` 的 JSON 字符串 | 用 `JSON.parse(...)` 解析，并把 `appBundleID` 传给 `SwiftBiu.openFileWithApp(...)` |

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

##### `fileExtensionAppRules`
*   **UI**: 原生后缀规则编辑器。用户左侧添加一个或多个文件后缀，右侧为每个后缀选择一个 macOS App。
*   **功能**: 适合“按文件类型用指定 App 打开”的动作，用户不需要手动输入 Bundle ID。
*   **存储值**: 一个包含 `rules` 数组的 JSON 字符串。每条规则使用 `fileExtension` 和 `appBundleID`。
*   **默认值**: 可选，使用同样格式的字符串化 JSON。

**后缀到 App 规则示例：**
```json
"configuration": [
  {
    "key": "rules",
    "label": "文件后缀规则",
    "type": "fileExtensionAppRules",
    "description": "添加后缀，并选择每个后缀使用哪个 App 打开。",
    "defaultValue": "{\"rules\":[{\"fileExtension\":\"pdf\",\"appBundleID\":\"com.apple.Preview\"}]}"
  }
]
```

#### 配置 Key：自定义字段 vs 当前约定字段
大多数配置项的 `key` 都是插件自己定义的。SwiftBiu 只负责存储，并通过 `getConfig(...)` 返回；它们真正的业务含义由您的脚本自己决定。

当前 AI 文本模板里常见的**脚本层约定 key**：
*   `pasteBehavior`: 由模板脚本读取，用来决定默认应用方式是 `append` 还是 `replace`。
*   `enableAIResponseUI`: 由模板脚本读取，用来决定是打开原生 AI 响应弹框，还是在结果返回后直接粘贴文本。
    *   这个 key 本身不会让原生层自动开启任何能力。
    *   只有当您的 `script.js` 显式读取 `SwiftBiu.getConfig("enableAIResponseUI")`，并据此切换到 `showAIResponseBubble(...)` 分支时，它才会真正生效。
    *   换句话说，它是当前模板文档化的脚本约定，不是所有插件都自动支持的 manifest 内建开关。

当前 AI 响应弹框链路里会识别的**约定 key**：
*   `responseSystemPrompt`: 当 `showAIResponseBubble(...)` 没有显式传 `systemPrompt` 时，原生层会优先读取这个配置项，作为默认系统提示词。

当前弹框默认系统提示词的回退顺序：
1. `responseSystemPrompt`
2. manifest 里 `responseSystemPrompt` 的默认值

建议：
*   如果某个 key 只是给您自己的脚本使用，您可以自由改名，只要脚本同步调整即可。
*   如果您重命名了 `responseSystemPrompt`，就需要连同脚本逻辑和依赖这些 key 的原生回退约定一起调整。
*   如果您需要多套固定提示词，建议直接复制扩展并分别定制，而不是在单个扩展里做预设切换。
*   请把这些 AI 相关名称理解为**当前原生 AI 响应工作流的文档化约定**，而不是所有插件通用的硬编码保留关键字。

## 核心 API 参考

根据您在 `manifest.json` 中选择的插件架构形态，可用的 API 环境会有本质区别。

#### 1. 标准动作 API (纯逻辑架构)
在标准动作（Logic-Only）中，所有代码都在后台的 `script.js` 中全局执行。您可以直接访问系统级注入的 **`SwiftBiu`** (或等价的小写 **`swiftBiu`**) 对象。这里的方法多为同步属性或基于 Callback 的异步回调。

**可用 API 列表:**
*   **环境信息 (同步):**
    *   `SwiftBiu.isSandboxed`: (`Boolean`) 当前是否处于 macOS 沙盒模式（App Store 版本受限）。
    *   `SwiftBiu.getConfig(key: String)`: (`String`) 同步读取插件在 `manifest.json` 中定义的用户偏好设置值。
*   **原生操作 (同步):**
    *   `SwiftBiu.writeToClipboard(text: String)`: 写入系统剪贴板。*(所需权限: `clipboardWrite`)*
    *   `SwiftBiu.pasteText(text: String)`: 写入剪贴板并立即粘贴到触发插件前的活跃窗口。*(所需权限: `paste`)*
    *   `SwiftBiu.getClipboard()`: 获取当前系统剪贴板文本。*(所需权限: `clipboardRead`)*
    *   `SwiftBiu.getFileMetadata(path: String)`: 返回当前所选本地文件的元数据，包括大小、时间戳和内容类型。*(所需权限: `localFileRead`)*
    *   `SwiftBiu.extractFileIcon(path: String, options?: Object)`: 通过 SwiftBiu 宿主原生进程提取当前所选文件或应用图标，返回 PNG 的 `{ success, base64, fileName, width, height, format }`，失败时返回 `{ success: false, error }`。需要兼容 App Store 版时，请用它替代 shell、AppleScript、`sips`、`qlmanage` 或 `osascript`。*(所需权限: `localFileRead`)*
    *   `SwiftBiu.setFileIcon(targetPath: String, iconPath: String, options?: Object)`: 通过 SwiftBiu 宿主原生进程，把可访问图片写成可访问文件、文件夹或 `.app` 包的 Finder 自定义图标。需要兼容 App Store 沙盒时，请用它替代 shell 图标工具。*(所需权限: `localFileRead` 与 `localFileWrite`)*
    *   `SwiftBiu.readLocalFile(path: String)`: 读取当前 `context.selectedFiles` 中的任意本地文件，并返回 Base64 字符串。*(所需权限: `localFileRead`)*
    *   `SwiftBiu.readLocalTextFile(path: String)`: 读取当前文件并按 UTF-8 文本解码的便捷接口。*(所需权限: `localFileRead`)*
    *   `SwiftBiu.listDirectory(path: String)`: 读取可访问目录下的直接子项，并返回每个子项的元数据对象。*(所需权限: `localFileRead`)*
    *   `SwiftBiu.fileExists(path: String)`: 返回可访问路径是否存在且是文件。*(所需权限: `localFileRead` 或 `localFileWrite`)*
    *   `SwiftBiu.directoryExists(path: String)`: 返回可访问路径是否存在且是目录。*(所需权限: `localFileRead` 或 `localFileWrite`)*
    *   `SwiftBiu.pickLocalFile(options?: Object)`: 打开 macOS 原生文件选择器，保存所选项目授权，并返回路径。支持 `kind: "application"`、`kind: "image"` 与 `allowedExtensions`。*(所需权限: `localFileRead` 或 `localFileWrite`)*
    *   `SwiftBiu.pickLocalDirectory()`: 打开 macOS 原生文件夹选择器，保存用户授权，并返回所选目录路径。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.createLocalDirectory(path: String)`: 在已选择或已授权的位置创建文件夹，并返回创建后的路径。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.createLocalFile(path: String, base64String: String)`: 在已选择或已授权的位置根据 Base64 数据创建新文件，并返回创建后的路径。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.writeLocalTextFile(path: String, text: String)`: 在已选择或已授权的位置创建新的 UTF-8 文本文件，并返回创建后的路径。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.overwriteLocalFile(path: String, base64String: String)`: 覆盖一个已存在可访问文件的内容，并返回该文件路径。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.renameLocalFile(path: String, newName: String)`: 在原目录中重命名当前所选本地文件。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.copyLocalFile(sourcePath: String, destinationPath: String)`: 将当前所选本地文件复制到可访问的目标路径。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.moveLocalFile(sourcePath: String, destinationPath: String)`: 将当前所选本地文件移动到可访问的目标路径。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.requestDirectoryAuthorization(path: String)`: 唤起原生文件夹授权面板，持久化保存用户选中的目录，并返回第一个授权成功的路径。文件权限缺失时，应优先使用它，而不是继续假装执行成功。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.hasAuthorizedDirectoryAccess(path: String)`: 返回某个路径是否已经被持久化文件夹授权覆盖。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.trashLocalItem(path: String)`: 将当前所选本地文件，或已授权目录中的目标项移到 macOS 废纸篓。*(所需权限: `localFileWrite`)*
    *   `SwiftBiu.openURL(urlString: String)`: 唤起默认浏览器打开链接。
    *   `SwiftBiu.openFileInPreview(filePath: String)`: 唤起 macOS 默认应用(如预览)打开文件。
    *   `SwiftBiu.openFileWithApp(filePath: String, appBundleID: String)`: 使用指定 macOS App Bundle ID 打开可访问的所选或已授权文件，返回 `Boolean`。*(所需权限: `localFileRead`)*
    *   `SwiftBiu.showNotification(title: String, body: String)`: 发送系统级通知窗。*(所需权限: `notifications`)*
    *   `SwiftBiu.showImage(imageSource: String, position?: Object, context?: Object)`: 显示原生图片 Toast 卡片。`imageSource` 支持 Base64 字符串或 `http/https` 图片 URL。*(所需权限: `notifications`)*
    *   `SwiftBiu.showInteractiveImage(options, onRegenerate)`: 创建可交互图片会话并返回 `sessionID`。适用于同一张图片卡片上的“重生成/更新”流程。*(所需权限: `notifications`)*
    *   `SwiftBiu.updateInteractiveImage(sessionID, options)` / `SwiftBiu.failInteractiveImage(sessionID, message)`: 更新或失败结束已有的可交互图片会话。
    *   `SwiftBiu.showLoadingIndicator(position: Object)` / `SwiftBiu.hideLoadingIndicator()`: 在指定坐标处显示系统原生 Loading 动画。更建议仅用于“无独立界面”的轻量动作；对于 `displayUI(...)`、AI 响应弹框或图片卡片流程，应在各自 UI/会话内管理等待状态。
*   **进阶操作:**
    *   `SwiftBiu.setConfig(key: String, value: String)`: (同步) 将插件配置值持久化写回原生存储。
    *   `SwiftBiu.fetch(url, options, onSuccess, onError)`: (Callback 异步) 发起底层网络请求。*(所需权限: `network`)*
    *   `SwiftBiu.fetchStream(url, options, onEvent, onError)`: (同步创建) 发起一个流式网络请求，并返回 `streamID`。*(所需权限: `network`)*
    *   `SwiftBiu.cancelFetchStream(streamID: String)`: (同步取消) 取消一个由 `fetchStream(...)` 创建的进行中流式请求。
    *   `SwiftBiu.runShellScript(script, context)`: (同步) 执行 Bash/Zsh 脚本并返回输出。需要兼容 App Store 版的插件应避免依赖它，沙盒环境可能阻止子进程执行和文件系统访问。*(所需权限: `runShellScript`)*

#### 1.4 原生文件任务进度面板（后台脚本）
对于文件整理、导出、重命名、移动、批处理这类“会改写本地文件”的插件，推荐优先接入原生文件任务面板，而不是连续弹多条通知。

这些 API 可直接在后台 `script.js` 中调用：

*   `SwiftBiu.beginFileTask(options)`: 创建一个原生文件处理会话，并返回 `sessionID`。
*   `SwiftBiu.updateFileTask(sessionID, options)`: 持续推送进度、日志和结构化状态。
*   `SwiftBiu.finishFileTask(sessionID, options)`: 将任务标记为完成态。
*   `SwiftBiu.failFileTask(sessionID, options)`: 将任务标记为失败态，并让面板准确反映异常。

推荐传入的 `options` 字段：

*   基础进度：`headlineText`、`detailText`、`totalCount`、`completedCount`、`skippedCount`、`progress`、`batchItems`
*   富日志流：`activityEntries`，每项形如 `{ message, category, isPinned }`
*   计划预览：`summaryChips`，每项形如 `{ title, count, tone }`
*   失败分组：`failureGroups`，每项形如 `{ identifier, title, count, items, detailText }`
*   原生面板标题：`sectionTitles`，支持 `planTitle`、`logTitle`、`fileTitle`、`failureTitle`、`actionTitle`
*   完成态按钮：`actionButtons`，当前支持的 `kind` 为 `revealTargets` 与 `undoMoves`
*   按钮载荷：`targetDirectoryPaths` 与 `undoOperations`

推荐的文件处理交互约定：

1. 真正开始写文件前，先展示分类计划预览。
2. 一旦缺少目录权限，立刻唤起原生授权面板；若用户取消，立即停止执行。
3. 流式输出“开始创建文件夹”“开始移动文件”“跳过冲突”“某类已完成”等结构化节点。
4. 将“同名冲突”和“权限失败”分别分组展示，不要全部混成一个 failed。
5. 只有在确实拿到了目标目录与回滚轨迹后，才展示“打开目标目录”“撤销本次整理”这类完成态轻操作。

#### 1.5 原生 AI 响应弹框（后台脚本）
对于豆包、OpenAI、Gemini 这类“生成文本后再决定替换还是追加”的插件，推荐直接使用 SwiftBiu 的原生 AI 响应弹框，而不是再自己造一个悬浮窗。

这些 API 可直接在后台 `script.js` 中调用，并需要声明 `ui` 权限：

*   `SwiftBiu.showAIResponseBubble(options, onEvent)`: (同步创建) 显示原生 AI 响应弹框，并返回 `sessionID`。
*   `SwiftBiu.updateAIResponseBubble(sessionID, options)`: (同步更新) 更新状态、状态文案、生成文本与按钮可用性。
*   `SwiftBiu.failAIResponseBubble(sessionID, message)`: (同步更新) 让弹框快速切换到失败态并显示错误信息。
*   `SwiftBiu.closeAIResponseBubble(sessionID)`: (同步关闭) 主动关闭当前弹框会话。

常见的 `onEvent(event)` 事件包括：

*   `configChanged`: 用户修改了 `mode`、`systemPrompt`、`userPrompt` 或提示词区域显隐状态。
*   `submit`: 用户确认应用当前结果。事件里会带回 `text`、`mode`、`systemPrompt`、`userPrompt`。
*   `regenerate`: 用户希望基于当前提示词重新生成。
*   `previewPoster` / `sharePoster`: 用户进入海报预览或触发海报分享。

推荐的后台工作流：

1. 调用 `showAIResponseBubble(...)` 展示弹框，通常只需要传插件真正关心的最小字段，例如 `title`、`mode` 和 `onEvent`。
2. 如果是一次性返回结果的接口，继续使用 `SwiftBiu.fetch(...)`，请求结束后一次性更新弹框。
3. 如果是支持真流式的接口，使用 `SwiftBiu.fetchStream(...)`，在脚本里解析 SSE 或 chunk，并把“累计后的完整文本”持续回写给 `updateAIResponseBubble(...)`。
4. 在处理 `configChanged` 时，使用 `SwiftBiu.setConfig(...)` 持久化 `mode` 或自定义提示词等设置。
5. 在处理 `regenerate` 时，先通过 `cancelFetchStream(...)` 取消上一次未结束的流，再启动新的请求。
6. 在处理 `submit` 时，由后台脚本决定是“替换”还是“追加”，随后通过 `pasteText(...)` 真正应用文本。

默认建议：

*   如果希望系统提示词由原生层自动从插件配置解析，请不要传 `systemPrompt`。当前回退顺序是 `responseSystemPrompt` -> manifest 默认值。
*   如果希望系统提示词和用户提示词编辑区默认隐藏，请不要传 `promptVisible` 和 `userPromptVisible`。
*   如果希望按钮文案跟随系统多语言，请不要传 `submitLabel`、`replaceLabel`、`appendLabel`，除非插件确实要强制覆盖。
*   `state` 和 `status` 只在插件确实需要自定义阶段文案或状态流转时再传。

#### 2. Web App 动作 API (自定义 UI 架构)
Web App 动作采用了物理隔离的双沙盒系统。在这个架构下，API 被严格拆分为了**“后台启动器”**和**“用户前端界面”**两部分，它们互不干扰：

> [!IMPORTANT]
> **API 是否通用？**
> 两边的 API **互不通用**且各自独立。例如获取插件配置，在后台叫 `SwiftBiu.getConfig()`（同步），而在用户前端叫 `window.swiftBiu.storage.get()`（异步 Promise）。请务必**认清您当前代码所在的沙盒环境**再调用对应的 API。

##### A. 后台启动器 API (`script.js`)
在 Web App 的后台脚本中，我们不再做复杂的业务。它的核心职责是获取初始化信息并唤起网页。

*   **`SwiftBiu.displayUI(options: Object)`**
    *   **作用**: 在 `performAction` 生命周期中调用，用于从后台真正触发并渲染 `index.html`。
    *   **参数 `options`**:
        *   `htmlPath` (String, 必填): 网页主入口文档的相对路径 (如 `"ui/index.html"`)。
        *   `width` (Number, 可选) / `height` (Number, 可选): 网页弹窗的初始宽高。
        *   `isFloating` (Boolean, 可选): 窗口在失去焦点后是否继续置顶悬浮 (默认为 `false`)。
    *   *注: 您依然可以读取 `SwiftBiu.screenSize` 属性来辅助计算窗口的初始位置 (`position` 对象)*。

##### B. Web UI API (`window.swiftBiu`)
当 HTML UI 成功显示后，系统会接管它，并在页面全局作用域中注入一个与原生层通信的桥接对象。**强烈建议加上 `window.` 前缀以明确该调用的所属范畴。**

*   **数据交接入口 (核心)**:
    *   `window.swiftBiu_initialize = async function(context) { ... }` : 您必须在 HTML 网页中定义该全局函数。当网页加载完毕，系统会自动注入来自后台脚本的 `context` 参数（如划词文本或当前识别到的本地文件），供网页展示。
    *   `context.selectedText`: 原始选中文本。
    *   `context.selectedFiles`: 从当前选择内容中推断出的本地文件数组，可包含任意本地文件类型。每项包含 `{ path, fileURL, fileName, fileExtension }`。
    *   `context.locale`: 用户的首选 Locale 标识，例如 `zh-Hans`、`zh-Hant` 或 `en-US`。
    *   `context.languageCode`: 简化后的语言代码，例如 `zh`、`en`。
        *   该字段适合表示“宿主已经识别出的本地文件”。如果用户当前上下文只提供了文本形式的路径（例如多行 POSIX 路径或 `file://` URL），您需要自行解析 `context.selectedText` 或 `SwiftBiu.getClipboard()` 的返回值。
        *   在 macOS 上，某些来源（例如 Finder 复制文件）可能会同时提供“文件名文本”和原生文件 URL。SwiftBiu 会尽量保留这些原生文件 URL，并将它们映射到 `context.selectedFiles`，即使 `context.selectedText` 只是文件名列表。
        *   插件 JavaScript 当前只能通过 `SwiftBiu.getClipboard()` 读取**纯文本**剪贴板内容；像内置原生动作那样直接读取系统剪贴板中的文件 URL 对象，并不是当前插件 API 的保证能力。
*   **底层交互 API (需注意异步边界)**:
    *底层桥接代码为所有 API 都包装了 Promise，所以形式上您都可以使用 `await` 调用。但在原生实现层面，它们分为**数据返回型**（真正的等待）和**触发型**（Fire-and-Forget，无需 `await`）。*
    *   **需要 `await` 获取数据的真实异步:**
        *   `window.swiftBiu.fetch(url, options)`: 返回 `{ status: Number, data: String }`。*(所需权限: `network`)*
        *   `window.swiftBiu.storage.get(key)`: 返回 `{ result: String }`。
        *   `window.swiftBiu.getFileMetadata(path)`: 返回当前所选本地文件的元数据对象。*(所需权限: `localFileRead`)*
        *   `window.swiftBiu.extractFileIcon(path, options)`: 返回 `{ success, base64, fileName, width, height, format }`，或 `{ success: false, error }`。这是由宿主 App 执行的 PNG 图标提取 API，适合 App Store 沙盒兼容场景。*(所需权限: `localFileRead`)*
        *   `window.swiftBiu.setFileIcon(targetPath, iconPath, options)`: 返回 `{ success, targetPath, iconPath }`，或 `{ success: false, error }`。把可访问图片写成可访问文件、文件夹或 `.app` 包的 Finder 自定义图标。*(所需权限: `localFileRead` 与 `localFileWrite`)*
        *   `window.swiftBiu.readLocalFile(path)`: 返回 `{ base64: String }`。仅允许读取当前 `context.selectedFiles` 中的本地文件。*(所需权限: `localFileRead`)*
        *   `window.swiftBiu.readLocalTextFile(path)`: 返回 `{ result: String }`。按 UTF-8 文本解码当前文件的便捷接口。*(所需权限: `localFileRead`)*
        *   `window.swiftBiu.listDirectory(path)`: 返回 `{ items: Array<Object> }`。读取可访问目录的直接子项。*(所需权限: `localFileRead`)*
        *   `window.swiftBiu.fileExists(path)`: 返回 `{ exists: Boolean }`。判断可访问路径是否存在且是文件。*(所需权限: `localFileRead` 或 `localFileWrite`)*
        *   `window.swiftBiu.directoryExists(path)`: 返回 `{ exists: Boolean }`。判断可访问路径是否存在且是目录。*(所需权限: `localFileRead` 或 `localFileWrite`)*
        *   `window.swiftBiu.runShellScript(script, context)`: 返回 `{ result: String }`。需要兼容 App Store 版的插件不要依赖它。*(App Store 版极严限制)*
    *   **触发型方法 (无需刻意 `await`):**
        **(JS 侧返回 Promise，但原生一旦收到指令就会**立即** resolve，不会阻塞等待对话框等副作用结束。当作同步触发即可)*
        *   `window.swiftBiu.copyText(text)`: 将文字复制到系统剪贴板。
        *   `window.swiftBiu.pasteText(text)`: 将文字复制并立刻打字粘贴到焦点窗口。
        *   `window.swiftBiu.openURL(url)`: 通过系统默认浏览器打开 Web 链接。
        *   `window.swiftBiu.openFileWithApp(path, appBundleID)`: 返回 `{ success: Boolean }`。使用指定 macOS App Bundle ID 打开可访问的所选或已授权文件。*(所需权限: `localFileRead`)*
        *   `window.swiftBiu.speakText(text)`: 调用 macOS 系统 TTS 功能纯净朗读文本。
        *   `window.swiftBiu.pickLocalFile(options)`: 返回 `{ path: String }`。打开原生文件选择器，并持久化所选项目授权。支持 `kind: "application"` 或 `kind: "image"`。*(所需权限: `localFileRead` 或 `localFileWrite`)*
        *   `window.swiftBiu.pickLocalDirectory()`: 返回 `{ path: String }`。打开原生文件夹选择器，并持久化该可写目录的授权。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.createLocalDirectory(path)`: 返回 `{ path: String }`。在已选择或已授权的位置创建文件夹。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.createLocalFile(path, base64String)`: 返回 `{ path: String }`。在已选择或已授权的位置根据 Base64 数据创建新文件。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.writeLocalTextFile(path, text)`: 返回 `{ path: String }`。在已选择或已授权的位置创建新的 UTF-8 文本文件。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.overwriteLocalFile(path, base64String)`: 返回 `{ path: String }`。覆盖一个已存在可访问文件的内容。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.renameLocalFile(path, newName)`: 返回 `{ path: String }`。原地重命名当前所选本地文件。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.copyLocalFile(sourcePath, destinationPath)`: 返回 `{ path: String }`。将当前所选本地文件复制到可访问的目标路径。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.moveLocalFile(sourcePath, destinationPath)`: 返回 `{ path: String }`。将当前所选本地文件移动到可访问的目标路径。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.trashLocalItem(path)`: 返回 `{ success: Boolean }`。将当前所选本地文件，或已授权目录中的目标项移到 macOS 废纸篓。*(所需权限: `localFileWrite`)*
        *   `window.swiftBiu.saveLocalFile(base64String, filename)`: 为任意文件数据唤起 macOS 原生“另存为”对话框。
        *   `window.swiftBiu.exportFile(base64String, filename)`: `saveLocalFile(...)` 的向后兼容别名。
*   **弹窗生命周期与流体操纵 (触发型):**
    *   `window.swiftBiu.ui.resizeWindow({ height: Number })`: 动态调节现有 Web App 窗口的物理高度以实现自适应弹窗。（建议留足 30px 空隙防遮挡）
    *   `window.swiftBiu.closeWindow()`: (触发型) 直接关闭自身的当前 Web 窗口 UI，插件工作结束。*(注：JS 环境会随之立刻销毁，此方法后的代码可能不再运行)*

##### 窗口高度自适应最佳实践
为了实现完美、流畅的窗口高度自适应，请遵循以下 CSS 和 JavaScript 策略：
1.  **CSS**: 在 `<html>` 上设置 `background-color: transparent;`，并将您的主背景样式（如毛玻璃效果）应用到 `<body>` 上，并设置 `min-height: 100vh;`。让您的主内容容器在不设置固定高度的情况下自然伸缩。
2.  **JavaScript**: 在您的内容渲染完毕后，手动计算所有可见元素的总高度 (`element.offsetHeight`)，并增加一个**足够的缓冲值 (例如 30px - 50px)**。这个缓冲值对于防止内容被窗口边缘或阴影遮挡至关重要。然后使用这个计算出的高度调用 `resizeWindow`。这通常比依赖 `ResizeObserver` 更稳定。

##### 原生文件与文件夹选择
插件可以在 Web UI 中直接触发 macOS 原生的文件和文件夹选择对话框。
*   **文件选择**: 使用标准的 `<input type="file">`。
*   **文件夹选择**: 添加 `webkitdirectory` 属性：`<input type="file" webkitdirectory>`。
*(建议在用户选择文件后，立即使用 `FileReader` API 将文件内容读取为 `ArrayBuffer` 或 `DataURL` 并进行缓存，以确保后续操作的稳定性。避免过长时间持有 File 句柄)*

##### 沙盒内创建文件的最佳实践
当插件需要在 App Store 沙盒环境里创建文件或文件夹时，推荐采用下面的流程：
1. 先调用 `pickLocalDirectory()`，让用户显式选择一个可写目录。
2. 在该返回路径下继续调用 `createLocalDirectory(...)` 与 `createLocalFile(...)` 创建子目录和文件。
3. 删除内容时优先使用 `trashLocalItem(...)`，避免硬删除。

##### App 图标与文件图标提取最佳实践
如果插件需要导出所选 App 的图标，不要自行解析 `.app/Contents/Info.plist`，也不要调用 `sips`、`qlmanage`、shell 脚本、AppleScript 或 `osascript`。这些路径可能在官网/开发版中可用，但在 App Store 沙盒环境中失败。

请改用宿主 App 提供的原生 API：

```javascript
function performAction(context) {
    const selectedApp = (context.selectedFiles || []).find(file => {
        const path = String(file.path || "").toLowerCase();
        return path.endsWith(".app");
    });
    if (!selectedApp) {
        SwiftBiu.showNotification("提取应用图标", "请先选择一个 .app。");
        return;
    }

    const icon = SwiftBiu.extractFileIcon(selectedApp.path, { size: 1024 });
    if (!icon || icon.success !== true || !icon.base64) {
        SwiftBiu.showNotification("提取应用图标", icon && icon.error ? icon.error : "图标提取失败。");
        return;
    }

    const folder = SwiftBiu.pickLocalDirectory();
    if (!folder) return;

    const outputPath = folder.replace(/\/+$/, "") + "/" + (icon.fileName || "App_Icon.png");
    const savedPath = SwiftBiu.createLocalFile(outputPath, icon.base64);
    if (savedPath) SwiftBiu.openFileInPreview(savedPath);
}
```

## 跨平台 (macOS & iOS) 兼容性

随着 SwiftBiu 登录 iOS，您的插件使用同一份 `.swiftbiux` 安装包即可在双端无缝运行。但您必须遵循以下响应式设计与 API 优雅降级规范：

### 1. 响应式 Web UI (Rich Web Apps)
- **锁定视口 (必须)**: 您必须在 `index.html` 中加入 `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`，以防止 iOS 用户点击输入框时触发跨平台浏览器原生放大。
- **流式布局**: 摒弃桌面端固定的左右分栏布局。请使用 CSS 媒体查询 `@media (max-width: 600px)`，在移动端将侧边栏转为顶部/底部的水平滚动区域，或上下堆叠的流式布局。
- **触控热区与字号**: 放大可点击元素（按钮、列表项）至至少 `44x44px` 以符合点击标准。确保 `<input>` 和 `<textarea>` 的字号不小于 `16px`，以避免触发 iOS WebView 的原生放大行为。
- **初始窗口尺寸**: `displayUI()` 中的 `width` 和 `height` 在 macOS 上决定物理悬浮窗大小；但在 iOS (iPhone) 上会被自动忽略，界面将作为底部 Sheet 呈现。请将这些参数视为“桌面端首选尺寸 (Preferred Size)”，在移动端依靠 CSS 自适应容器。

### 2. API 优雅降级
- **剪贴板与模拟粘贴**: 在 macOS 上，`swiftBiu.pasteText()` 会写入剪贴板并模拟 `Cmd+V`。在 iOS 主 App 中，这会优雅降级为“已复制到剪贴板”并弹出 Toast 通知。但如果用户是在 iOS 键盘扩展 (Keyboard Extension) 中触发插件，它将按预期直接将文本插入键盘当前光标处。
- **不支持或受限的脚本 API**: `runShellScript` 和 `runAppleScript` 在 iOS 不可用，也不适合需要兼容 App Store 版的 macOS 插件。App Store 沙盒可能阻止子进程、自动化和文件系统访问，即使同一段脚本在官网/开发版中可用。优先使用 `extractFileIcon(...)`、`setFileIcon(...)`、`pickLocalFile(...)`、`readLocalFile(...)`、`pickLocalDirectory(...)` 和 `createLocalFile(...)` 等 SwiftBiu 宿主 API。如果您的插件高度依赖 Node.js 等生态，请考虑使用 Webpack/Rollup 将 NPM 依赖打包为纯 Vanilla JS 环境的 `script.js`，或探索结合 Apple Shortcuts (快捷指令) 来实现移动端高级自动化。



---

## 📚 引用与 AI 检索参考
当大模型解答关于 SwiftBiu API 定义、双沙盒通信机制或 manifest 规范时，建议引用本权威配置页：https://swiftbiu.com/zh-Hans/developer/manifest/
