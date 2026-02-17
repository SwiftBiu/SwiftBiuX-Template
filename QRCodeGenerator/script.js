// QRCodeGenerator Plugin Script

// Check if the plugin is available (always true for this logic-less extension)
function isAvailable() {
    return true;
}

// Main entry point
function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 700,
        height: 540,
        title: "QR Code Generator",
        isFloating: true
    }, function (message) {
        // Handle messages from UI if needed
        console.log("UI Message:", message);
    });
}
