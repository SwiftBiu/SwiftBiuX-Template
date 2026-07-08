var currentSessionID = "";
var imageRequestCounter = 0;

function makeDebugRequestID(prefix) {
    imageRequestCounter += 1;
    return prefix + "-" + String(Date.now()) + "-" + String(imageRequestCounter);
}

function previewText(value, maxLength) {
    var text = typeof value === "string" ? value : "";
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength) + "...<truncated chars=" + String(text.length) + ">";
}

function objectKeys(value) {
    if (!value || typeof value !== "object") {
        return [];
    }
    return Object.keys(value).sort();
}

function compactImageRequest(options) {
    return {
        debugRequestID: options.debugRequestID || "",
        provider: options.provider || "",
        model: options.model || "",
        useCase: options.useCase || "",
        aspectRatio: options.aspectRatio || "",
        resolution: options.resolution || "",
        responseFormat: options.responseFormat || "",
        promptChars: options.prompt ? options.prompt.length : 0,
        promptPreview: previewText(options.prompt, 180),
        optionKeys: objectKeys(options)
    };
}

function compactImageResult(result) {
    if (!result || typeof result !== "object") {
        return result;
    }
    return {
        provider: result.providerDisplayName || result.provider || "",
        model: result.model || "",
        backingModel: result.backingModel || "",
        size: result.size || "",
        mimeType: result.mimeType || "",
        bytes: result.bytes || 0,
        base64Chars: result.base64 ? result.base64.length : 0,
        dataURLChars: result.dataURL ? result.dataURL.length : 0,
        resultKeys: objectKeys(result)
    };
}

function compactImageError(error) {
    if (!error || typeof error !== "object") {
        return { message: String(error) };
    }
    return {
        error: error.error || "",
        message: error.message || "",
        keys: objectKeys(error)
    };
}

function logImageRequest(options) {
    console.log("[Codex Image][" + options.debugRequestID + "] aiImageGenerate request: " + JSON.stringify(compactImageRequest(options), null, 2));
}

function logImageSuccess(requestID, result) {
    console.log("[Codex Image][" + requestID + "] aiImageGenerate success response: " + JSON.stringify(compactImageResult(result), null, 2));
}

function logImageFailure(requestID, error) {
    console.log("[Codex Image][" + requestID + "] aiImageGenerate error response: " + JSON.stringify(compactImageError(error), null, 2));
}

function selectedText(context) {
    if (!context) {
        return "";
    }
    if (typeof context.selectedText === "string") {
        return context.selectedText.trim();
    }
    if (typeof context.text === "string") {
        return context.text.trim();
    }
    return "";
}

function configString(key, fallbackValue) {
    var value = "";
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.getConfig === "function") {
        value = SwiftBiu.getConfig(key);
    }
    if (value === null || value === undefined) {
        return fallbackValue;
    }
    value = String(value).trim();
    return value.length > 0 ? value : fallbackValue;
}

function isConfigEnabled(key, fallbackValue) {
    return configString(key, fallbackValue ? "true" : "false").toLowerCase() === "true";
}

function notify(title, message) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showNotification === "function") {
        SwiftBiu.showNotification(title, message);
    }
}

function showPendingImage(prompt, model, aspectRatio) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveImage === "function") {
        currentSessionID = SwiftBiu.showInteractiveImage({
            prompt: prompt,
            selectionText: prompt,
            modelName: model,
            imageSize: aspectRatio,
            showsPendingPlaceholder: true,
            isGenerating: true,
            statusMessage: "正在生成图片..."
        }, function(event) {
            handleImageRegenerate(event);
        });
    }
}

function showImage(result, prompt, model) {
    var base64Data = result && result.base64 ? result.base64 : "";
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveImage === "function") {
        var imageOptions = {
            imageSource: base64Data,
            prompt: prompt,
            selectionText: prompt,
            modelName: model,
            imageSize: result.size || "",
            showsPendingPlaceholder: false,
            isGenerating: false
        };

        if (currentSessionID) {
            SwiftBiu.updateInteractiveImage(currentSessionID, imageOptions);
        } else {
            currentSessionID = SwiftBiu.showInteractiveImage(imageOptions, function(event) {
                handleImageRegenerate(event);
            });
        }
    }
}

function failImage(message) {
    if (currentSessionID && typeof SwiftBiu !== "undefined" && typeof SwiftBiu.failInteractiveImage === "function") {
        SwiftBiu.failInteractiveImage(currentSessionID, message);
    } else {
        notify("Codex Image Error", message);
    }
}

function handleImageRegenerate(event) {
    if (!event || typeof event !== "object") {
        return;
    }
    var prompt = typeof event.prompt === "string" ? event.prompt.trim() : "";
    var sessionID = typeof event.sessionID === "string" ? event.sessionID : "";
    if (!prompt || !sessionID) {
        return;
    }
    currentSessionID = sessionID;
    generateImage(prompt);
}

function generateImage(prompt) {
    if (typeof SwiftBiu === "undefined" || typeof SwiftBiu.aiImageGenerate !== "function") {
        notify("Codex Image", "SwiftBiu.aiImageGenerate is not available in this host version.");
        return;
    }

    var provider = configString("imageProvider", "codex");
    var model = configString("imageModel", "gpt-image-2-medium");
    var aspectRatio = configString("aspectRatio", "1:1");
    var resolution = configString("resolution", "1k");

    var options = {
        provider: provider,
        model: model,
        useCase: "imageGeneration",
        prompt: prompt,
        aspectRatio: aspectRatio,
        resolution: resolution,
        responseFormat: "b64_json",
        debugRequestID: makeDebugRequestID("codex-image")
    };

    if (!currentSessionID) {
        showPendingImage(prompt, model, aspectRatio);
    } else if (typeof SwiftBiu.updateInteractiveImage === "function") {
        SwiftBiu.updateInteractiveImage(currentSessionID, {
            prompt: prompt,
            selectionText: prompt,
            modelName: model,
            imageSize: aspectRatio,
            showsPendingPlaceholder: true,
            isGenerating: true,
            statusMessage: "正在重新生成图片..."
        });
    }

    logImageRequest(options);

    SwiftBiu.aiImageGenerate(
        options,
        function(result) {
            logImageSuccess(options.debugRequestID, result);
            showImage(result, prompt, model);

            var base64Data = result && result.base64 ? result.base64 : "";
            var mimeType = result && result.mimeType ? result.mimeType : "image/png";

            if (isConfigEnabled("autoCopy", true) && base64Data && typeof SwiftBiu.copyImage === "function") {
                SwiftBiu.copyImage(base64Data, { mimeType: mimeType });
            }
        },
        function(error) {
            logImageFailure(options.debugRequestID, error);
            var message = String(error.error || error.message || error);
            failImage(message);
        }
    );
}

function isAvailable(context) {
    return {
        isAvailable: true,
        isContextMatch: selectedText(context).length > 0
    };
}

function performAction(context) {
    var prompt = selectedText(context);
    var model = configString("imageModel", "gpt-image-2-medium");
    var aspectRatio = configString("aspectRatio", "1:1");

    currentSessionID = "";

    if (prompt.length === 0) {
        if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveImage === "function") {
            currentSessionID = SwiftBiu.showInteractiveImage({
                prompt: "",
                selectionText: "",
                modelName: model,
                imageSize: aspectRatio,
                showsPendingPlaceholder: true,
                isGenerating: false,
                statusMessage: "请输入提示词以生成图片。"
            }, function(event) {
                handleImageRegenerate(event);
            });
        } else {
            notify("Codex Image", "Select a prompt before running this action.");
        }
        return;
    }

    generateImage(prompt);
}
