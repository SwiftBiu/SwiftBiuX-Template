// Local Background Remover launcher.

function isImageFile(file) {
    var extension = file && file.fileExtension ? "." + file.fileExtension : "";
    var value = String((file && [file.path, file.fileURL, file.fileName, file.name, extension].join(" ")) || file || "").toLowerCase();
    return /\.(png|jpe?g|webp|heic|heif|bmp|gif|tiff?)$/.test(value);
}

function isAvailable(context) {
    var selectedFiles = context && context.selectedFiles ? context.selectedFiles : [];
    var hasImage = selectedFiles.some(isImageFile);
    return {
        isAvailable: true,
        isContextMatch: hasImage
    };
}

function performAction(context) {
    SwiftBiu.displayUI({
        htmlPath: "ui/index.html",
        width: 980,
        height: 680,
        title: "Local Background Remover",
        isFloating: true
    }, function (message) {
        console.log("BackgroundRemover UI Message:", message);
    });
}
