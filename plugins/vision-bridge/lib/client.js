window.__ModuleLoader__.load({ id: "@dshp/vision-bridge", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
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

// src/client/VisionSection.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/api.ts
var BASE = "/ext/dshp-vision-bridge";
async function request(path, init) {
  const response = await fetch(BASE + path, { cache: "no-store", ...init });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
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
function checkRoutes() {
  return request("/check");
}

// src/client/components.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = ".JaftwG_page{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:14px;display:flex}.JaftwG_header{justify-content:space-between;align-items:flex-start;gap:24px;display:flex}.JaftwG_headerText{flex-direction:column;gap:4px;min-width:0;display:flex}.JaftwG_title{margin:0;font-size:16px;font-weight:600;line-height:24px}.JaftwG_lead{color:var(--dsw-alias-label-secondary);margin:0;font-size:13px;line-height:20px}.JaftwG_tags{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.JaftwG_card{border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);flex-direction:column;display:flex;overflow:hidden}.JaftwG_row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:16px;padding:14px 16px;display:flex}.JaftwG_row:last-child{border-bottom:none}.JaftwG_rowText{flex-direction:column;flex:1;gap:3px;min-width:0;display:flex}.JaftwG_rowLabel{font-size:13px;font-weight:500;line-height:20px}.JaftwG_rowDesc{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.JaftwG_select{flex:none;max-width:320px}.JaftwG_selectLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.JaftwG_chevron{flex:none;margin-left:6px}.JaftwG_actions{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.JaftwG_muted{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.JaftwG_check{border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2);flex-direction:column;gap:8px;padding:12px 14px;display:flex}.JaftwG_checkRow{align-items:center;gap:8px;min-width:0;display:flex}.JaftwG_checkLabel{color:var(--dsw-alias-label-secondary);flex:none;font-size:12px;line-height:18px}.JaftwG_checkMessage{min-width:0;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;font-size:12px;line-height:18px}.JaftwG_error,.JaftwG_warning,.JaftwG_hint{margin:0;font-size:12px;line-height:18px}.JaftwG_error{color:var(--dsw-alias-state-error-primary)}.JaftwG_warning{color:var(--dsw-alias-state-warn-primary)}.JaftwG_hint{color:var(--dsw-alias-label-secondary)}.JaftwG_loading{align-items:center;gap:8px;padding:24px 0;display:flex}.JaftwG_loadingText{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}@media (width<=560px){.JaftwG_header{flex-direction:column;gap:12px}.JaftwG_row{flex-direction:column;align-items:stretch;gap:10px}.JaftwG_select{align-self:flex-start;max-width:100%}}";
var tagId = "@dshp/vision-bridge/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/vision-bridge");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "actions": "JaftwG_actions", "card": "JaftwG_card", "check": "JaftwG_check", "checkLabel": "JaftwG_checkLabel", "checkMessage": "JaftwG_checkMessage", "checkRow": "JaftwG_checkRow", "chevron": "JaftwG_chevron", "error": "JaftwG_error", "header": "JaftwG_header", "headerText": "JaftwG_headerText", "hint": "JaftwG_hint", "lead": "JaftwG_lead", "loading": "JaftwG_loading", "loadingText": "JaftwG_loadingText", "muted": "JaftwG_muted", "page": "JaftwG_page", "row": "JaftwG_row", "rowDesc": "JaftwG_rowDesc", "rowLabel": "JaftwG_rowLabel", "rowText": "JaftwG_rowText", "select": "JaftwG_select", "selectLabel": "JaftwG_selectLabel", "tags": "JaftwG_tags", "title": "JaftwG_title", "warning": "JaftwG_warning" };

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

// src/client/VisionSection.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var NO_FALLBACK = "__none";
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function routeKey(route) {
  return route.provider + "///" + route.model;
}
function parseKey(key) {
  const index = key.indexOf("///");
  if (index <= 0) return null;
  const provider = key.slice(0, index);
  const model = key.slice(index + 3);
  return provider && model ? { provider, model } : null;
}
function modelLabel(model) {
  return model.name === model.model ? model.provider + "/" + model.model : model.name + "\uFF08" + model.provider + "/" + model.model + "\uFF09";
}
function routeLabel(route, options) {
  const found = options.find((model) => routeKey(model) === routeKey(route));
  return found ? modelLabel(found) : route.provider + "/" + route.model;
}
function isRoute(value) {
  if (value === null || typeof value !== "object") return false;
  const route = value;
  return typeof route["provider"] === "string" && typeof route["model"] === "string";
}
function toVisionModel(value) {
  if (!isRoute(value)) return null;
  const name = value.name;
  return {
    provider: value.provider,
    model: value.model,
    name: typeof name === "string" && name.length > 0 ? name : value.model
  };
}
function CheckRow({ label, result }) {
  const tone = result === void 0 ? "neutral" : result.ok ? "success" : "warning";
  const text = result === void 0 ? "\u672A\u914D\u7F6E" : result.ok ? "\u53EF\u7528" : "\u4E0D\u53EF\u7528";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.checkRow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone, children: text }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.checkLabel, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.checkMessage, children: result?.message ?? "\u672A\u914D\u7F6E" })
  ] });
}
function VisionSection() {
  const [models, setModels] = (0, import_react2.useState)([]);
  const [config, setConfig] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [saving, setSaving] = (0, import_react2.useState)(false);
  const [checking, setChecking] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)("");
  const [check, setCheck] = (0, import_react2.useState)(null);
  const load = (0, import_react2.useCallback)(async () => {
    setLoading(true);
    setError("");
    setCheck(null);
    try {
      const response = await fetchState();
      if (!response.ok) throw new Error(response.error || "\u65E0\u6CD5\u8BFB\u53D6\u89C6\u89C9\u6A21\u578B\u5217\u8868");
      const nextModels = Array.isArray(response.models) ? response.models.map(toVisionModel).filter((model) => model !== null) : [];
      setModels(nextModels);
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
    setCheck(null);
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
  async function runCheck() {
    setChecking(true);
    setError("");
    setCheck(null);
    try {
      setCheck(await checkRoutes());
    } catch (cause) {
      setError("\u6D4B\u8BD5\u5931\u8D25\uFF1A" + errorMessage(cause));
    } finally {
      setChecking(false);
    }
  }
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: styles_module_css_default.page, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.loading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.IconLoadingOutlineRegular, {}),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.loadingText, children: "\u6B63\u5728\u8BFB\u53D6\u89C6\u89C9\u6A21\u578B\u2026" })
    ] }) });
  }
  const options = [];
  const seen = /* @__PURE__ */ new Set();
  for (const model of models) {
    const key = routeKey(model);
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(model);
  }
  for (const route of [config?.primary, config?.fallback]) {
    if (!route || seen.has(routeKey(route))) continue;
    seen.add(routeKey(route));
    options.push({ ...route, name: route.model + "\uFF08\u5F53\u524D\u9009\u62E9\uFF0C\u4E0D\u5728\u5217\u8868\u4E2D\uFF09" });
  }
  const primaryKey = config?.primary ? routeKey(config.primary) : "";
  const fallbackKey = config?.fallback ? routeKey(config.fallback) : NO_FALLBACK;
  const ready = config?.enabled === true && config.primary !== null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: styles_module_css_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.headerText, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { className: styles_module_css_default.title, children: "\u89C6\u89C9\u6A21\u578B" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.lead, children: "\u7EAF\u6587\u672C\u6A21\u578B\u901A\u8FC7 vision_describe \u628A\u56FE\u7247\u4EA4\u7ED9\u8FD9\u91CC\u7684\u89C6\u89C9\u6A21\u578B\u8BC6\u522B\uFF1B\u4E3B\u6A21\u578B\u5931\u8D25\u65F6\u81EA\u52A8\u7528\u5907\u7528\u6A21\u578B\u91CD\u8BD5\u3002" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        import_dsh_client_ui_primitives2.Switch,
        {
          checked: config?.enabled === true,
          disabled: saving,
          label: "\u542F\u7528\u89C6\u89C9\u6865\u63A5",
          onChange: (checked) => void save({ enabled: checked })
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.tags, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone: config?.enabled === true ? "success" : "neutral", children: config?.enabled === true ? "\u5DF2\u542F\u7528" : "\u5DF2\u505C\u7528" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_dsh_client_ui_primitives2.Tag, { tone: models.length > 0 ? "info" : "warning", children: [
        models.length,
        " \u4E2A\u89C6\u89C9\u6A21\u578B"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Tag, { tone: ready ? "success" : "warning", children: ready ? "\u6865\u63A5\u5C31\u7EEA" : "\u5F85\u914D\u7F6E" })
    ] }),
    error ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "alert", className: styles_module_css_default.error, children: error }) : null,
    models.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.warning, children: "\u6CA1\u6709\u627E\u5230\u652F\u6301\u56FE\u7247\u8F93\u5165\u7684\u6A21\u578B\u3002\u8BF7\u5230 \u8BBE\u7F6E \u2192 \u6A21\u578B \u4E2D\u4E3A\u591A\u6A21\u6001\u6A21\u578B\u52FE\u9009 image \u8F93\u5165\uFF0C\u7136\u540E\u70B9\u300C\u5237\u65B0\u5217\u8868\u300D\u3002" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Row,
        {
          label: "\u4E3B\u6A21\u578B",
          desc: "\u7EAF\u6587\u672C\u6A21\u578B\u770B\u56FE\u65F6\u8C03\u7528\u5B83\uFF1B\u672A\u9009\u62E9\u65F6 vision_describe \u4F1A\u4E34\u65F6\u7528\u5019\u9009\u5217\u8868\u7B2C\u4E00\u9879\uFF0C\u4F46\u53D1\u9001\u95E8\u7981\u4E0D\u4F1A\u63A5\u7BA1\u3002",
          children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            Select,
            {
              disabled: saving || options.length === 0,
              value: primaryKey,
              label: "\u4E3B\u89C6\u89C9\u6A21\u578B",
              selectedLabel: config?.primary ? routeLabel(config.primary, options) : "\u9009\u62E9\u4E3B\u6A21\u578B\u2026",
              options: options.map((model) => ({ id: routeKey(model), label: modelLabel(model) })),
              onSelect: (id) => {
                const route = parseKey(id);
                if (route) void save({ primary: route });
              }
            }
          )
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Row, { label: "\u5907\u7528\u6A21\u578B", desc: "\u4E3B\u6A21\u578B\u5931\u8D25\u65F6\u91CD\u8BD5\u4E00\u6B21\uFF1B\u4E0E\u4E3B\u6A21\u578B\u76F8\u540C\u5219\u4E0D\u91CD\u8BD5\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        Select,
        {
          disabled: saving,
          value: fallbackKey,
          label: "\u5907\u7528\u89C6\u89C9\u6A21\u578B",
          selectedLabel: config?.fallback ? routeLabel(config.fallback, options) : "\u4E0D\u4F7F\u7528\u5907\u7528\u6A21\u578B",
          options: [
            { id: NO_FALLBACK, label: "\u4E0D\u4F7F\u7528\u5907\u7528\u6A21\u578B" },
            ...options.map((model) => ({ id: routeKey(model), label: modelLabel(model) }))
          ],
          onSelect: (id) => {
            const route = id === NO_FALLBACK ? null : parseKey(id);
            if (id === NO_FALLBACK || route) void save({ fallback: route });
          }
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.actions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", size: "sm", disabled: loading || saving, onClick: () => void load(), children: "\u5237\u65B0\u5217\u8868" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "outline", size: "sm", disabled: checking || saving, onClick: () => void runCheck(), children: checking ? "\u6D4B\u8BD5\u4E2D\u2026" : "\u6D4B\u8BD5\u8DEF\u7531" }),
      saving ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: styles_module_css_default.muted, children: "\u4FDD\u5B58\u4E2D\u2026" }) : null
    ] }),
    check ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: styles_module_css_default.check, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CheckRow, { label: "\u4E3B\u6A21\u578B", result: check.primary }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CheckRow, { label: "\u5907\u7528\u6A21\u578B", result: check.fallback }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u53EA\u68C0\u67E5\u8DEF\u7531\u548C\u56FE\u7247\u80FD\u529B\u58F0\u660E\uFF0C\u4E0D\u4F1A\u53D1\u8D77\u771F\u5B9E\u63A8\u7406\u3002" })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: styles_module_css_default.hint, children: "\u56FE\u7247\u6309\u4F1A\u8BDD\u7F13\u5B58\u6700\u8FD1 20 \u5F20\uFF0C\u6BCF\u6B21 vision_describe \u6700\u591A\u5206\u6790 4 \u5F20\u3002\u914D\u7F6E\u4FDD\u5B58\u5728 profile \u6761\u76EE dshp-vision-bridge \u7684 config:\uFF0C\u6539\u52A8\u5373\u65F6\u751F\u6548\u3002" })
  ] });
}

// src/client/index.tsx
var SETTINGS_NS = "dshp-vision-bridge";
var SETTINGS_ORDER = 25;
var SETTINGS_LABEL = "\u89C6\u89C9\u6A21\u578B";
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
          VisionSection
        )
      ),
      "dshp-vision-bridge: settings section"
    );
  } catch (error) {
    console.error("[dshp-vision-bridge] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF0C\u8BBE\u7F6E\u9875\u5C06\u770B\u4E0D\u5230\u89C6\u89C9\u6A21\u578B\u914D\u7F6E\uFF1A", error);
  }
}
return module.exports; } });
