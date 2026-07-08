# AI Image Verifier

This is a verification plugin that tests the full text-to-image pipeline:

1. Read selected text as a prompt.
2. Show a pending native interactive image card.
3. Call `SwiftBiu.aiImageGenerate(...)`.
4. Update the same card with the generated Base64 image.
5. Optionally copy the image to the clipboard.
