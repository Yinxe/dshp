import { homedir } from 'os';
import { isAbsolute, resolve, join, sep, basename } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile, mkdir, rm, unlink, cp, readdir, stat, realpath } from 'fs/promises';

// src/host/config.ts

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
Schema.extend = function extend(type, resolve4) {
  resolvers[type] = resolve4;
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
  const str2 = data.toString();
  if (str2.includes("e")) return data * Math.pow(10, digits);
  const index = str2.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str2.slice(index + 1);
  const integer = str2.slice(0, index);
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

// src/host/http.ts
var NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*$/;
function settingsNamespace(value) {
  if (!NAMESPACE_PATTERN.test(value)) {
    throw new TypeError(`settings namespace "${value}" must match ${String(NAMESPACE_PATTERN)}`);
  }
  return value;
}
function json(res, status, value) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(value));
}
function sameOrigin(req) {
  const rawOrigin = req.headers["origin"];
  const origin = typeof rawOrigin === "string" ? rawOrigin : void 0;
  if (origin === void 0) return true;
  const rawHost = req.headers["host"];
  const host = typeof rawHost === "string" ? rawHost : "";
  return origin === `http://${host}` || origin === `https://${host}`;
}
function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve4, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload-too-large"));
        try {
          req.destroy();
        } catch {
        }
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve4(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
function queryParams(req) {
  try {
    const url = typeof req.url === "string" ? req.url : "";
    const i = url.indexOf("?");
    return new URLSearchParams(i >= 0 ? url.slice(i + 1) : "");
  } catch {
    return new URLSearchParams("");
  }
}

// src/host/config.ts
var NS = settingsNamespace("dshp-skill-manager");
function defaultDshHome() {
  const env = process.env["DSH_HOME"];
  return env && env.trim() ? env.trim() : resolve(homedir(), ".dsh");
}
function defaultAgentsHome() {
  const env = process.env["DSH_AGENTS_HOME"];
  return env && env.trim() ? env.trim() : resolve(homedir(), ".agents");
}
var WORKSPACE_ROOT_MAX = 1024;
var ConfigSchema = Schema.object({
  enabled: Schema.boolean().default(true).volatile(),
  workspaceRoot: Schema.string().default("").volatile()
});
function sanitizeWorkspaceRoot(v) {
  if (typeof v !== "string") return "";
  const raw = v.trim().slice(0, WORKSPACE_ROOT_MAX);
  if (!raw) return "";
  const abs = isAbsolute(raw) ? resolve(raw) : "";
  return abs || "";
}

// src/host/frontmatter.ts
var SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var ENTRY_START = /^[A-Za-z][A-Za-z0-9_-]*:[ \t]?(.*)$/;
var ENTRY_KEY = /^([A-Za-z][A-Za-z0-9_-]*):/;
var ENTRY_REST = /^[A-Za-z][A-Za-z0-9_-]*:[ \t]?(.*)$/;
var INDENT = /^[ \t]*/;
var DOUBLE_QUOTED = /^"((?:[^"\\]|\\.)*)"/;
var SINGLE_QUOTED = /^'((?:[^']|'')*)'/;
var TRAILING_COMMENT = /^(.*?)(?:[ \t]+#.*)?$/;
function isEntryStart(line) {
  return ENTRY_START.test(line);
}
function entryKey(line) {
  const m = line.match(ENTRY_KEY);
  return m && m[1] ? m[1] : "";
}
function entryRest(line) {
  const m = line.match(ENTRY_REST);
  return m && m[1] ? m[1] : "";
}
function indentOf(line) {
  const m = line.match(INDENT);
  return m && m[0] ? m[0].length : 0;
}
function unescapeDoubleQuoted(inner) {
  let out = "";
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch !== "\\" || i + 1 >= inner.length) {
      out += ch;
      continue;
    }
    const nxt = inner[i + 1];
    if (nxt === "n") out += "\n";
    else if (nxt === "t") out += "	";
    else if (nxt === "r") out += "\r";
    else if (nxt === "b") out += "\b";
    else if (nxt === "f") out += "\f";
    else if (nxt === "/") out += "/";
    else if (nxt === "u" && i + 5 < inner.length) {
      const hex = inner.slice(i + 2, i + 6);
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        out += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else {
        out += ch;
      }
    } else {
      out += nxt;
    }
    i += 1;
  }
  return out;
}
function parseDoubleQuoted(rest) {
  const m = rest.match(DOUBLE_QUOTED);
  if (!m || !m[1]) return void 0;
  return unescapeDoubleQuoted(m[1]);
}
function parseSingleQuoted(rest) {
  const m = rest.match(SINGLE_QUOTED);
  if (!m || !m[1]) return void 0;
  return m[1].replace(/''/g, "'");
}
function stripComment(value) {
  const m = value.match(TRAILING_COMMENT);
  return m && m[1] !== void 0 ? m[1] : value;
}
function parseFrontmatter(source) {
  const normalized = source.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");
  const lines = normalized.split("\n");
  let i = 0;
  while (i < lines.length && lines[i] !== void 0 && lines[i].trim() === "") i += 1;
  const first = i < lines.length ? lines[i] : "";
  if (first.trim() !== "---") return null;
  i += 1;
  const entries = [];
  let closed = false;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "---" || line.trim() === "...") {
      closed = true;
      i += 1;
      break;
    }
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    if (!isEntryStart(line)) {
      const last = entries[entries.length - 1];
      if (last) last.raw.push(line);
      else entries.push({ key: "", raw: [line], kind: "raw", value: "" });
      i += 1;
      continue;
    }
    const key = entryKey(line);
    const rest = entryRest(line);
    const raw = [line];
    i += 1;
    const restTrim = rest.trim();
    if (restTrim === "" || restTrim.startsWith("|") || restTrim.startsWith(">")) {
      const baseIndent2 = indentOf(line);
      while (i < lines.length) {
        const nxt = lines[i];
        if (nxt.trim() === "") {
          raw.push(nxt);
          i += 1;
          continue;
        }
        if (indentOf(nxt) <= baseIndent2) break;
        raw.push(nxt);
        i += 1;
      }
      const folded = raw.slice(1).map((l) => l.trim()).filter((l) => l !== "").join(" ");
      entries.push({ key, raw, kind: "block", value: folded });
      continue;
    }
    if (restTrim.startsWith('"')) {
      const v = parseDoubleQuoted(restTrim);
      if (v !== void 0) {
        entries.push({ key, raw, kind: "quoted", value: v });
        continue;
      }
    }
    if (restTrim.startsWith("'")) {
      const v = parseSingleQuoted(restTrim);
      if (v !== void 0) {
        entries.push({ key, raw, kind: "quoted", value: v });
        continue;
      }
    }
    const baseIndent = indentOf(line);
    while (i < lines.length) {
      const nxt = lines[i];
      if (nxt.trim() === "" || indentOf(nxt) <= baseIndent) break;
      if (isEntryStart(nxt.trim())) break;
      raw.push(nxt);
      i += 1;
    }
    if (raw.length > 1) {
      const folded = raw.map((l) => stripComment(l).trim()).filter((l) => l !== "" && !/^[A-Za-z][A-Za-z0-9_-]*:/.test(l)).join(" ");
      entries.push({ key, raw, kind: "raw", value: folded });
      continue;
    }
    entries.push({ key, raw, kind: "plain", value: stripComment(restTrim) });
  }
  const body = closed ? lines.slice(i).join("\n") : "";
  return { entries, body };
}
function quoteYamlScalar(value) {
  let out = '"';
  for (const ch of value) {
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\n") out += "\\n";
    else if (ch === "	") out += "\\t";
    else if (ch === "\r") out += "\\r";
    else out += ch;
  }
  return out + '"';
}
function serializeFrontmatter(entries, body) {
  const out = ["---"];
  for (const entry of entries) {
    if (!entry.key || entry.kind === "raw") {
      out.push(...entry.raw);
      continue;
    }
    if (entry.kind === "plain") {
      out.push(entry.key + ": " + entry.value);
      continue;
    }
    out.push(entry.key + ": " + quoteYamlScalar(entry.value));
  }
  out.push("---");
  const bodyPart = body.startsWith("\n") || body === "" ? body : "\n" + body;
  return out.join("\n") + "\n" + bodyPart.replace(/\n*$/, "\n");
}
function upsertWithKind(entries, key, value, kind) {
  const next = entries.map((e) => e.key === key ? { ...e, kind, value } : e);
  if (!next.some((e) => e.key === key)) next.push({ key, raw: [], kind, value });
  return next;
}
function upsertEntry(entries, key, value) {
  return upsertWithKind(entries, key, value, "quoted");
}
function upsertPlainEntry(entries, key, value) {
  return upsertWithKind(entries, key, value, "plain");
}
function findEntry(entries, key) {
  return entries.find((e) => e.key === key);
}
var BOOL_TRUE = /* @__PURE__ */ new Set(["true", "yes", "on", "1"]);
var BOOL_FALSE = /* @__PURE__ */ new Set(["false", "no", "off", "0"]);
function parseFrontmatterBoolean(raw) {
  if (raw === void 0) return void 0;
  const value = raw.trim().toLowerCase();
  if (BOOL_TRUE.has(value)) return true;
  if (BOOL_FALSE.has(value)) return false;
  throw new TypeError(`frontmatter boolean "${raw}" is not one of true/false/yes/no/on/off/1/0`);
}

// src/host/roots.ts
var MAX_WORKSPACES = 20;
function isRecord(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function listWorkspaces(ctx, configuredRoot) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const push2 = (p) => {
    if (typeof p !== "string" || !p || !isAbsolute(p)) return;
    const abs = resolve(p);
    if (seen.has(abs)) return;
    seen.add(abs);
    out.push(abs);
  };
  try {
    const reg = ctx.get("workspaceRegistry");
    if (reg && typeof reg.list === "function") {
      const list = reg.list();
      if (Array.isArray(list)) {
        for (const w of list) {
          if (isRecord(w)) push2(w.path);
          else push2(w);
          if (out.length >= MAX_WORKSPACES) break;
        }
      }
    }
  } catch {
  }
  if (configuredRoot) push2(configuredRoot);
  if (out.length === 0) push2(process.cwd());
  return out;
}
function workspaceRoots(workspace, startIdx) {
  const idx = String(startIdx).padStart(2, "0");
  const name2 = basename(workspace) || workspace;
  const mk = (suffix, rank) => {
    const path = join(workspace, "." + suffix, "skills");
    return {
      id: "ws-" + idx + "-" + suffix,
      label: "\u5DE5\u4F5C\u533A " + name2 + " \xB7 ." + suffix + "/skills",
      scope: "workspace",
      workspace,
      path,
      rank,
      exists: existsSync(path)
    };
  };
  return [mk("agents", 200), mk("dsh", 100)];
}
function listRoots(ctx, configuredRoot) {
  const workspaces = listWorkspaces(ctx, configuredRoot);
  const dshSkills = join(defaultDshHome(), "skills");
  const agentsSkills = join(defaultAgentsHome(), "skills");
  const roots = [
    {
      id: "global-agents",
      label: "\u5168\u5C40 \xB7 ~/.agents/skills\uFF08\u63A8\u8350\uFF09",
      scope: "global",
      workspace: "",
      path: agentsSkills,
      rank: 500,
      exists: existsSync(agentsSkills)
    },
    {
      id: "global-dsh",
      label: "\u5168\u5C40 \xB7 ~/.dsh/skills",
      scope: "global",
      workspace: "",
      path: dshSkills,
      rank: 400,
      exists: existsSync(dshSkills)
    }
  ];
  let wsIdx = 1;
  for (const ws of workspaces) {
    roots.push(...workspaceRoots(ws, wsIdx));
    wsIdx += 1;
  }
  return { roots, workspaces };
}
function findRoot(roots, rootId) {
  if (typeof rootId !== "string" || !rootId) return void 0;
  return roots.find((r) => r.id === rootId);
}
function entryPathFor(root, dirName, kind) {
  if (!SKILL_NAME_PATTERN.test(dirName)) return null;
  const target = kind === "bundle" ? join(root.path, dirName, "SKILL.md") : join(root.path, dirName + ".md");
  const rootAbs = resolve(root.path);
  const targetAbs = resolve(target);
  if (targetAbs !== rootAbs && !targetAbs.startsWith(rootAbs + sep)) return null;
  return targetAbs;
}
async function ensureRoot(root) {
  if (!isAbsolute(root.path)) throw new Error("\u6280\u80FD\u6839\u76EE\u5F55\u8DEF\u5F84\u975E\u6CD5\uFF1A" + String(root.path).slice(0, 200));
  await mkdir(root.path, { recursive: true });
}
async function dirExists(path) {
  try {
    const entries = await readdir(path);
    return Array.isArray(entries);
  } catch {
    return false;
  }
}
async function containedInRoot(rootPath, entryDir) {
  try {
    const [realRoot, realEntry] = await Promise.all([realpath(rootPath), realpath(entryDir)]);
    return realEntry === realRoot || realEntry.startsWith(realRoot + sep);
  } catch {
    return false;
  }
}
function toPayloadEntry(entry) {
  return {
    rootId: entry.rootId,
    name: entry.name.slice(0, 120),
    dirName: entry.dirName.slice(0, 120),
    kind: entry.kind,
    description: entry.description.slice(0, 500),
    whenToUse: entry.whenToUse.slice(0, 500),
    modelInvocable: entry.modelInvocable,
    userInvocable: entry.userInvocable,
    scope: entry.scope,
    workspace: entry.workspace,
    entryPath: entry.entryPath,
    valid: entry.valid,
    problem: entry.problem.slice(0, 300),
    shadowedBy: entry.shadowedBy
  };
}
var MAX_SKILL_BYTES = 256 * 1024;
function isRecord2(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function str(v) {
  return typeof v === "string" ? v : "";
}
async function statOrNull(path) {
  try {
    return await stat(path);
  } catch (e) {
    if (isRecord2(e) && e.code === "ENOENT") return null;
    throw e;
  }
}
function metaOf(entries) {
  const name2 = str(findEntry(entries, "name")?.value).trim();
  const description = str(findEntry(entries, "description")?.value).trim();
  const whenToUse = str(findEntry(entries, "whenToUse")?.value).trim();
  if (!name2 || !description) {
    return {
      name: name2,
      description,
      whenToUse,
      modelInvocable: true,
      userInvocable: true,
      problem: "frontmatter \u7F3A\u5C11 name \u6216 description"
    };
  }
  if (!SKILL_NAME_PATTERN.test(name2)) {
    return {
      name: name2,
      description,
      whenToUse,
      modelInvocable: true,
      userInvocable: true,
      problem: `name "${name2.slice(0, 60)}" \u4E0D\u7B26\u5408 kebab-case \u89C4\u8303`
    };
  }
  try {
    const disableModel = parseFrontmatterBoolean(findEntry(entries, "disable-model-invocation")?.value);
    const userInv = parseFrontmatterBoolean(findEntry(entries, "user-invocable")?.value);
    return {
      name: name2,
      description,
      whenToUse,
      modelInvocable: disableModel !== true,
      userInvocable: userInv !== false,
      problem: ""
    };
  } catch (e) {
    return {
      name: name2,
      description,
      whenToUse,
      modelInvocable: true,
      userInvocable: true,
      problem: "\u8C03\u7528\u5F00\u5173\u5E03\u5C14\u503C\u975E\u6CD5\uFF1A" + String(e?.message ?? e).slice(0, 120)
    };
  }
}
async function scanRoot(root) {
  if (!await dirExists(root.path)) return [];
  const dirents = await readdir(root.path, { withFileTypes: true });
  const out = [];
  for (const de of dirents) {
    const dirName = de.name;
    if (dirName.startsWith(".")) continue;
    let kind;
    let entryPath;
    if (de.isDirectory()) {
      entryPath = join(root.path, dirName, "SKILL.md");
      kind = "bundle";
    } else if (de.isFile() && dirName.endsWith(".md")) {
      entryPath = join(root.path, dirName);
      kind = "flat";
    } else {
      continue;
    }
    const base = {
      rootId: root.id,
      name: kind === "flat" ? dirName.slice(0, -3) : dirName,
      dirName,
      kind,
      description: "",
      whenToUse: "",
      modelInvocable: true,
      userInvocable: true,
      scope: root.scope,
      workspace: root.workspace,
      entryPath,
      valid: false,
      problem: "",
      shadowedBy: ""
    };
    let text;
    try {
      const st = await stat(entryPath);
      if (!st.isFile() || st.size > MAX_SKILL_BYTES) {
        base.problem = st.isFile() ? `SKILL.md \u8D85\u8FC7 ${Math.floor(MAX_SKILL_BYTES / 1024)}KB\uFF0C\u62D2\u7EDD\u8BFB\u53D6` : "SKILL.md \u4E0D\u662F\u666E\u901A\u6587\u4EF6";
        out.push(base);
        continue;
      }
      text = await readFile(entryPath, "utf8");
    } catch {
      base.problem = kind === "bundle" ? "\u76EE\u5F55\u91CC\u6CA1\u6709 SKILL.md" : "\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25";
      out.push(base);
      continue;
    }
    const parsed = parseFrontmatter(text);
    if (!parsed) {
      base.problem = "\u7F3A\u5C11 YAML frontmatter\uFF08\u6587\u4EF6\u9700\u4EE5 --- \u5F00\u5934\uFF09";
      out.push(base);
      continue;
    }
    const meta = metaOf(parsed.entries);
    base.name = meta.name || base.name;
    base.description = meta.description;
    base.whenToUse = meta.whenToUse;
    base.modelInvocable = meta.modelInvocable;
    base.userInvocable = meta.userInvocable;
    base.valid = meta.problem === "";
    base.problem = meta.problem;
    out.push(base);
  }
  out.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  return out;
}
function markShadows(entries, rankOf) {
  const winners = /* @__PURE__ */ new Map();
  for (const e of entries) {
    e.shadowedBy = "";
    const cur = winners.get(e.name);
    if (!cur || rankOf(e.rootId) < rankOf(cur.rootId)) winners.set(e.name, e);
  }
  for (const e of entries) {
    const w = winners.get(e.name);
    if (w && w !== e) e.shadowedBy = w.rootId;
  }
}
async function findSkill(root, name2) {
  const list = await scanRoot(root);
  return list.find((e) => e.name === name2) ?? list.find((e) => e.dirName === name2);
}
async function readSkill(root, name2) {
  const entry = await findSkill(root, name2);
  if (!entry) throw new Error(`\u6280\u80FD "${name2}" \u5728 ${root.label} \u4E2D\u4E0D\u5B58\u5728`);
  const bareName = entry.kind === "flat" ? entry.dirName.slice(0, -3) : entry.dirName;
  if (!SKILL_NAME_PATTERN.test(bareName) || !entryPathFor(root, bareName, entry.kind)) {
    throw new Error(`\u6280\u80FD\u6761\u76EE\u540D "${entry.dirName.slice(0, 60)}" \u4E0D\u662F\u5408\u6CD5 kebab-case\uFF0C\u65E0\u6CD5\u901A\u8FC7\u7BA1\u7406\u5668\u4FEE\u6539`);
  }
  const text = await readFile(entry.entryPath, "utf8");
  const parsed = parseFrontmatter(text);
  if (!parsed) throw new Error("\u6587\u4EF6\u6CA1\u6709 YAML frontmatter\uFF0C\u65E0\u6CD5\u901A\u8FC7\u7BA1\u7406\u5668\u7F16\u8F91\uFF08\u8BF7\u624B\u5DE5\u5904\u7406\uFF09");
  return { entries: parsed.entries, body: parsed.body, entry };
}
async function createSkill(root, meta) {
  if (!SKILL_NAME_PATTERN.test(meta.name)) {
    throw new Error(
      `\u6280\u80FD\u540D "${meta.name.slice(0, 60)}" \u975E\u6CD5\uFF1A\u9700\u4E3A\u5C0F\u5199\u5B57\u6BCD/\u6570\u5B57\u5F00\u5934\u7684\u5C0F\u5199 kebab-case\uFF08\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u8FDE\u5B57\u7B26\uFF09`
    );
  }
  if (!meta.description.trim()) throw new Error("description \u4E0D\u80FD\u4E3A\u7A7A\uFF1A\u6280\u80FD\u76EE\u5F55\u91CC\u7684 summary \u9760\u5B83\u88AB\u6A21\u578B\u68C0\u7D22");
  const entries = [];
  const seeded = upsertEntry(upsertEntry(entries, "name", meta.name), "description", meta.description.trim());
  const finalEntries = meta.whenToUse.trim() ? upsertEntry(seeded, "whenToUse", meta.whenToUse.trim()) : seeded;
  const content = serializeFrontmatter(finalEntries, meta.body);
  const dirTarget = join(root.path, meta.name);
  if (meta.kind === "flat") {
    const target = entryPathFor(root, meta.name, "flat");
    if (!target) throw new Error("\u76EE\u6807\u8DEF\u5F84\u975E\u6CD5\uFF08\u540D\u5B57\u672A\u901A\u8FC7\u5B89\u5168\u6821\u9A8C\uFF09");
    if (await statOrNull(target)) throw new Error(`\u6280\u80FD "${meta.name}" \u5DF2\u5B58\u5728\u4E8E ${root.label}\uFF0C\u4E0D\u80FD\u91CD\u590D\u521B\u5EFA`);
    await ensureRoot(root);
    await writeFile(target, content, "utf8");
    return;
  }
  const skillMd = entryPathFor(root, meta.name, "bundle");
  if (!skillMd) throw new Error("\u76EE\u6807\u8DEF\u5F84\u975E\u6CD5\uFF08\u540D\u5B57\u672A\u901A\u8FC7\u5B89\u5168\u6821\u9A8C\uFF09");
  if (await statOrNull(dirTarget))
    throw new Error(`\u76EE\u5F55 "${meta.name}" \u5DF2\u5B58\u5728\u4E8E ${root.label}\uFF0C\u4E0D\u80FD\u91CD\u590D\u521B\u5EFA`);
  await ensureRoot(root);
  await mkdir(dirTarget, { recursive: true });
  await writeFile(skillMd, content, "utf8");
}
async function updateSkill(root, name2, patch) {
  const res = await readSkill(root, name2);
  let entries = res.entries;
  let body = res.body;
  if (typeof patch.description === "string") {
    const d = patch.description.trim();
    if (!d) throw new Error("description \u4E0D\u80FD\u4E3A\u7A7A\uFF1A\u6280\u80FD\u76EE\u5F55\u91CC\u7684 summary \u9760\u5B83\u88AB\u6A21\u578B\u68C0\u7D22");
    entries = upsertEntry(entries, "description", d.slice(0, 500));
  }
  if (typeof patch.whenToUse === "string") {
    const w = patch.whenToUse.trim().slice(0, 500);
    entries = w ? upsertEntry(entries, "whenToUse", w) : entries.filter((e) => e.key !== "whenToUse");
  }
  if (typeof patch.body === "string") body = patch.body.slice(0, MAX_SKILL_BYTES);
  await writeFile(res.entry.entryPath, serializeFrontmatter(entries, body), "utf8");
}
async function toggleSkill(root, name2, field, value) {
  const res = await readSkill(root, name2);
  let entries = res.entries;
  if (field === "all") {
    entries = value ? entries.filter((e) => e.key !== "disable-model-invocation" && e.key !== "user-invocable") : upsertPlainEntry(
      upsertPlainEntry(entries, "disable-model-invocation", "true"),
      "user-invocable",
      "false"
    );
  } else if (field === "model") {
    entries = value ? entries.filter((e) => e.key !== "disable-model-invocation") : upsertPlainEntry(entries, "disable-model-invocation", "true");
  } else {
    entries = value ? entries.filter((e) => e.key !== "user-invocable") : upsertPlainEntry(entries, "user-invocable", "false");
  }
  await writeFile(res.entry.entryPath, serializeFrontmatter(entries, res.body), "utf8");
}
async function removeSkill(root, name2) {
  const res = await readSkill(root, name2);
  const target = res.entry.kind === "bundle" ? join(root.path, res.entry.dirName) : res.entry.entryPath;
  const ok = await containedInRoot(root.path, target);
  if (!ok) throw new Error("\u76EE\u6807\u8DEF\u5F84\u8D8A\u51FA\u6280\u80FD\u6839\u76EE\u5F55\uFF0C\u5DF2\u62D2\u7EDD\u5220\u9664");
  if (res.entry.kind === "bundle") await rm(target, { recursive: true, force: false });
  else await unlink(target);
}
async function transferSkill(fromRoot, fromName, toRoot, toName, deleteSource) {
  const res = await readSkill(fromRoot, fromName);
  const targetName = toName || res.entry.name;
  if (!SKILL_NAME_PATTERN.test(targetName)) {
    throw new Error(`\u76EE\u6807\u6280\u80FD\u540D "${targetName.slice(0, 60)}" \u975E\u6CD5\uFF1A\u9700\u4E3A\u5C0F\u5199 kebab-case`);
  }
  if (fromRoot.id === toRoot.id && res.entry.dirName === targetName) {
    const text = await readFile(res.entry.entryPath, "utf8");
    const parsed = parseFrontmatter(text);
    if (parsed) {
      const entries = upsertEntry(parsed.entries, "name", targetName);
      await writeFile(res.entry.entryPath, serializeFrontmatter(entries, parsed.body), "utf8");
    }
    return;
  }
  await ensureRoot(toRoot);
  if (res.entry.kind === "bundle") {
    const src = join(fromRoot.path, res.entry.dirName);
    const dst = join(toRoot.path, targetName);
    const dstSkillMd = entryPathFor(toRoot, targetName, "bundle");
    if (!dstSkillMd) throw new Error("\u76EE\u6807\u8DEF\u5F84\u975E\u6CD5\uFF08\u540D\u5B57\u672A\u901A\u8FC7\u5B89\u5168\u6821\u9A8C\uFF09");
    if (await statOrNull(dst)) throw new Error(`\u76EE\u6807\u76EE\u5F55 "${targetName}" \u5DF2\u5B58\u5728\u4E8E ${toRoot.label}`);
    await cp(src, dst, { recursive: true, errorOnExist: true });
    if (targetName !== res.entry.name) {
      const text = await readFile(dstSkillMd, "utf8");
      const parsed = parseFrontmatter(text);
      if (parsed) {
        const entries = upsertEntry(parsed.entries, "name", targetName);
        await writeFile(dstSkillMd, serializeFrontmatter(entries, parsed.body), "utf8");
      }
    }
  } else {
    const dstFile = entryPathFor(toRoot, targetName, "flat");
    if (!dstFile) throw new Error("\u76EE\u6807\u8DEF\u5F84\u975E\u6CD5\uFF08\u540D\u5B57\u672A\u901A\u8FC7\u5B89\u5168\u6821\u9A8C\uFF09");
    if (await statOrNull(dstFile)) throw new Error(`\u76EE\u6807\u6587\u4EF6 "${targetName}.md" \u5DF2\u5B58\u5728\u4E8E ${toRoot.label}`);
    const text = await readFile(res.entry.entryPath, "utf8");
    const parsed = parseFrontmatter(text);
    const content = parsed ? serializeFrontmatter(
      targetName !== res.entry.name ? upsertEntry(parsed.entries, "name", targetName) : parsed.entries,
      parsed.body
    ) : text;
    await writeFile(dstFile, content, "utf8");
  }
  if (deleteSource) await removeSkill(fromRoot, fromName);
}

// src/host/index.ts
var name = "@dshp/skill-manager";
var inject = ["settings", "webServer"];
var Config = ConfigSchema;
var BASE = "/ext/dshp-skill-manager";
function apply(ctx, config) {
  try {
    ctx.inject(["settings"], (sctx) => {
      try {
        sctx.effect(
          () => sctx.settings.configure({ auto: false }, ctx.fiber),
          "dshp-skill-manager: settings-page"
        );
      } catch (error) {
        console.error("[dshp-skill-manager] \u6CE8\u518C settings \u9875\u9762\u7B56\u7565\u5931\u8D25\uFF0C\u914D\u7F6E\u5C06\u56DE\u9ED8\u8BA4\u503C\uFF1A", error);
      }
    });
  } catch (error) {
    console.error("[dshp-skill-manager] settings \u670D\u52A1\u6CE8\u5165\u5931\u8D25\uFF0C\u914D\u7F6E\u5C06\u56DE\u9ED8\u8BA4\u503C\uFF1A", error);
  }
  function getConfig() {
    return { enabled: config.enabled.get(), workspaceRoot: config.workspaceRoot.get() };
  }
  async function updateConfig(patchObj) {
    const settings = ctx.get("settings");
    if (!settings)
      throw new Error(
        "settings \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u6301\u4E45\u5316\u5230 profile \u6761\u76EE config\uFF08\u8BF7\u91CD\u542F DSH \u786E\u8BA4\u8BBE\u7F6E\u670D\u52A1\u5DF2\u6302\u8F7D\uFF09"
      );
    await settings.update(NS, patchObj);
  }
  function snapshotConfig() {
    const c = getConfig();
    return { enabled: c.enabled === true, workspaceRoot: c.workspaceRoot };
  }
  async function snapshotState() {
    const c = getConfig();
    const { roots, workspaces } = listRoots(ctx, c.workspaceRoot);
    const skills = [];
    for (const root of roots) {
      try {
        skills.push(...await scanRoot(root));
      } catch (e) {
        try {
          console.warn(
            "[dshp-skill-manager] \u626B\u63CF\u6839\u76EE\u5F55\u5931\u8D25 " + root.path + ": " + String(e?.message ?? e)
          );
        } catch {
        }
      }
    }
    const rankOf = (rootId) => roots.find((r) => r.id === rootId)?.rank ?? 999;
    markShadows(
      skills.filter((s) => s.scope === "global"),
      rankOf
    );
    const byWs = /* @__PURE__ */ new Map();
    for (const s of skills) {
      if (s.scope !== "workspace") continue;
      const list = byWs.get(s.workspace) ?? [];
      list.push(s);
      byWs.set(s.workspace, list);
    }
    for (const list of byWs.values()) markShadows(list, rankOf);
    return {
      enabled: c.enabled === true,
      dshHome: defaultDshHome(),
      agentsHome: defaultAgentsHome(),
      roots,
      skills: skills.map(toPayloadEntry),
      workspaces,
      workspaceRoot: c.workspaceRoot
    };
  }
  function requireEnabled() {
    if (getConfig().enabled !== true) throw new Error("\u6280\u80FD\u7BA1\u7406\u5DF2\u5728\u8BBE\u7F6E\u9875\u5173\u95ED\uFF0C\u8BF7\u5148\u542F\u7528\u540E\u518D\u64CD\u4F5C");
  }
  function resolveRoot(rootId) {
    const { roots } = listRoots(ctx, getConfig().workspaceRoot);
    const root = findRoot(roots, rootId);
    if (!root) throw new Error("rootId \u975E\u6CD5\u6216\u5BF9\u5E94\u6839\u5DF2\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
    return root;
  }
  function asName(v, field) {
    const s = typeof v === "string" ? v.trim().slice(0, 120) : "";
    if (!s) throw new Error(`${field} \u4E0D\u80FD\u4E3A\u7A7A`);
    return s;
  }
  function asText(v, max) {
    return typeof v === "string" ? v.slice(0, max) : "";
  }
  function trimText(v, max) {
    return typeof v === "string" ? v.trim().slice(0, max) : "";
  }
  function registerRoute(suffix, label, handler) {
    ctx.effect(
      () => ctx.webServer.register({
        kind: "exact",
        path: BASE + suffix,
        handler: async (req, res) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
          try {
            await handler(req, res);
          } catch (e) {
            return json(res, 200, { ok: false, error: String(e?.message ?? e).slice(0, 500) });
          }
        }
      }),
      label
    );
  }
  async function readJsonObject(req) {
    let body = {};
    try {
      body = JSON.parse(await readBody(req) || "{}");
    } catch {
      throw new Error("\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON");
    }
    return body && typeof body === "object" && !Array.isArray(body) ? body : {};
  }
  try {
    registerRoute("/state", "dshp-skill-manager: state route", async (_req, res) => {
      return json(res, 200, { ok: true, state: await snapshotState() });
    });
    registerRoute("/read", "dshp-skill-manager: read route", async (req, res) => {
      const q = queryParams(req);
      const root = resolveRoot(q.get("root"));
      const skillName = asName(q.get("name"), "name");
      const full = await readSkill(root, skillName);
      return json(res, 200, {
        ok: true,
        entry: toPayloadEntry(full.entry),
        fields: full.entries.filter((e) => e.key && e.kind !== "raw").map((e) => ({ key: e.key, value: e.value })),
        body: full.body.slice(0, 256 * 1024)
      });
    });
    registerRoute("/config", "dshp-skill-manager: config route", async (req, res) => {
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method not allowed" });
      const a = await readJsonObject(req);
      const patchObj = {};
      let hasPatch = false;
      if (Object.hasOwn(a, "enabled")) {
        patchObj["enabled"] = a["enabled"] === true;
        hasPatch = true;
      }
      if (Object.hasOwn(a, "workspaceRoot")) {
        if (typeof a["workspaceRoot"] !== "string")
          throw new Error("workspaceRoot \u975E\u6CD5\uFF0C\u5E94\u4E3A\u7EDD\u5BF9\u8DEF\u5F84\u5B57\u7B26\u4E32\u6216\u7A7A\u4E32");
        const root = a["workspaceRoot"] === "" ? "" : sanitizeWorkspaceRoot(a["workspaceRoot"]);
        if (root === "" && a["workspaceRoot"] !== "")
          throw new Error("workspaceRoot \u5FC5\u987B\u662F\u7EDD\u5BF9\u8DEF\u5F84\uFF08\u5982 /home/me/project\uFF09");
        patchObj["workspaceRoot"] = root;
        hasPatch = true;
      }
      if (hasPatch) await updateConfig(patchObj);
      return json(res, 200, { ok: true, config: snapshotConfig() });
    });
    registerRoute("/create", "dshp-skill-manager: create route", async (req, res) => {
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method not allowed" });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a["rootId"]);
      const kind = a["kind"] === "flat" ? "flat" : "bundle";
      await createSkill(root, {
        name: asName(a["name"], "name"),
        description: trimText(a["description"], 500),
        whenToUse: trimText(a["whenToUse"], 500),
        body: asText(a["body"], 2e5),
        kind
      });
      return json(res, 200, { ok: true, state: await snapshotState() });
    });
    registerRoute("/update", "dshp-skill-manager: update route", async (req, res) => {
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method not allowed" });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a["rootId"]);
      const skillName = asName(a["name"], "name");
      const p = {};
      if (Object.hasOwn(a, "description")) p.description = trimText(a["description"], 500);
      if (Object.hasOwn(a, "whenToUse")) p.whenToUse = trimText(a["whenToUse"], 500);
      if (Object.hasOwn(a, "body")) p.body = asText(a["body"], 2e5);
      await updateSkill(root, skillName, p);
      return json(res, 200, { ok: true, state: await snapshotState() });
    });
    registerRoute("/toggle", "dshp-skill-manager: toggle route", async (req, res) => {
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method not allowed" });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a["rootId"]);
      const skillName = asName(a["name"], "name");
      if (a["field"] !== "model" && a["field"] !== "user" && a["field"] !== "all")
        throw new Error("field \u975E\u6CD5\uFF0C\u5E94\u4E3A model\u3001user \u6216 all");
      await toggleSkill(root, skillName, a["field"], a["value"] === true);
      return json(res, 200, { ok: true, state: await snapshotState() });
    });
    registerRoute("/remove", "dshp-skill-manager: remove route", async (req, res) => {
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method not allowed" });
      requireEnabled();
      const a = await readJsonObject(req);
      const root = resolveRoot(a["rootId"]);
      await removeSkill(root, asName(a["name"], "name"));
      return json(res, 200, { ok: true, state: await snapshotState() });
    });
    registerRoute("/transfer", "dshp-skill-manager: transfer route", async (req, res) => {
      if (req.method !== "POST") return json(res, 405, { ok: false, error: "method not allowed" });
      requireEnabled();
      const a = await readJsonObject(req);
      const fromRoot = resolveRoot(a["fromRootId"]);
      const toRoot = resolveRoot(a["toRootId"]);
      if (fromRoot.id === toRoot.id && a["toName"] === void 0) {
        throw new Error("\u76EE\u6807\u4E0E\u6765\u6E90\u76F8\u540C\u4E14\u672A\u6539\u540D\uFF1A\u6CA1\u6709\u4E1C\u897F\u53EF\u505A");
      }
      await transferSkill(
        fromRoot,
        asName(a["fromName"], "fromName"),
        toRoot,
        trimText(a["toName"], 120),
        a["deleteSource"] === true
      );
      return json(res, 200, { ok: true, state: await snapshotState() });
    });
    try {
      console.info("[dshp-skill-manager] skill routes ready under " + BASE);
    } catch {
    }
  } catch (e) {
    try {
      console.error("[dshp-skill-manager] register routes failed: " + String(e?.message ?? e));
    } catch {
    }
  }
}

export { Config, ConfigSchema, NS, apply, inject, name };
