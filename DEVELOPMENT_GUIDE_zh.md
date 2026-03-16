[Switch to English](DEVELOPMENT_GUIDE.md)

# SwiftBiu 插件开发指南

欢迎来到 SwiftBiu 插件开发的世界！本指南将帮助您使用现代 Web 技术创建功能强大的插件。

借助 SwiftBiu 的“富 Web 应用”模型，您可以使用 HTML、CSS 和 JavaScript 构建具有自定义用户界面的插件，为用户提供无缝、接近原生的体验。

## 🤖 AI 辅助开发 (AI-Assisted Development)

想让 AI 帮您一键生成插件代码？没问题！

我们在这个模板仓库中内置了专门面向大模型的 **AI Skill** 文件，路径为 `AI_SKILL.md`。这个文件包含了 SwiftBiuX 插件开发的全部规范（包括跨端 UI 响应式法则、权限机制、API 降级策略等）。

**如何使用？**
只需将该 `AI_SKILL.md` 文件作为上下文提供给您常用的 AI 代码助手（如 **Cursor**, **GitHub Copilot**, 或 **Smart AI**），然后直接通过自然语言描述您的需求。
*Prompt 示例:*
> "阅读规范：`AI_SKILL.md`。帮我创建一个名为 `TextCounter` 的 Web App 插件，实现实时的字符和单词统计功能。"

AI 将自动遵循规范，为您生成零错误、完美兼容 iOS 移动端的全套插件代码！

---

## 快速上手

---

## 🚀 快速开始 (推荐)

开始开发 SwiftBiuX 插件最简单的方法是使用我们官方的 CLI 脚手架工具。它可以瞬间生成一个开箱即用的跨端模板。

```bash
npx create-swiftbiux-plugin <你的插件名>
```

或者，如果你更倾向于克隆整个官方模板仓库：
```bash
git clone https://github.com/SwiftBiu/SwiftBiuX-Template.git
cd SwiftBiuX-Template
```

> **💡 提示**：SwiftBiu 支持两种复杂度的插件（无界面的纯逻辑插件，和带原生界面的 Web App 插件）。为了让您能最快体验完整流程，这里的入门教程将带您编写一个最简单的**纯逻辑动作插件 (Standard Plugin)**。

### 第二步：编写 Hello World
在仓库目录下，新建一个名为 `HelloWorld` 的文件夹。一个极其轻量级的 SwiftBiu 插件至少需要两个文件。

**1. 创建 `manifest.json` (插件配置)**
这是插件的身份证。在 `HelloWorld` 目录中创建此文件并贴入：

```json
{
  "identifier": "com.yourname.helloworld",
  "name": "Hello World",
  "author": "Your Name",
  "version": "1.0",
  "description": "我的第一个 SwiftBiu 插件",
  "icon": "sparkles",
  "iconType": "sfSymbol",
  "actions": [
    {
      "title": "打个招呼",
      "script": "script.js"
    }
  ]
}
```

**2. 创建 `script.js` (核心逻辑)**
依然在 `HelloWorld` 目录中创建 `script.js`。当用户在 SwiftBiu 中点击您的插件时，将执行此代码：

```javascript
function isAvailable(context) {
    // 返回 true 表示此插件动作始终在菜单中可见
    return true; 
}

function performAction(context) {
    // 弹出一个系统通知
    SwiftBiu.showNotification("🎉 Hello!", "欢迎来到 SwiftBiu 插件开发的世界！");
}
```

### 第三步：打包与见证奇迹
代码已经准备完毕！返回包含 `scripts` 文件夹的仓库根目录，在终端运行打包脚本，并将您的插件文件夹名作为参数传入：

```bash
./scripts/build_plugin.sh HelloWorld
```

**🎉 成功！**
命令执行完毕后，您会在目录下发现一个生成的 `HelloWorld.swiftbiux` 分发文件。
直接**双击**该文件，SwiftBiu 将自动唤起并安装您的插件。呼出 SwiftBiu 菜单，点击“打个招呼”按钮，看看右上角弹出的通知吧！

> 掌握了基础流程后，您可以继续阅读下一节，了解更深入的插件架构设计。

## 两种插件动作类型

为了满足不同复杂度的需求，SwiftBiu 支持两种不同的插件架构。为了更直观地理解它们的区别，我们以“汇率转换”这一相同功能为例进行对比：

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
        
        // 使用原生剪贴板 API 反馈结果
        SwiftBiu.copyText(result); 
        // 使用原生通知 API 提示用户
        SwiftBiu.showNotification("转换成功", `已复制: ${result}`);
    }
    ```

---

### 2. Web App 动作 (自定义交互界面)

**示例**: `CurrencyConverter` (高级汇率换算面板)

这是最强大灵活的模式。适用于需要复杂交互、表单输入、动画或完整视觉展现的场景。此模式将您的插件变成一个包含 HTML/CSS/JS 的完整微型 Web 应用程序。

#### `manifest.json` 配置
除了和标准动作一样的入口脚本配置外，您还必须通过根级别的 `ui` 属性声明 Web UI 的入口点：

```json
"actions": [
  {
    "title": "Pro: 汇率计算大屏",
    "script": "script.js" // 用于接收点击事件并拉起 UI
  }
],
"ui": {
  "main": "ui/index.html" // Web App 的入口页面
}
```

#### 引发流程与架构隔离 (核心差异)
在 Web App 模式中，后台脚本 (`script.js`) 不再承担业务计算的任务，而是变成了“启动器”。整个流程分成了清晰的两步，并且**前后台运行在两个物理隔离的沙盒环境中**：

**第一步：后台触发唤起** 
必须在 `script.js` 的 `performAction` 中**显式地唤起 UI 窗口**：
```javascript
function performAction(context) {
    const screenSize = SwiftBiu.screenSize;
    // 拉起承载 index.html 的自定义 Web 窗口
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 320,
        height: 480,
        // ... 其他配置
    });
}
```

**第二步：前台接管与上下文注入**
一旦 `displayUI()` 被调用，用户看到的界面将由 `index.html` 中的前端代码接管。并且，您**不需要手动在这两个隔离的沙盒中传递数据**。
SwiftBiu 会自动将相同的 `context` (如选中的文本) 直接注入到页面的 window 对象中。您只需要在 `ui/index.html` 中定义一个 `swiftBiu_initialize` 钩子即可接收：

```javascript
// 在 ui/index.html 中
window.swiftBiu_initialize = async function (context) {
    // UI 直接拿到了上下文！
    const text = context.selectedText || "";
    console.log("用户选中了:", text);
    
    // 接下来您可以使用 window.swiftBiu.fetch 继续调用 API 
    // 并将结果更新到 DOM 中...
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
| `icon`          | String | 否       | **(根级别)** SF Symbol 的名称 (如 `swift`) 或本地 PNG 文件名。这将作为整个插件的默认图标。                  |
| `iconType`      | String | 否       | **(根级别)** 定义根级别 `icon` 的类型。可选值为 `"sfSymbol"` 或 `"file"`。                                  |
| `configuration` | Array  | 否       | 为您的插件定义一个可由用户配置的设置界面。                                                                  |
| `permissions`   | Array  | 否       | 声明插件运行所需的系统权限。                                                                                |

### 插件图标规范 (`icon`)

为了确保您的插件在 SwiftBiu 的所有界面（包括插件商店、工具栏和设置）中都能清晰、美观地展示，请遵循以下图标设计规范：

#### 图标类型

我们支持两种类型的图标：

1.  **SF Symbol (推荐)**:
    *   **优点**: 这是最推荐的方式。SF Symbols 是 Apple 官方的图标库，能自动适应系统的主题（浅色/深色模式），并保证在所有分辨率下都清晰锐利。
    *   **使用**: 只需在 `icon` 字段中提供 SF Symbol 的官方名称即可。您可以使用 “SF Symbols” 应用来浏览和查找合适的图标。

2.  **PNG 图片**:
    *   **优点**: 允许您使用完全自定义的品牌图标。
    *   **规范**:
        *   **源文件尺寸**: 推荐使用 **64x64 像素** 或 **128x128 像素**。
            *   **为何推荐更大的尺寸？** 这是为了完美适配高分辨率的 **Retina 屏幕**。一个在界面上显示为 **18x18 点**的图标，在 2x 的 Retina 屏幕上就需要 **36x36 像素**来渲染。提供一个比所需像素更大的源文件（如 64x64 或 128x128），可以让系统**缩小**图片来显示，从而获得比**放大**低分辨率图片（如 32x32）更清晰、更锐利的视觉效果。
            *   **如何选择？** **64x64 像素** 是一个很好的平衡点，它在保证高质量的同时，文件体积也相对较小。**128x128 像素** 则提供了最高的图像质量，但文件体积会更大。两者都是可接受的优质选择。
        *   **格式**: 必须是带透明通道的 PNG (`.png`) 文件。
        *   **命名**: 将图标文件命名为 `icon.png` 并放置在您插件的根目录中。然后在 `manifest.json` 中将 `icon` 字段设置为 `"icon.png"`。
    *   **显示尺寸**: 为了保持整个应用视觉风格的一致性，所有插件图标（无论是在主菜单、工具栏还是插件商店中）的最终显示尺寸都统一为 **18x18 点**。系统会自动将您的源文件按比例缩放以适应这个尺寸。

**示例:**

**使用 SF Symbol:**
```json
{
  "icon": "puzzlepiece.extension"
}
```

**使用 PNG 图片:**
```json
{
  "icon": "icon.png"
}
```

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
> | `radioList` | JSON 字符串：`[{"enabled":true,"value":"..."}]` | `JSON.parse(SwiftBiu.getConfig("key"))` |

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

> [!WARNING]
> **显示要求**: 为了让 `radioList` 在设置界面中可见，它**必须**在 `defaultItems` 中定义至少一个项目，或者在偏好设置中已经存储了数据。如果 `defaultItems` 为空 (`[]`) 且没有保存的数据，该设置项将不会显示。

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
    *   `SwiftBiu.openURL(urlString: String)`: 唤起默认浏览器打开链接。
    *   `SwiftBiu.openFileInPreview(filePath: String)`: 唤起 macOS 默认应用(如预览)打开文件。
    *   `SwiftBiu.showNotification(title: String, body: String)`: 发送系统级通知窗。*(所需权限: `notifications`)*
    *   `SwiftBiu.showLoadingIndicator(position: Object)` / `SwiftBiu.hideLoadingIndicator()`: 在指定坐标处显示系统原生 Loading 动画。
*   **进阶操作:**
    *   `SwiftBiu.fetch(url, options, onSuccess, onError)`: (Callback 异步) 发起底层网络请求。*(所需权限: `network`)*
    *   `SwiftBiu.runShellScript(script, context)`: (同步) 执行 Bash/Zsh 脚本并返回输出。*(所需权限: `runShellScript`)*


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
    *   `window.swiftBiu_initialize = async function(context) { ... }` : 您必须在 HTML 网页中定义该全局函数。当网页加载完毕，系统会自动注入来自后台脚本的 `context` 参数（如划词文本），供网页展示。
*   **底层交互 API (需注意异步边界)**:
    *底层桥接代码为所有 API 都包装了 Promise，所以形式上您都可以使用 `await` 调用。但在原生实现层面，它们分为**数据返回型**（真正的等待）和**触发型**（Fire-and-Forget，无需 `await`）。*
    *   **需要 `await` 获取数据的真实异步:**
        *   `window.swiftBiu.fetch(url, options)`: 返回 `{ status: Number, data: String }`。*(所需权限: `network`)*
        *   `window.swiftBiu.storage.get(key)`: 返回 `{ result: String }`。
        *   `window.swiftBiu.runShellScript(script, context)`: 返回 `{ result: String }`。*(App Store 版极严限制)*
    *   **触发型方法 (无需刻意 `await`):**
        **(JS 侧返回 Promise，但原生一旦收到指令就会**立即** resolve，不会阻塞等待对话框等副作用结束。当作同步触发即可)*
        *   `window.swiftBiu.copyText(text)`: 将文字复制到系统剪贴板。
        *   `window.swiftBiu.pasteText(text)`: 将文字复制并立刻打字粘贴到焦点窗口。
        *   `window.swiftBiu.openURL(url)`: 通过系统默认浏览器打开 Web 链接。
        *   `window.swiftBiu.speakText(text)`: 调用 macOS 系统 TTS 功能纯净朗读文本。
        *   `window.swiftBiu.exportFile(base64String, filename)`: 唤起 macOS 原生的“另存为”文件对话框。
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
## 跨平台 (macOS & iOS) 兼容性

随着 SwiftBiu 登录 iOS，您的插件使用同一份 `.swiftbiux` 安装包即可在双端无缝运行。但您必须遵循以下响应式设计与 API 优雅降级规范：

### 1. 响应式 Web UI (Rich Web Apps)
- **锁定视口 (必须)**: 您必须在 `index.html` 中加入 `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`，以防止 iOS 用户点击输入框时触发跨平台浏览器原生放大。
- **流式布局**: 摒弃桌面端固定的左右分栏布局。请使用 CSS 媒体查询 `@media (max-width: 600px)`，在移动端将侧边栏转为顶部/底部的水平滚动区域，或上下堆叠的流式布局。
- **触控热区与字号**: 放大可点击元素（按钮、列表项）至至少 `44x44px` 以符合点击标准。确保 `<input>` 和 `<textarea>` 的字号不小于 `16px`，以避免触发 iOS WebView 的原生放大行为。
- **初始窗口尺寸**: `displayUI()` 中的 `width` 和 `height` 在 macOS 上决定物理悬浮窗大小；但在 iOS (iPhone) 上会被自动忽略，界面将作为底部 Sheet 呈现。请将这些参数视为“桌面端首选尺寸 (Preferred Size)”，在移动端依靠 CSS 自适应容器。

### 2. API 优雅降级
- **剪贴板与模拟粘贴**: 在 macOS 上，`swiftBiu.pasteText()` 会写入剪贴板并模拟 `Cmd+V`。在 iOS 主 App 中，这会优雅降级为“已复制到剪贴板”并弹出 Toast 通知。但如果用户是在 iOS 键盘扩展 (Keyboard Extension) 中触发插件，它将按预期直接将文本插入键盘当前光标处。
- **不支持的 API**: 受 iOS 强沙盒限制，`runShellScript` 和 `runAppleScript` 仅限 macOS 独占。如果您的插件高度依赖 Node.js 等生境，请考虑使用 Webpack/Rollup 将 NPM 依赖打包为纯 Vanilla JS 环境的 `script.js`，或探索结合 Apple Shortcuts (快捷指令) 来实现移动端高级自动化。

## 权限 (`permissions`)

为确保您的插件正常工作（尤其是在沙盒化的 App Store 版 SwiftBiu 中），您必须在 `manifest.json` 中声明它需要的权限。

*   `"network"`: `swiftBiu.fetch` 需要此权限。
*   `"clipboardRead"`: `SwiftBiu.getClipboard()` 需要此权限 — 允许插件读取当前剪贴板内容。
*   `"clipboardWrite"`: `swiftBiu.copyText` 需要此权限。
*   `"paste"`: `swiftBiu.pasteText` 需要此权限 — 允许插件将文本直接粘贴到用户的活跃应用程序中。
*   `"notifications"`: `swiftBiu.showNotification` 需要此权限。
*   `"runAppleScript"`: `SwiftBiu.runAppleScript()` 需要此权限 — 允许插件执行 AppleScript 代码。⚠️ **在 App Store（沙盒）版本中不可用。**
*   `"runShellScript"`: `swiftBiu.runShellScript` 需要此权限。⚠️ **在 App Store（沙盒）版本中不可用。**

## 多语言支持 (Internationalization / i18n)

SwiftBiu 支持开发多语言插件。`manifest.json` 中的关键字段可以提供为简单的字符串，也可以提供为包含多种语言翻译的字典。

### 支持的字段
以下字段支持 `TranslatableString` 格式（即支持多语言字典）：
- 根级别：`name`, `description`
- 动作 (Actions)：`title`
- 配置项 (Configuration)：`label`, `description`
- 配置选项 (Options)：`label`

### 翻译格式
要提供多种语言，请使用一个字典，其中键是 [ISO 639-1 语言代码](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)（例如 `en`, `zh`）。

**示例：**
```json
{
  "name": {
    "en": "AI Polisher",
    "zh": "AI 润色"
  },
  "description": {
    "en": "Advanced text polishing using AI models.",
    "zh": "使用 AI 模型进行高级文本润色。"
  },
  "actions": [
    {
      "title": {
        "en": "Polish Text",
        "zh": "润色文本"
      },
      "script": "script.js"
    }
  ]
}
```

### 回退逻辑 (Fallback Logic)
系统会根据用户的系统语言选择最合适的字符串：
1. 匹配当前的系统语言代码（如 `zh`）。
2. 如果没匹配到，回退到英语 (`en`)。
3. 如果还是没有，回退到字典中定义的第一个翻译。
4. 如果只提供了一个简单的字符串，则在所有语言下都显示该字符串。

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

### 2. 环境 API 隔离与配置读取

> [!WARNING]
> 不要混淆后台脚本 (`script.js`) 和 Web UI 界面 (`ui/index.html`) 的持久化 API。

*   在后台脚本中读取用户配置，**必须**使用同步的 `SwiftBiu.getConfig('your_key')`。
*   `window.swiftBiu.storage.get(key)` 是专属于无状态 Web UI 环境的异步 API，用于让前端界面安全地读取原生层的持久化数据。

### 3. 精确声明权限 (Permissions)

> [!IMPORTANT]
> 插件的功能严格受限于 `manifest.json` 中声明的权限。未声明的权限会导致 API 调用被系统拦截。

*   直接将文本**粘贴**到光标处：使用 `SwiftBiu.pasteText(text)` -> 需声明 `"paste"` 权限。
*   仅将文本写入**系统剪贴板**：使用 `SwiftBiu.writeToClipboard(text)` -> 需声明 `"clipboardWrite"` 权限。

### 4. JavaScript 运行环境兼容性

> [!CAUTION]
> 后台脚本 (`script.js`) 运行在原生 `JavaScriptCore` 引擎中。

避免在后台脚本中使用过于前沿的 ECMAScript 提案语法（例如数组的 `.at()` 方法或未定档的正则扩展特性），这可能会导致低版本系统的运行时报错。建议使用兼容性更好的标准 ES6 语法以确保更广泛的 macOS 兼容性。

### 5. 后台网络请求的原生回调机制

> [!NOTE]
> SwiftBiu 为后台脚本注入的原生 `fetch` 接口基于**回调函数 (Callback)** 模式。

如果您的标准动作需要在 `script.js` 中执行耗时的网络请求，请严格按照以下生命周期编写，以避免请求静默失败或阻塞应用：
1. 请求开始前，调用 `SwiftBiu.showLoadingIndicator(context.screenPosition)` 给予视觉反馈。
2. 调用 `SwiftBiu.fetch(url, options, onSuccess, onError)` 发起请求。
3. 在成功或失败回调内部，立即执行 `SwiftBiu.hideLoadingIndicator()`。
4. 调用 `SwiftBiu.showNotification(...)` 告知结果。

*(注意：如果您习惯现代 JS，您可以在脚本中自行将其封装为 Promise 进行 async/await 调用。而在 Web UI 侧，全局的 `window.swiftBiu.fetch` 已经是纯正的 Promise API。)*

### 6. 后台调试：完整打印复杂对象

> [!TIP]
> 复杂对象的原生日志打印可能会被截断或简写为 `[object Object]`。

在后台脚本中使用 `console.log()` 时，对于 JSON 或复杂数组，强烈建议使用 `JSON.stringify` 格式化：
```javascript
// ✅ 推荐的绝佳调试方式，在控制台中一目了然
console.log("API 响应数据:", JSON.stringify(result, null, 2));

// ❌ 复杂层级在原生查看器中可能无法直接展开
console.log("API 响应数据:", result);
```

## 示例

请查看并克隆官方的 [SwiftBiu 插件开发模板仓库 (SwiftBiuX-Template)](https://github.com/SwiftBiu/SwiftBiuX-Template) 以获取完整的示例插件源代码。阅读这些真实运行的代码是了解底层概念和最佳实践的最快方式。

祝您编码愉快！