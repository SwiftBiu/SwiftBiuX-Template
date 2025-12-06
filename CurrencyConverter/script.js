function isAvailable(context) {
  // Check if there is selected text and if it contains a number
  const text = context.selectedText;
  if (!text || text.trim().length === 0) {
    return { isAvailable: false, isContextMatch: false };
  }
  
  // Simple regex to check for numbers
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