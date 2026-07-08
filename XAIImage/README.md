# xAI Image

This plugin demonstrates how a text action binds to SwiftBiu image model selection.

- `ai.useCase`: `imageGeneration`
- default provider: `xai-oauth`
- default model: `grok-imagine-image`
- host bridge: `SwiftBiu.aiImageGenerate`

Select a prompt, run the action, and SwiftBiu sends the request through the configured AI Provider profile. The generated image is shown in the interactive image panel and can be copied to the clipboard.
