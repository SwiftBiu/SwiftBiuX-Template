function isAvailable(context) {
    return true;
}

function performAction(context) {
    var selectedText = context.selectedText || "";

    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 900,
        height: 600,
        title: "Mermaid Previewer",
        isFloating: true
    }, function (message) {
        // Handle messages from UI if needed
        console.log("Message from UI:", message);
    });
}
