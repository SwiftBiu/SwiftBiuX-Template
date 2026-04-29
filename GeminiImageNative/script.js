function getTrimmedSelectedText(context) {
    if (!context || typeof context.selectedText !== "string") {
        return "";
    }
    return context.selectedText.trim();
}

function isAvailable(context) {
    const hasPrompt = getTrimmedSelectedText(context).length > 0;
    return {
        isAvailable: true,
        isContextMatch: hasPrompt
    };
}

function performAction(context) {
    const prompt = getTrimmedSelectedText(context);

    SwiftBiu.openNativeGeminiImageStudio({
        prompt: prompt,
        triggerSource: "native-plugin-action"
    });
}
