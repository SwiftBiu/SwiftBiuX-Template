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
    
    // 获取配置
    const patternType = getConfig('patternType', 'Email');
    const customRegexStr = getConfig('customRegex', '');
    let separator = getConfig('separator', '\\n');
    
    // 处理转义字符
    separator = separator.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

    let regex;
    
    switch (patternType) {
        case 'Email':
            regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            break;
        case 'URL':
            regex = /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[^\s]+/g;
            break;
        case 'IPv4':
            regex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
            break;
        case 'Phone (CN)':
            regex = /(?:\+?86)?1[3-9]\d{9}/g;
            break;
        case 'Date (YYYY-MM-DD)':
            regex = /\d{4}-\d{2}-\d{2}/g;
            break;
        case 'Custom':
            if (customRegexStr) {
                try {
                    regex = new RegExp(customRegexStr, 'g');
                } catch (e) {
                    SwiftBiu.showNotification("错误", "无效的正则表达式");
                    return;
                }
            } else {
                SwiftBiu.showNotification("提示", "请在设置中配置自定义正则表达式");
                return;
            }
            break;
        default:
            regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    }

    const matches = text.match(regex);

    if (matches && matches.length > 0) {
        // 去重
        const uniqueMatches = [...new Set(matches)];
        const result = uniqueMatches.join(separator);
        
        SwiftBiu.pasteText(result);
        SwiftBiu.showNotification("提取成功", `共找到 ${uniqueMatches.length} 个结果`);
    } else {
        SwiftBiu.showNotification("未找到匹配项", `当前模式: ${patternType}`);
    }
}

function getConfig(key, defaultValue) {
    try {
        // SwiftBiu.getConfig returns the stored value or an empty string if not found.
        const value = SwiftBiu.getConfig(key);
        // If a value is returned (i.e., not an empty string), use it. Otherwise, use the default.
        return value || defaultValue;
    } catch (e) {
        console.log(`Error getting config for key '${key}': ${e}. Using default value.`);
        return defaultValue;
    }
}