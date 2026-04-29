function isAvailable(context) {
    const files = resolveSelectedFiles(context, true);
    let isMatch = false;
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let pathStr = file.path ? file.path.toLowerCase() : "";
        let extStr = file.fileExtension ? file.fileExtension.toLowerCase() : "";
        if (extStr === "app" || pathStr.endsWith(".app") || pathStr.endsWith(".app/")) {
            isMatch = true;
            break;
        }
    }

    return {
        isAvailable: isMatch,
        isContextMatch: isMatch
    };
}

function performAction(context) {
    const files = resolveSelectedFiles(context, true);
    let targetFile = null;

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let pathStr = file.path ? file.path.toLowerCase() : "";
        let extStr = file.fileExtension ? file.fileExtension.toLowerCase() : "";
        if (extStr === "app" || pathStr.endsWith(".app") || pathStr.endsWith(".app/")) {
            targetFile = file;
            break;
        }
    }

    if (!targetFile) {
        SwiftBiu.showNotification("提取失败", "未检测到有效的 .app 应用程序，请选中一个应用程序后再重试。");
        return;
    }

    var appPath = targetFile.path;
    var appName = targetFile.fileName.replace(/\.app$/i, "");

    if (typeof SwiftBiu.extractFileIcon !== "function") {
        SwiftBiu.showNotification("提取失败", "当前 SwiftBiu 版本缺少沙盒版图标提取接口，请先更新 SwiftBiu。");
        return;
    }

    SwiftBiu.showLoadingIndicator();

    try {
        const iconResult = SwiftBiu.extractFileIcon(appPath, { size: 1024 });
        if (!iconResult || iconResult.success !== true || !iconResult.base64) {
            throw new Error((iconResult && iconResult.error) || "无法从该应用生成 PNG 图标。");
        }

        const outputDirectory = resolveOutputDirectory();
        const fileName = iconResult.fileName || sanitizeFileName(appName) + "_Icon.png";
        const savedPath = writeUniqueLocalFile(outputDirectory, fileName, iconResult.base64);

        SwiftBiu.hideLoadingIndicator();
        SwiftBiu.showNotification("图标提取成功", "已保存: " + fileNameFromPath(savedPath));
        // SwiftBiu.openFileInPreview(savedPath);
    } catch (error) {
        SwiftBiu.hideLoadingIndicator();
        SwiftBiu.showNotification("提取失败", error && error.message ? error.message : String(error));
    }
}

function resolveOutputDirectory() {
    let outputDirectory = "";
    try {
        outputDirectory = SwiftBiu.getConfig("outputDirectory") || "";
    } catch (error) {
        outputDirectory = "";
    }

    if (outputDirectory &&
        SwiftBiu.hasAuthorizedDirectoryAccess(outputDirectory) &&
        SwiftBiu.directoryExists(outputDirectory)) {
        return outputDirectory;
    }

    SwiftBiu.showNotification("选择保存目录", "首次使用需要授权保存目录，可选择桌面。");
    outputDirectory = SwiftBiu.pickLocalDirectory();
    if (!outputDirectory) {
        throw new Error("未选择保存目录。");
    }

    SwiftBiu.setConfig("outputDirectory", outputDirectory);
    return outputDirectory;
}

function writeUniqueLocalFile(directoryPath, fileName, base64) {
    const normalizedName = sanitizeFileName(fileName).replace(/\.png$/i, "") || "App_Icon";
    let candidatePath = joinPath(directoryPath, normalizedName + ".png");
    let index = 2;

    while (SwiftBiu.fileExists(candidatePath)) {
        candidatePath = joinPath(directoryPath, normalizedName + "_" + index + ".png");
        index += 1;
    }

    let savedPath = SwiftBiu.createLocalFile(candidatePath, base64);
    if (!savedPath) {
        throw new Error("写入图标失败，请重新选择保存目录后再试。");
    }

    return savedPath;
}

function joinPath(directoryPath, fileName) {
    return String(directoryPath).replace(/\/+$/, "") + "/" + fileName;
}

function sanitizeFileName(value) {
    const sanitized = String(value || "")
        .replace(/[\/:]/g, "_")
        .replace(/^\s+|\s+$/g, "");
    return sanitized || "App";
}

function fileNameFromPath(path) {
    const parts = String(path || "").split("/");
    return parts[parts.length - 1] || path;
}

function resolveSelectedFiles(context, includeClipboardText) {
    const candidates = [];
    const seenPaths = {};

    function pushFile(file) {
        const normalizedFile = normalizeResolvedFile(file);
        if (!normalizedFile || seenPaths[normalizedFile.path]) return;
        seenPaths[normalizedFile.path] = true;
        candidates.push(normalizedFile);
    }

    const contextFiles = context && Array.isArray(context.selectedFiles) ? context.selectedFiles : [];
    contextFiles.forEach(pushFile);
    if (candidates.length > 0) {
        return candidates;
    }

    parseFileCandidates(context && context.selectedText).forEach(pushFile);
    if (candidates.length > 0) {
        return candidates;
    }

    if (includeClipboardText) {
        try {
            parseFileCandidates(SwiftBiu.getClipboard()).forEach(pushFile);
        } catch (e) {
            console.log("Failed to read clipboard text: " + e.message);
        }
    }

    return candidates;
}

function normalizeResolvedFile(file) {
    if (!file || !file.path) return null;

    const descriptor = buildFileDescriptor(file.path);
    if (!descriptor) return null;

    return {
        path: descriptor.path,
        fileURL: file.fileURL || descriptor.fileURL,
        fileName: file.fileName || descriptor.fileName,
        fileExtension: (file.fileExtension || descriptor.fileExtension || "").toLowerCase()
    };
}

function parseFileCandidates(rawText) {
    if (!rawText || typeof rawText !== "string") return [];

    return rawText
        .split(/\r?\n/)
        .map(function(line) {
            return normalizeFileCandidate(line);
        })
        .filter(Boolean);
}

function normalizeFileCandidate(raw) {
    if (!raw) return null;

    const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
    if (!trimmed) return null;

    let path = null;

    if (trimmed.indexOf("file://") === 0) {
        path = decodeFileURL(trimmed);
    } else if (trimmed.charAt(0) === "/") {
        path = trimmed;
    }

    if (!path) return null;

    return buildFileDescriptor(path);
}

function decodeFileURL(fileURL) {
    try {
        return decodeURIComponent(fileURL.replace(/^file:\/\//, ""));
    } catch (e) {
        console.log("Failed to decode file URL: " + fileURL);
        return null;
    }
}

function buildFileDescriptor(path) {
    const normalizedPath = path.replace(/\/+$/, "");
    const pathParts = normalizedPath.split("/");
    const fileName = pathParts[pathParts.length - 1] || "";
    if (!fileName) return null;

    const extIndex = fileName.lastIndexOf(".");
    const fileExtension = extIndex > -1 ? fileName.slice(extIndex + 1) : "";

    return {
        path: normalizedPath,
        fileURL: "file://" + encodeURI(normalizedPath),
        fileName: fileName,
        fileExtension: fileExtension
    };
}
