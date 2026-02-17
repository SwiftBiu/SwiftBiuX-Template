/**
 * 检查插件在当前上下文是否可用。
 */
function isAvailable(context) {
    return context.selectedText && context.selectedText.trim().length > 0;
}

/**
 * SwiftBiu 插件的主入口函数。
 */
function performAction(context) {
    const width = 450;
    const height = 500;
    const screenSize = swiftBiu.screenSize;

    // Position centered horizontally, top-aligned with some padding
    const position = {
        x: (screenSize.width - width) / 2,
        y: 100
    };

    swiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: width,
        height: height,
        isFloating: true,
        title: "Aggregate Translator",
        position: position
    });
}
