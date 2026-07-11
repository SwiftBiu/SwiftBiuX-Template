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
| `actions` | Array | 是 | 插件提供的动作数组，目前只支持一个动作。 |
| `icon` | String | 否 | 根级插件图标，支持 SF Symbol、图片文件、文本、Iconify 和 `data:` URI。 |
| `iconType` | String | 否 | 图标解析方式：`sfSymbol`、`file`、`text`、`iconify`、`data`。 |
| `configuration` | Array | 否 | 用户可配置的设置项。 |
| `permissions` | Array | 否 | 插件运行所需的系统权限。 |

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

### 解析规则与建议

- 显式前缀优先于 `iconType`。
- 正式发布时，Iconify 推荐使用纯名称配合 `iconType: "iconify"`。
- 文件图标应放在插件包中并通过文件名引用。
- 文本图标应保持简短，避免工具栏中显示拥挤。

## 继续阅读

- [Configuration](configuration.md)：定义设置项、默认值和脚本约定键。
- [后台 SwiftBiu API](background-api.md)：标准动作可调用的宿主能力。
- [原生工作流](native-workflows.md)：文件任务面板和 AI 响应弹框。
- [Web UI API](web-ui-api.md)：`window.swiftBiu`、窗口生命周期和文件交互。
- [跨平台兼容](compatibility.md)：macOS、iOS 与 App Store 沙盒差异。
- [权限声明](permissions.md)：为上述能力声明最小权限。
