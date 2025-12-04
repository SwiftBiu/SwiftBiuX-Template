/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    const selectedText = context.selectedText.trim();
    if (!selectedText) {
        return false;
    }

    // 简单的启发式检查：必须以 { 或 [ 开头，以 } 或 ] 结尾
    // 这避免了对非 JSON 文本进行昂贵的解析尝试
    const firstChar = selectedText.charAt(0);
    const lastChar = selectedText.charAt(selectedText.length - 1);

    if ((firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']')) {
        try {
            JSON.parse(selectedText);
            return true;
        } catch (e) {
            return false;
        }
    }

    return false;
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const selectedText = context.selectedText;

    try {
        const jsonObject = JSON.parse(selectedText);

        // 检查原始文本是否包含换行符来判断是否已被格式化
        const isFormatted = selectedText.includes('\n');

        if (isFormatted) {
            // 如果已格式化，则压缩
            const compactedJson = JSON.stringify(jsonObject);
            SwiftBiu.pasteText(compactedJson);
            SwiftBiu.showNotification("JSON 已压缩");
        } else {
            // 如果是紧凑的，则格式化
            const formattedJson = JSON.stringify(jsonObject, null, 4);
            SwiftBiu.pasteText(formattedJson);
            SwiftBiu.showNotification("JSON 已格式化");
        }
    } catch (e) {
        console.log(`JSON parsing failed: ${e.message}`);
        SwiftBiu.showNotification("格式化失败", "无效的 JSON 格式");
    }
}