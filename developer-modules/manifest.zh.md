# Manifest 与插件动作类型

> [!NOTE]
> **先在这里确定插件结构。**
> - `identifier` 必须全局唯一，避免安装时覆盖已有插件。
> - 标准动作运行在后台 `script.js` 沙盒；Web App 动作运行在独立的 `ui/index.html` 前台沙盒。
> - 配置项、后台 API、原生交互面板和 Web UI API 已拆分为独立参考页。

## 两种插件动作类型

为了满足不同复杂度的需求，SwiftBiu 支持两种不同的插件架构。为了更直观地理解它们的区别，我们以“汇率转换”这一相同功能为例进行对比。

### 1. 标准动作（纯后台逻辑）

**示例**：`CurrencyConverterLite`（极简汇率换算）

适用于只需要执行后台逻辑（API 调用、文本提取、数据计算）且**完全不需要自定义界面**的场景。所有交互都通过系统原生组件完成，例如通知、输入框、剪贴板或直接粘贴。

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

后台全局沙盒中必须实现两个钩子函数：

- `isAvailable(context)`：动作开关。可以分析 `context.selectedText`，并通过 `isContextMatch: true` 决定是否将动作高亮到工具栏前方。
- `performAction(context)`：核心功能。因为没有自定义界面，结果需要通过原生 API 返回给用户。

```javascript
function performAction(context) {
    // ... 调用汇率 API 并完成计算 ...
    const result = "720 CNY";
    SwiftBiu.copyText(result);
    SwiftBiu.showNotification("转换成功", `已复制: ${result}`);
}
```

### 2. Web App 动作（自定义交互界面）

**示例**：`CurrencyConverter`（高级汇率换算面板）

适用于复杂交互、表单、动画或完整视觉展示。插件会包含 HTML、CSS 和 JavaScript，成为一个微型 Web App。

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

#### 启动流程与架构隔离

第一步，在后台脚本中唤起页面：

```javascript
function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 320,
        height: 480
    });
}
```

第二步，在页面中接收上下文：

```javascript
window.swiftBiu_initialize = async function (context) {
    const text = context.selectedText || "";
    const selectedFiles = context.selectedFiles || [];
    console.log("用户选中了:", text);
};
```

> [!IMPORTANT]
> 后台 `SwiftBiu` 与前台 `window.swiftBiu` 属于两个不同沙盒，API 不能混用。

## `manifest.json` 详解

`manifest.json` 是插件的“身份证”。最重要的字段如下：

| 键 | 类型 | 是否必须 | 描述 |
| --- | --- | --- | --- |
| `identifier` | String | 是 | 插件唯一 ID，例如 `com.yourname.plugin`。重复标识符会覆盖已安装插件。 |
| `name` | String | 是 | 插件显示名称。 |
| `author` | String | 是 | 插件作者。 |
| `description` | String | 是 | 插件介绍。 |
| `version` | String | 是 | 版本号，例如 `1.0`。 |
| `actions` | Array | 是 | 插件提供的动作数组；每个动作都可以拥有独立的扩展类型与 AI 配置。 |
| `icon` | String | 否 | 根级插件图标，支持 SF Symbol、图片文件、Lottie JSON、文本、Iconify 和 `data:` URI。 |
| `iconType` | String | 否 | 图标解析方式：`sfSymbol`、`file`、`lottie`、`text`、`iconify`、`data`。 |
| `iconLottieStillFrame` | String 或 Number | 否 | Lottie 静止帧：`"first"`、`"last"` 或具体帧号。 |
| `iconScale` | Number | 否 | 图标缩放比例，SwiftBiu 会归一化到支持的 `0.5`–`2.0`。 |
| `extensionKind` | String | 是 | `textAction` 或 `fileAction`；每个动作也需要声明。 |
| `configuration` | Array | 否 | 用户可配置的设置项。 |
| `permissions` | Array | 否 | 插件运行所需的系统权限。 |
| `requiredShortcuts` | Array | 否 | 旧版 AppleScript / 快捷指令桥接所依赖的系统快捷指令。 |
| `ui` | Object | 否 | Web UI 入口，当前格式为 `{ "main": "ui/index.html" }`。 |
| `shareTargets` | Array | 否 | 声明式原生分享目标；纯分享插件的 `actions` 可以为空。 |
| `network` | Object | 否 | 声明外连域名及其用途、数据和凭据元数据。 |
| `ai` | Object | 否 | SwiftBiu 托管 AI 的用途、提供商/模型配置 Key 和可选提供商白名单。 |

每个动作可声明 `title`、`icon`、`description`、`script`、`appleScriptFile`、`shellScriptFile`、`requiredShortcut`、`rules.regex`、`supportedFileExtensions`、`extensionKind` 和 `ai`。动作级 `ai` 会整体替代该动作的根级 `ai`，不会逐字段合并。

### SwiftBiu 托管 AI 元数据

```json
{
  "ai": {
    "useCase": "chat",
    "providerKey": "chatProvider",
    "modelKey": "chatModel",
    "allowedProviders": ["codex", "custom-endpoint"]
  }
}
```

- `useCase`：`chat` / `textGeneration`、`imageGeneration`、`vision`、`videoGeneration`、`tts` 或 `stt`；`role` 是兼容别名。
- `providerKey` 与 `modelKey`：SwiftBiu 用来生成原生提供商/模型选择器的配置 Key。
- `allowedProviders`：可选的提供商白名单。SwiftBiu 会过滤选择器，并在每次原生 AI 代理请求时再次校验。
- 提供商专用插件需要在每个动作级 `ai` 覆盖中重复白名单。只有实际协议兼容时才加入 `custom-endpoint`。

配置与 API 映射请继续阅读[插件配置](configuration.zh.md)和 [SwiftBiu 托管 AI 契约](../references/native-ai.md)。

## 插件图标规范

### SF Symbol

```json
{
  "icon": "sparkles",
  "iconType": "sfSymbol"
}
```

省略 `iconType` 且值不像图片文件名时，会默认按 SF Symbol 处理。

### 打包图片文件

支持 `.png`、`.jpg`、`.jpeg`、`.webp`、`.gif`、`.bmp`、`.tif`、`.tiff`、`.heic`、`.icns`、`.pdf`、`.svg` 等格式。

```json
{
  "icon": "icon.png",
  "iconType": "file"
}
```

建议使用透明背景，并准备 `64x64` 或 `128x128` 等较高分辨率源文件。

### 文本图标

```json
{
  "icon": "AI",
  "iconType": "text"
}
```

也支持：

```json
{
  "icon": "text:AI"
}
```

最多渲染 2 个可见字符，字母和数字会自动转为大写。

### Iconify 图标

```json
{
  "icon": "solar:flag-bold",
  "iconType": "iconify"
}
```

也支持显式前缀：

```json
{
  "icon": "iconify:solar:flag-bold"
}
```

### Data URI 图标

```json
{
  "icon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "iconType": "data"
}
```

适合动态生成图标，或不希望分发额外图片文件的场景。

### Lottie 动态图标

把 Lottie JSON 放入扩展包，并在 Manifest 中引用：

```json
{
  "icon": "spark-motion.json",
  "iconType": "lottie",
  "iconLottieStillFrame": "first",
  "iconScale": 1.1
}
```

`iconLottieStillFrame` 支持 `"first"`、`"last"` 或具体帧号；`iconScale` 会归一化到 `0.5`–`2.0`。用户可以在 SwiftBiu 中选择动态图标“悬停播放”或“自动播放”；静态图标保持不动，便于形成清晰对比。

<div class="swiftbiu-native-demo" data-demo-start="icons" data-demo-modes="icons"></div>

### 解析规则与建议

- 显式前缀优先于 `iconType`。
- 正式发布时，Iconify 推荐使用纯名称配合 `iconType: "iconify"`。
- 文件图标应放在插件包中并通过文件名引用。
- 文本图标应保持简短，避免工具栏中显示拥挤。

## 1.3.9 可审阅源码分享

SwiftBiu 使用两种相互关联的扩展格式：

| 格式 | 用途 |
| --- | --- |
| `.swiftbiux` | 可直接安装的扩展包 |
| `.swiftbiuxs` | 用于保存、系统分享和只读 iCloud 链接的 UTF-8 可审阅源码容器 |

用户可以在“已安装扩展”中选择“存储到文件… / 分享… / 复制 iCloud 链接”。SwiftBiu 会把 Manifest、脚本、UI 和资源合并为一个密封源码文档，写入逐文件与整包 SHA-256 完整性信息，并排除已保存配置和凭据。

接收方会先审阅扩展名称、作者、版本、文件、所需权限和完整性状态，再确认安装。iCloud 链接只负责传输密封源码，不会跳过校验，也不会直接执行远程代码。

<div class="swiftbiu-native-demo" data-demo-start="sharing" data-demo-modes="sharing"></div>

## 继续阅读

- [Configuration](configuration.md)：定义设置项、默认值和脚本约定键。
- [后台 SwiftBiu API](background-api.md)：标准动作可调用的宿主能力。
- [原生工作流](native-workflows.md)：文件任务面板和 AI 响应弹框。
- [Web UI API](web-ui-api.md)：`window.swiftBiu`、窗口生命周期和文件交互。
- [跨平台兼容](compatibility.md)：macOS、iOS 与 App Store 沙盒差异。
- [权限声明](permissions.md)：为上述能力声明最小权限。
