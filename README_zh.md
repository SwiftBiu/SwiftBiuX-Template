[Switch to English](README.md)

# SwiftBiu 插件开发指南 (v1.1.1)

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
| `icon`          | String | 否       | 插件的默认图标名称。可以是 SF Symbol (如 `swift`) 或插件包内的文件名。推荐使用 PNG 格式，建议尺寸为 32x32 像素。 |
| `iconType`      | String | 否       | 定义 `icon` 字段的类型。可选值为 `"sfSymbol"` 或 `"file"`。                            |
| `permissions`   | Array  | 否       | 声明插件需要的系统权限 (详见“沙盒与权限”章节)。                                        |
| `configuration` | Array  | 否       | 定义插件需要用户配置的参数数组，用于自动生成设置界面。                                 |

---

### 插件配置 (`configuration`) 详解

如果您的插件需要用户输入一些信息，您可以在 `manifest.json` 中定义一个 `configuration` 数组。SwiftBiu 会根据这个定义，自动为您的插件生成一个功能丰富的配置界面。

`configuration` 数组中的每一个对象都代表一个输入项。

#### 通用键 (Key)

所有配置项都支持以下通用键：

| 键 (Key) | 类型 | 是否必须 | 描述 |
| --- | --- | --- | --- |
| `key` | String | 是 | 用于在后台存储和读取该配置项的唯一键。 |
| `label` | String | 是 | 在设置界面中显示给用户的输入框标题。 |
| `description` | String | 否 | 在输入框下方显示的、对该选项的详细说明文字。 |
| `type` | String | 否 | **核心字段**。定义了该配置项的 UI 类型。默认为 `"string"`。 |

#### 配置类型 (`type`)

##### 1. `string` (默认)
*   **UI**: 一个标准的单行文本输入框。
*   **额外键**:
    *   `placeholder` (String, 否): 输入框中显示的灰色提示文字。
    *   `default` (String, 否): 默认值。

##### 2. `secure`
*   **UI**: 一个密码输入框，右侧附带一个可切换显示/隐藏内容的“眼睛”按钮。
*   **额外键**:
    *   `placeholder` (String, 否): 输入框中显示的灰色提示文字。

##### 3. `boolean`
*   **UI**: 一个开关。
*   **额外键**:
    *   `default` (Boolean, 否): 默认状态 (`true` 或 `false`)。

##### 4. `option`
*   **UI**: 一个下拉选择菜单。
*   **额外键**:
    *   `options` (Array, **是**): 定义下拉菜单的选项。数组中的每个对象都需要以下键：
        *   `label` (String, 是): 显示在菜单项上的文本。
        *   `value` (String, 是): 选中该项后实际存储的值。
    *   `default` (String, 否): 默认选中项的 `value`。

##### 5. `radioList`
*   **UI**: 一个动态的、可编辑的列表。每一行包含一个单选按钮、一个多行文本输入框和一个删除按钮。用户可以动态添加新行。
*   **功能**: 用于需要用户配置一组规则，并从中激活一个的复杂场景。
*   **额外键**:
    *   `defaultItems` (Array, 否): 定义列表的初始默认项。数组中的每个对象都需要以下键：
        *   `enabled` (Boolean, 是): 该项的单选按钮是否默认选中。
        *   `value` (String, 是): 文本框中的默认内容。

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
2.  **优先使用 `SwiftBiu` API**: 尽可能使用 `SwiftBiu` 对象提供的 API（如 `SwiftBiu.fetch`），而不是直接调用 Shell 或 AppleScript，因为前者已经对沙盒环境做了适配和优化。
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

### `SwiftBiu` 全局 API 对象

我们向 JavaScript 运行环境中注入了一个名为 `SwiftBiu` 的全局对象，它提供了与主应用和 macOS 系统交互所需的所有能力。**强烈建议优先使用这些 API，以确保插件的沙盒兼容性。**

*   `SwiftBiu.isSandboxed`: (只读, 布尔值) 判断当前应用是否在沙盒中运行。
*   `SwiftBiu.getConfig(key)`: **(同步)** 读取用户为该插件配置的某个值。返回一个字符串。
*   `SwiftBiu.fetch(url, options, onSuccess, onError)`: **(异步)** 发起网络请求。
    *   `onSuccess`: 成功回调函数，接收一个包含 `{status: Int, data: String}` 的 `response` 对象。
    *   `onError`: 失败回调函数，接收一个包含 `{error: String}` 的 `error` 对象。
*   `SwiftBiu.openURL(url)`: 在浏览器中打开链接。
*   `SwiftBiu.writeToClipboard(text)`: 写入剪贴板。
*   `SwiftBiu.getClipboard()`: **(同步)** 读取剪贴板内容。返回一个字符串。
*   `SwiftBiu.pasteText(text)`: 将指定文本粘贴到当前最前端的应用中。**重要提示：此操作会覆盖用户当前的剪贴板内容。**
*   `SwiftBiu.showNotification(message, [position])`: 显示系统通知。
    *   `message`: (字符串) 要显示的通知内容。
    *   `position`: (可选, 对象) 一个包含 `{x: Double, y: Double}` 的对象，用于指定通知显示的位置。
*   `SwiftBiu.showImage(base64String, [position], [context])`: **(高级 API)** 显示一个包含图片的浮窗通知。
*   `SwiftBiu.showLoadingIndicator([position])`: 显示一个全局的加载动画。
    *   `position`: (可选, 对象) 一个包含 `{x: Double, y: Double}` 的对象，用于指定加载动画显示的位置。
*   `SwiftBiu.hideLoadingIndicator()`: 隐藏加载动画。
*   `SwiftBiu.runAppleScript(script, [context])`: **(同步)** 执行 AppleScript 脚本。返回脚本的输出或 `nil`。
*   `SwiftBiu.runShellScript(script, [context])`: **(同步)** 执行 Shell 脚本。返回脚本的输出或 `nil`。
*   `SwiftBiu.openFileInPreview(path)`: **(高级 API)** 在默认应用中打开指定路径的文件。
*   `SwiftBiu.openImageInPreview(base64String)`: **(高级 API)** 将 Base64 编码的图片数据解码并在预览应用中打开。

### 插件分类：基础 vs. 高级

为了给免费用户提供试用体验，同时保证Pro用户的价值，SwiftBiu 会根据插件调用的 API 将其自动分类为 **基础 (Basic)** 或 **高级 (Advanced)**。

*   **基础插件**: 主要用于文本处理和简单的系统交互。所有 API 默认为基础功能。
*   **高级插件**: 调用了至少一个被明确标记为“高级”的 API。这些 API 通常涉及更复杂的 UI 操作或文件系统交互。

**当前被定义为高级的 API 包括：**
*   `showImage`
*   `openFileInPreview`
*   `openImageInPreview`

**对开发者的影响:**
*   这个分类是 **自动的**，您无需在 `manifest.json` 中手动声明。
*   免费版用户每天使用高级插件的次数是 **有限的**。当次数用尽后，应用会阻止动作执行并提示用户升级。
*   因此，请仅在确实需要时才调用高级 API。

### 权限 (`permissions`)

在 `manifest.json` 中声明插件需要的权限，以便在沙盒版中正常工作：

*   `"network"`: 允许发起网络请求 (`SwiftBiu.fetch`)。
*   `"clipboardWrite"`: 允许写入剪贴板 (`SwiftBiu.writeToClipboard`)。
*   `"clipboardRead"`: 允许读取剪贴板 (`SwiftBiu.getClipboard`)。
*   `"paste"`: 允许粘贴内容到其他应用 (`SwiftBiu.pasteText`)。
*   `"notifications"`: 允许显示系统通知 (`SwiftBiu.showNotification`, `SwiftBiu.showImage`)。
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