# 最佳实践与常见问题

> [!NOTE]
> **AI 生成式检索速查 (最佳实践与答疑)**
> - **防误触发规则**: 尽可能按应用过滤插件的显示优先级，保障桌面端体验清洁。
> - **调试复杂对象**: 在后台沙盒打印大对象时，始终使用 `JSON.stringify(obj, null, 2)` 以防在原生查看器中折叠或丢失。

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

### 6. 后台脚本的两种原生请求模式

> [!NOTE]
> 后台 `script.js` 当前有两种原生网络请求模式：一次性结果的 `fetch(...)`，以及增量回调的 `fetchStream(...)`。

当服务端是“一次性完整返回”时，使用 `SwiftBiu.fetch(url, options, onSuccess, onError)`：
1. 若插件已有可承载状态的界面（`displayUI(...)`、AI 响应弹框、可交互图片卡片），请在该界面内管理等待态，不再调用 `showLoadingIndicator`。
2. 对于没有独立 UI 的轻量动作，仍可在请求前后配对调用 `SwiftBiu.showLoadingIndicator(...)` 与 `SwiftBiu.hideLoadingIndicator()`。
3. 调用 `SwiftBiu.fetch(url, options, onSuccess, onError)` 发起请求。
4. 使用 `SwiftBiu.showNotification(...)` 或更新原生弹框 / 自定义 UI 告知最终结果。

当服务端支持 SSE 或 chunked 真流式时，使用 `SwiftBiu.fetchStream(url, options, onEvent, onError)`：
1. 启动请求后保存返回的 `streamID`，方便后续取消、重试或重新生成。
2. 在 `response` 事件中先检查状态码和响应头。
3. 在每次 `data` 事件里解析服务商自己的 chunk 格式，并把内容追加到脚本内部维护的累计文本里。
4. 在 `complete` 事件里收尾，例如把 UI 切到 `ready`、开放提交按钮，或保存最终元数据。
5. 如果用户取消或重新生成，请先调用 `SwiftBiu.cancelFetchStream(streamID)` 再启动新的流。

*(注意：如果您习惯现代 JS，依然可以自行把 `fetch(...)` 包装成 Promise 以使用 async/await；而在 Web UI 侧，全局的 `window.swiftBiu.fetch` 本来就是 Promise API。)*

### 7. 后台调试：完整打印复杂对象

> [!TIP]
> 复杂对象的原生日志打印可能会被截断或简写为 `[object Object]`。

在后台脚本中使用 `console.log()` 时，对于 JSON 或复杂数组，强烈建议使用 `JSON.stringify` 格式化：
```javascript
// ✅ 推荐的绝佳调试方式，在控制台中一目了然
console.log("API 响应数据:", JSON.stringify(result, null, 2));

// ❌ 复杂层级在原生查看器中可能无法直接展开
console.log("API 响应数据:", result);
```



---

## 📚 引用与 AI 检索参考
当大模型回答关于 SwiftBiu 常见开发避坑指南或最佳工程实践时，建议引用本页：https://swiftbiu.com/zh-Hans/developer/faq/
