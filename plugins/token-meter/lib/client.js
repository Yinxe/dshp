window.__ModuleLoader__.load({ id: "@dshp/token-meter", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);

// <define:__DSHP_TOKEN_METER_PKG__>
var define_DSHP_TOKEN_METER_PKG_default = { name: "@dshp/token-meter", version: "0.15.0", repo: "github.com/Yinxe/deepseek-harness-plugins/tree/main/plugins/token-meter" };

// src/client/CenterView.tsx
var import_react = require("react");

// dsh-css-module:dsh-css:src/client/styles.module.css.mjs
var css = '.i1tZMq_page{color:var(--dsw-alias-label-primary);flex-direction:column;max-width:820px;font-size:13px;line-height:1.6;display:flex;container:i1tZMq_tm/inline-size}.i1tZMq_title{color:var(--dsw-alias-label-primary);margin:0 0 4px;font-size:15px;font-weight:600}.i1tZMq_desc{color:var(--dsw-alias-label-secondary);margin:0 0 14px}.i1tZMq_intro{color:var(--dsw-alias-label-tertiary);margin:0 0 4px;font-size:14px;line-height:22px}.i1tZMq_section{flex-direction:column;width:100%;display:flex}.i1tZMq_sectionHead{color:var(--dsw-alias-label-secondary);padding:14px 0 2px;font-size:12px;font-weight:500;line-height:18px}.i1tZMq_row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.i1tZMq_rowWrap{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;align-items:flex-start;gap:8px;padding:16px 0;display:flex}.i1tZMq_section .i1tZMq_row:last-child,.i1tZMq_section .i1tZMq_rowWrap:last-child,.i1tZMq_section .i1tZMq_bar:last-child{border-bottom:none}.i1tZMq_rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.i1tZMq_rowLabel{color:var(--dsw-alias-label-primary);flex:none;font-size:14px;font-weight:400;line-height:22px}.i1tZMq_rowDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.i1tZMq_rowValue{color:var(--dsw-alias-label-primary);text-align:right;justify-content:flex-end;align-items:center;min-width:0;font-size:13px;line-height:20px;display:flex}.i1tZMq_field{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:6px;padding:14px 0;display:flex}.i1tZMq_section>.i1tZMq_field:last-of-type{border-bottom:none}.i1tZMq_fieldHead{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.i1tZMq_fieldLabel{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.i1tZMq_fieldReq{color:var(--dsw-alias-state-warn-label);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent);border-radius:4px;flex:none;padding:0 6px;font-size:10px;line-height:15px}.i1tZMq_fieldOpt{color:var(--dsw-alias-label-tertiary);flex:none;font-size:11px;line-height:16px}.i1tZMq_fieldControl{flex-wrap:wrap;align-items:center;gap:8px;min-width:0;display:flex}.i1tZMq_fieldControl>.i1tZMq_inputWrap{flex:260px;width:auto;min-width:0}.i1tZMq_fieldControl>.i1tZMq_selector{max-width:100%}.i1tZMq_fieldDesc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.i1tZMq_fieldNote{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);border-radius:8px;margin:10px 0 0;padding:8px 10px;font-size:12px;line-height:18px}.i1tZMq_fieldNote b{color:var(--dsw-alias-label-primary);margin-right:4px;font-weight:600}.i1tZMq_inputReadonly{background:var(--dsw-alias-bg-layer-2);cursor:not-allowed;border-style:dashed}.i1tZMq_inputReadonly .i1tZMq_ninput{color:var(--dsw-alias-label-secondary)}.i1tZMq_rowControl{flex:1;justify-content:flex-end;min-width:0;display:flex}.i1tZMq_card{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;margin:0 0 8px;padding:14px 16px}.i1tZMq_btn{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);cursor:pointer;white-space:nowrap;background:0 0;border-radius:8px;flex:none;justify-content:center;align-items:center;gap:6px;padding:6px 12px;font-family:inherit;font-size:13px;display:inline-flex}.i1tZMq_btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-l2))}.i1tZMq_btn:disabled{opacity:.4;cursor:default}.i1tZMq_btnPrimary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff}.i1tZMq_btnDanger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}.i1tZMq_notice{border-radius:8px;margin:0 0 12px;padding:8px 12px;font-size:12.5px}.i1tZMq_noticeErr{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);color:var(--dsw-alias-state-error-primary)}.i1tZMq_noticeEmpty{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}.i1tZMq_noticeWarn{color:var(--dsw-alias-state-warn-label)}.i1tZMq_noticeOk{color:var(--dsw-alias-state-success-primary)}.i1tZMq_hint{color:var(--dsw-alias-label-secondary);font-size:12px}.i1tZMq_menu{flex-direction:column;gap:8px;min-width:0;display:flex}.i1tZMq_menuHead{gap:6px;display:flex}.i1tZMq_menuHint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.i1tZMq_menuList{flex-direction:column;gap:2px;max-height:46vh;display:flex;overflow:auto}.i1tZMq_menuRow{border-radius:8px;align-items:center;gap:8px;min-width:0;padding:5px 6px;display:flex}.i1tZMq_menuRow:hover{background:var(--dsw-alias-bg-layer-2)}.i1tZMq_menuDot{border:1px solid var(--dsw-alias-border-l2);background:0 0;border-radius:50%;flex:none;width:6px;height:6px}.i1tZMq_menuRow[data-open="1"] .i1tZMq_menuDot{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-primary)}.i1tZMq_menuLabel{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:auto;font-size:12px;line-height:18px;overflow:hidden}.i1tZMq_menuBtn{border:1px solid var(--dsw-alias-border-l1);cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border-radius:6px;flex:none;padding:2px 8px;font-family:inherit;font-size:11px;line-height:16px}.i1tZMq_menuBtn:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary)}.i1tZMq_menuBtn:disabled{opacity:.5;cursor:default}.i1tZMq_menuEmpty{color:var(--dsw-alias-label-tertiary);padding:4px 2px;font-size:12px}.i1tZMq_menuFoot{border-top:1px solid var(--dsw-alias-border-l1);justify-content:space-between;align-items:center;gap:8px;padding-top:8px;display:flex}.i1tZMq_menuCount{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px}.i1tZMq_cardHint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}.i1tZMq_mono{font-family:var(--ds-font-family-code)}.i1tZMq_toolbar{flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 8px;display:flex}.i1tZMq_selector{background:var(--dsw-alias-bg-module-platform);height:36px;font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;border:none;border-radius:18px;align-items:center;gap:12px;max-width:100%;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.i1tZMq_selector:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.i1tZMq_selector:disabled{cursor:default;opacity:.4}.i1tZMq_selectorLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.i1tZMq_chevron{flex:none}.i1tZMq_tabs{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;gap:2px;margin:8px 0 4px;padding:2px;display:inline-flex}.i1tZMq_tab{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:8px;padding:4px 14px;font-family:inherit;font-size:13px;line-height:20px}.i1tZMq_tab:hover{color:var(--dsw-alias-label-primary)}.i1tZMq_tabOn{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.i1tZMq_grid{grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px;display:grid}.i1tZMq_statGrid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:8px 0;display:grid}.i1tZMq_stat{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;flex-direction:column;gap:2px;padding:10px 12px;transition:border-color .15s;display:flex;position:relative;overflow:hidden}.i1tZMq_stat:hover{border-color:var(--dsw-alias-state-business-primary)}.i1tZMq_statLabel{color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px}.i1tZMq_statValue{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:17px;font-weight:600;line-height:24px}.i1tZMq_stat[data-tint="1"] .i1tZMq_statValue{background:linear-gradient(100deg, var(--dsw-alias-state-business-primary), color-mix(in srgb, var(--dsw-alias-state-business-primary) 52%, var(--dsw-alias-state-success-primary)));color:#0000;-webkit-background-clip:text;background-clip:text}.i1tZMq_statSub{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:16px;overflow:hidden}.i1tZMq_pop{z-index:50;pointer-events:none;background:var(--dsw-specific-menu);border:1px solid var(--dsw-alias-border-l2);box-shadow:var(--dsw-shadow-lv3);max-width:300px;color:var(--dsw-alias-label-primary);border-radius:12px;padding:10px 12px;font-size:12px;line-height:1.5;position:fixed}.i1tZMq_popTitle{margin-bottom:6px;font-size:12.5px;font-weight:600}.i1tZMq_popRow{white-space:nowrap;align-items:center;gap:6px;margin:2px 0;display:flex}.i1tZMq_popRow .i1tZMq_dot{border-radius:2.5px;flex:none;width:8px;height:8px}.i1tZMq_popK{color:var(--dsw-alias-label-secondary)}.i1tZMq_popV{font-variant-numeric:tabular-nums;margin-left:auto;padding-left:12px}.i1tZMq_popBar{background:var(--dsw-alias-interactive-bg-hover);border-radius:2px;flex:1;min-width:50px;height:4px;display:block;overflow:hidden}.i1tZMq_popFill{border-radius:2px;height:100%;display:block}.i1tZMq_tip,.i1tZMq_tipfixed{background:var(--dsw-specific-menu);border:1px solid var(--dsw-alias-border-l2);box-shadow:var(--dsw-shadow-lv3);pointer-events:none;color:var(--dsw-alias-label-primary);z-index:60;border-radius:8px;max-width:280px;padding:7px 10px;font-size:11.5px;line-height:1.5;position:fixed}.i1tZMq_tipfloat{z-index:500}.i1tZMq_tipAbove{z-index:350}.i1tZMq_tiprow{white-space:nowrap;align-items:center;gap:6px;display:flex}.i1tZMq_tipK{color:var(--dsw-alias-label-secondary)}.i1tZMq_tipV{font-variant-numeric:tabular-nums;font-weight:500}.i1tZMq_dot{background:var(--dsw-alias-state-success-primary);border-radius:3px;flex:none;width:10px;height:10px;display:inline-block}.i1tZMq_dot.i1tZMq_warn{background:var(--dsw-alias-state-warn-primary)}.i1tZMq_dot.i1tZMq_bad{background:var(--dsw-alias-state-error-primary)}.i1tZMq_dot.i1tZMq_off{box-sizing:border-box;border:1.5px solid var(--dsw-alias-state-error-primary);background:0 0}.i1tZMq_muted{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.i1tZMq_chartTitle{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px 8px;margin:0 0 8px;font-size:12.5px;font-weight:600;display:flex}.i1tZMq_chartTitle>span:first-child{text-overflow:ellipsis;white-space:nowrap;flex:auto;min-width:0;overflow:hidden}.i1tZMq_chartWrap{margin:8px 0;overflow-x:auto}.i1tZMq_seg{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;flex-wrap:wrap;gap:2px;padding:2px;display:inline-flex}.i1tZMq_segBtn{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:6px;padding:2px 8px;font-family:inherit;font-size:12px;line-height:18px}.i1tZMq_segBtn:hover{color:var(--dsw-alias-label-primary)}.i1tZMq_segOn{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-business-primary) 40%, transparent)}.i1tZMq_legend{flex-wrap:wrap;align-items:center;gap:4px;margin-top:8px;display:flex}.i1tZMq_cacheRow{color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:5px;margin-top:6px;font-size:11px;line-height:16px;display:flex}.i1tZMq_cacheSep{color:var(--dsw-alias-label-tertiary)}.i1tZMq_peak{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);cursor:default;border-radius:12px;flex-direction:column;gap:6px;margin:0 0 8px;padding:10px 12px;display:flex;position:relative}.i1tZMq_peak:focus{outline:none}.i1tZMq_peak:focus-visible{box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, transparent)}.i1tZMq_peakHead{flex-wrap:wrap;align-items:center;gap:4px 6px;min-width:0;display:flex}.i1tZMq_peakDot{border-radius:50%;flex:none;width:8px;height:8px}.i1tZMq_peakDot.i1tZMq_peak{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 6px var(--dsw-alias-state-warn-primary)}.i1tZMq_peakDot.i1tZMq_valley{background:var(--dsw-alias-state-success-primary)}.i1tZMq_peakTitle{color:var(--dsw-alias-label-primary);white-space:nowrap;flex:none;font-size:12px;font-weight:600}.i1tZMq_peakChip{white-space:nowrap;border-radius:999px;flex:none;padding:0 7px;font-size:10.5px;font-weight:600;line-height:16px}.i1tZMq_peakChip.i1tZMq_peak{color:var(--dsw-alias-state-warn-label);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent)}.i1tZMq_peakChip.i1tZMq_valley{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent)}.i1tZMq_peakTime{text-align:right;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;margin-left:auto;font-size:11px;line-height:16px}.i1tZMq_tipfixed.i1tZMq_peakPop{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, var(--dsw-alias-border-l2));width:252px;max-width:calc(100vw - 16px);padding:9px 11px;font-size:11px;animation:.18s cubic-bezier(.22,.8,.3,1) i1tZMq_tm-peakPopIn;box-shadow:0 14px 34px -10px #0000006b}.i1tZMq_peakPopHead{align-items:center;gap:6px;margin-bottom:6px;font-size:11.5px;font-weight:600;display:flex}.i1tZMq_peakPopDot{border-radius:50%;flex:none;width:7px;height:7px}.i1tZMq_peakPopDot.i1tZMq_peak{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 5px var(--dsw-alias-state-warn-primary)}.i1tZMq_peakPopDot.i1tZMq_valley{background:var(--dsw-alias-state-success-primary)}.i1tZMq_peakPopClock{font-family:var(--ds-font-family-code);font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);margin-left:auto;font-weight:600;animation:.45s i1tZMq_tm-peakTick}.i1tZMq_peakPop .i1tZMq_tipV{font-weight:500}.i1tZMq_peakPopFoot{border-top:1px dashed var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);margin-top:6px;padding-top:6px;font-size:10px;line-height:14px}@keyframes i1tZMq_tm-peakPopIn{0%{opacity:0;transform:translateY(-6px)scale(.97)}}@keyframes i1tZMq_tm-peakTick{0%{opacity:.25;transform:translateY(-4px)}}.i1tZMq_peakBand{gap:1.5px;height:10px;display:flex}.i1tZMq_peakCell{background:var(--dsw-alias-interactive-bg-hover);border-radius:2px;flex:1 1 0;min-width:0}.i1tZMq_peakCell.i1tZMq_on{background:var(--dsw-alias-state-warn-primary);opacity:.85}.i1tZMq_peakCell.i1tZMq_now{outline:1.5px solid var(--dsw-alias-label-primary);outline-offset:-1px}.i1tZMq_peakHint{color:var(--dsw-alias-label-tertiary);font-size:10.5px;line-height:15px}.i1tZMq_peakHint b{color:var(--dsw-alias-label-secondary);font-weight:600}.i1tZMq_modelchip{border:1px solid var(--dsw-alias-border-l1);cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border-radius:999px;align-items:center;gap:5px;max-width:180px;padding:2px 9px;font-family:inherit;font-size:11.5px;line-height:18px;display:inline-flex;position:relative}.i1tZMq_modelchip:hover{border-color:var(--dsw-alias-state-business-primary)}.i1tZMq_modelchip[data-off="1"]{opacity:.38}.i1tZMq_modelchip .i1tZMq_dot{width:8px;height:8px}.i1tZMq_mcName{text-overflow:ellipsis;white-space:nowrap;max-width:130px;overflow:hidden}.i1tZMq_heatwrap{position:relative}.i1tZMq_heatrow{flex:auto;min-width:0;display:flex}.i1tZMq_hcell{aspect-ratio:1;cursor:default;border-radius:2.5px;flex:1 1 0;min-width:0}.i1tZMq_hcell[data-lv="0"]{background:var(--dsw-alias-interactive-bg-hover);opacity:.45}.i1tZMq_cell{border-radius:2.5px;flex:none;width:9px;height:9px;margin:0 2px;display:inline-block}.i1tZMq_models{flex-direction:column;flex:1;min-width:300px;display:flex}.i1tZMq_model{border-bottom:1px solid var(--dsw-alias-border-l1);cursor:default;border-radius:6px;align-items:flex-start;gap:10px;padding:8px 4px;display:flex}.i1tZMq_model:hover{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 4%, transparent)}.i1tZMq_model:last-child{border-bottom:none}.i1tZMq_model .i1tZMq_dot{margin-top:5px}.i1tZMq_bartrack{background:var(--dsw-alias-interactive-bg-hover);border-radius:3px;flex:1;min-width:60px;height:6px;overflow:hidden}.i1tZMq_barfill{border-radius:3px;height:100%;transition:width .3s;display:block}.i1tZMq_modelname{color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;flex:1;min-width:0;font-size:13px;overflow:hidden}.i1tZMq_modelval{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:none;font-size:12px}.i1tZMq_flexrow{flex-wrap:wrap;justify-content:center;align-items:center;gap:20px;display:flex}.i1tZMq_empty{color:var(--dsw-alias-label-secondary);text-align:center;padding:28px 0;font-size:13px}.i1tZMq_svgwrap{position:relative}.i1tZMq_spark{width:100%;height:34px;margin-top:6px;display:block}.i1tZMq_compose{background:var(--dsw-alias-interactive-bg-hover);border-radius:4px;height:8px;margin-top:6px;display:flex;overflow:hidden}.i1tZMq_compose span{height:100%;display:block}.i1tZMq_composeLegend{color:var(--dsw-alias-label-caption);flex-wrap:wrap;gap:8px;margin-top:5px;font-size:10px;line-height:14px;display:flex}.i1tZMq_composeLegend i{vertical-align:-1px;border-radius:2px;width:7px;height:7px;margin-right:3px;display:inline-block}.i1tZMq_statgrow{align-items:center;gap:4px;margin-top:6px;font-size:11px;line-height:14px;display:flex}.i1tZMq_arrow{vertical-align:middle;border-left:4px solid #0000;border-right:4px solid #0000;width:0;height:0;display:inline-block}.i1tZMq_arrowUp{border-bottom:5px solid var(--dsw-alias-state-success-primary)}.i1tZMq_arrowDown{border-top:5px solid var(--dsw-alias-state-error-primary)}.i1tZMq_streakbar{background:var(--dsw-alias-interactive-bg-hover);border-radius:4px;height:8px;margin-top:7px;overflow:hidden}.i1tZMq_streakfill{border-radius:4px;height:100%;display:block}.i1tZMq_dayscroll{gap:1.5px;height:12px;margin-top:7px;display:flex}.i1tZMq_dayscroll span{border-radius:1.5px;flex:1 1 0;min-width:0;display:block}.i1tZMq_axislbl{fill:var(--dsw-alias-label-caption);font-size:10.5px}.i1tZMq_gridln{stroke:var(--dsw-alias-border-l1);stroke-width:1px}.i1tZMq_bar{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;align-items:center;gap:8px;padding:12px 0;display:flex}.i1tZMq_side{background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;margin:2px 0;padding:8px 10px;position:relative;overflow:visible}.i1tZMq_side.i1tZMq_loading{animation:1.2s infinite i1tZMq_tm-pulse}.i1tZMq_side.i1tZMq_error{border-color:var(--dsw-alias-state-error-primary)}.i1tZMq_in{animation:.35s i1tZMq_tm-in}.i1tZMq_vendor{cursor:pointer;text-align:left;background:0 0;border:none;align-items:center;gap:6px;width:100%;padding:0;display:flex}.i1tZMq_vname{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;font-weight:600;overflow:hidden}.i1tZMq_vname2{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;overflow:hidden}.i1tZMq_vtype{color:var(--dsw-alias-brand-primary);flex:none;font-size:10px}.i1tZMq_vcaret{color:var(--dsw-alias-label-secondary);flex:none;font-size:10px}.i1tZMq_backdrop{z-index:55;cursor:default;background:0 0;border:none;margin:0;padding:0;position:fixed;inset:0}.i1tZMq_popmenu{z-index:400;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 78%, transparent);backdrop-filter:blur(12px)saturate(1.4);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:2px;min-width:180px;max-width:260px;max-height:240px;margin:0;padding:6px;display:flex;position:fixed;overflow:auto;box-shadow:0 12px 32px #00000040}.i1tZMq_mitem{cursor:pointer;width:100%;color:var(--dsw-alias-label-secondary);text-align:left;background:0 0;border:1px solid #0000;border-radius:6px;align-items:center;gap:6px;padding:4px 6px;font-size:12px;display:flex}.i1tZMq_mitem:hover{border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}.i1tZMq_mitem.i1tZMq_active{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-brand-primary)}.i1tZMq_mitem .i1tZMq_grow{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.i1tZMq_qrow{align-items:center;gap:6px;margin-top:6px;display:flex}.i1tZMq_qlabel{width:52px;min-width:52px;color:var(--dsw-alias-label-secondary);white-space:nowrap;text-overflow:ellipsis;flex:none;font-size:11px;line-height:16px;overflow:hidden}.i1tZMq_qbar{background:var(--dsw-alias-bg-layer-2);border-radius:999px;flex:1;min-width:0;height:6px;overflow:hidden}.i1tZMq_qfill{background:var(--dsw-alias-brand-primary);border-radius:999px;height:100%;transition:width .8s;display:block}.i1tZMq_qfill.i1tZMq_warn{background:var(--dsw-alias-state-warn-primary)}.i1tZMq_qfill.i1tZMq_bad{background:var(--dsw-alias-state-error-primary)}.i1tZMq_qfill.i1tZMq_over{background:var(--dsw-alias-state-error-primary);animation:1.6s ease-in-out infinite i1tZMq_tm-qpulse}.i1tZMq_qpct{text-align:right;width:34px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;flex:none;font-size:11px}.i1tZMq_qpct.i1tZMq_warn{color:var(--dsw-alias-state-warn-label)}.i1tZMq_qpct.i1tZMq_bad,.i1tZMq_qpct.i1tZMq_over{color:var(--dsw-alias-state-error-primary);font-weight:600}.i1tZMq_qsumWarn{color:var(--dsw-alias-state-warn-label)}.i1tZMq_qsumBad,.i1tZMq_qsumOver{color:var(--dsw-alias-state-error-primary)}@keyframes i1tZMq_tm-qpulse{0%,to{opacity:1}50%{opacity:.55}}.i1tZMq_qleft{text-align:right;width:62px;color:var(--dsw-alias-label-secondary);white-space:nowrap;text-overflow:ellipsis;flex:none;font-size:10px;overflow:hidden}.i1tZMq_qstatus{white-space:nowrap;color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);border-radius:999px;flex:none;padding:0 6px;font-size:9.5px;line-height:15px}.i1tZMq_qbal{justify-content:space-between;align-items:baseline;margin-top:6px;display:flex}.i1tZMq_qbal b{color:var(--dsw-alias-label-primary);font-size:15px}.i1tZMq_qbal span{color:var(--dsw-alias-label-secondary);font-size:10px}.i1tZMq_body{background:0 0;border:none;border-radius:0;margin-top:8px;padding:0}.i1tZMq_body .i1tZMq_qrow:first-child{margin-top:0}.i1tZMq_paygCur{color:var(--dsw-alias-label-secondary);margin-right:2px;font-size:13px;font-weight:600}.i1tZMq_paygAmt{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:22px;font-weight:700;line-height:1.2}.i1tZMq_paygAmt.i1tZMq_neg{color:var(--dsw-alias-state-error-primary)}.i1tZMq_paygTop{align-items:center;gap:8px;display:flex}.i1tZMq_paygSub{color:var(--dsw-alias-label-secondary);margin-top:2px;font-size:11px}.i1tZMq_avail{border:1px solid;border-radius:999px;flex:none;padding:1px 9px;font-size:11px;line-height:1.6}.i1tZMq_avail.i1tZMq_ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}.i1tZMq_avail.i1tZMq_bad{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}.i1tZMq_avail.i1tZMq_unknown{color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-border-l1)}.i1tZMq_infos{flex-direction:column;gap:4px;margin-top:8px;display:flex}.i1tZMq_inforow{color:var(--dsw-alias-label-secondary);justify-content:space-between;font-size:11px;display:flex}.i1tZMq_inforow b{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}.i1tZMq_warnLine{color:var(--dsw-alias-state-warn-primary);margin:8px 0 0;font-size:11px;line-height:1.6}.i1tZMq_warnLine.i1tZMq_bad{color:var(--dsw-alias-state-error-primary)}.i1tZMq_mini.i1tZMq_warn{color:var(--dsw-alias-state-warn-primary)}.i1tZMq_xstats{flex-direction:column;gap:4px;margin-top:8px;display:flex}.i1tZMq_xrow{color:var(--dsw-alias-label-secondary);justify-content:space-between;font-size:11px;display:flex}.i1tZMq_xrow b{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}.i1tZMq_xgrid{margin-top:8px}.i1tZMq_xgridBody{grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;display:grid}.i1tZMq_xcell{min-width:0;color:var(--dsw-alias-label-secondary);justify-content:space-between;align-items:baseline;gap:8px;font-size:11px;display:flex}.i1tZMq_xcellLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.i1tZMq_xcellValue{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;white-space:nowrap;flex:none}@container i1tZMq_tm (width<=300px){.i1tZMq_xgridBody{grid-template-columns:minmax(0,1fr)}}.i1tZMq_paygCompact .i1tZMq_paygAmt{font-size:20px}.i1tZMq_paygCompact .i1tZMq_paygSub{margin-top:0}.i1tZMq_paygCompact .i1tZMq_warnLine{margin-top:4px}.i1tZMq_xchart{margin-top:8px}.i1tZMq_xtitle{color:var(--dsw-alias-label-secondary);margin-bottom:2px;font-size:10px}.i1tZMq_xsplit{background:var(--dsw-alias-bg-layer-2);border-radius:999px;height:8px;margin-top:6px;display:flex;overflow:hidden}.i1tZMq_xsplit span{height:100%;display:block}.i1tZMq_segBrand{background:var(--dsw-alias-brand-primary)}.i1tZMq_segOk{background:var(--dsw-alias-state-success-primary)}.i1tZMq_segWarn{background:var(--dsw-alias-state-warn-primary)}.i1tZMq_segBad{background:var(--dsw-alias-state-error-primary)}.i1tZMq_segInfo{background:var(--dsw-alias-state-business-primary)}.i1tZMq_segMuted{background:var(--dsw-alias-label-tertiary)}.i1tZMq_segPal0{background:var(--dsw-alias-brand-primary)}.i1tZMq_segPal1{background:var(--dsw-alias-state-success-primary)}.i1tZMq_segPal2{background:var(--dsw-alias-state-warn-primary)}.i1tZMq_segPal3{background:var(--dsw-alias-state-business-primary)}.i1tZMq_segPal4{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 55%, var(--dsw-alias-bg-layer-1))}.i1tZMq_segPal5{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 55%, var(--dsw-alias-bg-layer-1))}.i1tZMq_segPal6{background:color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, var(--dsw-alias-bg-layer-1))}.i1tZMq_segPal7{background:var(--dsw-alias-label-tertiary)}.i1tZMq_xdot{border-radius:2px;width:7px;height:7px;margin-right:5px;display:inline-block}.i1tZMq_sections,.i1tZMq_ui{flex-direction:column;display:flex}.i1tZMq_xprog{margin-top:8px}.i1tZMq_vchips{flex-wrap:wrap;gap:4px;margin-top:6px;display:flex}.i1tZMq_vchip{border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);white-space:nowrap;border-radius:999px;align-items:center;padding:0 8px;font-size:10.5px;line-height:16px;display:inline-flex}.i1tZMq_vchipOk{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}.i1tZMq_vchipWarn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}.i1tZMq_vchipBad{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}.i1tZMq_vchipInfo{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary)}.i1tZMq_errbox{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-left:3px solid var(--dsw-alias-state-warn-primary);border-radius:8px;margin-top:8px;padding:8px 10px}.i1tZMq_errboxBad{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l1));border-left-color:var(--dsw-alias-state-error-primary)}.i1tZMq_errboxWarn{border-left-color:var(--dsw-alias-state-warn-primary)}.i1tZMq_errboxInfo{border-left-color:var(--dsw-alias-state-business-primary)}.i1tZMq_errhead{cursor:pointer;text-align:left;width:100%;font:inherit;background:0 0;border:none;align-items:flex-start;gap:8px;padding:0;display:flex}.i1tZMq_erricon{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 18%, transparent);border-radius:50%;flex:none;justify-content:center;align-items:center;width:22px;height:22px;font-size:12px;line-height:1;display:inline-flex}.i1tZMq_erriconBad{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 18%, transparent)}.i1tZMq_erriconInfo{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 18%, transparent)}.i1tZMq_errtitlewrap{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.i1tZMq_errtitle{color:var(--dsw-alias-state-warn-label);font-size:12.5px;font-weight:600}.i1tZMq_errboxBad .i1tZMq_errtitle{color:var(--dsw-alias-state-error-primary)}.i1tZMq_errboxInfo .i1tZMq_errtitle{color:var(--dsw-alias-label-primary)}.i1tZMq_errhint{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.6}.i1tZMq_erraction{flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0 0 30px;display:flex}.i1tZMq_erractionText{min-width:0;color:var(--dsw-alias-label-secondary);flex:1;font-size:11px}.i1tZMq_errabtns{flex:none;gap:4px;display:inline-flex}.i1tZMq_errdetail{border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);margin-top:8px;padding-top:8px;font-size:11px;line-height:1.7}.i1tZMq_errsub{color:var(--dsw-alias-label-secondary);margin:0 0 2px;font-size:10.5px;font-weight:600}.i1tZMq_errsteps{margin:0 0 8px;padding-left:18px}.i1tZMq_errsteps li{margin:2px 0}.i1tZMq_errraw{background:var(--dsw-alias-bg-layer-1);font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-secondary);word-break:break-all;white-space:pre-wrap;border-radius:6px;max-height:160px;margin:0;padding:6px 8px;font-size:10.5px;line-height:1.6;overflow:auto}.i1tZMq_errdactions{flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;display:flex}.i1tZMq_errmeta{color:var(--dsw-alias-label-tertiary);margin-left:auto;font-size:10.5px}.i1tZMq_errboxCompact{padding:6px 8px}.i1tZMq_errboxCompact .i1tZMq_erraction{margin-left:0}.i1tZMq_qmeta{justify-content:space-between;align-items:center;margin-top:6px;display:flex}.i1tZMq_qmeta span{color:var(--dsw-alias-label-secondary);font-size:10px}.i1tZMq_mini{cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border:1px solid #0000;border-radius:6px;padding:2px 6px;font-size:11px}.i1tZMq_mini:hover{border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}.i1tZMq_err{color:var(--dsw-alias-state-error-primary);margin-top:6px;font-size:11px;line-height:1.6}.i1tZMq_codeblock{margin-top:2px}.i1tZMq_codeblock pre{max-height:340px;overflow:auto}.i1tZMq_run{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.7}.i1tZMq_run b{color:var(--dsw-alias-label-primary)}.i1tZMq_inputWrap{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);border-radius:8px;align-items:center;gap:6px;width:100%;height:32px;padding:0 8px;display:inline-flex}.i1tZMq_inputWrap:focus-within{border-color:var(--dsw-alias-brand-primary)}.i1tZMq_input{min-width:0;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;flex:1;font-family:inherit;font-size:14px;line-height:22px}.i1tZMq_input::placeholder{color:var(--dsw-alias-label-dimmed)}.i1tZMq_input:disabled{opacity:.5}.i1tZMq_ninput{min-width:0;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;flex:1;font-family:inherit;font-size:14px;line-height:22px}.i1tZMq_ninput::placeholder{color:var(--dsw-alias-label-dimmed)}.i1tZMq_ninput:disabled{opacity:.5}.i1tZMq_textarea{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-1);font:inherit;color:var(--dsw-alias-label-primary);resize:vertical;border-radius:8px;outline:none;width:100%;min-height:64px;padding:8px 12px;font-size:13px;line-height:20px}.i1tZMq_textarea:focus-visible{border-color:var(--dsw-alias-brand-primary)}.i1tZMq_badge{white-space:nowrap;border-radius:999px;flex:none;align-items:center;height:20px;padding:0 8px;font-size:11px;font-weight:500;line-height:20px;display:inline-flex}.i1tZMq_badgeOk{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}.i1tZMq_badgeWarn{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}.i1tZMq_badgeMuted{background:var(--dsw-alias-button-ghost-active-fill);color:var(--dsw-alias-label-caption)}.i1tZMq_badgeInfo{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary)}.i1tZMq_loading{align-items:center;gap:8px;display:flex}.i1tZMq_loadingText{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.i1tZMq_spinner{box-sizing:border-box;border:1.5px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-state-business-primary);border-radius:50%;flex:none;width:12px;height:12px;animation:.7s linear infinite i1tZMq_tm-spin;display:inline-block}.i1tZMq_formGrid{flex-direction:column;gap:8px;width:100%;display:flex}.i1tZMq_fieldLabel{color:var(--dsw-alias-label-secondary);margin-bottom:2px;font-size:12px}.i1tZMq_footerNote{color:var(--dsw-alias-label-tertiary);margin:0;font-size:11.5px;line-height:17px}.i1tZMq_vendorRow{align-items:center;gap:2px;display:flex}.i1tZMq_vendorRow .i1tZMq_vendor{flex:1;width:auto;min-width:0}.i1tZMq_today{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);cursor:default;box-sizing:border-box;border-radius:12px;flex:none;width:100%;margin:8px 0;padding:10px 12px;overflow:hidden}.i1tZMq_today:hover{border-color:var(--dsw-alias-state-business-primary)}.i1tZMq_todaylabel{color:var(--dsw-alias-label-caption);font-size:11px;line-height:16px}.i1tZMq_todayval{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:18px;font-weight:600;line-height:24px}.i1tZMq_todayhead{justify-content:space-between;align-items:baseline;gap:8px;display:flex}.i1tZMq_todayhead .i1tZMq_todayval{flex:none;margin-left:auto;font-size:15px}.i1tZMq_todaymodels{flex-direction:column;align-items:stretch;gap:2px;margin-top:5px;display:flex}.i1tZMq_todaymchip{color:var(--dsw-alias-label-secondary);align-items:center;gap:4px;max-width:100%;font-size:10px;line-height:14px;display:inline-flex}.i1tZMq_todaymchip .i1tZMq_dot{width:7px;height:7px}.i1tZMq_todaymchip span:last-child{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}div:has(>div[data-slot="sidebar.footer.action"]){flex-direction:column;align-items:stretch}.i1tZMq_todayRail{box-sizing:border-box;background:var(--dsw-alias-bg-layer-1);cursor:pointer;border-radius:12px;flex-direction:column;justify-content:center;align-items:center;width:auto;min-width:0;max-width:100%;margin:2px 0 0;padding:3px 4px;display:flex}.i1tZMq_todayRail:hover{border-color:var(--dsw-alias-state-business-primary)}.i1tZMq_todayRail .i1tZMq_todaymodels,.i1tZMq_todayRail .i1tZMq_spark,.i1tZMq_todayRail .i1tZMq_statgrow,.i1tZMq_todayRail .i1tZMq_todayhead{display:none}.i1tZMq_todayRail .i1tZMq_todayval{text-align:center;white-space:nowrap;font-size:9px;font-weight:600;line-height:12px}.i1tZMq_todayRail .i1tZMq_todaylabel{text-align:center;white-space:nowrap;letter-spacing:.06em;font-size:8px;line-height:11px}.i1tZMq_grip{cursor:grab;color:var(--dsw-alias-label-tertiary);-webkit-user-select:none;user-select:none;touch-action:none;border-radius:6px;flex:none;padding:4px 2px;font-size:12px;line-height:1}.i1tZMq_grip:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}.i1tZMq_grip:active{cursor:grabbing}.i1tZMq_minibtn{cursor:pointer;color:var(--dsw-alias-label-secondary);background:0 0;border:1px solid #0000;border-radius:6px;flex:none;margin-left:6px;padding:2px 6px;font-family:inherit;font-size:11px;line-height:16px}.i1tZMq_minibtn:hover{border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-primary)}.i1tZMq_wkFrame{height:100%;min-height:0;overflow:auto}.i1tZMq_wkFrame .i1tZMq_card,.i1tZMq_wkFrame .i1tZMq_today{box-shadow:none;background:0 0;border:0;border-radius:0;margin:0;padding:0}.i1tZMq_float{z-index:300;background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent);backdrop-filter:blur(16px)saturate(1.4);border:1px solid var(--dsw-alias-border-l2);box-sizing:border-box;border-radius:12px;width:300px;max-width:calc(100vw - 16px);padding:10px 12px;position:fixed;overflow:hidden;box-shadow:0 16px 40px #0000004d}@supports not (backdrop-filter:blur(1px)){.i1tZMq_float,.i1tZMq_popmenu{background:var(--dsw-alias-bg-layer-1)}}.i1tZMq_floathead{cursor:move;-webkit-user-select:none;user-select:none;touch-action:none}.i1tZMq_floatHd{cursor:move;-webkit-user-select:none;user-select:none;touch-action:none;background:0 0;border-bottom:none;align-items:center;gap:6px;padding:8px 10px;display:flex}.i1tZMq_floatBd{padding:2px 12px 10px}.i1tZMq_floatBd .i1tZMq_qmeta{margin-top:8px}.i1tZMq_widgetTitle{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12px;font-weight:600;overflow:hidden}.i1tZMq_widgetBd{max-height:calc(72vh - 48px);padding:2px 12px 10px;overflow:auto}.i1tZMq_widgetFloat{z-index:300;overscroll-behavior:contain;width:360px;max-width:calc(100vw - 16px);max-height:60vh;position:fixed;overflow-y:auto;container:i1tZMq_tm/inline-size}.i1tZMq_widgetFloat>.i1tZMq_card,.i1tZMq_widgetFloat>.i1tZMq_today{box-sizing:border-box;margin:0}.i1tZMq_segRow{flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:8px;display:flex}@container i1tZMq_tm (width<=420px){.i1tZMq_segRow .i1tZMq_seg{justify-content:center;width:100%}.i1tZMq_segRow .i1tZMq_segBtn{text-align:center;flex:auto}}.i1tZMq_widgetBtn{border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);border-radius:6px;align-items:center;gap:2px;padding:1px 4px 1px 8px;font-size:12px;display:inline-flex}.i1tZMq_widgetBtnLabel{white-space:nowrap;line-height:20px}.i1tZMq_chartName{text-overflow:ellipsis;white-space:nowrap;flex:auto;min-width:0;overflow:hidden}.i1tZMq_modelhead{flex-wrap:wrap;justify-content:space-between;gap:8px;min-width:0;display:flex}.i1tZMq_modeldetail{overflow-wrap:anywhere;margin-top:2px;font-size:11px;line-height:16px}.i1tZMq_donutBox{flex:none;max-width:100%}.i1tZMq_swrow{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}.i1tZMq_swrowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}.i1tZMq_swlabel{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.i1tZMq_swhint{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}.i1tZMq_switch{box-sizing:border-box;background:var(--dsw-alias-border-l3);cursor:pointer;border:0;border-radius:999px;flex:none;width:36px;height:20px;padding:2px;position:relative}.i1tZMq_switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}.i1tZMq_switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.i1tZMq_switchOn{background:var(--dsw-alias-brand-primary)}.i1tZMq_switch:disabled{cursor:default;opacity:.5}.i1tZMq_knob,.i1tZMq_thumb{background:var(--dsw-alias-label-primary-foreground);border-radius:50%;width:16px;height:16px;transition:transform .12s;display:block}.i1tZMq_switch[aria-checked=true] .i1tZMq_knob,.i1tZMq_switchOn .i1tZMq_thumb,.i1tZMq_switchOn .i1tZMq_knob{transform:translate(16px)}.i1tZMq_dualbars{justify-content:center;gap:2px;width:100%;margin-top:4px;display:flex}.i1tZMq_card{transition:border-color .2s,top .2s;animation:.42s backwards i1tZMq_tm-fadeup;position:relative}.i1tZMq_card:hover{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, var(--dsw-alias-border-l1));top:-1px}.i1tZMq_stat{animation:.42s backwards i1tZMq_tm-fadeup}.i1tZMq_stat:hover{top:-1.5px;box-shadow:0 3px 12px -4px #0000002e}.i1tZMq_segOn{box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-business-primary) 40%, transparent)}.i1tZMq_modelchip{transition:border-color .15s,top .15s,opacity .2s}.i1tZMq_modelchip:hover{top:-1px}.i1tZMq_model{transition:background .15s}.i1tZMq_modelval{transition:color .15s}.i1tZMq_today{transition:border-color .18s}.i1tZMq_pop,.i1tZMq_tip,.i1tZMq_tipfixed{animation:.13s ease-out i1tZMq_tm-pop}.i1tZMq_gridln,.i1tZMq_axislbl{animation:.5s backwards i1tZMq_tm-fade}.i1tZMq_barfill,.i1tZMq_streakfill,.i1tZMq_popFill,.i1tZMq_compose span,.i1tZMq_qfill{transform-origin:0;animation:.55s cubic-bezier(.22,.8,.36,1) backwards i1tZMq_tm-groww}.i1tZMq_barfill{transition:none}.i1tZMq_compose span{animation-delay:.1s}.i1tZMq_streakfill{animation-delay:.12s}.i1tZMq_popFill{animation-delay:60ms}.i1tZMq_dayscroll span{animation:.4s backwards i1tZMq_tm-fade}.i1tZMq_draw{stroke-dasharray:20000;animation:1.05s cubic-bezier(.4,0,.2,1) backwards i1tZMq_tm-draw}.i1tZMq_fadein{animation:.45s backwards i1tZMq_tm-fade}.i1tZMq_rise{transform-box:fill-box;transform-origin:bottom;animation:.5s cubic-bezier(.22,.8,.36,1) backwards i1tZMq_tm-risev}.i1tZMq_hcell[data-lv]:not([data-lv="0"]){animation:.5s cubic-bezier(.2,.8,.3,1.2) backwards i1tZMq_tm-heatin}.i1tZMq_donutseg{animation:.85s cubic-bezier(.3,.6,.3,1) backwards i1tZMq_tm-donutseg}.i1tZMq_donutC{text-align:center;width:110px;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;pointer-events:none;font-size:16px;font-weight:600;line-height:20px;position:absolute;top:46%;left:50%;transform:translate(-50%,-50%)}.i1tZMq_donutCap{text-align:center;width:110px;color:var(--dsw-alias-label-caption);pointer-events:none;font-size:11px;position:absolute;top:calc(46% + 18px);left:50%;transform:translate(-50%)}.i1tZMq_spin{animation:1s linear infinite i1tZMq_tm-rot;display:inline-block}@keyframes i1tZMq_tm-in{0%{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@keyframes i1tZMq_tm-fadeup{0%{opacity:0;transform:translateY(6px)}}@keyframes i1tZMq_tm-fade{0%{opacity:0}}@keyframes i1tZMq_tm-draw{0%{stroke-dashoffset:20000px}to{stroke-dashoffset:0}}@keyframes i1tZMq_tm-groww{0%{transform:scaleX(0)}}@keyframes i1tZMq_tm-risev{0%{transform:scaleY(0)}}@keyframes i1tZMq_tm-heatin{0%{opacity:0;transform:scale(.4)}}@keyframes i1tZMq_tm-donutseg{0%{stroke-dashoffset:0}}@keyframes i1tZMq_tm-rot{to{transform:rotate(360deg)}}@keyframes i1tZMq_tm-pop{0%{opacity:0;transform:scale(.96)}}@keyframes i1tZMq_tm-pulse{0%,to{opacity:1}50%{opacity:.5}}@keyframes i1tZMq_tm-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.i1tZMq_page *,.i1tZMq_today *,.i1tZMq_pop,.i1tZMq_tip,.i1tZMq_tipfixed{transition:none!important;animation:none!important}.i1tZMq_spinner{animation:none}.i1tZMq_thumb,.i1tZMq_knob{transition:none}}@container i1tZMq_tm (width<=480px){.i1tZMq_card{padding:10px 12px}.i1tZMq_intro{font-size:13px}.i1tZMq_vname2{max-width:150px!important}.i1tZMq_models{width:100%;min-width:0}.i1tZMq_flexrow{flex-direction:column;align-items:center;gap:10px}.i1tZMq_donutBox{width:148px!important;height:148px!important}.i1tZMq_legend{gap:3px}.i1tZMq_modelchip{max-width:140px}.i1tZMq_qrow{gap:4px}.i1tZMq_qlabel{width:48px;min-width:48px}.i1tZMq_qpct{font-size:10px}.i1tZMq_qleft{font-size:9px}.i1tZMq_qstatus{padding:0 5px;font-size:9px}.i1tZMq_minibtn{padding:2px 4px}.i1tZMq_btn{padding:5px 9px;font-size:12px}.i1tZMq_selector{padding:0 12px;font-size:13px}.i1tZMq_rowText,.i1tZMq_swrowText{padding-right:12px}}@container i1tZMq_tm (width<=340px){.i1tZMq_vname2{max-width:110px!important}.i1tZMq_grid,.i1tZMq_statGrid{grid-template-columns:repeat(auto-fill,minmax(128px,1fr))}.i1tZMq_paygAmt{font-size:18px}.i1tZMq_hint,.i1tZMq_cardHint{font-size:11px}.i1tZMq_popRow{white-space:normal}.i1tZMq_donutBox{width:128px!important;height:128px!important}.i1tZMq_modelval{font-size:11px}.i1tZMq_modelname{font-size:12px}}.i1tZMq_shareBtn{border:1px solid var(--dsw-alias-border-l2);height:26px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border-radius:8px;flex:none;align-items:center;gap:5px;margin-left:6px;padding:0 10px;font-size:12px;display:inline-flex}.i1tZMq_shareBtn:hover{color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-l2))}.i1tZMq_shareBtn>svg{flex:none;display:block}.i1tZMq_shareVeil{z-index:600;box-sizing:border-box;background:color-mix(in srgb, var(--dsw-alias-bg-base) 88%, transparent);backdrop-filter:blur(14px)saturate(1.3);flex-direction:column;align-items:center;gap:12px;padding:18px;display:flex;position:fixed;inset:0;overflow:auto}.i1tZMq_shareBar{flex-wrap:wrap;flex:none;align-items:center;gap:10px;width:min(96vw,152.889vh);display:flex}.i1tZMq_shareBarTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.i1tZMq_shareBarHint{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;flex:auto;min-width:0;font-size:12px;overflow:hidden}.i1tZMq_shareToggle{color:var(--dsw-alias-label-secondary);white-space:nowrap;cursor:pointer;align-items:center;gap:5px;font-size:12px;display:inline-flex}.i1tZMq_shareToggle input{accent-color:var(--dsw-alias-state-business-primary)}.i1tZMq_shareStage{overscroll-behavior:contain;width:min(96vw,1680px);min-height:320px;max-height:calc(100vh - 150px);box-shadow:var(--dsw-shadow-lv3);background:var(--dsw-alias-bg-base);border-radius:16px;flex:auto;position:relative;overflow:auto}.i1tZMq_shareLoading{color:var(--dsw-alias-label-tertiary);justify-content:center;align-items:center;gap:8px;font-size:13px;display:flex;position:absolute;inset:0}.i1tZMq_shareZoom{width:100%}.i1tZMq_shareBoard.i1tZMq_shareBoard{box-sizing:border-box;background:var(--dsw-alias-bg-base);width:100%;height:auto;color:var(--dsw-alias-label-primary);flex-direction:column;align-items:stretch;gap:12px;min-height:0;padding:20px 24px 14px;font-size:13px;line-height:1.6;display:flex;overflow:hidden}.i1tZMq_shareHead{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;flex:none;gap:8px;padding:0 2px 9px;display:flex}.i1tZMq_shareTop{justify-content:space-between;align-items:flex-start;gap:20px;display:flex}.i1tZMq_shareTitleBox{flex-direction:column;gap:2px;min-width:0;display:flex}.i1tZMq_shareBrandRow{align-items:center;gap:8px;min-width:0;display:flex}.i1tZMq_shareLogo{color:var(--dsw-alias-state-business-primary);flex:none;display:block}.i1tZMq_shareAuthorBox{text-align:right;flex-direction:column;flex:none;align-items:flex-end;gap:1px;display:flex}.i1tZMq_shareAuthor{color:var(--dsw-alias-label-primary);font-size:15.5px;font-weight:600;line-height:21px}.i1tZMq_shareMail{color:var(--dsw-alias-label-caption);font-size:12.5px;line-height:17px}.i1tZMq_shareMeta{border-top:.5px solid var(--dsw-alias-border-l1);flex-wrap:wrap;align-items:baseline;gap:8px;padding-top:7px;display:flex}.i1tZMq_sharePlug{color:var(--dsw-alias-state-business-primary);white-space:nowrap;font-size:14px;font-weight:600;line-height:19px}.i1tZMq_sharePlug em{opacity:.8;margin-left:4px;font-size:12px;font-style:normal;font-weight:400}.i1tZMq_shareMetaSep{color:var(--dsw-alias-label-dimmed);font-size:12.5px}.i1tZMq_shareRepo{color:var(--dsw-alias-label-secondary);white-space:nowrap;font-size:12.5px;line-height:18px}.i1tZMq_shareMetaR{color:var(--dsw-alias-label-caption);margin-left:auto;font-size:12px;line-height:18px}.i1tZMq_shareBrand{color:var(--dsw-alias-label-primary);font-size:21px;font-weight:700;line-height:28px}.i1tZMq_shareSub{color:var(--dsw-alias-label-caption);font-size:12.5px;line-height:18px}.i1tZMq_shareGrid{grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:12px;display:grid}.i1tZMq_shareCell{flex-direction:column;min-width:0;display:flex}.i1tZMq_shareCell>*{flex:auto;min-width:0;margin:0!important}.i1tZMq_sr6{grid-column:1/-1}.i1tZMq_shareBoard .i1tZMq_seg,.i1tZMq_shareBoard .i1tZMq_widgetBtn,.i1tZMq_shareBoard .i1tZMq_toolbar>button{display:none!important}.i1tZMq_shareBoard .i1tZMq_dash{display:block}.i1tZMq_shareBoard .i1tZMq_card{box-shadow:none}.i1tZMq_statIco,.i1tZMq_cico{color:var(--dsw-alias-label-tertiary);flex:none;display:block}.i1tZMq_stat[data-tint="1"] .i1tZMq_statIco{color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 70%, var(--dsw-alias-label-tertiary))}.i1tZMq_statBg{z-index:0;pointer-events:none;user-select:none;color:var(--dsw-alias-state-business-primary);opacity:.075;position:absolute;bottom:-12px;right:-10px}.i1tZMq_stat[data-tint="1"] .i1tZMq_statBg{opacity:.12}.i1tZMq_statLabel,.i1tZMq_statValue,.i1tZMq_statSub,.i1tZMq_stat .i1tZMq_spark,.i1tZMq_stat .i1tZMq_compose,.i1tZMq_stat .i1tZMq_streakbar,.i1tZMq_stat .i1tZMq_dayscroll{z-index:1;position:relative}.i1tZMq_chartName{flex:auto;align-items:center;gap:6px;min-width:0;display:flex}.i1tZMq_titledIco{align-items:center;gap:6px;min-width:0;display:inline-flex}.i1tZMq_cnameTxt,.i1tZMq_titledIco>span:last-child{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.i1tZMq_card.i1tZMq_moodPeak,.i1tZMq_side.i1tZMq_moodPeak{border-left:3px solid var(--dsw-alias-state-warn-primary);background:linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent), transparent 64%), var(--dsw-alias-bg-layer-1)}.i1tZMq_card.i1tZMq_moodValley,.i1tZMq_side.i1tZMq_moodValley{border-left:3px solid var(--dsw-alias-state-success-primary);background:linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent), transparent 64%), var(--dsw-alias-bg-layer-1)}.i1tZMq_card.i1tZMq_off,.i1tZMq_side.i1tZMq_off{border-left:3px solid var(--dsw-alias-state-error-primary);background:linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent), transparent 64%), var(--dsw-alias-bg-layer-1)}.i1tZMq_card.i1tZMq_moodPeak{animation:.42s backwards i1tZMq_tm-fadeup,2.4s ease-in-out .5s infinite i1tZMq_tm-peak-breathe}@keyframes i1tZMq_tm-peak-breathe{0%,to{box-shadow:0 0 #0000}50%{box-shadow:0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-warn-primary) 16%, transparent)}}.i1tZMq_badgeBad{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 16%, transparent);color:var(--dsw-alias-state-error-primary)}.i1tZMq_offtxt{color:var(--dsw-alias-state-error-primary)}.i1tZMq_peak.i1tZMq_peak{border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 46%, var(--dsw-alias-border-l1));background:linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent), transparent 70%), var(--dsw-alias-bg-layer-2);animation:2.6s ease-in-out infinite i1tZMq_tm-peak-breathe}.i1tZMq_peak.i1tZMq_valley{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 32%, var(--dsw-alias-border-l1));background:linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent), transparent 70%), var(--dsw-alias-bg-layer-2)}.i1tZMq_peak.i1tZMq_peak .i1tZMq_peakTitle{color:var(--dsw-alias-state-warn-label)}.i1tZMq_peak.i1tZMq_valley .i1tZMq_peakTitle{color:var(--dsw-alias-state-success-primary)}.i1tZMq_peakCell.i1tZMq_von{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 24%, var(--dsw-alias-interactive-bg-hover))}@media (prefers-reduced-motion:reduce){.i1tZMq_card.i1tZMq_moodPeak,.i1tZMq_peak.i1tZMq_peak{animation:none}}.i1tZMq_segField{border-top:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;align-items:center;gap:8px;padding:3px 0;display:flex}.i1tZMq_segField:first-child{border-top:none}.i1tZMq_segFieldKey{color:var(--dsw-alias-label-secondary);flex:none;min-width:58px;font-size:12px}.i1tZMq_segFieldCtl{flex:none;display:inline-flex}.i1tZMq_segFieldHint{color:var(--dsw-alias-label-caption);flex:190px;min-width:130px;font-size:11px;line-height:15px}.i1tZMq_segField:has(.i1tZMq_gapHint){align-items:flex-start}.i1tZMq_segField:has(.i1tZMq_gapHint) .i1tZMq_segFieldHint{flex:100%}.i1tZMq_gapHint{color:var(--dsw-alias-label-secondary);flex-direction:column;gap:5px;min-width:0;font-size:11.5px;line-height:17px;display:flex}.i1tZMq_gapRules{color:var(--dsw-alias-label-tertiary);flex-direction:column;gap:3px;margin:0;padding-left:17px;display:flex}.i1tZMq_gapRules b{color:var(--dsw-alias-label-secondary);font-weight:600}.i1tZMq_gapRules em{color:var(--dsw-alias-state-warn-primary);font-style:normal;font-weight:600}.i1tZMq_gapCmpTitle{color:var(--dsw-alias-label-caption);margin-top:3px}.i1tZMq_gapCmp{flex-wrap:wrap;gap:8px;display:flex}.i1tZMq_gapCmpItem{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);cursor:pointer;flex-direction:column;gap:1px;min-width:88px;padding:5px 9px;transition:border-color .15s;display:flex}.i1tZMq_gapCmpItem:hover{border-color:var(--dsw-alias-border-l3)}.i1tZMq_gapCmpItem b{color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:600}.i1tZMq_gapCmpItem i{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:13px;font-style:normal;font-weight:600}.i1tZMq_gapCmpItem em{color:var(--dsw-alias-label-caption);font-size:10.5px;font-style:normal}.i1tZMq_gapCmpOn{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-l2));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, var(--dsw-alias-bg-layer-2))}.i1tZMq_gapCmpOn b,.i1tZMq_gapCmpOn i{color:var(--dsw-alias-state-business-primary)}.i1tZMq_gapCmpRec b:after{content:" \xB7 \u63A8\u8350";color:var(--dsw-alias-state-success-primary)}.i1tZMq_gapRec{color:var(--dsw-alias-label-tertiary)}.i1tZMq_gapRec b{color:var(--dsw-alias-state-success-primary);font-weight:600}.i1tZMq_acc{border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-caption);border-radius:4px;flex:none;padding:0 4px;font-size:10px;font-weight:400;line-height:15px}.i1tZMq_acc.i1tZMq_exact{color:var(--dsw-alias-state-success-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent)}.i1tZMq_acc.i1tZMq_estimate{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent)}.i1tZMq_acc.i1tZMq_bound{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-interactive-bg-hover)}.i1tZMq_rankHead{color:var(--dsw-alias-label-caption);border-bottom:.5px solid var(--dsw-alias-border-l2);grid-template-columns:20px minmax(84px,1fr) minmax(64px,1.7fr) 60px 54px;align-items:center;gap:8px;padding:0 0 5px;font-size:11px;line-height:15px;display:grid}.i1tZMq_rankRow{border-bottom:.5px solid var(--dsw-alias-border-l2);cursor:default;border-radius:6px;grid-template-columns:20px minmax(84px,1fr) minmax(64px,1.7fr) 60px 54px;align-items:center;gap:8px;margin:0 -4px;padding:6px 4px;transition:background .12s;display:grid}.i1tZMq_rankRow:last-of-type{border-bottom:none}.i1tZMq_rankRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.i1tZMq_rankNo{text-align:right;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px;line-height:16px}.i1tZMq_rankRow.i1tZMq_top3 .i1tZMq_rankNo{color:var(--dsw-alias-state-business-primary);font-weight:700}.i1tZMq_rankRow.i1tZMq_top3 .i1tZMq_rankDate{font-weight:600}.i1tZMq_rankDate{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;font-size:12.5px;line-height:17px}.i1tZMq_rankBarTrack{background:var(--dsw-alias-interactive-bg-hover);height:11px;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2);border-radius:6px;display:flex;overflow:hidden}.i1tZMq_rankFillTurn{background:var(--dsw-alias-state-business-primary);opacity:.85;height:100%;display:block}.i1tZMq_rankFillIdle{background:var(--dsw-alias-state-business-primary);opacity:.26;height:100%;display:block}.i1tZMq_rankVal{text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);font-size:12.5px;font-weight:600}.i1tZMq_rankTok{text-align:right;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;font-size:11px}@container i1tZMq_tm (width<=420px){.i1tZMq_rankHead,.i1tZMq_rankRow{grid-template-columns:18px minmax(70px,1fr) minmax(48px,1.4fr) 54px}.i1tZMq_rankTok,.i1tZMq_rankHead>span:last-child{display:none}}.i1tZMq_tipTitle{color:var(--dsw-alias-label-primary);margin-bottom:3px;font-weight:600}.i1tZMq_tipText{white-space:normal;max-width:236px;color:var(--dsw-alias-label-secondary);margin-top:3px;line-height:1.5}.i1tZMq_tipfixed .i1tZMq_tiprow+.i1tZMq_tiprow{margin-top:1px}[data-conversation-scroll]:has([data-slot=conversation\\.view] .i1tZMq_cview)>[data-slot=conversation\\.session]>*{flex:1 1 0;min-height:0;overflow:clip}.i1tZMq_cview{box-sizing:border-box;background:var(--dsw-alias-bg-base);align-items:stretch;width:100%;height:100%;min-height:0;display:flex;overflow:clip;container:i1tZMq_tmc/inline-size}:has(.i1tZMq_cview)>[data-width-handle]{display:none}.i1tZMq_cnav{border-right:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);flex-direction:column;flex:none;width:190px;min-width:190px;padding:16px 10px 12px;display:flex;overflow:visible}.i1tZMq_cnavInner{flex-direction:column;gap:2px;max-height:100vh;display:flex;position:sticky;top:0;overflow-y:auto}.i1tZMq_cnavHead{color:var(--dsw-alias-label-secondary);letter-spacing:.02em;padding:2px 8px 10px;font-size:12px;font-weight:600;line-height:18px}.i1tZMq_cnavList{flex-direction:column;gap:2px;display:flex}.i1tZMq_cnavItem{width:100%;color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:left;background:0 0;border:none;border-radius:6px;align-items:center;gap:8px;padding:8px 10px;font-family:inherit;font-size:13px;line-height:20px;display:flex}.i1tZMq_cnavItem:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.i1tZMq_cnavItem:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.i1tZMq_cnavItem>svg{flex:none;display:block}.i1tZMq_cnavOn,.i1tZMq_cnavOn:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);font-weight:500}.i1tZMq_cnavOn>svg{color:var(--dsw-alias-state-business-primary)}.i1tZMq_cnavLabel{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.i1tZMq_cnavItemSep{margin-top:8px;position:relative}.i1tZMq_cnavItemSep:before{content:"";background:var(--dsw-alias-border-l2);height:1px;position:absolute;top:-5px;left:8px;right:8px}.i1tZMq_cview .i1tZMq_cset .i1tZMq_page{max-width:min(920px,100%)}.i1tZMq_cmain{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex}.i1tZMq_chead{z-index:3;border-bottom:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);flex-wrap:wrap;flex:none;align-items:baseline;gap:10px;padding:14px 24px 11px;display:flex;position:sticky;top:0}.i1tZMq_cheadTitle{color:var(--dsw-alias-label-primary);flex:none;font-size:15px;font-weight:600;line-height:22px}.i1tZMq_cheadHint{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;flex:auto;min-width:0;font-size:12px;line-height:18px;overflow:hidden}.i1tZMq_cbody{scrollbar-gutter:stable;box-sizing:border-box;flex:1;min-width:0;min-height:0;padding:18px 24px 56px;overflow:clip auto}.i1tZMq_sectMiss{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);max-width:560px;color:var(--dsw-alias-label-secondary);margin:0 auto;padding:14px 16px;font-size:13px;line-height:20px}.i1tZMq_cview .i1tZMq_page{width:100%;max-width:min(1760px,100%);margin:0 auto}.i1tZMq_page .i1tZMq_page{width:100%;max-width:none;margin:0}.i1tZMq_dash{grid-template-columns:repeat(12,minmax(0,1fr));align-items:start;gap:14px;width:100%;display:grid}.i1tZMq_dash>*{min-width:0}.i1tZMq_c12{grid-column:span 12}.i1tZMq_c8{grid-column:span 8}.i1tZMq_c7{grid-column:span 7}.i1tZMq_c6{grid-column:span 6}.i1tZMq_c5{grid-column:span 5}.i1tZMq_c4{grid-column:span 4}.i1tZMq_dash .i1tZMq_card,.i1tZMq_dash .i1tZMq_statGrid{margin:0}.i1tZMq_donutWide .i1tZMq_flexrow{flex-direction:row;align-items:flex-start;gap:24px}.i1tZMq_donutWide .i1tZMq_donutBox{flex:none;margin:0}.i1tZMq_donutWide .i1tZMq_models{flex:1;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));align-content:start;gap:0 28px;min-width:0;display:grid}.i1tZMq_donutWide .i1tZMq_models .i1tZMq_model:last-child{border-bottom:1px solid var(--dsw-alias-border-l1)}@container i1tZMq_tmc (width<=900px){.i1tZMq_donutWide .i1tZMq_flexrow{flex-direction:column;align-items:stretch}.i1tZMq_donutWide .i1tZMq_donutBox{margin:0 auto}.i1tZMq_donutWide .i1tZMq_models{grid-template-columns:minmax(0,1fr)}}@container i1tZMq_tmc (width<=1180px){.i1tZMq_c8,.i1tZMq_c7,.i1tZMq_c6,.i1tZMq_c5,.i1tZMq_c4{grid-column:span 12}}.i1tZMq_cview .i1tZMq_card{padding:16px 18px}.i1tZMq_cview .i1tZMq_toolbar{margin-bottom:12px}.i1tZMq_cview .i1tZMq_page>.i1tZMq_toolbar:last-child{margin-bottom:0}.i1tZMq_cview .i1tZMq_statGrid{grid-template-columns:repeat(auto-fill,minmax(198px,1fr));grid-auto-rows:1fr;gap:12px}.i1tZMq_cview .i1tZMq_statGrid>.i1tZMq_stat{gap:3px;min-height:92px;padding:12px 14px}.i1tZMq_cview .i1tZMq_statGrid .i1tZMq_statValue{font-size:19px;line-height:26px}.i1tZMq_cview .i1tZMq_chartTitle{margin-bottom:10px;font-size:13px}.i1tZMq_cview .i1tZMq_empty{padding:44px 0}.i1tZMq_cview .i1tZMq_segField{padding:5px 0}.i1tZMq_cview .i1tZMq_intro{margin-bottom:10px}.i1tZMq_cview .i1tZMq_grid,.i1tZMq_cview .i1tZMq_statGrid{grid-auto-rows:1fr;gap:12px;margin:0}.i1tZMq_cview .i1tZMq_grid{grid-template-columns:repeat(auto-fill,minmax(214px,1fr))}.i1tZMq_cview .i1tZMq_statGrid{grid-template-columns:repeat(auto-fill,minmax(198px,1fr))}.i1tZMq_cview .i1tZMq_grid>.i1tZMq_stat,.i1tZMq_cview .i1tZMq_statGrid>.i1tZMq_stat{border-radius:12px;justify-content:flex-start;gap:4px;min-height:106px;padding:14px 16px}.i1tZMq_cview .i1tZMq_grid>.i1tZMq_stat>:last-child,.i1tZMq_cview .i1tZMq_statGrid>.i1tZMq_stat>:last-child{margin-top:auto}.i1tZMq_cview .i1tZMq_grid .i1tZMq_statLabel,.i1tZMq_cview .i1tZMq_statGrid .i1tZMq_statLabel{letter-spacing:.02em;color:var(--dsw-alias-label-caption);flex-wrap:wrap;font-size:11.5px;line-height:16px}.i1tZMq_cview .i1tZMq_grid .i1tZMq_statValue,.i1tZMq_cview .i1tZMq_statGrid .i1tZMq_statValue{font-size:22px;font-weight:600;line-height:30px}.i1tZMq_cview .i1tZMq_grid .i1tZMq_statSub,.i1tZMq_cview .i1tZMq_statGrid .i1tZMq_statSub{color:var(--dsw-alias-label-tertiary);white-space:normal;text-overflow:clip;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:11.5px;line-height:16px;display:-webkit-box;overflow:hidden}.i1tZMq_cview .i1tZMq_grid .i1tZMq_spark,.i1tZMq_cview .i1tZMq_statGrid .i1tZMq_spark{margin-top:4px}@container i1tZMq_tmc (width<=1000px){.i1tZMq_cview .i1tZMq_grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr))}.i1tZMq_cview .i1tZMq_grid .i1tZMq_statValue,.i1tZMq_cview .i1tZMq_statGrid .i1tZMq_statValue{font-size:20px;line-height:28px}}.i1tZMq_cview .i1tZMq_statGrid.i1tZMq_onlineGrid{grid-template-columns:repeat(4,minmax(0,1fr))}.i1tZMq_cview .i1tZMq_onlineGrid>.i1tZMq_statWide{grid-column:span 2}@container i1tZMq_tmc (width<=1320px){.i1tZMq_cview .i1tZMq_statGrid.i1tZMq_onlineGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@container i1tZMq_tmc (width<=820px){.i1tZMq_cview .i1tZMq_statGrid.i1tZMq_onlineGrid{grid-template-columns:minmax(0,1fr)}.i1tZMq_cview .i1tZMq_onlineGrid>.i1tZMq_statWide{grid-column:auto}}.i1tZMq_accLegend{flex-wrap:wrap;flex:none;align-items:center;gap:4px 12px;display:inline-flex}.i1tZMq_accLegendItem{color:var(--dsw-alias-label-tertiary);align-items:center;gap:5px;font-size:11px;line-height:16px;display:inline-flex}.i1tZMq_cview .i1tZMq_accLegend .i1tZMq_acc{font-size:10px}.i1tZMq_vgrid{grid-template-columns:repeat(4,minmax(0,1fr));align-items:start;gap:12px;width:100%;display:grid}.i1tZMq_vgrid>*{min-width:0}.i1tZMq_vgrid .i1tZMq_card{margin:0;container:i1tZMq_tmvc/inline-size}@container i1tZMq_tmvc (width<=400px){.i1tZMq_xgridBody{grid-template-columns:minmax(0,1fr)}}@container i1tZMq_tmc (width<=1560px){.i1tZMq_vgrid{grid-template-columns:repeat(3,minmax(0,1fr))}}@container i1tZMq_tmc (width<=1240px){.i1tZMq_vgrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@container i1tZMq_tmc (width<=890px){.i1tZMq_vgrid{grid-template-columns:minmax(0,1fr)}}@container i1tZMq_tmc (width>=1240px) and (width<=1560px){.i1tZMq_vgrid:has(>.i1tZMq_card:nth-child(4):last-child){grid-template-columns:repeat(2,minmax(0,1fr))}}@container i1tZMq_tmc (width>=1560px){.i1tZMq_vgrid:has(>.i1tZMq_card:nth-child(5):last-child),.i1tZMq_vgrid:has(>.i1tZMq_card:nth-child(9):last-child){grid-template-columns:repeat(3,minmax(0,1fr))}}@container i1tZMq_tmc (width<=620px){.i1tZMq_cnav{align-items:center;width:46px;min-width:46px;padding:12px 6px}.i1tZMq_cnavInner{width:100%}.i1tZMq_cnavHead{display:none}.i1tZMq_cnavItem{justify-content:center;gap:0;padding:8px 0}.i1tZMq_cnavLabel{display:none}.i1tZMq_chead{padding:12px 14px 10px}.i1tZMq_cheadHint{display:none}.i1tZMq_cbody{padding:14px 14px 40px}}.i1tZMq_trayRoot{flex:auto;min-width:0;display:flex}.i1tZMq_trayRail{flex:none;justify-content:center}.i1tZMq_trayBtn{box-sizing:border-box;width:100%;height:42px;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:8px;margin:4px 0;padding:0 10px 0 8px;font-family:inherit;font-size:14px;line-height:22px;display:inline-flex;overflow:hidden}.i1tZMq_trayBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}.i1tZMq_trayBtn:focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:-2px}.i1tZMq_trayRail .i1tZMq_trayBtn{border-radius:50%;justify-content:center;gap:0;width:36px;height:36px;margin:8px 0 10px;padding:0}.i1tZMq_btnRail{justify-content:center;align-items:center;gap:3px;min-width:0;display:inline-flex}.i1tZMq_btnDial{flex:none;justify-content:center;align-items:center;display:inline-flex;position:relative}.i1tZMq_btnDialCore{color:var(--dsw-alias-label-primary);justify-content:center;align-items:center;display:flex;position:absolute;inset:0}.i1tZMq_btnLeadOnly{flex:none;align-items:center;display:inline-flex}.i1tZMq_btnRow{flex:none;justify-content:center;align-items:center;width:16px;height:16px;display:inline-flex;overflow:hidden}.i1tZMq_btnLead{flex:none;align-items:center;display:inline-flex}.i1tZMq_btnIcon{color:var(--dsw-alias-label-secondary);flex:none;align-items:center;display:inline-flex}.i1tZMq_btnName{white-space:nowrap;text-overflow:ellipsis;min-width:0;overflow:hidden}.i1tZMq_btnValue{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:none;margin-left:auto;padding-left:6px;font-size:12px}.i1tZMq_btnValue[data-tone=ok]{color:var(--dsw-alias-state-success-primary)}.i1tZMq_btnValue[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}.i1tZMq_btnValue[data-tone=bad]{color:var(--dsw-alias-state-error-primary)}.i1tZMq_btnBalance{min-width:0;color:var(--dsw-alias-label-primary);align-items:center;gap:4px;display:inline-flex}.i1tZMq_btnBalanceText{font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:600}.i1tZMq_btnRail .i1tZMq_btnBalanceText{font-size:10px;font-weight:500}.i1tZMq_btnBars{align-items:center;gap:8px;min-width:0;display:inline-flex}.i1tZMq_btnBar{flex-direction:column;gap:2px;min-width:30px;display:inline-flex}.i1tZMq_btnBarLabel{color:var(--dsw-alias-label-tertiary);font-size:9px;line-height:10px}.i1tZMq_btnBar[data-active="1"] .i1tZMq_btnBarLabel{color:var(--dsw-alias-label-primary)}.i1tZMq_btnBarTrack{background:var(--dsw-alias-border-l2);border-radius:999px;width:100%;display:block;overflow:hidden}.i1tZMq_btnBarFill{background:var(--dsw-alias-brand-primary);border-radius:999px;height:100%;display:block}.i1tZMq_btnBar[data-tone=warn] .i1tZMq_btnBarFill{background:var(--dsw-alias-state-warn-primary)}.i1tZMq_btnBar[data-tone=bad] .i1tZMq_btnBarFill{background:var(--dsw-alias-state-error-primary)}.i1tZMq_ring{flex:none;display:block}.i1tZMq_ringTrack{stroke:var(--dsw-alias-border-l2)}.i1tZMq_ringArc{stroke:var(--dsw-alias-brand-primary);transition:stroke-dasharray .35s}.i1tZMq_ring[data-tone=warn] .i1tZMq_ringArc{stroke:var(--dsw-alias-state-warn-primary)}.i1tZMq_ring[data-tone=bad] .i1tZMq_ringArc{stroke:var(--dsw-alias-state-error-primary)}.i1tZMq_ring[data-tone=idle] .i1tZMq_ringArc{stroke:var(--dsw-alias-label-dimmed)}.i1tZMq_prefBlock{border-top:.5px solid var(--dsw-alias-border-l1);margin-top:10px;padding-top:8px}.i1tZMq_prefRow{align-items:center;gap:8px;margin-top:8px;display:flex}.i1tZMq_prefLabel{color:var(--dsw-alias-label-secondary);font-size:11px}.i1tZMq_prefBox{-webkit-appearance:none;appearance:none;background:var(--dsw-alias-border-l2);cursor:pointer;border:0;border-radius:999px;flex:none;width:30px;height:18px;margin:0;transition:background .16s;position:relative}.i1tZMq_prefBox:before{content:"";background:var(--dsw-alias-bg-layer-1);border-radius:50%;width:14px;height:14px;transition:transform .16s;position:absolute;top:2px;left:2px;box-shadow:0 1px 2px #00000047}.i1tZMq_prefBox:checked{background:var(--dsw-alias-brand-primary)}.i1tZMq_prefBox:checked:before{transform:translate(12px)}.i1tZMq_prefBox:focus-visible{outline:2px solid var(--dsw-alias-label-primary);outline-offset:2px}.i1tZMq_prefSeg{background:var(--dsw-alias-bg-layer-2);border-radius:8px;gap:2px;padding:2px;display:inline-flex}.i1tZMq_prefOpt{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:6px;padding:2px 10px;font-family:inherit;font-size:11px;line-height:18px}.i1tZMq_prefOpt:hover{color:var(--dsw-alias-label-primary)}.i1tZMq_prefOpt[data-on="1"]{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-brand-primary);font-weight:600}.i1tZMq_trayPanel{z-index:60;background:var(--dsw-specific-menu);border:.5px solid var(--dsw-alias-border-l1);width:344px;max-width:calc(100vw - 24px);max-height:min(70vh,560px);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary);border-radius:12px;flex-direction:column;font-size:13px;line-height:1.6;display:flex;position:fixed;overflow:hidden;container:i1tZMq_tmTray/inline-size}.i1tZMq_trayPanelHead{border-bottom:.5px solid var(--dsw-alias-border-l1);align-items:center;gap:8px;padding:10px 12px;display:flex}.i1tZMq_trayPanelGlyph{color:var(--dsw-alias-label-secondary);flex:none;display:inline-flex}.i1tZMq_trayPanelTitle{font-size:13px;font-weight:600}.i1tZMq_traySpacer{flex:auto}.i1tZMq_traySpin{border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;width:12px;height:12px;animation:.8s linear infinite i1tZMq_traySpin}@keyframes i1tZMq_traySpin{to{transform:rotate(360deg)}}.i1tZMq_trayIconBtn{width:24px;height:24px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.i1tZMq_trayIconBtn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.i1tZMq_trayIconBtn:disabled{opacity:.45;cursor:default}.i1tZMq_trayBody{flex-direction:column;gap:10px;padding:10px 12px 12px;display:flex;overflow-y:auto}.i1tZMq_trayError{color:var(--dsw-alias-state-error-primary);margin:0;font-size:12px}.i1tZMq_trayCard{flex-direction:column;display:flex}.i1tZMq_trayCardHead{align-items:center;gap:8px;display:flex}.i1tZMq_trayCardName{white-space:nowrap;text-overflow:ellipsis;min-width:0;font-weight:600;overflow:hidden}.i1tZMq_trayCardGlyph{flex:none;align-items:center;display:inline-flex}.i1tZMq_trayRowGlyph{flex:none;justify-content:center;align-items:center;width:16px;height:16px;display:inline-flex;overflow:hidden}.i1tZMq_trayCardType{white-space:nowrap;text-overflow:ellipsis;min-width:0;color:var(--dsw-alias-label-tertiary);flex:0 auto;font-size:11px;overflow:hidden}.i1tZMq_trayCardBody{flex-direction:column;display:flex}.i1tZMq_trayList{border-top:.5px solid var(--dsw-alias-border-l1);flex-direction:column;gap:2px;margin-top:2px;padding-top:8px;display:flex}.i1tZMq_trayListHead{color:var(--dsw-alias-label-tertiary);padding:0 2px 2px;font-size:11px}.i1tZMq_trayRow{width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;align-items:center;gap:8px;padding:7px 8px;display:flex}.i1tZMq_trayRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.i1tZMq_trayRow[data-active="1"]{background:var(--dsw-alias-bg-layer-2)}.i1tZMq_trayRow[data-off="1"]{opacity:.6}.i1tZMq_trayRowName{white-space:nowrap;text-overflow:ellipsis;min-width:0;overflow:hidden}.i1tZMq_trayRowType{white-space:nowrap;text-overflow:ellipsis;min-width:0;color:var(--dsw-alias-label-tertiary);flex:0 auto;font-size:11px;overflow:hidden}.i1tZMq_trayRowStatus{color:var(--dsw-alias-label-tertiary);flex:none;margin-left:auto;font-size:11px}.i1tZMq_trayRowStatus[data-tone=ok]{color:var(--dsw-alias-state-success-primary)}.i1tZMq_trayRowStatus[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}.i1tZMq_trayRowStatus[data-tone=bad]{color:var(--dsw-alias-state-error-primary)}.i1tZMq_trayRowCheck{color:var(--dsw-alias-brand-primary);flex:none;font-size:11px}.i1tZMq_trayFoot{border-top:.5px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);flex-direction:column;gap:2px;padding:8px 12px;font-size:11px;display:flex}.i1tZMq_trayFootRow{text-overflow:ellipsis;white-space:nowrap;align-items:center;gap:6px;min-width:0;display:inline-flex;overflow:hidden}.i1tZMq_trayFootDot{opacity:.6}.i1tZMq_trayFootError{color:var(--dsw-alias-state-error-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.i1tZMq_trayEmpty{color:var(--dsw-alias-label-tertiary);padding:10px 2px;font-size:12px}';
var tagId = "@dshp/token-meter/src/client/styles.module.css";
if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
  const tag = document.createElement("style");
  tag.setAttribute("data-plugin", "@dshp/token-meter");
  tag.setAttribute("data-plugin-css", tagId);
  tag.textContent = css;
  document.head.appendChild(tag);
}
var styles_module_css_default = { "acc": "i1tZMq_acc", "accLegend": "i1tZMq_accLegend", "accLegendItem": "i1tZMq_accLegendItem", "active": "i1tZMq_active", "arrow": "i1tZMq_arrow", "arrowDown": "i1tZMq_arrowDown", "arrowUp": "i1tZMq_arrowUp", "avail": "i1tZMq_avail", "axislbl": "i1tZMq_axislbl", "backdrop": "i1tZMq_backdrop", "bad": "i1tZMq_bad", "badge": "i1tZMq_badge", "badgeBad": "i1tZMq_badgeBad", "badgeInfo": "i1tZMq_badgeInfo", "badgeMuted": "i1tZMq_badgeMuted", "badgeOk": "i1tZMq_badgeOk", "badgeWarn": "i1tZMq_badgeWarn", "bar": "i1tZMq_bar", "barfill": "i1tZMq_barfill", "bartrack": "i1tZMq_bartrack", "body": "i1tZMq_body", "bound": "i1tZMq_bound", "btn": "i1tZMq_btn", "btnBalance": "i1tZMq_btnBalance", "btnBalanceText": "i1tZMq_btnBalanceText", "btnBar": "i1tZMq_btnBar", "btnBarFill": "i1tZMq_btnBarFill", "btnBarLabel": "i1tZMq_btnBarLabel", "btnBarTrack": "i1tZMq_btnBarTrack", "btnBars": "i1tZMq_btnBars", "btnDanger": "i1tZMq_btnDanger", "btnDial": "i1tZMq_btnDial", "btnDialCore": "i1tZMq_btnDialCore", "btnIcon": "i1tZMq_btnIcon", "btnLead": "i1tZMq_btnLead", "btnLeadOnly": "i1tZMq_btnLeadOnly", "btnName": "i1tZMq_btnName", "btnPrimary": "i1tZMq_btnPrimary", "btnRail": "i1tZMq_btnRail", "btnRow": "i1tZMq_btnRow", "btnValue": "i1tZMq_btnValue", "c12": "i1tZMq_c12", "c4": "i1tZMq_c4", "c5": "i1tZMq_c5", "c6": "i1tZMq_c6", "c7": "i1tZMq_c7", "c8": "i1tZMq_c8", "cacheRow": "i1tZMq_cacheRow", "cacheSep": "i1tZMq_cacheSep", "card": "i1tZMq_card", "cardHint": "i1tZMq_cardHint", "cbody": "i1tZMq_cbody", "cell": "i1tZMq_cell", "chartName": "i1tZMq_chartName", "chartTitle": "i1tZMq_chartTitle", "chartWrap": "i1tZMq_chartWrap", "chead": "i1tZMq_chead", "cheadHint": "i1tZMq_cheadHint", "cheadTitle": "i1tZMq_cheadTitle", "chevron": "i1tZMq_chevron", "cico": "i1tZMq_cico", "cmain": "i1tZMq_cmain", "cnameTxt": "i1tZMq_cnameTxt", "cnav": "i1tZMq_cnav", "cnavHead": "i1tZMq_cnavHead", "cnavInner": "i1tZMq_cnavInner", "cnavItem": "i1tZMq_cnavItem", "cnavItemSep": "i1tZMq_cnavItemSep", "cnavLabel": "i1tZMq_cnavLabel", "cnavList": "i1tZMq_cnavList", "cnavOn": "i1tZMq_cnavOn", "codeblock": "i1tZMq_codeblock", "compose": "i1tZMq_compose", "composeLegend": "i1tZMq_composeLegend", "cset": "i1tZMq_cset", "cview": "i1tZMq_cview", "dash": "i1tZMq_dash", "dayscroll": "i1tZMq_dayscroll", "desc": "i1tZMq_desc", "donutBox": "i1tZMq_donutBox", "donutC": "i1tZMq_donutC", "donutCap": "i1tZMq_donutCap", "donutWide": "i1tZMq_donutWide", "donutseg": "i1tZMq_donutseg", "dot": "i1tZMq_dot", "draw": "i1tZMq_draw", "dualbars": "i1tZMq_dualbars", "empty": "i1tZMq_empty", "err": "i1tZMq_err", "errabtns": "i1tZMq_errabtns", "erraction": "i1tZMq_erraction", "erractionText": "i1tZMq_erractionText", "errbox": "i1tZMq_errbox", "errboxBad": "i1tZMq_errboxBad", "errboxCompact": "i1tZMq_errboxCompact", "errboxInfo": "i1tZMq_errboxInfo", "errboxWarn": "i1tZMq_errboxWarn", "errdactions": "i1tZMq_errdactions", "errdetail": "i1tZMq_errdetail", "errhead": "i1tZMq_errhead", "errhint": "i1tZMq_errhint", "erricon": "i1tZMq_erricon", "erriconBad": "i1tZMq_erriconBad", "erriconInfo": "i1tZMq_erriconInfo", "errmeta": "i1tZMq_errmeta", "error": "i1tZMq_error", "errraw": "i1tZMq_errraw", "errsteps": "i1tZMq_errsteps", "errsub": "i1tZMq_errsub", "errtitle": "i1tZMq_errtitle", "errtitlewrap": "i1tZMq_errtitlewrap", "estimate": "i1tZMq_estimate", "exact": "i1tZMq_exact", "fadein": "i1tZMq_fadein", "field": "i1tZMq_field", "fieldControl": "i1tZMq_fieldControl", "fieldDesc": "i1tZMq_fieldDesc", "fieldHead": "i1tZMq_fieldHead", "fieldLabel": "i1tZMq_fieldLabel", "fieldNote": "i1tZMq_fieldNote", "fieldOpt": "i1tZMq_fieldOpt", "fieldReq": "i1tZMq_fieldReq", "flexrow": "i1tZMq_flexrow", "float": "i1tZMq_float", "floatBd": "i1tZMq_floatBd", "floatHd": "i1tZMq_floatHd", "floathead": "i1tZMq_floathead", "footerNote": "i1tZMq_footerNote", "formGrid": "i1tZMq_formGrid", "gapCmp": "i1tZMq_gapCmp", "gapCmpItem": "i1tZMq_gapCmpItem", "gapCmpOn": "i1tZMq_gapCmpOn", "gapCmpRec": "i1tZMq_gapCmpRec", "gapCmpTitle": "i1tZMq_gapCmpTitle", "gapHint": "i1tZMq_gapHint", "gapRec": "i1tZMq_gapRec", "gapRules": "i1tZMq_gapRules", "grid": "i1tZMq_grid", "gridln": "i1tZMq_gridln", "grip": "i1tZMq_grip", "grow": "i1tZMq_grow", "hcell": "i1tZMq_hcell", "heatrow": "i1tZMq_heatrow", "heatwrap": "i1tZMq_heatwrap", "hint": "i1tZMq_hint", "in": "i1tZMq_in", "inforow": "i1tZMq_inforow", "infos": "i1tZMq_infos", "input": "i1tZMq_input", "inputReadonly": "i1tZMq_inputReadonly", "inputWrap": "i1tZMq_inputWrap", "intro": "i1tZMq_intro", "knob": "i1tZMq_knob", "legend": "i1tZMq_legend", "loading": "i1tZMq_loading", "loadingText": "i1tZMq_loadingText", "mcName": "i1tZMq_mcName", "menu": "i1tZMq_menu", "menuBtn": "i1tZMq_menuBtn", "menuCount": "i1tZMq_menuCount", "menuDot": "i1tZMq_menuDot", "menuEmpty": "i1tZMq_menuEmpty", "menuFoot": "i1tZMq_menuFoot", "menuHead": "i1tZMq_menuHead", "menuHint": "i1tZMq_menuHint", "menuLabel": "i1tZMq_menuLabel", "menuList": "i1tZMq_menuList", "menuRow": "i1tZMq_menuRow", "mini": "i1tZMq_mini", "minibtn": "i1tZMq_minibtn", "mitem": "i1tZMq_mitem", "model": "i1tZMq_model", "modelchip": "i1tZMq_modelchip", "modeldetail": "i1tZMq_modeldetail", "modelhead": "i1tZMq_modelhead", "modelname": "i1tZMq_modelname", "models": "i1tZMq_models", "modelval": "i1tZMq_modelval", "mono": "i1tZMq_mono", "moodPeak": "i1tZMq_moodPeak", "moodValley": "i1tZMq_moodValley", "muted": "i1tZMq_muted", "neg": "i1tZMq_neg", "ninput": "i1tZMq_ninput", "notice": "i1tZMq_notice", "noticeEmpty": "i1tZMq_noticeEmpty", "noticeErr": "i1tZMq_noticeErr", "noticeOk": "i1tZMq_noticeOk", "noticeWarn": "i1tZMq_noticeWarn", "now": "i1tZMq_now", "off": "i1tZMq_off", "offtxt": "i1tZMq_offtxt", "ok": "i1tZMq_ok", "on": "i1tZMq_on", "onlineGrid": "i1tZMq_onlineGrid", "over": "i1tZMq_over", "page": "i1tZMq_page", "paygAmt": "i1tZMq_paygAmt", "paygCompact": "i1tZMq_paygCompact", "paygCur": "i1tZMq_paygCur", "paygSub": "i1tZMq_paygSub", "paygTop": "i1tZMq_paygTop", "peak": "i1tZMq_peak", "peakBand": "i1tZMq_peakBand", "peakCell": "i1tZMq_peakCell", "peakChip": "i1tZMq_peakChip", "peakDot": "i1tZMq_peakDot", "peakHead": "i1tZMq_peakHead", "peakHint": "i1tZMq_peakHint", "peakPop": "i1tZMq_peakPop", "peakPopClock": "i1tZMq_peakPopClock", "peakPopDot": "i1tZMq_peakPopDot", "peakPopFoot": "i1tZMq_peakPopFoot", "peakPopHead": "i1tZMq_peakPopHead", "peakTime": "i1tZMq_peakTime", "peakTitle": "i1tZMq_peakTitle", "pop": "i1tZMq_pop", "popBar": "i1tZMq_popBar", "popFill": "i1tZMq_popFill", "popK": "i1tZMq_popK", "popRow": "i1tZMq_popRow", "popTitle": "i1tZMq_popTitle", "popV": "i1tZMq_popV", "popmenu": "i1tZMq_popmenu", "prefBlock": "i1tZMq_prefBlock", "prefBox": "i1tZMq_prefBox", "prefLabel": "i1tZMq_prefLabel", "prefOpt": "i1tZMq_prefOpt", "prefRow": "i1tZMq_prefRow", "prefSeg": "i1tZMq_prefSeg", "qbal": "i1tZMq_qbal", "qbar": "i1tZMq_qbar", "qfill": "i1tZMq_qfill", "qlabel": "i1tZMq_qlabel", "qleft": "i1tZMq_qleft", "qmeta": "i1tZMq_qmeta", "qpct": "i1tZMq_qpct", "qrow": "i1tZMq_qrow", "qstatus": "i1tZMq_qstatus", "qsumBad": "i1tZMq_qsumBad", "qsumOver": "i1tZMq_qsumOver", "qsumWarn": "i1tZMq_qsumWarn", "rankBarTrack": "i1tZMq_rankBarTrack", "rankDate": "i1tZMq_rankDate", "rankFillIdle": "i1tZMq_rankFillIdle", "rankFillTurn": "i1tZMq_rankFillTurn", "rankHead": "i1tZMq_rankHead", "rankNo": "i1tZMq_rankNo", "rankRow": "i1tZMq_rankRow", "rankTok": "i1tZMq_rankTok", "rankVal": "i1tZMq_rankVal", "ring": "i1tZMq_ring", "ringArc": "i1tZMq_ringArc", "ringTrack": "i1tZMq_ringTrack", "rise": "i1tZMq_rise", "row": "i1tZMq_row", "rowControl": "i1tZMq_rowControl", "rowDesc": "i1tZMq_rowDesc", "rowLabel": "i1tZMq_rowLabel", "rowText": "i1tZMq_rowText", "rowValue": "i1tZMq_rowValue", "rowWrap": "i1tZMq_rowWrap", "run": "i1tZMq_run", "sectMiss": "i1tZMq_sectMiss", "section": "i1tZMq_section", "sectionHead": "i1tZMq_sectionHead", "sections": "i1tZMq_sections", "seg": "i1tZMq_seg", "segBad": "i1tZMq_segBad", "segBrand": "i1tZMq_segBrand", "segBtn": "i1tZMq_segBtn", "segField": "i1tZMq_segField", "segFieldCtl": "i1tZMq_segFieldCtl", "segFieldHint": "i1tZMq_segFieldHint", "segFieldKey": "i1tZMq_segFieldKey", "segInfo": "i1tZMq_segInfo", "segMuted": "i1tZMq_segMuted", "segOk": "i1tZMq_segOk", "segOn": "i1tZMq_segOn", "segPal0": "i1tZMq_segPal0", "segPal1": "i1tZMq_segPal1", "segPal2": "i1tZMq_segPal2", "segPal3": "i1tZMq_segPal3", "segPal4": "i1tZMq_segPal4", "segPal5": "i1tZMq_segPal5", "segPal6": "i1tZMq_segPal6", "segPal7": "i1tZMq_segPal7", "segRow": "i1tZMq_segRow", "segWarn": "i1tZMq_segWarn", "selector": "i1tZMq_selector", "selectorLabel": "i1tZMq_selectorLabel", "shareAuthor": "i1tZMq_shareAuthor", "shareAuthorBox": "i1tZMq_shareAuthorBox", "shareBar": "i1tZMq_shareBar", "shareBarHint": "i1tZMq_shareBarHint", "shareBarTitle": "i1tZMq_shareBarTitle", "shareBoard": "i1tZMq_shareBoard", "shareBrand": "i1tZMq_shareBrand", "shareBrandRow": "i1tZMq_shareBrandRow", "shareBtn": "i1tZMq_shareBtn", "shareCell": "i1tZMq_shareCell", "shareGrid": "i1tZMq_shareGrid", "shareHead": "i1tZMq_shareHead", "shareLoading": "i1tZMq_shareLoading", "shareLogo": "i1tZMq_shareLogo", "shareMail": "i1tZMq_shareMail", "shareMeta": "i1tZMq_shareMeta", "shareMetaR": "i1tZMq_shareMetaR", "shareMetaSep": "i1tZMq_shareMetaSep", "sharePlug": "i1tZMq_sharePlug", "shareRepo": "i1tZMq_shareRepo", "shareStage": "i1tZMq_shareStage", "shareSub": "i1tZMq_shareSub", "shareTitleBox": "i1tZMq_shareTitleBox", "shareToggle": "i1tZMq_shareToggle", "shareTop": "i1tZMq_shareTop", "shareVeil": "i1tZMq_shareVeil", "shareZoom": "i1tZMq_shareZoom", "side": "i1tZMq_side", "spark": "i1tZMq_spark", "spin": "i1tZMq_spin", "spinner": "i1tZMq_spinner", "sr6": "i1tZMq_sr6", "stat": "i1tZMq_stat", "statBg": "i1tZMq_statBg", "statGrid": "i1tZMq_statGrid", "statIco": "i1tZMq_statIco", "statLabel": "i1tZMq_statLabel", "statSub": "i1tZMq_statSub", "statValue": "i1tZMq_statValue", "statWide": "i1tZMq_statWide", "statgrow": "i1tZMq_statgrow", "streakbar": "i1tZMq_streakbar", "streakfill": "i1tZMq_streakfill", "svgwrap": "i1tZMq_svgwrap", "swhint": "i1tZMq_swhint", "switch": "i1tZMq_switch", "switchOn": "i1tZMq_switchOn", "swlabel": "i1tZMq_swlabel", "swrow": "i1tZMq_swrow", "swrowText": "i1tZMq_swrowText", "tab": "i1tZMq_tab", "tabOn": "i1tZMq_tabOn", "tabs": "i1tZMq_tabs", "textarea": "i1tZMq_textarea", "thumb": "i1tZMq_thumb", "tip": "i1tZMq_tip", "tipAbove": "i1tZMq_tipAbove", "tipK": "i1tZMq_tipK", "tipText": "i1tZMq_tipText", "tipTitle": "i1tZMq_tipTitle", "tipV": "i1tZMq_tipV", "tipfixed": "i1tZMq_tipfixed", "tipfloat": "i1tZMq_tipfloat", "tiprow": "i1tZMq_tiprow", "title": "i1tZMq_title", "titledIco": "i1tZMq_titledIco", "tm": "i1tZMq_tm", "tm-donutseg": "i1tZMq_tm-donutseg", "tm-draw": "i1tZMq_tm-draw", "tm-fade": "i1tZMq_tm-fade", "tm-fadeup": "i1tZMq_tm-fadeup", "tm-groww": "i1tZMq_tm-groww", "tm-heatin": "i1tZMq_tm-heatin", "tm-in": "i1tZMq_tm-in", "tm-peak-breathe": "i1tZMq_tm-peak-breathe", "tm-peakPopIn": "i1tZMq_tm-peakPopIn", "tm-peakTick": "i1tZMq_tm-peakTick", "tm-pop": "i1tZMq_tm-pop", "tm-pulse": "i1tZMq_tm-pulse", "tm-qpulse": "i1tZMq_tm-qpulse", "tm-risev": "i1tZMq_tm-risev", "tm-rot": "i1tZMq_tm-rot", "tm-spin": "i1tZMq_tm-spin", "tmTray": "i1tZMq_tmTray", "tmc": "i1tZMq_tmc", "tmvc": "i1tZMq_tmvc", "today": "i1tZMq_today", "todayRail": "i1tZMq_todayRail", "todayhead": "i1tZMq_todayhead", "todaylabel": "i1tZMq_todaylabel", "todaymchip": "i1tZMq_todaymchip", "todaymodels": "i1tZMq_todaymodels", "todayval": "i1tZMq_todayval", "toolbar": "i1tZMq_toolbar", "top3": "i1tZMq_top3", "trayBody": "i1tZMq_trayBody", "trayBtn": "i1tZMq_trayBtn", "trayCard": "i1tZMq_trayCard", "trayCardBody": "i1tZMq_trayCardBody", "trayCardGlyph": "i1tZMq_trayCardGlyph", "trayCardHead": "i1tZMq_trayCardHead", "trayCardName": "i1tZMq_trayCardName", "trayCardType": "i1tZMq_trayCardType", "trayEmpty": "i1tZMq_trayEmpty", "trayError": "i1tZMq_trayError", "trayFoot": "i1tZMq_trayFoot", "trayFootDot": "i1tZMq_trayFootDot", "trayFootError": "i1tZMq_trayFootError", "trayFootRow": "i1tZMq_trayFootRow", "trayIconBtn": "i1tZMq_trayIconBtn", "trayList": "i1tZMq_trayList", "trayListHead": "i1tZMq_trayListHead", "trayPanel": "i1tZMq_trayPanel", "trayPanelGlyph": "i1tZMq_trayPanelGlyph", "trayPanelHead": "i1tZMq_trayPanelHead", "trayPanelTitle": "i1tZMq_trayPanelTitle", "trayRail": "i1tZMq_trayRail", "trayRoot": "i1tZMq_trayRoot", "trayRow": "i1tZMq_trayRow", "trayRowCheck": "i1tZMq_trayRowCheck", "trayRowGlyph": "i1tZMq_trayRowGlyph", "trayRowName": "i1tZMq_trayRowName", "trayRowStatus": "i1tZMq_trayRowStatus", "trayRowType": "i1tZMq_trayRowType", "traySpacer": "i1tZMq_traySpacer", "traySpin": "i1tZMq_traySpin", "ui": "i1tZMq_ui", "unknown": "i1tZMq_unknown", "valley": "i1tZMq_valley", "vcaret": "i1tZMq_vcaret", "vchip": "i1tZMq_vchip", "vchipBad": "i1tZMq_vchipBad", "vchipInfo": "i1tZMq_vchipInfo", "vchipOk": "i1tZMq_vchipOk", "vchipWarn": "i1tZMq_vchipWarn", "vchips": "i1tZMq_vchips", "vendor": "i1tZMq_vendor", "vendorRow": "i1tZMq_vendorRow", "vgrid": "i1tZMq_vgrid", "vname": "i1tZMq_vname", "vname2": "i1tZMq_vname2", "von": "i1tZMq_von", "vtype": "i1tZMq_vtype", "warn": "i1tZMq_warn", "warnLine": "i1tZMq_warnLine", "widgetBd": "i1tZMq_widgetBd", "widgetBtn": "i1tZMq_widgetBtn", "widgetBtnLabel": "i1tZMq_widgetBtnLabel", "widgetFloat": "i1tZMq_widgetFloat", "widgetTitle": "i1tZMq_widgetTitle", "wkFrame": "i1tZMq_wkFrame", "xcell": "i1tZMq_xcell", "xcellLabel": "i1tZMq_xcellLabel", "xcellValue": "i1tZMq_xcellValue", "xchart": "i1tZMq_xchart", "xdot": "i1tZMq_xdot", "xgrid": "i1tZMq_xgrid", "xgridBody": "i1tZMq_xgridBody", "xprog": "i1tZMq_xprog", "xrow": "i1tZMq_xrow", "xsplit": "i1tZMq_xsplit", "xstats": "i1tZMq_xstats", "xtitle": "i1tZMq_xtitle" };

// src/name.ts
var DISPLAY_NAME = "Token \u603B\u89C8";

// src/client/CenterView.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var STORE_KEY = "tm-center-section";
function isComponent(v) {
  return typeof v === "function" || typeof v === "object" && v !== null && typeof v.$$typeof === "symbol";
}
var warnedMissing = /* @__PURE__ */ new Set();
function warnMissing(name) {
  if (warnedMissing.has(name)) return;
  warnedMissing.add(name);
  try {
    console.error("[dshp-token-meter] \u4E2D\u5FC3\u533A\u5206\u533A\u672A\u88C5\u914D\uFF1A" + name + "\uFF08\u68C0\u67E5 TokenMeterSection \u7684\u8FD4\u56DE\u503C\uFF09");
  } catch {
  }
}
function createCenterView(sections, icons) {
  const ITEMS = [
    {
      id: "stats",
      label: "\u7528\u91CF\u7EDF\u8BA1",
      hint: "\u4F1A\u8BDD\u65E5\u5FD7\u805A\u5408\u7684\u7528\u91CF\u8D8B\u52BF\u3001\u70ED\u529B\u56FE\u4E0E\u6A21\u578B\u5206\u5E03",
      Icon: icons.UsageIcon
    },
    {
      id: "online",
      label: "\u5728\u7EBF\u7EDF\u8BA1",
      hint: "\u5728\u7EBF / \u5BF9\u8BDD\u8FDB\u884C\u4E2D / \u6A21\u578B + \u5DE5\u5177\u4E09\u53E3\u5F84\u65F6\u957F\u4E0E\u6BCF\u65E5\u6392\u884C",
      Icon: icons.OnlineIcon
    },
    {
      id: "settings",
      label: "\u8BBE\u7F6E",
      hint: "\u504F\u597D\u3001\u4F9B\u5E94\u5546\u589E\u5220\u6539\u3001\u6570\u636E\u6765\u6E90\u4E0E\u7EDF\u8BA1\u7F13\u5B58 \xB7 \u4E0E \u8BBE\u7F6E\u91CC\u7684\u540C\u540D\u5206\u533A\u662F\u540C\u4E00\u4EFD",
      Icon: icons.SettingsIcon,
      sep: true
    }
  ];
  const ids = ITEMS.map((i) => i.id);
  const first = ITEMS[0];
  function readSaved() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw && ids.indexOf(raw) >= 0) return raw;
    } catch {
    }
    return first.id;
  }
  return function TokenMeterCenterView() {
    const [cur, setCur] = (0, import_react.useState)(readSaved);
    const [share, setShare] = (0, import_react.useState)(false);
    const pick = (id) => {
      setCur(id);
      try {
        window.localStorage.setItem(STORE_KEY, id);
      } catch {
      }
    };
    const active = ITEMS.filter((i) => i.id === cur)[0] ?? first;
    const box = sections;
    const section = (name, props) => {
      const Comp = box[name];
      if (!isComponent(Comp)) {
        warnMissing(name);
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.sectMiss, children: "\u300C" + name + "\u300D\u5206\u533A\u672A\u88C5\u914D\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u63D2\u4EF6\u3002" });
      }
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, { ...props });
    };
    const icon = (Comp, size) => isComponent(Comp) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, { size }) : null;
    const canShare = isComponent(sections.SharePanel);
    if (!canShare) warnMissing("SharePanel");
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.cview, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { className: styles_module_css_default.cnav, "aria-label": DISPLAY_NAME, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.cnavInner, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.cnavHead, children: DISPLAY_NAME }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.cnavList, children: ITEMS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            className: styles_module_css_default.cnavItem + (cur === item.id ? " " + styles_module_css_default.cnavOn : "") + (item.sep ? " " + styles_module_css_default.cnavItemSep : ""),
            "aria-current": cur === item.id ? "true" : void 0,
            title: item.hint,
            onClick: () => pick(item.id),
            children: [
              icon(item.Icon, 15),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.cnavLabel, children: item.label })
            ]
          },
          item.id
        )) })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: styles_module_css_default.cmain, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: styles_module_css_default.chead, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.cheadTitle, children: active.label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: styles_module_css_default.cheadHint, children: active.hint }),
          canShare ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              className: styles_module_css_default.shareBtn,
              title: "\u628A\u7528\u91CF\u7EDF\u8BA1\u4E0E\u5728\u7EBF\u7EDF\u8BA1\u5408\u6210\u4E00\u5F20 16:9 \u5206\u4EAB\u5361",
              onClick: () => setShare(true),
              children: [
                icon(icons.ShareIcon, 14),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5206\u4EAB" })
              ]
            }
          ) : null,
          canShare && share ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            sections.SharePanel,
            {
              onClose: () => setShare(false),
              OnlineEmbed: sections.OnlineEmbed
            }
          ) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.cbody, "data-tm-scroll": "1", children: cur === "stats" ? section("StatsView") : cur === "online" ? section("OnlineView") : (
          // 设置页是行式表单布局，宽屏下收窄居中更好读（数据卡片才吃满宽度）
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: styles_module_css_default.cset, children: section("SettingsView") })
        ) })
      ] })
    ] });
  };
}

// src/client/OnlineSection.tsx
var import_react6 = require("react");
var ReactDOM2 = __toESM(require("react-dom"), 1);

// src/client/api.ts
var BASE = "/ext/dshp-token-meter";
async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  return await r.json();
}
async function fetchState() {
  const r = await fetch(`${BASE}/state`, { cache: "no-store" });
  return await r.json();
}
async function saveConfig(patch) {
  return await post("/config", patch);
}
async function clearStatsCache() {
  return await post("/clear-cache", {});
}
async function fetchStats() {
  const r = await fetch(`${BASE}/stats`, { cache: "no-store" });
  return await r.json();
}

// src/client/glyphs.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function svgAttrs(props) {
  const size = props && props.size ? props.size : 16;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: props && props.className || void 0,
    "aria-hidden": "true",
    focusable: "false"
  };
}
var GLYPHS = {
  /* ── 用量统计 · 基础数据 ─────────────────────────────────────────── */
  /** 累计 Token：三层堆叠（"攒起来的量"） */
  layers: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 3.4 20.6 8 12 12.6 3.4 8z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m3.4 12.4 8.6 4.6 8.6-4.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m3.4 16.6 8.6 4.6 8.6-4.6" })
  ] }),
  /** 近 30 天走势：坐标轴 + 折线 */
  trend: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.6 3.6v16.8h16.8" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m6.6 15.4 4-4.6 3.4 2.8 4.8-6.2" })
  ] }),
  /** 缓存 Token：数据库圆柱 */
  database: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 6.6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 6.6v10.8c0 1.7 3.6 3 8 3s8-1.3 8-3V6.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" })
  ] }),
  /** 峰值单次请求：闪电 */
  bolt: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M13.4 2.6 4.6 13.8h5.8l-1.8 7.6 8.6-11.2h-5.8z" }),
  /** 峰值单日：山与旗 */
  mountain: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2.8 19.4h18.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m4.6 19.4 5.2-8.6 3.4 4.6 2.2-2.6 4 6.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12.6 4.6h3.6l-1 1.8 1 1.8h-3.6z" })
  ] }),
  /** 日均消耗：基准线 + 起伏 */
  wave: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.4 19.4h17.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.4 13.4c2.4-5.4 4.8-5.4 7.2 0s4.8 5.4 7.2 0" })
  ] }),
  /** 日消耗中位数：数据点 + 中位线 */
  median: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.4 19.4h17.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 6.4v13", strokeDasharray: "2.4 2.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 4.2, r: 1.9 })
  ] }),
  /** 当前连续使用：火苗 */
  flame: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 2.8c3.4 4.2 6.4 7 6.4 10.9a6.4 6.4 0 0 1-12.8 0c0-2.1 1-3.5 2.2-4.7.5 1.3 1.3 2.1 2.3 2.3-.6-2.7-.2-5.8 1.9-8.5z" }),
  /** 最长连续使用：奖杯 */
  trophy: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 3.8h8v5a4 4 0 0 1-8 0z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 5.4H4.8a3.2 3.2 0 0 0 3.3 3" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M16 5.4h3.2a3.2 3.2 0 0 1-3.3 3" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 12.8v3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8.6 19.8h6.8l-.7-3.4H9.3z" })
  ] }),
  /** 活跃天数：日历 */
  calendar: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.6 5.6h16.8v14.4H3.6z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.6 10.2h16.8" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 3.4v4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M16 3.4v4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M7.4 14.2h2.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M14.4 14.2h2.2" })
  ] }),
  /** 模型调用次数 / 模型生成：芯片 */
  chip: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M7.4 7.4h9.2v9.2H7.4z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10.4 3.8v3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M13.6 3.8v3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10.4 16.6v3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M13.6 16.6v3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.8 10.4h3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.8 13.6h3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M16.6 10.4h3.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M16.6 13.6h3.6" })
  ] }),
  /** 首次使用：旗杆 */
  flag: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6 3.4v17.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6 4.6h11.6l-2.7 4 2.7 4H6z" })
  ] }),
  /** 最近使用 / 在线时长：时钟 */
  clock: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 8.4 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 7.4V12l3.3 2" })
  ] }),
  /* ── 在线统计 ─────────────────────────────────────────────────────── */
  /** 今日在线：太阳 */
  sun: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 4.2 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 2.6v2.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 19v2.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2.6 12H5" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M19 12h2.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m5.4 5.4 1.7 1.7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m16.9 16.9 1.7 1.7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m18.6 5.4-1.7 1.7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m7.1 16.9-1.7 1.7" })
  ] }),
  /** 累计在线：沙漏 */
  hourglass: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6.6 3.2h10.8v3L13 12l4.4 5.8v3H6.6v-3L11 12 6.6 6.2z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6.6 3.2h10.8" })
  ] }),
  /** 对话进行中：对话气泡 */
  bubble: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.6 5.8h16.8v10.6h-7.6L8.4 20.4v-4H3.6z" }),
  /** 工具执行：终端提示符 */
  terminal: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.6 4.4h16.8v15.2H3.6z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m7.4 9.8 2.7 2.7-2.7 2.7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M13 15.2h4.2" })
  ] }),
  /** 引擎合计：齿轮 */
  gear: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 7.2 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 3 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 2.8v2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 19.2v2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2.8 12h2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M19.2 12h2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m5.5 5.5 1.4 1.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m17.1 17.1 1.4 1.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m18.5 5.5-1.4 1.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m6.9 17.1-1.4 1.4" })
  ] }),
  /* ── 图表卡标题 ───────────────────────────────────────────────────── */
  /** Token 活动热力图：九宫格 */
  grid: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.6 3.6h7v7h-7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M13.4 3.6h7v7h-7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M3.6 13.4h7v7h-7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M13.4 13.4h7v7h-7z" })
  ] }),
  /** 模型用量分布：圆环 */
  donut: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 8.4 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 4.2 })
  ] }),
  /** 每日在线：柱状 */
  chartBar: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M2.8 20.4h18.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5 20.4V11" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M10 20.4V6.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M15 20.4v-6.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M20 20.4V9.4" })
  ] }),
  /** 每日在线排行：榜单条 */
  list: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 6.6h16" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 12h11.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4 17.4h7.2" })
  ] }),
  /** 分享卡上的作者位：头像剪影 */
  user: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 8.6, r: 3.6 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M4.8 20.4c1.3-4 3.9-6 7.2-6s5.9 2 7.2 6" })
  ] }),
  /** 口径与准确性：同心靶 */
  target: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 8.4 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 4.6 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 1.4, fill: "currentColor", stroke: "none" })
  ] })
};
var FALLBACK = /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 12, cy: 12, r: 3 });
var glyphNames = Object.keys(GLYPHS);
function Glyph({ name, size, className }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { ...svgAttrs({ size, className }), children: GLYPHS[name] ?? FALLBACK });
}

// src/client/StatsSection.tsx
var import_react5 = require("react");
var ReactDOM = __toESM(require("react-dom"), 1);
var import_dsh_client_ui_primitives3 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/components.tsx
var import_react2 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime3 = require("react/jsx-runtime");
var BADGE_CLASS = {
  ok: styles_module_css_default.badgeOk,
  warn: styles_module_css_default.badgeWarn,
  muted: styles_module_css_default.badgeMuted,
  info: styles_module_css_default.badgeInfo,
  bad: styles_module_css_default.badgeBad
};

// src/client/ShareShell.tsx
var import_react4 = require("react");

// src/client/SharePanel.tsx
var import_react3 = require("react");

// src/client/share-svg.ts
function xmlEscapeText(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function shareSvgDocument(spec) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + spec.pw + '" height="' + spec.ph + '" viewBox="0 0 ' + spec.w + " " + spec.h + '"><foreignObject x="0" y="0" width="' + spec.w + '" height="' + spec.h + '"><div xmlns="http://www.w3.org/1999/xhtml"><style>' + xmlEscapeText(spec.css) + "</style>" + spec.inner + "</div></foreignObject></svg>";
}

// src/client/SharePanel.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var PKG = typeof define_DSHP_TOKEN_METER_PKG_default === "object" && define_DSHP_TOKEN_METER_PKG_default !== null ? define_DSHP_TOKEN_METER_PKG_default : { name: "@dshp/token-meter", version: "", repo: "" };
var SHARE_TOKENS = [
  "--dsw-alias-bg-base",
  "--dsw-alias-bg-layer-1",
  "--dsw-alias-bg-layer-2",
  "--dsw-alias-bg-module-platform",
  "--dsw-alias-border-l1",
  "--dsw-alias-border-l2",
  "--dsw-alias-border-l3",
  "--dsw-alias-border-l4",
  "--dsw-alias-brand-primary",
  "--dsw-alias-button-ghost-active-fill",
  "--dsw-alias-interactive-bg-hover",
  "--dsw-alias-label-caption",
  "--dsw-alias-label-dimmed",
  "--dsw-alias-label-primary",
  "--dsw-alias-label-primary-foreground",
  "--dsw-alias-label-secondary",
  "--dsw-alias-label-tertiary",
  "--dsw-alias-state-business-primary",
  "--dsw-alias-state-business-tertiary",
  "--dsw-alias-state-error-primary",
  "--dsw-alias-state-success-primary",
  "--dsw-alias-state-success-tertiary",
  "--dsw-alias-state-warn-label",
  "--dsw-alias-state-warn-primary",
  "--dsw-alias-state-warn-tertiary",
  "--dsw-corner-shape",
  "--dsw-shadow-lv3",
  "--dsw-specific-menu"
];
var ShareBoard = (0, import_react3.forwardRef)(
  function ShareBoard2(props, ref) {
    const sections = props.sections;
    const data = props.data;
    const aggAll = (0, import_react3.useMemo)(() => aggregate(data.records || [], null), [data]);
    const who = props.showIdentity !== false && props.gitName !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { className: styles_module_css_default.shareAuthor, children: props.gitName }) : null;
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        className: styles_module_css_default.shareBoard + " " + styles_module_css_default.cview,
        ref,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("header", { className: styles_module_css_default.shareHead, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.shareTop, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.shareTitleBox, children: [
                /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: styles_module_css_default.shareBrandRow, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Glyph, { name: "layers", size: 19, className: styles_module_css_default.shareLogo }),
                  /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.shareBrand, children: DISPLAY_NAME })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.shareSub, children: "DeepSeek Harness \xB7 \u7528\u91CF\u4E0E\u5728\u7EBF\u65F6\u957F\u603B\u89C8" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.shareAuthorBox, children: [
                who,
                props.showIdentity !== false && props.gitEmail !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.shareMail, children: props.gitEmail }) : null
              ] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.shareMeta, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: styles_module_css_default.sharePlug, children: [
                PKG.name,
                PKG.version !== "" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("em", { children: "v" + PKG.version }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.shareMetaSep, children: "\xB7" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.shareRepo, children: PKG.repo }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: styles_module_css_default.shareMetaR, children: "\u4F1A\u8BDD " + data.sessions + " \u4E2A \xB7 \u8BB0\u5F55 " + aggAll.byDay.size + " \u5929 \xB7 \u751F\u6210\u4E8E " + (/* @__PURE__ */ new Date()).toLocaleString("zh-CN", { hour12: false }) })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: styles_module_css_default.shareGrid, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.shareCell + " " + styles_module_css_default.sr6, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(sections.StatCardsSection, { aggAll, data }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.shareCell, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(sections.TrendSection, { data, aggAll }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.shareCell, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(sections.HeatSection, { data, aggAll }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.shareCell + " " + styles_module_css_default.sr6, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.donutWide, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(sections.DonutSection, { data, agg: aggAll, rangeLabel: rangeText("all") }) }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.shareCell + " " + styles_module_css_default.sr6, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(sections.OnlineEmbed, { data, block: "metrics" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.shareCell + " " + styles_module_css_default.sr6, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(sections.OnlineEmbed, { data, block: "daily" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: styles_module_css_default.shareCell + " " + styles_module_css_default.sr6, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(sections.OnlineEmbed, { data, block: "rank" }) })
          ] })
        ]
      }
    );
  }
);
ShareBoard.displayName = "TmShareBoard";
function readPluginCss() {
  try {
    const el = document.querySelector('style[data-plugin-css^="@dshp/token-meter/"]');
    return el?.textContent ?? "";
  } catch {
    return "";
  }
}
function collectShareCss() {
  const vars = [];
  try {
    const cs = getComputedStyle(document.body);
    for (const name of SHARE_TOKENS) {
      const v = cs.getPropertyValue(name).trim();
      if (v !== "") vars.push(name + ":" + v);
    }
  } catch {
  }
  const decl = vars.join(";");
  return "*,:before,:after{animation:none!important;transition:none!important}body,." + styles_module_css_default.shareBoard + "{" + decl + "}" + readPluginCss();
}
async function boardToPngBlob(node, w, h, scale = 2) {
  const pw = Math.max(1, Math.round(w * scale));
  const ph = Math.max(1, Math.round(h * scale));
  const clone = node.cloneNode(true);
  clone.style.transform = "none";
  clone.style.transformOrigin = "0 0";
  clone.style.left = "0";
  clone.style.position = "static";
  const inner = new XMLSerializer().serializeToString(clone);
  const svg = shareSvgDocument({ inner, css: collectShareCss(), w, h, pw, ph });
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const img = new Image();
  img.decoding = "sync";
  await new Promise((resolve, reject) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener(
      "error",
      () => {
        console.error(
          "[dshp-token-meter] \u5206\u4EAB\u5361 SVG \u5149\u6805\u5316\u5931\u8D25\uFF1A\u6587\u6863 " + svg.length + " \u5B57\u7B26 / " + pw + "\xD7" + ph
        );
        reject(new Error("SVG \u6E32\u67D3\u5931\u8D25"));
      },
      { once: true }
    );
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("canvas \u4E0D\u53EF\u7528");
  try {
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--dsw-alias-bg-base").trim() || "#0d1015";
  } catch {
    ctx.fillStyle = "#0d1015";
  }
  ctx.fillRect(0, 0, pw, ph);
  ctx.drawImage(img, 0, 0, pw, ph);
  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => b === null ? reject(new Error("PNG \u7F16\u7801\u5931\u8D25")) : resolve(b), "image/png");
  });
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4e3);
}

// src/client/ShareShell.tsx
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime5 = require("react/jsx-runtime");
function ShareShell(props) {
  const boardRef = (0, import_react4.useRef)(null);
  const [size, setSize] = (0, import_react4.useState)({ w: 0, h: 0 });
  const [showIdentity, setShowIdentity] = (0, import_react4.useState)(true);
  const [busy, setBusy] = (0, import_react4.useState)("");
  const [msg, setMsg] = (0, import_react4.useState)("");
  const hasIdentity = Boolean(props.gitName || props.gitEmail);
  const input = {
    data: props.data,
    gitName: props.gitName,
    gitEmail: props.gitEmail,
    showIdentity: showIdentity && hasIdentity
  };
  (0, import_react4.useEffect)(() => {
    const board = boardRef.current;
    if (board === null) return void 0;
    const measure = () => {
      const w = board.offsetWidth;
      const bh = board.offsetHeight;
      if (w > 0 && bh > 0) {
        setSize((prev) => prev.w === w && prev.h === bh ? prev : { w, h: bh });
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return void 0;
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    return () => ro.disconnect();
  }, [props.loading, props.data]);
  (0, import_react4.useEffect)(() => {
    const onKey = (e) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);
  const withBoard = async (fn) => {
    const node = boardRef.current;
    if (node === null || node === void 0 || size.h <= 0 || size.w <= 0) {
      setMsg("\u5361\u7247\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\uFF08\u6216\u76F4\u63A5\u7CFB\u7EDF\u622A\u56FE\uFF09");
      return;
    }
    setBusy("\u5DE5\u4F5C\u2026");
    setMsg("");
    await new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      if (typeof requestAnimationFrame === "function")
        requestAnimationFrame(() => requestAnimationFrame(finish));
      window.setTimeout(finish, 150);
    });
    try {
      await fn(node);
    } catch (e) {
      setMsg("\u5931\u8D25\uFF1A" + String(e?.message ?? e));
    } finally {
      setBusy("");
    }
  };
  const onDownload = () => withBoard(async (node) => {
    const blob = await boardToPngBlob(node, node.offsetWidth, node.offsetHeight);
    const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace(/[:T]/g, "-");
    downloadBlob(blob, `dsh-token-meter-${stamp}.png`);
    setMsg("\u5DF2\u4E0B\u8F7D PNG");
  });
  const onCopy = () => withBoard(async (node) => {
    const nav = navigator;
    if (nav.clipboard === void 0 || typeof ClipboardItem === "undefined") {
      setMsg("\u6B64\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u590D\u5236\u56FE\u7247\uFF0C\u8BF7\u7528\u300C\u4E0B\u8F7D PNG\u300D");
      return;
    }
    const blob = await boardToPngBlob(node, node.offsetWidth, node.offsetHeight);
    await nav.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setMsg("\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
  });
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: styles_module_css_default.shareVeil, role: "dialog", "aria-modal": "true", "aria-label": "\u5206\u4EAB\u5361", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: styles_module_css_default.shareBar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.shareBarTitle, children: "\u5206\u4EAB\u5361 \xB7 16:9" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.shareBarHint, children: props.loading ? "\u6B63\u5728\u805A\u5408\u4F1A\u8BDD\u65E5\u5FD7\u2026" : props.error ? "\u7EDF\u8BA1\u4E0D\u53EF\u7528\uFF1A" + props.error : msg || "\u4E0B\u8F7D / \u590D\u5236\u4E3A " + (size.w > 0 ? Math.round(size.w) + "\xD7" + Math.round(size.h) : "") + " \u7684 2\xD7 PNG\uFF0C\u6216\u76F4\u63A5\u7CFB\u7EDF\u622A\u56FE" }),
      hasIdentity ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: styles_module_css_default.shareToggle, title: "\u5206\u4EAB\u5361\u4F1A\u5E26\u4E0A git \u91CC\u7684\u7528\u6237\u540D\u4E0E\u90AE\u7BB1", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          "input",
          {
            type: "checkbox",
            checked: showIdentity,
            onChange: (e) => setShowIdentity(e.target.checked === true)
          }
        ),
        "\u663E\u793A\u7528\u6237\u540D / \u90AE\u7BB1"
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        import_dsh_client_ui_primitives2.Button,
        {
          variant: "outline",
          size: "sm",
          disabled: props.loading === true || busy !== "",
          onClick: () => void onDownload(),
          children: "\u4E0B\u8F7D PNG"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        import_dsh_client_ui_primitives2.Button,
        {
          variant: "outline",
          size: "sm",
          disabled: props.loading === true || busy !== "",
          onClick: () => void onCopy(),
          children: "\u590D\u5236\u56FE\u7247"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_dsh_client_ui_primitives2.Button, { variant: "ghost", size: "sm", onClick: props.onClose, children: "\u5173\u95ED" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: styles_module_css_default.shareStage, children: props.loading === true ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: styles_module_css_default.shareLoading, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: styles_module_css_default.spinner }),
      "\u6B63\u5728\u805A\u5408\u2026"
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: styles_module_css_default.shareZoom, ref: boardRef, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ShareBoard, { ...input, sections: props.sections }) }) }) })
  ] });
}

// src/client/StatsSection.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function cx(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var ARROW_CLASS = {
  flat: void 0,
  up: styles_module_css_default.arrowUp,
  down: styles_module_css_default.arrowDown
};
var BP = "var(--dsw-alias-state-business-primary)";
var EMPTY_SNAPSHOT = {
  ready: false,
  records: [],
  models: {},
  daySessions: {},
  peakStep: null,
  range: null,
  sessions: 0,
  active: 0,
  partial: false,
  scanned: 0,
  total: 0,
  errors: 0,
  storage: "",
  generatedAt: 0
};
var HEAT_SPAN_KEY = "tm-heat-span";
var HEAT_WIDE_PX = 900;
function readHeatSpan() {
  try {
    const v = window.localStorage.getItem(HEAT_SPAN_KEY);
    if (v === "6" || v === "12") return v;
  } catch {
  }
  return "";
}
var PALETTE = [
  "#4c7ef3",
  "#2fb261",
  "#f5a623",
  "#e05e4e",
  "#9a6ef1",
  "#25b8c4",
  "#d557a8",
  "#8a94a6",
  "#6b7280",
  "#34d399",
  "#f472b6",
  "#a3e635"
];
var RANGES = [
  { v: "7", t: "\u8FD17\u5929" },
  { v: "30", t: "\u8FD130\u5929" },
  { v: "90", t: "\u8FD190\u5929" },
  { v: "all", t: "\u5168\u90E8" }
];
var rangeText = (rv) => {
  for (const r of RANGES) if (r.v === rv) return r.t;
  return "";
};
var keyOf = (t) => {
  const d = new Date(t);
  const M = String(d.getMonth() + 1);
  const D = String(d.getDate());
  return d.getFullYear() + "-" + (M.length < 2 ? "0" + M : M) + "-" + (D.length < 2 ? "0" + D : D);
};
var fromKey = (k) => {
  const p = k.split("-");
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12).getTime();
};
var dispDay = (k) => k ? k.slice(5).replace("-", "/") : "";
var cnDate = (k) => {
  const p = k.split("-");
  return Number(p[0]) + "\u5E74" + Number(p[1]) + "\u6708" + Number(p[2]) + "\u65E5";
};
var hhmm = (t) => {
  const d = new Date(t);
  const H = String(d.getHours());
  const Mi = String(d.getMinutes());
  return (H.length < 2 ? "0" + H : H) + ":" + (Mi.length < 2 ? "0" + Mi : Mi);
};
var tok = (r) => (r.i || 0) + (r.o || 0) + (r.cr || 0) + (r.cw || 0);
var fmt = (n) => {
  n = Math.round(n || 0);
  if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "\u4EBF";
  if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, "") + "\u4E07";
  return n.toLocaleString("en-US");
};
var fmtFull = (n) => Math.round(n || 0).toLocaleString("en-US");
var fmtRail = (n) => {
  n = Math.round(n || 0);
  if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "\u4EBF";
  if (n >= 1e4) return String(Math.round(n / 1e4)) + "\u4E07";
  return String(n);
};
var niceMax = (m) => {
  if (m <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log(m) / Math.LN10));
  const c = [1, 1.1, 1.2, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 8, 10];
  for (const v of c) if (v * p >= m) return v * p;
  return 10 * p;
};
function sorted(arr, cmp) {
  return [...arr].sort(cmp);
}
var median = (arr) => {
  if (!arr.length) return 0;
  const s = sorted(arr, (a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
function aggregate(records, cutoff) {
  const byDay = /* @__PURE__ */ new Map();
  const byModel = /* @__PURE__ */ new Map();
  const byHour = [];
  for (let i = 0; i < 24; i++) byHour.push(0);
  let si = 0, so = 0, scr = 0, scw = 0, sn = 0;
  let first = null, last = null;
  for (const r of records) {
    if (cutoff !== null && r.d < cutoff) continue;
    const t = tok(r);
    si += r.i || 0;
    so += r.o || 0;
    scr += r.cr || 0;
    scw += r.cw || 0;
    sn += r.n || 0;
    byHour[r.h] += t;
    let day = byDay.get(r.d);
    if (day === void 0) {
      day = { d: r.d, i: 0, o: 0, cr: 0, cw: 0, n: 0, t: 0, byModel: {} };
      byDay.set(r.d, day);
    }
    day.i += r.i || 0;
    day.o += r.o || 0;
    day.cr += r.cr || 0;
    day.cw += r.cw || 0;
    day.n += r.n || 0;
    day.t += t;
    day.byModel[r.m] = (day.byModel[r.m] || 0) + t;
    let mo = byModel.get(r.m);
    if (mo === void 0) {
      mo = { m: r.m, i: 0, o: 0, cr: 0, cw: 0, n: 0, t: 0 };
      byModel.set(r.m, mo);
    }
    mo.i += r.i || 0;
    mo.o += r.o || 0;
    mo.cr += r.cr || 0;
    mo.cw += r.cw || 0;
    mo.n += r.n || 0;
    mo.t += t;
    if (first === null || r.d < first) first = r.d;
    if (last === null || r.d > last) last = r.d;
  }
  return {
    byDay,
    byModel,
    byHour,
    i: si,
    o: so,
    cr: scr,
    cw: scw,
    n: sn,
    total: si + so + scr + scw,
    first,
    last
  };
}
function streaks(byDay) {
  const set = new Set(byDay.keys());
  const today = keyOf(Date.now());
  const yKey = keyOf(fromKey(today) - 864e5);
  let cur = 0;
  let cursor = set.has(today) ? today : set.has(yKey) ? yKey : null;
  while (cursor !== null && set.has(cursor)) {
    cur++;
    cursor = keyOf(fromKey(cursor) - 864e5);
  }
  const keys = sorted(Array.from(set));
  let longest = 0, run = 0, prev = null;
  for (const k of keys) {
    run = prev !== null && keyOf(fromKey(prev) + 864e5) === k ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = k;
  }
  return { current: cur, longest };
}
function buildDayList(startKey, endKey) {
  const out = [];
  let c = startKey;
  let guard = 0;
  while (c <= endKey && guard < 3e3) {
    out.push(c);
    c = keyOf(fromKey(c) + 864e5);
    guard++;
  }
  return out;
}
var MODEL_COLORS = /* @__PURE__ */ new Map();
function buildModelColors(models) {
  const map = /* @__PURE__ */ new Map();
  sorted(Object.keys(models || {})).forEach((k, i) => map.set(k, PALETTE[i % PALETTE.length]));
  MODEL_COLORS = map;
}
var modelColor = (mk) => MODEL_COLORS.get(mk) || "#8a94a6";
function tipPos(mx, my, w, h) {
  const vw = typeof window !== "undefined" ? window.innerWidth || 1024 : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight || 768 : 768;
  const flipX = mx + w + 28 > vw;
  const flipY = my + h + 28 > vh;
  return {
    left: flipX ? void 0 : mx + 14 + "px",
    right: flipX ? vw - mx + 14 + "px" : void 0,
    top: flipY ? void 0 : my + 16 + "px",
    bottom: flipY ? vh - my + 16 + "px" : void 0
  };
}
function smoothPath(pts) {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return "M " + pts[0][0] + " " + pts[0][1];
  if (n === 2)
    return "M " + pts[0][0] + " " + pts[0][1] + " L " + pts[1][0] + " " + pts[1][1];
  let d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += " C " + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
  }
  return d;
}
var TM_TODAY_LS_OPEN = "tm-today.float.open";
var TM_TODAY_LS_POS = "tm-today.float.pos";
var TS_TODAY_LS_OPEN = "ts-today.float.open";
var TS_TODAY_LS_POS = "ts-today.float.pos";
function tmTodayLoadOpen() {
  try {
    if (window.localStorage.getItem(TM_TODAY_LS_OPEN) === "1") return true;
    if (window.localStorage.getItem(TS_TODAY_LS_OPEN) === "1") return true;
  } catch {
  }
  return false;
}
function tmTodayLoadPos() {
  try {
    const v = JSON.parse(
      window.localStorage.getItem(TM_TODAY_LS_POS) || window.localStorage.getItem(TS_TODAY_LS_POS) || "null"
    );
    if (v && isFinite(v.x) && isFinite(v.y)) return { x: Number(v.x), y: Number(v.y) };
  } catch {
  }
  return null;
}
function tmTodaySave(open, pos) {
  try {
    window.localStorage.setItem(TM_TODAY_LS_OPEN, open ? "1" : "0");
    if (pos)
      window.localStorage.setItem(
        TM_TODAY_LS_POS,
        JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) })
      );
  } catch {
  }
}
function tmTodayDefaultPos() {
  try {
    const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
    return { x: Math.max(8, vw - 332), y: Math.max(8, Math.min(120, vh - 340)) };
  } catch {
    return { x: 100, y: 100 };
  }
}
function tmTodayClamp(p) {
  try {
    const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
    return { x: Math.max(8, Math.min(p.x, vw - 316)), y: Math.max(8, Math.min(p.y, vh - 140)) };
  } catch {
    return p;
  }
}
var tmTodayFloat = {
  open: typeof window !== "undefined" ? tmTodayLoadOpen() : false,
  pos: typeof window !== "undefined" ? tmTodayLoadPos() : null
};
var tmTodayListeners = /* @__PURE__ */ new Set();
var tmTodayEmit = () => {
  for (const fn of tmTodayListeners) {
    try {
      fn({ open: tmTodayFloat.open, pos: tmTodayFloat.pos });
    } catch {
    }
  }
};
function tmTodaySet(open) {
  tmTodayFloat.open = open;
  if (open) tmTodayFloat.pos = tmTodayClamp(tmTodayFloat.pos || tmTodayLoadPos() || tmTodayDefaultPos());
  tmTodaySave(tmTodayFloat.open, tmTodayFloat.pos);
  tmTodayEmit();
}
function tmPortal(node) {
  if (node === null || node === void 0) return null;
  try {
    if (ReactDOM && typeof ReactDOM.createPortal === "function" && typeof document !== "undefined" && document.body) {
      return ReactDOM.createPortal(node, document.body);
    }
  } catch {
  }
  return node;
}
var hoverIndex = (svgRef, e, W, pl, pr, n) => {
  const node = svgRef.current;
  if (node === null || node === void 0) return null;
  const rect = node.getBoundingClientRect();
  const relX = (e.clientX - rect.left) / rect.width * W;
  let i = n <= 1 ? 0 : Math.round((relX - pl) / (W - pl - pr) * (n - 1));
  if (i < 0) i = 0;
  if (i > n - 1) i = n - 1;
  return i;
};
function useTmTodayFloat() {
  const [, force] = (0, import_react5.useReducer)((x) => x + 1, 0);
  (0, import_react5.useEffect)(() => {
    const fn = () => force();
    tmTodayListeners.add(fn);
    return () => {
      tmTodayListeners.delete(fn);
    };
  }, []);
  return tmTodayFloat;
}
function tmGripDragOut(e) {
  if (e.button !== void 0 && e.button !== 0) return;
  if (e.preventDefault) e.preventDefault();
  if (e.stopPropagation) e.stopPropagation();
  const sx = e.clientX, sy = e.clientY;
  let out = false;
  function mv(ev) {
    if (!out && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
    out = true;
    tmTodayFloat.open = true;
    tmTodayFloat.pos = tmTodayClamp({ x: ev.clientX - 60, y: ev.clientY - 20 });
    tmTodayEmit();
  }
  function up() {
    try {
      window.removeEventListener("pointermove", mv);
    } catch {
    }
    try {
      window.removeEventListener("pointerup", up);
    } catch {
    }
    if (out) tmTodaySave(true, tmTodayFloat.pos);
    else tmTodaySet(true);
  }
  try {
    window.addEventListener("pointermove", mv);
  } catch {
  }
  try {
    window.addEventListener("pointerup", up);
  } catch {
  }
}
function tmFloatDrag(e) {
  if (e.button !== void 0 && e.button !== 0) return;
  if (e.target && e.target.closest && e.target.closest("button")) return;
  if (e.preventDefault) e.preventDefault();
  const p0 = tmTodayClamp(tmTodayFloat.pos || tmTodayLoadPos() || tmTodayDefaultPos());
  const ox = e.clientX - p0.x, oy = e.clientY - p0.y;
  function mv(ev) {
    tmTodayFloat.pos = tmTodayClamp({ x: ev.clientX - ox, y: ev.clientY - oy });
    tmTodayEmit();
  }
  function up() {
    try {
      window.removeEventListener("pointermove", mv);
    } catch {
    }
    try {
      window.removeEventListener("pointerup", up);
    } catch {
    }
    tmTodaySave(tmTodayFloat.open, tmTodayFloat.pos);
  }
  try {
    window.addEventListener("pointermove", mv);
  } catch {
  }
  try {
    window.addEventListener("pointerup", up);
  } catch {
  }
}
function AnimatedNumber(props) {
  const [disp, setDisp] = (0, import_react5.useState)(0);
  const ref = (0, import_react5.useRef)(0);
  const played = (0, import_react5.useRef)(false);
  (0, import_react5.useEffect)(() => {
    const to = Number(props.value) || 0;
    if (played.current) {
      if (ref.current !== to) {
        ref.current = to;
        setDisp(to);
      }
      return void 0;
    }
    played.current = true;
    const from = ref.current;
    if (from === to) return void 0;
    const dur = props.duration || 650;
    const t0 = performance.now();
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e2 = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * e2;
      ref.current = v;
      setDisp(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [props.value]);
  const format = props.format || ((v) => Math.round(v).toLocaleString("en-US"));
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: props.className || "", style: props.style || void 0, children: format(disp) });
}
function Seg(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.seg, children: (props.options || []).map((o) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "button",
    {
      className: cx(styles_module_css_default.segBtn, props.current === o.v ? styles_module_css_default.segOn : void 0),
      "aria-pressed": props.current === o.v ? "true" : "false",
      onClick: () => props.onPick(o.v),
      children: o.t
    },
    o.v
  )) });
}
function cardName(name, text) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: styles_module_css_default.chartName, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Glyph, { name, size: 14, className: styles_module_css_default.cico }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.cnameTxt, children: text })
  ] });
}
function StatCard(props) {
  const valueNode = props.count !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AnimatedNumber, { className: styles_module_css_default.statValue, value: props.count, format: props.fmt || fmt }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.statValue, children: props.value });
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      className: styles_module_css_default.stat,
      "data-tint": props.tint ? "1" : "0",
      style: props.delay !== void 0 ? { animationDelay: props.delay + "ms" } : void 0,
      onMouseEnter: props.onHover || void 0,
      onMouseMove: props.onHover || void 0,
      onMouseLeave: props.onLeave || void 0,
      children: [
        props.icon ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Glyph, { name: props.icon, size: 58, className: styles_module_css_default.statBg }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.statLabel, children: [
          props.icon ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Glyph, { name: props.icon, size: 13, className: styles_module_css_default.statIco }) : null,
          props.label
        ] }),
        valueNode,
        props.sub ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.statSub, children: props.sub }) : null,
        ...props.visual || []
      ]
    }
  );
}
function breakdown(title, parts) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.popTitle, children: title }),
    parts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.popRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popK, children: p[0] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popV, children: fmtFull(p[1]) + " \xB7 " + (p[3] > 0 ? (p[1] / p[3] * 100).toFixed(1) : "0.0") + "%" })
    ] }, p[0]))
  ] });
}
function ComposeBar(props) {
  const parts = props.parts || [];
  const total = parts.reduce((s, p) => s + p[1], 0);
  if (total <= 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.compose, children: parts.filter((p) => p[1] > 0).map((p) => {
      const w = p[1] / total * 100;
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { width: w.toFixed(2) + "%", background: p[2] } }, p[0]);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.composeLegend, children: parts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", { style: { background: p[2] } }),
      p[0]
    ] }, p[0])) })
  ] });
}
function Sparkline(props) {
  const vals = props.values || [];
  const W = 150, H = 34, PAD = 2;
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const xs = (i) => PAD + (W - PAD * 2) * i / (vals.length - 1);
  const ys = (v) => H - PAD - (v - min) / span * (H - PAD * 2);
  const line = smoothPath(vals.map((v, i) => [xs(i), ys(v)]));
  const area = line + " L " + xs(vals.length - 1).toFixed(1) + " " + (H - PAD) + " L " + xs(0).toFixed(1) + " " + (H - PAD) + " Z";
  const c = props.color || BP;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { className: styles_module_css_default.spark, viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "path",
      {
        d: area,
        className: styles_module_css_default.fadein,
        style: { fill: c, fillOpacity: 0.13, animationDelay: ".18s" }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "path",
      {
        d: line,
        className: styles_module_css_default.draw,
        fill: "none",
        style: { stroke: c, strokeWidth: 1.5, strokeLinecap: "round", animationDelay: ".12s" }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "circle",
      {
        cx: xs(vals.length - 1),
        cy: ys(vals[vals.length - 1]),
        r: 1.8,
        className: styles_module_css_default.fadein,
        style: { fill: c, animationDelay: ".55s" }
      }
    )
  ] });
}
function TrendDelta(props) {
  const recent = props.recent, before = props.before;
  if (before === 0 && recent === 0) return null;
  const delta = before === 0 ? null : (recent - before) / before * 100;
  let arrow = "flat", color = "var(--dsw-alias-label-tertiary)", text = "\u6301\u5E73";
  if (delta === null) {
    arrow = "up";
    text = "\u65B0\u589E";
  } else if (delta > 2) {
    arrow = "up";
    color = "var(--dsw-alias-state-success-primary)";
    text = "+" + delta.toFixed(0) + "%";
  } else if (delta < -2) {
    arrow = "down";
    color = "var(--dsw-alias-state-error-primary)";
    text = delta.toFixed(0) + "%";
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: cx(styles_module_css_default.statgrow, styles_module_css_default.fadein), style: { color }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: cx(styles_module_css_default.arrow, ARROW_CLASS[arrow]) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: text + "\uFF08\u5BF9\u6BD4\u524D 7 \u5929\uFF09" })
  ] });
}
function StreakBar(props) {
  const pct = props.best > 0 ? Math.min(100, props.current / props.best * 100) : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.streakbar, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "span",
    {
      className: styles_module_css_default.streakfill,
      style: {
        width: pct.toFixed(1) + "%",
        background: "linear-gradient(90deg, var(--dsw-alias-state-business-primary), color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, transparent))"
      }
    }
  ) });
}
function DaysRibbon(props) {
  const byDay = props.byDay;
  if (byDay === void 0 || byDay.size === 0) return null;
  const keys = sorted(Array.from(byDay.keys()));
  const firstT = fromKey(keys[0]), lastT = fromKey(keys[keys.length - 1]);
  const NB = Math.min(Math.max(1, Math.round((lastT - firstT) / (30.44 * 864e5)) + 1), 24);
  const buckets = [];
  for (let i = 0; i < NB; i++) buckets.push({ active: 0, total: 0 });
  for (let m = firstT; m <= lastT; m += 864e5) {
    const b = Math.min(NB - 1, Math.floor((m - firstT) / (lastT - firstT || 1) * NB));
    buckets[b].total++;
    if (byDay.has(keyOf(m))) buckets[b].active++;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.dayscroll, children: buckets.map((b, i) => {
    const ratio = b.total > 0 ? b.active / b.total : 0;
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "span",
      {
        style: {
          background: BP,
          opacity: ratio === 0 ? 0.08 : 0.15 + ratio * 0.8,
          animationDelay: i * 26 + "ms"
        }
      },
      i
    );
  }) });
}
function DualBars(props) {
  const { a, b, height } = props;
  const max = Math.max(a, b) || 1;
  const H = height || 14;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      className: props.className || "",
      style: {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 3,
        height: H + 2,
        marginTop: 3
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "span",
          {
            className: styles_module_css_default.rise,
            style: {
              width: 9,
              borderRadius: "2px 2px 0 0",
              background: BP,
              display: "block",
              height: Math.max(2, a / max * H).toFixed(1) + "px",
              animationDelay: "60ms"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "span",
          {
            className: styles_module_css_default.rise,
            style: {
              width: 9,
              borderRadius: "2px 2px 0 0",
              background: BP,
              opacity: 0.28,
              display: "block",
              height: Math.max(2, b / max * H).toFixed(1) + "px",
              animationDelay: "150ms"
            }
          }
        )
      ]
    }
  );
}
function TrendChart(props) {
  const seriesList = props.series;
  const labels = props.labels;
  const titles = props.titles || labels;
  const emptyText = props.emptyText || "\u5F53\u65E5\u65E0\u6D88\u8017";
  const boxRef = (0, import_react5.useRef)(null);
  const [boxW, setBoxW] = (0, import_react5.useState)(0);
  (0, import_react5.useEffect)(() => {
    const el = boxRef.current;
    if (el === null || el === void 0 || typeof ResizeObserver === "undefined") return void 0;
    const ro = new ResizeObserver((entries) => {
      const w = entries && entries[0] ? Math.round(entries[0].contentRect.width) : 0;
      if (w > 0) setBoxW((prev) => prev === w ? prev : w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = Math.max(320, boxW || 780);
  const H = Math.round(Math.min(230, Math.max(150, W * 0.24)));
  const pl = 54;
  const pr = 14;
  const pt = 6;
  const pb = 28;
  const n = labels.length;
  const vis = seriesList.filter((s) => s.visible);
  const top = niceMax(vis.length > 0 ? Math.max(1, ...vis.flatMap((s) => s.values)) : 1);
  const xs = (i) => n <= 1 ? pl + (W - pl - pr) / 2 : pl + (W - pl - pr) * i / (n - 1);
  const ys = (v) => H - pb - v / top * (H - pb - pt);
  const [hover, setHover] = (0, import_react5.useState)(null);
  const svgRef = (0, import_react5.useRef)(null);
  const onMove = (e) => {
    const i = hoverIndex(svgRef, e, W, pl, pr, n);
    if (i !== null) setHover({ i, mx: e.clientX, my: e.clientY });
  };
  const kids = [];
  for (const fr of [0, 0.25, 0.5, 0.75, 1]) {
    const yy = ys(top * fr);
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime6.jsx)("line", { x1: pl, x2: W - pr, y1: yy, y2: yy, className: styles_module_css_default.gridln }, "g" + fr));
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: pl - 8, y: yy + 4, textAnchor: "end", className: styles_module_css_default.axislbl, children: fmt(top * fr) }, "gt" + fr)
    );
  }
  const tickCount = Math.min(n, 9);
  const xt = [];
  for (let j = 0; j < tickCount; j++) {
    const idx = tickCount <= 1 ? 0 : Math.round(j * (n - 1) / (tickCount - 1));
    if (xt.length === 0 || xt[xt.length - 1] !== idx) xt.push(idx);
  }
  for (const i of xt) {
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "text",
        {
          x: xs(i),
          y: H - 9,
          textAnchor: i === 0 ? "start" : i === n - 1 ? "end" : "middle",
          className: styles_module_css_default.axislbl,
          children: labels[i]
        },
        "x" + i
      )
    );
  }
  if (hover !== null) {
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "line",
        {
          x1: xs(hover.i),
          x2: xs(hover.i),
          y1: pt,
          y2: H - pb,
          style: { stroke: BP, strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.7 }
        },
        "ch"
      )
    );
    for (const s of vis) {
      if (s.values[hover.i] === void 0) continue;
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "circle",
          {
            cx: xs(hover.i),
            cy: ys(s.values[hover.i]),
            r: 3.5,
            style: { fill: s.color, stroke: "var(--dsw-alias-bg-layer-1)", strokeWidth: 1.5 }
          },
          "d" + s.name
        )
      );
    }
  }
  let li = 0;
  for (const s of seriesList) {
    if (!s.visible) continue;
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "path",
        {
          className: styles_module_css_default.draw,
          d: smoothPath(s.values.map((v, i) => [xs(i), ys(v)])),
          fill: "none",
          style: {
            stroke: s.color,
            strokeWidth: s.isTotal ? 2.6 : 1.9,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            opacity: s.isTotal ? 1 : 0.92,
            animationDelay: 0.15 + li * 0.09 + "s"
          }
        },
        "ln" + s.name
      )
    );
    li++;
  }
  kids.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "rect",
      {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: "transparent",
        style: { cursor: "crosshair" },
        onMouseMove: onMove,
        onMouseLeave: () => setHover(null)
      },
      "cap"
    )
  );
  const tip = hover !== null ? (() => {
    const active = vis.filter((s) => (s.values[hover.i] || 0) > 0);
    const rows = sorted(
      active,
      (a, b) => (b.values[hover.i] || 0) - (a.values[hover.i] || 0)
    );
    const comp = props.comp ? props.comp[hover.i] : void 0;
    const compTotal = comp ? comp.i + comp.o + comp.cr + comp.cw : 0;
    const pos = tipPos(hover.mx, hover.my, 270, (comp ? 98 : 44) + rows.length * 18);
    return tmPortal(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: cx(styles_module_css_default.tipfixed, props.above ? styles_module_css_default.tipAbove : void 0), style: pos, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.tiprow, style: { fontWeight: 600, marginBottom: 2 }, children: titles[hover.i] }),
        comp ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipK, children: "\u603B Token" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: fmt(compTotal) })
        ] }) : null,
        comp ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipK, children: "\u8F93\u5165 / \u8F93\u51FA" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: fmt(comp.i) + " / " + fmt(comp.o) })
        ] }) : null,
        comp ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, style: { marginBottom: rows.length > 0 ? 4 : 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipK, children: "\u7F13\u5B58\u8BFB / \u5199" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: fmt(comp.cr) + " / " + fmt(comp.cw) })
        ] }) : null,
        rows.length > 0 ? rows.map((s) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.dot, style: { background: s.color, width: 8, height: 8 } }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "span",
            {
              className: styles_module_css_default.tipK,
              style: { flex: "1 1 auto", overflow: "hidden", textOverflow: "ellipsis" },
              children: s.shortName
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: fmt(s.values[hover.i] || 0) })
        ] }, s.name)) : comp ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.tiprow, style: { color: "var(--dsw-alias-label-tertiary)" }, children: emptyText })
      ] })
    );
  })() : null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.svgwrap, ref: boxRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { viewBox: "0 0 " + W + " " + H, style: { width: "100%", height: H, display: "block" }, ref: svgRef, children: kids }),
    tip
  ] });
}
function Heatmap(props) {
  const byDay = props.byDay;
  const daySessions = props.daySessions || {};
  const months = props.months || 6;
  const today = keyOf(Date.now());
  const todayT = fromKey(today);
  let startW = todayT - Math.max(1, months) * 31 * 864e5;
  const dow0 = new Date(startW).getDay();
  startW = startW - (dow0 + 6) % 7 * 864e5;
  const weeks = Math.max(1, Math.ceil((todayT - startW) / 6048e5));
  const cols = [];
  let max = 1;
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let r = 0; r < 7; r++) {
      const k = keyOf(startW + w * 6048e5 + r * 864e5);
      if (k > today) {
        col.push(null);
        continue;
      }
      const day = byDay.get(k);
      const v = day === void 0 ? 0 : day.t;
      col.push({ k, v, day, sess: daySessions[k] || 0 });
      if (v > max) max = v;
    }
    cols.push(col);
  }
  const OPS = [0.16, 0.3, 0.5, 0.72, 0.95];
  const levelOf2 = (v) => v <= 0 ? 0 : v <= max * 0.25 ? 1 : v <= max * 0.5 ? 2 : v <= max * 0.75 ? 3 : 4;
  const boxW = props.boxW || 0;
  const cellGap = boxW >= 1120 ? 4 : boxW >= 860 ? 3 : 2;
  const rowGap = cellGap;
  const [hover, setHover] = (0, import_react5.useState)(null);
  const onCell = (cell, e) => {
    if (cell === null || cell.day === void 0) {
      setHover(null);
      return;
    }
    setHover({ k: cell.k, day: cell.day, sess: cell.sess, mx: e.clientX, my: e.clientY });
  };
  const WL = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"];
  const rows = [];
  for (let r = 0; r < 7; r++) {
    const cells = [];
    for (let w = 0; w < weeks; w++) {
      const cell = cols[w][r];
      cells.push(
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "div",
          {
            className: styles_module_css_default.hcell,
            "data-lv": cell === null || cell.v <= 0 ? "0" : String(levelOf2(cell.v)),
            style: cell === null ? { visibility: "hidden" } : cell.v > 0 ? {
              background: BP,
              opacity: OPS[levelOf2(cell.v)],
              animationDelay: w * 45 % 480 + "ms"
            } : void 0,
            onMouseEnter: cell ? (e) => onCell(cell, e) : void 0,
            onMouseMove: cell ? (e) => onCell(cell, e) : void 0,
            onMouseLeave: () => setHover(null)
          },
          w
        )
      );
    }
    rows.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 4, alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "span",
          {
            style: {
              width: 14,
              fontSize: 9,
              color: "var(--dsw-alias-label-caption)",
              flex: "none",
              textAlign: "center",
              // line-height 用 1（≈9px）而不是固定的 14px：窄卡片里格子可能只有
              // 11px 高，固定 14px 会把行高顶大、行间隙看起来忽大忽小。
              lineHeight: 1
            },
            children: r % 2 === 0 ? WL[r] : ""
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.heatrow, style: { gap: cellGap + "px" }, children: cells })
      ] }, r)
    );
  }
  const monthLabels = [];
  let prevM = null;
  for (let w = 0; w < weeks; w++) {
    const mo = Number(keyOf(startW + w * 6048e5).slice(5, 7));
    if (mo !== prevM) {
      monthLabels.push({ w, mo });
      prevM = mo;
    }
  }
  const monthRow = /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 4, marginBottom: 3 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { width: 14, flex: "none" } }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(" + weeks + ",minmax(0,1fr))",
          gap: cellGap + "px",
          flex: "1 1 auto",
          minHeight: 12
        },
        children: monthLabels.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "span",
          {
            style: {
              gridColumn: m.w + 1 + " / span " + Math.max(1, Math.min(4, weeks - m.w)),
              fontSize: 9.5,
              lineHeight: "12px",
              color: "var(--dsw-alias-label-caption)",
              overflow: "hidden",
              whiteSpace: "nowrap"
            },
            children: m.mo + "\u6708"
          },
          i
        ))
      }
    )
  ] });
  let pop = null;
  if (hover !== null) {
    const d = hover.day;
    const entries = sorted(Object.entries(d.byModel || {}), (a, b) => b[1] - a[1]);
    const tot = d.t;
    const cache = (d.cr || 0) + (d.cw || 0);
    const cachePct = tot > 0 ? cache / tot * 100 : 0;
    const pos = tipPos(hover.mx, hover.my, 300, 134 + Math.min(entries.length, 8) * 18);
    pop = tmPortal(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: cx(styles_module_css_default.pop, props.above ? styles_module_css_default.tipAbove : void 0), style: pos, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.popTitle, children: cnDate(hover.k) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.popRow, style: { marginBottom: 2 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popK, children: "\u603B\u6D88\u8017" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popV, children: fmt(tot) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popK, style: { paddingLeft: 12 }, children: "\u4F1A\u8BDD" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popV, children: String(hover.sess) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.popRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popK, children: "\u8F93\u5165 / \u8F93\u51FA" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popV, children: fmt(d.i || 0) + " / " + fmt(d.o || 0) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.popRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popK, children: "\u7F13\u5B58\u8BFB" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popBar, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "span",
            {
              className: styles_module_css_default.popFill,
              style: {
                width: (tot > 0 ? (d.cr || 0) / tot * 100 : 0).toFixed(1) + "%",
                background: "#f5a623"
              }
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popV, children: fmt(d.cr || 0) + " \xB7 " + (tot > 0 ? ((d.cr || 0) / tot * 100).toFixed(0) : 0) + "%" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.popRow, style: { marginBottom: entries.length > 0 ? 4 : 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popK, children: "\u7F13\u5B58\u5199" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popBar, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "span",
            {
              className: styles_module_css_default.popFill,
              style: {
                width: (tot > 0 ? (d.cw || 0) / tot * 100 : 0).toFixed(1) + "%",
                background: "#9a6ef1"
              }
            }
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popV, children: fmt(d.cw || 0) + " \xB7 \u5360\u6BD4 " + cachePct.toFixed(1) + "%" })
        ] }),
        tot > 0 ? entries.slice(0, 8).map(([mk, v]) => {
          const info = (props.models || {})[mk];
          const color = modelColor(mk);
          return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.popRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.dot, style: { background: color } }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "span",
              {
                style: {
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },
                children: info ? info.model : mk
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popBar, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "span",
              {
                className: styles_module_css_default.popFill,
                style: {
                  width: (tot > 0 ? v / tot * 100 : 0).toFixed(1) + "%",
                  background: color
                }
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.popV, children: fmt(v) + " \xB7 " + (tot > 0 ? (v / tot * 100).toFixed(0) : 0) + "%" })
          ] }, mk);
        }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.popK, children: "\u5F53\u65E5\u65E0\u7528\u91CF" }),
        entries.length > 8 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.popK, style: { marginTop: 4 }, children: "\u2026\u53E6\u6709 " + (entries.length - 8) + " \u4E2A\u6A21\u578B" }) : null
      ] })
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.heatwrap, children: [
    monthRow,
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { display: "flex", flexDirection: "column", gap: rowGap + "px" }, children: rows }),
    pop
  ] });
}
function Donut(props) {
  const entries = props.entries;
  const total = props.total;
  const size = 168, dcx = 84, cy = 84, r = 57, C = 2 * Math.PI * r;
  const kids = [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "circle",
      {
        cx: dcx,
        cy,
        r,
        fill: "none",
        style: { stroke: "var(--dsw-alias-interactive-bg-hover)", strokeWidth: 18 }
      },
      "bg"
    )
  ];
  let acc = 0;
  for (let i = 0; i < entries.length; i++) {
    const it = entries[i];
    const len = total > 0 ? it.t / total * C : 0;
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "circle",
        {
          cx: dcx,
          cy,
          r,
          fill: "none",
          className: styles_module_css_default.donutseg,
          strokeDasharray: len.toFixed(2) + " " + (C - len).toFixed(2),
          strokeDashoffset: (-acc).toFixed(2),
          style: { stroke: it.color, strokeWidth: 18, animationDelay: i * 70 + "ms" },
          transform: "rotate(-90 " + dcx + " " + cy + ")"
        },
        "s" + i
      )
    );
    acc += len;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.donutBox, style: { position: "relative", width: size, height: size }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { viewBox: "0 0 " + size + " " + size, style: { width: "100%", height: "100%", display: "block" }, children: kids }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AnimatedNumber, { className: styles_module_css_default.donutC, value: total, format: fmt }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.donutCap, children: "\u7D2F\u8BA1 Token" })
  ] });
}
function TodayChart(props) {
  const seriesList = props.series;
  const n = props.n;
  const tickLabels = props.labels || null;
  const W = 160, H = 44, PAD = 3;
  const [hover, setHover] = (0, import_react5.useState)(null);
  const svgRef = (0, import_react5.useRef)(null);
  if (n < 2 || seriesList.length === 0) return null;
  const maxV = Math.max(1, ...seriesList.flatMap((s) => s.values));
  const xs = (i) => PAD + (W - PAD * 2) * i / (n - 1);
  const ys = (v) => H - PAD - v / maxV * (H - PAD * 2);
  const onMove = (e) => {
    const i = hoverIndex(svgRef, e, W, PAD, PAD, n);
    if (i !== null) setHover({ i, mx: e.clientX, my: e.clientY });
  };
  const kids = [];
  if (hover !== null) {
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "line",
        {
          x1: xs(hover.i),
          x2: xs(hover.i),
          y1: PAD,
          y2: H - PAD,
          style: { stroke: BP, strokeWidth: 1, strokeDasharray: "2 2", opacity: 0.7 }
        },
        "ch"
      )
    );
  }
  for (let si = 0; si < seriesList.length; si++) {
    const s = seriesList[si];
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "path",
        {
          className: styles_module_css_default.draw,
          d: smoothPath(s.values.map((v, i) => [xs(i), ys(v)])),
          fill: "none",
          style: {
            stroke: s.color,
            strokeWidth: 1.6,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            opacity: 0.9,
            animationDelay: 0.1 + si * 0.12 + "s"
          }
        },
        "l" + s.name
      )
    );
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "circle",
        {
          cx: xs(n - 1),
          cy: ys(s.values[n - 1] || 0),
          r: 1.8,
          className: styles_module_css_default.fadein,
          style: { fill: s.color, animationDelay: 0.55 + si * 0.12 + "s" }
        },
        "e" + s.name
      )
    );
    if (hover !== null) {
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "circle",
          {
            cx: xs(hover.i),
            cy: ys(s.values[hover.i] || 0),
            r: 2.2,
            style: { fill: s.color, stroke: "var(--dsw-alias-bg-layer-1)", strokeWidth: 1 }
          },
          "h" + s.name
        )
      );
    }
  }
  kids.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "rect",
      {
        x: 0,
        y: 0,
        width: W,
        height: H,
        fill: "transparent",
        style: { cursor: "crosshair" },
        onMouseMove: onMove,
        onMouseLeave: () => setHover(null)
      },
      "cap"
    )
  );
  const tip = hover !== null ? (() => {
    const active = seriesList.filter((s) => (s.values[hover.i] || 0) > 0);
    const pos = tipPos(hover.mx, hover.my, 170, 34 + active.length * 16);
    return tmPortal(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "div",
        {
          className: cx(styles_module_css_default.tipfixed, props.floatTip === true ? styles_module_css_default.tipfloat : void 0),
          style: { ...pos, fontSize: 10.5 },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontWeight: 600 }, children: tickLabels !== null ? tickLabels[hover.i] : hover.i + ":00" }),
            active.length > 0 ? sorted(
              active,
              (a, b) => (b.values[hover.i] || 0) - (a.values[hover.i] || 0)
            ).map((s) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.dot, style: { background: s.color, width: 6, height: 6 } }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "span",
                {
                  className: styles_module_css_default.tipK,
                  style: { overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80 },
                  children: s.shortName
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: fmt(s.values[hover.i] || 0) })
            ] }, s.name)) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { color: "var(--dsw-alias-label-tertiary)" }, children: "\u8BE5\u5C0F\u65F6\u65E0\u6D88\u8017" })
          ]
        }
      )
    );
  })() : null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.svgwrap, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { className: styles_module_css_default.spark, viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", ref: svgRef, children: kids }),
    tip
  ] });
}
function RangeSelect(props) {
  const [open, setOpen] = (0, import_react5.useState)(false);
  const hit = (props.options || []).filter((o) => o.v === props.value)[0];
  const selector = /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "button",
    {
      type: "button",
      className: styles_module_css_default.selector,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      onClick: () => setOpen((v) => !v),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.selectorLabel, children: hit ? hit.t : props.value }),
        import_dsh_client_ui_primitives3.IconChevronDownOutlineRegular ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_dsh_client_ui_primitives3.IconChevronDownOutlineRegular, { className: styles_module_css_default.chevron }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.chevron, children: "\u25BE" })
      ]
    }
  );
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    import_dsh_client_ui_primitives3.Menu,
    {
      open,
      onClose: () => setOpen(false),
      items: (props.options || []).map((o) => ({ id: o.v, label: o.t })),
      selectedId: props.value,
      onSelect: (id) => {
        setOpen(false);
        props.onPick(id);
      },
      align: "end",
      portal: true,
      anchor: selector
    }
  );
}
var shared = { data: null, err: "", at: 0, inflight: null, subs: /* @__PURE__ */ new Set() };
function notifyShared() {
  for (const fn of shared.subs) {
    try {
      fn();
    } catch {
    }
  }
}
function writeShared(data) {
  shared.data = data;
  shared.err = "";
  shared.at = Date.now();
  notifyShared();
}
function ensureSharedStats(force) {
  if (!force && shared.data && Date.now() - shared.at < 45e3) return Promise.resolve(shared.data);
  if (shared.inflight) return shared.inflight;
  const p = fetchStats().then((v) => {
    shared.inflight = null;
    if (v && v.ready === true) writeShared(v);
    else {
      shared.err = String(v?.error || "\u7EDF\u8BA1\u670D\u52A1\u4E0D\u53EF\u7528");
      notifyShared();
    }
    return shared.data;
  }).catch(() => {
    shared.inflight = null;
    shared.err = "\u8FDE\u63A5\u5931\u8D25";
    notifyShared();
    return shared.data;
  });
  shared.inflight = p;
  return p;
}
function useSharedStats() {
  const [, forceUpdate] = (0, import_react5.useReducer)((x) => x + 1, 0);
  (0, import_react5.useEffect)(() => {
    const fn = () => forceUpdate();
    shared.subs.add(fn);
    if (!shared.data && !shared.inflight) void ensureSharedStats();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void ensureSharedStats();
    }, 6e4);
    return () => {
      shared.subs.delete(fn);
      window.clearInterval(id);
    };
  }, []);
  return {
    data: shared.data,
    err: shared.err,
    loading: !shared.data && !!shared.inflight,
    reload: (force) => void ensureSharedStats(force)
  };
}
function widgetBtns(widgets2, widgetId) {
  if (!widgets2 || !widgetId || !widgets2.WidgetToggle) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(widgets2.WidgetToggle, { id: widgetId });
}
function useWidgetOpen(widgets2, widgetId) {
  const list = widgets2 && typeof widgets2.useWidgets === "function" ? widgets2.useWidgets() : [];
  return !!(widgetId && list.some((w) => w.id === widgetId));
}
function HiddenWhenFloated(props) {
  const open = useWidgetOpen(props.widgets, props.id);
  if (open) return null;
  return props.children === void 0 ? null : props.children;
}
function StatCardsSection(props) {
  const aggAll = props.aggAll;
  const data = props.data;
  const [pop, setPop] = (0, import_react5.useState)(null);
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const leave = () => setPop(null);
  const todayK = keyOf(Date.now());
  const st = streaks(aggAll.byDay);
  let peakDay = null;
  for (const day of aggAll.byDay.values()) {
    if (peakDay === null || day.t > peakDay.t) peakDay = day;
  }
  const dayVals = Array.from(aggAll.byDay.values()).map((d) => d.t);
  const avgDay = dayVals.length > 0 ? aggAll.total / dayVals.length : 0;
  const medDay = median(dayVals);
  const allDays = buildDayList(aggAll.first, todayK);
  const dayVal = (k) => {
    const d = aggAll.byDay.get(k);
    return d === void 0 ? 0 : d.t;
  };
  const sparkVals = allDays.slice(-30).map(dayVal);
  const last7 = allDays.slice(-7).reduce((s, k) => s + dayVal(k), 0);
  const prev7 = allDays.slice(-14, -7).reduce((s, k) => s + dayVal(k), 0);
  const CI = "#4c7ef3", CO = "#2fb261", CC = "#f5a623";
  const cards = [];
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "layers",
        label: "\u7D2F\u8BA1 Token",
        count: aggAll.total,
        tint: true,
        sub: "\u8F93\u5165 " + fmt(aggAll.i) + " \xB7 \u8F93\u51FA " + fmt(aggAll.o),
        delay: cards.length * 45,
        onHover: (e) => setPop({
          mx: e.clientX,
          my: e.clientY,
          content: breakdown("\u7D2F\u8BA1\u6784\u6210", [
            ["\u8F93\u5165", aggAll.i, 1, aggAll.total],
            ["\u8F93\u51FA", aggAll.o, 1, aggAll.total],
            ["\u7F13\u5B58\u8BFB", aggAll.cr, 1, aggAll.total],
            ["\u7F13\u5B58\u5199", aggAll.cw, 1, aggAll.total]
          ])
        }),
        onLeave: leave,
        visual: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            ComposeBar,
            {
              parts: [
                ["\u8F93\u5165", aggAll.i, CI],
                ["\u8F93\u51FA", aggAll.o, CO],
                ["\u7F13\u5B58\u8BFB", aggAll.cr, CC],
                ["\u7F13\u5B58\u5199", aggAll.cw, "#9a6ef1"]
              ]
            }
          )
        ]
      },
      "kpi-\u7D2F\u8BA1 Token"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "trend",
        label: "\u8FD1 30 \u5929\u8D70\u52BF",
        count: sparkVals.reduce((s, v) => s + v, 0),
        sub: "\u6BCF\u65E5\u7528\u91CF\u8FF7\u4F60\u56FE",
        delay: cards.length * 45,
        visual: [/* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkline, { values: sparkVals }), /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TrendDelta, { recent: last7, before: prev7 })]
      },
      "kpi-\u8FD1 30 \u5929\u8D70\u52BF"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "database",
        label: "\u7F13\u5B58 Token",
        count: aggAll.cr + aggAll.cw,
        sub: "\u547D\u4E2D " + fmt(aggAll.cr) + " \xB7 \u5199\u5165 " + fmt(aggAll.cw),
        delay: cards.length * 45,
        onHover: (e) => setPop({
          mx: e.clientX,
          my: e.clientY,
          content: breakdown(
            "\u7F13\u5B58\u6784\u6210 \xB7 \u547D\u4E2D\u7387 " + (aggAll.total > 0 ? (aggAll.cr / aggAll.total * 100).toFixed(1) : "0.0") + "%",
            [
              ["\u7F13\u5B58\u8BFB\uFF08\u547D\u4E2D\uFF09", aggAll.cr, 1, aggAll.total],
              ["\u7F13\u5B58\u5199", aggAll.cw, 1, aggAll.total]
            ]
          )
        }),
        onLeave: leave,
        visual: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            ComposeBar,
            {
              parts: [
                ["\u7F13\u5B58\u8BFB", aggAll.cr, CC],
                ["\u7F13\u5B58\u5199", aggAll.cw, "#9a6ef1"]
              ]
            }
          )
        ]
      },
      "kpi-\u7F13\u5B58 Token"
    )
  );
  cards.push(
    data.peakStep ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "bolt",
        label: "\u5CF0\u503C\u5355\u6B21\u8BF7\u6C42",
        count: data.peakStep.tokens,
        sub: data.peakStep.model + " \xB7 " + dispDay(data.peakStep.d),
        delay: cards.length * 45
      },
      "kpi-\u5CF0\u503C\u5355\u6B21\u8BF7\u6C42"
    ) : null
  );
  cards.push(
    peakDay ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "mountain",
        label: "\u5CF0\u503C\u5355\u65E5",
        count: peakDay.t,
        sub: dispDay(peakDay.d),
        delay: cards.length * 45,
        onHover: (e) => setPop({
          mx: e.clientX,
          my: e.clientY,
          content: breakdown(
            peakDay.d + " \u5404\u6A21\u578B",
            sorted(
              Object.entries(peakDay.byModel || {}),
              (a, b) => b[1] - a[1]
            ).slice(0, 6).map(
              ([mk, v]) => [mk, v, 1, peakDay.t]
            )
          )
        }),
        onLeave: leave,
        visual: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            ComposeBar,
            {
              parts: sorted(
                Object.entries(peakDay.byModel || {}),
                (a, b) => b[1] - a[1]
              ).slice(0, 4).map(([mk, v]) => {
                const info = data.models[mk];
                return [info ? info.model : mk, v, modelColor(mk)];
              })
            }
          )
        ]
      },
      "kpi-\u5CF0\u503C\u5355\u65E5"
    ) : null
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "wave",
        label: "\u65E5\u5747\u6D88\u8017",
        count: avgDay,
        sub: "\u6309\u6D3B\u8DC3\u65E5\u5E73\u5747",
        delay: cards.length * 45,
        visual: [/* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Sparkline, { values: sparkVals, color: CO })]
      },
      "kpi-\u65E5\u5747\u6D88\u8017"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "median",
        label: "\u65E5\u6D88\u8017\u4E2D\u4F4D\u6570",
        count: medDay,
        sub: "\u6309\u6D3B\u8DC3\u65E5\u53D6\u4E2D\u4F4D",
        delay: cards.length * 45
      },
      "kpi-\u65E5\u6D88\u8017\u4E2D\u4F4D\u6570"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "flame",
        label: "\u5F53\u524D\u8FDE\u7EED\u4F7F\u7528",
        count: st.current,
        fmt: (v) => fmt(v) + " \u5929",
        sub: "\u6309\u81EA\u7136\u65E5\u7EDF\u8BA1",
        delay: cards.length * 45,
        visual: [/* @__PURE__ */ (0, import_jsx_runtime6.jsx)(StreakBar, { current: st.current, best: st.longest })]
      },
      "kpi-\u5F53\u524D\u8FDE\u7EED\u4F7F\u7528"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "trophy",
        label: "\u6700\u957F\u8FDE\u7EED\u4F7F\u7528",
        count: st.longest,
        fmt: (v) => fmt(v) + " \u5929",
        sub: "\u5386\u53F2\u6700\u4F73\u7EAA\u5F55",
        delay: cards.length * 45,
        visual: [/* @__PURE__ */ (0, import_jsx_runtime6.jsx)(StreakBar, { current: st.current, best: st.longest })]
      },
      "kpi-\u6700\u957F\u8FDE\u7EED\u4F7F\u7528"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "calendar",
        label: "\u6D3B\u8DC3\u5929\u6570",
        count: aggAll.byDay.size,
        fmt: (v) => fmt(v) + " \u5929",
        sub: "\u5171 " + data.sessions + " \u4E2A\u4F1A\u8BDD",
        delay: cards.length * 45,
        visual: [/* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DaysRibbon, { byDay: aggAll.byDay })]
      },
      "kpi-\u6D3B\u8DC3\u5929\u6570"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "chip",
        label: "\u6A21\u578B\u8C03\u7528\u6B21\u6570",
        count: aggAll.n,
        sub: data.active + " \u4E2A\u4F1A\u8BDD\u6709\u7528\u91CF",
        delay: cards.length * 45
      },
      "kpi-\u6A21\u578B\u8C03\u7528\u6B21\u6570"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "flag",
        label: "\u9996\u6B21\u4F7F\u7528",
        value: dispDay(aggAll.first),
        sub: aggAll.first
      },
      "kpi-\u9996\u6B21\u4F7F\u7528"
    )
  );
  cards.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      StatCard,
      {
        icon: "clock",
        label: "\u6700\u8FD1\u4F7F\u7528",
        value: dispDay(aggAll.last),
        sub: aggAll.last
      },
      "kpi-\u6700\u8FD1\u4F7F\u7528"
    )
  );
  const toolbar = props.widgets && props.widgetId ? widgetBtns(props.widgets, props.widgetId) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.chartTitle, children: [
      cardName("layers", "\u57FA\u7840\u6570\u636E"),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.hint, children: "\u5168\u90E8\u4F1A\u8BDD\u65E5\u5FD7\u805A\u5408 \xB7 \u60AC\u6D6E\u6307\u6807\u5361\u770B\u6784\u6210\u660E\u7EC6" }),
      toolbar
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.grid, children: cards }),
    pop !== null ? tmPortal(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "div",
        {
          className: cx(styles_module_css_default.pop, props.inFloat ? styles_module_css_default.tipAbove : void 0),
          style: tipPos(pop.mx, pop.my, 280, 60),
          children: pop.content
        }
      )
    ) : null
  ] });
}
function TrendSection(props) {
  const data = props.data;
  const aggAll = props.aggAll;
  const [trendRange, setTrendRange] = (0, import_react5.useState)("30d");
  const [modelOff, setModelOff] = (0, import_react5.useState)({});
  const [showTotal, setShowTotal] = (0, import_react5.useState)(false);
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const todayK = keyOf(Date.now());
  const newComp = () => ({ i: 0, o: 0, cr: 0, cw: 0 });
  let trendLabels, trendTitles, trendEmpty;
  let slotComp;
  const trendSeries = [];
  if (trendRange === "24h") {
    const endH = /* @__PURE__ */ new Date();
    endH.setMinutes(0, 0, 0);
    const slots = [];
    for (let k = 23; k >= 0; k--) {
      const t = endH.getTime() - k * 36e5;
      slots.push({ d: keyOf(t), h: new Date(t).getHours() });
    }
    trendLabels = slots.map((s) => s.d === todayK ? s.h + ":00" : "\u6628\u65E5" + s.h + ":00");
    trendTitles = slots.map((s) => cnDate(s.d) + " " + s.h + ":00\u2013" + (s.h + 1) + ":00");
    trendEmpty = "\u8BE5\u5C0F\u65F6\u65E0\u6D88\u8017";
    const slotIdx = /* @__PURE__ */ new Map();
    for (let i = 0; i < slots.length; i++)
      slotIdx.set(
        slots[i].d + "|" + slots[i].h,
        i
      );
    slotComp = Array.from({ length: 24 }, newComp);
    const hourVals = /* @__PURE__ */ new Map();
    for (const r of data.records || []) {
      const idx = slotIdx.get(r.d + "|" + r.h);
      if (idx === void 0) continue;
      let arr = hourVals.get(r.m);
      if (arr === void 0) {
        arr = Array.from({ length: 24 }, () => 0);
        hourVals.set(r.m, arr);
      }
      arr[idx] += tok(r);
      const c = slotComp[idx];
      c.i += r.i || 0;
      c.o += r.o || 0;
      c.cr += r.cr || 0;
      c.cw += r.cw || 0;
    }
    const hourTotal = Array.from({ length: 24 }, () => 0);
    for (const arr of hourVals.values()) {
      for (let i = 0; i < 24; i++) hourTotal[i] += arr[i];
    }
    for (const mk of sorted(Array.from(hourVals.keys()))) {
      trendSeries.push({
        name: mk,
        shortName: (data.models[mk] || {}).model || mk,
        color: modelColor(mk),
        isTotal: false,
        values: hourVals.get(mk),
        visible: !modelOff[mk]
      });
    }
    trendSeries.push({
      name: "__total__",
      shortName: "\u603B Token",
      color: "#8a94a6",
      isTotal: true,
      values: hourTotal,
      visible: showTotal
    });
  } else {
    const N = trendRange === "7d" ? 7 : 30;
    const dayList = buildDayList(keyOf(fromKey(todayK) - (N - 1) * 864e5), todayK);
    trendLabels = dayList.map(dispDay);
    trendTitles = dayList.map(cnDate);
    trendEmpty = "\u5F53\u65E5\u65E0\u6D88\u8017";
    const dayIdx = /* @__PURE__ */ new Map();
    for (let i = 0; i < dayList.length; i++) dayIdx.set(dayList[i], i);
    slotComp = dayList.map(newComp);
    for (const r of data.records || []) {
      const idx = dayIdx.get(r.d);
      if (idx === void 0) continue;
      const c = slotComp[idx];
      c.i += r.i || 0;
      c.o += r.o || 0;
      c.cr += r.cr || 0;
      c.cw += r.cw || 0;
    }
    for (const mk of sorted(Array.from(aggAll.byModel.keys()))) {
      trendSeries.push({
        name: mk,
        shortName: (data.models[mk] || {}).model || mk,
        color: modelColor(mk),
        isTotal: false,
        values: dayList.map((k) => {
          const d = aggAll.byDay.get(k);
          return d !== void 0 && d.byModel[mk] !== void 0 ? d.byModel[mk] : 0;
        }),
        visible: !modelOff[mk]
      });
    }
    trendSeries.push({
      name: "__total__",
      shortName: "\u603B Token",
      color: "#8a94a6",
      isTotal: true,
      values: dayList.map((k) => {
        const d = aggAll.byDay.get(k);
        return d === void 0 ? 0 : d.t;
      }),
      visible: showTotal
    });
  }
  const anyVisible = trendSeries.some((s) => s.visible);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.chartTitle, children: [
      cardName(
        "trend",
        "Token \u4F7F\u7528\u8D8B\u52BF\uFF08" + (trendRange === "24h" ? "\u8FD124\u5C0F\u65F6\u6309\u5C0F\u65F6" : trendRange === "7d" ? "\u8FD17\u5929\u6309\u5929" : "\u8FD130\u5929\u6309\u5929") + " \xB7 \u60AC\u6D6E\u67E5\u770B\u660E\u7EC6\uFF09"
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { display: "inline-flex", gap: 6, alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          Seg,
          {
            options: [
              { v: "24h", t: "\u8FD124\u5C0F\u65F6" },
              { v: "7d", t: "\u8FD17\u5929" },
              { v: "30d", t: "\u8FD130\u5929" }
            ],
            current: trendRange,
            onPick: setTrendRange
          }
        ),
        widgetBtns(props.widgets, props.widgetId)
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.legend, style: { marginBottom: 2, marginTop: 0 }, children: [
      trendSeries.map((s) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "button",
        {
          className: styles_module_css_default.modelchip,
          "data-off": s.visible ? "0" : "1",
          "aria-pressed": s.visible ? "true" : "false",
          onClick: () => {
            if (s.name === "__total__") setShowTotal(!showTotal);
            else setModelOff({ ...modelOff, [s.name]: !modelOff[s.name] });
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.dot, style: { background: s.color } }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.mcName, children: s.shortName })
          ]
        },
        s.name
      )),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.hint, style: { marginLeft: 6 }, children: "\u9ED8\u8BA4\u9690\u85CF\u603B\u66F2\u7EBF" })
    ] }),
    anyVisible ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      TrendChart,
      {
        series: trendSeries,
        labels: trendLabels,
        titles: trendTitles,
        emptyText: trendEmpty,
        comp: slotComp,
        above: props.inFloat === true
      },
      trendRange
    ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.empty, children: "\u5168\u90E8\u66F2\u7EBF\u5DF2\u9690\u85CF \u2014\u2014 \u70B9\u51FB\u4E0A\u65B9\u6807\u7B7E\u6062\u590D" })
  ] });
}
function HeatSection(props) {
  const data = props.data;
  const aggAll = props.aggAll;
  const [picked, setPicked] = (0, import_react5.useState)(readHeatSpan());
  const [cardW, setCardW] = (0, import_react5.useState)(0);
  const cardRef = (0, import_react5.useRef)(null);
  (0, import_react5.useLayoutEffect)(() => {
    const el = cardRef.current;
    if (!el) return void 0;
    const read = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      setCardW((prev) => prev === w ? prev : w);
    };
    read();
    if (typeof ResizeObserver === "undefined") return void 0;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const span = picked !== "" ? picked : cardW === 0 || cardW >= HEAT_WIDE_PX ? "12" : "6";
  const pickSpan = (v) => {
    setPicked(v);
    try {
      window.localStorage.setItem(HEAT_SPAN_KEY, v);
    } catch {
    }
  };
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const HEAT_OPS = [0.16, 0.3, 0.5, 0.72, 0.95];
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.card, ref: cardRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.chartTitle, children: [
      cardName("grid", "Token \u6D3B\u52A8\u70ED\u529B\u56FE\uFF08\u60AC\u6D6E\u67E5\u770B\u5F53\u65E5\u660E\u7EC6\uFF09"),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { display: "inline-flex", gap: 6, alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          Seg,
          {
            options: [
              { v: "6", t: "6\u4E2A\u6708" },
              { v: "12", t: "12\u4E2A\u6708" }
            ],
            current: span,
            onPick: pickSpan
          }
        ),
        widgetBtns(props.widgets, props.widgetId)
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      Heatmap,
      {
        byDay: aggAll.byDay,
        daySessions: data.daySessions || {},
        models: data.models,
        months: Number(span),
        boxW: cardW,
        above: props.inFloat === true
      },
      span
    ),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.legend, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.muted, children: "\u5C11" }),
      HEAT_OPS.map((o, i) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.cell, style: { background: BP, opacity: o } }, i)),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.muted, children: "\u591A" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.cacheRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.xdot, style: { background: "#f5a623" } }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u7F13\u5B58\u8BFB " + fmt(aggAll.cr) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.cacheSep, children: "\xB7" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.xdot, style: { background: "#9a6ef1" } }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u7F13\u5B58\u5199 " + fmt(aggAll.cw) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.cacheSep, children: "\xB7" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u7F13\u5B58\u5360\u6BD4 " + (aggAll.total > 0 ? ((aggAll.cr + aggAll.cw) / aggAll.total * 100).toFixed(1) : "0.0") + "%" })
    ] })
  ] });
}
function DonutSection(props) {
  const data = props.data;
  const sc = props.agg;
  const [pop, setPop] = (0, import_react5.useState)(null);
  const open = useWidgetOpen(props.widgets, props.widgetId);
  if (props.inPlace && open) return null;
  const leave = () => setPop(null);
  const arr = sorted(Array.from(sc.byModel.values()), (a, b) => b.t - a.t);
  if (arr.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cx(styles_module_css_default.card, styles_module_css_default.empty), children: "\u8BE5\u8303\u56F4\u5185\u6682\u65E0\u6A21\u578B\u7528\u91CF" });
  const donutEntries = arr.slice(0, 7).map((m) => ({ name: m.m, t: m.t, color: modelColor(m.m) }));
  const rest = arr.slice(7);
  if (rest.length > 0)
    donutEntries.push({ name: "\u5176\u4ED6", t: rest.reduce((s, m) => s + m.t, 0), color: "#8a94a6" });
  const modelRows = arr.map((m, i) => {
    const info = data.models[m.m] || null;
    const name = info ? info.model : m.m;
    const color = modelColor(m.m);
    const pct = sc.total > 0 ? m.t / sc.total * 100 : 0;
    const hoverContent = () => breakdown(m.m + " \u7528\u91CF\u6784\u6210", [
      ["\u8F93\u5165", m.i, 1, m.t],
      ["\u8F93\u51FA", m.o, 1, m.t],
      ["\u7F13\u5B58\u8BFB", m.cr, 1, m.t],
      ["\u7F13\u5B58\u5199", m.cw, 1, m.t]
    ]);
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "div",
      {
        className: styles_module_css_default.model,
        onMouseEnter: (e) => setPop({ mx: e.clientX, my: e.clientY, content: hoverContent() }),
        onMouseMove: (e) => setPop({ mx: e.clientX, my: e.clientY, content: hoverContent() }),
        onMouseLeave: leave,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.dot, style: { background: color } }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { minWidth: 0, flex: "1" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.modelhead, children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.modelname, children: name }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.modelval, children: fmt(m.t) + " \xB7 " + pct.toFixed(1) + "%" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.bartrack, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "span",
              {
                className: styles_module_css_default.barfill,
                style: {
                  // 进度条与同一行印出的百分比**必须同口径**：都占总量（sc.total），
                  // 也就是环形图那一段的占比。旧写法除以 `arr[0]`（榜首模型），于是第一名
                  // 的条永远满格、旁边却写着 53.3%，同一行里两个分母，看着就是"对不上"。
                  // 顺带：这样每行的条长与上方圆环里对应的扇区长度也一致了。
                  width: Math.min(100, Math.max(0, pct)).toFixed(1) + "%",
                  background: color,
                  animationDelay: i * 40 + 120 + "ms"
                }
              }
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cx(styles_module_css_default.muted, styles_module_css_default.modeldetail), children: (info && info.provider ? info.provider + " \xB7 " : "") + "\u8F93\u5165 " + fmt(m.i) + " \xB7 \u8F93\u51FA " + fmt(m.o) + " \xB7 \u7F13\u5B58 " + fmt(m.cr + m.cw) + " \xB7 " + fmtFull(m.n) + " \u6B21" })
          ] })
        ]
      },
      m.m
    );
  });
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.card, children: [
    props.prepend ? props.prepend : null,
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.chartTitle, children: [
      cardName("donut", "\u6A21\u578B\u7528\u91CF\u5206\u5E03\uFF08" + props.rangeLabel + " \xB7 \u60AC\u6D6E\u67E5\u770B\u6784\u6210\uFF09"),
      widgetBtns(props.widgets, props.widgetId)
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.flexrow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Donut, { entries: donutEntries, total: sc.total }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.models, children: modelRows })
    ] }),
    pop !== null ? tmPortal(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "div",
        {
          className: cx(styles_module_css_default.pop, props.inFloat ? styles_module_css_default.tipAbove : void 0),
          style: tipPos(pop.mx, pop.my, 280, 60),
          children: pop.content
        }
      )
    ) : null
  ] });
}
function StatsWidget(props) {
  const { data, err, loading } = useSharedStats();
  const [range, setRange] = (0, import_react5.useState)("30");
  const aggAll = (0, import_react5.useMemo)(() => {
    if (!data) return null;
    buildModelColors(data.models || {});
    return aggregate(data.records || [], null);
  }, [data]);
  if (!data || !aggAll) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.hint, children: err ? "\u7EDF\u8BA1\u52A0\u8F7D\u5931\u8D25\uFF1A" + err : loading ? "\u6B63\u5728\u805A\u5408\u4F1A\u8BDD\u65E5\u5FD7\u2026" : "\u6682\u65E0\u6570\u636E\uFF08\u6253\u5F00\u4E2D\u5FC3\u533A\u300C\u7528\u91CF\u7EDF\u8BA1\u300D\u53EF\u52A0\u901F\u52A0\u8F7D\uFF09" });
  }
  const aa = aggAll;
  const w = { widgets: props.widgets, widgetId: props.widgetId };
  if (props.kind === "trend") return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TrendSection, { data, aggAll: aa, inFloat: true, ...w });
  if (props.kind === "heat") return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(HeatSection, { data, aggAll: aa, inFloat: true, ...w });
  if (props.kind === "donut") {
    const tk = keyOf(Date.now());
    const cut = range === "all" ? null : keyOf(fromKey(tk) - (Number(range) - 1) * 864e5);
    const scoped = cut === null ? null : aggregate(data.records || [], cut);
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      DonutSection,
      {
        data,
        agg: scoped !== null ? scoped : aa,
        rangeLabel: rangeText(range),
        inFloat: true,
        ...w,
        prepend: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.segRow, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          Seg,
          {
            options: [
              { v: "7", t: "\u8FD17\u5929" },
              { v: "30", t: "\u8FD130\u5929" },
              { v: "90", t: "\u8FD190\u5929" },
              { v: "all", t: "\u5168\u90E8" }
            ],
            current: range,
            onPick: setRange
          }
        ) })
      }
    );
  }
  if (props.kind === "today")
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(TodayCard, { wide: true, bare: true, name: "\u4ECA\u65E5\u6D88\u8017", inFloat: true, ...w });
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(StatCardsSection, { aggAll: aa, data, inFloat: true, ...w });
}
function StatsSettingsPage(props) {
  const showPrefs = props.showPrefs !== false;
  const Btn = import_dsh_client_ui_primitives3.Button || (({ children: children2, ...rest }) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: styles_module_css_default.btn, ...rest, children: children2 }));
  const [data, setData] = (0, import_react5.useState)(null);
  const [err, setErr] = (0, import_react5.useState)(null);
  const [loading, setLoading] = (0, import_react5.useState)(true);
  const [range, setRange] = (0, import_react5.useState)(props.defaultRange || "all");
  const [todayOn, setTodayOn] = (0, import_react5.useState)(false);
  const fl = useTmTodayFloat();
  (0, import_react5.useEffect)(() => {
    setRange(props.defaultRange || "all");
  }, [props.defaultRange]);
  (0, import_react5.useEffect)(() => {
    setTodayOn(props.showToday === true);
  }, [props.showToday]);
  const inflight = (0, import_react5.useRef)(false);
  const lastSig = (0, import_react5.useRef)(null);
  const spinTimer = (0, import_react5.useRef)(0);
  const dataRef = (0, import_react5.useRef)(null);
  dataRef.current = data;
  const stallRef = (0, import_react5.useRef)({ scanned: -1, same: 0 });
  const sigOf = (v) => v.scanned + "/" + v.total + "/" + v.errors + "/" + (v.partial ? 1 : 0) + "/" + v.records.length + "/" + v.records.reduce((s, r) => s + tok(r), 0);
  const refresh = (0, import_react5.useCallback)((force) => {
    if (inflight.current && force !== true) return;
    inflight.current = true;
    window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => setLoading(true), 400);
    fetchStats().then((value) => {
      window.clearTimeout(spinTimer.current);
      inflight.current = false;
      setLoading(false);
      if (value && value.ready === true) {
        writeShared(value);
        const sig = sigOf(value);
        if (sig !== lastSig.current) {
          lastSig.current = sig;
          setData(value);
          setErr(null);
        }
      } else setErr(value && value.error || "\u7EDF\u8BA1\u670D\u52A1\u4E0D\u53EF\u7528");
    }).catch((e) => {
      window.clearTimeout(spinTimer.current);
      inflight.current = false;
      setLoading(false);
      setErr(String(e?.message ?? e));
    });
  }, []);
  (0, import_react5.useEffect)(() => {
    refresh(true);
  }, [refresh]);
  (0, import_react5.useEffect)(() => {
    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const id = window.setInterval(tick, 6e4);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.clearTimeout(spinTimer.current);
    };
  }, [refresh]);
  (0, import_react5.useEffect)(() => {
    if (data === null || data.partial !== true) {
      stallRef.current.same = 0;
      return void 0;
    }
    let alive = true;
    let timer = 0;
    const st = stallRef.current;
    if (data.scanned === st.scanned) st.same++;
    else {
      st.same = 0;
      st.scanned = data.scanned;
    }
    const arm = () => {
      if (!alive) return;
      timer = window.setTimeout(
        () => {
          if (!alive) return;
          const d = dataRef.current;
          if (d !== null && d.partial === true) {
            if (d.scanned === st.scanned) st.same++;
            else {
              st.same = 0;
              st.scanned = d.scanned;
            }
            if (document.visibilityState === "visible") refresh();
          }
          arm();
        },
        st.same >= 8 ? 12e3 : 2e3
      );
    };
    arm();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [data, refresh]);
  const derived = (0, import_react5.useMemo)(() => {
    if (data === null) return null;
    buildModelColors(data.models || {});
    const tk = keyOf(Date.now());
    const c = range === "all" ? null : keyOf(fromKey(tk) - (Number(range) - 1) * 864e5);
    return {
      todayK: tk,
      cut: c,
      scoped: c === null ? null : aggregate(data.records || [], c),
      aggAll: aggregate(data.records || [], null)
    };
  }, [data, range]);
  const setToday = async (on) => {
    setTodayOn(on);
    try {
      await saveConfig({ showToday: on });
    } catch {
    }
    try {
      window.dispatchEvent(new CustomEvent("tm-today-toggle", { detail: { on } }));
    } catch {
    }
    props.onPrefs();
  };
  const children = [];
  if (showPrefs) children.push(/* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { className: styles_module_css_default.title, children: "Token \u7528\u91CF\u7EDF\u8BA1" }));
  if (showPrefs) {
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: styles_module_css_default.desc, children: "\u805A\u5408\u672C\u673A\u5168\u90E8\u4F1A\u8BDD\u65E5\u5FD7\uFF08\u542B\u5B50\u4EE3\u7406\u4F1A\u8BDD\uFF1Bfork/resume \u79CD\u5B50\u4E8B\u4EF6\u5DF2\u53BB\u91CD\uFF09\u3002\u6570\u636E\u6BCF 60 \u79D2\u81EA\u52A8\u5237\u65B0\uFF1B\u65F6\u95F4\u8303\u56F4\u4F5C\u7528\u4E8E\u5F53\u524D\u8303\u56F4\u5361\u7247\u4E0E\u6A21\u578B\u5206\u5E03\uFF0C\u8D8B\u52BF\u56FE\u7528\u81EA\u5E26\u7684\u8FD124\u5C0F\u65F6 / \u8FD17\u5929 / \u8FD130\u5929\u5207\u6362\uFF0C\u603B\u89C8\u4E0E\u70ED\u529B\u56FE\u4E3A\u5168\u91CF\u6570\u636E\u3002" })
    );
  }
  if (showPrefs) {
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.swrow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.swrowText, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.swlabel, children: "\u5728\u4FA7\u8FB9\u680F\u663E\u793A\u4ECA\u65E5\u7528\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.swhint, children: "\u5F00\u542F\u540E\u5DE6\u4FA7\u8FB9\u680F\u5E95\u90E8\u663E\u793A\u4ECA\u65E5 Token \u6D88\u8017\u5C0F\u5361\u7247\uFF08\u542B\u5206\u8272\u5C0F\u65F6\u66F2\u7EBF\u4E0E\u6628\u65E5\u5BF9\u6BD4\uFF1B\u504F\u597D\u5B58 settings.yaml \xB7 dshp-token-meter\uFF09" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "button",
          {
            className: styles_module_css_default.switch,
            role: "switch",
            "aria-checked": todayOn ? "true" : "false",
            "aria-label": "\u5728\u4FA7\u8FB9\u680F\u663E\u793A\u4ECA\u65E5\u7528\u91CF",
            onClick: () => void setToday(!todayOn),
            children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.knob })
          }
        )
      ] })
    );
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.swrow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.swrowText, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.swlabel, children: "\u4ECA\u65E5\u5361\u7247\u6D6E\u7A97" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.swhint, children: "\u5F39\u51FA\u540E\u53EF\u62D6\u5230\u5C4F\u5E55\u4EFB\u610F\u4F4D\u7F6E\uFF0C\u4FA7\u8FB9\u680F\u4E0D\u518D\u5360\u4F4D\uFF1B\u5F00\u5173\u4E0E\u5750\u6807\u5B58\u672C\u673A localStorage" })
        ] }),
        fl.open ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { variant: "outline", size: "sm", onClick: () => tmTodaySet(false), children: "\u6536\u56DE\u4FA7\u8FB9\u680F" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.hint, children: "\u5728\u4FA7\u8FB9\u680F\u4E2D\uFF08\u5361\u7247\u6807\u9898\u680F \u283F \u53EF\u62D6\u51FA\uFF09" })
      ] })
    );
  }
  if (err) {
    children.push(/* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: "\u8BFB\u53D6\u5931\u8D25\uFF1A" + err }));
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { variant: "outline", size: "sm", onClick: () => refresh(true), children: "\u91CD\u8BD5" })
    );
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.page, children });
  }
  if (data === null) {
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cx(styles_module_css_default.notice, styles_module_css_default.noticeEmpty), children: loading ? "\u6B63\u5728\u7EDF\u8BA1\u4F1A\u8BDD\u65E5\u5FD7\u2026" : "\u6682\u65E0\u6570\u636E" })
    );
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.page, children });
  }
  const dd = derived;
  const scoped = dd.scoped;
  const aggAll = dd.aggAll;
  const hasData = aggAll.first !== null;
  children.push(
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.toolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("label", { className: styles_module_css_default.hint, children: "\u65F6\u95F4\u8303\u56F4" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RangeSelect, { options: RANGES, value: range, onPick: (v) => setRange(v) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.hint, style: { marginLeft: "auto" }, children: "\u66F4\u65B0\u4E8E " + hhmm(data.generatedAt) + (loading ? " \xB7 \u5237\u65B0\u4E2D\u2026" : "") }),
      data.storage === "disabled" ? import_dsh_client_ui_primitives3.Tooltip ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        import_dsh_client_ui_primitives3.Tooltip,
        {
          label: "\u7EDF\u8BA1\u4ECD\u6B63\u5E38\u8FD0\u884C\uFF1B\u91CD\u542F\u540E\u9700\u5168\u91CF\u91CD\u626B\u3002\u8BE6\u60C5\u89C1\u5BBF\u4E3B\u65E5\u5FD7 [dshp-token-meter] storage domain",
          side: "bottom",
          children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.hint, style: { cursor: "help" }, children: "\u26A0 \u65E0\u6301\u4E45\u7F13\u5B58" })
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.hint, title: "\u7EDF\u8BA1\u4ECD\u6B63\u5E38\u8FD0\u884C\uFF1B\u91CD\u542F\u540E\u9700\u5168\u91CF\u91CD\u626B", children: "\u26A0 \u65E0\u6301\u4E45\u7F13\u5B58" }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        Btn,
        {
          variant: "outline",
          size: "sm",
          onClick: () => refresh(),
          disabled: loading,
          icon: loading && import_dsh_client_ui_primitives3.IconLoadingOutlineRegular ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_dsh_client_ui_primitives3.IconLoadingOutlineRegular, {}) : import_dsh_client_ui_primitives3.IconRefreshOutlineRegular ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_dsh_client_ui_primitives3.IconRefreshOutlineRegular, { size: 14 }) : void 0,
          children: loading ? "\u5237\u65B0\u4E2D\u2026" : "\u5237\u65B0"
        }
      )
    ] })
  );
  {
    const pct = data.total > 0 ? Math.round(data.scanned / data.total * 100) : 0;
    children.push(
      data.partial === true ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "div",
        {
          className: cx(styles_module_css_default.notice, styles_module_css_default.noticeEmpty),
          style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u540E\u53F0\u7EDF\u8BA1\u4E2D " + pct + "%\uFF08" + data.scanned + "/" + data.total + " \u4E2A\u4F1A\u8BDD\uFF09\u2014\u2014 \u5DF2\u626B\u63CF\u90E8\u5206\u5148\u5C55\u793A\uFF0C\u5B8C\u6210\u540E\u81EA\u52A8\u8865\u5168\u3002" }),
            data.errors > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.muted, children: data.errors + " \u4E2A\u4F1A\u8BDD\u8BFB\u53D6\u5931\u8D25\u5DF2\u8DF3\u8FC7" }) : null
          ]
        }
      ) : null
    );
  }
  if (!hasData) {
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.empty, children: "\u6682\u65E0 Token \u7528\u91CF\u6570\u636E \u2014 \u53D1\u8D77\u4E00\u6B21\u5BF9\u8BDD\u540E\u4F1A\u81EA\u52A8\u7EDF\u8BA1\uFF08\u5DF2\u626B\u63CF " + data.sessions + " \u4E2A\u4F1A\u8BDD\uFF09" })
    );
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.page, children });
  }
  const span = (cls, key, node) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: cls, children: node }, key);
  const cards = [];
  cards.push(
    span(
      styles_module_css_default.c12,
      "cards",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        StatCardsSection,
        {
          aggAll,
          data,
          widgets: props.widgets || null,
          widgetId: "stats:cards",
          inPlace: true
        }
      )
    )
  );
  if (scoped !== null) {
    cards.push(
      span(
        styles_module_css_default.c12,
        "range",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.card, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.muted, children: "\u5F53\u524D\u8303\u56F4\uFF08" + rangeText(range) + "\uFF09" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontVariantNumeric: "tabular-nums" }, children: fmt(scoped.total) + " tokens \xB7 \u8F93\u5165 " + fmt(scoped.i) + " \xB7 \u8F93\u51FA " + fmt(scoped.o) + " \xB7 " + fmtFull(scoped.n) + " \u6B21\u8C03\u7528" })
            ]
          }
        ) })
      )
    );
  }
  cards.push(
    span(
      styles_module_css_default.c12,
      "trend",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        TrendSection,
        {
          data,
          aggAll,
          widgets: props.widgets || null,
          widgetId: "stats:trend",
          inPlace: true
        }
      )
    )
  );
  cards.push(
    span(
      styles_module_css_default.c12,
      "heat",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        HeatSection,
        {
          data,
          aggAll,
          widgets: props.widgets || null,
          widgetId: "stats:heat",
          inPlace: true
        }
      )
    )
  );
  cards.push(
    span(
      styles_module_css_default.c12,
      "donut",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.donutWide, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        DonutSection,
        {
          data,
          agg: scoped !== null ? scoped : aggAll,
          rangeLabel: rangeText(range),
          widgets: props.widgets || null,
          widgetId: "stats:donut",
          inPlace: true
        }
      ) })
    )
  );
  cards.push(
    span(
      styles_module_css_default.c12,
      "note",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.muted, style: { margin: "0 2px" }, children: "\u7EDF\u8BA1\u53E3\u5F84\uFF1A\u603B Token = \u8F93\u5165 + \u7F13\u5B58\u8BFB + \u7F13\u5B58\u5199 + \u8F93\u51FA\uFF08reasoning \u5DF2\u542B\u5728\u8F93\u51FA\u5185\uFF09\uFF1B\u540C\u4E00\u8BF7\u6C42\u7684\u91C7\u6837 usage \u88AB\u7EC8\u503C\u8986\u76D6\uFF0C\u4E0D\u91CD\u590D\u7D2F\u8BA1\uFF1Bfork/resume \u79CD\u5B50\u4E8B\u4EF6\u5DF2\u53BB\u91CD\u3002" })
    )
  );
  children.push(/* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.dash, children: cards }));
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.page, children });
}
function TodayCard(props) {
  const wide = !(props && props.wide === false);
  const isFloat = !!(props && props.float === true);
  const bare = !!(props && props.bare === true);
  const floatPos = props && props.floatPos || null;
  const floatXY = isFloat ? tmTodayClamp(floatPos || tmTodayLoadPos() || tmTodayDefaultPos()) : null;
  const [data, setData] = (0, import_react5.useState)(null);
  const [tip, setTip] = (0, import_react5.useState)(null);
  const doRefresh = (0, import_react5.useCallback)(() => {
    fetchStats().then((v) => {
      if (v && v.ready === true) setData(v);
    }).catch(() => {
    });
  }, []);
  (0, import_react5.useEffect)(() => {
    doRefresh();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") doRefresh();
    }, 6e4);
    return () => {
      window.clearInterval(id);
    };
  }, [doRefresh]);
  if (data === null) {
    if (isFloat) {
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "div",
        {
          className: styles_module_css_default.float,
          style: { left: floatXY.x + "px", top: floatXY.y + "px" },
          children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "div",
            {
              className: cx(styles_module_css_default.todayhead, styles_module_css_default.floathead),
              title: "\u6309\u4F4F\u62D6\u5230\u4EFB\u610F\u4F4D\u7F6E \xB7 \u53CC\u51FB\u6536\u56DE\u4FA7\u8FB9\u680F",
              onPointerDown: tmFloatDrag,
              onDoubleClick: () => tmTodaySet(false),
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: cx(styles_module_css_default.todaylabel, styles_module_css_default.titledIco), children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Glyph, { name: "bolt", size: 13, className: styles_module_css_default.cico }),
                  "\u4ECA\u65E5\u7528\u91CF"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.todayval, style: { opacity: 0.5 }, children: "\u2026" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "button",
                  {
                    className: styles_module_css_default.minibtn,
                    title: "\u6536\u56DE\u4FA7\u8FB9\u680F",
                    onClick: (e) => {
                      if (e.stopPropagation) e.stopPropagation();
                      tmTodaySet(false);
                    },
                    children: "\u{1F4CC}"
                  }
                )
              ]
            }
          )
        }
      );
    }
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: cx(styles_module_css_default.today, wide ? void 0 : styles_module_css_default.todayRail), children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: cx(styles_module_css_default.todaylabel, styles_module_css_default.titledIco), children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Glyph, { name: "bolt", size: 13, className: styles_module_css_default.cico }),
        "\u4ECA\u65E5\u7528\u91CF"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.todayval, style: { opacity: 0.5 }, children: "\u2026" })
    ] });
  }
  buildModelColors(data.models || {});
  const todayK = keyOf(Date.now());
  const yK = keyOf(fromKey(todayK) - 864e5);
  const both = aggregate(data.records || [], yK);
  const dayTotal = (k) => {
    const d = both.byDay.get(k);
    return d === void 0 ? 0 : d.t;
  };
  const todayTotal = dayTotal(todayK);
  const yTotal = dayTotal(yK);
  const delta = yTotal > 0 ? (todayTotal - yTotal) / yTotal * 100 : null;
  if (!wide) {
    const showTip = (e) => setTip({ mx: e.clientX, my: e.clientY });
    const hideTip = () => setTip(null);
    const dTxt = delta === null ? todayTotal > 0 ? "\u6628\u65E5\u65E0\u6D88\u8017" : "\u2014" : (delta >= 0 ? "+" : "") + delta.toFixed(0) + "% vs \u6628\u65E5";
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "div",
      {
        className: cx(styles_module_css_default.today, styles_module_css_default.todayRail),
        onMouseEnter: showTip,
        onMouseMove: showTip,
        onMouseLeave: hideTip,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.todaylabel, children: "\u4ECA\u65E5" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AnimatedNumber, { className: styles_module_css_default.todayval, value: todayTotal, format: fmtRail }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DualBars, { className: styles_module_css_default.dualbars, a: todayTotal, b: yTotal }),
          tip === null ? null : (() => {
            const pos = tipPos(tip.mx, tip.my, 190, 82);
            return tmPortal(
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tipfixed, style: pos, children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.tiprow, style: { fontWeight: 600, marginBottom: 2 }, children: "\u4ECA\u65E5\u7528\u91CF" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipK, children: "\u4ECA\u65E5" }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: fmt(todayTotal) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipK, children: "\u6628\u65E5" }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: fmt(yTotal) })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipK, children: "\u5BF9\u6BD4" }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.tipV, children: dTxt })
                ] })
              ] })
            );
          })()
        ]
      }
    );
  }
  const endH = /* @__PURE__ */ new Date();
  endH.setMinutes(0, 0, 0);
  const hourSlots = [];
  for (let k = 23; k >= 0; k--) {
    const t = endH.getTime() - k * 36e5;
    hourSlots.push({ d: keyOf(t), h: new Date(t).getHours() });
  }
  const hourLabels = hourSlots.map((s) => s.d === todayK ? s.h + ":00" : "\u6628\u65E5" + s.h + ":00");
  const hourIdx = /* @__PURE__ */ new Map();
  for (let i = 0; i < hourSlots.length; i++)
    hourIdx.set(
      hourSlots[i].d + "|" + hourSlots[i].h,
      i
    );
  const hourArrs = /* @__PURE__ */ new Map();
  for (const r of data.records || []) {
    const idx = hourIdx.get(r.d + "|" + r.h);
    if (idx === void 0) continue;
    let arr = hourArrs.get(r.m);
    if (arr === void 0) {
      arr = Array.from({ length: 24 }, () => 0);
      hourArrs.set(r.m, arr);
    }
    arr[idx] += tok(r);
  }
  const modelHourSeries = [];
  for (const mk of sorted(Array.from(hourArrs.keys()))) {
    modelHourSeries.push({
      name: mk,
      shortName: (data.models[mk] || {}).model || mk,
      color: modelColor(mk),
      values: hourArrs.get(mk),
      visible: true
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
    "div",
    {
      ...isFloat ? {
        className: styles_module_css_default.float,
        style: { left: floatXY.x + "px", top: floatXY.y + "px" }
      } : { className: styles_module_css_default.today },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "div",
          {
            ...isFloat ? {
              className: cx(styles_module_css_default.todayhead, styles_module_css_default.floathead),
              title: "\u6309\u4F4F\u62D6\u5230\u4EFB\u610F\u4F4D\u7F6E \xB7 \u53CC\u51FB\u6536\u56DE\u4FA7\u8FB9\u680F",
              onPointerDown: tmFloatDrag,
              onDoubleClick: () => tmTodaySet(false)
            } : { className: styles_module_css_default.todayhead },
            children: [
              isFloat || bare ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.grip, title: "\u6309\u4F4F\u62D6\u51FA\u4E3A\u6D6E\u7A97\uFF0C\u70B9\u6309\u76F4\u63A5\u5F39\u51FA", onPointerDown: tmGripDragOut, children: "\u283F" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: cx(styles_module_css_default.todaylabel, styles_module_css_default.titledIco), children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Glyph, { name: "bolt", size: 13, className: styles_module_css_default.cico }),
                props.name || "\u4ECA\u65E5 Token"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(AnimatedNumber, { className: styles_module_css_default.todayval, value: todayTotal, format: fmt }),
              bare ? widgetBtns(props.widgets, props.widgetId) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "button",
                {
                  className: styles_module_css_default.minibtn,
                  title: isFloat ? "\u6536\u56DE\u4FA7\u8FB9\u680F" : "\u5F39\u51FA\u4E3A\u6D6E\u7A97\uFF08\u53EF\u62D6\u5230\u5C4F\u5E55\u4EFB\u610F\u4F4D\u7F6E\uFF09",
                  onClick: (e) => {
                    if (e.stopPropagation) e.stopPropagation();
                    tmTodaySet(!isFloat);
                  },
                  children: isFloat ? "\u{1F4CC}" : "\u29C9"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          TodayChart,
          {
            series: modelHourSeries,
            n: 24,
            labels: hourLabels,
            floatTip: isFloat || props.inFloat === true
          }
        ),
        modelHourSeries.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.todaymodels, children: modelHourSeries.map((s, si) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "span",
          {
            className: cx(styles_module_css_default.todaymchip, styles_module_css_default.fadein),
            style: { animationDelay: si * 60 + "ms" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: styles_module_css_default.dot, style: { background: s.color } }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: s.shortName })
            ]
          },
          s.name
        )) }) : null,
        delta !== null ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "div",
          {
            className: cx(styles_module_css_default.statgrow, styles_module_css_default.fadein),
            style: {
              marginTop: 4,
              color: delta >= 0 ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-state-error-primary)",
              fontSize: 10.5
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: cx(styles_module_css_default.arrow, delta >= 0 ? styles_module_css_default.arrowUp : styles_module_css_default.arrowDown) }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: (delta >= 0 ? "+" : "") + delta.toFixed(0) + "% vs \u6628\u65E5" })
            ]
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: styles_module_css_default.muted, style: { fontSize: 10, marginTop: 4 }, children: todayTotal > 0 ? "\u6628\u65E5\u65E0\u6D88\u8017" : "\u5F00\u59CB\u4F7F\u7528\u540E\u7EDF\u8BA1" })
      ]
    }
  );
}
function SharePanel(props) {
  const sections = {
    StatCardsSection,
    TrendSection,
    HeatSection,
    DonutSection,
    OnlineEmbed: props.OnlineEmbed
  };
  const [data, setData] = (0, import_react5.useState)(null);
  const [error, setError] = (0, import_react5.useState)("");
  const [ident, setIdent] = (0, import_react5.useState)({ name: "", email: "" });
  (0, import_react5.useEffect)(() => {
    let alive = true;
    void fetchStats().then((v) => {
      if (!alive) return;
      if (v && v.ready === true) setData(v);
      else setError(String(v && v.error || "\u7EDF\u8BA1\u670D\u52A1\u4E0D\u53EF\u7528"));
    }).catch((e) => {
      if (alive) setError(String(e?.message ?? e));
    });
    void fetch("/ext/dshp-token-meter/identity", { cache: "no-store" }).then((r) => r.json()).then((v) => {
      if (alive && v && v.ok === true)
        setIdent({ name: String(v.name || ""), email: String(v.email || "") });
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, []);
  if (data === null)
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      ShareShell,
      {
        data: EMPTY_SNAPSHOT,
        loading: true,
        error,
        sections,
        onClose: props.onClose
      }
    );
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    ShareShell,
    {
      data,
      loading: false,
      error,
      gitName: ident.name,
      gitEmail: ident.email,
      sections,
      onClose: props.onClose
    }
  );
}

// src/client/OnlineSection.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
var GAP_RECOMMEND = 15;
var RANGE_LABELS = [
  [14, "\u8FD1 14 \u5929"],
  [30, "\u8FD1 30 \u5929"],
  [90, "\u8FD1 90 \u5929"],
  [0, "\u5168\u90E8"]
];
var OUTCOME_LABELS = {
  usage: "\u6709\u7528\u91CF",
  "fork-empty": "\u7EE7\u627F\u7A7A\u58F3\uFF08fork \u540E\u6CA1\u5E72\u6D3B\uFF09",
  "no-request": "\u4ECE\u6CA1\u53D1\u8D77\u6A21\u578B\u8BF7\u6C42",
  failed: "\u8BF7\u6C42\u5931\u8D25/\u4E2D\u65AD\uFF08\u6A21\u578B\u6CA1\u56DE\u7B54\uFF09",
  "no-usage": "\u6709\u56DE\u7B54\u4F46\u4F9B\u5E94\u5546\u6CA1\u4E0A\u62A5 usage",
  unreadable: "\u65E5\u5FD7\u8BFB\u4E0D\u51FA\u6765\uFF08\u5DF2\u515C\u5E95\uFF0C\u82E5\u4ECD\u6709\u5219\u4E3A\u7591\u96BE\u65E5\u5FD7\uFF09"
};
var C_MAIN = "var(--dsw-alias-state-business-primary)";
var C_BUSY = "#f5a623";
var CHART_W = 320;
var CHART_H = 150;
function fmtDur(ms) {
  const s = Math.max(0, Math.round((ms || 0) / 1e3));
  if (s < 60) return s + "s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m";
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? h + "h" : h + "h" + String(rest).padStart(2, "0") + "m";
}
function fmtDurCn(ms) {
  const m = Math.max(0, Math.round((ms || 0) / 6e4));
  if (m < 1) return "<1 \u5206";
  if (m < 60) return m + " \u5206";
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? h + " \u5C0F\u65F6" : h + " \u5C0F\u65F6 " + rest + " \u5206";
}
var fmtTok = (n) => {
  const v = Math.round(n || 0);
  if (v >= 1e8) return (v / 1e8).toFixed(2) + " \u4EBF";
  if (v >= 1e4) return (v / 1e4).toFixed(1) + " \u4E07";
  return String(v);
};
var keyOf2 = (t) => {
  const d = new Date(t);
  const M = String(d.getMonth() + 1);
  const D = String(d.getDate());
  return d.getFullYear() + "-" + (M.length < 2 ? "0" + M : M) + "-" + (D.length < 2 ? "0" + D : D);
};
var dispDay2 = (k) => k ? k.slice(5).replace("-", "/") : "";
var cnDate2 = (k) => {
  const p = k.split("-");
  return Number(p[0]) + "\u5E74" + Number(p[1]) + "\u6708" + Number(p[2]) + "\u65E5";
};
function lastNDays(n, now = Date.now()) {
  const out = [];
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    out.push(keyOf2(d.getTime()));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function tipPos2(mx, my, w, h) {
  const vw = typeof window !== "undefined" ? window.innerWidth || 1024 : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight || 768 : 768;
  const flipX = mx + w + 28 > vw;
  const flipY = my + h + 28 > vh;
  return {
    left: flipX ? void 0 : mx + 14 + "px",
    right: flipX ? vw - mx + 14 + "px" : void 0,
    top: flipY ? void 0 : my + 16 + "px",
    bottom: flipY ? vh - my + 16 + "px" : void 0
  };
}
var WEEKDAYS = ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"];
function weekdayOf(k) {
  const p = k.split("-");
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
  return "\u5468" + (WEEKDAYS[d.getDay()] ?? "");
}
function sortByMsDesc(arr) {
  const out = arr.slice();
  return out.sort((a, b) => b.ms - a.ms);
}
function deriveOnlineView(online, gap, rangeDays, now = Date.now()) {
  const g = String(gap);
  const byKey = /* @__PURE__ */ new Map();
  for (const day of online.days) byKey.set(day.d, day);
  const series = [];
  const keys = rangeDays > 0 ? lastNDays(rangeDays, now) : online.days.map((x) => x.d);
  for (const k of keys) {
    const day = byKey.get(k);
    const ms = day ? day.byGap[g] ?? 0 : 0;
    const turnMs = day ? day.turnMs : 0;
    series.push({
      d: k,
      ms,
      turnMs,
      idleMs: Math.max(0, ms - turnMs),
      llmMs: day ? day.llmMs || 0 : 0,
      toolMs: day ? day.toolMs || 0 : 0,
      busyMs: day ? (day.llmMs || 0) + (day.toolMs || 0) : 0,
      tokens: day ? day.tokens : 0,
      sessions: day ? day.sessions : 0,
      seg: day ? day.segByGap ? day.segByGap[g] ?? 0 : 0 : 0,
      actual: day !== void 0
    });
  }
  let peak = null;
  const actualItems = [];
  for (const it of series) {
    if (!it.actual) continue;
    if (peak === null || it.ms > peak.ms) peak = it;
    actualItems.push(it);
  }
  const ranked = sortByMsDesc(actualItems);
  const top = ranked.slice(0, 8);
  const total = online.totalMs[g] ?? 0;
  const turn = online.turnMs;
  const llm = online.llmMs || 0;
  const tool = online.toolMs || 0;
  return {
    gap,
    total,
    turn,
    idle: Math.max(0, total - turn),
    llm,
    tool,
    busy: llm + tool,
    activeDays: online.activeDays,
    avg: online.activeDays > 0 ? total / online.activeDays : 0,
    today: byKey.get(keyOf2(now))?.byGap[g] ?? 0,
    segments: online.segments[g] ?? 0,
    series,
    peak,
    ranked,
    top
  };
}
function cx2(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var ACC_CLASS = {
  exact: styles_module_css_default.exact,
  estimate: styles_module_css_default.estimate,
  bound: styles_module_css_default.bound
};
function portal(node) {
  if (node === null || node === void 0) return null;
  try {
    if (ReactDOM2 && typeof ReactDOM2.createPortal === "function" && typeof document !== "undefined" && document.body)
      return ReactDOM2.createPortal(node, document.body);
  } catch {
  }
  return node;
}
var tipStore = { cur: null, subs: /* @__PURE__ */ new Set() };
function tipEmit() {
  for (const fn of tipStore.subs) {
    try {
      fn();
    } catch {
    }
  }
}
function useTip() {
  return {
    bind: (c) => ({
      onMouseEnter: (e) => {
        tipStore.cur = { x: e.clientX, y: e.clientY, c };
        tipEmit();
      },
      onMouseMove: (e) => {
        const cur = tipStore.cur;
        if (cur !== null && cur.c.k === c.k && cur.x === e.clientX && cur.y === e.clientY) return;
        tipStore.cur = { x: e.clientX, y: e.clientY, c };
        tipEmit();
      },
      onMouseLeave: () => {
        tipStore.cur = null;
        tipEmit();
      }
    })
  };
}
function TipHost() {
  const [, force] = (0, import_react6.useReducer)((x) => x + 1, 0);
  (0, import_react6.useEffect)(() => {
    tipStore.subs.add(force);
    return () => {
      tipStore.subs.delete(force);
    };
  }, [force]);
  const tip = tipStore.cur;
  if (tip === null) return null;
  return portal(
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        className: styles_module_css_default.tipfixed,
        style: tipPos2(
          tip.x,
          tip.y,
          250,
          30 + (tip.c.rows ? tip.c.rows.length * 18 : 0) + (tip.c.text ? 36 : 0)
        ),
        children: [
          tip.c.title ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.tipTitle, children: tip.c.title }) : null,
          (tip.c.rows ?? []).map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.tipK, children: k }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.tipV, children: v })
          ] }, k)),
          tip.c.text ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.tipText, children: tip.c.text }) : null
        ]
      }
    )
  );
}
function useSnapshot() {
  const sharedSnap = useSharedStats();
  return { snap: sharedSnap.data, err: sharedSnap.err, reload: () => sharedSnap.reload(true) };
}
function Seg2(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.seg, children: props.items.map(([v, t]) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "button",
    {
      type: "button",
      className: cx2(styles_module_css_default.segBtn, v === props.value ? styles_module_css_default.segOn : void 0),
      onClick: () => props.onPick(v),
      children: t
    },
    String(v)
  )) });
}
function Acc(props) {
  const map = {
    exact: [styles_module_css_default.badgeOk, "\u7CBE\u786E"],
    estimate: [styles_module_css_default.badgeWarn, "\u4F30\u7B97"],
    bound: [styles_module_css_default.badgeMuted, "\u4E0B\u754C"]
  };
  const picked = map[props.kind];
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: cx2(styles_module_css_default.badge, picked[0]), children: picked[1] });
}
function cardName2(name, text) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: styles_module_css_default.chartName, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Glyph, { name, size: 14, className: styles_module_css_default.cico }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.cnameTxt, children: text })
  ] });
}
function Stat(props) {
  const t = useTip();
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    "div",
    {
      className: cx2(styles_module_css_default.stat, props.wide ? styles_module_css_default.statWide : void 0),
      ...props.tint ? { "data-tint": "1" } : {},
      ...props.tip ? t.bind(props.tip) : {},
      children: [
        props.icon ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Glyph, { name: props.icon, size: 58, className: styles_module_css_default.statBg }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.statLabel, style: { display: "flex", alignItems: "center", gap: 4 }, children: [
          props.icon ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Glyph, { name: props.icon, size: 13, className: styles_module_css_default.statIco }) : null,
          props.label,
          props.acc ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: cx2(styles_module_css_default.acc, ACC_CLASS[props.acc]), children: props.acc === "exact" ? "\u7CBE\u786E" : props.acc === "estimate" ? "\u4F30\u7B97" : "\u4E0B\u754C" }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.statValue, children: props.value }),
        props.sub ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.statSub, children: props.sub }) : null
      ]
    }
  );
}
function AccLegend() {
  const item = (kind, text) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: styles_module_css_default.accLegendItem, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: cx2(styles_module_css_default.acc, ACC_CLASS[kind]), children: kind === "exact" ? "\u7CBE\u786E" : kind === "estimate" ? "\u4F30\u7B97" : "\u4E0B\u754C" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: text })
  ] }, kind);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: styles_module_css_default.accLegend, children: [
    item("exact", "\u65F6\u95F4\u6233\u76F4\u63A5\u7B97\u51FA"),
    item("estimate", "\u7531\u533A\u95F4\u63A8\u65AD"),
    item("bound", "\u5B9E\u9645\u53EA\u4F1A\u66F4\u591A")
  ] });
}
function Dot(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    "span",
    {
      className: styles_module_css_default.dot,
      style: { background: props.color, opacity: props.faint ? 0.35 : 1, marginTop: 0 }
    }
  );
}
function Legend() {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.legend, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Dot, { color: C_MAIN }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.hint, children: "\u5BF9\u8BDD\u8FDB\u884C\u4E2D" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Dot, { color: C_MAIN, faint: true }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.hint, children: "\u7A7A\u6863\uFF08\u2264 \u9608\u503C\u7684\u8FFD\u95EE/\u6536\u5C3E\uFF0C\u7B97\u5728\u7EBF\u4E0D\u7B97\u5BF9\u8BDD\uFF09" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Dot, { color: C_BUSY }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.hint, children: "\u6A21\u578B + \u5DE5\u5177\uFF08\u5E76\u884C\u76F8\u52A0\uFF0C\u53EF\u9AD8\u4E8E\u67F1\u9AD8\uFF09" })
  ] });
}
function Chart(props) {
  const items = props.items;
  const boxRef = (0, import_react6.useRef)(null);
  const [boxW, setBoxW] = (0, import_react6.useState)(0);
  (0, import_react6.useEffect)(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return void 0;
    const ro = new ResizeObserver((entries) => {
      const w = entries && entries[0] ? Math.round(entries[0].contentRect.width) : 0;
      if (w > 0) setBoxW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [hover, setHover] = (0, import_react6.useState)(null);
  if (items.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.empty, children: "\u6682\u65E0\u6570\u636E" });
  const W = Math.max(CHART_W, boxW || CHART_W);
  const H = Math.round(Math.min(260, Math.max(CHART_H, W * 0.22)));
  const padT = 12;
  const padB = 18;
  const innerH = H - padT - padB;
  let max = 0;
  for (const it of items) {
    if (it.ms > max) max = it.ms;
    if (it.busyMs > max) max = it.busyMs;
  }
  if (max <= 0) max = 1;
  const bw = W / items.length;
  const barW = Math.max(2, Math.min(26, bw * 0.6));
  const yOf = (v) => padT + innerH * (1 - v / max);
  const labelCount = Math.max(6, Math.min(items.length, Math.round(W / 96)));
  const step = Math.max(1, Math.ceil(items.length / labelCount));
  const today = keyOf2(Date.now());
  const children = [];
  children.push(
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("line", { x1: 0, y1: padT + innerH, x2: W, y2: padT + innerH, className: styles_module_css_default.gridln }, "ax")
  );
  children.push(
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "line",
      {
        x1: 0,
        y1: padT + innerH / 2,
        x2: W,
        y2: padT + innerH / 2,
        className: styles_module_css_default.gridln,
        strokeDasharray: "3 3"
      },
      "mid"
    )
  );
  children.push(
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("text", { x: 0, y: padT - 3, className: styles_module_css_default.axislbl, children: (max / 36e5).toFixed(1) + "h" }, "ymax")
  );
  items.forEach((it, i) => {
    const x = i * bw + (bw - barW) / 2;
    const turnH = it.turnMs > 0 ? Math.max(1, it.turnMs / max * innerH) : 0;
    const idleH = it.idleMs > 0 ? Math.max(1, it.idleMs / max * innerH) : 0;
    const yTurn = padT + innerH - turnH;
    const yIdle = yTurn - idleH;
    if (turnH > 0)
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "rect",
          {
            x,
            y: yTurn,
            width: barW,
            height: turnH,
            rx: 2,
            fill: C_MAIN,
            opacity: it.d === today ? 0.95 : 0.72
          },
          "t" + it.d
        )
      );
    if (idleH > 0)
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "rect",
          {
            x,
            y: yIdle,
            width: barW,
            height: idleH,
            rx: 2,
            fill: C_MAIN,
            opacity: 0.26
          },
          "i" + it.d
        )
      );
    if (i % step === 0)
      children.push(
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("text", { x: x + barW / 2, y: H - 5, textAnchor: "middle", className: styles_module_css_default.axislbl, children: dispDay2(it.d) }, "l" + it.d)
      );
  });
  if (items.some((it) => it.busyMs > 0))
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "polyline",
        {
          points: items.map((it, i) => (i * bw + bw / 2).toFixed(1) + "," + yOf(it.busyMs).toFixed(1)).join(" "),
          fill: "none",
          stroke: C_BUSY,
          strokeWidth: 1.6,
          strokeDasharray: "4 3",
          strokeLinejoin: "round"
        },
        "busy"
      )
    );
  const hovered = hover !== null ? items[hover.i] : void 0;
  if (hover !== null && hovered)
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "rect",
        {
          x: hover.i * bw,
          y: padT,
          width: bw,
          height: innerH,
          fill: "currentColor",
          opacity: 0.08,
          pointerEvents: "none"
        },
        "hv"
      )
    );
  items.forEach((it, i) => {
    children.push(
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "rect",
        {
          x: i * bw,
          y: padT,
          width: bw,
          height: innerH,
          fill: "transparent",
          style: { pointerEvents: "all", cursor: "crosshair" },
          onMouseEnter: (e) => setHover({ i, mx: e.clientX, my: e.clientY })
        },
        "hit" + it.d
      )
    );
  });
  const rows = [];
  if (hovered) {
    const line = (k, v) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.tipK, children: k }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.tipV, children: v })
    ] }, k);
    rows.push(line("\u5728\u7EBF", fmtDur(hovered.ms)));
    rows.push(line("\u5BF9\u8BDD\u8FDB\u884C\u4E2D", fmtDur(hovered.turnMs)));
    rows.push(line("\u7A7A\u6863", fmtDur(hovered.idleMs)));
    rows.push(line("\u6A21\u578B + \u5DE5\u5177", fmtDur(hovered.busyMs)));
    rows.push(line("\u6D3B\u52A8\u6BB5\u6570", String(hovered.seg)));
    rows.push(line("\u4F1A\u8BDD\u6570", String(hovered.sessions)));
    rows.push(line("Token", fmtTok(hovered.tokens)));
  }
  const pop = hover !== null && hovered ? portal(
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.tipfixed, style: tipPos2(hover.mx, hover.my, 200, 40 + rows.length * 18), children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontWeight: 600, marginBottom: 3 }, children: cnDate2(hovered.d) }),
      rows
    ] })
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.svgwrap, ref: boxRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { cursor: "crosshair" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "svg",
      {
        viewBox: "0 0 " + W + " " + H,
        width: "100%",
        height: H,
        role: "img",
        onMouseMove: (e) => setHover(
          (prev) => prev === null || prev.mx === e.clientX && prev.my === e.clientY ? prev : { i: prev.i, mx: e.clientX, my: e.clientY }
        ),
        onMouseLeave: () => setHover(null),
        children
      }
    ) }),
    pop
  ] });
}
function ProportionBars(props) {
  const v = props.view;
  const tip = useTip();
  const max = Math.max(v.total, v.busy, 1);
  const bar = (label, ms, color, note, faint) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.bar, style: { padding: "7px 0" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { flex: "1 1 118px", minWidth: 118 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.title, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.desc, children: note })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "div",
      {
        ...Object.assign(
          { className: styles_module_css_default.bartrack },
          tip.bind({
            k: label,
            title: label,
            rows: [
              ["\u65F6\u957F", fmtDur(ms)],
              ["\u5360\u5728\u7EBF", v.total > 0 ? Math.round(ms / v.total * 100) + "%" : "\u2014"]
            ],
            text: note
          })
        ),
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "span",
          {
            className: styles_module_css_default.barfill,
            style: {
              width: Math.round(ms / max * 100) + "%",
              background: color,
              opacity: faint ? 0.42 : 1
            }
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.mono, style: { fontSize: 12.5, minWidth: 62, textAlign: "right" }, children: fmtDur(ms) })
  ] }, label);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
    bar("\u5728\u7EBF\uFF08\u4F60 + DSH\uFF09", v.total, C_MAIN, "\u542B\u4F60\u81EA\u5DF1\u7684\u8FFD\u95EE/\u9605\u8BFB\u7A7A\u6863", true),
    bar("\u5BF9\u8BDD\u8FDB\u884C\u4E2D\uFF08DSH \u7684\u949F\uFF09", v.turn, C_MAIN, "turn \u533A\u95F4\u5E76\u96C6\uFF0C\u5899\u949F\u53BB\u91CD"),
    bar("\u6A21\u578B + \u5DE5\u5177\uFF08DSH \u7684\u6D3B\uFF09", v.busy, C_BUSY, "\u5E76\u884C\u4F1A\u8BDD\u76F8\u52A0\uFF0C\u53EF\u9AD8\u4E8E\u5899\u949F", true)
  ] });
}
function Accuracy(props) {
  const tip = useTip();
  const v = props.view;
  const snap = props.snap;
  const windowTokens = v.series.reduce((a, b) => a + b.tokens, 0);
  const row = (name, val, kind, note) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("tr", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "6px 8px 6px 0", whiteSpace: "nowrap" }, children: name }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "6px 8px 6px 0", whiteSpace: "nowrap" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Acc, { kind }) }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "6px 8px 6px 0", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }, children: val }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("td", { style: { padding: "6px 0", color: "var(--dsw-alias-label-secondary)" }, children: note })
  ] }, name);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: cx2(styles_module_css_default.title, styles_module_css_default.titledIco), children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Glyph, { name: "target", size: 14, className: styles_module_css_default.cico }),
      "\u53E3\u5F84\u4E0E\u51C6\u786E\u6027"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ProportionBars, { view: v }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { overflowX: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 4 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("tr", { style: { color: "var(--dsw-alias-label-caption)", textAlign: "left" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "0 8px 4px 0", fontWeight: 500 }, children: "\u6307\u6807" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "0 8px 4px 0", fontWeight: 500 }, children: "\u6027\u8D28" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "0 8px 4px 0", fontWeight: 500 }, children: "\u5F53\u524D\u503C" }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("th", { style: { padding: "0 0 4px", fontWeight: 500 }, children: "\u8BF4\u660E" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("tbody", { children: [
        row(
          "\u5728\u7EBF\u65F6\u957F",
          fmtDur(v.total),
          "bound",
          "\u65E5\u5FD7\u53EA\u5728\u6709\u4E8B\u4EF6\u65F6\u6253\u70B9\uFF1A\u7A97\u53E3\u5F00\u7740\u4F46\u6CA1\u4E8B\u4EF6\u7684\u65F6\u95F4\u4E0D\u53EF\u89C1\uFF0C\u6240\u4EE5\u662F\u4E0B\u754C\uFF1B\u9608\u503C\uFF08\u5F53\u524D " + v.gap + " \u5206\u949F\uFF09\u76F4\u63A5\u51B3\u5B9A\u7ED3\u679C"
        ),
        row(
          "\u5BF9\u8BDD\u8FDB\u884C\u4E2D",
          fmtDur(v.turn),
          "estimate",
          "turn/start\u2192turn/end \u5E76\u96C6\uFF08\u5899\u949F\u53BB\u91CD\uFF09\uFF1B\u542B\u5C11\u91CF\u7B49\u4F60\u64CD\u4F5C\u7684\u65F6\u95F4\uFF08\u5B9E\u6D4B\u5BA1\u6279\u7B49\u5F85\u7EA6 0.7h\uFF09"
        ),
        row(
          "\u6A21\u578B\u751F\u6210",
          fmtDur(v.llm),
          "exact",
          "step/start\u2192assistant/message\uFF1B\u5DF2\u4E0E DSH \u81EA\u5E26 sessionStats \u6295\u5F71\u9010\u4F1A\u8BDD\u5BF9\u8D26\u4E00\u81F4"
        ),
        row("\u5DE5\u5177\u6267\u884C", fmtDur(v.tool), "exact", "tool/call\u2192tool/result \u6309 callId \u914D\u5BF9"),
        row(
          "\u5F15\u64CE\u5408\u8BA1",
          fmtDur(v.busy),
          "exact",
          "\u4E0A\u4E24\u8005\u76F8\u52A0\uFF1B\u540C\u65F6\u5F00\u591A\u4E2A\u4F1A\u8BDD/\u5B50\u4EE3\u7406\u4F1A\u91CD\u590D\u8BA1\uFF0C\u6240\u4EE5\u53EF\u80FD\u5927\u4E8E\u5899\u949F"
        ),
        row("\u6D3B\u8DC3\u5929\u6570", String(v.activeDays), "exact", "\u6709\u4E8B\u4EF6\u6216\u6709\u7528\u91CF\u7684\u81EA\u7136\u65E5\u6570"),
        row(
          "Token \u7528\u91CF",
          fmtTok(windowTokens),
          "exact",
          "\u5F53\u524D\u533A\u95F4\u7684\u4E0A\u62A5\u503C\uFF1B\u53EA\u7EDF\u8BA1\u4F9B\u5E94\u5546\u7ED9\u4E86 usage \u7684\u6B65\u9AA4\uFF0C\u672A\u4E0A\u62A5\u7684\u7B97\u4E0D\u5230\uFF0C\u56E0\u6B64\u7565\u4F4E"
        ),
        row(
          "\u4F1A\u8BDD\u53E3\u5F84",
          snap ? (snap.sessionOutcomes?.["usage"] ?? 0) + " / " + snap.total : String(v.activeDays),
          "exact",
          snap ? "\u5171 " + snap.total + " \u4E2A\u4F1A\u8BDD\uFF1A" + Object.entries(snap.sessionOutcomes ?? {}).map(([k, n]) => (OUTCOME_LABELS[k] ?? k) + " " + n + " \u4E2A").join(" \xB7 ") : "\u4F1A\u8BDD\u5217\u8868\u6765\u81EA sessionQuery"
        )
      ] })
    ] }) }),
    snap ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.cacheRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.muted, children: "\u6570\u636E\u6E90" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: snap.scanned + "/" + snap.total + " \u4E2A\u4F1A\u8BDD\u5DF2\u626B\u63CF" + (snap.partial ? "\uFF08\u540E\u53F0\u8865\u626B\u4E2D\uFF09" : "") }),
      (snap.directReads ?? 0) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "span",
        {
          ...Object.assign(
            {},
            tip.bind({
              k: "direct",
              title: "\u76F4\u8BFB\u65E5\u5FD7",
              rows: [["\u4F1A\u8BDD\u6570", String(snap.directReads)]],
              text: "\u975E live \u4F1A\u8BDD\u9ED8\u8BA4\u76F4\u63A5\u8BFB\u65E5\u5FD7\u6587\u4EF6\uFF08\u9010\u5E27\u89E3\u538B + \u5207\u6389 fork \u7EE7\u627F\u524D\u7F00\uFF09\uFF0C\u6BD4\u5B98\u65B9 reader \u5FEB\u4E00\u5230\u4E24\u4E2A\u6570\u91CF\u7EA7\uFF1Blive \u4F1A\u8BDD\u4ECD\u8D70\u5B98\u65B9 reader\u3002"
            })
          ),
          children: "\u76F4\u8BFB " + snap.directReads + " \u4E2A"
        }
      ) : null,
      snap.errors > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "span",
        {
          ...Object.assign(
            {},
            tip.bind({
              k: "errors",
              title: "\u626B\u63CF\u5931\u8D25 " + snap.errors + " \u4E2A",
              text: (snap.errorSamples ?? []).length > 0 ? (snap.errorSamples ?? []).map((x) => x.id + "\uFF1A" + x.message).join("\uFF1B") : "\u6CA1\u6709\u53EF\u7528\u7684\u539F\u56E0\u6837\u672C"
            })
          ),
          children: "\u626B\u63CF\u5931\u8D25 " + snap.errors + " \u4E2A"
        }
      ) : null,
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "\u7F13\u5B58 " + snap.storage }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "fork/\u7EED\u63A5\u7684\u7EE7\u627F\u524D\u7F00\u4E0D\u91CD\u590D\u8BA1\u65F6" })
    ] }) : null
  ] });
}
function tipLine(k, v, key) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.tiprow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.tipK, children: k }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.tipV, children: v })
  ] }, key ?? k);
}
function RankingList(props) {
  const [showAll, setShowAll] = (0, import_react6.useState)(false);
  const [hover, setHover] = (0, import_react6.useState)(null);
  const ranked = props.ranked;
  if (ranked.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.empty, children: "\u6682\u65E0\u6570\u636E" });
  const items = showAll ? ranked : ranked.slice(0, 8);
  let max = 1;
  for (const it of items) if (it.ms > max) max = it.ms;
  const rows = items.map((it, i) => {
    const wTurn = Math.round(it.turnMs / max * 100);
    const wIdle = Math.round(it.idleMs / max * 100);
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "div",
      {
        className: cx2(styles_module_css_default.rankRow, i < 3 ? styles_module_css_default.top3 : void 0),
        onMouseMove: (e) => setHover({ i, mx: e.clientX, my: e.clientY }),
        onMouseLeave: () => setHover(null),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.rankNo, children: String(i + 1) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.rankDate, children: dispDay2(it.d) + " " + weekdayOf(it.d) }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.desc, style: { margin: 0, fontSize: 11, whiteSpace: "nowrap" }, children: it.sessions + " \u4F1A\u8BDD \xB7 \u6BB5 " + it.seg })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.rankBarTrack, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.rankFillTurn, style: { width: wTurn + "%" } }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.rankFillIdle, style: { width: wIdle + "%" } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.rankVal, children: fmtDur(it.ms) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.rankTok, children: fmtTok(it.tokens) })
        ]
      },
      it.d
    );
  });
  const hovered = hover !== null ? items[hover.i] : void 0;
  const pop = hover !== null && hovered ? portal(
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.tipfixed, style: tipPos2(hover.mx, hover.my, 220, 190), children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontWeight: 600, marginBottom: 3 }, children: cnDate2(hovered.d) + "\uFF08\u7B2C " + (hover.i + 1) + " \u540D\uFF09" }),
      tipLine("\u5728\u7EBF", fmtDur(hovered.ms), "a"),
      tipLine("\u5BF9\u8BDD\u8FDB\u884C\u4E2D", fmtDur(hovered.turnMs), "b"),
      tipLine("\u7A7A\u6863", fmtDur(hovered.idleMs), "c"),
      tipLine("\u6A21\u578B + \u5DE5\u5177", fmtDur(hovered.busyMs), "d"),
      tipLine("\u6D3B\u52A8\u6BB5\u6570", String(hovered.seg), "e"),
      tipLine("\u4F1A\u8BDD\u6570", String(hovered.sessions), "f"),
      tipLine("Token", fmtTok(hovered.tokens), "g")
    ] })
  ) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.rankHead, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "#" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "\u65E5\u671F" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "\u5728\u7EBF\u6784\u6210 \xB7 \u5B9E\u8272 \u5BF9\u8BDD\u4E2D / \u6D45\u8272 \u7A7A\u6863" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { textAlign: "right" }, children: "\u5728\u7EBF" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { textAlign: "right" }, children: "Token" })
    ] }),
    rows,
    pop,
    ranked.length > 8 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.toolbar, style: { margin: "8px 0 0", justifyContent: "center" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: styles_module_css_default.mini, onClick: () => setShowAll((v) => !v), children: showAll ? "\u53EA\u770B\u524D 8 \u540D" : "\u5C55\u5F00\u5168\u90E8 " + ranked.length + " \u5929" }) }) : null
  ] });
}
function Body(props) {
  const tip = useTip();
  const data = props.data;
  const online = data && data.ready && data.online ? data.online : null;
  if (!online) {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.page, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.title, children: "\u5728\u7EBF\u65F6\u957F" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.desc, children: props.err ? "\u8BFB\u53D6\u5931\u8D25\uFF1A" + props.err : data && data.ready ? "\u5F53\u524D Host \u672A\u63D0\u4F9B\u5728\u7EBF\u65F6\u957F\u6570\u636E\uFF08\u63D2\u4EF6\u9700\u91CD\u542F\u4EE5\u52A0\u8F7D\u65B0\u7248 Host \u534A\uFF09\u3002" : "\u7EDF\u8BA1\u5C1A\u672A\u5C31\u7EEA\uFF0C\u6B63\u5728\u626B\u63CF\u4F1A\u8BDD\u65E5\u5FD7\u2026" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.toolbar, style: { marginTop: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: styles_module_css_default.mini, onClick: props.onReload, children: "\u91CD\u8BD5" }) })
    ] }) });
  }
  const view = deriveOnlineView(online, props.gap, props.rangeDays);
  const gapCmp = /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.gapCmp, children: online.gaps.map((g, i) => {
    const ms = online.totalMs[String(g)] ?? 0;
    const prevMs = i > 0 ? online.totalMs[String(online.gaps[i - 1])] ?? 0 : 0;
    const on = g === props.gap;
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "span",
      {
        ...Object.assign(
          {
            className: cx2(
              styles_module_css_default.gapCmpItem,
              on ? styles_module_css_default.gapCmpOn : void 0,
              g === GAP_RECOMMEND ? styles_module_css_default.gapCmpRec : void 0
            ),
            // 这几张卡本身就是切换入口：五档摆在一起看增量时，顺手就能切过去比
            onClick: () => props.onGap(g)
          },
          tip.bind({
            k: "gap" + g,
            title: g + " \u5206\u949F\u6863",
            rows: [
              ["\u7D2F\u8BA1\u5728\u7EBF", fmtDur(ms)],
              ["\u6D3B\u8DC3\u6BB5\u6570", String(online.segments[String(g)] ?? 0)],
              ["\u6BD4\u4E0A\u4E00\u6863\u591A", i > 0 ? "+" + fmtDur(ms - prevMs) : "\u2014"]
            ],
            text: "\u628A\u300C\u76F8\u90BB\u4E8B\u4EF6\u95F4\u9694 \u2264 " + g + " \u5206\u949F\u300D\u7684\u65F6\u95F4\u90FD\u7B97\u4F5C\u5728\u7EBF\u3002\u6863\u4F4D\u8D8A\u5927\uFF0C\u8D8A\u591A\u7684\u9759\u9ED8\u671F\uFF08\u8BFB\u957F\u56DE\u7B54\u3001\u60F3\u9700\u6C42\u3001\u79BB\u5F00\u5EA7\u4F4D\uFF09\u88AB\u7B97\u8FDB\u6765\u3002"
          })
        ),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("b", { children: g + " \u5206\u949F" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: fmtDur(ms) }),
          i > 0 ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("em", { children: "+" + fmtDur(ms - prevMs) }) : null
        ]
      },
      String(g)
    );
  }) });
  const gapExplain = /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.gapHint, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { children: "\u5728\u7EBF = \u65E5\u5FD7\u91CC\u6709\u4E8B\u4EF6\u3001\u4E14\u76F8\u90BB\u4E8B\u4EF6\u95F4\u9694\u4E0D\u8D85\u8FC7\u9608\u503C\u7684\u90A3\u6BB5\u5899\u949F\u65F6\u95F4\u3002\u89C4\u5219\u5C31\u4E09\u6761\uFF1A" }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("ul", { className: styles_module_css_default.gapRules, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("b", { children: "\u95F4\u9694 \u2264 \u9608\u503C \u2192 \u6574\u6BB5\u7B97\u5728\u7EBF" }),
        "\uFF1A10:00 \u4E0E 10:50 \u5404\u6709\u4E00\u4E2A\u4E8B\u4EF6\u3001\u9608\u503C 60 \u5206\u949F\uFF0C\u4E2D\u95F4\u8FD9 50 \u5206\u949F\uFF08\u54EA\u6015\u4F60\u4E0D\u5728\uFF09\u4E00\u5E76\u8BA1\u5165\uFF0C\u5E76\u7D2F\u52A0\u5230\u5F53\u5929\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("b", { children: "\u95F4\u9694 > \u9608\u503C \u2192 \u65AD\u5F00" }),
        "\uFF1A\u4ECE\u4E0A\u4E00\u4E2A\u4E8B\u4EF6\u5904\u6536\u5C3E\uFF0C\u4E2D\u95F4\u90A3\u6BB5\u4E00\u79D2\u90FD\u4E0D\u8BA1\uFF0C\u65B0\u7684\u4E00\u6BB5\u4ECE\u4E0B\u4E00\u4E2A\u4E8B\u4EF6\u91CD\u65B0\u8D77\u7B97\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("b", { children: "\u6BCF\u6BB5\u53EA\u7B97\u5230\u6700\u540E\u4E00\u4E2A\u4E8B\u4EF6" }),
        "\uFF1A\u4E4B\u540E\u7684\u65F6\u95F4\u4E0D\u8BA1\uFF08\u54EA\u6015\u8FC7\u4E86 1 \u5206\u949F\u5C31\u5173\u7A97\u53E3\uFF0C\u6216\u8005\u4F60\u63A5\u7740\u53C8\u8DD1\u4E86 3 \u5C0F\u65F6\u6CA1\u4EA7\u751F\u4E8B\u4EF6\uFF09\u3002\u6240\u4EE5\u4EFB\u4F55\u6863\u4F4D\u7B97\u51FA\u6765\u90FD\u662F",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("em", { children: "\u4E0B\u754C" }),
        "\uFF0C\u4E0D\u662F\u300C\u5750\u5728\u7535\u8111\u524D\u300D\u7684\u65F6\u957F\u3002"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.gapCmpTitle, children: "\u540C\u4E00\u4EFD\u65E5\u5FD7\u4E0B\uFF0C\u4E94\u6863\u5206\u522B\u662F\u591A\u5C11\uFF08\u70B9\u6863\u4F4D\u53EF\u5207\u6362\uFF09\uFF1A" }),
    gapCmp,
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.gapRec, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("b", { children: "\u63A8\u8350 15 \u5206\u949F" }),
      "\uFF08\u63D2\u4EF6\u9ED8\u8BA4\u503C\uFF09\uFF1ADSH \u771F\u6B63\u5728\u5E72\u6D3B\u65F6\u65E5\u5FD7\u91CC\u662F\u6709\u4E8B\u4EF6\u7684\uFF08\u6A21\u578B step\u3001\u5DE5\u5177 call/result\u3001\u5B50\u4EE3\u7406\uFF09\uFF0C\u4E0D\u9700\u8981\u9760\u5927\u9608\u503C\u6765\u515C\uFF1B\u9700\u8981\u515C\u7684\u662F\u8BFB\u957F\u56DE\u7B54\u3001\u60F3\u4E0B\u4E00\u4E2A\u9700\u6C42\u8FD9\u7C7B\u9759\u9ED8\u671F\uFF0C\u901A\u5E38\u51E0\u5206\u949F\u91CF\u7EA7\u30025 \u5206\u949F\u4EE5\u4E0B\u4F1A\u628A\u300C\u8BFB\u5B8C\u56DE\u7B54\u518D\u60F3\u4E00\u4E0B\u300D\u4E5F\u5207\u65AD\uFF0C\u504F\u4F4E\uFF1B60 \u5206\u949F\u4F1A\u628A\u300C\u53BB\u5F00\u4F1A/\u5403\u996D\u300D\u6574\u6BB5\u7B97\u6210\u5728\u7EBF\uFF0C\u53EA\u9002\u5408\u56DE\u7B54\u300C\u4ECA\u5929\u5F00\u7740 DSH \u591A\u4E45\u300D\u3002\u5BF9\u7167\u4E0A\u9762\u4E94\u6863\u7684\u589E\u91CF\uFF0C\u591A\u51FA\u6765\u7684\u5C0F\u65F6\u4E3B\u8981\u6765\u81EA\u54EA\u4E00\u6863\uFF0C\u4E00\u773C\u80FD\u770B\u51FA\u6765\u3002"
    ] })
  ] });
  const segRow = (label, hint, control, rows, tipText) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.segField, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "div",
      {
        ...Object.assign(
          { className: styles_module_css_default.segFieldKey },
          tip.bind({
            k: label,
            title: label,
            text: tipText !== void 0 ? tipText : typeof hint === "string" ? hint : "",
            ...rows ? { rows } : {}
          })
        ),
        children: label
      }
    ),
    control === null || control === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.segFieldCtl, children: control }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.segFieldHint, children: hint })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(TipHost, {}),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.card, style: { padding: "10px 12px" }, children: [
      segRow(
        "\u7A7A\u95F2\u9608\u503C",
        gapExplain,
        null,
        [
          ["\u5F53\u524D", props.gap + " \u5206\u949F"],
          ["\u8FD9\u4E2A\u6863\u7B97\u51FA\u7684\u7D2F\u8BA1\u5728\u7EBF", fmtDur(view.total)],
          ["\u6D3B\u8DC3\u6BB5\u6570", String(view.segments)],
          ["\u6BD4 1 \u5206\u949F\u6863\u591A", "+" + fmtDur(view.total - (online.totalMs["1"] ?? view.total))]
        ],
        "\u5728\u7EBF = \u6709\u4E8B\u4EF6\u3001\u4E14\u76F8\u90BB\u4E8B\u4EF6\u95F4\u9694\u4E0D\u8D85\u8FC7\u9608\u503C\u7684\u5899\u949F\u65F6\u95F4\u3002\u70B9\u4E0B\u9762\u7684\u6863\u4F4D\u5207\u6362\uFF1B\u6863\u4F4D\u8D8A\u5927\uFF0C\u8D8A\u591A\u7684\u9759\u9ED8\u671F\u88AB\u7B97\u8FDB\u6765\u3002"
      ),
      segRow(
        "\u65F6\u95F4\u8303\u56F4",
        "\u300C\u6BCF\u65E5\u5728\u7EBF\u300D\u56FE\u8868\u4E0E\u4E0B\u65B9\u300C\u5728\u7EBF\u6700\u591A\u7684\u65E5\u5B50\u300D\u660E\u7EC6\u7684\u7EDF\u8BA1\u7A97\u53E3\uFF1B\u4E0A\u9762\u7684\u7D2F\u8BA1/\u65E5\u5747\u59CB\u7EC8\u6309\u5168\u90E8\u6D3B\u8DC3\u65E5\u8BA1\u7B97\u3002",
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Seg2, { items: RANGE_LABELS, value: props.rangeDays, onPick: props.onRange }),
        [["\u5F53\u524D\u533A\u95F4", props.rangeDays === 0 ? "\u5168\u90E8\u6D3B\u8DC3\u65E5" : "\u8FD1 " + props.rangeDays + " \u5929"]]
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.toolbar, style: { margin: "2px 0 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.hint, children: online.activeDays + " \u4E2A\u6D3B\u8DC3\u65E5 \xB7 \u9ED8\u8BA4\u6309\u5168\u90E8\u663E\u793A" }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(OnlineMetrics, { view, online }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.dash, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.c12, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(OnlineDaily, { view }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.c7, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(OnlineRank, { view }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.c5, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Accuracy, { view, snap: data }) })
    ] })
  ] });
}
function OnlineMetrics(props) {
  const view = props.view;
  const online = props.online;
  return (
    // 旧实现的 `tm-onlinecards` 在样式表里从来没有对应规则（在线网格走的是 `.statGrid` +
    // `.onlineGrid`），CSS Module 迁移后 `styles.onlinecards` 只会是 undefined、被 cx 静默滤掉；
    // 按 providers/kit.tsx 里 'tm-payg' 同一处先例，这里只保留真正有规则的类。
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.chartTitle, children: [
        cardName2("clock", "\u5728\u7EBF\u65F6\u957F"),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(AccLegend, {})
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: cx2(styles_module_css_default.statGrid, styles_module_css_default.onlineGrid), children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Stat,
          {
            icon: "sun",
            label: "\u4ECA\u65E5\u5728\u7EBF",
            value: fmtDurCn(view.today),
            tint: true,
            sub: "\u622A\u81F3\u6B64\u523B",
            acc: "bound",
            tip: {
              k: "today",
              title: "\u4ECA\u65E5\u5728\u7EBF \xB7 \u4E0B\u754C",
              text: "\u6709\u4E8B\u4EF6\u8986\u76D6\u3001\u4E14\u7A7A\u6863 \u2264 " + view.gap + " \u5206\u949F\u7684\u65F6\u95F4\u3002\u65E5\u5FD7\u53EA\u5728\u6709\u4E8B\u4EF6\u65F6\u6253\u70B9\uFF0C\u6240\u4EE5\u662F\u4E0B\u754C\u3002"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Stat,
          {
            icon: "hourglass",
            label: "\u7D2F\u8BA1\u5728\u7EBF",
            value: fmtDurCn(view.total),
            sub: (online.firstDay ? dispDay2(online.firstDay) + " \u8D77" : "") + " \xB7 \u5171 " + view.activeDays + " \u4E2A\u6D3B\u8DC3\u65E5",
            acc: "bound",
            tip: {
              k: "total",
              title: "\u7D2F\u8BA1\u5728\u7EBF \xB7 \u4E0B\u754C",
              rows: [
                ["\u6D3B\u8DC3\u65E5", String(view.activeDays)],
                ["\u65E5\u5747", fmtDur(view.avg)],
                ["\u5F53\u524D\u53E3\u5F84", view.gap + " \u5206\u949F"]
              ],
              text: '\u8FD9\u4E2A\u6570\u5B57\u4F9D\u8D56\u7A7A\u95F2\u9608\u503C\uFF1A\u9608\u503C\u8D8A\u5927\uFF0C\u8D8A\u591A\u7684\u9759\u9ED8\u671F\u88AB\u7B97\u8FDB\u6765\uFF0C\u6240\u4EE5\u5B83\u540C\u65F6\u662F"\u4E0B\u754C"\u548C"\u9608\u503C\u53E3\u5F84"\u7684\u4EA7\u7269\u3002\u5207\u4E00\u4E0B\u9762\u677F\u9876\u90E8\u7684\u6863\u4F4D\uFF0C\u80FD\u770B\u5230\u540C\u4E00\u4EFD\u65E5\u5FD7\u5728\u4E94\u6863\u4E0B\u7684\u5DEE\u522B\u3002'
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Stat,
          {
            icon: "wave",
            label: "\u6D3B\u8DC3\u65E5\u5747",
            value: fmtDurCn(view.avg),
            sub: "\u4EC5\u6309\u6709\u6D3B\u52A8\u7684\u65E5\u5B50\u5E73\u5747",
            tip: {
              k: "avg",
              title: "\u6D3B\u8DC3\u65E5\u5747",
              rows: [
                ["\u7D2F\u8BA1", fmtDur(view.total)],
                ["\u6D3B\u8DC3\u65E5", String(view.activeDays)]
              ],
              text: "\u53EA\u6309\u6709\u6D3B\u52A8\u7684\u65E5\u5B50\u5E73\u5747\uFF0C\u4E0D\u542B\u7A7A\u767D\u5929\u3002"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Stat,
          {
            icon: "bubble",
            label: "\u5BF9\u8BDD\u8FDB\u884C\u4E2D",
            value: fmtDurCn(view.turn),
            sub: "\u5360\u5728\u7EBF " + (view.total > 0 ? Math.round(view.turn / view.total * 100) : 0) + "%",
            acc: "estimate",
            tip: {
              k: "turn",
              title: "\u5BF9\u8BDD\u8FDB\u884C\u4E2D \xB7 \u4F30\u7B97",
              rows: [
                ["\u65F6\u957F", fmtDur(view.turn)],
                ["\u5360\u5728\u7EBF", (view.total > 0 ? Math.round(view.turn / view.total * 100) : 0) + "%"]
              ],
              text: "turn/start\u2192turn/end \u7684\u5E76\u96C6\uFF08\u5899\u949F\u53BB\u91CD\uFF09\uFF1ADSH \u5728\u4E3A\u4F60\u5E72\u6D3B\u7684\u949F\uFF0C\u542B\u5C11\u91CF\u7B49\u4F60\u64CD\u4F5C\u7684\u65F6\u95F4\u3002"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Stat,
          {
            icon: "chip",
            label: "\u6A21\u578B\u751F\u6210",
            value: fmtDurCn(view.llm),
            sub: "\u5DF2\u4E0E\u5B98\u65B9\u6295\u5F71\u5BF9\u8D26",
            acc: "exact",
            tip: {
              k: "llm",
              title: "\u6A21\u578B\u751F\u6210 \xB7 \u7CBE\u786E",
              text: "step/start\u2192assistant/message\uFF1B\u5DF2\u4E0E DSH \u81EA\u5E26 sessionStats \u6295\u5F71\u9010\u4F1A\u8BDD\u5BF9\u8D26\uFF08126/126 \u4E00\u81F4\uFF09\u3002"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Stat,
          {
            icon: "terminal",
            label: "\u5DE5\u5177\u6267\u884C",
            value: fmtDurCn(view.tool),
            sub: "call\u2192result",
            acc: "exact",
            tip: {
              k: "tool",
              title: "\u5DE5\u5177\u6267\u884C \xB7 \u7CBE\u786E",
              text: "tool/call\u2192tool/result \u6309 callId \u914D\u5BF9\uFF1Bturn/end \u65F6\u4E22\u5F03\u672A\u843D\u5730\u7684\u8C03\u7528\u3002"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          Stat,
          {
            icon: "gear",
            label: "\u5F15\u64CE\u5408\u8BA1",
            value: fmtDurCn(view.busy),
            sub: "\u5E76\u884C\u76F8\u52A0\uFF0C\u53EF\u9AD8\u4E8E\u5899\u949F",
            wide: true,
            acc: "exact",
            tip: {
              k: "busy",
              title: "\u5F15\u64CE\u5408\u8BA1 \xB7 \u7CBE\u786E",
              rows: [
                ["\u6A21\u578B\u751F\u6210", fmtDur(view.llm)],
                ["\u5DE5\u5177\u6267\u884C", fmtDur(view.tool)]
              ],
              text: "\u4E24\u8005\u76F8\u52A0\uFF1B\u540C\u65F6\u5F00\u591A\u4E2A\u4F1A\u8BDD/\u5B50\u4EE3\u7406\u4F1A\u91CD\u590D\u8BA1\uFF0C\u6240\u4EE5\u53EF\u80FD\u5927\u4E8E\u5899\u949F\u7684\u300C\u5BF9\u8BDD\u8FDB\u884C\u4E2D\u300D\u3002"
            }
          }
        )
      ] })
    ] })
  );
}
function OnlineDaily(props) {
  const view = props.view;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.toolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: cx2(styles_module_css_default.title, styles_module_css_default.titledIco), children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Glyph, { name: "chartBar", size: 14, className: styles_module_css_default.cico }),
        "\u6BCF\u65E5\u5728\u7EBF"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.hint, children: view.peak ? "\u5CF0\u503C " + cnDate2(view.peak.d) + " " + fmtDur(view.peak.ms) : "" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chart, { items: view.series, gap: view.gap }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Legend, {})
  ] });
}
function OnlineRank(props) {
  const view = props.view;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: styles_module_css_default.toolbar, style: { margin: "0 0 2px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: cx2(styles_module_css_default.title, styles_module_css_default.titledIco), style: { margin: 0 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Glyph, { name: "list", size: 14, className: styles_module_css_default.cico }),
        "\u6BCF\u65E5\u5728\u7EBF\u6392\u884C"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: styles_module_css_default.hint, children: "\u5F53\u524D\u533A\u95F4 " + view.ranked.length + " \u4E2A\u6D3B\u8DC3\u65E5 \xB7 \u6309\u5728\u7EBF\u65F6\u957F\u6392\u5E8F \xB7 \u9F20\u6807\u60AC\u6D6E\u770B\u5F53\u65E5\u660E\u7EC6" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(RankingList, { ranked: view.ranked, gap: view.gap })
  ] });
}
function OnlineEmbed(props) {
  const online = props.data && props.data.ready && props.data.online ? props.data.online : null;
  if (online === null) return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: styles_module_css_default.desc, children: "\u5F53\u524D Host \u672A\u63D0\u4F9B\u5728\u7EBF\u65F6\u957F\u6570\u636E\u3002" });
  const view = deriveOnlineView(online, props.gap ?? online.defaultGapMin ?? 5, 0);
  if (props.block === "metrics") return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(OnlineMetrics, { view, online });
  if (props.block === "rank") return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(OnlineRank, { view });
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(OnlineDaily, { view });
}
function OnlineView(_props) {
  const [gapState, setGapState] = (0, import_react6.useState)(null);
  const [rangeDays, setRangeDays] = (0, import_react6.useState)(0);
  const { snap, err, reload } = useSnapshot();
  const online = snap && snap.ready && snap.online ? snap.online : null;
  const gap = gapState !== null ? gapState : online ? online.defaultGapMin : GAP_RECOMMEND;
  const onGap = (0, import_react6.useCallback)(
    (g) => {
      setGapState(g);
      void saveConfig({ onlineGapMin: g }).catch(() => {
      });
      try {
        window.dispatchEvent(new Event("tm-prefs-changed"));
      } catch {
      }
    },
    [setGapState]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
    Body,
    {
      data: snap,
      err,
      gap,
      rangeDays,
      onGap,
      onRange: setRangeDays,
      onReload: reload
    }
  );
}

// src/client/icons.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
function QuotaIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { ...svgAttrs(props), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: 2.5, y: 7, width: 16, height: 10, rx: 2.6 }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M21.2 10.4v3.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("rect", { x: 5, y: 9.4, width: 6.4, height: 5.2, rx: 1.3, fill: "currentColor", stroke: "none" })
  ] });
}
function UsageIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { ...svgAttrs(props), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M4.6 20v-6.4", strokeWidth: 2.6 }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M12 20V5.4", strokeWidth: 2.6 }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M19.4 20v-9.6", strokeWidth: 2.6 })
  ] });
}
function OnlineIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { ...svgAttrs(props), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: 12, cy: 12, r: 8.4 }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M12 7.6V12l3.2 2" })
  ] });
}
function SettingsIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { ...svgAttrs(props), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M3.6 8h9" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M18.4 8h2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: 15.5, cy: 8, r: 2.3 }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M3.6 16h2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M11.4 16h9" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("circle", { cx: 8.5, cy: 16, r: 2.3 })
  ] });
}
function ShareIcon(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { ...svgAttrs(props), children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M12.6 4.6H5.4a1.8 1.8 0 0 0-1.8 1.8v12.2a1.8 1.8 0 0 0 1.8 1.8h12.2a1.8 1.8 0 0 0 1.8-1.8v-7.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M14.4 3.4h6.2v6.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M20.6 3.4 11.4 12.6" })
  ] });
}

// src/client/TokenMeterSection.tsx
var import_react11 = require("react");
var import_dsh_client_ui_primitives6 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/QuotaSection.tsx
var import_react9 = require("react");
var import_dsh_client_ui_primitives5 = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/ErrorBox.tsx
var import_react7 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var ICONS = {
  auth: "\u{1F511}",
  session: "\u23F3",
  plan: "\u{1F4C5}",
  balance: "\u{1F4B0}",
  rate: "\u{1F422}",
  network: "\u{1F310}",
  parse: "\u{1F9E9}",
  config: "\u2699\uFE0F",
  server: "\u{1F6E0}\uFE0F",
  unknown: "\u26A0\uFE0F"
};
var FALLBACK_RULES = [
  [/未配置|凭据未配置|必填|参数非法|workspaceId 非法/, "config"],
  [/会话失效|会话已过期|登录失效|登录态|被风控|logged out/i, "session"],
  [/密钥无效|密钥已失效|密钥引用.*为空|Invalid 'Authorization'|401|403/i, "auth"],
  [/upgrade_required|订阅.*(到期|结束|失败|取消)|计划.*(不含|不支持)/, "plan"],
  [/余额不足|insufficient|402/, "balance"],
  [/限流|429|rate.?limit/i, "rate"],
  [/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|超时|timeout/i, "network"],
  [/非 JSON|结构异常|字段缺失|解析失败|改版|未命中/, "parse"],
  [/\b5\d\d\b/, "server"]
];
var FALLBACK_TITLES = {
  auth: "\u5BC6\u94A5\u65E0\u6548\u6216\u5DF2\u5931\u6548",
  session: "\u767B\u5F55\u72B6\u6001\u5DF2\u8FC7\u671F",
  plan: "\u8BA2\u9605\u5DF2\u5230\u671F\u6216\u8BA1\u5212\u4E0D\u652F\u6301",
  balance: "\u4F59\u989D\u4E0D\u8DB3",
  rate: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF08\u88AB\u9650\u6D41\uFF09",
  network: "\u7F51\u7EDC\u4E0D\u53EF\u8FBE",
  parse: "\u63A5\u53E3\u8FD4\u56DE\u7ED3\u6784\u5F02\u5E38",
  config: "\u4F9B\u5E94\u5546\u914D\u7F6E\u4E0D\u5B8C\u6574",
  server: "\u4E0A\u6E38\u670D\u52A1\u5F02\u5E38",
  unknown: "\u62C9\u53D6\u5931\u8D25"
};
function fallbackErrorInfo(message) {
  const msg = String(message || "\u62C9\u53D6\u5931\u8D25");
  let kind = "unknown";
  for (const [re, k] of FALLBACK_RULES) {
    if (re.test(msg)) {
      kind = k;
      break;
    }
  }
  const tone = kind === "auth" || kind === "session" || kind === "plan" || kind === "balance" ? "bad" : "warn";
  return {
    kind,
    title: FALLBACK_TITLES[kind],
    hint: "\u672C\u6B21\u62C9\u53D6\u6CA1\u6709\u6210\u529F\uFF0C\u5C55\u5F00\u53EF\u89C1\u539F\u59CB\u4FE1\u606F\u3002",
    action: "\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5\uFF1B\u82E5\u6301\u7EED\u5931\u8D25\u8BF7\u628A\u8BE6\u60C5\u53CD\u9988\u7ED9\u7EF4\u62A4\u8005",
    steps: ["\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5\u4E00\u6B21", "\u82E5\u6301\u7EED\u5931\u8D25\uFF0C\u628A\u300C\u539F\u59CB\u4FE1\u606F\u300D\u53CD\u9988\u7ED9\u63D2\u4EF6\u7EF4\u62A4\u8005"],
    detail: msg,
    retriable: true,
    tone
  };
}
function copy(text, done) {
  try {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav && nav.clipboard && typeof nav.clipboard.writeText === "function") {
      void nav.clipboard.writeText(text).then(
        () => done(true),
        () => done(false)
      );
      return;
    }
  } catch {
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand("copy");
    document.body.removeChild(ta);
    done(!!ok);
  } catch {
    done(false);
  }
}
function cx3(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var ERRBOX_TONE = {
  bad: styles_module_css_default.errboxBad,
  warn: styles_module_css_default.errboxWarn,
  info: styles_module_css_default.errboxInfo
};
var ERRICON_TONE = {
  bad: styles_module_css_default.erriconBad,
  warn: void 0,
  info: styles_module_css_default.erriconInfo
};
function createErrorBox(deps) {
  return function ErrorBox(props) {
    const raw = props.info || null;
    const info = raw || fallbackErrorInfo(props.msg || "\u62C9\u53D6\u5931\u8D25");
    const open = deps.isOpen();
    const [copied, setCopied] = (0, import_react7.useState)("");
    const tone = info.tone || "warn";
    const steps = Array.isArray(info.steps) ? info.steps.slice(0, 6) : [];
    const detailText = info.detail + (props.meta ? "\n" + props.meta : "") + (info.status ? "\nHTTP " + info.status : "") + (info.docs ? "\n\u6587\u6863\uFF1A" + info.docs : "");
    const icon = ICONS[info.kind] || ICONS.unknown;
    const head = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
      "button",
      {
        type: "button",
        className: styles_module_css_default.errhead,
        title: open ? "\u6536\u8D77\u8BE6\u60C5" : "\u5C55\u5F00\u6392\u67E5\u8BE6\u60C5",
        "aria-expanded": open,
        onClick: () => deps.toggle(),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: cx3(styles_module_css_default.erricon, ERRICON_TONE[tone]), children: icon }, "i"),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: styles_module_css_default.errtitlewrap, children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.errtitle, children: info.title }, "a"),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.errhint, children: info.hint }, "b")
          ] }, "t"),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.vcaret, children: open ? "\u25B4" : "\u25BE" }, "c")
        ]
      },
      "h"
    );
    const actionRow = /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: styles_module_css_default.erraction, children: [
      info.action ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.erractionText, children: "\u2192 " + info.action }, "p") : null,
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: styles_module_css_default.errabtns, children: [
        props.onRetry && info.retriable ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "button",
          {
            type: "button",
            className: styles_module_css_default.mini,
            title: "\u7ACB\u5373\u91CD\u65B0\u62C9\u53D6\u4E00\u6B21",
            onClick: () => props.onRetry && props.onRetry(),
            children: "\u21BB \u91CD\u8BD5"
          },
          "retry"
        ) : props.onRetry && !info.retriable ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "button",
          {
            type: "button",
            className: styles_module_css_default.mini,
            title: "\u6309\u4E0A\u9762\u6B65\u9AA4\u5904\u7406\u5B8C\u540E\uFF0C\u70B9\u8FD9\u91CC\u7ACB\u5373\u9A8C\u8BC1\u4E00\u6B21",
            onClick: () => props.onRetry && props.onRetry(),
            children: "\u2713 \u5DF2\u5904\u7406\uFF0C\u9A8C\u8BC1"
          },
          "recheck"
        ) : null,
        deps.openSettings ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "button",
          {
            type: "button",
            className: styles_module_css_default.mini,
            title: "\u524D\u5F80\u8BBE\u7F6E\u9875\u4FEE\u6539\u8BE5\u4F9B\u5E94\u5546\u914D\u7F6E",
            onClick: () => deps.openSettings && deps.openSettings(),
            children: "\u8BBE\u7F6E\u9875"
          },
          "settings"
        ) : null
      ] }, "btns")
    ] }, "a");
    const body = open ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: styles_module_css_default.errdetail, children: [
      steps.length ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: styles_module_css_default.errsub, children: "\u6392\u67E5\u6B65\u9AA4" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("ol", { className: styles_module_css_default.errsteps, children: steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("li", { children: s }, "s" + i)) })
      ] }, "steps") : null,
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: styles_module_css_default.errsub, children: "\u539F\u59CB\u4FE1\u606F" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("pre", { className: styles_module_css_default.errraw, children: detailText })
      ] }, "raw"),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: styles_module_css_default.errdactions, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "button",
          {
            type: "button",
            className: styles_module_css_default.mini,
            onClick: () => copy(detailText, (ok) => {
              setCopied(ok ? "\u5DF2\u590D\u5236" : "\u590D\u5236\u5931\u8D25");
              window.setTimeout(() => setCopied(""), 1600);
            }),
            children: copied || "\u590D\u5236\u8BE6\u60C5"
          }
        ),
        info.docs ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("a", { className: styles_module_css_default.mini, href: info.docs, target: "_blank", rel: "noreferrer noopener", children: "\u5B98\u65B9\u6587\u6863" }) : null,
        props.meta ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: styles_module_css_default.errmeta, children: props.meta }) : null
      ] }, "acts")
    ] }, "d") : null;
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: cx3(styles_module_css_default.errbox, ERRBOX_TONE[tone], props.compact ? styles_module_css_default.errboxCompact : void 0), children: [
      head,
      actionRow,
      body
    ] });
  };
}

// src/client/provider-icons.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var GRID = 16;
var STROKE = 1.4;
function shell(size, className, name, children) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: `0 0 ${String(GRID)} ${String(GRID)}`,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: STROKE,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      style: { display: "block" },
      "aria-hidden": "true",
      focusable: "false",
      "data-provider-icon": name,
      children
    }
  );
}
var BRANDS = {
  deepseek: {
    viewBox: "0 0 23.16 17.04",
    ratio: 17.04 / 23.16,
    d: "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z"
  }
};
function brand(mark, size, className, name) {
  const height = Math.round(size * mark.ratio * 100) / 100;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    "svg",
    {
      width: size,
      height,
      viewBox: mark.viewBox,
      fill: "currentColor",
      className,
      style: { display: "block" },
      "aria-hidden": "true",
      focusable: "false",
      "data-provider-icon": name,
      children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: mark.d, fill: "currentColor" })
    }
  );
}
var MARKS = {
  // DeepSeek：鲸尾（对称双叶 + 尾柄），占满 3–13
  deepseek: (size, className) => shell(
    size,
    className,
    "deepseek",
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M8 13.4V8.7" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M8 8.7C5 8.7 3 6.6 3.4 3.3c3.2.5 4.9 2.6 4.6 5.3" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M8 8.7c3 0 5-2.1 4.6-5.4-3.2.5-4.9 2.6-4.6 5.3" })
    ] })
  ),
  // opencode：竖向的圆角方框（对齐它自己的标识；线稿、内部留空）
  opencode: (size, className) => shell(size, className, "opencode", /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: "4.9", y: "2.5", width: "6.2", height: "11", rx: "2" })),
  // CommandCode / Goat：命令键 ⌘（中间一方块 + 四角四个回路）
  commandcode: (size, className) => shell(
    size,
    className,
    "commandcode",
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: "5.7", y: "5.7", width: "4.6", height: "4.6", rx: "0.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "3.9", cy: "3.9", r: "1.7" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "12.1", cy: "3.9", r: "1.7" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "3.9", cy: "12.1", r: "1.7" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "12.1", cy: "12.1", r: "1.7" })
    ] })
  ),
  // 本地账本：本子 + 装订线 + 两行字
  manual: (size, className) => shell(
    size,
    className,
    "manual",
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("rect", { x: "3.3", y: "2.9", width: "9.4", height: "10.2", rx: "1.4" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M6 2.9v10.2" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M8.3 6.3h2.5M8.3 8.7h2.5" })
    ] })
  ),
  // 通用兜底：一枚中性的供应商盒子
  generic: (size, className) => shell(
    size,
    className,
    "generic",
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M8 2.5 13.3 5.6v6.3L8 15 2.7 11.9V5.6z" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M8 8.7V15M2.9 5.7 8 8.7l5.1-3" })
    ] })
  )
};
var PROVIDER_ICON_NAMES = Object.keys(MARKS);
var PROVIDER_BRAND_NAMES = Object.keys(BRANDS);
function ProviderIcon(props) {
  const name = typeof props.name === "string" ? props.name.trim().toLowerCase() : "";
  const size = props.size ?? 16;
  const official = BRANDS[name];
  if (official !== void 0) return brand(official, size, props.className, name);
  const draw = MARKS[name] ?? MARKS["generic"];
  if (draw === void 0) return null;
  return draw(size, props.className);
}
var TYPE_ICON_FALLBACK = {
  deepseek: "deepseek",
  "deepseek-api": "deepseek",
  "deepseek-web": "deepseek",
  opencode: "opencode",
  "opencode-go": "opencode",
  "opencode-zen": "opencode",
  commandcode: "commandcode",
  manual: "manual"
};
function iconOf(type, metaIcon) {
  if (typeof metaIcon === "string" && metaIcon.trim() !== "") return metaIcon.trim().toLowerCase();
  return TYPE_ICON_FALLBACK[type] ?? "generic";
}

// src/client/QuotaRing.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
function QuotaRing(props) {
  const spec = props.spec;
  const size = props.size ?? 18;
  const stroke = props.stroke ?? 2.2;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = spec.pct === null ? null : Math.min(100, Math.max(0, spec.pct));
  const arcPct = pct === null ? spec.tone === "bad" || spec.tone === "warn" ? 100 : 0 : pct;
  const arc = arcPct / 100 * circ;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
    "svg",
    {
      className: styles_module_css_default.ring,
      width: size,
      height: size,
      viewBox: "0 0 " + size + " " + size,
      "data-tone": spec.tone,
      "data-empty": pct === null ? "1" : void 0,
      "aria-hidden": "true",
      focusable: "false",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { className: styles_module_css_default.ringTrack, cx: c, cy: c, r, fill: "none", strokeWidth: stroke }),
        arcPct > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "circle",
          {
            className: styles_module_css_default.ringArc,
            cx: c,
            cy: c,
            r,
            fill: "none",
            strokeWidth: stroke,
            strokeLinecap: "round",
            strokeDasharray: arc + " " + (circ - arc),
            transform: "rotate(-90 " + c + " " + c + ")"
          }
        ) : null
      ]
    }
  );
}

// src/client/providers/templates.ts
function ringSizeOf(variant) {
  return variant === "rail" ? 28 : 16;
}
var RAIL_ICON = 15;
function toneOfPct(pct) {
  if (!isFinite(pct)) return "idle";
  if (pct >= 90) return "bad";
  if (pct >= 70) return "warn";
  return "ok";
}
function clampPct(value) {
  const n = Number(value);
  if (!isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}
function windowPct(w) {
  if (!w || typeof w !== "object") return null;
  const direct = clampPct(w.pct);
  if (direct !== null) return direct;
  const used = Number(w.used);
  const limit = Number(w.limit);
  if (!isFinite(used) || !isFinite(limit) || limit <= 0) return null;
  return clampPct(used / limit * 100);
}
function worstWindowPct(snap) {
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  let worst = null;
  for (const w of wins) {
    const pct = windowPct(w);
    if (pct === null) continue;
    if (worst === null || pct > worst) worst = pct;
  }
  return worst;
}
function windowOfMetric(snap, metric) {
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  if (wins.length === 0) return null;
  const key = String(metric || "").toLowerCase();
  if (key === "") return null;
  const byKey = wins.filter((w) => String(w.key || "").toLowerCase() === key)[0];
  if (byKey) return byKey;
  const alias = {
    "5h": ["5 \u5C0F\u65F6", "5\u5C0F\u65F6", "\u6EDA\u52A8"],
    weekly: ["\u6BCF\u5468", "\u5468"],
    monthly: ["\u6BCF\u6708", "\u6708"]
  };
  const labels = alias[key];
  if (labels === void 0) return null;
  const hit = wins.filter((w) => labels.some((l) => String(w.label || "").indexOf(l) >= 0))[0];
  return hit ?? null;
}
function balanceText(snap, K) {
  const b = snap.billing || {};
  const balance = b["balance"];
  if (balance === void 0 || balance === null || b["isAvailable"] === false) return null;
  const n = Number(balance);
  if (!isFinite(n)) return null;
  return K.curSymbol(String(b["currency"] || "")) + K.fmt(n);
}
function failureRingSpec(snap, name) {
  const info = snap.errorInfo;
  const tone = info && info.tone === "bad" ? "bad" : "warn";
  const what = info && (info.title || info.hint) || "\u989D\u5EA6\u8BFB\u53D6\u5931\u8D25";
  return { pct: null, tone, title: name + "\uFF1A" + String(what) };
}
function defaultRingSpec(ctx, K) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "\u989D\u5EA6";
  if (!snap.ok) return failureRingSpec(snap, name);
  const pct = worstWindowPct(snap);
  if (pct !== null) {
    const label = "\u6700\u9AD8\u7A97\u53E3";
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + "%",
      title: name + "\uFF1A" + label + "\u5DF2\u7528 " + Math.round(pct) + "%"
    };
  }
  const money = balanceText(snap, K);
  if (money !== null) {
    return { pct: null, tone: "idle", text: money, title: name + "\uFF1A\u4F59\u989D " + money };
  }
  return { pct: null, tone: "idle", title: name + "\uFF1A\u6682\u65E0\u989D\u5EA6\u6570\u636E" };
}

// src/client/providers/kit.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
var SEG_TONE = {
  brand: styles_module_css_default.segBrand,
  ok: styles_module_css_default.segOk,
  warn: styles_module_css_default.segWarn,
  bad: styles_module_css_default.segBad,
  info: styles_module_css_default.segInfo,
  muted: styles_module_css_default.segMuted
};
var SEG_PAL = [
  styles_module_css_default.segPal0,
  styles_module_css_default.segPal1,
  styles_module_css_default.segPal2,
  styles_module_css_default.segPal3,
  styles_module_css_default.segPal4,
  styles_module_css_default.segPal5,
  styles_module_css_default.segPal6,
  styles_module_css_default.segPal7
];
function SectionTitle(props) {
  return props.text ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.xtitle, children: props.text }) : null;
}
function statusText(st) {
  const k = st.toLowerCase().replace(/[\s_-]/g, "");
  const MAP = {
    ratelimited: "\u5DF2\u9650\u6D41",
    throttled: "\u5DF2\u9650\u6D41",
    exceeded: "\u5DF2\u8D85\u9650",
    overlimit: "\u5DF2\u8D85\u9650",
    disabled: "\u5DF2\u505C\u7528",
    paused: "\u5DF2\u6682\u505C",
    expired: "\u5DF2\u8FC7\u671F"
  };
  return MAP[k] || st;
}
function RollingBar(deps, props) {
  const pct = Number(props.pct) || 0;
  const lvl = deps.levelOf(pct);
  const bad = props.status && props.status !== "ok" ? props.status : "";
  const barTitle = deps.levelTip(lvl) + "\uFF08" + Math.round(pct) + "%\uFF09" + (bad ? " \xB7 \u4E0A\u6E38\u72B6\u6001\uFF1A" + bad : "");
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.qrow, children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.qlabel, children: props.label }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.qbar, title: barTitle, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      "span",
      {
        className: styles_module_css_default.qfill + (lvl === "ok" ? "" : " " + styles_module_css_default[lvl]),
        style: { width: Math.min(100, pct) + "%" }
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.qpct + (lvl === "ok" ? "" : " " + styles_module_css_default[lvl]), children: Math.round(pct) + "%" }),
    bad ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.qstatus, title: "\u4E0A\u6E38\u7A97\u53E3\u72B6\u6001\uFF1A" + bad, children: statusText(bad) }) : null,
    props.left ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.qleft, children: props.left }) : null
  ] }, props.barKey);
}
function WindowGroup(deps, props) {
  const wins = (Array.isArray(props.windows) ? props.windows : []).filter((w) => w && w.label !== void 0);
  if (!wins.length) return null;
  const kids = [];
  if (props.title) kids.push(/* @__PURE__ */ (0, import_jsx_runtime12.jsx)(SectionTitle, { text: props.title }, "t"));
  wins.forEach((w, i) => {
    const left = w.resetInSec > 0 ? deps.fmtLeft(deps.remainOf(w, props.snap, props.now)) : void 0;
    kids.push(
      RollingBar(deps, {
        barKey: w.key || "w" + i,
        label: w.label,
        pct: w.pct,
        left,
        status: w.status
      })
    );
  });
  if (wins.length > 1 && !props.noSummary) {
    const worst = wins.reduce((m, w) => w.pct > m.pct ? w : m, wins[0]);
    const minRem = wins.reduce((m, w) => Math.min(m, deps.remainOf(w, props.snap, props.now)), Infinity);
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.paygSub, children: "\u6700\u9AD8\u5360\u7528 " + worst.label + " " + Math.round(worst.pct) + "% \xB7 \u6700\u65E9\u91CD\u7F6E" + deps.fmtLeft(minRem) }, "sum")
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.body, children: kids });
}
function BalanceBlock(deps, props) {
  const b = props.billing || {};
  if (!Object.keys(b).length) return null;
  const amt = deps.num(b["balance"], 0);
  const cur = String(b["currency"] || "CNY");
  const sym = deps.curSymbol(cur);
  const granted = b["granted"] !== void 0 && b["granted"] !== null ? deps.num(b["granted"], 0) : null;
  const topped = b["toppedUp"] !== void 0 && b["toppedUp"] !== null ? deps.num(b["toppedUp"], 0) : null;
  const avail = b["isAvailable"];
  const empty = amt <= 0 || avail === false;
  const availCls = empty ? "bad" : avail === true ? "ok" : "unknown";
  const availTxt = availCls === "bad" ? "\u4E0D\u8DB3" : availCls === "ok" ? "\u53EF\u7528" : "\u72B6\u6001\u672A\u77E5";
  const availTip = "\u53EF\u7528\u6027\u5FBD\u6807\uFF1A\n\xB7 \u53EF\u7528 \u2014\u2014 \u4E0A\u6E38\u660E\u786E\u8BF4\u53EF\u7528\n\xB7 \u4E0D\u8DB3 \u2014\u2014 \u4E0A\u6E38\u660E\u786E\u62A5\u4E0D\u8DB3\uFF0C\u6216\u4F59\u989D\u5DF2 \u2264 0\uFF08\u4E0E\u4E0B\u65B9\u4F59\u989D\u544A\u8B66\u540C\u4E00\u4E2A\u5224\u636E\uFF09\n\xB7 \u72B6\u6001\u672A\u77E5 \u2014\u2014 \u4E0A\u6E38\u6CA1\u6709\u7ED9\u51FA\u53EF\u7528\u6027\u5224\u65AD\uFF0C\u8FD9\u91CC\u53EA\u53CD\u6620\u4F59\u989D\u6570\u5B57\u672C\u8EAB\uFF08\u4F8B\u5982\u624B\u52A8\u8D26\u672C\uFF09";
  const warnLine = b["lowWarn"] !== void 0 && b["lowWarn"] !== null && b["lowWarn"] !== "" ? deps.num(b["lowWarn"], 0) : null;
  const infos = Array.isArray(b["infos"]) ? b["infos"] : [];
  const kids = [];
  if (props.title) kids.push(/* @__PURE__ */ (0, import_jsx_runtime12.jsx)(SectionTitle, { text: props.title }, "t"));
  kids.push(
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.paygTop, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.paygCur, children: sym || cur }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.paygAmt + (amt < 0 ? " " + styles_module_css_default.neg : ""), children: deps.fmt(amt) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.avail + " " + styles_module_css_default[availCls], title: availTip, children: availTxt })
    ] }, "top")
  );
  const parts = [];
  if (granted !== null && granted > 0) parts.push("\u8D60\u9001 " + sym + deps.fmt(granted));
  if (topped !== null && topped > 0) parts.push("\u5145\u503C " + sym + deps.fmt(topped));
  if (warnLine !== null) parts.push("\u9884\u8B66\u7EBF " + sym + deps.fmt(warnLine));
  if (parts.length)
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.paygSub, children: parts.join(" \xB7 ") }, "parts")
    );
  if (infos.length > 1)
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.infos, children: infos.map((x, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.inforow, children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: String(x["currency"] || "?") }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("b", { children: deps.fmt(x["total"]) })
      ] }, String(x["currency"] || i))) }, "infos")
    );
  const low = !empty && warnLine !== null && amt <= warnLine;
  if (empty)
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.warnLine + " " + styles_module_css_default.bad, children: "\u4F59\u989D\u4E0D\u8DB3\uFF0CAPI \u8C03\u7528\u53EF\u80FD\u88AB\u62D2\u7EDD\uFF0C\u8BF7\u53CA\u65F6\u5145\u503C\u3002" }, "warn")
    );
  else if (low)
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.warnLine, children: "\u4F59\u989D\u4F4E\u4E8E\u9884\u8B66\u7EBF " + sym + deps.fmt(warnLine) + "\uFF0C\u5EFA\u8BAE\u53CA\u65F6\u5145\u503C\u3002" }, "warn")
    );
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: props.compact ? styles_module_css_default.paygCompact : void 0, children: kids });
}
function MetricRows(deps, props) {
  const items = (Array.isArray(props.items) ? props.items : []).filter((it) => it && it.label);
  if (!items.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.xstats, children: [
    props.title ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(SectionTitle, { text: props.title }, "t") : null,
    items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.xrow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { children: String(it.label) }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("b", { children: String(it.value) })
    ] }, "r" + i))
  ] });
}
function MetricGrid(deps, props) {
  const items = (Array.isArray(props.items) ? props.items : []).filter((it) => it && it.label);
  if (!items.length) return null;
  const cells = [];
  if (props.mergePairs) {
    for (let i = 0; i < items.length; i += 2) {
      const a = items[i];
      const b = items[i + 1];
      if (b) cells.push({ label: a.label + " / " + b.label, value: a.value + " \xB7 " + b.value });
      else cells.push(a);
    }
  } else {
    for (const it of items) cells.push(it);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.xgrid, children: [
    props.title ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(SectionTitle, { text: props.title }, "t") : null,
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.xgridBody, children: cells.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.xcell, title: c.label + "\uFF1A" + c.value, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.xcellLabel, children: c.label }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("b", { className: styles_module_css_default.xcellValue, children: c.value })
    ] }, "c" + i)) }, "g")
  ] });
}
function SplitBar(deps, props) {
  const segs = (Array.isArray(props.segments) ? props.segments : []).filter((sg) => sg && isFinite(Number(sg.value)) && Number(sg.value) > 0).slice(0, 8);
  if (!segs.length) return null;
  const sum = segs.reduce((acc, x) => acc + Number(x.value), 0);
  const segClass = (i) => {
    const tone = segs[i]?.tone;
    if (tone !== void 0 && SEG_TONE[tone] !== void 0) return SEG_TONE[tone];
    return SEG_PAL[i % SEG_PAL.length];
  };
  const segStyle = (i) => {
    const style = { flexGrow: Number(segs[i]?.value) };
    const legacy = segs[i]?.color;
    if (segs[i]?.tone === void 0 && typeof legacy === "string" && legacy !== "") style.background = legacy;
    return style;
  };
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { children: [
    props.title ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(SectionTitle, { text: props.title }, "t") : null,
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.xsplit, children: segs.map((sg, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: segClass(i), style: segStyle(i) }, "g" + i)) }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.xstats, children: segs.map((sg, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.xrow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.xdot + " " + String(segClass(i)), style: segStyle(i) }),
        String(sg.label || "")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("b", { children: String(Math.round(Number(sg.value) * 100 / sum)) + "%" })
    ] }, "l" + i)) })
  ] });
}
function NoteLine(deps, props) {
  const t = typeof props.text === "string" ? props.text : "";
  if (!t) return null;
  const tone = props.tone === "bad" ? styles_module_css_default.warnLine + " " + styles_module_css_default.bad : props.tone === "warn" ? styles_module_css_default.warnLine : styles_module_css_default.paygSub;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: tone, children: t });
}
function MiniChart(deps, props) {
  const ch = props.chart;
  const vals = (ch && Array.isArray(ch.values) ? ch.values : []).map((v) => isFinite(Number(v)) ? Number(v) : 0).slice(-60);
  if (vals.length < 2) return null;
  const W = 248;
  const Hh = 52;
  const Pd = 3;
  const max = Math.max.apply(null, vals.concat([1]));
  const step = vals.length > 1 ? (W - Pd * 2) / (vals.length - 1) : 0;
  const pts = vals.map((v, i) => [Pd + step * i, Hh - Pd - v / max * (Hh - Pd * 2)]);
  const line = pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const area = Pd + "," + (Hh - Pd) + " " + line + " " + (W - Pd) + "," + (Hh - Pd);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.xchart, children: [
    ch && ch.title ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.xtitle, children: String(ch.title) }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
      "svg",
      {
        viewBox: "0 0 " + W + " " + Hh,
        preserveAspectRatio: "none",
        style: { display: "block", width: "100%", height: Hh + "px" },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("polygon", { points: area, style: { fill: "var(--dsw-alias-state-business-primary)", opacity: 0.15 } }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            "polyline",
            {
              points: line,
              fill: "none",
              style: {
                stroke: "var(--dsw-alias-state-business-primary)",
                strokeWidth: 1.6,
                strokeLinecap: "round",
                strokeLinejoin: "round"
              }
            }
          )
        ]
      }
    )
  ] });
}
function cx4(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var VCHIP_TONE = {
  ok: styles_module_css_default.vchipOk,
  warn: styles_module_css_default.vchipWarn,
  bad: styles_module_css_default.vchipBad,
  info: styles_module_css_default.vchipInfo
};
function Chips(deps, props) {
  const chips = (Array.isArray(props.chips) ? props.chips : []).filter((c) => c && c.text);
  if (!chips.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: styles_module_css_default.vchips, children: chips.map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: cx4(styles_module_css_default.vchip, c.tone ? VCHIP_TONE[c.tone] : void 0), children: c.text }, i)) });
}
function ButtonLayout(props) {
  if (props.variant === "rail") {
    if (props.rail !== void 0) return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnRail, children: props.rail });
    const icon = props.icon !== void 0 && props.icon !== "" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnDialCore, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ProviderIcon, { name: props.icon, size: RAIL_ICON }) }) : null;
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnRail, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: styles_module_css_default.btnDial, children: [
      props.leading,
      icon
    ] }) });
  }
  if (props.variant === "row") {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnRow, children: props.glyph ?? props.leading });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
    props.icon !== void 0 && props.icon !== "" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnIcon, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ProviderIcon, { name: props.icon, size: 16 }) }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnLead, children: props.leading }),
    props.name !== void 0 && props.name !== "" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnName, children: props.name }) : null,
    props.value !== void 0 && props.value !== "" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnValue, "data-tone": props.tone ?? "", children: props.value }) : null
  ] });
}
function WindowBars(deps, props) {
  const wins = (Array.isArray(props.windows) ? props.windows : []).filter((w) => windowPct(w) !== null).slice(0, 4);
  if (wins.length === 0) return null;
  const h = props.height ?? 4;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnBars, children: wins.map((w, i) => {
    const pct = windowPct(w) ?? 0;
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
      "span",
      {
        className: styles_module_css_default.btnBar,
        "data-tone": toneOfPct(pct),
        "data-active": props.activeKey !== void 0 && props.activeKey === w.key ? "1" : void 0,
        title: String(w.label || "") + " \u5DF2\u7528 " + Math.round(pct) + "%",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnBarLabel, children: shortWindowLabel(String(w.label || w.key || "")) }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnBarTrack, style: { height: h + "px" }, children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.btnBarFill, style: { width: Math.round(pct) + "%" } }) })
        ]
      },
      String(w.key || i)
    );
  }) });
}
function tinyMoney(text) {
  const m = /^([^0-9-]*)(-?\d+(?:\.\d+)?)$/.exec(String(text || ""));
  if (!m) return String(text || "").slice(0, 6);
  const sym = m[1];
  const n = Number(m[2]);
  if (!isFinite(n)) return String(text).slice(0, 6);
  const abs = Math.abs(n);
  if (abs >= 1e4) return sym + (n / 1e4).toFixed(1).replace(/\.0$/, "") + "\u4E07";
  return sym + String(Math.round(n));
}
function shortWindowLabel(label) {
  const s = String(label || "");
  if (s === "") return "";
  if (s.indexOf("5") >= 0 && s.indexOf("\u5C0F\u65F6") >= 0) return "5\u65F6";
  if (s.indexOf("\u5468") >= 0) return "\u5468";
  if (s.indexOf("\u6708") >= 0) return "\u6708";
  if (s.indexOf("\u65E5") >= 0 || s.indexOf("\u5929") >= 0) return "\u65E5";
  if (s.indexOf("\u5E74") >= 0) return "\u5E74";
  return s.slice(0, 3);
}
function PrefSwitch(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("label", { className: styles_module_css_default.prefRow, title: props.hint, children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      "input",
      {
        type: "checkbox",
        className: styles_module_css_default.prefBox,
        checked: props.checked,
        onChange: (event) => {
          props.onChange(event.target.checked);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.prefLabel, children: props.label })
  ] });
}
function PrefChoice(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: styles_module_css_default.prefRow, role: "radiogroup", "aria-label": props.label ?? "\u9009\u9879", children: [
    props.label !== void 0 && props.label !== "" ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.prefLabel, children: props.label }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: styles_module_css_default.prefSeg, children: props.options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
      "button",
      {
        type: "button",
        role: "radio",
        "aria-checked": opt.value === props.value,
        className: styles_module_css_default.prefOpt,
        "data-on": opt.value === props.value ? "1" : void 0,
        title: opt.hint ?? opt.label,
        onClick: () => {
          props.onChange(opt.value);
        },
        children: opt.label
      },
      opt.value
    )) })
  ] });
}
function createProviderKit(deps) {
  const ErrorCard = createErrorBox({
    isOpen: deps.errOpen,
    toggle: deps.toggleErr,
    ...deps.openSettings ? { openSettings: deps.openSettings } : {}
  });
  return {
    RollingBar: (props) => RollingBar(deps, props),
    WindowGroup: (props) => WindowGroup(deps, props),
    BalanceBlock: (props) => BalanceBlock(deps, props),
    MetricRows: (props) => MetricRows(deps, props),
    MetricGrid: (props) => MetricGrid(deps, props),
    SplitBar: (props) => SplitBar(deps, props),
    NoteLine: (props) => NoteLine(deps, props),
    MiniChart: (props) => MiniChart(deps, props),
    SectionTitle: (props) => SectionTitle(props),
    Chips: (props) => Chips(deps, props),
    ErrorCard,
    Ring: (props) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(QuotaRing, { spec: props.spec, size: props.size ?? 18, stroke: props.stroke ?? 2.2 }),
    ProviderIcon: (props) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ProviderIcon, { name: props.name, size: props.size ?? 16 }),
    ButtonLayout: (props) => ButtonLayout(props),
    WindowBars: (props) => WindowBars(deps, props),
    shortWindowLabel,
    tinyMoney,
    PrefSwitch: (props) => PrefSwitch(props),
    PrefChoice: (props) => PrefChoice(props),
    num: deps.num,
    fmt: deps.fmt,
    fmtLeft: deps.fmtLeft,
    curSymbol: deps.curSymbol,
    remainOf: deps.remainOf,
    timeAgo: deps.timeAgo,
    levelOf: deps.levelOf
  };
}

// src/client/quota-prefs.ts
var KEY = "tm-quota-prefs";
var LEGACY_KEY = "tm-button-metric";
var MAX_VENDORS = 64;
var MAX_KEYS = 16;
var ID_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/i;
var KEY_RE = /^[a-z0-9-]{1,24}$/;
var VALUE_RE = /^[a-z0-9._-]{0,32}$/;
function load() {
  try {
    if (typeof localStorage === "undefined") return {};
    localStorage.removeItem(LEGACY_KEY);
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out = {};
    let vendors = 0;
    for (const [id, bag] of Object.entries(parsed)) {
      if (vendors >= MAX_VENDORS) break;
      if (!ID_RE.test(id) || !bag || typeof bag !== "object" || Array.isArray(bag)) continue;
      const clean = {};
      let keys = 0;
      for (const [k, v] of Object.entries(bag)) {
        if (keys >= MAX_KEYS) break;
        if (!KEY_RE.test(k) || typeof v !== "string") continue;
        const value = v.trim().toLowerCase();
        if (!VALUE_RE.test(value)) continue;
        clean[k] = value;
        keys += 1;
      }
      if (keys > 0) {
        out[id] = clean;
        vendors += 1;
      }
    }
    return out;
  } catch {
    return {};
  }
}
function save(next) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
  }
}
var prefs = load();
var listeners = /* @__PURE__ */ new Set();
function emit() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
    }
  }
}
var scopes = /* @__PURE__ */ new Map();
var providerPrefs = {
  /**
   * 取某供应商的作用域接口（模板拿到的 `ctx.prefs` 就是它）。
   *
   * @param vendorId - 供应商 id。
   * @returns 该供应商的偏好接口。
   */
  scope(vendorId) {
    const cached = scopes.get(vendorId);
    if (cached !== void 0) return cached;
    const api = {
      get: (key, fallback = "") => {
        const bag = prefs[vendorId];
        const hit = bag?.[key];
        return typeof hit === "string" && hit !== "" ? hit : fallback;
      },
      set: (key, value) => {
        if (!ID_RE.test(vendorId) || !KEY_RE.test(key)) return;
        const v = String(value ?? "").trim().toLowerCase();
        if (v !== "" && !VALUE_RE.test(v)) return;
        const bag = { ...prefs[vendorId] };
        if (v === "") delete bag[key];
        else bag[key] = v;
        const next = { ...prefs };
        if (Object.keys(bag).length === 0) delete next[vendorId];
        else next[vendorId] = bag;
        prefs = next;
        save(prefs);
        emit();
      }
    };
    scopes.set(vendorId, api);
    return api;
  },
  /**
   * 订阅变化（侧边栏按钮 / 弹层用它触发重画）。
   *
   * @param fn - 变化回调。
   * @returns 取消订阅。
   */
  subscribe(fn) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /**
   * 丢掉不在册的供应商（被删掉后那几条用不到）。
   *
   * @param vendorIds - 当前配置里的供应商 id。
   * @returns 无。
   */
  prune(vendorIds) {
    const alive = new Set(vendorIds);
    const next = {};
    let changed = false;
    for (const [id, bag] of Object.entries(prefs)) {
      if (alive.has(id)) next[id] = bag;
      else changed = true;
    }
    if (!changed) return;
    prefs = next;
    save(prefs);
    emit();
  },
  /** 全部清空（测试与「重置」用）。 */
  clear() {
    prefs = {};
    save(prefs);
    emit();
  }
};

// src/client/providers/sections.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
function renderSection(K, s, ctx, i) {
  if (!s || typeof s !== "object") return null;
  const key = "sec:" + (s.key || s.kind) + ":" + i;
  switch (s.kind) {
    case "windows":
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.WindowGroup, { windows: s.windows, snap: ctx.snap, now: ctx.now, title: s.title }, key);
    case "balance":
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.BalanceBlock, { billing: s.billing, title: s.title }, key);
    case "metrics":
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.MetricRows, { items: s.items, title: s.title }, key);
    case "progress": {
      const p = s.progress;
      if (!p) return null;
      const total = Number(p.total);
      const used = Number(p.used);
      if (!isFinite(total) || total <= 0 || !isFinite(used)) return null;
      const pct = Math.min(100, Math.max(0, used / total * 100));
      const left = p.left !== void 0 && p.left !== "" ? String(p.left) : "\u5269\u4F59 " + (total - used);
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: styles_module_css_default.xprog, children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.SectionTitle, { text: s.title }, "t"),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.RollingBar, { label: String(p.label || s.title || "\u989D\u5EA6"), pct, left }, "bar")
      ] }, key);
    }
    case "split":
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.SplitBar, { segments: s.split && s.split.segments, title: s.title }, key);
    case "note":
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.NoteLine, { text: s.note && s.note.text, tone: s.note && s.note.tone }, key);
    case "chart":
      return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(K.MiniChart, { chart: s.chart }, key);
    default:
      return null;
  }
}
function renderSections(K, sections, ctx) {
  if (!Array.isArray(sections) || !sections.length) return null;
  const kids = sections.map((s, i) => renderSection(K, s, ctx, i)).filter((n) => n !== null && n !== void 0 && n !== false);
  if (!kids.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: styles_module_css_default.sections, children: kids });
}

// src/client/providers/ui/commandcode.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function commandcodeDetail(ctx, K) {
  const snap = ctx.snap;
  const b = snap.billing || {};
  const plan = b["plan"] ? String(b["plan"]) : "";
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const notes = (snap.extra && Array.isArray(snap.extra.blocks) ? snap.extra.blocks : []).filter(
    (x) => x && x.kind === "note" && x.text
  );
  const alerts = notes.filter((n) => n.tone === "bad" || n.tone === "warn");
  const kids = [];
  const metrics = (snap.extra && Array.isArray(snap.extra.stats) ? snap.extra.stats : []).slice(0, 12);
  const planMetric = metrics.filter((m) => m && m.label === "\u8BA2\u9605\u8BA1\u5212")[0];
  const planStatus = planMetric ? String(planMetric.value).replace(/^[^（(]*[（(]/, "").replace(/[）)]\s*$/, "") : "";
  const restMetrics = metrics.filter((m) => m && m.label !== "\u8BA2\u9605\u8BA1\u5212");
  const chips = [];
  if (plan)
    chips.push({
      text: planStatus ? plan + " \xB7 " + planStatus : plan,
      tone: /active|生效/i.test(planStatus) ? "ok" : "info"
    });
  if (alerts.length) chips.push({ text: "\u9700\u5904\u7406", tone: "bad" });
  else if (wins.some((w) => Number(w.pct) >= 100)) chips.push({ text: "\u7A97\u53E3\u5DF2\u6EE1", tone: "bad" });
  if (chips.length) kids.push(/* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.Chips, { chips }, "chips"));
  kids.push(/* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.BalanceBlock, { billing: b, compact: true }, "bal"));
  if (wins.length)
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.WindowGroup, { windows: wins, snap, now: ctx.now, title: "\u989D\u5EA6\u7A97\u53E3", noSummary: true }, "win")
    );
  const monthly = K.num(b["monthlyCredits"], 0);
  const purchased = K.num(b["purchasedCredits"], 0);
  const free = K.num(b["freeCredits"], 0);
  const segs = [
    { label: "\u6708\u5EA6\u989D\u5EA6", value: monthly, tone: "brand" },
    { label: "\u5145\u503C\u989D\u5EA6", value: purchased, tone: "ok" },
    { label: "\u8D60\u9001\u989D\u5EA6", value: free, tone: "warn" }
  ].filter((s) => s.value > 0);
  if (segs.length > 1) kids.push(/* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.SplitBar, { segments: segs, title: "\u989D\u5EA6\u6784\u6210" }, "split"));
  const items = [];
  for (const it of restMetrics.slice(0, 6)) items.push({ label: it.label, value: it.value });
  if (!items.length) {
    if (plan) items.push({ label: "\u8BA2\u9605\u8BA1\u5212", value: plan });
    if (b["periodEnd"]) items.push({ label: "\u5F53\u524D\u5468\u671F\u81F3", value: String(b["periodEnd"]) });
  }
  kids.push(/* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.MetricGrid, { items, title: "\u8D26\u6237\u4E0E\u7528\u91CF" }, "metrics"));
  const window2 = selectedWindow(ctx);
  const showBalance = ctx.prefs.get(BALANCE_PREF, "0") === "1";
  kids.push(
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: styles_module_css_default.prefBlock, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.SectionTitle, { text: "\u4FA7\u680F\u6309\u94AE\u663E\u793A" }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        K.PrefSwitch,
        {
          label: "\u6570\u503C\u4F4D\u663E\u793A\u4F59\u989D",
          hint: "\u52FE\u4E0A\u540E\u6309\u94AE\u53F3\u4FA7\u663E\u793A\u5269\u4F59\u989D\u5EA6\uFF1B\u8FDB\u5EA6\u6761\u7167\u65E7\u753B\u5F53\u524D\u7A97\u53E3\u7684\u5360\u7528\u6BD4\u4F8B",
          checked: showBalance,
          onChange: (next) => ctx.prefs.set(BALANCE_PREF, next ? "1" : "0")
        },
        "bal"
      ),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        K.PrefChoice,
        {
          label: "\u73AF\u753B\u54EA\u4E2A\u7A97\u53E3",
          value: window2,
          options: WINDOW_OPTIONS,
          onChange: (next) => ctx.prefs.set(WINDOW_PREF, next)
        },
        "win"
      )
    ] }, "prefs")
  );
  for (let i = 0; i < alerts.length && i < 2; i++) {
    const n = alerts[i];
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.NoteLine, { text: n.text, tone: n.tone || "warn" }, "note" + i));
  }
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: styles_module_css_default.ui, children: kids });
}
function commandcodeButton(ctx, K) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "CommandCode";
  const size = ringSizeOf(ctx.variant);
  if (!snap.ok) {
    const fail = failureRingSpec(snap, name);
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      K.ButtonLayout,
      {
        variant: ctx.variant,
        leading: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.Ring, { spec: fail, size }),
        glyph: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.Ring, { spec: fail, size: 16 }),
        name,
        value: "\u8BFB\u53D6\u5931\u8D25",
        tone: "bad"
      }
    );
  }
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const picked = windowOfMetric(snap, selectedWindow(ctx)) ?? wins[0] ?? null;
  const spec = ringSpecOf(ctx, K, picked);
  const ring = /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.Ring, { spec, size });
  const showBalance = ctx.prefs.get(BALANCE_PREF, "0") === "1";
  const money = balanceText(snap, K);
  const value = showBalance ? money ?? "\u2014" : spec.text ?? "";
  const tone = showBalance ? balanceLow(ctx, K) ? "bad" : void 0 : spec.tone;
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
    K.ButtonLayout,
    {
      variant: ctx.variant,
      leading: ring,
      glyph: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(K.Ring, { spec, size: 16 }),
      name,
      value,
      tone,
      icon: ctx.icon
    }
  );
}
function ringSpecOf(ctx, K, picked) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "CommandCode";
  const pct = picked ? windowPct(picked) : worstWindowPct(snap);
  if (pct !== null) {
    const label = picked ? String(picked.label || picked.key) : "\u6700\u7D27\u7A97\u53E3";
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + "%",
      title: name + "\uFF1A" + label + "\u5DF2\u7528 " + Math.round(pct) + "%"
    };
  }
  const money = balanceText(snap, K);
  return {
    pct: null,
    tone: balanceLow(ctx, K) ? "bad" : "idle",
    ...money !== null ? { text: money } : {},
    title: name + "\uFF1A\u4F59\u989D " + (money ?? "\u672A\u77E5") + "\uFF08\u6CA1\u6709\u53EF\u663E\u793A\u7684\u7A97\u53E3\uFF09"
  };
}
function balanceLow(ctx, K) {
  const b = ctx.snap.billing || {};
  if (b["isAvailable"] === false) return true;
  const amount = K.num(b["balance"], Number.NaN);
  if (!isFinite(amount)) return false;
  if (amount <= 0) return true;
  const warn = b["lowWarn"];
  if (warn === void 0 || warn === null || warn === "") return false;
  return amount <= K.num(warn, 0);
}
var WINDOW_PREF = "window";
var BALANCE_PREF = "balance";
var WINDOW_OPTIONS = [
  { value: "5h", label: "5h", hint: "\u6309\u952E\u4E0A\u90A3\u679A\u73AF\u753B 5 \u5C0F\u65F6\u6EDA\u52A8\u7A97\u53E3\u7684\u5360\u7528" },
  { value: "weekly", label: "1w", hint: "\u6309\u952E\u4E0A\u90A3\u679A\u73AF\u753B\u6BCF\u5468\u7A97\u53E3\u7684\u5360\u7528" },
  { value: "monthly", label: "1m", hint: "\u6309\u952E\u4E0A\u90A3\u679A\u73AF\u753B\u6BCF\u6708\u7A97\u53E3\u7684\u5360\u7528\uFF08\u9ED8\u8BA4\uFF09" }
];
function selectedWindow(ctx) {
  const v = ctx.prefs.get(WINDOW_PREF, "monthly");
  return v === "5h" || v === "weekly" || v === "monthly" ? v : "monthly";
}
var commandcode = {
  button: commandcodeButton,
  buttonHint: (ctx, K) => {
    const name = ctx.vendorName || ctx.snap.vendorName || "CommandCode";
    if (!ctx.snap.ok) return failureRingSpec(ctx.snap, name).title;
    const wins = Array.isArray(ctx.snap.windows) ? ctx.snap.windows : [];
    const picked = windowOfMetric(ctx.snap, selectedWindow(ctx)) ?? wins[0] ?? null;
    const base = ringSpecOf(ctx, K, picked).title;
    if (ctx.prefs.get(BALANCE_PREF, "0") === "1") {
      return base + "\uFF1B\u6570\u503C\u4F4D\u663E\u793A\u4F59\u989D " + (balanceText(ctx.snap, K) ?? "\u672A\u77E5");
    }
    return base;
  },
  detail: commandcodeDetail
};

// src/client/providers/ui/deepseek.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
function balanceRows(ctx, K) {
  const b = ctx.snap.billing || {};
  const sym = K.curSymbol(String(b["currency"] || ""));
  const rows = [];
  if (b["balance"] !== void 0 && b["balance"] !== null)
    rows.push({ label: "\u4F59\u989D", value: sym + K.fmt(b["balance"]) });
  if (b["granted"] !== void 0 && b["granted"] !== null)
    rows.push({ label: "\u8D60\u9001", value: sym + K.fmt(b["granted"]) });
  if (b["toppedUp"] !== void 0 && b["toppedUp"] !== null)
    rows.push({ label: "\u5145\u503C", value: sym + K.fmt(b["toppedUp"]) });
  const infos = Array.isArray(b["infos"]) ? b["infos"] : [];
  for (const info of infos.slice(0, 3)) {
    const cur = String(info["currency"] || "");
    const total = Number(info["total"]);
    if (!cur || !isFinite(total)) continue;
    rows.push({ label: cur + " \u603B\u989D", value: K.curSymbol(cur) + K.fmt(total) });
  }
  return rows;
}
function deepseekDetail(ctx, K) {
  const snap = ctx.snap;
  const b = snap.billing || {};
  const via = String(snap.via || "");
  const isWeb = via.indexOf("\u7F51\u9875") >= 0;
  const kids = [];
  const chips = [];
  if (via) chips.push({ text: isWeb ? "\u7F51\u9875\u8D26\u5355\u63A5\u53E3" : "\u5B98\u65B9\u4F59\u989D\u63A5\u53E3", tone: isWeb ? "info" : "ok" });
  if (isWeb) chips.push({ text: "\u7968\u636E\u4F1A\u8FC7\u671F", tone: "warn" });
  if (chips.length) kids.push(/* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.Chips, { chips }, "chips"));
  const rows = balanceRows(ctx, K);
  if (rows.length) kids.push(/* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.MetricRows, { items: rows, title: "\u8D26\u6237\u4F59\u989D" }, "bal"));
  const amt = K.num(b["balance"], 0);
  const dSym = K.curSymbol(String(b["currency"] || ""));
  const warnLine = b["lowWarn"] !== void 0 && b["lowWarn"] !== null && b["lowWarn"] !== "" ? K.num(b["lowWarn"], 0) : null;
  if (b["isAvailable"] === false || amt <= 0) {
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.NoteLine, { text: "\u4F59\u989D\u4E0D\u8DB3\uFF0CAPI \u8C03\u7528\u53EF\u80FD\u88AB\u62D2\u7EDD\uFF0C\u8BF7\u53CA\u65F6\u5145\u503C\u3002", tone: "bad" }, "empty"));
  } else if (warnLine !== null && amt <= warnLine) {
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        K.NoteLine,
        {
          text: "\u4F59\u989D\u4F4E\u4E8E\u9884\u8B66\u7EBF " + dSym + K.fmt(warnLine) + "\uFF0C\u5EFA\u8BAE\u53CA\u65F6\u5145\u503C\u3002",
          tone: "warn"
        },
        "low"
      )
    );
  }
  const granted = b["granted"] !== void 0 && b["granted"] !== null ? K.num(b["granted"], 0) : null;
  const topped = b["toppedUp"] !== void 0 && b["toppedUp"] !== null ? K.num(b["toppedUp"], 0) : null;
  const totalQuota = (granted || 0) + (topped || 0);
  if (totalQuota > 0) {
    const used = Math.max(0, totalQuota - amt);
    const segs = [
      { label: "\u8D60\u9001\u989D\u5EA6", value: granted || 0, tone: "warn" },
      { label: "\u5145\u503C\u989D\u5EA6", value: topped || 0, tone: "ok" }
    ].filter((s) => s.value > 0);
    if (segs.length > 1) kids.push(/* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.SplitBar, { segments: segs, title: "\u989D\u5EA6\u6784\u6210" }, "split"));
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: styles_module_css_default.xprog, children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.SectionTitle, { text: "\u603B\u989D\u5EA6\u6D88\u8017" }, "t"),
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
          K.RollingBar,
          {
            label: "\u603B\u989D\u5EA6",
            pct: Math.min(100, used / totalQuota * 100),
            left: "\u5DF2\u7528 " + K.fmt(used) + " / \u5171 " + K.fmt(totalQuota)
          },
          "bar"
        )
      ] }, "prog")
    );
  }
  const items = (snap.extra && Array.isArray(snap.extra.stats) ? snap.extra.stats : []).slice(0, 8);
  if (items.length) kids.push(/* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.MetricRows, { items, title: "\u6D88\u8D39\u7EDF\u8BA1" }, "metrics"));
  kids.push(
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: styles_module_css_default.prefBlock, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      K.PrefSwitch,
      {
        label: "\u6570\u503C\u4F4D\u663E\u793A\u4F59\u989D",
        hint: "\u52FE\u4E0A\u540E\u6309\u94AE\u53F3\u4FA7\u663E\u793A\u8D26\u6237\u4F59\u989D\uFF1B\u73AF\u7167\u65E7\u753B\u603B\u989D\u5EA6\u6D88\u8017\u6BD4\u4F8B",
        checked: ctx.prefs.get(BALANCE_PREF2, "0") === "1",
        onChange: (next) => ctx.prefs.set(BALANCE_PREF2, next ? "1" : "0")
      },
      "bal"
    ) }, "prefs")
  );
  const chart = snap.extra && snap.extra.chart ? snap.extra.chart : null;
  if (chart && Array.isArray(chart.values) && chart.values.length > 1) {
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.MiniChart, { chart }, "chart"));
  } else if (!isWeb) {
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        K.NoteLine,
        {
          text: "\u5B98\u65B9\u4F59\u989D\u63A5\u53E3\u4E0D\u63D0\u4F9B\u5386\u53F2\u8D8B\u52BF\uFF1B\u5982\u9700\u8D8B\u52BF\u56FE\uFF0C\u53EF\u5728\u8BBE\u7F6E\u91CC\u540C\u65F6\u586B\u5165\u7F51\u9875 token\uFF08\u4F1A\u8BDD\u7968\u636E\uFF09\uFF0C\u63D2\u4EF6\u4F1A\u81EA\u52A8\u6539\u7528\u7F51\u9875\u8D26\u5355\u63A5\u53E3\u3002",
          tone: "info"
        },
        "nochart"
      )
    );
  }
  if (isWeb) {
    kids.push(
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
        K.NoteLine,
        {
          text: "\u5F53\u524D\u8D70\u7F51\u9875\u8D26\u5355\u63A5\u53E3\uFF08\u542B\u8D8B\u52BF\uFF09\uFF0C\u4F9D\u8D56\u767B\u5F55\u4F1A\u8BDD\u7968\u636E\uFF1B\u7968\u636E\u8FC7\u671F\u540E\u8FD9\u91CC\u4F1A\u63D0\u793A\u91CD\u65B0\u6293\u53D6\u3002\u5B98\u65B9 sk- \u5BC6\u94A5\u957F\u671F\u6709\u6548\u4F46\u65E0\u8D8B\u52BF\u3002",
          tone: "info"
        },
        "note"
      )
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: styles_module_css_default.ui, children: kids });
}
function deepseekButton(ctx, K) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "DeepSeek";
  const spec = ringSpecOf2(ctx, K);
  const ring = /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.Ring, { spec, size: ringSizeOf(ctx.variant) });
  const showBalance = ctx.prefs.get(BALANCE_PREF2, "0") === "1";
  const money = balanceText(snap, K);
  const value = showBalance ? money ?? "\u2014" : spec.text ?? "";
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
    K.ButtonLayout,
    {
      variant: ctx.variant,
      leading: ring,
      glyph: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(K.Ring, { spec, size: 16 }),
      name,
      value,
      tone: showBalance ? void 0 : spec.tone,
      icon: ctx.icon
    }
  );
}
function ringSpecOf2(ctx, K) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "DeepSeek";
  if (!snap.ok) return failureRingSpec(snap, name);
  const b = snap.billing || {};
  const granted = b["granted"] !== void 0 && b["granted"] !== null ? K.num(b["granted"], 0) : 0;
  const topped = b["toppedUp"] !== void 0 && b["toppedUp"] !== null ? K.num(b["toppedUp"], 0) : 0;
  const total = granted + topped;
  const amt = K.num(b["balance"], 0);
  if (total > 0) {
    const pct = clampPct(Math.max(0, total - amt) / total * 100) ?? 0;
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + "%",
      title: name + "\uFF1A\u603B\u989D\u5EA6\u5DF2\u7528 " + Math.round(pct) + "%\uFF08" + K.fmt(Math.max(0, total - amt)) + " / " + K.fmt(total) + "\uFF09"
    };
  }
  const money = balanceText(snap, K);
  const low = b["isAvailable"] === false || amt <= 0;
  return {
    pct: null,
    tone: low ? "bad" : "idle",
    ...money !== null ? { text: money } : {},
    title: name + "\uFF1A\u4F59\u989D " + (money ?? "\u672A\u77E5") + "\uFF08\u7F51\u9875\u8D26\u5355\u63A5\u53E3\u4E0D\u63D0\u4F9B\u603B\u989D\u5EA6\uFF0C\u73AF\u7559\u7A7A\uFF09"
  };
}
var BALANCE_PREF2 = "balance";
var deepseek = {
  button: deepseekButton,
  buttonHint: (ctx, K) => {
    const base = ringSpecOf2(ctx, K).title;
    if (ctx.prefs.get(BALANCE_PREF2, "0") === "1") {
      return base + "\uFF1B\u6570\u503C\u4F4D\u663E\u793A\u4F59\u989D " + (balanceText(ctx.snap, K) ?? "\u672A\u77E5");
    }
    return base;
  },
  detail: deepseekDetail
};

// src/client/providers/ui/opencode.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
function opencodeDetail(ctx, K) {
  const snap = ctx.snap;
  const b = snap.billing || {};
  const plan = b["plan"] ? String(b["plan"]) : "";
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const balance = b["balance"] !== void 0 && b["balance"] !== null ? K.num(b["balance"], 0) : null;
  const kids = [];
  const chips = [];
  if (plan) chips.push({ text: "\u8BA2\u9605 " + plan, tone: "info" });
  if (!wins.length && balance !== null) chips.push({ text: "\u6309\u91CF\u8BA1\u8D39", tone: "info" });
  if (chips.length) kids.push(/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.Chips, { chips }, "chips"));
  if (wins.length) {
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.WindowGroup, { windows: wins, snap, now: ctx.now, title: "\u8BA2\u9605\u7A97\u53E3" }, "win"));
  }
  if (balance !== null && balance !== void 0) {
    const onlyBalance = !wins.length;
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.BalanceBlock, { billing: b, title: onlyBalance ? "\u8D26\u6237\u4F59\u989D" : "\u5145\u503C\u4F59\u989D" }, "bal"));
  }
  const showBalance = ctx.prefs.get(BALANCE_PREF3, "0") === "1";
  kids.push(
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { className: styles_module_css_default.prefBlock, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.SectionTitle, { text: "\u4FA7\u680F\u6309\u94AE\u663E\u793A" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
        K.PrefSwitch,
        {
          label: "\u6570\u503C\u4F4D\u663E\u793A\u4F59\u989D",
          hint: "\u52FE\u4E0A\u540E\u6309\u94AE\u53F3\u4FA7\u663E\u793A\u5145\u503C\u4F59\u989D\uFF1B\u8FDB\u5EA6\u6761\u7167\u65E7\u753B\u5F53\u524D\u7A97\u53E3\u7684\u5360\u7528\u6BD4\u4F8B",
          checked: showBalance,
          onChange: (next) => ctx.prefs.set(BALANCE_PREF3, next ? "1" : "0")
        },
        "bal"
      ),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
        K.PrefChoice,
        {
          label: "\u73AF\u753B\u54EA\u4E2A\u7A97\u53E3",
          value: selectedWindow2(ctx),
          options: WINDOW_OPTIONS2,
          onChange: (next) => ctx.prefs.set(WINDOW_PREF2, next)
        },
        "win"
      )
    ] }, "prefs")
  );
  const notes = (snap.extra && Array.isArray(snap.extra.blocks) ? snap.extra.blocks : []).filter(
    (x) => x && x.kind === "note" && x.text
  );
  if (notes.length) {
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.NoteLine, { text: notes[0].text, tone: "info" }, "note"));
  } else if (wins.length) {
    const monthly = wins.filter((w) => w.key === "monthly")[0];
    if (monthly && monthly.resetInSec > 0) {
      kids.push(
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          K.NoteLine,
          {
            text: "\u8BA2\u9605\u7EA6 " + K.fmtLeft(monthly.resetInSec) + "\u540E\u91CD\u7F6E/\u5230\u671F\uFF08\u4EE5\u6BCF\u6708\u7A97\u53E3\u4E3A\u51C6\uFF09\u3002",
            tone: "info"
          },
          "note"
        )
      );
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: styles_module_css_default.ui, children: kids });
}
function opencodeButton(ctx, K) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "opencode";
  const size = ringSizeOf(ctx.variant);
  if (!snap.ok) {
    const fail = failureRingSpec(snap, name);
    return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      K.ButtonLayout,
      {
        variant: ctx.variant,
        leading: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.Ring, { spec: fail, size }),
        glyph: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.Ring, { spec: fail, size: 16 }),
        name,
        value: "\u8BFB\u53D6\u5931\u8D25",
        tone: "bad"
      }
    );
  }
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const picked = windowOfMetric(snap, selectedWindow2(ctx)) ?? wins[0] ?? null;
  const spec = ringSpecOf3(ctx, K, picked);
  const ring = /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.Ring, { spec, size });
  const showBalance = ctx.prefs.get(BALANCE_PREF3, "0") === "1";
  const money = balanceText(snap, K);
  const value = showBalance ? money ?? "\u2014" : spec.text ?? "";
  const tone = showBalance ? void 0 : spec.tone;
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
    K.ButtonLayout,
    {
      variant: ctx.variant,
      leading: ring,
      glyph: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(K.Ring, { spec, size: 16 }),
      name,
      value,
      tone,
      icon: ctx.icon
    }
  );
}
function ringSpecOf3(ctx, K, picked) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "opencode";
  const pct = picked ? windowPct(picked) : worstWindowPct(snap);
  if (pct !== null) {
    const label = picked ? String(picked.label || picked.key) : "\u6700\u7D27\u7A97\u53E3";
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + "%",
      title: name + "\uFF1A" + label + "\u5DF2\u7528 " + Math.round(pct) + "%"
    };
  }
  const money = balanceText(snap, K);
  return {
    pct: null,
    tone: "idle",
    ...money !== null ? { text: money } : {},
    title: name + "\uFF1A\u6309\u91CF\u8BA1\u8D39\uFF0C\u4F59\u989D " + (money ?? "\u672A\u77E5")
  };
}
var WINDOW_PREF2 = "window";
var BALANCE_PREF3 = "balance";
var WINDOW_OPTIONS2 = [
  { value: "5h", label: "5h", hint: "\u73AF\u753B 5 \u5C0F\u65F6\u6EDA\u52A8\u7A97\u53E3\u7684\u5360\u7528" },
  { value: "weekly", label: "1w", hint: "\u73AF\u753B\u6BCF\u5468\u7A97\u53E3\u7684\u5360\u7528" },
  { value: "monthly", label: "1m", hint: "\u73AF\u753B\u6BCF\u6708\u7A97\u53E3\u7684\u5360\u7528\uFF08\u9ED8\u8BA4\uFF09" }
];
function selectedWindow2(ctx) {
  const v = ctx.prefs.get(WINDOW_PREF2, "monthly");
  return v === "5h" || v === "weekly" || v === "monthly" ? v : "monthly";
}
var opencode = {
  button: opencodeButton,
  buttonHint: (ctx, K) => {
    const name = ctx.vendorName || ctx.snap.vendorName || "opencode";
    if (!ctx.snap.ok) return failureRingSpec(ctx.snap, name).title;
    const wins = Array.isArray(ctx.snap.windows) ? ctx.snap.windows : [];
    const picked = windowOfMetric(ctx.snap, selectedWindow2(ctx)) ?? wins[0] ?? null;
    const base = ringSpecOf3(ctx, K, picked).title;
    if (ctx.prefs.get(BALANCE_PREF3, "0") === "1") {
      return base + "\uFF1B\u6570\u503C\u4F4D\u663E\u793A\u5145\u503C\u4F59\u989D " + (balanceText(ctx.snap, K) ?? "\u672A\u77E5");
    }
    return base;
  },
  detail: opencodeDetail
};

// src/client/providers/ui/manual.tsx
var import_jsx_runtime17 = require("react/jsx-runtime");
function manualDetail(ctx, K) {
  const snap = ctx.snap;
  const b = snap.billing || {};
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  const kids = [];
  kids.push(/* @__PURE__ */ (0, import_jsx_runtime17.jsx)(K.Chips, { chips: [{ text: "\u672C\u5730\u624B\u586B", tone: "info" }] }, "chips"));
  if (wins.length) {
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime17.jsx)(K.WindowGroup, { windows: wins, snap, now: ctx.now, title: "\u989D\u5EA6" }, "win"));
  }
  if (Object.keys(b).length) {
    const isPayg = !wins.length;
    kids.push(/* @__PURE__ */ (0, import_jsx_runtime17.jsx)(K.BalanceBlock, { billing: b, title: isPayg ? "\u5F53\u524D\u4F59\u989D" : void 0 }, "bal"));
  }
  const items = [];
  const total = wins.length ? K.num(wins[0]?.limit, 0) : 0;
  const used = wins.length ? K.num(wins[0]?.used, 0) : 0;
  if (wins.length) {
    items.push({ label: "\u603B\u989D\u5EA6", value: K.fmt(total) });
    items.push({ label: "\u5DF2\u7528", value: K.fmt(used) });
    items.push({ label: "\u5269\u4F59", value: K.fmt(Math.max(0, total - used)) });
  }
  if (items.length) kids.push(/* @__PURE__ */ (0, import_jsx_runtime17.jsx)(K.MetricRows, { items, title: "\u8D26\u672C\u660E\u7EC6" }, "metrics"));
  kids.push(
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      K.NoteLine,
      {
        text: "\u6570\u636E\u6765\u81EA\u672C\u5730\u624B\u586B\uFF08\u975E\u5E73\u53F0\u5B9E\u65F6\u63A5\u53E3\uFF09\uFF1A\u5728\u300C\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u989D\u5EA6\u914D\u7F6E\u300D\u91CC\u66F4\u65B0\uFF0C\u6539\u5B8C\u70B9\u300C\u62C9\u53D6\u300D\u5373\u53EF\u3002",
        tone: "info"
      },
      "note"
    )
  );
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: styles_module_css_default.ui, children: kids });
}
function manualButton(ctx, K) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "\u672C\u5730\u8D26\u672C";
  const spec = ringSpecOf4(ctx, K);
  const ring = /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(K.Ring, { spec, size: ringSizeOf(ctx.variant) });
  const showBalance = ctx.prefs.get(BALANCE_PREF4, "0") === "1";
  const money = balanceText(snap, K);
  const value = showBalance ? money ?? "\u2014" : spec.text ?? "";
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
    K.ButtonLayout,
    {
      variant: ctx.variant,
      leading: ring,
      glyph: /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(K.Ring, { spec, size: 16 }),
      name,
      value,
      tone: showBalance ? void 0 : spec.tone,
      icon: ctx.icon
    }
  );
}
function ringSpecOf4(ctx, K) {
  const snap = ctx.snap;
  const name = ctx.vendorName || snap.vendorName || "\u672C\u5730\u8D26\u672C";
  const wins = Array.isArray(snap.windows) ? snap.windows : [];
  if (wins.length > 0) {
    const total = K.num(wins[0]?.limit, 0);
    const used = K.num(wins[0]?.used, 0);
    const pct = total > 0 ? clampPct(used / total * 100) ?? 0 : 0;
    return {
      pct,
      tone: toneOfPct(pct),
      text: Math.round(pct) + "%",
      title: name + "\uFF08\u672C\u5730\u624B\u586B\uFF09\uFF1A\u5DF2\u7528 " + K.fmt(used) + " / " + K.fmt(total)
    };
  }
  const money = balanceText(snap, K);
  return {
    pct: null,
    tone: "idle",
    ...money !== null ? { text: money } : {},
    title: name + "\uFF08\u672C\u5730\u624B\u586B\uFF09\uFF1A\u4F59\u989D " + (money ?? "\u672A\u586B")
  };
}
var BALANCE_PREF4 = "balance";
var manual = {
  button: manualButton,
  buttonHint: (ctx, K) => {
    const base = ringSpecOf4(ctx, K).title;
    if (ctx.prefs.get(BALANCE_PREF4, "0") === "1") {
      return base + "\uFF1B\u6570\u503C\u4F4D\u663E\u793A\u4F59\u989D " + (balanceText(ctx.snap, K) ?? "\u672A\u586B");
    }
    return base;
  },
  detail: manualDetail
};

// src/client/providers/ui/index.ts
var TEMPLATES = /* @__PURE__ */ new Map();
function registerProviderTemplates(type, templates) {
  if (typeof type === "string" && type && templates && typeof templates === "object")
    TEMPLATES.set(type, templates);
}
function getProviderTemplates(type) {
  return TEMPLATES.get(type);
}
function hasProviderTemplates(type) {
  return TEMPLATES.has(type);
}
function providerTemplateTypes() {
  return [...TEMPLATES.keys()];
}
registerProviderTemplates("commandcode", commandcode);
registerProviderTemplates("deepseek", deepseek);
registerProviderTemplates("opencode", opencode);
registerProviderTemplates("manual", manual);

// src/client/providers/registry.tsx
var import_jsx_runtime18 = require("react/jsx-runtime");
function legacySections(snap) {
  const out = [];
  if (snap.billingKind === "payg")
    out.push({ kind: "balance", key: "balance", title: "\u8D26\u6237\u4F59\u989D", billing: snap.billing || {} });
  else if (Array.isArray(snap.windows) && snap.windows.length)
    out.push({ kind: "windows", key: "windows", windows: snap.windows });
  const extra = snap.extra;
  if (extra) {
    const stats = Array.isArray(extra.stats) ? extra.stats.slice(0, 6) : [];
    if (stats.length) out.push({ kind: "metrics", key: "stats", items: stats });
    const blocks = Array.isArray(extra.blocks) ? extra.blocks.slice(0, 8) : [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (!b || typeof b !== "object") continue;
      if (b.kind === "kv" && b.label)
        out.push({
          kind: "metrics",
          key: "kv" + i,
          items: [{ label: String(b.label), value: String(b.value ?? "") }]
        });
      else if (b.kind === "progress" && isFinite(Number(b.used)) && Number(b.total) > 0) {
        const p = { used: Number(b.used), total: Number(b.total) };
        if (b.label) p.label = String(b.label);
        if (b.left !== void 0 && b.left !== null && b.left !== "") p.left = String(b.left);
        out.push({ kind: "progress", key: "pg" + i, progress: p });
      } else if (b.kind === "split" && Array.isArray(b.segments))
        out.push({ kind: "split", key: "sp" + i, split: { segments: b.segments } });
      else if (b.kind === "note" && b.text) {
        const n = { text: String(b.text) };
        if (b.tone) n.tone = b.tone;
        out.push({ kind: "note", key: "nt" + i, note: n });
      }
    }
    if (extra.chart && Array.isArray(extra.chart.values) && extra.chart.values.length > 1)
      out.push({ kind: "chart", key: "chart", chart: extra.chart });
  }
  return out;
}
function createProviderRenderers(K) {
  function generic(ctx) {
    const sections = ctx.snap.view && Array.isArray(ctx.snap.view.sections) ? ctx.snap.view.sections : null;
    const rendered = sections ? renderSections(K, sections, ctx) : null;
    if (rendered) return rendered;
    return renderSections(K, legacySections(ctx.snap), ctx);
  }
  function renderBody(input) {
    const ctx = {
      snap: input.snap,
      now: input.now,
      type: input.type,
      vendorName: input.snap.vendorName || "",
      prefs: providerPrefs.scope(input.vendorId)
    };
    const detail = getProviderTemplates(input.type)?.detail;
    if (detail) {
      try {
        const out = detail(ctx, K);
        if (out !== null && out !== void 0) return out;
      } catch {
      }
    }
    return generic(ctx);
  }
  function renderButton(input) {
    const templates = getProviderTemplates(input.type);
    const ctx = {
      snap: input.snap,
      now: input.now,
      type: input.type,
      vendorName: input.snap.vendorName || "",
      variant: input.variant,
      icon: input.icon !== void 0 && input.icon !== "" ? input.icon : "generic",
      prefs: providerPrefs.scope(input.vendorId)
    };
    const button = templates?.button;
    if (button) {
      try {
        const out = button(ctx, K);
        if (out !== null && out !== void 0 && out !== false) return out;
      } catch {
      }
    }
    const spec = defaultRingSpec(ctx, K);
    return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      K.ButtonLayout,
      {
        variant: ctx.variant,
        leading: /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(K.Ring, { spec, size: ctx.variant === "wide" ? 16 : 18 }),
        name: ctx.vendorName,
        value: spec.text,
        tone: spec.tone,
        icon: ctx.icon
      }
    );
  }
  function buttonTitle(input) {
    const templates = getProviderTemplates(input.type);
    const ctx = {
      snap: input.snap,
      now: input.now,
      type: input.type,
      vendorName: input.snap.vendorName || "",
      variant: input.variant,
      icon: input.icon !== void 0 && input.icon !== "" ? input.icon : "generic",
      prefs: providerPrefs.scope(input.vendorId)
    };
    if (templates?.buttonHint) {
      try {
        const out = templates.buttonHint(ctx, K);
        if (typeof out === "string" && out !== "") return out;
      } catch {
      }
    }
    return defaultRingSpec(ctx, K).title;
  }
  return {
    renderBody,
    renderButton,
    buttonTitle,
    hasBespoke: (type) => hasProviderTemplates(type),
    bespokeTypes: () => providerTemplateTypes()
  };
}

// src/client/QuotaTrayPanel.tsx
var import_react8 = require("react");
var ReactDOM3 = __toESM(require("react-dom"), 1);
var import_dsh_client_ui_primitives4 = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime19 = require("react/jsx-runtime");
function QuotaTrayPanel(props) {
  const style = (0, import_dsh_client_ui_primitives4.useAnchoredPosition)({
    open: props.open,
    anchorRef: props.anchorRef,
    panelRef: props.panelRef,
    side: "top",
    gap: 8,
    margin: 12
  });
  (0, import_dsh_client_ui_primitives4.useDismissOnOutsidePointer)(props.rootRef, props.open, props.setOpen, props.panelRef);
  const escRef = (0, import_react8.useRef)(props.setOpen);
  escRef.current = props.setOpen;
  (0, import_react8.useEffect)(() => {
    if (!props.open || typeof window === "undefined") return;
    const onKey = (event) => {
      if (event.key === "Escape") escRef.current(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open]);
  if (!props.open) return null;
  const node = /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
    "section",
    {
      className: styles_module_css_default.trayPanel,
      ref: (element) => {
        props.panelRef.current = element;
      },
      style: style ?? { visibility: "hidden" },
      role: "dialog",
      "aria-label": "\u989D\u5EA6",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("header", { className: styles_module_css_default.trayPanelHead, children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayPanelGlyph, "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(QuotaIcon, { size: 14 }) }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayPanelTitle, children: "\u989D\u5EA6" }),
          props.loading ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.traySpin, "aria-hidden": "true" }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.traySpacer }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(
            "button",
            {
              type: "button",
              className: styles_module_css_default.trayIconBtn,
              title: "\u91CD\u65B0\u62C9\u53D6\u300C" + props.activeName + "\u300D\u7684\u989D\u5EA6",
              "aria-label": "\u5237\u65B0\u989D\u5EA6",
              disabled: props.loading,
              onClick: props.onRefresh,
              children: /* @__PURE__ */ (0, import_jsx_runtime19.jsx)(RefreshGlyph, {})
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: styles_module_css_default.trayBody, children: [
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: styles_module_css_default.trayCard, children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: styles_module_css_default.trayCardHead, children: [
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayCardGlyph, children: props.activeGlyph }),
              /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayCardName, title: props.activeName, children: props.activeName })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: styles_module_css_default.trayCardBody, children: props.detail })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("div", { className: styles_module_css_default.trayList, children: [
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: styles_module_css_default.trayListHead, children: "\u5207\u6362\u4F9B\u5E94\u5546" }),
            props.vendors.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("div", { className: styles_module_css_default.trayEmpty, children: "\u8FD8\u6CA1\u6709\u914D\u7F6E\u4EFB\u4F55\u4F9B\u5E94\u5546\u3002" }) : props.vendors.map((row) => /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
              "button",
              {
                type: "button",
                className: styles_module_css_default.trayRow,
                "data-active": row.active ? "1" : void 0,
                "data-off": row.disabled ? "1" : void 0,
                title: row.buttonHint,
                onClick: () => props.onSwitch(row.id),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayRowGlyph, children: row.button }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayRowName, children: row.name }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayRowType, children: row.typeLabel }),
                  /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayRowStatus, "data-tone": row.statusTone, children: row.status }),
                  row.active ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayRowCheck, children: "\u5F53\u524D" }) : null
                ]
              },
              row.id
            ))
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("footer", { className: styles_module_css_default.trayFoot, children: [
          props.error ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayFootError, role: "alert", title: props.error, children: props.error }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)("span", { className: styles_module_css_default.trayFootRow, children: [
            props.freshness ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: props.freshness }) : null,
            props.freshness ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { className: styles_module_css_default.trayFootDot, children: "\xB7" }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("span", { children: props.manageHint })
          ] })
        ] })
      ]
    }
  );
  try {
    return ReactDOM3.createPortal(node, document.body);
  } catch {
    return node;
  }
}
function RefreshGlyph() {
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsxs)(
    "svg",
    {
      width: "13",
      height: "13",
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.4",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("path", { d: "M13.2 8a5.2 5.2 0 1 1-1.6-3.75" }),
        /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("path", { d: "M13.4 1.9v3h-3" })
      ]
    }
  );
}

// src/client/QuotaSection.tsx
var import_jsx_runtime20 = require("react/jsx-runtime");
var BASE2 = "/ext/dshp-token-meter";
var ID_RE2 = /^[a-z0-9][a-z0-9-]{1,30}$/;
function num(v, d) {
  const n = Number(v);
  return isFinite(n) ? n : d;
}
function fmt2(n) {
  try {
    return Number(n).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  } catch {
    return String(n);
  }
}
function fmtLeft(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec >= 86400) return Math.floor(sec / 86400) + "\u5929\u540E";
  if (sec >= 3600) return Math.floor(sec / 3600) + "\u5C0F\u65F6\u540E";
  if (sec >= 60) return Math.floor(sec / 60) + "\u5206\u540E";
  return sec + "\u79D2\u540E";
}
function timeAgo(iso) {
  const t = Date.parse(iso);
  if (isNaN(t)) return "\u672A\u77E5";
  const s = Math.floor((Date.now() - t) / 1e3);
  if (s < 60) return s + " \u79D2\u524D";
  const m = Math.floor(s / 60);
  if (m < 60) return m + " \u5206\u949F\u524D";
  const hh = Math.floor(m / 60);
  if (hh < 24) return hh + " \u5C0F\u65F6\u524D";
  return Math.floor(hh / 24) + " \u5929\u524D";
}
var QUOTA_LEVEL = { warn: 70, bad: 90, over: 100 };
function levelOf(pct) {
  if (pct >= QUOTA_LEVEL.over) return "over";
  if (pct >= QUOTA_LEVEL.bad) return "bad";
  if (pct >= QUOTA_LEVEL.warn) return "warn";
  return "ok";
}
function levelTip(lvl) {
  if (lvl === "over") return "\u989D\u5EA6\u5DF2\u7528\u5C3D\uFF08\u6216\u8D85\u51FA\uFF09\uFF0C\u53EF\u80FD\u88AB\u9650\u6D41/\u62D2\u7EDD";
  if (lvl === "bad") return "\u989D\u5EA6\u5FEB\u7528\u5B8C\u4E86\uFF0C\u6CE8\u610F\u540E\u7EED\u8C03\u7528";
  if (lvl === "warn") return "\u989D\u5EA6\u5360\u7528\u504F\u9AD8";
  return "\u989D\u5EA6\u5145\u8DB3";
}
var TYPE_LABEL_FALLBACK = {
  opencode: "OC",
  deepseek: "DS",
  commandcode: "CC",
  manual: "\u624B\u52A8"
};
var TYPE_TITLE_FALLBACK = [
  { type: "opencode", title: "opencode\uFF08Go+Zen \u5408\u5E76\uFF09" },
  { type: "deepseek", title: "deepseek\uFF08\u5B98\u65B9\xB7\u81EA\u52A8\u9009\u8DEF\uFF09" },
  { type: "commandcode", title: "commandcode\uFF08Command Code\uFF09" },
  { type: "manual", title: "manual\uFF08\u624B\u52A8\uFF09" }
];
function cx5(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var BADGE_CLASS2 = {
  ok: styles_module_css_default.badgeOk,
  warn: styles_module_css_default.badgeWarn,
  muted: styles_module_css_default.badgeMuted,
  info: styles_module_css_default.badgeInfo,
  bad: styles_module_css_default.badgeBad
};
function createQuotaSection() {
  const store2 = {
    state: {
      cfg: null,
      snaps: {},
      loading: false,
      error: "",
      errOpen: false,
      lastErr: null,
      namespace: "",
      docPath: "",
      providers: null
    },
    listeners: /* @__PURE__ */ new Set(),
    get() {
      return this.state;
    },
    subscribe(fn) {
      this.listeners.add(fn);
      return () => {
        this.listeners.delete(fn);
      };
    },
    set(patch) {
      this.state = Object.assign({}, this.state, patch);
      this.listeners.forEach((fn) => {
        try {
          fn();
        } catch {
        }
      });
    }
  };
  let loaded = false;
  async function call(method, args) {
    const MAP = {
      "quota.load": ["GET", "/state"],
      "quota.refresh": ["POST", "/refresh"],
      "quota.set-active": ["POST", "/set-active"],
      "quota.set-refresh": ["POST", "/set-refresh"],
      "quota.set-enabled": ["POST", "/set-enabled"],
      "quota.set-vendor-enabled": ["POST", "/set-vendor-enabled"],
      "quota.add-vendor": ["POST", "/add-vendor"],
      "quota.update-vendor": ["POST", "/update-vendor"],
      "quota.delete-vendor": ["POST", "/delete-vendor"],
      "quota.secret-to-cred": ["POST", "/secret-to-cred"],
      "config.save": ["POST", "/config"]
    };
    const ent = MAP[method];
    if (!ent) throw new Error("unknown quota method: " + method);
    const m = ent[0], path = BASE2 + ent[1];
    if (m === "GET") {
      const r2 = await fetch(path, { cache: "no-store" });
      return r2.json();
    }
    const r = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(args || {}),
      cache: "no-store"
    });
    return r.json();
  }
  let syncRefs = 0;
  let syncTimer = null;
  let syncMsCur = 0;
  function startSyncLoop(ms) {
    syncRefs++;
    if (syncTimer === null || syncMsCur !== ms) {
      if (syncTimer !== null) window.clearInterval(syncTimer);
      syncMsCur = ms;
      syncTimer = window.setInterval(() => {
        if (document.visibilityState === "visible") void syncState();
      }, ms);
    }
  }
  function stopSyncLoop() {
    syncRefs--;
    if (syncRefs <= 0 && syncTimer !== null) {
      window.clearInterval(syncTimer);
      syncTimer = null;
      syncMsCur = 0;
    }
  }
  async function ensureLoad() {
    if (loaded) return;
    loaded = true;
    store2.set({ loading: true });
    try {
      const r = await call("quota.load");
      if (r && r.ok) {
        store2.set({
          loading: false,
          cfg: r.config,
          snaps: r.snaps || {},
          namespace: r.namespace || "",
          docPath: r.docPath || "",
          providers: r.providers || null,
          error: r.error || ""
        });
      } else store2.set({ loading: false, error: r && r.error || "\u52A0\u8F7D\u5931\u8D25" });
    } catch {
      store2.set({ loading: false, error: "\u8FDE\u63A5 Host \u5931\u8D25" });
    }
  }
  async function reload() {
    loaded = false;
    store2.set({ errOpen: false, lastErr: null });
    await ensureLoad();
  }
  async function syncState() {
    if (store2.get().loading) return;
    try {
      const r = await call("quota.load");
      if (!(r && r.ok)) return;
      const cur = store2.get();
      store2.set({
        cfg: r.config || cur.cfg,
        snaps: r.snaps || cur.snaps,
        namespace: r.namespace || cur.namespace,
        docPath: r.docPath || cur.docPath,
        providers: r.providers || cur.providers
      });
    } catch {
    }
  }
  async function refreshVendor(id) {
    store2.set({ loading: true });
    try {
      const r = await call("quota.refresh", id ? { id } : {});
      if (r && r.ok) {
        const snaps = Object.assign({}, store2.get().snaps);
        let failMsg = "";
        Object.keys(r.snaps || {}).forEach((k) => {
          const s2 = r.snaps[k];
          if (!s2) return;
          if (s2.ok) snaps[k] = s2;
          else if (!id || k === id) failMsg = s2.error || "\u5237\u65B0\u5931\u8D25";
        });
        const patch = { loading: false, snaps };
        if (failMsg) patch.lastErr = { id: id || "", msg: failMsg, at: (/* @__PURE__ */ new Date()).toISOString() };
        else {
          patch.lastErr = null;
          patch.error = "";
        }
        store2.set(patch);
      } else store2.set({ loading: false, error: r && r.error || "\u5237\u65B0\u5931\u8D25" });
    } catch {
      store2.set({ loading: false, error: "\u8FDE\u63A5 Host \u5931\u8D25" });
    }
  }
  async function setActive(id) {
    try {
      const r = await call("quota.set-active", { id });
      if (r && r.ok) {
        const cfg = Object.assign({}, store2.get().cfg, { activeVendor: id });
        store2.set({ cfg, errOpen: false, lastErr: null, error: "" });
        if (id) void refreshVendor(id);
      } else {
        store2.set({ error: r && r.error || "\u5207\u6362\u4F9B\u5E94\u5546\u5931\u8D25" });
      }
    } catch {
      store2.set({ error: "\u8FDE\u63A5 Host \u5931\u8D25\uFF0C\u4F9B\u5E94\u5546\u672A\u5207\u6362" });
    }
  }
  async function savePrefs(patch) {
    try {
      const r = await call("config.save", patch);
      if (r && r.ok) {
        const cfg = Object.assign({}, store2.get().cfg, r.config || patch);
        store2.set({ cfg, error: "" });
        return { ok: true };
      }
      return { ok: false, error: r && r.error || "\u4FDD\u5B58\u5931\u8D25" };
    } catch {
      return { ok: false, error: "\u8FDE\u63A5 Host \u5931\u8D25" };
    }
  }
  async function setVendorEnabled(id, enabled) {
    try {
      const r = await call("quota.set-vendor-enabled", { id, enabled });
      if (!(r && r.ok)) {
        store2.set({ error: r && r.error || "\u4FDD\u5B58\u5931\u8D25" });
        return;
      }
      const cur = store2.get();
      const cfg = cur.cfg ? Object.assign({}, cur.cfg, {
        vendors: (cur.cfg.vendors || []).map((v) => {
          if (v.id !== id) return v;
          const nv = { ...v };
          if (enabled) delete nv.enabled;
          else nv.enabled = false;
          return nv;
        })
      }) : cur.cfg;
      store2.set({ cfg, error: "" });
    } catch {
      store2.set({ error: "\u8FDE\u63A5 Host \u5931\u8D25" });
    }
  }
  async function setRefresh(sec) {
    try {
      const r = await call("quota.set-refresh", { sec });
      if (r && r.ok) await reload();
      else store2.set({ error: r && r.error || "\u4FDD\u5B58\u5931\u8D25" });
    } catch {
      store2.set({ error: "\u8FDE\u63A5 Host \u5931\u8D25" });
    }
  }
  function useStore() {
    const force = (0, import_react9.useState)(0)[1];
    (0, import_react9.useEffect)(() => store2.subscribe(() => force((x) => x + 1)), []);
    return store2.get();
  }
  function remainOf(w, snap, nowMs) {
    const f = snap.fetchedAtMs || nowMs;
    return Math.max(0, w.resetInSec - (nowMs - f) / 1e3);
  }
  function activeOf(s) {
    if (!s.cfg) return null;
    const vs = s.cfg.vendors || [];
    const av = s.cfg.activeVendor;
    if (av === "") return null;
    if (av === void 0 || av === null) return vs[0] || null;
    return vs.filter((v) => v.id === av)[0] || vs[0] || null;
  }
  function curSymbol(cur) {
    if (cur === "CNY") return "\xA5";
    if (cur === "USD") return "$";
    return cur ? cur + " " : "";
  }
  function providerMetas() {
    try {
      const ps = store2.get().providers;
      if (Array.isArray(ps) && ps.length) return ps;
    } catch {
    }
    return null;
  }
  function typeLabel(type) {
    const ps = providerMetas();
    if (ps) {
      const hit = ps.filter((x) => x && x.type === type)[0];
      if (hit && hit.label) return hit.label;
    }
    return TYPE_LABEL_FALLBACK[type] || type;
  }
  function typeOptions() {
    const ps = providerMetas();
    if (ps) return ps.map((x) => ({ type: x.type, title: x.title || x.type }));
    return TYPE_TITLE_FALLBACK.slice();
  }
  function providerMetaOf(type) {
    const ps = providerMetas();
    if (ps) return ps.filter((x) => x && x.type === type)[0] || null;
    return null;
  }
  const kit = createProviderKit({
    num,
    fmt: fmt2,
    fmtLeft,
    curSymbol,
    remainOf,
    timeAgo,
    levelOf,
    levelTip,
    errOpen: () => !!store2.get().errOpen,
    toggleErr: () => store2.set({ errOpen: !store2.get().errOpen })
  });
  const providerViews = createProviderRenderers(kit);
  const ErrBox = kit.ErrorCard;
  function errInfoOf(snap, fallbackMsg) {
    const info = snap && snap.errorInfo;
    if (info && typeof info === "object" && typeof info.title === "string") return info;
    return fallbackErrorInfo(snap && snap.error || fallbackMsg);
  }
  function Badge2(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: cx5(styles_module_css_default.badge, BADGE_CLASS2[props.kind || "muted"]), children: props.text });
  }
  function SecRow(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(
      "div",
      {
        className: styles_module_css_default.row,
        style: props.wrap ? { flexWrap: "wrap", flexDirection: "column", alignItems: "stretch" } : void 0,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: styles_module_css_default.rowText, children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.rowLabel, children: props.label }),
            props.desc ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.rowDesc, children: props.desc }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
            "span",
            {
              className: props.wrap ? styles_module_css_default.rowValue : void 0,
              style: props.wrap ? { flexBasis: "100%", justifyContent: "flex-start" } : void 0,
              children: props.children
            }
          )
        ]
      }
    );
  }
  function FormField(props) {
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: styles_module_css_default.field, children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: styles_module_css_default.fieldHead, children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: styles_module_css_default.fieldLabel, children: props.label }),
        props.required ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: styles_module_css_default.fieldReq, children: "\u5FC5\u586B" }) : null,
        props.hint ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: styles_module_css_default.fieldOpt, children: props.hint }) : null
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.fieldControl, children: props.children }),
      props.desc ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.fieldDesc, children: props.desc }) : null
    ] });
  }
  function PillSelect(props) {
    const [open, setOpen] = (0, import_react9.useState)(false);
    const selector = /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)(
      "button",
      {
        type: "button",
        className: styles_module_css_default.selector,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        disabled: props.disabled,
        onClick: () => setOpen((v) => !v),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: styles_module_css_default.selectorLabel, children: props.selectedLabel }),
          import_dsh_client_ui_primitives5.IconChevronDownOutlineRegular ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_dsh_client_ui_primitives5.IconChevronDownOutlineRegular, { className: styles_module_css_default.chevron }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: styles_module_css_default.chevron, children: "\u25BE" })
        ]
      }
    );
    if (!import_dsh_client_ui_primitives5.Menu) {
      if (!open) return selector;
      return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { children: [
        selector,
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.popmenu, style: { position: "absolute" }, children: props.options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
          "button",
          {
            className: cx5(styles_module_css_default.mitem, o.id === props.value ? styles_module_css_default.active : void 0),
            onClick: () => {
              setOpen(false);
              props.onSelect(o.id);
            },
            children: o.label
          },
          o.id
        )) })
      ] });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
      import_dsh_client_ui_primitives5.Menu,
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
  function secretBadge(kind) {
    if (kind === "ref") return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Badge2, { kind: "ok", text: "\u5BC6\u94A5:$\u5F15\u7528" });
    if (kind === "plain") return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Badge2, { kind: "warn", text: "\u5BC6\u94A5:\u660E\u6587" });
    if (kind === "env" || kind === "cred") return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Badge2, { kind: "info", text: "\u5BC6\u94A5:" + kind + "(\u65E7)" });
    if (kind === "empty") return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Badge2, { kind: "warn", text: "\u5BC6\u94A5:\u672A\u586B" });
    return null;
  }
  function VendorForm(props) {
    const Btn = import_dsh_client_ui_primitives5.Button || (({ children, ...rest }) => /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("button", { type: "button", className: styles_module_css_default.btn, ...rest, children }));
    const d = props.draft;
    const set = props.set;
    const busy = !!props.busy;
    const isEdit = !!props.isEdit;
    const put = (k) => (v) => set(Object.assign({}, d, { [k]: v }));
    const putP = (k) => (v) => set(Object.assign({}, d, { params: Object.assign({}, d.params, { [k]: v }) }));
    const p = d.params || {};
    const idOk = ID_RE2.test(d.id || "");
    const nameOk = !!(d.name && String(d.name).trim());
    const canSubmit = idOk && nameOk && !busy;
    const secretPh = isEdit ? "\u7559\u7A7A=\u4FDD\u7559\u539F\u503C\uFF0C\u6216\u586B $NAME \u5F15\u7528 / \u65B0\u660E\u6587" : "\u586B $NAME \u5F15\u7528\uFF08\u63A8\u8350\uFF09\u6216\u7C98\u8D34\u660E\u6587";
    const inputWrap = (opts, inner) => /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
      "div",
      {
        className: styles_module_css_default.inputWrap,
        style: opts && opts.maxWidth ? { maxWidth: opts.maxWidth } : void 0,
        children: inner
      }
    );
    const textInput = (opts) => inputWrap(
      opts,
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        "input",
        {
          className: cx5(styles_module_css_default.ninput, opts && opts.mono ? styles_module_css_default.mono : void 0),
          style: opts && opts.alignRight ? { textAlign: "right", fontVariantNumeric: "tabular-nums" } : void 0,
          value: opts.value,
          placeholder: opts.placeholder || "",
          autoComplete: "off",
          inputMode: opts.inputMode,
          disabled: busy,
          onChange: opts.onChange
        }
      )
    );
    const rows = [];
    rows.push(
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        FormField,
        {
          label: "\u663E\u793A\u540D\u79F0",
          required: true,
          desc: "\u53EA\u7ED9\u4F60\u81EA\u5DF1\u770B\u7684\u540D\u5B57\uFF1A\u663E\u793A\u5728\u4FA7\u8FB9\u680F\u989D\u5EA6\u5361\u3001\u4F9B\u5E94\u5546\u5217\u8868\u548C\u5207\u6362\u83DC\u5355\u91CC\uFF0C\u4E0D\u53C2\u4E0E\u4EFB\u4F55\u8BF7\u6C42\u3002\u540C\u540D\u4E5F\u6CA1\u5173\u7CFB\uFF0C\u968F\u4FBF\u586B\uFF08\u652F\u6301\u4E2D\u6587\uFF09\uFF0C\u4F8B\u5982\u300CDeepSeek \u4E3B\u53F7\u300D\u300C\u516C\u53F8\u8D26\u53F7\u300D\u3002",
          children: textInput({
            value: d.name || "",
            placeholder: "\u5982\uFF1ADeepSeek \u4E3B\u53F7",
            onChange: (e) => put("name")(e.target.value)
          })
        },
        "name"
      )
    );
    const typeSel = /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
      PillSelect,
      {
        disabled: busy,
        value: d.type,
        selectedLabel: (typeOptions().filter((o) => o.type === d.type)[0] || {}).title || d.type,
        options: typeOptions().map((o) => ({ id: o.type, label: o.title })),
        onSelect: (id) => {
          const meta = providerMetaOf(id);
          const defaults = meta && meta.defaultParams && typeof meta.defaultParams === "object" ? JSON.parse(JSON.stringify(meta.defaultParams)) : {};
          const keep = {};
          for (const k of ["lowWarn", "currency", "billing", "total", "used", "balance", "granted"]) {
            if (p[k] !== void 0 && p[k] !== "") keep[k] = p[k];
          }
          set(Object.assign({}, d, { type: id, params: Object.assign({}, defaults, keep) }));
        }
      }
    );
    rows.push(
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        FormField,
        {
          label: "ID\uFF08\u914D\u7F6E\u6807\u8BC6\uFF09",
          required: !isEdit,
          hint: isEdit ? "\u6DFB\u52A0\u540E\u4E0D\u53EF\u4FEE\u6539" : void 0,
          desc: isEdit ? "\u8FD9\u662F\u8BE5\u4F9B\u5E94\u5546\u5728\u914D\u7F6E\u91CC\u7684\u552F\u4E00\u6807\u8BC6\uFF08\u4E3B\u952E\uFF09\uFF0C\u7528\u6765\u5728 settings.yaml \u4E2D\u533A\u5206\u4E0D\u540C\u8D26\u53F7\uFF0C\u4E5F\u88AB\u300C\u8BBE\u4E3A\u5F53\u524D\u300D\u7B49\u64CD\u4F5C\u5F15\u7528\u3002\u5DF2\u6DFB\u52A0\u7684\u4F9B\u5E94\u5546\u4E0D\u80FD\u6539 ID\uFF0C\u9700\u8981\u522B\u7684 ID \u8BF7\u5220\u6389\u91CD\u65B0\u6DFB\u52A0\u3002" : "\u8BE5\u4F9B\u5E94\u5546\u5728\u914D\u7F6E\u91CC\u7684\u552F\u4E00\u6807\u8BC6\uFF08\u4E3B\u952E\uFF09\uFF1A\u7528\u4E8E\u5728 settings.yaml \u4E2D\u533A\u5206\u4E0D\u540C\u8D26\u53F7\uFF0C\u4E5F\u88AB\u300C\u8BBE\u4E3A\u5F53\u524D\u300D\u7B49\u64CD\u4F5C\u5F15\u7528\u3002\u586B\u7B80\u77ED\u82F1\u6587/\u6570\u5B57\u5373\u53EF\uFF0C\u4F8B\u5982 ds-main\u3001cc-work\u3001go-2\u3002\u89C4\u5219\uFF1A\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u6A2A\u7EBF\uFF0C2\u201331 \u4F4D\uFF0C\u5B57\u6BCD\u6216\u6570\u5B57\u5F00\u5934\uFF1B\u6DFB\u52A0\u540E\u4E0D\u53EF\u4FEE\u6539\u3002",
          children: isEdit ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: cx5(styles_module_css_default.inputWrap, styles_module_css_default.inputReadonly), title: "ID \u662F\u914D\u7F6E\u4E3B\u952E\uFF0C\u4E0D\u53EF\u4FEE\u6539", children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: cx5(styles_module_css_default.ninput, styles_module_css_default.mono), children: d.id }) }) : inputWrap(
            {},
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
              "input",
              {
                className: cx5(styles_module_css_default.ninput, styles_module_css_default.mono),
                value: d.id || "",
                placeholder: "\u5982\uFF1Ads-main",
                autoComplete: "off",
                disabled: busy,
                onChange: (e) => put("id")(e.target.value)
              }
            )
          )
        },
        "id"
      )
    );
    if (!isEdit && !idOk && (d.id || ""))
      rows.push(
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: cx5(styles_module_css_default.notice, styles_module_css_default.noticeWarn), children: "ID \u4E0D\u5408\u6CD5\uFF1A\u9700\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u6216\u6A2A\u7EBF\uFF0C2\u201331 \u4F4D\uFF0C\u4E14\u4EE5\u5B57\u6BCD\u6216\u6570\u5B57\u5F00\u5934\uFF08\u4E0D\u80FD\u6709\u7A7A\u683C\u3001\u4E0B\u5212\u7EBF\u3001\u4E2D\u6587\uFF09\u3002" }, "idhint")
      );
    rows.push(
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        FormField,
        {
          label: "\u7C7B\u578B",
          required: true,
          desc: "\u51B3\u5B9A\u53BB\u54EA\u4E2A\u5E73\u53F0\u3001\u7528\u54EA\u4E2A\u63A5\u53E3\u62C9\u53D6\u989D\u5EA6\u3002\u5207\u6362\u7C7B\u578B\u4F1A\u540C\u65F6\u91CD\u7F6E\u8BE5\u7C7B\u578B\u7684\u53C2\u6570\uFF08\u5DF2\u586B\u7684\u9884\u8B66\u7EBF\u3001\u5E01\u79CD\u7B49\u901A\u7528\u9879\u4F1A\u4FDD\u7559\uFF09\u3002",
          children: typeSel
        },
        "type"
      )
    );
    const dynMeta = providerMetaOf(d.type);
    if (dynMeta && Array.isArray(dynMeta.fields)) {
      const dynFields = dynMeta.fields.filter((f) => {
        if (!f || !f.showWhen) return true;
        let cur = p[f.showWhen.key];
        if (cur === void 0 || cur === null || cur === "")
          cur = f.showWhen.key === "billing" ? "rolling" : "";
        return String(cur) === String(f.showWhen.eq);
      });
      dynFields.forEach((f, idx) => {
        const val = p[f.key];
        const key = "dyn:" + f.key + ":" + idx;
        if (f.kind === "select") {
          const selVal = val === void 0 || val === null || val === "" ? f.key === "billing" ? "rolling" : "" : String(val);
          rows.push(
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
              FormField,
              {
                label: f.label || f.key,
                required: f.required === true,
                desc: f.hint || void 0,
                children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
                  PillSelect,
                  {
                    disabled: busy,
                    value: selVal,
                    selectedLabel: ((f.options || []).filter((o) => o.value === selVal)[0] || {}).label || selVal,
                    options: (f.options || []).map((o) => ({ id: o.value, label: o.label })),
                    onSelect: /* @__PURE__ */ ((k) => (id) => putP(k)(id))(f.key)
                  }
                )
              },
              key
            )
          );
        } else if (f.kind === "number") {
          rows.push(
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
              FormField,
              {
                label: f.label || f.key,
                required: f.required === true,
                desc: f.hint || void 0,
                children: textInput({
                  maxWidth: 220,
                  inputMode: "decimal",
                  placeholder: f.placeholder || "",
                  value: val === void 0 || val === null ? "" : String(val),
                  onChange: /* @__PURE__ */ ((k) => (e) => putP(k)(e.target.value))(f.key)
                })
              },
              key
            )
          );
        } else {
          const isSecret = f.kind === "secret";
          rows.push(
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
              FormField,
              {
                label: f.label || f.key,
                required: f.required === true,
                hint: isSecret ? "\u586B $NAME \u5F15\u7528\u6216\u660E\u6587\uFF1B\u660E\u6587\u4FDD\u5B58\u540E\u4E0D\u56DE\u663E" : void 0,
                desc: f.hint || void 0,
                children: textInput({
                  mono: !!f.mono,
                  placeholder: f.placeholder || (isSecret ? secretPh : ""),
                  value: val === void 0 || val === null ? "" : String(val),
                  onChange: /* @__PURE__ */ ((k) => (e) => putP(k)(e.target.value))(f.key)
                })
              },
              key
            )
          );
        }
      });
      if (dynMeta.hint)
        rows.push(
          /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("p", { className: styles_module_css_default.fieldNote, children: [
            /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("b", { children: "\u5173\u4E8E\u8BE5\u7C7B\u578B\uFF1A" }),
            dynMeta.hint
          ] }, "dyn:hint")
        );
    } else {
      rows.push(
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("p", { className: cx5(styles_module_css_default.notice, styles_module_css_default.noticeWarn), children: "Host \u672A\u4E0A\u62A5\u7C7B\u578B\u300C" + String(d.type) + "\u300D\u7684\u5B57\u6BB5\u5B9A\u4E49\uFF1A\u8BF7\u91CD\u542F dsh web \u8BA9\u63D2\u4EF6\u91CD\u65B0\u6CE8\u518C\uFF0C\u7136\u540E\u5237\u65B0\u672C\u9875\u3002" }, "nometa")
      );
    }
    rows.push(
      /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: styles_module_css_default.bar, children: [
        /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Btn, { variant: "primary", size: "sm", disabled: !canSubmit, onClick: props.onSubmit, children: busy ? "\u4FDD\u5B58\u4E2D\u2026" : props.submitLabel || "\u4FDD\u5B58" }),
        props.onCancel ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(Btn, { variant: "outline", size: "sm", disabled: busy, onClick: props.onCancel, children: "\u53D6\u6D88" }) : null,
        !idOk || !nameOk ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("span", { className: styles_module_css_default.hint, children: !nameOk ? "\u8BF7\u5148\u586B\u5199\u663E\u793A\u540D\u79F0\u3002" : "ID \u4E0D\u5408\u6CD5\uFF1A\u9700\u5C0F\u5199\u5B57\u6BCD/\u6570\u5B57/\u6A2A\u7EBF\uFF0C2\u201331 \u4F4D\uFF0C\u5B57\u6BCD\u6216\u6570\u5B57\u5F00\u5934\u3002" }) : null
      ] }, "actions")
    );
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.section, children: rows });
  }
  function buttonOf(vendor, snap, now, variant) {
    const size = ringSizeOf(variant);
    const idle = (title) => {
      const empty = /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(QuotaRing, { spec: { pct: null, tone: "idle", title }, size });
      return /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        ButtonLayout,
        {
          variant,
          leading: empty,
          glyph: empty,
          ...vendor ? { icon: iconOf(vendor.type, iconMetaOf(vendor.type)) } : {},
          ...variant === "wide" && vendor ? { name: vendor.name } : {}
        }
      );
    };
    if (!vendor) return idle("\u672A\u9009\u62E9\u4F9B\u5E94\u5546\uFF08\u6781\u7B80\u6A21\u5F0F\uFF09\uFF1A\u5728\u8BBE\u7F6E\u91CC\u9009\u4E00\u4E2A");
    if (!snap) return idle(vendor.name + "\uFF1A\u8FD8\u6CA1\u6709\u989D\u5EA6\u6570\u636E\uFF0C\u70B9\u5F00\u53EF\u624B\u52A8\u62C9\u53D6");
    return providerViews.renderButton({
      type: vendor.type,
      snap,
      now,
      vendorId: vendor.id,
      variant,
      icon: iconOf(vendor.type, iconMetaOf(vendor.type))
    });
  }
  function iconMetaOf(type) {
    const ps = providerMetas();
    if (ps) {
      const hit = ps.filter((x) => x && x.type === type)[0];
      if (hit && typeof hit.icon === "string" && hit.icon !== "") return hit.icon;
    }
    return void 0;
  }
  function buttonTitleOf(vendor, snap, variant) {
    if (!vendor) return "\u672A\u9009\u62E9\u4F9B\u5E94\u5546\uFF08\u6781\u7B80\u6A21\u5F0F\uFF09\uFF1A\u5728\u8BBE\u7F6E\u91CC\u9009\u4E00\u4E2A";
    if (!snap) return vendor.name + "\uFF1A\u8FD8\u6CA1\u6709\u989D\u5EA6\u6570\u636E\uFF0C\u70B9\u5F00\u53EF\u624B\u52A8\u62C9\u53D6";
    return providerViews.buttonTitle({
      type: vendor.type,
      snap,
      now: Date.now(),
      vendorId: vendor.id,
      variant,
      icon: iconOf(vendor.type, iconMetaOf(vendor.type))
    });
  }
  function QuotaSidebarAction2(props) {
    const s = useStore();
    const [, forcePrefs] = (0, import_react9.useState)(0);
    (0, import_react9.useEffect)(() => providerPrefs.subscribe(() => forcePrefs((x) => x + 1)), []);
    const [open, setOpen] = (0, import_react9.useState)(false);
    const rootRef = (0, import_react9.useRef)(null);
    const btnRef = (0, import_react9.useRef)(null);
    const panelRef = (0, import_react9.useRef)(null);
    const [now, setNow] = (0, import_react9.useState)(() => Date.now());
    (0, import_react9.useEffect)(() => {
      if (!open) return;
      setNow(Date.now());
      const id = window.setInterval(() => setNow(Date.now()), 1e3);
      return () => window.clearInterval(id);
    }, [open]);
    (0, import_react9.useEffect)(() => {
      void ensureLoad();
    }, []);
    const hasCfg = s.cfg !== null;
    const refreshSec = hasCfg ? Number(s.cfg.refreshSec) : 0;
    const autoOff = hasCfg && refreshSec === 0;
    (0, import_react9.useEffect)(() => {
      if (!hasCfg || autoOff) return;
      const ms = Math.min(3600, Math.max(10, refreshSec || 60)) * 1e3;
      startSyncLoop(ms);
      return () => stopSyncLoop();
    }, [hasCfg, autoOff, refreshSec]);
    const vendors = s.cfg && s.cfg.vendors || [];
    const vendorIds = vendors.map((v) => v.id).join("\0");
    (0, import_react9.useEffect)(() => {
      if (!hasCfg) return;
      providerPrefs.prune(vendors.map((v) => v.id));
    }, [hasCfg, vendorIds]);
    const activeVendor = activeOf(s);
    const activeId = activeVendor ? activeVendor.id : "";
    const minimal = activeVendor === null && vendors.length > 0;
    const activeSnap = activeVendor ? s.snaps[activeVendor.id] : void 0;
    const variant = props.wide ? "wide" : "rail";
    const activeButton = buttonOf(activeVendor, activeSnap, now, variant);
    const activeGlyph = buttonOf(activeVendor, activeSnap, now, "row");
    const rankOf = (v) => v.id === activeId ? 0 : v.enabled === false ? 2 : 1;
    const ordered = [];
    for (const rank of [0, 1, 2]) for (const v of vendors) if (rankOf(v) === rank) ordered.push(v);
    const rows = ordered.map((v) => {
      const snap = s.snaps[v.id];
      const off = v.enabled === false;
      const status = off ? "\u5DF2\u7981\u7528" : !snap ? "\u672A\u62C9\u53D6" : snap.ok ? "\u62C9\u53D6\u6B63\u5E38" : "\u62C9\u53D6\u5931\u8D25";
      const row = {
        id: v.id,
        name: v.name,
        typeLabel: typeLabel(v.type),
        active: v.id === activeId,
        disabled: off,
        button: buttonOf(v, snap, now, "row"),
        buttonHint: buttonTitleOf(v, snap, "row"),
        status
      };
      row.statusTone = off ? "off" : !snap ? "idle" : snap.ok ? "ok" : snap.errorInfo && snap.errorInfo.tone === "bad" ? "bad" : "warn";
      return row;
    });
    let detail;
    if (!activeVendor) {
      detail = /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.trayEmpty, children: "\u672A\u9009\u62E9\u4F9B\u5E94\u5546\uFF08\u6781\u7B80\u6A21\u5F0F\uFF09\uFF1A\u5728\u8BBE\u7F6E\u91CC\u9009\u4E00\u4E2A\u5373\u53EF\u663E\u793A\u989D\u5EA6\u3002" });
    } else if (s.loading && !activeSnap) {
      detail = /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.trayEmpty, children: "\u6B63\u5728\u8BFB\u53D6\u989D\u5EA6\u2026" });
    } else if (!activeSnap) {
      detail = /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("div", { className: styles_module_css_default.trayEmpty, children: "\u8FD8\u6CA1\u6709\u62C9\u53D6\u8FC7\uFF1A\u70B9\u53F3\u4E0A\u89D2 \u27F3 \u62C9\u53D6\u4E00\u6B21\u3002" });
    } else if (!activeSnap.ok) {
      detail = /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        ErrBox,
        {
          info: errInfoOf(activeSnap, "\u62C9\u53D6\u5931\u8D25"),
          msg: activeSnap.error,
          meta: activeSnap.vendorName,
          onRetry: () => {
            void refreshVendor(activeVendor.id);
          },
          compact: true
        }
      );
    } else {
      detail = providerViews.renderBody({
        type: activeVendor.type,
        snap: activeSnap,
        now,
        vendorId: activeVendor.id
      });
    }
    const freshness = [
      activeSnap && activeSnap.at ? timeAgo(activeSnap.at) : "",
      autoOff ? "\u81EA\u52A8\u5237\u65B0\u5DF2\u5173\u95ED" : ""
    ].filter((part) => part !== "").join(" \xB7 ");
    if (minimal) return null;
    const activeHint = buttonTitleOf(activeVendor, activeSnap, variant);
    return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: cx5(styles_module_css_default.trayRoot, props.wide ? void 0 : styles_module_css_default.trayRail), ref: rootRef, children: [
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(import_dsh_client_ui_primitives5.Tooltip, { label: activeHint, side: "top", delayMs: 400, disabled: open, children: /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        "button",
        {
          type: "button",
          ref: btnRef,
          className: styles_module_css_default.trayBtn,
          "aria-haspopup": "dialog",
          "aria-expanded": open,
          "aria-label": activeHint,
          onClick: () => setOpen(!open),
          children: activeButton
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
        QuotaTrayPanel,
        {
          open,
          setOpen,
          rootRef,
          anchorRef: btnRef,
          panelRef,
          vendors: rows,
          activeGlyph,
          activeHint,
          activeName: activeVendor ? activeVendor.name : "\u672A\u9009\u62E9\u4F9B\u5E94\u5546",
          detail,
          freshness,
          loading: s.loading,
          error: s.error || s.lastErr && s.lastErr.msg || "",
          manageHint: "\u589E\u5220\u6539\u4F9B\u5E94\u5546\uFF1A\u8BBE\u7F6E \u2192 TokenMeter \u2192 \u989D\u5EA6\u914D\u7F6E",
          onRefresh: () => {
            void refreshVendor(activeVendor ? activeVendor.id : void 0);
          },
          onSwitch: (id) => {
            void setActive(id);
          }
        }
      )
    ] });
  }
  return {
    QuotaSidebarAction: QuotaSidebarAction2,
    quotaStore: {
      useStore,
      get: () => store2.get(),
      subscribe: (fn) => store2.subscribe(fn),
      ensureLoad,
      reload,
      refreshVendor,
      syncState,
      setActive,
      setVendorEnabled,
      setRefresh,
      savePrefs,
      activeOf,
      typeLabel,
      remainOf,
      call
    },
    quotaUI: { Badge: Badge2, SecRow, FormField, PillSelect, VendorForm, secretBadge }
  };
}

// src/client/widgets.tsx
var import_react10 = require("react");
var ReactDOM4 = __toESM(require("react-dom"), 1);

// src/client/widget-bridge.ts
var WK_OWNER = "token-meter";
var SUFFIX_MAX = 32;
var STATS_KINDS = ["cards", "trend", "heat", "donut", "today"];
var STATS_TITLES = {
  cards: "\u6307\u6807\u5361",
  trend: "\u7528\u91CF\u8D8B\u52BF",
  heat: "\u7528\u91CF\u70ED\u529B",
  donut: "\u6A21\u578B\u5206\u5E03",
  today: "\u4ECA\u65E5\u6D88\u8017"
};
var STATS_PREFIX = "stats:";
function isFloatId(id) {
  if (typeof id !== "string" || id === "") return false;
  if (!id.startsWith(STATS_PREFIX)) return false;
  return STATS_KINDS.includes(id.slice(STATS_PREFIX.length));
}
function hash32(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36).padStart(4, "0").slice(0, 4);
}
function encodeFloatId(legacy) {
  let suffix;
  if (legacy.startsWith(STATS_PREFIX)) {
    const kind = legacy.slice(STATS_PREFIX.length);
    suffix = STATS_KINDS.includes(kind) ? `stats-${kind}` : `stats-x-${hash32(kind)}`;
  } else {
    suffix = `x-${hash32(legacy)}`;
  }
  return `${WK_OWNER}:${suffix.slice(0, SUFFIX_MAX)}`;
}
function floatTitle(legacy, hint) {
  if (hint !== void 0 && hint !== "") return hint;
  if (legacy.startsWith(STATS_PREFIX)) {
    const kind = legacy.slice(STATS_PREFIX.length);
    return STATS_TITLES[kind] ?? "\u7528\u91CF\u7EDF\u8BA1";
  }
  return "\u7528\u91CF\u7EDF\u8BA1";
}
var FLOAT_SIZES = {
  cards: { defaultSize: { w: 460, h: 360 }, minSize: { w: 300, h: 220 } },
  trend: { defaultSize: { w: 520, h: 320 }, minSize: { w: 340, h: 200 } },
  heat: { defaultSize: { w: 560, h: 230 }, minSize: { w: 360, h: 170 } },
  donut: { defaultSize: { w: 460, h: 420 }, minSize: { w: 320, h: 320 } },
  today: { defaultSize: { w: 320, h: 200 }, minSize: { w: 260, h: 150 } }
};
function floatFamily(legacy) {
  if (legacy.startsWith(STATS_PREFIX)) {
    const kind = legacy.slice(STATS_PREFIX.length);
    if (STATS_KINDS.includes(kind)) return kind;
  }
  return "cards";
}
function floatSize(legacy) {
  return FLOAT_SIZES[floatFamily(legacy)];
}

// src/client/widgets.tsx
var import_jsx_runtime21 = require("react/jsx-runtime");
var LS_KEY = "tm-widgets";
var FLOAT_W = 360;
var FLOAT_H = Math.round(FLOAT_W * 0.6);
function asService(candidate) {
  if (candidate === null || typeof candidate !== "object") return null;
  const s = candidate;
  const ok = typeof s.register === "function" && typeof s.list === "function" && typeof s.subscribe === "function" && typeof s.open === "function" && typeof s.close === "function" && typeof s.isOpen === "function";
  return ok ? candidate : null;
}
var service = null;
var serviceOff = null;
var contentRenderer = null;
var wkOf = /* @__PURE__ */ new Map();
var legacyOf = /* @__PURE__ */ new Map();
var disposersOf = /* @__PURE__ */ new Map();
var hints = /* @__PURE__ */ new Map();
var hostDisposers = [];
function floatIcon(legacy) {
  const kind = legacy.startsWith(STATS_PREFIX) ? legacy.slice(STATS_PREFIX.length) : "";
  const glyph = {
    cards: "chartBar",
    trend: "trend",
    heat: "grid",
    donut: "donut",
    today: "calendar"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(Glyph, { name: glyph[kind] ?? "chartBar", size: 16 });
}
function ensureRegistered(legacy, hint) {
  if (service === null || !isFloatId(legacy)) return;
  if (hint !== void 0 && hint !== "") hints.set(legacy, hint);
  if (disposersOf.has(legacy)) return;
  const wkId = encodeFloatId(legacy);
  try {
    const dispose = service.register({
      id: wkId,
      title: () => floatTitle(legacy, hints.get(legacy)),
      icon: floatIcon(legacy),
      presentation: "card",
      // 不占活动栏：这些卡片由中心区「用量统计」工具条上的按钮开合
      trayIcon: false,
      content: {
        render: () => contentRenderer === null ? null : /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("div", { className: styles_module_css_default.wkFrame, children: contentRenderer(legacy) })
      },
      // 尺寸按内容形状逐族给（见 widget-bridge.ts 的 FLOAT_SIZES 表）：
      // 热力图宽而扁、模型分布要留高、今日卡天生小 —— 一套尺寸打天下就是「有的太高、有的太矮」
      card: {
        ...floatSize(legacy),
        resizable: true,
        minimizable: true,
        closable: true
      }
    });
    disposersOf.set(legacy, dispose);
    wkOf.set(legacy, wkId);
    legacyOf.set(wkId, legacy);
  } catch (error) {
    console.error("[dshp-token-meter] \u6CE8\u518C\u5C0F\u7EC4\u4EF6\u5230\u5BBF\u4E3B\u5931\u8D25\uFF08\u8BE5\u5361\u7247\u4E0D\u4F1A\u51FA\u73B0\uFF09\uFF1A" + legacy, error);
  }
}
function forgetFloat(legacy) {
  const wkId = wkOf.get(legacy);
  const dispose = disposersOf.get(legacy);
  if (service !== null && wkId !== void 0) {
    try {
      service.close(wkId);
    } catch {
    }
  }
  if (dispose !== void 0) {
    try {
      dispose();
    } catch {
    }
  }
  wkOf.delete(legacy);
  disposersOf.delete(legacy);
  hints.delete(legacy);
  if (wkId !== void 0) legacyOf.delete(wkId);
}
function syncRegistered(list) {
  if (service === null) return;
  const want = /* @__PURE__ */ new Set();
  for (const item of list) {
    if (!isFloatId(item.id)) continue;
    want.add(item.id);
    ensureRegistered(item.id, item.title);
  }
  for (const legacy of Array.from(disposersOf.keys())) {
    if (!want.has(legacy)) forgetFloat(legacy);
  }
}
function bridgedOpenList() {
  if (service === null) return [];
  const out = [];
  for (const legacy of disposersOf.keys()) {
    const wkId = wkOf.get(legacy);
    if (wkId === void 0) continue;
    let open = false;
    try {
      open = service.isOpen(wkId);
    } catch {
      open = false;
    }
    if (open) out.push({ id: legacy, pos: { x: 0, y: 0 } });
  }
  return out;
}
function loadAll() {
  try {
    const raw = window.localStorage.getItem(LS_KEY) || "null";
    const v = JSON.parse(raw);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v)) {
        const p = v[k];
        if (p && isFinite(p.x) && isFinite(p.y)) out[k] = { x: Number(p.x), y: Number(p.y) };
      }
      return out;
    }
  } catch {
  }
  return {};
}
function saveAll(open) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(open));
  } catch {
  }
}
function clampPos(p) {
  try {
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    return {
      x: Math.max(8, Math.min(p.x, vw - FLOAT_W)),
      y: Math.max(8, Math.min(p.y, vh - FLOAT_H))
    };
  } catch {
    return p;
  }
}
function cascadePos(count) {
  try {
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    const step = count % 8 * 36;
    return {
      x: Math.max(8, Math.min(vw - FLOAT_W - 24 - step, vw - FLOAT_W)),
      y: Math.max(8, Math.min(96 + step, vh - FLOAT_H))
    };
  } catch {
    return { x: 120, y: 120 };
  }
}
function createWidgetSystem() {
  let open = typeof window !== "undefined" ? loadAll() : {};
  let order = Object.keys(open);
  const listeners2 = /* @__PURE__ */ new Set();
  function emit2(save2) {
    if (save2) saveAll(open);
    for (const fn of listeners2) {
      try {
        fn();
      } catch {
      }
    }
  }
  function portal2(node) {
    if (node === null || node === void 0) return null;
    try {
      if (ReactDOM4 && typeof ReactDOM4.createPortal === "function" && typeof document !== "undefined" && document.body) {
        return ReactDOM4.createPortal(node, document.body);
      }
    } catch {
    }
    return node;
  }
  function raise(id) {
    const i = order.indexOf(id);
    if (i < 0 || i === order.length - 1) return;
    order = order.filter((x) => x !== id).concat(id);
    emit2(false);
  }
  function zOf(id) {
    const i = order.indexOf(id);
    return 300 + (i < 0 ? 0 : i);
  }
  function useWidgets() {
    const [, force] = (0, import_react10.useReducer)((x) => x + 1, 0);
    (0, import_react10.useEffect)(() => {
      const fn = () => force();
      listeners2.add(fn);
      return () => {
        listeners2.delete(fn);
      };
    }, []);
    if (service !== null) return bridgedOpenList();
    return Object.keys(open).map((id) => ({
      id,
      pos: open[id]
    }));
  }
  function isOpen(id) {
    if (service !== null) {
      const wkId = wkOf.get(id);
      if (wkId === void 0) return false;
      try {
        return service.isOpen(wkId);
      } catch {
        return false;
      }
    }
    return Object.hasOwn(open, id);
  }
  function openWidget(id, at) {
    if (service !== null) {
      ensureRegistered(id);
      const wkId = wkOf.get(id);
      if (wkId === void 0) return;
      try {
        service.open(wkId);
      } catch (error) {
        console.error("[dshp-token-meter] \u6253\u5F00\u5C0F\u7EC4\u4EF6\u5931\u8D25\uFF1A" + id, error);
      }
      return;
    }
    const pos = clampPos(
      at || open[id] || cascadePos(Object.keys(open).length)
    );
    open = Object.assign({}, open, { [id]: pos });
    order = order.filter((x) => x !== id).concat(id);
    emit2(true);
  }
  function forget(prefix) {
    if (service !== null) {
      for (const legacy of Array.from(disposersOf.keys())) {
        if (legacy.startsWith(prefix)) forgetFloat(legacy);
      }
      return;
    }
    const next = Object.assign({}, open);
    let changed = false;
    for (const id of Object.keys(next)) {
      if (!id.startsWith(prefix)) continue;
      delete next[id];
      order = order.filter((x) => x !== id);
      changed = true;
    }
    if (!changed) return;
    open = next;
    emit2(true);
  }
  function closeWidget(id) {
    if (service !== null) {
      const wkId = wkOf.get(id);
      if (wkId === void 0) return;
      try {
        service.close(wkId);
      } catch (error) {
        console.error("[dshp-token-meter] \u5173\u95ED\u5C0F\u7EC4\u4EF6\u5931\u8D25\uFF1A" + id, error);
      }
      return;
    }
    if (!Object.hasOwn(open, id)) return;
    const next = Object.assign({}, open);
    delete next[id];
    open = next;
    order = order.filter((x) => x !== id);
    emit2(true);
  }
  function moveWidget(id, pos) {
    if (!Object.hasOwn(open, id)) return;
    open = Object.assign({}, open, { [id]: clampPos(pos) });
    emit2(false);
  }
  function commitWidget() {
    emit2(true);
  }
  function clampAllToViewport() {
    let changed = false;
    const next = Object.assign({}, open);
    for (const id of Object.keys(next)) {
      const c = clampPos(next[id]);
      if (c.x !== next[id].x || c.y !== next[id].y) {
        next[id] = c;
        changed = true;
      }
    }
    if (changed) {
      open = next;
      emit2(true);
    }
  }
  function gripOut(id, e) {
    if (e.button !== void 0 && e.button !== 0) return;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (Object.hasOwn(open, id)) {
      startDrag(id, open[id], e, true);
      return;
    }
    const sx = e.clientX;
    const sy = e.clientY;
    let ox = -60, oy = -20;
    try {
      const t = e.target;
      if (t && t.closest) {
        const card = t.closest("[data-tm-widget], ." + styles_module_css_default.card + ", ." + styles_module_css_default.today);
        if (card) {
          const r = card.getBoundingClientRect();
          ox = e.clientX - r.left;
          oy = e.clientY - r.top;
        }
      }
    } catch {
    }
    let out = false;
    function mv(ev) {
      if (!out && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
      out = true;
      openWidget(id, { x: ev.clientX - ox, y: ev.clientY - oy });
    }
    function up() {
      try {
        window.removeEventListener("pointermove", mv);
      } catch {
      }
      try {
        window.removeEventListener("pointerup", up);
      } catch {
      }
      if (!out) openWidget(id);
    }
    try {
      window.addEventListener("pointermove", mv);
    } catch {
    }
    try {
      window.addEventListener("pointerup", up);
    } catch {
    }
  }
  function gripProps(id) {
    return { onPointerDown: (e) => gripOut(id, e) };
  }
  function startDrag(id, cur, e, fromGrip) {
    if (e.button !== void 0 && e.button !== 0) return;
    if (e.target && e.target.closest) {
      const skip = e.target.closest(
        "button, input, select, textarea, a, ." + styles_module_css_default.seg + ", ." + styles_module_css_default.modelchip + ", ." + styles_module_css_default.switch
      ) || !fromGrip && e.target.closest("." + styles_module_css_default.grip);
      if (skip) return;
    }
    if (e.preventDefault) e.preventDefault();
    const ox = e.clientX - cur.x;
    const oy = e.clientY - cur.y;
    function mv(ev) {
      moveWidget(id, { x: ev.clientX - ox, y: ev.clientY - oy });
    }
    function up() {
      try {
        window.removeEventListener("pointermove", mv);
      } catch {
      }
      try {
        window.removeEventListener("pointerup", up);
      } catch {
      }
      commitWidget();
    }
    try {
      window.addEventListener("pointermove", mv);
    } catch {
    }
    try {
      window.addEventListener("pointerup", up);
    } catch {
    }
  }
  function WidgetFloat(props) {
    const list = useWidgets();
    const cur = service === null ? list.filter((w) => w.id === props.id)[0] : void 0;
    (0, import_react10.useEffect)(() => {
      const onR = () => {
        const p = open[props.id];
        if (!p) return;
        const c = clampPos(p);
        if (c.x !== p.x || c.y !== p.y) moveWidget(props.id, c);
      };
      window.addEventListener("resize", onR);
      return () => window.removeEventListener("resize", onR);
    }, [props.id]);
    if (!cur) return null;
    return portal2(
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "div",
        {
          className: styles_module_css_default.widgetFloat + " " + styles_module_css_default.in,
          style: {
            left: cur.pos.x + "px",
            top: cur.pos.y + "px",
            width: FLOAT_W + "px",
            zIndex: zOf(props.id)
          },
          onPointerDown: (e) => {
            raise(props.id);
            const t = e.target;
            if (t && t.closest && t.closest(
              "button, input, select, textarea, a, ." + styles_module_css_default.grip + ", ." + styles_module_css_default.seg + ", ." + styles_module_css_default.modelchip + ", ." + styles_module_css_default.switch
            ))
              return;
            startDrag(props.id, cur.pos, e);
          },
          children: props.children
        }
      )
    );
  }
  function WidgetToggle(props) {
    const list = useWidgets();
    const opened = service === null ? list.some((w) => w.id === props.id) : isOpen(props.id);
    const what = props.name ? "\u300C" + props.name + "\u300D" : "\u672C\u5361\u7247";
    if (service !== null) {
      return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("span", { style: { display: "inline-flex", gap: 2, alignItems: "center", marginLeft: 6, flex: "none" }, children: opened ? /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "button",
        {
          className: styles_module_css_default.minibtn,
          title: "\u628A " + what + " \u6536\u56DE\u539F\u4F4D\uFF08\u5173\u95ED\u5C0F\u7EC4\u4EF6\u5361\u7247\uFF09",
          onClick: () => closeWidget(props.id),
          children: "\u56DE\u5F52"
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "button",
        {
          className: styles_module_css_default.minibtn,
          title: "\u5F39\u51FA " + what + " \u4E3A\u72EC\u7ACB\u5361\u7247\uFF08\u53EF\u62D6\u52A8 / \u7F29\u653E / \u6700\u5C0F\u5316\uFF09",
          onClick: () => {
            ensureRegistered(props.id, props.name);
            openWidget(props.id);
          },
          children: "\u29C9"
        }
      ) });
    }
    return /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("span", { style: { display: "inline-flex", gap: 2, alignItems: "center", marginLeft: 6, flex: "none" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "span",
        {
          className: styles_module_css_default.grip,
          title: opened ? what + " \u5DF2\u5F39\u51FA\u4E3A\u72EC\u7ACB\u6D6E\u7A97\uFF08\u53EF\u62D6\u52A8\uFF09" : "\u6309\u4F4F\u62D6\u51FA " + what + " \u4E3A\u72EC\u7ACB\u6D6E\u7A97\uFF0C\u70B9\u6309\u76F4\u63A5\u5F39\u51FA",
          "aria-label": "\u62D6\u52A8\u6216\u5F39\u51FA " + what,
          ...gripProps(props.id),
          children: "\u283F"
        }
      ),
      opened ? /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "button",
        {
          className: styles_module_css_default.minibtn,
          title: "\u628A " + what + " \u6536\u56DE\u539F\u4F4D\uFF08\u5173\u95ED\u6D6E\u7A97\uFF09",
          onClick: () => closeWidget(props.id),
          children: "\u56DE\u5F52"
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
        "button",
        {
          className: styles_module_css_default.minibtn,
          title: "\u5F39\u51FA " + what + " \u4E3A\u72EC\u7ACB\u6D6E\u7A97",
          onClick: () => openWidget(props.id),
          children: "\u29C9"
        }
      )
    ] });
  }
  function attach(candidate) {
    const next = asService(candidate);
    if (next === null) return false;
    if (service === next) return true;
    if (service !== null) detach();
    service = next;
    try {
      serviceOff = service.subscribe(() => {
        emit2(false);
      });
    } catch (error) {
      serviceOff = null;
      console.error("[dshp-token-meter] \u8BA2\u9605\u5BBF\u4E3B\u6CE8\u518C\u8868\u5931\u8D25\uFF08\u5361\u7247\u5F00\u5173\u72B6\u6001\u53EF\u80FD\u4E0D\u5237\u65B0\uFF09\uFF1A", error);
    }
    emit2(false);
    return true;
  }
  function detach() {
    if (serviceOff !== null) {
      try {
        serviceOff();
      } catch {
      }
      serviceOff = null;
    }
    for (const legacy of Array.from(disposersOf.keys())) {
      const dispose = disposersOf.get(legacy);
      if (dispose === void 0) continue;
      try {
        dispose();
      } catch {
      }
      wkOf.delete(legacy);
    }
    disposersOf.clear();
    legacyOf.clear();
    hints.clear();
    while (hostDisposers.length > 0) {
      const dispose = hostDisposers.pop();
      try {
        dispose?.();
      } catch {
      }
    }
    service = null;
    emit2(false);
  }
  return {
    useWidgets,
    isOpen,
    openWidget,
    closeWidget,
    forget,
    moveWidget,
    commitWidget,
    gripProps,
    WidgetFloat,
    WidgetToggle,
    raise,
    zOf,
    clampAllToViewport,
    isBridged: () => service !== null,
    setContentRenderer: (render) => {
      contentRenderer = render;
    },
    syncRegistered,
    attach,
    detach,
    registerHost: (descriptor) => {
      if (service === null) return false;
      try {
        hostDisposers.push(service.register(descriptor));
        return true;
      } catch (error) {
        console.error("[dshp-token-meter] \u6CE8\u518C\u5BBF\u4E3B\u5C0F\u7EC4\u4EF6\u5931\u8D25\uFF1A" + descriptor.id, error);
        return false;
      }
    },
    listFloats: () => Array.from(disposersOf.keys()).map((legacy) => ({
      id: legacy,
      title: floatTitle(legacy, hints.get(legacy))
    }))
  };
}

// src/client/TokenMeterSection.tsx
var import_jsx_runtime22 = require("react/jsx-runtime");
var STATS_WIDGET_BTNS = [
  ["cards", "\u6307\u6807\u5361"],
  ["trend", "\u8D8B\u52BF"],
  ["heat", "\u70ED\u529B"],
  ["donut", "\u6A21\u578B"],
  ["today", "\u4ECA\u65E5"]
];
var SEC_PRESETS = [0, 30, 60, 120, 300, 600, 1800, 3600];
function secLabel(n) {
  return n === 0 ? "\u5173\u95ED\u81EA\u52A8\u5237\u65B0" : n + " \u79D2";
}
var NEW_VENDOR = { id: "", name: "", type: "opencode", params: { workspaceId: "", cookie: "" } };
function cx6(...names) {
  return names.filter((name) => name !== void 0).join(" ");
}
var widgets = createWidgetSystem();
var quota = createQuotaSection();
var quotaStore = quota.quotaStore;
var store = quotaStore;
var UI = quota.quotaUI;
var widgetsApi = widgets;
function notifyPrefs(patch) {
  try {
    window.dispatchEvent(new CustomEvent("tm-prefs-changed", { detail: patch }));
  } catch {
  }
}
function TokenMeterSettings() {
  const s = store.useStore();
  (0, import_react11.useEffect)(() => {
    void store.ensureLoad();
  }, []);
  const [busy, setBusy] = (0, import_react11.useState)(false);
  const [opErr, setOpErr] = (0, import_react11.useState)("");
  const [draft, setDraft] = (0, import_react11.useState)(JSON.parse(JSON.stringify(NEW_VENDOR)));
  const [editing, setEditing] = (0, import_react11.useState)(null);
  const [confirmDel, setConfirmDel] = (0, import_react11.useState)(null);
  const [acked, setAcked] = (0, import_react11.useState)(false);
  async function withBusy(fn) {
    setBusy(true);
    setOpErr("");
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }
  async function saveVendor(v, isEdit) {
    await withBusy(async () => {
      try {
        const r = await store.call(isEdit ? "quota.update-vendor" : "quota.add-vendor", { vendor: v });
        if (r && r.ok) {
          if (!isEdit) setDraft(JSON.parse(JSON.stringify(NEW_VENDOR)));
          else setEditing(null);
          await store.reload();
        } else setOpErr(String(r && r.error || "\u4FDD\u5B58\u5931\u8D25"));
      } catch {
        setOpErr("\u8FDE\u63A5 Host \u5931\u8D25");
      }
    });
  }
  async function delVendor(id) {
    await withBusy(async () => {
      try {
        const r = await store.call("quota.delete-vendor", { id });
        if (!(r && r.ok)) setOpErr(String(r && r.error || "\u5220\u9664\u5931\u8D25"));
        await store.reload();
      } catch {
        setOpErr("\u8FDE\u63A5 Host \u5931\u8D25");
      }
    });
  }
  async function toCred(id) {
    await withBusy(async () => {
      try {
        const r = await store.call("quota.secret-to-cred", { id });
        if (r && r.ok) await store.reload();
        else setOpErr(String(r && r.error || "\u8F6C\u5B58\u5931\u8D25"));
      } catch {
        setOpErr("\u8FDE\u63A5 Host \u5931\u8D25");
      }
    });
  }
  const pickRange = (v) => withBusy(async () => {
    const r = await store.savePrefs({ defaultRange: v });
    if (!r.ok) setOpErr(String(r.error || "\u4FDD\u5B58\u5931\u8D25"));
    else notifyPrefs({ defaultRange: v });
  });
  const [tab, setTab] = (0, import_react11.useState)("stats");
  const [statsSnap, setStatsSnap] = (0, import_react11.useState)(null);
  const [clearArmed, setClearArmed] = (0, import_react11.useState)(false);
  const [clearMsg, setClearMsg] = (0, import_react11.useState)("");
  (0, import_react11.useEffect)(() => {
    let alive = true;
    const tick = () => {
      void fetchStats().then((v) => {
        if (alive) setStatsSnap(v);
      }).catch(() => {
      });
    };
    tick();
    const id = window.setInterval(tick, 5e3);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [clearMsg]);
  const commonKids = [];
  const statsKids = [];
  const quotaKids = [];
  if (s.error)
    commonKids.push(
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: cx6(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: s.error }, "err")
    );
  if (opErr)
    commonKids.push(
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: cx6(styles_module_css_default.notice, styles_module_css_default.noticeErr), children: opErr }, "operr")
    );
  if (!s.cfg) {
    commonKids.push(
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.loading, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.spinner }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.loadingText, children: s.loading ? "\u6B63\u5728\u8BFB\u53D6\u914D\u7F6E\u2026" : "\u914D\u7F6E\u52A0\u8F7D\u5931\u8D25" })
      ] }, "loading")
    );
    return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.page, children: commonKids });
  }
  const vendors = s.cfg.vendors || [];
  const activeId = s.cfg.activeVendor || "";
  const a0 = store.activeOf(s);
  const rawSec = s.cfg.refreshSec;
  const curSec = rawSec === void 0 || rawSec === null || rawSec === "" ? 60 : Number(rawSec) === 0 ? 0 : isFinite(Number(rawSec)) ? Math.min(3600, Math.max(10, Number(rawSec) || 60)) : 60;
  const defRange = String(s.cfg.defaultRange || "all");
  quotaKids.push(
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u504F\u597D" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        UI.SecRow,
        {
          label: "\u81EA\u52A8\u5237\u65B0",
          desc: "\u6BCF\u9694\u8FD9\u4E48\u4E45\u81EA\u52A8\u53BB\u5E73\u53F0\u62C9\u4E00\u6B21\u989D\u5EA6\uFF08\u53EA\u62C9\u300C\u5DF2\u542F\u7528\u300D\u7684\u4F9B\u5E94\u5546\uFF0C\u7981\u7528\u7684\u89C1\u4E0B\u65B9\u5217\u8868\uFF09\u3002\u9009\u300C\u5173\u95ED\u81EA\u52A8\u5237\u65B0\u300D\u540E\u4E0D\u518D\u5B9A\u65F6\u62C9\u53D6\uFF0C\u4ECD\u53EF\u968F\u65F6\u624B\u52A8\u70B9\u300C\u62C9\u53D6\u300D\u3002",
          children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
            UI.PillSelect,
            {
              disabled: busy,
              value: String(curSec),
              selectedLabel: secLabel(curSec),
              options: (SEC_PRESETS.indexOf(curSec) >= 0 ? SEC_PRESETS : [curSec].concat(SEC_PRESETS)).map(
                (n) => ({
                  id: String(n),
                  label: secLabel(n)
                })
              ),
              onSelect: (id) => void withBusy(() => store.setRefresh(Number(id)))
            }
          )
        },
        "sec"
      )
    ] }, "display")
  );
  const snapTotal = statsSnap && typeof statsSnap.total === "number" ? statsSnap.total : null;
  const snapScanned = statsSnap && typeof statsSnap.scanned === "number" ? statsSnap.scanned : null;
  const snapErrors = statsSnap && typeof statsSnap.errors === "number" ? statsSnap.errors : null;
  const snapHits = statsSnap && typeof statsSnap.cacheHits === "number" ? statsSnap.cacheHits : null;
  const snapReused = statsSnap && typeof statsSnap.reused === "number" ? statsSnap.reused : null;
  const gapNow = String(s.cfg.onlineGapMin ?? 5);
  statsKids.push(
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.title, children: "\u6570\u636E\u6765\u6E90\uFF1A\u4F1A\u8BDD\u8BB0\u5F55\uFF08\u552F\u4E00\u771F\u76F8\u6E90\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: styles_module_css_default.desc, style: { margin: "4px 0 0" }, children: [
        "\u6240\u6709\u7EDF\u8BA1\uFF08Token \u7528\u91CF\u3001\u5728\u7EBF\u65F6\u957F\u3001\u6A21\u578B\u5206\u5E03\u3001\u70ED\u529B\u56FE\u2026\uFF09\u90FD\u7531 ",
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("code", { className: styles_module_css_default.mono, children: "$DSH_HOME/sessions/" }),
        " \u4E0B\u7684\u4F1A\u8BDD\u65E5\u5FD7\u805A\u5408\u800C\u6765\u3002\u4E0B\u9762\u7684\u7F13\u5B58\u53EA\u662F**\u53EF\u4E22\u7684\u6D3E\u751F\u6570\u636E**\uFF1A\u5220\u6389\u540E\u4F1A\u81EA\u52A8\u51ED\u4F1A\u8BDD\u65E5\u5FD7\u91CD\u7B97\uFF0C\u4F46**\u4F1A\u8BDD\u8BB0\u5F55\u672C\u8EAB\u4E22\u4E86\u5C31\u518D\u4E5F\u7B97\u4E0D\u56DE\u6765**\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: styles_module_css_default.desc, style: { margin: "4px 0 0" }, children: [
        "\u8FC1\u79FB / \u5907\u4EFD / \u6362\u673A\u65F6\uFF1A**\u4FDD\u7559 `sessions/` \u76EE\u5F55**\uFF08\u4F53\u79EF\u4EE5\u672C\u673A\u4E3A\u4F8B\u7EA6 250MB\uFF09\uFF1B",
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("code", { className: styles_module_css_default.mono, children: "storages/token_stats.json" }),
        " \u4E0D\u5FC5\u5907\u4EFD\uFF08\u91CD\u5EFA\u5373\u53EF\uFF09\u3002"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.toolbar, style: { marginTop: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        import_dsh_client_ui_primitives6.Button,
        {
          variant: "outline",
          size: "sm",
          onClick: () => {
            try {
              void navigator.clipboard.writeText("$DSH_HOME/sessions/");
              setClearMsg("\u5DF2\u590D\u5236\u4F1A\u8BDD\u76EE\u5F55\u8DEF\u5F84");
            } catch {
              setClearMsg("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236 $DSH_HOME/sessions/");
            }
          },
          children: "\u590D\u5236\u4F1A\u8BDD\u76EE\u5F55\u8DEF\u5F84"
        }
      ) })
    ] }, "source")
  );
  statsKids.push(
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u7F13\u5B58\u4E0E\u626B\u63CF\u72B6\u6001" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.chartTitle, style: { marginBottom: 4 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.chartName, children: "\u6D3E\u751F\u7F13\u5B58" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.hint, children: statsSnap && statsSnap.generatedAt ? "\u66F4\u65B0\u4E8E " + new Date(statsSnap.generatedAt).toLocaleTimeString() : "\u8BFB\u53D6\u4E2D\u2026" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.cacheRow, style: { marginTop: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "\u4F1A\u8BDD " + (snapScanned ?? "\u2014") + "/" + (snapTotal ?? "\u2014") + " \u5DF2\u626B\u63CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "\u590D\u7528 " + (snapReused ?? "\u2014") + (snapHits != null ? "\uFF08\u7F13\u5B58 " + snapHits + "\uFF09" : "") }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "\u626B\u63CF\u5931\u8D25 " + (snapErrors ?? "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "\u76F4\u8BFB " + (statsSnap && statsSnap.directReads != null ? statsSnap.directReads : "\u2014") }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "\u5B58\u50A8 " + (statsSnap && statsSnap.storage ? statsSnap.storage : "\u2014") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: styles_module_css_default.desc, style: { margin: "6px 0 0" }, children: "\u300C\u590D\u7528\u300D= \u8BE5\u4F1A\u8BDD\u65E5\u5FD7\u6CA1\u53D8\uFF0C\u76F4\u63A5\u6CBF\u7528\u4E0A\u6B21\u7ED3\u679C\uFF08\u91CD\u542F\u540E\u6765\u81EA\u6301\u4E45\u5316\u7F13\u5B58\uFF0C\u8FD0\u884C\u4E2D\u6765\u81EA\u5185\u5B58\uFF09\uFF1B\u65E5\u5FD7\u53D8\u5927\u65F6\u53EA\u8BFB\u65B0\u589E\u90E8\u5206\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.toolbar, style: { marginTop: 8 }, children: [
          clearArmed ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
            import_dsh_client_ui_primitives6.Button,
            {
              variant: "outline",
              size: "sm",
              disabled: busy,
              onClick: () => void withBusy(async () => {
                setClearMsg("");
                const r = await clearStatsCache();
                setClearMsg(
                  r.ok ? "\u5DF2\u6E05\u9664 " + (r.removed ?? 0) + " \u884C\u7F13\u5B58\uFF0C\u6B63\u5728\u91CD\u7B97\u2026" : String(r.error || "\u6E05\u9664\u5931\u8D25")
                );
                setClearArmed(false);
              }),
              children: "\u786E\u8BA4\u6E05\u9664\u5E76\u91CD\u7B97"
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_dsh_client_ui_primitives6.Button, { variant: "outline", size: "sm", disabled: busy, onClick: () => setClearArmed(true), children: "\u6E05\u9664\u7EDF\u8BA1\u7F13\u5B58" }),
          clearArmed ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_dsh_client_ui_primitives6.Button, { variant: "outline", size: "sm", onClick: () => setClearArmed(false), children: "\u53D6\u6D88" }) : null,
          clearMsg ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.hint, children: clearMsg }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: styles_module_css_default.desc, style: { margin: "6px 0 0" }, children: "\u6E05\u9664\u540E\u4E0B\u4E00\u6B21\u626B\u63CF\u4F1A\u91CD\u65B0\u8BFB\u53D6\u5168\u90E8\u4F1A\u8BDD\u65E5\u5FD7\uFF08\u672C\u673A\u7EA6 6 \u79D2\uFF09\uFF0C\u671F\u95F4\u9762\u677F\u663E\u793A\u300C\u540E\u53F0\u8865\u626B\u4E2D\u300D\u3002" })
      ] })
    ] }, "cache")
  );
  statsKids.push(
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u504F\u597D" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(UI.SecRow, { label: "\u9ED8\u8BA4\u8303\u56F4", desc: "\u4E2D\u5FC3\u533A\u300C\u7528\u91CF\u7EDF\u8BA1\u300D\u6253\u5F00\u65F6\u9ED8\u8BA4\u7EDF\u8BA1\u591A\u5C11\u5929\u7684\u6570\u636E\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        UI.PillSelect,
        {
          disabled: busy,
          value: defRange,
          selectedLabel: defRange === "all" ? "\u5168\u90E8" : "\u8FD1 " + defRange + " \u5929",
          options: [
            { id: "7", label: "\u8FD1 7 \u5929" },
            { id: "30", label: "\u8FD1 30 \u5929" },
            { id: "90", label: "\u8FD1 90 \u5929" },
            { id: "all", label: "\u5168\u90E8" }
          ],
          onSelect: (id) => void pickRange(id)
        }
      ) }, "range"),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        UI.SecRow,
        {
          label: "\u5728\u7EBF\u65F6\u957F\u7A7A\u95F2\u9608\u503C",
          desc: "\u5728\u7EBF = \u6709\u4E8B\u4EF6\u3001\u4E14\u76F8\u90BB\u4E8B\u4EF6\u95F4\u9694\u4E0D\u8D85\u8FC7\u5B83\u7684\u5899\u949F\u65F6\u95F4\uFF1A\u95F4\u9694 \u2264 \u9608\u503C\u5219\u6574\u6BB5\u8BA1\u5165\uFF08\u542B\u4E2D\u95F4\u7A7A\u6863\uFF09\uFF0C\u8D85\u8FC7\u5C31\u65AD\u5F00\u3001\u4E2D\u95F4\u4E0D\u8BA1\uFF1B\u6BCF\u6BB5\u53EA\u7B97\u5230\u6700\u540E\u4E00\u4E2A\u4E8B\u4EF6\uFF0C\u6240\u4EE5\u4EFB\u4F55\u6863\u4F4D\u90FD\u662F\u4E0B\u754C\u3002\u63A8\u8350 15 \u5206\u949F\uFF08\u80FD\u515C\u4F4F\u8BFB\u957F\u56DE\u7B54/\u60F3\u9700\u6C42\u7684\u9759\u9ED8\u671F\uFF0C\u53C8\u4E0D\u4F1A\u628A\u5F00\u4F1A\u5403\u996D\u7B97\u8FDB\u6765\uFF09\uFF1B\u8BE6\u7EC6\u8BF4\u660E\u4E0E\u5404\u6863\u5B9E\u6D4B\u5BF9\u6BD4\u89C1\u300C\u5728\u7EBF\u7EDF\u8BA1\u300D\u9762\u677F\u9876\u90E8\u3002",
          children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
            UI.PillSelect,
            {
              disabled: busy,
              value: gapNow,
              selectedLabel: gapNow + " \u5206\u949F",
              options: [1, 5, 15, 30, 60].map((n) => ({ id: String(n), label: n + " \u5206\u949F" })),
              onSelect: (id) => void withBusy(async () => {
                const r = await store.savePrefs({ onlineGapMin: Number(id) });
                if (!r.ok) setOpErr(String(r.error || "\u4FDD\u5B58\u5931\u8D25"));
                else notifyPrefs({ onlineGapMin: Number(id) });
              })
            }
          )
        },
        "gap"
      )
    ] }, "statpref")
  );
  const vrows = [
    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
      UI.SecRow,
      {
        label: "\u5F53\u524D\u4F9B\u5E94\u5546",
        desc: "\u4FA7\u8FB9\u680F\u5E95\u90E8\u7684\u989D\u5EA6\u6309\u94AE\u5C55\u793A\u54EA\u4E00\u5BB6\u7684\u989D\u5EA6\uFF1B\u9009\u300C\u65E0\u300D= \u6781\u7B80\u6A21\u5F0F\uFF08\u4E0D\u663E\u793A\u90A3\u679A\u6309\u94AE\uFF0C\u4E5F\u4E0D\u62C9\u53D6\u4EFB\u4F55\u989D\u5EA6\uFF09\u3002",
        children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
          UI.PillSelect,
          {
            disabled: busy,
            value: activeId,
            selectedLabel: a0 ? a0.name + "\uFF08" + store.typeLabel(a0.type) + "\uFF09" : "\u65E0 \xB7 \u6781\u7B80\u6A21\u5F0F\uFF08\u4E0D\u62C9\u53D6\uFF09",
            options: [{ id: "", label: "\u65E0 \xB7 \u6781\u7B80\u6A21\u5F0F\uFF08\u4E0D\u62C9\u53D6\uFF09" }].concat(
              vendors.map((v) => ({ id: v.id, label: v.name + "\uFF08" + store.typeLabel(v.type) + "\uFF09" }))
            ),
            onSelect: (id) => void withBusy(async () => {
              await store.setActive(id);
              await store.reload();
            })
          }
        )
      },
      "__active"
    )
  ];
  const listOn = vendors.filter((v) => v.enabled !== false);
  const listOff = vendors.filter((v) => v.enabled === false);
  const activeFirstOf = (list) => list.filter((v) => v.id === activeId).concat(list.filter((v) => v.id !== activeId));
  activeFirstOf(listOn).concat(activeFirstOf(listOff)).forEach((v) => {
    const snap = s.snaps[v.id];
    const isCur = v.id === activeId;
    const off = v.enabled === false;
    const status = off ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: cx6(styles_module_css_default.hint, styles_module_css_default.offtxt), children: "\u5DF2\u7981\u7528\u5B9A\u65F6\u62C9\u53D6" }) : snap && snap.ok ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.hint, children: "\u62C9\u53D6\u6B63\u5E38" }) : snap ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.hint, title: snap.error || "\u62C9\u53D6\u5931\u8D25", children: "\u62C9\u53D6\u5931\u8D25" }) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.hint, children: "\u672A\u62C9\u53D6" });
    vrows.push(
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        UI.SecRow,
        {
          wrap: true,
          label: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0, maxWidth: "100%" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              "span",
              {
                className: cx6(styles_module_css_default.dot, off ? styles_module_css_default.off : snap && !snap.ok ? styles_module_css_default.bad : void 0)
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.vname2, style: { maxWidth: 280 }, children: v.name }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(UI.Badge, { kind: "info", text: store.typeLabel(v.type) }),
            isCur ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(UI.Badge, { kind: "ok", text: "\u5F53\u524D" }) : null,
            off ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(UI.Badge, { kind: "bad", text: "\u5DF2\u7981\u7528" }) : null,
            UI.secretBadge(v.secretKind)
          ] }),
          children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: styles_module_css_default.bar, style: { width: "100%", padding: 0, border: "none" }, children: [
            status,
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { style: { flex: 1 } }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              import_dsh_client_ui_primitives6.Button,
              {
                variant: "outline",
                size: "sm",
                disabled: busy,
                onClick: () => void withBusy(() => store.refreshVendor(v.id)),
                children: "\u62C9\u53D6"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              import_dsh_client_ui_primitives6.Button,
              {
                variant: "ghost",
                size: "sm",
                disabled: busy,
                title: off ? "\u91CD\u65B0\u52A0\u5165 Host \u5B9A\u65F6\u62C9\u53D6" : "\u9000\u51FA Host \u5B9A\u65F6\u62C9\u53D6\uFF08\u624B\u52A8\u62C9\u53D6\u4E0D\u53D7\u5F71\u54CD\uFF09",
                onClick: () => void withBusy(() => store.setVendorEnabled(v.id, off)),
                children: off ? "\u542F\u7528" : "\u7981\u7528"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              import_dsh_client_ui_primitives6.Button,
              {
                variant: "outline",
                size: "sm",
                disabled: busy,
                onClick: () => setEditing({ id: v.id, data: JSON.parse(JSON.stringify(v)) }),
                children: "\u7F16\u8F91"
              }
            ),
            v.secretKind === "plain" ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              import_dsh_client_ui_primitives6.Button,
              {
                variant: "ghost",
                size: "sm",
                disabled: busy,
                title: "\u660E\u6587\u8F6C\u5B58\u7CFB\u7EDF\u51ED\u636E\uFF0C\u6539\u5199\u4E3A $NAME \u5F15\u7528",
                onClick: () => void toCred(v.id),
                children: "\u5B58\u51ED\u636E"
              }
            ) : null,
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              import_dsh_client_ui_primitives6.Button,
              {
                variant: "ghost",
                size: "sm",
                disabled: busy,
                onClick: () => {
                  setAcked(false);
                  setConfirmDel(v);
                },
                children: "\u5220\u9664"
              }
            )
          ] })
        },
        "v:" + v.id
      )
    );
  });
  quotaKids.push(
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u4F9B\u5E94\u5546\uFF08" + vendors.length + "\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: styles_module_css_default.cardHint, style: { margin: "0 0 4px" }, children: "\u5BC6\u94A5\u5EFA\u8BAE\u586B $NAME \u5F15\u7528\uFF08\u5148\u5B58\u7CFB\u7EDF\u51ED\u636E\uFF0C\u914D\u7F6E\u6587\u4EF6\u91CC\u770B\u4E0D\u5230\u660E\u6587\uFF09\uFF1B\u76F4\u63A5\u586B\u660E\u6587\u4E5F\u4E0D\u4F1A\u88AB\u56DE\u663E\u3002\u300C\u7981\u7528\u300D\u53EA\u662F\u9000\u51FA\u5B9A\u65F6\u62C9\u53D6\uFF0C\u968F\u65F6\u53EF\u4EE5\u624B\u52A8\u300C\u62C9\u53D6\u300D\uFF0C\u4E5F\u53EF\u518D\u70B9\u300C\u542F\u7528\u300D\u6062\u590D\u3002" }),
      vrows
    ] }, "vendors")
  );
  if (editing)
    quotaKids.push(
      /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u7F16\u8F91 " + editing.id }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { className: styles_module_css_default.cardHint, style: { margin: "0 0 4px" }, children: "ID \u662F\u4E3B\u952E\uFF0C\u4E0D\u53EF\u4FEE\u6539\uFF1B\u5BC6\u94A5\u7559\u7A7A\u5373\u4FDD\u7559\u539F\u503C\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
          UI.VendorForm,
          {
            draft: editing.data,
            set: (nd) => setEditing({ id: editing.id, data: nd }),
            submitLabel: "\u4FDD\u5B58\u4FEE\u6539",
            busy,
            isEdit: true,
            onCancel: () => setEditing(null),
            onSubmit: () => void saveVendor(editing.data, true)
          }
        )
      ] }, "edit")
    );
  quotaKids.push(
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.sectionHead, children: "\u6DFB\u52A0\u4F9B\u5E94\u5546" }),
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
        UI.VendorForm,
        {
          draft,
          set: setDraft,
          submitLabel: "\u6DFB\u52A0",
          busy,
          onSubmit: () => void saveVendor(draft, false)
        }
      )
    ] }, "add")
  );
  if (confirmDel) {
    const target = confirmDel;
    if (import_dsh_client_ui_primitives6.RiskConfirmation) {
      quotaKids.push(
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
          import_dsh_client_ui_primitives6.RiskConfirmation,
          {
            open: true,
            title: "\u5220\u9664\u4F9B\u5E94\u5546\u300C" + target.name + "\u300D\uFF1F",
            description: "\u8BE5\u4F9B\u5E94\u5546\u7684\u914D\u7F6E\u4E0E\u4FA7\u8FB9\u680F\u5FEB\u7167\u5C06\u4E00\u5E76\u6E05\u9664\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002",
            acknowledgeLabel: "\u6211\u5DF2\u4E86\u89E3\uFF0C\u5220\u9664\u8BE5\u4F9B\u5E94\u5546",
            cancelLabel: "\u53D6\u6D88",
            closeLabel: "\u5173\u95ED",
            confirmLabel: "\u5220\u9664",
            acknowledged: acked,
            onAcknowledgedChange: setAcked,
            onCancel: () => setConfirmDel(null),
            onConfirm: () => {
              setConfirmDel(null);
              void delVendor(target.id);
            }
          },
          "confirm-del"
        )
      );
    } else {
      quotaKids.push(
        /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.errbox, children: [
          /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { children: "\u5220\u9664\u4F9B\u5E94\u5546\u300C" + target.name + "\u300D\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002" + (acked ? "" : "\u8BF7\u5148\u786E\u8BA4\u3002") }),
          /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 6 }, children: [
            acked ? /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              import_dsh_client_ui_primitives6.Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setConfirmDel(null);
                  setAcked(false);
                  void delVendor(target.id);
                },
                children: "\u786E\u8BA4\u5220\u9664"
              }
            ) : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_dsh_client_ui_primitives6.Button, { variant: "outline", size: "sm", onClick: () => setAcked(true), children: "\u6211\u5DF2\u4E86\u89E3" }),
            /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
              import_dsh_client_ui_primitives6.Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => {
                  setConfirmDel(null);
                  setAcked(false);
                },
                children: "\u53D6\u6D88"
              }
            )
          ] })
        ] }, "confirm-del")
      );
    }
  }
  const tabBtn = (id, label) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
    "button",
    {
      type: "button",
      className: cx6(styles_module_css_default.tab, tab === id ? styles_module_css_default.tabOn : void 0),
      onClick: () => setTab(id),
      children: label
    },
    id
  );
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.page, children: [
    commonKids,
    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: styles_module_css_default.tabs, children: [tabBtn("stats", "\u7EDF\u8BA1\u8BBE\u7F6E"), tabBtn("quota", "\u989D\u5EA6\u914D\u7F6E")] }),
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("p", { className: styles_module_css_default.intro, children: [
      tab === "stats" ? "\u7EDF\u8BA1\u8BBE\u7F6E\uFF1A\u6570\u636E\u6765\u6E90\u3001\u6D3E\u751F\u7F13\u5B58\u4E0E\u9ED8\u8BA4\u53E3\u5F84\u3002\u8BE6\u7EC6\u56FE\u8868\u5728\u4E2D\u5FC3\u533A\u300C" + DISPLAY_NAME + " \u2192 \u7528\u91CF\u7EDF\u8BA1 / \u5728\u7EBF\u7EDF\u8BA1\u300D\u3002" : "\u989D\u5EA6\u914D\u7F6E\uFF1A\u4F9B\u5E94\u5546\u4E0E\u62C9\u53D6\u504F\u597D\u3002\u989D\u5EA6\u663E\u793A\u5728\u5DE6\u4FA7\u8FB9\u680F\u5E95\u90E8\u7684\u989D\u5EA6\u6309\u94AE\u4E0A\uFF08\u70B9\u5F00\u662F\u4F7F\u7528\u8BE6\u60C5\u4E0E\u4F9B\u5E94\u5546\u5207\u6362\uFF09\u3002\u914D\u7F6E\u6301\u4E45\u5316\u5728 settings.yaml\uFF08",
      tab === "stats" ? null : /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("code", { className: styles_module_css_default.mono, children: s.namespace || "dshp-token-meter" }),
      tab === "stats" ? null : " \u547D\u540D\u7A7A\u95F4\uFF09\uFF0C\u5916\u90E8\u7F16\u8F91\u70ED\u91CD\u8F7D\u3002"
    ] }),
    tab === "stats" ? statsKids : quotaKids
  ] });
}
function StatsView() {
  const [prefs2, setPrefs] = (0, import_react11.useState)({
    showToday: false,
    defaultRange: "all"
  });
  const loadPrefs = async () => {
    try {
      const s = await fetchState();
      if (s.ok && s.config) {
        setPrefs({
          showToday: s.config.showToday === true,
          defaultRange: String(s.config.defaultRange || "all")
        });
      }
    } catch {
    }
  };
  (0, import_react11.useEffect)(() => {
    void loadPrefs();
    const fn = () => {
      void loadPrefs();
    };
    window.addEventListener("tm-prefs-changed", fn);
    return () => window.removeEventListener("tm-prefs-changed", fn);
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.page, children: [
    /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("div", { className: styles_module_css_default.toolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.hint, children: "\u5C0F\u7EC4\u4EF6" }),
      STATS_WIDGET_BTNS.map(([k, t]) => /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("span", { className: styles_module_css_default.widgetBtn, children: [
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { className: styles_module_css_default.widgetBtnLabel, children: t }),
        /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(widgets.WidgetToggle, { id: "stats:" + k })
      ] }, k))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(HiddenWhenFloated, { widgets, id: "stats:today", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(TodayCard, { wide: true, bare: true, name: "\u4ECA\u65E5\u6D88\u8017", widgets, widgetId: "stats:today" }) }),
    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
      StatsSettingsPage,
      {
        defaultRange: prefs2.defaultRange,
        showToday: prefs2.showToday,
        onPrefs: () => void loadPrefs(),
        showPrefs: false,
        widgets
      }
    )
  ] });
}
function renderFloatContent(id, withToggle) {
  const sep = id.indexOf(":");
  const prefix = sep >= 0 ? id.slice(0, sep) : "";
  const rest = sep >= 0 ? id.slice(sep + 1) : id;
  const w = withToggle ? { widgets, widgetId: id } : {};
  if (prefix === "stats") return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(StatsWidget, { kind: rest, ...w });
  return null;
}
function syncFloatWidgets() {
  widgets.syncRegistered(STATS_KINDS.map((kind) => ({ id: "stats:" + kind, title: STATS_TITLES[kind] })));
}
function WidgetFloatLayer() {
  const list = widgets.useWidgets();
  if (widgets.isBridged() || !list.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_jsx_runtime22.Fragment, { children: list.map((w) => /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(widgets.WidgetFloat, { id: w.id, children: renderFloatContent(w.id, true) }, w.id)) });
}
var QuotaSidebarAction = quota.QuotaSidebarAction;

// src/client/index.tsx
var CENTER_VIEW = "dshp-token-meter";
var CenterView = createCenterView(
  {
    StatsView,
    OnlineView,
    OnlineEmbed,
    // 与 设置 →「TokenMeter」是同一个组件：改一处两边同步
    SettingsView: TokenMeterSettings,
    SharePanel
  },
  { UsageIcon, OnlineIcon, SettingsIcon, ShareIcon }
);
var inject = ["slots"];
function apply(ctx) {
  const slots = ctx.get("slots");
  if (slots === void 0) return;
  try {
    if (widgetsApi && typeof widgetsApi.forget === "function") widgetsApi.forget("online:");
  } catch {
  }
  try {
    ctx.inject(["widgets"], (scope) => {
      if (!widgetsApi.attach(scope.get("widgets"))) {
        console.warn(
          "[dshp-token-meter] widgets \u670D\u52A1\u7684\u5F62\u72B6\u4E0D\u7B26\u5408\u5C0F\u7EC4\u4EF6\u89C4\u8303\uFF08spec v1\uFF09\uFF0C\u5C0F\u7EC4\u4EF6\u6539\u7528\u81EA\u5E26\u6D6E\u7A97\u6E32\u67D3\u3002"
        );
        return;
      }
      widgetsApi.setContentRenderer((id) => renderFloatContent(id, false));
      scope.effect(
        () => () => {
          widgetsApi.detach();
        },
        "dshp-token-meter: widget-kit bridge"
      );
      void quotaStore.ensureLoad().then(() => {
        syncFloatWidgets();
      }).catch(() => {
        syncFloatWidgets();
      });
      try {
        scope.effect(() => quotaStore.subscribe(() => syncFloatWidgets()), "dshp-token-meter: widget sync");
      } catch (error) {
        console.error("[dshp-token-meter] \u8BA2\u9605\u989D\u5EA6 store \u5931\u8D25\uFF08\u5C0F\u7EC4\u4EF6\u5217\u8868\u53EF\u80FD\u4E0D\u540C\u6B65\uFF09\uFF1A", error);
      }
    });
  } catch (error) {
    console.error("[dshp-token-meter] \u6302\u8F7D\u5C0F\u7EC4\u4EF6\u5BBF\u4E3B\u5931\u8D25\uFF0C\u7EDF\u8BA1\u5C0F\u7EC4\u4EF6\u6539\u7528\u81EA\u5E26\u6D6E\u7A97\u6E32\u67D3\uFF1A", error);
  }
  try {
    window.localStorage.removeItem("token-stats.sidebar-today");
    window.localStorage.removeItem("tquota.float.open");
    window.localStorage.removeItem("tquota.float.pos");
    window.localStorage.removeItem("tm-quota-float");
    window.localStorage.removeItem("tm-quota-float-pos");
    window.localStorage.removeItem("ts-today.float.open");
    window.localStorage.removeItem("ts-today.float.pos");
    window.localStorage.removeItem("tm-today.float.open");
    window.localStorage.removeItem("tm-today.float.pos");
    window.localStorage.removeItem("tm-righttabs-autoopened");
  } catch {
  }
  try {
    ctx.effect(
      () => slots.inject(
        "settings.section",
        () => slots.register(
          { name: "settings.section", id: "dshp-token-meter", order: 27, label: DISPLAY_NAME },
          TokenMeterSettings
        )
      ),
      "dshp-token-meter: settings section"
    );
  } catch (error) {
    console.error("[dshp-token-meter] \u6CE8\u518C\u8BBE\u7F6E\u8282\u5931\u8D25\uFF0C\u53EA\u80FD\u624B\u6539 settings.yaml \u6216\u770B\u4E2D\u5FC3\u533A\u9762\u677F\uFF1A", error);
  }
  try {
    ctx.effect(
      () => slots.inject(
        "sidebar.footer.action",
        () => slots.register(
          { name: "sidebar.footer.action", id: "dshp-token-meter", order: 10 },
          QuotaSidebarAction
        )
      ),
      "dshp-token-meter: sidebar quota action"
    );
  } catch (error) {
    console.error("[dshp-token-meter] \u6CE8\u518C\u4FA7\u8FB9\u680F\u989D\u5EA6\u6309\u94AE\u5931\u8D25\uFF0C\u989D\u5EA6\u53EA\u80FD\u5728\u8BBE\u7F6E\u9875\u91CC\u770B\uFF1A", error);
  }
  try {
    ctx.effect(
      () => slots.inject(
        "shell.overlay",
        () => slots.register({ name: "shell.overlay", id: "dshp-token-meter-float" }, WidgetFloatLayer)
      ),
      "dshp-token-meter: widget float layer"
    );
  } catch (error) {
    console.error("[dshp-token-meter] \u6CE8\u518C\u5C0F\u7EC4\u4EF6\u6D6E\u5C42\u5931\u8D25\uFF0C\u5DF2\u6709\u7684\u6D6E\u7A97\u8BB0\u5F55\u5C06\u65E0\u5904\u6E32\u67D3\uFF1A", error);
  }
  try {
    ctx.effect(
      () => slots.inject(
        "conversation.view",
        () => slots.register(
          { name: "conversation.view", id: CENTER_VIEW, order: 40, label: DISPLAY_NAME },
          CenterView
        )
      ),
      "dshp-token-meter: center view"
    );
  } catch (error) {
    console.error("[dshp-token-meter] \u6CE8\u518C\u4E2D\u5FC3\u533A tab \u5931\u8D25\uFF0C\u7528\u91CF/\u5728\u7EBF\u9762\u677F\u90FD\u770B\u4E0D\u4E86\uFF1A", error);
  }
}
return module.exports; } });
