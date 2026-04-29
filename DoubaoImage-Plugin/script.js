/**
 * @file script.js
 * @description 豆包图像生成插件 - 使用原生图片卡片展示结果
 */

function getTrimmedSelectedText(context) {
  if (!context || typeof context.selectedText !== "string") {
    return "";
  }
  return context.selectedText.trim();
}

function isAvailable(context) {
  const prompt = getTrimmedSelectedText(context);
  return {
    isAvailable: true,
    isContextMatch: prompt.length > 0
  };
}

function supportsInteractiveImage() {
  return (
    typeof SwiftBiu.showInteractiveImage === "function" &&
    typeof SwiftBiu.updateInteractiveImage === "function" &&
    typeof SwiftBiu.failInteractiveImage === "function"
  );
}

function extractResponseJSON(response) {
  const rawData = response && typeof response.data === "string" ? response.data : "";
  if (!rawData) {
    return {};
  }
  return JSON.parse(rawData);
}

function buildImageCardOptions(prompt, imageUrl, settings, context) {
  return {
    imageSource: imageUrl,
    prompt: prompt,
    selectionText: prompt,
    position: context && context.screenPosition ? context.screenPosition : null,
    modelName: settings.imageModel,
    imageSize: settings.imageSize
  };
}

function buildPendingImageCardOptions(prompt, settings, context) {
  return {
    prompt: prompt,
    selectionText: prompt,
    position: context && context.screenPosition ? context.screenPosition : null,
    modelName: settings.imageModel,
    imageSize: settings.imageSize,
    showsPendingPlaceholder: true,
    isGenerating: true,
    statusMessage: "正在生成图片..."
  };
}

function beginInteractiveImageRequest(prompt, settings, context) {
  if (!supportsInteractiveImage()) {
    return "";
  }

  return SwiftBiu.showInteractiveImage(
    buildPendingImageCardOptions(prompt, settings, context),
    function (event) {
      handleRegenerate(event, settings, context);
    }
  );
}

function openPromptEditor(settings, context) {
  if (!supportsInteractiveImage()) {
    return "";
  }

  return SwiftBiu.showInteractiveImage(
    {
      prompt: "",
      selectionText: "",
      position: context && context.screenPosition ? context.screenPosition : null,
      modelName: settings.imageModel,
      imageSize: settings.imageSize,
      showsPendingPlaceholder: true,
      isGenerating: false,
      statusMessage: "请输入提示词后点击生成。"
    },
    function (event) {
      handleRegenerate(event, settings, context);
    }
  );
}

function showRequestError(message, sessionID) {
  if (sessionID && supportsInteractiveImage()) {
    SwiftBiu.failInteractiveImage(sessionID, message);
    return;
  }
  SwiftBiu.showNotification("处理失败", message);
}

function presentGeneratedImage(prompt, imageUrl, settings, context, sessionID) {
  const imageOptions = buildImageCardOptions(prompt, imageUrl, settings, context);

  if (sessionID && supportsInteractiveImage()) {
    SwiftBiu.updateInteractiveImage(sessionID, imageOptions);
    return sessionID;
  }

  if (supportsInteractiveImage()) {
    return SwiftBiu.showInteractiveImage(imageOptions, function (event) {
      handleRegenerate(event, settings, context);
    });
  }

  SwiftBiu.showImage(
    imageUrl,
    null,
    {
      prompt: prompt,
      selectionText: prompt,
      modelName: settings.imageModel,
      imageSize: settings.imageSize
    }
  );
  return "";
}

function resolveDoubaoImageURL(result) {
  return result && result.data && result.data[0] ? result.data[0].url : "";
}

function requestImageGeneration(prompt, settings, context, sessionID) {
  SwiftBiu.fetch(
    settings.apiUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + settings.apiKey
      },
      body: JSON.stringify({
        model: settings.imageModel,
        prompt: prompt,
        size: settings.imageSize,
        response_format: "url"
      })
    },
    function (response) {
      try {
        const result = extractResponseJSON(response);
        if (!response || response.status < 200 || response.status >= 300) {
          const errorMessage =
            (result && result.error && result.error.message) ||
            "HTTP Error " + (response ? response.status : "Unknown");
          throw new Error(errorMessage);
        }

        const imageUrl = resolveDoubaoImageURL(result);
        if (!imageUrl) {
          throw new Error("API 未返回有效的图像 URL。");
        }

        console.log("Doubao image generated successfully:", JSON.stringify({
          hasImageURL: true,
          model: settings.imageModel,
          size: settings.imageSize,
          sessionID: sessionID || ""
        }));

        presentGeneratedImage(prompt, imageUrl, settings, context, sessionID);
      } catch (error) {
        const message = error && error.message ? error.message : "生成图片失败";
        console.log("Doubao image response handling failed:", message);
        showRequestError(message, sessionID);
      }
    },
    function (error) {
      const message =
        (error && (error.error || error.message)) ||
        "网络请求失败";
      console.log("Doubao image request failed:", JSON.stringify(error || {}));
      showRequestError(message, sessionID);
    }
  );
}

function handleRegenerate(event, settings, context) {
  if (!event || typeof event !== "object") {
    return;
  }

  const prompt = typeof event.prompt === "string" ? event.prompt.trim() : "";
  const sessionID = typeof event.sessionID === "string" ? event.sessionID : "";

  if (!prompt || !sessionID) {
    showRequestError("缺少重生成所需的 prompt 或 sessionID。", sessionID);
    return;
  }

  requestImageGeneration(prompt, settings, context, sessionID);
}

function performAction(context) {
  const apiUrl = SwiftBiu.getConfig("apiUrl") || "https://ark.cn-beijing.volces.com/api/v3/images/generations";
  const apiKey = SwiftBiu.getConfig("apiKey");
  const imageModel = SwiftBiu.getConfig("imageModel") || "doubao-seedream-5-0-260128";
  const imageSize = SwiftBiu.getConfig("imageSize") || "1024x1024";
  const prompt = getTrimmedSelectedText(context);

  if (!apiKey) {
    SwiftBiu.showNotification("配置错误", "请先在插件设置中配置 API Key。");
    return;
  }

  if (!prompt) {
    const sessionID = openPromptEditor(
      {
        imageModel: imageModel,
        imageSize: imageSize
      },
      context
    );

    if (!sessionID) {
      SwiftBiu.showNotification("输入错误", "请先选择用于生成图像的文本提示。");
    }
    return;
  }

  requestImageGeneration(
    prompt,
    {
      apiUrl: apiUrl,
      apiKey: apiKey,
      imageModel: imageModel,
      imageSize: imageSize
    },
    context,
    beginInteractiveImageRequest(
      prompt,
      {
        imageModel: imageModel,
        imageSize: imageSize
      },
      context
    )
  );
}
