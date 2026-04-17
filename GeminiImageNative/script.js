function isAvailable(context) {
    return !!context.selectedText && context.selectedText.trim().length > 0;
}

function performAction(context) {
    SwiftBiu.openNativeGeminiImageStudio({
        triggerSource: "native-plugin-action"
    });
}
