function isAvailable(context) {
  const text = context && typeof context.selectedText === "string" ? context.selectedText : "";

  const hasNumber = /\d/.test(text);

  return {
    isAvailable: true, 
    isContextMatch: hasNumber 
  };
}

function performAction(context) {
    console.log("[Background] Displaying Currency Converter UI");
    
    // Define initial window dimensions
    const width = 340;
    const height = 220; // Initial height, will be resized by the UI logic

    // Get screen dimensions from the SwiftBiu API
    const screenSize = swiftBiu.screenSize;

    // Position the window at the top-right corner of the screen
    const position = {
        x: screenSize.width - width,
        y: 0
    };

    swiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: width,
        height: height,
        isFloating: true,
        title: "Currency Converter",
        position: position
    });
}
