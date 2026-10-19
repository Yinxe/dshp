import { resolve, dirname, sep } from 'path';
import { realpath } from 'fs/promises';
import { tmpdir } from 'os';

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
var NS = "dshp-file-change-viewer";
var ConfigSchema = Schema.object({
  view: Schema.union([Schema.const("highlight"), Schema.const("diff")]).default("highlight").volatile(),
  sectionsOpen: Schema.boolean().default(false).volatile(),
  patchTool: Schema.boolean().default(false).volatile(),
  contextLines: Schema.union([Schema.const(0), Schema.const(3), Schema.const(5), Schema.const(8)]).default(3).volatile()
});
var ESCALATION_TARGETS = ["workspace-write", "danger-full-access"];
var WIDER_MODES = {
  "read-only": ["workspace-write", "danger-full-access"],
  "workspace-write": ["danger-full-access"]
};
function sandboxDenialMarker(mode) {
  return `[sandbox: file access denied under ${mode} mode]`;
}
function escalationHintMarker(subject) {
  return `[sandbox: escalation available \u2014 retry this exact ${subject} once with sandbox_permissions (the narrowest wider mode that suffices) + justification; the approval prompt asks the user]`;
}
function escalationSchemaFields(modes) {
  return {
    sandbox_permissions: {
      type: "string",
      enum: [...modes],
      description: "The wider sandbox mode this file operation needs. Only valid as a one-shot retry of an operation the sandbox just denied; requires justification and user approval."
    },
    justification: {
      type: "string",
      description: "Required with sandbox_permissions: one sentence for the user explaining why this exact file operation needs the wider access."
    }
  };
}
function validateEscalationArgs(sandboxPermissions, justification) {
  if (sandboxPermissions !== void 0 && justification === void 0) {
    throw new Error("invalid escalation: sandbox_permissions requires a justification");
  }
  if (justification !== void 0 && sandboxPermissions === void 0) {
    throw new Error("invalid escalation: justification is only valid together with sandbox_permissions");
  }
  if (typeof justification === "string" && justification.trim().length === 0) {
    throw new Error("invalid justification: expected a non-empty sentence");
  }
}
async function approveEscalation(request, approval) {
  const { requestedMode: mode, effectiveMode, justification, subject } = request;
  if (!(WIDER_MODES[effectiveMode] ?? []).includes(mode)) {
    throw new Error(
      `sandbox escalation to "${mode}" is not strictly wider than this call's current "${effectiveMode}" mode`
    );
  }
  if (approval.approver === void 0) {
    throw new Error(`sandbox escalation to "${mode}" requires approval, but no approval service is composed`);
  }
  if (approval.agent === void 0) {
    throw new Error(
      `sandbox escalation to "${mode}" requires approval, but the call has no agent to route it through`
    );
  }
  const outcome = await approval.approver.request({
    agent: approval.agent,
    toolName: approval.toolName,
    callId: approval.callId,
    reason: `escalate sandbox to ${mode}: ${justification}`,
    ...approval.signal === void 0 ? {} : { signal: approval.signal }
  });
  switch (outcome) {
    case "allowed-once":
      return mode;
    case "rejected":
      throw new Error(`the user rejected escalating this ${subject} to "${mode}"`);
    case "cancelled":
      throw new Error(`approval for escalating to "${mode}" was cancelled`);
    default:
      throw new Error(`approval for escalating to "${mode}" was not answered (${String(outcome)})`);
  }
}
function createEscalation(ctx) {
  const confiningAtRegistration = ctx.fs?.sandboxMode !== void 0;
  const modes = confiningAtRegistration ? ESCALATION_TARGETS : [];
  const policyNow = () => ctx.get("sandboxPolicy");
  const confiningNow = () => ctx.fs?.sandboxMode !== void 0;
  return {
    modes,
    async resolvePolicy(toolName, args, exec) {
      validateEscalationArgs(args?.sandbox_permissions, args?.justification);
      const confining = confiningNow();
      const policyService = policyNow();
      if (confining && (policyService === void 0 || policyService === null)) {
        throw new Error(
          "patch: the mounted filesystem confines but ctx.sandboxPolicy is missing \u2014 cannot resolve the sandbox policy for this call (refusing to write without a resolved policy)"
        );
      }
      const session = exec?.agent?.session;
      const standing = policyService?.resolve(session === void 0 ? {} : { session });
      if (args?.sandbox_permissions === void 0 || args?.justification === void 0) return standing;
      if (!confining) {
        throw new Error(
          "sandbox_permissions is not available in this composition (no sandboxing filesystem to escalate)"
        );
      }
      const approvedMode = await approveEscalation(
        {
          requestedMode: args.sandbox_permissions,
          justification: String(args.justification),
          effectiveMode: String(standing?.mode),
          subject: "operation"
        },
        {
          approver: ctx.get("approval"),
          agent: exec?.agent,
          callId: exec?.callId,
          toolName,
          signal: exec?.signal
        }
      );
      return { ...standing, mode: approvedMode };
    },
    /**
     * 把围栏抛出的 `FS_SANDBOX_DENIED` 换成官方那两行标记，**并把原来那个错误对象原样抛出去**。
     *
     * 为什么不新造一个 `Error`：`ToolRuntime` 只对运行时的 `HarnessError` 实例（`instanceof` 判定）
     * 往会话日志里填 `result.error = { name, code }`。新造的 `Error` 即使在字段上写了 `code` 也过不了
     * 那道 `instanceof`，结果就是 `patch` 的拒绝在日志/重试逻辑里「没有错误码」——与 `edit` 不一致。
     * 而 `ctx.fs` 抛出来的本来就是真正的 `FsError`（`HarnessError` 子类），所以改它的 `message`
     * 再原样 throw，类、code、文本三者都与官方文件工具一致；`cause` 链的差别是外层的，观察不到。
     */
    mapError(error, policy) {
      if (error?.code !== "FS_SANDBOX_DENIED") return error;
      const mode = policy?.mode ?? "unknown";
      const text = `${sandboxDenialMarker(mode)}
${escalationHintMarker("operation")}`;
      const original = error;
      try {
        original.message = text;
        return error;
      } catch {
        const fallback = new Error(text);
        fallback.code = "FS_SANDBOX_DENIED";
        fallback.cause = error;
        return fallback;
      }
    }
  };
}
function writableRootsUnder(policy) {
  if (policy.mode !== "workspace-write") return [];
  return Array.from(new Set([policy.workspaceRoot, "/tmp", tmpdir()].map((root) => resolve(root))));
}
async function isUnder(target, root) {
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (target === root || target.startsWith(prefix)) return true;
  const same = (real) => real === root || real.startsWith(prefix);
  try {
    if (same(await realpath(target))) return true;
  } catch {
  }
  let ancestor = dirname(target);
  for (; ; ) {
    try {
      if (same(await realpath(ancestor))) return true;
    } catch {
    }
    const parent = dirname(ancestor);
    if (parent === ancestor) return false;
    ancestor = parent;
  }
}
async function assertWritable(policy, displayPath) {
  if (policy === void 0) return;
  if (policy.mode === "danger-full-access") return;
  if (!displayPath.startsWith("/")) return;
  const target = resolve(displayPath);
  if (policy.mode === "read-only") {
    throw sandboxDenied(policy, target);
  }
  const roots = writableRootsUnder(policy);
  for (const root of roots) {
    if (await isUnder(target, root)) return;
  }
  throw sandboxDenied(policy, target);
}
function sandboxDenied(policy, target) {
  const error = new Error(`${sandboxDenialMarker(policy.mode)}
${escalationHintMarker("operation")}`);
  error.code = "FS_SANDBOX_DENIED";
  error.displayPath = target;
  return error;
}
async function assertBatchWritable(policy, displayPaths) {
  if (policy === void 0 || policy.mode === "danger-full-access") return;
  const denied = [];
  for (const displayPath of displayPaths) {
    try {
      await assertWritable(policy, displayPath);
    } catch {
      denied.push(displayPath);
    }
  }
  if (denied.length === 0) return;
  const dirs = Array.from(new Set(denied.map((path) => dirname(resolve(path)))));
  const error = new Error(
    `${sandboxDenialMarker(policy.mode)}
${escalationHintMarker("operation")}
[sandbox: out-of-workspace targets in this patch: ${denied.join(", ")}` + (dirs.length === 0 ? "" : ` (parent directories: ${dirs.join(", ")})`) + " \u2014 one retry with sandbox_permissions + justification covers the whole patch]"
  );
  error.code = "FS_SANDBOX_DENIED";
  const first = denied[0];
  if (first !== void 0) error.displayPath = first;
  throw error;
}

// src/shared/apply-patch.ts
var BEGIN_MARKER = "*** Begin Patch";
var END_MARKER = "*** End Patch";
var ADD_HEADER = "*** Add File:";
var DELETE_HEADER = "*** Delete File:";
var UPDATE_HEADER = "*** Update File:";
var MOVE_HEADER = "*** Move to:";
var END_OF_FILE = "*** End of File";
function stripHeredoc(input) {
  const match = /^(?:cat\s+)?<<['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\1\s*$/.exec(input);
  return match === null ? input : match[2];
}
function looksLikeUnifiedDiff(lines) {
  return lines.some((line) => line.startsWith("--- ") || line.startsWith("+++ ") || /^@@+ *-\d/.test(line));
}
function describeEnvelopeProblem(lines, beginAt, endAt) {
  if (beginAt >= 0 && endAt < 0) {
    const body = lines.slice(beginAt + 1).filter((line) => line.trim() !== "");
    if (body.length === 0) {
      return "patch \u662F\u7A7A\u7684\uFF1A\u4F60\u53EA\u5199\u4E86 `*** Begin Patch`\uFF0C\u91CC\u9762\u6CA1\u6709\u4EFB\u4F55\u6BB5\u843D\u3002\u628A\u8981\u6539\u7684\u6BCF\u4E2A\u6587\u4EF6\u5199\u6210\u4E00\u4E2A\u6BB5\u843D\u518D\u53D1\u4E00\u6B21\uFF1A`*** Update File: \u8DEF\u5F84` / `*** Add File: \u8DEF\u5F84`\uFF0C\u6BCF\u6BB5\u91CC\u7528 `@@` \u5F00\u5934\uFF0C`-` \u662F\u65E7\u884C\u3001`+` \u662F\u65B0\u884C\uFF0C\u6700\u540E\u4EE5 `*** End Patch` \u6536\u5C3E\u3002";
    }
    return "patch \u7F3A\u6536\u5C3E\uFF1A\u6CA1\u6709\u627E\u5230 `*** End Patch`\uFF08\u8865\u4E01\u662F\u4E0D\u662F\u88AB\u622A\u65AD\u4E86\uFF1F\uFF09\u3002\u4FE1\u5C01\u5FC5\u987B\u4EE5 `*** Begin Patch` \u5F00\u5934\u3001\u4EE5 `*** End Patch` \u7ED3\u675F\u3002";
  }
  if (beginAt < 0 && endAt >= 0) {
    return "patch \u7F3A\u5F00\u5934\uFF1A\u6709 `*** End Patch` \u4F46\u6CA1\u6709 `*** Begin Patch`\u3002\u4FE1\u5C01\u5FC5\u987B\u4E24\u5934\u90FD\u5728\u3002";
  }
  if (beginAt >= 0 && endAt >= 0 && beginAt >= endAt) {
    return "patch \u7684\u987A\u5E8F\u4E0D\u5BF9\uFF1A`*** End Patch` \u51FA\u73B0\u5728 `*** Begin Patch` \u4E4B\u524D\u3002";
  }
  if (looksLikeUnifiedDiff(lines)) {
    return "patch \u683C\u5F0F\u4E0D\u5BF9\uFF1A\u8FD9\u770B\u8D77\u6765\u662F `patch(1)` / git \u7684 unified diff\uFF08`--- a/\u2026` + `@@ -1,3 +1,3 @@`\uFF09\uFF0C\u800C\u672C\u5DE5\u5177\u7528\u7684\u662F Codex \u98CE\u683C\u7684 `*** Begin Patch` \u4FE1\u5C01\uFF0C\u4E24\u8005\u4E0D\u80FD\u6DF7\u7528\u3002\u6539\u5199\u6210\uFF1A\n*** Begin Patch\n*** Update File: <\u8DEF\u5F84>\n@@\n<\u4E0A\u4E0B\u6587\u884C\uFF08\u884C\u9996\u4E00\u4E2A\u7A7A\u683C\uFF09>\n-<\u65E7\u884C>\n+<\u65B0\u884C>\n*** End Patch\n\uFF08\u884C\u53F7\u4E0D\u7528\u5199\uFF1B`@@` \u540E\u9762\u53EF\u4EE5\u8DDF\u4E00\u884C\u6587\u4EF6\u91CC\u771F\u5B9E\u5B58\u5728\u7684\u951A\u70B9\u3002\uFF09\u5982\u679C\u53EA\u662F\u60F3\u6539\u4E00\u5904\u5C0F\u5730\u65B9\uFF0C\u7528 edit \u5DE5\u5177\u66F4\u7701\u4E8B\u3002";
  }
  return "patch \u683C\u5F0F\u4E0D\u5BF9\uFF1A\u8865\u4E01\u5FC5\u987B\u5305\u5728 `*** Begin Patch` \u4E0E `*** End Patch` \u4E4B\u95F4\uFF08\u683C\u5F0F\u8BF4\u660E\u89C1\u5DE5\u5177\u63CF\u8FF0\uFF09\u3002";
}
function collectAddedLines(lines, start, end) {
  const body = [];
  let at = start;
  while (at < end) {
    const line = lines[at];
    if (line.startsWith("***")) break;
    if (line.startsWith("+")) body.push(line.slice(1));
    at += 1;
  }
  return { contents: body.join("\n"), next: at };
}
function collectChunks(lines, start, end) {
  const chunks = [];
  let at = start;
  while (at < end) {
    const line = lines[at];
    if (line.startsWith("***")) break;
    if (!line.startsWith("@@")) {
      at += 1;
      continue;
    }
    const context = line.slice(2).trim();
    const oldLines = [];
    const newLines = [];
    let added = 0;
    let removed = 0;
    let endOfFile = false;
    at += 1;
    while (at < end) {
      const inner = lines[at];
      if (inner === END_OF_FILE) {
        endOfFile = true;
        at += 1;
        break;
      }
      if (inner.startsWith("@@") || inner.startsWith("***")) break;
      const marker = inner.charAt(0);
      if (marker === " ") {
        const text = inner.slice(1);
        oldLines.push(text);
        newLines.push(text);
      } else if (marker === "-") {
        oldLines.push(inner.slice(1));
        removed += 1;
      } else if (marker === "+") {
        newLines.push(inner.slice(1));
        added += 1;
      }
      at += 1;
    }
    const chunk = { oldLines, newLines, added, removed };
    if (context !== "") chunk.context = context;
    if (endOfFile) chunk.endOfFile = true;
    chunks.push(chunk);
  }
  return { chunks, next: at };
}
function parseApplyPatch(text, options = {}) {
  const tolerant = options.tolerant === true;
  const cleaned = stripHeredoc(text.replace(/\r\n/g, "\n").trim());
  const lines = cleaned.split("\n");
  const beginAt = lines.findIndex((line) => line.trim() === BEGIN_MARKER);
  const endAt = lines.findIndex((line) => line.trim() === END_MARKER);
  if ((beginAt < 0 || endAt < 0 || beginAt >= endAt) && !tolerant) {
    throw new Error(describeEnvelopeProblem(lines, beginAt, endAt));
  }
  const from2 = beginAt < 0 ? 0 : beginAt + 1;
  const to = endAt < 0 ? lines.length : Math.max(endAt, from2);
  const ops = [];
  let at = from2;
  while (at < to) {
    const line = lines[at];
    if (line.startsWith(ADD_HEADER)) {
      const path = line.slice(ADD_HEADER.length).trim();
      if (path === "") {
        at += 1;
        continue;
      }
      const collected = collectAddedLines(lines, at + 1, to);
      ops.push({ type: "add", path, contents: collected.contents });
      at = collected.next;
      continue;
    }
    if (line.startsWith(DELETE_HEADER)) {
      const path = line.slice(DELETE_HEADER.length).trim();
      if (path !== "") ops.push({ type: "delete", path });
      at += 1;
      continue;
    }
    if (line.startsWith(UPDATE_HEADER)) {
      const path = line.slice(UPDATE_HEADER.length).trim();
      if (path === "") {
        at += 1;
        continue;
      }
      let next = at + 1;
      const moveLine = lines[next];
      let moveTo;
      if (moveLine !== void 0 && moveLine.startsWith(MOVE_HEADER)) {
        const value = moveLine.slice(MOVE_HEADER.length).trim();
        if (value !== "") moveTo = value;
        next += 1;
      }
      const collected = collectChunks(lines, next, to);
      ops.push(
        moveTo === void 0 ? { type: "update", path, chunks: collected.chunks } : { type: "update", path, moveTo, chunks: collected.chunks }
      );
      at = collected.next;
      continue;
    }
    at += 1;
  }
  return ops;
}
function previewDiffsOf(ops) {
  const out = [];
  for (const op of ops) {
    if (op.type === "add") {
      out.push({ path: op.path, oldText: null, newText: op.contents });
      continue;
    }
    if (op.type === "delete") {
      out.push({ path: op.path, oldText: "", newText: "" });
      continue;
    }
    const path = op.moveTo ?? op.path;
    const move = op.moveTo;
    if (op.chunks.length === 0) {
      out.push(
        move === void 0 ? { path, oldText: "", newText: "" } : { path, oldPath: op.path, oldText: "", newText: "" }
      );
      continue;
    }
    for (const chunk of op.chunks) {
      const diff = {
        path,
        oldText: chunk.oldLines.join("\n"),
        newText: chunk.newLines.join("\n")
      };
      out.push(move === void 0 ? diff : { ...diff, oldPath: op.path });
    }
  }
  return out;
}
function normalizeLineEndings(text) {
  return text.replaceAll("\r\n", "\n");
}
function detectLineEnding(text) {
  const sample = text.slice(0, 4096);
  const crlf = sample.split("\r\n").length - 1;
  const lf = sample.split("\n").length - 1;
  return crlf > lf - crlf ? "\r\n" : "\n";
}
function restoreLineEndings(text, ending) {
  return ending === "\n" ? text : normalizeLineEndings(text).split("\n").join("\r\n");
}
function normalizeUnicode(text) {
  return text.replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"').replace(/[‐‑‒–—―]/g, "-").replace(/…/g, "...").replace(/\u00a0/g, " ");
}
function matchesAt(lines, pattern2, at, compare) {
  if (at < 0 || at + pattern2.length > lines.length) return false;
  for (let offset = 0; offset < pattern2.length; offset += 1) {
    if (!compare(lines[at + offset], pattern2[offset])) return false;
  }
  return true;
}
function tryMatch(lines, pattern2, startIndex, compare, eof) {
  if (eof) {
    const fromEnd = lines.length - pattern2.length;
    if (fromEnd >= startIndex && matchesAt(lines, pattern2, fromEnd, compare)) return fromEnd;
  }
  for (let at = startIndex; at + pattern2.length <= lines.length; at += 1) {
    if (matchesAt(lines, pattern2, at, compare)) return at;
  }
  return -1;
}
function seekSequence(lines, pattern2, startIndex, eof) {
  if (pattern2.length === 0) return -1;
  const passes = [
    (a, b) => a === b,
    (a, b) => a.trimEnd() === b.trimEnd(),
    (a, b) => a.trim() === b.trim(),
    (a, b) => normalizeUnicode(a.trim()) === normalizeUnicode(b.trim())
  ];
  for (const compare of passes) {
    const at = tryMatch(lines, pattern2, startIndex, compare, eof);
    if (at >= 0) return at;
  }
  return tryUniqueMatch(lines, pattern2, startIndex, eof);
}
function collapseSpaces(text) {
  return text.replace(/\s+/g, " ").trim();
}
function stripSpaces(text) {
  return text.replace(/\s+/g, "");
}
function tryUniqueMatch(lines, pattern2, startIndex, eof) {
  const compare = (a, b) => stripSpaces(a) === stripSpaces(b);
  if (eof) {
    const fromEnd = lines.length - pattern2.length;
    if (fromEnd >= startIndex && matchesAt(lines, pattern2, fromEnd, compare)) return fromEnd;
  }
  let hit = -1;
  for (let at = startIndex; at + pattern2.length <= lines.length; at += 1) {
    if (!matchesAt(lines, pattern2, at, compare)) continue;
    if (hit >= 0) return -1;
    hit = at;
  }
  return hit;
}
var MAX_DIAGNOSTIC_LINES = 2e4;
var CLOSE_ENOUGH = 0.7;
var MAX_COMPARE_CHARS = 400;
var CHUNK_PREVIEW_LINES = 4;
function editDistance(left, right) {
  const a = left.length > MAX_COMPARE_CHARS ? left.slice(0, MAX_COMPARE_CHARS) : left;
  const b = right.length > MAX_COMPARE_CHARS ? right.slice(0, MAX_COMPARE_CHARS) : right;
  let previous = Array.from({ length: b.length + 1 }, (_value, at) => at);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const remove = previous[j] + 1;
      const insert = current[j - 1] + 1;
      const swap = previous[j - 1] + cost;
      current[j] = Math.min(remove, insert, swap);
    }
    previous = current;
  }
  return previous[b.length];
}
function similarity(left, right) {
  if (left === right) return 1;
  const longest = Math.max(left.length, right.length);
  if (longest === 0) return 1;
  return 1 - editDistance(left, right) / longest;
}
function describeClosest(lines, needle) {
  if (needle === "" || lines.length === 0 || lines.length > MAX_DIAGNOSTIC_LINES) return null;
  const target = collapseSpaces(needle);
  let best = null;
  for (let at = 0; at < lines.length; at += 1) {
    const text = lines[at];
    if (text === "") continue;
    const score = similarity(collapseSpaces(text), target);
    if (best === null || score > best.similarity) {
      best = { line: at + 1, text, similarity: score };
      if (score === 1) break;
    }
  }
  return best;
}
function firstDifference(left, right) {
  const limit = Math.min(left.length, right.length);
  for (let at = 0; at < limit; at += 1) if (left.charAt(at) !== right.charAt(at)) return at;
  return limit;
}
function describeDifference(expected, actual) {
  if (expected === actual) return "";
  if (expected.trim() === actual.trim()) {
    const leadExpected = expected.length - expected.trimStart().length;
    const leadActual = actual.length - actual.trimStart().length;
    if (leadExpected !== leadActual) {
      return `\u7F29\u8FDB\u4E0D\u540C\uFF1A\u8865\u4E01\u91CC ${leadExpected} \u4E2A\u524D\u5BFC\u7A7A\u767D\uFF0C\u6587\u4EF6\u91CC ${leadActual} \u4E2A`;
    }
    return "\u884C\u5C3E\u7A7A\u767D\u4E0D\u540C";
  }
  if (collapseSpaces(expected) === collapseSpaces(actual))
    return "\u884C\u5185\u7A7A\u767D\u7684\u6570\u91CF\u4E0D\u540C\uFF08\u591A\u4E00\u4E2A / \u5C11\u4E00\u4E2A\u7A7A\u683C\u6216\u5236\u8868\u7B26\uFF09";
  if (stripSpaces(expected) === stripSpaces(actual)) return "\u53EA\u6709\u7A7A\u683C / \u5236\u8868\u7B26\u7684\u5DEE\u522B\uFF08\u6709\u6CA1\u6709\u3001\u5728\u54EA\u91CC\uFF09";
  if (normalizeUnicode(expected.trim()) === normalizeUnicode(actual.trim())) {
    return "\u6807\u70B9\u4E0D\u540C\uFF08\u5F2F\u5F15\u53F7 / \u7834\u6298\u53F7\u7B49\u88AB\u5199\u6210\u4E86 ASCII\uFF09";
  }
  const at = firstDifference(expected, actual);
  return `\u7B2C ${at + 1} \u4E2A\u5B57\u7B26\u8D77\u4E0D\u540C\uFF1A\u8865\u4E01 ${JSON.stringify(expected.slice(at, at + 40))} / \u6587\u4EF6 ${JSON.stringify(actual.slice(at, at + 40))}`;
}
function appearInOrderButSpread(lines, needle) {
  if (needle.length < 2) return false;
  let cursor = 0;
  let previous = -1;
  let spread = false;
  for (const line of needle) {
    let hit = -1;
    for (let at = cursor; at < lines.length; at += 1) {
      const candidate = lines[at];
      if (candidate === line || candidate.trim() === line.trim()) {
        hit = at;
        break;
      }
    }
    if (hit < 0) return false;
    if (previous >= 0 && hit !== previous + 1) spread = true;
    previous = hit;
    cursor = hit + 1;
  }
  return spread;
}
function findAppliedBlock(lines, needle) {
  if (needle.length === 0) return -1;
  const exact = tryMatch(lines, needle, 0, (a, b) => a === b, false);
  if (exact >= 0) return exact;
  return tryMatch(lines, needle, 0, (a, b) => a.trim() === b.trim(), false);
}
function percent2(value) {
  return `${Math.round(value * 100)}%`;
}
function toLines(text) {
  const lines = text.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}
function anchorError(lines, context, displayPath) {
  const parts = [`patch \u65E0\u6CD5\u5E94\u7528\uFF1A\u5728 ${displayPath} \u91CC\u627E\u4E0D\u5230 @@ \u951A\u70B9 ${JSON.stringify(context)}\u3002`];
  const closest = describeClosest(lines, context);
  if (closest !== null && closest.similarity >= CLOSE_ENOUGH) {
    parts.push(
      `\u6587\u4EF6\u7B2C ${closest.line} \u884C\u6700\u50CF\uFF08\u76F8\u4F3C\u5EA6 ${percent2(closest.similarity)}\uFF09\uFF0C\u5B9E\u9645\u662F\uFF1A`,
      `  ${closest.text}`
    );
    const why = describeDifference(context, closest.text);
    if (why !== "") parts.push(`\uFF08${why}\uFF09`);
  } else if (closest !== null) {
    parts.push(
      `\u6587\u4EF6\u91CC\u6CA1\u6709\u8FD9\u4E00\u884C\uFF1B\u6700\u50CF\u7684\u662F\u7B2C ${closest.line} \u884C\uFF08\u76F8\u4F3C\u5EA6\u53EA\u6709 ${percent2(closest.similarity)}\uFF09\u3002`
    );
  }
  parts.push(
    "`@@` \u540E\u9762\u5199\u7684\u662F**\u951A\u70B9**\uFF08\u6587\u4EF6\u91CC\u771F\u5B9E\u5B58\u5728\u7684\u4E00\u884C\uFF09\uFF0C\u4E0D\u662F\u5C0F\u8282\u6807\u9898\uFF1B\u4E5F\u53EF\u4EE5\u53BB\u6389\u5B83\uFF0C\u53EA\u7528\u4E0A\u4E0B\u6587\u884C\u5B9A\u4F4D\u3002"
  );
  parts.push("\u6587\u4EF6\u6CA1\u6709\u88AB\u4FEE\u6539\u3002");
  return new Error(parts.join("\n"));
}
function mismatchError(lines, chunk, displayPath, anchorAt) {
  const head = chunk.oldLines[0] ?? "";
  const parts = [`patch \u65E0\u6CD5\u5E94\u7528\uFF1A\u5728 ${displayPath} \u91CC\u627E\u4E0D\u5230\u8FD9\u4E00\u6BB5\u7684\u4E0A\u4E0B\u6587\uFF1A`, chunk.oldLines.join("\n")];
  if (anchorAt !== null) {
    const preview = lines.slice(anchorAt, anchorAt + CHUNK_PREVIEW_LINES);
    parts.push(
      `@@ \u951A\u70B9\u5728\u7B2C ${anchorAt + 1} \u884C\u627E\u5230\u4E86\uFF0C\u4F46\u5B83\u540E\u9762\u8DDF\u7684\u5185\u5BB9\u5BF9\u4E0D\u4E0A\u3002\u6587\u4EF6\u91CC\u4ECE\u90A3\u4E00\u884C\u8D77\u662F\uFF1A`,
      ...preview.map((line) => `  ${line}`),
      "\u628A - \u884C\u6539\u6210\u4E0A\u9762\u8FD9\u4E9B**\u771F\u5B9E**\u5185\u5BB9\uFF08\u8FDE\u7F29\u8FDB\u4E00\u8D77\u6284\uFF09\uFF0C\u6216\u8005\u628A\u951A\u70B9\u5199\u6210\u6539\u52A8**\u4E0A\u65B9**\u7684\u4E00\u884C\u3002"
    );
  } else {
    const closest = describeClosest(lines, head);
    if (closest !== null && closest.similarity >= CLOSE_ENOUGH) {
      parts.push(
        // 刻意写清「与第一行比」：相似度是逐行算的，不写清的话，多处内容里只有第一行像时，
        // 「相似度 100% 却报失败」会让人困惑。
        `\u6587\u4EF6\u91CC\u4E0E\u8FD9\u4E00\u6BB5**\u7B2C\u4E00\u884C**\u6700\u50CF\u7684\u662F\u7B2C ${closest.line} \u884C\uFF08\u76F8\u4F3C\u5EA6 ${percent2(closest.similarity)}\uFF09\uFF1A`,
        `  ${closest.text}`
      );
      const why = describeDifference(head, closest.text);
      if (why !== "") parts.push(`\uFF08${why}\uFF09`);
      parts.push("\u628A\u8FD9\u4E00\u884C**\u539F\u6837**\uFF08\u8FDE\u540C\u7F29\u8FDB\uFF09\u6284\u8FDB - \u884C\u518D\u8BD5\u4E00\u6B21\uFF1B\u6539\u52A8\u4E0A\u4E0B\u5404\u7559\u4E00\u884C\u4E0A\u4E0B\u6587\u4F1A\u66F4\u7A33\u3002");
    } else if (closest !== null) {
      parts.push(
        `\u8FD9\u6BB5\u6587\u672C\u5728\u6587\u4EF6\u91CC\u4E0D\u5B58\u5728\uFF1B\u6700\u50CF\u7684\u662F\u7B2C ${closest.line} \u884C\uFF08\u76F8\u4F3C\u5EA6\u53EA\u6709 ${percent2(closest.similarity)}\uFF09\uFF1A`,
        `  ${closest.text}`,
        "\u5B83\u53EF\u80FD\u6765\u81EA\u8BB0\u5FC6\u800C\u4E0D\u662F read\u2014\u2014\u5148 read \u8FD9\u4E2A\u6587\u4EF6\u7684\u76F8\u5173\u7247\u6BB5\uFF0C\u518D\u6309\u771F\u5B9E\u5185\u5BB9\u91CD\u5199\u8FD9\u4E00\u6BB5\u3002"
      );
    } else {
      parts.push("\u6587\u4EF6\u91CC\u6CA1\u6709\u53EF\u6BD4\u7684\u5019\u9009\u884C\u2014\u2014\u5148 read \u8FD9\u4E2A\u6587\u4EF6\uFF0C\u518D\u6309\u771F\u5B9E\u5185\u5BB9\u91CD\u5199\u8FD9\u4E00\u6BB5\u3002");
    }
  }
  if (appearInOrderButSpread(lines, chunk.oldLines)) {
    parts.push(
      "\u8FD9\u4E00\u6BB5\u91CC\u7684\u51E0\u5904\u5220\u9664**\u5E76\u4E0D\u76F8\u90BB**\uFF08\u4E00\u4E2A\u7247\u6BB5\u8981\u6C42\u5B83\u7684\u65E7\u5185\u5BB9\u5728\u6587\u4EF6\u91CC\u662F\u8FDE\u7EED\u7684\u4E00\u6BB5\uFF09\u3002\u6BCF\u4E00\u5904\u5355\u72EC\u5199\u4E00\u4E2A `@@` \u7247\u6BB5\uFF08\u5404\u5E26\u4E0A\u81EA\u5DF1\u7684\u4E0A\u4E0B\u51E0\u884C\u4E0A\u4E0B\u6587\uFF09\uFF0C\u6216\u8005\u628A\u4E2D\u95F4\u90A3\u4E9B\u6CA1\u6539\u7684\u884C\u4E5F\u4F5C\u4E3A\u4E0A\u4E0B\u6587\u884C\u5199\u8FDB\u6765\u3002"
    );
  }
  const appliedAt = findAppliedBlock(lines, chunk.newLines);
  if (appliedAt >= 0) {
    parts.push(
      `\u6CE8\u610F\uFF1A\u8FD9\u4E00\u6BB5\u7684**\u65B0\u5185\u5BB9**\u5DF2\u7ECF\u5728\u6587\u4EF6\u91CC\u4E86\uFF08\u7B2C ${appliedAt + 1} \u884C\u8D77\uFF09\uFF0C\u65E7\u5185\u5BB9\u4E0D\u5728\u2014\u2014\u8FD9\u6B21\u6539\u52A8\u770B\u8D77\u6765\u5DF2\u7ECF\u5E94\u7528\u8FC7\uFF08\u6216\u8005\u662F\u88AB\u522B\u7684\u7F16\u8F91\u8FBE\u6210\u4E86\u540C\u6837\u7ED3\u679C\uFF09\u3002\u786E\u8BA4\u65E0\u8BEF\u7684\u8BDD\uFF0C\u628A\u8FD9\u4E00\u6BB5\u4ECE\u8865\u4E01\u91CC\u53BB\u6389\u5373\u53EF\u3002`
    );
  }
  parts.push("\u6587\u4EF6\u6CA1\u6709\u88AB\u4FEE\u6539\u3002");
  return new Error(parts.join("\n"));
}
function computeReplacements(lines, displayPath, chunks) {
  const replacements = [];
  let lineIndex = 0;
  for (const chunk of chunks) {
    const eof = chunk.endOfFile === true;
    let anchorAt = null;
    if (chunk.context !== void 0) {
      const at = seekSequence(lines, [chunk.context], lineIndex, false);
      if (at < 0) throw anchorError(lines, chunk.context, displayPath);
      anchorAt = at;
      lineIndex = at;
    }
    if (chunk.oldLines.length === 0) {
      const last = lines.length - 1;
      const at = last >= 0 && lines[last] === "" ? last : lines.length;
      replacements.push({ at, oldLen: 0, newLines: chunk.newLines, chunk });
      continue;
    }
    let pattern2 = chunk.oldLines;
    let next = chunk.newLines;
    let found = seekSequence(lines, pattern2, lineIndex, eof);
    if (found < 0 && pattern2.length > 0 && pattern2[pattern2.length - 1] === "") {
      pattern2 = pattern2.slice(0, -1);
      if (next.length > 0 && next[next.length - 1] === "") next = next.slice(0, -1);
      found = seekSequence(lines, pattern2, lineIndex, eof);
    }
    if (found < 0) throw mismatchError(lines, chunk, displayPath, anchorAt);
    replacements.push({ at: found, oldLen: pattern2.length, newLines: next, chunk });
    lineIndex = found + pattern2.length;
  }
  replacements.sort((a, b) => a.at - b.at);
  return replacements;
}
function applyReplacements(lines, replacements) {
  const result = [...lines];
  for (let index = replacements.length - 1; index >= 0; index -= 1) {
    const replacement = replacements[index];
    result.splice(replacement.at, replacement.oldLen, ...replacement.newLines);
  }
  return result;
}
function applyChunksToText(chunks, originalText, displayPath) {
  const lines = toLines(originalText);
  const replacements = computeReplacements(lines, displayPath, chunks);
  const next = applyReplacements(lines, replacements);
  if (next.length === 0 || next[next.length - 1] !== "") next.push("");
  let shift = 0;
  const applied = [];
  for (const replacement of replacements) {
    const startIndex = replacement.at + shift;
    shift += replacement.newLines.length - replacement.oldLen;
    applied.push({
      oldText: replacement.chunk.oldLines.join("\n"),
      newText: replacement.chunk.newLines.join("\n"),
      startLine: startIndex + 1
    });
  }
  return { content: next.join("\n"), chunks: applied };
}
function countLogicalLines(text) {
  if (text === "") return 0;
  const body = text.endsWith("\n") ? text.slice(0, -1) : text;
  return body.split("\n").length;
}

// src/host/patch-tool.ts
function sessionCwdOf(exec) {
  const cwd = exec?.agent?.session?.header?.cwd;
  return typeof cwd === "string" && cwd !== "" ? cwd : void 0;
}
async function resolveTarget(ctx, path, cwd, exec) {
  return ctx.fs.resolve(path, {
    ...cwd === void 0 ? {} : { cwd },
    ...exec?.signal === void 0 ? {} : { signal: exec.signal }
  });
}
async function readFileState(ctx, target, exec) {
  const info = await ctx.fs.stat(target, exec?.signal);
  if (info === void 0) {
    ctx.emit("fs/observed", target, { kind: "absent" }, exec);
    return { info: void 0, raw: "", bom: false };
  }
  const raw = await ctx.fs.readText(target, exec?.signal);
  ctx.emit("fs/observed", target, { kind: "present", version: info.version }, exec);
  return { info, raw, bom: await readBom(ctx, target, exec) };
}
async function readBom(ctx, target, exec) {
  if (typeof ctx.fs?.readByteRange !== "function") return false;
  try {
    const head = await ctx.fs.readByteRange(target, { offset: 0, length: 3 }, exec?.signal);
    return head.length === 3 && head[0] === 239 && head[1] === 187 && head[2] === 191;
  } catch {
    return false;
  }
}
function remediate(error, displayPath, detail) {
  const code = error?.code;
  const message = String(error?.message ?? error);
  const text = code === "FS_NOT_OBSERVED" ? `cannot modify "${displayPath}": file has not been read \u2014 read the file, then retry` : code === "FS_STALE_VERSION" ? `${message} \u2014 re-read the file, then retry` : message;
  const finalText = text + detail;
  if (finalText === message) return error;
  try {
    error.message = finalText;
    return error;
  } catch {
    return new Error(finalText);
  }
}
function formatPatchOutput(value) {
  const marker = { create: "A", update: "M" };
  const lines = value.files.map(
    (file) => `${marker[file.operation]} ${file.path} (+${file.added} -${file.removed})`
  );
  lines.push("", `Success. Patched ${value.files.length} file(s): +${value.added} -${value.removed}.`);
  return lines.join("\n");
}
function safeParse(text) {
  if (typeof text !== "string" || text === "") return [];
  try {
    return parseApplyPatch(text, { tolerant: true });
  } catch {
    return [];
  }
}
function unsupportedOps(ops) {
  const found = [];
  for (const op of ops) {
    if (op.type === "delete") found.push(`*** Delete File: ${op.path}`);
    else if (op.type === "update" && op.moveTo !== void 0) {
      found.push(`*** Update File: ${op.path} \u2192 *** Move to: ${op.moveTo}`);
    }
  }
  return found;
}
function ensureTrailingNewline(contents) {
  return contents.length === 0 || contents.endsWith("\n") ? contents : `${contents}
`;
}
async function planOperation(ctx, op, cwd, exec) {
  if (op.type === "add") {
    const target = await resolveTarget(ctx, op.path, cwd, exec);
    const state2 = await readFileState(ctx, target, exec);
    if (state2.info !== void 0) {
      throw new Error(
        `patch \u65E0\u6CD5\u5E94\u7528\uFF1A${target.displayPath} \u5DF2\u7ECF\u5B58\u5728\uFF0C\u800C\u8FD9\u4EFD patch \u628A\u5B83\u5F53\u6210\u65B0\u5EFA\uFF08*** Add File:\uFF09\u3002
\u6539\u5DF2\u6709\u6587\u4EF6\u8BF7\u7528 *** Update File:\uFF1B\u8981\u6574\u4EFD\u8986\u76D6\u8BF7\u7528 write \u5DE5\u5177\uFF1B\u8981\u5220\u6389\u91CD\u5EFA\u8BF7\u5148\u7528 bash rm \u5220\u6389\u5B83\u3002`
      );
    }
    const content2 = ensureTrailingNewline(op.contents);
    const diffs2 = [{ path: target.displayPath, oldText: null, newText: content2 }];
    return {
      file: {
        path: target.displayPath,
        operation: "create",
        added: countLogicalLines(content2),
        removed: 0
      },
      diffs: diffs2,
      write: { target, content: content2, operation: "create" }
    };
  }
  const source = await resolveTarget(ctx, op.path, cwd, exec);
  const state = await readFileState(ctx, source, exec);
  if (state.info === void 0) {
    throw new Error(
      `patch \u65E0\u6CD5\u5E94\u7528\uFF1A${source.displayPath} \u4E0D\u5B58\u5728\uFF0C\u800C\u8FD9\u4EFD patch \u628A\u5B83\u5F53\u6210\u5DF2\u6709\u6587\u4EF6\uFF08*** Update File:\uFF09\u3002
\u65B0\u5EFA\u8BF7\u7528 *** Add File:\uFF1B\u5982\u679C\u5B83\u672C\u8BE5\u5B58\u5728\uFF0C\u68C0\u67E5\u4F1A\u8BDD\u5DE5\u4F5C\u76EE\u5F55\u662F\u4E0D\u662F\u4F60\u4EE5\u4E3A\u7684\u90A3\u4E2A\uFF0C\u6216\u5148 read \u8FD9\u4E2A\u8DEF\u5F84\u3002`
    );
  }
  if (state.info.type !== "file") {
    throw new Error(`patch \u65E0\u6CD5\u5E94\u7528\uFF1A${source.displayPath} \u4E0D\u662F\u666E\u901A\u6587\u4EF6\u3002`);
  }
  const ending = detectLineEnding(state.raw);
  const current = normalizeLineEndings(state.raw);
  const applied = applyChunksToText(op.chunks, current, source.displayPath);
  const needsBom = state.bom && state.raw.charCodeAt(0) !== 65279;
  const content = (needsBom ? "\uFEFF" : "") + restoreLineEndings(applied.content, ending);
  const diffs = op.chunks.length === 0 ? [{ path: source.displayPath, oldText: current, newText: applied.content, startLine: 1 }] : applied.chunks.map((chunk) => ({
    path: source.displayPath,
    oldText: chunk.oldText,
    newText: chunk.newText,
    startLine: chunk.startLine
  }));
  let added = 0;
  let removed = 0;
  for (const chunk of op.chunks) {
    added += chunk.added;
    removed += chunk.removed;
  }
  return {
    file: { path: source.displayPath, operation: "update", added, removed },
    diffs,
    write: { target: source, content, operation: "update" }
  };
}
function registerPatchTool(ctx) {
  const escalation = createEscalation(ctx);
  return ctx.tools.register({
    name: "patch",
    description: 'Edit files with one structured patch: `patch` applies a whole `*** Begin Patch` envelope in a single call, so it can touch many files and many scattered places without rewriting any file \u2014 far fewer tokens than write, and every change shows up as a reviewable diff. Format:\n*** Begin Patch\n[ one or more file sections ]\n*** End Patch\nEach section starts with a header that names the action:\n*** Add File: <path> \u2014 create a new file; every following line is a + line (its initial contents).\n*** Update File: <path> \u2014 change an existing file in place.\nExample:\n*** Begin Patch\n*** Add File: hello.txt\n+Hello world\n*** Update File: src/app.py\n@@ def greet():\n-print("Hi")\n+print("Hello, world!")\n*** End Patch\nInside an update section, each `@@` line starts a chunk. Text after `@@` is an ANCHOR, **not a label**: it must be text that really exists in the file \u2014 normally a line just ABOVE the change (writing the chunk\'s own first line there works too). A bare `@@` with no text means "search anywhere" and is the safest choice when you are not sure. In a chunk a leading space marks an unchanged context line, `-` a removed line and `+` an added line. **Line numbers are never written**: a chunk is located by its own content, matched in five passes (exact, ignoring trailing whitespace, ignoring leading/trailing whitespace, Unicode punctuation normalized to ASCII, then \u2014 only when the result is unique \u2014 ignoring all whitespace). `*** End of File` pins a chunk to the end of the file. A chunk with only + lines (no context, no removals) is appended at the end of the file.\nWhen a chunk does not match, the error names the closest real line in the file with its line number and what differs (indentation, inner whitespace, punctuation, or the first differing character). Copy that line verbatim into the - line and retry instead of guessing again \u2014 and read the file first whenever you are writing context from memory rather than from a read.\nRules that matter: include a header for every section; prefix every added line with +; paths are relative to the session working directory unless absolute. `*** Add File:` on a path that already exists is refused (a typo must never silently overwrite a file) \u2014 use `*** Update File:` for an existing file or `write` to replace it wholesale. This tool only creates and changes content: *** Delete File: and *** Move to: are recognized and then REFUSED (deleting and renaming are irreversible and belong to `bash` with rm / mv, which is sandboxed the same way). Every file is read and every chunk applied in memory before anything is written: if any chunk fails to match, or any target is outside the writable roots of the current policy, nothing is written at all. The write goes through the session file policy (sandbox): a denial reports the mode in a [sandbox: ...] marker, and when this composition advertises it, the sanctioned retry carries sandbox_permissions + justification for a one-shot user-approved escalation.',
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        patch: {
          type: "string",
          description: 'The full patch text, wrapped in the envelope. Example: "*** Begin Patch\\n*** Update File: src/a.ts\\n@@\\n-const a = 1;\\n+const a = 11;\\n*** End Patch". Multiple Add / Update sections and multiple @@ chunks per update are allowed; a section header is mandatory, every added line starts with +, and Delete / Move sections are refused.'
        },
        // 与官方 write / edit 一样：只在真的会围栏的组合里广告这两个字段。
        ...escalation.modes.length > 0 ? escalationSchemaFields(escalation.modes) : {}
      },
      required: ["patch"]
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          files: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                path: { type: "string" },
                operation: { type: "string", enum: ["create", "update"] },
                added: { type: "integer" },
                removed: { type: "integer" }
              },
              required: ["path", "operation", "added", "removed"]
            }
          },
          diffs: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                path: { type: "string" },
                oldText: { oneOf: [{ type: "string" }, { type: "null" }] },
                newText: { type: "string" },
                startLine: { type: "integer" }
              },
              required: ["path", "oldText", "newText"]
            }
          },
          added: { type: "integer" },
          removed: { type: "integer" }
        },
        required: ["files", "diffs", "added", "removed"]
      },
      render: (_args, value) => [{ type: "text", text: formatPatchOutput(value) }],
      /**
       * 差异卡片就读这里：每条 diff 是一个片段，`startLine` 是它在**新文件里的真实行号**——
       * 由落盘阶段算出来（片段自己的落点 + 前面片段的行数漂移），不是模型估的。
       */
      presentationMeta: (_args, value) => ({ diffs: value.diffs })
    },
    /** 预览（流式 / 结算前）：宽容解析 args 里的补丁文本，等真正应用后再由 meta.diffs 接管。 */
    presentCall(args) {
      const ops = safeParse(args?.patch);
      return {
        card: "diff",
        title: `Patch ${ops.length} file(s)`,
        diffs: previewDiffsOf(ops),
        locations: ops.map((op) => ({ path: op.path }))
      };
    },
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const text = typeof args?.patch === "string" ? args.patch : "";
      if (text.trim() === "")
        throw new Error("patch \u5FC5\u987B\u662F\u975E\u7A7A\u7684\u8865\u4E01\u6587\u672C\uFF08*** Begin Patch \u2026 *** End Patch\uFF09\u3002");
      const ops = parseApplyPatch(text);
      if (ops.length === 0) {
        throw new Error(
          "patch \u91CC\u6CA1\u6709\u4EFB\u4F55\u6587\u4EF6\u6BB5\u843D\uFF1A\u9700\u8981 *** Add File: \u6216 *** Update File: \u6BB5\u5934\uFF0C\u5E76\u5305\u5728 *** Begin Patch \u4E0E *** End Patch \u4E4B\u95F4\u3002"
        );
      }
      const unsupported = unsupportedOps(ops);
      if (unsupported.length > 0) {
        throw new Error(
          "patch \u53EA\u505A\u300C\u65B0\u5EFA / \u4FEE\u6539\u300D\uFF0C\u4E0D\u6267\u884C\u5220\u9664\u4E0E\u6539\u540D\uFF0C\u8FD9\u4EFD\u8865\u4E01\u91CC\u6709\uFF1A\n  " + unsupported.join("\n  ") + "\n\u5220\u9664\u8BF7\u7528 bash \u7684 `rm`\uFF08git \u8DDF\u8E2A\u7684\u7528 `git rm`\uFF09\u3001\u6539\u540D\u8BF7\u7528 `mv`\uFF08\u8DDF\u8E2A\u7684\u7528 `git mv`\uFF09\uFF1B\u4E24\u8005\u4E0E patch \u5403\u540C\u4E00\u4EFD\u6C99\u7BB1\u7B56\u7565\uFF0C\u8D8A\u754C\u4E00\u6837\u4F1A\u88AB\u62D2\u3002\u628A\u8FD9\u51E0\u6BB5\u4ECE\u8865\u4E01\u91CC\u53BB\u6389\u3001\u53EA\u7559\u589E\u6539\uFF0Cpatch \u5C31\u80FD\u7EE7\u7EED\u3002"
        );
      }
      const supported = ops;
      const sandboxPolicy = await escalation.resolvePolicy("patch", args, exec);
      const cwd = sessionCwdOf(exec);
      const plans = [];
      for (const op of supported) plans.push(await planOperation(ctx, op, cwd, exec));
      await assertBatchWritable(
        sandboxPolicy,
        plans.map((plan) => plan.write.target.displayPath)
      );
      const done = [];
      const diffs = [];
      for (const plan of plans) {
        try {
          const intent = await ctx.waterfall("fs/write-intent", plan.write.target, exec, () => void 0);
          const outcome = await ctx.fs.writeText(
            plan.write.target,
            plan.write.content,
            intent,
            exec?.signal,
            sandboxPolicy
          );
          ctx.emit("fs/observed", plan.write.target, { kind: "present", version: outcome.version }, exec);
        } catch (error) {
          if (error?.code === "FS_SANDBOX_DENIED") {
            console.warn(
              "[dshp-file-change-viewer] patch \u88AB\u6587\u4EF6\u7B56\u7565\u62D2\u7EDD\uFF1Apath=" + plan.write.target.displayPath + " mode=" + String(sandboxPolicy?.mode ?? "(\u9ED8\u8BA4)") + " workspaceRoot=" + String(sandboxPolicy?.workspaceRoot ?? "(\u9ED8\u8BA4)") + "\uFF08workspace-write \u7684\u53EF\u5199\u6839 = \u4F1A\u8BDD\u5DE5\u4F5C\u533A + /tmp + \u5E73\u53F0\u4E34\u65F6\u76EE\u5F55\uFF1B\u521B\u5EFA\u3001\u4FEE\u6539\u4E0E\u5220\u9664\u540C\u4E00\u628A\u5C3A\u5B50\uFF09"
            );
          }
          const already = done.map((file) => file.path).join(", ");
          const detail = already === "" ? "" : ` \u5DF2\u7ECF\u6210\u529F\u843D\u76D8\u7684\u662F\uFF1A${already}\uFF08\u5B83\u4EEC\u4E0D\u4F1A\u56DE\u6EDA\uFF1B\u8BF7 read \u8FD9\u4E9B\u6587\u4EF6\u540E\u7EE7\u7EED\u5904\u7406\u5269\u4E0B\u7684\uFF09\u3002`;
          throw remediate(escalation.mapError(error, sandboxPolicy), plan.write.target.displayPath, detail);
        }
        done.push(plan.file);
        diffs.push(...plan.diffs);
      }
      let added = 0;
      let removed = 0;
      for (const file of done) {
        added += file.added;
        removed += file.removed;
      }
      return { files: done, diffs, added, removed };
    }
  });
}

// src/host/http.ts
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

// src/host/routes.ts
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function snapshotOf(config) {
  return {
    view: config.view,
    sectionsOpen: config.sectionsOpen,
    patchTool: config.patchTool,
    contextLines: config.contextLines
  };
}
var VIEWS = ["highlight", "diff"];
var CONTEXT_LINES = [0, 3, 5, 8];
function registerRoutes(ctx, getConfig, updateConfig) {
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/ext/dshp-file-change-viewer/state",
      handler: (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        return json(res, 200, { ok: true, config: snapshotOf(getConfig()) });
      }
    }),
    "dshp-file-change-viewer: state route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/ext/dshp-file-change-viewer/config",
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        if (req.method !== "POST") {
          return json(res, 405, { ok: false, error: "method not allowed" });
        }
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        const raw = isRecord(body) ? body : {};
        try {
          const patch = {};
          let hasPatch = false;
          if (Object.hasOwn(raw, "view")) {
            const view = raw["view"];
            if (typeof view !== "string" || !VIEWS.includes(view)) {
              throw new Error("view \u975E\u6CD5\uFF0C\u5E94\u4E3A highlight \u6216 diff");
            }
            patch["view"] = view;
            hasPatch = true;
          }
          if (Object.hasOwn(raw, "sectionsOpen")) {
            const sectionsOpen = raw["sectionsOpen"];
            if (typeof sectionsOpen !== "boolean") throw new Error("sectionsOpen \u975E\u6CD5\uFF0C\u5E94\u4E3A\u5E03\u5C14\u503C");
            patch["sectionsOpen"] = sectionsOpen;
            hasPatch = true;
          }
          if (Object.hasOwn(raw, "patchTool")) {
            const patchTool = raw["patchTool"];
            if (typeof patchTool !== "boolean") throw new Error("patchTool \u975E\u6CD5\uFF0C\u5E94\u4E3A\u5E03\u5C14\u503C");
            patch["patchTool"] = patchTool;
            hasPatch = true;
          }
          if (Object.hasOwn(raw, "contextLines")) {
            const contextLines = raw["contextLines"];
            if (typeof contextLines !== "number" || !CONTEXT_LINES.includes(contextLines)) {
              throw new Error("contextLines \u975E\u6CD5\uFF0C\u5E94\u4E3A 0 / 3 / 5 / 8");
            }
            patch["contextLines"] = contextLines;
            hasPatch = true;
          }
          if (hasPatch) await updateConfig(patch);
          return json(res, 200, { ok: true, config: snapshotOf(getConfig()) });
        } catch (error) {
          return json(res, 200, { ok: false, error: String(error?.message ?? error) });
        }
      }
    }),
    "dshp-file-change-viewer: config route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/ext/dshp-file-change-viewer/locate",
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        if (req.method !== "POST") {
          return json(res, 405, { ok: false, error: "method not allowed" });
        }
        let body = {};
        try {
          body = JSON.parse(await readBody(req) || "{}");
        } catch {
          return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
        }
        const raw = isRecord(body) ? body : {};
        const cwd = typeof raw["cwd"] === "string" && raw["cwd"] !== "" ? raw["cwd"] : void 0;
        const items = Array.isArray(raw["items"]) ? raw["items"].slice(0, MAX_LOCATE_ITEMS) : [];
        return json(res, 200, { ok: true, results: await locateAll(ctx, items, cwd) });
      }
    }),
    "dshp-file-change-viewer: locate route"
  );
}
var MAX_LOCATE_ITEMS = 20;
var MAX_LOCATE_BYTES = 4 * 1024 * 1024;
var MAX_CONTEXT_LINES = 8;
var NOT_LOCATED = { line: null, before: [], after: [] };
function splitLines(text) {
  if (text === "") return [];
  const body = text.endsWith("\n") ? text.slice(0, -1) : text;
  return body.split("\n");
}
async function readLines(fs, cache, path, cwd) {
  const hit = cache.get(path);
  if (hit !== void 0) return hit;
  let lines = null;
  try {
    if (fs !== void 0 && fs !== null) {
      const target = await fs.resolve(path, cwd === void 0 ? {} : { cwd });
      const info = await fs.stat(target);
      if (info !== void 0 && info.type === "file") {
        if (typeof info.size !== "number" || info.size <= MAX_LOCATE_BYTES) {
          lines = splitLines(String(await fs.readText(target)).replace(/\r\n/g, "\n"));
        }
      }
    }
  } catch {
    lines = null;
  }
  cache.set(path, lines);
  return lines;
}
function findBlock(lines, needleText) {
  const needle = splitLines(needleText);
  if (needle.length === 0) return -1;
  for (let at = 0; at + needle.length <= lines.length; at += 1) {
    let hit = true;
    for (let offset = 0; offset < needle.length; offset += 1) {
      if (lines[at + offset] !== needle[offset]) {
        hit = false;
        break;
      }
    }
    if (hit) return at;
  }
  return -1;
}
async function locateOne(fs, cache, item, cwd) {
  if (!isRecord(item)) return NOT_LOCATED;
  const path = item["path"];
  const newText = item["newText"];
  const oldText = item["oldText"];
  if (typeof path !== "string" || path === "" || typeof newText !== "string") return NOT_LOCATED;
  const lines = await readLines(fs, cache, path, cwd);
  if (lines === null) return NOT_LOCATED;
  for (const needleText of typeof oldText === "string" && oldText !== "" ? [newText, oldText] : [newText]) {
    if (needleText === "") continue;
    const at = findBlock(lines, needleText);
    if (at < 0) continue;
    const end = at + splitLines(needleText).length;
    return {
      line: at + 1,
      before: lines.slice(Math.max(0, at - MAX_CONTEXT_LINES), at),
      after: lines.slice(end, end + MAX_CONTEXT_LINES)
    };
  }
  return NOT_LOCATED;
}
async function locateAll(ctx, items, cwd) {
  const fs = typeof ctx.get === "function" ? ctx.get("fs") : void 0;
  const cache = /* @__PURE__ */ new Map();
  const results = [];
  for (const item of items) results.push(await locateOne(fs, cache, item, cwd));
  return results;
}

// src/host/index.ts
var name = "@dshp/file-change-viewer";
var inject = ["webServer"];
var Config = ConfigSchema;
function apply(ctx, config) {
  let toolsScope;
  let disposePatchTool;
  try {
    ctx.inject(["settings"], (sctx) => {
      try {
        sctx.effect(
          () => sctx.settings.configure({ auto: false }, ctx.fiber),
          "dshp-file-change-viewer: settings-page"
        );
      } catch (error) {
        console.error("[dshp-file-change-viewer] \u6CE8\u518C settings \u9875\u9762\u7B56\u7565\u5931\u8D25\uFF0C\u504F\u597D\u5C06\u56DE\u9ED8\u8BA4\u503C\uFF1A", error);
      }
    });
  } catch (error) {
    console.error("[dshp-file-change-viewer] settings \u670D\u52A1\u6CE8\u5165\u5931\u8D25\uFF0C\u504F\u597D\u5C06\u56DE\u9ED8\u8BA4\u503C\uFF1A", error);
  }
  function getConfig() {
    return {
      view: config.view.get(),
      sectionsOpen: config.sectionsOpen.get(),
      contextLines: config.contextLines.get(),
      patchTool: config.patchTool.get()
    };
  }
  async function updateConfig(patch) {
    const settings = ctx.get("settings");
    if (!settings) {
      throw new Error(
        "settings \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u6301\u4E45\u5316\u5230 profile \u6761\u76EE config\uFF08\u8BF7\u91CD\u542F DSH \u786E\u8BA4\u8BBE\u7F6E\u670D\u52A1\u5DF2\u6302\u8F7D\uFF09"
      );
    }
    await settings.update(NS, patch);
  }
  try {
    registerRoutes(ctx, getConfig, updateConfig);
  } catch (error) {
    console.error("[dshp-file-change-viewer] \u6CE8\u518C\u8BBE\u7F6E\u8DEF\u7531\u5931\u8D25\uFF0C\u8BBE\u7F6E\u8282\u5C06\u53EA\u80FD\u8BFB\u9ED8\u8BA4\u503C\uFF1A", error);
  }
  function patchToolWanted() {
    return config.patchTool.get() === true;
  }
  function syncPatchTool() {
    const scope = toolsScope;
    if (scope === void 0) return;
    const wanted = patchToolWanted();
    if (wanted && disposePatchTool === void 0) {
      try {
        const off = scope.effect(() => registerPatchTool(scope), "dshp-file-change-viewer: patch tool");
        disposePatchTool = () => {
          try {
            off?.();
          } catch (error) {
            console.error("[dshp-file-change-viewer] \u53CD\u6CE8\u518C patch \u5DE5\u5177\u5931\u8D25\uFF1A", error);
          }
        };
      } catch (error) {
        console.error("[dshp-file-change-viewer] \u6CE8\u518C patch \u5DE5\u5177\u5931\u8D25\uFF1A", error);
      }
      return;
    }
    if (!wanted && disposePatchTool !== void 0) {
      disposePatchTool();
      disposePatchTool = void 0;
    }
  }
  try {
    ctx.inject(["tools", "fs"], (sctx) => {
      toolsScope = sctx;
      syncPatchTool();
    });
  } catch (error) {
    console.error("[dshp-file-change-viewer] \u6CE8\u5165 tools / fs \u5931\u8D25\uFF0Cpatch \u5DE5\u5177\u4E0D\u53EF\u7528\uFF1A", error);
  }
  ctx.effect(
    () => ctx.on("loader/volatile-update", () => {
      try {
        syncPatchTool();
      } catch {
      }
    }),
    "dshp-file-change-viewer: patch tool switch on volatile update"
  );
  const snapshot2 = getConfig();
  console.info(
    "[dshp-file-change-viewer] Host \u534A\u5DF2\u5C31\u7EEA\uFF1A\u6E32\u67D3\u903B\u8F91\u5728 Client \u534A\uFF1B\u663E\u793A\u504F\u597D\u547D\u540D\u7A7A\u95F4 " + NS + "\uFF08view=" + snapshot2.view + ", sectionsOpen=" + String(snapshot2.sectionsOpen) + ", patchTool=" + String(snapshot2.patchTool) + "\uFF09\u3002"
  );
}

export { Config, ConfigSchema, NS, apply, applyChunksToText, assertBatchWritable, assertWritable, countLogicalLines, detectLineEnding, inject, name, normalizeLineEndings, parseApplyPatch, previewDiffsOf, restoreLineEndings, writableRootsUnder };
