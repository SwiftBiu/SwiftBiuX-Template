# Local Background Remover

SwiftBiuX rich UI plugin for browser-local image background removal.

## First version

- Uses `@imgly/background-removal@1.7.0` in the plugin WebView.
- Keeps the selected image in the local WebView process.
- Auto-loads an image from the SwiftBiu trigger context. If macOS sandbox access is missing, the UI asks the user to reselect the image and persists that authorization.
- Downloads the JS/WASM/ONNX engine assets on first use, so the plugin declares `network`.
- Exports a transparent PNG and an optional grayscale mask through `window.swiftBiu.saveLocalFile`.

## Offline assets

The manifest includes an optional `assetPath` setting. Leave it blank for the IMG.LY default asset host. To make a fully offline package later, bundle the matching IMG.LY data assets into the plugin and set `assetPath` to that local folder, for example:

```text
../assets/imgly/
```

The UI already passes `assetPath` into IMG.LY's `publicPath` config.

## Notes

The IMG.LY package is AGPL by default. Check licensing before shipping this plugin in a commercial distribution.
