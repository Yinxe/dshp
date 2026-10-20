window.__ModuleLoader__.load({ id: "@dshp/search-provider", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
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

// src/client/SearchSection.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/types.ts
var ROUTE_BASE = "/ext/dshp-search-provider";

// src/client/api.ts
async function request(path, init) {
  const response = await fetch(ROUTE_BASE + path, { cache: "no-store", ...init });
  try {
    return await response.json();
  } catch {
    return {
      ok: false,
      error: `\u63A5\u53E3\u8FD4\u56DE\u4E86\u975E JSON \u54CD\u5E94\uFF08HTTP ${response.status}\uFF09\uFF0C\u8BF7\u91CD\u542F dsh web \u540E\u91CD\u8BD5`
    };
  }
}
function fetchState() {
  return request("/state");
}
function saveConfig(patch) {
  return request("/config", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch)
  });
}
function runTest(providerId, query) {
  return request("/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider: providerId, query })
  });
}
function friendlyCredError(action, ref, error) {
  const raw = String(error?.message ?? error);
  if (/launching environment|shadowed|read-only/i.test(raw)) {
    if (action === "clear") {
      return `\u5F53\u524D Key \u6765\u81EA\u542F\u52A8 dsh \u7684\u7EC8\u7AEF\u73AF\u5883\uFF08\u73AF\u5883\u53D8\u91CF\u4F18\u5148\uFF0C\u9875\u9762\u65E0\u6CD5\u6E05\u9664\uFF09\u3002\u5982\u9700\u6539\u8D70\u6587\u4EF6\u7BA1\u7406\uFF1Aunset ${ref} \u540E\u91CD\u542F dsh web\u3002`;
    }
    return `\u4FDD\u5B58\u672A\u751F\u6548\uFF1A\u542F\u52A8 dsh \u7684\u7EC8\u7AEF\u73AF\u5883\u91CC\u5DF2\u6709 ${ref}\uFF0C\u73AF\u5883\u53D8\u91CF\u4F18\u5148\u4E8E\u51ED\u8BC1\u5E93\u3002\u5982\u9700\u6539\u8D70\u6587\u4EF6\u7BA1\u7406\uFF1Aunset ${ref} \u540E\u91CD\u542F dsh web\uFF0C\u518D\u56DE\u6765\u4FDD\u5B58\u3002`;
  }
  return raw;
}
async function saveKey(remote, ref, value) {
  if (!remote?.credentials) {
    return { ok: false, error: "\u51ED\u8BC1\u670D\u52A1\u4E0D\u53EF\u7528\uFF08remote.credentials \u672A\u6302\u8F7D\uFF09\uFF0C\u8BF7\u91CD\u542F dsh web" };
  }
  try {
    const response = await remote.credentials.set(ref, value);
    if (response.ok) return { ok: true, state: await fetchState() };
    return { ok: false, error: friendlyCredError("save", ref, response.error?.message ?? "\u51ED\u8BC1\u5199\u5165\u5931\u8D25") };
  } catch (error) {
    return { ok: false, error: friendlyCredError("save", ref, error) };
  }
}
async function clearKey(remote, ref) {
  if (!remote?.credentials) {
    return { ok: false, error: "\u51ED\u8BC1\u670D\u52A1\u4E0D\u53EF\u7528\uFF08remote.credentials \u672A\u6302\u8F7D\uFF09\uFF0C\u8BF7\u91CD\u542F dsh web" };
  }
  try {
    const response = await remote.credentials.unset(ref);
    if (response.ok) return { ok: true, state: await fetchState() };
    return { ok: false, error: friendlyCredError("clear", ref, response.error?.message ?? "\u51ED\u8BC1\u6E05\u9664\u5931\u8D25") };
  } catch (error) {
    return { ok: false, error: friendlyCredError("clear", ref, error) };
  }
}

// src/client/components.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = ".iUjxZG_page{max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:14px;display:flex}.iUjxZG_header{justify-content:space-between;align-items:flex-start;gap:24px;display:flex}.iUjxZG_headerText{flex-direction:column;gap:4px;min-width:0;display:flex}.iUjxZG_title{margin:0;font-size:16px;font-weight:600;line-height:24px}.iUjxZG_lead{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.iUjxZG_tags{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.iUjxZG_card{border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);flex-direction:column;display:flex;overflow:hidden}.iUjxZG_row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:16px;padding:14px 16px;display:flex}.iUjxZG_row:last-child{border-bottom:none}.iUjxZG_rowText{flex-direction:column;flex:1;gap:3px;min-width:0;display:flex}.iUjxZG_rowLabel{font-size:13px;font-weight:500;line-height:20px}.iUjxZG_rowDesc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.iUjxZG_select{flex:none;max-width:320px}.iUjxZG_selectLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.iUjxZG_chevron{flex:none;margin-left:6px}.iUjxZG_keyBox{flex-direction:column;flex:none;gap:6px;width:min(420px,52%);display:flex}.iUjxZG_keyLine{align-items:center;gap:6px;display:flex}.iUjxZG_keyInput{flex:1;min-width:0}.iUjxZG_keyMeta{align-items:center;gap:8px;min-height:18px;display:flex}.iUjxZG_muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.iUjxZG_error,.iUjxZG_warning,.iUjxZG_info,.iUjxZG_hint{margin:0;font-size:12px;line-height:18px}.iUjxZG_error{color:var(--dsw-alias-state-error-primary)}.iUjxZG_warning{color:var(--dsw-alias-state-warn-primary)}.iUjxZG_info,.iUjxZG_hint{color:var(--dsw-alias-label-secondary)}.iUjxZG_loading{align-items:center;gap:8px;padding:24px 0;display:flex}.iUjxZG_loadingText{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}.iUjxZG_testBox{flex-direction:column;gap:8px;padding:14px 16px;display:flex}.iUjxZG_testLine{align-items:center;gap:8px;display:flex}.iUjxZG_testInput{flex:1;min-width:0}.iUjxZG_testResult{flex-direction:column;gap:8px;padding-top:4px;display:flex}.iUjxZG_testMeta{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}.iUjxZG_testContent{color:var(--dsw-alias-label-primary);white-space:pre-wrap;margin:0;font-size:13px;line-height:20px}.iUjxZG_results{flex-direction:column;gap:8px;display:flex}.iUjxZG_result{border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2);flex-direction:column;gap:2px;padding:10px 12px;display:flex}.iUjxZG_resultTitle{color:var(--dsw-alias-brand-primary);font-size:13px;font-weight:500;line-height:20px;text-decoration:none}.iUjxZG_resultTitle:hover{text-decoration:underline}.iUjxZG_resultUrl{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;font-size:11px;line-height:16px}.iUjxZG_resultSnippet{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;margin:0;font-size:12px;line-height:18px}.iUjxZG_resultMeta{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px}@media (width<=620px){.iUjxZG_header{flex-direction:column;gap:10px}.iUjxZG_row{flex-direction:column;align-items:stretch;gap:10px}.iUjxZG_select{align-self:flex-start;max-width:100%}.iUjxZG_keyBox{width:100%}.iUjxZG_testLine{flex-direction:column;align-items:stretch}}";
var tagId = "@dshp/search-provider/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/search-provider");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "card": "iUjxZG_card", "chevron": "iUjxZG_chevron", "error": "iUjxZG_error", "header": "iUjxZG_header", "headerText": "iUjxZG_headerText", "hint": "iUjxZG_hint", "info": "iUjxZG_info", "keyBox": "iUjxZG_keyBox", "keyInput": "iUjxZG_keyInput", "keyLine": "iUjxZG_keyLine", "keyMeta": "iUjxZG_keyMeta", "lead": "iUjxZG_lead", "loading": "iUjxZG_loading", "loadingText": "iUjxZG_loadingText", "muted": "iUjxZG_muted", "page": "iUjxZG_page", "result": "iUjxZG_result", "resultMeta": "iUjxZG_resultMeta", "resultSnippet": "iUjxZG_resultSnippet", "resultTitle": "iUjxZG_resultTitle", "resultUrl": "iUjxZG_resultUrl", "results": "iUjxZG_results", "row": "iUjxZG_row", "rowDesc": "iUjxZG_rowDesc", "rowLabel": "iUjxZG_rowLabel", "rowText": "iUjxZG_rowText", "select": "iUjxZG_select", "selectLabel": "iUjxZG_selectLabel", "tags": "iUjxZG_tags", "testBox": "iUjxZG_testBox", "testContent": "iUjxZG_testContent", "testInput": "iUjxZG_testInput", "testLine": "iUjxZG_testLine", "testMeta": "iUjxZG_testMeta", "testResult": "iUjxZG_testResult", "title": "iUjxZG_title", "warning": "iUjxZG_warning" };

// src/client/components.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function Row({ label, desc, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.rowText, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.rowLabel, children: label }),
      desc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.rowDesc, children: desc }) : null
    ] }),
    children
  ] });
}
function Select({ disabled, value, label, selectedLabel, options, onSelect }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const anchor = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_dsh_client_ui_primitives.Button,
    {
      variant: "outline",
      size: "sm",
      className: styles_module_css_default.select,
      "aria-label": label,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      disabled,
      onClick: () => setOpen((current) => !current),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.selectLabel, children: selectedLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { className: styles_module_css_default.chevron })
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
      align: "end",
      portal: true,
      anchor
    }
  );
}
function KeyField({
  label,
  desc,
  configured,
  source,
  required,
  draft,
  saving,
  onDraft,
  onSave,
  onClear
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.rowText, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.rowLabel, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.rowDesc, children: desc })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.keyBox, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.keyLine, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_dsh_client_ui_primitives.Input,
          {
            className: styles_module_css_default.keyInput ?? "",
            type: "password",
            value: draft,
            placeholder: configured ? "\u5DF2\u914D\u7F6E\uFF1B\u8F93\u5165\u65B0 Key \u53EF\u8986\u76D6" : required ? "\u7C98\u8D34 API Key" : "\u53EF\u9009",
            autoComplete: "off",
            spellCheck: false,
            disabled: saving,
            onChange: (event) => onDraft(event.target.value)
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "primary", size: "sm", disabled: saving || draft.trim().length === 0, onClick: onSave, children: "\u4FDD\u5B58" }),
        configured ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", size: "sm", disabled: saving, onClick: onClear, children: "\u6E05\u9664" }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.keyMeta, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Tag, { tone: configured ? "success" : required ? "warning" : "neutral", children: configured ? "\u5DF2\u914D\u7F6E" : required ? "\u672A\u914D\u7F6E" : "\u53EF\u9009" }),
        source ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: styles_module_css_default.muted, children: [
          "\u6765\u6E90\uFF1A",
          source
        ] }) : null
      ] })
    ] })
  ] });
}
function Notice({
  kind,
  children
}) {
  const className = kind === "error" ? styles_module_css_default.error : kind === "warning" ? styles_module_css_default.warning : styles_module_css_default.info;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className, role: kind === "error" ? "alert" : void 0, children });
}
function Loading({ text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.loading, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconLoadingOutlineRegular, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.loadingText, children: text })
  ] });
}
function ResultList({ sources }) {
  if (sources.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: styles_module_css_default.hint, children: "\u6CA1\u6709\u8FD4\u56DE\u7ED3\u679C\u3002" });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.results, children: sources.map((source, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.result, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { className: styles_module_css_default.resultTitle, href: source.url, target: "_blank", rel: "noreferrer", children: source.title || source.url }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.resultUrl, children: source.url }),
    source.snippet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: styles_module_css_default.resultSnippet, children: source.snippet }) : null,
    source.publishedAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.resultMeta, children: source.publishedAt }) : null
  ] }, source.url + "#" + String(index))) });
}

// src/client/SearchSection.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var MAX_RESULTS_OPTIONS = ["1", "2", "3", "4", "5", "6", "8", "10"];
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function readBlock(config, providerId) {
  if (!config) return {};
  const value = config[providerId];
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function optionLabel(field, value) {
  const found = field.options?.find((option) => option.value === value);
  return found?.label ?? String(value ?? "");
}
function SearchSection({ remote }) {
  const [info, setInfo] = (0, import_react2.useState)(null);
  const [config, setConfig] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const [keySaving, setKeySaving] = (0, import_react2.useState)(false);
  const [testing, setTesting] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)("");
  const [keyDraft, setKeyDraft] = (0, import_react2.useState)("");
  const [query, setQuery] = (0, import_react2.useState)("");
  const [testResult, setTestResult] = (0, import_react2.useState)(null);
  const load = (0, import_react2.useCallback)(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchState();
      if (!response.ok) throw new Error(response.error || "\u72B6\u6001\u8BFB\u53D6\u5931\u8D25");
      setInfo(response);
      setConfig(response.config ?? null);
    } catch (cause) {
      setError("\u8BFB\u53D6\u5931\u8D25\uFF1A" + errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);
  (0, import_react2.useEffect)(() => {
    void load();
  }, [load]);
  async function save(patch) {
    setSaving(true);
    setError("");
    setTestResult(null);
    try {
      const response = await saveConfig(patch);
      if (!response.ok) throw new Error(response.error || "\u4FDD\u5B58\u5931\u8D25");
      setConfig(response.config ?? null);
    } catch (cause) {
      setError("\u4FDD\u5B58\u5931\u8D25\uFF1A" + errorMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  async function handleSaveKey(provider) {
    const value = keyDraft.trim();
    if (value.length === 0) {
      setError("\u8BF7\u8F93\u5165 API Key \u540E\u518D\u4FDD\u5B58");
      return;
    }
    setKeySaving(true);
    setError("");
    try {
      const response = await saveKey(remote, provider.credentialRef, value);
      if (!response.ok) throw new Error(response.error || "\u4FDD\u5B58\u5BC6\u94A5\u5931\u8D25");
      if (response.state) {
        setInfo(response.state);
        setConfig(response.state.config ?? null);
      }
      setKeyDraft("");
    } catch (cause) {
      setError("\u4FDD\u5B58\u5BC6\u94A5\u5931\u8D25\uFF1A" + errorMessage(cause));
    } finally {
      setKeySaving(false);
    }
  }
  async function handleClearKey(provider) {
    setKeySaving(true);
    setError("");
    try {
      const response = await clearKey(remote, provider.credentialRef);
      if (!response.ok) throw new Error(response.error || "\u6E05\u9664\u5BC6\u94A5\u5931\u8D25");
      if (response.state) {
        setInfo(response.state);
        setConfig(response.state.config ?? null);
      }
      setKeyDraft("");
    } catch (cause) {
      setError("\u6E05\u9664\u5BC6\u94A5\u5931\u8D25\uFF1A" + errorMessage(cause));
    } finally {
      setKeySaving(false);
    }
  }
  async function handleTest(provider) {
    const text = query.trim();
    if (text.length === 0) {
      setError("\u8BF7\u8F93\u5165\u6D4B\u8BD5\u67E5\u8BE2");
      return;
    }
    setTesting(true);
    setError("");
    setTestResult(null);
    try {
      setTestResult(await runTest(provider.id, text));
    } catch (cause) {
      setTestResult({ ok: false, error: "\u6D4B\u8BD5\u5931\u8D25\uFF1A" + errorMessage(cause) });
    } finally {
      setTesting(false);
    }
  }
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.page, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Loading, { text: "\u6B63\u5728\u8BFB\u53D6\u641C\u7D22\u914D\u7F6E\u2026" }) });
  }
  const providers = info?.providers ?? [];
  const providerId = config?.provider ?? providers[0]?.id ?? "";
  const focused = providers.find((provider) => provider.id === providerId) ?? providers[0] ?? null;
  const block = focused ? readBlock(config, focused.id) : {};
  const selectedProviderId = info?.selectedProviderId ?? null;
  const webSearchConfigured = info?.webSearchConfigured === true;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: styles_module_css_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.headerText, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: styles_module_css_default.title, children: "AI \u641C\u7D22" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.lead, children: "\u63A5\u7BA1\u6A21\u578B\u7684\u5185\u7F6E web_search\uFF1B\u540E\u7AEF\u53EF\u9009 Tavily / Exa / Firecrawl\uFF0C\u5BC6\u94A5\u5B58 DSH \u51ED\u8BC1\u5E93\uFF0C\u4E0D\u8FDB\u914D\u7F6E\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone: webSearchConfigured ? "success" : "warning", children: webSearchConfigured ? "\u5DF2\u63A5\u7BA1 web_search" : "\u672A\u63A5\u7BA1" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.tags, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_dsh_client_ui_primitives2.Tag, { tone: "info", children: [
        providers.length,
        " \u4E2A\u540E\u7AEF"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone: focused?.configured || focused?.credentialRequired === false ? "success" : "warning", children: focused ? focused.credentialRequired === false ? "\u65E0\u9700 Key" : focused.configured ? "Key \u5DF2\u914D\u7F6E" : "Key \u672A\u914D\u7F6E" : "\u65E0\u540E\u7AEF" }),
      selectedProviderId ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_dsh_client_ui_primitives2.Tag, { tone: webSearchConfigured ? "success" : "neutral", children: [
        "web.searchProvider: ",
        selectedProviderId
      ] }) : null
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Notice, { kind: "error", children: error }) : null,
    info?.selectionHint ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Notice, { kind: "warning", children: info.selectionHint }) : null,
    providers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Notice, { kind: "warning", children: "\u6CA1\u6709\u53EF\u7528\u7684\u641C\u7D22\u540E\u7AEF\u3002" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u641C\u7D22\u5F15\u64CE", desc: focused ? focused.description : "\u9009\u62E9\u641C\u7D22\u540E\u7AEF\uFF1B\u5207\u6362\u5373\u65F6\u751F\u6548\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Select,
        {
          disabled: saving,
          value: providerId,
          label: "\u641C\u7D22\u5F15\u64CE",
          selectedLabel: focused ? focused.label : "\u9009\u62E9\u540E\u7AEF\u2026",
          options: providers.map((provider) => ({ id: provider.id, label: provider.label })),
          onSelect: (id) => void save({ provider: id })
        }
      ) }),
      focused ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u514D\u8D39\u989D\u5EA6", desc: focused.freeNote, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone: "info", children: focused.label }) }) : null,
      focused ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        KeyField,
        {
          label: "API Key",
          desc: `\u51ED\u8BC1\u5F15\u7528 ${focused.credentialRef}\uFF1B\u4FDD\u5B58\u540E\u5373\u65F6\u751F\u6548\u3002`,
          configured: focused.configured,
          source: focused.source,
          required: focused.credentialRequired,
          draft: keyDraft,
          saving: keySaving,
          onDraft: setKeyDraft,
          onSave: () => void handleSaveKey(focused),
          onClear: () => void handleClearKey(focused)
        }
      ) : null,
      focused?.fields.map((field) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: field.label, desc: field.hint, children: field.kind === "select" && field.options ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Select,
        {
          disabled: saving,
          value: String(block[field.key] ?? field.options[0]?.value ?? ""),
          label: field.label,
          selectedLabel: optionLabel(field, block[field.key] ?? field.options[0]?.value),
          options: field.options.map((option) => ({
            id: option.value,
            label: option.label
          })),
          onSelect: (value) => void save({ [focused.id]: { [field.key]: value } })
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.muted, children: String(block[field.key] ?? "") }) }, field.key))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.card, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u9ED8\u8BA4\u7ED3\u679C\u6570", desc: "\u8C03\u7528\u65B9\u663E\u5F0F\u4F20 maxResults \u65F6\u4EE5\u8C03\u7528\u65B9\u4E3A\u51C6\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      Select,
      {
        disabled: saving,
        value: String(config?.maxResults ?? 5),
        label: "\u9ED8\u8BA4\u7ED3\u679C\u6570",
        selectedLabel: String(config?.maxResults ?? 5) + " \u6761",
        options: MAX_RESULTS_OPTIONS.map((value) => ({ id: value, label: value + " \u6761" })),
        onSelect: (value) => void save({ maxResults: Number(value) })
      }
    ) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.card, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.testBox, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.testLine, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_dsh_client_ui_primitives2.Input,
          {
            className: styles_module_css_default.testInput ?? "",
            value: query,
            placeholder: focused ? `\u6D4B\u8BD5 ${focused.label} \u641C\u7D22\u2026` : "\u8F93\u5165\u6D4B\u8BD5\u67E5\u8BE2",
            disabled: testing || saving || focused === null,
            onChange: (event) => setQuery(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter" && focused) void handleTest(focused);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_dsh_client_ui_primitives2.Button,
          {
            variant: "primary",
            size: "sm",
            disabled: testing || saving || focused === null,
            onClick: () => {
              if (focused) void handleTest(focused);
            },
            children: testing ? "\u641C\u7D22\u4E2D\u2026" : "\u6D4B\u8BD5\u641C\u7D22"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u6D4B\u8BD5\u4F1A\u771F\u5B9E\u8C03\u7528\u6240\u9009\u540E\u7AEF\uFF1BFirecrawl \u4E0D\u586B Key \u4E5F\u53EF\u7528\uFF0C\u5176\u4F59\u540E\u7AEF\u9700\u8981\u5148\u914D\u7F6E Key\u3002" }),
      testResult ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.testResult, children: testResult.ok ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: styles_module_css_default.testMeta, children: [
          testResult.provider,
          " \xB7 ",
          testResult.takenMs ?? 0,
          " ms \xB7 ",
          (testResult.sources ?? []).length,
          " ",
          "\u6761\u7ED3\u679C"
        ] }),
        testResult.content ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.testContent, children: testResult.content }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ResultList, { sources: testResult.sources ?? [] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Notice, { kind: "error", children: testResult.error ?? "\u6D4B\u8BD5\u5931\u8D25" }) }) : null
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u672C\u63D2\u4EF6\u6CE8\u518C\u56FA\u5B9A\u7684 web \u63D0\u4F9B\u65B9 dshp-search\uFF1Bprofile \u7684 web.searchProvider \u9700\u6307\u5411\u5B83\u3002 \u5B89\u88C5\u65F6\u7684 bundle patch \u4F1A\u81EA\u52A8\u8BBE\u7F6E\uFF0C\u82E5\u88AB\u5176\u4ED6 patch \u8986\u76D6\uFF0C\u6309\u4E0A\u65B9\u63D0\u793A\u4FEE\u6539\u540E\u91CD\u542F dsh web\u3002" })
  ] });
}

// src/client/index.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var SETTINGS_NS = "dshp-search-provider";
var SETTINGS_ORDER = 28;
var SETTINGS_LABEL = "AI \u641C\u7D22";
var inject = ["slots", "remote", "remote.credentials"];
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  const remote = ctx.get("remote");
  const Section = () => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(SearchSection, { remote });
  try {
    ctx.effect(
      () => slots.inject(
        "settings.section",
        () => slots.register(
          {
            name: "settings.section",
            id: SETTINGS_NS,
            order: SETTINGS_ORDER,
            label: SETTINGS_LABEL
          },
          Section
        )
      ),
      "dshp-search-provider: settings section"
    );
  } catch (error) {
    console.error("[dshp-search-provider] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF1A", error);
  }
}
return module.exports; } });
