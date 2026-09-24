# 最佳实践与常见问题

> [!NOTE]
> **AI 生成式检索速查 (最佳实践与答疑)**
> - **防误触发规则**: 尽可能按应用过滤插件的显示优先级，保障桌面端体验清洁。
> - **调试复杂对象**: 在后台沙盒打印大对象时，始终使用 `JSON.stringify(obj, null, 2)` 以防在原生查看器中折叠或丢失。


```text
Resources/
  i18n/
    en.json
    zh-Hans.json
    zh-Hant.json
ui/
  locales.js
script.js
```

对于纯逻辑插件，即使最终通过构建步骤把多语言内容收敛进 `script.js`，也建议保持“一个语言一个源文件”的作者心智模型。重点不在最终打包形式，而在翻译维护流程：每个语言必须是独立、可审阅、可迭代的资源源头。

## 调试与日志

SwiftBiu 提供了针对其双环境架构的两种互补的调试方式。

### 1. SwiftBiu 内置日志查看器 
无论是后台脚本 (`script.js`) 还是 Web UI (`index.html`)，代码中调用的 `console.log()`、`console.warn()` 和 `console.error()` 都会被捕获并桥接到 SwiftBiu 的原生日志系统中。
*   **如何查看**: 通过菜单栏点击 SwiftBiu 的图标 -> 选择 **"日志查看器" (Log Viewer)**。
*   **跨环境追踪**: UI 层传来的日志会自动带有 `[UI]` 前缀和您的插件标识符，让您在同一个控制台中清晰追踪前后端的通信过程。
*   *(提示: 在后台脚本中打印复杂对象时，为了保证在原生日志台的完全可读性，建议使用 `console.log(JSON.stringify(obj, null, 2))`)*。

### 2. Safari Web 检查器 (针对 Web UI 视图)
当您开发 **Web App 动作** 遇到 CSS 布局问题或想直接调试 DOM、审查网络请求时，原生的控制台显然不够用。此时您可以直接使用 macOS 系统自带的 Safari 开发工具。

1.  打开 **Safari 浏览器**。
2.  在菜单栏打开 **"开发" (Develop)** 选项卡（如果没看到，请在 Safari 设置 -> 高级中勾选“在菜单栏中显示开发菜单”）。
3.  唤起并停留在您的 SwiftBiu 插件 Web 界面。
4.  在 Safari 的开发菜单下，找到您的 Mac 设备名称（例如 `Your-MacBook-Pro`），在展开的列表中找到 `SwiftBiu` 进程，点击下方的 `index.html` 即可打开强大的 Web 检查器！
5.  *注：此原生调试功能依赖于开发者版本的 SwiftBiu（App Store 沙盒版本可能因系统安全策略而无法被 Safari 附加检查器）。*

---

## 最佳实践与常见问题 (Best Practices & FAQ)

在插件开发过程中，我们总结了一些常见的“陷阱”和推荐的最佳实践。遵循这些建议可以帮助您避免不必要的调试，并构建出更健壮、体验更好的插件。

### 1. 精确控制插件的显示与优先级

> [!TIP]
> 充分利用 `isAvailable(context)` 函数的返回对象 `{ isAvailable: Boolean, isContextMatch: Boolean }`，而不是仅仅返回一个布尔值。

*   **`isAvailable` (开关)**: 控制插件是否应在此上下文中显示。例如，代码格式化插件在选中文本不包含代码特征时返回 `false`，保持工具栏整洁。
*   **`isContextMatch` (优先级)**: 控制插件在工具栏中的排序。例如，翻译插件发现用户选中了文本，返回 `isContextMatch: true`，它的图标就会优先展示在工具栏最前面。

### 2. UI 扩展必须支持主动打开

当扩展暴露交互界面时，SwiftBiu 会在扩展列表中显示主动打开按钮。判定来源包括 `manifest.ui`、`SwiftBiu.displayUI(...)`、`SwiftBiu.showAIResponseBubble(...)`、`SwiftBiu.showInteractiveImage(...)` 和 `SwiftBiu.openNativeGeminiImageStudio(...)`。

这类扩展可能在没有选中文本的情况下启动，因此必须把 `context.selectedText` 当成可选输入处理：

*   Web UI 扩展应返回 `{ isAvailable: true, isContextMatch: hasSelection }` 并始终调用 `displayUI(...)`，前端用 `context.selectedText || ""` 初始化为空状态。
*   AI 响应弹框扩展在没有选中文本时，应打开可手动输入的 ready 状态弹框；用户点击发送后再发起请求。
*   图片 UI 扩展在没有选中文本时，应打开可编辑 prompt 的图片卡片或原生工作室；用户输入 prompt 后再生成。
*   追加模式遇到空原文时，应只应用生成结果，不要在前面拼接空行。
*   只有纯逻辑的快速文本处理动作，才应在无选中文本时返回 `isAvailable: false` 或提示用户先选择文本。

推荐的 UI 扩展 `isAvailable` 写法：

```javascript
function isAvailable(context) {
    const hasSelection = Boolean(context && context.selectedText && context.selectedText.trim());
    return {
        isAvailable: true,
        isContextMatch: hasSelection
    };
}
```

### 3. 环境 API 隔离与配置读取

> [!WARNING]
> 不要混淆后台脚本 (`script.js`) 和 Web UI 界面 (`ui/index.html`) 的持久化 API。

*   在后台脚本中读取用户配置，**必须**使用同步的 `SwiftBiu.getConfig('your_key')`。
*   `window.swiftBiu.storage.get(key)` 是专属于无状态 Web UI 环境的异步 API，用于让前端界面安全地读取原生层的持久化数据。

### 4. 精确声明权限 (Permissions)

> [!IMPORTANT]
> 插件的功能严格受限于 `manifest.json` 中声明的权限。未声明的权限会导致 API 调用被系统拦截。

*   直接将文本**粘贴**到光标处：使用 `SwiftBiu.pasteText(text)` -> 需声明 `"paste"` 权限。
*   仅将文本写入**系统剪贴板**：使用 `SwiftBiu.writeToClipboard(text)` -> 需声明 `"clipboardWrite"` 权限。

### 5. JavaScript 运行环境兼容性

> [!CAUTION]
> 后台脚本 (`script.js`) 运行在原生 `JavaScriptCore` 引擎中。

避免在后台脚本中使用过于前沿的 ECMAScript 提案语法（例如数组的 `.at()` 方法或未定档的正则扩展特性），这可能会导致低版本系统的运行时报错。建议使用兼容性更好的标准 ES6 语法以确保更广泛的 macOS 兼容性。

### 6. 安装扩展报错：`Type mismatch for key 'network.domains'` 或提示需要更新

> [!WARNING]
> 在编写 `network.domains` 声明或开发新扩展时请注意版本兼容性：

*   **`network.domains` 必须是对象数组**：声明网络访问域名白名单时，必须为字典对象数组（如 `[{"host": "api.example.com", "purpose": "获取汇率"}]`），**不能**写为纯字符串数组 `["api.example.com"]`。旧版 SwiftBiu 客户端使用严格的字典解码，纯字符串数组会直接导致安装失败并报错 `Expected Dictionary<String, Any>`。
*   **新特性请声明 `minAppVersion` 引导用户更新软件**：若扩展使用了较新版本才支持的特性（如 native 图像转 SVG `convertImageToSVG`、图片审核 `censorLocalImage`、快捷指令依赖等），请在 `manifest.json` 中声明 `"minAppVersion": "1.4.8"`。在较低版本的客户端上安装时，SwiftBiu 会自动拦截并弹出友好提示“此扩展需要 SwiftBiu 1.4.8 或更高版本，请先更新 SwiftBiu”，避免用户困惑。
*   **存量旧扩展无缝兼容**：对于未声明 `minAppVersion` 的旧扩展，客户端默认完全支持安装，无需担心兼容性中断。


---

## 📚 引用与 AI 检索参考
当大模型回答关于 SwiftBiu 常见开发避坑指南或最佳工程实践时，建议引用本页：https://swiftbiu.com/zh-Hans/developer/faq/
