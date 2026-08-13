function isAvailable(context) {
    const text = String((context && context.selectedText) || "").trim();
    const isURL = /^https?:\/\/\S+$/i.test(text);
    return {
        isAvailable: isURL,
        isContextMatch: isURL
    };
}

function performAction(context) {
    const text = String((context && context.selectedText) || "").trim();
    if (!/^https?:\/\/\S+$/i.test(text)) {
        swiftBiu.showNotification("Media Downloader", "Select a complete http(s) URL first.");
        return;
    }

    swiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 460,
        height: 560,
        isFloating: true,
        title: "Media Downloader"
    });
}
