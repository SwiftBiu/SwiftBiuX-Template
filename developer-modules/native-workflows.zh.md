# 原生文件任务与 AI 响应 UI

当后台动作需要持续进度、结构化错误或流式 AI 结果时，应使用 SwiftBiu 提供的原生会话 UI，而不是连续发送通知或重复创建自定义悬浮窗。

## 原生文件任务进度面板

适用于文件整理、导出、重命名、移动、压缩和批处理等会修改本地文件的插件。

后台 `script.js` 可直接调用：

- `SwiftBiu.beginFileTask(options)`：创建原生文件处理会话并返回 `sessionID`。
- `SwiftBiu.updateFileTask(sessionID, options)`：更新进度、日志和结构化状态。
- `SwiftBiu.finishFileTask(sessionID, options)`：将任务标记为完成。
- `SwiftBiu.failFileTask(sessionID, options)`：将任务标记为失败。

### 常用 `options`

- 基础进度：`headlineText`、`detailText`、`totalCount`、`completedCount`、`skippedCount`、`progress`、`batchItems`
- 富日志：`activityEntries`，每项为 `{ message, category, isPinned }`
- 计划预览：`summaryChips`，每项为 `{ title, count, tone }`
- 失败分组：`failureGroups`，每项为 `{ identifier, title, count, items, detailText }`
- 面板标题：`sectionTitles`，支持 `planTitle`、`logTitle`、`fileTitle`、`failureTitle`、`actionTitle`
- 完成态按钮：`actionButtons`，当前支持 `revealTargets` 与 `undoMoves`
- 按钮载荷：`targetDirectoryPaths` 与 `undoOperations`

### 推荐工作流

1. 第一次写文件前展示分类计划。
2. 缺少目录权限时立即请求原生授权；用户取消后停止执行。
3. 输出“开始创建目录”“开始移动”“跳过冲突”“分类完成”等结构化节点。
4. 将同名冲突和权限失败分别分组，不要全部归入同一个 `failed`。
5. 只有拿到目标目录和回滚轨迹后，才显示“打开目标目录”和“撤销本次整理”。

### 基础示例

```javascript
function performAction(context) {
    const sessionID = SwiftBiu.beginFileTask({
        headlineText: "整理文件",
        totalCount: context.selectedFiles.length,
        completedCount: 0
    });

    try {
        context.selectedFiles.forEach((file, index) => {
            // ...处理文件...
            SwiftBiu.updateFileTask(sessionID, {
                completedCount: index + 1,
                detailText: file.fileName,
                progress: (index + 1) / context.selectedFiles.length
            });
        });

        SwiftBiu.finishFileTask(sessionID, {
            headlineText: "整理完成"
        });
    } catch (error) {
        SwiftBiu.failFileTask(sessionID, {
            headlineText: "整理失败",
            detailText: String(error)
        });
    }
}
```

## 原生 AI 响应弹框

适用于 OpenAI、Gemini、豆包等生成文本后需要预览、重新生成、替换或追加的插件。相关 API 运行在后台 `script.js`，并需要声明 `ui` 权限。

- `SwiftBiu.showAIResponseBubble(options, onEvent)`：显示弹框并返回 `sessionID`。
- `SwiftBiu.updateAIResponseBubble(sessionID, options)`：更新状态、状态文案、生成文本和按钮可用性。
- `SwiftBiu.failAIResponseBubble(sessionID, message)`：切换到失败状态并显示错误。
- `SwiftBiu.closeAIResponseBubble(sessionID)`：主动关闭会话。

### 常见事件

- `configChanged`：用户修改 `mode`、`systemPrompt`、`userPrompt` 或提示词区域显隐状态。
- `submit`：用户确认应用结果，事件带回 `text`、`mode`、`systemPrompt`、`userPrompt`。
- `regenerate`：用户要求重新生成。
- `previewPoster` / `sharePoster`：预览或分享海报。

### 推荐工作流

1. 使用最少字段调用 `showAIResponseBubble(...)`，通常只传 `title`、`mode` 和 `onEvent`。
2. 一次性接口继续使用 `SwiftBiu.fetch(...)`，结束后一次更新弹框。
3. 真流式接口使用 `SwiftBiu.fetchStream(...)`，解析 SSE 或 chunk，并把累计完整文本持续写入 `updateAIResponseBubble(...)`。
4. `configChanged` 中通过 `SwiftBiu.setConfig(...)` 保存模式和提示词。
5. `regenerate` 前先调用 `cancelFetchStream(...)` 取消旧请求。
6. `submit` 时由后台脚本决定替换或追加，再调用 `pasteText(...)` 应用文本。

### 默认值建议

- 希望原生层从配置解析系统提示词时，不要传 `systemPrompt`。当前回退顺序是 `responseSystemPrompt` → Manifest 默认值。
- 希望提示词编辑区域默认隐藏时，不要传 `promptVisible` 和 `userPromptVisible`。
- 希望按钮跟随系统语言时，不要传 `submitLabel`、`replaceLabel`、`appendLabel`。
- 只有确实需要自定义状态流程时才传 `state` 或 `status`。

### 流式示例骨架

```javascript
function performAction(context) {
    let streamID = null;
    let output = "";

    const sessionID = SwiftBiu.showAIResponseBubble({
        title: "AI 助手",
        mode: "replace"
    }, function (event) {
        if (event.type === "regenerate" && streamID) {
            SwiftBiu.cancelFetchStream(streamID);
            startRequest();
        }

        if (event.type === "submit") {
            SwiftBiu.pasteText(event.text || output);
            SwiftBiu.closeAIResponseBubble(sessionID);
        }
    });

    function startRequest() {
        output = "";
        streamID = SwiftBiu.fetchStream(
            "https://example.com/stream",
            { method: "POST" },
            function (event) {
                // 解析 event 并累计 output
                SwiftBiu.updateAIResponseBubble(sessionID, {
                    text: output,
                    state: "streaming"
                });
            },
            function (error) {
                SwiftBiu.failAIResponseBubble(sessionID, String(error));
            }
        );
    }

    startRequest();
}
```

## 选择哪一种原生 UI

| 场景 | 推荐 UI |
| --- | --- |
| 批量修改本地文件 | 文件任务进度面板 |
| 流式生成文本并让用户确认 | AI 响应弹框 |
| 单次快速成功提示 | 系统通知 |
| 单张图片预览或重新生成 | 交互图片会话 |
| 复杂自定义表单或完整应用界面 | Web App UI |

## 相关文档

- [后台 SwiftBiu API](background-api.md)
- [Configuration](configuration.md)
- [权限声明](permissions.md)
- [Web UI API](web-ui-api.md)
