/*
 * Image to SVG (ImageTracer)
 * Bundles ImageTracer.js + UPNG + pako. No host source changes. PNG only.
 */

var SUPPORTED_EXTENSIONS = { png: true };

function localizedStrings(context) {
    var language = String(context && context.languageCode || "").toLowerCase();
    if (language.indexOf("zh") === 0) {
        return {
            noImageTitle: "没有可转换的 PNG",
            noImageBody: "ImageTracer 插件目前只支持 PNG。请先选中一张 PNG。",
            folderTitle: "需要保存目录",
            folderBody: "本次转换已取消。请重新运行并选择保存目录。",
            folderUnavailableTitle: "保存目录不可用",
            folderUnavailableBody: "请在扩展设置中重新选择保存目录。",
            decodeFailed: "无法解码这张 PNG。",
            emptyResult: "ImageTracer 没有返回 SVG。",
            preparing: "正在准备转换",
            converting: "正在用 ImageTracer 描摹",
            completed: "已转换为 SVG",
            failed: "ImageTracer 转换失败",
            processing: "处理中",
            reveal: "在 Finder 中显示",
            saveFailed: "SwiftBiu 未能确认文件已保存。",
            plan: function(name, folder) { return "用 ImageTracer 将 “" + name + "” 转为 SVG，并保存到 “" + folder + "”"; },
            savedAt: function(path) { return "文件已保存到 " + path; },
            sectionTitles: {
                planTitle: "转换计划", logTitle: "处理记录", fileTitle: "任务状态",
                failureTitle: "失败详情", actionTitle: "后续操作"
            }
        };
    }
    return {
        noImageTitle: "No Convertible PNG",
        noImageBody: "The ImageTracer plugin currently supports PNG only. Select a PNG first.",
        folderTitle: "Output Folder Required",
        folderBody: "The conversion was cancelled. Run the action again and choose a save folder.",
        folderUnavailableTitle: "Output Folder Unavailable",
        folderUnavailableBody: "Choose the output folder again in extension settings.",
        decodeFailed: "Could not decode this PNG.",
        emptyResult: "ImageTracer did not return an SVG.",
        preparing: "Preparing Conversion",
        converting: "Tracing with ImageTracer",
        completed: "Converted to SVG",
        failed: "ImageTracer Conversion Failed",
        processing: "Processing",
        reveal: "Show in Finder",
        saveFailed: "SwiftBiu could not confirm that the file was saved.",
        plan: function(name, folder) { return "Convert “" + name + "” with ImageTracer and save to “" + folder + "”"; },
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

function firstSelectedImage(context) {
    var files = context && context.selectedFiles;
    var index;
    var item;
    if (Object.prototype.toString.call(files) !== "[object Array]") return null;
    for (index = 0; index < files.length; index += 1) {
        item = files[index];
        if (item && item.path && fileExtension(item.path) === "png") return item;
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
    picked = SwiftBiu.pickLocalFile({ kind: "image", allowedExtensions: ["png"] });
    if (!picked || fileExtension(picked) !== "png") {
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
    var cleaned = String(b64 || "").replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
    var binary;
    var output;
    var index;
    if (typeof atob === "function") {
        binary = atob(cleaned);
        output = new Uint8Array(binary.length);
        for (index = 0; index < binary.length; index += 1) output[index] = binary.charCodeAt(index);
        return output;
    }
    throw new Error("Base64 decoder is unavailable.");
}

function resizeRGBA(src, width, height, maxDimension) {
    var longest = width > height ? width : height;
    var scale;
    var outW;
    var outH;
    var out;
    var y;
    var x;
    var sx;
    var sy;
    if (longest <= maxDimension) {
        return { width: width, height: height, data: src };
    }
    scale = maxDimension / longest;
    outW = Math.max(1, Math.round(width * scale));
    outH = Math.max(1, Math.round(height * scale));
    out = new Uint8Array(outW * outH * 4);
    for (y = 0; y < outH; y += 1) {
        sy = Math.min(height - 1, Math.floor(y / scale));
        for (x = 0; x < outW; x += 1) {
            sx = Math.min(width - 1, Math.floor(x / scale));
            out[(y * outW + x) * 4] = src[(sy * width + sx) * 4];
            out[(y * outW + x) * 4 + 1] = src[(sy * width + sx) * 4 + 1];
            out[(y * outW + x) * 4 + 2] = src[(sy * width + sx) * 4 + 2];
            out[(y * outW + x) * 4 + 3] = src[(sy * width + sx) * 4 + 3];
        }
    }
    return { width: outW, height: outH, data: out };
}

function decodePNGToImageData(bytes, maxDimension) {
    var decoded = UPNG.decode(bytes);
    var frames = UPNG.toRGBA8(decoded);
    var rgba;
    var resized;
    if (!frames || !frames[0]) throw new Error("empty png");
    rgba = new Uint8Array(frames[0]);
    resized = resizeRGBA(rgba, decoded.width, decoded.height, maxDimension);
    return {
        width: resized.width,
        height: resized.height,
        data: typeof Uint8ClampedArray === "function" ? new Uint8ClampedArray(resized.data) : resized.data
    };
}

function performAction(context) {
    var strings = localizedStrings(context);
    var imagePath;
    var directory;
    var sourceName;
    var destination;
    var sessionID;
    var bytes;
    var imgd;
    var options;
    var colorOverride;
    var svg;
    var savedPath;

    imagePath = resolveImageFile(context, strings);
    if (!imagePath) return;
    directory = resolveOutputDirectory(strings);
    if (!directory) return;

    sourceName = fileNameFromPath(imagePath);
    destination = uniqueDestination(directory, sourceName.replace(/\.[^.]+$/, "") + "-imagetracer.svg");
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
        imgd = decodePNGToImageData(bytes, Number(configValue("max_dimension", "384")));
        options = configValue("preset", "default");
        colorOverride = configValue("numberofcolors", "16");
        if (colorOverride && colorOverride !== "auto") {
            options = ImageTracerLib.checkoptions(options);
            options.numberofcolors = Number(colorOverride);
        }
        svg = ImageTracerLib.imagedataToSVG(imgd, options);
        if (!svg || svg.indexOf("<svg") === -1) throw new Error(strings.emptyResult);
        savedPath = SwiftBiu.writeLocalTextFile(destination, svg);
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
