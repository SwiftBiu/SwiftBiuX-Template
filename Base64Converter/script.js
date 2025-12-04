// --- Base64 Polyfill for environments without btoa/atob ---
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function btoa(input = '') {
  let str = input;
  let output = '';

  for (let block = 0, charCode, i = 0, map = chars;
  str.charAt(i | 0) || (map = '=', i % 1);
  output += map.charAt(63 & block >> 8 - i % 1 * 8)) {

    charCode = str.charCodeAt(i += 3/4);

    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }

    block = block << 8 | charCode;
  }

  return output;
}

function atob(input = '') {
  let str = input.replace(/=+$/, '');
  let output = '';

  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);

    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    return context.selectedText.trim().length > 0;
}

// --- Helpers for robust UTF-8 Base64 encoding/decoding ---

/**
 * Decodes a Base64 string to a UTF-8 string.
 * @param {string} str - The Base64 string to decode.
 * @returns {string} - The decoded UTF-8 string.
 */
function b64_to_utf8(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

/**
 * Encodes a UTF-8 string to a Base64 string.
 * @param {string} str - The UTF-8 string to encode.
 * @returns {string} - The encoded Base64 string.
 */
function utf8_to_b64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}


/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const text = context.selectedText;
    const trimmed = text.trim();

    // 尝试判断是否为 Base64 字符串
    // 1. 长度必须是 4 的倍数
    // 2. 只包含 A-Z, a-z, 0-9, +, /, =
    // 3. Padding (=) 只出现在末尾
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    
    let isDecoded = false;

    if (trimmed.length > 0 && trimmed.length % 4 === 0 && base64Regex.test(trimmed)) {
        try {
            // 尝试解码 (支持 UTF-8)
            const decoded = b64_to_utf8(trimmed);
            
            // 简单的启发式：如果解码成功且结果看起来像文本，则认为是解码操作
            // 这里我们假设只要能成功解码 UTF-8 就优先展示解码结果
            SwiftBiu.pasteText(decoded);
            SwiftBiu.showNotification("Base64 解码成功");
            isDecoded = true;
        } catch (e) {
            // 解码失败，可能是无效的 Base64 或非 UTF-8 编码，继续尝试编码
            console.log(`Base64 decode failed, falling back to encode: ${e.message}`);
        }
    }

    if (!isDecoded) {
        try {
            // 编码 (支持 UTF-8)
            const encoded = utf8_to_b64(text);
            SwiftBiu.pasteText(encoded);
            SwiftBiu.showNotification("Base64 编码成功");
        } catch (e) {
            console.log(`Base64 encode failed: ${e.message}`);
            SwiftBiu.showNotification("操作失败", "无法进行 Base64 转换");
        }
    }
}