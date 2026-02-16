/**
 * 检查插件在当前上下文是否可用。
 * @param {object} context - 包含当前选择信息的上下文对象。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    // 仅当用户选中文本时，图片生成插件才可用。
    return context.selectedText.trim().length > 0;
}

/**
 * SwiftBiu 插件的主入口函数。
 * 当用户触发此动作（例如，点击工具栏图标）时，该函数被调用。
 * 它的核心功能是使用 Gemini API 将选中的文本作为提示词来生成图片。
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * @param {string} context.selectedText - 用户选中的文本，将用作图片生成的提示词。
 */
function performAction(context) {
    const apiKey = SwiftBiu.getConfig("apiKey");

    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Gemini API Key is not set.");
        return;
    }

    const prompt = context.selectedText;
    if (!prompt) {
        SwiftBiu.showNotification("Input Error", "Please select some text to generate an image.");
        return;
    }

    const modelId = SwiftBiu.getConfig("model") || "gemini-2.5-flash-image";
    const aspectRatio = SwiftBiu.getConfig("aspectRatio") || "1:1";
    let imageSize = SwiftBiu.getConfig("imageSize") || "1K";

    // Gemini 2.5 Flash typically supports up to 1K only.
    if (modelId.indexOf("2.5") !== -1 && (imageSize === "2K" || imageSize === "4K")) {
        imageSize = "1K";
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    // Build generationConfig based on model
    const generationConfig = {
        "responseModalities": ["IMAGE", "TEXT"]
    };

    // imageConfig is only supported by gemini-3-pro-image-preview
    // gemini-2.5-flash-image does NOT use imageConfig per official API examples
    if (modelId.indexOf("gemini-3") !== -1) {
        generationConfig.imageConfig = {
            "aspectRatio": aspectRatio,
            "imageSize": imageSize
        };
    }

    const requestBody = {
        "contents": [{ "role": "user", "parts": [{ "text": prompt }] }],
        "generationConfig": generationConfig
    };

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    };

    // Debug: log request details
    console.log("[GeminiImage] URL: " + url);
    console.log("[GeminiImage] Model: " + modelId + ", AspectRatio: " + aspectRatio + ", ImageSize: " + imageSize);
    console.log("[GeminiImage] Request Body: " + JSON.stringify(requestBody));

    SwiftBiu.showLoadingIndicator(context.screenPosition);

    SwiftBiu.fetch(url, options,
        (response) => {
            SwiftBiu.hideLoadingIndicator();
            // Debug: log raw response
            console.log("[GeminiImage] Response Status: " + response.status);
            console.log("[GeminiImage] Response Data: " + (response.data || "").substring(0, 500));
            try {
                // Check HTTP status code first
                if (response.status && response.status !== 200) {
                    var errorInfo = response.data || "Unknown error";
                    try {
                        var errObj = JSON.parse(errorInfo);
                        if (errObj.error && errObj.error.message) {
                            errorInfo = errObj.error.message;
                        }
                    } catch (ignored) { }
                    SwiftBiu.showNotification("API Error (" + response.status + ")", errorInfo);
                    return;
                }

                const responseData = JSON.parse(response.data);

                // Check for top-level API error
                if (responseData.error) {
                    SwiftBiu.showNotification("API Error", responseData.error.message || "Unknown API error");
                    return;
                }

                let base64Image = null;
                let textContent = "";

                // Parse non-streaming response: { candidates: [{ content: { parts: [...] } }] }
                var candidates = responseData.candidates || [];
                for (var j = 0; j < candidates.length; j++) {
                    var candidate = candidates[j];
                    if (!candidate.content || !candidate.content.parts) continue;

                    for (var k = 0; k < candidate.content.parts.length; k++) {
                        var part = candidate.content.parts[k];
                        if (part.inlineData && part.inlineData.data) {
                            base64Image = part.inlineData.data;
                        } else if (part.text) {
                            textContent += part.text;
                        }
                    }
                }

                if (base64Image) {
                    SwiftBiu.showImage(base64Image);
                } else {
                    console.log("No image data found. Response:", JSON.stringify(responseData));
                    var errorMsg = "No image was generated.";
                    if (textContent) {
                        errorMsg += " API returned text: " + textContent.substring(0, 100);
                    }
                    SwiftBiu.showNotification("API Error", errorMsg);
                }
            } catch (e) {
                console.log("Failed to parse response:", e.message, "Raw data:", response.data);
                SwiftBiu.showNotification("Parse Error", "Could not process response: " + e.message);
            }
        },
        (error) => {
            SwiftBiu.hideLoadingIndicator();
            console.log("Network error:", JSON.stringify(error));
            SwiftBiu.showNotification("Network Error", "Failed to connect to the API.");
        }
    );
}