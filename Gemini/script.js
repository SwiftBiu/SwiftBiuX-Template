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
 * 将内部维护的对话历史记录转换为 Gemini API 所需的特定格式。
 * @returns {object} - 用于 Gemini API 请求的 contents 对象。
 */
function convertMessagesToGeminiFormat() {
    return {
        contents: messages.map(msg => {
            // Convert 'system' role to 'user' for Gemini compatibility, as it doesn't have a separate system role.
            const role = (msg.role === 'user' || msg.role === 'system') ? 'user' : 'model';
            return {
                role: role,
                parts: [{ text: msg.content }]
            };
        })
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
    const enableReset = SwiftBiu.getConfig("enableReset") === 'true';
    const model = SwiftBiu.getConfig("model");

    const chatModel = model || "gemini-1.5-flash";
    const apiUrl = customApiUrl || `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent`;

    // --- 2. Check for API Key ---
    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please set your Gemini API Key in the plugin settings.");
        return;
    }

    // --- 3. Handle Manual Reset Command ---
    if (context.selectedText.trim().toLowerCase() === "reset chat") {
        resetConversation();
        return;
    }

    // --- 4. Handle Automatic Reset Timer ---
    // Use a fixed 15-minute timer if the reset is enabled.
    if (enableReset) {
        const resetInterval = 15 * 60 * 1000; // 15 minutes in milliseconds
        if (new Date().getTime() - lastChatDate.getTime() > resetInterval) {
            console.log(`Conversation automatically reset due to inactivity of over 15 minutes.`);
            messages.length = 0; // Silently reset without notification
        }
    }

    // --- 5. Build System Prompt from Roles ---
    const systemRolesConfig = SwiftBiu.getConfig("systemRoles");
    let systemPrompt = "";
    if (systemRolesConfig) {
        try {
            const roles = JSON.parse(systemRolesConfig);
            systemPrompt = roles
                .filter(role => role.enabled)
                .map(role => role.role)
                .join(' ');
        } catch (e) {
            console.log("Could not parse system roles config:", e);
        }
    }

    // --- 6. Add User's Message to History (and system prompt if needed) ---
    // Clear history to inject system prompt at the start of a new conversation
    if (messages.length === 0 && systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: context.selectedText });

    // --- 7. Prepare and Send API Request ---
    const requestBody = convertMessagesToGeminiFormat();

    // The model name is often in the URL for Gemini, but we add it here if needed by the API.
    // For generateContent, it's in the URL, so we don't add it to the body.

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
                const candidate = responseData.candidates.at(0);

                if (candidate && candidate.content && candidate.content.parts) {
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