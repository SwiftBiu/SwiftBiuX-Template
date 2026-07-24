# Native File Tasks and AI Response UI

Use SwiftBiu's native session interfaces when a background action needs continuous progress, structured errors, or streaming AI output. Do not replace these workflows with repeated notifications or another custom floating window.

## Native File Task Progress Panel

Use this for organizers, exporters, renamers, movers, compressors, and other actions that modify local files.

Background `script.js` can call:

- `SwiftBiu.beginFileTask(options)`: creates a native file-processing session and returns `sessionID`.
- `SwiftBiu.updateFileTask(sessionID, options)`: updates progress, logs, and structured state.
- `SwiftBiu.finishFileTask(sessionID, options)`: marks the task as completed.
- `SwiftBiu.failFileTask(sessionID, options)`: marks the task as failed.

### Common `options`

- Core progress: `headlineText`, `detailText`, `totalCount`, `completedCount`, `skippedCount`, `progress`, `batchItems`
- Rich logs: `activityEntries` with `{ message, category, isPinned }`
- Plan preview: `summaryChips` with `{ title, count, tone }`
- Grouped failures: `failureGroups` with `{ identifier, title, count, items, detailText }`
- Section labels: `sectionTitles` with `planTitle`, `logTitle`, `fileTitle`, `failureTitle`, `actionTitle`
- Completion actions: `actionButtons`, currently supporting `revealTargets` and `undoMoves`
- Action payloads: `targetDirectoryPaths` and `undoOperations`

### Recommended Workflow

1. Show the category plan before the first write.
2. Ask for native folder authorization as soon as access is missing; stop when the user cancels.
3. Stream milestones such as folder creation, move start, conflict skip, and category completion.
4. Group name conflicts and permission failures separately.
5. Show “open target folder” or “undo this run” only when the required paths and rollback data exist.

```javascript
function performAction(context) {
    const sessionID = SwiftBiu.beginFileTask({
        headlineText: "Organize Files",
        totalCount: context.selectedFiles.length,
        completedCount: 0
    });

    try {
        context.selectedFiles.forEach((file, index) => {
            // ... process file ...
            SwiftBiu.updateFileTask(sessionID, {
                completedCount: index + 1,
                detailText: file.fileName,
                progress: (index + 1) / context.selectedFiles.length
            });
        });

        SwiftBiu.finishFileTask(sessionID, {
            headlineText: "Completed"
        });
    } catch (error) {
        SwiftBiu.failFileTask(sessionID, {
            headlineText: "Failed",
            detailText: String(error)
        });
    }
}
```

## Native AI Response Bubble

Use this for OpenAI, Gemini, Doubao, and similar plugins that generate text and let the user preview, regenerate, replace, or append it. These APIs run in background `script.js` and require the `ui` permission.

- `SwiftBiu.showAIResponseBubble(options, onEvent)`: displays the bubble and returns `sessionID`.
- `SwiftBiu.updateAIResponseBubble(sessionID, options)`: updates state, status copy, generated text, and button availability.
- `SwiftBiu.failAIResponseBubble(sessionID, message)`: moves the bubble into a failed state.
- `SwiftBiu.closeAIResponseBubble(sessionID)`: closes the session.

### Common Events

- `configChanged`: the user changed `mode`, `systemPrompt`, `userPrompt`, or editor visibility.
- `submit`: the user confirmed the result. The event contains `text`, `mode`, `systemPrompt`, and `userPrompt`.
- `regenerate`: the user requested a new generation.
- `previewPoster` / `sharePoster`: poster preview and sharing.

### Recommended Workflow

1. Call `showAIResponseBubble(...)` with only the fields the plugin needs, usually `title`, `mode`, and `onEvent`.
2. Use `SwiftBiu.fetch(...)` for one-shot requests and update the bubble once.
3. Use `SwiftBiu.fetchStream(...)` for real streaming, parse SSE or chunks, and write the cumulative full text through `updateAIResponseBubble(...)`.
4. Persist changes from `configChanged` with `SwiftBiu.setConfig(...)`.
5. Cancel the previous stream with `cancelFetchStream(...)` before regenerating.
6. On `submit`, let the background script choose replace or append and apply the text with `pasteText(...)`.

### Defaults

- Omit `systemPrompt` when the native layer should resolve it from configuration. Current fallback: `responseSystemPrompt` → manifest default.
- Omit `promptVisible` and `userPromptVisible` when both editors should start hidden.
- Omit `submitLabel`, `replaceLabel`, and `appendLabel` to use native localization.
- Pass `state` or `status` only for custom transitions or wording.

```javascript
function performAction(context) {
    let streamID = null;
    let output = "";

    const sessionID = SwiftBiu.showAIResponseBubble({
        title: "AI Assistant",
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
                // Parse event and append to output.
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

## Interactive Image, Video, and Audio Sessions

Use native media sessions when generation has a pending state, can be regenerated, or should update the same card in place. These APIs run in background `script.js` and require `notifications`.

| Media | Create | Update | Fail |
| --- | --- | --- | --- |
| Image | `showInteractiveImage(options, onRegenerate)` | `updateInteractiveImage(sessionID, options)` | `failInteractiveImage(sessionID, message)` |
| Video | `showInteractiveVideo(options, onRegenerate)` | `updateInteractiveVideo(sessionID, options)` | `failInteractiveVideo(sessionID, message)` |
| Audio | `showInteractiveAudio(options, onRegenerate)` | `updateInteractiveAudio(sessionID, options)` | `failInteractiveAudio(sessionID, message)` |

The create method returns `sessionID`. Start with a pending placeholder, keep the ID, then update that same session with the generated Base64, local path, or authorized remote URL. The non-interactive `showImage(...)`, `showVideo(...)`, and `showAudio(...)` methods are appropriate only when the final media is already available.

Provider execution is separate from presentation. Use `aiImageGenerate`, `aiVideoGenerate`, or the TTS APIs for SwiftBiu-managed generation, then pass the result to the corresponding media session. See the [managed AI contract](../references/native-ai.md).

## Choosing a Native Interface

| Scenario | Recommended interface |
| --- | --- |
| Batch modification of local files | File task panel |
| Streaming text that requires confirmation | AI response bubble |
| One short success message | System notification |
| Image preview or regeneration | Interactive image session |
| Video generation with pending/retry state | Interactive video session |
| TTS or generated audio with pending/retry state | Interactive audio session |
| Complex form or complete application UI | Web App UI |

## Related Documentation

- [Background SwiftBiu API](background-api.md)
- [Configuration](configuration.md)
- [Permissions](permissions.md)
- [Web UI API](web-ui-api.md)
