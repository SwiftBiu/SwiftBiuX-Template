# Network and Third-Party API Checklist

Use this reference when a plugin needs AI, translation, image generation, live web lookup, or a third-party service.

## When Network Is Required

Use a network/API plugin for:

- AI rewriting, AI summarization, semantic classification, or generated recommendations.
- Translation through a service such as DeepL, Google, OpenAI, Gemini, or a company API.
- Image generation, background removal, remote OCR, or remote file conversion.
- Live data lookup, search, account systems, Notion, GitHub, Slack, Feishu, or internal services.

Do not use network just to count, format, rename, copy, move, clean, or generate rule-based reports.

## Required API Documentation

Before provider-specific implementation, require enough documentation to know:

- Base URL and endpoint path
- HTTP method
- Authentication scheme
- Required headers
- Request body schema
- Response body schema
- Error shape
- Rate limits or retry rules if relevant
- File upload/download format if relevant

If this information is missing, generate a scaffold with clear placeholders or ask for the missing docs instead of inventing details.

## Secret Handling

Never hard-code API keys.

Add `configuration` entries like:

```json
{
  "key": "api_key",
  "label": "API Key",
  "type": "secure",
  "placeholder": "Enter your API key",
  "description": "Stored securely in Keychain.",
  "group": "Authentication"
}
```

In background `script.js`, read with:

```javascript
var apiKey = SwiftBiu.getConfig("api_key");
```

In Web UI, read with:

```javascript
var config = await window.swiftBiu.storage.get("api_key");
var apiKey = config.result || "";
```

## Background Fetch Pattern

In `script.js`, do not use `async/await`. Use callback-based fetch:

```javascript
SwiftBiu.fetch(
    apiUrl,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(payload)
    },
    function(response) {
        var data = JSON.parse(response.data || "{}");
        // handle success
    },
    function(error) {
        SwiftBiu.showNotification("Request Failed", error.error || "Unknown error");
    }
);
```

## Streaming Pattern

Use `SwiftBiu.fetchStream(url, options, onEvent, onError)` only when the provider supports SSE or chunked responses.

Requirements:

- Keep a `streamID` so regenerate/cancel actions can call `SwiftBiu.cancelFetchStream(streamID)`.
- Parse provider events defensively.
- Keep a cumulative full text buffer and pass the complete current text to UI updates.
- On completion or error, clear the active stream ID.

## UI Fetch Pattern

In `ui/index.html`, `async/await` is allowed:

```javascript
const response = await window.swiftBiu.fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify(payload)
});
```

## UX Requirements

Network/API plugins should provide:

- Missing API key message with instructions to open plugin settings.
- Loading state or progress.
- Error display that includes provider error text when safe.
- Retry or regenerate controls for AI/image workflows.
- Copy, paste, save, or apply controls for the final result.

## Native AI Response Bubble

For AI rewrite, summarize, polish, translate, or similar text generation flows, prefer SwiftBiu's native AI response bubble when the user needs preview/regenerate/apply.

Required permissions:

- `network` for the provider request.
- `ui` for `showAIResponseBubble(...)` and updates.
- `paste` if applying generated text back to the active app.
- `clipboardWrite` if copying result without paste.

Useful APIs:

- `SwiftBiu.showAIResponseBubble(options, onEvent)`
- `SwiftBiu.updateAIResponseBubble(sessionID, options)`
- `SwiftBiu.failAIResponseBubble(sessionID, message)`
- `SwiftBiu.closeAIResponseBubble(sessionID)`

Useful events:

- `configChanged`: persist mode or prompt values with `SwiftBiu.setConfig(...)`.
- `regenerate`: cancel the current stream/request if needed, then start a new request.
- `submit`: apply the generated text by replace, append, paste, or copy.

Defaults:

- Omit `systemPrompt` if the native layer should resolve `responseSystemPrompt` from configuration.
- Omit custom button labels unless the plugin truly needs custom wording.
