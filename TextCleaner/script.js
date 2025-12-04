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
    let lines = text.split(/\r\n|\r|\n/);

    // 获取配置
    const trimLines = getConfig('trimLines', true);
    const removeEmptyLines = getConfig('removeEmptyLines', true);
    const fullToHalf = getConfig('fullToHalf', false);
    const deduplicate = getConfig('deduplicate', false);
    const sortLines = getConfig('sortLines', false);

    // 1. 全角转半角
    if (fullToHalf) {
        lines = lines.map(line => toHalfWidth(line));
    }

    // 2. 去除首尾空格
    if (trimLines) {
        lines = lines.map(line => line.trim());
    }

    // 3. 去除空行
    if (removeEmptyLines) {
        lines = lines.filter(line => line.length > 0);
    }

    // 4. 去重
    if (deduplicate) {
        lines = [...new Set(lines)];
    }

    // 5. 排序
    if (sortLines) {
        lines.sort((a, b) => a.localeCompare(b));
    }

    const result = lines.join('\n');
    
    if (result === text) {
         SwiftBiu.showNotification("无需清洗", "文本已符合当前规则");
    } else {
         SwiftBiu.pasteText(result);
         SwiftBiu.showNotification("清洗完成");
    }
}

function getConfig(key, defaultValue) {
    try {
        // 直接调用同步的 getConfig API
        const value = SwiftBiu.getConfig(key);
        // 检查返回的值是否有效
        if (value !== undefined && value !== null && value !== "") {
            // 处理字符串形式的布尔值
            if (value === 'true') return true;
            if (value === 'false') return false;
            return value;
        }
    } catch (e) {
        // 记录错误，但不要让整个插件崩溃
        console.log(`Failed to get config for ${key}: ${e}`);
    }
    // 如果获取失败或值为空，返回默认值
    return defaultValue;
}

function toHalfWidth(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code === 12288) {
            result += String.fromCharCode(32);
        } else if (code > 65280 && code < 65375) {
            result += String.fromCharCode(code - 65248);
        } else {
            result += str.charAt(i);
        }
    }
    return result;
}