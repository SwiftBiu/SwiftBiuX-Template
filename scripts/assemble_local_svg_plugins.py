#!/usr/bin/env python3
from pathlib import Path
import base64
import re

ROOT = Path(__file__).resolve().parents[1]
LIBS = Path("/tmp/svg-libs")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def assemble_imagetracer() -> None:
    pako = LIBS.joinpath("pako.min.js").read_text(encoding="utf-8")
    upng = LIBS.joinpath("UPNG.js").read_text(encoding="utf-8")
    tracer = LIBS.joinpath("imagetracer.js").read_text(encoding="utf-8")
    wrapper = ROOT.joinpath("ImageToSVG-ImageTracer/wrapper.js").read_text(encoding="utf-8")

    pako_boot = "var pako = {};\n(function(){\nvar module = { exports: pako };\nvar exports = pako;\n" + pako + "\n})();"

    upng = upng.replace(
        'if (typeof module == "object") {module.exports = UPNG;}  else {window.UPNG = UPNG;}\n'
        'if (typeof require == "function") {pako = require("pako");}  else {pako = window.pako;}',
        "var UPNG = UPNG || {};",
    )
    upng = upng.replace("var UPNG = {};", "var UPNG = {};", 1)

    tracer = re.sub(
        r"// export as AMD module[\s\S]*$",
        "ImageTracerLib = new ImageTracer();\n})();\n",
        tracer,
        count=1,
    )

    out = "\n".join(
        [
            "/* bundled ImageTracer.js + UPNG + pako inflate; plugin-local only */",
            "var ImageTracerLib;",
            pako_boot,
            upng,
            tracer,
            wrapper,
            "",
        ]
    )
    write(ROOT.joinpath("ImageToSVG-ImageTracer/script.js"), out)


def assemble_vtracer() -> None:
    wasm = LIBS.joinpath("package/pkg/vtracer_wasm_bg.wasm").read_bytes()
    glue = LIBS.joinpath("package/pkg/vtracer_wasm.js").read_text(encoding="utf-8")
    wrapper = ROOT.joinpath("ImageToSVG-VTracer/wrapper.js").read_text(encoding="utf-8")
    b64 = base64.b64encode(wasm).decode("ascii")

    glue = glue.replace("exports.vectorize_bytes = vectorize_bytes;", "VTracerWasm.vectorize_bytes = vectorize_bytes;")
    glue = glue.replace("exports.vectorize_rgba = vectorize_rgba;", "VTracerWasm.vectorize_rgba = vectorize_rgba;")
    glue = re.sub(
        r"const wasmPath = `\$\{__dirname\}/vtracer_wasm_bg\.wasm`;\nconst wasmBytes = require\('fs'\)\.readFileSync\(wasmPath\);\nconst wasmModule = new WebAssembly\.Module\(wasmBytes\);\nlet wasmInstance = new WebAssembly\.Instance\(wasmModule, __wbg_get_imports\(\)\);\nlet wasm = wasmInstance\.exports;\nwasm\.__wbindgen_start\(\);",
        "var wasmBytes;\n"
        "var wasmModule;\n"
        "var wasmInstance;\n"
        "var wasm;\n"
        "try {\n"
        "    if (typeof WebAssembly === \"undefined\") throw new Error(\"WebAssembly is unavailable.\");\n"
        "    wasmBytes = __vtracerDecodeBase64(VTRACER_WASM_BASE64);\n"
        "    wasmModule = new WebAssembly.Module(wasmBytes);\n"
        "    wasmInstance = new WebAssembly.Instance(wasmModule, __wbg_get_imports());\n"
        "    wasm = wasmInstance.exports;\n"
        "    wasm.__wbindgen_start();\n"
        "} catch (__vtracerInitError) {\n"
        "    wasm = null;\n"
        "    VTracerWasm.vectorize_bytes = undefined;\n"
        "    VTracerWasm.vectorize_rgba = undefined;\n"
        "}",
        glue,
        count=1,
    )

    decoder = """
if (typeof TextEncoder === "undefined") {
    function TextEncoder() {}
    TextEncoder.prototype.encode = function(text) {
        var out = [], i, code;
        text = String(text || "");
        for (i = 0; i < text.length; i += 1) {
            code = text.charCodeAt(i);
            if (code < 128) out.push(code);
            else if (code < 2048) out.push(192 | (code >> 6), 128 | (code & 63));
            else out.push(224 | (code >> 12), 128 | ((code >> 6) & 63), 128 | (code & 63));
        }
        return new Uint8Array(out);
    };
}
if (typeof TextDecoder === "undefined") {
    function TextDecoder() {}
    TextDecoder.prototype.decode = function(bytes) {
        var input = bytes || [];
        var out = "";
        var i = 0;
        var c, extra;
        while (i < input.length) {
            c = input[i];
            if (c < 128) {
                out += String.fromCharCode(c);
                i += 1;
            } else if (c < 224 && i + 1 < input.length) {
                out += String.fromCharCode(((c & 31) << 6) | (input[i + 1] & 63));
                i += 2;
            } else if (c < 240 && i + 2 < input.length) {
                out += String.fromCharCode(((c & 15) << 12) | ((input[i + 1] & 63) << 6) | (input[i + 2] & 63));
                i += 3;
            } else if (i + 3 < input.length) {
                extra = ((c & 7) << 18) | ((input[i + 1] & 63) << 12) | ((input[i + 2] & 63) << 6) | (input[i + 3] & 63);
                extra -= 65536;
                out += String.fromCharCode(55296 + (extra >> 10), 56320 + (extra & 1023));
                i += 4;
            } else {
                i += 1;
            }
        }
        return out;
    };
}
var VTracerWasm = {};
function __vtracerDecodeBase64(b64) {
    var cleaned = String(b64 || "").replace(/^data:[^;]+;base64,/, "").replace(/\\s+/g, "");
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var lookup = {};
    var i, ch, value, buffer, bits, outIndex, outputLength, output, padding;
    for (i = 0; i < 64; i += 1) lookup[alphabet.charAt(i)] = i;
    padding = 0;
    if (cleaned.length >= 1 && cleaned.charAt(cleaned.length - 1) === "=") padding += 1;
    if (cleaned.length >= 2 && cleaned.charAt(cleaned.length - 2) === "=") padding += 1;
    outputLength = Math.floor(cleaned.length * 3 / 4) - padding;
    if (outputLength < 0) outputLength = 0;
    output = new Uint8Array(outputLength);
    buffer = 0;
    bits = 0;
    outIndex = 0;
    for (i = 0; i < cleaned.length; i += 1) {
        ch = cleaned.charAt(i);
        if (ch === "=") break;
        value = lookup[ch];
        if (value === undefined) continue;
        buffer = (buffer << 6) | value;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            if (outIndex < outputLength) {
                output[outIndex] = (buffer >> bits) & 255;
                outIndex += 1;
            }
        }
    }
    return output;
}
"""
    out = "\n".join(
        [
            "/* bundled @visioncortex/vtracer WASM; plugin-local only */",
            "var VTRACER_WASM_BASE64 = \"" + b64 + "\";",
            decoder,
            glue,
            wrapper,
            "",
        ]
    )
    write(ROOT.joinpath("ImageToSVG-VTracer/script.js"), out)


if __name__ == "__main__":
    assemble_imagetracer()
    assemble_vtracer()
    for name in ("ImageToSVG-ImageTracer", "ImageToSVG-VTracer"):
        path = ROOT.joinpath(name, "script.js")
        print(name, path.stat().st_size)
