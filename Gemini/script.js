/**
 * 检查插件在当前上下文是否可用。
 * @param {object} context - 包含当前选择信息的上下文对象。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    // 默认情况下，Gemini 插件对任何选中的文本都可用。
    // 如果需要，可以添加逻辑，例如检查文本长度等。
    return context.selectedText.trim().length > 0;
}

// An array to hold the history of the conversation in OpenAI's format for simplicity.
// We will convert it to Gemini's format on the fly.
const messages = [];

// The timestamp of the last interaction.
let lastChatDate = new Date();

/**
 * Resets the conversation history and notifies the user.
 */
function resetConversation() {
    messages.length = 0;
    SwiftBiu.showNotification("Gemini Conversation Reset", "The chat history has been cleared.");
}

/**
 * Converts the internal message history to the format required by the Gemini API.
 * @returns {object} A request body object with the 'contents' property.
 */
function convertMessagesToGeminiFormat() {
    return {
        contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
    };
}

/**
 * SwiftBiu 插件的主入口函数。
 * 当用户触发此动作时，该函数被调用。
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 */
function performAction(context) {
    // --- 1. Get User Configuration ---
    const apiKey = SwiftBiu.getConfig("apikey");
    const customApiUrl = SwiftBiu.getConfig("apiurl");
    // Read the new boolean config key. It will be a string "true" or "false".
    const model = SwiftBiu.getConfig("model");
    const contextMessageCount = parseInt(SwiftBiu.getConfig("contextMessageCount") || "0", 10);

    const chatModel = model || "gemini-1.5-flash";
    const apiUrl = customApiUrl || `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent`;

    
    // --- 2. Check for API Key ---
    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please set your Gemini API Key in the plugin settings.");
        return;
    }

    // Manual reset is no longer needed as context is explicitly controlled.
    if (context.selectedText.trim().toLowerCase() === "reset chat") {
        resetConversation();
        return;
    }

    // --- 5. Build System Prompt from Roles ---
    // 从 manifest.json 的 "systemRoles" 配置中构建系统提示。
    // SwiftBiu.getConfig("systemRoles") 会返回一个 JSON 字符串，
    // 该字符串代表了用户在设置中启用的角色列表。
    //
    // 关键说明: 默认情况下，脚本会读取每个角色对象中的 `value` 属性。
    // 如果插件开发者在 manifest.json 中使用了不同的属性名（例如 `content` 或 `prompt`），
    // 则必须相应地修改下面的 `.map(role => role.value)`。
    const systemRolesConfig = SwiftBiu.getConfig("systemRoles");
    let systemPrompt = "";
    if (systemRolesConfig) {
        try {
            const roles = JSON.parse(systemRolesConfig);
            systemPrompt = roles
                .filter(role => role.enabled)
                .map(role => role.value) // Correctly access the 'value' property
                .join(' ');
        } catch (e) {
            console.log("Could not parse system roles config:", e);
        }
    }

    // --- 6. Combine System Prompt with User Text and Add to History ---
    // The system prompt is combined with the current user text for each new message.
    const combinedUserPrompt = `${systemPrompt} 我选择的内容是“${context.selectedText}”`.trim();
    messages.push({ role: "user", content: combinedUserPrompt });

    // --- 7. Prepare and Send API Request ---
    // The entire conversation history is converted to the Gemini format.
    // --- 7. Prepare and Send API Request ---
    // Slice the history to include the number of context messages specified by the user.
    // The user's current message is the last one, so we take `contextMessageCount` from the history before it, plus the current one.
    const historyToSend = messages.slice(-(contextMessageCount + 1));

    const requestBody = {
        contents: historyToSend.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
    };

    console.log(`Using API URL: ${apiUrl}`);
    console.log(`Request Body: ${JSON.stringify(requestBody)}`);

    SwiftBiu.showLoadingIndicator(context.screenPosition);
    SwiftBiu.fetch(
        `${apiUrl}?key=${apiKey}`, // Gemini API key is passed as a query parameter
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        },
        (response) => { // onSuccess Callback
            SwiftBiu.hideLoadingIndicator();
            try {
                const responseData = JSON.parse(response.data);

                // --- Robust Error Handling ---
                // First, check if the API returned an error object.
                if (responseData.error) {
                    console.log(`API Error Response: ${JSON.stringify(responseData.error)}`);
                    throw new Error(responseData.error.message || "Unknown API error.");
                }

                // --- Graceful Success Parsing ---
                // Proceed only if candidates array exists and is not empty.
                const candidate = responseData.candidates && responseData.candidates.at(0);
                if (candidate && candidate.content && candidate.content.parts && candidate.content.parts.at(0)) {
                    const assistantText = candidate.content.parts.at(0).text;
                    const assistantMessage = { role: "model", content: assistantText };

                    // Add assistant's response to history
                    messages.push(assistantMessage);

                    // Update last chat time
                    lastChatDate = new Date();
                    
                    // Paste response and notify user
                    const newContent = context.selectedText + "\n\n" + assistantText;
                    SwiftBiu.pasteText(newContent);
                    // SwiftBiu.showNotification("Gemini Response Pasted", "The assistant's reply has been pasted.");
                } else {
                    throw new Error("Invalid response structure from API.");
                }
            } catch (e) {
                SwiftBiu.showNotification("API Error", `Failed to parse response: ${e.message}`);
                console.log(`Parse error: ${e}, Original response: ${response.data}`);
                // Remove the user's last message on failure to allow retry
                messages.pop();
            }
        },
        (error) => { // onError Callback
            SwiftBiu.hideLoadingIndicator();
            SwiftBiu.showNotification("API Request Failed", `Error: ${error.error}`);
            console.log(`API Error: ${JSON.stringify(error)}`);
            // Remove the user's last message on failure to allow retry
            messages.pop();
        }
    );
}