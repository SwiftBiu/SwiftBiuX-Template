# Image to SVG (VTracer)

Standalone SwiftBiuX plugin. It does **not** change the SwiftBiu app binary.

Bundles official [@visioncortex/vtracer](https://github.com/visioncortex/vtracer) WASM (MIT) inside `script.js`. Select an image and run **Convert with VTracer**. Settings are in the extension configuration. No Web UI and no network.

Requires a JavaScriptCore build that can instantiate WebAssembly (current SwiftBiu macOS runtime).
