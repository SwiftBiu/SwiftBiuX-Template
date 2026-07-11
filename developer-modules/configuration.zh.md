# 插件 Configuration

`configuration` 用于声明用户可以在 SwiftBiu 设置界面中修改的插件参数，例如 API Key、开关、语言或文件后缀规则。

> [!IMPORTANT]
> 所有配置值最终都以字符串形式返回。后台使用 `SwiftBiu.getConfig(key)`，Web UI 使用 `window.swiftBiu.storage.get(key)`。

## 基础配置

如果插件需要用户提供设置，请在 `configuration` 数组中定义。SwiftBiu 会自动生成原生设置界面。

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

支持的 `type`：

- `string`：普通文本。
- `secure`：密码或 API Key，存储在 Keychain。
- `boolean`：开关。
- `option`：下拉选项。
- `fileExtensionAppRules`：文件后缀到 macOS App 的规则编辑器。

旧版 `radioList` 已不再支持。请迁移为普通 `string`，或为不同固定提示词复制独立扩展。

常见可选字段：

- `group`：把相关配置项归到同一分组。
- `placeholder`：`string` / `secure` 输入框占位提示。
- `description`：显示在标题下方的说明文案。
- `defaultValue`：初始值。

## 设置界面布局

设置界面采用纵向堆叠布局：

1. 标签显示在上方。
2. 说明显示在标签下方。
3. 控件显示在最下方。

这种结构可以完整容纳较长的名称和说明。

## 配置值类型转换

通过 `SwiftBiu.getConfig(key)` 或 `window.swiftBiu.storage.get(key)` 读取时，结果始终是字符串。

| 类型 | 返回值 | 使用方式 |
| --- | --- | --- |
| `string` / `secure` | 存储的字符串 | 直接使用 |
| `boolean` | `"true"` 或 `"false"` | `SwiftBiu.getConfig("key") === "true"` |
| `option` | 所选选项的 `value` | 直接使用 |
| `fileExtensionAppRules` | 包含 `rules` 的 JSON 字符串 | 使用 `JSON.parse(...)` 解析 |

## `option`

`option` 会生成一个下拉选择菜单。

额外字段：

- `options`：必填，每项包含 `label` 和 `value`。
- `defaultValue`：可选，必须对应某个选项的 `value`。

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

## `fileExtensionAppRules`

该类型会生成原生后缀规则编辑器。用户可以添加多个文件后缀，并为每个后缀选择一个 macOS App，无需手动输入 Bundle ID。

存储值是包含 `rules` 数组的 JSON 字符串，每条规则包括：

- `fileExtension`
- `appBundleID`

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

读取示例：

```javascript
const value = SwiftBiu.getConfig("rules") || "{\"rules\":[]}";
const rules = JSON.parse(value).rules || [];
```

## 自定义 Key 与约定 Key

大多数 `key` 都由插件自己定义。SwiftBiu 只负责存储和返回，业务含义由脚本决定。

当前 AI 文本模板常用的脚本约定：

- `pasteBehavior`：决定默认应用方式是 `append` 还是 `replace`。
- `enableAIResponseUI`：决定打开原生 AI 响应弹框，还是直接粘贴结果。

`enableAIResponseUI` 本身不会让原生层自动开启能力。只有脚本显式读取该值并切换到 `showAIResponseBubble(...)` 分支时才会生效。

原生 AI 响应弹框当前识别的约定键：

- `responseSystemPrompt`：调用 `showAIResponseBubble(...)` 时未传 `systemPrompt`，原生层会优先读取该配置。

系统提示词回退顺序：

1. `responseSystemPrompt` 当前值。
2. Manifest 中 `responseSystemPrompt` 的默认值。

建议：

- 仅供自己脚本使用的 Key 可以自由改名，但脚本必须同步修改。
- 重命名 `responseSystemPrompt` 时，需要同步处理依赖它的回退逻辑。
- 多套固定提示词更适合复制扩展分别定制，而不是在一个扩展中增加预设切换器。

## 相关文档

- [Manifest 与动作类型](manifest.md)
- [后台 SwiftBiu API](background-api.md)
- [原生文件任务与 AI 响应 UI](native-workflows.md)
- [Web UI API](web-ui-api.md)
