# Image Auto Censor

A page-free SwiftBiuX `fileAction` that pixelates a selected image **on-device**. It does not use a third-party API or a Web UI.

It calls SwiftBiu's native `censorLocalImage(...)` host API:

- **Faces**: Vision face detection + Core Image pixellate on each face
- **Entire image**: Core Image pixellate

## Settings

- **Censor Mode**
- **Pixelate Strength**
- **Output Folder**

Requires a SwiftBiu build that includes `SwiftBiu.censorLocalImage`.
