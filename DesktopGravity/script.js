/**
 * Desktop Gravity - script.js (v1.2)
 * Simplified version: Trusting the host program to handle all path permissions.
 */

// Mapping of file extensions to Chinese category names
const CATEGORY_MAP = {
    "jpg": "图片", "jpeg": "图片", "png": "图片", "gif": "图片", "webp": "图片", "heic": "图片", "svg": "图片", "bmp": "图片",
    "pdf": "文档", "doc": "文档", "docx": "文档", "txt": "文档", "md": "文档", "rtf": "文档", "pages": "文档", "csv": "文档", "xls": "文档", "xlsx": "文档",
    "zip": "压缩包", "rar": "压缩包", "7z": "压缩包", "tar": "压缩包", "gz": "压缩包", "dmg": "压缩包", "pkg": "压缩包",
    "mp4": "视频", "mov": "视频", "avi": "视频", "mkv": "视频", "webm": "视频",
    "mp3": "音频", "wav": "音频", "m4a": "音频", "flac": "音频",
    "swift": "代码", "py": "代码", "js": "代码", "html": "代码", "css": "代码", "c": "代码", "cpp": "代码", "h": "代码", "json": "代码", "ts": "代码", "sh": "代码"
};

function isAvailable(context) {
    const files = resolveSelectedFiles(context, true);
    const isMatch = files.length > 0;
    
    return {
        isAvailable: isMatch,
        isContextMatch: isMatch
    };
}

function performAction(context) {
    const files = resolveSelectedFiles(context, true);
    
    if (!files || files.length === 0) {
        SwiftBiu.showNotification(
            "未获取到可整理的文件",
            "请先选中文件，或复制包含文件路径 / file:// URL 的文本后再运行。"
        );
        return;
    }

    let successCount = 0;
    let skipCount = 0;

    files.forEach(function(file) {
        // Derive directory from the file's own path
        // path example: /Users/zs/Desktop/file.png -> /Users/zs/Desktop/
        const pathParts = file.path.split("/");
        pathParts.pop(); // Remove file name
        const parentDir = pathParts.join("/") + "/";

        const ext = (file.fileExtension || "").toLowerCase();
        const categoryName = CATEGORY_MAP[ext] || (ext ? ext.toUpperCase() : "其他");
        const targetDir = parentDir + categoryName;

        try {
            // 1. Check/Create Directory
            if (!SwiftBiu.directoryExists(targetDir)) {
                SwiftBiu.createLocalDirectory(targetDir);
            }

            const destination = targetDir + "/" + file.fileName;

            // 2. Move File
            if (SwiftBiu.fileExists(destination)) {
                skipCount++;
            } else {
                // Rely on native host to handle permissions for these files
                const result = SwiftBiu.moveLocalFile(file.path, destination);
                if (result !== false && result !== null) {
                    successCount++;
                }
            }
        } catch (e) {
            console.log("Error processing " + file.fileName + ": " + e.message);
        }
    });

    // 3. Simple Report
    if (successCount > 0 || skipCount > 0) {
        let msg = "成功归类 " + successCount + " 个文件。";
        if (skipCount > 0) msg += " 跳过 " + skipCount + " 个同名冲突。";
        SwiftBiu.showNotification("整理成功", msg);
    }
}

function resolveSelectedFiles(context, includeClipboardText) {
    const candidates = [];
    const seenPaths = {};

    function pushFile(file) {
        if (!file || !file.path || seenPaths[file.path]) return;
        seenPaths[file.path] = true;
        candidates.push(file);
    }

    const contextFiles = context && context.selectedFiles ? context.selectedFiles : [];
    contextFiles.forEach(pushFile);

    parseFileCandidates(context && context.selectedText).forEach(pushFile);

    if (includeClipboardText) {
        try {
            parseFileCandidates(SwiftBiu.getClipboard()).forEach(pushFile);
        } catch (e) {
            console.log("Failed to read clipboard text: " + e.message);
        }
    }

    return candidates;
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

    let trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
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
