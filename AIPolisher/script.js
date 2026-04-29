// AIPolisher Plugin Script

function isAvailable(context) {
    const hasSelectedText = Boolean(context && context.selectedText && context.selectedText.trim().length > 0);
    return {
        isAvailable: true,
        isContextMatch: hasSelectedText
    };
}

function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 800,
        height: 600,
        title: "AI Writing Assistant",
        isFloating: true
    }, function (message) {
        console.log("AIPolisher UI Message:", message);
    });
}
