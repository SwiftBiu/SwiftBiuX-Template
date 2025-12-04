/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    return context.selectedText.length > 0;
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const text = context.selectedText;
    
    // 根据用户要求，只保留最核心的统计功能
    const charsNoSpace = text.replace(/\s/g, '').length;
    const lines = text.split(/\r\n|\r|\n/).length;
    
    // 简化输出格式
    const result = `字符数: ${charsNoSpace}\n行数: ${lines}`;

    SwiftBiu.showNotification("统计结果", result);
}