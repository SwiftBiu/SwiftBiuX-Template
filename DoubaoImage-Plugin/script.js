/**
 * @file script.js
 * @description 豆包图像生成插件 - 纯逻辑后台脚本
 */


/**
 * (同步) 判断动作是否应在当前上下文显示。
 * @param {object} context - 上下文对象，包含选中的文本等信息。
 * @returns {{isAvailable: boolean, isContextMatch: boolean}}
 */
function isAvailable(context) {
  const isTextSelected = context.selectedText && context.selectedText.trim().length > 0;
  return {
    isAvailable: isTextSelected,
    isContextMatch: false // 默认 false 按序排序，true 优先排序 可以根据扩展需求用正则智能匹配
  };
}

/**
 * 当用户点击动作时执行。
 * @param {object} context - 上下文对象。
 */
function performAction(context) {
  // 1. 从配置中获取设置
  const apiUrl = SwiftBiu.getConfig('apiUrl') || "https://ark.cn-beijing.volces.com/api/v3/images/generations";
  const apiKey = SwiftBiu.getConfig('apiKey');
  const imageModel = SwiftBiu.getConfig('imageModel');
  const imageSize = SwiftBiu.getConfig('imageSize');

  if (!apiKey) {
    SwiftBiu.showNotification("配置错误", "请先在插件设置中配置 API Key。");
    return;
  }

  // 2. 获取选中的文本作为 prompt
  const prompt = context.selectedText;
  if (!prompt || prompt.trim().length === 0) {
    SwiftBiu.showNotification("输入错误", "请先选择用于生成图像的文本提示。");
    return;
  }

  // 显示加载指示器
  SwiftBiu.showLoadingIndicator(context.screenPosition);

  // 3. 构造并异步发送 API 请求 (使用回调模式)
  SwiftBiu.fetch(
    apiUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: imageModel || "doubao-seedream-4.5", // Fallback
        prompt: prompt,
        size: imageSize || "1024x1024", // Fallback
        response_format: "url"
      })
    },
    (response) => { // onSuccess Callback
      SwiftBiu.hideLoadingIndicator();
      try {
        const result = JSON.parse(response.data);
        if (response.status !== 200) {
          const errorMessage = result?.error?.message || `HTTP Error ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("API Response:", JSON.stringify(result, null, 2));
        // 使用兼容性更好的 [0] 替代 .at(0)
        const imageUrl = result.data?.[0]?.url;

        if (imageUrl) {
          // 4. 使用原生控件直接显示生成的图片
          SwiftBiu.showImage(imageUrl);
        } else {
          throw new Error("API 未返回有效的图像 URL。");
        }
      } catch (e) {
        SwiftBiu.showNotification("处理失败", e.message);
        console.log(`Parse error: ${e}, Original response: ${response.data}`);
      }
    },
    (error) => { // onError Callback
      SwiftBiu.hideLoadingIndicator();
      const errorMessage = error.error || error.message || "网络请求失败";
      SwiftBiu.showNotification("请求失败", errorMessage);
      console.log(`API Error: ${JSON.stringify(error)}`);
    }
  );
}