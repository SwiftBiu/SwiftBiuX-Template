// AIPolisher Plugin Script

function isAvailable(context) {
    return context.selectedText && context.selectedText.trim().length > 0;
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
