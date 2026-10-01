window.__ModuleLoader__.load({ id: "@dshp/widget-kit", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/client/index.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);

// src/client/spec.ts
var SPEC_VERSION = 1;
var FRAMEWORK_VERSION = "0.13.0";
var WIDGET_ID_PATTERN = /^[a-z0-9-]{2,32}:[a-z0-9-]{2,32}$/;
var PRESENTATIONS = ["tray", "popover", "card"];
var TRAY_LABEL_MAX_CHARS = 6;
var SPEC_DEFAULTS = {
  /** 卡片首次打开时的尺寸（外层 px）。 */
  cardDefaultSize: { w: 360, h: 240 },
  /** 卡片可缩到的最小尺寸（外层 px）；框架地板，与描述符取较大者。 */
  cardFloorSize: { w: 240, h: 140 },
  /** 内容盒宽度的 sizeClass 阈值。 */
  breakpoints: { compact: 320, wide: 560 },
  /** 徽标轮询的默认间隔与下限（ms）。 */
  badgeIntervalMs: 3e4,
  badgeIntervalMinMs: 5e3,
  badgeIntervalMaxMs: 6e5,
  /** 内容面打开时的轮询下限（ms）；`0` = 不轮询。 */
  refreshMinMs: 5e3,
  /** 标题栏高度与内容区内边距（内容盒 = 外层 − 标题栏 − 2×内边距）。 */
  titleBarHeight: 36,
  contentPadding: 10,
  /** 吸附：相邻卡片贴在一起保留的间隔、触发吸附的距离（px）。 */
  snapGap: 8,
  snapDistance: 12,
  /** 外观：圆角「跟随框架默认 / 圆角 / 直角」三档，以及边框宽度（默认 / 明显 / 无）。 */
  cardRadius: 12,
  cardRadiusRound: 20,
  cardBorderWidth: 0.5,
  cardBorderWidthStrong: 1,
  /** 动效时长（ms）：所有过渡与入场动画用它；`0` = 关闭动效。 */
  motionMs: 300,
  /**
   * 最小化胶囊的**最小宽度**（px）：再短的标题也给这么宽，免得收成一粒看不清的豆子。
   *
   * 胶囊要装下标题与控件**需要多宽是量出来的**（`measure.measureHeaderWidth` 量整条标题栏的自然
   * 宽度），不在这里按「内边距 + 标题 + 间隙 + 按钮」的常量加法算 —— 那种算法只要有一处常量与真实
   * 排版不一致（官方按钮换尺寸、锚点外多一层包装、卡片自己有 0.5px 边框）就会偏窄，而偏窄的表现
   * 正是「折叠后标题被省略号截掉」。这里只留地板值。
   */
  capsuleMinWidth: 160,
  /** 动效可选档位（设置页的「关 / 100 / 200 / 300 / 400 / 500」）。 */
  motionChoices: [0, 100, 200, 300, 400, 500],
  /** 同屏卡片上限；开了第 7 张时自动最小化最旧一张。 */
  maxOpenCards: 6,
  /** 托盘可见图标上限（框架偏好的默认值，用户可在设置页改）。 */
  maxVisibleIcons: 4,
  /** 新卡的层叠偏移。 */
  cascadeStep: 28,
  /** popover：内容内边距、悬停展开延迟、悬停收起宽限、自适应宽度上限。 */
  popoverPadding: 12,
  popoverWidthMax: 420,
  popoverMaxHeightMax: 2e3,
  hoverOpenDelayMs: 80,
  hoverCloseDelayMs: 220,
  /** popover 默认不是常驻面板（点外部即收起）。 */
  popoverPersistent: false
};
var WidgetSpecError = class extends Error {
  constructor(field, detail) {
    super(`\u5C0F\u7EC4\u4EF6\u63CF\u8FF0\u7B26\u4E0D\u5408\u6CD5\uFF08${field}\uFF09\uFF1A${detail}`);
    __publicField(this, "field");
    this.name = "WidgetSpecError";
    this.field = field;
  }
};
function isRecord(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isText(v) {
  return typeof v === "string" || typeof v === "function";
}
function isPositiveInt(v) {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}
function readBool(field, v, fallback) {
  if (v === void 0) return fallback;
  if (typeof v !== "boolean") throw new WidgetSpecError(field, "\u5FC5\u987B\u662F\u5E03\u5C14\u503C");
  return v;
}
function resolveText(value, fallback) {
  if (value === null || value === void 0) return fallback;
  return typeof value === "function" ? value() : value;
}
function compareVersions(a, b) {
  const parse = (v) => {
    const [base = "", pre = ""] = v.split("-", 2);
    const nums = base.split(".").map((part) => {
      const n = Number.parseInt(part, 10);
      return Number.isFinite(n) ? n : 0;
    });
    return { nums, pre: (pre ?? "").trim() };
  };
  const left = parse(a);
  const right = parse(b);
  for (let i = 0; i < 3; i += 1) {
    const x = left.nums[i] ?? 0;
    const y = right.nums[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  if (left.pre === right.pre) return 0;
  if (left.pre === "") return 1;
  if (right.pre === "") return -1;
  return left.pre < right.pre ? -1 : 1;
}
function readPositive(field, v) {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
    throw new WidgetSpecError(field, "\u5FC5\u987B\u662F\u975E\u8D1F\u6570\u5B57");
  }
  return Math.round(v);
}
function readSize(field, v) {
  if (!isRecord(v)) throw new WidgetSpecError(field, "\u5FC5\u987B\u662F { w, h } \u5BF9\u8C61");
  const w = v["w"];
  const h = v["h"];
  if (!isPositiveInt(w)) throw new WidgetSpecError(`${field}.w`, "\u5FC5\u987B\u662F\u6B63\u6570");
  if (!isPositiveInt(h)) throw new WidgetSpecError(`${field}.h`, "\u5FC5\u987B\u662F\u6B63\u6570");
  return { w: Math.round(w), h: Math.round(h) };
}
function normalizeDescriptor(raw, frameworkVersion = FRAMEWORK_VERSION) {
  if (!isRecord(raw)) throw new WidgetSpecError("descriptor", "\u5FC5\u987B\u662F\u5BF9\u8C61");
  const id = raw["id"];
  if (typeof id !== "string" || id === "") throw new WidgetSpecError("id", "\u5FC5\u586B\uFF0C\u5B57\u7B26\u4E32");
  if (!WIDGET_ID_PATTERN.test(id)) {
    throw new WidgetSpecError("id", `\u5FC5\u987B\u5339\u914D ${String(WIDGET_ID_PATTERN)}\uFF08\u4F8B\uFF1A'my-plugin:clock'\uFF09`);
  }
  const owner = id.slice(0, id.indexOf(":"));
  if (!isText(raw["title"])) throw new WidgetSpecError("title", "\u5FC5\u586B\uFF0C\u5B57\u7B26\u4E32\u6216\u8FD4\u56DE\u5B57\u7B26\u4E32\u7684\u51FD\u6570");
  if (raw["icon"] === void 0 || raw["icon"] === null)
    throw new WidgetSpecError("icon", "\u5FC5\u586B\uFF0CReact \u8282\u70B9");
  const subtitle = raw["subtitle"] === void 0 ? null : raw["subtitle"];
  if (subtitle !== null && !isText(subtitle)) {
    throw new WidgetSpecError("subtitle", "\u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u6216\u8FD4\u56DE\u5B57\u7B26\u4E32\u7684\u51FD\u6570");
  }
  const orderRaw = raw["order"] ?? 0;
  if (typeof orderRaw !== "number" || !Number.isFinite(orderRaw)) {
    throw new WidgetSpecError("order", "\u5FC5\u987B\u662F\u6709\u9650\u6570\u5B57");
  }
  const presentation = raw["presentation"];
  if (!PRESENTATIONS.includes(presentation)) {
    throw new WidgetSpecError("presentation", `\u5FC5\u586B\uFF0C\u53D6 ${PRESENTATIONS.join(" | ")}`);
  }
  const frame = presentation;
  const minFramework = raw["minFramework"];
  if (minFramework !== void 0) {
    if (typeof minFramework !== "string") throw new WidgetSpecError("minFramework", "\u5FC5\u987B\u662F\u7248\u672C\u5B57\u7B26\u4E32");
    if (compareVersions(frameworkVersion, minFramework) < 0) {
      throw new WidgetSpecError(
        "minFramework",
        `\u672C\u7EC4\u4EF6\u8981\u6C42 @dshp/widget-kit >= ${minFramework}\uFF0C\u5F53\u524D\u662F ${frameworkVersion}\uFF0C\u8BF7\u5148\u5347\u7EA7\u6846\u67B6`
      );
    }
  }
  const trayIconRaw = raw["trayIcon"];
  if (trayIconRaw !== void 0 && typeof trayIconRaw !== "boolean") {
    throw new WidgetSpecError("trayIcon", "\u5FC5\u987B\u662F boolean");
  }
  const trayIcon = trayIconRaw !== false;
  if (!trayIcon && frame !== "card") {
    throw new WidgetSpecError(
      "trayIcon",
      "\u53EA\u6709 presentation: 'card' \u80FD\u4E0D\u663E\u793A\u56FE\u6807\uFF08'tray' \u6CA1\u6709\u56FE\u6807\u5C31\u6CA1\u6709\u610F\u4E49\uFF0C'popover' \u9700\u8981\u56FE\u6807\u5F53\u951A\u70B9\uFF09"
    );
  }
  const listedInBoxRaw = raw["listedInBox"];
  if (listedInBoxRaw !== void 0 && typeof listedInBoxRaw !== "boolean") {
    throw new WidgetSpecError("listedInBox", "\u5FC5\u987B\u662F boolean");
  }
  const listedInBox = listedInBoxRaw === true;
  if (listedInBox && frame !== "card") {
    throw new WidgetSpecError(
      "listedInBox",
      "\u53EA\u6709 presentation: 'card' \u80FD\u88AB\u300C\u7EC4\u4EF6\u7BB1\u300D\u6536\u5F55\uFF08\u5B83\u662F\u81EA\u7531\u5361\u7247\u7684\u7EDF\u4E00\u5165\u53E3\uFF09"
    );
  }
  const trayRaw = raw["tray"];
  if (trayRaw !== void 0 && !isRecord(trayRaw)) throw new WidgetSpecError("tray", "\u5FC5\u987B\u662F\u5BF9\u8C61");
  const trayObj = isRecord(trayRaw) ? trayRaw : {};
  const badge = trayObj["badge"];
  if (badge !== void 0 && typeof badge !== "function") {
    throw new WidgetSpecError("tray.badge", "\u5FC5\u987B\u662F\u51FD\u6570");
  }
  const labelRaw = trayObj["label"];
  if (labelRaw !== void 0 && typeof labelRaw !== "string" && typeof labelRaw !== "function") {
    throw new WidgetSpecError("tray.label", "\u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u6216\u8FD4\u56DE\u5B57\u7B26\u4E32\u7684\u51FD\u6570");
  }
  if (typeof labelRaw === "string" && labelRaw.length > TRAY_LABEL_MAX_CHARS) {
    throw new WidgetSpecError(
      "tray.label",
      `\u6700\u591A ${String(TRAY_LABEL_MAX_CHARS)} \u4E2A\u5B57\uFF08\u6D3B\u52A8\u680F\u53EA\u7559\u5C11\u91CF\u6587\u5B57\u7684\u4F4D\u7F6E\uFF09`
    );
  }
  const badgeIntervalRaw = trayObj["badgeIntervalMs"] ?? SPEC_DEFAULTS.badgeIntervalMs;
  if (typeof badgeIntervalRaw !== "number" || !Number.isFinite(badgeIntervalRaw)) {
    throw new WidgetSpecError("tray.badgeIntervalMs", "\u5FC5\u987B\u662F\u6570\u5B57\uFF08\u6BEB\u79D2\uFF09");
  }
  if (badgeIntervalRaw < SPEC_DEFAULTS.badgeIntervalMinMs || badgeIntervalRaw > SPEC_DEFAULTS.badgeIntervalMaxMs) {
    throw new WidgetSpecError(
      "tray.badgeIntervalMs",
      `\u5FC5\u987B\u5728 ${String(SPEC_DEFAULTS.badgeIntervalMinMs)}\u2013${String(SPEC_DEFAULTS.badgeIntervalMaxMs)} \u4E4B\u95F4`
    );
  }
  const contentRaw = raw["content"];
  if (frame === "tray") {
    if (contentRaw !== void 0) {
      throw new WidgetSpecError("content", "presentation \u4E3A 'tray' \u65F6\u4E0D\u5E94\u63D0\u4F9B content\uFF08\u6CA1\u6709\u5185\u5BB9\u9762\uFF09");
    }
  } else if (!isRecord(contentRaw)) {
    throw new WidgetSpecError("content", `presentation \u4E3A '${frame}' \u65F6\u5FC5\u586B`);
  }
  const contentObj = isRecord(contentRaw) ? contentRaw : {};
  let content = null;
  if (frame !== "tray") {
    const render = contentObj["render"];
    if (typeof render !== "function") throw new WidgetSpecError("content.render", "\u5FC5\u586B\uFF0C\u51FD\u6570");
    const load = contentObj["load"];
    if (load !== void 0 && typeof load !== "function")
      throw new WidgetSpecError("content.load", "\u5FC5\u987B\u662F\u51FD\u6570");
    const contentTitle = contentObj["title"];
    if (contentTitle !== void 0 && !isText(contentTitle)) {
      throw new WidgetSpecError("content.title", "\u5FC5\u987B\u662F\u5B57\u7B26\u4E32\u6216\u8FD4\u56DE\u5B57\u7B26\u4E32\u7684\u51FD\u6570");
    }
    const refreshRaw = contentObj["refreshMs"] ?? 0;
    if (typeof refreshRaw !== "number" || !Number.isFinite(refreshRaw) || refreshRaw < 0) {
      throw new WidgetSpecError("content.refreshMs", "\u5FC5\u987B\u662F\u975E\u8D1F\u6570\u5B57\uFF08\u6BEB\u79D2\uFF09");
    }
    if (refreshRaw !== 0 && refreshRaw < SPEC_DEFAULTS.refreshMinMs) {
      throw new WidgetSpecError(
        "content.refreshMs",
        `\u8981\u4E48\u4E3A 0\uFF08\u4E0D\u8F6E\u8BE2\uFF09\uFF0C\u8981\u4E48 >= ${String(SPEC_DEFAULTS.refreshMinMs)}`
      );
    }
    content = {
      title: contentTitle ?? null,
      load: load ?? null,
      refreshMs: refreshRaw,
      render
    };
  }
  const popoverRaw = raw["popover"];
  if (popoverRaw !== void 0 && !isRecord(popoverRaw)) {
    throw new WidgetSpecError("popover", "\u5FC5\u987B\u662F\u5BF9\u8C61");
  }
  if (popoverRaw !== void 0 && frame !== "popover") {
    throw new WidgetSpecError("popover", "\u53EA\u6709 presentation \u4E3A 'popover' \u65F6\u624D\u63A5\u53D7 popover \u914D\u7F6E");
  }
  const popoverObj = isRecord(popoverRaw) ? popoverRaw : {};
  let popover = null;
  if (frame === "popover") {
    const triggerRaw = popoverObj["trigger"] ?? "click";
    if (triggerRaw !== "click" && triggerRaw !== "hover") {
      throw new WidgetSpecError("popover.trigger", "\u53D6 'click'\uFF08\u70B9\u56FE\u6807\u5C55\u5F00\uFF09\u6216 'hover'\uFF08\u60AC\u505C\u5C55\u5F00\uFF09");
    }
    const sideRaw = popoverObj["side"] ?? "bottom";
    if (sideRaw !== "bottom" && sideRaw !== "top") {
      throw new WidgetSpecError("popover.side", "\u53D6 'bottom' \u6216 'top'");
    }
    const width = popoverObj["width"] === void 0 ? null : readPositive("popover.width", popoverObj["width"]);
    if (width !== null && (width < 160 || width > 2e3)) {
      throw new WidgetSpecError("popover.width", "\u5FC5\u987B\u5728 160\u20132000 px \u4E4B\u95F4");
    }
    const maxHeight = popoverObj["maxHeight"] === void 0 ? null : readPositive("popover.maxHeight", popoverObj["maxHeight"]);
    if (maxHeight !== null && (maxHeight < 120 || maxHeight > SPEC_DEFAULTS.popoverMaxHeightMax)) {
      throw new WidgetSpecError(
        "popover.maxHeight",
        `\u5FC5\u987B\u5728 120\u2013${String(SPEC_DEFAULTS.popoverMaxHeightMax)} px \u4E4B\u95F4`
      );
    }
    const padding = popoverObj["padding"] === void 0 ? SPEC_DEFAULTS.popoverPadding : readPositive("popover.padding", popoverObj["padding"]);
    if (padding > 48) throw new WidgetSpecError("popover.padding", "\u4E0D\u5F97\u8D85\u8FC7 48 px");
    const hoverOpenDelayMs = popoverObj["hoverOpenDelayMs"] === void 0 ? SPEC_DEFAULTS.hoverOpenDelayMs : readPositive("popover.hoverOpenDelayMs", popoverObj["hoverOpenDelayMs"]);
    const hoverCloseDelayMs = popoverObj["hoverCloseDelayMs"] === void 0 ? SPEC_DEFAULTS.hoverCloseDelayMs : readPositive("popover.hoverCloseDelayMs", popoverObj["hoverCloseDelayMs"]);
    if (hoverOpenDelayMs > 2e3 || hoverCloseDelayMs > 2e3) {
      throw new WidgetSpecError("popover.hoverOpenDelayMs", "\u5EF6\u8FDF\u4E0D\u5F97\u8D85\u8FC7 2000 ms");
    }
    popover = {
      trigger: triggerRaw,
      width,
      maxHeight,
      padding,
      side: sideRaw,
      header: readBool("popover.header", popoverObj["header"], true),
      hoverOpenDelayMs,
      hoverCloseDelayMs,
      persistent: readBool("popover.persistent", popoverObj["persistent"], SPEC_DEFAULTS.popoverPersistent)
    };
  }
  const cardRaw = raw["card"];
  if (cardRaw !== void 0 && !isRecord(cardRaw)) throw new WidgetSpecError("card", "\u5FC5\u987B\u662F\u5BF9\u8C61");
  if (cardRaw !== void 0 && frame !== "card") {
    throw new WidgetSpecError("card", "\u53EA\u6709 presentation \u4E3A 'card' \u65F6\u624D\u63A5\u53D7 card \u914D\u7F6E");
  }
  const cardObj = isRecord(cardRaw) ? cardRaw : {};
  let card = null;
  if (frame === "card") {
    const floor = SPEC_DEFAULTS.cardFloorSize;
    const minSize = cardObj["minSize"] === void 0 ? floor : readSize("card.minSize", cardObj["minSize"]);
    const maxSize = cardObj["maxSize"] === void 0 ? null : readSize("card.maxSize", cardObj["maxSize"]);
    const defaultSize = cardObj["defaultSize"] === void 0 ? SPEC_DEFAULTS.cardDefaultSize : readSize("card.defaultSize", cardObj["defaultSize"]);
    if (minSize.w < floor.w || minSize.h < floor.h) {
      throw new WidgetSpecError("card.minSize", `\u4E0D\u5F97\u5C0F\u4E8E\u6846\u67B6\u5730\u677F ${floor.w}\xD7${floor.h}`);
    }
    if (maxSize && (maxSize.w < minSize.w || maxSize.h < minSize.h)) {
      throw new WidgetSpecError("card.maxSize", "\u4E0D\u5F97\u5C0F\u4E8E card.minSize");
    }
    if (defaultSize.w < minSize.w || defaultSize.h < minSize.h) {
      throw new WidgetSpecError("card.defaultSize", "\u4E0D\u5F97\u5C0F\u4E8E card.minSize");
    }
    if (maxSize && (defaultSize.w > maxSize.w || defaultSize.h > maxSize.h)) {
      throw new WidgetSpecError("card.defaultSize", "\u4E0D\u5F97\u5927\u4E8E card.maxSize");
    }
    const bpRaw = cardObj["sizeClassBreakpoints"];
    if (bpRaw !== void 0 && !isRecord(bpRaw)) {
      throw new WidgetSpecError("card.sizeClassBreakpoints", "\u5FC5\u987B\u662F { compact, wide }");
    }
    const bpObj = isRecord(bpRaw) ? bpRaw : {};
    const compact = bpObj["compact"] ?? SPEC_DEFAULTS.breakpoints.compact;
    const wide = bpObj["wide"] ?? SPEC_DEFAULTS.breakpoints.wide;
    if (!isPositiveInt(compact) || !isPositiveInt(wide)) {
      throw new WidgetSpecError("card.sizeClassBreakpoints", "compact / wide \u5FC5\u987B\u662F\u6B63\u6570");
    }
    if (compact >= wide) {
      throw new WidgetSpecError("card.sizeClassBreakpoints", "compact \u5FC5\u987B\u5C0F\u4E8E wide");
    }
    card = {
      defaultSize,
      minSize,
      maxSize,
      breakpoints: { compact: Math.round(compact), wide: Math.round(wide) },
      resizable: readBool("card.resizable", cardObj["resizable"], true),
      minimizable: readBool("card.minimizable", cardObj["minimizable"], true),
      closable: readBool("card.closable", cardObj["closable"], true)
    };
  }
  return {
    id,
    owner,
    title: raw["title"],
    icon: raw["icon"],
    subtitle,
    order: orderRaw,
    presentation: frame,
    tray: {
      badge: badge ?? null,
      badgeIntervalMs: Math.round(badgeIntervalRaw),
      label: labelRaw ?? null
    },
    trayIcon,
    listedInBox,
    content,
    card,
    popover
  };
}

// src/client/badges.ts
var BADGE_TIMEOUT_MS = 5e3;
var BADGE_BACKOFF_MS = [5e3, 1e4, 3e4, 6e4];
var BADGE_FAILURES_TO_WARN = 3;
function createBadgeScheduler(deps) {
  const now = deps.now ?? (() => Date.now());
  const isVisible = deps.isVisible ?? (() => typeof document === "undefined" ? true : document.visibilityState !== "hidden");
  const state = /* @__PURE__ */ new Map();
  const flights = /* @__PURE__ */ new Map();
  let disposed = false;
  function ensure(id) {
    const existing = state.get(id);
    if (existing !== void 0) return existing;
    const created = {
      id,
      failures: 0,
      nextDueAt: 0,
      lastRunAt: null,
      lastError: null,
      inFlight: false
    };
    state.set(id, created);
    return created;
  }
  function intervalFor(widget, fallback) {
    const wanted = widget.tray.badgeIntervalMs || fallback;
    return Math.max(SPEC_DEFAULTS.badgeIntervalMinMs, wanted);
  }
  async function run(widget, entry, intervalMs) {
    const badge = widget.tray.badge;
    if (badge === null) return;
    const controller = new AbortController();
    let timedOut = false;
    const cancel = deps.timeout(() => {
      timedOut = true;
      controller.abort();
    }, BADGE_TIMEOUT_MS);
    flights.set(widget.id, { controller, cancel });
    entry.inFlight = true;
    entry.lastRunAt = now();
    try {
      const value = await Promise.resolve(
        badge({
          sessionId: deps.runtime.getSession(),
          signal: controller.signal,
          frameworkVersion: FRAMEWORK_VERSION
        })
      );
      if (disposed) return;
      entry.failures = 0;
      entry.lastError = null;
      deps.runtime.setBadge(widget.id, value ?? null);
      entry.nextDueAt = now() + intervalMs;
    } catch (error) {
      if (disposed) return;
      const message = timedOut ? "\u5FBD\u6807\u8C03\u7528\u8D85\u65F6" : String(error?.message ?? error);
      entry.failures += 1;
      entry.lastError = message;
      const backoff = BADGE_BACKOFF_MS[Math.min(entry.failures - 1, BADGE_BACKOFF_MS.length - 1)] ?? 6e4;
      entry.nextDueAt = now() + backoff;
      if (entry.failures >= BADGE_FAILURES_TO_WARN) {
        deps.runtime.setBadge(widget.id, { dot: true, tone: "bad", title: `\u7EC4\u4EF6\u5FBD\u6807\u8FDE\u7EED\u51FA\u9519\uFF1A${message}` });
      }
      deps.onError?.(
        `[dshp-widget-kit] \u7EC4\u4EF6\u300C${widget.id}\u300D\u7684\u5FBD\u6807\u5237\u65B0\u5931\u8D25\uFF08\u7B2C ${String(entry.failures)} \u6B21\uFF09\uFF1A${message}`
      );
    } finally {
      cancel();
      flights.delete(widget.id);
      entry.inFlight = false;
    }
  }
  function tick() {
    if (disposed || !isVisible()) return;
    const snapshot = deps.runtime.getSnapshot();
    const fallbackInterval = snapshot.prefs.badgeIntervalMs;
    const alive = /* @__PURE__ */ new Set();
    for (const widget of snapshot.widgets) {
      if (widget.tray.badge === null) continue;
      if (!deps.runtime.isEnabled(widget.id)) continue;
      alive.add(widget.id);
      const entry = ensure(widget.id);
      if (entry.inFlight) continue;
      if (now() < entry.nextDueAt) continue;
      const intervalMs = intervalFor(widget, fallbackInterval);
      entry.nextDueAt = now() + intervalMs;
      void run(widget, entry, intervalMs);
    }
    for (const id of state.keys()) {
      if (alive.has(id)) continue;
      const flight = flights.get(id);
      flight?.controller.abort();
      state.delete(id);
    }
  }
  return {
    tick,
    dispose() {
      disposed = true;
      for (const flight of flights.values()) {
        flight.cancel();
        flight.controller.abort();
      }
      flights.clear();
      state.clear();
    },
    stats: () => [...state.values()].map((entry) => ({ ...entry }))
  };
}

// src/client/Card.tsx
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react3 = require("react");

// src/client/geometry.ts
var TITLE_BAR_HEIGHT = 36;
var CONTENT_PADDING = 10;
var SNAP_GAP = 8;
var SNAP_DISTANCE = 12;
var CASCADE_STEP = 28;
var CASCADE_WRAP = 6;
var CAPSULE_MIN_WIDTH = 160;
var CAPSULE_SLACK = 6;
var RESIZE_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
function safeViewport(viewport) {
  const width = Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : 1024;
  const height = Number.isFinite(viewport.height) && viewport.height > 0 ? viewport.height : 768;
  return { width, height };
}
function maxSizeFor(constraints, viewport) {
  const vp = safeViewport(viewport);
  const maxW = Math.min(constraints.max?.w ?? vp.width, vp.width);
  const maxH = Math.min(constraints.max?.h ?? vp.height, vp.height);
  return {
    w: Math.max(constraints.min.w, maxW),
    h: Math.max(constraints.min.h, maxH)
  };
}
function clampSize(size, constraints, viewport) {
  const cap = maxSizeFor(constraints, viewport);
  return {
    w: Math.round(clamp(size.w, Math.min(constraints.min.w, cap.w), cap.w)),
    h: Math.round(clamp(size.h, Math.min(constraints.min.h, cap.h), cap.h))
  };
}
function containRect(rect, viewport) {
  const vp = safeViewport(viewport);
  const w = Number.isFinite(rect.w) ? Math.max(0, Math.round(rect.w)) : 0;
  const h = Number.isFinite(rect.h) ? Math.max(0, Math.round(rect.h)) : 0;
  return {
    x: Math.round(clamp(rect.x, 0, Math.max(0, vp.width - w))),
    y: Math.round(clamp(rect.y, 0, Math.max(0, vp.height - h))),
    w,
    h
  };
}
function clampRect(rect, constraints, viewport) {
  const size = clampSize(rect, constraints, viewport);
  return containRect({ ...rect, ...size }, viewport);
}
function defaultRect(index, size, constraints, viewport) {
  const vp = safeViewport(viewport);
  const step = Math.max(0, Math.floor(index)) % CASCADE_WRAP * CASCADE_STEP;
  const raw = {
    x: vp.width - size.w - 24 - step,
    y: 88 + step,
    w: size.w,
    h: size.h
  };
  return clampRect(raw, constraints, viewport);
}
function contentBox(rect) {
  return {
    width: Math.max(0, Math.round(rect.w) - CONTENT_PADDING * 2),
    height: Math.max(0, Math.round(rect.h) - TITLE_BAR_HEIGHT - CONTENT_PADDING * 2)
  };
}
function sizeClassOf(width, breakpoints) {
  if (!Number.isFinite(width)) return "regular";
  if (width < breakpoints.compact) return "compact";
  if (width >= breakpoints.wide) return "wide";
  return "regular";
}
var DEFAULT_SNAP = { gap: SNAP_GAP, distance: SNAP_DISTANCE };
function snapAxis(pos, size, spans, limit, options) {
  const candidates = [
    { value: 0, edge: true },
    { value: limit - size, edge: true }
  ];
  for (const span of spans) {
    candidates.push({ value: span.pos + span.size + options.gap, edge: true });
    candidates.push({ value: span.pos - options.gap - size, edge: true });
    candidates.push({ value: span.pos, edge: false });
    candidates.push({ value: span.pos + span.size - size, edge: false });
  }
  let bestValue = pos;
  let bestDelta = options.distance + 1;
  let bestEdge = true;
  for (const candidate of candidates) {
    const delta = Math.abs(candidate.value - pos);
    if (!Number.isFinite(delta) || delta > options.distance) continue;
    if (delta < bestDelta) {
      bestValue = candidate.value;
      bestDelta = delta;
      bestEdge = candidate.edge;
    } else if (delta === bestDelta && candidate.edge && !bestEdge) {
      bestValue = candidate.value;
      bestEdge = true;
    }
  }
  return Math.round(bestValue);
}
function snapRect(rect, others, viewport, options = DEFAULT_SNAP) {
  const vp = safeViewport(viewport);
  const contained = containRect(rect, vp);
  return {
    ...contained,
    x: snapAxis(
      contained.x,
      contained.w,
      others.map((other) => ({ pos: other.x, size: other.w })),
      vp.width,
      options
    ),
    y: snapAxis(
      contained.y,
      contained.h,
      others.map((other) => ({ pos: other.y, size: other.h })),
      vp.height,
      options
    )
  };
}
function applyResize(rect, dir, dx, dy, constraints, viewport) {
  const vp = safeViewport(viewport);
  const cur = clampRect(rect, constraints, viewport);
  const cap = maxSizeFor(constraints, viewport);
  const minW = Math.min(constraints.min.w, cap.w);
  const minH = Math.min(constraints.min.h, cap.h);
  const east = dir.includes("e");
  const west = dir.includes("w");
  const north = dir.includes("n");
  const south = dir.includes("s");
  let w = cur.w;
  let h = cur.h;
  if (east) {
    const limit = Math.max(minW, Math.min(cap.w, vp.width - cur.x));
    w = clamp(cur.w + dx, minW, limit);
  } else if (west) {
    w = clamp(cur.w - dx, minW, cap.w);
  }
  if (south) {
    const limit = Math.max(minH, Math.min(cap.h, vp.height - cur.y));
    h = clamp(cur.h + dy, minH, limit);
  } else if (north) {
    const limit = Math.max(minH, cur.y + cur.h);
    h = clamp(cur.h - dy, minH, limit);
  }
  const x = west ? cur.x + (cur.w - w) : cur.x;
  const y = north ? cur.y + (cur.h - h) : cur.y;
  return clampRect({ x, y, w, h }, constraints, viewport);
}
function bringToFront(order, id) {
  const index = order.indexOf(id);
  if (index !== -1 && index === order.length - 1) return order;
  const next = order.filter((x) => x !== id);
  next.push(id);
  return next;
}
function isSameRect(a, b) {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}
function headerActions(card) {
  return {
    lock: true,
    minimize: !card.locked && card.minimizable,
    menu: true,
    close: !card.locked && card.closable
  };
}
function capsuleWidth(options) {
  const stored = options.stored;
  const cap = Number.isFinite(stored) && stored > 0 ? Math.round(stored) : CAPSULE_MIN_WIDTH;
  const need = options.need === void 0 || !Number.isFinite(options.need) ? CAPSULE_MIN_WIDTH : Math.max(CAPSULE_MIN_WIDTH, Math.ceil(options.need) + CAPSULE_SLACK);
  return Math.min(need, cap);
}
function capsuleOverflowFix(options) {
  const { need, overflow, capsule, layoutWidth } = options;
  if (!Number.isFinite(overflow) || overflow <= 0) return null;
  if (!Number.isFinite(need) || need <= 0) return null;
  if (!Number.isFinite(layoutWidth) || layoutWidth <= 0) return null;
  if (capsule >= Math.round(layoutWidth)) return null;
  return Math.ceil(need + overflow) + 1;
}

// src/client/ErrorBoundary.tsx
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = '.SigSeG_tray{--dshp-card-alpha:100%;--dshp-card-blur:none;--dshp-card-radius:12px;--dshp-card-capsule-radius:999px;--dshp-card-border-width:.5px;--dshp-motion-ms:.3s;flex:none;align-items:center;gap:2px;display:flex;position:relative}.SigSeG_trayAnchor{transition:transform var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1);display:inline-flex}.SigSeG_trayAnchorDragging{z-index:3;transition:none}.SigSeG_trayAnchorDragging .SigSeG_trayBtn{box-shadow:0 2px 8px var(--dsw-alias-state-business-tertiary);box-shadow:0 2px 8px color-mix(in srgb, var(--dsw-alias-state-business-primary) 22%, transparent)}.SigSeG_trayGhost{box-sizing:border-box;border:1px dashed var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent);box-shadow:0 0 0 3px var(--dsw-alias-state-business-tertiary);box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);pointer-events:none;animation:SigSeG_ghostIn var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1);transition:left var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1);border-radius:8px;position:absolute;top:0;bottom:0}@keyframes SigSeG_ghostIn{0%{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}.SigSeG_trayBtn{min-width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;transition:transform var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), background var(--dshp-motion-ms,.3s) ease, color var(--dshp-motion-ms,.3s) ease;background:0 0;border:none;border-radius:8px;justify-content:center;align-items:center;gap:4px;padding:0 6px;display:inline-flex;position:relative}.SigSeG_trayBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.SigSeG_trayBtn:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.SigSeG_trayBtnActive{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.SigSeG_trayBtnDragging{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary);box-shadow:0 0 0 3px var(--dsw-alias-state-business-tertiary);box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-business-primary) 14%, transparent);transform:scale(1.12)}.SigSeG_trayLabel{text-overflow:ellipsis;white-space:nowrap;max-width:68px;color:inherit;font-variant-numeric:tabular-nums;font-size:11px;line-height:1;overflow:hidden}.SigSeG_trayGlyph{justify-content:center;align-items:center;width:18px;height:18px;display:inline-flex}.SigSeG_trayGlyph>svg{width:18px;height:18px}.SigSeG_trayBadge{background:var(--dsw-alias-state-business-primary);border-radius:999px;width:6px;height:6px;position:absolute;top:2px;right:2px}.SigSeG_trayBadge[data-tone=ok]{background:var(--dsw-alias-state-success-primary)}.SigSeG_trayBadge[data-tone=warn]{background:var(--dsw-alias-state-warn-primary)}.SigSeG_trayBadge[data-tone=bad]{background:var(--dsw-alias-state-error-primary)}.SigSeG_trayBadgeText{background:var(--dsw-alias-state-business-primary);min-width:14px;height:14px;color:var(--dsw-alias-label-primary-foreground);text-align:center;font-size:9px;line-height:14px;font-family:var(--dsw-font-family);border-radius:999px;padding:0 3px;position:absolute;top:-2px;right:-4px}.SigSeG_trayBadgeText[data-tone=ok]{background:var(--dsw-alias-state-success-primary)}.SigSeG_trayBadgeText[data-tone=warn]{background:var(--dsw-alias-state-warn-primary)}.SigSeG_trayBadgeText[data-tone=bad]{background:var(--dsw-alias-state-error-primary)}.SigSeG_layer{z-index:1;isolation:isolate;pointer-events:none;--dshp-card-alpha:100%;--dshp-card-blur:none;--dshp-card-radius:12px;--dshp-card-capsule-radius:999px;--dshp-card-border-width:.5px;--dshp-motion-ms:.3s;position:fixed;inset:0}.SigSeG_card{pointer-events:auto;box-sizing:border-box;border:var(--dshp-card-border-width,.5px) solid var(--dsw-alias-border-l2);border-radius:var(--dshp-card-radius,12px);background:var(--dsw-alias-bg-layer-1);background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) var(--dshp-card-alpha,100%), transparent);backdrop-filter:var(--dshp-card-blur,none);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);animation:SigSeG_cardIn var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1);transition:left var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), top var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), width var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), height var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), box-shadow var(--dshp-motion-ms,.3s) ease;flex-direction:column;display:flex;position:fixed;overflow:hidden}.SigSeG_card[data-gesture=true]{transition:transform var(--dshp-motion-ms,.3s) ease, box-shadow var(--dshp-motion-ms,.3s) ease;box-shadow:var(--dsw-shadow-lv3);will-change:left, top;transform:scale(1.012)}.SigSeG_cardDragging{user-select:none}@keyframes SigSeG_cardIn{0%{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}.SigSeG_gestureShield{z-index:0;pointer-events:auto;user-select:none;position:fixed;inset:0}.SigSeG_gestureShield[data-cursor=moving]{cursor:grabbing}.SigSeG_gestureShield[data-cursor=ns]{cursor:ns-resize}.SigSeG_gestureShield[data-cursor=ew]{cursor:ew-resize}.SigSeG_gestureShield[data-cursor=nesw]{cursor:nesw-resize}.SigSeG_gestureShield[data-cursor=nwse]{cursor:nwse-resize}.SigSeG_snapGhost{z-index:0;box-sizing:border-box;border:1px dashed var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-tertiary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent);box-shadow:0 0 0 4px var(--dsw-alias-state-business-tertiary);box-shadow:0 0 0 4px color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);pointer-events:none;transition:left var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), top var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), width var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), height var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1);border-radius:12px;position:fixed}.SigSeG_snapGhost:before{content:"";background:var(--dsw-alias-state-business-tertiary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent);border-radius:11px 11px 0 0;height:36px;position:absolute;inset:0 0 auto}.SigSeG_cardMinimized{box-shadow:var(--dsw-shadow-lv1);border-radius:var(--dshp-card-capsule-radius,999px)}.SigSeG_cardLocked .SigSeG_cardHeader{cursor:default;border-bottom-color:var(--dsw-alias-border-l2)}.SigSeG_cardAction.SigSeG_cardLockAction[data-locked=true]{color:var(--dsw-alias-state-error-primary)}.SigSeG_cardAction.SigSeG_cardLockAction[data-locked=false]{color:var(--dsw-alias-state-success-primary)}.SigSeG_cardHeader{box-sizing:border-box;border-bottom:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) var(--dshp-card-alpha,100%), transparent);cursor:grab;touch-action:none;user-select:none;flex:none;align-items:center;gap:6px;height:36px;padding:0 6px 0 10px;display:flex}.SigSeG_cardMinimized .SigSeG_cardHeader{border-bottom:none}.SigSeG_cardDragging .SigSeG_cardHeader{cursor:grabbing}.SigSeG_cardHeader:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.SigSeG_cardTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;overflow:hidden}.SigSeG_cardSubtitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;max-width:50%;color:var(--dsw-alias-label-caption);transition:max-width var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1), opacity var(--dshp-motion-ms,.3s) ease;flex:0 auto;font-size:11px;overflow:hidden}.SigSeG_cardSubtitleHidden{opacity:0;max-width:0}.SigSeG_cardActions{flex:none;align-items:center;gap:2px;display:flex}.SigSeG_cardAction{width:24px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;font-size:13px;line-height:1;display:inline-flex}.SigSeG_cardAction:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.SigSeG_cardActionDanger:hover{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-label-error)}.SigSeG_cardBody{box-sizing:border-box;min-height:0;transition:opacity var(--dshp-motion-ms,.3s) ease, padding var(--dshp-motion-ms,.3s) cubic-bezier(.2, 0, 0, 1);flex:auto;padding:10px;position:relative}.SigSeG_cardBodyHidden{opacity:0;pointer-events:none;padding:0}.SigSeG_contentHost{box-sizing:border-box;width:100%;height:100%;overflow:auto;container-type:size}.SigSeG_resizeHandle{z-index:2;touch-action:none;user-select:none;position:absolute}.SigSeG_resizeHandle[data-dir=n]{cursor:ns-resize;height:6px;top:0;left:8px;right:8px}.SigSeG_resizeHandle[data-dir=s]{cursor:ns-resize;height:6px;bottom:0;left:8px;right:8px}.SigSeG_resizeHandle[data-dir=e]{cursor:ew-resize;width:6px;top:8px;bottom:8px;right:0}.SigSeG_resizeHandle[data-dir=w]{cursor:ew-resize;width:6px;top:8px;bottom:8px;left:0}.SigSeG_resizeHandle[data-dir=ne]{cursor:nesw-resize;width:12px;height:12px;top:0;right:0}.SigSeG_resizeHandle[data-dir=nw]{cursor:nwse-resize;width:12px;height:12px;top:0;left:0}.SigSeG_resizeHandle[data-dir=se]{cursor:nwse-resize;width:12px;height:12px;bottom:0;right:0}.SigSeG_resizeHandle[data-dir=sw]{cursor:nesw-resize;width:12px;height:12px;bottom:0;left:0}.SigSeG_popover{z-index:40;pointer-events:auto;box-sizing:border-box;border:var(--dshp-card-border-width,.5px) solid var(--dsw-alias-border-l2);border-radius:var(--dshp-card-radius,12px);background:var(--dsw-alias-bg-overlay);background:color-mix(in srgb, var(--dsw-alias-bg-overlay) var(--dshp-card-alpha,100%), transparent);width:min(420px,100vw - 24px);max-height:min(60vh,520px);backdrop-filter:var(--dshp-card-blur,none);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);flex-direction:column;display:flex;position:fixed;overflow:hidden}.SigSeG_popover[data-channel=transient]{z-index:50}.SigSeG_popoverHeader{border-bottom:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) var(--dshp-card-alpha,100%), transparent);flex:none;align-items:center;gap:6px;height:34px;padding:0 6px 0 12px;display:flex}.SigSeG_popoverTitle{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:13px;font-weight:500;overflow:hidden}.SigSeG_popoverPinned{border:.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-caption);border-radius:999px;flex:none;padding:1px 6px;font-size:10px;line-height:16px}.SigSeG_popoverBody{box-sizing:border-box;flex:auto;min-height:0;padding:12px;overflow:auto;container-type:inline-size}.SigSeG_box{flex-direction:column;gap:8px;display:flex}.SigSeG_boxHead{align-items:center;display:flex}.SigSeG_boxList{flex-direction:column;gap:2px;display:flex}.SigSeG_boxRow{border-radius:8px;align-items:center;gap:8px;min-width:0;padding:5px 6px;display:flex}.SigSeG_boxRow:hover{background:var(--dsw-alias-bg-layer-2)}.SigSeG_boxDot{border:1px solid var(--dsw-alias-border-l2);background:0 0;border-radius:50%;flex:none;width:6px;height:6px}.SigSeG_boxRow[data-open="1"] .SigSeG_boxDot{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-primary)}.SigSeG_boxLabel{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:auto;font-size:12px;line-height:18px;overflow:hidden}.SigSeG_boxFoot{border-top:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;gap:8px;padding-top:8px;display:flex}.SigSeG_boxCount{color:var(--dsw-alias-label-caption);font-size:11px}.SigSeG_boxHint{color:var(--dsw-alias-label-caption);font-size:11px;line-height:17px}.SigSeG_boxEmpty{color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px}.SigSeG_boxEmpty code{font-family:var(--dsw-font-mono);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:4px;padding:0 3px;font-size:11px}.SigSeG_slider{align-items:center;gap:10px;min-width:190px;display:flex}.SigSeG_sliderInput{min-width:0;accent-color:var(--dsw-alias-state-business-primary);flex:1}.SigSeG_sliderValue{text-align:right;min-width:48px;color:var(--dsw-alias-label-caption);flex:none;font-size:12px}.SigSeG_section{flex-direction:column;gap:14px;display:flex}.SigSeG_sectionTitle{color:var(--dsw-alias-label-primary);margin:0;font-size:15px;font-weight:600}.SigSeG_sectionHint{color:var(--dsw-alias-label-caption);margin:0;font-size:12px;line-height:18px}.SigSeG_group{border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);border-radius:10px;flex-direction:column;gap:2px;padding:4px 12px;display:flex}.SigSeG_row{align-items:center;gap:12px;padding:10px 0;display:flex}.SigSeG_row+.SigSeG_row{border-top:.5px solid var(--dsw-alias-border-l1)}.SigSeG_rowLabel{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.SigSeG_rowTitle{color:var(--dsw-alias-label-primary);font-size:13px}.SigSeG_rowHint{color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px}.SigSeG_rowControl{flex:none;align-items:center;gap:8px;display:flex}.SigSeG_notice{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:8px;margin:0;padding:10px 12px;font-size:12px;line-height:18px}.SigSeG_noticeBad{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-error)}.SigSeG_noticeOk{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-success-primary)}.SigSeG_list{border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;flex-direction:column;gap:0;display:flex;overflow:hidden}.SigSeG_listRow{background:var(--dsw-alias-bg-layer-1);align-items:center;gap:10px;padding:8px 12px;display:flex}.SigSeG_listRow+.SigSeG_listRow{border-top:.5px solid var(--dsw-alias-border-l1)}.SigSeG_listRowOff{opacity:.6}.SigSeG_listRowOff .SigSeG_listActions{opacity:1}.SigSeG_listMain{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.SigSeG_listId{font-family:var(--dsw-font-mono);color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;overflow:hidden}.SigSeG_listMeta{color:var(--dsw-alias-label-caption);font-size:11px}.SigSeG_listActions{flex:none;align-items:center;gap:6px;display:flex}.SigSeG_empty{color:var(--dsw-alias-label-caption);background:var(--dsw-alias-bg-layer-1);padding:14px 12px;font-size:12px}.SigSeG_footer{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.SigSeG_clock{text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:6px;height:100%;display:flex}.SigSeG_clockTime{font-family:var(--dsw-font-mono);font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);line-height:1.1}.SigSeG_clockTime[data-size=compact]{font-size:22px}.SigSeG_clockTime[data-size=regular]{font-size:32px}.SigSeG_clockTime[data-size=wide]{font-size:44px}.SigSeG_clockMeta{color:var(--dsw-alias-label-caption);font-size:12px}.SigSeG_clockRow{flex-wrap:wrap;justify-content:center;align-items:baseline;gap:10px;display:flex}.SigSeG_clockLabel{color:var(--dsw-alias-label-caption);font-size:11px}.SigSeG_diag{flex-direction:column;gap:8px;height:100%;display:flex}.SigSeG_diagSummary{color:var(--dsw-alias-label-secondary);font-size:12px}.SigSeG_diagList{flex-direction:column;gap:6px;display:flex}.SigSeG_diagRow{background:var(--dsw-alias-bg-layer-2);border-radius:8px;align-items:center;gap:8px;padding:6px 8px;display:flex}.SigSeG_diagMain{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.SigSeG_diagActions{flex:none;align-items:center;gap:4px;display:flex}.SigSeG_diagRow[data-disabled=true]{opacity:.6}.SigSeG_diagId{font-family:var(--dsw-font-mono);text-overflow:ellipsis;white-space:nowrap;font-size:12px;overflow:hidden}.SigSeG_diagMeta{color:var(--dsw-alias-label-caption);font-size:11px}.SigSeG_diagError{color:var(--dsw-alias-label-error);font-size:11px}.SigSeG_diagEmpty{color:var(--dsw-alias-label-caption);font-size:12px}.SigSeG_quick{flex-direction:column;gap:12px;display:flex}.SigSeG_quickSection{flex-direction:column;gap:6px;display:flex}.SigSeG_quickLabel{color:var(--dsw-alias-label-caption);font-size:11px}.SigSeG_seg{flex-wrap:wrap;gap:4px;display:flex}.SigSeG_segBtn{border:.5px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);font-size:11px;font-family:var(--dsw-font-family);cursor:pointer;background:0 0;border-radius:999px;padding:3px 10px}.SigSeG_segBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.SigSeG_segBtnActive{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}.SigSeG_quickFoot{justify-content:space-between;align-items:center;gap:8px;display:flex}.SigSeG_quickNote{color:var(--dsw-alias-label-caption);font-size:11px}.SigSeG_quickError{color:var(--dsw-alias-label-error);font-size:11px}.SigSeG_statusRoot{box-sizing:border-box;flex-direction:column;gap:10px;padding:12px;display:flex}.SigSeG_statusGrid{grid-template-columns:1fr 1fr;gap:8px;display:grid}.SigSeG_statusCell{background:var(--dsw-alias-bg-layer-2);border-radius:8px;flex-direction:column;gap:2px;padding:8px 10px;display:flex}.SigSeG_statusValue{font-family:var(--dsw-font-mono);font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-size:16px;line-height:20px}.SigSeG_statusKey{color:var(--dsw-alias-label-caption);font-size:11px}.SigSeG_statusHint{color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px}@media (prefers-reduced-motion:reduce){.SigSeG_card,.SigSeG_cardBody,.SigSeG_snapGhost,.SigSeG_trayAnchor,.SigSeG_trayBtn,.SigSeG_trayGhost{transition:none;animation:none}}';
var tagId = "@dshp/widget-kit/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/widget-kit");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "box": "SigSeG_box", "boxCount": "SigSeG_boxCount", "boxDot": "SigSeG_boxDot", "boxEmpty": "SigSeG_boxEmpty", "boxFoot": "SigSeG_boxFoot", "boxHead": "SigSeG_boxHead", "boxHint": "SigSeG_boxHint", "boxLabel": "SigSeG_boxLabel", "boxList": "SigSeG_boxList", "boxRow": "SigSeG_boxRow", "card": "SigSeG_card", "cardAction": "SigSeG_cardAction", "cardActionDanger": "SigSeG_cardActionDanger", "cardActions": "SigSeG_cardActions", "cardBody": "SigSeG_cardBody", "cardBodyHidden": "SigSeG_cardBodyHidden", "cardDragging": "SigSeG_cardDragging", "cardHeader": "SigSeG_cardHeader", "cardIn": "SigSeG_cardIn", "cardLockAction": "SigSeG_cardLockAction", "cardLocked": "SigSeG_cardLocked", "cardMinimized": "SigSeG_cardMinimized", "cardSubtitle": "SigSeG_cardSubtitle", "cardSubtitleHidden": "SigSeG_cardSubtitleHidden", "cardTitle": "SigSeG_cardTitle", "clock": "SigSeG_clock", "clockLabel": "SigSeG_clockLabel", "clockMeta": "SigSeG_clockMeta", "clockRow": "SigSeG_clockRow", "clockTime": "SigSeG_clockTime", "contentHost": "SigSeG_contentHost", "diag": "SigSeG_diag", "diagActions": "SigSeG_diagActions", "diagEmpty": "SigSeG_diagEmpty", "diagError": "SigSeG_diagError", "diagId": "SigSeG_diagId", "diagList": "SigSeG_diagList", "diagMain": "SigSeG_diagMain", "diagMeta": "SigSeG_diagMeta", "diagRow": "SigSeG_diagRow", "diagSummary": "SigSeG_diagSummary", "empty": "SigSeG_empty", "footer": "SigSeG_footer", "gestureShield": "SigSeG_gestureShield", "ghostIn": "SigSeG_ghostIn", "group": "SigSeG_group", "layer": "SigSeG_layer", "list": "SigSeG_list", "listActions": "SigSeG_listActions", "listId": "SigSeG_listId", "listMain": "SigSeG_listMain", "listMeta": "SigSeG_listMeta", "listRow": "SigSeG_listRow", "listRowOff": "SigSeG_listRowOff", "notice": "SigSeG_notice", "noticeBad": "SigSeG_noticeBad", "noticeOk": "SigSeG_noticeOk", "popover": "SigSeG_popover", "popoverBody": "SigSeG_popoverBody", "popoverHeader": "SigSeG_popoverHeader", "popoverPinned": "SigSeG_popoverPinned", "popoverTitle": "SigSeG_popoverTitle", "quick": "SigSeG_quick", "quickError": "SigSeG_quickError", "quickFoot": "SigSeG_quickFoot", "quickLabel": "SigSeG_quickLabel", "quickNote": "SigSeG_quickNote", "quickSection": "SigSeG_quickSection", "resizeHandle": "SigSeG_resizeHandle", "row": "SigSeG_row", "rowControl": "SigSeG_rowControl", "rowHint": "SigSeG_rowHint", "rowLabel": "SigSeG_rowLabel", "rowTitle": "SigSeG_rowTitle", "section": "SigSeG_section", "sectionHint": "SigSeG_sectionHint", "sectionTitle": "SigSeG_sectionTitle", "seg": "SigSeG_seg", "segBtn": "SigSeG_segBtn", "segBtnActive": "SigSeG_segBtnActive", "slider": "SigSeG_slider", "sliderInput": "SigSeG_sliderInput", "sliderValue": "SigSeG_sliderValue", "snapGhost": "SigSeG_snapGhost", "statusCell": "SigSeG_statusCell", "statusGrid": "SigSeG_statusGrid", "statusHint": "SigSeG_statusHint", "statusKey": "SigSeG_statusKey", "statusRoot": "SigSeG_statusRoot", "statusValue": "SigSeG_statusValue", "tray": "SigSeG_tray", "trayAnchor": "SigSeG_trayAnchor", "trayAnchorDragging": "SigSeG_trayAnchorDragging", "trayBadge": "SigSeG_trayBadge", "trayBadgeText": "SigSeG_trayBadgeText", "trayBtn": "SigSeG_trayBtn", "trayBtnActive": "SigSeG_trayBtnActive", "trayBtnDragging": "SigSeG_trayBtnDragging", "trayGhost": "SigSeG_trayGhost", "trayGlyph": "SigSeG_trayGlyph", "trayLabel": "SigSeG_trayLabel" };

// src/client/ErrorBoundary.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var WidgetErrorBoundary = class extends import_react.Component {
  constructor() {
    super(...arguments);
    __publicField(this, "state", { message: null });
  }
  static getDerivedStateFromError(error) {
    return { message: String(error?.message ?? error) };
  }
  componentDidCatch(error, info) {
    this.props.onError?.(`\u7EC4\u4EF6\u300C${this.props.label}\u300D\u6E32\u67D3\u5931\u8D25\uFF08\u5DF2\u9694\u79BB\uFF0C\u5176\u4F59\u7EC4\u4EF6\u4E0D\u53D7\u5F71\u54CD\uFF09`, error);
    void info;
  }
  render() {
    if (this.state.message === null) return this.props.children;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.notice + " " + styles_module_css_default.noticeBad, role: "alert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        "\u7EC4\u4EF6\u300C",
        this.props.label,
        "\u300D\u6E32\u67D3\u5931\u8D25\uFF1A",
        this.state.message
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.footer, style: { marginTop: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        import_dsh_client_ui_primitives.Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: () => {
            this.setState({ message: null });
            this.props.onRetry?.();
          },
          children: "\u91CD\u8BD5"
        }
      ) })
    ] });
  }
};

// src/client/hooks.ts
var import_react2 = require("react");
function useFramework(runtime) {
  const subscribe = (0, import_react2.useCallback)((listener) => runtime.subscribe(listener), [runtime]);
  const getSnapshot = (0, import_react2.useCallback)(() => runtime.getSnapshot(), [runtime]);
  return (0, import_react2.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
}
function useLiveGeometry(runtime, id) {
  const subscribe = (0, import_react2.useCallback)((listener) => runtime.subscribeLive(listener), [runtime]);
  const getSnapshot = (0, import_react2.useCallback)(() => runtime.getLiveFor(id), [runtime, id]);
  return (0, import_react2.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
}
var GESTURE_CURSORS = {
  move: "moving",
  n: "ns",
  s: "ns",
  e: "ew",
  w: "ew",
  ne: "nesw",
  sw: "nesw",
  nw: "nwse",
  se: "nwse"
};
function useGestureCursor(runtime) {
  const subscribe = (0, import_react2.useCallback)((listener) => runtime.subscribeLive(listener), [runtime]);
  const getSnapshot = (0, import_react2.useCallback)(() => {
    const live = runtime.getLive();
    if (live === null) return null;
    return GESTURE_CURSORS[live.mode] ?? "moving";
  }, [runtime]);
  return (0, import_react2.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
}
function useLiveSnap(runtime) {
  const subscribe = (0, import_react2.useCallback)((listener) => runtime.subscribeLive(listener), [runtime]);
  const getSnapshot = (0, import_react2.useCallback)(() => runtime.getLiveSnap(), [runtime]);
  return (0, import_react2.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
}
function useAnchor(runtime, id) {
  const subscribe = (0, import_react2.useCallback)((listener) => runtime.subscribe(listener), [runtime]);
  const getSnapshot = (0, import_react2.useCallback)(() => runtime.getAnchor(id), [runtime, id]);
  return (0, import_react2.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
}
var IDLE = {
  status: "ready",
  data: void 0,
  error: void 0,
  stale: false,
  lastUpdatedAt: null
};
function useWidgetData(runtime, widget, enabled) {
  const load = widget.content?.load ?? null;
  const refreshMs = widget.content?.refreshMs ?? 0;
  const sessionId = runtime.getSession();
  const [state, setState] = (0, import_react2.useState)(load === null ? IDLE : { ...IDLE, status: "loading" });
  const requestId = (0, import_react2.useRef)(0);
  const flight = (0, import_react2.useRef)(null);
  const run = (0, import_react2.useCallback)(
    (reason) => {
      if (load === null) return;
      requestId.current += 1;
      const id = requestId.current;
      flight.current?.abort();
      const controller = new AbortController();
      flight.current = controller;
      setState(
        (prev) => prev.data === void 0 ? { ...prev, status: "loading", error: void 0 } : { ...prev, status: "ready", stale: false }
      );
      Promise.resolve().then(() => load({ sessionId, signal: controller.signal, reason })).then((data) => {
        if (requestId.current !== id) return;
        const empty = data === null || data === void 0;
        setState({
          status: empty ? "empty" : "ready",
          data: empty ? void 0 : data,
          error: void 0,
          stale: false,
          lastUpdatedAt: Date.now()
        });
      }).catch((error) => {
        if (requestId.current !== id) return;
        const message = String(error?.message ?? error);
        setState(
          (prev) => prev.data === void 0 ? {
            status: "error",
            data: void 0,
            error: { message, retriable: true },
            stale: false,
            lastUpdatedAt: null
          } : { ...prev, status: "ready", stale: true, error: { message, retriable: true } }
        );
      });
    },
    [load, sessionId]
  );
  (0, import_react2.useEffect)(() => {
    if (!enabled) return void 0;
    run("open");
    let disposeInterval = null;
    if (refreshMs > 0) {
      disposeInterval = runtime.scheduleInterval(() => {
        run("refresh");
      }, refreshMs);
    }
    return () => {
      requestId.current += 1;
      flight.current?.abort();
      disposeInterval?.();
    };
  }, [enabled, refreshMs, run, runtime, widget.id]);
  const refresh = (0, import_react2.useCallback)(() => {
    run("refresh");
  }, [run]);
  const retry = (0, import_react2.useCallback)(() => {
    run("retry");
  }, [run]);
  return { ...state, refresh, retry };
}
function useCardDrag(runtime, widget, mode) {
  const [dragging, setDragging] = (0, import_react2.useState)(false);
  const capture = (0, import_react2.useRef)(null);
  const listeners = (0, import_react2.useRef)(null);
  const origin = (0, import_react2.useRef)({ x: 0, y: 0 });
  const latest = (0, import_react2.useRef)({ x: 0, y: 0 });
  const startRect = (0, import_react2.useRef)(null);
  const frame = (0, import_react2.useRef)(null);
  const modeRef = (0, import_react2.useRef)(mode);
  modeRef.current = mode;
  const flush = (0, import_react2.useCallback)(() => {
    const start = startRect.current;
    if (start === null) return;
    const dx = latest.current.x - origin.current.x;
    const dy = latest.current.y - origin.current.y;
    if (modeRef.current === "move") {
      const constraints2 = runtime.constraintsOf(widget);
      const viewport2 = runtime.viewport();
      runtime.setLive(
        widget.id,
        clampRect({ x: start.x + dx, y: start.y + dy, w: start.w, h: start.h }, constraints2, viewport2)
      );
      return;
    }
    const constraints = runtime.constraintsOf(widget);
    const viewport = runtime.viewport();
    runtime.setLive(widget.id, applyResize(start, modeRef.current, dx, dy, constraints, viewport));
  }, [runtime, widget]);
  const endDrag = (0, import_react2.useCallback)(
    (commit) => {
      const active = capture.current;
      if (active === null) return;
      capture.current = null;
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      const attached = listeners.current;
      listeners.current = null;
      if (attached !== null && typeof window !== "undefined") {
        window.removeEventListener("pointermove", attached.move);
        window.removeEventListener("pointerup", attached.up);
        window.removeEventListener("pointercancel", attached.cancel);
      }
      try {
        if (active.element.hasPointerCapture(active.id)) active.element.releasePointerCapture(active.id);
      } catch {
      }
      setDragging(false);
      if (commit) runtime.commitLive(widget.id);
      else runtime.cancelLive();
    },
    [runtime, widget.id]
  );
  const onPointerDown = (0, import_react2.useCallback)(
    (event) => {
      if (event.button !== 0 || capture.current !== null) return;
      event.preventDefault();
      if (runtime.isLocked(widget.id)) {
        runtime.raise(widget.id);
        return;
      }
      event.stopPropagation();
      const element = event.currentTarget;
      const pointerId = event.pointerId;
      try {
        element.setPointerCapture(pointerId);
      } catch {
      }
      capture.current = { element, id: pointerId };
      origin.current = { x: event.clientX, y: event.clientY };
      latest.current = { x: event.clientX, y: event.clientY };
      startRect.current = runtime.visualRectOf(widget.id);
      runtime.raise(widget.id);
      runtime.beginLive(widget.id, modeRef.current);
      setDragging(true);
      if (typeof window === "undefined") return;
      const move = (native) => {
        if (native.pointerId !== pointerId) return;
        if (native.pointerType !== "touch" && native.buttons === 0) {
          endDrag(true);
          return;
        }
        latest.current = { x: native.clientX, y: native.clientY };
        if (frame.current !== null) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          flush();
        });
      };
      const up = (native) => {
        if (native.pointerId !== pointerId) return;
        latest.current = { x: native.clientX, y: native.clientY };
        flush();
        endDrag(true);
      };
      const cancel = (native) => {
        if (native.pointerId !== pointerId) return;
        endDrag(false);
      };
      listeners.current = { move, up, cancel };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
    },
    [endDrag, flush, runtime, widget.id]
  );
  (0, import_react2.useEffect)(
    () => () => {
      if (capture.current !== null) endDrag(true);
    },
    [endDrag]
  );
  return {
    dragging,
    handlers: { onPointerDown }
  };
}

// src/client/ResizeHandles.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function ResizeHandle({
  runtime,
  widget,
  dir
}) {
  const { handlers, dragging } = useCardDrag(runtime, widget, dir);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      className: styles_module_css_default.resizeHandle,
      "data-dir": dir,
      "data-dragging": dragging ? "true" : void 0,
      "aria-hidden": "true",
      ...handlers
    }
  );
}
function ResizeHandles({
  runtime,
  widget
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, { children: RESIZE_DIRS.map((dir) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ResizeHandle, { runtime, widget, dir }, dir)) });
}

// src/client/glyphs.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function Glyph({ children, size = 18 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "svg",
    {
      viewBox: "0 0 18 18",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.4",
      "aria-hidden": "true",
      children
    }
  );
}
function LockGlyph({ locked }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Glyph, { size: 13, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "3.4", y: "8", width: "11.2", height: "7.6", rx: "1.8" }),
    locked ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M6.4 8V6.2a2.6 2.6 0 0 1 5.2 0V8", strokeLinecap: "round" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M6.4 8V6.2a2.6 2.6 0 0 1 5.2 0", strokeLinecap: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "9", cy: "11.6", r: "0.9" })
  ] });
}
function ClockGlyph() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Glyph, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "9", cy: "9", r: "6.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M9 5.4V9l2.6 1.6", strokeLinecap: "round" })
  ] });
}
function RegistryGlyph() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Glyph, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("rect", { x: "2.6", y: "3.4", width: "12.8", height: "11.2", rx: "2.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M5.6 7h6.8M5.6 9.6h6.8M5.6 12.2h4", strokeLinecap: "round" })
  ] });
}
function SlidersGlyph() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Glyph, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M3 5.5h12M3 9h12M3 12.5h12", strokeLinecap: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "7", cy: "5.5", r: "1.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "11.5", cy: "9", r: "1.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("circle", { cx: "6", cy: "12.5", r: "1.6" })
  ] });
}
function BoxGlyph() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Glyph, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M2.8 5.2h12.4v2.2H2.8z", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M4 7.4v6.2a1.4 1.4 0 0 0 1.4 1.4h7.2a1.4 1.4 0 0 0 1.4-1.4V7.4", strokeLinejoin: "round" }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M7.4 10.2h3.2", strokeLinecap: "round" })
  ] });
}
function PulseGlyph() {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Glyph, { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "M2 9.5h3.2l1.6-4 2.4 7.4 1.8-4.4 1.2 2.4H16", strokeLinecap: "round", strokeLinejoin: "round" }) });
}

// src/client/measure.ts
function px(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
function ownerInsets(owner) {
  if (typeof getComputedStyle !== "function") return 0;
  const style = getComputedStyle(owner);
  return Math.ceil(
    px(style.borderLeftWidth) + px(style.borderRightWidth) + px(style.paddingLeft) + px(style.paddingRight)
  );
}
function measureHeaderWidth(header, collapsedClass) {
  if (header === null || typeof document === "undefined") return null;
  const owner = header.parentElement;
  if (owner === null) return null;
  let probe = null;
  try {
    probe = header.cloneNode(true);
    probe.removeAttribute("tabindex");
    if (collapsedClass !== void 0 && collapsedClass !== "") {
      for (const node of Array.from(probe.querySelectorAll(`[class~="${collapsedClass}"]`))) {
        const collapsed = node;
        if (collapsed.style === void 0) continue;
        collapsed.style.maxWidth = "0";
        collapsed.style.opacity = "0";
      }
    }
    const style = probe.style;
    style.position = "fixed";
    style.left = "-10000px";
    style.top = "0";
    style.width = "max-content";
    style.maxWidth = "none";
    style.visibility = "hidden";
    style.pointerEvents = "none";
    owner.append(probe);
    const rect = probe.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || rect.width <= 0) return null;
    return Math.ceil(rect.width) + ownerInsets(owner);
  } catch {
    return null;
  } finally {
    probe?.remove();
  }
}
function textOverflowPx(el) {
  if (el === null) return 0;
  const node = el;
  const scroll = node.scrollWidth;
  const client = node.clientWidth;
  if (scroll === void 0 || client === void 0) return 0;
  if (!Number.isFinite(scroll) || !Number.isFinite(client)) return 0;
  return Math.max(0, Math.ceil(scroll - client));
}

// src/client/Card.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var SIZE_PRESET_FACTOR = { compact: 0.75, regular: 1, wide: 1.35 };
function Card({
  runtime,
  widget,
  onError
}) {
  const snapshot = useFramework(runtime);
  const live = useLiveGeometry(runtime, widget.id);
  const [menuOpen, setMenuOpen] = (0, import_react3.useState)(false);
  const renderDepth = (0, import_react3.useRef)(0);
  const warnedRenderSize = (0, import_react3.useRef)(false);
  const headerRef = (0, import_react3.useRef)(null);
  const titleRef = (0, import_react3.useRef)(null);
  const drag = useCardDrag(runtime, widget, "move");
  const card = snapshot.layout.cards[widget.id];
  const open = card?.open === true;
  const minimized = card?.minimized === true;
  const locked = card?.locked === true;
  const data = useWidgetData(runtime, widget, open);
  const setSize = (0, import_react3.useCallback)(
    (next) => {
      if (renderDepth.current > 0) {
        if (!warnedRenderSize.current) {
          warnedRenderSize.current = true;
          console.warn(
            `[dshp-widget-kit] \u7EC4\u4EF6\u300C${widget.id}\u300D\u5728 content.render \u671F\u95F4\u8C03\u7528\u4E86 setSize\uFF08\u89C4\u8303\u7981\u6B62\uFF1A\u8FD9\u4F1A\u8BA9\u5C3A\u5BF8\u4E0E\u5185\u5BB9\u4E92\u76F8\u9A71\u52A8\uFF09\u3002\u672C\u6B21\u5DF2\u5EF6\u540E\u5904\u7406\uFF0C\u8BF7\u628A\u6539\u5C3A\u5BF8\u653E\u5230\u4E8B\u4EF6\u56DE\u8C03\u91CC\u3002`
          );
        }
        queueMicrotask(() => {
          runtime.requestSize(widget.id, next);
        });
        return;
      }
      runtime.requestSize(widget.id, next);
    },
    [runtime, widget.id]
  );
  const menuItems = (0, import_react3.useMemo)(() => {
    const size = widget.card?.defaultSize ?? SPEC_DEFAULTS.cardDefaultSize;
    const entries = [
      { id: "minimize", label: minimized ? "\u8FD8\u539F\u5361\u7247" : "\u6700\u5C0F\u5316" },
      { id: "lock", label: locked ? "\u89E3\u9501\u4F4D\u7F6E" : "\u9501\u5B9A\u4F4D\u7F6E\uFF08\u4E0D\u53EF\u79FB\u52A8\u4E0E\u7F29\u653E\uFF09" }
    ];
    if (locked) {
      entries.push({ type: "label", id: "locked-label", text: "\u4F4D\u7F6E\u5DF2\u9501\u5B9A\uFF1A\u79FB\u52A8\u4E0E\u7F29\u653E\u5DF2\u505C\u7528" });
    } else {
      entries.push(
        { id: "reset", label: "\u6062\u590D\u9ED8\u8BA4\u5C3A\u5BF8" },
        { id: "center", label: "\u5C45\u4E2D" },
        { type: "label", id: "size-label", text: "\u5C3A\u5BF8" },
        {
          id: "size:compact",
          label: `\u7D27\u51D1 ${String(Math.round(size.w * SIZE_PRESET_FACTOR.compact))}\xD7${String(Math.round(size.h * SIZE_PRESET_FACTOR.compact))}`
        },
        { id: "size:regular", label: `\u5E38\u89C4 ${String(size.w)}\xD7${String(size.h)}` },
        {
          id: "size:wide",
          label: `\u5BBD ${String(Math.round(size.w * SIZE_PRESET_FACTOR.wide))}\xD7${String(Math.round(size.h * SIZE_PRESET_FACTOR.wide))}`
        }
      );
    }
    entries.push({ type: "separator", id: "sep-1" }, { id: "close", label: "\u5173\u95ED\u5361\u7247", danger: true });
    return entries;
  }, [locked, minimized, widget.card]);
  const onMenuSelect = (0, import_react3.useCallback)(
    (id) => {
      setMenuOpen(false);
      const size = widget.card?.defaultSize ?? SPEC_DEFAULTS.cardDefaultSize;
      if (id === "minimize") {
        runtime.toggleMinimize(widget.id);
        return;
      }
      if (id === "lock") {
        runtime.setLocked(widget.id, !locked);
        return;
      }
      if (id === "reset") {
        runtime.resizeTo(widget.id, { w: size.w, h: size.h });
        return;
      }
      if (id === "center") {
        runtime.center(widget.id);
        return;
      }
      if (id === "close") {
        runtime.close(widget.id);
        return;
      }
      if (id.startsWith("size:")) {
        const key = id.slice(5);
        const factor = SIZE_PRESET_FACTOR[key];
        if (factor === void 0) return;
        runtime.resizeTo(widget.id, { w: Math.round(size.w * factor), h: Math.round(size.h * factor) });
      }
    },
    [locked, runtime, widget.card, widget.id]
  );
  const onHeaderKeyDown = (0, import_react3.useCallback)(
    (event) => {
      if (locked) return;
      const step = event.shiftKey ? 32 : 8;
      const resizeStep = 16;
      const key = event.key;
      if (key === "ArrowLeft") runtime.nudge(widget.id, event.altKey ? 0 : -step, 0);
      else if (key === "ArrowRight") runtime.nudge(widget.id, event.altKey ? 0 : step, 0);
      else if (key === "ArrowUp") runtime.nudge(widget.id, 0, event.altKey ? 0 : -step);
      else if (key === "ArrowDown") runtime.nudge(widget.id, 0, event.altKey ? 0 : step);
      else return;
      event.preventDefault();
      if (event.altKey)
        runtime.nudgeResize(
          widget.id,
          key === "ArrowLeft" ? -resizeStep : key === "ArrowRight" ? resizeStep : 0,
          key === "ArrowUp" ? -resizeStep : key === "ArrowDown" ? resizeStep : 0
        );
    },
    [locked, runtime, widget.id]
  );
  const title = resolveText(widget.title, widget.id);
  const hasSubtitle = resolveText(widget.content?.title ?? widget.subtitle, "") !== "";
  const capsuleNow = minimized ? runtime.capsuleWidthOf(widget, card?.w ?? SPEC_DEFAULTS.cardDefaultSize.w) : null;
  (0, import_react3.useLayoutEffect)(() => {
    const report = () => {
      const need = measureHeaderWidth(headerRef.current, styles_module_css_default.cardSubtitle);
      if (need === null) return;
      runtime.reportCapsuleNeed(widget.id, need);
      if (!minimized) return;
      const layoutWidth = runtime.rectOf(widget.id).w;
      const fix = capsuleOverflowFix({
        need,
        overflow: textOverflowPx(titleRef.current),
        capsule: runtime.capsuleWidthOf(widget, layoutWidth),
        layoutWidth
      });
      if (fix !== null) runtime.reportCapsuleNeed(widget.id, fix);
    };
    report();
    const fonts = typeof document === "undefined" ? void 0 : document.fonts;
    if (fonts === void 0) return;
    let cancelled = false;
    const reportNextFrame = () => {
      const raf = globalThis.requestAnimationFrame;
      if (typeof raf !== "function") {
        report();
        return;
      }
      raf(() => {
        if (!cancelled) report();
      });
    };
    void fonts.ready.then(reportNextFrame, () => {
    });
    fonts.addEventListener("loadingdone", reportNextFrame);
    return () => {
      cancelled = true;
      fonts.removeEventListener("loadingdone", reportNextFrame);
    };
  }, [runtime, widget, title, hasSubtitle, locked, minimized, capsuleNow]);
  if (card === void 0 || !card.open) return null;
  const gestureActive = live !== null && live.id === widget.id;
  const stored = gestureActive ? live.rect : card;
  const rect = minimized ? {
    ...stored,
    w: runtime.capsuleWidthOf(widget, stored.w),
    h: SPEC_DEFAULTS.titleBarHeight
  } : stored;
  const contentSize = runtime.contentSize(stored);
  const sizeClass = runtime.sizeClassOf(widget, stored);
  const content = widget.content;
  const contentProps = {
    frame: "card",
    sessionId: runtime.getSession(),
    status: data.status,
    data: data.data,
    ...data.error === void 0 ? {} : { error: data.error },
    stale: data.stale,
    lastUpdatedAt: data.lastUpdatedAt,
    size: contentSize,
    sizeClass,
    setSize,
    minimized,
    locked,
    refresh: data.refresh,
    retry: data.retry,
    close: () => {
      runtime.close(widget.id);
    }
  };
  const subtitle = resolveText(content?.title ?? widget.subtitle, "");
  const actions = headerActions({
    locked,
    minimizable: widget.card?.minimizable !== false,
    closable: widget.card?.closable !== false
  });
  const zIndex = Math.max(1, snapshot.zOrder.indexOf(widget.id) + 1);
  renderDepth.current += 1;
  let body = null;
  try {
    body = content === null ? null : content.render(contentProps);
  } finally {
    renderDepth.current -= 1;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "div",
    {
      className: styles_module_css_default.card + // 手势期间（拖动或缩放）整卡不可选中文字：缩放的指针常常扫过卡片内容
      (gestureActive ? " " + styles_module_css_default.cardDragging : "") + (minimized ? " " + styles_module_css_default.cardMinimized : "") + (locked ? " " + styles_module_css_default.cardLocked : ""),
      style: { left: rect.x, top: rect.y, width: rect.w, height: rect.h, zIndex },
      role: "dialog",
      "aria-label": title,
      "data-widget": widget.id,
      "data-size-class": sizeClass,
      "data-minimized": minimized ? "true" : "false",
      "data-locked": locked ? "true" : "false",
      "data-gesture": gestureActive ? "true" : "false",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "div",
          {
            className: styles_module_css_default.cardHeader,
            ref: headerRef,
            tabIndex: 0,
            "aria-label": locked ? "\u4F4D\u7F6E\u5DF2\u9501\u5B9A\uFF1B\u53CC\u51FB\u6700\u5C0F\u5316\uFF08\u5728 \u22EF \u83DC\u5355\u91CC\u89E3\u9501\uFF09" : "\u62D6\u52A8\u6807\u9898\u680F\u79FB\u52A8\u5361\u7247\uFF1B\u65B9\u5411\u952E\u79FB\u52A8\uFF0CAlt+\u65B9\u5411\u952E\u7F29\u653E\uFF1B\u53CC\u51FB\u6700\u5C0F\u5316",
            onKeyDown: onHeaderKeyDown,
            onDoubleClick: () => {
              runtime.toggleMinimize(widget.id);
            },
            ...drag.handlers,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.cardTitle, ref: titleRef, children: title }),
              subtitle !== "" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.cardSubtitle + (minimized ? " " + styles_module_css_default.cardSubtitleHidden : ""), children: subtitle }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "span",
                {
                  className: styles_module_css_default.cardActions,
                  onPointerDown: (event) => {
                    event.stopPropagation();
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        type: "button",
                        className: styles_module_css_default.cardAction + " " + styles_module_css_default.cardLockAction,
                        "data-locked": locked ? "true" : "false",
                        "aria-label": locked ? `\u89E3\u9501\u300C${title}\u300D\u7684\u4F4D\u7F6E` : `\u9501\u5B9A\u300C${title}\u300D\u7684\u4F4D\u7F6E`,
                        "aria-pressed": locked,
                        onClick: () => {
                          runtime.setLocked(widget.id, !locked);
                        },
                        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(LockGlyph, { locked })
                      }
                    ),
                    actions.minimize && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        type: "button",
                        className: styles_module_css_default.cardAction,
                        "aria-label": minimized ? `\u8FD8\u539F\u300C${title}\u300D` : `\u6700\u5C0F\u5316\u300C${title}\u300D`,
                        onClick: () => {
                          runtime.toggleMinimize(widget.id);
                        },
                        children: minimized ? "\u25A2" : "\u2014"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      import_dsh_client_ui_primitives2.Menu,
                      {
                        open: menuOpen,
                        dense: true,
                        portal: true,
                        autoFocus: true,
                        align: "end",
                        items: menuItems,
                        onSelect: onMenuSelect,
                        onClose: () => {
                          setMenuOpen(false);
                        },
                        anchor: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                          "button",
                          {
                            type: "button",
                            className: styles_module_css_default.cardAction,
                            "aria-label": `\u300C${title}\u300D\u7684\u5361\u7247\u83DC\u5355`,
                            "aria-haspopup": "menu",
                            "aria-expanded": menuOpen,
                            onClick: () => {
                              setMenuOpen((prev) => !prev);
                            },
                            children: "\u22EF"
                          }
                        )
                      }
                    ),
                    actions.close && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                      "button",
                      {
                        type: "button",
                        className: styles_module_css_default.cardAction + " " + styles_module_css_default.cardActionDanger,
                        "aria-label": `\u5173\u95ED\u300C${title}\u300D`,
                        onClick: () => {
                          runtime.close(widget.id);
                        },
                        children: "\u2715"
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "div",
          {
            className: styles_module_css_default.cardBody + (minimized ? " " + styles_module_css_default.cardBodyHidden : ""),
            "aria-hidden": minimized,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.contentHost, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(WidgetErrorBoundary, { label: title, onError, onRetry: data.retry, children: body }) }),
              widget.card?.resizable !== false && !locked && !minimized && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ResizeHandles, { runtime, widget })
            ]
          }
        )
      ]
    }
  );
}

// src/client/Popover.tsx
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react4 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function resolveText2(value, fallback) {
  if (value === null || value === void 0) return fallback;
  return typeof value === "function" ? value() : value;
}
var FALLBACK = { left: { offset: 24, width: 420 }, top: 88 };
function Popover({
  runtime,
  widget,
  onError
}) {
  const panelRef = (0, import_react4.useRef)(null);
  const anchor = useAnchor(runtime, widget.id);
  const anchorRef = (0, import_react4.useMemo)(() => ({ current: anchor }), [anchor]);
  const options = widget.popover ?? {
    trigger: "click",
    width: null,
    maxHeight: null,
    padding: SPEC_DEFAULTS.popoverPadding,
    side: "bottom",
    header: true,
    hoverOpenDelayMs: SPEC_DEFAULTS.hoverOpenDelayMs,
    hoverCloseDelayMs: SPEC_DEFAULTS.hoverCloseDelayMs,
    persistent: SPEC_DEFAULTS.popoverPersistent
  };
  const anchored = (0, import_dsh_client_ui_primitives3.useAnchoredPosition)({
    open: true,
    anchorRef,
    panelRef,
    side: options.side,
    gap: 8,
    margin: 8
  });
  const data = useWidgetData(runtime, widget, true);
  const close = (0, import_react4.useCallback)(() => {
    runtime.close(widget.id);
  }, [runtime, widget.id]);
  (0, import_react4.useEffect)(() => {
    const snapshot = runtime.getSnapshot();
    const origin = options.persistent ? snapshot.pinnedOrigin : snapshot.transientOrigin;
    if (origin !== "click") return;
    panelRef.current?.focus();
  }, [options.persistent, runtime]);
  (0, import_react4.useEffect)(() => {
    if (typeof document === "undefined") return void 0;
    const onPointerDown = (event) => {
      if (options.persistent) return;
      const target = event.target;
      if (panelRef.current !== null && panelRef.current.contains(target)) return;
      if (anchorRef.current !== null && anchorRef.current.contains(target)) return;
      close();
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      close();
      const button = anchorRef.current?.querySelector("button") ?? null;
      button?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [anchorRef, close, options.persistent]);
  const title = resolveText2(widget.content?.title ?? widget.title, widget.id);
  const content = widget.content;
  const contentProps = {
    frame: "popover",
    sessionId: runtime.getSession(),
    status: data.status,
    data: data.data,
    ...data.error === void 0 ? {} : { error: data.error },
    stale: data.stale,
    lastUpdatedAt: data.lastUpdatedAt,
    size: null,
    sizeClass: "regular",
    minimized: false,
    locked: false,
    refresh: data.refresh,
    retry: data.retry,
    close
  };
  const body = content === null ? null : content.render(contentProps);
  const style = anchored ?? {
    top: FALLBACK.top,
    left: Math.max(12, runtime.viewport().width - FALLBACK.left.width - FALLBACK.left.offset)
  };
  const panelStyle = {
    ...style,
    ...options.width === null ? {} : { width: options.width },
    ...options.maxHeight === null ? {} : { maxHeight: options.maxHeight }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "div",
    {
      ref: panelRef,
      className: styles_module_css_default.popover,
      style: panelStyle,
      role: "dialog",
      "aria-label": title,
      tabIndex: -1,
      "data-widget": widget.id,
      "data-trigger": options.trigger,
      "data-persistent": options.persistent ? "true" : "false",
      "data-channel": options.persistent ? "pinned" : "transient",
      onPointerEnter: () => {
        runtime.hoverEnter(widget.id);
      },
      onPointerLeave: () => {
        runtime.hoverLeave(widget.id);
      },
      children: [
        options.header && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: styles_module_css_default.popoverHeader, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.popoverTitle, children: title }),
          options.persistent && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.popoverPinned, title: "\u5E38\u9A7B\u9762\u677F\uFF1A\u70B9\u5916\u90E8\u4E0D\u4F1A\u5173\u95ED", children: "\u5E38\u9A7B" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: styles_module_css_default.cardAction, "aria-label": `\u5173\u95ED\u300C${title}\u300D`, onClick: close, children: "\u2715" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: styles_module_css_default.popoverBody, style: { padding: options.padding }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(WidgetErrorBoundary, { label: title, onError, onRetry: data.retry, children: body }) })
      ]
    }
  );
}

// src/client/appearance.ts
function radiusOf(mode) {
  if (mode === "round") return SPEC_DEFAULTS.cardRadiusRound;
  if (mode === "square") return 0;
  return SPEC_DEFAULTS.cardRadius;
}
function borderWidthOf(mode) {
  if (mode === "on") return SPEC_DEFAULTS.cardBorderWidthStrong;
  if (mode === "off") return 0;
  return SPEC_DEFAULTS.cardBorderWidth;
}
function motionOf(ms) {
  if (!Number.isFinite(ms)) return SPEC_DEFAULTS.motionMs;
  return Math.min(500, Math.max(0, Math.round(ms)));
}
function surfaceVars(prefs) {
  const opacity = Math.min(1, Math.max(0.2, prefs.cardOpacity));
  const blur = Math.min(32, Math.max(0, Math.round(prefs.cardBlur)));
  return {
    "--dshp-card-alpha": `${String(Math.round(opacity * 100))}%`,
    "--dshp-card-blur": blur === 0 ? "none" : `blur(${String(blur)}px)`,
    "--dshp-card-radius": `${String(radiusOf(prefs.cardRadius))}px`,
    // 最小化的胶囊形态：两端全圆；「直角」档才跟着拉平
    "--dshp-card-capsule-radius": prefs.cardRadius === "square" ? "0px" : "999px",
    "--dshp-card-border-width": `${String(borderWidthOf(prefs.cardBorder))}px`,
    "--dshp-motion-ms": `${String(motionOf(prefs.motionMs))}ms`
  };
}

// src/client/CardLayer.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function GestureShieldHost({ runtime }) {
  const cursor = useGestureCursor(runtime);
  if (cursor === null) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.gestureShield, "data-cursor": cursor, "aria-hidden": "true" });
}
function SnapGhostHost({ runtime }) {
  const snap = useLiveSnap(runtime);
  const snapshot = useFramework(runtime);
  if (snap === null) return null;
  const zIndex = Math.max(1, snapshot.zOrder.indexOf(snap.id));
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "div",
    {
      className: styles_module_css_default.snapGhost,
      style: {
        left: snap.rect.x,
        top: snap.rect.y,
        width: snap.rect.w,
        height: snap.rect.h,
        zIndex
      },
      "data-ghost-for": snap.id,
      "aria-hidden": "true"
    }
  );
}
function CardLayer({
  runtime,
  onError
}) {
  const snapshot = useFramework(runtime);
  const byId = new Map(snapshot.widgets.map((widget) => [widget.id, widget]));
  const disabled = new Set(snapshot.layout.disabled);
  const cards = snapshot.zOrder.map((id) => byId.get(id)).filter(
    (widget) => widget !== void 0 && widget.presentation === "card" && !disabled.has(widget.id)
  );
  const panelOf = (id) => {
    if (!snapshot.ready || id === null) return void 0;
    const widget = byId.get(id);
    if (widget === void 0 || widget.presentation !== "popover" || disabled.has(widget.id)) {
      return void 0;
    }
    return widget;
  };
  const transient = panelOf(snapshot.transientId);
  const pinned = panelOf(snapshot.pinnedId);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.layer, "data-plugin-widget-kit-layer": "", style: surfaceVars(snapshot.prefs), children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(GestureShieldHost, { runtime }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SnapGhostHost, { runtime }),
    cards.map((widget) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Card, { runtime, widget, onError }, widget.id)),
    pinned !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Popover, { runtime, widget: pinned, onError }),
    transient !== void 0 && transient !== pinned && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Popover, { runtime, widget: transient, onError })
  ] });
}

// src/client/api.ts
var BASE = "/ext/dshp-widget-kit";
async function fetchState() {
  const r = await fetch(`${BASE}/state`, { cache: "no-store" });
  return await r.json();
}
async function saveConfig(patch) {
  const r = await fetch(`${BASE}/config`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch)
  });
  return await r.json();
}

// src/client/SettingsSection.tsx
var import_dsh_client_ui_primitives5 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react6 = require("react");

// src/client/components.tsx
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react5 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
function SettingRow({
  title,
  hint,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.row, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.rowLabel, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.rowTitle, children: title }),
      hint !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.rowHint, children: hint })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.rowControl, children })
  ] });
}
function PrefSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  onCommit
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.slider, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "input",
      {
        type: "range",
        className: styles_module_css_default.sliderInput,
        "aria-label": label,
        min,
        max,
        step,
        value,
        onChange: (event) => {
          onChange(Number(event.target.value));
        },
        onPointerUp: () => {
          onCommit(value);
        },
        onKeyUp: () => {
          onCommit(value);
        },
        onBlur: () => {
          onCommit(value);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.sliderValue, children: format(value) })
  ] });
}
function PrefSelect({
  value,
  options,
  label,
  disabled,
  onChange
}) {
  const [open, setOpen] = (0, import_react5.useState)(false);
  const current = options.find((option) => option.value === value);
  const items = options.map((option) => ({ id: String(option.value), label: option.label }));
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    import_dsh_client_ui_primitives4.Menu,
    {
      open,
      dense: true,
      selection: "check",
      selectedId: String(value),
      items,
      align: "end",
      onClose: () => {
        setOpen(false);
      },
      onSelect: (id) => {
        setOpen(false);
        const next = options.find((option) => String(option.value) === id);
        if (next !== void 0) onChange(next.value);
      },
      anchor: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        import_dsh_client_ui_primitives4.Button,
        {
          variant: "outline",
          size: "sm",
          "aria-label": label,
          disabled: disabled === true,
          onClick: () => {
            setOpen((prev) => !prev);
          },
          children: current?.label ?? String(value)
        }
      )
    }
  );
}
function Notice({
  tone = "plain",
  children
}) {
  const toneClass = tone === "bad" ? styles_module_css_default.noticeBad : tone === "ok" ? styles_module_css_default.noticeOk : "";
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: styles_module_css_default.notice + (toneClass === "" ? "" : " " + toneClass), children });
}

// src/client/SettingsSection.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var ICON_LIMIT_OPTIONS = [
  { value: 2, label: "2 \u4E2A" },
  { value: 3, label: "3 \u4E2A" },
  { value: 4, label: "4 \u4E2A" },
  { value: 5, label: "5 \u4E2A" },
  { value: 6, label: "6 \u4E2A" },
  { value: 8, label: "8 \u4E2A" }
];
var MOTION_OPTIONS = SPEC_DEFAULTS.motionChoices.map(
  (ms) => ({ value: ms, label: ms === 0 ? "\u5173\u95ED\uFF08\u4E0D\u505A\u8FC7\u6E21\uFF09" : `${String(ms)} ms` })
);
var CARD_BORDER_OPTIONS = [
  { value: "auto", label: "\u9ED8\u8BA4\uFF08\u8DDF\u968F\u6846\u67B6\uFF09" },
  { value: "on", label: "\u663E\u793A\u8FB9\u6846" },
  { value: "off", label: "\u65E0\u8FB9\u6846" }
];
var CARD_RADIUS_OPTIONS = [
  { value: "auto", label: "\u9ED8\u8BA4\uFF08\u8DDF\u968F\u6846\u67B6\uFF09" },
  { value: "round", label: "\u5706\u89D2" },
  { value: "square", label: "\u76F4\u89D2" }
];
var BADGE_INTERVAL_OPTIONS = [
  { value: 5e3, label: "5 \u79D2" },
  { value: 15e3, label: "15 \u79D2" },
  { value: 3e4, label: "30 \u79D2" },
  { value: 6e4, label: "1 \u5206\u949F" },
  { value: 3e5, label: "5 \u5206\u949F" }
];
function SettingsSection({
  runtime,
  onPrefsApplied
}) {
  const snapshot = useFramework(runtime);
  const [loaded, setLoaded] = (0, import_react6.useState)(false);
  const [saving, setSaving] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const [notice, setNotice] = (0, import_react6.useState)(null);
  const prefs = snapshot.prefs;
  const disabled = new Set(snapshot.layout.disabled);
  (0, import_react6.useEffect)(() => {
    let cancelled = false;
    void fetchState().then((state) => {
      if (cancelled) return;
      if (state.config !== void 0) runtime.applyPrefs(state.config);
      setLoaded(true);
    }).catch((cause) => {
      if (cancelled) return;
      setError(`\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25\uFF08Host \u534A\u53EF\u80FD\u6CA1\u6302\u8F7D\uFF09\uFF1A${String(cause?.message ?? cause)}`);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [runtime]);
  const save = (0, import_react6.useCallback)(
    (patch) => {
      setSaving(true);
      setError(null);
      setNotice(null);
      void runtime.setPrefs(patch).then((result) => {
        setSaving(false);
        if (!result.ok) {
          setError(result.error ?? "\u4FDD\u5B58\u5931\u8D25\uFF0C\u914D\u7F6E\u672A\u6539\u52A8");
          return;
        }
        onPrefsApplied?.(runtime.getSnapshot().prefs);
        setNotice("\u5DF2\u4FDD\u5B58");
      });
    },
    [onPrefsApplied, runtime]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: styles_module_css_default.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h2", { className: styles_module_css_default.sectionTitle, children: "\u5C0F\u7EC4\u4EF6" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: styles_module_css_default.sectionHint, children: [
        "\u672C\u63D2\u4EF6\u53EA\u662F**\u5C0F\u7EC4\u4EF6\u7684\u5BBF\u4E3B\u4E0E\u89C4\u8303**\uFF0C\u81EA\u8EAB\u4E0D\u542B\u4E1A\u52A1\u7EC4\u4EF6\uFF08\u4E0B\u9762\u4E24\u4E2A\u53C2\u8003\u7EC4\u4EF6\u53EF\u4EE5\u5173\u6389\uFF09\u3002 \u5176\u4ED6\u63D2\u4EF6\u6309",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("code", { children: "docs/widget-spec.md" }),
        " \u6CE8\u518C\u7EC4\u4EF6\u540E\uFF0C\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u4F1A\u8BDD\u9876\u90E8\u6258\u76D8\u91CC\u3002"
      ] })
    ] }),
    error !== null && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Notice, { tone: "bad", children: error }),
    notice !== null && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Notice, { tone: "ok", children: notice }),
    !loaded && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Notice, { children: "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: styles_module_css_default.group, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingRow, { title: "\u4F1A\u8BDD\u9876\u90E8\u6258\u76D8", hint: "\u5173\u6389\u540E\u6240\u6709\u7EC4\u4EF6\u56FE\u6807\u90FD\u4F1A\u9690\u85CF\uFF08\u5361\u7247\u4E5F\u4F1A\u4E00\u5E76\u6536\u8D77\uFF09\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        import_dsh_client_ui_primitives5.Switch,
        {
          checked: prefs.trayEnabled,
          disabled: saving,
          label: "\u663E\u793A\u4F1A\u8BDD\u9876\u90E8\u6258\u76D8",
          onChange: (next) => {
            save({ trayEnabled: next });
          }
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingRow, { title: "\u53EF\u89C1\u56FE\u6807\u4E0A\u9650", hint: "\u8D85\u51FA\u7684\u7EC4\u4EF6\u8FDB\u6EA2\u51FA\u83DC\u5355\uFF08\u22EF\uFF09\uFF0C\u4ECD\u53EF\u7528\u952E\u76D8\u6253\u5F00\u3001\u6392\u5E8F\u4E0E\u9690\u85CF\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        PrefSelect,
        {
          label: "\u53EF\u89C1\u56FE\u6807\u4E0A\u9650",
          value: prefs.maxVisibleIcons,
          options: ICON_LIMIT_OPTIONS,
          disabled: saving,
          onChange: (next) => {
            save({ maxVisibleIcons: next });
          }
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        SettingRow,
        {
          title: "\u5FBD\u6807\u5237\u65B0\u95F4\u9694",
          hint: "\u6846\u67B6\u7EDF\u4E00\u8C03\u5EA6\uFF1A\u9875\u9762\u4E0D\u53EF\u89C1\u65F6\u6682\u505C\uFF0C\u5355\u7EC4\u4EF6\u5931\u8D25\u6309 5s\u219210s\u219230s\u219260s \u9000\u907F\u3002",
          children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            PrefSelect,
            {
              label: "\u5FBD\u6807\u5237\u65B0\u95F4\u9694",
              value: prefs.badgeIntervalMs,
              options: BADGE_INTERVAL_OPTIONS,
              disabled: saving,
              onChange: (next) => {
                save({ badgeIntervalMs: next });
              }
            }
          )
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingRow, { title: "\u56FE\u6807\u60AC\u505C\u9884\u89C8", hint: "\u60AC\u505C\u6258\u76D8\u56FE\u6807\u65F6\u663E\u793A\u7EC4\u4EF6\u540D\u4E0E\u5FBD\u6807\u8BF4\u660E\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        import_dsh_client_ui_primitives5.Switch,
        {
          checked: prefs.hoverPreview,
          disabled: saving,
          label: "\u663E\u793A\u56FE\u6807\u60AC\u505C\u9884\u89C8",
          onChange: (next) => {
            save({ hoverPreview: next });
          }
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        SettingRow,
        {
          title: "\u53C2\u8003\u7EC4\u4EF6",
          hint: "\u672C\u63D2\u4EF6\u81EA\u5E26\u7684\u56DB\u4E2A\u89C4\u8303\u793A\u4F8B\uFF08\u4E0D\u662F\u4E1A\u52A1\uFF09\uFF1A\u4E24\u5F20\u5361\u7247\u300C\u65F6\u949F / \u7EC4\u4EF6\u8BCA\u65AD\u300D\uFF0C\u4E24\u4E2A\u5C0F\u9762\u677F\u300C\u5FEB\u901F\u8BBE\u7F6E\uFF08\u70B9\u51FB\u5C55\u5F00\uFF09/ \u72B6\u6001\u901F\u89C8\uFF08\u60AC\u505C\u5C55\u5F00\uFF09\u300D\u3002\u300C\u7EC4\u4EF6\u7BB1\u300D\u662F\u6846\u67B6\u7684\u7EDF\u4E00\u5165\u53E3\uFF0C\u4E0D\u5728\u6B64\u5217\u3001\u59CB\u7EC8\u88C5\u8F7D\u3002",
          children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            import_dsh_client_ui_primitives5.Switch,
            {
              checked: prefs.referenceWidgets,
              disabled: saving,
              label: "\u88C5\u8F7D\u53C2\u8003\u7EC4\u4EF6",
              onChange: (next) => {
                save({ referenceWidgets: next });
              }
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { className: styles_module_css_default.sectionTitle, children: "\u5361\u7247\u5916\u89C2\u4E0E\u52A8\u6548" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { className: styles_module_css_default.sectionHint, children: [
        "\u7EDF\u4E00\u4F5C\u7528\u4E8E\u6240\u6709\u5361\u7247\u4E0E\u5C0F\u9762\u677F\uFF08\u542B\u6807\u9898\u680F\uFF09\uFF1A\u62D6\u52A8\u6ED1\u5757\u5373\u65F6\u9884\u89C8\uFF0C\u677E\u624B\u5199\u5165 ",
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("code", { children: "settings.yaml" }),
        "\uFF0C\u5237\u65B0\u4E0E\u6362\u8BBE\u5907\u90FD\u4FDD\u6301\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: styles_module_css_default.group, children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          SettingRow,
          {
            title: "\u80CC\u666F\u4E0D\u900F\u660E\u5EA6",
            hint: "100% = \u5B8C\u5168\u7528\u4E3B\u9898\u5E95\u8272\uFF1B\u8D8A\u5C0F\u8D8A\u900F\uFF0C\u914D\u5408\u4E0B\u9762\u7684\u6BDB\u73BB\u7483\u5C31\u662F\u300C\u6DE1\u5E95\u73BB\u7483\u300D\u6548\u679C\u3002",
            children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              PrefSlider,
              {
                label: "\u5361\u7247\u80CC\u666F\u4E0D\u900F\u660E\u5EA6",
                value: prefs.cardOpacity,
                min: 0.2,
                max: 1,
                step: 0.05,
                format: (next) => `${String(Math.round(next * 100))}%`,
                onChange: (next) => {
                  void runtime.setPrefs({ cardOpacity: next }, { save: false });
                },
                onCommit: (next) => {
                  save({ cardOpacity: next });
                }
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          SettingRow,
          {
            title: "\u6BDB\u73BB\u7483\u6A21\u7CCA",
            hint: "0 = \u5173\u95ED\uFF08\u4E0D\u542F\u7528 backdrop-filter\uFF09\uFF1B\u900F\u660E\u5EA6\u8D8A\u4F4E\uFF0C\u6A21\u7CCA\u8D8A\u770B\u5F97\u51FA\u6765\u3002",
            children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              PrefSlider,
              {
                label: "\u5361\u7247\u6BDB\u73BB\u7483\u6A21\u7CCA\u534A\u5F84",
                value: prefs.cardBlur,
                min: 0,
                max: 32,
                step: 1,
                format: (next) => next === 0 ? "\u5173\u95ED" : `${String(next)} px`,
                onChange: (next) => {
                  void runtime.setPrefs({ cardBlur: next }, { save: false });
                },
                onCommit: (next) => {
                  save({ cardBlur: next });
                }
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(SettingRow, { title: "\u8FB9\u6846", hint: "\u9ED8\u8BA4\u8DDF\u968F\u6846\u67B6\uFF080.5px \u7EC6\u8FB9\uFF09\uFF1B\u4E5F\u53EF\u4EE5\u66F4\u660E\u663E\u3001\u6216\u5B8C\u5168\u4E0D\u8981\u8FB9\u6846\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          PrefSelect,
          {
            label: "\u5361\u7247\u8FB9\u6846",
            value: prefs.cardBorder,
            options: CARD_BORDER_OPTIONS,
            disabled: saving,
            onChange: (next) => {
              save({ cardBorder: next });
            }
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          SettingRow,
          {
            title: "\u5706\u89D2",
            hint: "\u9ED8\u8BA4\u8DDF\u968F\u6846\u67B6\uFF0812px \u5706\u89D2\uFF09\uFF1B\u300C\u5706\u89D2\u300D\u66F4\u5706\uFF0820px\uFF09\uFF0C\u300C\u76F4\u89D2\u300D\u4E3A 0\uFF08\u6700\u5C0F\u5316\u7684\u80F6\u56CA\u4E5F\u4E00\u8D77\u62C9\u5E73\uFF09\u3002",
            children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              PrefSelect,
              {
                label: "\u5361\u7247\u5706\u89D2",
                value: prefs.cardRadius,
                options: CARD_RADIUS_OPTIONS,
                disabled: saving,
                onChange: (next) => {
                  save({ cardRadius: next });
                }
              }
            )
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          SettingRow,
          {
            title: "\u52A8\u753B\u8FC7\u6E21",
            hint: "\u5361\u7247\u51FA\u73B0 / \u6536\u653E / \u843D\u4F4D\u3001\u5438\u9644\u9884\u89C8\u6ED1\u52A8\u3001\u6258\u76D8\u56FE\u6807\u8BA9\u4F4D\u90FD\u6309\u8FD9\u4E2A\u65F6\u957F\u8FC7\u6E21\uFF1B\u62D6\u52A8\u8DDF\u624B\u4E0E\u624B\u52BF\u76FE\u4E0D\u53D7\u5F71\u54CD\u3002\u7CFB\u7EDF\u300C\u51CF\u5C11\u52A8\u6548\u300D\u4F18\u5148\u3002",
            children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              PrefSelect,
              {
                label: "\u52A8\u753B\u8FC7\u6E21\u65F6\u957F",
                value: prefs.motionMs,
                options: MOTION_OPTIONS,
                disabled: saving,
                onChange: (next) => {
                  save({ motionMs: next });
                }
              }
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("h3", { className: styles_module_css_default.sectionTitle, children: [
        "\u5DF2\u6CE8\u518C\u7EC4\u4EF6\uFF08",
        String(snapshot.widgets.length),
        "\uFF09"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: styles_module_css_default.sectionHint, children: "\u672C\u673A\u5E03\u5C40\uFF08\u6258\u76D8\u987A\u5E8F\u3001\u5361\u7247\u4F4D\u7F6E\u5C3A\u5BF8\u4E0E\u9501\u5B9A\u3001\u9690\u85CF\u4E0E\u7981\u7528\u3001\u5C42\u53E0\u987A\u5E8F\uFF09\u53EA\u5B58\u5728\u8FD9\u53F0\u6D4F\u89C8\u5668\u91CC\uFF1B \u6362\u8BBE\u5907\u6216\u6E05\u7F13\u5B58\u4F1A\u56DE\u5230\u9ED8\u8BA4\u5E03\u5C40\u3002\u300C\u542F\u7528\u300D\u5F00\u5173\u5C31\u662F\u52A8\u6001\u542F\u505C\uFF1A\u5173\u6389\u540E\u56FE\u6807\u3001\u5361\u7247\u3001\u9762\u677F\u4E0E\u5FBD\u6807\u4E00\u5E76\u505C\u7528\uFF0C \u4F46\u6CE8\u518C\u8BB0\u5F55\u4E0E\u5E03\u5C40\u90FD\u7559\u7740\uFF0C\u968F\u65F6\u53EF\u4EE5\u518D\u6253\u5F00\u3002" }),
      snapshot.widgets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: styles_module_css_default.empty, children: "\u6682\u65E0\u63D2\u4EF6\u6CE8\u518C\u5C0F\u7EC4\u4EF6\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: styles_module_css_default.list, children: snapshot.widgets.map((widget) => {
        const title = typeof widget.title === "function" ? widget.title() : widget.title;
        const enabled = !disabled.has(widget.id);
        const open = runtime.isOpen(widget.id);
        const locked = widget.presentation === "card" && runtime.isLocked(widget.id);
        return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "div",
          {
            className: styles_module_css_default.listRow + (enabled ? "" : " " + styles_module_css_default.listRowOff),
            "data-disabled": enabled ? "false" : "true",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: styles_module_css_default.listMain, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: styles_module_css_default.listId, children: widget.id }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: styles_module_css_default.listMeta, children: [
                  title,
                  " \xB7 \u6765\u6E90 ",
                  widget.owner,
                  " \xB7 ",
                  widget.presentation,
                  locked ? " \xB7 \u4F4D\u7F6E\u5DF2\u9501\u5B9A" : "",
                  enabled ? "" : " \xB7 \u5DF2\u7981\u7528"
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: styles_module_css_default.listActions, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  import_dsh_client_ui_primitives5.Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    disabled: !enabled || widget.presentation === "tray",
                    onClick: () => {
                      runtime.toggle(widget.id);
                    },
                    children: open ? "\u6536\u8D77" : "\u6253\u5F00"
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                  import_dsh_client_ui_primitives5.Switch,
                  {
                    checked: enabled,
                    label: `\u542F\u7528\u300C${title}\u300D`,
                    onChange: (next) => {
                      runtime.setEnabled(widget.id, next);
                      setNotice(
                        next ? `\u300C${title}\u300D\u5DF2\u542F\u7528\uFF1A\u56FE\u6807\u4E0E\u5361\u7247\u56DE\u5230\u539F\u6765\u7684\u4F4D\u7F6E\u3002` : `\u300C${title}\u300D\u5DF2\u7981\u7528\uFF1A\u56FE\u6807\u3001\u5361\u7247\u4E0E\u9762\u677F\u4E00\u5E76\u505C\u7528\uFF0C\u5E03\u5C40\u4FDD\u7559\u3002`
                      );
                    }
                  }
                )
              ] })
            ]
          },
          widget.id
        );
      }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: styles_module_css_default.footer, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        import_dsh_client_ui_primitives5.Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => {
            const ok = runtime.resetLocal();
            setNotice(
              ok ? "\u672C\u673A\u5E03\u5C40\u5DF2\u6E05\u7A7A\uFF1A\u6258\u76D8\u987A\u5E8F\u3001\u5361\u7247\u4F4D\u7F6E\u5C3A\u5BF8\u4E0E\u9501\u5B9A\u3001\u9690\u85CF\u4E0E\u7981\u7528\u90FD\u56DE\u5230\u9ED8\u8BA4\u3002" : "\u672C\u673A\u5E03\u5C40\u5B58\u50A8\u4E0D\u53EF\u7528\uFF08\u9690\u79C1\u6A21\u5F0F\u6216\u914D\u989D\u6EE1\uFF09\uFF0C\u5DF2\u7ECF\u5728\u7528\u9ED8\u8BA4\u5E03\u5C40\u3002"
            );
          },
          children: "\u6E05\u7A7A\u672C\u673A\u5E03\u5C40"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        import_dsh_client_ui_primitives5.Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => {
            const removed = runtime.pruneOrphans();
            setNotice(
              removed > 0 ? `\u5DF2\u6E05\u7406 ${String(removed)} \u4E2A\u300C\u5DF2\u5378\u8F7D\u4E14\u4E00\u76F4\u6CA1\u56DE\u6765\u300D\u7684\u7EC4\u4EF6\u6B8B\u7559\uFF08\u5728\u518C\u7EC4\u4EF6\u7684\u5E03\u5C40\u4E0D\u53D7\u5F71\u54CD\uFF09\u3002` : "\u6CA1\u6709\u53EF\u6E05\u7406\u7684\u6B8B\u7559\uFF1A\u5F53\u524D\u6240\u6709\u5E03\u5C40\u8BB0\u5F55\u90FD\u5BF9\u5E94\u7740\u5728\u518C\u7EC4\u4EF6\u3002"
            );
          },
          children: "\u6E05\u7406\u5DF2\u5378\u8F7D\u7EC4\u4EF6\u7684\u6B8B\u7559"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: styles_module_css_default.rowHint, children: [
        "\u6846\u67B6 v",
        runtime.frameworkVersion,
        " \xB7 \u5951\u7EA6 SPEC v",
        String(runtime.specVersion)
      ] })
    ] })
  ] });
}

// src/client/Tray.tsx
var import_dsh_client_ui_primitives6 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react7 = require("react");

// src/client/store.ts
var STORE_KEY = "dshp-widget-kit:v1";
var STORE_VERSION = 1;
var MAX_TRACKED = 96;
var MAX_LIST = 96;
var SAVE_DEBOUNCE_MS = 300;
function emptyState() {
  return {
    v: STORE_VERSION,
    tray: { order: [], hidden: [] },
    cards: {},
    lastOpenId: null,
    zOrder: [],
    popoverId: null,
    popoverOrigin: null,
    disabled: []
  };
}
function isRecord2(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function readIdList(raw, deps) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (out.length >= MAX_LIST) break;
    if (typeof item !== "string") continue;
    if (!deps.isKnown(item)) continue;
    if (out.includes(item)) continue;
    out.push(item);
  }
  return out;
}
function sanitizeState(raw, deps) {
  if (!isRecord2(raw)) return emptyState();
  if (raw["v"] !== STORE_VERSION) return emptyState();
  const trayRaw = isRecord2(raw["tray"]) ? raw["tray"] : {};
  const order = readIdList(trayRaw["order"], deps);
  const hidden = readIdList(trayRaw["hidden"], deps);
  const disabled = readIdList(raw["disabled"], deps);
  const zOrder = readIdList(raw["zOrder"], deps);
  const cardsRaw = isRecord2(raw["cards"]) ? raw["cards"] : {};
  const cards = {};
  let tracked = 0;
  const cardIds = Object.keys(cardsRaw);
  for (const id of cardIds.slice(-MAX_TRACKED)) {
    if (tracked >= MAX_TRACKED) break;
    if (!deps.isKnown(id)) continue;
    const value = cardsRaw[id];
    if (!isRecord2(value)) continue;
    const x = value["x"];
    const y = value["y"];
    const w = value["w"];
    const h = value["h"];
    if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(w) || !isFiniteNumber(h)) continue;
    const rect = deps.clampRect({ x, y, w, h }, deps.constraintsOf(id), deps.viewport);
    cards[id] = {
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      minimized: value["minimized"] === true,
      open: value["open"] === true,
      locked: value["locked"] === true
    };
    tracked += 1;
  }
  const lastRaw = raw["lastOpenId"];
  const lastOpenId = typeof lastRaw === "string" && deps.isKnown(lastRaw) ? lastRaw : null;
  const popoverRaw = raw["popoverId"];
  const popoverId = typeof popoverRaw === "string" && deps.isKnown(popoverRaw) ? popoverRaw : null;
  const originRaw = raw["popoverOrigin"];
  const popoverOrigin = popoverId !== null && (originRaw === "click" || originRaw === "hover") ? originRaw : null;
  return {
    v: STORE_VERSION,
    tray: { order, hidden },
    cards,
    lastOpenId,
    zOrder,
    popoverId,
    popoverOrigin,
    disabled
  };
}
function loadState(storage, deps) {
  if (storage === null) return { state: emptyState(), degraded: true };
  try {
    const raw = storage.getItem(STORE_KEY);
    if (raw === null || raw === "") return { state: emptyState(), degraded: false };
    return { state: sanitizeState(JSON.parse(raw), deps), degraded: false };
  } catch {
    return { state: emptyState(), degraded: true };
  }
}
function saveState(storage, state) {
  if (storage === null) return false;
  try {
    storage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
function clearState(storage) {
  if (storage === null) return false;
  try {
    storage.removeItem(STORE_KEY);
    return true;
  } catch {
    return false;
  }
}
function createDebouncedSaver(storage, delayMs = SAVE_DEBOUNCE_MS, onError = () => {
}) {
  let timer = null;
  let queued = null;
  const write = () => {
    if (queued === null) return true;
    const payload = queued;
    queued = null;
    const ok = saveState(storage, payload);
    if (!ok) onError();
    return ok;
  };
  return {
    schedule(state) {
      queued = state;
      if (timer !== null) return;
      timer = setTimeout(() => {
        timer = null;
        write();
      }, delayMs);
    },
    flush() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      return write();
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      queued = null;
    },
    pending() {
      return queued !== null;
    }
  };
}
function moveInOrder(order, id, delta) {
  const index = order.indexOf(id);
  const next = index + delta;
  if (index < 0 || next < 0 || next >= order.length) return order.slice();
  const out = order.slice();
  const [item] = out.splice(index, 1);
  if (item === void 0) return order.slice();
  out.splice(next, 0, item);
  return out;
}
function mergeVisibleOrder(full, nextVisible) {
  const visible = new Set(nextVisible);
  const out = full.slice();
  let cursor = 0;
  for (let i = 0; i < out.length; i += 1) {
    const id = out[i];
    if (id === void 0 || !visible.has(id)) continue;
    const replacement = nextVisible[cursor];
    cursor += 1;
    if (replacement !== void 0) out[i] = replacement;
  }
  for (const id of nextVisible) {
    if (!out.includes(id)) out.push(id);
  }
  return out;
}
function setMembershipInList(list, id, present) {
  if (present) {
    if (list.includes(id)) return list.slice();
    return [...list, id].slice(0, MAX_LIST);
  }
  return list.filter((x) => x !== id);
}
var setHiddenInList = setMembershipInList;
var setDisabledInList = setMembershipInList;
function pruneId(state, id) {
  const cards = { ...state.cards };
  delete cards[id];
  return {
    v: STORE_VERSION,
    tray: {
      order: state.tray.order.filter((x) => x !== id),
      hidden: state.tray.hidden.filter((x) => x !== id)
    },
    cards,
    lastOpenId: state.lastOpenId === id ? null : state.lastOpenId,
    zOrder: state.zOrder.filter((x) => x !== id),
    popoverId: state.popoverId === id ? null : state.popoverId,
    popoverOrigin: state.popoverId === id ? null : state.popoverOrigin,
    disabled: state.disabled.filter((x) => x !== id)
  };
}
function planTrayDrag(slots, draggingId, pointerX) {
  const order = slots.map((slot2) => slot2.id);
  const from = order.indexOf(draggingId);
  if (from < 0) return { to: -1, order: order.slice(), slot: null, shift: {} };
  const others = slots.filter((slot2) => slot2.id !== draggingId);
  let to = 0;
  for (const slot2 of others) {
    if (Number.isFinite(slot2.center) && slot2.center < pointerX) to += 1;
  }
  const shift = {};
  if (to > from) {
    for (let index = from + 1; index <= to && index < slots.length; index += 1) {
      const current = slots[index];
      const previous = slots[index - 1];
      if (current === void 0 || previous === void 0) continue;
      shift[current.id] = previous.left - current.left;
    }
  } else if (to < from) {
    for (let index = to; index < from; index += 1) {
      const current = slots[index];
      const next2 = slots[index + 1];
      if (current === void 0 || next2 === void 0) continue;
      shift[current.id] = next2.left - current.left;
    }
  }
  const next = order.filter((id) => id !== draggingId);
  next.splice(Math.min(Math.max(to, 0), next.length), 0, draggingId);
  const slot = slots[Math.min(Math.max(to, 0), slots.length - 1)] ?? null;
  return { to, order: next, slot, shift };
}

// src/client/Tray.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
var DRAG_THRESHOLD = 8;
function resolveText3(value) {
  return typeof value === "function" ? value() : value;
}
function Tray({
  runtime,
  sessionId
}) {
  const snapshot = useFramework(runtime);
  const [menuOpen, setMenuOpen] = (0, import_react7.useState)(false);
  const [dragView, setDragView] = (0, import_react7.useState)(null);
  const dragRef = (0, import_react7.useRef)(null);
  const listeners = (0, import_react7.useRef)(null);
  const latest = (0, import_react7.useRef)({ x: 0, y: 0 });
  const frame = (0, import_react7.useRef)(null);
  const suppressClick = (0, import_react7.useRef)(false);
  const containerRef = (0, import_react7.useRef)(null);
  const disabled = (0, import_react7.useMemo)(() => new Set(snapshot.layout.disabled), [snapshot.layout.disabled]);
  (0, import_react7.useEffect)(() => {
    if (sessionId === void 0) return;
    runtime.setSession(sessionId ?? null);
  }, [runtime, sessionId]);
  const orderIds = (0, import_react7.useMemo)(() => {
    const ids = [...snapshot.layout.tray.order];
    for (const widget of snapshot.widgets) {
      if (!ids.includes(widget.id)) ids.push(widget.id);
    }
    return ids;
  }, [snapshot.layout.tray.order, snapshot.widgets]);
  const ordered = (0, import_react7.useMemo)(
    () => orderIds.map((id) => snapshot.widgets.find((widget) => widget.id === id)),
    [orderIds, snapshot.widgets]
  );
  const ready = ordered.filter(
    (widget) => widget !== void 0 && !disabled.has(widget.id) && widget.trayIcon !== false
  );
  const hidden = new Set(snapshot.layout.tray.hidden);
  const visibleIds = ready.filter((widget) => !hidden.has(widget.id)).map((widget) => widget.id);
  const limit = Math.max(1, snapshot.prefs.maxVisibleIcons);
  const shownIds = visibleIds.slice(0, limit);
  const shown = shownIds.map((id) => ready.find((widget) => widget.id === id)).filter((widget) => widget !== void 0);
  const overflow = ready.filter((widget) => !shownIds.includes(widget.id));
  const readSlots = (0, import_react7.useCallback)((ids) => {
    const root = containerRef.current;
    if (root === null) return [];
    const trayRect = root.getBoundingClientRect();
    const slots = [];
    for (const id of ids) {
      const node = root.querySelector(`[data-tray-id="${id}"]`);
      if (node === null) return [];
      const rect = node.getBoundingClientRect();
      slots.push({
        id,
        left: rect.left - trayRect.left,
        width: rect.width,
        center: rect.left + rect.width / 2
      });
    }
    return slots;
  }, []);
  const flushDrag = (0, import_react7.useCallback)(() => {
    const drag = dragRef.current;
    if (drag === null) return;
    const dx = latest.current.x - drag.startX;
    const dy = latest.current.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    const plan = planTrayDrag(drag.slots, drag.id, latest.current.x);
    setDragView({
      id: drag.id,
      dx,
      slot: plan.slot === null ? null : { left: plan.slot.left, width: plan.slot.width },
      shift: plan.shift
    });
  }, []);
  const finishDrag = (0, import_react7.useCallback)(
    (commit, pointerX) => {
      const drag = dragRef.current;
      if (drag === null) return;
      dragRef.current = null;
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      const attached = listeners.current;
      listeners.current = null;
      if (attached !== null && typeof window !== "undefined") {
        window.removeEventListener("pointermove", attached.move);
        window.removeEventListener("pointerup", attached.up);
        window.removeEventListener("pointercancel", attached.cancel);
      }
      setDragView(null);
      if (!commit || !drag.moved) return;
      suppressClick.current = true;
      const plan = planTrayDrag(drag.slots, drag.id, pointerX ?? latest.current.x);
      if (plan.to < 0 || plan.order.join() === drag.slots.map((slot) => slot.id).join()) return;
      runtime.setOrder(mergeVisibleOrder(orderIds, plan.order));
    },
    [orderIds, runtime]
  );
  const onIconPointerDown = (0, import_react7.useCallback)(
    (event, id) => {
      if (event.button !== 0 || dragRef.current !== null) return;
      const slots = readSlots(visibleIds.slice(0, limit));
      if (slots.length < 2) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
      }
      dragRef.current = {
        id,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        visible: visibleIds,
        slots
      };
      latest.current = { x: event.clientX, y: event.clientY };
      if (typeof window === "undefined") return;
      const pointerId = event.pointerId;
      const move = (native) => {
        if (native.pointerId !== pointerId) return;
        if (native.pointerType !== "touch" && native.buttons === 0) {
          finishDrag(true, native.clientX);
          return;
        }
        latest.current = { x: native.clientX, y: native.clientY };
        if (frame.current !== null) return;
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          flushDrag();
        });
      };
      const up = (native) => {
        if (native.pointerId !== pointerId) return;
        latest.current = { x: native.clientX, y: native.clientY };
        flushDrag();
        finishDrag(true, native.clientX);
      };
      const cancel = (native) => {
        if (native.pointerId !== pointerId) return;
        finishDrag(false);
      };
      listeners.current = { move, up, cancel };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
    },
    [finishDrag, flushDrag, limit, readSlots, visibleIds]
  );
  (0, import_react7.useEffect)(() => () => finishDrag(false), [finishDrag]);
  const onIconClick = (0, import_react7.useCallback)(
    (id) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      runtime.toggle(id);
    },
    [runtime]
  );
  const menuItems = (0, import_react7.useMemo)(() => {
    const entries = [{ type: "label", id: "widgets-label", text: "\u7EC4\u4EF6" }];
    for (const widget of ready) {
      const title = resolveText3(widget.title);
      const submenu = [
        { id: `open:${widget.id}`, label: runtime.isOpen(widget.id) ? "\u6536\u8D77 / \u6700\u5C0F\u5316" : "\u6253\u5F00" },
        {
          id: `hide:${widget.id}`,
          label: hidden.has(widget.id) ? "\u5728\u6258\u76D8\u4E2D\u663E\u793A" : "\u4ECE\u6258\u76D8\u9690\u85CF"
        },
        { id: `up:${widget.id}`, label: "\u4E0A\u79FB" },
        { id: `down:${widget.id}`, label: "\u4E0B\u79FB" }
      ];
      entries.push({
        id: `w:${widget.id}`,
        label: hidden.has(widget.id) ? `\u5DF2\u9690\u85CF \xB7 ${title}` : title,
        submenu
      });
    }
    entries.push({ type: "separator", id: "sep-tray" });
    entries.push({ id: "reset-tray", label: "\u91CD\u7F6E\u6258\u76D8\u987A\u5E8F\u4E0E\u9690\u85CF" });
    return entries;
  }, [hidden, ready, runtime, snapshot]);
  const onMenuSelect = (0, import_react7.useCallback)(
    (id) => {
      setMenuOpen(false);
      if (id === "reset-tray") {
        runtime.resetTrayLayout();
        return;
      }
      const index = id.indexOf(":");
      if (index < 0) return;
      const action = id.slice(0, index);
      const widgetId = id.slice(index + 1);
      if (action === "open") runtime.toggle(widgetId);
      else if (action === "hide") runtime.setHidden(widgetId, !hidden.has(widgetId));
      else if (action === "up") runtime.setTrayOrder(widgetId, -1);
      else if (action === "down") runtime.setTrayOrder(widgetId, 1);
    },
    [hidden, runtime]
  );
  const overflowBadge = overflow.some((widget) => (snapshot.badges[widget.id] ?? null) !== null);
  if (!snapshot.ready || !snapshot.prefs.trayEnabled || ready.length === 0) return null;
  const dragging = dragView !== null;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
    "div",
    {
      className: styles_module_css_default.tray,
      role: "group",
      "aria-label": "\u5C0F\u7EC4\u4EF6\u6258\u76D8",
      ref: containerRef,
      style: surfaceVars(snapshot.prefs),
      children: [
        dragView?.slot != null && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "span",
          {
            className: styles_module_css_default.trayGhost,
            style: { left: dragView.slot.left, width: dragView.slot.width },
            "aria-hidden": "true"
          }
        ),
        shown.map((widget) => {
          const badge = snapshot.badges[widget.id] ?? null;
          const active = runtime.isOpen(widget.id);
          const isDragged = dragView?.id === widget.id;
          const shifted = dragView?.shift[widget.id] ?? 0;
          const title = resolveText3(widget.title);
          const label = badge?.title !== void 0 && badge.title !== "" ? `${title} \xB7 ${badge.title}` : title;
          const hoverTriggered = widget.presentation === "popover" && widget.popover?.trigger === "hover";
          const tone = badge?.tone ?? "info";
          const trayLabel = widget.tray.label === null ? "" : resolveText3(widget.tray.label).slice(0, TRAY_LABEL_MAX_CHARS);
          return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "span",
            {
              className: styles_module_css_default.trayAnchor + (isDragged ? " " + styles_module_css_default.trayAnchorDragging : ""),
              "data-tray-id": widget.id,
              style: isDragged ? { transform: `translateX(${String(dragView.dx)}px)`, zIndex: 3 } : shifted === 0 ? void 0 : { transform: `translateX(${String(shifted)}px)` },
              ref: (element) => {
                runtime.setAnchor(widget.id, element);
              },
              onPointerEnter: () => {
                runtime.hoverEnter(widget.id);
              },
              onPointerLeave: () => {
                runtime.hoverLeave(widget.id);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                import_dsh_client_ui_primitives6.Tooltip,
                {
                  label,
                  side: "bottom",
                  delayMs: 400,
                  disabled: hoverTriggered || dragging,
                  children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    "button",
                    {
                      type: "button",
                      className: styles_module_css_default.trayBtn + (active ? " " + styles_module_css_default.trayBtnActive : "") + (isDragged ? " " + styles_module_css_default.trayBtnDragging : ""),
                      "data-dragging": isDragged ? "true" : void 0,
                      "aria-label": label,
                      "aria-haspopup": "dialog",
                      "aria-expanded": active,
                      onPointerDown: (event) => {
                        onIconPointerDown(event, widget.id);
                      },
                      onClick: () => {
                        onIconClick(widget.id);
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.trayGlyph, children: widget.icon }),
                        trayLabel !== "" && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.trayLabel, "data-tray-label": trayLabel, children: trayLabel }),
                        badge !== null && badge.text !== void 0 && badge.text !== "" ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.trayBadgeText, "data-tone": tone, children: badge.text.slice(0, 2) }) : badge !== null && (badge.dot === true || badge.tone !== void 0) ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.trayBadge, "data-tone": tone }) : null
                      ]
                    }
                  )
                }
              )
            },
            widget.id
          );
        }),
        overflow.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.trayAnchor, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          import_dsh_client_ui_primitives6.Menu,
          {
            open: menuOpen,
            dense: true,
            portal: true,
            autoFocus: true,
            align: "end",
            items: menuItems,
            onSelect: onMenuSelect,
            onClose: () => {
              setMenuOpen(false);
            },
            anchor: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
              "button",
              {
                type: "button",
                className: styles_module_css_default.trayBtn,
                "aria-label": `\u8FD8\u6709 ${String(overflow.length)} \u4E2A\u7EC4\u4EF6`,
                "aria-haspopup": "menu",
                "aria-expanded": menuOpen,
                onClick: () => {
                  setMenuOpen((prev) => !prev);
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.trayGlyph, children: "\u22EF" }),
                  overflowBadge && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.trayBadge, "data-tone": "info" })
                ]
              }
            )
          }
        ) })
      ]
    }
  );
}

// src/client/service.ts
function defaultConstraints() {
  return { min: SPEC_DEFAULTS.cardFloorSize, max: null };
}
function createWidgetRuntime(deps) {
  const registry = /* @__PURE__ */ new Map();
  const anchors = /* @__PURE__ */ new Map();
  const capsuleNeeds = /* @__PURE__ */ new Map();
  const lastAnchors = /* @__PURE__ */ new Map();
  const badges = {};
  const sizeCalls = /* @__PURE__ */ new Map();
  const sizeFrozen = /* @__PURE__ */ new Set();
  let prefs = { ...deps.prefs };
  let viewport = { ...deps.viewport };
  let transientId = null;
  let transientOrigin = null;
  let sessionId = null;
  const hoverTimers = /* @__PURE__ */ new Map();
  let live = null;
  let liveSnapView = null;
  const listeners = /* @__PURE__ */ new Set();
  const liveListeners = /* @__PURE__ */ new Set();
  const constraintsFor = (widget) => {
    const floor = SPEC_DEFAULTS.cardFloorSize;
    const min = widget.card?.minSize ?? floor;
    return { min, max: widget.card?.maxSize ?? null };
  };
  function snapOptions() {
    return { gap: SPEC_DEFAULTS.snapGap, distance: SPEC_DEFAULTS.snapDistance };
  }
  function othersOf(exceptId) {
    const out = [];
    for (const [id, card] of Object.entries(state.cards)) {
      if (id === exceptId || !card.open || card.minimized) continue;
      if (!registry.has(id)) continue;
      const size = card.minimized ? collapsedSize(id) : { w: card.w, h: card.h };
      out.push({ x: card.x, y: card.y, w: size.w, h: size.h });
    }
    return out;
  }
  const initial = loadState(deps.storage, {
    isKnown: () => true,
    constraintsOf: () => defaultConstraints(),
    viewport,
    clampRect
  });
  let state = initial.state;
  let degraded = initial.degraded;
  if (degraded && deps.storage !== null) {
    deps.onError?.("[dshp-widget-kit] \u672C\u673A\u5E03\u5C40\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u672C\u6B21\u5E03\u5C40\u53EA\u5B58\u5728\u4E8E\u5185\u5B58\u91CC");
  }
  const saver = createDebouncedSaver(deps.storage, void 0, () => {
    degraded = true;
    deps.onError?.("[dshp-widget-kit] \u5199\u5165\u672C\u673A\u5E03\u5C40\u5931\u8D25\uFF08\u914D\u989D\u6216\u9690\u79C1\u6A21\u5F0F\uFF09\uFF0C\u540E\u7EED\u6539\u52A8\u53EA\u7559\u5728\u5185\u5B58");
  });
  let snapshot = {
    ready: false,
    degraded,
    widgets: [],
    layout: state,
    // 刷新即恢复：上次展开的面板与卡片层叠顺序都从本机布局里读回来（见 docs/widget-spec.md §7）
    // 常驻面板刷新即恢复；临时面板（悬停速览 / 一次性菜单）不恢复
    transientId: null,
    transientOrigin: null,
    pinnedId: state.popoverId,
    pinnedOrigin: state.popoverOrigin,
    zOrder: [...state.zOrder],
    badges,
    prefs
  };
  function sortedWidgets() {
    const all = [...registry.values()];
    all.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    return all;
  }
  function publish() {
    snapshot = {
      ready: snapshot.ready,
      degraded,
      widgets: sortedWidgets(),
      layout: state,
      transientId,
      transientOrigin,
      pinnedId: state.popoverId,
      pinnedOrigin: state.popoverOrigin,
      zOrder: [...state.zOrder],
      badges: { ...badges },
      prefs
    };
    for (const listener of listeners) {
      try {
        listener();
      } catch (error) {
        deps.onError?.("[dshp-widget-kit] \u8BA2\u9605\u8005\u56DE\u8C03\u629B\u9519\uFF08\u5DF2\u9694\u79BB\uFF09", error);
      }
    }
  }
  function notifyLive() {
    for (const listener of liveListeners) {
      try {
        listener();
      } catch (error) {
        deps.onError?.("[dshp-widget-kit] live \u8BA2\u9605\u8005\u56DE\u8C03\u629B\u9519\uFF08\u5DF2\u9694\u79BB\uFF09", error);
      }
    }
  }
  function persist() {
    saver.schedule(state);
  }
  function setPinnedTarget(id, origin) {
    if (state.popoverId === id && state.popoverOrigin === origin) return;
    state = { ...state, popoverId: id, popoverOrigin: origin };
    persist();
  }
  function setTransientTarget(id, origin) {
    if (transientId === id && transientOrigin === origin) return;
    transientId = id;
    transientOrigin = origin;
  }
  function channelOf(widget) {
    return widget.popover?.persistent === true ? "pinned" : "transient";
  }
  function isOpenId(id) {
    return transientId === id || state.popoverId === id;
  }
  function setZOrder(next, persistNow) {
    const unchanged = next.length === state.zOrder.length && next.every((id, index) => state.zOrder[index] === id);
    if (unchanged) return;
    state = { ...state, zOrder: [...next] };
    if (persistNow) persist();
  }
  function scheduleTimeout(callback, ms) {
    if (deps.timeout !== void 0) return deps.timeout(callback, ms);
    const handle = setTimeout(callback, ms);
    return () => {
      clearTimeout(handle);
    };
  }
  function visibleCardCount() {
    let count = 0;
    for (const [id, card] of Object.entries(state.cards)) {
      if (!card.open || card.minimized) continue;
      if (!registry.has(id)) continue;
      count += 1;
    }
    return count;
  }
  function trackedCardCount() {
    let count = 0;
    for (const id of Object.keys(state.cards)) {
      if (registry.has(id)) count += 1;
    }
    return count;
  }
  function makeCardState(widget, index) {
    const constraints = constraintsFor(widget);
    const wanted = widget.card?.defaultSize ?? SPEC_DEFAULTS.cardDefaultSize;
    const rect = defaultRect(index, wanted, constraints, viewport);
    return { ...rect, minimized: false, open: false, locked: false };
  }
  function cardStateOf(widget) {
    const existing = state.cards[widget.id];
    if (existing !== void 0) return existing;
    return makeCardState(widget, trackedCardCount());
  }
  function writeCard(id, next, persistNow) {
    state = { ...state, cards: { ...state.cards, [id]: next } };
    if (persistNow) persist();
    publish();
  }
  function enforceCardLimit(exceptId) {
    if (visibleCardCount() <= SPEC_DEFAULTS.maxOpenCards) return;
    for (const id of state.zOrder) {
      if (id === exceptId || !registry.has(id)) continue;
      const card = state.cards[id];
      if (card === void 0 || !card.open || card.minimized) continue;
      writeCard(id, { ...card, minimized: true }, false);
      deps.onNotice?.(`\u540C\u5C4F\u5361\u7247\u8D85\u8FC7 ${String(SPEC_DEFAULTS.maxOpenCards)} \u5F20\uFF0C\u5DF2\u81EA\u52A8\u6700\u5C0F\u5316\u300C${id}\u300D`);
      return;
    }
  }
  function raiseOrder(id) {
    setZOrder(bringToFront(state.zOrder, id), true);
  }
  function widgetOf(id) {
    return registry.get(id);
  }
  function register(raw) {
    const value = normalizeDescriptor(raw, FRAMEWORK_VERSION);
    registry.set(value.id, value);
    if (state.popoverId === value.id && (value.presentation !== "popover" || channelOf(value) !== "pinned")) {
      state = { ...state, popoverId: null, popoverOrigin: null };
    }
    if (transientId === value.id && (value.presentation !== "popover" || channelOf(value) === "pinned")) {
      transientId = null;
      transientOrigin = null;
    }
    if (!state.tray.order.includes(value.id)) {
      state = { ...state, tray: { ...state.tray, order: [...state.tray.order, value.id] } };
      persist();
    }
    publish();
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      registry.delete(value.id);
      cancelHoverTimer(value.id);
      if (live?.id === value.id) clearLive();
      if (transientId === value.id) {
        transientId = null;
        transientOrigin = null;
      }
      delete badges[value.id];
      capsuleNeeds.delete(value.id);
      publish();
      notifyLive();
    };
  }
  function list() {
    return sortedWidgets().map((widget) => ({
      id: widget.id,
      title: typeof widget.title === "function" ? widget.title() : widget.title,
      owner: widget.owner,
      presentation: widget.presentation,
      listedInBox: widget.listedInBox
    }));
  }
  function cancelHoverTimer(id) {
    const cancel = hoverTimers.get(id);
    if (cancel === void 0) return;
    hoverTimers.delete(id);
    try {
      cancel();
    } catch {
    }
  }
  function cancelAllHoverTimers() {
    const pending = Array.from(hoverTimers.entries());
    hoverTimers.clear();
    for (const [, cancel] of pending) {
      try {
        cancel();
      } catch {
      }
    }
  }
  function showPopover(id, origin) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "popover") return;
    if (!isEnabled(id)) return;
    if (channelOf(widget) === "pinned") setPinnedTarget(id, origin);
    else setTransientTarget(id, origin);
    publish();
  }
  function hidePopover(id) {
    cancelHoverTimer(id);
    if (transientId === id) {
      setTransientTarget(null, null);
      publish();
      return;
    }
    if (state.popoverId === id) {
      setPinnedTarget(null, null);
      publish();
    }
  }
  function hoverEnter(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "popover") return;
    if (!isEnabled(id)) return;
    const options = widget.popover;
    if (options === null || options.trigger !== "hover") return;
    if (isOpenId(widget.id)) {
      cancelHoverTimer(id);
      return;
    }
    cancelHoverTimer(id);
    if (options.hoverOpenDelayMs <= 0) {
      showPopover(id, "hover");
      return;
    }
    hoverTimers.set(
      id,
      scheduleTimeout(() => {
        hoverTimers.delete(id);
        const current = widgetOf(id);
        if (current === void 0 || current.presentation !== "popover") return;
        showPopover(id, "hover");
      }, options.hoverOpenDelayMs)
    );
  }
  function hoverLeave(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "popover") return;
    const options = widget.popover;
    if (options === null || options.trigger !== "hover") return;
    cancelHoverTimer(id);
    if (options.persistent) return;
    if (transientId !== widget.id || transientOrigin !== "hover") return;
    if (options.hoverCloseDelayMs <= 0) {
      hidePopover(id);
      return;
    }
    hoverTimers.set(
      id,
      scheduleTimeout(() => {
        hoverTimers.delete(id);
        if (transientId === id && transientOrigin === "hover") hidePopover(id);
      }, options.hoverCloseDelayMs)
    );
  }
  function open(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation === "tray") return;
    if (!isEnabled(id)) return;
    if (widget.presentation === "popover") {
      showPopover(id, "click");
      return;
    }
    const existing = cardStateOf(widget);
    state = {
      ...state,
      cards: { ...state.cards, [id]: { ...existing, open: true, minimized: false } },
      lastOpenId: id
    };
    raiseOrder(id);
    persist();
    enforceCardLimit(id);
    publish();
  }
  function close(id) {
    const widget = widgetOf(id);
    if (widget === void 0) return;
    if (widget.presentation === "popover") {
      hidePopover(id);
      return;
    }
    const existing = state.cards[id];
    if (existing === void 0) return;
    setZOrder(
      state.zOrder.filter((x) => x !== id),
      false
    );
    state = { ...state, cards: { ...state.cards, [id]: { ...existing, open: false, minimized: false } } };
    persist();
    publish();
  }
  function minimize(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "card" || widget.card?.minimizable === false) return;
    const existing = state.cards[id];
    if (existing === void 0 || !existing.open || existing.minimized) return;
    writeCard(id, { ...existing, minimized: true }, true);
  }
  function restore(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "card") return;
    const existing = state.cards[id];
    if (existing === void 0) return;
    raiseOrder(id);
    writeCard(id, { ...existing, open: true, minimized: false }, true);
  }
  function isOpen(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || !isEnabled(id)) return false;
    if (widget.presentation === "popover") return isOpenId(id);
    const card = state.cards[id];
    return card !== void 0 && card.open;
  }
  function toggle(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation === "tray") return;
    if (!isEnabled(id)) return;
    if (widget.presentation === "popover") {
      if (isOpenId(id)) close(id);
      else open(id);
      return;
    }
    const card = state.cards[id];
    if (card === void 0 || !card.open) {
      open(id);
      return;
    }
    if (card.minimized) {
      restore(id);
      return;
    }
    if (state.zOrder[state.zOrder.length - 1] === id) minimize(id);
    else {
      raiseOrder(id);
      publish();
    }
  }
  function toggleMinimize(id) {
    if (!isEnabled(id)) return;
    const card = state.cards[id];
    if (card === void 0) return;
    if (card.minimized) restore(id);
    else minimize(id);
  }
  function setEnabled(id, enabled) {
    if (widgetOf(id) === void 0) return;
    if (state.disabled.includes(id) === !enabled) return;
    const next = setDisabledInList(state.disabled, id, !enabled);
    cancelHoverTimer(id);
    setZOrder(
      state.zOrder.filter((x) => x !== id),
      false
    );
    let cards = state.cards;
    const card = state.cards[id];
    if (!enabled && card !== void 0 && (card.open || card.minimized)) {
      cards = { ...cards, [id]: { ...card, open: false, minimized: false } };
    }
    const wasPopover = state.popoverId === id;
    if (transientId === id) setTransientTarget(null, null);
    state = {
      ...state,
      cards,
      disabled: next,
      popoverId: wasPopover ? null : state.popoverId,
      popoverOrigin: wasPopover ? null : state.popoverOrigin
    };
    if (!enabled) delete badges[id];
    if (live?.id === id) clearLive();
    persist();
    publish();
    notifyLive();
    deps.onNotice?.(
      enabled ? `\u7EC4\u4EF6\u300C${id}\u300D\u5DF2\u542F\u7528` : `\u7EC4\u4EF6\u300C${id}\u300D\u5DF2\u7981\u7528\uFF1A\u56FE\u6807\u3001\u5361\u7247\u4E0E\u9762\u677F\u4E00\u5E76\u505C\u7528\uFF08\u53EF\u968F\u65F6\u91CD\u65B0\u542F\u7528\uFF09`
    );
  }
  function isEnabled(id) {
    return !state.disabled.includes(id);
  }
  function setLocked(id, locked) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "card") return;
    const existing = state.cards[id];
    if (existing !== void 0 && existing.locked === locked) return;
    const base = existing ?? makeCardState(widget, trackedCardCount());
    if (locked && live?.id === id) {
      clearLive();
      notifyLive();
    }
    writeCard(id, { ...base, locked }, true);
  }
  function isLocked(id) {
    return state.cards[id]?.locked === true;
  }
  function setLiveState(next) {
    const previous = live;
    live = next;
    if (next === null || next.snap === null) {
      liveSnapView = null;
    } else if (previous === null || previous.snap === null || previous.id !== next.id || !isSameRect(previous.snap, next.snap)) {
      liveSnapView = { id: next.id, rect: next.snap };
    }
    notifyLive();
  }
  function clearLive() {
    live = null;
    liveSnapView = null;
  }
  function beginLive(id, mode) {
    if (widgetOf(id) === void 0) return;
    if (isLocked(id)) return;
    setLiveState({ id, rect: visualRectOf(id), mode, snap: null });
  }
  function setLive(id, rect) {
    if (live === null || live.id !== id) return;
    const contained = containRect(rect, viewport);
    let snap = null;
    if (live.mode === "move") {
      const candidate = snapRect(contained, othersOf(id), viewport, snapOptions());
      if (!isSameRect(candidate, contained)) {
        snap = live.snap !== null && isSameRect(live.snap, candidate) ? live.snap : candidate;
      }
    }
    if (isSameRect(live.rect, contained) && snap === live.snap) return;
    setLiveState({ id, rect: contained, mode: live.mode, snap });
  }
  function commitLive(id) {
    if (live === null || live.id !== id) return;
    const widget = widgetOf(id);
    const rect = live.snap ?? live.rect;
    setLiveState(null);
    if (widget === void 0 || widget.presentation !== "card") return;
    const existing = state.cards[id];
    if (existing === void 0) {
      writeCard(id, { ...rect, minimized: false, open: true, locked: false }, true);
      return;
    }
    const next = existing.minimized ? { ...rect, w: existing.w, h: existing.h } : rect;
    if (isSameRect(existing, next)) return;
    writeCard(id, { ...existing, ...next }, true);
  }
  function cancelLive() {
    if (live === null) return;
    setLiveState(null);
  }
  function isCollapsed(id) {
    return state.cards[id]?.minimized === true;
  }
  function reportCapsuleNeed(id, width) {
    if (!Number.isFinite(width) || width <= 0) return;
    const next = Math.round(width);
    if (capsuleNeeds.get(id) === next) return;
    capsuleNeeds.set(id, next);
    if (isCollapsed(id)) publish();
  }
  function capsuleWidthOf(widget, storedWidth) {
    return capsuleWidth({ stored: storedWidth, need: capsuleNeeds.get(widget.id) });
  }
  function collapsedSize(id) {
    const card = state.cards[id];
    const stored = card?.w ?? SPEC_DEFAULTS.cardDefaultSize.w;
    const widget = widgetOf(id);
    return {
      w: widget === void 0 ? Math.min(stored, SPEC_DEFAULTS.capsuleMinWidth) : capsuleWidthOf(widget, stored),
      h: SPEC_DEFAULTS.titleBarHeight
    };
  }
  function visualRectOf(id) {
    const rect = rectOf(id);
    if (!isCollapsed(id)) return rect;
    return { ...rect, ...collapsedSize(id) };
  }
  function rectOf(id) {
    const widget = widgetOf(id);
    if (widget === void 0) {
      return {
        x: 0,
        y: 0,
        w: SPEC_DEFAULTS.cardDefaultSize.w,
        h: SPEC_DEFAULTS.cardDefaultSize.h
      };
    }
    const card = cardStateOf(widget);
    return { x: card.x, y: card.y, w: card.w, h: card.h };
  }
  function applyRect(id, rect) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "card") return;
    if (isLocked(id)) return;
    const clamped = clampRect(rect, constraintsFor(widget), viewport);
    const existing = state.cards[id];
    const base = existing ?? { ...clamped, minimized: false, open: true, locked: false };
    if (isSameRect(base, clamped)) return;
    writeCard(id, { ...base, ...clamped }, true);
  }
  function nudge(id, dx, dy) {
    const rect = rectOf(id);
    raiseOrder(id);
    applyRect(id, { ...rect, x: rect.x + dx, y: rect.y + dy });
  }
  function nudgeResize(id, dw, dh) {
    const widget = widgetOf(id);
    if (widget === void 0) return;
    applyRect(id, applyResize(rectOf(id), "se", dw, dh, constraintsFor(widget), viewport));
  }
  function resizeTo(id, next) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "card") return;
    const rect = rectOf(id);
    applyRect(id, { ...rect, w: next.w ?? rect.w, h: next.h ?? rect.h });
  }
  function center(id) {
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "card") return;
    const rect = rectOf(id);
    applyRect(id, {
      ...rect,
      x: Math.round((viewport.width - rect.w) / 2),
      y: Math.round((viewport.height - rect.h) / 2)
    });
  }
  function requestSize(id, next) {
    if (sizeFrozen.has(id)) return;
    const widget = widgetOf(id);
    if (widget === void 0 || widget.presentation !== "card") return;
    const now = Date.now();
    const calls = (sizeCalls.get(id) ?? []).filter((t) => now - t < 500);
    calls.push(now);
    sizeCalls.set(id, calls);
    if (calls.length > 3) {
      sizeFrozen.add(id);
      deps.onError?.(
        `[dshp-widget-kit] \u7EC4\u4EF6\u300C${id}\u300D\u5728 500ms \u5185\u8FDE\u7EED\u8BF7\u6C42\u6539\u5C3A\u5BF8\uFF08\u7591\u4F3C\u5C3A\u5BF8\u56DE\u73AF\uFF09\uFF0C\u5DF2\u51BB\u7ED3\u5B83\u7684\u81EA\u52A8\u6539\u5C3A\u5BF8\u3002\u8BF7\u68C0\u67E5 content.render \u662F\u5426\u6839\u636E\u672C\u6B21 size \u53C8\u8C03\u7528\u4E86 setSize\u3002`
      );
      return;
    }
    resizeTo(id, next);
  }
  function sizeClassFor(widget, rect) {
    const box = contentBox(rect);
    const breakpoints = widget.card?.breakpoints ?? SPEC_DEFAULTS.breakpoints;
    return sizeClassOf(box.width, breakpoints);
  }
  function setTrayOrder(id, delta) {
    const next = moveInOrder(state.tray.order, id, delta);
    state = { ...state, tray: { ...state.tray, order: next } };
    persist();
    publish();
  }
  function setOrder(order) {
    const known = new Set(registry.keys());
    const next = order.filter((id) => known.has(id));
    for (const id of registry.keys()) {
      if (!next.includes(id)) next.push(id);
    }
    state = { ...state, tray: { ...state.tray, order: next } };
    persist();
    publish();
  }
  function resetTrayLayout() {
    state = {
      ...state,
      tray: { order: sortedWidgets().map((widget) => widget.id), hidden: [] }
    };
    persist();
    publish();
  }
  function setHidden(id, hidden) {
    const next = setHiddenInList(state.tray.hidden, id, hidden);
    state = { ...state, tray: { ...state.tray, hidden: next } };
    persist();
    publish();
  }
  async function setPrefs(patch, options) {
    const before = prefs;
    prefs = { ...prefs, ...patch };
    publish();
    if (options?.save === false) return { ok: true };
    if (deps.savePrefs === void 0) return { ok: true };
    const result = await deps.savePrefs(prefs);
    if (!result.ok) {
      prefs = before;
      publish();
      return result.error === void 0 ? { ok: false } : { ok: false, error: result.error };
    }
    return { ok: true };
  }
  function applyPrefs(next) {
    prefs = { ...next };
    snapshot = { ...snapshot, ready: true };
    publish();
  }
  function pruneOrphans() {
    const known = [...registry.keys()];
    const isKnown = (id) => known.includes(id);
    let removed = 0;
    for (const id of Object.keys(state.cards)) {
      if (isKnown(id)) continue;
      state = pruneId(state, id);
      removed += 1;
    }
    if (removed > 0) {
      state = {
        ...state,
        tray: {
          order: state.tray.order.filter(isKnown),
          hidden: state.tray.hidden.filter(isKnown)
        },
        disabled: state.disabled.filter(isKnown)
      };
      persist();
    }
    if (state.popoverId !== null && !isKnown(state.popoverId)) {
      state = { ...state, popoverId: null, popoverOrigin: null };
    }
    if (transientId !== null && !isKnown(transientId)) setTransientTarget(null, null);
    setZOrder(state.zOrder.filter(isKnown), false);
    publish();
    return removed;
  }
  function resetLocal() {
    saver.cancel();
    const ok = clearState(deps.storage);
    state = emptyState();
    cancelAllHoverTimers();
    setTransientTarget(null, null);
    clearLive();
    for (const key of Object.keys(badges)) delete badges[key];
    publish();
    notifyLive();
    return ok;
  }
  function setViewport(next) {
    const width = Number.isFinite(next.width) && next.width > 0 ? Math.round(next.width) : viewport.width;
    const height = Number.isFinite(next.height) && next.height > 0 ? Math.round(next.height) : viewport.height;
    if (width === viewport.width && height === viewport.height) return;
    viewport = { width, height };
    let changed = false;
    const nextCards = { ...state.cards };
    for (const [id, card] of Object.entries(state.cards)) {
      const widget = widgetOf(id);
      if (widget === void 0) continue;
      const size = card.minimized ? collapsedSize(id) : { w: card.w, h: card.h };
      const visual = { ...card, ...size };
      const clamped = clampRect(visual, constraintsFor(widget), viewport);
      const placed = card.minimized ? { ...clamped, w: card.w, h: card.h } : clamped;
      if (isSameRect(card, placed)) continue;
      nextCards[id] = { ...card, ...placed };
      changed = true;
    }
    if (changed) {
      state = { ...state, cards: nextCards };
      persist();
    }
    if (live !== null) {
      const widget = widgetOf(live.id);
      if (widget !== void 0) {
        setLiveState({ ...live, rect: clampRect(live.rect, constraintsFor(widget), viewport) });
      }
    }
    publish();
  }
  function setSession(next) {
    if (sessionId === next) return;
    const firstBinding = sessionId === null;
    sessionId = next;
    if (firstBinding) {
      publish();
      return;
    }
    let changed = false;
    cancelAllHoverTimers();
    if (state.popoverId !== null) {
      setPinnedTarget(null, null);
      changed = true;
    }
    if (transientId !== null) {
      setTransientTarget(null, null);
      changed = true;
    }
    const nextCards = { ...state.cards };
    for (const [id, card] of Object.entries(state.cards)) {
      if (!card.open || !registry.has(id)) continue;
      nextCards[id] = { ...card, open: false, minimized: false };
      changed = true;
    }
    setZOrder([], false);
    if (changed) {
      state = { ...state, cards: nextCards };
      persist();
      publish();
    }
  }
  function setBadge(id, badge) {
    const before = badges[id] ?? null;
    if (JSON.stringify(before) === JSON.stringify(badge)) return;
    badges[id] = badge;
    publish();
  }
  publish();
  return {
    specVersion: SPEC_VERSION,
    frameworkVersion: FRAMEWORK_VERSION,
    register,
    list,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open,
    close,
    toggle,
    isOpen,
    minimize,
    restore,
    setEnabled,
    isEnabled,
    setLocked,
    isLocked,
    getSnapshot: () => snapshot,
    subscribeLive(listener) {
      liveListeners.add(listener);
      return () => {
        liveListeners.delete(listener);
      };
    },
    getLive: () => live,
    getLiveFor: (id) => live !== null && live.id === id ? live : null,
    getLiveSnap: () => liveSnapView,
    beginLive,
    setLive,
    commitLive,
    cancelLive,
    raise(id) {
      raiseOrder(id);
      publish();
    },
    toggleMinimize,
    nudge,
    nudgeResize,
    requestSize,
    resizeTo,
    center,
    sizeClassOf: sizeClassFor,
    contentSize: (rect) => contentBox(rect),
    rectOf,
    visualRectOf,
    capsuleWidthOf,
    reportCapsuleNeed,
    constraintsOf: constraintsFor,
    viewport: () => viewport,
    setViewport,
    setSession,
    getSession: () => sessionId,
    setAnchor: (id, el) => {
      const before = anchors.get(id) ?? null;
      if (el === null) anchors.delete(id);
      else anchors.set(id, el);
      if (before === el) return;
      if (el === null || lastAnchors.get(id) === el) return;
      lastAnchors.set(id, el);
      publish();
    },
    getAnchor: (id) => anchors.get(id) ?? null,
    setBadge,
    setTrayOrder,
    setOrder,
    resetTrayLayout,
    setHidden,
    setPrefs,
    applyPrefs,
    pruneOrphans,
    resetLocal,
    saveNow() {
      saver.flush();
    },
    scheduleInterval(callback, ms) {
      if (deps.interval !== void 0) return deps.interval(callback, ms);
      const handle = setInterval(callback, ms);
      return () => {
        clearInterval(handle);
      };
    },
    scheduleTimeout(callback, ms) {
      if (deps.timeout !== void 0) return deps.timeout(callback, ms);
      const handle = setTimeout(callback, ms);
      return () => {
        clearTimeout(handle);
      };
    },
    hoverEnter,
    hoverLeave
  };
}
function createWidgetsService(runtime) {
  return {
    specVersion: runtime.specVersion,
    frameworkVersion: runtime.frameworkVersion,
    register: (descriptor) => runtime.register(descriptor),
    list: () => runtime.list(),
    subscribe: (listener) => runtime.subscribe(listener),
    open: (id) => {
      runtime.open(id);
    },
    close: (id) => {
      runtime.close(id);
    },
    toggle: (id) => {
      runtime.toggle(id);
    },
    isOpen: (id) => runtime.isOpen(id),
    minimize: (id) => {
      runtime.minimize(id);
    },
    restore: (id) => {
      runtime.restore(id);
    },
    setEnabled: (id, enabled) => {
      runtime.setEnabled(id, enabled);
    },
    isEnabled: (id) => runtime.isEnabled(id),
    setLocked: (id, locked) => {
      runtime.setLocked(id, locked);
    },
    isLocked: (id) => runtime.isLocked(id)
  };
}

// src/client/widgets/box.tsx
var import_dsh_client_ui_primitives7 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime10 = require("react/jsx-runtime");
var BOX_WIDGET_ID = "dshp-widget-kit:box";
function BoxView({ runtime }) {
  const snapshot = useFramework(runtime);
  const cards = snapshot.widgets.filter((widget) => widget.presentation === "card" && widget.listedInBox);
  const openCount = cards.filter((widget) => runtime.isOpen(widget.id)).length;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: styles_module_css_default.box, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: styles_module_css_default.boxHead, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: styles_module_css_default.boxHint, children: "\u70B9\u300C\u6253\u5F00\u300D\u5F39\u51FA\u4E3A\u53EF\u62D6\u52A8\u5361\u7247\uFF0C\u4F4D\u7F6E\u4E0E\u5C3A\u5BF8\u4F1A\u8BB0\u4F4F\u3002" }) }),
    cards.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: styles_module_css_default.boxEmpty, children: [
      "\u8FD8\u6CA1\u6709\u5361\u7247\u58F0\u660E\u6536\u5F55\u3002\u5361\u7247\u9ED8\u8BA4\u4E0D\u8FDB\u8FD9\u4E2A\u83DC\u5355\uFF1A\u5199 ",
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("code", { children: "listedInBox: true" }),
      "\uFF08\u5E76\u53EF\u540C\u65F6\u5199",
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("code", { children: "trayIcon: false" }),
      "\uFF09\u624D\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: styles_module_css_default.boxList, children: cards.map((widget) => {
      const title = resolveText(widget.title, widget.id);
      const open = runtime.isOpen(widget.id);
      return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
        "div",
        {
          className: styles_module_css_default.boxRow,
          "data-box-widget": widget.id,
          "data-open": open ? "1" : "0",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: styles_module_css_default.boxDot }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: styles_module_css_default.boxLabel, title: `${title} \xB7 ${widget.id}`, children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              import_dsh_client_ui_primitives7.Button,
              {
                variant: "ghost",
                size: "sm",
                onClick: () => {
                  runtime.toggle(widget.id);
                },
                children: open ? "\u6536\u8D77" : "\u6253\u5F00"
              }
            )
          ]
        },
        widget.id
      );
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: styles_module_css_default.boxFoot, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: styles_module_css_default.boxCount, children: `${String(openCount)} / ${String(cards.length)} \u5DF2\u6253\u5F00` }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        import_dsh_client_ui_primitives7.Button,
        {
          variant: "ghost",
          size: "sm",
          disabled: openCount === 0,
          onClick: () => {
            for (const widget of cards) if (runtime.isOpen(widget.id)) runtime.close(widget.id);
          },
          children: "\u5168\u90E8\u6536\u8D77"
        }
      )
    ] })
  ] });
}
function createBoxWidget(runtime) {
  return {
    id: BOX_WIDGET_ID,
    title: "\u7EC4\u4EF6\u7BB1",
    subtitle: "\u81EA\u7531\u5361\u7247\u7684\u7EDF\u4E00\u5165\u53E3",
    icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(BoxGlyph, {}),
    order: 95,
    presentation: "popover",
    // 活动栏文字扩展点：图标旁边压两个字（最多 6 个）
    tray: { label: "\u7EC4\u4EF6\u7BB1" },
    popover: { trigger: "click", width: 320 },
    content: {
      title: "\u7EC4\u4EF6\u7BB1",
      render: () => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(BoxView, { runtime })
    }
  };
}

// src/client/widgets/clock.tsx
var import_react8 = require("react");
var import_jsx_runtime11 = require("react/jsx-runtime");
var CLOCK_WIDGET_ID = "dshp-widget-kit:clock";
function pad(value) {
  return value < 10 ? `0${String(value)}` : String(value);
}
function ClockView({ props }) {
  const [now, setNow] = (0, import_react8.useState)(() => /* @__PURE__ */ new Date());
  (0, import_react8.useEffect)(() => {
    const timer = setInterval(() => {
      setNow(/* @__PURE__ */ new Date());
    }, 1e3);
    return () => {
      clearInterval(timer);
    };
  }, []);
  const data = props.data;
  const sizeClass = props.sizeClass;
  const offset = data?.offsetMinutes ?? -now.getTimezoneOffset();
  const zone = data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: styles_module_css_default.clock, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: styles_module_css_default.clockTime, "data-size": sizeClass, children: [
      pad(now.getHours()),
      ":",
      pad(now.getMinutes()),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { style: { fontSize: "0.45em" }, children: [
        ":",
        pad(now.getSeconds())
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: styles_module_css_default.clockMeta, children: now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" }) }),
    sizeClass !== "compact" && /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: styles_module_css_default.clockRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: styles_module_css_default.clockLabel, children: zone }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: styles_module_css_default.clockLabel, children: [
        "UTC",
        offset >= 0 ? "+" : "\u2212",
        String(Math.abs(Math.round(offset / 60)))
      ] })
    ] }),
    sizeClass === "wide" && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: styles_module_css_default.clockRow, children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: styles_module_css_default.clockLabel, children: [
      "\u5185\u5BB9\u76D2 ",
      props.size === null ? "\u2014" : `${String(props.size.width)}\xD7${String(props.size.height)}`,
      " \xB7 \u6846\u67B6 v",
      FRAMEWORK_VERSION
    ] }) }),
    props.minimized && /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: styles_module_css_default.clockMeta, children: "\u5DF2\u6700\u5C0F\u5316" })
  ] });
}
var clockWidget = {
  id: CLOCK_WIDGET_ID,
  title: "\u65F6\u949F",
  subtitle: "\u672C\u673A\u65F6\u95F4\u4E0E\u65F6\u533A",
  icon: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ClockGlyph, {}),
  order: 100,
  presentation: "card",
  tray: {
    // 活动栏文字扩展点：图标旁边直接显示 HH:MM（像系统状态栏的时钟），所以不再另放角标
    label: () => {
      const now = /* @__PURE__ */ new Date();
      return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
  },
  content: {
    title: "\u65F6\u949F",
    load: async () => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offsetMinutes: -(/* @__PURE__ */ new Date()).getTimezoneOffset()
    }),
    refreshMs: 3e4,
    render: (props) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ClockView, { props })
  },
  card: {
    defaultSize: { w: 320, h: 220 },
    minSize: { w: 240, h: 140 },
    sizeClassBreakpoints: { compact: 300, wide: 420 }
  }
};

// src/client/widgets/diagnostics.tsx
var import_dsh_client_ui_primitives8 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime12 = require("react/jsx-runtime");
var DIAGNOSTICS_WIDGET_ID = "dshp-widget-kit:registry";
function DiagnosticsView({
  runtime,
  props
}) {
  const snapshot = useFramework(runtime);
  const compact = props.sizeClass === "compact";
  const disabled = new Set(snapshot.layout.disabled);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.diag, children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.diagSummary, children: [
      "\u5DF2\u6CE8\u518C ",
      String(snapshot.widgets.length),
      " \u4E2A\u7EC4\u4EF6 \xB7 \u6253\u5F00",
      " ",
      String(Object.values(snapshot.layout.cards).filter((card) => card.open).length),
      " \u5F20\u5361\u7247 \xB7 v",
      FRAMEWORK_VERSION,
      snapshot.degraded ? " \xB7 \u672C\u673A\u5E03\u5C40\u672A\u6301\u4E45\u5316" : ""
    ] }),
    snapshot.widgets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.diagEmpty, children: "\u8FD8\u6CA1\u6709\u4EFB\u4F55\u63D2\u4EF6\u6CE8\u518C\u7EC4\u4EF6\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.diagList, children: snapshot.widgets.map((widget) => {
      const enabled = !disabled.has(widget.id);
      return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.diagRow, "data-disabled": enabled ? "false" : "true", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.diagMain, children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.diagId, children: widget.id }),
          !compact && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: styles_module_css_default.diagMeta, children: [
            "\u6765\u6E90 ",
            widget.owner,
            " \xB7 ",
            widget.presentation,
            widget.tray.badge === null ? "" : " \xB7 \u6709\u5FBD\u6807",
            widget.presentation === "card" ? ` \xB7 ${String(widget.card?.defaultSize.w ?? 0)}\xD7${String(widget.card?.defaultSize.h ?? 0)}` : "",
            enabled ? "" : " \xB7 \u5DF2\u7981\u7528"
          ] })
        ] }),
        !compact && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.diagActions, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
          import_dsh_client_ui_primitives8.Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => {
              runtime.setEnabled(widget.id, !enabled);
            },
            children: enabled ? "\u7981\u7528" : "\u542F\u7528"
          }
        ) })
      ] }, widget.id);
    }) }),
    props.error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.diagError, children: [
      "\u6570\u636E\u5237\u65B0\u5931\u8D25\uFF1A",
      props.error.message
    ] })
  ] });
}
function createDiagnosticsWidget(runtime) {
  return {
    id: DIAGNOSTICS_WIDGET_ID,
    title: "\u7EC4\u4EF6\u8BCA\u65AD",
    subtitle: "\u5DF2\u6CE8\u518C\u7684\u7EC4\u4EF6\u4E0E\u6846\u67B6\u72B6\u6001",
    icon: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(RegistryGlyph, {}),
    order: 110,
    presentation: "card",
    // 调试用卡片：不占活动栏图标，由「组件箱」收录（trayIcon 只允许卡片这么写；
    // 而「被组件箱收录」必须自己声明 —— listedInBox 默认 false，框架不替别人决定入口）
    trayIcon: false,
    listedInBox: true,
    tray: {
      badge: () => {
        const count = runtime.list().length;
        return { text: String(count), tone: "info", title: `${String(count)} \u4E2A\u5DF2\u6CE8\u518C\u7EC4\u4EF6` };
      },
      badgeIntervalMs: 3e4
    },
    content: {
      title: "\u7EC4\u4EF6\u8BCA\u65AD",
      load: async () => ({
        count: runtime.list().length,
        openCards: Object.values(runtime.getSnapshot().layout.cards).filter((card) => card.open).length,
        frameworkVersion: runtime.frameworkVersion
      }),
      refreshMs: 1e4,
      render: (props) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(DiagnosticsView, { runtime, props })
    },
    card: {
      defaultSize: { w: 420, h: 300 },
      minSize: { w: 280, h: 180 },
      sizeClassBreakpoints: { compact: 340, wide: 520 }
    }
  };
}

// src/client/widgets/quick-settings.tsx
var import_dsh_client_ui_primitives9 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react9 = require("react");
var import_jsx_runtime13 = require("react/jsx-runtime");
var QUICK_SETTINGS_WIDGET_ID = "dshp-widget-kit:quick";
var ICON_LIMITS = [2, 3, 4, 5, 6];
var BADGE_INTERVALS = [
  { ms: 5e3, label: "5 \u79D2" },
  { ms: 15e3, label: "15 \u79D2" },
  { ms: 3e4, label: "30 \u79D2" },
  { ms: 6e4, label: "1 \u5206\u949F" },
  { ms: 3e5, label: "5 \u5206\u949F" }
];
function Segments({
  label,
  value,
  options,
  disabled,
  onPick
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: styles_module_css_default.quickSection, children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: styles_module_css_default.quickLabel, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: styles_module_css_default.seg, role: "group", "aria-label": label, children: options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
      "button",
      {
        type: "button",
        className: styles_module_css_default.segBtn + (option.value === value ? " " + styles_module_css_default.segBtnActive : ""),
        "aria-pressed": option.value === value,
        disabled,
        onClick: () => {
          onPick(option.value);
        },
        children: option.label
      },
      String(option.value)
    )) })
  ] });
}
function QuickSettingsView({ runtime }) {
  const snapshot = useFramework(runtime);
  const prefs = snapshot.prefs;
  const [busy, setBusy] = (0, import_react9.useState)(false);
  const [error, setError] = (0, import_react9.useState)(null);
  const [note, setNote] = (0, import_react9.useState)(null);
  const save = (0, import_react9.useCallback)(
    (patch) => {
      setBusy(true);
      setError(null);
      setNote(null);
      void runtime.setPrefs(patch).then((result) => {
        setBusy(false);
        if (!result.ok) {
          setError(result.error ?? "\u4FDD\u5B58\u5931\u8D25\uFF0C\u914D\u7F6E\u672A\u6539\u52A8");
          return;
        }
        setNote("\u5DF2\u4FDD\u5B58");
      });
    },
    [runtime]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: styles_module_css_default.quick, children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: styles_module_css_default.quickSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: styles_module_css_default.quickFoot, children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: styles_module_css_default.quickLabel, children: "\u4F1A\u8BDD\u9876\u90E8\u6258\u76D8" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          import_dsh_client_ui_primitives9.Switch,
          {
            checked: prefs.trayEnabled,
            disabled: busy,
            label: "\u663E\u793A\u4F1A\u8BDD\u9876\u90E8\u6258\u76D8",
            onChange: (next) => {
              save({ trayEnabled: next });
            }
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: styles_module_css_default.quickNote, children: "\u5173\u6389\u6258\u76D8\u4F1A\u8FDE\u540C\u5361\u7247\u4E00\u8D77\u6536\u8D77\uFF0C\u968F\u65F6\u53EF\u5728\u8FD9\u91CC\u5F00\u56DE\u6765\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
      Segments,
      {
        label: "\u53EF\u89C1\u56FE\u6807\u4E0A\u9650",
        value: prefs.maxVisibleIcons,
        options: ICON_LIMITS.map((value) => ({ value, label: String(value) })),
        disabled: busy,
        onPick: (next) => {
          save({ maxVisibleIcons: next });
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
      Segments,
      {
        label: "\u5FBD\u6807\u5237\u65B0\u95F4\u9694",
        value: prefs.badgeIntervalMs,
        options: BADGE_INTERVALS.map((item) => ({ value: item.ms, label: item.label })),
        disabled: busy,
        onPick: (next) => {
          save({ badgeIntervalMs: next });
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: styles_module_css_default.quickSection, children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: styles_module_css_default.quickFoot, children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: styles_module_css_default.quickLabel, children: "\u672C\u673A\u5E03\u5C40" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          import_dsh_client_ui_primitives9.Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => {
              const ok = runtime.resetLocal();
              setError(null);
              setNote(ok ? "\u5DF2\u6E05\u7A7A\uFF1A\u6258\u76D8\u987A\u5E8F\u4E0E\u5361\u7247\u4F4D\u7F6E\u56DE\u5230\u9ED8\u8BA4" : "\u672C\u673A\u5E03\u5C40\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u5DF2\u7528\u9ED8\u8BA4\u5E03\u5C40");
            },
            children: "\u6E05\u7A7A"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: styles_module_css_default.quickNote, children: "\u53EA\u5F71\u54CD\u8FD9\u53F0\u6D4F\u89C8\u5668\uFF08localStorage\uFF09\uFF0C\u4E0D\u52A8 settings.yaml\u3002" })
    ] }),
    error !== null && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: styles_module_css_default.quickError, children: error }),
    error === null && note !== null && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: styles_module_css_default.quickNote, children: note })
  ] });
}
function createQuickSettingsWidget(runtime) {
  return {
    id: QUICK_SETTINGS_WIDGET_ID,
    title: "\u5FEB\u901F\u8BBE\u7F6E",
    subtitle: "\u6258\u76D8\u3001\u5FBD\u6807\u4E0E\u672C\u673A\u5E03\u5C40",
    icon: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(SlidersGlyph, {}),
    order: 120,
    presentation: "popover",
    popover: { trigger: "click", width: 300, persistent: true },
    content: {
      title: "\u5FEB\u901F\u8BBE\u7F6E",
      render: (props) => {
        void props;
        return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(QuickSettingsView, { runtime });
      }
    }
  };
}

// src/client/widgets/status.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
var STATUS_WIDGET_ID = "dshp-widget-kit:status";
function StatusView({ runtime }) {
  const snapshot = useFramework(runtime);
  const openCards = Object.values(snapshot.layout.cards).filter(
    (card) => card.open && !card.minimized
  ).length;
  const hidden = snapshot.layout.tray.hidden.length;
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: styles_module_css_default.statusRoot, children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: styles_module_css_default.statusGrid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: styles_module_css_default.statusCell, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusValue, children: snapshot.widgets.length }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusKey, children: "\u5DF2\u6CE8\u518C\u7EC4\u4EF6" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: styles_module_css_default.statusCell, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusValue, children: openCards }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusKey, children: "\u6253\u5F00\u7684\u5361\u7247" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: styles_module_css_default.statusCell, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusValue, children: hidden }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusKey, children: "\u5DF2\u9690\u85CF\u56FE\u6807" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: styles_module_css_default.statusCell, children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusValue, children: snapshot.degraded ? "\u5185\u5B58" : "\u672C\u673A" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: styles_module_css_default.statusKey, children: "\u5E03\u5C40\u5B58\u50A8" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("span", { className: styles_module_css_default.statusHint, children: [
      "\u6846\u67B6 v",
      runtime.frameworkVersion,
      " \xB7 \u5951\u7EA6 SPEC v",
      String(runtime.specVersion),
      " \u2014\u2014 \u60AC\u505C\u5C55\u5F00\uFF0C\u79FB\u5F00\u81EA\u52A8\u6536\u8D77"
    ] })
  ] });
}
function createStatusWidget(runtime) {
  return {
    id: STATUS_WIDGET_ID,
    title: "\u72B6\u6001\u901F\u89C8",
    subtitle: "\u7EC4\u4EF6\u6570 / \u5361\u7247\u6570 / \u5B58\u50A8\u72B6\u6001",
    icon: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(PulseGlyph, {}),
    order: 130,
    presentation: "popover",
    popover: { trigger: "hover", width: 260, header: false, padding: 0 },
    content: {
      render: () => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(StatusView, { runtime })
    }
  };
}

// src/client/index.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
var inject = ["slots", "timer"];
var TRAY_ORDER = 30;
var LAYER_ORDER = 10;
var SETTINGS_ORDER = 32;
var SETTINGS_NS = "dshp-widget-kit";
var DEFAULT_PREFS = {
  trayEnabled: true,
  maxVisibleIcons: SPEC_DEFAULTS.maxVisibleIcons,
  badgeIntervalMs: SPEC_DEFAULTS.badgeIntervalMs,
  hoverPreview: true,
  referenceWidgets: true,
  // 外观默认值：与 src/host/config.ts 的 DEFAULT_CONFIG 必须一致
  // （scripts/check-spec-drift.mjs 会比对这几个数字）
  cardOpacity: 0.7,
  cardBlur: 5,
  cardBorder: "auto",
  cardRadius: "auto",
  motionMs: 300
};
function readStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}
function readViewport() {
  try {
    if (typeof window === "undefined") return { width: 1280, height: 800 };
    return { width: window.innerWidth, height: window.innerHeight };
  } catch {
    return { width: 1280, height: 800 };
  }
}
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  const logError = (message, error) => {
    try {
      console.error(message, error ?? "");
    } catch {
    }
  };
  const notice = (message) => {
    try {
      console.warn(`[dshp-widget-kit] ${message}`);
    } catch {
    }
  };
  const runtime = createWidgetRuntime({
    prefs: DEFAULT_PREFS,
    storage: readStorage(),
    viewport: readViewport(),
    interval: (callback, ms) => ctx.interval(callback, ms),
    timeout: (callback, ms) => ctx.timeout(callback, ms),
    savePrefs: async (prefs) => {
      try {
        const result = await saveConfig(prefs);
        return result.ok ? { ok: true } : { ok: false, error: result.error ?? "\u5BBF\u4E3B\u62D2\u7EDD\u4E86\u8FD9\u6B21\u5199\u5165" };
      } catch (error) {
        return { ok: false, error: `\u5199\u5165\u914D\u7F6E\u5931\u8D25\uFF1A${String(error?.message ?? error)}` };
      }
    },
    onNotice: notice,
    onError: logError
  });
  try {
    ctx.effect(
      () => ctx.reflect.provide("widgets", createWidgetsService(runtime)),
      "dshp-widget-kit: widgets service"
    );
  } catch (error) {
    logError("[dshp-widget-kit] \u53D1\u5E03 widgets \u670D\u52A1\u5931\u8D25\uFF0C\u522B\u7684\u63D2\u4EF6\u5C06\u65E0\u6CD5\u6CE8\u518C\u7EC4\u4EF6\uFF1A", error);
  }
  try {
    ctx.effect(() => runtime.register(createBoxWidget(runtime)), "dshp-widget-kit: box widget");
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u300C\u7EC4\u4EF6\u7BB1\u300D\u5931\u8D25\uFF1A", error);
  }
  const referenceDisposers = [];
  const syncReferenceWidgets = (enabled) => {
    while (referenceDisposers.length > 0) {
      const dispose = referenceDisposers.pop();
      try {
        dispose?.();
      } catch (error) {
        logError("[dshp-widget-kit] \u5378\u8F7D\u53C2\u8003\u7EC4\u4EF6\u5931\u8D25\uFF1A", error);
      }
    }
    if (!enabled) return;
    try {
      referenceDisposers.push(runtime.register(clockWidget));
    } catch (error) {
      logError("[dshp-widget-kit] \u6CE8\u518C\u53C2\u8003\u7EC4\u4EF6\u300C\u65F6\u949F\u300D\u5931\u8D25\uFF1A", error);
    }
    try {
      referenceDisposers.push(runtime.register(createDiagnosticsWidget(runtime)));
    } catch (error) {
      logError("[dshp-widget-kit] \u6CE8\u518C\u53C2\u8003\u7EC4\u4EF6\u300C\u7EC4\u4EF6\u8BCA\u65AD\u300D\u5931\u8D25\uFF1A", error);
    }
    try {
      referenceDisposers.push(runtime.register(createQuickSettingsWidget(runtime)));
    } catch (error) {
      logError("[dshp-widget-kit] \u6CE8\u518C\u53C2\u8003\u7EC4\u4EF6\u300C\u5FEB\u901F\u8BBE\u7F6E\u300D\u5931\u8D25\uFF1A", error);
    }
    try {
      referenceDisposers.push(runtime.register(createStatusWidget(runtime)));
    } catch (error) {
      logError("[dshp-widget-kit] \u6CE8\u518C\u53C2\u8003\u7EC4\u4EF6\u300C\u72B6\u6001\u901F\u89C8\u300D\u5931\u8D25\uFF1A", error);
    }
  };
  try {
    ctx.effect(
      () => () => {
        while (referenceDisposers.length > 0) {
          const dispose = referenceDisposers.pop();
          try {
            dispose?.();
          } catch {
          }
        }
      },
      "dshp-widget-kit: reference widgets teardown"
    );
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u53C2\u8003\u7EC4\u4EF6\u6E05\u7406\u5931\u8D25\uFF1A", error);
  }
  try {
    ctx.effect(() => {
      let cancelled = false;
      void fetchState().then((state) => {
        if (cancelled) return;
        const config = state.config ?? DEFAULT_PREFS;
        runtime.applyPrefs(config);
        syncReferenceWidgets(config.referenceWidgets);
      }).catch((error) => {
        if (cancelled) return;
        runtime.applyPrefs(DEFAULT_PREFS);
        syncReferenceWidgets(true);
        logError("[dshp-widget-kit] \u8BFB\u53D6\u6846\u67B6\u504F\u597D\u5931\u8D25\uFF08Host \u534A\u53EF\u80FD\u6CA1\u6302\u8F7D\uFF09\uFF0C\u672C\u6B21\u7528\u9ED8\u8BA4\u503C\uFF1A", error);
      });
      return () => {
        cancelled = true;
      };
    }, "dshp-widget-kit: framework prefs");
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u504F\u597D\u8BFB\u53D6\u5931\u8D25\uFF1A", error);
  }
  try {
    ctx.effect(
      () => ctx.timeout(() => {
        if (runtime.getSnapshot().ready) return;
        runtime.applyPrefs(DEFAULT_PREFS);
        syncReferenceWidgets(DEFAULT_PREFS.referenceWidgets);
        notice("\u8BFB\u53D6\u6846\u67B6\u504F\u597D\u8D85\u65F6\uFF0C\u5DF2\u7528\u9ED8\u8BA4\u503C\u8D77\u6B65\uFF08\u8BBE\u7F6E\u9875\u4ECD\u53EF\u4FEE\u6539\uFF09");
      }, 3e3),
      "dshp-widget-kit: prefs timeout fallback"
    );
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u504F\u597D\u515C\u5E95\u5931\u8D25\uFF1A", error);
  }
  try {
    ctx.effect(() => {
      if (typeof window === "undefined") return () => {
      };
      const onResize = () => {
        runtime.setViewport(readViewport());
      };
      window.addEventListener("resize", onResize);
      return () => {
        window.removeEventListener("resize", onResize);
      };
    }, "dshp-widget-kit: viewport tracking");
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u89C6\u53E3\u76D1\u542C\u5931\u8D25\uFF1A", error);
  }
  const badges = createBadgeScheduler({
    runtime,
    timeout: (callback, ms) => ctx.timeout(callback, ms),
    onError: logError
  });
  try {
    ctx.effect(() => ctx.interval(() => badges.tick(), 1e3), "dshp-widget-kit: badge tick");
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u5FBD\u6807\u8C03\u5EA6\u5931\u8D25\uFF08\u56FE\u6807\u5C06\u6CA1\u6709\u89D2\u6807\uFF09\uFF1A", error);
  }
  try {
    ctx.effect(() => () => badges.dispose(), "dshp-widget-kit: badge dispose");
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u5FBD\u6807\u6E05\u7406\u5931\u8D25\uFF1A", error);
  }
  try {
    ctx.effect(
      () => slots.inject(
        "conversation.session.header.utilities",
        () => slots.register(
          {
            name: "conversation.session.header.utilities",
            id: "dshp-widget-kit-tray",
            order: TRAY_ORDER,
            label: "\u5C0F\u7EC4\u4EF6"
          },
          (props) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Tray, { runtime, sessionId: props.sessionId ?? null })
        )
      ),
      "dshp-widget-kit: session header tray"
    );
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u4F1A\u8BDD\u9876\u90E8\u6258\u76D8\u5931\u8D25\uFF0C\u6240\u6709\u7EC4\u4EF6\u56FE\u6807\u90FD\u4E0D\u4F1A\u51FA\u73B0\uFF1A", error);
  }
  try {
    ctx.effect(
      () => slots.inject(
        "shell.overlay",
        () => slots.register(
          { name: "shell.overlay", id: "dshp-widget-kit-cards", order: LAYER_ORDER, label: "\u5C0F\u7EC4\u4EF6\u5361\u7247" },
          () => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(CardLayer, { runtime, onError: logError })
        )
      ),
      "dshp-widget-kit: card layer"
    );
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u5361\u7247\u5C42\u5931\u8D25\uFF0C\u5361\u7247\u4E0E\u6D6E\u5C42\u90FD\u65E0\u5904\u6E32\u67D3\uFF1A", error);
  }
  try {
    ctx.effect(
      () => slots.inject(
        "settings.section",
        () => slots.register(
          { name: "settings.section", id: SETTINGS_NS, order: SETTINGS_ORDER, label: "\u5C0F\u7EC4\u4EF6" },
          () => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
            SettingsSection,
            {
              runtime,
              onPrefsApplied: (prefs) => {
                syncReferenceWidgets(prefs.referenceWidgets);
              }
            }
          )
        )
      ),
      "dshp-widget-kit: settings section"
    );
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF0C\u8BBE\u7F6E\u9875\u770B\u4E0D\u5230\u5C0F\u7EC4\u4EF6\u914D\u7F6E\uFF1A", error);
  }
  try {
    ctx.effect(
      () => () => {
        runtime.saveNow();
      },
      "dshp-widget-kit: flush local layout"
    );
  } catch (error) {
    logError("[dshp-widget-kit] \u6CE8\u518C\u843D\u76D8\u6E05\u7406\u5931\u8D25\uFF1A", error);
  }
}
return module.exports; } });
