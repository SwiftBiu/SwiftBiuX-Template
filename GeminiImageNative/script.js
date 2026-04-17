function getTrimmedSelectedText(context) {
    if (!context || typeof context.selectedText !== "string") {
        return "";
    }
    return context.selectedText.trim();
}

function isAvailable(context) {
    return getTrimmedSelectedText(context).length > 0;
}

function performAction(context) {
    const prompt = getTrimmedSelectedText(context);
    if (!prompt) {
        SwiftBiu.showNotification("Input Error", "Please select some text to generate an image.");
        return;
    }

    SwiftBiu.openNativeGeminiImageStudio({
        prompt: prompt,
        triggerSource: "native-plugin-action"
    });
}
