function isAvailable(context) {
    return !!context.selectedText && context.selectedText.trim().length > 0;
}

function performAction(context) {
    const width = 760;
    const height = 780;

    SwiftBiu.displayUI(
        {
            htmlPath: "ui/index.html",
            width: width,
            height: height,
            isFloating: true,
            title: "Nano Banana"
        },
        function () {}
    );
}
