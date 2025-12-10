/**
 * @file script.js
 * @description 豆包文本生成插件 - 纯逻辑后台脚本
 */


/**
 * (同步) 判断动作是否应在当前上下文显示。
 * @param {object} context - 上下文对象，包含选中的文本等信息。
 * @returns {{isAvailable: boolean, isContextMatch: boolean}}
 */
function isAvailable(context) {
  // 默认情况下，Gemini 插件对任何选中的文本都可用。
  const isTextSelected = context.selectedText && context.selectedText.trim().length > 0;
  // isContextMatch 表示上下文是否精确匹配（例如，是否是代码、URL等），这里我们简单地等同于 isAvailable
  return {
    isAvailable: isTextSelected,
    isContextMatch: false
  };
}

/**
 * 当用户点击动作时执行。
 * @param {object} context - 上下文对象。
 */
function performAction(context) {
  // 1. 从配置中获取设置
  const apiUrl = SwiftBiu.getConfig('apiUrl') || "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
  const apiKey = SwiftBiu.getConfig('apiKey');
  const textModel = SwiftBiu.getConfig('textModel');

  // 从 radioList 配置中解析出启用的 AI 角色
  let systemPrompt = "你是一个通用的人工智能助手。"; // 默认值
  const systemRolesConfig = SwiftBiu.getConfig('systemPrompt');
  if (systemRolesConfig) {
    try {
      const roles = JSON.parse(systemRolesConfig);
      // 找到 enabled 为 true 的那一项
      const enabledRole = roles.find(role => role.enabled);
      if (enabledRole) {
        systemPrompt = enabledRole.value;
      }
    } catch (e) {
      console.log("无法解析 AI 角色配置:", e);
      // 如果解析失败，则继续使用默认值
    }
  }

  if (!apiKey) {
    SwiftBiu.showNotification("配置错误", "请先在插件设置中配置 API Key。");
    return;
  }

  // 2. 获取选中的文本
  const selectedText = context.selectedText;
  if (!selectedText || selectedText.trim().length === 0) {
    SwiftBiu.showNotification("输入错误", "请先选择需要处理的文本。");
    return;
  }

  // 显示加载指示器
  SwiftBiu.showLoadingIndicator(context.screenPosition);

  // 3. 构造并异步发送 API 请求
  SwiftBiu.fetch(
    apiUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: textModel || "doubao-seed-1-6-251015", // Fallback to default
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: selectedText }
        ],
        stream: false
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


        // 使用 JSON.stringify 确保复杂对象能被完整打印
        console.log("API Response:", JSON.stringify(result, null, 2));
        // 使用兼容性更好的 [0] 替代 .at(0) 来访问数组元素
        const content = result.choices?.[0]?.message?.content;
        // 单独打印提取出的 content 内容
        console.log("API Response content:", content);
        if (content) {
          // 4. 将原始文本和生成结果拼接后直接粘贴，并显示成功通知
          const newContent = context.selectedText + "\n\n" + content;
          SwiftBiu.pasteText(newContent);
          SwiftBiu.showNotification("文本生成成功", "结果已直接粘贴。");
        } else {
          throw new Error("API 未返回有效内容。");
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