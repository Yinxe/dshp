// src/host/cache.ts
var MAX_PER_SESSION = 20;
var MAX_SESSIONS = 50;
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function copyAttachment(value) {
  if (!isRecord(value)) return null;
  const attachmentId = value["attachmentId"];
  const mediaType = value["mediaType"];
  const bytes = value["bytes"];
  const width = value["width"];
  const height = value["height"];
  if (typeof attachmentId !== "string" || attachmentId.length === 0) return null;
  if (typeof mediaType !== "string" || mediaType.length === 0) return null;
  if (typeof bytes !== "number" || !Number.isFinite(bytes)) return null;
  if (typeof width !== "number" || typeof height !== "number") return null;
  const out = { attachmentId, mediaType, bytes, width, height };
  const name2 = value["name"];
  if (typeof name2 === "string" && name2.length > 0) out.name = name2.slice(0, 120);
  return out;
}
function walkBlocks(blocks, out) {
  if (!Array.isArray(blocks)) return;
  for (const block of blocks) {
    if (!isRecord(block)) continue;
    if (block["type"] === "image") {
      const copied = copyAttachment(block["attachment"]);
      if (copied) out.push(copied);
    } else if (block["type"] === "tool-result" && Array.isArray(block["content"])) {
      walkBlocks(block["content"], out);
    }
  }
}
function sessionIdOf(agent) {
  if (!isRecord(agent)) return void 0;
  const id = agent["id"];
  return typeof id === "string" && id.length > 0 ? id : void 0;
}
function createImageCache() {
  const sessions = /* @__PURE__ */ new Map();
  function push2(sessionId, refs) {
    if (sessionId.length === 0 || refs.length === 0) return;
    let images = sessions.get(sessionId);
    if (!images) {
      images = /* @__PURE__ */ new Map();
      sessions.set(sessionId, images);
    }
    for (const ref of refs) {
      images.delete(ref.attachmentId);
      images.set(ref.attachmentId, ref);
    }
    while (images.size > MAX_PER_SESSION) {
      const oldest = images.keys().next();
      if (oldest.done) break;
      images.delete(oldest.value);
    }
    while (sessions.size > MAX_SESSIONS) {
      const oldest = sessions.keys().next();
      if (oldest.done) break;
      sessions.delete(oldest.value);
    }
  }
  function get(sessionId) {
    const images = sessions.get(sessionId);
    if (!images) return [];
    sessions.delete(sessionId);
    sessions.set(sessionId, images);
    return [...images.values()];
  }
  return { push: push2, get };
}

// ../../node_modules/.pnpm/@deepseek-ai+cosmokit@1.8.5/node_modules/@deepseek-ai/cosmokit/lib/index.js
function isNullable(value) {
  return value === null || value === void 0;
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function filterKeys(object, filter) {
  return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function pick(source, keys, forced) {
  if (!keys) return { ...source };
  const result = {};
  for (const key of keys) if (source[key] !== void 0) result[key] = source[key];
  return result;
}
var write = /* @__PURE__ */ Symbol.for("cosmokit.volatile.write");
function snapshot(value, ancestors = /* @__PURE__ */ new Set()) {
  if (typeof value === "function") throw new TypeError("volatile config cannot contain functions");
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) throw new TypeError("volatile config cannot contain cycles");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return Object.freeze(value.map((item) => snapshot(item, ancestors)));
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new TypeError("volatile config objects must be plain objects or arrays");
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item, ancestors)])));
  } finally {
    ancestors.delete(value);
  }
}
function createVolatile(value) {
  let current = snapshot(value);
  return Object.freeze({
    get: () => current,
    [write]: (value2) => {
      current = value2;
    }
  });
}
function isVolatile(value) {
  return typeof value === "object" && value !== null && write in value;
}
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
(function(Binary2) {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    else return source;
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
Binary.fromBase64;
Binary.toBase64;
Binary.fromHex;
Binary.toHex;
function clone(source, refs = /* @__PURE__ */ new Map()) {
  if (!source || typeof source !== "object") return source;
  if (is("Date", source)) return new Date(source.valueOf());
  if (is("RegExp", source)) return new RegExp(source.source, source.flags);
  if (isArrayBufferLike(source)) return source.slice(0);
  if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const cached = refs.get(source);
  if (cached) return cached;
  if (Array.isArray(source)) {
    const result2 = [];
    refs.set(source, result2);
    source.forEach((value, index) => {
      result2[index] = Reflect.apply(clone, null, [value, refs]);
    });
    return result2;
  }
  const result = Object.create(Object.getPrototypeOf(source));
  refs.set(source, result);
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
    if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
    Reflect.defineProperty(result, key, descriptor);
  }
  return result;
}
function deepEqual(a, b, strict) {
  const ancestors = /* @__PURE__ */ new Set();
  function compare(a2, b2) {
    if (a2 === b2) return true;
    if (isVolatile(a2) || isVolatile(b2)) return isVolatile(a2) && isVolatile(b2);
    if (!strict && isNullable(a2) && isNullable(b2)) return true;
    if (typeof a2 !== typeof b2 || typeof a2 !== "object" || !a2 || !b2) return false;
    if (ancestors.has(a2)) return false;
    function check(test, then) {
      return test(a2) ? test(b2) ? then(a2, b2) : false : test(b2) ? false : void 0;
    }
    ancestors.add(a2);
    try {
      return check(Array.isArray, (a3, b3) => {
        if (a3.length !== b3.length) return false;
        for (let index = 0; index < a3.length; index++) if (!compare(a3[index], b3[index])) return false;
        return true;
      }) ?? check(is("Date"), (a3, b3) => a3.valueOf() === b3.valueOf()) ?? check(is("URL"), (a3, b3) => a3.href === b3.href) ?? check(is("RegExp"), (a3, b3) => a3.source === b3.source && a3.flags === b3.flags) ?? check(isArrayBufferLike, (a3, b3) => {
        if (a3.byteLength !== b3.byteLength) return false;
        const viewA = new Uint8Array(a3);
        const viewB = new Uint8Array(b3);
        for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
        return true;
      }) ?? ((!strict || [a2, b2].every((value) => Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) && Object.keys({
        ...a2,
        ...b2
      }).every((key) => compare(a2[key], b2[key])));
    } finally {
      ancestors.delete(a2);
    }
  }
  return compare(a, b);
}
var Time;
(function(Time2) {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date2 = /* @__PURE__ */ new Date(), offset) {
    if (typeof date2 === "number") date2 = new Date(date2);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date2.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date2 = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date2 + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date2) {
    const parsed = parseTime(date2);
    if (parsed) date2 = Date.now() + parsed;
    else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date2}`;
    else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date2}`;
    return date2 ? new Date(date2) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) return Math.round(ms / Time2.day) + "d";
    else if (abs >= Time2.hour - Time2.minute / 2) return Math.round(ms / Time2.hour) + "h";
    else if (abs >= Time2.minute - Time2.second / 2) return Math.round(ms / Time2.minute) + "m";
    else if (abs >= Time2.second) return Math.round(ms / Time2.second) + "s";
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// ../../node_modules/.pnpm/@deepseek-ai+schemastery@3.18.4/node_modules/@deepseek-ai/schemastery/lib/index.mjs
var kSchema = /* @__PURE__ */ Symbol.for("schemastery");
var kValidationError = /* @__PURE__ */ Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
  options;
  name = "ValidationError";
  constructor(message, options) {
    let prefix = "$";
    for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
    else if (typeof segment === "number") prefix += "[" + segment + "]";
    else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
    if (prefix.startsWith(".")) prefix = prefix.slice(1);
    super((prefix === "$" ? "" : `${prefix} `) + message);
    this.options = options;
  }
  static is(error) {
    return !!error?.[kValidationError];
  }
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
var Schema = function(options) {
  const schema = function(data, options2 = {}) {
    return Schema.resolve(data, schema, options2)[0];
  };
  if (options.refs) {
    const refs = mapValues(options.refs, (options2) => new Schema(options2));
    const getRef = (uid) => refs[uid];
    for (const key in refs) {
      const options2 = refs[key];
      options2.sKey = getRef(options2.sKey);
      options2.inner = getRef(options2.inner);
      options2.list = options2.list && options2.list.map(getRef);
      options2.dict = options2.dict && mapValues(options2.dict, getRef);
    }
    return refs[options.uid];
  }
  Object.assign(schema, options);
  if (typeof schema.callback === "string") try {
    schema.callback = new Function("return " + schema.callback)();
  } catch {
  }
  Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
  Object.setPrototypeOf(schema, Schema.prototype);
  schema.meta ||= {};
  schema.toString = schema.toString.bind(schema);
  return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
  return {
    version: 1,
    vendor: "schemastery",
    validate: (value) => {
      try {
        return { value: Schema.resolve(value, this, {})[0] };
      } catch (error) {
        if (ValidationError.is(error)) return { issues: [{
          message: error.message,
          path: error.options.path
        }] };
        throw error;
      }
    }
  };
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
  if (globalThis.__schemastery_refs__) {
    globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
    return this.uid;
  }
  globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
  globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
  const result = {
    uid: this.uid,
    refs: globalThis.__schemastery_refs__
  };
  globalThis.__schemastery_refs__ = void 0;
  return result;
};
Schema.prototype.set = function set(key, value) {
  this.dict[key] = value;
  return this;
};
Schema.prototype.push = function push(value) {
  this.list.push(value);
  return this;
};
function mergeDesc(original, messages) {
  const result = typeof original === "string" ? { "": original } : { ...original };
  for (const locale in messages) {
    const value = messages[locale];
    if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
    else if (typeof value === "string") result[locale] = value;
  }
  return result;
}
function getInner(value) {
  return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
  return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
  const schema = Schema(this);
  const desc = mergeDesc(schema.meta.description, messages);
  if (Object.keys(desc).length) schema.meta.description = desc;
  if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
    return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
  });
  if (schema.list) schema.list = schema.list.map((inner, index) => {
    return inner.i18n(mapValues(messages, (data = {}) => {
      if (Array.isArray(getInner(data))) return getInner(data)[index];
      if (Array.isArray(data)) return data[index];
      return extractKeys(data);
    }));
  });
  if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
    if (getInner(data)) return getInner(data);
    return extractKeys(data);
  }));
  if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
  return schema;
};
Schema.prototype.extra = function extra(key, value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
};
for (const key of [
  "required",
  "disabled",
  "collapse",
  "hidden",
  "loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
Schema.prototype.deprecated = function deprecated() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({
    text: "deprecated",
    type: "danger"
  });
  return schema;
};
Schema.prototype.experimental = function experimental() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({
    text: "experimental",
    type: "warning"
  });
  return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
  const schema = Schema(this);
  const pattern2 = pick(regexp, ["source", "flags"]);
  schema.meta = {
    ...schema.meta,
    pattern: pattern2
  };
  return schema;
};
Schema.prototype.simplify = function simplify(value) {
  if (isVolatile(value)) value = value.get();
  if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
  if (isNullable(value)) return value;
  if (this.type === "object" || this.type === "dict") {
    const result = {};
    for (const key in value) {
      const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
      if (this.type === "dict" || !isNullable(item)) result[key] = item;
    }
    if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
    return result;
  } else if (this.type === "array" || this.type === "tuple") {
    const result = [];
    value.forEach((value2, index) => {
      const schema = this.type === "array" ? this.inner : this.list[index];
      const item = schema ? schema.simplify(value2) : value2;
      result.push(item);
    });
    return result;
  } else if (this.type === "intersect") {
    const result = {};
    for (const item of this.list) Object.assign(result, item.simplify(value));
    return result;
  } else if (this.type === "union") for (const schema of this.list) try {
    Schema.resolve(value, schema, {});
    return schema.simplify(value);
  } catch {
  }
  return value;
};
Schema.prototype.toString = function toString(inline) {
  return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra2) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    role,
    extra: extra2
  };
  return schema;
};
for (const key of [
  "default",
  "link",
  "comment",
  "description",
  "max",
  "min",
  "step"
]) Object.assign(Schema.prototype, { [key](value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
Schema.prototype.volatile = function volatile() {
  if (this.meta.volatile) throw new TypeError("volatile schema is already wrapped");
  return this.extra("volatile", true);
};
var resolvers = {};
var checkedVolatile = /* @__PURE__ */ Symbol("checked-volatile-schema");
function validateVolatileSchema(schema, path = [], blocked = false, seen = /* @__PURE__ */ new Map()) {
  const states = seen.get(schema) ?? /* @__PURE__ */ new Set();
  if (states.has(blocked)) return;
  states.add(blocked);
  seen.set(schema, states);
  if (schema.meta?.volatile && blocked) throw new ValidationError("volatile fields require a fixed object path without an enclosing volatile field", { path });
  const nested = blocked || !!schema.meta?.volatile;
  if (schema.dict) for (const [key, child] of Object.entries(schema.dict)) validateVolatileSchema(child, [...path, key], nested, seen);
  if (schema.sKey) validateVolatileSchema(schema.sKey, [...path, "<key>"], true, seen);
  if (schema.inner && (schema.type !== "lazy" || schema.inner[kSchema])) validateVolatileSchema(schema.inner, [...path, "*"], true, seen);
  if (schema.list) for (let index = 0; index < schema.list.length; index++) validateVolatileSchema(schema.list[index], [...path, String(index)], true, seen);
}
Schema.extend = function extend(type, resolve2) {
  resolvers[type] = resolve2;
};
Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
  if (!schema) return [data];
  if (!options[checkedVolatile]) {
    validateVolatileSchema(schema, options.path);
    options = {
      ...options,
      [checkedVolatile]: true
    };
  }
  if (schema.meta?.volatile) {
    const inner = Schema(schema);
    inner.meta = {
      ...schema.meta,
      volatile: false
    };
    const [value, adapted] = Schema.resolve(data, inner, options, strict);
    try {
      return [createVolatile(value), adapted];
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : String(error), options);
    }
  }
  if (options.ignore?.(data, schema)) return [data];
  if (isNullable(data) && schema.type !== "lazy") {
    if (schema.meta.required) throw new ValidationError(`missing required value`, options);
    let current = schema;
    let fallback = schema.meta.default;
    while (current?.type === "intersect" && isNullable(fallback)) {
      current = current.list[0];
      fallback = current?.meta.default;
    }
    if (isNullable(fallback)) return [data];
    data = clone(fallback);
  }
  const callback = resolvers[schema.type];
  if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
  try {
    return callback(data, schema, options, strict);
  } catch (error) {
    if (!schema.meta.loose) throw error;
    return [schema.meta.default];
  }
};
Schema.from = function from(source) {
  if (isNullable(source)) return Schema.any();
  else if ([
    "string",
    "number",
    "boolean"
  ].includes(typeof source)) return Schema.const(source).required();
  else if (source[kSchema]) return source;
  else if (typeof source === "function") switch (source) {
    case String:
      return Schema.string().required();
    case Number:
      return Schema.number().required();
    case Boolean:
      return Schema.boolean().required();
    case Function:
      return Schema.function().required();
    default:
      return Schema.is(source).required();
  }
  else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
  const toJSON2 = () => {
    if (!schema.inner[kSchema]) {
      schema.inner = schema.builder();
      schema.inner.meta = {
        ...schema.meta,
        ...schema.inner.meta
      };
    }
    return schema.inner.toJSON();
  };
  const schema = new Schema({
    type: "lazy",
    builder,
    inner: { toJSON: toJSON2 }
  });
  return schema;
};
Schema.natural = function natural() {
  return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
  return Schema.number().step(0.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
  return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
    const date2 = new Date(value);
    if (isNaN(+date2)) throw new ValidationError(`invalid date "${value}"`, options);
    return date2;
  }, true)]);
};
Schema.regExp = function regExp(flag = "") {
  return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
    try {
      return new RegExp(value, flag);
    } catch (e) {
      throw new ValidationError(e.message, options);
    }
  }, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
  return Schema.union([
    Schema.is(ArrayBuffer),
    Schema.is(SharedArrayBuffer),
    Schema.transform(Schema.any(), (value, options) => {
      if (Binary.isSource(value)) return Binary.fromSource(value);
      throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
    }, true),
    ...encoding ? [Schema.transform(Schema.string(), (value, options) => {
      try {
        return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
      } catch (e) {
        throw new ValidationError(e.message, options);
      }
    }, true)] : []
  ]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
  if (!schema.inner[kSchema]) {
    schema.inner = schema.builder();
    schema.inner.meta = {
      ...schema.meta,
      ...schema.inner.meta
    };
    validateVolatileSchema(schema.inner, options.path, true);
  }
  return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
  return [data];
});
Schema.extend("never", (data, _, options) => {
  throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
  if (deepEqual(data, value)) return [value];
  throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
  const { max = Infinity, min = -Infinity } = meta;
  if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
  if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
  if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
  if (meta.pattern) {
    const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
    if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
  }
  checkWithinRange(data.length, meta, "string length", options);
  return [data];
});
function decimalShift(data, digits) {
  const str = data.toString();
  if (str.includes("e")) return data * Math.pow(10, digits);
  const index = str.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str.slice(index + 1);
  const integer = str.slice(0, index);
  if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
  return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
  step = Math.abs(step);
  if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
  const index = step.toString().indexOf(".");
  const digits = step.toString().slice(index + 1).length;
  return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
  if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
  checkWithinRange(data, meta, "number", options);
  const { step } = meta;
  if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
  return [data];
});
Schema.extend("boolean", (data, _, options) => {
  if (typeof data === "boolean") return [data];
  throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
  let value = 0, keys = [];
  if (typeof data === "number") {
    value = data;
    for (const key in bits) if (data & bits[key]) keys.push(key);
  } else if (Array.isArray(data)) {
    keys = data;
    for (const key of keys) {
      if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
      if (key in bits) value |= bits[key];
    }
  } else throw new ValidationError(`expected number or array but got ${data}`, options);
  if (value === meta.default) return [value];
  return [value, keys];
});
Schema.extend("function", (data, _, options) => {
  if (typeof data === "function") return [data];
  throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
  if (typeof constructor === "function") {
    if (data instanceof constructor) return [data];
    throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
  } else {
    if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
    let prototype = Object.getPrototypeOf(data);
    while (prototype) {
      if (prototype.constructor?.name === constructor) return [data];
      prototype = Object.getPrototypeOf(prototype);
    }
    throw new ValidationError(`expected ${constructor} but got ${data}`, options);
  }
});
function property(data, key, schema, options) {
  try {
    const [value, adapted] = Schema.resolve(data[key], schema, {
      ...options,
      path: [...options.path || [], key]
    });
    if (adapted !== void 0) data[key] = adapted;
    return value;
  } catch (e) {
    if (!options?.autofix) throw e;
    delete data[key];
    return schema.meta.volatile ? createVolatile(schema.meta.default) : schema.meta.default;
  }
}
Schema.extend("array", (data, { inner, meta }, options) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
  return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in data) {
    let rKey;
    try {
      rKey = Schema.resolve(key, sKey, options)[0];
    } catch (error) {
      if (strict) continue;
      throw error;
    }
    result[rKey] = property(data, key, inner, options);
    data[rKey] = data[key];
    if (key !== rKey) delete data[key];
  }
  return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  const result = list.map((inner, index) => property(data, index, inner, options));
  if (strict) return [result];
  result.push(...data.slice(list.length));
  return [result];
});
function merge(result, data) {
  for (const key in data) {
    if (key in result) continue;
    result[key] = data[key];
  }
}
Schema.extend("object", (data, { dict }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in dict) {
    const value = property(data, key, dict[key], options);
    if (!isNullable(value) || key in data) result[key] = value;
  }
  if (!strict) merge(result, data);
  return [result];
});
Schema.extend("union", (data, { list, toString: toString2 }, options, strict) => {
  for (const inner of list) try {
    return Schema.resolve(data, inner, options, strict);
  } catch (error) {
  }
  throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString: toString2 }, options, strict) => {
  if (!list.length) return [data];
  let result;
  for (const inner of list) {
    const value = Schema.resolve(data, inner, options, true)[0];
    if (isNullable(value)) continue;
    if (isNullable(result)) result = value;
    else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
    else if (typeof value === "object") merge(result ??= {}, value);
    else if (result !== value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
  }
  if (!strict && isPlainObject(data)) merge(result, data);
  return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
  const [result, adapted = data] = Schema.resolve(data, inner, options, true);
  if (preserve) return [callback(result)];
  else return [callback(result), callback(adapted)];
});
var formatters = {};
function defineMethod(name2, keys, format) {
  formatters[name2] = format;
  Object.assign(Schema, { [name2](...args) {
    const schema = new Schema({ type: name2 });
    keys.forEach((key, index) => {
      switch (key) {
        case "sKey":
          schema.sKey = args[index] ?? Schema.string();
          break;
        case "inner":
          schema.inner = Schema.from(args[index]);
          break;
        case "list":
          schema.list = args[index].map(Schema.from);
          break;
        case "dict":
          schema.dict = mapValues(args[index], Schema.from);
          break;
        case "bits":
          schema.bits = {};
          for (const key2 in args[index]) {
            if (typeof args[index][key2] !== "number") continue;
            schema.bits[key2] = args[index][key2];
          }
          break;
        case "callback": {
          const callback = schema.callback = args[index];
          callback["toJSON"] ||= () => callback.toString();
          break;
        }
        case "constructor": {
          const constructor = schema.constructor = args[index];
          if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
          break;
        }
        default:
          schema[key] = args[index];
      }
    });
    if (name2 === "object" || name2 === "dict") schema.meta.default = {};
    else if (name2 === "array" || name2 === "tuple") schema.meta.default = [];
    else if (name2 === "bitset") schema.meta.default = 0;
    return schema;
  } });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
  if (typeof constructor === "function") return constructor.name;
  else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
  if (Object.keys(dict).length === 0) return "{}";
  return `{ ${Object.entries(dict).map(([key, inner]) => {
    return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
  }).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
  const result = list.map(({ toString: format }) => format()).join(" | ");
  return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
  return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
  "inner",
  "callback",
  "preserve"
], ({ inner }, isInner) => inner.toString(isInner));

// src/host/config.ts
var NS = "dshp-vision-bridge";
var RouteSchema = Schema.object({
  provider: Schema.string().required(),
  model: Schema.string().required()
});
var ConfigSchema = Schema.object({
  enabled: Schema.boolean().default(true).volatile(),
  primary: Schema.union([RouteSchema, Schema.const(null)]).default(null).volatile(),
  fallback: Schema.union([RouteSchema, Schema.const(null)]).default(null).volatile()
});

// src/host/http.ts
function json(res, status, value) {
  if (res.writableEnded) return;
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(value));
}
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (origin === void 0) return true;
  if (typeof origin !== "string") return false;
  const host = req.headers.host;
  if (typeof host !== "string" || host.length === 0) return false;
  return origin === `http://${host}` || origin === `https://${host}`;
}
function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve2, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
      try {
        req.destroy();
      } catch {
      }
    };
    req.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        fail(new Error("payload-too-large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve2(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", (error) => fail(error));
  });
}

// src/host/vision.ts
function isRecord2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function displayName(value, fallback) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
function getPath(value, path) {
  let current = value;
  for (const key of path) {
    if (!isRecord2(current)) return void 0;
    current = current[key];
  }
  return current;
}
function imageModalities(value) {
  const modalities = isRecord2(value) ? value["input"] : void 0;
  if (Array.isArray(modalities)) return modalities;
  const fallback = isRecord2(value) ? value["inputModalities"] : void 0;
  return Array.isArray(fallback) ? fallback : null;
}
function modelsFromSettings(settings, llm) {
  if (typeof llm.listConfigurableProviders !== "function") return [];
  let entries;
  try {
    entries = llm.listConfigurableProviders();
  } catch {
    return [];
  }
  if (!Array.isArray(entries) || entries.length === 0) return [];
  let descriptors;
  try {
    descriptors = settings.describe({ redactSecrets: true });
  } catch {
    return [];
  }
  if (!Array.isArray(descriptors)) return [];
  const out = [];
  for (const entry of entries) {
    if (!isRecord2(entry)) continue;
    const provider = entry["provider"];
    const ns = entry["settingsNs"];
    const path = entry["settingsPath"];
    if (typeof provider !== "string" || typeof ns !== "string" || !Array.isArray(path)) continue;
    const descriptor = descriptors.find((item) => isRecord2(item) && item["ns"] === ns);
    if (!isRecord2(descriptor)) continue;
    const keys = path.filter((key) => typeof key === "string");
    const profile = getPath(descriptor["value"], keys);
    if (!isRecord2(profile) || !Array.isArray(profile["models"])) continue;
    for (const model of profile["models"]) {
      if (!isRecord2(model)) continue;
      const id = model["id"];
      if (typeof id !== "string" || id.length === 0) continue;
      const modalities = imageModalities(model);
      if (!modalities || !modalities.includes("image")) continue;
      out.push({ provider, model: id, name: displayName(model["name"], id) });
    }
  }
  return out;
}
async function modelsFromRuntime(llm) {
  let providers;
  try {
    providers = llm.listProviders();
  } catch {
    return [];
  }
  if (!Array.isArray(providers)) return [];
  const groups = await Promise.all(
    providers.map(async (provider) => {
      if (!isRecord2(provider)) return [];
      const providerId = provider["id"];
      if (typeof providerId !== "string" || providerId.length === 0) return [];
      let models;
      try {
        models = await llm.listModels(providerId);
      } catch {
        return [];
      }
      if (!Array.isArray(models)) return [];
      const out = [];
      for (const info2 of models) {
        if (!isRecord2(info2)) continue;
        const id = info2["id"];
        if (typeof id !== "string" || id.length === 0) continue;
        const modalities = imageModalities(info2);
        if (!modalities || !modalities.includes("image")) continue;
        const owner = typeof info2["provider"] === "string" ? info2["provider"] : providerId;
        out.push({ provider: owner, model: id, name: displayName(info2["name"], id) });
      }
      return out;
    })
  );
  return groups.flat();
}
async function listVisionModels(ctx) {
  const llm = ctx.get("llm");
  if (!llm) return [];
  const settings = ctx.get("settings");
  const merged = /* @__PURE__ */ new Map();
  const add = (model) => {
    const key = model.provider + "\0" + model.model;
    if (!merged.has(key)) merged.set(key, model);
  };
  if (settings) for (const model of modelsFromSettings(settings, llm)) add(model);
  for (const model of await modelsFromRuntime(llm)) add(model);
  const models = [...merged.values()];
  models.sort((a, b) => compareText(a.provider, b.provider) || compareText(a.model, b.model));
  return models;
}
function sameRoute(a, b) {
  return a !== null && b !== null && a.provider === b.provider && a.model === b.model;
}
async function runOneVision(llm, route, images, question, signal, sessionId) {
  const content = [];
  for (const image of images) content.push({ type: "image", attachment: image });
  content.push({ type: "text", text: question });
  const options = {
    provider: route.provider,
    model: route.model,
    messages: [{ role: "user", content }]
  };
  if (sessionId) options["sessionId"] = sessionId;
  if (signal) options["signal"] = signal;
  let text = "";
  const deltaBlocks = /* @__PURE__ */ new Set();
  const endBlocks = /* @__PURE__ */ new Set();
  for await (const chunk of llm.stream(options)) {
    if (!isRecord2(chunk)) continue;
    const type = chunk["type"];
    if (type === "text-delta" && typeof chunk["text"] === "string") {
      text += chunk["text"];
      if (typeof chunk["index"] === "number") deltaBlocks.add(chunk["index"]);
    } else if (type === "block-end" && isRecord2(chunk["block"]) && chunk["block"]["type"] === "text" && typeof chunk["block"]["text"] === "string") {
      const index = typeof chunk["index"] === "number" ? chunk["index"] : -1;
      if (!deltaBlocks.has(index) && !endBlocks.has(index)) {
        text += chunk["block"]["text"];
        endBlocks.add(index);
      }
    } else if (type === "finish" && isRecord2(chunk["reason"])) {
      const kind = chunk["reason"]["kind"];
      if (kind === "error" || kind === "aborted") {
        const failure = chunk["reason"]["failure"];
        const message = isRecord2(failure) && typeof failure["message"] === "string" ? failure["message"] : kind === "aborted" ? "\u89C6\u89C9\u6A21\u578B\u8C03\u7528\u88AB\u4E2D\u6B62" : "\u89C6\u89C9\u6A21\u578B\u8C03\u7528\u5931\u8D25";
        throw new Error(message.slice(0, 500));
      }
    }
  }
  if (signal?.aborted) throw new Error("\u89C6\u89C9\u6A21\u578B\u8C03\u7528\u88AB\u4E2D\u6B62");
  const result = text.trim();
  if (!result) throw new Error("\u89C6\u89C9\u6A21\u578B\u8FD4\u56DE\u4E3A\u7A7A");
  return result;
}
async function describeWithFallback(ctx, cfg, images, question, signal, sessionId) {
  const llm = ctx.get("llm");
  if (!llm) throw new Error("\u5F53\u524D\u73AF\u5883\u6CA1\u6709\u53EF\u7528\u7684 llm \u670D\u52A1");
  const routes = [];
  if (cfg.primary) routes.push(cfg.primary);
  if (cfg.fallback && !sameRoute(cfg.fallback, cfg.primary)) routes.push(cfg.fallback);
  if (routes.length === 0) {
    const models = await listVisionModels(ctx);
    const first = models[0];
    if (!first) {
      throw new Error(
        "\u6CA1\u6709\u53EF\u7528\u7684\u89C6\u89C9\u6A21\u578B\uFF1A\u8BF7\u5728 \u8BBE\u7F6E \u2192 \u6A21\u578B \u4E2D\u4E3A\u591A\u6A21\u6001\u6A21\u578B\u52FE\u9009 image \u8F93\u5165\uFF0C\u6216\u5728 \u8BBE\u7F6E \u2192 \u89C6\u89C9\u6A21\u578B \u4E2D\u9009\u62E9\u4E3B\u6A21\u578B"
      );
    }
    routes.push({ provider: first.provider, model: first.model });
  }
  let lastError;
  for (const route of routes) {
    if (signal?.aborted) throw new Error("\u89C6\u89C9\u6A21\u578B\u8C03\u7528\u88AB\u4E2D\u6B62");
    try {
      return { text: await runOneVision(llm, route, images, question, signal, sessionId), route };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("\u89C6\u89C9\u6A21\u578B\u8C03\u7528\u5931\u8D25");
}

// src/host/index.ts
var name = "@dshp/vision-bridge";
var inject = ["tools", "webServer", "llm"];
var Config = ConfigSchema;
var MAX_IMAGES = 4;
var MAX_QUESTION = 4e3;
var MAX_BODY = 64 * 1024;
var ROUTE_PREFIX = "/ext/dshp-vision-bridge";
function isRecord3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function warn(message, error) {
  try {
    const reason = error === void 0 ? "" : "\uFF1A" + errorMessage(error);
    console.warn("[dshp-vision-bridge] " + message + reason);
  } catch {
  }
}
function info(message) {
  try {
    console.info("[dshp-vision-bridge] " + message);
  } catch {
  }
}
function apply(ctx, config) {
  ctx.inject(["settings"], (sctx) => {
    try {
      sctx.effect(
        () => sctx.settings.configure({ auto: false }, ctx.fiber),
        "dshp-vision-bridge: settings page"
      );
    } catch (error) {
      warn("settings \u9875\u9762\u7B56\u7565\u6CE8\u518C\u5931\u8D25", error);
    }
  });
  function getConfig() {
    const primary = config.primary.get();
    const fallback = config.fallback.get();
    return {
      enabled: config.enabled.get() === true,
      primary: primary ? { provider: primary.provider, model: primary.model } : null,
      fallback: fallback ? { provider: fallback.provider, model: fallback.model } : null
    };
  }
  function bridgeArmed() {
    const current = getConfig();
    return current.enabled && current.primary !== null;
  }
  async function updateConfig(patch) {
    const settings = ctx.get("settings");
    if (!settings) throw new Error("settings \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u914D\u7F6E");
    await settings.update(NS, patch);
  }
  const images = createImageCache();
  try {
    ctx.effect(
      () => ctx.on("agent/inbox/inserted", (payload) => {
        try {
          if (!isRecord3(payload)) return;
          const sessionId = sessionIdOf(payload["agent"]);
          const message = payload["message"];
          if (!sessionId || !isRecord3(message)) return;
          const found = [];
          walkBlocks(message["content"], found);
          if (found.length > 0) images.push(sessionId, found);
        } catch {
        }
      }),
      "dshp-vision-bridge: cache inbox images"
    );
  } catch (error) {
    warn("\u6CE8\u518C inbox \u56FE\u7247\u7F13\u5B58\u5931\u8D25", error);
  }
  try {
    ctx.effect(
      () => ctx.on("llm/stream", (options, next) => {
        try {
          if (isRecord3(options)) {
            const sessionId = options["sessionId"];
            const messages = options["messages"];
            if (typeof sessionId === "string" && Array.isArray(messages)) {
              const found = [];
              for (const message of messages) {
                if (isRecord3(message)) walkBlocks(message["content"], found);
              }
              if (found.length > 0) images.push(sessionId, found);
            }
          }
        } catch {
        }
        return next();
      }),
      "dshp-vision-bridge: cache stream images"
    );
  } catch (error) {
    warn("\u6CE8\u518C stream \u56FE\u7247\u7F13\u5B58\u5931\u8D25", error);
  }
  const llm = ctx.get("llm");
  const originalResolve = llm?.resolveModelInfo;
  if (llm && typeof originalResolve === "function") {
    const patchedResolve = async (provider, model, signal) => {
      const result = await originalResolve.call(llm, provider, model, signal);
      if (!bridgeArmed() || !isRecord3(result)) return result;
      const modalities = result["inputModalities"];
      if (!Array.isArray(modalities) || modalities.includes("image")) return result;
      return { ...result, inputModalities: [...modalities, "image"] };
    };
    try {
      llm.resolveModelInfo = patchedResolve;
      ctx.effect(
        () => () => {
          try {
            if (llm.resolveModelInfo === patchedResolve) llm.resolveModelInfo = originalResolve;
          } catch {
          }
        },
        "dshp-vision-bridge: admission takeover"
      );
      info("\u53D1\u9001\u95E8\u7981\u5DF2\u63A5\u7BA1\uFF1A\u542F\u7528\u5E76\u9009\u597D\u4E3B\u6A21\u578B\u540E\uFF0C\u7EAF\u6587\u672C\u6A21\u578B\u53EF\u76F4\u63A5\u53D1\u9001\u56FE\u7247");
    } catch (error) {
      warn("\u63A5\u7BA1\u53D1\u9001\u95E8\u7981\u5931\u8D25", error);
    }
  } else {
    warn("llm \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u53D1\u9001\u95E8\u7981\u672A\u63A5\u7BA1");
  }
  try {
    const systemPrompt = ctx.get("systemPrompt");
    if (systemPrompt && typeof systemPrompt.section === "function") {
      ctx.effect(
        () => systemPrompt.section({
          name: "dshp-vision-bridge",
          order: 80,
          text: "\u89C6\u89C9\u80FD\u529B\uFF1A\u4F60\u662F\u7EAF\u6587\u672C\u6A21\u578B\uFF0C\u4E0D\u80FD\u76F4\u63A5\u770B\u56FE\u3002\u7528\u6237\u6D88\u606F\u91CC\u51FA\u73B0\u201C[image omitted because this model accepts text only; attachment sha256:\u2026]\u201D\u5360\u4F4D\u7B26\u65F6\uFF0C\u8BF4\u660E\u672C\u8F6E\u6709\u56FE\u7247\uFF0C\u5FC5\u987B\u8C03\u7528 vision_describe \u83B7\u53D6\u5185\u5BB9\uFF0C\u4E0D\u8981\u731C\u6D4B\u56FE\u7247\u5185\u5BB9\uFF0C\u4E5F\u4E0D\u8981\u8BA9\u7528\u6237\u6362\u6A21\u578B\u3002question \u7531\u4F60\u7ED3\u5408\u5F53\u524D\u5BF9\u8BDD\u4E0A\u4E0B\u6587\u751F\u6210\uFF0C\u5199\u6E05\u4F60\u771F\u6B63\u60F3\u4ECE\u56FE\u7247\u786E\u8BA4\u7684\u5177\u4F53\u5185\u5BB9\uFF08\u4F8B\u5982\u67D0\u884C\u62A5\u9519\u3001\u67D0\u4E2A\u6309\u94AE\u3001\u67D0\u6BB5\u6587\u5B57\uFF09\uFF0C\u4E0D\u8981\u53EA\u5199\u201C\u63CF\u8FF0\u8FD9\u5F20\u56FE\u7247\u201D\u3002\u63D2\u4EF6\u4F1A\u628A question \u539F\u6837\u53D1\u7ED9\u89C6\u89C9\u6A21\u578B\uFF0C\u4E0D\u8FFD\u52A0\u56FA\u5B9A\u63D0\u793A\u8BCD\u3002\u591A\u56FE\u65F6\u53EF\u7528 image \u6307\u5B9A\u4ECE 1 \u5F00\u59CB\u7684\u5E8F\u53F7\u3002\u6CA1\u6709\u5360\u4F4D\u7B26\u65F6\u4E0D\u8981\u8C03\u7528\u3002\u5DE5\u5177\u4F1A\u81EA\u52A8\u4F7F\u7528\u8BBE\u7F6E \u2192 \u89C6\u89C9\u6A21\u578B \u4E2D\u7684\u4E3B\u6A21\u578B\uFF0C\u5931\u8D25\u65F6\u7528\u5907\u7528\u6A21\u578B\u91CD\u8BD5\u3002"
        }),
        "dshp-vision-bridge: prompt section"
      );
    }
  } catch (error) {
    warn("\u6CE8\u518C\u7CFB\u7EDF\u63D0\u793A\u5931\u8D25", error);
  }
  try {
    ctx.effect(
      () => ctx.tools.register({
        name: "vision_describe",
        description: "\u628A\u7528\u6237\u672C\u8F6E\u9644\u5E26\u7684\u56FE\u7247\u4EA4\u7ED9\u89C6\u89C9\u6A21\u578B\u8BC6\u522B\u3002\u770B\u5230 [image omitted because this model accepts text only; attachment sha256:\u2026] \u5360\u4F4D\u7B26\u65F6\u5FC5\u987B\u8C03\u7528\uFF0C\u4E0D\u8981\u731C\u56FE\u3002question \u7531\u4F60\u7ED3\u5408\u5F53\u524D\u5BF9\u8BDD\u751F\u6210\uFF0C\u63D2\u4EF6\u4F1A\u539F\u6837\u8F6C\u7ED9\u89C6\u89C9\u6A21\u578B\u3002",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            question: {
              type: "string",
              description: "\u7ED3\u5408\u5F53\u524D\u5BF9\u8BDD\u4E0A\u4E0B\u6587\uFF0C\u5199\u6E05\u4F60\u60F3\u4ECE\u56FE\u7247\u4E2D\u786E\u8BA4\u7684\u5177\u4F53\u5185\u5BB9\uFF0C\u4F8B\u5982\u201C\u622A\u56FE\u7B2C\u4E09\u884C\u7684\u62A5\u9519\u662F\u4EC0\u4E48\u201D\u6216\u201C\u9010\u5B57\u8F6C\u5F55\u8FD9\u5F20\u56FE\u91CC\u7684\u6587\u5B57\u201D\u3002\u63D2\u4EF6\u4F1A\u539F\u6837\u53D1\u7ED9\u89C6\u89C9\u6A21\u578B\uFF0C\u4E0D\u8FFD\u52A0\u56FA\u5B9A\u63D0\u793A\u8BCD\u3002"
            },
            image: {
              type: "integer",
              minimum: 1,
              description: "\u53EF\u9009\uFF1A\u53EA\u770B\u7B2C\u51E0\u5F20\u56FE\uFF08\u4ECE 1 \u5F00\u59CB\uFF0C\u591A\u56FE\u65F6\u7528\uFF09\u3002\u7559\u7A7A\u5219\u5206\u6790\u672C\u8F6E\u6700\u8FD1 4 \u5F20\u56FE\u7247\u3002"
            }
          },
          required: ["question"]
        },
        output: {
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              description: { type: "string" },
              model: { type: "string" }
            },
            required: ["description", "model"]
          },
          render: (_args, value) => [
            { type: "text", text: String(value.description) }
          ]
        },
        isConcurrencySafe: () => true,
        async execute(args, exec) {
          const current = getConfig();
          if (!current.enabled) {
            throw new Error("\u89C6\u89C9\u6865\u63A5\u5DF2\u5728 \u8BBE\u7F6E \u2192 \u89C6\u89C9\u6A21\u578B \u4E2D\u5173\u95ED\uFF0C\u8BF7\u5148\u542F\u7528");
          }
          const input = isRecord3(args) ? args : {};
          const question = typeof input["question"] === "string" ? input["question"].trim() : "";
          if (!question) {
            throw new Error("question \u4E0D\u80FD\u4E3A\u7A7A\uFF1A\u8BF7\u7ED3\u5408\u4E0A\u4E0B\u6587\u8BF4\u660E\u4F60\u60F3\u4ECE\u56FE\u7247\u4E2D\u786E\u8BA4\u4EC0\u4E48");
          }
          const index = parseImageIndex(input["image"]);
          const sessionId = typeof exec?.agent?.id === "string" ? exec.agent.id : void 0;
          const cached = sessionId ? images.get(sessionId) : [];
          let selected;
          if (index !== null) {
            const one = cached[index - 1];
            if (!one) throw new Error(`\u7B2C ${index} \u5F20\u56FE\u7247\u4E0D\u5B58\u5728\uFF1A\u672C\u8F6E\u5171 ${cached.length} \u5F20\u56FE\u7247`);
            selected = [one];
          } else {
            selected = cached.slice(-MAX_IMAGES);
          }
          if (selected.length === 0) {
            throw new Error("\u672C\u8F6E\u6CA1\u6709\u627E\u5230\u53EF\u7528\u7684\u56FE\u7247\uFF1A\u8BF7\u786E\u8BA4\u56FE\u7247\u5DF2\u4F5C\u4E3A\u9644\u4EF6\u53D1\u9001\uFF0C\u6216\u91CD\u8BD5\u4E00\u6B21");
          }
          const answer = await describeWithFallback(
            ctx,
            current,
            selected,
            question.slice(0, MAX_QUESTION),
            exec?.signal,
            sessionId
          );
          return {
            description: answer.text,
            model: answer.route.provider + "/" + answer.route.model
          };
        }
      }),
      "dshp-vision-bridge: vision_describe tool"
    );
  } catch (error) {
    warn("\u6CE8\u518C vision_describe \u5DE5\u5177\u5931\u8D25", error);
  }
  function registerRoute(path, handler) {
    try {
      ctx.effect(
        () => ctx.webServer.register({ kind: "exact", path, handler }),
        `dshp-vision-bridge: ${path} route`
      );
    } catch (error) {
      warn(`\u6CE8\u518C\u8DEF\u7531 ${path} \u5931\u8D25`, error);
    }
  }
  registerRoute(ROUTE_PREFIX + "/state", async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
    try {
      return json(res, 200, {
        ok: true,
        models: await listVisionModels(ctx),
        config: getConfig()
      });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });
  registerRoute(ROUTE_PREFIX + "/config", async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
    if (req.method !== "POST") return json(res, 405, { ok: false, error: "method not allowed" });
    let body;
    try {
      body = JSON.parse(await readBody(req, MAX_BODY) || "{}");
    } catch {
      return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
    }
    if (!isRecord3(body)) return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F\u5BF9\u8C61" });
    try {
      const patch = parseConfigPatch(body);
      if (Object.keys(patch).length > 0) await updateConfig(patch);
      return json(res, 200, { ok: true, config: getConfig() });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });
  registerRoute(ROUTE_PREFIX + "/check", async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
    const current = getConfig();
    return json(res, 200, {
      ok: true,
      primary: await probeRoute(current.primary),
      fallback: await probeRoute(current.fallback)
    });
  });
  async function probeRoute(route) {
    if (!route) return { ok: false, message: "\u672A\u914D\u7F6E" };
    if (!llm || typeof originalResolve !== "function") {
      return { ok: false, message: "llm \u670D\u52A1\u4E0D\u53EF\u7528" };
    }
    try {
      const result = await originalResolve.call(llm, route.provider, route.model);
      const label = route.provider + "/" + route.model;
      if (!isRecord3(result)) return { ok: true, message: label + " \u53EF\u89E3\u6790" };
      const modalities = result["inputModalities"];
      if (Array.isArray(modalities) && !modalities.includes("image")) {
        return { ok: false, message: label + " \u672A\u58F0\u660E image \u8F93\u5165" };
      }
      return { ok: true, message: label + " \u53EF\u7528" };
    } catch (error) {
      return { ok: false, message: errorMessage(error).slice(0, 300) };
    }
  }
}
function parseImageIndex(value) {
  if (value === void 0 || value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error("image \u5FC5\u987B\u662F\u4ECE 1 \u5F00\u59CB\u7684\u6574\u6570");
  }
  return value;
}
var CONFIG_FIELDS = /* @__PURE__ */ new Set(["enabled", "primary", "fallback"]);
function parseConfigPatch(body) {
  for (const key of Object.keys(body)) {
    if (!CONFIG_FIELDS.has(key)) throw new Error(`\u672A\u77E5\u914D\u7F6E\u5B57\u6BB5\uFF1A${key}`);
  }
  const patch = {};
  if (Object.hasOwn(body, "enabled")) {
    if (typeof body["enabled"] !== "boolean") throw new Error("enabled \u5FC5\u987B\u662F\u5E03\u5C14\u503C");
    patch["enabled"] = body["enabled"];
  }
  if (Object.hasOwn(body, "primary")) patch["primary"] = parseRoute(body["primary"], "primary");
  if (Object.hasOwn(body, "fallback")) patch["fallback"] = parseRoute(body["fallback"], "fallback");
  return patch;
}
function parseRoute(value, field) {
  if (value === null) return null;
  if (!isRecord3(value)) throw new Error(`${field} \u5FC5\u987B\u662F {provider, model} \u6216 null`);
  const provider = typeof value["provider"] === "string" ? value["provider"].trim() : "";
  const model = typeof value["model"] === "string" ? value["model"].trim() : "";
  if (!provider || !model) throw new Error(`${field} \u7684 provider/model \u4E0D\u80FD\u4E3A\u7A7A`);
  return { provider: provider.slice(0, 120), model: model.slice(0, 200) };
}

export { Config, ConfigSchema, NS, apply, inject, name };
