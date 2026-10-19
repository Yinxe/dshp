import { homedir } from 'os';
import { join } from 'path';
import { readdirSync, statSync, readFileSync, openSync, fstatSync, readSync, closeSync } from 'fs';
import zlib from 'zlib';

// src/host/index.ts

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
  const cached2 = refs.get(source);
  if (cached2) return cached2;
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
  return new Promise((resolve2, reject) => {
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
    req.on("end", () => resolve2(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

// src/host/config.ts
var NS = settingsNamespace("dshp-token-meter");
var VendorSchema = Schema.object({
  id: Schema.string().required(),
  name: Schema.string().required(),
  type: Schema.string().default("manual"),
  params: Schema.dict(Schema.any()).default({}),
  // 余额查询开关：false = 不参与 Host 定时拉取（手动拉取不受影响），缺省 = 启用
  enabled: Schema.boolean().default(true)
});
var ConfigSchema = Schema.object({
  version: Schema.number().step(1).default(1),
  activeVendor: Schema.string().default("").volatile(),
  refreshSec: Schema.number().step(1).min(0).max(3600).default(60).volatile(),
  enabled: Schema.boolean().default(true).volatile(),
  vendors: Schema.array(VendorSchema).default([]).volatile(),
  showToday: Schema.boolean().default(false).volatile(),
  // token 统计默认「全部」；热力图另有自己的 6 个月默认（客户端）
  defaultRange: Schema.union([Schema.const("7"), Schema.const("30"), Schema.const("90"), Schema.const("all")]).default("all").volatile(),
  // 在线时长空闲阈值（分钟）：1/5/15/30/60。缺省 15：DSH 干活时日志里本就有事件，不需要
  // 大阈值兜底；要兜的是「读长回答、想下一个需求」这类几分钟量级的静默期。
  onlineGapMin: Schema.number().step(1).min(1).max(60).default(15).volatile()
});

// src/host/secrets.ts
var DOLLAR_REF_RE = /^\$([A-Za-z_][A-Za-z0-9_]*)$/;
var ENV_REF_RE = /^\{env:([A-Za-z_][A-Za-z0-9_]*)\}$/;
var CRED_REF_RE = /^\{cred:([A-Za-z_][A-Za-z0-9_]*)\}$/;
function normalizeSecretRef(raw) {
  if (typeof raw !== "string") return raw;
  const t = raw.trim();
  let m = t.match(ENV_REF_RE);
  if (m) return "$" + m[1];
  m = t.match(CRED_REF_RE);
  if (m) return "$" + m[1];
  return raw;
}
function secretKindOfRaw(raw) {
  if (raw === void 0 || raw === null || raw === "") return "empty";
  const s = String(raw);
  if (DOLLAR_REF_RE.test(s)) return "ref";
  if (ENV_REF_RE.test(s)) return "env";
  if (CRED_REF_RE.test(s)) return "cred";
  return "plain";
}
function pickAuthFragment(v) {
  const m = String(v).match(/auth=([^;\s]+)/);
  return m ? m[1].trim() : String(v).trim();
}
function createSecretResolver(ctx) {
  return async function resolveSecret(raw) {
    if (typeof raw !== "string" || !raw) return { value: "", kind: "empty" };
    const trimmed = raw.trim();
    let m = trimmed.match(DOLLAR_REF_RE);
    if (m) {
      const refName = m[1];
      try {
        let creds = null;
        try {
          creds = ctx.get("credentials");
        } catch {
          creds = null;
        }
        if (creds) {
          const r = await creds.resolve(refName);
          if (r && r.value) return { value: pickAuthFragment(r.value), kind: "ref" };
        }
      } catch {
      }
      const envVal = process.env[refName] || "";
      if (envVal) return { value: pickAuthFragment(envVal), kind: "ref" };
      throw new Error(
        "\u5BC6\u94A5\u5F15\u7528 $" + refName + " \u4E3A\u7A7A(\u5BC6\u94A5\u6587\u4EF6\u4E0E\u73AF\u5883\u53D8\u91CF\u4E2D\u5747\u672A\u627E\u5230\uFF0C\u5148\u5199\u5165\u51ED\u636E\u6216\u5BFC\u51FA\u73AF\u5883\u53D8\u91CF)"
      );
    }
    m = trimmed.match(ENV_REF_RE);
    if (m) {
      const v = process.env[m[1]] || "";
      if (!v) throw new Error("\u73AF\u5883\u53D8\u91CF " + m[1] + " \u4E3A\u7A7A\u6216\u672A\u5BFC\u51FA(\u5F53\u524D\u8FDB\u7A0B\u8BFB\u4E0D\u5230)");
      return { value: v, kind: "env" };
    }
    m = trimmed.match(CRED_REF_RE);
    if (m) {
      let creds = null;
      try {
        creds = ctx.get("credentials");
      } catch {
        creds = null;
      }
      if (!creds) throw new Error("\u51ED\u636E\u670D\u52A1\u4E0D\u53EF\u7528");
      const r = await creds.resolve(m[1]);
      if (!r || !r.value) throw new Error("\u51ED\u636E " + m[1] + " \u4E3A\u7A7A(\u5148\u7528\u300C\u5B58\u51ED\u636E\u300D\u5199\u5165)");
      return { value: r.value, kind: "cred" };
    }
    if (/^\{(env|cred):/.test(trimmed))
      throw new Error("\u5BC6\u94A5\u5F15\u7528\u8BED\u6CD5\u9519\u8BEF,\u5E94\u4E3A $NAME \u6216 {env:NAME} \u6216 {cred:NAME}");
    if (trimmed.startsWith("$"))
      throw new Error("\u5BC6\u94A5\u5F15\u7528\u8BED\u6CD5\u9519\u8BEF,\u5E94\u4E3A $NAME\uFF08\u5B57\u6BCD/\u6570\u5B57/\u4E0B\u5212\u7EBF\uFF0C\u5B57\u6BCD\u6216\u4E0B\u5212\u7EBF\u5F00\u5934\uFF09");
    return { value: pickAuthFragment(trimmed), kind: "plain" };
  };
}

// src/host/providers/base.ts
var ID_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;
var WORKSPACE_RE = /^[A-Za-z0-9_]{4,64}$/;
function numStr(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function checkAdapterShape(a) {
  if (!a || typeof a !== "object") return "\u9002\u914D\u5668\u4E3A\u7A7A";
  const r = a;
  if (typeof r["type"] !== "string" || !ID_RE.test(r["type"]))
    return "\u9002\u914D\u5668 type \u975E\u6CD5(" + String(r["type"]) + ")";
  if (typeof r["label"] !== "string" || !r["label"]) return "\u9002\u914D\u5668 " + String(r["type"]) + " \u7F3A\u5C11 label";
  if (typeof r["title"] !== "string" || !r["title"]) return "\u9002\u914D\u5668 " + String(r["type"]) + " \u7F3A\u5C11 title";
  if (typeof r["secretField"] !== "string")
    return "\u9002\u914D\u5668 " + String(r["type"]) + " secretField \u987B\u4E3A\u5B57\u7B26\u4E32\uFF08\u65E0\u5BC6\u94A5\u586B\u7A7A\u4E32\uFF09";
  if (!Array.isArray(r["fields"])) return "\u9002\u914D\u5668 " + String(r["type"]) + " \u7F3A\u5C11 fields \u6570\u7EC4";
  if (typeof r["fetch"] !== "function") return "\u9002\u914D\u5668 " + String(r["type"]) + " \u7F3A\u5C11 fetch(vendor, deps)";
  return "";
}

// src/name.ts
var DISPLAY_NAME = "Token \u603B\u89C8";

// src/host/errors.ts
var ProviderError = class extends Error {
  kind;
  hint;
  action;
  docs;
  steps;
  status;
  /** 未显式指定时留 undefined，交给分类默认值（避免覆盖 auth/session 的不可重试语义） */
  retriable;
  constructor(kind, message, opts) {
    super(message, opts && "cause" in opts ? { cause: opts.cause } : void 0);
    this.name = "ProviderError";
    this.kind = kind;
    const o = opts || {};
    if (o.hint) this.hint = o.hint;
    if (o.action) this.action = o.action;
    if (o.docs) this.docs = o.docs;
    if (Array.isArray(o.steps) && o.steps.length) this.steps = o.steps;
    if (typeof o.status === "number") this.status = o.status;
    if (typeof o.retriable === "boolean") this.retriable = o.retriable;
  }
};
var GUIDANCE = {
  auth: {
    title: "\u5BC6\u94A5\u65E0\u6548\u6216\u5DF2\u5931\u6548",
    hint: "\u5E73\u53F0\u62D2\u7EDD\u4E86\u8FD9\u628A\u5BC6\u94A5\uFF1A\u53EF\u80FD\u5DF2\u88AB\u5220\u9664\u3001\u8F6E\u6362\uFF0C\u6216\u590D\u5236\u65F6\u7F3A\u4E86\u5B57\u7B26\u3002\u6362\u6210\u6709\u6548\u7684\u5BC6\u94A5\u5373\u53EF\u6062\u590D\u3002",
    action: "\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D",
    tone: "bad",
    retriable: false
  },
  session: {
    title: "\u767B\u5F55\u72B6\u6001\u5DF2\u8FC7\u671F",
    hint: "\u7F51\u9875\u4F1A\u8BDD\u7968\u636E\uFF08Cookie / Bearer\uFF09\u5DF2\u5931\u6548\uFF0C\u5E73\u53F0\u8BA4\u4E3A\u4F60\u6CA1\u767B\u5F55\u3002\u91CD\u65B0\u6293\u53D6\u6700\u65B0\u503C\u8986\u76D6\u5373\u53EF\u3002",
    action: "\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D",
    tone: "bad",
    retriable: false
  },
  plan: {
    title: "\u8BA2\u9605\u5DF2\u5230\u671F\u6216\u8BA1\u5212\u4E0D\u652F\u6301",
    hint: "\u8BE5\u8D26\u53F7\u5F53\u524D\u8BA1\u5212\u65E0\u6CD5\u4F7F\u7528\u6B64\u63A5\u53E3\uFF0C\u6216\u8BA2\u9605\u5DF2\u7ED3\u675F\u3001\u6263\u6B3E\u5931\u8D25\u3002\u7EED\u8BA2/\u5347\u7EA7\u540E\u518D\u5237\u65B0\u5373\u53EF\u3002",
    action: "\u524D\u5F80\u5E73\u53F0\u786E\u8BA4\u8BA2\u9605\u4E0E\u652F\u4ED8\u72B6\u6001",
    tone: "bad",
    retriable: false
  },
  balance: {
    title: "\u4F59\u989D\u4E0D\u8DB3",
    hint: "\u8D26\u6237\u4F59\u989D\u4E0D\u8DB3\u4EE5\u7EE7\u7EED\u8C03\u7528\uFF0C\u5E73\u53F0\u5DF2\u62D2\u7EDD\u63D0\u4F9B\u670D\u52A1\u3002",
    action: "\u524D\u5F80\u5E73\u53F0\u5145\u503C",
    tone: "bad",
    retriable: false
  },
  rate: {
    title: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF08\u88AB\u9650\u6D41\uFF09",
    hint: "\u77ED\u65F6\u95F4\u5185\u8BF7\u6C42\u8FC7\u591A\uFF0C\u5E73\u53F0\u4E34\u65F6\u9650\u5236\u3002\u7A0D\u540E\u91CD\u8BD5\u5373\u53EF\uFF0C\u65E0\u9700\u6539\u914D\u7F6E\u3002",
    action: "\u7A0D\u7B49 1\u20135 \u5206\u949F\u540E\u70B9\u300C\u5237\u65B0\u300D",
    tone: "warn",
    retriable: true
  },
  network: {
    title: "\u7F51\u7EDC\u4E0D\u53EF\u8FBE",
    hint: "\u8BF7\u6C42\u6CA1\u80FD\u5230\u8FBE\u5E73\u53F0\uFF08DNS \u89E3\u6790\u5931\u8D25\u3001\u4EE3\u7406\u4E0D\u901A\u6216\u8D85\u65F6\uFF09\u3002\u672C\u5730\u7F51\u7EDC\u95EE\u9898\u89E3\u51B3\u540E\u5373\u6062\u590D\u3002",
    action: "\u68C0\u67E5\u7F51\u7EDC / \u4EE3\u7406\u8BBE\u7F6E",
    tone: "warn",
    retriable: true
  },
  parse: {
    title: "\u63A5\u53E3\u8FD4\u56DE\u7ED3\u6784\u5F02\u5E38",
    hint: "\u8BF7\u6C42\u6210\u529F\u4F46\u8FD4\u56DE\u5185\u5BB9\u4E0E\u9884\u671F\u4E0D\u7B26\uFF0C\u901A\u5E38\u662F\u5E73\u53F0\u63A5\u53E3\u6539\u7248\u3002\u9700\u8981\u63D2\u4EF6\u8DDF\u8FDB\u9002\u914D\u3002",
    action: "\u628A\u4E0B\u65B9\u300C\u539F\u59CB\u4FE1\u606F\u300D\u53CD\u9988\u7ED9\u63D2\u4EF6\u7EF4\u62A4\u8005",
    tone: "warn",
    retriable: false
  },
  config: {
    title: "\u4F9B\u5E94\u5546\u914D\u7F6E\u4E0D\u5B8C\u6574",
    hint: "\u8FD8\u7F3A\u5C11\u5FC5\u8981\u7684\u51ED\u636E\u6216\u53C2\u6570\uFF0C\u63D2\u4EF6\u65E0\u6CD5\u53D1\u8D77\u8BF7\u6C42\u3002",
    action: "\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D",
    tone: "warn",
    retriable: false
  },
  server: {
    title: "\u4E0A\u6E38\u670D\u52A1\u5F02\u5E38",
    hint: "\u5E73\u53F0\u8FD4\u56DE\u4E86\u670D\u52A1\u7AEF\u9519\u8BEF\uFF085xx\uFF09\uFF0C\u901A\u5E38\u662F\u5BF9\u65B9\u4E34\u65F6\u6545\u969C\uFF0C\u4E0E\u4F60\u7684\u914D\u7F6E\u65E0\u5173\u3002",
    action: "\u7A0D\u540E\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5",
    tone: "warn",
    retriable: true
  },
  unknown: {
    title: "\u62C9\u53D6\u5931\u8D25",
    hint: "\u672C\u6B21\u62C9\u53D6\u6CA1\u6709\u6210\u529F\uFF0C\u5177\u4F53\u539F\u56E0\u89C1\u4E0B\u65B9\u300C\u539F\u59CB\u4FE1\u606F\u300D\u3002",
    action: "\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5",
    tone: "warn",
    retriable: true
  }
};
var STEPS = {
  auth: [
    "\u6253\u5F00\u8BBE\u7F6E\u9875 \u2192 " + DISPLAY_NAME + " \u2192 \u627E\u5230\u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D",
    "\u5230\u5E73\u53F0\u91CD\u65B0\u751F\u6210\u5BC6\u94A5\u5E76\u7C98\u8D34\u8FDB\u6765\uFF08\u63A8\u8350\u70B9\u300C\u5B58\u51ED\u636E\u300D\u8F6C\u6210 $NAME \u5F15\u7528\uFF09",
    "\u82E5\u5B57\u6BB5\u91CC\u586B\u7684\u662F $NAME\uFF1A\u5148\u66F4\u65B0\u5BF9\u5E94\u7684\u51ED\u636E\u6216\u73AF\u5883\u53D8\u91CF\uFF0C\u6539\u5B8C\u91CD\u542F dsh web",
    "\u4FDD\u5B58\u540E\u70B9\u300C\u5237\u65B0\u300D\u9A8C\u8BC1"
  ],
  session: [
    "\u6D4F\u89C8\u5668\u91CD\u65B0\u767B\u5F55\u5BF9\u5E94\u5E73\u53F0\uFF08\u786E\u8BA4\u767B\u5F55\u6001\u786E\u5B9E\u6709\u6548\uFF09",
    "\u5F00\u53D1\u8005\u5DE5\u5177 \u2192 Network \u2192 \u627E\u5230\u5BF9\u5E94\u8BF7\u6C42\uFF0C\u590D\u5236\u6700\u65B0\u7684 Cookie / Bearer \u7968\u636E",
    "\u56DE\u5230\u8BBE\u7F6E\u9875\u8BE5\u4F9B\u5E94\u5546\uFF0C\u7C98\u8D34\u65B0\u503C\u5E76\u4FDD\u5B58",
    "\u70B9\u300C\u5237\u65B0\u300D\u9A8C\u8BC1\uFF1B\u7968\u636E\u8FC7\u671F\u5C5E\u6B63\u5E38\u73B0\u8C61\uFF0C\u5931\u6548\u540E\u91CD\u590D\u672C\u6D41\u7A0B"
  ],
  plan: [
    "\u767B\u5F55\u5E73\u53F0\u67E5\u770B\u8BA2\u9605\u662F\u5426\u5DF2\u5230\u671F\u3001\u88AB\u53D6\u6D88\u6216\u6263\u6B3E\u5931\u8D25",
    "\u7EED\u8BA2\u6216\u5347\u7EA7\u5230\u5305\u542B\u8BE5\u63A5\u53E3\u7684\u8BA1\u5212",
    "\u82E5\u521A\u7EED\u8BA2\uFF1A\u7B49 1\u20132 \u5206\u949F\u540E\u70B9\u300C\u5237\u65B0\u300D\uFF08\u72B6\u6001\u540C\u6B65\u6709\u5EF6\u8FDF\uFF09",
    "\u786E\u8BA4\u5F53\u524D\u8BA1\u5212\u786E\u5B9E\u63D0\u4F9B\u989D\u5EA6\u67E5\u8BE2\u80FD\u529B\uFF08\u90E8\u5206\u4F4E\u4EF7\u6863\u4F4D\u4E0D\u542B API \u8BBF\u95EE\uFF09"
  ],
  balance: [
    "\u524D\u5F80\u5E73\u53F0\u5145\u503C",
    "\u5145\u503C\u540E\u70B9\u300C\u5237\u65B0\u300D\uFF08\u5230\u8D26\u901A\u5E38\u51E0\u5206\u949F\u5185\u540C\u6B65\uFF09",
    "\u4E5F\u53EF\u8C03\u4F4E\u300C\u4F4E\u4F59\u989D\u9884\u8B66\u7EBF\u300D\u4EE5\u4FBF\u66F4\u65E9\u6536\u5230\u63D0\u9192"
  ],
  rate: [
    "\u7B49\u5F85 1\u20135 \u5206\u949F",
    "\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5",
    "\u82E5\u9891\u7E41\u89E6\u53D1\uFF1A\u628A\u300C\u81EA\u52A8\u5237\u65B0\u300D\u95F4\u9694\u8C03\u5927\uFF0C\u6216\u5BF9\u8BE5\u4F9B\u5E94\u5546\u70B9\u300C\u7981\u7528\u300D\u9000\u51FA\u5B9A\u65F6\u62C9\u53D6"
  ],
  network: [
    "\u786E\u8BA4\u672C\u673A\u80FD\u8BBF\u95EE\u8BE5\u5E73\u53F0\uFF08\u6D4F\u89C8\u5668\u76F4\u63A5\u6253\u5F00\u5E73\u53F0\u9996\u9875\u8BD5\u8BD5\uFF09",
    "\u68C0\u67E5\u4EE3\u7406/VPN/\u9632\u706B\u5899\u8BBE\u7F6E\uFF1B\u9700\u8981\u4EE3\u7406\u65F6\u914D\u7F6E\u597D\u73AF\u5883\u53D8\u91CF\u540E\u91CD\u542F dsh web",
    "\u786E\u8BA4 DNS \u6B63\u5E38\uFF08\u80FD\u89E3\u6790\u5E73\u53F0\u57DF\u540D\uFF09",
    "\u6392\u9664\u540E\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5"
  ],
  parse: [
    "\u5148\u70B9\u4E00\u6B21\u300C\u5237\u65B0\u300D\uFF0C\u6392\u9664\u5076\u53D1\u7684\u7F51\u5173\u9519\u8BEF\u9875",
    "\u82E5\u6301\u7EED\u5931\u8D25\uFF1A\u5E73\u53F0\u63A5\u53E3\u5927\u6982\u7387\u5DF2\u6539\u7248\uFF0C\u9700\u8981\u63D2\u4EF6\u9002\u914D",
    "\u628A\u4E0B\u65B9\u300C\u539F\u59CB\u4FE1\u606F\u300D\u8FDE\u540C\u63D2\u4EF6\u7248\u672C\u4E00\u8D77\u53CD\u9988\u7ED9\u7EF4\u62A4\u8005",
    "\u786E\u8BA4\u63D2\u4EF6\u4E0E DSH \u90FD\u5DF2\u66F4\u65B0\u5230\u6700\u65B0\u7248\u672C"
  ],
  config: [
    "\u6253\u5F00\u8BBE\u7F6E\u9875 \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D",
    "\u8865\u9F50\u6807 * \u7684\u5FC5\u586B\u5B57\u6BB5",
    "\u82E5\u7528 $NAME \u5F15\u7528\uFF1A\u786E\u8BA4\u51ED\u636E\u6216\u73AF\u5883\u53D8\u91CF\u91CC\u786E\u5B9E\u6709\u8FD9\u4E2A\u952E\uFF08$ \u5F15\u7528\u8BFB\u4E0D\u5230\u4F1A\u76F4\u63A5\u62A5\u9519\uFF09",
    "\u4FDD\u5B58\u540E\u70B9\u300C\u5237\u65B0\u300D\u9A8C\u8BC1"
  ],
  server: ["\u7A0D\u7B49\u51E0\u5206\u949F", "\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5", "\u82E5\u957F\u65F6\u95F4 5xx\uFF1A\u591A\u4E3A\u5E73\u53F0\u6545\u969C\uFF0C\u53EF\u5230\u5E73\u53F0\u72B6\u6001\u9875\u786E\u8BA4"],
  unknown: ["\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5\u4E00\u6B21", "\u82E5\u6301\u7EED\u5931\u8D25\uFF0C\u628A\u4E0B\u65B9\u300C\u539F\u59CB\u4FE1\u606F\u300D\u53CD\u9988\u7ED9\u63D2\u4EF6\u7EF4\u62A4\u8005"]
};
function classifyMessage(raw) {
  const m = String(raw);
  if (!m) return "unknown";
  if (/未配置|凭据未配置|必填|参数非法|workspaceId 非法|ID 非法|引用语法错误/.test(m)) return "config";
  if (/会话失效|会话已过期|登录失效|登录态|被风控|logged out|refresh and login|票据.*(过期|失效)|未登录/i.test(
    m
  ) || // 网页接口在 HTTP 200 + 错误信封里报的会话问题（实测 40003 "Authorization Failed (invalid token)"）
  /invalid\s*token|authorization\s*failed|token.{0,12}(expired|invalid|失效|过期)/i.test(m))
    return "session";
  if (/密钥无效|密钥已失效|密钥引用.*为空|凭据无效|Invalid 'Authorization'|invalid.{0,12}api.?key/i.test(m))
    return "auth";
  if (/upgrade_required|订阅.*(到期|结束|失败|取消)|计划.*(不含|不支持|已到期)|plan.{0,12}(expired|ended|cancel)/i.test(
    m
  ))
    return "plan";
  if (/余额不足|insufficient|402/.test(m)) return "balance";
  if (/限流|429|rate.?limit|too many request/i.test(m)) return "rate";
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|getaddrinfo|socket hang up|network|超时|timeout|proxy/i.test(
    m
  ))
    return "network";
  if (/非 JSON|结构异常|字段缺失|解析失败|改版|非数字|未命中|顶层非对象/.test(m)) return "parse";
  if (/\bHTTP 5\d\d\b|\b5\d\d\b.*(Bad Gateway|Service Unavailable|Internal)/.test(m)) return "server";
  if (/\b401\b|\b403\b/.test(m)) return "auth";
  return "unknown";
}
function statusOf(e, kind) {
  if (e instanceof ProviderError && typeof e.status === "number") return e.status;
  const m = String(e?.message ?? "");
  const hit = m.match(/\b(4\d\d|5\d\d)\b/);
  if (hit) return Number(hit[1]);
  if (kind === "auth") return 401;
  return void 0;
}
function toErrorInfo(e, ctx) {
  const message = (e instanceof Error ? e.message : typeof e === "string" ? e : "") || "\u62C9\u53D6\u5931\u8D25\uFF08\u672A\u63D0\u4F9B\u9519\u8BEF\u4FE1\u606F\uFF09";
  const explicit = e instanceof ProviderError ? e : null;
  const kind = explicit ? explicit.kind : classifyMessage(message);
  const g = GUIDANCE[kind];
  const steps = explicit && explicit.steps || STEPS[kind];
  const status = statusOf(e, kind);
  const info = {
    kind,
    title: g.title,
    hint: explicit?.hint || g.hint,
    action: explicit?.action || g.action,
    steps: steps.slice(0, 6),
    detail: message,
    // 显式声明优先；未声明则用分类默认（auth/session/plan/balance = 先改配置再重试）
    retriable: explicit?.retriable ?? g.retriable,
    tone: g.tone
  };
  if (status !== void 0) info.status = status;
  const docs = explicit?.docs;
  if (docs) info.docs = docs;
  if (ctx && ctx.secretKind && (kind === "auth" || kind === "session")) {
    const isRef = ctx.secretKind === "ref";
    const prefix = kind === "auth" ? isRef ? "\u5B57\u6BB5\u586B\u7684\u662F $NAME \u5F15\u7528\uFF1A\u8BF7\u5148\u786E\u8BA4\u51ED\u636E/\u73AF\u5883\u53D8\u91CF\u91CC\u8BE5\u952E\u5B58\u5728\u4E14\u662F\u6700\u65B0\u503C\uFF08\u6539\u5B8C\u9700\u91CD\u542F dsh web\uFF09\u3002" : "\u5B57\u6BB5\u586B\u7684\u662F\u660E\u6587\uFF1A\u8BF7\u5230\u5E73\u53F0\u91CD\u65B0\u751F\u6210\u540E\u7C98\u8D34\u65B0\u503C\u3002" : isRef ? "\u5B57\u6BB5\u586B\u7684\u662F $NAME \u5F15\u7528\uFF1A\u66F4\u65B0\u51ED\u636E/\u73AF\u5883\u53D8\u91CF\u540E\u9700\u91CD\u542F dsh web \u624D\u751F\u6548\uFF0C\u968F\u540E\u70B9\u300C\u5DF2\u5904\u7406\uFF0C\u9A8C\u8BC1\u300D\u3002" : "\u5F53\u524D\u4E3A\u624B\u52A8\u7C98\u8D34\u7684\u660E\u6587\u51ED\u636E\uFF1A\u8FC7\u671F\u5C5E\u6B63\u5E38\u73B0\u8C61\uFF0C\u91CD\u65B0\u767B\u5F55\u6293\u53D6\u540E\u518D\u7C98\u8D34\u5373\u53EF\u3002";
    info.hint = prefix + info.hint;
  }
  return info;
}

// src/host/providers/opencode.ts
var LEGACY_AUTH_FIELD = "auth";
function effectiveCookie(params) {
  const p = params && typeof params === "object" ? params : {};
  const c = p["cookie"];
  if (typeof c === "string" && c.trim() !== "") return c;
  const a = p[LEGACY_AUTH_FIELD];
  if (typeof a === "string" && a.trim() !== "") return a;
  return "";
}
function toCookieHeader(secret) {
  const s = String(secret || "").trim();
  if (s === "") return "";
  if (s.indexOf("=") !== -1) return s;
  return "auth=" + s;
}
function sanitizeCookieParams(raw) {
  const src = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v !== void 0) out[k] = typeof v === "string" ? normalizeSecretRef(v) : v;
  }
  if (typeof out["cookie"] === "string") out["cookie"] = normalizeSecretRef(out["cookie"]);
  if (typeof out[LEGACY_AUTH_FIELD] === "string")
    out[LEGACY_AUTH_FIELD] = normalizeSecretRef(out[LEGACY_AUTH_FIELD]);
  if ((out["cookie"] === void 0 || out["cookie"] === "") && typeof out[LEGACY_AUTH_FIELD] === "string" && out[LEGACY_AUTH_FIELD] !== "") {
    out["cookie"] = out[LEGACY_AUTH_FIELD];
  }
  return out;
}
function maskCookieParams(params) {
  const out = { ...params };
  for (const k of ["cookie", LEGACY_AUTH_FIELD]) {
    if (typeof out[k] === "string" && out[k] !== "" && secretKindOfRaw(out[k]) === "plain") out[k] = "";
  }
  return out;
}
var GO_PATH = "/go";
var BILLING_PATH = "/billing";
var BILLING_UNIT = 1e8;
function inlineVal(html, key) {
  const re = new RegExp(key + '\\s*:\\s*("([^"]{0,80})"|null|true|false|(-?\\d+(?:\\.\\d+)?))');
  const m = re.exec(html);
  if (!m) return void 0;
  if (m[2] !== void 0) return m[2];
  if (m[3] !== void 0) return Number(m[3]);
  if (m[1] === "null") return null;
  if (m[1] === "true") return true;
  if (m[1] === "false") return false;
  return void 0;
}
var mmdd = (d) => d ? String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0") : "";
function fmtLeftCn(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  if (s >= 86400) return Math.floor(s / 86400) + " \u5929";
  if (s >= 3600) return Math.floor(s / 3600) + " \u5C0F\u65F6";
  if (s >= 60) return Math.floor(s / 60) + " \u5206\u949F";
  return s + " \u79D2";
}
function billingAmount(amount) {
  if (amount === void 0 || amount === null) return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n / BILLING_UNIT * 100) / 100;
}
function parseSubscription(goHtml, billingHtml) {
  const src = (goHtml || "") + "\n" + (billingHtml || "");
  const plan = inlineVal(src, "subscriptionPlan");
  if (typeof plan === "string" && plan && plan !== "null") {
    const sub = inlineVal(src, "subscription");
    return { plan: String(plan), note: sub ? "\u8BA2\u9605\u751F\u6548\u4E2D" : "", expireAt: null };
  }
  const liteId = inlineVal(src, "liteSubscriptionID");
  if (typeof liteId === "string" && liteId && liteId !== "null") {
    const paid = latestLitePurchase(billingHtml || "");
    return { plan: "Lite", note: paid ? "\u8D2D\u4E70\u4E8E " + mmdd(paid) : "", expireAt: null };
  }
  return null;
}
function latestLitePurchase(billingHtml) {
  const html = billingHtml || "";
  let latest = null;
  const re = /timeCreated\s*:\s*(?:new Date\()?"(\d{4}-\d{2}-\d{2}T[0-9:.]+Z?)"[^}]{0,400}?type\s*:\s*"lite"/g;
  let m = null;
  while ((m = re.exec(html)) !== null) {
    const d = new Date(m[1]);
    if (!Number.isNaN(d.getTime()) && (latest === null || d > latest)) latest = d;
  }
  if (latest === null) {
    const re2 = /type\s*:\s*"lite"[^}]{0,400}?timeCreated\s*:\s*(?:new Date\()?"(\d{4}-\d{2}-\d{2}T[0-9:.]+Z?)"/g;
    while ((m = re2.exec(html)) !== null) {
      const d = new Date(m[1]);
      if (!Number.isNaN(d.getTime()) && (latest === null || d > latest)) latest = d;
    }
  }
  return latest;
}
var GO_WINDOW_DEFS = [
  ["rollingUsage", "5h", "5 \u5C0F\u65F6"],
  ["weeklyUsage", "weekly", "\u6BCF\u5468"],
  ["monthlyUsage", "monthly", "\u6BCF\u6708"]
];
function parseGoWindow(html, srcKey) {
  const m = new RegExp(srcKey + ":(?:\\$?[A-Za-z_$][\\w$]*\\[\\d+\\]=\\s*)?\\{([^}]*)\\}").exec(html);
  if (!m) return null;
  const body = m[1];
  if (!/usagePercent:/.test(body)) return null;
  const num = (k) => {
    const mm = new RegExp(k + ':\\s*"?(-?[\\d.]+)"?').exec(body);
    return mm ? Number(mm[1]) : 0;
  };
  const st = /status:\s*"([^"]*)"/.exec(body);
  return {
    status: st ? st[1] : "ok",
    resetInSec: num("resetInSec"),
    pct: num("usagePercent"),
    used: num("usage"),
    limit: num("limit")
  };
}
function scanGoWindowsGeneric(html) {
  const re = /\{([^{}]*status:\s*"[^"]*"[^{}]*)\}/g;
  const out = [];
  let m = null;
  while ((m = re.exec(html)) !== null) {
    const body = m[1];
    if (!/resetInSec:/.test(body) || !/usagePercent:/.test(body)) continue;
    const num = (k) => {
      const mm = new RegExp(k + ':\\s*"?(-?[\\d.]+)"?').exec(body);
      return mm ? Number(mm[1]) : 0;
    };
    const st = /status:\s*"([^"]*)"/.exec(body);
    out.push({
      status: st ? st[1] : "ok",
      resetInSec: num("resetInSec"),
      pct: num("usagePercent"),
      used: num("usage"),
      limit: num("limit")
    });
  }
  return out;
}
function rawToWindow(w, key, label) {
  const win = {
    key,
    label,
    pct: w.pct,
    used: w.used,
    limit: w.limit,
    resetInSec: w.resetInSec
  };
  if (w.status) win.status = w.status;
  return win;
}
function goPlan(html) {
  const pm = /subscriptionPlan:([A-Za-z0-9_]+|null)/.exec(html);
  return pm && pm[1] !== "null" ? pm[1] : null;
}
function parseGoQuotaFull(html) {
  const h = html || "";
  let windows = [];
  for (const [srcKey, key, label] of GO_WINDOW_DEFS) {
    const w = parseGoWindow(h, srcKey);
    if (w) windows.push(rawToWindow(w, key, label));
  }
  if (!windows.length) {
    windows = scanGoWindowsGeneric(h).slice(0, 3).map((w, i) => {
      const def = GO_WINDOW_DEFS[i];
      return rawToWindow(w, def[1], def[2]);
    });
  }
  const plan = goPlan(h);
  const active = windows.filter((w) => w.limit > 0);
  if (active.length) return { kind: "ok", windows: active, plan };
  if (windows.length) return { kind: "inactive", windows, plan };
  if (/(?:rolling|weekly|monthly)Usage:\s*(?:\$?[\w$]+\[\d+\]=\s*)?\{/.test(h)) return { kind: "broken" };
  return { kind: "none" };
}
function parseOpencodePages(goHtml, billingHtml, opts) {
  const gq = parseGoQuotaFull(goHtml || "");
  const sub = parseSubscription(goHtml || "", billingHtml || "");
  const balance = billingAmount(inlineVal(billingHtml || "", "balance"));
  const optsEff = opts || {};
  if (gq.kind === "broken") {
    throw new ProviderError(
      "parse",
      "opencode /go \u9875\u542B\u989D\u5EA6\u7A97\u53E3\u4F46\u5B57\u6BB5\u65E0\u6CD5\u8BC6\u522B\uFF08\u9875\u9762\u53EF\u80FD\u5DF2\u6539\u7248\uFF09\uFF0C\u8BF7\u628A\u8BE5\u9875\u5B57\u6BB5\u6837\u4F8B\u53CD\u9988\u7ED9\u7EF4\u62A4\u8005",
      { hint: "\u68C0\u6D4B\u5230\u8BA2\u9605\u7A97\u53E3\u6570\u636E\uFF0C\u4F46\u5B57\u6BB5\u683C\u5F0F\u53D8\u4E86\uFF0C\u63D2\u4EF6\u6682\u65F6\u8BFB\u4E0D\u51FA\u6765\u3002", retriable: false }
    );
  }
  const q = gq.kind === "ok" ? gq : null;
  const subInactive = gq.kind === "inactive";
  if (q) {
    const billing = { balance, plan: sub && sub.plan || q.plan || "Opencode" };
    const extra2 = {};
    if (sub && (sub.note || sub.plan)) {
      const monthly = q.windows.filter((w) => w.key === "monthly")[0];
      const renewIn = monthly && monthly.resetInSec > 0 ? monthly.resetInSec : null;
      extra2.blocks = [
        {
          kind: "note",
          tone: "info",
          text: "\u8BA2\u9605 " + sub.plan + (sub.note ? " \xB7 " + sub.note : "") + (renewIn !== null ? " \xB7 \u6BCF\u6708\u7A97\u53E3\u7EA6 " + fmtLeftCn(renewIn) + "\u540E\u91CD\u7F6E" : "")
        }
      ];
    }
    if (balance !== null && balance !== void 0) {
      extra2.stats = [{ label: "\u5145\u503C\u4F59\u989D", value: String(balance) }];
    }
    return {
      billingKind: "rolling",
      windows: q.windows,
      billing,
      extra: extra2.blocks || extra2.stats ? extra2 : null
    };
  }
  if (balance !== null && balance !== void 0) {
    const currency = optsEff.currency || "USD";
    const notes = [];
    if (subInactive) {
      notes.push({
        kind: "note",
        tone: "warn",
        text: "\u672A\u68C0\u6D4B\u5230\u751F\u6548\u4E2D\u7684\u989D\u5EA6\u7A97\u53E3\uFF08\u8BA2\u9605\u53EF\u80FD\u5DF2\u7ED3\u675F\u6216\u672A\u751F\u6548\uFF09" + (sub && sub.plan ? "\uFF08\u9875\u9762\u6807\u8BC6\uFF1A" + sub.plan + "\uFF09" : "") + "\uFF0C\u5F53\u524D\u6309\u4F59\u989D\u8BA1\u8D39\uFF1A\u8BF7\u5230\u5E73\u53F0\u786E\u8BA4\u8BA2\u9605\u72B6\u6001\u3002"
      });
    } else if (sub) {
      notes.push({
        kind: "note",
        tone: "info",
        text: "\u8BA2\u9605 " + sub.plan + (sub.note ? " \xB7 " + sub.note : "")
      });
    }
    return {
      billingKind: "payg",
      billing: {
        balance: numStr(balance),
        currency,
        granted: null,
        toppedUp: null,
        isAvailable: balance > 0 ? true : null,
        infos: [],
        lowWarn: optsEff.lowWarn !== void 0 && optsEff.lowWarn !== "" && optsEff.lowWarn !== null ? Number(optsEff.lowWarn) : null,
        plan: subInactive ? "Opencode \u8BA2\u9605\u672A\u751F\u6548" : "Opencode Zen"
      },
      extra: notes.length ? { blocks: notes } : null
    };
  }
  return null;
}
var opencode = {
  type: "opencode",
  icon: "opencode",
  label: "OC",
  title: "opencode\uFF08Go+Zen \u5408\u5E76\uFF09",
  secretField: "cookie",
  hint: "\u5B98\u65B9\u6E20\u9053\u5408\u5E76\u7248\uFF1A\u540C\u4E00 workspace+cookie \u540C\u65F6\u62C9 /go\uFF08\u4E09\u7A97\u53E3+\u8BA2\u9605\uFF09\u4E0E /billing\uFF08\u4F59\u989D\uFF09\u3002\u65E7 opencode-go / opencode-zen \u914D\u7F6E\u81EA\u52A8\u8FC1\u79FB\u3002",
  fields: [
    {
      key: "workspaceId",
      label: "workspaceId *",
      kind: "text",
      mono: true,
      required: true,
      placeholder: "\u5982\uFF1Awrk_xxx",
      hint: "\u5DE5\u4F5C\u533A ID\uFF1A\u6D4F\u89C8\u5668\u6253\u5F00 opencode.ai \u5E76\u8FDB\u5165\u4F60\u7684\u5DE5\u4F5C\u533A\uFF0C\u5730\u5740\u680F workspace/ \u540E\u9762\u7684 wrk_ \u5F00\u5934\u5B57\u7B26\u4E32\uFF08Go \u4E0E Zen \u9875\u9762\u901A\u7528\uFF09\u3002"
    },
    {
      key: "cookie",
      label: "cookie *",
      kind: "secret",
      mono: true,
      required: true,
      placeholder: "\u586B $NAME \u5F15\u7528\uFF08\u63A8\u8350\uFF09\u6216\u7C98\u8D34 Cookie",
      hint: "\u767B\u5F55\u6001\uFF1A\u6D4F\u89C8\u5668\u5F00\u53D1\u8005\u5DE5\u5177 \u2192 Application \u2192 Cookies \u2192 \u590D\u5236 auth \u7684\u503C\uFF1B\u6574\u6BB5 Cookie\uFF08\u542B oc_locale \u7B49\uFF09\u539F\u6837\u7C98\u8D34\u4EA6\u53EF\u3002\u5EFA\u8BAE\u5148\u5B58\u5165\u7CFB\u7EDF\u51ED\u636E\u518D\u586B $NAME\u3002"
    },
    {
      key: "lowWarn",
      label: "\u4F4E\u4F59\u989D\u9884\u8B66\u7EBF",
      kind: "number",
      placeholder: "\u5982\uFF1A10",
      hint: "\u4F59\u989D\u4F4E\u4E8E\u6B64\u503C\u65F6\u4FA7\u8FB9\u680F\u9EC4\u8272\u63D0\u9192\uFF08USD\uFF0C\u6309\u91CF\u6A21\u5F0F\u624D\u751F\u6548\uFF09\u3002"
    },
    {
      key: "currency",
      label: "\u4F18\u5148\u5E01\u79CD",
      kind: "text",
      mono: true,
      placeholder: "\u9ED8\u8BA4 USD",
      hint: "\u6309\u91CF\u4F59\u989D\u5C55\u793A\u5E01\u79CD\uFF08\u9875\u9762\u672A\u58F0\u660E\u5E01\u79CD\uFF0C\u9ED8\u8BA4\u6309 USD\uFF09\u3002"
    }
  ],
  sanitizeParams: sanitizeCookieParams,
  readSecret: (params) => effectiveCookie(params),
  maskParams: maskCookieParams,
  validateParams(params) {
    const wid = params && params["workspaceId"] !== void 0 && params["workspaceId"] !== null ? String(params["workspaceId"]) : "";
    if (!WORKSPACE_RE.test(wid)) return "workspaceId \u975E\u6CD5";
    return "";
  },
  async fetch(vendor, deps) {
    const params = vendor && vendor.params || {};
    const wid = params["workspaceId"] || "";
    if (!WORKSPACE_RE.test(String(wid)))
      throw new ProviderError(
        "config",
        "workspaceId \u975E\u6CD5\uFF084~64 \u4F4D\u5B57\u6BCD/\u6570\u5B57/\u4E0B\u5212\u7EBF\uFF0C\u5982 wrk_xxx\uFF0C\u89C1\u5B57\u6BB5\u8BF4\u660E\uFF09",
        { hint: "workspaceId \u6CA1\u586B\u6216\u683C\u5F0F\u4E0D\u5BF9\uFF0C\u63D2\u4EF6\u65E0\u6CD5\u62FC\u51FA\u989D\u5EA6\u9875\u5730\u5740\u3002", retriable: false }
      );
    const r = await deps.resolveSecret(effectiveCookie(params));
    if (!r.value)
      throw new ProviderError(
        "config",
        "cookie \u672A\u914D\u7F6E\uFF1A\u5F53\u524D\u4E3A" + r.kind + "\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u9875\u586B\u5199 Cookie \u6216\u68C0\u67E5 $NAME \u5F15\u7528\uFF08\u83B7\u53D6\u65B9\u5F0F\u89C1\u5B57\u6BB5\u8BF4\u660E\uFF09",
        { hint: "\u7F3A\u5C11\u767B\u5F55\u6001 Cookie\uFF0C\u63D2\u4EF6\u65E0\u6CD5\u8BFB\u53D6\u989D\u5EA6\u9875\u3002", retriable: false }
      );
    const fetchImpl = deps && deps.fetchImpl || fetch;
    const base = "https://opencode.ai/workspace/" + wid;
    const header = { Cookie: toCookieHeader(r.value), Accept: "text/html" };
    const [goRes, billingRes] = await Promise.all([
      fetchImpl(base + GO_PATH, { headers: header, cache: "no-store" }).catch(() => null),
      fetchImpl(base + BILLING_PATH, { headers: header, cache: "no-store" }).catch(() => null)
    ]);
    let goHtml = "";
    let billingHtml = "";
    if (goRes) goHtml = await goRes.text().catch(() => "");
    if (billingRes) billingHtml = await billingRes.text().catch(() => "");
    const goHasQuota = /(rolling|weekly|monthly)Usage:/.test(goHtml) || goHtml.indexOf("usagePercent") !== -1;
    if (!goHasQuota && billingHtml.indexOf("balance") === -1) {
      throw new ProviderError(
        "session",
        "\u767B\u5F55\u5931\u6548\u6216\u88AB\u98CE\u63A7\uFF08/go " + goHtml.length + "B \xB7 /billing " + billingHtml.length + "B \u5747\u65E0\u6570\u636E\uFF09",
        {
          hint: "\u4E24\u9875\u90FD\u6CA1\u8FD4\u56DE\u989D\u5EA6\u6570\u636E\uFF1ACookie \u5DF2\u8FC7\u671F\uFF0C\u6216\u8BF7\u6C42\u88AB\u5E73\u53F0\u98CE\u63A7\u62E6\u622A\u3002\u91CD\u65B0\u767B\u5F55\u5E76\u66F4\u65B0 Cookie \u5373\u53EF\u3002",
          action: "opencode.ai \u91CD\u65B0\u767B\u5F55 \u2192 \u590D\u5236\u65B0 Cookie \u2192 \u8BBE\u7F6E\u9875\u300C\u7F16\u8F91\u300D"
        }
      );
    }
    let data;
    try {
      data = parseOpencodePages(goHtml, billingHtml, {
        lowWarn: params["lowWarn"],
        currency: params["currency"]
      });
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      throw new ProviderError("parse", e?.message || "\u9875\u9762\u89E3\u6790\u5931\u8D25", { cause: e });
    }
    if (!data)
      throw new ProviderError(
        "parse",
        "\u9875\u9762\u7ED3\u6784\u53D8\u5316\uFF0C\u89E3\u6790\u5931\u8D25\uFF08\u65E0\u7A97\u53E3\u4E14\u65E0\u4F59\u989D\u5B57\u6BB5\uFF09\uFF0C\u8BF7\u628A\u4E24\u9875\u9876\u5C42\u952E\u540D\u53D1\u7ED9\u7EF4\u62A4\u8005",
        { hint: "opencode \u9875\u9762\u7ED3\u6784\u53EF\u80FD\u5DF2\u6539\u7248\uFF0C\u9700\u8981\u63D2\u4EF6\u8DDF\u8FDB\u9002\u914D\u3002" }
      );
    return { ...data, secretKind: r.kind, via: "\u5B98\u65B9\u6E20\u9053" };
  }
};
var opencode_default = opencode;

// src/host/providers/deepseek-api.ts
function isRecord(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function pickBalanceInfo(infos, prefer) {
  if (!Array.isArray(infos) || !infos.length) return null;
  if (prefer) {
    const hit = infos.filter((x) => isRecord(x) && x["currency"] === prefer)[0];
    if (hit) return hit;
  }
  const cny = infos.filter((x) => isRecord(x) && x["currency"] === "CNY")[0];
  if (cny) return cny;
  return infos[0];
}
function curSym(cur) {
  if (cur === "CNY") return "\xA5";
  if (cur === "USD") return "$";
  return "";
}
async function fetchOfficialBalance(params, secret, fetchImpl) {
  const url = "https://api.deepseek.com/user/balance";
  const res = await fetchImpl(url, { headers: { Authorization: "Bearer " + secret }, cache: "no-store" });
  const code = res.status;
  const body = await res.text();
  if (code === 401)
    throw new ProviderError("auth", "DeepSeek \u5BC6\u94A5\u65E0\u6548(401)\uFF1A" + body.slice(0, 100), {
      status: code,
      hint: "\u5B98\u65B9\u4F59\u989D\u63A5\u53E3\u62D2\u7EDD\u4E86\u8FD9\u4E2A apiKey\uFF08\u5E94 sk- \u5F00\u5934\uFF09\u3002\u8BF7\u786E\u8BA4\u5B83\u6765\u81EA open platform \u4E14\u672A\u88AB\u5220\u9664\u3002",
      action: "\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300DapiKey"
    });
  if (code === 402)
    throw new ProviderError("balance", "DeepSeek \u4F59\u989D\u4E0D\u8DB3(402)\uFF1A" + body.slice(0, 100), { status: code });
  if (code === 429)
    throw new ProviderError("rate", "DeepSeek \u9650\u6D41(429)\uFF1A" + body.slice(0, 100), { status: code });
  if (code >= 500)
    throw new ProviderError("server", "DeepSeek \u670D\u52A1\u7AEF\u9519\u8BEF(" + code + ")\uFF1A" + body.slice(0, 100), {
      status: code
    });
  if (code !== 200)
    throw new ProviderError("unknown", "DeepSeek \u63A5\u53E3 HTTP " + code + "\uFF1A" + body.slice(0, 100), {
      status: code
    });
  let j = null;
  try {
    j = JSON.parse(body);
  } catch {
    throw new ProviderError("parse", "\u4F59\u989D\u63A5\u53E3\u8FD4\u56DE\u975E JSON(" + body.length + "B)\uFF1A" + body.slice(0, 80));
  }
  const jr = j ?? {};
  if (jr && jr["error"]) {
    const em = isRecord(jr["error"]) ? String(jr["error"]["message"] ?? "") : "";
    throw new ProviderError("unknown", "\u4F59\u989D\u63A5\u53E3\u62A5\u9519\uFF1A" + (em || body.slice(0, 80)));
  }
  let infos = jr && Array.isArray(jr["balance_infos"]) ? jr["balance_infos"] : null;
  const isAvail = jr && jr["is_available"] !== void 0 ? !!jr["is_available"] : null;
  if (!infos && jr && jr["total_balance"] !== void 0) {
    infos = [
      {
        currency: jr["currency"] || "CNY",
        total_balance: jr["total_balance"],
        granted_balance: jr["granted_balance"],
        topped_up_balance: jr["topped_up_balance"]
      }
    ];
  }
  if (!infos)
    throw new ProviderError("parse", "\u4F59\u989D\u63A5\u53E3\u5B57\u6BB5\u7F3A\u5931\uFF08\u65E0 balance_infos\uFF09\uFF1A" + String(body).slice(0, 100));
  const prefer = params && params["currency"] || "";
  const primary = pickBalanceInfo(infos, prefer);
  if (!primary) throw new ProviderError("parse", "\u4F59\u989D\u4E3A\u7A7A\uFF08balance_infos \u91CC\u6CA1\u6709\u53EF\u7528\u6761\u76EE\uFF09");
  const normInfos = infos.map((x) => {
    const xr = x ?? {};
    return {
      currency: String(xr["currency"] || ""),
      total: numStr(xr["total_balance"]),
      granted: xr["granted_balance"] !== void 0 && xr["granted_balance"] !== null && xr["granted_balance"] !== "" ? numStr(xr["granted_balance"]) : null,
      toppedUp: xr["topped_up_balance"] !== void 0 && xr["topped_up_balance"] !== null && xr["topped_up_balance"] !== "" ? numStr(xr["topped_up_balance"]) : null
    };
  });
  const g = primary["granted_balance"] !== void 0 && primary["granted_balance"] !== null && primary["granted_balance"] !== "" ? numStr(primary["granted_balance"]) : null;
  const t = primary["topped_up_balance"] !== void 0 && primary["topped_up_balance"] !== null && primary["topped_up_balance"] !== "" ? numStr(primary["topped_up_balance"]) : null;
  const currency = String(primary["currency"] || "CNY");
  const balance = numStr(primary["total_balance"]);
  let extra2 = null;
  const totalQuota = (g !== null ? g : 0) + (t !== null ? t : 0);
  if (totalQuota > 0) {
    const used = Math.max(0, totalQuota - balance);
    const r2 = (n) => Math.round(Number(n) * 100) / 100;
    extra2 = {
      blocks: [
        {
          kind: "progress",
          label: "\u603B\u989D\u5EA6\u6D88\u8017",
          used: r2(used),
          total: r2(totalQuota),
          left: "\u5269\u4F59 " + curSym(currency) + balance.toFixed(2)
        }
      ]
    };
  }
  return {
    billingKind: "payg",
    billing: {
      balance,
      currency,
      granted: g,
      toppedUp: t,
      isAvailable: isAvail,
      infos: normInfos,
      lowWarn: params["lowWarn"] !== void 0 && params["lowWarn"] !== "" ? Number(params["lowWarn"]) : null,
      plan: "DeepSeek API"
    },
    extra: extra2
  };
}

// src/host/providers/deepseek-web.ts
var SUMMARY_URL = "https://platform.deepseek.com/api/v0/users/get_user_summary";
var BALANCE_KEYS = [
  "total_balance",
  "total",
  "balance",
  "available_balance",
  "balance_amount",
  "amount",
  "remaining",
  "remaining_balance",
  "current_balance"
];
var GRANTED_KEYS = ["granted_balance", "granted", "gift_balance", "free_balance"];
var TOPPED_KEYS = ["topped_up_balance", "topped_up", "recharged", "recharge_balance", "paid_balance"];
var CURRENCY_KEYS = ["currency", "currency_unit", "money_unit"];
var DATE_KEYS = ["date", "day", "time", "created_at", "timestamp", "stat_date", "biz_date"];
var VALUE_KEYS = [
  "total_tokens",
  "tokens",
  "token",
  "tokens_used",
  "usage_tokens",
  "cost",
  "amount",
  "expense",
  "requests",
  "calls",
  "count",
  "api_calls"
];
function isObj2(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isRecord2(v) {
  return isObj2(v);
}
function toNum(v) {
  if (v === void 0 || v === null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}
function unwrapEnvelope(j) {
  const ENVELOPES = ["data", "biz_data"];
  let cur = j;
  let guard = 0;
  while (isObj2(cur) && guard++ < 4) {
    let next = null;
    for (const k of ENVELOPES) {
      const cand = cur[k];
      if (cand !== void 0 && cand !== null && (isObj2(cand) || Array.isArray(cand))) {
        next = cand;
        break;
      }
    }
    if (next === null) break;
    cur = next;
  }
  return cur;
}
function envelopeError(node) {
  if (!isObj2(node)) return null;
  const raw = node["code"] ?? node["biz_code"] ?? node["err_code"] ?? node["error_code"];
  if (raw === void 0 || raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n === 0) return null;
  const msg = node["msg"] ?? node["message"] ?? node["biz_msg"] ?? node["err_msg"] ?? "";
  return "\u6C47\u603B\u63A5\u53E3\u62A5\u9519(" + String(raw) + ")" + (msg ? ":" + String(msg).slice(0, 120) : "") + "\uFF08\u5982\u521A\u767B\u5F55\u8FC7\u4ECD\u62A5\u9519\uFF0C\u8BF7\u91CD\u65B0\u7C98\u8D34 cookie \u4E0E token\uFF09";
}
function envelopeThrow(msg) {
  if (/40003/.test(msg)) {
    if (/api.?key/i.test(msg)) {
      throw new ProviderError("auth", msg, {
        hint: "\u5B98\u65B9 sk- \u5BC6\u94A5\u4E0D\u80FD\u7528\u4E8E\u7F51\u9875\u8D26\u5355\u63A5\u53E3\uFF08\u4E24\u5957\u51ED\u636E\u4F53\u7CFB\u4E0D\u901A\u7528\uFF09\u3002\u8BF7\u628A\u5B83\u6539\u586B\u5230 apiKey \u680F\uFF0C\u6216\u76F4\u63A5\u7528 deepseek \u7C7B\u578B\u8BA9\u5B83\u81EA\u52A8\u9009\u8DEF\u3002",
        action: "\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D"
      });
    }
    throw new ProviderError("session", msg, {
      hint: "\u7F51\u9875\u8D26\u5355\u63A5\u53E3\u62D2\u7EDD\u4E86\u8FD9\u4E2A\u4F1A\u8BDD\u7968\u636E\uFF1A\u591A\u534A\u5DF2\u8FC7\u671F\uFF08\u5E73\u53F0\u8FD4\u56DE\u7684\u662F\u300CAuthorization Failed (invalid token)\u300D\uFF09\u3002\u91CD\u65B0\u767B\u5F55\u5E76\u7C98\u8D34\u6700\u65B0\u7968\u636E\u5373\u53EF\uFF1B\u82E5\u4F60\u586B\u7684\u5176\u5B9E\u662F sk- \u5B98\u65B9\u5BC6\u94A5\uFF0C\u8BF7\u6539\u586B\u5230 apiKey \u680F\u3002",
      action: "platform.deepseek.com \u91CD\u65B0\u767B\u5F55 \u2192 \u590D\u5236\u65B0 token \u2192 \u8BBE\u7F6E\u9875\u300C\u7F16\u8F91\u300D"
    });
  }
  throw new ProviderError("unknown", msg);
}
function pickNum(obj, keys) {
  if (!isObj2(obj)) return { value: null, key: null };
  for (const k of keys) {
    if (Object.hasOwn(obj, k)) {
      const n = toNum(obj[k]);
      if (n !== null) return { value: n, key: k };
    }
  }
  return { value: null, key: null };
}
function pickStr(obj, keys) {
  if (!isObj2(obj)) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v !== "") return v;
  }
  return null;
}
function toLabel(v) {
  if (v === void 0 || v === null) return null;
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = v < 1e12 ? v * 1e3 : v;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0");
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[2].padStart(2, "0") + "/" + m[3].padStart(2, "0");
  m = s.match(/^(\d{1,2})\/(\d{1,2})/);
  if (m) return m[1].padStart(2, "0") + "/" + m[2].padStart(2, "0");
  return null;
}
function findHistory(root) {
  if (!isObj2(root) && !Array.isArray(root)) return null;
  const cands = [];
  if (Array.isArray(root)) cands.push(root);
  else {
    const ro = root;
    for (const k of Object.keys(ro)) {
      if (Array.isArray(ro[k])) cands.push(ro[k]);
      else if (isObj2(ro[k])) {
        const inner = ro[k];
        for (const k2 of Object.keys(inner)) {
          if (Array.isArray(inner[k2])) cands.push(inner[k2]);
        }
      }
    }
  }
  for (const arr of cands) {
    if (arr.length < 1) continue;
    const sample = arr.filter(isObj2).slice(0, 5);
    if (!sample.length) continue;
    let dateKey = null;
    for (const dk of DATE_KEYS) {
      const hits = sample.filter((it) => toLabel(it[dk]) !== null).length;
      if (hits >= Math.max(1, Math.floor(sample.length / 2))) {
        dateKey = dk;
        break;
      }
    }
    if (!dateKey) continue;
    let valueKey = null;
    for (const vk of VALUE_KEYS) {
      if (sample.some((it) => toNum(it[vk]) !== null)) {
        valueKey = vk;
        break;
      }
    }
    if (!valueKey) {
      const first = sample[0];
      const keys = Object.keys(first).filter((k) => k !== dateKey);
      for (const k of keys) {
        if (sample.some(
          (it) => typeof it[k] === "number" || typeof it[k] === "string" && it[k] !== "" && toNum(it[k]) !== null
        )) {
          valueKey = k;
          break;
        }
      }
    }
    if (!valueKey) continue;
    return { items: arr.filter(isObj2), dateKey, valueKey };
  }
  return null;
}
function fmtInt(n) {
  n = Math.round(Number(n) || 0);
  if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, "") + "\u4EBF";
  if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, "") + "\u4E07";
  return String(n);
}
function firstWallet(scope, keys) {
  if (!isObj2(scope)) return null;
  for (const k of keys) {
    const arr = scope[k];
    if (Array.isArray(arr) && arr.length && isObj2(arr[0])) return arr[0];
  }
  return null;
}
function parseUserSummary(body, opts) {
  const errTop = envelopeError(body);
  if (errTop) envelopeThrow(errTop);
  const root = unwrapEnvelope(body);
  if (!isObj2(root) && !Array.isArray(root)) {
    throw new ProviderError("parse", "\u6C47\u603B\u63A5\u53E3\u8FD4\u56DE\u7ED3\u6784\u5F02\u5E38\uFF08\u9876\u5C42\u975E\u5BF9\u8C61\uFF09\uFF0C\u8BF7\u628A\u9876\u5C42\u7C7B\u578B\u53D1\u7ED9\u7EF4\u62A4\u8005");
  }
  const scope = isObj2(root) ? root : {};
  const errIn = envelopeError(scope);
  if (errIn) envelopeThrow(errIn);
  const lowWarn = opts && opts.lowWarn !== void 0 && opts.lowWarn !== "" && opts.lowWarn !== null ? Number(opts.lowWarn) : null;
  const normal = firstWallet(scope, ["normal_wallets"]);
  const cost = firstWallet(scope, ["total_costs"]);
  if (normal) {
    const balance = toNum(normal["balance"]);
    if (balance === null) throw new ProviderError("parse", "\u94B1\u5305 balance \u975E\u6570\u5B57\uFF0C\u8BF7\u628A\u8BE5\u5B57\u6BB5\u6837\u4F8B\u53D1\u7ED9\u7EF4\u62A4\u8005");
    const currency2 = typeof normal["currency"] === "string" && normal["currency"] || "CNY";
    const costs = cost ? toNum(cost["amount"]) : null;
    const billing2 = {
      balance,
      currency: currency2,
      granted: null,
      toppedUp: null,
      isAvailable: balance > 0 ? true : null,
      infos: [],
      lowWarn,
      plan: "DeepSeek \u7F51\u9875\u7248"
    };
    const stats = [];
    if (costs !== null) stats.push({ label: "\u7D2F\u8BA1\u6D88\u8D39", value: costs.toFixed(2) });
    return { billing: billing2, extra: stats.length ? { stats } : null };
  }
  let bal = pickNum(scope, BALANCE_KEYS);
  if (bal.value === null && isObj2(scope)) {
    for (const k of Object.keys(scope)) {
      const sub = scope[k];
      if (isObj2(sub)) {
        const r = pickNum(sub, BALANCE_KEYS);
        if (r.value !== null) {
          bal = r;
          break;
        }
      }
    }
  }
  if (bal.value === null) {
    const keys = isObj2(root) ? Object.keys(root).slice(0, 12).join(",") : "array";
    throw new ProviderError(
      "parse",
      "\u6C47\u603B\u63A5\u53E3\u672A\u547D\u4E2D\u4F59\u989D\u5B57\u6BB5\uFF08\u9876\u5C42\u952E\uFF1A" + keys + "\uFF09\uFF1A\u63A5\u53E3\u53EF\u80FD\u6539\u7248\uFF0C\u628A\u8131\u654F\u540E\u7684\u9876\u5C42\u952E\u540D\u53D1\u7ED9\u7EF4\u62A4\u8005\u5373\u53EF\u8FED\u4EE3"
    );
  }
  const granted = pickNum(scope, GRANTED_KEYS).value;
  const topped = pickNum(scope, TOPPED_KEYS).value;
  const currency = pickStr(scope, CURRENCY_KEYS) || "CNY";
  const billing = {
    balance: bal.value,
    currency,
    granted,
    toppedUp: topped,
    isAvailable: bal.value > 0 ? true : null,
    infos: [],
    lowWarn,
    plan: "DeepSeek \u7F51\u9875\u7248"
  };
  let extra2 = null;
  try {
    const hist = findHistory(root);
    if (hist && hist.items.length) {
      const pts = hist.items.map((it) => ({ label: toLabel(it[hist.dateKey]), value: toNum(it[hist.valueKey]) || 0 })).filter((p) => p.label !== null).slice(-60);
      if (pts.length) {
        const total = pts.reduce((s, p) => s + p.value, 0);
        const last = pts[pts.length - 1];
        extra2 = {
          stats: [
            { label: "\u6700\u65B0" + last.label, value: fmtInt(last.value) },
            { label: "\u7D2F\u8BA1(" + pts.length + "\u5929)", value: fmtInt(total) }
          ],
          chart: { title: "\u4F7F\u7528\u8D8B\u52BF", labels: pts.map((p) => p.label), values: pts.map((p) => p.value) }
        };
      }
    }
  } catch {
  }
  return { billing, extra: extra2 };
}
async function fetchWebSummary(params, cookie, token, fetchImpl) {
  const headers = {};
  if (cookie) headers["Cookie"] = String(cookie).trim();
  if (token) {
    const t = String(token).trim();
    headers["Authorization"] = /^bearer\s/i.test(t) ? t.replace(/^bearer\s/i, "Bearer ") : "Bearer " + t;
  }
  const res = await fetchImpl(SUMMARY_URL, { headers, cache: "no-store" });
  const code = res.status;
  const text = await res.text();
  if (code === 401 || code === 403)
    throw new ProviderError("session", "DeepSeek \u7F51\u9875\u4F1A\u8BDD\u5931\u6548(" + code + ")\uFF1A" + text.slice(0, 120), {
      status: code,
      hint: "\u7F51\u9875\u767B\u5F55\u6001\uFF08Bearer \u4F1A\u8BDD\u7968\u636E\uFF09\u5DF2\u8FC7\u671F\u6216\u88AB\u5E73\u53F0\u5224\u5B9A\u4E3A\u672A\u767B\u5F55\u3002\u91CD\u65B0\u6293\u53D6\u6700\u65B0\u7968\u636E\u8986\u76D6\u5373\u53EF\u3002",
      action: "platform.deepseek.com \u91CD\u65B0\u767B\u5F55 \u2192 \u590D\u5236\u65B0 token \u2192 \u8BBE\u7F6E\u9875\u300C\u7F16\u8F91\u300D"
    });
  if (code === 429)
    throw new ProviderError("rate", "DeepSeek \u9650\u6D41(429)\uFF1A" + text.slice(0, 100), { status: code });
  if (code >= 500)
    throw new ProviderError("server", "DeepSeek \u670D\u52A1\u7AEF\u9519\u8BEF(" + code + ")\uFF1A" + text.slice(0, 100), {
      status: code
    });
  if (code !== 200)
    throw new ProviderError("unknown", "DeepSeek \u6C47\u603B\u63A5\u53E3 HTTP " + code + "\uFF1A" + text.slice(0, 100), {
      status: code
    });
  let j = null;
  try {
    j = JSON.parse(text);
  } catch {
    throw new ProviderError("parse", "\u6C47\u603B\u63A5\u53E3\u8FD4\u56DE\u975E JSON(" + text.length + "B)\uFF1A" + text.slice(0, 80));
  }
  const jr = j ?? {};
  if (jr && jr["error"]) {
    const em = isRecord2(jr["error"]) ? String(jr["error"]["message"] ?? "") : "";
    throw new ProviderError("unknown", "\u6C47\u603B\u63A5\u53E3\u62A5\u9519\uFF1A" + (em || text.slice(0, 80)));
  }
  let parsed;
  try {
    parsed = parseUserSummary(j, { lowWarn: params["lowWarn"] });
  } catch (e) {
    if (e instanceof ProviderError) throw e;
    throw new ProviderError("parse", e?.message || "\u6C47\u603B\u89E3\u6790\u5931\u8D25", { cause: e });
  }
  if (params["currency"]) parsed.billing["currency"] = String(params["currency"]);
  return { billingKind: "payg", billing: parsed.billing, extra: parsed.extra };
}

// src/host/providers/view.ts
function isRecord3(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function finite(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function windowsSection(windows, title) {
  if (!Array.isArray(windows) || !windows.length) return null;
  const s = { kind: "windows", key: "windows", windows };
  if (title) s.title = title;
  return s;
}
function balanceSection(billing, title) {
  if (!isRecord3(billing) || Object.keys(billing).length === 0) return null;
  const s = { kind: "balance", key: "balance", billing };
  if (title) s.title = title;
  return s;
}
function metricsSection(items, title) {
  const clean = (Array.isArray(items) ? items : []).filter(
    (it) => it && typeof it.label === "string" && it.label !== "" && it.value !== void 0 && it.value !== null
  );
  if (!clean.length) return null;
  const s = {
    kind: "metrics",
    key: "metrics",
    items: clean.map((it) => ({ label: it.label, value: String(it.value) }))
  };
  if (title) s.title = title;
  return s;
}
function progressSection(progress, title) {
  const used = finite(progress && progress.used);
  const total = finite(progress && progress.total);
  if (used === null || total === null || total <= 0) return null;
  const p = { used, total };
  if (progress.label) p.label = progress.label;
  if (progress.left) p.left = progress.left;
  const s = { kind: "progress", key: "progress", progress: p };
  return s;
}
function splitSection(split, title) {
  const segs = (Array.isArray(split && split.segments) ? split.segments : []).filter(
    (sg) => sg && finite(sg.value) !== null && Number(sg.value) > 0
  );
  if (!segs.length) return null;
  const s = {
    kind: "split",
    key: "split",
    split: {
      segments: segs.map((sg) => {
        const out = {
          label: String(sg.label || ""),
          value: Number(sg.value)
        };
        if (sg.color) out.color = sg.color;
        return out;
      })
    }
  };
  return s;
}
function noteSection(text, tone) {
  const t = typeof text === "string" ? text.trim() : "";
  if (!t) return null;
  const note = { text: t.slice(0, 300) };
  if (tone) note.tone = tone;
  return { kind: "note", key: "note", note };
}
function chartSection(chart) {
  const values = (Array.isArray(chart && chart.values) ? chart.values : []).map((v) => finite(v)).filter((v) => v !== null);
  if (values.length < 2) return null;
  const labels = Array.isArray(chart && chart.labels) ? chart.labels.map((l) => String(l)) : [];
  const c = { labels, values };
  if (chart.title) c.title = chart.title;
  return { kind: "chart", key: "chart", chart: c };
}
function makeView(sections) {
  const list = (Array.isArray(sections) ? sections : []).filter(
    (s) => !!s && typeof s.kind === "string"
  );
  return list.length ? { sections: list } : null;
}
function defaultView(data) {
  const sections = [];
  if (data && data.billingKind === "payg")
    sections.push(balanceSection(data.billing || {}));
  else sections.push(windowsSection(data && data.windows || []));
  const extra2 = data && data.extra || null;
  if (extra2) {
    sections.push(metricsSection(Array.isArray(extra2.stats) ? extra2.stats : []));
    const blocks = Array.isArray(extra2.blocks) ? extra2.blocks : [];
    for (let i = 0; i < blocks.length && i < 8; i++) {
      const b = blocks[i];
      if (!b || typeof b !== "object") continue;
      if (b.kind === "kv" && b.label)
        sections.push(metricsSection([{ label: String(b.label), value: String(b.value ?? "") }]));
      else if (b.kind === "progress" && finite(b.used) !== null && Number(b.total) > 0) {
        const it = {
          used: Number(b.used),
          total: Number(b.total)
        };
        if (b.label) it.label = String(b.label);
        if (b.left !== void 0 && b.left !== null && b.left !== "") it.left = String(b.left);
        sections.push(progressSection(it));
      } else if (b.kind === "split" && Array.isArray(b.segments))
        sections.push(splitSection({ segments: b.segments }));
      else if (b.kind === "note" && b.text) sections.push(noteSection(String(b.text), b.tone));
    }
    if (extra2.chart && Array.isArray(extra2.chart.values) && extra2.chart.values.length > 1)
      sections.push(chartSection(extra2.chart));
  }
  return makeView(sections);
}
function viewToExtra(view) {
  const sections = view && Array.isArray(view.sections) ? view.sections : [];
  if (!sections.length) return null;
  const stats = [];
  const blocks = [];
  let chart;
  for (const s of sections) {
    if (!s || typeof s !== "object") continue;
    if (s.kind === "metrics" && Array.isArray(s.items)) {
      for (const it of s.items) stats.push({ label: it.label, value: it.value });
    } else if (s.kind === "progress" && s.progress) {
      const b = {
        kind: "progress",
        used: s.progress.used,
        total: s.progress.total
      };
      if (s.progress.label) b.label = s.progress.label;
      if (s.progress.left) b.left = s.progress.left;
      blocks.push(b);
    } else if (s.kind === "split" && s.split) {
      const b = { kind: "split", segments: s.split.segments };
      if (s.title) b.label = s.title;
      blocks.push(b);
    } else if (s.kind === "note" && s.note) {
      const b = { kind: "note", text: s.note.text };
      if (s.note.tone) b.tone = s.note.tone;
      blocks.push(b);
    } else if (s.kind === "chart" && s.chart) {
      chart = { title: s.chart.title || "", labels: s.chart.labels, values: s.chart.values };
    }
  }
  const extra2 = {};
  if (stats.length) extra2.stats = stats.slice(0, 12);
  if (blocks.length) extra2.blocks = blocks.slice(0, 8);
  if (chart) extra2.chart = chart;
  return extra2.stats || extra2.blocks || extra2.chart ? extra2 : null;
}

// src/host/providers/deepseek.ts
function stripBearer(v) {
  const t = String(v || "").trim();
  const m = t.match(/^bearer\s+(.+)$/i);
  return m ? m[1].trim() : t;
}
function looksOfficial(v) {
  return /^sk-[A-Za-z0-9_-]{8,}$/.test(stripBearer(v));
}
function secretKindText(kind) {
  const k = String(kind || "");
  if (k === "plain") return "\u660E\u6587";
  if (k === "ref") return "$\u5F15\u7528";
  if (k === "env" || k === "cred") return "\u65E7\u5F15\u7528(" + k + ")";
  if (k === "empty") return "\u672A\u586B";
  return k || "\u672A\u77E5";
}
var isWebAuthErr = (msg) => /会话失效\(40[13]\)/.test(msg || "");
var isApiAuthErr = (msg) => /密钥无效\(401\)/.test(msg || "");
function buildDeepseekView(which, billing, extra2, secretKind) {
  const base = defaultView({
    billingKind: "payg",
    billing,
    extra: extra2 ?? null
  });
  const sections = (base ? base.sections : []).map(
    (s) => s.kind === "balance" ? { ...s, title: "\u8D26\u6237\u4F59\u989D" } : s
  );
  if (!sections.length)
    sections.push(balanceSection(billing, "\u8D26\u6237\u4F59\u989D"));
  sections.push(
    metricsSection(
      [
        { label: "\u6570\u636E\u63A5\u53E3", value: which === "api" ? "\u5B98\u65B9\u4F59\u989D\u63A5\u53E3" : "\u7F51\u9875\u8D26\u5355\u63A5\u53E3" },
        { label: "\u51ED\u636E\u7C7B\u578B", value: secretKindText(secretKind) }
      ],
      "\u6570\u636E\u6765\u6E90"
    )
  );
  return makeView(sections);
}
var deepseek = {
  type: "deepseek",
  icon: "deepseek",
  label: "DS",
  title: "deepseek\uFF08\u5B98\u65B9\xB7\u81EA\u52A8\u9009\u8DEF\uFF09",
  secretField: "token",
  secretFields: ["token", "apiKey", "cookie"],
  hint: "\u4E00\u4E2A\u5165\u53E3\u641E\u5B9A\u4E24\u79CD\u51ED\u636E\uFF1Ask- \u5F00\u5934\u7684 apiKey \u8D70\u5B98\u65B9\u4F59\u989D\u63A5\u53E3\uFF0C\u4F1A\u8BDD\u7968\u636E\uFF08\u7F51\u9875 token\uFF09\u8D70\u7F51\u9875\u8D26\u5355\uFF08\u542B\u5386\u53F2\u8D8B\u52BF\uFF09\u3002\u540C\u65F6\u914D\u7F6E\u65F6\u4F18\u5148\u7528 token \u8D70\u7F51\u9875\uFF0C\u4E00\u8DEF\u5931\u6548\u81EA\u52A8\u6362\u8DEF\u3002\u65E7 deepseek-api / deepseek-web \u5DF2\u5408\u5E76\u5230\u672C\u7C7B\u578B\uFF0C\u914D\u7F6E\u81EA\u52A8\u6CBF\u7528\u3002",
  fields: [
    {
      key: "apiKey",
      label: "apiKey",
      kind: "secret",
      mono: true,
      placeholder: "\u586B $NAME \u5F15\u7528\uFF08\u63A8\u8350\uFF09\u6216\u7C98\u8D34\u660E\u6587",
      hint: "\u5B98\u65B9\u4F59\u989D\u63A5\u53E3\u7528\uFF1A\u5F00\u653E\u5E73\u53F0 \u2192 API keys \u521B\u5EFA\uFF08sk- \u5F00\u5934\uFF0C\u957F\u671F\u6709\u6548\uFF09\u3002\u53EA\u586B\u5B83\u4E5F\u80FD\u67E5\u4F59\u989D\uFF08\u65E0\u5386\u53F2\u8D8B\u52BF\uFF09\uFF1Bsk- \u683C\u5F0F\u4F1A\u88AB\u81EA\u52A8\u9001\u5F80\u5B98\u65B9\u63A5\u53E3\u3002"
    },
    {
      key: "token",
      label: "token",
      kind: "secret",
      mono: true,
      placeholder: "\u7C98\u8D34 Bearer \u4F1A\u8BDD\u7968\u636E\uFF08\u7F51\u9875\u63A5\u53E3\u7528\uFF09",
      hint: "\u7F51\u9875\u63A5\u53E3\u7528\uFF1Aplatform.deepseek.com \u767B\u5F55\u540E\uFF0CNetwork \u91CC get_user_summary \u8BF7\u6C42\u7684 authorization \u5934 Bearer \u540E\u9762\u7684\u4E32\uFF08ciYi \u5F00\u5934\uFF09\u3002\u975E sk- \u683C\u5F0F\u4F1A\u88AB\u81EA\u52A8\u9001\u5F80\u7F51\u9875\u63A5\u53E3\uFF1B\u4E0E apiKey \u540C\u65F6\u586B\u65F6\u4F18\u5148\u7528\u5B83\u3002\u4F1A\u8BDD\u8FC7\u671F\u540E\u9700\u91CD\u7C98\u3002"
    },
    {
      key: "lowWarn",
      label: "\u4F4E\u4F59\u989D\u9884\u8B66\u7EBF",
      kind: "number",
      placeholder: "\u5982\uFF1A20",
      hint: "\u4F59\u989D\u4F4E\u4E8E\u6B64\u503C\u65F6\u4FA7\u8FB9\u680F\u9EC4\u8272\u63D0\u9192\uFF08\u4E0E\u6240\u9009\u5E01\u79CD\u540C\u5355\u4F4D\uFF09\u3002"
    },
    {
      key: "currency",
      label: "\u4F18\u5148\u5E01\u79CD",
      kind: "text",
      mono: true,
      placeholder: "\u9ED8\u8BA4 CNY\uFF0C\u53EF\u586B USD",
      hint: "\u591A\u5E01\u79CD\u8D26\u6237\u65F6\u4F18\u5148\u5C55\u793A\u7684\u5E01\u79CD\uFF1B\u4E0D\u586B\u5219\u81EA\u52A8\u5F52\u4E00\uFF08CNY \u4F18\u5148\uFF09\u3002\u4EC5\u5B98\u65B9\u63A5\u53E3\u591A\u5E01\u79CD\u65F6\u6709\u6548\u3002"
    }
  ],
  sanitizeParams(raw) {
    const src = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v !== void 0) out[k] = typeof v === "string" ? normalizeSecretRef(v) : v;
    }
    for (const k of ["apiKey", "token", "cookie"]) {
      if (typeof out[k] === "string") out[k] = normalizeSecretRef(out[k]);
    }
    return out;
  },
  maskParams(params) {
    const out = { ...params };
    for (const k of ["apiKey", "token", "cookie"]) {
      if (typeof out[k] === "string" && out[k] !== "" && secretKindOfRaw(out[k]) === "plain") out[k] = "";
    }
    return out;
  },
  validateParams() {
    return "";
  },
  async fetch(vendor, deps) {
    const params = vendor && vendor.params || {};
    const strOf = (v) => typeof v === "string" ? v : "";
    const rCookie = await deps.resolveSecret(strOf(params["cookie"]));
    const rToken = await deps.resolveSecret(strOf(params["token"]));
    const rKey = await deps.resolveSecret(strOf(params["apiKey"]));
    const fetchImpl = deps && deps.fetchImpl || fetch;
    const bearers = [];
    if (rToken.value) bearers.push({ ...rToken, via: looksOfficial(rToken.value) ? "api" : "web" });
    if (rKey.value) bearers.push({ ...rKey, via: looksOfficial(rKey.value) ? "api" : "web" });
    if (!bearers.length && !rCookie.value) {
      throw new ProviderError(
        "config",
        "\u51ED\u636E\u672A\u914D\u7F6E\uFF1AapiKey \u4E0E token \u81F3\u5C11\u586B\u4E00\u4E2A\uFF08sk- \u5F00\u5934\u8D70\u5B98\u65B9\uFF0C\u5176\u4F59\u8D70\u7F51\u9875\uFF0C\u83B7\u53D6\u65B9\u5F0F\u89C1\u5B57\u6BB5\u8BF4\u660E\uFF09",
        {
          hint: "\u4E24\u79CD\u51ED\u636E\u90FD\u6CA1\u586B\uFF1A\u5B98\u65B9\u4F59\u989D\u7528 sk- \u5F00\u5934\u7684 apiKey\uFF0C\u7F51\u9875\u8D26\u5355\u7528\u767B\u5F55\u4F1A\u8BDD token\u3002\u586B\u4EFB\u4E00\u5373\u53EF\u3002",
          retriable: false
        }
      );
    }
    const order = [];
    const firstVia = bearers.length ? bearers[0].via : "web";
    order.push(firstVia);
    if (bearers.some((b) => b.via !== firstVia)) order.push(firstVia === "web" ? "api" : "web");
    let lastErr = null;
    for (const which of order) {
      if (which === "web") {
        const wb = bearers.filter((b) => b.via === "web")[0];
        if (!wb && !rCookie.value) continue;
        try {
          const data = await fetchWebSummary(params, rCookie.value, wb ? wb.value : "", fetchImpl);
          const kind = wb ? wb.kind : rCookie.kind;
          return {
            ...data,
            view: buildDeepseekView("web", data.billing, data.extra, kind),
            secretKind: kind,
            via: "\u7F51\u9875\u63A5\u53E3"
          };
        } catch (e) {
          lastErr = e;
          if (!isWebAuthErr(e?.message || "")) throw e;
        }
      } else {
        const kb = bearers.filter((b) => b.via === "api")[0];
        if (!kb) continue;
        try {
          const data = await fetchOfficialBalance(params, kb.value, fetchImpl);
          return {
            ...data,
            view: buildDeepseekView("api", data.billing, data.extra, kb.kind),
            secretKind: kb.kind,
            via: "\u5B98\u65B9\u63A5\u53E3"
          };
        } catch (e) {
          lastErr = e;
          if (!isApiAuthErr(e?.message || "")) throw e;
        }
      }
    }
    const lastMsg = lastErr?.message || "\u62C9\u53D6\u5931\u8D25";
    if (lastErr instanceof ProviderError && lastErr.kind === "auth" && order.length > 1) {
      throw new ProviderError("auth", "\u4E24\u6761\u6570\u636E\u8DEF\u7EBF\u90FD\u9274\u6743\u5931\u8D25\uFF08\u5B98\u65B9\u63A5\u53E3\u4E0E\u7F51\u9875\u63A5\u53E3\uFF09\uFF1A" + lastMsg, {
        hint: "\u5B98\u65B9 apiKey \u4E0E\u7F51\u9875\u4F1A\u8BDD\u7968\u636E\u662F\u4E24\u5957\u72EC\u7ACB\u51ED\u636E\u3001\u4E92\u4E0D\u901A\u7528\u3002\u8BF7\u786E\u8BA4\uFF1Ask- \u5F00\u5934\u7684\u586B apiKey \u680F\uFF0C\u767B\u5F55\u4F1A\u8BDD token\uFF08ciYi \u5F00\u5934\uFF09\u586B token \u680F\uFF0C\u4E24\u8005\u90FD\u8FC7\u671F\u65F6\u90FD\u8981\u66F4\u65B0\u3002",
        action: "\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D"
      });
    }
    throw lastErr || new ProviderError("unknown", "DeepSeek \u62C9\u53D6\u5931\u8D25");
  }
};
var deepseek_default = deepseek;

// src/host/providers/commandcode.ts
var API_BASE = "https://api.commandcode.ai/alpha";
var KEY_RE = /^user_[A-Za-z0-9_-]{8,}$/;
var DEFAULT_ENV_KEY = "COMMAND_CODE_API_KEY";
function isRecord4(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function fmtInt2(n) {
  const v = Math.round(Number(n) || 0);
  if (v >= 1e8) return (v / 1e8).toFixed(1).replace(/\.0$/, "") + "\u4EBF";
  if (v >= 1e4) return (v / 1e4).toFixed(1).replace(/\.0$/, "") + "\u4E07";
  return String(v);
}
function fmtMoney(n) {
  return (Math.round(Number(n) * 100) / 100).toFixed(2);
}
function planLabel(planId) {
  const id = typeof planId === "string" ? planId.trim() : "";
  if (!id) return "";
  const m = /^(?:individual|team)-(.+)$/.exec(id);
  const raw = m ? m[1] : id;
  const known = {
    go: "Go",
    goat: "GOAT",
    pro: "Pro",
    max: "Max",
    provider: "Provider"
  };
  const hit = known[raw];
  if (hit) return hit;
  return raw.replace(/[-_]/g, " ").toUpperCase();
}
async function getJson(path, key, fetchImpl) {
  const res = await fetchImpl(API_BASE + path, {
    headers: { Authorization: "Bearer " + key, accept: "application/json" },
    cache: "no-store"
  });
  const code = res.status;
  const text = await res.text();
  if (code === 401 || code === 403)
    throw new ProviderError("auth", "CommandCode API Key \u65E0\u6548(" + code + ")\uFF1A" + text.slice(0, 120), {
      status: code,
      hint: "\u5E73\u53F0\u62D2\u7EDD\u4E86\u8FD9\u628A API Key\uFF1A\u53EF\u80FD\u5DF2\u5220\u9664\u3001\u8F6E\u6362\uFF0C\u6216\u590D\u5236\u65F6\u7F3A\u4E86\u5B57\u7B26\u3002\u5230\u5DE5\u4F5C\u5BA4\u91CD\u65B0\u521B\u5EFA\u4E00\u628A\u5373\u53EF\u3002",
      action: "commandcode.ai \u2192 \u5DE5\u4F5C\u5BA4\uFF08Studio\uFF09\u2192 API keys",
      docs: "https://commandcode.ai/docs/reference/errors/unauthorized"
    });
  if (code === 429)
    throw new ProviderError("rate", "CommandCode \u9650\u6D41(429)\uFF1A" + text.slice(0, 100), { status: code });
  if (code === 404)
    throw new ProviderError("parse", "CommandCode \u63A5\u53E3\u4E0D\u5B58\u5728(404)\uFF1A\u8DEF\u5F84\u53EF\u80FD\u5DF2\u53D8\u66F4\uFF08" + path + "\uFF09", {
      status: code,
      hint: "\u989D\u5EA6\u63A5\u53E3\u8DEF\u5F84\u53D8\u4E86\uFF0C\u901A\u5E38\u610F\u5473\u7740\u5E73\u53F0\u6539\u7248\uFF0C\u9700\u8981\u63D2\u4EF6\u66F4\u65B0\u3002"
    });
  if (code >= 500)
    throw new ProviderError("server", "CommandCode \u670D\u52A1\u7AEF\u9519\u8BEF(" + code + ")\uFF1A" + text.slice(0, 100), {
      status: code
    });
  if (code !== 200)
    throw new ProviderError("unknown", "CommandCode \u63A5\u53E3 HTTP " + code + "\uFF1A" + text.slice(0, 120), {
      status: code
    });
  let j = null;
  try {
    j = JSON.parse(text);
  } catch {
    throw new ProviderError("parse", "CommandCode \u8FD4\u56DE\u975E JSON(" + text.length + "B)\uFF1A" + text.slice(0, 80));
  }
  if (!isRecord4(j)) throw new ProviderError("parse", "CommandCode \u8FD4\u56DE\u7ED3\u6784\u5F02\u5E38\uFF08\u9876\u5C42\u975E\u5BF9\u8C61\uFF09");
  const err = j["error"];
  if (isRecord4(err)) {
    const emsg = String(err["message"] ?? err["code"] ?? text.slice(0, 80));
    const ecode = String(err["code"] ?? "");
    const ecapital = ecode.toUpperCase();
    const kind = /UPGRADE|PLAN|SUBSCRIPTION/.test(ecapital) ? "plan" : /UNAUTHORIZED|FORBIDDEN|TOKEN/.test(ecapital) ? "auth" : /RATE|LIMIT|QUOTA/.test(ecapital) ? "rate" : "unknown";
    throw new ProviderError(kind, "CommandCode \u63A5\u53E3\u62A5\u9519\uFF1A" + emsg, {
      ...typeof err["status"] === "number" ? { status: err["status"] } : {},
      ...kind === "auth" ? { docs: "https://commandcode.ai/docs/reference/errors/unauthorized" } : {}
    });
  }
  return j;
}
function toWindow(key, label, node, nowMs) {
  if (!isRecord4(node)) return null;
  const cap = numStr(node["cap"]);
  const used = numStr(node["used"]);
  if (!(cap > 0)) return null;
  const since = numStr(node["resetAt"]) - nowMs;
  return {
    key,
    label,
    pct: Math.min(100, Math.max(0, used / cap * 100)),
    used,
    limit: cap,
    resetInSec: Math.max(0, Math.round(since / 1e3))
  };
}
function toMonthlyWindow(credits, usage, subData, nowMs) {
  const consumed = numStr(usage ? usage["totalCredits"] : 0) + 0;
  const balance = numStr(credits["monthlyCredits"]) + numStr(credits["purchasedCredits"]) + numStr(credits["freeCredits"]);
  const total = consumed + balance;
  if (!(total > 0)) return null;
  const endRaw = subData ? subData["currentPeriodEnd"] : null;
  let resetInSec = 0;
  if (typeof endRaw === "string" && endRaw) {
    const endMs = Date.parse(endRaw);
    if (Number.isFinite(endMs)) resetInSec = Math.max(0, Math.round((endMs - nowMs) / 1e3));
  }
  return {
    key: "monthly",
    label: "\u6BCF\u6708",
    pct: Math.min(100, Math.max(0, consumed / total * 100)),
    used: Math.round(consumed * 1e4) / 1e4,
    limit: Math.round(total * 100) / 100,
    resetInSec
  };
}
function parseCommandCode(creditsBody, usageBody, subBody, whoBody, nowMs) {
  const creditsRoot = isRecord4(creditsBody) ? creditsBody : {};
  const credits = isRecord4(creditsRoot["credits"]) ? creditsRoot["credits"] : {};
  const windowLimits = isRecord4(creditsRoot["windowLimits"]) ? creditsRoot["windowLimits"] : {};
  const windows = [];
  const five = toWindow("5h", "5 \u5C0F\u65F6", windowLimits["fiveHour"], nowMs);
  if (five) windows.push(five);
  const week = toWindow("weekly", "\u6BCF\u5468", windowLimits["weekly"], nowMs);
  if (week) windows.push(week);
  const usage = isRecord4(usageBody) ? usageBody : null;
  const subData = isRecord4(subBody) && isRecord4(subBody["data"]) ? subBody["data"] : null;
  const monthly = toMonthlyWindow(credits, usage, subData, nowMs);
  if (monthly) windows.push(monthly);
  const user = isRecord4(whoBody) && isRecord4(whoBody["user"]) ? whoBody["user"] : null;
  return { windows, credits, windowLimits, usage, subscription: subData, user };
}
function subscriptionAlert(status, periodEnd, nowMs) {
  const st = String(status ?? "").trim().toLowerCase();
  const end = typeof periodEnd === "string" ? periodEnd.slice(0, 10) : "";
  const BAD = {
    past_due: "\u8BA2\u9605\u6263\u6B3E\u5931\u8D25\uFF08past_due\uFF09\uFF0C\u989D\u5EA6\u53EF\u80FD\u968F\u65F6\u505C\u6B62",
    unpaid: "\u8BA2\u9605\u672A\u652F\u4ED8\uFF08unpaid\uFF09\uFF0C\u5F53\u524D\u65E0\u6CD5\u7EE7\u7EED\u4F7F\u7528",
    canceled: "\u8BA2\u9605\u5DF2\u53D6\u6D88\uFF08canceled\uFF09" + (end ? "\uFF0C" + end + " \u540E\u505C\u6B62\u7EED\u8BA2" : ""),
    cancelled: "\u8BA2\u9605\u5DF2\u53D6\u6D88\uFF08cancelled\uFF09" + (end ? "\uFF0C" + end + " \u540E\u505C\u6B62\u7EED\u8BA2" : ""),
    incomplete_expired: "\u8BA2\u9605\u672A\u5B8C\u6210\u652F\u4ED8\u5DF2\u5931\u6548\uFF08incomplete_expired\uFF09\uFF0C\u9700\u91CD\u65B0\u8BA2\u9605",
    ended: "\u8BA2\u9605\u5DF2\u7ED3\u675F\uFF08ended\uFF09" + (end ? "\uFF08" + end + "\uFF09" : ""),
    expired: "\u8BA2\u9605\u5DF2\u8FC7\u671F\uFF08expired\uFF09" + (end ? "\uFF08" + end + "\uFF09" : ""),
    suspended: "\u8BA2\u9605\u5DF2\u88AB\u6682\u505C\uFF08suspended\uFF09\uFF0C\u8BF7\u68C0\u67E5\u652F\u4ED8\u65B9\u5F0F"
  };
  const hit = BAD[st];
  if (hit) return { text: "\u26A0 " + hit + "\uFF1A\u8BF7\u66F4\u65B0\u652F\u4ED8\u65B9\u5F0F\u6216\u91CD\u65B0\u8BA2\u9605\uFF0C\u5904\u7406\u540E\u70B9\u300C\u5237\u65B0\u300D\u3002", tone: "bad" };
  if (st === "active" && end) {
    const endMs = Date.parse(end + "T23:59:59Z");
    if (Number.isFinite(endMs) && endMs < nowMs)
      return {
        text: "\u26A0 \u8BA2\u9605\u5468\u671F\u5DF2\u4E8E " + end + " \u7ED3\u675F\uFF0C\u989D\u5EA6\u53EF\u80FD\u968F\u65F6\u505C\u6B62\uFF1A\u8BF7\u786E\u8BA4\u7EED\u8BA2\u72B6\u6001\u540E\u70B9\u300C\u5237\u65B0\u300D\u3002",
        tone: "bad"
      };
  }
  return null;
}
function buildCommandCodeView(data, opts) {
  const monthly = numStr(data.credits["monthlyCredits"]);
  const purchased = numStr(data.credits["purchasedCredits"]);
  const free = numStr(data.credits["freeCredits"]);
  const balance = monthly + purchased + free;
  const plan = planLabel(data.subscription && data.subscription["planId"]);
  const subStatus = data.subscription ? String(data.subscription["status"] ?? "") : "";
  const periodEnd = data.subscription ? String(data.subscription["currentPeriodEnd"] ?? "") : "";
  const consumed = data.usage ? numStr(data.usage["totalCredits"]) : 0;
  const belowThreshold = data.credits["belowThreshold"] === true;
  const exceeded = data.windowLimits["exceeded"];
  const cancelAtPeriodEnd = data.subscription ? data.subscription["cancelAtPeriodEnd"] === true : false;
  const sections = [];
  sections.push(windowsSection(data.windows, "\u989D\u5EA6\u7A97\u53E3"));
  sections.push(
    balanceSection(
      {
        balance,
        currency: "USD",
        granted: free,
        toppedUp: purchased,
        isAvailable: belowThreshold ? false : balance > 0 ? true : null,
        infos: [],
        lowWarn: opts.lowWarn !== void 0 ? opts.lowWarn : null,
        plan: plan || "Command Code"
      },
      "\u5269\u4F59\u989D\u5EA6"
    )
  );
  const items = [];
  if (plan) items.push({ label: "\u8BA2\u9605\u8BA1\u5212", value: plan + (subStatus ? "\uFF08" + subStatus + "\uFF09" : "") });
  if (periodEnd) items.push({ label: "\u5F53\u524D\u5468\u671F\u81F3", value: periodEnd.slice(0, 10) });
  if (data.user) {
    const who = String(data.user["userName"] || data.user["name"] || "");
    if (who) items.push({ label: "\u8D26\u53F7", value: who });
  }
  if (data.usage) {
    items.push({ label: "\u672C\u671F\u6D88\u8D39", value: "$" + fmtMoney(numStr(data.usage["totalCost"])) });
    items.push({ label: "\u8BF7\u6C42\u6570", value: fmtInt2(numStr(data.usage["totalCount"])) });
    items.push({ label: "\u6210\u529F\u7387", value: numStr(data.usage["successRate"]) + "%" });
    items.push({ label: "\u8F93\u5165 Token", value: fmtInt2(numStr(data.usage["totalTokensIn"])) });
    items.push({ label: "\u8F93\u51FA Token", value: fmtInt2(numStr(data.usage["totalTokensOut"])) });
  }
  sections.push(metricsSection(items, "\u8D26\u6237\u4E0E\u7528\u91CF"));
  const alert = subscriptionAlert(subStatus, periodEnd, Date.now());
  if (alert) sections.push(noteSection(alert.text, alert.tone));
  if (exceeded) sections.push(noteSection("\u5DF2\u8FBE\u5230\u7A97\u53E3\u4E0A\u9650\uFF1A" + String(exceeded) + "\uFF0C\u8BF7\u7B49\u7A97\u53E3\u91CD\u7F6E\u3002", "bad"));
  else if (belowThreshold) sections.push(noteSection("\u989D\u5EA6\u4F4E\u4E8E\u9608\u503C\uFF0C\u8C03\u7528\u53EF\u80FD\u88AB\u62D2\u7EDD\uFF0C\u8BF7\u53CA\u65F6\u5145\u503C\u3002", "warn"));
  if (!alert) {
    if (cancelAtPeriodEnd) sections.push(noteSection("\u8BA2\u9605\u5DF2\u8BBE\u7F6E\u5468\u671F\u672B\u53D6\u6D88\uFF0C\u5230\u671F\u540E\u989D\u5EA6\u5C06\u505C\u6B62\u7EED\u8BA2\u3002", "warn"));
    else if (plan && data.windows.length)
      sections.push(noteSection(plan + " \u8BA2\u9605\u751F\u6548\u4E2D\uFF0C\u989D\u5EA6\u6309 5 \u5C0F\u65F6 / \u6BCF\u5468 / \u6BCF\u6708\u7A97\u53E3\u6EDA\u52A8\u5237\u65B0\u3002", "info"));
  }
  const view = makeView(sections);
  const granted = free > 0 ? free : null;
  const topped = purchased > 0 ? purchased : null;
  return {
    view,
    billing: {
      balance,
      currency: "USD",
      granted,
      toppedUp: topped,
      isAvailable: belowThreshold ? false : balance > 0 ? true : null,
      infos: [],
      lowWarn: opts.lowWarn !== void 0 ? opts.lowWarn : null,
      plan: plan || "Command Code",
      // 额度构成与本期消费（客户端专属 UI 用来画分解条与消耗进度）
      monthlyCredits: monthly,
      purchasedCredits: purchased,
      freeCredits: free,
      consumedCredits: consumed,
      ...periodEnd ? { periodEnd: periodEnd.slice(0, 10) } : {}
    }
  };
}
var commandcode = {
  type: "commandcode",
  icon: "commandcode",
  label: "CC",
  title: "commandcode\uFF08Command Code\uFF09",
  secretField: "apiKey",
  hint: "Command Code \u989D\u5EA6\uFF1A5 \u5C0F\u65F6/\u6BCF\u5468\u6EDA\u52A8\u7A97\u53E3 + \u5269\u4F59\u989D\u5EA6 + \u672C\u8BA1\u8D39\u5468\u671F\u7528\u91CF\u3002API Key \u5728 commandcode.ai \u5DE5\u4F5C\u5BA4\uFF08Studio\uFF09\u521B\u5EFA\uFF0Cuser_ \u5F00\u5934\uFF1B\u4E0E CLI \u540C\u4E00\u628A\u94A5\u5319\u3002\u9ED8\u8BA4\u8BFB\u73AF\u5883\u53D8\u91CF/\u51ED\u636E " + DEFAULT_ENV_KEY + "\uFF08\u7559\u7A7A\u5373\u7528\uFF09\u3002",
  fields: [
    {
      key: "apiKey",
      label: "apiKey",
      kind: "secret",
      mono: true,
      placeholder: "$" + DEFAULT_ENV_KEY + "\uFF08\u9ED8\u8BA4\uFF09\u6216\u7C98\u8D34 user_ \u5F00\u5934\u7684\u660E\u6587",
      hint: "\u9ED8\u8BA4 $" + DEFAULT_ENV_KEY + "\uFF1A\u53EA\u8981\u8BE5\u73AF\u5883\u53D8\u91CF\u5DF2\u5BFC\u51FA\uFF08CLI \u7528\u7684\u540C\u4E00\u628A\u94A5\u5319\uFF09\uFF0C\u6B64\u9879\u7559\u7A7A\u5373\u53EF\uFF0C\u63D2\u4EF6\u81EA\u52A8\u56DE\u9000\u8BFB\u53D6\u3002\u4E5F\u53EF\u7C98\u8D34 user_ \u5F00\u5934\u7684\u660E\u6587\uFF0C\u6216\u7528\u300C\u5B58\u51ED\u636E\u300D\u8F6C\u6210\u5F15\u7528\u3002\u5BC6\u94A5\u83B7\u53D6\uFF1Acommandcode.ai \u2192 \u5DE5\u4F5C\u5BA4\uFF08Studio\uFF09\u2192 API keys \u521B\u5EFA\u3002"
    },
    {
      key: "lowWarn",
      label: "\u4F4E\u4F59\u989D\u9884\u8B66\u7EBF",
      kind: "number",
      placeholder: "\u5982\uFF1A10",
      hint: "\u5269\u4F59\u989D\u5EA6\uFF08USD\uFF09\u4F4E\u4E8E\u6B64\u503C\u65F6\u4FA7\u8FB9\u680F\u9EC4\u8272\u63D0\u9192\u3002"
    }
  ],
  /** 新增供应商时直接带上默认环境变量引用（用户无需手填）。 */
  defaultParams: { apiKey: "$" + DEFAULT_ENV_KEY },
  sanitizeParams(raw) {
    const src = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v !== void 0) out[k] = typeof v === "string" ? normalizeSecretRef(v) : v;
    }
    if (typeof out["apiKey"] === "string") out["apiKey"] = normalizeSecretRef(out["apiKey"]);
    return out;
  },
  maskParams(params) {
    const out = { ...params };
    if (typeof out["apiKey"] === "string" && out["apiKey"] !== "" && secretKindOfRaw(out["apiKey"]) === "plain")
      out["apiKey"] = "";
    return out;
  },
  validateParams(params) {
    const v = params && typeof params["apiKey"] === "string" ? params["apiKey"] : "";
    if (v && secretKindOfRaw(v) === "plain" && !KEY_RE.test(v)) return "apiKey \u5F62\u6001\u5F02\u5E38\uFF08\u5E94\u4E3A user_ \u5F00\u5934\uFF09";
    return "";
  },
  async fetch(vendor, deps) {
    const params = vendor && vendor.params || {};
    const raw = typeof params["apiKey"] === "string" ? params["apiKey"].trim() : "";
    const fallback = "$" + DEFAULT_ENV_KEY;
    let r;
    try {
      r = await deps.resolveSecret(raw || fallback);
    } catch (e) {
      if (!raw)
        throw new ProviderError("config", "apiKey \u672A\u914D\u7F6E\uFF1A\u73AF\u5883\u53D8\u91CF/\u51ED\u636E " + DEFAULT_ENV_KEY + " \u672A\u627E\u5230", {
          cause: e,
          hint: "\u8FD8\u5DEE\u4E00\u628A API Key \u624D\u80FD\u67E5\u989D\u5EA6\uFF1A" + DEFAULT_ENV_KEY + " \u73AF\u5883\u53D8\u91CF/\u51ED\u636E\u91CC\u6CA1\u627E\u5230\u5B83\uFF0C\u914D\u7F6E\u91CC\u4E5F\u6CA1\u586B\u3002\u5BFC\u51FA\u8BE5\u53D8\u91CF\u5373\u53EF\u81EA\u52A8\u751F\u6548\uFF0C\u6216\u76F4\u63A5\u7C98\u8D34\u660E\u6587\u3002",
          action: "commandcode.ai \u2192 \u5DE5\u4F5C\u5BA4\uFF08Studio\uFF09\u2192 API keys\uFF08user_ \u5F00\u5934\uFF09",
          retriable: false
        });
      throw e;
    }
    if (!r.value)
      throw new ProviderError("config", "apiKey \u7F3A\u5C11\u6709\u6548\u503C\uFF08\u5F15\u7528\u89E3\u6790\u4E3A\u7A7A\uFF09", {
        hint: "\u586B\u7684\u662F $" + DEFAULT_ENV_KEY + " \u5F15\u7528\uFF0C\u4F46\u8BE5\u73AF\u5883\u53D8\u91CF/\u51ED\u636E\u5F53\u524D\u4E3A\u7A7A\u3002\u5BFC\u51FA\u53D8\u91CF\u540E\u9700\u91CD\u542F dsh web\uFF0C\u6216\u6539\u586B\u660E\u6587\u3002",
        action: "\u8BBE\u7F6E \u2192 " + DISPLAY_NAME + " \u2192 \u8BE5\u4F9B\u5E94\u5546 \u2192\u300C\u7F16\u8F91\u300D",
        retriable: false
      });
    const fetchImpl = deps && deps.fetchImpl || fetch;
    const nowMs = Date.now();
    const creditsBody = await getJson("/billing/credits", r.value, fetchImpl);
    const optional = async (path) => {
      try {
        return await getJson(path, r.value, fetchImpl);
      } catch {
        return null;
      }
    };
    const [usageBody, subBody, whoBody] = await Promise.all([
      optional("/usage/summary"),
      optional("/billing/subscriptions"),
      optional("/whoami")
    ]);
    const data = parseCommandCode(creditsBody, usageBody, subBody, whoBody, nowMs);
    const lowWarn = params["lowWarn"] !== void 0 && params["lowWarn"] !== "" && params["lowWarn"] !== null ? numStr(params["lowWarn"]) : null;
    const built = buildCommandCodeView(data, { lowWarn });
    return {
      billingKind: data.windows.length ? "rolling" : "payg",
      ...data.windows.length ? { windows: data.windows } : {},
      billing: built.billing,
      view: built.view,
      extra: viewToExtra(built.view),
      secretKind: r.kind,
      via: "CommandCode API"
    };
  }
};
var commandcode_default = commandcode;

// src/host/providers/manual.ts
var manual = {
  type: "manual",
  icon: "manual",
  label: "\u624B\u52A8",
  title: "manual\uFF08\u624B\u52A8\uFF09",
  secretField: "",
  hint: "\u672C\u5730\u8D26\u672C\uFF0C\u65E0\u9700\u62C9\u53D6\uFF1Arolling \u586B total/used\uFF1Bpayg \u586B balance/granted/lowWarn\u3002",
  fields: [
    {
      key: "billing",
      label: "\u8BA1\u8D39\u5F62\u6001",
      kind: "select",
      options: [
        { value: "rolling", label: "\u6EDA\u52A8\u5237\u65B0" },
        { value: "payg", label: "\u6309\u91CF\u4ED8\u8D39" }
      ],
      hint: "rolling=\u5468\u671F\u6EDA\u52A8\u7684\u8BA2\u9605\u989D\u5EA6\uFF08\u586B\u603B\u989D/\u5DF2\u7528\uFF09\uFF1Bpayg=\u7528\u591A\u5C11\u6263\u591A\u5C11\u7684\u4F59\u989D\uFF08\u586B\u4F59\u989D/\u9884\u8B66\u7EBF\uFF09\u3002"
    },
    {
      key: "total",
      label: "\u603B\u989D\u5EA6",
      kind: "number",
      placeholder: "\u5982\uFF1A1000",
      showWhen: { key: "billing", eq: "rolling" },
      hint: "\u5468\u671F\u5185\u53EF\u7528\u603B\u989D\u5EA6\uFF08\u5982\u5305\u6708 1000 \u6B21\uFF09\u3002"
    },
    {
      key: "used",
      label: "\u5DF2\u7528",
      kind: "number",
      placeholder: "\u5982\uFF1A100",
      showWhen: { key: "billing", eq: "rolling" },
      hint: "\u672C\u5468\u671F\u5DF2\u6D88\u8017\u91CF\uFF0C\u624B\u52A8\u66F4\u65B0\u3002"
    },
    {
      key: "balance",
      label: "\u4F59\u989D",
      kind: "number",
      placeholder: "\u5982\uFF1A50",
      showWhen: { key: "billing", eq: "payg" },
      hint: "\u5F53\u524D\u5269\u4F59\u53EF\u6263\u91D1\u989D\uFF0C\u624B\u52A8\u66F4\u65B0\u3002"
    },
    {
      key: "granted",
      label: "\u603B\u989D\u5EA6",
      kind: "number",
      placeholder: "\u5982\uFF1A100",
      showWhen: { key: "billing", eq: "payg" },
      hint: "\u7D2F\u8BA1\u5145\u503C/\u83B7\u8D60\u603B\u989D\uFF08\u4EC5\u5C55\u793A\u7528\uFF0C\u53EF\u4E0D\u586B\uFF09\u3002"
    },
    {
      key: "lowWarn",
      label: "\u9884\u8B66\u7EBF",
      kind: "number",
      placeholder: "\u5982\uFF1A10",
      showWhen: { key: "billing", eq: "payg" },
      hint: "\u4F59\u989D\u4F4E\u4E8E\u6B64\u503C\u65F6\u4FA7\u8FB9\u680F\u9EC4\u8272\u63D0\u9192\u3002"
    }
  ],
  sanitizeParams(raw) {
    const src = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (const k of Object.keys(src)) {
      if (src[k] !== void 0) out[k] = src[k];
    }
    return out;
  },
  validateParams() {
    return "";
  },
  async fetch(vendor) {
    const p = vendor && vendor.params || {};
    if ((p["billing"] || "rolling") === "payg") {
      return {
        billingKind: "payg",
        billing: {
          balance: Number(p["balance"]) || 0,
          currency: "CNY",
          granted: p["granted"] !== void 0 && p["granted"] !== "" && p["granted"] !== null ? Number(p["granted"]) : null,
          toppedUp: null,
          isAvailable: null,
          infos: [],
          lowWarn: p["lowWarn"] !== void 0 && p["lowWarn"] !== "" && p["lowWarn"] !== null ? Number(p["lowWarn"]) : null,
          plan: vendor.name
        }
      };
    }
    const total = Number(p["total"]) || 0;
    const used = Number(p["used"]) || 0;
    const pct = total > 0 ? Math.min(100, used / total * 100) : 0;
    return {
      billingKind: "rolling",
      windows: [{ key: "w", label: "\u989D\u5EA6", pct, used, limit: total, resetInSec: 0 }],
      billing: {}
    };
  }
};
var manual_default = manual;

// src/host/providers/index.ts
var registry = /* @__PURE__ */ new Map();
var ALIASES = /* @__PURE__ */ new Map();
function registerProvider(adapter) {
  const err = checkAdapterShape(adapter);
  if (err) throw new Error("[token-meter] \u975E\u6CD5 provider \u9002\u914D\u5668: " + err);
  if (registry.has(adapter.type)) {
    throw new Error("[token-meter] provider \u7C7B\u578B\u91CD\u590D\u6CE8\u518C: " + adapter.type);
  }
  registry.set(adapter.type, adapter);
}
function registerAlias(from2, to) {
  if (typeof from2 !== "string" || typeof to !== "string" || !from2 || !to) {
    throw new Error("[token-meter] \u522B\u540D\u5FC5\u987B\u4E3A\u975E\u7A7A\u5B57\u7B26\u4E32");
  }
  if (!registry.has(to)) {
    throw new Error("[token-meter] \u522B\u540D\u76EE\u6807\u672A\u6CE8\u518C: " + to);
  }
  if (registry.has(from2)) {
    throw new Error("[token-meter] \u522B\u540D\u4E0E\u73B0\u5F79\u7C7B\u578B\u51B2\u7A81: " + from2);
  }
  let cur = to;
  const seen = /* @__PURE__ */ new Set([from2]);
  while (ALIASES.has(cur)) {
    cur = ALIASES.get(cur);
    if (seen.has(cur)) throw new Error("[token-meter] \u522B\u540D\u5FAA\u73AF: " + from2);
    seen.add(cur);
  }
  ALIASES.set(from2, to);
}
function canonicalType(type) {
  let cur = type;
  const seen = /* @__PURE__ */ new Set();
  while (typeof cur === "string" && ALIASES.has(cur)) {
    cur = ALIASES.get(cur);
    if (seen.has(cur)) break;
    seen.add(cur);
  }
  return cur;
}
function getSecretField(type) {
  const p = registry.get(canonicalType(type));
  return p ? p.secretField : "";
}
function getProvider(type) {
  return registry.get(canonicalType(type));
}
function hasProvider(type) {
  if (registry.has(type)) return true;
  return ALIASES.has(type);
}
function listProviders() {
  return [...registry.values()];
}
function providerTypes() {
  return [...registry.keys(), ...ALIASES.keys()];
}
function secretKeysOf(p) {
  const list = [];
  if (p && typeof p.secretField === "string" && p.secretField) list.push(p.secretField);
  if (p && Array.isArray(p.secretFields)) {
    for (const k of p.secretFields) {
      if (typeof k === "string" && k && list.indexOf(k) === -1) list.push(k);
    }
  }
  return list;
}
function secretPresent(v) {
  return typeof v === "string" ? v.trim() !== "" : v !== void 0 && v !== null && v !== "";
}
function readSecretValue(vendor) {
  const t = canonicalType(vendor && vendor.type);
  const p = typeof t === "string" ? registry.get(t) : void 0;
  const params = vendor && vendor.params && typeof vendor.params === "object" ? vendor.params : {};
  if (!p) return "";
  if (typeof p.readSecret === "function") {
    try {
      const v = p.readSecret(params);
      return v === void 0 || v === null ? "" : String(v);
    } catch {
      return "";
    }
  }
  for (const k of secretKeysOf(p)) {
    const v = params[k];
    if (secretPresent(v)) return String(v);
  }
  return "";
}
function locateSecretKey(vendor) {
  const t = canonicalType(vendor && vendor.type);
  const p = typeof t === "string" ? registry.get(t) : void 0;
  const params = vendor && vendor.params && typeof vendor.params === "object" ? vendor.params : {};
  if (!p) return "";
  for (const k of secretKeysOf(p)) {
    if (secretPresent(params[k])) return k;
  }
  return p.secretField || "";
}
function secretKindOf(vendor) {
  const t = canonicalType(vendor && vendor.type);
  const p = typeof t === "string" ? registry.get(t) : void 0;
  if (!p || !p.secretField) return "none";
  const val = readSecretValue(vendor);
  if (val === void 0 || val === null || val === "") return "empty";
  return secretKindOfRaw(String(val));
}
function maskParamsForType(type, raw) {
  const p = registry.get(canonicalType(type));
  const src = raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  if (p && typeof p.maskParams === "function") {
    try {
      return p.maskParams({ ...src });
    } catch {
      return { ...src };
    }
  }
  const out = { ...src };
  for (const f of secretKeysOf(p)) {
    if (typeof out[f] === "string" && out[f] !== "" && secretKindOfRaw(out[f]) === "plain") out[f] = "";
  }
  return out;
}
function describeProviders() {
  return listProviders().map((p) => ({
    type: p.type,
    label: p.label,
    title: p.title,
    secretField: p.secretField,
    hint: p.hint || "",
    ...p.icon !== void 0 && p.icon !== "" ? { icon: p.icon } : {},
    fields: (p.fields || []).map((f) => {
      const out = {
        key: f.key,
        label: f.label,
        kind: f.kind
      };
      if (f.mono !== void 0) out.mono = !!f.mono;
      if (f.placeholder !== void 0) out.placeholder = f.placeholder || "";
      if (f.required !== void 0) out.required = !!f.required;
      if (Array.isArray(f.options)) out.options = f.options.map((o) => ({ value: o.value, label: o.label }));
      if (f.showWhen) out.showWhen = { key: f.showWhen.key, eq: f.showWhen.eq };
      if (f.hint !== void 0) out.hint = f.hint || "";
      return out;
    }),
    defaultParams: p.defaultParams && typeof p.defaultParams === "object" ? JSON.parse(JSON.stringify(p.defaultParams)) : {}
  }));
}
registerProvider(opencode_default);
registerProvider(deepseek_default);
registerProvider(commandcode_default);
registerProvider(manual_default);
registerAlias("opencode-go", "opencode");
registerAlias("opencode-zen", "opencode");
registerAlias("deepseek-api", "deepseek");
registerAlias("deepseek-web", "deepseek");

// src/host/stats/online.ts
var PRESET_GAPS_MIN = [1, 5, 15, 30, 60];
var BASE_GAP_MS = 6e4;
var DEFAULT_GAP_MIN = 15;
function normGapMin(raw) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_GAP_MIN;
  let best = PRESET_GAPS_MIN[0];
  for (const g of PRESET_GAPS_MIN) if (Math.abs(g - n) < Math.abs(best - n)) best = g;
  return best;
}
function asc(arr, cmp) {
  const out = [...arr];
  return out.sort(cmp);
}
function dayKey(t) {
  const d = new Date(t);
  const M = String(d.getMonth() + 1);
  const D = String(d.getDate());
  return d.getFullYear() + "-" + (M.length < 2 ? "0" + M : M) + "-" + (D.length < 2 ? "0" + D : D);
}
function nextDay(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.getTime();
}
function mergePoints(times, gapMs) {
  if (times.length === 0) return [];
  const s = asc(times, (a, b) => a - b);
  const out = [];
  let start = s[0];
  let end = start;
  for (let i = 1; i < s.length; i++) {
    const t = s[i];
    if (t - end <= gapMs) {
      if (t > end) end = t;
    } else {
      out.push([start, end]);
      start = t;
      end = t;
    }
  }
  out.push([start, end]);
  return out;
}
function mergeIntervals(input, gapMs) {
  if (input.length === 0) return [];
  const s = asc(input, (a, b) => a[0] - b[0] || a[1] - b[1]);
  const out = [];
  let start = s[0][0];
  let end = s[0][1];
  for (let i = 1; i < s.length; i++) {
    const iv = s[i];
    if (iv[0] - end <= gapMs) {
      if (iv[1] > end) end = iv[1];
    } else {
      out.push([start, end]);
      start = iv[0];
      end = iv[1];
    }
  }
  out.push([start, end]);
  return out;
}
function countByDay(intervals) {
  const out = /* @__PURE__ */ new Map();
  for (const [a] of intervals) {
    const k = dayKey(a);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}
function totalMs(intervals) {
  let sum = 0;
  for (const [a, b] of intervals) if (b > a) sum += b - a;
  return sum;
}
function splitByDay(intervals) {
  const byDay = /* @__PURE__ */ new Map();
  for (const [a, b] of intervals) {
    if (b <= a) continue;
    let cur = a;
    while (cur < b) {
      const dayEnd = nextDay(cur);
      const segEnd = Math.min(b, dayEnd);
      if (segEnd <= cur) break;
      const k = dayKey(cur);
      byDay.set(k, (byDay.get(k) ?? 0) + (segEnd - cur));
      cur = segEnd;
    }
  }
  return byDay;
}
function buildOnline(active, turns, dayMeta, defaultGapMin) {
  const gaps = PRESET_GAPS_MIN;
  const totals = {};
  const segments = {};
  const perGapDays = [];
  const perGapSegs = [];
  const daySet = /* @__PURE__ */ new Set();
  for (const g of gaps) {
    const merged = mergeIntervals(active, g * 6e4);
    totals[String(g)] = totalMs(merged);
    segments[String(g)] = merged.length;
    const days2 = splitByDay(merged);
    perGapDays.push(days2);
    perGapSegs.push(countByDay(merged));
    for (const k of days2.keys()) daySet.add(k);
  }
  for (const k of Object.keys(dayMeta.sessions)) daySet.add(k);
  for (const k of Object.keys(dayMeta.llmMs)) daySet.add(k);
  const turnMerged = mergeIntervals(turns, 0);
  const turnTotal = totalMs(turnMerged);
  const turnDays = splitByDay(turnMerged);
  const days = [];
  for (const d of asc([...daySet], (a, b) => a < b ? -1 : a > b ? 1 : 0)) {
    const byGap = {};
    const segByGap = {};
    for (let i = 0; i < gaps.length; i++) {
      const g = String(gaps[i]);
      byGap[g] = perGapDays[i].get(d) ?? 0;
      segByGap[g] = perGapSegs[i].get(d) ?? 0;
    }
    days.push({
      d,
      sessions: dayMeta.sessions[d] ?? 0,
      tokens: dayMeta.tokens[d] ?? 0,
      turnMs: turnDays.get(d) ?? 0,
      byGap,
      segByGap,
      llmMs: dayMeta.llmMs[d] ?? 0,
      toolMs: dayMeta.toolMs[d] ?? 0
    });
  }
  let llmTotal = 0;
  let toolTotal = 0;
  for (const v of Object.values(dayMeta.llmMs)) llmTotal += v;
  for (const v of Object.values(dayMeta.toolMs)) toolTotal += v;
  return {
    defaultGapMin: normGapMin(defaultGapMin),
    gaps,
    totalMs: totals,
    segments,
    turnMs: turnTotal,
    llmMs: llmTotal,
    toolMs: toolTotal,
    activeDays: days.length,
    firstDay: days.length > 0 ? days[0].d : null,
    lastDay: days.length > 0 ? days[days.length - 1].d : null,
    days
  };
}

// src/host/quota.ts
function isRecord5(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function sanitizeView(raw) {
  let parsed = raw;
  try {
    parsed = JSON.parse(JSON.stringify(raw));
  } catch {
    return null;
  }
  if (!isRecord5(parsed) || !Array.isArray(parsed["sections"])) return null;
  const KINDS = /* @__PURE__ */ new Set(["windows", "balance", "metrics", "progress", "split", "note", "chart"]);
  const sections = [];
  for (const item of parsed["sections"]) {
    if (sections.length >= 12) break;
    if (!isRecord5(item)) continue;
    const kind = item["kind"];
    if (typeof kind !== "string" || !KINDS.has(kind)) continue;
    const s = { kind };
    if (typeof item["key"] === "string") s.key = item["key"].slice(0, 40);
    if (typeof item["title"] === "string") s.title = item["title"].slice(0, 40);
    if (Array.isArray(item["windows"]))
      s.windows = item["windows"].slice(0, 8);
    if (isRecord5(item["billing"])) s.billing = item["billing"];
    if (Array.isArray(item["items"])) {
      s.items = item["items"].filter(isRecord5).slice(0, 12).map((it) => ({
        label: String(it["label"] ?? "").slice(0, 40),
        value: String(it["value"] ?? "").slice(0, 60)
      }));
    }
    if (isRecord5(item["progress"])) {
      const p = item["progress"];
      const used = Number(p["used"]);
      const total = Number(p["total"]);
      if (Number.isFinite(used) && Number.isFinite(total)) {
        const out = { used, total };
        if (typeof p["label"] === "string") out.label = p["label"].slice(0, 40);
        if (typeof p["left"] === "string") out.left = p["left"].slice(0, 60);
        s.progress = out;
      }
    }
    if (isRecord5(item["split"]) && Array.isArray(item["split"]["segments"])) {
      s.split = {
        segments: item["split"]["segments"].filter(isRecord5).slice(0, 8).map((sg) => {
          const seg = {
            label: String(sg["label"] ?? "").slice(0, 40),
            value: Number(sg["value"]) || 0
          };
          if (typeof sg["color"] === "string") seg.color = sg["color"].slice(0, 24);
          return seg;
        })
      };
    }
    if (isRecord5(item["note"]) && typeof item["note"]["text"] === "string") {
      const tone = item["note"]["tone"];
      const note = {
        text: item["note"]["text"].slice(0, 300)
      };
      if (tone === "info" || tone === "warn" || tone === "bad") note.tone = tone;
      s.note = note;
    }
    if (isRecord5(item["chart"]) && Array.isArray(item["chart"]["values"])) {
      const chart = {
        labels: (Array.isArray(item["chart"]["labels"]) ? item["chart"]["labels"] : []).slice(-60).map((l) => String(l).slice(0, 16)),
        values: item["chart"]["values"].slice(-60).map((v) => Number(v) || 0)
      };
      if (typeof item["chart"]["title"] === "string")
        chart.title = item["chart"]["title"].slice(0, 40);
      s.chart = chart;
    }
    sections.push(s);
  }
  return sections.length ? { sections } : null;
}
function sanitizeCfg(cfg) {
  const vs = Array.isArray(cfg.vendors) ? cfg.vendors : [];
  const av = cfg.activeVendor !== void 0 && cfg.activeVendor !== null ? String(cfg.activeVendor) : vs[0] && vs[0].id || "";
  return {
    version: 1,
    activeVendor: av,
    refreshSec: cfg.refreshSec,
    enabled: cfg.enabled !== false,
    vendors: vs.filter((v) => v && v.id && v.name && v.type).map((v) => {
      const vv = v;
      const rawParams = vv.params && typeof vv.params === "object" ? vv.params : {};
      const kind = secretKindOf({ type: vv.type, params: rawParams });
      const params = maskParamsForType(vv.type, rawParams);
      const out = {
        id: String(vv.id),
        name: String(vv.name),
        type: String(vv.type),
        params,
        secretKind: kind,
        // 余额查询开关：缺省 = 启用（只有显式 false 才是禁用）
        enabled: vv.enabled !== false
      };
      return out;
    })
  };
}
async function refreshOne(st, resolveSecret, v) {
  const snap = {
    vendorId: v.id,
    vendorName: v.name,
    ok: false,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    fetchedAtMs: Date.now()
  };
  try {
    const adapter = getProvider(v.type);
    if (!adapter) throw new Error("\u672A\u77E5\u4F9B\u5E94\u5546\u7C7B\u578B:" + v.type);
    const data = await adapter.fetch(v, { resolveSecret, fetchImpl: fetch });
    if (!data) throw new Error("\u672A\u77E5\u4F9B\u5E94\u5546\u7C7B\u578B:" + v.type);
    snap.ok = true;
    snap.billingKind = data.billingKind;
    if (data.windows) snap.windows = data.windows;
    if (data.billing) snap.billing = data.billing;
    if (data.secretKind) snap.secretKind = data.secretKind;
    if (data.extra !== void 0 && data.extra !== null) {
      try {
        snap.extra = JSON.parse(JSON.stringify(data.extra));
      } catch {
      }
    }
    try {
      snap.view = sanitizeView(data.view) || sanitizeView(
        defaultView({
          ...data.billingKind ? { billingKind: data.billingKind } : {},
          ...data.windows ? { windows: data.windows } : {},
          ...data.billing ? { billing: data.billing } : {},
          extra: data.extra ?? null
        })
      );
    } catch {
      snap.view = null;
    }
    if (typeof data.via === "string" && data.via) snap.via = data.via.slice(0, 24);
  } catch (e) {
    snap.ok = false;
    snap.error = e?.message || "\u62C9\u53D6\u5931\u8D25";
    try {
      snap.errorInfo = toErrorInfo(e, {
        vendorName: v.name,
        type: v.type,
        secretKind: secretKindOf({ type: v.type, params: v.params || {} })
      });
    } catch {
    }
  }
  st.snaps[v.id] = snap;
  st.lastPullMs = Date.now();
  return snap;
}
function checkVendor(v) {
  if (!v || typeof v !== "object") return "\u4F9B\u5E94\u5546\u4E3A\u7A7A";
  const r = v;
  if (!/^[a-z0-9][a-z0-9-]{1,30}$/.test(r["id"] || ""))
    return "ID \u975E\u6CD5(\u5C0F\u5199\u5B57\u6BCD/\u6570\u5B57/\u6A2A\u7EBF,2-31\u4F4D)";
  if (!r["name"]) return "\u663E\u793A\u540D\u5B57\u5FC5\u586B";
  if (!hasProvider(String(r["type"]))) return "\u672A\u77E5\u7C7B\u578B";
  r["params"] = r["params"] && typeof r["params"] === "object" ? r["params"] : {};
  return "";
}
function mergeVendorSecret(stored, incoming) {
  const f = getSecretField(incoming.type);
  if (!f) return incoming;
  const key = stored && locateSecretKey(stored) || f;
  const nextVal = incoming.params ? incoming.params[key] : "";
  const prevVal = stored ? readSecretValue(stored) : "";
  const prevKind = stored ? secretKindOf(stored) : "empty";
  const incomingHasSecret = readSecretValue(incoming) !== "";
  if (!incomingHasSecret && (nextVal === void 0 || nextVal === null || nextVal === "") && prevKind === "plain" && prevVal) {
    return { ...incoming, params: { ...incoming.params, [key]: prevVal } };
  }
  return incoming;
}
function settingsDocPath(ctx) {
  try {
    const settings = ctx.get("settings");
    if (settings && typeof settings.documentPath === "string") {
      const p = settings.documentPath;
      const idx = p.lastIndexOf("/");
      const name2 = idx === -1 ? p : p.slice(idx + 1);
      return name2 === "settings.yaml" ? "$DSH_HOME/settings.yaml" : name2;
    }
  } catch {
  }
  return "";
}
var BASE = "/ext/dshp-token-meter";
function registerQuotaRoutes(ctx, deps) {
  const { getConfig, updateConfig, resolveSecret, st } = deps;
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/state`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        try {
          const cfg = getConfig();
          return json(res, 200, {
            ok: true,
            namespace: NS,
            docPath: settingsDocPath(ctx),
            config: {
              ...sanitizeCfg(cfg),
              showToday: cfg.showToday === true,
              defaultRange: cfg.defaultRange,
              onlineGapMin: cfg.onlineGapMin
            },
            snaps: st.snaps,
            providers: describeProviders(),
            providerTypes: providerTypes()
          });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u52A0\u8F7D\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: state route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/refresh`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const cfg = getConfig();
          const a = body ?? {};
          const list = a["id"] ? cfg.vendors.filter((v) => v.id === a["id"]) : cfg.vendors;
          if (a["id"] && !list.length)
            return json(res, 200, { ok: false, error: "\u672A\u77E5\u4F9B\u5E94\u5546:" + String(a["id"]) });
          for (const v of list) await refreshOne(st, resolveSecret, v);
          return json(res, 200, { ok: true, snaps: st.snaps });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u5237\u65B0\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: refresh route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/set-active`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const cfg = getConfig();
          const b = body ?? {};
          const id = b["id"] !== void 0 && b["id"] !== null ? String(b["id"]) : "";
          if (id !== "" && !cfg.vendors.some((v) => v.id === id))
            return json(res, 200, { ok: false, error: "\u672A\u77E5\u4F9B\u5E94\u5546" });
          await updateConfig({ activeVendor: id });
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u5207\u6362\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: set-active route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/set-refresh`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const b = body ?? {};
          const raw = b ? b["sec"] : void 0;
          if (raw === void 0 || raw === null || raw === "")
            return json(res, 200, { ok: false, error: "\u79D2\u6570\u5FC5\u586B(0=\u5173\u95ED\u81EA\u52A8\u5237\u65B0)" });
          if (!Number.isFinite(Number(raw))) return json(res, 200, { ok: false, error: "\u79D2\u6570\u975E\u6CD5" });
          const n = (function(v) {
            if (v === 0 || v === "0") return 0;
            const nn = Math.floor(Number(v));
            if (!Number.isFinite(nn)) return 60;
            return Math.min(3600, Math.max(10, nn));
          })(raw);
          await updateConfig({ refreshSec: n });
          return json(res, 200, { ok: true, sec: n });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u4FDD\u5B58\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: set-refresh route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/set-enabled`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const b = body ?? {};
          if (!b || !Object.hasOwn(b, "enabled"))
            return json(res, 200, { ok: false, error: "enabled \u5FC5\u586B\uFF08\u5E03\u5C14\u503C\uFF09" });
          const on = b["enabled"] === true;
          await updateConfig({ enabled: on });
          return json(res, 200, { ok: true, enabled: on });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u4FDD\u5B58\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: set-enabled route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/set-vendor-enabled`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const cfg = getConfig();
          const b = body ?? {};
          const id = b["id"] !== void 0 && b["id"] !== null ? String(b["id"]) : "";
          if (!id) return json(res, 200, { ok: false, error: "id \u5FC5\u586B" });
          if (typeof b["enabled"] !== "boolean")
            return json(res, 200, { ok: false, error: "enabled \u5FC5\u586B\uFF08\u5E03\u5C14\u503C\uFF09" });
          const i = cfg.vendors.findIndex((v) => v.id === id);
          if (i === -1) return json(res, 200, { ok: false, error: "\u672A\u77E5\u4F9B\u5E94\u5546:" + id });
          const on = b["enabled"] === true;
          const next = cfg.vendors.slice();
          const nv = { ...cfg.vendors[i] };
          if (on)
            delete nv.enabled;
          else nv.enabled = false;
          next[i] = nv;
          await updateConfig({ vendors: next });
          if (on) {
            void refreshOne(st, resolveSecret, nv).catch(() => {
            });
          }
          return json(res, 200, { ok: true, id, enabled: on });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u4FDD\u5B58\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: set-vendor-enabled route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/add-vendor`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const cfg = getConfig();
          const b = body ?? {};
          const v = b && b["vendor"] || null;
          const err = checkVendor(v);
          if (err) return json(res, 200, { ok: false, error: err });
          const vv = v;
          if (cfg.vendors.some((x) => x.id === vv.id))
            return json(res, 200, { ok: false, error: "ID \u5DF2\u5B58\u5728" });
          await updateConfig({
            vendors: [...cfg.vendors, { id: vv.id, name: vv.name, type: vv.type, params: vv.params }]
          });
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u4FDD\u5B58\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: add-vendor route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/update-vendor`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const cfg = getConfig();
          const b = body ?? {};
          const v = b && b["vendor"] || null;
          const err = checkVendor(v);
          if (err) return json(res, 200, { ok: false, error: err });
          const vv = v;
          const i = cfg.vendors.findIndex((x) => x.id === vv.id);
          if (i === -1) return json(res, 200, { ok: false, error: "\u672A\u77E5\u4F9B\u5E94\u5546" });
          const next = cfg.vendors.slice();
          const stored = cfg.vendors[i];
          const merged = mergeVendorSecret(stored, {
            id: vv.id,
            name: vv.name,
            type: canonicalType(String(vv.type)),
            params: vv.params ?? {}
          });
          if (stored.enabled === false) merged.enabled = false;
          next[i] = merged;
          await updateConfig({ vendors: next });
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u4FDD\u5B58\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: update-vendor route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/delete-vendor`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          const cfg = getConfig();
          const b = body ?? {};
          const id = b && b["id"] || "";
          const next = cfg.vendors.filter((v) => v.id !== id);
          const nextActive = cfg.activeVendor === id ? next[0] && next[0].id || "" : cfg.activeVendor;
          if (nextActive !== cfg.activeVendor)
            await updateConfig({ vendors: next, activeVendor: nextActive });
          else await updateConfig({ vendors: next });
          delete st.snaps[id];
          return json(res, 200, { ok: true });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u5220\u9664\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: delete-vendor route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/secret-to-cred`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        try {
          let creds = null;
          try {
            creds = ctx.get("credentials");
          } catch {
            creds = null;
          }
          if (!creds) return json(res, 200, { ok: false, error: "\u51ED\u636E\u670D\u52A1\u4E0D\u53EF\u7528" });
          const cfg = getConfig();
          const b = body ?? {};
          const id = b && b["id"] || "";
          const v = cfg.vendors.filter((x) => x.id === id)[0];
          if (!v) return json(res, 200, { ok: false, error: "\u672A\u77E5\u4F9B\u5E94\u5546" });
          const f = getSecretField(v.type);
          if (!f) return json(res, 200, { ok: false, error: "\u8BE5\u7C7B\u578B\u65E0\u5BC6\u94A5\u5B57\u6BB5" });
          const raw = readSecretValue(v) || "";
          const writeKey = locateSecretKey(v) || f;
          if (typeof raw === "string" && (DOLLAR_REF_RE.test(raw) || ENV_REF_RE.test(raw) || CRED_REF_RE.test(raw))) {
            return json(res, 200, { ok: false, error: "\u5DF2\u7ECF\u662F\u5F15\u7528,\u65E0\u9700\u8F6C\u5B58" });
          }
          const r = await resolveSecret(raw);
          if (!r.value) return json(res, 200, { ok: false, error: "\u5BC6\u94A5\u4E3A\u7A7A" });
          const credName = ("TMETER_" + id.replace(/[^A-Za-z0-9_]/g, "_")).toUpperCase();
          await creds.set(credName, r.value);
          const next = cfg.vendors.map(
            (x) => x.id === id ? { ...x, params: { ...x.params, [writeKey]: "$" + credName } } : x
          );
          await updateConfig({ vendors: next });
          return json(res, 200, { ok: true, cred: credName });
        } catch (e) {
          return json(res, 200, { ok: false, error: e?.message || "\u8F6C\u5B58\u5931\u8D25" });
        }
      }
    }),
    "dshp-token-meter: secret-to-cred route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE}/config`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        if (req.method !== "POST")
          return json(res, 405, { ok: false, error: "method not allowed" });
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        const a = isRecord5(body) ? body : {};
        try {
          const patchObj = {};
          let hasPatch = false;
          if (Object.hasOwn(a, "enabled")) {
            patchObj["enabled"] = a["enabled"] === true;
            hasPatch = true;
          }
          if (Object.hasOwn(a, "showToday")) {
            patchObj["showToday"] = a["showToday"] === true;
            hasPatch = true;
          }
          if (Object.hasOwn(a, "defaultRange")) {
            const dr = a["defaultRange"];
            if (dr !== "7" && dr !== "30" && dr !== "90" && dr !== "all")
              throw new Error("defaultRange \u975E\u6CD5\uFF0C\u5E94\u4E3A '7' / '30' / '90' / 'all'");
            patchObj["defaultRange"] = dr;
            hasPatch = true;
          }
          if (Object.hasOwn(a, "onlineGapMin")) {
            const g = Number(a["onlineGapMin"]);
            if (!Number.isFinite(g)) throw new Error("onlineGapMin \u975E\u6CD5\uFF0C\u5E94\u4E3A 1/5/15/30/60");
            patchObj["onlineGapMin"] = normGapMin(g);
            hasPatch = true;
          }
          if (Object.hasOwn(a, "refreshSec")) {
            const raw = a["refreshSec"];
            if (raw === void 0 || raw === null || raw === "")
              throw new Error("refreshSec \u975E\u6CD5\uFF0C\u5E94\u4E3A\u6570\u5B57\uFF080=\u5173\u95ED\uFF09");
            const n = Number(raw);
            if (!Number.isFinite(n)) throw new Error("refreshSec \u975E\u6CD5\uFF0C\u5E94\u4E3A\u6570\u5B57\uFF080=\u5173\u95ED\uFF09");
            patchObj["refreshSec"] = raw === 0 || raw === "0" ? 0 : Math.min(3600, Math.max(10, Math.floor(n)));
            hasPatch = true;
          }
          if (Object.hasOwn(a, "activeVendor")) {
            if (typeof a["activeVendor"] !== "string") throw new Error("activeVendor \u975E\u6CD5\uFF0C\u5E94\u4E3A\u5B57\u7B26\u4E32");
            const id = a["activeVendor"];
            const cfg = getConfig();
            if (id !== "" && !cfg.vendors.some((v) => v.id === id)) throw new Error("\u672A\u77E5\u4F9B\u5E94\u5546");
            patchObj["activeVendor"] = id;
            hasPatch = true;
          }
          if (hasPatch) await updateConfig(patchObj);
          return json(res, 200, { ok: true, config: getConfig() });
        } catch (e) {
          return json(res, 200, { ok: false, error: String(e?.message ?? e) });
        }
      }
    }),
    "dshp-token-meter: config route"
  );
}

// src/host/stats/fold.ts
function modelKey(provider, model) {
  return String(provider || "unknown") + "/" + String(model || "unknown");
}
var BUCKETS = ["i", "o", "cr", "cw"];
function emptyResult() {
  return {
    records: /* @__PURE__ */ new Map(),
    peak: null,
    first: null,
    last: null,
    used: false,
    active: [],
    turns: [],
    llmMs: 0,
    toolMs: 0,
    dayLlm: /* @__PURE__ */ new Map(),
    dayTool: /* @__PURE__ */ new Map(),
    outcome: "no-request"
  };
}
function numOf(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function createFolder(skipCount) {
  const state = emptyResult();
  let routeProvider = "unknown";
  let routeModel = "unknown";
  const route = () => routeProvider + "/" + routeModel;
  const setRoute = (p, m) => {
    if (p !== void 0 && p !== null && p !== "") routeProvider = String(p);
    if (m !== void 0 && m !== null && m !== "") routeModel = String(m);
  };
  let pending = null;
  const commit = (usage, time, model) => {
    const vals = {
      i: numOf(usage["inputTokens"]),
      o: numOf(usage["outputTokens"]),
      cr: numOf(usage["cacheReadTokens"]),
      cw: numOf(usage["cacheWriteTokens"])
    };
    const tokens = vals.i + vals.o + vals.cr + vals.cw;
    if (tokens <= 0) return;
    state.used = true;
    const d = dayKey(time);
    const h = new Date(time).getHours();
    const k = d + "|" + h + "|" + model;
    let r = state.records.get(k);
    if (r === void 0) {
      r = { d, h, m: model, i: 0, o: 0, cr: 0, cw: 0, n: 0 };
      state.records.set(k, r);
    }
    for (const b of BUCKETS) r[b] += vals[b];
    r.n += 1;
    if (state.peak === null || tokens > state.peak.tokens) state.peak = { tokens, d, model };
    if (state.first === null || d < state.first) state.first = d;
    if (state.last === null || d > state.last) state.last = d;
  };
  const flush = () => {
    if (pending === null) return;
    commit(pending.usage, pending.time, pending.model);
    pending = null;
  };
  const limit = skipCount > 0 ? skipCount : 0;
  const times = [];
  const turns = [];
  let openTurn = null;
  let llmMs = 0;
  let toolMs = 0;
  let sawRequest = false;
  let sawMessage = false;
  let sawUsageMessage = false;
  let openStep = null;
  const pendingCalls = /* @__PURE__ */ new Map();
  let processed = 0;
  function push2(ev) {
    if (processed++ < limit) return;
    const t = Number(ev && ev.time);
    const hasTime = Number.isFinite(t) && t > 0;
    if (hasTime) times.push(t);
    if (hasTime && ev.type === "turn/start") {
      openTurn = t;
    } else if (hasTime && ev.type === "turn/end") {
      if (openTurn !== null && t > openTurn) turns.push([openTurn, t]);
      openTurn = null;
      pendingCalls.clear();
    }
    const data = ev && ev.data;
    if (data === null || typeof data !== "object") return;
    switch (ev.type) {
      case "step/start": {
        openStep = hasTime ? { turn: data["turn"], step: data["step"], start: t } : null;
        break;
      }
      case "tool/call": {
        if (hasTime) {
          const callId = data["callId"];
          if (typeof callId === "string") pendingCalls.set(callId, t);
        }
        break;
      }
      case "tool/result": {
        if (!hasTime) break;
        const message = data["message"];
        const source = message && message["source"];
        const callId = source ? source["callId"] : void 0;
        if (typeof callId !== "string") break;
        const dispatched = pendingCalls.get(callId);
        if (dispatched === void 0) break;
        pendingCalls.delete(callId);
        const span = Math.max(0, t - dispatched);
        toolMs += span;
        const dk = dayKey(t);
        state.dayTool.set(dk, (state.dayTool.get(dk) ?? 0) + span);
        break;
      }
      case "request/header": {
        sawRequest = true;
        const header = data["header"];
        const cfg = header && header["config"];
        if (cfg) setRoute(cfg["provider"], cfg["model"]);
        break;
      }
      case "request/context": {
        sawRequest = true;
        setRoute(data["provider"], data["model"]);
        break;
      }
      case "assistant/chunk": {
        const chunk = data["chunk"];
        if (chunk !== null && typeof chunk === "object" && chunk["type"] === "usage" && chunk["usage"]) {
          const key = String(data["turn"]) + ":" + String(data["step"]);
          if (pending !== null && pending.key !== key) flush();
          pending = {
            key,
            usage: chunk["usage"],
            time: Number(ev.time) || 0,
            model: route()
          };
        }
        break;
      }
      case "assistant/message": {
        sawMessage = true;
        if (data["usage"]) sawUsageMessage = true;
        const key = String(data["turn"]) + ":" + String(data["step"]);
        const msg = data["message"];
        const src = msg && msg["source"];
        const srcModel = src && src["kind"] === "model" ? modelKey(src["provider"], src["model"]) : null;
        if (openStep !== null && openStep.turn === data["turn"] && openStep.step === data["step"] && hasTime) {
          const span = Math.max(0, t - openStep.start);
          llmMs += span;
          const dk = dayKey(t);
          state.dayLlm.set(dk, (state.dayLlm.get(dk) ?? 0) + span);
          openStep = null;
        }
        if (data["usage"]) {
          if (pending !== null && pending.key !== key) flush();
          pending = {
            key,
            usage: data["usage"],
            time: Number(ev.time) || 0,
            model: srcModel || route()
          };
        } else if (pending !== null && pending.key === key && srcModel !== null) {
          pending.model = srcModel;
        }
        break;
      }
    }
  }
  function finish() {
    flush();
    state.active = mergePoints(times, BASE_GAP_MS);
    state.turns = mergeIntervals(turns, 0);
    state.llmMs = llmMs;
    state.toolMs = toolMs;
    const ownCount = processed - limit;
    state.outcome = state.records.size > 0 ? "usage" : !sawRequest && (times.length === 0 || ownCount <= 4) ? "fork-empty" : !sawRequest ? "no-request" : !sawMessage ? "failed" : sawUsageMessage ? "usage" : "no-usage";
    return state;
  }
  return { push: push2, finish, result: () => state, count: () => processed };
}
function foldSession(events, skipCount) {
  const folder = createFolder(skipCount);
  for (const ev of events) folder.push(ev);
  return folder.finish();
}
var flat = (iv) => {
  const out = [];
  for (const [a, b] of iv) out.push(a, b);
  return out;
};
var unflat = (nums) => {
  if (!Array.isArray(nums)) return [];
  const out = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const a = Number(nums[i]);
    const b = Number(nums[i + 1]);
    if (Number.isFinite(a) && Number.isFinite(b) && b >= a) out.push([a, b]);
  }
  return out;
};
var nonNeg = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
var compactAgg = (agg) => ({
  r: Array.from(agg.records.entries()),
  p: agg.peak,
  f: agg.first,
  l: agg.last,
  u: agg.used,
  on: flat(agg.active),
  tn: flat(agg.turns),
  lm: Math.round(agg.llmMs),
  tm: Math.round(agg.toolMs),
  dm: dmCompact(agg),
  oc: agg.outcome
});
function dmCompact(agg) {
  const days = /* @__PURE__ */ new Set([...agg.dayLlm.keys(), ...agg.dayTool.keys()]);
  const out = [];
  for (const d of days)
    out.push([d, Math.round(agg.dayLlm.get(d) ?? 0), Math.round(agg.dayTool.get(d) ?? 0)]);
  return out;
}
var reviveAgg = (c) => {
  const dayLlm = /* @__PURE__ */ new Map();
  const dayTool = /* @__PURE__ */ new Map();
  if (Array.isArray(c.dm)) {
    for (const row of c.dm) {
      if (!Array.isArray(row) || row.length < 3) continue;
      const d = String(row[0]);
      dayLlm.set(d, nonNeg(row[1]));
      dayTool.set(d, nonNeg(row[2]));
    }
  }
  return {
    records: new Map(c.r),
    peak: c.p,
    first: c.f,
    last: c.l,
    used: c.u,
    active: unflat(c.on),
    turns: unflat(c.tn),
    llmMs: nonNeg(c.lm),
    toolMs: nonNeg(c.tm),
    dayLlm,
    dayTool,
    outcome: c.oc ?? "failed"
  };
};
var LOG_FILE_NAMES = [
  "session.v4.jsonl.zstd",
  "session.v4.jsonl",
  "session.v3.jsonl.zstd",
  "session.jsonl.zstd"
];
function buildFileIndex(sessionsDir) {
  const idx = /* @__PURE__ */ new Map();
  try {
    for (const entry of readdirSync(sessionsDir)) {
      const full = join(sessionsDir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (!st.isDirectory()) continue;
      let sessDirs;
      try {
        sessDirs = readdirSync(full);
      } catch {
        continue;
      }
      for (const sess of sessDirs) {
        const dir = join(full, sess);
        try {
          if (!statSync(dir).isDirectory()) continue;
        } catch {
          continue;
        }
        const parts = [];
        let newest = null;
        for (const name2 of LOG_FILE_NAMES) {
          const file = join(dir, name2);
          try {
            const s = statSync(file);
            if (!s.isFile()) continue;
            parts.push(name2 + ":" + s.size + ":" + Math.floor(s.mtimeMs));
            if (newest === null || s.mtimeMs > newest.mtimeMs)
              newest = { file, size: s.size, mtimeMs: s.mtimeMs };
          } catch {
          }
        }
        if (newest === null) continue;
        idx.set(sess, { ...newest, fp: parts.join("|") });
      }
    }
  } catch {
  }
  return idx;
}
function fileFingerprint(index, id) {
  const e = index.get(id);
  return e === void 0 ? null : e.fp;
}
var ZSTD_MAGIC = Buffer.from([40, 181, 47, 253]);
function hasZstd() {
  const z = zlib;
  return typeof z.zstdDecompressSync === "function";
}
function* zstdFrames(buf) {
  const z = zlib;
  const inflate = z.zstdDecompressSync;
  if (typeof inflate !== "function") throw new Error("zstd unsupported");
  let offset = 0;
  let frames = 0;
  while (offset < buf.length && frames < 2e5) {
    frames++;
    let cut = buf.indexOf(ZSTD_MAGIC, offset + 4);
    for (; ; ) {
      const end = cut < 0 ? buf.length : cut;
      try {
        const data = inflate.call(zlib, buf.subarray(offset, end));
        offset = end;
        yield { data, end };
        break;
      } catch {
        if (cut < 0) return;
        cut = buf.indexOf(ZSTD_MAGIC, cut + 4);
      }
    }
  }
}
function asRecord(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v : null;
}
function consumeLogTail(file, from2, onEvent) {
  if (!hasZstd()) return null;
  let fd = null;
  try {
    fd = openSync(file, "r");
    const size = fstatSync(fd).size;
    if (from2 > size) return { offset: 0, reset: true };
    if (from2 === size) return { offset: from2, reset: false };
    if (from2 > 0) {
      const probe = Buffer.alloc(4);
      const got = readSync(fd, probe, 0, 4, from2);
      if (got < 4 || !probe.equals(ZSTD_MAGIC)) return { offset: 0, reset: true };
    }
    const len = size - from2;
    const buf = Buffer.alloc(len);
    const read = readSync(fd, buf, 0, len, from2);
    let offset = from2;
    let carry = "";
    for (const frame of zstdFrames(buf.subarray(0, read))) {
      const text = carry + frame.data.toString("utf8");
      let start = 0;
      for (; ; ) {
        const nl = text.indexOf("\n", start);
        if (nl < 0) break;
        if (nl > start) {
          try {
            onEvent(JSON.parse(text.slice(start, nl)));
          } catch {
          }
        }
        start = nl + 1;
      }
      carry = text.slice(start);
      offset = from2 + frame.end;
    }
    if (carry.length > 0) {
      try {
        onEvent(JSON.parse(carry));
      } catch {
      }
    }
    return { offset, reset: false };
  } catch {
    return null;
  } finally {
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch {
      }
    }
  }
}
function readLogDirect(file) {
  if (!hasZstd()) return null;
  const events = [];
  let consumed = 0;
  try {
    let carry = "";
    for (const frame of zstdFrames(readFileSync(file))) {
      consumed = frame.end;
      const text = carry + frame.data.toString("utf8");
      let start = 0;
      for (; ; ) {
        const nl = text.indexOf("\n", start);
        if (nl < 0) break;
        if (nl > start) {
          try {
            events.push(JSON.parse(text.slice(start, nl)));
          } catch {
          }
        }
        start = nl + 1;
      }
      carry = text.slice(start);
    }
    if (carry.length > 0) {
      try {
        events.push(JSON.parse(carry));
      } catch {
      }
    }
  } catch {
    return null;
  }
  if (events.length === 0) return null;
  const header = asRecord(events[0]);
  if (header === null) return null;
  const createdAtRaw = header["createdAt"];
  const createdAt = typeof createdAtRaw === "number" && Number.isFinite(createdAtRaw) ? createdAtRaw : 0;
  let cut = -1;
  let via = "marker";
  for (let i = 0; i < events.length; i++) {
    const rec = asRecord(events[i]);
    if (rec === null || rec["type"] !== "session/end-seed") continue;
    const data = asRecord(rec["data"]);
    if (data !== null && data["inherited"] === true) cut = i;
  }
  if (cut < 0 && createdAt > 0) {
    via = "createdAt";
    cut = events.length - 1;
    for (let i = 0; i < events.length; i++) {
      const rec = asRecord(events[i]);
      const t = rec ? rec["time"] : void 0;
      if (typeof t === "number" && t >= createdAt) {
        cut = i - 1;
        break;
      }
    }
  }
  const kept = cut + 1;
  if (kept <= 0) return { events: [], skip: events.length, via, offset: consumed };
  if (kept >= events.length) return { events, skip: 0, via: "none", offset: consumed };
  return { events: events.slice(kept), skip: kept, via, offset: consumed };
}

// src/host/stats/stream.ts
function asRecord2(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? v : null;
}
function isInheritedMarker(rec) {
  if (rec === null || rec["type"] !== "session/end-seed") return false;
  const data = asRecord2(rec["data"]);
  return data !== null && data["inherited"] === true;
}
function openStream(file, size, mtimeMs) {
  const folder = createFolder(0);
  let createdAt = 0;
  let decided = false;
  let seen = 0;
  const res = consumeLogTail(file, 0, (ev) => {
    const rec = asRecord2(ev);
    seen++;
    if (!decided) {
      if (createdAt === 0) {
        const c = rec ? rec["createdAt"] : void 0;
        createdAt = typeof c === "number" && Number.isFinite(c) ? c : 0;
        return;
      }
      const t = rec ? rec["time"] : void 0;
      if (typeof t === "number" && (createdAt === 0 || t >= createdAt)) decided = true;
      else return;
    }
    if (isInheritedMarker(rec)) return;
    folder.push(ev);
  });
  if (res === null || seen === 0) return null;
  return { folder, file, offset: res.offset, size, mtimeMs };
}
function extendStream(st, size, mtimeMs) {
  const res = consumeLogTail(st.file, st.offset, (ev) => st.folder.push(ev));
  if (res === null || res.reset) return false;
  st.offset = res.offset;
  st.size = size;
  st.mtimeMs = mtimeMs;
  return true;
}

// src/host/stats/async.ts
function withTimeout(promise, ms, label) {
  let timer = 0;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("timeout after " + ms + "ms" + (label ? " (" + label + ")" : "")));
    }, ms);
    if (timer !== null && typeof timer === "object" && typeof timer.unref === "function")
      timer.unref();
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => {
      clearTimeout(timer);
    }),
    timeout
  ]);
}

// src/host/stats/engine.ts
var BATCH_SIZE = 3;
var MAX_ATTEMPTS = 3;
var READ_TIMEOUT_MS = 2e4;
var READ_TIMEOUT_STEP_MS = 15e3;
var READ_TIMEOUT_MAX_MS = 9e4;
var CACHE_V = 4;
var UNIT_NAME_RE = /^[a-z][a-z0-9_]*$/;
function domainTable(schema) {
  return { valueSchema: schema };
}
function defineDomain(spec) {
  if (!UNIT_NAME_RE.test(spec.name))
    throw new Error(`domain name '${spec.name}' must match ${String(UNIT_NAME_RE)}`);
  if (!Number.isInteger(spec.version) || spec.version < 0)
    throw new Error(`domain '${spec.name}' version must be a non-negative integer, got ${spec.version}`);
  for (const table of Object.keys(spec.tables))
    if (!UNIT_NAME_RE.test(table))
      throw new Error(`domain '${spec.name}' table name '${table}' must match ${String(UNIT_NAME_RE)}`);
  return spec;
}
function isNonNegInt(v) {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER;
}
function parseDayMs(raw) {
  if (raw === void 0 || raw === null) return void 0;
  if (!Array.isArray(raw)) throw new Error("invalid-record: dm");
  const out = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 3) throw new Error("invalid-record: dm row");
    const d = row[0];
    const l = row[1];
    const t = row[2];
    if (typeof d !== "string" || !isNonNegInt(l) || !isNonNegInt(t))
      throw new Error("invalid-record: dm value");
    out.push([d, l, t]);
  }
  return out;
}
function parseFlatIntervals(raw) {
  if (raw === void 0 || raw === null) return void 0;
  if (!Array.isArray(raw)) throw new Error("invalid-record: intervals");
  for (const n of raw)
    if (typeof n !== "number" || !Number.isFinite(n)) throw new Error("invalid-record: interval value");
  return raw;
}
function parseBucket(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new Error("invalid bucket");
  const r = raw;
  if (typeof r["d"] !== "string" || r["d"].length < 1) throw new Error("invalid bucket.d");
  if (typeof r["m"] !== "string" || r["m"].length < 1) throw new Error("invalid bucket.m");
  if (!isNonNegInt(r["h"])) throw new Error("invalid bucket.h");
  for (const k of ["i", "o", "cr", "cw", "n"]) {
    if (!isNonNegInt(r[k])) throw new Error("invalid bucket." + k);
  }
  return {
    d: r["d"],
    h: r["h"],
    m: r["m"],
    i: r["i"],
    o: r["o"],
    cr: r["cr"],
    cw: r["cw"],
    n: r["n"]
  };
}
var cachedSessionSchema = {
  parse(raw) {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw))
      throw new Error("invalid-record: not object");
    const r = raw;
    if (typeof r["fp"] !== "string" || r["fp"].length < 1) throw new Error("invalid-record: fp");
    if (!isNonNegInt(r["skip"])) throw new Error("invalid-record: skip");
    if (r["v"] !== void 0 && !(typeof r["v"] === "number" && Number.isInteger(r["v"])))
      throw new Error("invalid-record: v");
    if (!Array.isArray(r["r"])) throw new Error("invalid-record: r");
    const buckets = [];
    for (const entry of r["r"]) {
      if (!Array.isArray(entry) || entry.length !== 2) throw new Error("invalid-record: r entry");
      const k = entry[0];
      if (typeof k !== "string" || k.length < 1) throw new Error("invalid-record: r key");
      buckets.push([k, parseBucket(entry[1])]);
    }
    let p = null;
    if (r["p"] !== null && r["p"] !== void 0) {
      const pr = r["p"];
      if (typeof pr !== "object" || Array.isArray(pr)) throw new Error("invalid-record: p");
      if (!isNonNegInt(pr["tokens"])) throw new Error("invalid-record: p.tokens");
      if (typeof pr["d"] !== "string" || pr["d"].length < 1)
        throw new Error("invalid-record: p.d");
      if (typeof pr["model"] !== "string" || pr["model"].length < 1)
        throw new Error("invalid-record: p.model");
      p = { tokens: pr["tokens"], d: pr["d"], model: pr["model"] };
    }
    const f = r["f"];
    const l = r["l"];
    if (f !== null && typeof f !== "string") throw new Error("invalid-record: f");
    if (l !== null && typeof l !== "string") throw new Error("invalid-record: l");
    if (typeof r["u"] !== "boolean") throw new Error("invalid-record: u");
    const on = parseFlatIntervals(r["on"]);
    const tn = parseFlatIntervals(r["tn"]);
    const dm = parseDayMs(r["dm"]);
    const oc = r["oc"];
    return {
      fp: r["fp"],
      skip: r["skip"],
      ...r["v"] !== void 0 ? { v: r["v"] } : {},
      r: buckets,
      p,
      f: f ?? null,
      l: l ?? null,
      u: r["u"],
      ...on !== void 0 ? { on } : {},
      ...tn !== void 0 ? { tn } : {},
      ...dm !== void 0 ? { dm } : {},
      ...typeof oc === "string" ? { oc } : {}
    };
  }
};
var tokenStatsDomainSpec = defineDomain({
  name: "token_stats",
  version: 0,
  tables: { sessions: domainTable(cachedSessionSchema) }
});
function clampSkip(inheritedEventCount, events) {
  const n = typeof inheritedEventCount === "number" ? Math.floor(inheritedEventCount) : NaN;
  if (!Number.isSafeInteger(n) || n < 0) return 0;
  const len = Array.isArray(events) ? events.length : 0;
  return n > len ? len : n;
}
function createEngine(sessionQuery, dshHome, storageDomain, getGapMin) {
  const sessionsDir = join(dshHome, "sessions");
  const aggMemo = /* @__PURE__ */ new Map();
  const fpMemo = /* @__PURE__ */ new Map();
  const dirty = /* @__PURE__ */ new Set();
  const attempts = /* @__PURE__ */ new Map();
  const errored = /* @__PURE__ */ new Set();
  const directIds = /* @__PURE__ */ new Set();
  const errorSamples = /* @__PURE__ */ new Map();
  const directSessions = /* @__PURE__ */ new Set();
  const streams = /* @__PURE__ */ new Map();
  let queue = [];
  let pumping = false;
  let listedIds = /* @__PURE__ */ new Set();
  let currentIndex = buildFileIndex(sessionsDir);
  let storageOk = true;
  let storageWarned = false;
  const noteStorageError = (label, error) => {
    storageOk = false;
    const msg = label + ": " + String(error?.message ?? error);
    if (!storageWarned) {
      storageWarned = true;
      try {
        console.warn(
          "[dshp-token-meter] storage domain " + msg + " \u2014 \u7F13\u5B58\u6301\u4E45\u5316\u4E0D\u53EF\u7528\uFF0C\u7EDF\u8BA1\u4ECD\u6B63\u5E38\u8FD0\u884C\uFF08\u4EC5\u91CD\u542F\u540E\u91CD\u626B\uFF09"
        );
      } catch {
      }
    }
  };
  const nullTable = {
    get: (_k) => void 0,
    put: async (_k, _v) => {
    }
  };
  let openAttempt = 0;
  const openDomain = () => {
    if (!storageDomain || typeof storageDomain.open !== "function") {
      noteStorageError("open failed", new Error("storageDomain \u670D\u52A1\u4E0D\u53EF\u7528"));
      return Promise.resolve({ table: nullTable, close: async () => {
      }, degraded: true });
    }
    return storageDomain.open(tokenStatsDomainSpec).then((domain) => {
      storageOk = true;
      storageWarned = false;
      return { table: domain.table("sessions"), close: () => domain.close() };
    }).catch((error) => {
      noteStorageError("open failed", error);
      return { table: nullTable, close: async () => {
      }, degraded: true };
    });
  };
  let tableReady = openDomain();
  function invalidate(sessionId) {
    if (typeof sessionId === "string") {
      dirty.add(sessionId);
      errored.delete(sessionId);
      attempts.delete(sessionId);
    }
  }
  function readViaFallback(id) {
    const entry = currentIndex.get(id);
    if (entry === void 0) return null;
    const direct = readLogDirect(entry.file);
    if (direct === null) return null;
    directSessions.add(id);
    return foldSession(direct.events, 0);
  }
  async function pump() {
    if (pumping) return;
    pumping = true;
    try {
      while (queue.length > 0) {
        const batch = queue.splice(0, BATCH_SIZE);
        const tbl = await tableReady;
        await Promise.all(
          batch.map(async (job) => {
            const attempt = (attempts.get(job.id) || 0) + 1;
            const timeoutMs = Math.min(
              READ_TIMEOUT_MAX_MS,
              READ_TIMEOUT_MS + (attempt - 1) * READ_TIMEOUT_STEP_MS
            );
            try {
              const entry = currentIndex.get(job.id);
              let agg = null;
              const stream = streams.get(job.id);
              if (entry !== void 0 && stream !== void 0 && stream.file === entry.file) {
                if (entry.size > stream.size && extendStream(stream, entry.size, entry.mtimeMs)) {
                  directSessions.add(job.id);
                  agg = stream.folder.finish();
                } else if (entry.size === stream.size) {
                  agg = stream.folder.finish();
                } else {
                  streams.delete(job.id);
                }
              }
              if (agg === null && entry !== void 0) {
                const opened = openStream(entry.file, entry.size, entry.mtimeMs);
                if (opened !== null) {
                  streams.set(job.id, opened);
                  directSessions.add(job.id);
                  agg = opened.folder.finish();
                }
              }
              let skip = 0;
              if (agg === null) {
                const snap = await withTimeout(
                  sessionQuery.readSession(job.id),
                  timeoutMs,
                  "readSession " + job.id
                );
                skip = clampSkip(
                  snap?.inheritedEventCount,
                  snap?.events
                );
                agg = foldSession(snap?.events || [], skip);
              }
              if (agg === null) throw new Error("log unavailable");
              aggMemo.set(job.id, agg);
              attempts.delete(job.id);
              errored.delete(job.id);
              dirty.delete(job.id);
              const fp = fileFingerprint(currentIndex, job.id);
              if (fp !== null) {
                fpMemo.set(job.id, fp);
                try {
                  await tbl.table.put(job.id, { fp, skip, v: CACHE_V, ...compactAgg(agg) });
                } catch (error) {
                  noteStorageError("put failed", error);
                }
              }
            } catch (error) {
              const viaFallback = directIds.has(job.id) ? null : readViaFallback(job.id);
              if (viaFallback !== null) {
                aggMemo.set(job.id, viaFallback);
                attempts.delete(job.id);
                errored.delete(job.id);
                dirty.delete(job.id);
                directIds.add(job.id);
                const fp0 = fileFingerprint(currentIndex, job.id);
                if (fp0 !== null) {
                  fpMemo.set(job.id, fp0);
                  try {
                    const t0 = await tableReady;
                    await t0.table.put(job.id, { fp: fp0, skip: 0, v: CACHE_V, ...compactAgg(viaFallback) });
                  } catch (e2) {
                    noteStorageError("put failed", e2);
                  }
                }
                return;
              }
              if (errorSamples.size < 5)
                errorSamples.set(job.id, String(error?.message ?? error).slice(0, 120));
              attempts.set(job.id, attempt);
              if (attempt >= MAX_ATTEMPTS) {
                aggMemo.set(job.id, {
                  records: /* @__PURE__ */ new Map(),
                  peak: null,
                  first: null,
                  last: null,
                  used: false,
                  active: [],
                  turns: [],
                  llmMs: 0,
                  toolMs: 0,
                  dayLlm: /* @__PURE__ */ new Map(),
                  dayTool: /* @__PURE__ */ new Map(),
                  outcome: "unreadable"
                });
                errored.add(job.id);
              }
            }
          })
        );
        if (queue.length > 0) await new Promise((resolve2) => setImmediate(resolve2));
      }
    } finally {
      pumping = false;
    }
  }
  async function snapshot2() {
    await maybeReopenStorage();
    const list = await sessionQuery.listSessions();
    listedIds = /* @__PURE__ */ new Set();
    const jobs = [];
    let scanned = 0;
    let cacheHits = 0;
    let reused = 0;
    currentIndex = buildFileIndex(sessionsDir);
    for (const rec of list) {
      const header = rec && rec.header;
      if (header === null || typeof header !== "object") continue;
      const id = header["id"];
      if (typeof id !== "string") continue;
      listedIds.add(id);
      const live = rec.live === true;
      const isDirty = dirty.has(id);
      let need = false;
      const entry = currentIndex.get(id);
      const mtime = entry === void 0 ? 0 : entry.mtimeMs;
      if (live) {
        need = isDirty || !aggMemo.has(id);
        if (!need) reused++;
      } else {
        const fp = fileFingerprint(currentIndex, id);
        if (isDirty || !aggMemo.has(id)) {
          let hit;
          try {
            hit = (await tableReady).table.get(id);
          } catch {
            hit = void 0;
          }
          if (!isDirty && hit !== void 0 && hit.fp === fp && hit.v === CACHE_V) {
            cacheHits++;
            reused++;
            aggMemo.set(id, reviveAgg(hit));
            if (fp !== null) fpMemo.set(id, fp);
            dirty.delete(id);
          } else {
            need = true;
          }
        } else if (fp !== null && fpMemo.get(id) !== fp) {
          need = true;
        } else {
          reused++;
        }
      }
      if (need && !errored.has(id)) {
        const job = { id, mtime, live };
        if (isDirty) job.mtime = Infinity;
        jobs.push(job);
      }
      if (aggMemo.has(id)) scanned++;
    }
    jobs.sort((a, b) => b.mtime - a.mtime);
    if (jobs.length > 0) {
      const queued = new Set(queue.map((j) => j.id));
      for (const j of jobs) {
        if (!queued.has(j.id)) {
          queued.add(j.id);
          queue.push(j);
        }
      }
      queue.sort((a, b) => b.mtime - a.mtime);
      void pump();
    }
    const merged = /* @__PURE__ */ new Map();
    const models = {};
    const daySessions = {};
    let peak = null;
    let first = null;
    let last = null;
    let active = 0;
    const activeIntervals = [];
    const turnIntervals = [];
    const dayTokens = {};
    const dayLlm = {};
    const dayTool = {};
    const sessionOutcomes = {};
    for (const id of listedIds) {
      const agg = aggMemo.get(id);
      if (agg === void 0) continue;
      if (agg.used) {
        active++;
        const days = /* @__PURE__ */ new Set();
        for (const r of agg.records.values()) days.add(r.d);
        for (const d of days) daySessions[d] = (daySessions[d] || 0) + 1;
      }
      for (const iv of agg.active) activeIntervals.push(iv);
      for (const iv of agg.turns) turnIntervals.push(iv);
      sessionOutcomes[agg.outcome] = (sessionOutcomes[agg.outcome] ?? 0) + 1;
      for (const [d, v] of agg.dayLlm) dayLlm[d] = (dayLlm[d] || 0) + v;
      for (const [d, v] of agg.dayTool) dayTool[d] = (dayTool[d] || 0) + v;
      for (const r of agg.records.values()) {
        const k = r.d + "|" + r.h + "|" + r.m;
        let m = merged.get(k);
        if (m === void 0) {
          m = { d: r.d, h: r.h, m: r.m, i: 0, o: 0, cr: 0, cw: 0, n: 0 };
          merged.set(k, m);
        }
        m.i += r.i;
        m.o += r.o;
        m.cr += r.cr;
        m.cw += r.cw;
        m.n += r.n;
        dayTokens[r.d] = (dayTokens[r.d] || 0) + r.i + r.o + r.cr + r.cw;
        if (models[r.m] === void 0) {
          const slash = r.m.indexOf("/");
          models[r.m] = slash > 0 ? { provider: r.m.slice(0, slash), model: r.m.slice(slash + 1) } : { provider: "unknown", model: r.m };
        }
      }
      if (agg.peak !== null && (peak === null || agg.peak.tokens > peak.tokens)) peak = agg.peak;
      if (agg.first !== null && (first === null || agg.first < first)) first = agg.first;
      if (agg.last !== null && (last === null || agg.last > last)) last = agg.last;
    }
    for (const id of aggMemo.keys()) {
      if (listedIds.has(id)) continue;
      aggMemo.delete(id);
      streams.delete(id);
      fpMemo.delete(id);
      attempts.delete(id);
      errored.delete(id);
      dirty.delete(id);
      try {
        const t = await tableReady;
        if (t.table !== nullTable && typeof t.table.delete === "function") await t.table.delete(id);
      } catch {
      }
    }
    const records = Array.from(merged.values());
    records.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : a.h - b.h);
    let gapMin = 5;
    try {
      gapMin = normGapMin(getGapMin ? getGapMin() : 5);
    } catch {
      gapMin = 5;
    }
    const online = buildOnline(
      activeIntervals,
      turnIntervals,
      { sessions: daySessions, tokens: dayTokens, llmMs: dayLlm, toolMs: dayTool },
      gapMin
    );
    const total = listedIds.size;
    return {
      ready: true,
      records,
      models,
      daySessions,
      peakStep: peak,
      range: first === null ? null : { first, last },
      sessions: total,
      active,
      partial: total - scanned > 0,
      scanned,
      total,
      errors: errored.size,
      errorSamples: [...errorSamples.entries()].map(([id, message]) => ({ id, message })),
      sessionOutcomes,
      cacheHits,
      reused,
      directReads: directSessions.size,
      storage: storageOk ? "ok" : "disabled",
      generatedAt: Date.now(),
      online
    };
  }
  function start() {
    const t = setTimeout(() => {
      void snapshot2().catch(() => {
      });
    }, 100);
    if (typeof t.unref === "function")
      t.unref();
  }
  async function clearCache() {
    let removed = 0;
    try {
      const t = await tableReady;
      if (t.table !== nullTable && typeof t.table.keys === "function") {
        const keys = [...t.table.keys()];
        for (const k of keys) {
          try {
            await t.table.delete(k);
            removed++;
          } catch (error) {
            noteStorageError("delete failed", error);
          }
        }
      }
    } catch (error) {
      noteStorageError("clear failed", error);
    }
    aggMemo.clear();
    streams.clear();
    fpMemo.clear();
    attempts.clear();
    errored.clear();
    dirty.clear();
    errorSamples.clear();
    directSessions.clear();
    queue = [];
    return removed;
  }
  async function drain() {
    for (; ; ) {
      if (!pumping && queue.length === 0) break;
      await new Promise((resolve2) => setImmediate(resolve2));
    }
    await tableReady;
    await new Promise((resolve2) => setImmediate(resolve2));
  }
  async function dispose() {
    try {
      const t = await tableReady;
      await t.close();
    } catch {
    }
  }
  async function maybeReopenStorage() {
    if (storageOk) return;
    openAttempt++;
    if (openAttempt % 5 !== 0) return;
    const prev = await tableReady;
    if (prev.degraded === true) tableReady = openDomain();
  }
  return { invalidate, snapshot: snapshot2, start, drain, dispose, clearCache };
}

// src/host/stats/routes.ts
var BASE2 = "/ext/dshp-token-meter";
function registerStatsRoutes(ctx, engine) {
  const handler = async (_req, res) => {
    const req = _req;
    if (!sameOrigin(req)) return json(res, 403, { ready: false, error: "forbidden" });
    try {
      if (!engine)
        return json(res, 200, {
          ready: false,
          error: "sessionQuery \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u7EDF\u8BA1\u6682\u4E0D\u53EF\u7528\uFF08\u989D\u5EA6\u529F\u80FD\u4E0D\u53D7\u5F71\u54CD\uFF09"
        });
      const data = await engine.snapshot();
      return json(res, 200, data);
    } catch (error) {
      return json(res, 200, { ready: false, error: String(error?.message ?? error) });
    }
  };
  ctx.effect(
    () => ctx.webServer.register({ kind: "exact", path: `${BASE2}/stats`, handler }),
    "dshp-token-meter: stats route"
  );
  ctx.effect(
    () => ctx.webServer.register({ kind: "exact", path: `${BASE2}/data`, handler }),
    "dshp-token-meter: stats alias route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: `${BASE2}/clear-cache`,
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        try {
          if (!engine) return json(res, 200, { ok: false, error: "\u7EDF\u8BA1\u5F15\u64CE\u4E0D\u53EF\u7528" });
          const removed = await engine.clearCache();
          return json(res, 200, { ok: true, removed });
        } catch (error) {
          return json(res, 200, { ok: false, error: String(error?.message ?? error) });
        }
      }
    }),
    "dshp-token-meter: clear cache route"
  );
}
var cached = null;
function parseGitConfig(text, key) {
  let section = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#") || line.startsWith(";")) continue;
    const sec = /^\[([^\]]+)\]/.exec(line);
    if (sec) {
      section = (sec[1] || "").trim().toLowerCase();
      continue;
    }
    if (section !== "user") continue;
    const kv = /^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/.exec(line);
    if (!kv) continue;
    if ((kv[1] || "").toLowerCase() !== key) continue;
    return (kv[2] || "").trim().replace(/^"(.*)"$/, "$1");
  }
  return "";
}
function fromConfigFiles(key) {
  const xdg = process.env["XDG_CONFIG_HOME"];
  const candidates = [
    xdg ? join(xdg, "git", "config") : join(homedir(), ".config", "git", "config"),
    join(homedir(), ".gitconfig")
  ];
  let found = "";
  for (const file of candidates) {
    try {
      const v = parseGitConfig(readFileSync(file, "utf8"), key);
      if (v !== "") found = v;
    } catch {
    }
  }
  return found;
}
async function gitIdentity(ctx, cwd) {
  if (cached !== null) return cached;
  const envName = process.env["DSHP_TOKEN_METER_GIT_NAME"];
  const envEmail = process.env["DSHP_TOKEN_METER_GIT_EMAIL"];
  if (envName !== void 0 || envEmail !== void 0) {
    cached = { name: envName || "", email: envEmail || "", via: "env" };
    return cached;
  }
  let name2 = "";
  let email = "";
  let via = "none";
  const shell = ctx.get("shell");
  if (shell !== void 0 && shell !== null && typeof shell.run === "function") {
    const run = async (cmd) => {
      try {
        const spec = shell.resolve({
          command: cmd,
          ...cwd ? { workdir: cwd } : {},
          timeoutMs: 4e3
        });
        const r = await shell.run(spec);
        if (r && r.exitCode === 0 && r.stdout && typeof r.stdout.text === "string") {
          return r.stdout.text.trim();
        }
      } catch {
      }
      return "";
    };
    name2 = await run("git config --get user.name");
    email = await run("git config --get user.email");
    if (name2 !== "" || email !== "") via = "git";
  }
  if (name2 === "" && email === "") {
    name2 = fromConfigFiles("name");
    email = fromConfigFiles("email");
    if (name2 !== "" || email !== "") via = "config-file";
  }
  cached = { name: name2, email, via };
  return cached;
}
function registerIdentityRoute(ctx) {
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/ext/dshp-token-meter/identity",
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        try {
          const id = await gitIdentity(ctx);
          return json(res, 200, { ok: true, ...id });
        } catch (error) {
          return json(res, 200, { ok: false, error: String(error?.message ?? error) });
        }
      }
    }),
    "dshp-token-meter: identity route"
  );
}

// src/host/index.ts
var name = "@dshp/token-meter";
var inject = ["webServer"];
var Config = ConfigSchema;
function apply(ctx, config) {
  try {
    ctx.inject(["settings"], (sctx) => {
      try {
        sctx.effect(
          () => sctx.settings.configure({ auto: false }, ctx.fiber),
          "dshp-token-meter: settings-page"
        );
      } catch (error) {
        console.error("[dshp-token-meter] \u6CE8\u518C settings \u9875\u9762\u7B56\u7565\u5931\u8D25\uFF0C\u504F\u597D\u5C06\u56DE\u9ED8\u8BA4\u503C\uFF1A", error);
      }
    });
  } catch (error) {
    console.error("[dshp-token-meter] settings \u670D\u52A1\u6CE8\u5165\u5931\u8D25\uFF0C\u504F\u597D\u5C06\u56DE\u9ED8\u8BA4\u503C\uFF1A", error);
  }
  function getConfig() {
    const rawVendors = config.vendors.get();
    return {
      version: config.version ?? 1,
      activeVendor: config.activeVendor.get(),
      refreshSec: config.refreshSec.get(),
      enabled: config.enabled.get(),
      vendors: (Array.isArray(rawVendors) ? rawVendors : []).map((item) => {
        const it = item ?? {};
        const vendor = {
          id: String(it["id"] !== void 0 ? it["id"] : ""),
          name: String(it["name"] !== void 0 ? it["name"] : ""),
          type: canonicalType(String(it["type"] !== void 0 ? it["type"] : "manual")),
          params: it["params"] && typeof it["params"] === "object" && !Array.isArray(it["params"]) ? it["params"] : {}
        };
        if (it["enabled"] === false) vendor.enabled = false;
        return vendor;
      }),
      showToday: config.showToday.get(),
      defaultRange: config.defaultRange.get(),
      onlineGapMin: normGapMin(config.onlineGapMin.get())
    };
  }
  async function updateConfig(patchObj) {
    const settings = ctx.get("settings");
    if (!settings)
      throw new Error(
        "settings \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u6301\u4E45\u5316\u5230 profile \u6761\u76EE config\uFF08\u8BF7\u91CD\u542F DSH \u786E\u8BA4\u8BBE\u7F6E\u670D\u52A1\u5DF2\u6302\u8F7D\uFF09"
      );
    await settings.update(NS, JSON.parse(JSON.stringify(patchObj)));
  }
  const st = { snaps: {} };
  const resolveSecret = createSecretResolver(ctx);
  let sessionQuery = null;
  try {
    sessionQuery = ctx.get("sessionQuery");
  } catch {
    sessionQuery = null;
  }
  let storageDomain = null;
  try {
    storageDomain = ctx.get("storageDomain");
  } catch {
    storageDomain = null;
  }
  let dshHome = "";
  try {
    dshHome = process.env["DSH_HOME"] || "";
  } catch {
  }
  if (!dshHome) {
    try {
      dshHome = join(homedir(), ".dsh");
    } catch {
      dshHome = "/tmp/.dsh";
    }
  }
  const engine = sessionQuery && typeof sessionQuery.listSessions === "function" && typeof sessionQuery.readSession === "function" ? createEngine(sessionQuery, dshHome, storageDomain, () => getConfig().onlineGapMin) : null;
  if (engine) {
    try {
      ctx.effect(
        () => ctx.on("session/event", (session) => {
          const id = session && session.id;
          if (typeof id === "string") engine.invalidate(id);
        }),
        "dshp-token-meter: invalidate on session event"
      );
    } catch {
    }
    try {
      ctx.effect(
        () => () => {
          void engine.dispose();
        },
        "dshp-token-meter: close domain on dispose"
      );
    } catch {
    }
  } else {
    try {
      console.warn("[dshp-token-meter] sessionQuery \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u7EDF\u8BA1\u6682\u4E0D\u53EF\u7528\uFF08\u989D\u5EA6\u529F\u80FD\u4E0D\u53D7\u5F71\u54CD\uFF09");
    } catch {
    }
  }
  try {
    registerQuotaRoutes(ctx, { getConfig, updateConfig, resolveSecret, st });
  } catch (e) {
    try {
      console.error("[dshp-token-meter] register quota routes failed: " + String(e?.message ?? e));
    } catch {
    }
  }
  try {
    const clampSec = (raw) => {
      const n = Number(raw);
      if (!isFinite(n) || n <= 0) return 0;
      return Math.min(3600, Math.max(10, n));
    };
    let stopped = false;
    let timer = null;
    const schedule = (ms) => {
      if (stopped) return;
      timer = setTimeout(
        () => {
          void tick();
        },
        Math.max(1e3, ms)
      );
    };
    const tick = async () => {
      if (stopped) return;
      let sec = 60;
      try {
        const cfg = getConfig();
        sec = clampSec(cfg.refreshSec);
        if (sec > 0) {
          const since = st.lastPullMs ? Date.now() - st.lastPullMs : Infinity;
          const budget = sec * 1e3;
          if (since < budget * 0.6) {
            schedule(budget - since);
            return;
          }
          const list = Array.isArray(cfg.vendors) ? cfg.vendors : [];
          for (const v of list) {
            if (stopped) return;
            if (v.enabled === false) continue;
            try {
              await refreshOne(st, resolveSecret, v);
            } catch {
            }
          }
        }
      } catch {
      }
      schedule((sec > 0 ? sec : 60) * 1e3);
    };
    schedule(4e3);
    try {
      ctx.effect(
        () => () => {
          stopped = true;
          if (timer) clearTimeout(timer);
        },
        "dshp-token-meter: quota auto refresh"
      );
    } catch {
    }
  } catch (e) {
    try {
      console.warn("[dshp-token-meter] quota auto refresh \u542F\u52A8\u5931\u8D25\uFF1A" + String(e?.message ?? e));
    } catch {
    }
  }
  try {
    registerStatsRoutes(ctx, engine);
    registerIdentityRoute(ctx);
  } catch (e) {
    try {
      console.error("[dshp-token-meter] register stats routes failed: " + String(e?.message ?? e));
    } catch {
    }
  }
  if (engine) {
    try {
      engine.start();
    } catch {
    }
  }
  try {
    console.log("[dshp-token-meter] settings(dshp-token-meter) quota + stats ready");
  } catch {
  }
}

export { Config, ConfigSchema, NS, apply, inject, name };
