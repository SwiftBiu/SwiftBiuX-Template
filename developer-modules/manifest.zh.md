# 插件配置与清单 (Manifest & Configuration)

### `manifest.json` 详解

这个文件是您插件的“身份证”。以下是其中最重要的几个键：

| 键 (Key)        | 类型   | 是否必须 | 描述                                                                                                        |
| --------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `identifier`    | String | 是       | 插件的唯一 ID，例如 `com.yourname.plugin`。**此 ID 必须全局唯一，因为标识符重复的插件会覆盖已安装的插件。** |
| `name`          | String | 是       | 插件的显示名称。                                                                                            |
| `author`        | String | 是       | 插件的作者。                                                                                                |
| `description`   | String | 是       | 插件的介绍。                                                                                                |
| `version`       | String | 是       | 插件的版本号，例如 `1.0`。                                                                                  |
| `extensionKind` | String | 是       | 扩展类别。使用 `textAction` 或 `fileAction`。                                                                |
| `actions`       | Array  | 是       | 定义插件提供的脚本动作数组；如果插件只提供声明式 `shareTargets`，可以使用空数组。                          |
| `shareTargets`  | Array  | 否       | SwiftBiu 原生执行的声明式分享动作，例如系统分享面板、AirDrop、URL Scheme 或用目标 App 打开所选文件。       |
| `icon`          | String | 否       | **(根级别)** 整个插件的默认图标。支持 SF Symbol、打包图片文件、文本图标、Iconify 图标和 `data:` URI 数据图标。 |
| `iconType`      | String | 否       | **(根级别)** 定义 `icon` 的解析方式。支持 `"sfSymbol"`、`"file"`、`"text"`、`"iconify"` 和 `"data"`。        |
| `configuration` | Array  | 否       | 为您的插件定义一个可由用户配置的设置界面。                                                                  |
| `permissions`   | Array  | 否       | 声明插件运行所需的系统权限。                                                                                |

路由说明：SwiftBiu 会先识别文件型内容，再识别纯文本。本地文件 URL、Finder 复制文件、从富剪贴板/图片/HTML/WebArchive 数据物化出的临时文件，以及远程文件型 URL 都会走 `fileAction`；只有纯文本上下文才走 `textAction`。文件型插件应同时检查 `context.selectedFiles` 与 `context.selectedRemoteFiles`。

### 声明式原生分享目标 (`shareTargets`)

当扩展只需要把选中内容交给 macOS 原生分享能力时，优先使用 `shareTargets`，不需要编写 JavaScript。支持的 `kind` 包括 `systemPicker`、`airDrop`、`urlScheme`、`openWithApp`；支持的内容类型包括 `text`、`url`、`file`、`image`。

```json
{
  "actions": [],
  "permissions": ["share", "localFileRead"],
  "shareTargets": [
    {
      "id": "whatsapp",
      "name": { "en": "Share to WhatsApp", "zh": "分享到 WhatsApp" },
      "kind": "urlScheme",
      "supportedContent": ["text", "url"],
      "urlTemplate": "whatsapp://send?text={{encodedText}}",
      "webFallback": "https://wa.me/?text={{encodedText}}"
    },
    {
      "id": "wechat",
      "name": { "en": "Open in WeChat", "zh": "用微信打开" },
      "kind": "openWithApp",
      "supportedContent": ["file", "image"],
      "bundleIdentifiers": ["com.tencent.xinWeChat", "com.tencent.WeChat"]
    }
  ]
}
```

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
