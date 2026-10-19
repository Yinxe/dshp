window.__ModuleLoader__.load({ id: "@dshp/file-change-viewer", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);

// src/client/FileChangeRow.tsx
var import_react4 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/shared/apply-patch.ts
var BEGIN_MARKER = "*** Begin Patch";
var END_MARKER = "*** End Patch";
var ADD_HEADER = "*** Add File:";
var DELETE_HEADER = "*** Delete File:";
var UPDATE_HEADER = "*** Update File:";
var MOVE_HEADER = "*** Move to:";
var END_OF_FILE = "*** End of File";
function stripHeredoc(input) {
  const match = /^(?:cat\s+)?<<['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\s*$/.exec(input);
  return match === null ? input : match[2];
}
function looksLikeUnifiedDiff(lines) {
  return lines.some((line) => line.startsWith("--- ") || line.startsWith("+++ ") || /^@@+ *-\d/.test(line));
}
function describeEnvelopeProblem(lines, beginAt, endAt) {
  if (beginAt >= 0 && endAt < 0) {
    const body2 = lines.slice(beginAt + 1).filter((line) => line.trim() !== "");
    if (body2.length === 0) {
      return "patch \u662F\u7A7A\u7684\uFF1A\u4F60\u53EA\u5199\u4E86 `*** Begin Patch`\uFF0C\u91CC\u9762\u6CA1\u6709\u4EFB\u4F55\u6BB5\u843D\u3002\u628A\u8981\u6539\u7684\u6BCF\u4E2A\u6587\u4EF6\u5199\u6210\u4E00\u4E2A\u6BB5\u843D\u518D\u53D1\u4E00\u6B21\uFF1A`*** Update File: \u8DEF\u5F84` / `*** Add File: \u8DEF\u5F84`\uFF0C\u6BCF\u6BB5\u91CC\u7528 `@@` \u5F00\u5934\uFF0C`-` \u662F\u65E7\u884C\u3001`+` \u662F\u65B0\u884C\uFF0C\u6700\u540E\u4EE5 `*** End Patch` \u6536\u5C3E\u3002";
    }
    return "patch \u7F3A\u6536\u5C3E\uFF1A\u6CA1\u6709\u627E\u5230 `*** End Patch`\uFF08\u8865\u4E01\u662F\u4E0D\u662F\u88AB\u622A\u65AD\u4E86\uFF1F\uFF09\u3002\u4FE1\u5C01\u5FC5\u987B\u4EE5 `*** Begin Patch` \u5F00\u5934\u3001\u4EE5 `*** End Patch` \u7ED3\u675F\u3002";
  }
  if (beginAt < 0 && endAt >= 0) {
    return "patch \u7F3A\u5F00\u5934\uFF1A\u6709 `*** End Patch` \u4F46\u6CA1\u6709 `*** Begin Patch`\u3002\u4FE1\u5C01\u5FC5\u987B\u4E24\u5934\u90FD\u5728\u3002";
  }
  if (beginAt >= 0 && endAt >= 0 && beginAt >= endAt) {
    return "patch \u7684\u987A\u5E8F\u4E0D\u5BF9\uFF1A`*** End Patch` \u51FA\u73B0\u5728 `*** Begin Patch` \u4E4B\u524D\u3002";
  }
  if (looksLikeUnifiedDiff(lines)) {
    return "patch \u683C\u5F0F\u4E0D\u5BF9\uFF1A\u8FD9\u770B\u8D77\u6765\u662F `patch(1)` / git \u7684 unified diff\uFF08`--- a/\u2026` + `@@ -1,3 +1,3 @@`\uFF09\uFF0C\u800C\u672C\u5DE5\u5177\u7528\u7684\u662F Codex \u98CE\u683C\u7684 `*** Begin Patch` \u4FE1\u5C01\uFF0C\u4E24\u8005\u4E0D\u80FD\u6DF7\u7528\u3002\u6539\u5199\u6210\uFF1A\n*** Begin Patch\n*** Update File: <\u8DEF\u5F84>\n@@\n<\u4E0A\u4E0B\u6587\u884C\uFF08\u884C\u9996\u4E00\u4E2A\u7A7A\u683C\uFF09>\n-<\u65E7\u884C>\n+<\u65B0\u884C>\n*** End Patch\n\uFF08\u884C\u53F7\u4E0D\u7528\u5199\uFF1B`@@` \u540E\u9762\u53EF\u4EE5\u8DDF\u4E00\u884C\u6587\u4EF6\u91CC\u771F\u5B9E\u5B58\u5728\u7684\u951A\u70B9\u3002\uFF09\u5982\u679C\u53EA\u662F\u60F3\u6539\u4E00\u5904\u5C0F\u5730\u65B9\uFF0C\u7528 edit \u5DE5\u5177\u66F4\u7701\u4E8B\u3002";
  }
  return "patch \u683C\u5F0F\u4E0D\u5BF9\uFF1A\u8865\u4E01\u5FC5\u987B\u5305\u5728 `*** Begin Patch` \u4E0E `*** End Patch` \u4E4B\u95F4\uFF08\u683C\u5F0F\u8BF4\u660E\u89C1\u5DE5\u5177\u63CF\u8FF0\uFF09\u3002";
}
function collectAddedLines(lines, start, end) {
  const body2 = [];
  let at = start;
  while (at < end) {
    const line = lines[at];
    if (line.startsWith("***")) break;
    if (line.startsWith("+")) body2.push(line.slice(1));
    at += 1;
  }
  return { contents: body2.join("\n"), next: at };
}
function collectChunks(lines, start, end) {
  const chunks = [];
  let at = start;
  while (at < end) {
    const line = lines[at];
    if (line.startsWith("***")) break;
    if (!line.startsWith("@@")) {
      at += 1;
      continue;
    }
    const context = line.slice(2).trim();
    const oldLines = [];
    const newLines = [];
    let added = 0;
    let removed = 0;
    let endOfFile = false;
    at += 1;
    while (at < end) {
      const inner = lines[at];
      if (inner === END_OF_FILE) {
        endOfFile = true;
        at += 1;
        break;
      }
      if (inner.startsWith("@@") || inner.startsWith("***")) break;
      const marker = inner.charAt(0);
      if (marker === " ") {
        const text = inner.slice(1);
        oldLines.push(text);
        newLines.push(text);
      } else if (marker === "-") {
        oldLines.push(inner.slice(1));
        removed += 1;
      } else if (marker === "+") {
        newLines.push(inner.slice(1));
        added += 1;
      }
      at += 1;
    }
    const chunk = { oldLines, newLines, added, removed };
    if (context !== "") chunk.context = context;
    if (endOfFile) chunk.endOfFile = true;
    chunks.push(chunk);
  }
  return { chunks, next: at };
}
function parseApplyPatch(text, options = {}) {
  const tolerant = options.tolerant === true;
  const cleaned = stripHeredoc(text.replace(/\r\n/g, "\n").trim());
  const lines = cleaned.split("\n");
  const beginAt = lines.findIndex((line) => line.trim() === BEGIN_MARKER);
  const endAt = lines.findIndex((line) => line.trim() === END_MARKER);
  if ((beginAt < 0 || endAt < 0 || beginAt >= endAt) && !tolerant) {
    throw new Error(describeEnvelopeProblem(lines, beginAt, endAt));
  }
  const from = beginAt < 0 ? 0 : beginAt + 1;
  const to = endAt < 0 ? lines.length : Math.max(endAt, from);
  const ops = [];
  let at = from;
  while (at < to) {
    const line = lines[at];
    if (line.startsWith(ADD_HEADER)) {
      const path = line.slice(ADD_HEADER.length).trim();
      if (path === "") {
        at += 1;
        continue;
      }
      const collected = collectAddedLines(lines, at + 1, to);
      ops.push({ type: "add", path, contents: collected.contents });
      at = collected.next;
      continue;
    }
    if (line.startsWith(DELETE_HEADER)) {
      const path = line.slice(DELETE_HEADER.length).trim();
      if (path !== "") ops.push({ type: "delete", path });
      at += 1;
      continue;
    }
    if (line.startsWith(UPDATE_HEADER)) {
      const path = line.slice(UPDATE_HEADER.length).trim();
      if (path === "") {
        at += 1;
        continue;
      }
      let next = at + 1;
      const moveLine = lines[next];
      let moveTo;
      if (moveLine !== void 0 && moveLine.startsWith(MOVE_HEADER)) {
        const value = moveLine.slice(MOVE_HEADER.length).trim();
        if (value !== "") moveTo = value;
        next += 1;
      }
      const collected = collectChunks(lines, next, to);
      ops.push(
        moveTo === void 0 ? { type: "update", path, chunks: collected.chunks } : { type: "update", path, moveTo, chunks: collected.chunks }
      );
      at = collected.next;
      continue;
    }
    at += 1;
  }
  return ops;
}
function previewDiffsOf(ops) {
  const out = [];
  for (const op of ops) {
    if (op.type === "add") {
      out.push({ path: op.path, oldText: null, newText: op.contents });
      continue;
    }
    if (op.type === "delete") {
      out.push({ path: op.path, oldText: "", newText: "" });
      continue;
    }
    const path = op.moveTo ?? op.path;
    const move = op.moveTo;
    if (op.chunks.length === 0) {
      out.push(
        move === void 0 ? { path, oldText: "", newText: "" } : { path, oldPath: op.path, oldText: "", newText: "" }
      );
      continue;
    }
    for (const chunk of op.chunks) {
      const diff = {
        path,
        oldText: chunk.oldLines.join("\n"),
        newText: chunk.newLines.join("\n")
      };
      out.push(move === void 0 ? diff : { ...diff, oldPath: op.path });
    }
  }
  return out;
}

// src/client/diff.ts
var EDIT_TOOL = "edit";
var WRITE_TOOL = "write";
var STR_REPLACE_TOOL = "str_replace_editor";
var PATCH_TOOL = "patch";
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isResultBlock(block) {
  return isRecord(block) && block["kind"] === "tool-result";
}
function isErrored(block) {
  return isRecord(block) && block["isError"] === true;
}
function readCallHead(block, settled) {
  const source = settled ? isRecord(block) ? block["call"] : null : block;
  if (!isRecord(source)) return null;
  const name = source["name"];
  const argsRaw = source["argsRaw"];
  if (typeof name !== "string" || typeof argsRaw !== "string") return null;
  return { name, argsRaw };
}
function readAppliedDiffs(meta) {
  if (!isRecord(meta)) return null;
  const diffs = meta["diffs"];
  if (!Array.isArray(diffs) || diffs.length === 0) return null;
  const out = [];
  for (const hunk of diffs) {
    if (!isRecord(hunk)) return null;
    const path = hunk["path"];
    const oldText = hunk["oldText"];
    const newText = hunk["newText"];
    if (typeof path !== "string") return null;
    if (oldText !== null && typeof oldText !== "string") return null;
    if (typeof newText !== "string") return null;
    const startLine = hunk["startLine"];
    const oldPath = hunk["oldPath"];
    out.push({
      path,
      oldText,
      newText,
      ...typeof startLine === "number" && startLine > 0 ? { startLine } : {},
      ...typeof oldPath === "string" && oldPath !== "" && oldPath !== path ? { oldPath } : {}
    });
  }
  return out;
}
function parseArgs(rawArgs) {
  try {
    const value = JSON.parse(rawArgs);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}
var SIMPLE_ESCAPES = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "	"
};
function readJsonString(raw, key) {
  const marker = '"' + key + '"';
  const at = raw.indexOf(marker);
  if (at < 0) return void 0;
  let i = at + marker.length;
  while (i < raw.length && raw[i] !== ":") i += 1;
  if (i >= raw.length) return void 0;
  i += 1;
  while (i < raw.length && (raw[i] === " " || raw[i] === "	" || raw[i] === "\n" || raw[i] === "\r")) i += 1;
  if (raw[i] !== '"') return void 0;
  i += 1;
  let out = "";
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === "\\") {
      const next = raw[i + 1];
      if (next === void 0) break;
      if (next === "u") {
        const hex = raw.slice(i + 2, i + 6);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) break;
        out += String.fromCharCode(parseInt(hex, 16));
        i += 6;
        continue;
      }
      out += SIMPLE_ESCAPES[next] ?? next;
      i += 2;
      continue;
    }
    if (ch === '"') break;
    out += ch;
    i += 1;
  }
  return out;
}
function previewPatch(text) {
  try {
    return previewDiffsOf(parseApplyPatch(text, { tolerant: true })).map((diff) => ({
      path: diff.path,
      oldText: diff.oldText,
      newText: diff.newText,
      ...diff.oldPath === void 0 ? {} : { oldPath: diff.oldPath },
      ...diff.startLine === void 0 ? {} : { startLine: diff.startLine }
    }));
  } catch {
    return [];
  }
}
function readIntended(toolName, rawArgs) {
  if (rawArgs === "") return null;
  const args = parseArgs(rawArgs);
  const complete = args !== null;
  const readString = (key) => {
    if (args !== null) {
      const value = args[key];
      if (typeof value === "string") return value;
    }
    return readJsonString(rawArgs, key);
  };
  if (toolName === PATCH_TOOL) {
    const text = readString("patch");
    if (text === void 0 || text.trim() === "") return null;
    const diffs = previewPatch(text);
    if (diffs.length === 0) return null;
    return { diffs, replaceAll: false, complete };
  }
  const path = readString("file_path") ?? readString("path");
  if (path === void 0 || path.trim() === "") return null;
  if (toolName === WRITE_TOOL) {
    const content = readString("content");
    if (content === void 0) return null;
    return { diffs: [{ path, oldText: null, newText: content }], replaceAll: false, complete };
  }
  if (toolName === STR_REPLACE_TOOL) {
    const command = readString("command");
    if (command === "create") {
      const fileText = readString("file_text");
      if (fileText === void 0) return null;
      return { diffs: [{ path, oldText: null, newText: fileText }], replaceAll: false, complete };
    }
    if (command === "str_replace") {
      const oldStr = readString("old_str");
      const newStr = readString("new_str");
      if (oldStr === void 0 || newStr === void 0) return null;
      return {
        diffs: [{ path, oldText: oldStr === "" ? null : oldStr, newText: newStr }],
        replaceAll: false,
        complete
      };
    }
    return null;
  }
  if (toolName !== EDIT_TOOL) return null;
  const oldString = readString("old_string");
  const newString = readString("new_string");
  if (oldString === void 0 || newString === void 0) return null;
  const replaceAll = args !== null && args["replace_all"] === true;
  return {
    diffs: [{ path, oldText: oldString === "" ? null : oldString, newText: newString }],
    replaceAll,
    complete
  };
}
function firstLine(text) {
  for (const line of text.split("\n")) {
    if (line.trim() !== "") return line;
  }
  return null;
}
function changedDiffOf(raw, rows) {
  const dels = [];
  const adds = [];
  for (const row of rows) {
    if (row.kind === "del") dels.push(row.text);
    else if (row.kind === "add") adds.push(row.text);
  }
  return {
    path: raw.path,
    oldText: dels.length === 0 ? null : dels.join("\n"),
    newText: adds.join("\n")
  };
}
function hasChange(hunk) {
  return hunk.changed.oldText !== null || hunk.changed.newText !== "";
}
var DIFF_CELL_LIMIT = 16e4;
var DIFF_LINE_LIMIT = 4e3;
function splitLines(text) {
  if (text === "") return [];
  const body2 = text.endsWith("\n") ? text.slice(0, -1) : text;
  return body2.split("\n");
}
function unifiedDiffRows(oldText, newText) {
  const before = splitLines(oldText === null ? "" : oldText);
  const after = splitLines(newText);
  if (before.length === 0) return after.map((text) => ({ kind: "add", text }));
  if (after.length === 0) return before.map((text) => ({ kind: "del", text }));
  const n = before.length;
  const m = after.length;
  const naive = () => [
    ...before.map((text) => ({ kind: "del", text })),
    ...after.map((text) => ({ kind: "add", text }))
  ];
  if (n * m > DIFF_CELL_LIMIT || n + m > DIFF_LINE_LIMIT) return naive();
  const width = m + 1;
  const dp = Array.from({ length: (n + 1) * width }, () => 0);
  for (let i2 = n - 1; i2 >= 0; i2 -= 1) {
    for (let j2 = m - 1; j2 >= 0; j2 -= 1) {
      dp[i2 * width + j2] = before[i2] === after[j2] ? dp[(i2 + 1) * width + (j2 + 1)] + 1 : Math.max(dp[(i2 + 1) * width + j2], dp[i2 * width + (j2 + 1)]);
    }
  }
  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      rows.push({ kind: "ctx", text: before[i] });
      i += 1;
      j += 1;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + (j + 1)]) {
      rows.push({ kind: "del", text: before[i] });
      i += 1;
    } else {
      rows.push({ kind: "add", text: after[j] });
      j += 1;
    }
  }
  while (i < n) {
    rows.push({ kind: "del", text: before[i] });
    i += 1;
  }
  while (j < m) {
    rows.push({ kind: "add", text: after[j] });
    j += 1;
  }
  return rows;
}
function toDiffText(rows) {
  return rows.map((row) => row.text).join("\n");
}
function toChangeHunk(raw) {
  const rows = unifiedDiffRows(raw.oldText, raw.newText);
  return { raw, rows, changed: changedDiffOf(raw, rows) };
}
function readErrorLine(block) {
  if (!isRecord(block)) return null;
  const content = block["content"];
  if (Array.isArray(content)) {
    const parts = [];
    for (const part of content) {
      if (isRecord(part) && typeof part["text"] === "string") parts.push(part["text"]);
    }
    const line = firstLine(parts.join("\n"));
    if (line !== null) return line;
  }
  const error2 = block["error"];
  if (isRecord(error2)) return String(error2["name"]) + ": " + String(error2["code"]);
  return null;
}
function buildModel(toolName, block) {
  const settled = isResultBlock(block);
  const call = readCallHead(block, settled);
  const name = call !== null && call.name !== "" ? call.name : toolName;
  const rawArgs = call !== null ? call.argsRaw : "";
  const state = settled ? isErrored(block) ? "error" : "ok" : "running";
  const errorText = state === "error" ? readErrorLine(block) : null;
  const meta = isRecord(block) ? block["meta"] : void 0;
  const applied = settled && state === "ok" ? readAppliedDiffs(meta) : null;
  const intended = readIntended(name, rawArgs);
  const hunks = (applied ?? intended?.diffs ?? []).map((raw) => toChangeHunk(raw));
  let badge;
  if (state === "error") badge = "rejected";
  else if (state === "ok") badge = "applied";
  else badge = intended !== null && !intended.complete ? "streaming" : "pending";
  return {
    state,
    hunks,
    badge,
    newFile: hunks.length > 0 && hunks.every((hunk) => hunk.raw.oldText === null),
    replaceAll: intended?.replaceAll === true,
    errorText,
    parsedArgs: parseArgs(rawArgs),
    rawArgs
  };
}
function isWindowsStylePath(path) {
  return /^[A-Za-z]:[\\/]/.test(path) || path.startsWith("\\\\");
}
function relativizeToCwd(text, cwd) {
  if (cwd === void 0 || cwd === "") return text;
  const root = cwd.replace(/[/\\]+$/, "");
  if (text.startsWith(root + "/") || text.startsWith(root + "\\")) return text.slice(root.length + 1);
  return text;
}
function abbreviateHomePath(path, home) {
  if (home === void 0 || home === "") return path;
  if (isWindowsStylePath(path) || isWindowsStylePath(home)) return path;
  const root = home.replace(/\/+$/, "");
  if (root === "" || root === "/") return path;
  if (path.replace(/\/+$/, "") === root) return "~";
  if (path.startsWith(root + "/")) return "~" + path.slice(root.length);
  return path;
}
function displayPath(path, cwd, home) {
  return abbreviateHomePath(relativizeToCwd(path, cwd), home);
}

// src/client/diffView.tsx
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime = require("react/jsx-runtime");
function countLines(text) {
  if (text === "") return 0;
  const body2 = text.endsWith("\n") ? text.slice(0, -1) : text;
  return body2.split("\n").length;
}
function diffSignRules(blockClass, delCount, addCount) {
  if (delCount <= 0 && addCount <= 0) return "";
  const rows = "." + blockClass + "[data-diff]>div:nth-of-type(2)";
  const delFrom = 2;
  const delTo = 1 + delCount;
  const addFrom = delTo + 1;
  const addTo = delTo + addCount;
  const col = "padding-inline-start:calc(3ch + 12px)";
  const rules = [];
  if (delCount > 0) {
    const delRange = rows + ">div:nth-of-type(n+" + delFrom + "):nth-of-type(-n+" + delTo + ")";
    rules.push(delRange + "{" + col + "}");
    rules.push(delRange + "::before{content:none}");
    rules.push(delRange + "::after{content:'-';color:var(--dsw-alias-state-error-primary)}");
  }
  if (addCount > 0) {
    const addRange = rows + ">div:nth-of-type(n+" + addFrom + "):nth-of-type(-n+" + addTo + ")";
    rules.push(addRange + "{" + col + "}");
    rules.push(addRange + "::before{content:none}");
    rules.push(addRange + "::after{content:'+';color:var(--dsw-alias-state-success-primary)}");
  }
  return rules.join("\n");
}
var HIGHLIGHT_MAX_LINES = 400;
var DIFF_MAX_LINES = 200;
var OVERFLOW_HINT = "\u5207\u6362\u5230 \xB1 \u5DEE\u5F02\u89C6\u56FE\u53EF\u5C55\u5F00";
function rangeSelectors(codeClass, rows, kind) {
  const selectors = [];
  let start = -1;
  for (let i = 0; i <= rows.length; i += 1) {
    const row = rows[i];
    const matches = row !== void 0 && row.kind === kind;
    if (matches && start < 0) start = i;
    if (!matches && start >= 0) {
      const from = start + 1;
      const to = i;
      selectors.push(
        from === to ? "." + codeClass + " code>.line:nth-child(" + from + ")" : "." + codeClass + " code>.line:nth-child(n+" + from + "):nth-child(-n+" + to + ")"
      );
      start = -1;
    }
  }
  return selectors;
}
function tintRules(codeClass, rows, startLine) {
  const rules = [];
  if (startLine > 1) rules.push("." + codeClass + " code{counter-reset:source-line " + (startLine - 1) + "}");
  const del = rangeSelectors(codeClass, rows, "del");
  if (del.length > 0) {
    rules.push(del.join(",") + "{counter-increment:none;background:var(--fcv-del-bg)}");
    rules.push(del.map((selector) => selector + ":before").join(",") + '{content:""}');
  }
  const add = rangeSelectors(codeClass, rows, "add");
  if (add.length > 0) rules.push(add.join(",") + "{background:var(--fcv-add-bg)}");
  return rules.join("\n");
}
function buildHighlight(args) {
  const overflow = args.rows.length > HIGHLIGHT_MAX_LINES;
  const shown = overflow ? args.rows.slice(0, HIGHLIGHT_MAX_LINES) : args.rows;
  return {
    rows: args.rows,
    shown,
    overflow,
    codeClass: args.codeClass,
    language: args.language,
    startLine: args.startLine,
    css: args.rows.length === 0 ? "" : tintRules(args.codeClass, shown, args.startLine)
  };
}
function createDiffBody(cn) {
  function context(lines, key, startLine) {
    if (lines.length === 0) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        className: cn.ctx,
        style: typeof startLine === "number" && startLine > 0 ? { counterReset: "dshp-fcv-num " + (startLine - 1) } : void 0,
        children: lines.map((text, at) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn.ctxLine, children: text === "" ? " " : text }, at))
      },
      key
    );
  }
  return {
    code(material, copyLabel, copiedLabel) {
      if (material.rows.length === 0) return [];
      return [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.CodeBlock,
          {
            code: toDiffText(material.shown),
            lang: material.language === null ? void 0 : material.language,
            className: cn.code + " " + material.codeClass,
            lineNumbers: true,
            copyLabel,
            copiedLabel
          },
          "code"
        ),
        material.overflow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn.muted, children: "\u2026 \u5176\u4F59 " + (material.rows.length - HIGHLIGHT_MAX_LINES) + " \u884C\u672A\u663E\u793A\uFF08" + OVERFLOW_HINT + "\uFF09" }, "overflow") : null
      ];
    },
    lines(args) {
      const afterLine = typeof args.beforeLine === "number" && args.beforeLine > 0 ? args.beforeLine + args.before.length + countLines(args.diff.newText) : void 0;
      const signCss = args.hunkClass === void 0 ? "" : diffSignRules(args.hunkClass, countLines(args.diff.oldText ?? ""), countLines(args.diff.newText));
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: cn.diffWrap, children: [
        signCss !== "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: signCss }, "sign") : null,
        context(args.before, "before", args.beforeLine),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.DiffBlock,
          {
            diffs: [args.diff],
            labels: args.labels,
            maxLines: args.maxLines ?? DIFF_MAX_LINES,
            className: cn.diff + " " + (args.hunkClass ?? "")
          }
        ),
        context(args.after, "after", afterLine)
      ] }, args.key);
    }
  };
}

// src/client/lang.ts
var LANG_BY_EXTENSION = {
  // C / C++
  c: "c",
  h: "c",
  cc: "cpp",
  cpp: "cpp",
  cxx: "cpp",
  hh: "cpp",
  hpp: "cpp",
  hxx: "cpp",
  // 其它语言
  cs: "csharp",
  go: "go",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  lua: "lua",
  php: "php",
  py: "python",
  pyi: "python",
  rb: "ruby",
  rs: "rust",
  swift: "swift",
  // JS 家族：官方只有 typescript 语法，js / jsx / mjs / cjs 一律归到它
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "typescript",
  jsx: "typescript",
  mjs: "typescript",
  cjs: "typescript",
  // 数据与配置
  json: "json",
  jsonc: "json",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  ini: "ini",
  cfg: "ini",
  conf: "ini",
  properties: "ini",
  // 标记与文档
  md: "markdown",
  markdown: "markdown",
  mdx: "mdx",
  html: "html",
  htm: "html",
  xml: "xml",
  xsl: "xml",
  xslt: "xml",
  svg: "xml",
  plist: "xml",
  // 样式
  css: "css",
  scss: "scss",
  less: "less",
  // 脚本
  sh: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  ksh: "shellscript",
  sql: "sql"
};
function languageOf(path) {
  if (typeof path !== "string" || path === "") return null;
  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  const base = path.slice(slash + 1);
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return null;
  const extension = base.slice(dot + 1).toLowerCase();
  return LANG_BY_EXTENSION[extension] ?? null;
}

// src/client/locate.ts
var import_react = require("react");
var BASE = "/ext/dshp-file-change-viewer/locate";
var MAX_BATCH = 20;
var EMPTY_HUNK = { line: null, before: [], after: [] };
var cache = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Set();
var pending = [];
var scheduled = false;
var currentCwd;
function keyOf(path, newText) {
  return path + "\0" + newText;
}
function notify() {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
    }
  }
}
async function flush() {
  scheduled = false;
  const batch = pending;
  pending = [];
  if (batch.length === 0) return;
  try {
    const response = await fetch(BASE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...currentCwd === void 0 ? {} : { cwd: currentCwd },
        items: batch.map((item) => ({
          path: item.path,
          newText: item.newText,
          ...item.oldText === "" ? {} : { oldText: item.oldText }
        }))
      })
    });
    const payload = await response.json();
    const results = Array.isArray(payload?.results) ? payload.results : [];
    batch.forEach((item, index) => {
      cache.set(item.key, sanitizeHunk(results[index]));
    });
  } catch {
    for (const item of batch) cache.set(item.key, null);
  }
  notify();
}
function sanitizeHunk(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_HUNK;
  const record = raw;
  const line = record["line"];
  const strings = (value) => Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  return {
    line: typeof line === "number" && line > 0 ? line : null,
    before: strings(record["before"]),
    after: strings(record["after"])
  };
}
function locateOf(path, newText, oldText, cwd) {
  const anchor = newText === "" ? oldText ?? "" : newText;
  if (path === "" || anchor === "") return null;
  if (cwd !== void 0) currentCwd = cwd;
  const key = keyOf(path, anchor);
  if (cache.has(key)) return cache.get(key) ?? null;
  if (!pending.some((item) => item.key === key) && pending.length < MAX_BATCH) {
    pending.push({
      key,
      path,
      newText: anchor,
      oldText: newText === "" ? "" : oldText ?? ""
    });
    if (!scheduled) {
      scheduled = true;
      setTimeout(() => {
        void flush();
      }, 0);
    }
  }
  return void 0;
}
function subscribeLines(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function useLines() {
  const [, bump] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    const listener = () => bump((tick) => tick + 1);
    return subscribeLines(listener);
  }, []);
  return 0;
}

// src/client/prefs.ts
var import_react2 = require("react");

// src/client/api.ts
var BASE2 = "/ext/dshp-file-change-viewer";
async function fetchState() {
  const response = await fetch(`${BASE2}/state`, { cache: "no-store" });
  return await response.json();
}
async function saveConfig(patch) {
  const response = await fetch(`${BASE2}/config`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch ?? {})
  });
  return await response.json();
}

// src/client/prefs.ts
var DEFAULT_PREFS = {
  view: "highlight",
  sectionsOpen: false,
  contextLines: 3,
  patchTool: false
};
function sanitizePrefs(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULT_PREFS };
  const record = raw;
  const contextLines = record["contextLines"];
  return {
    view: record["view"] === "diff" ? "diff" : "highlight",
    sectionsOpen: record["sectionsOpen"] === true,
    // 只认枚举里的四个值；Host 读不到 / 值坏了都回默认 3 行。
    contextLines: contextLines === 0 || contextLines === 5 || contextLines === 8 ? contextLines : 3,
    // 测试版能力：只有明确的 true 才算开（Host 读不到 / 值坏了都回默认关）。
    patchTool: record["patchTool"] === true
  };
}
var prefs = { ...DEFAULT_PREFS };
var phase = "idle";
var error = null;
var listeners2 = /* @__PURE__ */ new Set();
var started = false;
function notify2() {
  for (const listener of Array.from(listeners2)) {
    try {
      listener();
    } catch {
    }
  }
}
function messageOf(cause) {
  return String(cause?.message ?? cause);
}
function read() {
  phase = "loading";
  error = null;
  notify2();
  fetchState().then((response) => {
    if (response && response.ok) {
      prefs = sanitizePrefs(response.config);
      phase = "ready";
    } else {
      phase = "error";
      error = response && response.error || "\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25";
    }
    notify2();
  }).catch((cause) => {
    phase = "error";
    error = "\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF1A" + messageOf(cause);
    notify2();
  });
}
function write(field, previous) {
  const patch = {};
  if (field === "view") patch.view = prefs.view;
  else if (field === "sectionsOpen") patch.sectionsOpen = prefs.sectionsOpen;
  else if (field === "contextLines") patch.contextLines = prefs.contextLines;
  else patch.patchTool = prefs.patchTool;
  saveConfig(patch).then((response) => {
    if (response && response.ok) {
      prefs = sanitizePrefs(response.config);
      phase = "ready";
      error = null;
    } else {
      prefs = previous;
      phase = "error";
      error = "\u4FDD\u5B58\u5931\u8D25\uFF1A" + (response && response.error || "\u672A\u77E5\u9519\u8BEF");
    }
    notify2();
  }).catch((cause) => {
    prefs = previous;
    phase = "error";
    error = "\u4FDD\u5B58\u5931\u8D25\uFF1A" + messageOf(cause);
    notify2();
  });
}
function setPref(field, value) {
  const candidate = sanitizePrefs({ ...prefs, [field]: value });
  if (candidate[field] === prefs[field]) return;
  const previous = prefs;
  prefs = candidate;
  phase = "saving";
  error = null;
  notify2();
  write(field, previous);
}
function reload() {
  read();
}
function useTick() {
  const [, bump] = (0, import_react2.useState)(0);
  (0, import_react2.useEffect)(() => {
    const listener = () => bump((tick) => tick + 1);
    listeners2.add(listener);
    return () => {
      listeners2.delete(listener);
    };
  }, []);
}
function usePrefs() {
  useTick();
  return prefs;
}
function useSaveState() {
  useTick();
  return { phase, error };
}
function startPrefs() {
  if (started) return;
  started = true;
  if (typeof fetch === "function") read();
}

// src/client/session.ts
var import_react3 = require("react");
var NO_OVERRIDE = { expanded: null, view: null, rev: 0 };
var overrides = /* @__PURE__ */ new Map();
var listeners3 = /* @__PURE__ */ new Set();
var rev = 0;
function keyOf2(sessionId) {
  return typeof sessionId === "string" ? sessionId : "";
}
function notify3() {
  for (const listener of Array.from(listeners3)) {
    try {
      listener();
    } catch {
    }
  }
}
function write2(sessionId, next) {
  const key = keyOf2(sessionId);
  if (key === "") return;
  const prev = overrides.get(key) ?? NO_OVERRIDE;
  rev += 1;
  const merged = {
    expanded: next.expanded === void 0 ? prev.expanded : next.expanded,
    view: next.view === void 0 ? prev.view : next.view,
    rev
  };
  overrides.set(key, merged);
  notify3();
}
function useOverride(sessionId) {
  const [, bump] = (0, import_react3.useState)(0);
  (0, import_react3.useEffect)(() => {
    const listener = () => bump((tick) => tick + 1);
    listeners3.add(listener);
    return () => {
      listeners3.delete(listener);
    };
  }, []);
  return overrides.get(keyOf2(sessionId)) ?? NO_OVERRIDE;
}
function setExpanded(sessionId, expanded) {
  write2(sessionId, { expanded });
}
function setView(sessionId, view) {
  write2(sessionId, { view });
}
function resetOverride(sessionId) {
  const key = keyOf2(sessionId);
  if (key === "" || !overrides.delete(key)) return;
  rev += 1;
  notify3();
}

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = '._06IqUa_sep{background:var(--dsw-alias-label-caption);border-radius:1px;flex:none;width:2px;height:2px;margin:0 8px}._06IqUa_summary{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));color:var(--dsw-alias-label-tertiary);flex:auto;overflow:hidden}._06IqUa_path{text-overflow:ellipsis;white-space:nowrap;min-width:0;font:inherit;text-align:left;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));color:var(--dsw-alias-label-secondary);text-decoration:underline dotted;text-decoration-color:var(--dsw-alias-label-tertiary);text-underline-offset:3px;cursor:pointer;background:0 0;border:none;flex:0 auto;margin:0;padding:0;text-decoration-thickness:1px;overflow:hidden}._06IqUa_path:hover{color:var(--dsw-alias-label-primary);text-decoration-color:currentColor}._06IqUa_stat{white-space:nowrap;font-family:var(--ds-font-family-code);font-size:calc(var(--dsh-content-font-size-secondary,13px) - 2px);flex:none;align-items:center;gap:10px;margin-left:10px;display:inline-flex;transform:translateY(.5px)}._06IqUa_statPart{align-items:center;gap:3px;display:inline-flex}._06IqUa_add{color:var(--dsw-alias-state-success-primary)}._06IqUa_del{color:var(--dsw-alias-state-error-primary)}._06IqUa_note{color:var(--dsw-alias-label-caption)}._06IqUa_errorSummary{font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(24px + var(--dsh-content-font-delta,0px));color:var(--dsw-alias-state-error-primary);text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}._06IqUa_body{--fcv-del-bg:var(--dsw-alias-interactive-bg-hover-danger);--fcv-add-bg:var(--dsw-alias-state-success-tertiary);flex-direction:column;display:flex}._06IqUa_inspect{border:.5px solid var(--dsw-alias-border-l3);corner-shape:round;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);cursor:pointer;opacity:0;border-radius:999px;align-self:flex-start;align-items:center;gap:4px;margin:4px 0 2px 4px;padding:2px 8px;font-size:11px;line-height:16px;transition:opacity .1s;display:inline-flex}._06IqUa_rowRoot:hover ._06IqUa_inspect,._06IqUa_inspect:focus-visible{opacity:1}._06IqUa_inspect:hover{background:var(--dsw-alias-interactive-bg-hover-solid);color:var(--dsw-alias-label-primary)}._06IqUa_card{border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-markdown-code-block);border-radius:12px;margin:6px 0 8px 4px;overflow:hidden}._06IqUa_card ._06IqUa_cardRow{background:var(--dsw-alias-markdown-code-block-banner);border-bottom:.5px solid var(--dsw-alias-border-l1);gap:4px;height:auto;min-height:30px;padding:0 10px}._06IqUa_card ._06IqUa_cardTitle{min-width:0;color:var(--dsw-alias-label-secondary);flex:1;align-items:center;font-size:12px;display:inline-flex}._06IqUa_cardName{align-items:center;gap:6px;min-width:0;max-width:100%;display:inline-flex}._06IqUa_cardNameText{text-overflow:ellipsis;white-space:nowrap;font-family:var(--ds-font-family-code);overflow:hidden}._06IqUa_fileIcon{flex:none;align-items:center;display:inline-flex}._06IqUa_card ._06IqUa_cardRow:hover ._06IqUa_cardTitle{color:var(--dsw-alias-label-primary)}._06IqUa_viewGroup{flex:none;align-items:center;gap:4px;margin-left:6px;display:inline-flex}._06IqUa_viewPill{border-radius:10px;gap:4px;height:20px;padding:0 8px;font-size:11px;line-height:18px}._06IqUa_viewPill svg{flex:none}._06IqUa_card ._06IqUa_code{--dsl-code-block-line-white-space:pre;border-radius:0;margin:0;background:0 0!important}._06IqUa_card ._06IqUa_code>div:has([data-code-block-banner]),._06IqUa_card ._06IqUa_code [data-code-block-banner]{display:none}._06IqUa_card ._06IqUa_code pre{border-radius:0;padding:8px 0;background:0 0!important}._06IqUa_card ._06IqUa_code pre code>.line{box-sizing:border-box;width:max-content;min-width:100%;padding-inline-start:calc(var(--dsl-code-block-line-number-width) + 26px)}._06IqUa_card ._06IqUa_code pre code>.line:before{inset-inline-start:14px}._06IqUa_card ._06IqUa_diff[data-diff]>div:first-of-type,._06IqUa_card ._06IqUa_diff[data-diff]>div:nth-of-type(2)>div:first-child{display:none}._06IqUa_diffWrap{flex-direction:column;display:flex;overflow:auto hidden}._06IqUa_ctx{font:var(--dsw-font-markdown-code-block);color:var(--dsw-alias-label-tertiary);white-space:pre;padding:0 14px}._06IqUa_card ._06IqUa_diff[data-diff]>div:nth-of-type(2)>div{position:relative}._06IqUa_card ._06IqUa_diff[data-diff]>div:nth-of-type(2)>div:after{text-align:end;opacity:.7;user-select:none;pointer-events:none;width:3ch;position:absolute;inset-inline-start:0}._06IqUa_ctxLine{counter-increment:dshp-fcv-num;white-space:pre;min-height:22px}._06IqUa_ctxLine:before{content:counter(dshp-fcv-num);text-align:end;width:3ch;color:var(--dsw-alias-label-tertiary);opacity:.7;user-select:none;margin-inline-end:12px;display:inline-block}._06IqUa_card ._06IqUa_ctx:first-child{padding-top:8px}._06IqUa_card ._06IqUa_ctx:last-child{padding-bottom:8px}._06IqUa_card ._06IqUa_diff[data-diff]>div:nth-of-type(2){overflow:visible}._06IqUa_diffWrap>._06IqUa_ctx+._06IqUa_diff[data-diff]>div:nth-of-type(2){padding-top:0}._06IqUa_diffWrap>._06IqUa_diff[data-diff]:has(+._06IqUa_ctx)>div:nth-of-type(2){padding-bottom:0}._06IqUa_card ._06IqUa_diff{border-radius:0;margin:0}._06IqUa_muted{color:var(--dsw-alias-label-tertiary);margin:0;padding:6px 10px 8px;font-size:12px;line-height:18px}._06IqUa_page{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;display:flex}._06IqUa_intro{color:var(--dsw-alias-label-tertiary);margin:0 0 4px;font-size:14px;line-height:22px}._06IqUa_section{flex-direction:column;width:100%;display:flex}._06IqUa_sectionHead{color:var(--dsw-alias-label-secondary);padding:14px 0 2px;font-size:12px;font-weight:500;line-height:18px}._06IqUa_settingRow{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}._06IqUa_section ._06IqUa_settingRow:last-child{border-bottom:none}._06IqUa_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}._06IqUa_settingBlock{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:12px;padding:16px 0;display:flex}._06IqUa_section ._06IqUa_settingBlock:last-child{border-bottom:none}._06IqUa_blockText{flex-direction:column;gap:4px;display:flex}._06IqUa_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}._06IqUa_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}._06IqUa_barEnd{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px;padding:12px 0;display:flex}._06IqUa_notice{margin:0;font-size:12px;line-height:18px}._06IqUa_noticeErr{color:var(--dsw-alias-state-error-primary)}._06IqUa_badge{white-space:nowrap;border-radius:10px;align-items:center;height:20px;padding:0 8px;font-size:11px;font-weight:500;line-height:20px;display:inline-flex}._06IqUa_badgeOk{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}._06IqUa_badgeWarn{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}._06IqUa_badgeMuted{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-caption)}._06IqUa_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;align-items:center;gap:12px;max-width:100%;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}._06IqUa_selector:hover{background:var(--dsw-alias-interactive-bg-hover)}._06IqUa_selector:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}._06IqUa_selectorLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}._06IqUa_chevron{flex:none}._06IqUa_switch{box-sizing:border-box;background:var(--dsw-alias-border-l3);cursor:pointer;border:0;border-radius:10px;flex:none;width:36px;height:20px;padding:2px;position:relative}._06IqUa_switchOn{background:var(--dsw-alias-brand-primary)}._06IqUa_switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}._06IqUa_thumb{background:var(--dsw-alias-label-primary-foreground);border-radius:50%;width:16px;height:16px;transition:transform .12s;display:block}._06IqUa_switchOn ._06IqUa_thumb{transform:translate(16px)}@media (prefers-reduced-motion:reduce){._06IqUa_thumb{transition:none}}._06IqUa_viewCards{grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;display:grid}._06IqUa_viewCard{background:var(--dsw-alias-bg-base);cursor:pointer;border:.5px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:8px;padding:12px;transition:border-color .12s,background .12s;display:flex}._06IqUa_viewCard:hover{border-color:var(--dsw-alias-border-l4);background:var(--dsw-alias-interactive-bg-hover)}._06IqUa_viewCardOn,._06IqUa_viewCardOn:hover{border-color:var(--dsw-alias-brand-primary)}._06IqUa_viewCard:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}._06IqUa_viewCardHead{align-items:center;gap:8px;display:flex}._06IqUa_viewCardName{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}._06IqUa_viewCardDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}._06IqUa_radio{box-sizing:border-box;border:1.5px solid var(--dsw-alias-border-l4);border-radius:50%;flex:none;width:16px;height:16px;position:relative}._06IqUa_viewCardOn ._06IqUa_radio{border-color:var(--dsw-alias-brand-primary)}._06IqUa_viewCardOn ._06IqUa_radio:after{content:"";background:var(--dsw-alias-brand-primary);border-radius:50%;position:absolute;inset:3px}._06IqUa_pvBody{pointer-events:none;--fcv-del-bg:var(--dsw-alias-interactive-bg-hover-danger);--fcv-add-bg:var(--dsw-alias-state-success-tertiary);background:var(--dsw-alias-markdown-code-block);border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;flex-direction:column;display:flex;overflow:hidden}._06IqUa_pvCodeBox{flex-direction:column;display:flex}._06IqUa_pvCode{--dsl-code-block-line-white-space:pre;border-radius:0;margin:0;background:0 0!important}._06IqUa_pvCode>div:has([data-code-block-banner]),._06IqUa_pvCode [data-code-block-banner]{display:none}._06IqUa_pvCode pre{border-radius:0;padding:8px 0;background:0 0!important}._06IqUa_pvCode pre code>.line{box-sizing:border-box;width:max-content;min-width:100%;padding-inline-start:calc(var(--dsl-code-block-line-number-width) + 26px)}._06IqUa_pvCode pre code>.line:before{inset-inline-start:14px}._06IqUa_pvDiff{border-radius:0;margin:0}._06IqUa_pvDiffWrap{flex-direction:column;display:flex;overflow:auto hidden}._06IqUa_pvCtx{font:var(--dsw-font-markdown-code-block);color:var(--dsw-alias-label-tertiary);white-space:pre;padding:0 14px}._06IqUa_pvDiff[data-diff]>div:nth-of-type(2){overflow:visible}._06IqUa_pvCtxLine{white-space:pre;min-height:22px}._06IqUa_pvMuted{color:var(--dsw-alias-label-tertiary);margin:0;padding:6px 10px 8px;font-size:12px;line-height:18px}._06IqUa_headCtl{border:.5px solid var(--dsw-alias-border-l4);border-radius:14px;align-items:stretch;height:28px;display:inline-flex;overflow:hidden}._06IqUa_headCtlOverridden{border-color:var(--dsw-alias-brand-primary)}._06IqUa_headBtn{color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;font-family:var(--dsw-font-family);background:0 0;border:0;align-items:center;gap:5px;padding:5px 8px;font-size:11px;font-weight:400;line-height:16px;display:inline-flex}._06IqUa_headBtn:hover,._06IqUa_headBtn:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}._06IqUa_headBtn:focus-visible{outline:none}._06IqUa_headSep{background:var(--dsw-alias-border-l4);flex:none;width:.5px}._06IqUa_headLabel{color:var(--dsw-alias-label-secondary)}._06IqUa_headChevron{flex:none;transition:transform .12s}._06IqUa_headChevronShut{transform:rotate(-90deg)}._06IqUa_headReset{color:var(--dsw-alias-label-secondary);cursor:pointer;border:0;border-left:.5px solid var(--dsw-alias-border-l4);background:0 0;align-items:center;padding:5px 7px;display:inline-flex}._06IqUa_headReset:hover,._06IqUa_headReset:focus-visible{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}._06IqUa_headReset:focus-visible{outline:none}@media (prefers-reduced-motion:reduce){._06IqUa_headChevron{transition:none}}';
var tagId = "@dshp/file-change-viewer/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/file-change-viewer");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "add": "_06IqUa_add", "badge": "_06IqUa_badge", "badgeMuted": "_06IqUa_badgeMuted", "badgeOk": "_06IqUa_badgeOk", "badgeWarn": "_06IqUa_badgeWarn", "barEnd": "_06IqUa_barEnd", "blockText": "_06IqUa_blockText", "body": "_06IqUa_body", "card": "_06IqUa_card", "cardName": "_06IqUa_cardName", "cardNameText": "_06IqUa_cardNameText", "cardRow": "_06IqUa_cardRow", "cardTitle": "_06IqUa_cardTitle", "chevron": "_06IqUa_chevron", "code": "_06IqUa_code", "ctx": "_06IqUa_ctx", "ctxLine": "_06IqUa_ctxLine", "del": "_06IqUa_del", "desc": "_06IqUa_desc", "diff": "_06IqUa_diff", "diffWrap": "_06IqUa_diffWrap", "errorSummary": "_06IqUa_errorSummary", "fileIcon": "_06IqUa_fileIcon", "headBtn": "_06IqUa_headBtn", "headChevron": "_06IqUa_headChevron", "headChevronShut": "_06IqUa_headChevronShut", "headCtl": "_06IqUa_headCtl", "headCtlOverridden": "_06IqUa_headCtlOverridden", "headLabel": "_06IqUa_headLabel", "headReset": "_06IqUa_headReset", "headSep": "_06IqUa_headSep", "inspect": "_06IqUa_inspect", "intro": "_06IqUa_intro", "muted": "_06IqUa_muted", "note": "_06IqUa_note", "notice": "_06IqUa_notice", "noticeErr": "_06IqUa_noticeErr", "page": "_06IqUa_page", "path": "_06IqUa_path", "pvBody": "_06IqUa_pvBody", "pvCode": "_06IqUa_pvCode", "pvCodeBox": "_06IqUa_pvCodeBox", "pvCtx": "_06IqUa_pvCtx", "pvCtxLine": "_06IqUa_pvCtxLine", "pvDiff": "_06IqUa_pvDiff", "pvDiffWrap": "_06IqUa_pvDiffWrap", "pvMuted": "_06IqUa_pvMuted", "radio": "_06IqUa_radio", "rowRoot": "_06IqUa_rowRoot", "rowText": "_06IqUa_rowText", "section": "_06IqUa_section", "sectionHead": "_06IqUa_sectionHead", "selector": "_06IqUa_selector", "selectorLabel": "_06IqUa_selectorLabel", "sep": "_06IqUa_sep", "settingBlock": "_06IqUa_settingBlock", "settingRow": "_06IqUa_settingRow", "stat": "_06IqUa_stat", "statPart": "_06IqUa_statPart", "summary": "_06IqUa_summary", "switch": "_06IqUa_switch", "switchOn": "_06IqUa_switchOn", "thumb": "_06IqUa_thumb", "title": "_06IqUa_title", "viewCard": "_06IqUa_viewCard", "viewCardDesc": "_06IqUa_viewCardDesc", "viewCardHead": "_06IqUa_viewCardHead", "viewCardName": "_06IqUa_viewCardName", "viewCardOn": "_06IqUa_viewCardOn", "viewCards": "_06IqUa_viewCards", "viewGroup": "_06IqUa_viewGroup", "viewPill": "_06IqUa_viewPill" };

// src/client/FileChangeRow.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var RAW_MAX_CHARS = 4e3;
var RAW_ARGS_LABEL = "\u539F\u59CB\u53C2\u6570";
var WAITING_TEXT = "\u7B49\u5F85\u53C2\u6570\u2026";
var NEW_FILE_LABEL = "\u65B0\u6587\u4EF6";
var REPLACE_ALL_LABEL = "\u5168\u90E8\u66FF\u6362";
var PATCH_TITLE = "\u8865\u4E01";
var UNAVAILABLE_TEXT = "\u53C2\u6570\u4E0D\u53EF\u7528";
var ICON_SIZE = 12;
var FILE_ICON_SIZE = 14;
var VIEW_GROUP_LABEL = "\u5DEE\u5F02\u5C55\u793A\u65B9\u5F0F";
var VIEW_HIGHLIGHT_LABEL = "\u9AD8\u4EAE";
var VIEW_DIFF_LABEL = "\xB1 \u5DEE\u5F02";
var VIEW_HIGHLIGHT_TITLE = "\u5355\u4EE3\u7801\u5757\u7EDF\u4E00 diff\uFF1A\u6574\u884C\u7EA2\u7EFF\u5E95\u8272 + \u884C\u53F7 + \u8BED\u6CD5\u9AD8\u4EAE";
var VIEW_DIFF_TITLE = "\u5B98\u65B9 \xB1 \u5DEE\u5F02\u89C6\u56FE\uFF1A\u9010\u884C\u7EA2\u7EFF\u6587\u5B57\uFF0C\u7D27\u51D1\uFF0C\u8D85\u957F\u4E2D\u90E8\u6298\u53E0";
var TINT_CLASS_PREFIX = "dshp-fcv-lines-";
var diffBody = createDiffBody({
  code: styles_module_css_default.code,
  diff: styles_module_css_default.diff,
  diffWrap: styles_module_css_default.diffWrap,
  ctx: styles_module_css_default.ctx,
  ctxLine: styles_module_css_default.ctxLine,
  muted: styles_module_css_default.muted
});
var anonymousCardSeq = 0;
function cardKeyOf(callId) {
  const cleaned = typeof callId === "string" ? callId.replace(/[^A-Za-z0-9_-]/g, "") : "";
  if (cleaned !== "") return cleaned.slice(0, 40);
  anonymousCardSeq += 1;
  return "anon" + anonymousCardSeq;
}
function countLines2(text) {
  if (text === "") return 0;
  const body2 = text.endsWith("\n") ? text.slice(0, -1) : text;
  return body2.split("\n").length;
}
function nodeTitle(node) {
  return node;
}
function diffLabels(t) {
  return {
    codeLabel: t("codeBlock.title"),
    wrapLabel: t("codeBlock.wrap"),
    unwrapLabel: t("codeBlock.unwrap"),
    copy: t("copy"),
    copied: t("copied"),
    collapseAria: t("diff.collapseAria"),
    expandAria: (hidden) => t("diff.expandAria", { count: hidden }),
    collapse: t("collapse"),
    expand: (hidden) => t("diff.expandRest", { count: hidden })
  };
}
function newUiState(callId, rev2) {
  return { callId, rev: rev2, row: null, sections: {}, views: {} };
}
function FileChangeRow(props) {
  const t = typeof props.t === "function" ? props.t : (key) => key;
  const prefs2 = usePrefs();
  useLines();
  const override = useOverride(props.sessionId);
  const rev2 = override.rev;
  const [ui, setUi] = (0, import_react4.useState)(() => newUiState(props.callId, rev2));
  const bound = ui.callId === props.callId && ui.rev === rev2 ? ui : newUiState(props.callId, rev2);
  const patchUi = (fields) => {
    setUi((prev) => {
      const base = prev.callId === props.callId && prev.rev === rev2 ? prev : newUiState(props.callId, rev2);
      return { ...base, ...fields };
    });
  };
  const defaultOpen = override.expanded ?? prefs2.sectionsOpen;
  const rowOpen = bound.row ?? defaultOpen;
  const model = buildModel(props.toolName, props.block);
  const changed = model.hunks.some(hasChange);
  const statDiffs = changed ? model.hunks.map((hunk) => hunk.changed) : model.hunks.map((hunk) => hunk.raw);
  const totals = (0, import_dsh_client_ui_primitives2.diffTotals)(statDiffs);
  const first = model.hunks[0];
  const rawPath = first === void 0 ? void 0 : first.raw.path;
  const locatedHunks = model.hunks.map(
    (hunk) => locateOf(hunk.raw.path, hunk.raw.newText, hunk.raw.oldText, props.cwd)
  );
  const startLines = model.hunks.map((hunk, index) => {
    if (typeof hunk.raw.startLine === "number" && hunk.raw.startLine > 0) return hunk.raw.startLine;
    const located = locatedHunks[index];
    const line = located === null || located === void 0 ? null : located.line;
    return typeof line === "number" && line > 0 ? line : 1;
  });
  const contexts = model.hunks.map((_hunk, index) => {
    const located = locatedHunks[index];
    const want = prefs2.contextLines;
    if (located === null || located === void 0 || want === 0) return { before: [], after: [] };
    return { before: located.before.slice(-want), after: located.after.slice(0, want) };
  });
  const rowsOf = (index) => {
    const hunk = model.hunks[index];
    if (hunk === void 0) return [];
    const context = contexts[index] ?? { before: [], after: [] };
    return [
      ...context.before.map((text) => ({ kind: "ctx", text })),
      ...hunk.rows,
      ...context.after.map((text) => ({ kind: "ctx", text }))
    ];
  };
  const startOf = (index) => Math.max(1, (startLines[index] ?? 1) - (contexts[index]?.before.length ?? 0));
  const stopKeyToggle = (event) => {
    if (event.key === "Enter" || event.key === " ") event.stopPropagation();
  };
  const renderStat = (added, removed) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: styles_module_css_default.stat, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: styles_module_css_default.statPart + " " + styles_module_css_default.add, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconPlusOutlineRegular, { size: ICON_SIZE }),
      String(added)
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: styles_module_css_default.statPart + " " + styles_module_css_default.del, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: ICON_SIZE, height: ICON_SIZE, viewBox: "0 0 16 16", "aria-hidden": true, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: 3, y: 7.25, width: 10, height: 1.5, rx: 0.75, fill: "currentColor" }) }),
      String(removed)
    ] })
  ] });
  const renderViewSwitch = (index, current) => {
    const pill = (view, label, icon) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      import_dsh_client_ui_primitives2.Pill,
      {
        active: current === view,
        className: styles_module_css_default.viewPill,
        title: view === "highlight" ? VIEW_HIGHLIGHT_TITLE : VIEW_DIFF_TITLE,
        onClick: (event) => {
          event.stopPropagation();
          patchUi({ views: { ...bound.views, [index]: view } });
        },
        children: [
          icon,
          label
        ]
      },
      view
    );
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: styles_module_css_default.viewGroup, role: "group", "aria-label": VIEW_GROUP_LABEL, children: [
      pill("highlight", VIEW_HIGHLIGHT_LABEL, /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconCodeOutlineRegular, { size: ICON_SIZE })),
      pill("diff", VIEW_DIFF_LABEL, /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconBranchOutlineRegular, { size: ICON_SIZE }))
    ] });
  };
  const renderPath = (path, line) => {
    const label = displayPath(path, props.cwd, props.home);
    const openFile = props.openFile;
    if (typeof openFile !== "function") {
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.summary, children: label });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "button",
      {
        type: "button",
        className: styles_module_css_default.path,
        title: path,
        onClick: (event) => {
          event.stopPropagation();
          if (typeof line === "number" && line > 1) openFile(path, { line });
          else openFile(path);
        },
        onKeyDown: stopKeyToggle,
        children: label
      }
    );
  };
  const unavailableText = model.state === "running" ? WAITING_TEXT : UNAVAILABLE_TEXT;
  const failed = model.state === "error" && model.errorText !== null;
  const summaryChildren = failed ? [/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.errorSummary, children: model.errorText })] : [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.sep }),
    rawPath === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.summary, children: unavailableText }) : renderPath(rawPath, startLines[0]),
    model.hunks.length > 0 ? renderStat(totals.added, totals.removed) : null,
    model.newFile ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.stat + " " + styles_module_css_default.note, children: NEW_FILE_LABEL }) : null,
    model.replaceAll ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.stat + " " + styles_module_css_default.note, children: REPLACE_ALL_LABEL }) : null
  ];
  const cardKey = cardKeyOf(props.callId);
  const highlightHunks = model.hunks.map(
    (_hunk, index) => buildHighlight({
      rows: rowsOf(index),
      startLine: startOf(index),
      language: languageOf(model.hunks[index]?.raw.path ?? ""),
      codeClass: TINT_CLASS_PREFIX + cardKey + "-" + index
    })
  );
  const tintCss = highlightHunks.map((hunk) => hunk.css).filter((css2) => css2 !== "").join("\n");
  const renderHighlight = (index) => {
    const hunk = highlightHunks[index];
    if (hunk === void 0) return [];
    return diffBody.code(hunk, t("copy"), t("copied"));
  };
  const renderDiff = (index, fallback2) => {
    const context = contexts[index] ?? { before: [], after: [] };
    return diffBody.lines({
      diff: statDiffs[index] ?? fallback2,
      before: context.before,
      after: context.after,
      labels: diffLabels(t),
      key: "diff" + index,
      beforeLine: context.before.length > 0 ? startOf(index) : void 0,
      hunkClass: TINT_CLASS_PREFIX + cardKey + "-d" + index
    });
  };
  const renderSections = () => {
    const nodes = [];
    const viewOf = (index) => bound.views[index] ?? override.view ?? prefs2.view;
    if (tintCss !== "" && model.hunks.some((_hunk, index) => viewOf(index) === "highlight")) {
      nodes.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)("style", { children: tintCss }, "tint"));
    }
    model.hunks.forEach((hunk, index) => {
      const shown = statDiffs[index] ?? hunk.raw;
      const open = bound.sections[index] ?? defaultOpen;
      const view = viewOf(index);
      nodes.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.card, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_dsh_client_ui_primitives2.DisclosureRow,
          {
            rowClassName: styles_module_css_default.cardRow,
            titleClassName: styles_module_css_default.cardTitle,
            icon: null,
            title: nodeTitle(
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: styles_module_css_default.cardName, children: [
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.FileTypeIcon, { path: hunk.raw.path, size: FILE_ICON_SIZE, className: styles_module_css_default.fileIcon }),
                /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.cardNameText, children: hunk.raw.oldPath === void 0 ? displayPath(hunk.raw.path, props.cwd, props.home) : displayPath(hunk.raw.oldPath, props.cwd, props.home) + " \u2192 " + displayPath(hunk.raw.path, props.cwd, props.home) })
              ] })
            ),
            open,
            expandable: true,
            expandOnRowClick: true,
            keepContentWhenOpen: true,
            onToggle: () => patchUi({ sections: { ...bound.sections, [index]: !open } }),
            collapsedContent: [
              // 卡头统计与行头同口径（语义变更），所以卡头数字和它自己的高亮 / ± 视图永远对得上。
              renderStat(countLines2(shown.newText), countLines2(shown.oldText ?? "")),
              renderViewSwitch(index, view)
            ],
            children: view === "highlight" ? renderHighlight(index) : renderDiff(index, hunk.raw)
          }
        ) }, "card" + index)
      );
    });
    return nodes;
  };
  const fallback = model.parsedArgs !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_dsh_client_ui_primitives2.JsonBlock,
    {
      label: RAW_ARGS_LABEL,
      payload: model.parsedArgs,
      defaultOpen: true,
      truncatedLabel: (total) => "\u5DF2\u622A\u65AD\uFF0C\u5171 " + total + " \u5B57\u7B26"
    }
  ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.summary, children: model.rawArgs === "" ? unavailableText : model.rawArgs.slice(0, RAW_MAX_CHARS) + (model.rawArgs.length > RAW_MAX_CHARS ? "\u2026" : "") });
  const inspectNode = typeof props.inspect === "function" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "button",
    {
      type: "button",
      className: styles_module_css_default.inspect,
      onClick: (event) => {
        event.stopPropagation();
        if (typeof props.inspect === "function") props.inspect();
      },
      onKeyDown: stopKeyToggle,
      children: t("row.inspect")
    }
  ) : null;
  const body2 = /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.body, children: [
    model.hunks.length === 0 ? fallback : renderSections(),
    inspectNode
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_dsh_client_ui_primitives2.DisclosureRow,
    {
      className: styles_module_css_default.rowRoot,
      icon: model.state === "error" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.StateDot, { state: "error" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconEditOutlineRegular, { size: 14 }),
      title: props.toolName === "patch" ? PATCH_TITLE : t(props.toolName === "write" ? "tool.title.write" : "tool.title.edit"),
      open: rowOpen,
      expandable: true,
      expandOnRowClick: true,
      keepContentWhenOpen: true,
      onToggle: () => patchUi({ row: !rowOpen }),
      collapsedContent: summaryChildren,
      children: body2
    }
  );
}

// src/client/FileChangeViewerSection.tsx
var import_react5 = require("react");
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/viewCards.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var SAMPLE_PATH = "src/greet.ts";
var SAMPLE_OLD = ["export function greet(name: string) {", "  return 'Hello, ' + name", "}"].join("\n");
var SAMPLE_NEW = [
  "export function greet(name: string) {",
  "  const target = name.trim()",
  "  return `Hello, ${target}!`",
  "}"
].join("\n");
var SAMPLE_RAW = { path: SAMPLE_PATH, oldText: SAMPLE_OLD, newText: SAMPLE_NEW };
var SAMPLE_HUNK = toChangeHunk(SAMPLE_RAW);
var PREVIEW_LINES_CLASS = "dshp-fcv-pvLines";
var SAMPLE_HIGHLIGHT = buildHighlight({
  rows: unifiedDiffRows(SAMPLE_OLD, SAMPLE_NEW),
  startLine: 1,
  language: languageOf(SAMPLE_PATH),
  codeClass: PREVIEW_LINES_CLASS
});
var PREVIEW_LABELS = {
  codeLabel: "\u4EE3\u7801\u5757",
  wrapLabel: "\u81EA\u52A8\u6362\u884C",
  unwrapLabel: "\u53D6\u6D88\u81EA\u52A8\u6362\u884C",
  copy: "\u590D\u5236",
  copied: "\u5DF2\u590D\u5236",
  collapseAria: "\u6298\u53E0\u5DEE\u5F02",
  expandAria: (hidden) => "\u5C55\u5F00\u5176\u4F59 " + hidden + " \u884C",
  collapse: "\u6298\u53E0",
  expand: (hidden) => "\u5C55\u5F00\u5176\u4F59 " + hidden + " \u884C"
};
var COPY_LABEL = "\u590D\u5236";
var COPIED_LABEL = "\u5DF2\u590D\u5236";
var VIEW_OPTIONS = [
  {
    id: "highlight",
    label: "\u9AD8\u4EAE",
    desc: "\u4E00\u4E2A\u4EE3\u7801\u5757\u91CC\u653E\u5B8C\u6574\u7EDF\u4E00 diff\uFF1A\u6574\u884C\u7EA2\u7EFF\u5E95\u8272 + \u884C\u53F7 + \u8BED\u6CD5\u9AD8\u4EAE\uFF0C\u672A\u53D8\u884C\u53EA\u51FA\u73B0\u4E00\u6B21\u3002"
  },
  {
    id: "diff",
    label: "\xB1 \u5DEE\u5F02",
    desc: "\u5B98\u65B9\u9010\u884C \xB1 \u89C6\u56FE\uFF0C\u540C\u6837\u53EA\u5217\u771F\u6B63\u53D8\u5316\u7684\u884C\uFF1B\u7D27\u51D1\uFF0C\u8D85\u957F\u65F6\u4E2D\u90E8\u6298\u53E0\u3002"
  }
];
var body = createDiffBody({
  code: styles_module_css_default.pvCode,
  diff: styles_module_css_default.pvDiff,
  diffWrap: styles_module_css_default.pvDiffWrap,
  ctx: styles_module_css_default.pvCtx,
  ctxLine: styles_module_css_default.pvCtxLine,
  muted: styles_module_css_default.pvMuted
});
function highlightPreview() {
  return [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("style", { children: SAMPLE_HIGHLIGHT.css }, "pv-tint"),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.pvCodeBox, children: body.code(SAMPLE_HIGHLIGHT, COPY_LABEL, COPIED_LABEL) }, "pv-code")
  ];
}
function diffPreview() {
  return body.lines({
    diff: SAMPLE_HUNK.changed,
    before: [],
    after: [],
    labels: PREVIEW_LABELS
  });
}
function ViewCards(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.viewCards, role: "radiogroup", "aria-label": "\u5C55\u793A\u65B9\u5F0F", children: VIEW_OPTIONS.map((option) => {
    const selected = props.value === option.id;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "div",
      {
        role: "radio",
        "aria-checked": selected,
        "aria-label": option.label,
        tabIndex: 0,
        className: styles_module_css_default.viewCard + (selected ? " " + styles_module_css_default.viewCardOn : ""),
        onClick: () => props.onSelect(option.id),
        onKeyDown: (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            props.onSelect(option.id);
          }
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.viewCardHead, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.radio, "aria-hidden": true }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.viewCardName, children: option.label })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.viewCardDesc, children: option.desc }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.pvBody, children: option.id === "highlight" ? highlightPreview() : diffPreview() })
        ]
      },
      option.id
    );
  }) });
}

// src/client/FileChangeViewerSection.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var INTRO = "\u300C\u7F16\u8F91 / \u5199\u5165\u300D\u5DE5\u5177\u884C\u7684\u9ED8\u8BA4\u5F62\u6001\u4E0E\u5DEE\u5F02\u89C6\u56FE\uFF0C\u4EE5\u53CA\u672C\u63D2\u4EF6\u9644\u5E26\u7684 patch \u5DE5\u5177\u5F00\u5173\u3002\u8FD9\u91CC\u6539\u7684\u662F**\u5168\u5C40\u9ED8\u8BA4\u503C**\uFF0C\u7ACB\u5373\u5199\u5165 settings.yaml \u7684 dshp-file-change-viewer \u5206\u8282\uFF1A\u663E\u793A\u504F\u597D\u53EA\u5F71\u54CD**\u4E4B\u540E\u65B0\u6E32\u67D3**\u7684\u7F16\u8F91 / \u5199\u5165\u884C\uFF08\u5DF2\u7ECF\u5728\u4F1A\u8BDD\u91CC\u7684\u884C\u4FDD\u6301\u5B83\u5F53\u524D\u7684\u6837\u5B50\uFF0C\u5355\u884C\u3001\u5355\u5757\u968F\u65F6\u53EF\u4EE5\u4E34\u65F6\u70B9\u5F00 / \u6536\u8D77\uFF0C\u4E0D\u5199\u56DE\uFF09\u3002\u53E6\u5916\uFF0C\u4F1A\u8BDD\u9875\u5934\u53F3\u4FA7\u8FD8\u6709\u4E24\u4E2A\u53EA\u4F5C\u7528\u4E8E**\u5F53\u524D\u4F1A\u8BDD**\u7684\u5FEB\u6377\u5F00\u5173\uFF08\u4E00\u952E\u5C55\u5F00 / \u6536\u8D77\u3001\u5207\u6362\u5DEE\u5F02\u89C6\u56FE\uFF09\uFF0C\u5B83\u4EEC\u4E0D\u52A8\u8FD9\u91CC\u7684\u503C\u3002";
var EXPAND_LABEL = "\u7F16\u8F91 / \u5199\u5165\u9ED8\u8BA4\u5C55\u5F00";
var EXPAND_HINT = "\u5F00\uFF1A\u65B0\u6E32\u67D3\u7684\u7F16\u8F91 / \u5199\u5165\u884C\u76F4\u63A5\u5C55\u5F00\u663E\u793A\u6539\u52A8\uFF1B\u5173\uFF1A\u4E0E\u601D\u8003 / \u8BFB\u53D6\u884C\u4E00\u81F4\uFF0C\u9ED8\u8BA4\u6536\u8D77\u3001\u70B9\u4E00\u4E0B\u624D\u5C55\u5F00\u3002\u53EA\u51B3\u5B9A\u9ED8\u8BA4\u503C\uFF0C\u884C\u5185\u6587\u4EF6\u5757\u4E0E\u5355\u5757\u6298\u53E0\u90FD\u53EF\u4E34\u65F6\u70B9\uFF0C\u4F1A\u8BDD\u9875\u5934\u7684\u300C\u5C55\u5F00 / \u6536\u8D77\u300D\u4E5F\u53EA\u538B\u8FC7\u5F53\u524D\u4F1A\u8BDD\u3002";
var PATCH_LABEL = "\u542F\u7528 patch \u5DE5\u5177\uFF08\u6D4B\u8BD5\u7248\uFF09";
var PATCH_HINT = "\u5F00\uFF1A\u6A21\u578B\u591A\u51FA\u4E00\u4E2A patch \u5DE5\u5177\uFF0C\u4E00\u6B21\u8C03\u7528\u6539\u591A\u5904 / \u591A\u6587\u4EF6\uFF08*** Begin Patch \u4FE1\u5C01\uFF0C\u53EA\u505A\u65B0\u5EFA\u4E0E\u4FEE\u6539\uFF0C\u5220\u9664 / \u6539\u540D\u4ECD\u8D70 bash\uFF09\u3002\u5173\uFF08\u9ED8\u8BA4\uFF09\uFF1A\u4E0D\u6CE8\u518C\u8FD9\u4E2A\u5DE5\u5177\uFF0C\u6A21\u578B\u53EA\u7528\u5B98\u65B9\u7684 read / write / edit\u3002\u6539\u5B8C\u7ACB\u5373\u751F\u6548\uFF0C\u4E0D\u5FC5\u91CD\u542F dsh web\uFF1B\u53D6\u6D88\u65F6\u6B63\u5728\u8FDB\u884C\u7684\u8C03\u7528\u4E0D\u53D7\u5F71\u54CD\u3002";
var VIEW_LABEL = "\u5C55\u793A\u65B9\u5F0F";
var VIEW_HINT = "\u4E24\u79CD\u89C6\u56FE\u5582\u7ED9\u6E32\u67D3\u5668\u7684\u90FD\u662F**\u540C\u4E00\u4EFD\u8BED\u4E49\u53D8\u66F4**\uFF08\u53EA\u7B97\u771F\u6B63\u53D8\u52A8\u7684\u884C\uFF0C\u672A\u53D8\u884C\u4E0D\u4F1A\u91CD\u590D\u51FA\u73B0\uFF09\uFF0C\u6240\u4EE5\u589E\u5220\u7EDF\u8BA1\u3001\u884C\u53F7\u4E0E\u4E24\u8FB9\u770B\u5230\u7684\u5B8C\u5168\u4E00\u81F4\uFF1B\u4E0B\u9762\u6BCF\u5F20\u5361\u76F4\u63A5\u753B\u51FA\u5BF9\u5E94\u6548\u679C\uFF0C\u9009\u4E2D\u5373\u751F\u6548\u3002\u5355\u5757\u4ECD\u53EF\u5728\u5361\u5934\u4E34\u65F6\u5207\u6362\uFF0C\u4F1A\u8BDD\u9875\u5934\u4E5F\u80FD\u53EA\u7ED9\u5F53\u524D\u4F1A\u8BDD\u6362\u4E00\u79CD\u3002";
var CONTEXT_LABEL = "\u4E0A\u4E0B\u6587\u884C\u6570";
var CONTEXT_HINT = "\u6539\u52A8\u4E24\u4FA7\u5404\u591A\u663E\u793A\u51E0\u884C**\u6CA1\u53D7\u5F71\u54CD**\u7684\u4EE3\u7801\u3002\u8FD9\u51E0\u884C\u53D6\u81EA\u6587\u4EF6\u5F53\u524D\u5185\u5BB9\uFF08\u4E0D\u662F\u6A21\u578B\u5728 old_string / \u8865\u4E01\u7247\u6BB5\u91CC\u5E26\u7684\u90A3\u51E0\u884C\uFF09\uFF0C\u6240\u4EE5\u6A21\u578B\u53EA\u5708 1 \u884C\u4E0A\u4E0B\u6587\u65F6\u4E5F\u80FD\u770B\u6E05\u6539\u52A8\u843D\u5728\u54EA\u91CC\uFF1B0 = \u53EA\u663E\u793A\u6A21\u578B\u7ED9\u7684\u5185\u5BB9\u3002\u6587\u4EF6\u8BFB\u4E0D\u5230\u3001\u6216\u8FD9\u6BB5\u6539\u52A8\u4E4B\u540E\u53C8\u88AB\u6539\u8FC7\u65F6\uFF0C\u5C31\u4E0D\u8865\u4E0A\u4E0B\u6587\uFF08\u4E0D\u7F16\u5185\u5BB9\uFF09\u3002";
var CONTEXT_OPTIONS = [
  { id: "0", label: "\u4E0D\u663E\u793A" },
  { id: "3", label: "3 \u884C" },
  { id: "5", label: "5 \u884C" },
  { id: "8", label: "8 \u884C" }
];
function Row(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.settingRow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.rowText, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.title, children: props.label }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.desc, children: props.desc })
    ] }),
    props.children
  ] });
}
function Block(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.settingBlock, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.blockText, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.title, children: props.label }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.desc, children: props.desc })
    ] }),
    props.children
  ] });
}
var BADGE_TONE = {
  ok: styles_module_css_default.badgeOk,
  warn: styles_module_css_default.badgeWarn,
  muted: styles_module_css_default.badgeMuted
};
function Badge(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.badge + " " + BADGE_TONE[props.kind], children: props.text });
}
function Switch(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": props.checked === true,
      "aria-label": props.label,
      className: styles_module_css_default.switch + (props.checked ? " " + styles_module_css_default.switchOn : ""),
      onClick: props.onChange,
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.thumb })
    }
  );
}
function Select(props) {
  const [open, setOpen] = (0, import_react5.useState)(false);
  const selector = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "button",
    {
      type: "button",
      className: styles_module_css_default.selector,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      onClick: () => setOpen((prev) => !prev),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.selectorLabel, children: props.selectedLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives3.IconChevronDownOutlineRegular, { className: styles_module_css_default.chevron })
      ]
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    import_dsh_client_ui_primitives3.Menu,
    {
      open,
      onClose: () => setOpen(false),
      items: props.options,
      selectedId: props.value,
      onSelect: (id) => {
        setOpen(false);
        props.onSelect(id);
      },
      align: "end",
      portal: true,
      anchor: selector
    }
  );
}
function statusBadge(phase2) {
  if (phase2 === "loading") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { kind: "muted", text: "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" });
  if (phase2 === "saving") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { kind: "muted", text: "\u6B63\u5728\u4FDD\u5B58\u2026" });
  if (phase2 === "ready") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { kind: "ok", text: "\u5DF2\u540C\u6B65 settings.yaml" });
  if (phase2 === "error") return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Badge, { kind: "warn", text: "\u672A\u4FDD\u5B58" });
  return null;
}
function FileChangeViewerSection() {
  const prefs2 = usePrefs();
  const save = useSaveState();
  const pickedContext = CONTEXT_OPTIONS.filter((option) => option.id === String(prefs2.contextLines))[0];
  const busy = save.phase === "loading" || save.phase === "saving";
  const children = [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: styles_module_css_default.intro, children: INTRO }, "intro"),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u663E\u793A" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Block, { label: VIEW_LABEL, desc: VIEW_HINT, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ViewCards, { value: prefs2.view, onSelect: (id) => setPref("view", id) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Row, { label: CONTEXT_LABEL, desc: CONTEXT_HINT, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        Select,
        {
          value: String(prefs2.contextLines),
          selectedLabel: pickedContext === void 0 ? String(prefs2.contextLines) + " \u884C" : pickedContext.label,
          options: CONTEXT_OPTIONS,
          onSelect: (id) => setPref("contextLines", Number(id))
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Row, { label: EXPAND_LABEL, desc: EXPAND_HINT, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        Switch,
        {
          checked: prefs2.sectionsOpen,
          label: EXPAND_LABEL,
          onChange: () => setPref("sectionsOpen", !prefs2.sectionsOpen)
        }
      ) })
    ] }, "display"),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u5DE5\u5177" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Row, { label: PATCH_LABEL, desc: PATCH_HINT, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        Switch,
        {
          checked: prefs2.patchTool,
          label: PATCH_LABEL,
          onChange: () => setPref("patchTool", !prefs2.patchTool)
        }
      ) })
    ] }, "tools"),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.barEnd, children: [
      statusBadge(save.phase),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "outline", size: "sm", disabled: busy, onClick: reload, children: save.phase === "loading" ? "\u8BFB\u53D6\u4E2D\u2026" : "\u91CD\u65B0\u8BFB\u53D6" })
    ] }, "bar")
  ];
  if (save.phase === "error" && save.error !== null) {
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { className: styles_module_css_default.notice + " " + styles_module_css_default.noticeErr, children: save.error }, "error")
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.page, children });
}

// src/client/SessionControls.tsx
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime5 = require("react/jsx-runtime");
var GROUP_LABEL = "\u6587\u4EF6\u6539\u52A8\u7684\u5C55\u5F00\u4E0E\u5DEE\u5F02\u89C6\u56FE\uFF08\u4EC5\u5F53\u524D\u4F1A\u8BDD\uFF09";
var EXPAND_TEXT = "\u5C55\u5F00\u6539\u52A8";
var COLLAPSE_TEXT = "\u6536\u8D77\u6539\u52A8";
var EXPAND_TITLE = "\u5C55\u5F00\u672C\u4F1A\u8BDD\u7684\u6240\u6709\u6587\u4EF6\u6539\u52A8\uFF08\u53EA\u5F71\u54CD\u5F53\u524D\u4F1A\u8BDD\uFF0C\u4E0D\u6539\u5168\u5C40\u504F\u597D\uFF09";
var COLLAPSE_TITLE = "\u6536\u8D77\u672C\u4F1A\u8BDD\u7684\u6240\u6709\u6587\u4EF6\u6539\u52A8\uFF08\u53EA\u5F71\u54CD\u5F53\u524D\u4F1A\u8BDD\uFF0C\u4E0D\u6539\u5168\u5C40\u504F\u597D\uFF09";
var VIEW_HIGHLIGHT_TEXT = "\u9AD8\u4EAE";
var VIEW_DIFF_TEXT = "\xB1 \u5DEE\u5F02";
var VIEW_TITLE = "\u5207\u6362\u672C\u4F1A\u8BDD\u6587\u4EF6\u6539\u52A8\u7684\u5C55\u793A\u65B9\u5F0F\uFF08\u9AD8\u4EAE = \u5355\u4EE3\u7801\u5757\u7EDF\u4E00 diff\uFF0C\xB1 \u5DEE\u5F02 = \u5B98\u65B9\u9010\u884C\u89C6\u56FE\uFF1B\u53EA\u5F71\u54CD\u5F53\u524D\u4F1A\u8BDD\uFF09";
var RESET_TEXT = "\u6062\u590D\u8DDF\u968F\u504F\u597D";
var RESET_TITLE = "\u64A4\u6389\u672C\u4F1A\u8BDD\u7684\u4E34\u65F6\u8BBE\u7F6E\uFF0C\u56DE\u5230\u8BBE\u7F6E\u9875\u91CC\u7684\u5168\u5C40\u9ED8\u8BA4";
var ICON_SIZE2 = 11;
function SessionControls(props) {
  const prefs2 = usePrefs();
  const override = useOverride(props.sessionId);
  const expanded = override.expanded ?? prefs2.sectionsOpen;
  const view = override.view ?? prefs2.view;
  const overridden = override.expanded !== null || override.view !== null;
  const expandTitle = expanded ? COLLAPSE_TITLE : EXPAND_TITLE;
  const viewTitle = view === "highlight" ? VIEW_HIGHLIGHT_TEXT : VIEW_DIFF_TEXT;
  const children = [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "button",
      {
        type: "button",
        className: styles_module_css_default.headBtn,
        title: expandTitle,
        "aria-label": expandTitle,
        onClick: () => setExpanded(props.sessionId, !expanded),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            import_dsh_client_ui_primitives4.IconChevronDownOutlineRegular,
            {
              size: ICON_SIZE2,
              className: styles_module_css_default.headChevron + (expanded ? "" : " " + styles_module_css_default.headChevronShut)
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.headLabel, children: expanded ? COLLAPSE_TEXT : EXPAND_TEXT })
        ]
      },
      "expand"
    ),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.headSep }, "sep"),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "button",
      {
        type: "button",
        className: styles_module_css_default.headBtn,
        title: VIEW_TITLE,
        "aria-label": VIEW_TITLE,
        onClick: () => setView(props.sessionId, view === "highlight" ? "diff" : "highlight"),
        children: [
          view === "highlight" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives4.IconCodeOutlineRegular, { size: ICON_SIZE2 }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives4.IconBranchOutlineRegular, { size: ICON_SIZE2 }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.headLabel, children: viewTitle })
        ]
      },
      "view"
    )
  ];
  if (overridden) {
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          type: "button",
          className: styles_module_css_default.headReset,
          title: RESET_TITLE,
          "aria-label": RESET_TEXT,
          onClick: () => resetOverride(props.sessionId),
          children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives4.IconRefreshOutlineRegular, { size: ICON_SIZE2 })
        },
        "reset"
      )
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "div",
    {
      className: styles_module_css_default.headCtl + (overridden ? " " + styles_module_css_default.headCtlOverridden : ""),
      role: "group",
      "aria-label": GROUP_LABEL,
      children
    }
  );
}

// src/client/index.tsx
var CONVERSATION_NS = "conversation";
var SHADOW_PRIORITY = -1;
var TOOL_KEYS = ["edit", "write", "str_replace_editor", "patch"];
var SETTINGS_NS = "dshp-file-change-viewer";
var SETTINGS_ORDER = 31;
var SETTINGS_LABEL = "File Change View";
var HEADER_SLOT = "conversation.session.header.utilities";
var HEADER_ORDER = 20;
var inject = ["slots"];
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  startPrefs();
  try {
    ctx.effect(
      () => slots.inject(
        "settings.section",
        () => slots.register(
          { name: "settings.section", id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
          FileChangeViewerSection
        )
      ),
      "dshp-file-change-viewer: settings section"
    );
  } catch (error2) {
    console.error("[dshp-file-change-viewer] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF0C\u4E24\u9879\u504F\u597D\u5C06\u53EA\u80FD\u624B\u6539 settings.yaml\uFF1A", error2);
  }
  try {
    ctx.effect(
      () => slots.inject(
        HEADER_SLOT,
        () => slots.register({ name: HEADER_SLOT, id: SETTINGS_NS, order: HEADER_ORDER }, SessionControls)
      ),
      "dshp-file-change-viewer: session header controls"
    );
  } catch (error2) {
    console.error("[dshp-file-change-viewer] \u6CE8\u518C\u4F1A\u8BDD\u9875\u5934\u5FEB\u6377\u5F00\u5173\u5931\u8D25\uFF0C\u8BBE\u7F6E\u9875\u4ECD\u7136\u53EF\u7528\uFF1A", error2);
  }
  try {
    ctx.effect(
      () => slots.inject("tool.call.toolview", function* () {
        for (const key of TOOL_KEYS) {
          try {
            yield slots.register(
              {
                name: "tool.call.toolview",
                key,
                locale: CONVERSATION_NS,
                priority: SHADOW_PRIORITY
              },
              FileChangeRow
            );
          } catch (error2) {
            console.error("[dshp-file-change-viewer] \u63A5\u7BA1 " + key + " \u884C\u5931\u8D25\uFF0C\u8BE5\u5DE5\u5177\u5C06\u6CBF\u7528\u5185\u7F6E\u884C\uFF1A", error2);
          }
        }
      }),
      "dshp-file-change-viewer: edit/write tool cards"
    );
  } catch (error2) {
    console.error("[dshp-file-change-viewer] \u6CE8\u518C\u6587\u4EF6\u4FEE\u6539\u884C\u5931\u8D25\uFF0Cedit / write \u5C06\u56DE\u843D\u5230\u5185\u7F6E\u884C\uFF1A", error2);
  }
}
return module.exports; } });
