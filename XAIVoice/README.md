# xAI Voice

This plugin demonstrates two voice actions in one plugin:

- `Speak with xAI TTS`
  - `ai.useCase`: `tts`
  - default model: `xai-tts`
  - future host bridge: `SwiftBiu.aiTextToSpeech` or `SwiftBiu.aiTTS`

- `Transcribe with xAI STT`
  - `ai.useCase`: `stt`
  - default model: `grok-stt`
  - future host bridge: `SwiftBiu.aiSpeechToText` or `SwiftBiu.aiTranscribe`

Current SwiftBiu host builds expose native chat and image bridges. This template shows how voice model filtering and per-action AI bindings should be declared. Until the voice bridge is added, the scripts paste the prepared request payload.
