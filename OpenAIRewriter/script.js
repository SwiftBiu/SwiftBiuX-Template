/**
 * 检查插件在当前上下文是否可用。
 * @param {object} context - 包含当前选择信息的上下文对象。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    // OpenAI Rewriter 插件对任何选中的文本都可用
    return context.selectedText && context.selectedText.trim().length > 0;
}

/**
 * SwiftBiu 插件的主入口函数。
 * 当用户触发此动作时，该函数被调用。
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 */
function performAction(context) {
    // --- 1. Get User Configuration ---
    const apiKey = SwiftBiu.getConfig("apikey");
    const apiUrl = `${SwiftBiu.getConfig("apiurl")}/chat/completions`;
    const model = SwiftBiu.getConfig("model");
    const promptTemplate = SwiftBiu.getConfig("promptTemplate");

    // --- 2. Validate Configuration ---
    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please enter your API key in the plugin settings.");
        return;
    }

    if (!apiUrl) {
        SwiftBiu.showNotification("Configuration Error", "Please set the API URL in the plugin settings.");
        return;
    }

    if (!model) {
        SwiftBiu.showNotification("Configuration Error", "Please select a model in the plugin settings.");
        return;
    }

    if (!promptTemplate || promptTemplate.trim().length === 0) {
        SwiftBiu.showNotification("Configuration Error", "Please set the prompt template in the plugin settings.");
        return;
    }

    // --- 3. Build User Prompt ---
    // Replace {text} placeholder in the template with the actual selected text
    const userPrompt = promptTemplate + `the original text is: ${context.selectedText}`;

    // Add explicit instructions to ensure the model returns only the rewritten text
    const systemPrompt = "You are a text rewriting assistant. Your task is to rewrite the given text according to the user's instructions. IMPORTANT: Return ONLY the rewritten text without any explanations, commentary, or additional formatting. Do not include phrases like 'Here is the rewritten text' or any other meta-commentary. Just output the rewritten text directly.";

    // --- 4. Prepare API Request ---
    const requestBody = {
        model: model,
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: userPrompt
            }
        ]
    };

    console.log(`Using API URL: ${apiUrl}`);
    console.log(`Request Body: ${JSON.stringify(requestBody)}`);

    // --- 5. Send API Request ---
    SwiftBiu.showLoadingIndicator(context.screenPosition);
    SwiftBiu.fetch(
        apiUrl,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        },
        (response) => { // onSuccess Callback
            SwiftBiu.hideLoadingIndicator();
            try {
                const responseData = JSON.parse(response.data);

                // --- Error Handling ---
                if (responseData.error) {
                    console.log(`API Error Response: ${JSON.stringify(responseData.error)}`);
                    throw new Error(responseData.error.message || "Unknown API error.");
                }

                // --- Parse Response ---
                // OpenAI compatible API response structure
                if (responseData.choices && responseData.choices.length > 0) {
                    const rewrittenText = responseData.choices[0].message.content.trim();

                    if (rewrittenText) {
                        // Replace the selected text with the rewritten content
                        SwiftBiu.pasteText(rewrittenText);
                    } else {
                        throw new Error("Empty response from API.");
                    }
                } else {
                    throw new Error("Invalid response structure from API.");
                }
            } catch (e) {
                SwiftBiu.showNotification("API Error", `Failed to process response: ${e.message}`);
                console.log(`Parse error: ${e}, Original response: ${response.data}`);
            }
        },
        (error) => { // onError Callback
            SwiftBiu.hideLoadingIndicator();
            SwiftBiu.showNotification("API Request Failed", `Error: ${error.error}`);
            console.log(`API Error: ${JSON.stringify(error)}`);
        }
    );
}
