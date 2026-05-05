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

const LOCALES = {
    "zh": {
        "error_no_app": "未检测到有效的 .app 应用程序，请选中一个应用程序后再重试。",
        "error_no_interface": "当前 SwiftBiu 版本缺少沙盒版图标提取接口，请先更新 SwiftBiu。",
        "error_generate_fail": "无法从该应用生成 PNG 图标。",
        "error_pick_folder": "未选择保存目录。",
        "error_write_fail": "写入图标失败，请重新选择保存目录后再试。",
        "extract_fail": "提取失败",
        "extract_success": "提取成功",
        "extract_success_msg": "已保存: ",
        "pick_folder_prompt": "选择保存目录",
        "pick_folder_msg": "首次使用需要授权保存目录，可选择桌面。",
        "default_app_name": "应用程序"
    },
    "en": {
        "error_no_app": "No valid .app application detected. Please select an application and try again.",
        "error_no_interface": "Current SwiftBiu version lacks the sandboxed icon extraction interface. Please update SwiftBiu.",
        "error_generate_fail": "Could not generate a PNG icon from this application.",
        "error_pick_folder": "No save folder selected.",
        "error_write_fail": "Failed to write the icon. Please choose a different save folder and try again.",
        "extract_fail": "Extraction Failed",
        "extract_success": "Extraction Successful",
        "extract_success_msg": "Saved to: ",
        "pick_folder_prompt": "Select Save Folder",
        "pick_folder_msg": "Initial use requires folder authorization. You can choose the Desktop.",
        "default_app_name": "Application"
    }
};

function t(key, context) {
    const lang = (context && context.languageCode) || "en";
    const strings = LOCALES[lang] || LOCALES["en"];
    return strings[key] || key;
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
        SwiftBiu.showNotification(t("extract_fail", context), t("error_no_app", context));
        return;
    }

    var appPath = targetFile.path;
    var appName = appDisplayName(targetFile, context);

    if (typeof SwiftBiu.extractFileIcon !== "function") {
        SwiftBiu.showNotification(t("extract_fail", context), t("error_no_interface", context));
        return;
    }

    SwiftBiu.showLoadingIndicator();

    try {
        const iconResult = SwiftBiu.extractFileIcon(appPath, { size: 1024 });
        if (!iconResult || iconResult.success !== true || !iconResult.base64) {
            throw new Error((iconResult && iconResult.error) || t("error_generate_fail", context));
        }

        const outputDirectory = resolveOutputDirectory(context);
        const fileName = iconResult.fileName || sanitizeFileName(appName) + "_Icon.png";
        const savedPath = writeUniqueLocalFile(outputDirectory, fileName, iconResult.base64, context);

        SwiftBiu.hideLoadingIndicator();
        SwiftBiu.showNotification(t("extract_success", context), t("extract_success_msg", context) + fileNameFromPath(savedPath));
    } catch (error) {
        SwiftBiu.hideLoadingIndicator();
        SwiftBiu.showNotification(t("extract_fail", context), error && error.message ? error.message : String(error));
    }
}

function resolveOutputDirectory(context) {
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

    SwiftBiu.showNotification(t("pick_folder_prompt", context), t("pick_folder_msg", context));
    outputDirectory = SwiftBiu.pickLocalDirectory();
    if (!outputDirectory) {
        throw new Error(t("error_pick_folder", context));
    }

    SwiftBiu.setConfig("outputDirectory", outputDirectory);
    return outputDirectory;
}

function writeUniqueLocalFile(directoryPath, fileName, base64, context) {
    const normalizedName = sanitizeFileName(fileName).replace(/\.png$/i, "") || "App_Icon";
    let candidatePath = joinPath(directoryPath, normalizedName + ".png");
    let index = 2;

    while (SwiftBiu.fileExists(candidatePath)) {
        candidatePath = joinPath(directoryPath, normalizedName + "_" + index + ".png");
        index += 1;
    }

    let savedPath = SwiftBiu.createLocalFile(candidatePath, base64);
    if (!savedPath) {
        throw new Error(t("error_write_fail", context));
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
        .map(function (line) {
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

function appDisplayName(file, context) {
    return String((file && file.fileName) || t("default_app_name", context)).replace(/\.app$/i, "");
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
    const normalizedPath = String(path || "").replace(/\/+$/, "");
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
