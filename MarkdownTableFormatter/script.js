/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    const text = context.selectedText.trim();
    // 至少包含两个竖线，且有多行
    return text.includes('|') && text.split('\n').length >= 2;
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const text = context.selectedText;
    
    try {
        const formatted = formatTable(text);
        if (formatted !== text) {
            SwiftBiu.pasteText(formatted);
            SwiftBiu.showNotification("表格格式化成功");
        } else {
            SwiftBiu.showNotification("无需格式化", "表格已经对齐");
        }
    } catch (e) {
        console.log("Table formatting failed:", e);
        SwiftBiu.showNotification("格式化失败", "无法解析表格结构");
    }
}

function formatTable(text) {
    // 1. 解析行
    let lines = text.trim().split(/\r\n|\r|\n/);
    
    // 过滤掉非表格行（简单的容错）
    lines = lines.filter(line => line.trim().includes('|'));
    
    if (lines.length < 2) return text;

    // 2. 解析单元格
    const rows = lines.map(line => {
        // 移除首尾的 | (如果存在)，然后分割
        let content = line.trim();
        if (content.startsWith('|')) content = content.substring(1);
        if (content.endsWith('|')) content = content.substring(0, content.length - 1);
        
        return content.split('|').map(cell => cell.trim());
    });

    // 3. 计算每列最大宽度
    const colWidths = [];
    rows.forEach(row => {
        row.forEach((cell, i) => {
            // 计算字符宽度（中文算2，英文算1）
            const width = getStringWidth(cell);
            if (!colWidths[i] || width > colWidths[i]) {
                colWidths[i] = width;
            }
        });
    });

    // 4. 重新构建表格
    const formattedLines = rows.map((row, rowIndex) => {
        // 检查是否是分隔行 (例如 ---, :---, ---:)
        const isSeparatorRow = row.every(cell => /^[-\s:]+$/.test(cell));
        
        const formattedCells = row.map((cell, i) => {
            const targetWidth = colWidths[i] || 0;
            
            if (isSeparatorRow) {
                // 处理分隔符行的对齐
                // 简单的处理：填充 -
                // 更好的处理应该保留 : 的位置，这里简化处理
                let content = cell;
                if (content.length < 3) content = "---"; // 至少3个
                // 填充到目标宽度
                while (content.length < targetWidth) content += "-";
                return ` ${content} `;
            } else {
                // 普通内容行，填充空格
                const padding = targetWidth - getStringWidth(cell);
                return ` ${cell}${' '.repeat(Math.max(0, padding))} `;
            }
        });
        
        return `|${formattedCells.join('|')}|`;
    });

    return formattedLines.join('\n');
}

// 简单的全角/半角宽度计算
function getStringWidth(str) {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        // 简单的判断：ASCII 范围外通常是宽字符
        if (code > 127) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}