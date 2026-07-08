# xAI Video

This plugin demonstrates how a text action binds to SwiftBiu video model selection.

- `ai.useCase`: `videoGeneration`
- default provider: `xai-oauth`
- default model: `grok-imagine-video`
- future host bridge: `SwiftBiu.aiVideoGenerate`

Current SwiftBiu host builds expose native chat and image bridges. This template still matters because it shows the correct plugin manifest shape for video model filtering. When the host adds `SwiftBiu.aiVideoGenerate`, the script automatically uses it; until then it pastes the prepared request payload.
