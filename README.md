# SwiftBiu 插件开发指南 (v1.0)

欢迎来到 SwiftBiu 插件开发的世界！通过我们的混合插件系统，您可以利用最适合您任务的工具——无论是简单的原生脚本还是功能丰富的 JavaScript——来为 SwiftBiu 添加强大的自定义动作。

## 插件核心概念

所有 SwiftBiu 插件都由一个核心文件 `manifest.json` 和一个或多个脚本文件组成，并最终打包成一个 `.swiftbiux` 文件。

### `manifest.json` 详解

`manifest.json` 是插件的“身份证”，它描述了插件的元数据和它所包含的**一个或多个动作**。

| 键 (Key)        | 类型   | 是否必须 | 描述                                                                                   |
| --------------- | ------ | -------- | -------------------------------------------------------------------------------------- |
| `identifier`    | String | 是       | 插件的唯一标识符，建议使用反向域名格式。                                               |
| `name`          | String | 是       | 显示在菜单和设置中的插件名称。                                                         |
| `version`       | String | 是       | 插件的版本号，如 `1.0`。                                                               |
| `actions`       | Array  | 是       | 定义插件提供的一个或多个动作的数组。                                                   |
| `author`        | String | 否       | 插件作者的名字。                                                                       |
| `description`   | String | 否       | 插件功能的简短描述。                                                                   |
| `icon`          | String | 否       | 插件的默认图标名称。可以是 SF Symbol (如 `swift`) 或插件包内的文件名 (如 `icon.png`)。 |
| `iconType`      | String | 否       | 定义 `icon` 字段的类型。可选值为 `"sfSymbol"` 或 `"file"`。                            |
| `permissions`   | Array  | 否       | 声明插件需要的系统权限 (详见“沙盒与权限”章节)。                                        |
| `configuration` | Array  | 否       | 定义插件需要用户配置的参数数组，用于自动生成设置界面。                                 |

---

### 插件配置 (`configuration`) 详解

如果您的插件需要用户输入一些信息（例如 API 密钥、自定义URL等），您可以在 `manifest.json` 中定义一个 `configuration` 数组。SwiftBiu 会根据这个定义，自动为您的插件生成一个配置界面。

`configuration` 数组中的每一个对象都代表一个输入项，其结构如下：

| 键 (Key)      | 类型    | 是否必须 | 描述                                                                |
| ------------- | ------- | -------- | ------------------------------------------------------------------- |
| `key`         | String  | 是       | 用于在后台存储和读取该配置项的唯一键。                              |
| `label`       | String  | 是       | 在设置界面中显示给用户的输入框标题。                                |
| `placeholder` | String  | 否       | 输入框中显示的灰色提示文字。                                        |
| `description` | String  | 否       | 在输入框下方显示的、对该选项的详细说明文字。                        |
| `isSecure`    | Boolean | 否       | 如果为 `true`，该输入框将作为密码框，内容会被隐藏。默认为 `false`。 |

---

### 完整 `manifest.json` 示例

这是一个配置了 API 密钥输入框，并使用 SF Symbol 作为图标的翻译插件示例。

```json
{
  "identifier": "com.example.api-translator",
  "name": "API Translator",
  "version": "1.2",
  "author": "Your Name",
  "description": "Translates text using a custom API.",
  "icon": "globe.asia.australia.fill",
  "iconType": "sfSymbol",
  "actions": [
    {
      "title": "Translate",
      "script": "script.js"
    }
  ],
  "permissions": [
    "network",
    "notifications",
    "ui"
  ],
  "configuration": [
    {
      "key": "apiKey",
      "label": "API Key",
      "placeholder": "Enter your API key here",
      "description": "Your personal API key for the translation service.",
      "isSecure": true
    }
  ]
}
```

---

## 插件安装与目录结构

### 安装插件

支持以下几种方式安装 `.swiftbiux` 插件包：

1.  **通过菜单安装**: 在 SwiftBiu 的菜单栏图标中，选择“安装插件...”，然后在弹出的文件选择窗口中选中您的 `.swiftbiux` 文件。
2.  **双击文件安装**: 设置swiftbiux的默认打开程序为SwiftBiu后,在 Finder 中直接双击 `.swiftbiux` 文件即可触发安装流程。


### 插件目录

插件的存储位置取决于您使用的 SwiftBiu 版本：

*   **Website 版本 (非沙盒)**:
    插件将被安装在：
    `~/Library/Application Support/SwiftBiu/Plugins/`

*   **App Store 版本 (沙盒)**:
    由于沙盒机制，插件的实际物理路径会被系统重定向到：
    `~/Library/Containers/cn.bewords.swiftbiu/Data/Library/Application Support/SwiftBiu/Plugins/`

---

## 沙盒与权限：重要须知

SwiftBiu 提供两个版本：从官网下载的**非沙盒版 (Website)** 和从 Mac App Store 下载的**沙盒版 (App Store)**。沙盒是 macOS 的一项核心安全机制，它会严格限制应用访问系统资源的能力。**插件的功能会受到应用当前是否在沙盒中运行的巨大影响。**

### 核心差异

| 功能            | Website 版本 (非沙盒) | App Store 版本 (沙盒) | 对插件开发者的影响                                                                                             |
| --------------- | --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| **文件系统**    | **无限制**            | **严格受限**          | 插件无法直接读写沙盒外的任意文件。                                                                             |
| **网络访问**    | **无限制**            | **需要声明**          | 插件 `manifest.json` 中必须包含 `"network"` 权限，才能发起出站网络连接。                                       |
| **AppleScript** | **强大**              | **受限**              | 只能与那些已经适配了沙盒并定义了 AppleScript 接口的应用进行交互。与 Finder、System Events 的交互能力大打折扣。 |
| **Shell 脚本**  | **无限制**            | **严格受限**          | 无法执行需要访问沙盒外文件或系统敏感目录的命令。                                                               |

### 开发最佳实践

为了让您的插件能同时在两个版本的应用中良好运行，请遵循以下原则：

1.  **最小权限原则**: 在 `manifest.json` 的 `permissions` 数组中，只申请插件确实需要的权限。
2.  **优先使用 `SwiftBiu` API**: 尽可能使用 `SwiftBiu` 对象提供的 API（如 `SwiftBiu.fetch`, `SwiftBiu.readFromFile`），而不是直接调用 Shell 或 AppleScript，因为前者已经对沙盒环境做了适配和优化。
3.  **优雅降级**: 在执行敏感操作前，可以检查 `SwiftBiu.isSandboxed` 这个布尔值属性。如果为 `true`，您可以选择禁用某些功能，或为用户提供替代方案。

---

## 模式一：原生脚本插件 (推荐用于简单任务) 

如果您的插件只需要调用一个 AppleScript 或 Shell 脚本，这种模式最简单快捷。

### `actions` 对象详解 (原生脚本)

| 键 (Key)          | 类型   | 描述                                           |
| ----------------- | ------ | ---------------------------------------------- |
| `title`           | String | 显示在菜单项上的动作名称。                     |
| `appleScriptFile` | String | **(二选一)** 要执行的 AppleScript 文件的名称。 |
| `shellScriptFile` | String | **(二选一)** 要执行的 Shell 脚本文件的名称。   |
| `icon`            | String | (可选) 此特定动作的图标。                      |

**注意**: 在沙盒环境下，这些脚本的能力会受到严重限制。

---

## 模式二：JavaScript 插件 (推荐用于复杂任务)

当您需要与网络 API 交互、处理复杂逻辑或显示自定义 UI 时，JavaScript 插件提供了无与伦比的灵活性和跨环境兼容性。

### `script.js` 入口点

```javascript
// script.js

// 动作函数
async function translate(context) {
    // 通过 API 读取用户在设置中填写的 apiKey
    const apiKey = await SwiftBiu.getConfig("apiKey");
    if (!apiKey) {
        SwiftBiu.showNotification("错误", "请先在插件设置中填写 API Key。");
        return;
    }

    // 显示加载动画
    SwiftBiu.showLoadingIndicator();

    const query = context.selectedText;
    try {
        // 使用已对沙盒优化的 fetch API
        const response = await SwiftBiu.fetch(`https://api.example.com/translate?q=${encodeURIComponent(query)}&key=${apiKey}`);
        SwiftBiu.showNotification("翻译结果", response.translatedText);
    } catch (error) {
        SwiftBiu.showNotification("翻译失败", error.message);
    } finally {
        // 隐藏加载动画
        SwiftBiu.hideLoadingIndicator();
    }
}

// 导出你的动作
export { translate };
```

### `SwiftBiu` 全局 API 对象

我们向 JavaScript 运行环境中注入了一个名为 `SwiftBiu` 的全局对象，它提供了与主应用和 macOS 系统交互所需的所有能力。**强烈建议优先使用这些 API，以确保插件的沙盒兼容性。**

*   `SwiftBiu.isSandboxed`: (只读, 布尔值) 判断当前应用是否在沙盒中运行。
*   `SwiftBiu.getConfig(key)`: (异步) 读取用户为该插件配置的某个值。
*   `SwiftBiu.fetch(url, options)`: (异步) 发起网络请求，已处理沙盒下的网络权限。
*   `SwiftBiu.openURL(url)`: 在浏览器中打开链接。
*   `SwiftBiu.writeToClipboard(text)`: 写入剪贴板。
*   `SwiftBiu.getClipboard()`: 读取剪贴板内容。
*   `SwiftBiu.pasteText(text)`: 将指定文本粘贴到当前最前端的应用中。
*   `SwiftBiu.showNotification(title, body)`: 显示系统通知。
*   `SwiftBiu.showLoadingIndicator()`: 显示一个全局的加载动画。
*   `SwiftBiu.hideLoadingIndicator()`: 隐藏加载动画。
*   `SwiftBiu.runAppleScript(script, context)`: (异步) 执行 AppleScript 脚本。
*   `SwiftBiu.runShellScript(script, context)`: (异步) 执行 Shell 脚本。

### 权限 (`permissions`)

在 `manifest.json` 中声明插件需要的权限，以便在沙盒版中正常工作：

*   `"network"`: 允许发起网络请求 (`SwiftBiu.fetch`)。
*   `"clipboardWrite"`: 允许写入剪贴板 (`SwiftBiu.writeToClipboard`)。
*   `"clipboardRead"`: 允许读取剪贴板 (`SwiftBiu.getClipboard`)。
*   `"paste"`: 允许粘贴内容到其他应用 (`SwiftBiu.pasteText`)。
*   `"notifications"`: 允许显示系统通知 (`SwiftBiu.showNotification`)。
*   `"ui"`: 允许显示自定义界面元素，如加载动画 (`SwiftBiu.showLoadingIndicator`)。
*   `"runAppleScript"`: 允许执行 AppleScript (`SwiftBiu.runAppleScript`)。
*   `"runShellScript"`: 允许执行 Shell 脚本 (`SwiftBiu.runShellScript`)。

---

## 如何分发插件 (`.swiftbiux`)

### 打包您的插件

为了简化分发，所有插件都必须打包成一个 `.swiftbiux` 文件。

1.  **技术规范**: `.swiftbiux` 文件是一个标准的 **ZIP 压缩包**。
2.  **内部结构**: 压缩包的**根目录**必须直接包含 `manifest.json` 和所有脚本文件。**禁止**将所有文件放在一个顶层文件夹内再压缩。

**正确的结构:**
```
.swiftbiux (ZIP Archive)
├── manifest.json
└── script.js
```

**错误的结构:**
```
.swiftbiux (ZIP Archive)
└── MyPlugin/      <-- 错误的顶层文件夹
    ├── manifest.json
    └── script.js
```

### 创建步骤
1.  将你的插件文件（`manifest.json`, `script.js` 等）放在一个文件夹中。
2.  **进入该文件夹**，全选所有文件。
3.  右键点击并选择“压缩”。
4.  将生成的 `.zip` 文件重命名为 `YourPluginName.swiftbiux`。

祝您编码愉快！

---

## 插件示例

为了帮助您更好地理解插件的开发过程，我们提供了几个功能各异的示例插件。您可以直接在 `SwiftBiuX-Template` 项目中找到它们的完整源代码。

### 示例一：CNY - 人民币大写转换

这是一个简单但非常实用的工具，它演示了：
- 如何读取用户选择的文本 (`context.selectedText`)。
- 如何进行数据处理（数字转大写）。
- 如何将结果写入剪贴板 (`SwiftBiu.writeToClipboard`)。
- 如何显示操作反馈 (`SwiftBiu.showNotification`)。

#### `cny/manifest.json`

```json
{
  "identifier": "com.SwiftBiu.rmbconverter",
  "name": "CNY",
  "author": "SwiftBiu",
  "description": "将选中的数字金额转换为大写人民币并复制到剪贴板。",
  "version": "1.0",
  "actions": [
    {
      "title": "CNY",
      "script": "script.js",
      "icon": "dollarsign.circle"
    }
  ],
  "iconType": "sfSymbol",
  "permissions": [
    "clipboardWrite",
    "notifications"
  ]
}
```

#### `cny/script.js`

```javascript
/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 */
function performAction(context) {
    const selectedText = context.selectedText;

    if (!selectedText || isNaN(parseFloat(selectedText))) {
        SwiftBiu.showNotification("操作失败", "请选择有效的数字。");
        return;
    }

    const rmb = convertToRMB(selectedText);
    if (rmb) {
        SwiftBiu.writeToClipboard(rmb);
        SwiftBiu.showNotification("转换成功", `${selectedText} 已转换为大写人民币并复制到剪贴板。`);
    } else {
        SwiftBiu.showNotification("操作失败", "无法转换该数字。");
    }
}

/**
 * 将数字金额转换为大写人民币。
 * @param {string} money - 数字字符串.
 * @returns {string} - 大写人民币字符串.
 */
function convertToRMB(money) {
    var numberValue = new String(Math.round(money * 100)); // 数字金额
    var chineseValue = ""; // 转换后的汉字金额
    var String1 = "零壹贰叁肆伍陆柒捌玖"; // 汉字数字
    var String2 = "万仟佰拾亿仟佰拾万仟佰拾元角分"; // 对应单位
    var len = numberValue.length; // numberValue 的字符串长度
    var Ch1; // 数字的汉语读法
    var Ch2; // 数字位的汉字读法
    var nZero = 0; // 用来计算连续的零值的个数
    var String3; // 指定位置的数值
    if (len > 15) {
        return "超出计算范围";
    }
    if (numberValue == 0) {
        chineseValue = "零元整";
        return chineseValue;
    }
    String2 = String2.substr(String2.length - len, len); // 取出对应位数的STRING2的值
    for (var i = 0; i < len; i++) {
        String3 = parseInt(numberValue.substr(i, 1), 10); // 取出需转换的某一位的值
        if (i != (len - 3) && i != (len - 7) && i != (len - 11) && i != (len - 15)) {
            if (String3 == 0) {
                Ch1 = "";
                Ch2 = "";
                nZero = nZero + 1;
            } else if (String3 != 0 && nZero != 0) {
                Ch1 = "零" + String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            } else {
                Ch1 = String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            }
        } else { // 该位是万亿，亿，万，元位等关键位
            if (String3 != 0 && nZero != 0) {
                Ch1 = "零" + String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            } else if (String3 != 0 && nZero == 0) {
                Ch1 = String1.substr(String3, 1);
                Ch2 = String2.substr(i, 1);
                nZero = 0;
            } else if (String3 == 0 && nZero >= 3) {
                Ch1 = "";
                Ch2 = "";
                nZero = nZero + 1;
            } else {
                Ch1 = "";
                Ch2 = String2.substr(i, 1);
                nZero = nZero + 1;
            }
            if (i == (len - 11) || i == (len - 3)) { // 如果该位是亿位或元位，则必须写上
                Ch2 = String2.substr(i, 1);
            }
        }
        chineseValue = chineseValue + Ch1 + Ch2;
    }
    if (String3 == 0) { // 最后一位（分）为0时，加上“整”
        chineseValue = chineseValue + "整";
    }
    return chineseValue;
}
```

### 示例二：Gemini - AI 聊天助手

这个插件展示了更复杂的场景，是学习高级功能的绝佳范例：
- **用户配置**: 通过 `configuration` 字段让用户输入 API Key 等敏感信息。
- **API 调用**: 使用 `SwiftBiu.fetch` 与 Google Gemini API 进行交互。
- **状态管理**: 在内存中维护一个 `messages` 数组来保存对话历史，实现连续对话。
- **加载指示**: 通过 `SwiftBiu.showLoadingIndicator` 和 `SwiftBiu.hideLoadingIndicator` 提供即时的视觉反馈。
- **自定义图标**: 使用插件包内的 `.svg` 文件作为图标。

#### `Gemini/manifest.json`

```json
{
  "identifier": "com.SwiftBiu.gemini",
  "name": "Gemini",
  "author": "SwiftBiu",
  "description": "Send the selected text to Google Gemini and get the response.",
  "version": "1.0",
  "actions": [
    {
      "title": "Gemini",
      "script": "script.js",
      "icon": "gemini-icon.svg"
    }
  ],
  "icon": "gemini-icon.svg",
  "iconType": "file",
  "permissions": [
    "network",
    "paste",
    "notifications"
  ],
  "configuration": [
    {
      "key": "apikey",
      "label": "Gemini API Key",
      "placeholder": "Enter your Gemini API key",
      "description": "Obtain an API key from Google AI Studio.",
      "isSecure": true
    },
    {
      "key": "resetMinutes",
      "label": "Reset Timer (minutes)",
      "placeholder": "e.g., 15",
      "description": "Reset the conversation if idle for this many minutes. Set blank to disable.",
      "isSecure": false
    }
  ]
}
```

#### `Gemini/script.js` (核心逻辑)

```javascript
// 用于保存对话历史的数组
const messages = [];
// 上次交互的时间戳
let lastChatDate = new Date();

/**
 * 主函数入口
 * @param {object} context - 上下文对象
 */
function performAction(context) {
    // 1. 读取用户配置
    const apiKey = SwiftBiu.getConfig("apikey");
    const resetMinutes = parseInt(SwiftBiu.getConfig("resetMinutes"), 10);

    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please set your Gemini API Key in the plugin settings.");
        return;
    }

    // 2. 处理手动重置命令
    if (context.selectedText.trim().toLowerCase() === "reset chat") {
        messages.length = 0;
        SwiftBiu.showNotification("Gemini Conversation Reset", "The chat history has been cleared.");
        return;
    }

    // 3. 处理自动超时重置
    if (!isNaN(resetMinutes) && resetMinutes > 0) {
        const resetInterval = resetMinutes * 60 * 1000;
        if (new Date().getTime() - lastChatDate.getTime() > resetInterval) {
            messages.length = 0; // 静默重置
        }
    }

    // 4. 将用户输入添加到历史记录
    messages.push({ role: "user", content: context.selectedText });

    // 5. 准备并发送 API 请求
    const requestBody = convertMessagesToGeminiFormat(); // 将消息转换为 Gemini 格式
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    SwiftBiu.showLoadingIndicator();
    SwiftBiu.fetch(
        apiUrl,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        },
        (response) => { // 成功回调
            SwiftBiu.hideLoadingIndicator();
            try {
                const responseData = JSON.parse(response.data);
                const assistantText = responseData.candidates.at(0).content.parts.at(0).text;
                
                // 将助手的回复添加到历史记录
                messages.push({ role: "model", content: assistantText });
                lastChatDate = new Date();

                // 将结果粘贴并通知用户
                const newContent = context.selectedText + "\n\n" + assistantText;
                SwiftBiu.pasteText(newContent);
                SwiftBiu.showNotification("Gemini Response Pasted", "The assistant's reply has been pasted.");
            } catch (e) {
                SwiftBiu.showNotification("API Error", `Failed to parse response: ${e.message}`);
                messages.pop(); // 请求失败时，移除最后一条用户消息以便重试
            }
        },
        (error) => { // 失败回调
            SwiftBiu.hideLoadingIndicator();
            SwiftBiu.showNotification("API Request Failed", `Error: ${error.error}`);
            messages.pop();
        }
    );
}

/**
 * 将消息历史转换为 Gemini API 所需的格式。
 * @returns {object} The contents object for the Gemini API request.
 */
function convertMessagesToGeminiFormat() {
    return {
        contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
    };
}
```

### 示例三：GeminiImage - AI 绘图

这个插件进一步展示了如何与更专业的 API 端点交互，特别是处理非文本数据：
- **调用图像生成 API**: 向 Gemini 的图像生成模型发送请求。
- **处理 Base64 数据**: 解析 API 返回的流式 JSON 数据，提取出 Base64 编码的图像信息。
- **调用原生 UI**: 使用 `SwiftBiu.openImageInPreview(base64Image)` 这个特殊的 API，直接调用 SwiftBiu 的原生功能来显示一个图片预览窗口，提供了比网页更原生的用户体验。

#### `GeminiImage/manifest.json`

```json
{
    "identifier": "com.swiftbiu.gemini-image",
    "name": "AI Drawing New",
    "author": "SwiftBiu",
    "description": "Generates an image based on the selected text using the Gemini API.",
    "version": "1.0",
    "actions": [
        {
            "title": "AI Drawing",
            "script": "script.js",
            "icon": "nano-banana.svg"
        }
    ],
    "permissions": [
        "network",
        "ui",
        "notifications"
    ],
    "icon": "nano-banana.svg",
    "iconType": "file",
    "configuration": [
        {
            "key": "apiKey",
            "label": "Gemini API Key",
            "placeholder": "Enter your Google AI Studio API Key",
            "description": "Required for generating images.",
            "isSecure": true
        }
    ]
}
```

#### `GeminiImage/script.js` (核心逻辑)

```javascript
/**
 * @param {object} context - 上下文对象
 */
function performAction(context) {
    const apiKey = SwiftBiu.getConfig("apiKey");
    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Gemini API Key is not set.");
        return;
    }

    const prompt = context.selectedText;
    if (!prompt) {
        SwiftBiu.showNotification("Input Error", "Please select some text to generate an image.");
        return;
    }

    const modelId = "gemini-1.5-flash-preview-image-generation";
    const apiMethod = "streamGenerateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:${apiMethod}?key=${apiKey}`;

    const requestBody = {
        "contents": [{"role": "user", "parts": [{"text": `A high-quality, detailed image of: ${prompt}`}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}
    };

    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody)
    };

    SwiftBiu.showLoadingIndicator();

    SwiftBiu.fetch(url, options,
        (response) => { // 成功回调
            try {
                const chunks = JSON.parse(response.data);
                let base64Image = null;

                // 从流式响应中找到并提取图片数据
                for (const chunk of chunks) {
                    const part = chunk.candidates?.at(0)?.content?.parts?.at(0);
                    if (part && part.inlineData && part.inlineData.data) {
                        base64Image = part.inlineData.data;
                        break;
                    }
                }

                if (base64Image) {
                    SwiftBiu.hideLoadingIndicator();
                    // 调用原生 API 在预览窗口中打开图片
                    SwiftBiu.openImageInPreview(base64Image);
                } else {
                    SwiftBiu.hideLoadingIndicator();
                    SwiftBiu.showNotification("API Error", "No image data found in response.");
                }
            } catch (e) {
                SwiftBiu.hideLoadingIndicator();
                SwiftBiu.showNotification("API Error", "Could not process image data from the server.");
            }
        },
        (error) => { // 失败回调
            SwiftBiu.hideLoadingIndicator();
            SwiftBiu.showNotification("Network Error", "Failed to connect to the Gemini API.");
        }
    );
}
```