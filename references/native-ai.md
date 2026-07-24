# SwiftBiu-Managed AI Provider Contract

Use this reference when an extension should use an AI account already configured in SwiftBiu instead of collecting and calling a provider API key itself.

## Choose the Integration Mode First

Prefer the SwiftBiu-managed AI APIs when:

- The provider or compatible custom endpoint can be configured in SwiftBiu.
- The extension needs chat, image generation, video generation, text-to-speech, or speech-to-text.
- The user should select an existing provider/model in the native extension settings.
- Credentials must stay in SwiftBiu's provider store instead of the extension configuration.

Use direct `SwiftBiu.fetch(...)` or `window.swiftBiu.fetch(...)` only when the service is not supported by the native provider bridge, or when the extension owns a distinct service credential and request contract.

Both modes require the `network` permission. Speech-to-text also requires `localFileRead` because the source audio must be selected or explicitly authorized.

## Manifest `ai` Metadata

Declare `ai` at the manifest root when all actions share one AI use case. Declare or override it on an action when actions use different model families.

```json
{
  "ai": {
    "useCase": "chat",
    "providerKey": "chatProvider",
    "modelKey": "chatModel",
    "allowedProviders": ["codex", "custom-endpoint"]
  },
  "actions": [
    {
      "title": "Rewrite",
      "script": "script.js",
      "extensionKind": "textAction",
      "ai": {
        "useCase": "chat",
        "providerKey": "chatProvider",
        "modelKey": "chatModel",
        "allowedProviders": ["codex", "custom-endpoint"]
      }
    }
  ]
}
```

| Field | Type | Required | Contract |
| --- | --- | --- | --- |
| `useCase` | String | Recommended | `chat` / `textGeneration`, `imageGeneration`, `vision`, `videoGeneration`, `tts`, or `stt`. `role` is a compatible alias. |
| `providerKey` | String | Recommended | Configuration key backed by SwiftBiu's native provider picker. |
| `modelKey` | String | Recommended | Configuration key backed by the model picker for this use case. |
| `allowedProviders` | String[] | No | Provider-only allowlist. The native picker is filtered and every proxy request is validated again at runtime. |

An action-level `ai` object replaces the root declaration for that action; it is not merged field by field. Repeat `allowedProviders`, `providerKey`, and `modelKey` in the action object when they still apply.

`allowedProviders` accepts SwiftBiu provider identifiers and aliases. Provider-specific extensions should list only compatible provider families:

```json
{ "allowedProviders": ["xai-oauth", "xai"] }
```

Include `custom-endpoint` only when the extension's actual request shape and expected response are compatible with user-defined endpoints. The allowlist does not rewrite API protocols or make an incompatible endpoint compatible.

## Background `SwiftBiu` APIs

Background `script.js` runs in JavaScriptCore. Use callbacks; do not use Promises or `async/await`.

| API | Result |
| --- | --- |
| `SwiftBiu.aiProviderProfiles()` | Array of provider profiles available to the host. |
| `SwiftBiu.aiImageModels()` | Array of native image model descriptions. |
| `SwiftBiu.aiChat(options, onSuccess, onError)` | One-shot text/vision response. |
| `SwiftBiu.aiChatStream(options, onEvent, onError)` | Starts a streaming chat request and returns `streamID`. Cancel with `SwiftBiu.cancelFetchStream(streamID)`. |
| `SwiftBiu.aiImageGenerate(options, onSuccess, onError)` | Generates an image. |
| `SwiftBiu.aiVideoGenerate(options, onSuccess, onError)` | Generates a video. |
| `SwiftBiu.aiTextToSpeech(options, onSuccess, onError)` | Generates audio. `aiTTS(...)` is an alias. |
| `SwiftBiu.aiSpeechToText(options, onSuccess, onError)` | Transcribes an authorized audio file. `aiTranscribe(...)` and `aiSTT(...)` are aliases. |

Pass `provider` and `model` from the corresponding manifest configuration keys. Chat accepts `messages` or the plugin's supported prompt fields. Media operations accept their operation-specific prompt/input fields; start from a current template plugin rather than inventing a provider request body.

```javascript
function performAction(context) {
    var provider = SwiftBiu.getConfig("chatProvider");
    var model = SwiftBiu.getConfig("chatModel");

    SwiftBiu.aiChat(
        {
            provider: provider,
            model: model,
            messages: [{ role: "user", content: context.selectedText || "" }]
        },
        function (result) {
            SwiftBiu.pasteText(result.text || result.outputText || "");
        },
        function (error) {
            SwiftBiu.showNotification("AI Request Failed", error.message || error.error);
        }
    );
}
```

## Web UI `window.swiftBiu.ai` APIs

Web UI methods return Promises:

```javascript
const providers = await window.swiftBiu.ai.providers();
const imageModels = await window.swiftBiu.ai.imageModels();
const result = await window.swiftBiu.ai.chat(options);
```

Available methods:

- `window.swiftBiu.ai.providers()`
- `window.swiftBiu.ai.imageModels()`
- `window.swiftBiu.ai.chat(options)`
- `window.swiftBiu.ai.imageGenerate(options)`
- `window.swiftBiu.ai.videoGenerate(options)`
- `window.swiftBiu.ai.textToSpeech(options)` / `window.swiftBiu.ai.tts(options)`
- `window.swiftBiu.ai.speechToText(options)` / `window.swiftBiu.ai.stt(options)` / `window.swiftBiu.ai.transcribe(options)`

The Web UI bridge does not currently expose streaming chat. Start streaming in the background action and update either a native response surface or the Web UI through `postMessageToUI(...)`.

## Native Result Surfaces

Provider execution and result presentation are separate contracts:

- Text preview/apply: `showAIResponseBubble`, `updateAIResponseBubble`, `failAIResponseBubble`, `closeAIResponseBubble` (`ui` permission).
- Image: `showImage` or the `showInteractiveImage` / `updateInteractiveImage` / `failInteractiveImage` session APIs (`notifications`).
- Video: `showVideo` or the `showInteractiveVideo` / `updateInteractiveVideo` / `failInteractiveVideo` session APIs (`notifications`).
- Audio: `showAudio` or the `showInteractiveAudio` / `updateInteractiveAudio` / `failInteractiveAudio` session APIs (`notifications`).

Use an interactive session when generation is asynchronous, can be retried, or needs an in-place pending/error/result transition.

## Error Contract

Native AI failures provide normalized fields such as:

- `message` / `error`
- `code`
- `kind` / `errorKind`
- `retriable`
- `requiresSignIn`
- `provider` / `providerIdentifier`
- `providerDisplayName`
- `httpStatusCode`

Handle `requiresSignIn` and `auth_reconnect_required` by asking the user to reconnect the account in SwiftBiu. Do not ask for or log the account token. Show retry only when the error is retriable.

## Release Checklist

- Manifest and every overriding action declare the correct `ai` use case.
- `providerKey` and `modelKey` match real configuration keys.
- Provider-specific extensions declare `allowedProviders`.
- `custom-endpoint` is allowed only when the extension is protocol-compatible with it.
- `network` is declared; STT also declares `localFileRead`.
- Background code uses callbacks; Web UI code awaits Promises.
- Authentication, quota, unsupported model, payload size, provider outage, and retry states are handled.
- The result surface permissions match the UI used.
