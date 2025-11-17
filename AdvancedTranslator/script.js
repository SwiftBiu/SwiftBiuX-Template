// This script is no longer used in the new "Rich Web App" architecture.
// All logic has been moved into the html <script></script> file.

// The isAvailable function is still needed for the action to appear.
function isAvailable(context) {
    // This can be as simple or complex as needed.
    // For the translator, we can make it available if there's any selected text.
    return context.selectedText && context.selectedText.length > 0;
}

// The performAction function is now only responsible for telling SwiftBiu to display the UI.
// The UI itself will handle the translation logic.
function performAction(context) {
    // The `displayUI` function is part of the SwiftBiu API injected into this background script.
    // It returns a windowID, but we don't need to use it here.
    console.log("[Background] 显示高级翻译器 UI");
    // Define window dimensions
    const width = 400;
    const height = 300;

    // Get screen dimensions from the SwiftBiu API.
    // This is the correct way to get screen size in the background script.
    const screenSize = swiftBiu.screenSize;

    // Position the window at the top-right corner of the screen.
    const position = {
        x: screenSize.width - width,
        y: 0
    };

    swiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: width,
        height: height,
        isFloating: true,
        title: "Advanced Translator",
        position: position
    });
}