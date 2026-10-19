window.__ModuleLoader__.load({ id: "@dshp/mcp-manager", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
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

// src/client/McpSection.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/api.ts
var BASE = "/ext/dshp-mcp-manager";
async function postJson(path, payload) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  return await r.json();
}
async function fetchState() {
  const r = await fetch(`${BASE}/state`, { cache: "no-store" });
  return await r.json();
}
function saveManagerConfig(patch) {
  return postJson("/config", patch);
}
function createServer(config) {
  return postJson("/create", { config });
}
function updateServer(id, config) {
  return postJson("/update", { id, config });
}
function toggleServer(id, disabled) {
  return postJson("/toggle", { id, disabled });
}
function removeServer(id) {
  return postJson("/remove", { id });
}
function probeServer(id) {
  return postJson("/probe", { id });
}

// src/client/components.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime = require("react/jsx-runtime");
var KIND_TO_TONE = {
  ok: "success",
  warn: "warning",
  muted: "neutral",
  info: "info",
  err: "danger"
};
function Badge({ kind, text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: KIND_TO_TONE[kind], children: text });
}
function Switch({ checked, disabled, label, title, onChange }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.Switch,
    {
      checked: checked === true,
      disabled: disabled === true,
      label,
      title,
      onChange
    }
  );
}
function Selector({ disabled, value, selectedLabel, options, onSelect }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const anchor = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_dsh_client_ui_primitives.Button,
    {
      variant: "toolbar",
      disabled,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      onClick: () => setOpen((v) => !v),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selectedLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutlineRegular, {})
      ]
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.Menu,
    {
      open,
      onClose: () => setOpen(false),
      items: options,
      selectedId: value,
      onSelect: (id) => {
        setOpen(false);
        onSelect(id);
      },
      align: "start",
      portal: true,
      anchor
    }
  );
}

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = ".bmS5Aa_page{max-width:860px;color:var(--dsw-alias-label-primary);flex-direction:column;display:flex}.bmS5Aa_intro{color:var(--dsw-alias-label-tertiary);margin:0 0 4px;font-size:14px;line-height:22px}.bmS5Aa_rootPath{color:var(--dsw-alias-label-dimmed);font-family:var(--ds-font-family-code);white-space:nowrap;text-overflow:ellipsis;max-width:100%;font-size:11px;overflow:hidden}.bmS5Aa_toolbar{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;align-items:center;gap:10px;padding:10px 0 12px;display:flex}.bmS5Aa_toolbarSpacer{flex:1;min-width:0}.bmS5Aa_count{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-size:13px;line-height:20px}.bmS5Aa_searchW{width:230px}.bmS5Aa_list{flex-direction:column;display:flex}.bmS5Aa_row{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;align-items:center;gap:10px;padding:12px 0;display:flex}.bmS5Aa_list .bmS5Aa_row:last-child{border-bottom:none}.bmS5Aa_rowDisabled .bmS5Aa_title,.bmS5Aa_rowDisabled .bmS5Aa_line{opacity:.55}.bmS5Aa_rowText{flex-direction:column;flex:1;gap:2px;min-width:200px;display:flex}.bmS5Aa_title{color:var(--dsw-alias-label-primary);flex-wrap:wrap;align-items:center;gap:6px;font-size:14px;font-weight:400;line-height:22px;display:flex}.bmS5Aa_nameBtn{cursor:pointer;color:inherit;font:inherit;text-align:left;background:0 0;border:none;padding:0}.bmS5Aa_nameBtn:hover{text-decoration:underline}.bmS5Aa_line{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;min-width:0;font-size:12px;font-weight:400;line-height:18px;overflow:hidden}.bmS5Aa_mono{font-family:var(--ds-font-family-code);font-size:13px}.bmS5Aa_tile{background:var(--dsw-alias-button-ghost-active-fill);width:28px;height:28px;color:var(--dsw-alias-label-secondary);letter-spacing:.4px;border-radius:8px;flex:none;justify-content:center;align-items:center;font-size:9px;font-weight:600;display:flex;position:relative}.bmS5Aa_dot{border:2px solid var(--dsw-alias-bg-layer-1);background:var(--dsw-alias-label-dimmed);border-radius:50%;width:8px;height:8px;position:absolute;bottom:-2px;right:-2px}.bmS5Aa_dotOk{background:var(--dsw-alias-state-success-primary)}.bmS5Aa_dotFail{background:var(--dsw-alias-state-error-primary)}.bmS5Aa_dotUnknown{background:var(--dsw-alias-brand-primary)}.bmS5Aa_controls{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px;margin-left:auto;display:flex}.bmS5Aa_danger{color:var(--dsw-alias-state-error-primary)}div.bmS5Aa_wideModal{width:min(760px,94vw)}.bmS5Aa_form{flex-direction:column;gap:8px;display:flex}.bmS5Aa_fieldLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.bmS5Aa_modeRow{align-items:center;gap:6px;margin-bottom:4px;display:flex}.bmS5Aa_modeSpacer{flex:1}.bmS5Aa_textarea{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);font:inherit;color:var(--dsw-alias-label-primary);resize:vertical;border-radius:8px;outline:none;width:100%;min-height:64px;padding:8px 12px;font-size:13px;line-height:20px}.bmS5Aa_textarea:focus-visible{border-color:var(--dsw-alias-brand-primary)}.bmS5Aa_textarea::placeholder{color:var(--dsw-alias-label-dimmed)}.bmS5Aa_textarea:disabled{opacity:.5}.bmS5Aa_textareaMono{font-family:var(--ds-font-family-code);font-size:12px;line-height:19px}.bmS5Aa_bar{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.bmS5Aa_twoCol{flex-wrap:wrap;gap:12px;display:flex}.bmS5Aa_twoCol>*{flex:1;min-width:200px}.bmS5Aa_notice{margin:0;font-size:12px;line-height:18px}.bmS5Aa_noticeErr{color:var(--dsw-alias-state-error-primary)}.bmS5Aa_noticeWarn{color:var(--dsw-alias-state-warn-label)}.bmS5Aa_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.bmS5Aa_loading{align-items:center;gap:8px;display:flex}.bmS5Aa_loadingText{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.bmS5Aa_empty{flex-direction:column;align-items:center;gap:8px;padding:32px 0 24px;display:flex}.bmS5Aa_emptyTitle{color:var(--dsw-alias-label-secondary);font-size:14px;line-height:22px}.bmS5Aa_probeLine{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;min-width:0;font-size:11px;line-height:16px;overflow:hidden}";
var tagId = "@dshp/mcp-manager/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/mcp-manager");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "bar": "bmS5Aa_bar", "controls": "bmS5Aa_controls", "count": "bmS5Aa_count", "danger": "bmS5Aa_danger", "dot": "bmS5Aa_dot", "dotFail": "bmS5Aa_dotFail", "dotOk": "bmS5Aa_dotOk", "dotUnknown": "bmS5Aa_dotUnknown", "empty": "bmS5Aa_empty", "emptyTitle": "bmS5Aa_emptyTitle", "fieldLabel": "bmS5Aa_fieldLabel", "form": "bmS5Aa_form", "hint": "bmS5Aa_hint", "intro": "bmS5Aa_intro", "line": "bmS5Aa_line", "list": "bmS5Aa_list", "loading": "bmS5Aa_loading", "loadingText": "bmS5Aa_loadingText", "modeRow": "bmS5Aa_modeRow", "modeSpacer": "bmS5Aa_modeSpacer", "mono": "bmS5Aa_mono", "nameBtn": "bmS5Aa_nameBtn", "notice": "bmS5Aa_notice", "noticeErr": "bmS5Aa_noticeErr", "noticeWarn": "bmS5Aa_noticeWarn", "page": "bmS5Aa_page", "probeLine": "bmS5Aa_probeLine", "rootPath": "bmS5Aa_rootPath", "row": "bmS5Aa_row", "rowDisabled": "bmS5Aa_rowDisabled", "rowText": "bmS5Aa_rowText", "searchW": "bmS5Aa_searchW", "textarea": "bmS5Aa_textarea", "textareaMono": "bmS5Aa_textareaMono", "tile": "bmS5Aa_tile", "title": "bmS5Aa_title", "toolbar": "bmS5Aa_toolbar", "toolbarSpacer": "bmS5Aa_toolbarSpacer", "twoCol": "bmS5Aa_twoCol", "wideModal": "bmS5Aa_wideModal" };

// src/client/McpSection.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var SERVER_NAME_RE = /^[A-Za-z0-9_-]{1,32}$/;
function cx(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
function envToJson(map) {
  const out = {};
  for (const [k, v] of Object.entries(map)) out[k] = v.js ? "js: " + v.source : v.source;
  return out;
}
function parseEnvJson(text, field) {
  if (!text.trim()) return {};
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(field + ' \u4E0D\u662F\u5408\u6CD5 JSON\uFF08\u503C\u82E5\u4E3A\u8868\u8FBE\u5F0F\u8BF7\u5199 "js: \u8868\u8FBE\u5F0F"\uFF09');
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error(field + ' \u5E94\u4E3A\u5BF9\u8C61\uFF08\u5982 { "KEY": "value" }\uFF09');
  const out = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v !== "string") throw new Error(`${field} \u7684 ${k} \u5E94\u4E3A\u5B57\u7B26\u4E32\uFF08\u8868\u8FBE\u5F0F\u7528 "js: " \u524D\u7F00\uFF09`);
    out[k.slice(0, 120)] = v.slice(0, 4096);
  }
  return out;
}
function splitArgs(text) {
  const matches = text.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g);
  if (!matches) return [];
  return matches.map((m) => m.length >= 2 && (m[0] === '"' || m[0] === "'") ? m.slice(1, -1) : m).slice(0, 64);
}
function argsToText(args) {
  return args.map((a) => /\s/.test(a) ? '"' + a + '"' : a).join(" ");
}
function summaryOf(v) {
  if (v.transport === "stdio") {
    const cmd = [v.command, ...v.args].join(" ").trim();
    return "stdio \xB7 " + (cmd || "\uFF08\u7F3A\u5C11 command\uFF09");
  }
  if (v.transport === "streamable-http") return "http \xB7 " + (v.url || "\uFF08\u7F3A\u5C11 url\uFF09");
  return "\uFF08transport \u672A\u8BC6\u522B\uFF09";
}
function formFromView(v) {
  return {
    serverName: v.serverName,
    transport: v.transport === "streamable-http" ? "streamable-http" : "stdio",
    command: v.command,
    argsText: argsToText(v.args),
    envText: JSON.stringify(envToJson(v.env), null, 2),
    cwd: v.cwd,
    url: v.url,
    headersText: JSON.stringify(envToJson(v.headers), null, 2),
    timeoutText: v.toolCallTimeoutMs === null ? "" : String(v.toolCallTimeoutMs),
    failOnStartup: v.failOnStartupError === true,
    failProvided: v.failOnStartupError !== null,
    reconnect: v.reconnect ?? null,
    extras: { ...v.extras }
  };
}
function emptyForm() {
  return {
    serverName: "",
    transport: "stdio",
    command: "",
    argsText: "",
    envText: "",
    cwd: "",
    url: "",
    headersText: "",
    timeoutText: "",
    failOnStartup: false,
    failProvided: false,
    reconnect: null,
    extras: {}
  };
}
function viewToJsonText(v) {
  const cfg = {};
  if (v.serverName) cfg["serverName"] = v.serverName;
  if (v.transport) cfg["transport"] = v.transport;
  if (v.transport === "stdio") {
    if (v.command) cfg["command"] = v.command;
    if (v.args.length > 0) cfg["args"] = v.args;
    if (Object.keys(v.env).length > 0) cfg["env"] = envToJson(v.env);
    if (v.cwd) cfg["cwd"] = v.cwd;
  }
  if (v.transport === "streamable-http") {
    if (v.url) cfg["url"] = v.url;
    if (Object.keys(v.headers).length > 0) cfg["headers"] = envToJson(v.headers);
  }
  if (v.toolCallTimeoutMs !== null) cfg["toolCallTimeoutMs"] = v.toolCallTimeoutMs;
  if (v.failOnStartupError !== null) cfg["failOnStartupError"] = v.failOnStartupError;
  if (v.reconnect !== null && v.reconnect !== void 0) cfg["reconnect"] = v.reconnect;
  for (const [k, val] of Object.entries(v.extras)) cfg[k] = val;
  return JSON.stringify(cfg, null, 2);
}
function createJsonText() {
  return JSON.stringify(
    {
      serverName: "my-server",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"]
    },
    null,
    2
  );
}
function configFromForm(f) {
  const name = f.serverName.trim();
  if (!SERVER_NAME_RE.test(name)) throw new Error("\u540D\u79F0\u975E\u6CD5\uFF1A1-32 \u4F4D\u5B57\u6BCD/\u6570\u5B57/\u4E0B\u5212\u7EBF/\u8FDE\u5B57\u7B26");
  const cfg = { serverName: name, transport: f.transport };
  if (f.transport === "stdio") {
    const command = f.command.trim();
    if (!command) throw new Error("\u547D\u4EE4\u4E0D\u80FD\u4E3A\u7A7A\uFF08stdio \u4F20\u8F93\u8981\u7ED9\u51FA\u53EF\u6267\u884C\u6587\u4EF6\uFF09");
    cfg["command"] = command;
    const args = splitArgs(f.argsText);
    if (args.length > 0) cfg["args"] = args;
    const env = parseEnvJson(f.envText, "\u73AF\u5883\u53D8\u91CF");
    if (Object.keys(env).length > 0) cfg["env"] = env;
    const cwd = f.cwd.trim();
    if (cwd) cfg["cwd"] = cwd;
  } else {
    const url = f.url.trim();
    if (!/^https?:\/\//.test(url)) throw new Error("URL \u975E\u6CD5\uFF1A\u5E94\u4EE5 http:// \u6216 https:// \u5F00\u5934");
    cfg["url"] = url;
    const headers = parseEnvJson(f.headersText, "\u8BF7\u6C42\u5934");
    if (Object.keys(headers).length > 0) cfg["headers"] = headers;
  }
  const t = f.timeoutText.trim();
  if (t) {
    const n = Number(t);
    if (!Number.isFinite(n) || Math.floor(n) !== n) throw new Error("\u8D85\u65F6 MS \u5E94\u4E3A\u6574\u6570\uFF08\u6BEB\u79D2\uFF09");
    cfg["toolCallTimeoutMs"] = Math.min(36e5, Math.max(1e3, n));
  }
  if (f.failOnStartup || f.failProvided) cfg["failOnStartupError"] = f.failOnStartup;
  if (f.reconnect !== null && f.reconnect !== void 0) cfg["reconnect"] = f.reconnect;
  for (const [k, v] of Object.entries(f.extras)) cfg[k] = v;
  return cfg;
}
var KNOWN_FORM_KEYS = /* @__PURE__ */ new Set([
  "serverName",
  "transport",
  "command",
  "args",
  "env",
  "cwd",
  "url",
  "headers",
  "toolCallTimeoutMs",
  "failOnStartupError",
  "reconnect"
]);
function asTextMax(v, max) {
  return typeof v === "string" ? v.slice(0, max) : "";
}
function jsonTextOf(v) {
  if (v === void 0 || v === null) return "";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}
function formFromConfig(cfg) {
  const f = emptyForm();
  f.serverName = asTextMax(cfg["serverName"], 32);
  f.transport = cfg["transport"] === "streamable-http" ? "streamable-http" : "stdio";
  f.command = asTextMax(cfg["command"], 600);
  const args = cfg["args"];
  f.argsText = Array.isArray(args) ? argsToText(args.map((a) => asTextMax(a, 600))) : "";
  f.envText = jsonTextOf(cfg["env"]);
  f.cwd = asTextMax(cfg["cwd"], 1024);
  f.url = asTextMax(cfg["url"], 2048);
  f.headersText = jsonTextOf(cfg["headers"]);
  const t = cfg["toolCallTimeoutMs"];
  f.timeoutText = typeof t === "number" && Number.isFinite(t) ? String(t) : "";
  f.failOnStartup = cfg["failOnStartupError"] === true;
  f.failProvided = Object.hasOwn(cfg, "failOnStartupError");
  const r = cfg["reconnect"];
  f.reconnect = r !== null && typeof r === "object" && !Array.isArray(r) ? r : null;
  const extras = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (!KNOWN_FORM_KEYS.has(k)) extras[k.slice(0, 120)] = v;
  }
  f.extras = extras;
  return f;
}
function FieldLabel({ text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.fieldLabel, children: text });
}
function TextInput({ value, placeholder, mono, onChange }) {
  const monoClass = mono === true ? { className: cx(styles_module_css_default.mono) } : {};
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_dsh_client_ui_primitives2.Input,
    {
      ...monoClass,
      placeholder,
      value,
      onChange: (e) => onChange(e.target.value)
    }
  );
}
function statusClassOf(v, probe) {
  if (v.disabled) return cx(styles_module_css_default.dot);
  if (v.toolCount !== null && v.toolCount > 0) return cx(styles_module_css_default.dot, styles_module_css_default.dotOk);
  if (probe?.state === "ok") return cx(styles_module_css_default.dot, styles_module_css_default.dotOk);
  if (probe?.state === "fail") return cx(styles_module_css_default.dot, styles_module_css_default.dotFail);
  return cx(styles_module_css_default.dot, styles_module_css_default.dotUnknown);
}
function ServerRow({
  view: v,
  probe,
  busy,
  saving,
  onEdit,
  onToggle,
  onProbe,
  onDelete
}) {
  const probeLine = probe ? probe.state === "ok" ? "\u2713 \u63E1\u624B\u6210\u529F" + (probe.latencyMs !== null ? " \xB7 " + probe.latencyMs + "ms" : "") + (probe.serverInfoName ? " \xB7 " + probe.serverInfoName : "") + (probe.serverInfoVersion ? " " + probe.serverInfoVersion : "") : probe.state === "fail" ? "\u2717 " + probe.detail : probe.detail : "";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: cx(styles_module_css_default.row, v.disabled ? styles_module_css_default.rowDisabled : void 0), children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.tile, title: "MCP", children: [
      "MCP",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: statusClassOf(v, probe) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.rowText, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.title, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: styles_module_css_default.nameBtn, title: "\u70B9\u51FB\u7F16\u8F91", onClick: onEdit, children: v.serverName || v.id }),
        v.disabled ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { kind: "muted", text: "\u5DF2\u7981\u7528" }) : null,
        v.dup ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { kind: "err", text: "\u91CD\u590D id" }) : null,
        v.unmanageable ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { kind: "warn", text: "\u590D\u6742\u503C" }) : null,
        v.disabledIsJs ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { kind: "warn", text: "disabled \u4E3A !!js" }) : null,
        v.toolCount !== null && v.toolCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { kind: "info", text: v.toolCount + " \u5DE5\u5177" }) : null,
        v.issues.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeWarn), title: v.issues.join("\n"), children: "\u26A0 " + v.issues.length }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: cx(styles_module_css_default.line, styles_module_css_default.mono), title: summaryOf(v), children: summaryOf(v) }),
      !v.disabled && v.toolCount === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "div",
        {
          className: styles_module_css_default.probeLine,
          title: "\u8FDE\u63A5\u6210\u529F\u7684\u670D\u52A1\u5668\u4F1A\u628A\u5DE5\u5177\u6CE8\u518C\u6210 mcp__" + (v.serverName || "\u2026") + "__*\u3002\u672A\u53D1\u73B0\u53EF\u80FD\u662F\uFF1A\u8FDE\u63A5\u5931\u8D25 / \u91CD\u8FDE\u9884\u7B97\u8017\u5C3D / \u670D\u52A1\u5668\u4E0D\u63D0\u4F9B\u5DE5\u5177\u3002\u521A\u4FDD\u5B58\u7684\u8BDD\u7B49\u51E0\u79D2\u70ED\u91CD\u8FDE\uFF08\u672C\u9875\u6BCF 5 \u79D2\u81EA\u52A8\u5237\u65B0\uFF09\u3002\u6392\u67E5\u770B dsh web \u7EC8\u7AEF\u91CC mcp-client(" + (v.serverName || "\u2026") + ") \u7684\u65E5\u5FD7\u884C\u3002",
          children: "\u8FD0\u884C\u65F6\u672A\u53D1\u73B0 mcp__" + (v.serverName || "\u2026") + "__* \u5DE5\u5177\uFF08\u672A\u8FDE\u63A5\u6216\u670D\u52A1\u5668\u65E0\u5DE5\u5177\uFF09"
        }
      ) : null,
      probeLine ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.probeLine, title: probe?.detail, children: probeLine }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.controls, children: [
      v.transport === "streamable-http" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "toolbar", disabled: busy, title: "\u63A2\u6D3B\uFF08initialize \u63E1\u624B\uFF09", onClick: onProbe, children: busy ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconLoadingOutlineRegular, {}) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconRefreshOutlineRegular, { size: 14 }) }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "toolbar", disabled: saving || v.dup || v.unmanageable, title: "\u7F16\u8F91", onClick: onEdit, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconEditOutlineRegular, {}) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_dsh_client_ui_primitives2.Button,
        {
          variant: "toolbar",
          className: styles_module_css_default.danger,
          disabled: saving || v.dup,
          title: "\u5220\u9664 " + (v.serverName || v.id),
          onClick: onDelete,
          children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconTrashOutlineRegular, {})
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Switch,
        {
          checked: !v.disabled,
          disabled: saving || v.dup,
          label: v.disabled ? "\u542F\u7528\u8BE5\u670D\u52A1\u5668" : "\u7981\u7528\u8BE5\u670D\u52A1\u5668",
          onChange: onToggle
        }
      )
    ] })
  ] });
}
function McpSection() {
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [state, setState] = (0, import_react2.useState)(null);
  const [error, setError] = (0, import_react2.useState)("");
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const [search, setSearch] = (0, import_react2.useState)("");
  const [editor, setEditor] = (0, import_react2.useState)(null);
  const [editorError, setEditorError] = (0, import_react2.useState)("");
  const [confirmDel, setConfirmDel] = (0, import_react2.useState)(null);
  const [acked, setAcked] = (0, import_react2.useState)(false);
  const [confirmToggle, setConfirmToggle] = (0, import_react2.useState)(null);
  const [probeBusy, setProbeBusy] = (0, import_react2.useState)("");
  const load = (0, import_react2.useCallback)(async () => {
    try {
      const r = await fetchState();
      if (r.ok && r.state) {
        setState(r.state);
        setError("");
      } else {
        setError(r.error || "\u8BFB\u53D6\u72B6\u6001\u5931\u8D25");
      }
    } catch (e) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react2.useEffect)(() => {
    void load();
  }, [load]);
  (0, import_react2.useEffect)(() => {
    const timer = setInterval(() => {
      void (async () => {
        try {
          const r = await fetchState();
          if (r.ok && r.state) setState(r.state);
        } catch {
        }
      })();
    }, 5e3);
    return () => clearInterval(timer);
  }, []);
  function openCreate() {
    setEditorError("");
    setEditor({ mode: "create", id: "", tab: "form", form: emptyForm(), jsonText: createJsonText() });
  }
  function openEdit(v) {
    setEditorError("");
    setEditor({ mode: "edit", id: v.id, tab: "form", form: formFromView(v), jsonText: viewToJsonText(v) });
  }
  async function runToggle(view, enabled) {
    setSaving(true);
    try {
      const r = await toggleServer(view.id, !enabled);
      if (r.ok && r.state) setState(r.state);
      else setError(r.error || "\u5207\u6362\u5931\u8D25");
    } catch (e) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }
  function onToggle(view, enabled) {
    if (view.disabledIsJs) setConfirmToggle({ view, next: enabled });
    else void runToggle(view, enabled);
  }
  async function runProbe(view) {
    setProbeBusy(view.id);
    try {
      const r = await probeServer(view.id);
      if (r.ok && r.probe && state) {
        setState({ ...state, probes: { ...state.probes, [view.id]: r.probe } });
      } else if (!r.ok) {
        setError(r.error || "\u63A2\u6D3B\u5931\u8D25");
      }
    } catch (e) {
      setError(String(e?.message ?? e));
    } finally {
      setProbeBusy("");
    }
  }
  async function runDelete(view) {
    setSaving(true);
    try {
      const r = await removeServer(view.id);
      if (r.ok && r.state) setState(r.state);
      else setError(r.error || "\u5220\u9664\u5931\u8D25");
    } catch (e) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }
  async function saveEditor() {
    if (!editor) return;
    setEditorError("");
    let cfg;
    try {
      cfg = editor.tab === "json" ? JSON.parse(editor.jsonText) : configFromForm(editor.form);
    } catch (e) {
      setEditorError(String(e?.message ?? e));
      return;
    }
    setSaving(true);
    try {
      const r = editor.mode === "create" ? await createServer(cfg) : await updateServer(editor.id, cfg);
      if (r.ok && r.state) {
        setState(r.state);
        setEditor(null);
      } else {
        setEditorError(r.error || "\u4FDD\u5B58\u5931\u8D25");
      }
    } catch (e) {
      setEditorError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }
  async function savePatchFile(v) {
    setSaving(true);
    try {
      const r = await saveManagerConfig({ patchFile: v });
      if (!r.ok) setError(r.error || "\u4FDD\u5B58\u5931\u8D25");
      await load();
    } catch (e) {
      setError(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.page, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconLoadingOutlineRegular, {}),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.loadingText, children: "\u6B63\u5728\u8BFB\u53D6 MCP \u670D\u52A1\u5668\u2026" })
    ] }) });
  }
  if (error && !state) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.page, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: error }) });
  }
  const st = state;
  const keyword = search.trim().toLowerCase();
  const servers = st.servers.filter((v) => {
    if (!keyword) return true;
    const hay = [v.id, v.serverName, v.command, v.url, v.args.join(" "), v.cwd].join(" ").toLowerCase();
    return hay.includes(keyword);
  });
  const editorBody = editor === null ? null : editor.tab === "form" ? renderEditorForm(editor) : renderEditorJson(editor);
  function switchTab(ed, next) {
    setEditorError("");
    if (next === ed.tab) return;
    if (next === "json") {
      try {
        const cfg = configFromForm(ed.form);
        setEditor({ ...ed, tab: "json", jsonText: JSON.stringify(cfg, null, 2) });
      } catch (e) {
        setEditorError(String(e?.message ?? e) + "\uFF08\u4FEE\u6B63\u540E\u518D\u5207\u5230 JSON\uFF09");
      }
      return;
    }
    try {
      const parsed = JSON.parse(ed.jsonText);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("config \u5E94\u4E3A JSON \u5BF9\u8C61");
      }
      setEditor({ ...ed, tab: "form", form: formFromConfig(parsed) });
    } catch (e) {
      setEditorError(String(e?.message ?? e) + "\uFF08\u4FEE\u6B63\u540E\u518D\u5207\u5230\u8868\u5355\uFF09");
    }
  }
  function modeRow() {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.modeRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Pill, { active: editor?.tab === "form", onClick: () => editor && switchTab(editor, "form"), children: "\u8868\u5355" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Pill, { active: editor?.tab === "json", onClick: () => editor && switchTab(editor, "json"), children: "JSON" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.modeSpacer }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.fieldLabel, children: '\u8868\u8FBE\u5F0F\u5199\u6CD5\uFF1A\u503C\u524D\u52A0 "js: " \u524D\u7F00\uFF08\u7B49\u4EF7 YAML \u7684 !!js\uFF09' })
    ] });
  }
  function renderEditorForm(ed) {
    const f = ed.form;
    const setF = (patch) => setEditor({ ...ed, form: { ...f, ...patch } });
    const kids = [];
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u540D\u79F0\uFF08\u6A21\u578B\u5DE5\u5177\u524D\u7F00 mcp__\u540D\u79F0__\u5DE5\u5177\uFF1B1-32 \u4F4D\u5B57\u6BCD/\u6570\u5B57/\u4E0B\u5212\u7EBF/\u8FDE\u5B57\u7B26\uFF09" }, "ln")
    );
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        TextInput,
        {
          value: f.serverName,
          placeholder: "my-mcp-server",
          mono: true,
          onChange: (v) => setF({ serverName: v })
        },
        "name"
      )
    );
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u7C7B\u578B" }, "lt"));
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Selector,
        {
          value: f.transport,
          selectedLabel: f.transport === "stdio" ? "stdio\uFF08\u672C\u5730\u547D\u4EE4\uFF09" : "streamable-http\uFF08HTTP\uFF09",
          options: [
            { id: "stdio", label: "stdio\uFF08\u672C\u5730\u547D\u4EE4\uFF09" },
            { id: "streamable-http", label: "streamable-http\uFF08HTTP\uFF09" }
          ],
          onSelect: (id) => setF({ transport: id === "stdio" ? "stdio" : "streamable-http" })
        },
        "transport"
      )
    );
    if (f.transport === "stdio") {
      kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u547D\u4EE4" }, "lc"));
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          TextInput,
          {
            value: f.command,
            placeholder: "npx",
            mono: true,
            onChange: (v) => setF({ command: v })
          },
          "cmd"
        )
      );
      kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u53C2\u6570\uFF08\u7A7A\u683C\u5206\u9694\uFF0C\u5F15\u53F7\u53EF\u5305\u88F9\u542B\u7A7A\u683C\u7684\u9879\uFF09" }, "la"));
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          TextInput,
          {
            value: f.argsText,
            placeholder: "-y @modelcontextprotocol/server-memory",
            mono: true,
            onChange: (v) => setF({ argsText: v })
          },
          "args"
        )
      );
      kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: '\u73AF\u5883\u53D8\u91CF\uFF08\u53EF\u9009\uFF0CJSON\uFF1B\u8868\u8FBE\u5F0F\u7528 "js: " \u524D\u7F00\uFF09' }, "le"));
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "textarea",
          {
            className: cx(styles_module_css_default.textarea, styles_module_css_default.textareaMono),
            rows: 4,
            spellCheck: false,
            placeholder: '{\n  "MY_API_KEY": "js: process.env.MY_API_KEY"\n}',
            value: f.envText,
            onChange: (e) => setF({ envText: e.target.value })
          },
          "env"
        )
      );
      kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u5DE5\u4F5C\u76EE\u5F55\uFF08\u53EF\u9009\uFF09" }, "lw"));
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          TextInput,
          {
            value: f.cwd,
            placeholder: "/absolute/path",
            mono: true,
            onChange: (v) => setF({ cwd: v })
          },
          "cwd"
        )
      );
    } else {
      kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "URL" }, "lu"));
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          TextInput,
          {
            value: f.url,
            placeholder: "https://mcp.example.com/mcp",
            mono: true,
            onChange: (v) => setF({ url: v })
          },
          "url"
        )
      );
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u4EC5\u652F\u6301 Streamable HTTP\u3002\u65E7\u5F0F\u7EAF SSE \u7AEF\u70B9\uFF08/sse\uFF09\u5B98\u65B9 dsh-mcp-client \u4E0D\u652F\u6301\uFF0C\u53EF\u6539\u7528 stdio \u7C7B\u578B\u586B npx mcp-remote https://\u2026 \u6865\u63A5\u3002" }, "ssehint")
      );
      kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: '\u8BF7\u6C42\u5934\uFF08\u53EF\u9009\uFF0CJSON\uFF1B\u8868\u8FBE\u5F0F\u7528 "js: " \u524D\u7F00\uFF09' }, "lh"));
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "textarea",
          {
            className: cx(styles_module_css_default.textarea, styles_module_css_default.textareaMono),
            rows: 4,
            spellCheck: false,
            placeholder: '{\n  "Authorization": "js: `Bearer ${process.env.MCP_TOKEN}`"\n}',
            value: f.headersText,
            onChange: (e) => setF({ headersText: e.target.value })
          },
          "headers"
        )
      );
    }
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u9AD8\u7EA7" }, "lv"));
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.twoCol, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u5DE5\u5177\u8C03\u7528\u8D85\u65F6 MS\uFF08\u9ED8\u8BA4 60000\uFF09" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            TextInput,
            {
              value: f.timeoutText,
              placeholder: "60000",
              mono: true,
              onChange: (v) => setF({ timeoutText: v })
            }
          )
        ] }, "tw"),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(FieldLabel, { text: "\u542F\u52A8\u5931\u8D25\u65F6\u62D2\u7EDD\u6FC0\u6D3B\uFF08\u9ED8\u8BA4\u5173\u95ED\uFF1A\u5931\u8D25\u53EA\u8BB0\u65E5\u5FD7\uFF09" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            Switch,
            {
              checked: f.failOnStartup,
              label: "failOnStartupError",
              onChange: (next) => setF({ failOnStartup: next })
            }
          )
        ] }, "fs")
      ] }, "adv")
    );
    return kids;
  }
  function renderEditorJson(ed) {
    return [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "textarea",
        {
          className: cx(styles_module_css_default.textarea, styles_module_css_default.textareaMono),
          rows: 18,
          spellCheck: false,
          value: ed.jsonText,
          onChange: (e) => setEditor({ ...ed, jsonText: e.target.value })
        },
        "json"
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: '\u5B8C\u6574 config\uFF08\u4F1A\u6574\u4F53\u66FF\u6362\u5DF2\u77E5\u5B57\u6BB5\uFF09\u3002\u672A\u8BC6\u522B\u7684\u81EA\u5B9A\u4E49\u952E\u4E0D\u4F1A\u88AB\u5220\u9664\uFF1B"js: " \u524D\u7F00\u7684\u503C\u56DE\u5199\u4E3A !!js \u8868\u8FBE\u5F0F\u3002' }, "jh")
    ];
  }
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.intro, children: "\u7BA1\u7406 cordis.patch.yml \u91CC\u7684 @deepseek-ai/dsh-mcp-client \u5B9E\u4F8B\uFF1B\u4FDD\u5B58\u540E DSH \u81EA\u52A8\u70ED\u91CD\u8FDE\u5BF9\u5E94\u670D\u52A1\u5668\u3002\u72B6\u6001\u70B9\u4E0E\u300CN \u5DE5\u5177\u300D\u5FBD\u6807\u6765\u81EA\u8FD0\u884C\u65F6\u5DE5\u5177\u6CE8\u518C\u8868\uFF0C\u6BCF 5 \u79D2\u81EA\u52A8\u5237\u65B0\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.rootPath, title: st.patchFile.path, children: (st.patchFile.exists ? "" : "\uFF08\u6587\u4EF6\u4E0D\u5B58\u5728\uFF09") + st.patchFile.path + "\uFF08" + patchSourceLabel(st.patchFile.source) + "\uFF09" }),
    st.fileIssue ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeWarn), children: st.fileIssue }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.toolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.count, children: "MCP " + st.servers.length }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.toolbarSpacer }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.searchW, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Input, { placeholder: "\u641C\u7D22 MCP \u670D\u52A1\u5668\u2026", value: search, onChange: (e) => setSearch(e.target.value) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "toolbar", title: "\u5237\u65B0\uFF08\u91CD\u65B0\u8BFB\u53D6 patch \u6587\u4EF6\uFF09", onClick: () => void load(), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconRefreshOutlineRegular, { size: 14 }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_dsh_client_ui_primitives2.Button, { variant: "primary", disabled: st.patchFile.exists === false, onClick: openCreate, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconPlusOutlineRegular, {}),
        "\u65B0\u5EFA"
      ] })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: error }) : null,
    st.servers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.empty, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.emptyTitle, children: "\u8FD8\u6CA1\u6709 MCP \u670D\u52A1\u5668" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u65B0\u5EFA\u4E00\u4E2A\u6761\u76EE\uFF0C\u6216\u6309\u5B98\u65B9 dsh-mcp-client \u7684\u8BF4\u660E\u624B\u5199 - insert: \u5B9E\u4F8B\uFF08\u5199\u597D\u540E\u56DE\u6765\u8FD9\u91CC\u7BA1\u7406\uFF09\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "primary", disabled: st.patchFile.exists === false, onClick: openCreate, children: "\u65B0\u5EFA MCP \u670D\u52A1\u5668" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.list, children: servers.map((v) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      ServerRow,
      {
        view: v,
        probe: st.probes[v.id],
        busy: probeBusy === v.id,
        saving,
        onEdit: () => openEdit(v),
        onToggle: () => onToggle(v, v.disabled),
        onProbe: () => void runProbe(v),
        onDelete: () => {
          setAcked(false);
          setConfirmDel(v);
        }
      },
      v.id
    )) }),
    editor === null ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      import_dsh_client_ui_primitives2.Modal,
      {
        open: true,
        onClose: () => setEditor(null),
        className: cx(styles_module_css_default.wideModal),
        title: editor.mode === "create" ? "\u65B0\u5EFA MCP \u670D\u52A1\u5668" : "\u7F16\u8F91 MCP \u670D\u52A1\u5668 \xB7 " + editor.id,
        closeLabel: "\u5173\u95ED",
        description: "\u4FDD\u5B58\u540E\u5199\u5165 cordis.patch.yml\uFF0CDSH \u4F1A\u70ED\u91CD\u8FDE\u5BF9\u5E94\u5B9E\u4F8B\u3002",
        footer: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.bar, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "primary", disabled: saving, onClick: () => void saveEditor(), children: "\u4FDD\u5B58" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { disabled: saving, onClick: () => setEditor(null), children: "\u53D6\u6D88" }),
          editorError ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: editorError }) : null
        ] }),
        children: [
          modeRow(),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.form, children: editorBody })
        ]
      }
    ),
    confirmDel === null ? null : import_dsh_client_ui_primitives2.RiskConfirmation ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_dsh_client_ui_primitives2.RiskConfirmation,
      {
        open: true,
        title: "\u5220\u9664 MCP \u670D\u52A1\u5668\u300C" + (confirmDel.serverName || confirmDel.id) + "\u300D\uFF1F",
        description: "\u5C06\u4ECE cordis.patch.yml \u79FB\u9664\u5B9E\u4F8B " + confirmDel.id + "\uFF0C\u5176\u5DE5\u5177\uFF08mcp__" + (confirmDel.serverName || "\u2026") + "__*\uFF09\u968F\u4E4B\u6CE8\u9500\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\uFF08\u6700\u8FD1\u4E00\u6B21\u6539\u52A8\u6709 .bak \u5907\u4EFD\uFF09\u3002",
        acknowledgeLabel: "\u6211\u5DF2\u4E86\u89E3\uFF0C\u5220\u9664\u8BE5\u670D\u52A1\u5668",
        cancelLabel: "\u53D6\u6D88",
        closeLabel: "\u5173\u95ED",
        confirmLabel: "\u5220\u9664",
        acknowledged: acked,
        onAcknowledgedChange: setAcked,
        onCancel: () => setConfirmDel(null),
        onConfirm: () => {
          const v = confirmDel;
          setConfirmDel(null);
          void runDelete(v);
        }
      },
      "confirm-del"
    ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_dsh_client_ui_primitives2.Modal,
      {
        open: true,
        onClose: () => setConfirmDel(null),
        title: "\u5220\u9664 MCP \u670D\u52A1\u5668\u300C" + (confirmDel.serverName || confirmDel.id) + "\u300D\uFF1F",
        closeLabel: "\u5173\u95ED",
        footer: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.bar, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            import_dsh_client_ui_primitives2.Button,
            {
              variant: "primary",
              disabled: saving,
              onClick: () => {
                const v = confirmDel;
                setConfirmDel(null);
                void runDelete(v);
              },
              children: "\u5220\u9664"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { onClick: () => setConfirmDel(null), children: "\u53D6\u6D88" })
        ] }),
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u5C06\u4ECE cordis.patch.yml \u79FB\u9664\u5B9E\u4F8B\u6761\u76EE\uFF0C\u5DE5\u5177\u968F\u4E4B\u6CE8\u9500\u3002" })
      },
      "confirm-del-fallback"
    ),
    confirmToggle === null ? null : import_dsh_client_ui_primitives2.RiskConfirmation ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_dsh_client_ui_primitives2.RiskConfirmation,
      {
        open: true,
        title: "\u8986\u76D6 disabled \u8868\u8FBE\u5F0F\uFF1F",
        description: "\u6761\u76EE " + confirmToggle.view.id + " \u7684 disabled \u5F53\u524D\u662F !!js \u8868\u8FBE\u5F0F\uFF0C\u5207\u6362\u540E\u4F1A\u5199\u6210\u666E\u901A\u5E03\u5C14\u503C " + String(!confirmToggle.next) + "\u3002",
        acknowledgeLabel: "\u6211\u5DF2\u4E86\u89E3\uFF0C\u8986\u76D6\u8868\u8FBE\u5F0F",
        cancelLabel: "\u53D6\u6D88",
        closeLabel: "\u5173\u95ED",
        confirmLabel: "\u7EE7\u7EED\u5207\u6362",
        acknowledged: acked,
        onAcknowledgedChange: setAcked,
        onCancel: () => setConfirmToggle(null),
        onConfirm: () => {
          const { view, next } = confirmToggle;
          setConfirmToggle(null);
          void runToggle(view, next);
        }
      },
      "confirm-toggle"
    ) : null,
    st.patchFile.exists === false ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PatchFileFix, { disabled: saving, onSubmit: (v) => void savePatchFile(v) }, "patchfix") : null
  ] });
}
function PatchFileFix({ disabled, onSubmit }) {
  const [val, setVal] = (0, import_react2.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.bar, style: { marginTop: "10px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeWarn), children: "patch \u6587\u4EF6\u4E0D\u5B58\u5728\uFF0C\u53EF\u5728\u6B64\u586B\u7EDD\u5BF9\u8DEF\u5F84\uFF1A" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.searchW, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      import_dsh_client_ui_primitives2.Input,
      {
        placeholder: "/home/me/.dsh/profiles/web/cordis.patch.yml",
        value: val,
        onChange: (e) => setVal(e.target.value)
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "toolbar", disabled: disabled || !val.trim(), onClick: () => onSubmit(val.trim()), children: "\u4FDD\u5B58\u8DEF\u5F84" })
  ] });
}
function patchSourceLabel(source) {
  if (source === "settings") return "\u8BBE\u7F6E\u9875\u6307\u5B9A";
  if (source === "env") return "DSH_PROFILE_DIR";
  if (source === "module-path") return "\u6309\u5B89\u88C5\u4F4D\u7F6E\u5B9A\u4F4D";
  if (source === "profile-scan") return "\u6309 profile \u767B\u8BB0\u5B9A\u4F4D";
  return "\u9ED8\u8BA4\u8DEF\u5F84";
}

// src/client/index.tsx
var SETTINGS_NS = "dshp-mcp-manager";
var SETTINGS_ORDER = 30;
var SETTINGS_LABEL = "MCP";
var inject = ["slots"];
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  try {
    ctx.effect(
      () => slots.inject(
        "settings.section",
        () => slots.register(
          { name: "settings.section", id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
          McpSection
        )
      ),
      "dshp-mcp-manager: settings section"
    );
  } catch (error) {
    console.error("[dshp-mcp-manager] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF0C\u8BBE\u7F6E\u9875\u5C06\u770B\u4E0D\u5230 MCP \u7BA1\u7406\uFF1A", error);
  }
}
return module.exports; } });
