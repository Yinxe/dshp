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

// src/client/types.ts
var ROUTE_BASE = "/ext/dshp-search-provider";

// src/client/api.ts
async function readJson(response) {
  const text = await response.text();
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: "\u63A5\u53E3\u8FD4\u56DE\u7A7A\u54CD\u5E94\uFF08Host \u53EF\u80FD\u662F\u65E7\u7248\u672C\uFF09\uFF1A\u8BF7\u91CD\u542F dsh web \u540E\u5237\u65B0\u9875\u9762\u91CD\u8BD5\u3002",
      needsRestart: true
    };
  }
  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: `\u63A5\u53E3\u8FD4\u56DE\u4E86\u975E JSON \u54CD\u5E94\uFF08HTTP ${response.status}\uFF09\uFF1A\u8BF7\u91CD\u542F dsh web \u540E\u5237\u65B0\u9875\u9762\u91CD\u8BD5\u3002`,
      needsRestart: true
    };
  }
}
function friendlyCredError(action, ref, error) {
  const raw = String(error?.message ?? error);
  if (/launching environment|shadowed|read-only/i.test(raw)) {
    if (action === "clear") {
      return `\u5F53\u524D Key \u6765\u81EA\u542F\u52A8 dsh \u7684\u7EC8\u7AEF\u73AF\u5883\uFF08\u73AF\u5883\u53D8\u91CF\u4F18\u5148\uFF0C\u9875\u9762\u65E0\u6CD5\u6E05\u9664\uFF09\u3002\u5982\u9700\u6539\u8D70\u6587\u4EF6\u7BA1\u7406\uFF1Aunset ${ref} \u540E\u91CD\u542F dsh web\u3002`;
    }
    return `\u4FDD\u5B58\u672A\u751F\u6548\uFF1A\u542F\u52A8 dsh \u7684\u7EC8\u7AEF\u73AF\u5883\u91CC\u5DF2\u6709 ${ref}\uFF0C\u73AF\u5883\u53D8\u91CF\u4F18\u5148\u4E8E\u51ED\u8BC1\u5E93\uFF0C\u5B58\u4E86\u4E5F\u4E0D\u4F1A\u88AB\u8BFB\u53D6\u3002\u5982\u9700\u6539\u8D70\u6587\u4EF6\u7BA1\u7406\uFF1Aunset ${ref} \u540E\u91CD\u542F dsh web\uFF0C\u518D\u56DE\u6765\u4FDD\u5B58\uFF1B\u6216\u76F4\u63A5\u6D4B\u8BD5\uFF0C\u73AF\u5883\u91CC\u7684 Key \u5DF2\u53EF\u7528\u3002`;
  }
  return raw;
}
function createBridge(remote) {
  const fetchJson = async (path, init) => {
    const response = await fetch(ROUTE_BASE + path, { cache: "no-store", ...init });
    if (response.status === 404) {
      return {
        ok: false,
        error: `\u63A5\u53E3 404\uFF1AHost \u8FD8\u662F\u65E7\u7248\u672C\uFF08\u65B0\u8DEF\u7531\u672A\u52A0\u8F7D\uFF09\uFF0C\u8BF7\u91CD\u542F dsh web \u540E\u5237\u65B0\u9875\u9762\u91CD\u8BD5\u3002`,
        needsRestart: true
      };
    }
    return readJson(response);
  };
  return {
    getState: () => fetchJson("/state"),
    saveConfig: (patch) => fetchJson("/config", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch || {})
    }),
    runTest: (providerId, query) => fetchJson("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: providerId, query })
    }),
    getUsage: (providerId, force) => fetchJson(`/${providerId}/usage${force ? "?force=1" : ""}`),
    /**
     * 写入密钥：官方形态 remote.credentials.set(ref, value) → { ok:true } /
     * { ok:false, error:{ message } }；成功后回读状态，界面即时反映。
     */
    saveKey: async (ref, value) => {
      try {
        const response = await remote?.credentials?.set(ref, value);
        if (response && response.ok === true)
          return { ok: true, state: await fetchJson("/state") };
        const message = response?.error?.message ? String(response.error.message) : "\u51ED\u8BC1\u5199\u5165\u5931\u8D25";
        return { ok: false, error: friendlyCredError("save", ref, message) };
      } catch (error) {
        return { ok: false, error: friendlyCredError("save", ref, error) };
      }
    },
    clearKey: async (ref) => {
      try {
        const response = await remote?.credentials?.unset(ref);
        if (response && response.ok === true)
          return { ok: true, state: await fetchJson("/state") };
        const message = response?.error?.message ? String(response.error.message) : "\u51ED\u8BC1\u6E05\u9664\u5931\u8D25";
        return { ok: false, error: friendlyCredError("clear", ref, message) };
      } catch (error) {
        return { ok: false, error: friendlyCredError("clear", ref, error) };
      }
    }
  };
}

// src/client/SearchSection.tsx
var import_react3 = require("react");
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/components.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = ".iUjxZG_page{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;display:flex}.iUjxZG_section{flex-direction:column;width:100%;display:flex}.iUjxZG_sectionHead{color:var(--dsw-alias-label-secondary);padding:14px 0 2px;font-size:12px;font-weight:500;line-height:18px}.iUjxZG_row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.iUjxZG_section .iUjxZG_row:last-child{border-bottom:none}.iUjxZG_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.iUjxZG_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.iUjxZG_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.iUjxZG_intro{color:var(--dsw-alias-label-tertiary);margin:0 0 4px;font-size:14px;line-height:22px}.iUjxZG_mono{font-family:var(--ds-font-family-code)}.iUjxZG_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;align-items:center;gap:12px;max-width:100%;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.iUjxZG_selector:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.iUjxZG_selector:disabled{cursor:default;opacity:.4}.iUjxZG_selectorLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.iUjxZG_chevron{flex:none}.iUjxZG_inputWrap{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);border-radius:8px;flex:1;align-items:center;gap:6px;min-width:0;height:32px;padding:0 8px;display:inline-flex}.iUjxZG_inputWrap:focus-within{border-color:var(--dsw-alias-brand-primary)}.iUjxZG_input{min-width:0;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;flex:1;font-family:inherit;font-size:14px;line-height:22px}.iUjxZG_input::placeholder{color:var(--dsw-alias-label-dimmed)}.iUjxZG_input:disabled{opacity:.5}.iUjxZG_badge{white-space:nowrap;border-radius:10px;align-items:center;height:20px;padding:0 8px;font-size:11px;font-weight:500;line-height:20px;display:inline-flex}.iUjxZG_badgeOk{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}.iUjxZG_badgeWarn{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}.iUjxZG_badgeMuted{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-caption)}.iUjxZG_bar{flex-wrap:wrap;align-items:center;gap:8px;padding:12px 0;display:flex}.iUjxZG_notice{margin:0;font-size:12px;line-height:18px}.iUjxZG_noticeOk{color:var(--dsw-alias-state-success-primary)}.iUjxZG_noticeErr{color:var(--dsw-alias-state-error-primary)}.iUjxZG_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.iUjxZG_loading{align-items:center;gap:8px;display:flex}.iUjxZG_loadingText{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.iUjxZG_results{flex-direction:column;gap:8px;display:flex}.iUjxZG_resultItem{border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;flex-direction:column;gap:4px;padding:10px 12px;display:flex}.iUjxZG_resultItem a{color:var(--dsw-alias-state-business-primary);font-size:13px;font-weight:500;line-height:20px;text-decoration:none}.iUjxZG_resultItem a:hover{text-decoration:underline}.iUjxZG_resultItem a:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;border-radius:4px}.iUjxZG_resultSnippet{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.iUjxZG_resultMeta{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code);word-break:break-all;font-size:11px;line-height:16px}.iUjxZG_meter{background:var(--dsw-alias-button-ghost-active-fill);border-radius:3px;height:6px;margin-top:6px;overflow:hidden}.iUjxZG_meterFill{background:var(--dsw-alias-brand-primary);border-radius:3px;height:100%;transition:width .2s}.iUjxZG_meterFillHigh{background:var(--dsw-alias-state-error-primary)}.iUjxZG_break{flex-direction:column;gap:4px;margin-top:8px;display:flex}.iUjxZG_breakRow{justify-content:space-between;gap:8px;font-size:12px;line-height:18px;display:flex}.iUjxZG_breakLabel{color:var(--dsw-alias-label-tertiary)}.iUjxZG_breakValue{color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code)}.iUjxZG_sub{color:var(--dsw-alias-label-tertiary);margin:6px 0 0;font-size:12px;line-height:18px}.iUjxZG_foot{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;display:flex}@media (prefers-reduced-motion:reduce){.iUjxZG_meterFill{transition:none}}";
var tagId = "@dshp/search-provider/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/search-provider");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "badge": "iUjxZG_badge", "badgeMuted": "iUjxZG_badgeMuted", "badgeOk": "iUjxZG_badgeOk", "badgeWarn": "iUjxZG_badgeWarn", "bar": "iUjxZG_bar", "break": "iUjxZG_break", "breakLabel": "iUjxZG_breakLabel", "breakRow": "iUjxZG_breakRow", "breakValue": "iUjxZG_breakValue", "chevron": "iUjxZG_chevron", "desc": "iUjxZG_desc", "foot": "iUjxZG_foot", "hint": "iUjxZG_hint", "input": "iUjxZG_input", "inputWrap": "iUjxZG_inputWrap", "intro": "iUjxZG_intro", "loading": "iUjxZG_loading", "loadingText": "iUjxZG_loadingText", "meter": "iUjxZG_meter", "meterFill": "iUjxZG_meterFill", "meterFillHigh": "iUjxZG_meterFillHigh", "mono": "iUjxZG_mono", "notice": "iUjxZG_notice", "noticeErr": "iUjxZG_noticeErr", "noticeOk": "iUjxZG_noticeOk", "page": "iUjxZG_page", "resultItem": "iUjxZG_resultItem", "resultMeta": "iUjxZG_resultMeta", "resultSnippet": "iUjxZG_resultSnippet", "results": "iUjxZG_results", "row": "iUjxZG_row", "rowText": "iUjxZG_rowText", "section": "iUjxZG_section", "sectionHead": "iUjxZG_sectionHead", "selector": "iUjxZG_selector", "selectorLabel": "iUjxZG_selectorLabel", "sub": "iUjxZG_sub", "title": "iUjxZG_title" };

// src/client/components.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function cx(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var BADGE_CLASS = {
  ok: styles_module_css_default.badgeOk,
  warn: styles_module_css_default.badgeWarn,
  muted: styles_module_css_default.badgeMuted
};
var NOTICE_CLASS = {
  ok: styles_module_css_default.noticeOk,
  err: styles_module_css_default.noticeErr
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
function Select({ value, selectedLabel, options, disabled, onSelect }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const selector = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      type: "button",
      className: styles_module_css_default.selector,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      disabled,
      onClick: () => setOpen((v) => !v),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.selectorLabel, children: selectedLabel }),
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
      anchor: selector
    }
  );
}
function Notice({ kind, text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: cx(styles_module_css_default.notice, NOTICE_CLASS[kind]), children: text });
}
function Hint({ text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: styles_module_css_default.hint, children: text });
}
function Loading({ text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.loading, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconLoadingOutlineRegular, {}),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.loadingText, children: text })
  ] });
}
function Meter({ pct }) {
  const v = typeof pct === "number" && Number.isFinite(pct) ? Math.min(100, Math.max(0, Math.round(pct))) : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.meter, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      className: cx(styles_module_css_default.meterFill, v >= 90 ? styles_module_css_default.meterFillHigh : void 0),
      style: { width: v + "%" }
    }
  ) });
}
function BreakRow({ label, value }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.breakRow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.breakLabel, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.breakValue, children: value })
  ] }, label);
}
var components = {
  Badge,
  Row,
  Select,
  Notice,
  Hint,
  Loading,
  Meter,
  BreakRow
};

// src/client/providers/tavily.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime2 = require("react/jsx-runtime");
function asRec(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function asNum(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function asStr(v) {
  return typeof v === "string" ? v : "";
}
function fmtCount(used, limit) {
  if (used === null) return "\u2014";
  if (limit === null) return String(used);
  return String(used) + " / " + String(limit);
}
function fmtNumber(v) {
  return v === null ? "\u2014" : String(v);
}
function pctOf(used, limit) {
  if (used === null || limit === null || limit <= 0) return 0;
  return Math.min(100, Math.round(used / limit * 100));
}
function fmtTime(ts) {
  if (typeof ts !== "number") return "\u672A\u77E5";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}
function createTavilyExtras(C, bridge) {
  return function TavilyUsage(props) {
    const { provider, usageMeta } = props;
    const [usage, setUsage] = (0, import_react2.useState)(null);
    const [usageErr, setUsageErr] = (0, import_react2.useState)(null);
    const [busy, setBusy] = (0, import_react2.useState)(null);
    const refresh = (0, import_react2.useCallback)(
      (force) => {
        setBusy(force ? "usage-force" : "usage");
        setUsageErr(null);
        bridge.getUsage(provider.id, force).then((u) => {
          setBusy(null);
          if (u && u.ok) {
            setUsage(u);
            setUsageErr(null);
          } else if (u && u.stale) {
            setUsage({
              ok: true,
              usage: u.stale.usage,
              fetchedAt: u.stale.fetchedAt,
              cached: true,
              stale: true
            });
            setUsageErr(u.error ?? "\u7528\u91CF\u8BFB\u53D6\u5931\u8D25");
          } else {
            setUsageErr(u && u.error || "\u7528\u91CF\u8BFB\u53D6\u5931\u8D25");
          }
        }).catch((error) => {
          setBusy(null);
          setUsageErr(String(error?.message ?? error));
        });
      },
      [provider.id]
    );
    (0, import_react2.useEffect)(() => {
      if (provider.configured) refresh(false);
      else {
        setUsage(null);
        setUsageErr(null);
      }
    }, [provider.configured, refresh]);
    const rows = [];
    if (!provider.configured) {
      rows.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          C.Hint,
          {
            text: "\u5148\u914D\u7F6E API Key \u540E\u518D\u67E5\u770B\u7528\u91CF\u3002\u914D\u989D\u7531 Tavily \u8D26\u53F7\u63D0\u4F9B\uFF0C\u5B98\u65B9\u9650\u6D41 10 \u6B21 / 10 \u5206\u949F\uFF0C\u670D\u52A1\u7AEF\u5DF2\u505A 60 \u79D2\u7F13\u5B58\u3002"
          },
          "na"
        )
      );
    } else if (busy !== null) {
      rows.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Loading, { text: "\u6B63\u5728\u8BF7\u6C42 api.tavily.com/usage \u2026" }, "busy"));
    } else if (usage !== null && usage.usage) {
      const data = asRec(usage.usage);
      const k = asRec(data["key"]);
      const a = asRec(data["account"]);
      const keyUsage = asNum(k["usage"]);
      const keyLimit = asNum(k["limit"]);
      const planUsage = asNum(a["plan_usage"]);
      const planLimit = asNum(a["plan_limit"]);
      const paygoUsage = asNum(a["paygo_usage"]);
      const paygoLimit = asNum(a["paygo_limit"]);
      const keyRemain = keyLimit !== null && keyUsage !== null ? keyLimit - keyUsage : null;
      const planRemain = planLimit !== null && planUsage !== null ? planLimit - planUsage : null;
      const paygoRemain = paygoLimit !== null && paygoUsage !== null ? paygoLimit - paygoUsage : null;
      const keyLimited = keyLimit !== null;
      const planLimited = planLimit !== null;
      const effLimit = keyLimited && planLimited ? Math.min(keyLimit, planLimit) : keyLimited ? keyLimit : planLimited ? planLimit : null;
      const effSource = keyLimited && planLimited ? keyLimit < planLimit ? "Key \u66F4\u5C0F" : planLimit < keyLimit ? "\u8D26\u53F7\u8BA1\u5212\u66F4\u5C0F" : "\u4E24\u8005\u4E00\u81F4" : keyLimited ? "Key\uFF08\u8D26\u53F7\u8BA1\u5212\u672A\u8BBE\u9650\uFF09" : planLimited ? "\u8D26\u53F7\u8BA1\u5212\uFF08Key \u672A\u8BBE\u9650\uFF09" : null;
      const effRemain = keyRemain !== null && planRemain !== null ? Math.min(keyRemain, planRemain) : keyRemain !== null ? keyRemain : planRemain;
      const bindPct = Math.max(
        keyLimited ? pctOf(keyUsage, keyLimit) : 0,
        planLimited ? pctOf(planUsage, planLimit) : 0
      );
      const planName = asStr(a["current_plan"]);
      const keyLine = fmtCount(keyUsage, keyLimit) + (keyRemain !== null ? " \xB7 \u5269\u4F59 " + keyRemain : "") + (keyLimited ? "" : " \xB7 Key \u672A\u8BBE\u9650\uFF08\u53D7\u8D26\u53F7\u5957\u9910\u7EA6\u675F\uFF09");
      rows.push(
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Row, { label: "\u751F\u6548\u4E0A\u9650\uFF08\u53D6\u5C0F\u503C\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.mono, children: effLimit !== null ? String(effLimit) + (effSource ? " \xB7 " + effSource : "") : "\u4E0D\u9650" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Row, { label: "\u8D26\u53F7\u8BA1\u5212\u7528\u91CF\uFF08\u603B\u91CF\u7EA6\u675F\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.mono, children: fmtCount(planUsage, planLimit) + (planRemain !== null ? " \xB7 \u5269\u4F59 " + planRemain : "") }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Row, { label: "\u5F53\u524D Key \u7528\u91CF", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.mono, children: keyLine }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Row, { label: "\u8D26\u53F7\u5957\u9910", children: planName.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Badge, { kind: "ok", text: planName }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Badge, { kind: "muted", text: "\u672A\u77E5" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Row, { label: "PAYGO \u7528\u91CF", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.mono, children: fmtCount(paygoUsage, paygoLimit) + (paygoRemain !== null ? " \xB7 \u5269\u4F59 " + paygoRemain : "") }) }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Meter, { pct: bindPct }),
          effRemain !== null ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.sub, children: "\u5B9E\u9645\u53EF\u7528\uFF08\u53D6 Key \u4E0E\u8D26\u53F7\u8F83\u5C0F\u5269\u4F59\uFF09\uFF1A\u5269\u4F59 " + effRemain }) : null,
          !keyLimited ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u8BE5 Key \u672A\u5355\u72EC\u8BBE\u9650\uFF0C\u4E0D\u4EE3\u8868\u65E0\u9650\uFF1A\u4ECD\u53D7\u4E0A\u65B9\u8D26\u53F7\u8BA1\u5212\u603B\u91CF\u7EA6\u675F\u3002" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.break, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "Key search", value: fmtCount(asNum(k["search_usage"]), null) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "Key extract", value: fmtCount(asNum(k["extract_usage"]), null) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "Key crawl", value: fmtCount(asNum(k["crawl_usage"]), null) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "Key map", value: fmtCount(asNum(k["map_usage"]), null) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "Key research", value: fmtCount(asNum(k["research_usage"]), null) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.sub, children: "\u8D26\u53F7\u5404\u7AEF\u70B9\u5206\u9879\uFF08\u672C\u8BA1\u8D39\u5468\u671F\uFF09\uFF1A" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.break, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "\u8D26\u53F7 search", value: fmtNumber(asNum(a["search_usage"])) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "\u8D26\u53F7 extract", value: fmtNumber(asNum(a["extract_usage"])) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "\u8D26\u53F7 crawl", value: fmtNumber(asNum(a["crawl_usage"])) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "\u8D26\u53F7 map", value: fmtNumber(asNum(a["map_usage"])) }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.BreakRow, { label: "\u8D26\u53F7 research", value: fmtNumber(asNum(a["research_usage"])) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.foot, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.hint, children: "\u66F4\u65B0\u4E8E " + fmtTime(usage.fetchedAt) + (usage.cached ? " \xB7 \u7F13\u5B58" : " \xB7 \u5B9E\u65F6") + (usage.stale ? " \xB7 \u65E7\u6570\u636E\uFF08\u6700\u65B0\u67E5\u8BE2\u5931\u8D25\uFF09" : "") }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("a", { href: provider.homepage, target: "_blank", rel: "noreferrer", className: styles_module_css_default.hint, children: "\u5B98\u65B9\u6587\u6863" })
          ] })
        ] }, "rows")
      );
    } else {
      rows.push(/* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Notice, { kind: "err", text: "\u7528\u91CF\u8BFB\u53D6\u5931\u8D25\uFF1A" + (usageErr || "\u672A\u77E5\u9519\u8BEF") }, "err"));
    }
    const rateLimit = asStr(usageMeta["rateLimit"]);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u7528\u91CF\u4E0E\u914D\u989D\uFF08GET /usage\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.bar, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { flex: 1 } }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_dsh_client_ui_primitives2.Button,
          {
            variant: "outline",
            size: "sm",
            disabled: busy !== null || !provider.configured,
            onClick: () => refresh(false),
            children: busy === "usage" ? "\u8BFB\u53D6\u4E2D\u2026" : "\u5237\u65B0"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          import_dsh_client_ui_primitives2.Button,
          {
            variant: "outline",
            size: "sm",
            disabled: busy !== null || !provider.configured,
            onClick: () => refresh(true),
            children: busy === "usage-force" ? "\u5237\u65B0\u4E2D\u2026" : "\u5F3A\u5236\u5237\u65B0"
          }
        )
      ] }),
      rows,
      usageErr && usage && usage.usage ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Notice, { kind: "err", text: "\u6700\u65B0\u67E5\u8BE2\u5931\u8D25\uFF0C\u5DF2\u663E\u793A\u7F13\u5B58\uFF1A" + usageErr }) : null,
      usageErr && !(usage && usage.usage) && provider.configured ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(C.Notice, { kind: "err", text: String(usageErr) }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        C.Hint,
        {
          text: "\u9274\u6743\u4E3A Authorization: Bearer <Key>\uFF08\u4E0E /search \u7684 body.api_key \u4E0D\u540C\uFF09\uFF1B401 \u8868\u793A Key \u65E0\u6548\u3001429 \u8868\u793A\u89E6\u53D1\u9650\u6D41" + (rateLimit.length > 0 ? "\uFF08" + rateLimit + "\uFF09" : "") + "\u3002\u8BA1\u8D39\u6309 credits\uFF1Abasic \u641C\u7D22 1/\u6B21\u3001advanced 2/\u6B21\u3002"
        }
      )
    ] });
  };
}

// src/client/providers/index.ts
function createProviderExtras(C, bridge) {
  return {
    tavily: createTavilyExtras(C, bridge)
  };
}

// src/client/SearchSection.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function createSearchSection(bridge) {
  const EXTRAS = createProviderExtras(components, bridge);
  return function SearchSection() {
    const [info, setInfo] = (0, import_react3.useState)(null);
    const [config, setConfig] = (0, import_react3.useState)(null);
    const [stateErr, setStateErr] = (0, import_react3.useState)(null);
    const [saving, setSaving] = (0, import_react3.useState)(false);
    const [keyDraft, setKeyDraft] = (0, import_react3.useState)("");
    const [keyShown, setKeyShown] = (0, import_react3.useState)(false);
    const [busy, setBusy] = (0, import_react3.useState)(null);
    const [notice, setNotice] = (0, import_react3.useState)(null);
    const [query, setQuery] = (0, import_react3.useState)("");
    const [result, setResult] = (0, import_react3.useState)(null);
    const applyState = (0, import_react3.useCallback)((value) => {
      if (value && value.ok) {
        setInfo(value);
        if (value.config) setConfig(value.config);
        setStateErr(null);
      } else {
        setStateErr(value && value.error || "\u72B6\u6001\u8BFB\u53D6\u5931\u8D25");
      }
    }, []);
    const load = (0, import_react3.useCallback)(() => {
      bridge.getState().then((value) => applyState(value)).catch((error) => setStateErr(String(error?.message ?? error)));
    }, [applyState]);
    (0, import_react3.useEffect)(() => {
      load();
    }, [load]);
    const saveConfig = (0, import_react3.useCallback)((patch, okText) => {
      setSaving(true);
      setNotice(null);
      bridge.saveConfig(patch).then((reply) => {
        setSaving(false);
        if (reply && reply.ok) {
          if (reply.config) setConfig(reply.config);
          setNotice({
            kind: "ok",
            text: okText || "\u641C\u7D22\u884C\u4E3A\u5DF2\u4FDD\u5B58\u5230 settings.yaml\uFF08dshp-search-provider\uFF09\uFF0C\u5373\u65F6\u751F\u6548\u3002"
          });
        } else {
          setNotice({ kind: "err", text: reply && reply.error || "\u4FDD\u5B58\u5931\u8D25" });
        }
      }).catch((error) => {
        setSaving(false);
        setNotice({ kind: "err", text: String(error?.message ?? error) });
      });
    }, []);
    const providers = info && info.providers || [];
    const providerId = config && config.provider || (providers[0] ? providers[0].id : "");
    const focusedProvider = providers.find((p) => p.id === providerId) || (providers.length > 0 ? providers[0] : null);
    const focused = focusedProvider === null ? null : { provider: focusedProvider, block: readBlock(config, focusedProvider.id) };
    const selectedId = info ? info.selectedProviderId ?? null : null;
    const extras = info && info.extras || {};
    const saveKey = () => {
      if (focused === null) return;
      const value = keyDraft.trim();
      if (value.length === 0) {
        setNotice({ kind: "err", text: "\u8BF7\u8F93\u5165 API Key \u540E\u518D\u4FDD\u5B58\u3002" });
        return;
      }
      setBusy("saving");
      setNotice(null);
      bridge.saveKey(focused.provider.credentialRef, value).then((reply) => {
        setBusy(null);
        if (reply && reply.ok) {
          setKeyDraft("");
          setNotice({ kind: "ok", text: "\u5BC6\u94A5\u5DF2\u4FDD\u5B58\u5230\u51ED\u8BC1\u5E93\uFF0C\u641C\u7D22\u5373\u65F6\u751F\u6548\u3002" });
          applyState(reply.state);
        } else {
          setNotice({ kind: "err", text: reply && reply.error || "\u4FDD\u5B58\u5931\u8D25" });
        }
      }).catch((error) => {
        setBusy(null);
        setNotice({ kind: "err", text: String(error?.message ?? error) });
      });
    };
    const clearKey = () => {
      if (focused === null) return;
      setBusy("clearing");
      setNotice(null);
      bridge.clearKey(focused.provider.credentialRef).then((reply) => {
        setBusy(null);
        if (reply && reply.ok) {
          setNotice({ kind: "ok", text: "\u5BC6\u94A5\u5DF2\u4ECE\u51ED\u8BC1\u5E93\u79FB\u9664\u3002" });
          applyState(reply.state);
        } else {
          setNotice({ kind: "err", text: reply && reply.error || "\u6E05\u9664\u5931\u8D25" });
        }
      }).catch((error) => {
        setBusy(null);
        setNotice({ kind: "err", text: String(error?.message ?? error) });
      });
    };
    const runTest = () => {
      if (focused === null) return;
      const q = query.trim();
      if (q.length === 0) {
        setNotice({ kind: "err", text: "\u5148\u8F93\u5165\u4E00\u4E2A\u6D4B\u8BD5\u67E5\u8BE2\u3002" });
        return;
      }
      setBusy("testing");
      setNotice(null);
      setResult(null);
      bridge.runTest(focused.provider.id, q).then((value) => {
        setBusy(null);
        setResult(value || { ok: false, error: "\u65E0\u54CD\u5E94" });
      }).catch((error) => {
        setBusy(null);
        setResult({ ok: false, error: String(error?.message ?? error) });
      });
    };
    const children = [];
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: styles_module_css_default.intro, children: focused === null ? "\u7528 AI \u641C\u7D22\u63D0\u4F9B\u65B9\u63A5\u7BA1\u6A21\u578B\u7684 web_search\uFF0C\u66FF\u6362 DeepSeek \u5B98\u65B9\u641C\u7D22\u2014\u2014\u5B98\u65B9\u641C\u7D22\u6BCF\u6B21\u89E6\u53D1\u90FD\u6D88\u8017\u4E00\u8F6E\u6A21\u578B\u8C03\u7528\uFF0C\u7B2C\u4E09\u65B9\u641C\u7D22\u66F4\u4FBF\u5B9C\u3001\u66F4\u5FEB\u3002\u5BC6\u94A5\u5199\u5165\u51ED\u8BC1\u5E93\uFF0C\u4FDD\u5B58\u540E\u7ACB\u5373\u751F\u6548\u3002" : "\u7528 " + focused.provider.label + " \u63A5\u7BA1\u6A21\u578B\u7684 web_search\uFF0C\u66FF\u6362 DeepSeek \u5B98\u65B9\u641C\u7D22\u2014\u2014\u5B98\u65B9\u641C\u7D22\u6BCF\u6B21\u89E6\u53D1\u90FD\u6D88\u8017\u4E00\u8F6E\u6A21\u578B\u8C03\u7528\uFF0C" + focused.provider.label + " \u66F4\u4FBF\u5B9C\u3001\u66F4\u5FEB\u3002\u5BC6\u94A5\u5199\u5165\u51ED\u8BC1\u5E93\uFF0C\u4FDD\u5B58\u540E\u7ACB\u5373\u751F\u6548\uFF1B\u4E0B\u65B9\u53EF\u67E5\u770B\u914D\u989D\u4E0E\u8FDE\u63A5\u6D4B\u8BD5\u3002" }, "intro")
    );
    if (focused !== null && focused.provider.description.length > 0) {
      children.push(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Hint, { text: focused.provider.description }, "pdesc"));
    }
    if (stateErr) children.push(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Notice, { kind: "err", text: "\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF1A" + stateErr }, "stateErr"));
    if (notice) children.push(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Notice, { kind: notice.kind, text: notice.text }, "notice"));
    const effective = focused !== null && focused.provider.selected && (selectedId === null || selectedId === focused.provider.id);
    const selectedBadge = focused === null ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Badge, { kind: "muted", text: "\u8BFB\u53D6\u4E2D\u2026" }) : effective ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Badge, { kind: "ok", text: focused.provider.label + " \xB7 \u5F53\u524D\u751F\u6548" }) : selectedId !== null ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Badge, { kind: "warn", text: "patch \u56FA\u5B9A\u4E3A " + selectedId }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Badge, { kind: "warn", text: "\u7B49\u5F85\u63A5\u7BA1" });
    const keyBadge = focused === null ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Badge, { kind: "muted", text: "\u8BFB\u53D6\u4E2D\u2026" }) : focused.provider.configured ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Badge, { kind: "ok", text: "\u5DF2\u914D\u7F6E \xB7 " + (focused.provider.source || "\u51ED\u8BC1\u5E93") }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Badge, { kind: "warn", text: "\u672A\u914D\u7F6E\u5BC6\u94A5" });
    const statusRows = [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Row, { label: "\u641C\u7D22\u5F15\u64CE", desc: "\u63A5\u7BA1 web_search \u7684\u63D0\u4F9B\u65B9\u3002", children: selectedBadge }, "engine"),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Row, { label: "\u63D0\u4F9B\u65B9 ID", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.mono, children: focused === null ? "\u2014" : focused.provider.id }) }, "pid"),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Row, { label: "API Key", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.mono, children: focused === null ? "\u2014" : focused.provider.credentialRef }) }, "key"),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Row, { label: "\u5BC6\u94A5\u72B6\u6001", children: keyBadge }, "keystate"),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Row, { label: "\u63A5\u7BA1\u524D", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: styles_module_css_default.hint, children: "DeepSeek \u5B98\u65B9" }) }, "before")
    ];
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.section, children: statusRows }, "status")
    );
    if (info && info.selectionHint) {
      children.push(/* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Hint, { text: info.selectionHint }, "selhint"));
    }
    if (providers.length > 1 && focused !== null) {
      const options = providers.map((p) => ({
        id: p.id,
        label: p.label + (p.selected ? "\uFF08\u5F53\u524D\u751F\u6548\uFF09" : p.configured ? "" : "\uFF08\u672A\u914D\u7F6E\u5BC6\u94A5\uFF09")
      }));
      const current = providers.find((p) => p.id === providerId) || focused.provider;
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u4F9B\u5E94\u5546" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            components.Row,
            {
              label: "\u751F\u6548\u63D0\u4F9B\u65B9",
              desc: "\u5207\u6362\u540E\u7ACB\u5373\u89E3\u7ED1\u65E7\u63D0\u4F9B\u65B9\u5E76\u6CE8\u518C\u65B0\u63D0\u4F9B\u65B9\uFF0C\u641C\u7D22\u5373\u65F6\u751F\u6548\uFF08\u65E0\u9700\u91CD\u542F\uFF09\uFF1B\u82E5 profile patch \u56FA\u5B9A\u4E86\u5176\u4ED6 id\uFF0C\u9700\u5148\u5220\u9664 web.searchProvider \u4E00\u884C\u3002",
              children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                components.Select,
                {
                  disabled: saving,
                  value: current.id,
                  selectedLabel: current.label,
                  options,
                  onSelect: (id) => {
                    const picked = providers.find((x) => x.id === id);
                    saveConfig(
                      { provider: id },
                      "\u5DF2\u5207\u6362\u63D0\u4F9B\u65B9\u4E3A " + (picked !== void 0 ? picked.label : id) + "\uFF0C\u6CE8\u518C\u5373\u65F6\u751F\u6548"
                    );
                    bridge.getState().then((v) => applyState(v)).catch(() => {
                    });
                  }
                }
              )
            }
          )
        ] }, "switch")
      );
    }
    if (focused !== null) {
      const keyInput = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.inputWrap, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.IconSearchOutlineRegular, {}),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            className: styles_module_css_default.input,
            type: keyShown ? "text" : "password",
            placeholder: "\u7C98\u8D34 " + focused.provider.label + " API Key\uFF08" + focused.provider.credentialRef + "\uFF09",
            value: keyDraft,
            autoComplete: "off",
            onChange: (event) => setKeyDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") saveKey();
            }
          }
        )
      ] });
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u5BC6\u94A5\u914D\u7F6E" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.bar, children: [
            keyInput,
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              import_dsh_client_ui_primitives3.Button,
              {
                variant: "outline",
                size: "sm",
                disabled: busy !== null,
                onClick: () => setKeyShown(!keyShown),
                children: keyShown ? "\u9690\u85CF" : "\u663E\u793A"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "primary", size: "sm", disabled: busy !== null, onClick: saveKey, children: busy === "saving" ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5BC6\u94A5" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            components.Hint,
            {
              text: "\u5BC6\u94A5\u901A\u8FC7 credentials \u670D\u52A1\u6301\u4E45\u5316\u5230\u51ED\u8BC1\u5E93\uFF08~/.dsh/.credentials.yaml\uFF09\uFF0C\u4E0D\u4F1A\u88AB\u56DE\u663E\uFF1B\u542F\u52A8\u7EC8\u7AEF\u91CC\u5B58\u5728\u540C\u540D\u73AF\u5883\u53D8\u91CF\u65F6\u4EE5\u73AF\u5883\u53D8\u91CF\u4E3A\u51C6\u3002"
            },
            "credhint"
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.bar, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            import_dsh_client_ui_primitives3.Button,
            {
              variant: "ghost",
              size: "sm",
              disabled: busy !== null || !focused.provider.configured,
              onClick: clearKey,
              children: "\u6E05\u9664\u5BC6\u94A5"
            }
          ) }, "clearbar")
        ] }, "creds")
      );
    }
    if (focused !== null) {
      const maxOptions = [];
      for (let n = 1; n <= 10; n += 1) maxOptions.push({ id: String(n), label: n + " \u6761" });
      const maxValue = String(config && config.maxResults || 5);
      const behaviorRows = [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(components.Row, { label: "\u9ED8\u8BA4\u7ED3\u679C\u6570", desc: "\u5355\u6B21\u8C03\u7528\u4F20 maxResults \u65F6\u4F18\u5148\u7528\u8C03\u7528\u65B9\u7684\u503C\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          components.Select,
          {
            disabled: saving || config === null,
            value: maxValue,
            selectedLabel: maxValue + " \u6761",
            options: maxOptions,
            onSelect: (id) => saveConfig({ maxResults: Number(id) })
          }
        ) }, "max")
      ];
      for (const field of focused.provider.fields) {
        behaviorRows.push(fieldControl(components, field, focused, saving || config === null, saveConfig));
      }
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u641C\u7D22\u884C\u4E3A" }),
          behaviorRows,
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            components.Hint,
            {
              text: "\u6301\u4E45\u5316\u5230 settings.yaml\uFF08dshp-search-provider \u547D\u540D\u7A7A\u95F4\uFF09\uFF0C\u4FDD\u5B58\u5373\u65F6\u751F\u6548\u3002"
            },
            "behint"
          )
        ] }, "behavior")
      );
    }
    if (focused !== null) {
      const Extra = EXTRAS[focused.provider.id];
      if (Extra !== void 0) {
        const extraMeta = extras[focused.provider.id] || {};
        children.push(
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            Extra,
            {
              provider: focused.provider,
              usageMeta: extraMeta["usageMeta"] || {}
            },
            "extra-" + focused.provider.id
          )
        );
      }
    }
    if (focused !== null) {
      const testInput = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.inputWrap, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          className: styles_module_css_default.input,
          placeholder: "\u8F93\u5165\u67E5\u8BE2\uFF0C\u4F8B\u5982\uFF1ADeepSeek \u6700\u65B0\u53D1\u5E03",
          value: query,
          onChange: (event) => setQuery(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter") runTest();
          }
        }
      ) });
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u8FDE\u63A5\u6D4B\u8BD5" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.bar, children: [
            testInput,
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Button, { variant: "primary", size: "sm", disabled: busy !== null, onClick: runTest, children: busy === "testing" ? "\u641C\u7D22\u4E2D\u2026" : "\u8FD0\u884C\u6D4B\u8BD5" })
          ] })
        ] }, "test")
      );
    }
    if (result !== null) {
      if (result.ok) {
        const items = [];
        for (const source of result.sources || []) {
          const meta = [source.url].concat(source.publishedAt ? ["\u53D1\u5E03\u4E8E " + source.publishedAt] : []).join(" \xB7 ");
          items.push(
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.resultItem, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_dsh_client_ui_primitives3.Tooltip, { label: source.url, side: "top", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { href: source.url, target: "_blank", rel: "noreferrer", children: source.title || source.url }) }),
              source.snippet ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.resultSnippet, children: source.snippet }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.resultMeta, children: meta })
            ] }, source.url)
          );
        }
        children.push(
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: styles_module_css_default.section, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u6D4B\u8BD5\u6210\u529F \xB7 " + (result.sources || []).length + " \u6761\u7ED3\u679C \xB7 " + result.takenMs + " ms" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.results, children: items })
          ] }, "result")
        );
      } else {
        children.push(
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            components.Notice,
            {
              kind: "err",
              text: "\u6D4B\u8BD5\u5931\u8D25" + (result.takenMs ? "\uFF08" + result.takenMs + " ms\uFF09" : "") + "\uFF1A" + result.error
            },
            "testerr"
          )
        );
      }
    }
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.page, children });
  };
}
function readBlock(config, providerId) {
  const raw = config === null ? void 0 : config[providerId];
  return raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}
function fieldControl(kit, field, focused, disabled, save) {
  const current = focused.block[field.key];
  const desc = field.hint !== void 0 && field.hint.length > 0 ? field.hint : void 0;
  if (field.kind === "select") {
    const options = field.options || [];
    const first = options[0];
    const hit = options.find((o) => o.value === current);
    const value = hit !== void 0 ? hit.value : first !== void 0 ? first.value : "";
    const label = hit !== void 0 ? hit.label : first !== void 0 ? first.label : value;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(kit.Row, { label: field.label, ...desc !== void 0 ? { desc } : {}, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      kit.Select,
      {
        disabled,
        value,
        selectedLabel: label,
        options: options.map((o) => ({ id: o.value, label: o.label })),
        onSelect: (id) => save({ [focused.provider.id]: { [field.key]: id } })
      }
    ) }, "field-" + field.key);
  }
  const text = typeof current === "string" || typeof current === "number" ? String(current) : "";
  const input = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "input",
    {
      className: styles_module_css_default.input,
      type: field.kind === "number" ? "number" : "text",
      placeholder: field.placeholder || "",
      defaultValue: text,
      disabled,
      onBlur: (event) => {
        const raw = String(event.target.value);
        if (raw === text) return;
        if (field.kind === "number") {
          const n = Number(raw);
          if (!Number.isFinite(n)) return;
          save({ [focused.provider.id]: { [field.key]: n } });
          return;
        }
        save({ [focused.provider.id]: { [field.key]: raw } });
      }
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(kit.Row, { label: field.label, ...desc !== void 0 ? { desc } : {}, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: styles_module_css_default.inputWrap, children: input }) }, "field-" + field.key);
}

// src/client/index.tsx
var SETTINGS_NS = "dshp-search-provider";
var SETTINGS_ORDER = 28;
var SETTINGS_LABEL = "AI \u641C\u7D22";
var inject = ["slots", "remote", "remote.credentials"];
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  const bridge = createBridge(ctx.get("remote"));
  const Section = createSearchSection(bridge);
  try {
    ctx.effect(
      () => slots.inject(
        "settings.section",
        () => slots.register(
          { name: "settings.section", id: SETTINGS_NS, order: SETTINGS_ORDER, label: SETTINGS_LABEL },
          Section
        )
      ),
      "dshp-search-provider: settings section"
    );
  } catch (error) {
    console.error("[dshp-search-provider] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF0C\u8BBE\u7F6E\u9875\u5C06\u770B\u4E0D\u5230 AI \u641C\u7D22\u914D\u7F6E\uFF1A", error);
  }
}
return module.exports; } });
