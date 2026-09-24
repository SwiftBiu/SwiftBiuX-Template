/*
 * Image to SVG (VTracer)
 * Bundles official VTracer WASM. No host source changes.
 */

var SUPPORTED_EXTENSIONS = {
    png: true, jpg: true, jpeg: true, gif: true, bmp: true, webp: true
};

function localizedStrings(context) {
    var language = String(context && context.languageCode || "").toLowerCase();
    if (language.indexOf("zh") === 0) {
        return {
            noImageTitle: "没有可转换的图片",
            noImageBody: "请先选中 PNG、JPG、GIF、BMP 或 WebP 图片。",
            folderTitle: "需要保存目录",
            folderBody: "本次转换已取消。请重新运行并选择保存目录。",
            folderUnavailableTitle: "保存目录不可用",
            folderUnavailableBody: "请在扩展设置中重新选择保存目录。",
            wasmFailed: "当前 JavaScriptCore 无法运行 VTracer WASM。",
            emptyResult: "VTracer 没有返回 SVG。",
            preparing: "正在准备转换",
            converting: "正在用 VTracer 矢量化",
            completed: "已转换为 SVG",
            failed: "VTracer 转换失败",
            processing: "处理中",
            reveal: "在 Finder 中显示",
            saveFailed: "SwiftBiu 未能确认文件已保存。",
            plan: function(name, folder) { return "用 VTracer 将 “" + name + "” 转为 SVG，并保存到 “" + folder + "”"; },
            savedAt: function(path) { return "文件已保存到 " + path; },
            sectionTitles: {
                planTitle: "转换计划", logTitle: "处理记录", fileTitle: "任务状态",
                failureTitle: "失败详情", actionTitle: "后续操作"
            }
        };
    }
    return {
        noImageTitle: "No Convertible Image",
        noImageBody: "Select a PNG, JPG, GIF, BMP, or WebP image first.",
        folderTitle: "Output Folder Required",
        folderBody: "The conversion was cancelled. Run the action again and choose a save folder.",
        folderUnavailableTitle: "Output Folder Unavailable",
        folderUnavailableBody: "Choose the output folder again in extension settings.",
        wasmFailed: "This JavaScriptCore runtime cannot run the bundled VTracer WASM.",
        emptyResult: "VTracer did not return an SVG.",
        preparing: "Preparing Conversion",
        converting: "Vectorizing with VTracer",
        completed: "Converted to SVG",
        failed: "VTracer Conversion Failed",
        processing: "Processing",
        reveal: "Show in Finder",
        saveFailed: "SwiftBiu could not confirm that the file was saved.",
        plan: function(name, folder) { return "Convert “" + name + "” with VTracer and save to “" + folder + "”"; },
        savedAt: function(path) { return "Saved to " + path; },
        sectionTitles: {
            planTitle: "Conversion Plan", logTitle: "Activity", fileTitle: "Task Status",
            failureTitle: "Failure Details", actionTitle: "Next Actions"
        }
    };
}

function configValue(key, fallback) {
    var value = SwiftBiu.getConfig(key);
    value = value === undefined || value === null ? "" : String(value).trim();
    return value || fallback;
}

function fileExtension(path) {
    var name = String(path || "").split("/").pop() || "";
    var dot = name.lastIndexOf(".");
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function fileNameFromPath(path) {
    var pieces = String(path || "").split("/");
    return pieces[pieces.length - 1] || path;
}

function isSupportedImagePath(path) {
    return Boolean(SUPPORTED_EXTENSIONS && SUPPORTED_EXTENSIONS[fileExtension(path)]);
}

function firstSelectedImage(context) {
    var files = context && context.selectedFiles;
    var index;
    var item;
    if (Object.prototype.toString.call(files) !== "[object Array]") return null;
    for (index = 0; index < files.length; index += 1) {
        item = files[index];
        if (item && item.path && isSupportedImagePath(item.path)) return item;
    }
    return null;
}

function isAvailable(context) {
    return { isAvailable: true, isContextMatch: Boolean(firstSelectedImage(context)) };
}

function trimTrailingSlash(path) {
    return String(path || "").replace(/\/+$/, "");
}

function displayNameForPath(path) {
    var pieces = trimTrailingSlash(path).split("/");
    return pieces[pieces.length - 1] || path;
}

function resolveOutputDirectory(strings) {
    var directory = trimTrailingSlash(configValue("output_directory", ""));
    var hadConfiguredDirectory = Boolean(directory);
    var hasDirectoryAccess;
    if (directory) {
        hasDirectoryAccess = SwiftBiu.hasAuthorizedDirectoryAccess(directory);
        if (!hasDirectoryAccess) {
            SwiftBiu.requestDirectoryAuthorization(directory);
            hasDirectoryAccess = SwiftBiu.hasAuthorizedDirectoryAccess(directory);
        }
        if (hasDirectoryAccess && SwiftBiu.directoryExists(directory)) return directory;
        directory = "";
    }
    directory = trimTrailingSlash(SwiftBiu.pickLocalDirectory());
    if (!directory) {
        SwiftBiu.showNotification(
            hadConfiguredDirectory ? strings.folderUnavailableTitle : strings.folderTitle,
            hadConfiguredDirectory ? strings.folderUnavailableBody : strings.folderBody
        );
        return "";
    }
    SwiftBiu.setConfig("output_directory", directory);
    return directory;
}

function resolveImageFile(context, strings) {
    var selected = firstSelectedImage(context);
    var picked;
    if (selected) return selected.path;
    picked = SwiftBiu.pickLocalFile({ kind: "image", allowedExtensions: ["png", "jpg", "jpeg", "gif", "bmp", "webp"] });
    if (!picked || !isSupportedImagePath(picked)) {
        SwiftBiu.showNotification(strings.noImageTitle, strings.noImageBody);
        return "";
    }
    return picked;
}

function uniqueDestination(directory, filename) {
    var dot = filename.lastIndexOf(".");
    var base = dot > 0 ? filename.slice(0, dot) : filename;
    var ext = dot > 0 ? filename.slice(dot) : "";
    var index;
    var name;
    var path;
    for (index = 0; index < 100; index += 1) {
        name = index === 0 ? filename : base + "-" + index + ext;
        path = trimTrailingSlash(directory) + "/" + name;
        if (!SwiftBiu.fileExists(path)) return path;
    }
    return trimTrailingSlash(directory) + "/" + base + "-" + Date.now() + ext;
}

function base64ToBytes(b64) {
    if (typeof __vtracerDecodeBase64 === "function") {
        return __vtracerDecodeBase64(b64);
    }
    throw new Error("Base64 decoder is unavailable.");
}

function performAction(context) {
    var strings = localizedStrings(context);
    var imagePath;
    var directory;
    var sourceName;
    var destination;
    var sessionID;
    var bytes;
    var svg;
    var savedPath;

    if (typeof WebAssembly === "undefined" || typeof VTracerWasm === "undefined" || typeof VTracerWasm.vectorize_bytes !== "function") {
        SwiftBiu.showNotification(strings.failed, strings.wasmFailed);
        return;
    }

    imagePath = resolveImageFile(context, strings);
    if (!imagePath) return;
    directory = resolveOutputDirectory(strings);
    if (!directory) return;

    sourceName = fileNameFromPath(imagePath);
    destination = uniqueDestination(directory, sourceName.replace(/\.[^.]+$/, "") + "-vtracer.svg");
    sessionID = SwiftBiu.beginFileTask({
        headlineText: strings.preparing,
        detailText: strings.plan(sourceName, displayNameForPath(directory)),
        totalCount: 1,
        completedCount: 0,
        skippedCount: 0,
        progress: 0.08,
        batchItems: [{
            sourceFileName: sourceName,
            outputFileName: destination,
            status: "processing",
            statusText: strings.processing,
            detailText: strings.plan(sourceName, displayNameForPath(directory))
        }],
        sectionTitles: strings.sectionTitles,
        targetDirectoryPaths: [directory]
    });

    try {
        bytes = base64ToBytes(SwiftBiu.readLocalFile(imagePath));
        svg = VTracerWasm.vectorize_bytes(bytes, {
            preset: configValue("preset", "poster"),
            mode: configValue("mode", "spline"),
            filter_speckle: Number(configValue("filter_speckle", "4"))
        });
        if (!svg || String(svg).indexOf("<svg") === -1) throw new Error(strings.emptyResult);
        savedPath = SwiftBiu.writeLocalTextFile(destination, String(svg));
        if (!savedPath || !SwiftBiu.fileExists(savedPath)) throw new Error(strings.saveFailed);
    } catch (error) {
        SwiftBiu.failFileTask(sessionID, {
            headlineText: strings.failed,
            detailText: error && error.message ? error.message : String(error),
            progress: 1,
            sectionTitles: strings.sectionTitles
        });
        SwiftBiu.showNotification(strings.failed, error && error.message ? error.message : String(error));
        return;
    }

    SwiftBiu.finishFileTask(sessionID, {
        headlineText: strings.completed,
        detailText: strings.savedAt(savedPath),
        completedCount: 1,
        progress: 1,
        actionButtons: [{ kind: "revealTargets", title: strings.reveal, isEnabled: true }],
        targetDirectoryPaths: [directory],
        sectionTitles: strings.sectionTitles
    });
    SwiftBiu.showNotification(strings.completed, savedPath);
}
