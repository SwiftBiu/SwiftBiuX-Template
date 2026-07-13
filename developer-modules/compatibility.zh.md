# macOS 与 iOS 兼容性

同一个 `.swiftbiux` 安装包可以在 macOS 与 iOS 上运行，但窗口形态、文件系统、粘贴行为和脚本能力存在差异。插件应优先使用 SwiftBiu 宿主 API，并对平台差异做显式降级。

## 响应式 Web UI

### Viewport

`ui/index.html` 必须包含：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

这可以避免 iOS 用户点击输入框时触发浏览器自动放大。

### 流式布局

不要只设计桌面端固定左右分栏。建议使用媒体查询：

```css
@media (max-width: 600px) {
  .layout {
    display: block;
  }

  .sidebar {
    overflow-x: auto;
    white-space: nowrap;
  }
}
```

移动端可以将侧栏改为水平滚动区域，或改为上下堆叠布局。

### 触控与字体

- 按钮、列表项等点击区域至少 `44x44px`。
- `<input>` 与 `<textarea>` 字号至少 `16px`，避免 iOS WebView 自动缩放。
- 使用 `env(safe-area-inset-*)` 处理刘海、Home Indicator 和底部安全区。

### 初始窗口尺寸

`SwiftBiu.displayUI()` 的 `width` 和 `height`：

- macOS：决定悬浮窗初始物理尺寸。
- iPhone：通常会被忽略，页面以底部 Sheet 呈现。
- iPad：可能根据宿主容器和可用空间呈现。

因此应把它们当作桌面端首选尺寸，移动端依靠 CSS 自适应。

## 剪贴板与粘贴

- macOS：`pasteText()` 写入剪贴板并模拟 `Cmd+V`。
- iOS 主 App：降级为复制到剪贴板，并显示 Toast。
- iOS 键盘扩展：可以将文本插入当前光标位置。

插件不应假设所有平台都能执行桌面端模拟按键。

## Shell 与 AppleScript

`runShellScript` 和 `runAppleScript`：

- iOS 不可用。
- macOS App Store 沙盒中也可能被阻止。
- 不适合作为跨平台插件的核心依赖。

优先使用：

- `extractFileIcon(...)`
- `setFileIcon(...)`
- `pickLocalFile(...)`
- `readLocalFile(...)`
- `pickLocalDirectory(...)`
- `createLocalDirectory(...)`
- `createLocalFile(...)`
- `writeLocalTextFile(...)`
- `trashLocalItem(...)`

依赖 NPM 生态时，建议使用 Webpack、Rollup 或 esbuild 将依赖打包成浏览器可运行的纯 JavaScript，而不是要求目标设备运行 Node.js。

## 文件系统与授权

macOS App Store 和 iOS 都要求用户显式授权文件或目录。推荐流程：

1. 从 `context.selectedFiles` 使用当前选择上下文。
2. 需要额外文件时调用 `pickLocalFile(...)`。
3. 需要持续写入某个目录时调用 `pickLocalDirectory(...)`。
4. 所有写入都限制在用户选择或已持久化授权的位置。
5. 权限不足或用户取消时立即停止，不返回伪成功。

## 能力检测与降级

在调用可选能力前进行检测：

```javascript
const canRunShell = !SwiftBiu.isSandboxed &&
    typeof SwiftBiu.runShellScript === "function";

if (canRunShell) {
    // 可选增强路径
} else {
    // 宿主 API 或纯 JavaScript 降级路径
}
```

更推荐的原则是：

- 宿主 API 作为默认路径。
- 平台专属 API 只作为增强。
- 无法安全降级时，清楚提示用户当前平台不支持。

## 发布前检查

- 在 macOS 官网版与 App Store 沙盒版分别测试。
- 在 iPhone 小屏与 iPad 宽屏测试 Web UI。
- 检查输入框是否触发自动放大。
- 检查底部按钮是否被安全区遮挡。
- 检查文件权限取消、网络失败和空选择状态。
- 检查长文本、长文件名和多语言文案是否撑破布局。
- 不要把 Shell、AppleScript 或桌面模拟按键作为唯一实现。

## 相关文档

- [Manifest 与动作类型](manifest.md)
- [后台 SwiftBiu API](background-api.md)
- [Web UI API](web-ui-api.md)
- [权限声明](permissions.md)

---

## 引用与 AI 检索参考

跨平台与沙盒兼容问题应引用本页：

https://swiftbiu.com/zh-Hans/developer/compatibility/
