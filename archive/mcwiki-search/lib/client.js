window.__ModuleLoader__.load({ id: "@dshp/mcwiki-search", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
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

// src/client/CommandCard.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = "._3934jG_page{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;display:flex}._3934jG_section{flex-direction:column;width:100%;display:flex}._3934jG_sectionHead{color:var(--dsw-alias-label-secondary);padding:14px 0 2px;font-size:12px;font-weight:500;line-height:18px}._3934jG_row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}._3934jG_section ._3934jG_row:last-child,._3934jG_section ._3934jG_bar:last-child{border-bottom:none}._3934jG_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}._3934jG_control{flex:none;align-items:center;gap:8px;display:inline-flex}._3934jG_unit{color:var(--dsw-alias-label-secondary);flex:none;font-size:14px;line-height:22px}._3934jG_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}._3934jG_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}._3934jG_intro{color:var(--dsw-alias-label-tertiary);margin:0 0 4px;font-size:14px;line-height:22px}._3934jG_results{flex-direction:column;gap:8px;padding:8px 0;display:flex}._3934jG_inputWrap{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);border-radius:8px;align-items:center;gap:6px;width:100%;height:32px;padding:0 8px;display:inline-flex}._3934jG_inputWrap:focus-within{border-color:var(--dsw-alias-brand-primary)}._3934jG_input{min-width:0;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;flex:1;font-family:inherit;font-size:14px;line-height:22px}._3934jG_input::placeholder{color:var(--dsw-alias-label-dimmed)}._3934jG_input:disabled{opacity:.5}._3934jG_badge{white-space:nowrap;border-radius:10px;align-items:center;height:20px;padding:0 8px;font-size:11px;font-weight:500;line-height:20px;display:inline-flex}._3934jG_badgeOk{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}._3934jG_badgeMuted{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-caption)}._3934jG_notice{margin:0;font-size:12px;line-height:18px}._3934jG_noticeErr{color:var(--dsw-alias-state-error-primary)}._3934jG_noticeOk{color:var(--dsw-alias-state-success-primary)}._3934jG_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}._3934jG_bar{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;align-items:center;gap:8px;padding:12px 0;display:flex}._3934jG_barEnd{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px;padding:12px 0;display:flex}._3934jG_loading{align-items:center;gap:8px;display:flex}._3934jG_loadingText{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}._3934jG_resultItem{border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;flex-direction:column;gap:4px;padding:10px 12px;display:flex}._3934jG_resultItem a{color:var(--dsw-alias-state-business-primary);font-weight:500;text-decoration:none}._3934jG_resultItem a:hover{text-decoration:underline}._3934jG_resultSnippet{color:var(--dsw-alias-label-secondary);margin-top:4px;font-size:12px;line-height:18px}._3934jG_resultMeta{color:var(--dsw-alias-label-tertiary);word-break:break-all;margin-top:4px;font-size:12px}._3934jG_codeblock{margin-top:8px}._3934jG_codeblock pre{max-height:320px;overflow:auto}._3934jG_cmdRoot,._3934jG_cmdRow{width:100%}._3934jG_cmdTitle{font-size:13px}._3934jG_cmdSummary{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;min-width:0;font-size:12px;line-height:18px;overflow:hidden}._3934jG_cmdSummaryErr{color:var(--dsw-alias-state-error-primary)}._3934jG_cmdBody{color:var(--dsw-alias-label-primary);padding:4px 0 8px;font-size:13px;line-height:20px}";
var tagId = "@dshp/mcwiki-search/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/mcwiki-search");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "badge": "_3934jG_badge", "badgeMuted": "_3934jG_badgeMuted", "badgeOk": "_3934jG_badgeOk", "bar": "_3934jG_bar", "barEnd": "_3934jG_barEnd", "cmdBody": "_3934jG_cmdBody", "cmdRoot": "_3934jG_cmdRoot", "cmdRow": "_3934jG_cmdRow", "cmdSummary": "_3934jG_cmdSummary", "cmdSummaryErr": "_3934jG_cmdSummaryErr", "cmdTitle": "_3934jG_cmdTitle", "codeblock": "_3934jG_codeblock", "control": "_3934jG_control", "desc": "_3934jG_desc", "hint": "_3934jG_hint", "input": "_3934jG_input", "inputWrap": "_3934jG_inputWrap", "intro": "_3934jG_intro", "loading": "_3934jG_loading", "loadingText": "_3934jG_loadingText", "notice": "_3934jG_notice", "noticeErr": "_3934jG_noticeErr", "noticeOk": "_3934jG_noticeOk", "page": "_3934jG_page", "resultItem": "_3934jG_resultItem", "resultMeta": "_3934jG_resultMeta", "resultSnippet": "_3934jG_resultSnippet", "results": "_3934jG_results", "row": "_3934jG_row", "rowText": "_3934jG_rowText", "section": "_3934jG_section", "sectionHead": "_3934jG_sectionHead", "title": "_3934jG_title", "unit": "_3934jG_unit" };

// src/client/components.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function cx(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var BADGE_CLASS = {
  ok: styles_module_css_default.badgeOk,
  muted: styles_module_css_default.badgeMuted
};
function Badge({ kind, text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx(styles_module_css_default.badge, BADGE_CLASS[kind]), children: text });
}
function Row({ label, desc, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.rowText, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.title, children: label }),
      desc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.desc, children: desc }) : null
    ] }),
    children
  ] });
}

// src/client/CommandCard.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var MD_LABELS = {
  code: { copyLabel: "\u590D\u5236", copiedLabel: "\u5DF2\u590D\u5236" },
  footnotes: "\u811A\u6CE8"
};
function summaryOf(text) {
  return text.split("\n")[0]?.replace(/^#+\s*/, "").replace(/\*\*/g, "").slice(0, 120) ?? "";
}
function McwikiCommandCard(props) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const node = props?.node ?? {};
  const outcome = node.outcome ?? null;
  const text = typeof outcome?.text === "string" ? outcome.text : "";
  const state = outcome === null ? "running" : outcome.kind === "error" ? "error" : "ok";
  const body = text.includes("\n") ? text : null;
  const summary = outcome === null ? "\u6B63\u5728\u67E5\u8BE2 Minecraft Wiki\u2026" : state === "error" ? text : text.length === 0 ? "\u5B8C\u6210" : summaryOf(text);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.cmdRoot, "data-state": state, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_dsh_client_ui_primitives.DisclosureRow,
    {
      rowClassName: styles_module_css_default.cmdRow,
      titleClassName: styles_module_css_default.cmdTitle,
      icon: state === "error" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.StateDot, { state: "error" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.IconApiOutlineRegular, {}),
      title: "mcwiki",
      open: open && body !== null,
      expandable: body !== null,
      expandOnRowClick: true,
      keepContentWhenOpen: true,
      onToggle: () => setOpen((v) => !v),
      collapsedContent: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: cx(styles_module_css_default.cmdSummary, state === "error" ? styles_module_css_default.cmdSummaryErr : void 0), children: summary }),
      children: body !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.cmdBody, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives.MarkdownText, { text, streaming: false, labels: MD_LABELS }) }) : null
    }
  ) });
}

// src/client/McWikiSection.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/api.ts
var BASE = "/ext/dshp-mcwiki-search";
async function fetchState() {
  const r = await fetch(`${BASE}/state`, { cache: "no-store" });
  return await r.json();
}
async function saveConfig(patch) {
  const r = await fetch(`${BASE}/config`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch ?? {})
  });
  return await r.json();
}
async function runTest(value, kind) {
  const r = await fetch(`${BASE}/test`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      kind === "page" ? { query: value, title: value, section: "full" } : { query: value, section: "intro" }
    )
  });
  return await r.json();
}

// src/client/McWikiSection.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var NOTICE_CLASS = {
  ok: styles_module_css_default.noticeOk,
  err: styles_module_css_default.noticeErr
};
function renderResultItems(value) {
  const items = [];
  for (const item of value.results ?? []) {
    items.push(
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.resultItem, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.Tooltip, { label: item.url, side: "top", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { href: item.url, target: "_blank", rel: "noreferrer", children: item.title }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.resultSnippet, children: item.snippet }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.resultMeta, children: item.url + (item.updated ? " \xB7 \u66F4\u65B0 " + String(item.updated).slice(0, 10) : "") })
      ] }, item.url)
    );
  }
  return items.length > 0 ? items : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.hint, children: "\u65E0\u7ED3\u679C" });
}
function McWikiSection() {
  const [info, setInfo] = (0, import_react2.useState)(null);
  const [cfg, setCfg] = (0, import_react2.useState)(null);
  const [cfgBusy, setCfgBusy] = (0, import_react2.useState)(false);
  const [stateErr, setStateErr] = (0, import_react2.useState)(null);
  const [notice, setNotice] = (0, import_react2.useState)(null);
  const [busy, setBusy] = (0, import_react2.useState)(null);
  const [query, setQuery] = (0, import_react2.useState)("");
  const [result, setResult] = (0, import_react2.useState)(null);
  const [title, setTitle] = (0, import_react2.useState)("");
  const [pageResult, setPageResult] = (0, import_react2.useState)(null);
  const load = (0, import_react2.useCallback)(() => {
    fetchState().then((value) => {
      if (value && value.ok) {
        setInfo(value);
        setCfg(value && value.config || null);
        setStateErr(null);
      } else setStateErr(value && value.error || "\u65E0\u6CD5\u8BFB\u53D6\u63D2\u4EF6\u72B6\u6001");
    }).catch((error) => setStateErr(String(error?.message ?? error)));
  }, []);
  (0, import_react2.useEffect)(() => {
    load();
  }, [load]);
  const saveCfg = () => {
    if (cfg === null) return;
    setCfgBusy(true);
    setNotice(null);
    saveConfig(cfg).then((value) => {
      setCfgBusy(false);
      if (value && value.ok) {
        setCfg(value.config ?? null);
        setNotice({ kind: "ok", text: "\u914D\u7F6E\u5DF2\u4FDD\u5B58\u5230 settings.yaml\uFF08dshp-mcwiki-search\uFF09\uFF0C\u5373\u65F6\u751F\u6548\u3002" });
        load();
      } else setNotice({ kind: "err", text: value && value.error || "\u4FDD\u5B58\u5931\u8D25" });
    }).catch((error) => {
      setCfgBusy(false);
      setNotice({ kind: "err", text: String(error?.message ?? error) });
    });
  };
  const runSearch = () => {
    const q = query.trim();
    if (q.length === 0) {
      setNotice({ kind: "err", text: "\u5148\u8F93\u5165\u4E00\u4E2A\u6D4B\u8BD5\u67E5\u8BE2\u3002" });
      return;
    }
    setBusy("search");
    setNotice(null);
    setResult(null);
    runTest(q, "search").then((value) => {
      setBusy(null);
      setResult(value || { ok: false, error: "\u65E0\u54CD\u5E94" });
    }).catch((error) => {
      setBusy(null);
      setResult({ ok: false, error: String(error?.message ?? error) });
    });
  };
  const runPage = () => {
    const t = title.trim();
    if (t.length === 0) {
      setNotice({ kind: "err", text: "\u5148\u8F93\u5165\u4E00\u4E2A\u9875\u9762\u6807\u9898\u3002" });
      return;
    }
    setBusy("page");
    setNotice(null);
    setPageResult(null);
    runTest(t, "page").then((value) => {
      setBusy(null);
      setPageResult(value || { ok: false, error: "\u65E0\u54CD\u5E94" });
    }).catch((error) => {
      setBusy(null);
      setPageResult({ ok: false, error: String(error?.message ?? error) });
    });
  };
  const siteBadge = info === null ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { kind: "muted", text: "\u8BFB\u53D6\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { kind: "ok", text: "\u4E2D\u6587 Minecraft Wiki" });
  const numInput = (key, unit) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: styles_module_css_default.control, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.inputWrap, style: { width: 96 }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        className: styles_module_css_default.input,
        style: { textAlign: "right", fontVariantNumeric: "tabular-nums" },
        inputMode: "numeric",
        disabled: cfgBusy || cfg === null,
        value: cfg === null ? "" : String(cfg[key]),
        onChange: (event) => {
          const v = event.target.value;
          setCfg((prev) => prev === null ? prev : { ...prev, [key]: v === "" ? 0 : Number(v) });
        }
      }
    ) }),
    unit ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.unit, children: unit }) : null
  ] });
  const searchInput = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.inputWrap, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.IconSearchOutlineRegular, {}),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        className: styles_module_css_default.input,
        placeholder: "\u641C\u7D22\uFF0C\u4F8B\u5982\uFF1A\u94BB\u77F3 / \u82E6\u529B\u6015 / Ancient City",
        value: query,
        onChange: (event) => setQuery(event.target.value),
        onKeyDown: (event) => {
          if (event.key === "Enter") runSearch();
        }
      }
    )
  ] });
  const pageInput = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.inputWrap, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "input",
    {
      className: styles_module_css_default.input,
      placeholder: "\u9875\u9762\u6807\u9898\uFF0C\u4F8B\u5982\uFF1A\u82E6\u529B\u6015 / Diamond Ore",
      value: title,
      onChange: (event) => setTitle(event.target.value),
      onKeyDown: (event) => {
        if (event.key === "Enter") runPage();
      }
    }
  ) });
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: styles_module_css_default.intro, children: "\u76F4\u63A5\u4ECE Minecraft Wiki\uFF08MediaWiki API\uFF09\u67E5\u8BE2\uFF0C\u5E76\u628A\u641C\u7D22\u7ED3\u679C / \u9875\u9762\u5168\u6587\u5B8C\u6574\u8F6C\u6362\u4E3A AI \u53EF\u76F4\u63A5\u9605\u8BFB\u7684\u5E72\u51C0\u6587\u672C\uFF08\u53BB\u6A21\u677F\u3001\u53BB\u5F15\u7528\u3001wikitext\u2192Markdown\uFF09\u3002\u6A21\u578B\u5DE5\u5177\u9ED8\u8BA4\u5B8C\u6574\u8F93\u51FA\u3001\u4E0D\u622A\u65AD\uFF0C\u6240\u6709\u4FE1\u606F\u4E0E\u7EC6\u8282\u90FD\u4F1A\u4FDD\u7559\u3002\u53EF\u7528\u5DE5\u5177\uFF1Amcwiki_search\u3001mcwiki_get_page\u3001mcwiki_random\u3002" }),
    stateErr ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: "\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF1A" + stateErr }) : null,
    notice ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: cx(styles_module_css_default.notice, NOTICE_CLASS[notice.kind]), children: notice.text }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u6570\u636E\u6E90" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u6570\u636E\u6E90", desc: "\u641C\u7D22\u4E0E\u9875\u9762\u6293\u53D6\u7684\u76EE\u6807\u7AD9\u70B9\u3002", children: siteBadge }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5BC6\u94A5", desc: "\u65E0\u9700\u6CE8\u518C\uFF0C\u516C\u5F00\u63A5\u53E3\u76F4\u63A5\u8C03\u7528\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Badge, { kind: "ok", text: "\u514D\u8D39\u516C\u5F00 API" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u6A21\u578B\u5DE5\u5177", desc: "\u6CE8\u518C\u7ED9\u6A21\u578B\u7684\u4E09\u4E2A\u67E5\u8BE2\u5DE5\u5177\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.hint, children: (info && info.tools || ["mcwiki_search", "mcwiki_get_page", "mcwiki_random"]).join("\u3001") }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u914D\u7F6E" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: styles_module_css_default.hint, style: { margin: "2px 0 0" }, children: "\u6301\u4E45\u5316\u5230 settings.yaml\uFF08dshp-mcwiki-search \u547D\u540D\u7A7A\u95F4\uFF09\uFF0C\u4FDD\u5B58\u5373\u65F6\u751F\u6548\u3002\u6570\u636E\u6E90\u56FA\u5B9A\u4E3A\u4E2D\u6587 Minecraft Wiki\uFF08\u4E0D\u53EF\u914D\u7F6E\uFF09\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u8BF7\u6C42\u8D85\u65F6", desc: "\u5355\u6B21\u8BF7\u6C42\u7684\u7B49\u5F85\u4E0A\u9650\uFF0C\u22651000\u3002", children: numInput("timeoutMs", "ms") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u641C\u7D22\u9ED8\u8BA4\u6761\u6570", desc: "mcwiki_search \u6BCF\u9875\u8FD4\u56DE\u7684\u6761\u76EE\u6570\uFF0C\u22651\u3002", children: numInput("searchMaxResults", "\u6761") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5168\u6587\u4E0A\u9650", desc: "mcwiki_get_page full \u8F93\u51FA\u7684\u5B57\u7B26\u6570\uFF1B0 \u8868\u793A\u5B8C\u6574\u8F93\u51FA\u4E0D\u622A\u65AD\u3002", children: numInput("maxChars", null) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Row, { label: "\u5F15\u8A00\u4E0A\u9650", desc: "intro \u8F93\u51FA\u7684\u5B57\u7B26\u6570\uFF1B0 \u8868\u793A\u5B8C\u6574\u8F93\u51FA\u4E0D\u622A\u65AD\u3002", children: numInput("introMaxChars", null) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.barEnd, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", size: "sm", disabled: cfgBusy, onClick: load, children: "\u91CD\u65B0\u8BFB\u53D6" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "primary", size: "sm", disabled: cfgBusy || cfg === null, onClick: saveCfg, children: cfgBusy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u914D\u7F6E" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u641C\u7D22\u6D4B\u8BD5" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: styles_module_css_default.hint, style: { margin: "2px 0 0" }, children: "\u76F4\u63A5\u770B\u5230\u300C\u8F6C\u6362\u540E\u7684 AI \u53EF\u8BFB\u6458\u8981\u300D\u2014\u2014\u6A21\u578B\u62FF\u5230\u7684\u5C31\u662F\u8FD9\u4E2A\u683C\u5F0F\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.bar, style: { borderBottom: "none" }, children: [
        searchInput,
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_dsh_client_ui_primitives2.Button,
          {
            variant: "primary",
            size: "sm",
            disabled: busy !== null,
            onClick: runSearch,
            icon: busy === "search" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.IconLoadingOutlineRegular, {}) : void 0,
            children: busy === "search" ? "\u641C\u7D22\u4E2D\u2026" : "\u641C\u7D22\u6D4B\u8BD5"
          }
        )
      ] })
    ] }),
    busy === "search" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.IconLoadingOutlineRegular, {}),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.loadingText, children: "\u6B63\u5728\u8BF7\u6C42 MediaWiki API \u2026" })
    ] }) : null,
    result !== null ? result.ok ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u641C\u7D22\u6210\u529F \xB7 \u5171 " + (result.totalHits ?? 0) + " \u6761 \xB7 " + (result.takenMs ?? 0) + " ms" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.results, children: renderResultItems(result) })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: "\u6D4B\u8BD5\u5931\u8D25" + (result.takenMs ? "\uFF08" + result.takenMs + " ms\uFF09" : "") + "\uFF1A" + result.error }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u9875\u9762\u8F6C\u6362\u6D4B\u8BD5" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: styles_module_css_default.hint, style: { margin: "2px 0 0" }, children: "wikitext \u2192 Markdown \u9884\u89C8\uFF08\u6700\u591A 6000 \u5B57\u7B26\uFF09\uFF1B\u6A21\u578B\u5DE5\u5177\u8F93\u51FA\u4E3A\u5B8C\u6574\u5168\u6587\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.bar, style: { borderBottom: "none" }, children: [
        pageInput,
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_dsh_client_ui_primitives2.Button,
          {
            variant: "primary",
            size: "sm",
            disabled: busy !== null,
            onClick: runPage,
            icon: busy === "page" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.IconLoadingOutlineRegular, {}) : void 0,
            children: busy === "page" ? "\u6293\u53D6\u4E2D\u2026" : "\u9875\u9762\u8F6C\u6362\u6D4B\u8BD5"
          }
        )
      ] })
    ] }),
    busy === "page" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives2.IconLoadingOutlineRegular, {}),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.loadingText, children: "\u6B63\u5728\u6293\u53D6\u5E76\u8F6C\u6362\u9875\u9762 \u2026" })
    ] }) : null,
    pageResult !== null ? pageResult.ok && pageResult.page ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: pageResult.page.title + "\uFF08" + pageResult.page.section + " \xB7 " + pageResult.page.format + "\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        import_dsh_client_ui_primitives2.CodeBlock,
        {
          code: pageResult.page.text,
          lang: "markdown",
          copyLabel: "\u590D\u5236",
          copiedLabel: "\u5DF2\u590D\u5236",
          className: styles_module_css_default.codeblock
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.hint, style: { marginTop: 6 }, children: "\u6765\u6E90\uFF1A" + pageResult.page.url })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: "\u9875\u9762\u6293\u53D6\u5931\u8D25\uFF1A" + (pageResult && pageResult.error || "\u672A\u77E5\u9519\u8BEF") }) : null
  ] });
}

// src/client/index.tsx
var SETTINGS_NS = "dshp-mcwiki-search";
var SETTINGS_ORDER = 26;
var SETTINGS_LABEL = "Minecraft Wiki \u641C\u7D22";
var COMMAND_KEY = "mcwiki";
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
          McWikiSection
        )
      ),
      "dshp-mcwiki-search: settings section"
    );
  } catch (error) {
    console.error("[dshp-mcwiki-search] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF0C\u8BBE\u7F6E\u9875\u5C06\u770B\u4E0D\u5230 Minecraft Wiki \u914D\u7F6E\uFF1A", error);
  }
  try {
    ctx.effect(
      () => slots.inject(
        "conversation.chat.commandview",
        () => slots.register({ name: "conversation.chat.commandview", key: COMMAND_KEY }, McwikiCommandCard)
      ),
      "dshp-mcwiki-search: /mcwiki command card"
    );
  } catch (error) {
    console.error("[dshp-mcwiki-search] \u6CE8\u518C /mcwiki \u547D\u4EE4\u5361\u7247\u5931\u8D25\uFF0C\u547D\u4EE4\u7ED3\u679C\u5C06\u56DE\u9000\u901A\u7528\u5361\u7247\uFF1A", error);
  }
}
return module.exports; } });
