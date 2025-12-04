/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    const text = context.selectedText.trim();
    if (!text) return false;

    // 检查是否为数字（时间戳）
    if (/^\d+$/.test(text)) {
        return true;
    }

    // 检查是否为日期字符串
    const date = new Date(text);
    return !isNaN(date.getTime());
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const text = context.selectedText.trim();
    
    // 尝试作为时间戳处理
    if (/^\d+$/.test(text)) {
        let timestamp = parseInt(text);
        // 猜测是秒还是毫秒
        // 2001-09-09 是 1000000000 (10位)
        // 2286-11-20 是 10000000000 (11位)
        // 毫秒通常是 13 位
        let isSeconds = text.length <= 10;
        
        const date = new Date(isSeconds ? timestamp * 1000 : timestamp);
        
        if (!isNaN(date.getTime())) {
            const local = date.toLocaleString();
            
            SwiftBiu.showNotification("时间戳转换", local);
            SwiftBiu.pasteText(local); 
            return;
        }
    }
    
    // 尝试作为日期字符串处理
    const date = new Date(text);
    if (!isNaN(date.getTime())) {
        const timestampMs = date.getTime();
        const timestampSec = Math.floor(timestampMs / 1000);
        
        const result = `${timestampSec}`;
        SwiftBiu.showNotification("日期转换", `秒: ${timestampSec}`);
        SwiftBiu.pasteText(result);
    } else {
        SwiftBiu.showNotification("转换失败", "无效的时间格式");
    }
}