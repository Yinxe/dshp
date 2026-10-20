// ../../node_modules/.pnpm/@deepseek-ai+cosmokit@1.8.6/node_modules/@deepseek-ai/cosmokit/lib/index.js
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
var NS = "dshp-search-provider";
var HUB_ID = "dshp-search";
var MAX_RESULTS = 10;
var DEFAULT_MAX_RESULTS = 5;
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function clampInt(value, min, max) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < min || number > max) return void 0;
  return number;
}
function defaultProviderId(modules) {
  return modules[0]?.id ?? "tavily";
}
function buildConfigSchema(modules) {
  const ids = modules.map((module) => module.id);
  const shape = {
    provider: Schema.union(ids.map((id) => Schema.const(id))).default(defaultProviderId(modules)).volatile(),
    maxResults: Schema.number().step(1).min(1).max(MAX_RESULTS).default(DEFAULT_MAX_RESULTS).volatile()
  };
  for (const module of modules) {
    if (module.fields.length === 0 || module.configSchema === void 0) continue;
    shape[module.id] = module.configSchema.volatile();
  }
  return Schema.object(shape);
}
function isKnownProvider(id, modules) {
  return typeof id === "string" && modules.some((module) => module.id === id);
}
function knownKeys(modules) {
  const keys = /* @__PURE__ */ new Set(["provider", "maxResults"]);
  for (const module of modules) {
    if (module.fields.length > 0) keys.add(module.id);
  }
  return keys;
}
function sanitizeRoutePatch(raw, modules) {
  if (!isRecord(raw)) throw new Error("\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON \u5BF9\u8C61");
  const allowed = knownKeys(modules);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) throw new Error(`\u672A\u77E5\u914D\u7F6E\u5B57\u6BB5\uFF1A${key}`);
  }
  const out = {};
  if (Object.hasOwn(raw, "provider")) {
    if (!isKnownProvider(raw["provider"], modules)) {
      throw new Error(`provider \u975E\u6CD5\uFF0C\u5E94\u4E3A\uFF1A${modules.map((module) => module.id).join(" / ")}`);
    }
    out["provider"] = raw["provider"];
  }
  if (Object.hasOwn(raw, "maxResults")) {
    const number = clampInt(raw["maxResults"], 1, MAX_RESULTS);
    if (number === void 0) throw new Error(`maxResults \u975E\u6CD5\uFF0C\u5E94\u4E3A 1-${MAX_RESULTS} \u7684\u6574\u6570`);
    out["maxResults"] = number;
  }
  for (const module of modules) {
    if (module.fields.length === 0 || !Object.hasOwn(raw, module.id)) continue;
    const block = module.sanitizePatch(raw[module.id]);
    if (block !== null) out[module.id] = block;
  }
  return out;
}
function snapshotConfig(config, modules) {
  const out = {
    provider: config.provider,
    maxResults: typeof config.maxResults === "number" ? config.maxResults : DEFAULT_MAX_RESULTS
  };
  for (const module of modules) {
    out[module.id] = module.snapshot({
      ...module.defaultConfig,
      ...readBlock(config, module.id)
    });
  }
  return out;
}
function readBlock(config, providerId) {
  const raw = config[providerId];
  return isRecord(raw) ? raw : {};
}

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
function methodIs(req, method) {
  return req.method === method;
}

// src/host/providers/base.ts
var SNIPPET_LIMIT = 1200;
function isRecord2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function clampInt2(value, min, max) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number < min || number > max) return void 0;
  return number;
}
function strOrEmpty(value) {
  return typeof value === "string" ? value : "";
}
function extractApiDetail(parsed, fallback) {
  if (isRecord2(parsed)) {
    const detail = parsed["detail"];
    if (isRecord2(detail) && typeof detail["error"] === "string" && detail["error"].length > 0) {
      return detail["error"];
    }
    for (const key of ["error", "message"]) {
      const value = parsed[key];
      if (typeof value === "string" && value.length > 0) return value;
    }
  }
  return fallback;
}
async function postJson(label, url, body, headers, signal) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", ...headers },
      body: JSON.stringify(body),
      ...signal === void 0 ? {} : { signal }
    });
  } catch (error) {
    if (signal?.aborted) {
      const aborted = new Error(`${label} \u641C\u7D22\u5DF2\u53D6\u6D88`);
      aborted.name = "AbortError";
      throw aborted;
    }
    throw new Error(`${label} \u8BF7\u6C42\u5931\u8D25\uFF1A${String(error?.message ?? error)}`, {
      cause: error
    });
  }
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    const detail = extractApiDetail(parsed, "");
    const suffix = detail.length > 0 ? `\uFF1A${detail}` : "";
    throw new Error(`${label} \u8FD4\u56DE HTTP ${response.status}${suffix}`);
  }
  return parsed;
}
function sourceOf(url, title, snippet, publishedAt) {
  if (typeof url !== "string" || url.length === 0) return null;
  const source = { url };
  if (typeof title === "string" && title.length > 0) source.title = title;
  if (typeof snippet === "string" && snippet.length > 0) {
    source.snippet = snippet.slice(0, SNIPPET_LIMIT);
  }
  if (typeof publishedAt === "string" && publishedAt.length > 0) source.publishedAt = publishedAt;
  return source;
}
function resultOf(sources, content) {
  const base = { sources, truncated: false };
  return typeof content === "string" && content.length > 0 ? { ...base, content } : base;
}
function maxResultsOf(requested, configMaxResults) {
  const fallback = clampInt2(configMaxResults, 1, 10) ?? 5;
  return clampInt2(requested, 1, 10) ?? fallback;
}
function missingKey(label, ref) {
  return new Error(`${label} \u7F3A\u5C11 API Key\u300C${ref}\u300D\uFF1A\u8BF7\u6253\u5F00 \u8BBE\u7F6E \u2192 AI \u641C\u7D22 \u914D\u7F6E\u5BC6\u94A5\u540E\u91CD\u8BD5\u3002`);
}

// src/host/providers/exa.ts
var ID = "exa";
var ENDPOINT = "https://api.exa.ai/search";
var CRED_REF = "EXA_API_KEY";
var FIELDS = [
  {
    key: "searchType",
    label: "\u68C0\u7D22\u6A21\u5F0F",
    kind: "select",
    options: [
      { value: "auto", label: "auto\uFF08\u81EA\u52A8\u9009\u62E9\uFF09" },
      { value: "fast", label: "fast\uFF08\u66F4\u5FEB\u66F4\u7701\uFF09" },
      { value: "deep", label: "deep\uFF08\u66F4\u6DF1\uFF0C\u8017\u65F6\u66F4\u957F\uFF09" }
    ],
    hint: "auto \u7531 Exa \u6309\u67E5\u8BE2\u9009\u62E9\uFF1Bfast \u6210\u672C\u66F4\u4F4E\uFF0Cdeep \u9002\u5408\u590D\u6742\u95EE\u9898\u3002"
  }
];
var CONFIG_SCHEMA = Schema.object({
  searchType: Schema.union([Schema.const("auto"), Schema.const("fast"), Schema.const("deep")]).default("auto")
});
function createExaModule() {
  async function search(deps, request, signal) {
    const key = await deps.resolveKey(CRED_REF);
    if (key === void 0) throw missingKey("Exa", CRED_REF);
    const config = deps.providerConfig(ID);
    const searchType = config["searchType"] === "fast" || config["searchType"] === "deep" ? config["searchType"] : "auto";
    const maxResults = maxResultsOf(request.maxResults, deps.getConfig().maxResults);
    const parsed = await postJson(
      "Exa",
      ENDPOINT,
      {
        query: request.query,
        numResults: maxResults,
        type: searchType,
        contents: { text: { maxCharacters: 1200 } }
      },
      { "x-api-key": key },
      signal
    );
    if (!isRecord2(parsed) || !Array.isArray(parsed["results"])) {
      throw new Error("Exa \u8FD4\u56DE\u4E86\u672A\u77E5\u54CD\u5E94");
    }
    const sources = [];
    for (const item of parsed["results"]) {
      if (sources.length >= maxResults) break;
      if (!isRecord2(item)) continue;
      const source = sourceOf(
        item["url"],
        item["title"],
        item["text"] ?? item["summary"] ?? item["highlights"],
        item["publishedDate"]
      );
      if (source !== null) sources.push(source);
    }
    return resultOf(sources);
  }
  return {
    id: ID,
    label: "Exa",
    title: "Exa AI \u641C\u7D22",
    credentialRef: CRED_REF,
    credentialRequired: true,
    homepage: "https://exa.ai",
    description: "AI \u539F\u751F\u8BED\u4E49\u641C\u7D22\uFF0C\u9002\u5408\u627E\u9AD8\u8D28\u91CF\u8D44\u6599\u3001\u76F8\u4F3C\u9875\u9762\u4E0E\u6280\u672F\u5185\u5BB9\u3002",
    freeNote: "\u65B0\u8D26\u53F7\u7EA6 $10 \u514D\u8D39\u989D\u5EA6\uFF1Bfast \u6A21\u5F0F\u66F4\u7701\uFF0Cauto \u81EA\u52A8\u9009\u62E9\u3002",
    fields: FIELDS,
    defaultConfig: { searchType: "auto" },
    configSchema: CONFIG_SCHEMA,
    sanitizePatch(raw) {
      if (!isRecord2(raw)) return null;
      const out = {};
      if (Object.hasOwn(raw, "searchType")) {
        const value = raw["searchType"];
        if (value !== "auto" && value !== "fast" && value !== "deep") {
          throw new Error("searchType \u975E\u6CD5\uFF0C\u5E94\u4E3A 'auto' / 'fast' / 'deep'");
        }
        out["searchType"] = value;
      }
      return out;
    },
    snapshot(config) {
      const value = config["searchType"];
      return {
        searchType: value === "fast" || value === "deep" ? value : "auto"
      };
    },
    search
  };
}

// src/host/providers/firecrawl.ts
var ID2 = "firecrawl";
var ENDPOINT2 = "https://api.firecrawl.dev/v2/search";
var CRED_REF2 = "FIRECRAWL_API_KEY";
function itemsOf(parsed) {
  if (!isRecord2(parsed)) return [];
  const data = parsed["data"];
  if (Array.isArray(data)) return data;
  if (isRecord2(data) && Array.isArray(data["web"])) return data["web"];
  if (Array.isArray(parsed["web"])) return parsed["web"];
  return [];
}
function createFirecrawlModule() {
  async function search(deps, request, signal) {
    const key = await deps.resolveKey(CRED_REF2);
    const maxResults = maxResultsOf(request.maxResults, deps.getConfig().maxResults);
    const headers = key === void 0 ? {} : { authorization: `Bearer ${key}` };
    let parsed;
    try {
      parsed = await postJson(
        "Firecrawl",
        ENDPOINT2,
        { query: request.query, limit: maxResults },
        headers,
        signal
      );
    } catch (error) {
      const message = String(error?.message ?? error);
      if (key === void 0 && /HTTP (401|402|429)/.test(message)) {
        throw new Error(
          `${message}\uFF08Firecrawl \u65E0 Key \u65F6\u6709\u9650\u6D41\uFF1B\u5728 \u8BBE\u7F6E \u2192 AI \u641C\u7D22 \u914D\u7F6E FIRECRAWL_API_KEY \u53EF\u63D0\u9AD8\u989D\u5EA6\uFF09`,
          { cause: error }
        );
      }
      throw error;
    }
    const sources = [];
    for (const item of itemsOf(parsed)) {
      if (sources.length >= maxResults) break;
      if (!isRecord2(item)) continue;
      const snippet = strOrEmpty(item["description"]) || strOrEmpty(item["markdown"]) || strOrEmpty(item["content"]);
      const source = sourceOf(
        item["url"],
        item["title"],
        snippet,
        item["publishedTime"] ?? item["publishedAt"] ?? item["published_at"]
      );
      if (source !== null) sources.push(source);
    }
    return resultOf(sources);
  }
  return {
    id: ID2,
    label: "Firecrawl",
    title: "Firecrawl \u641C\u7D22",
    credentialRef: CRED_REF2,
    credentialRequired: false,
    homepage: "https://firecrawl.dev",
    description: "AI \u53CB\u597D\u7684\u7F51\u9875\u641C\u7D22\uFF0C\u8FD4\u56DE\u6807\u9898\u3001\u94FE\u63A5\u4E0E\u9875\u9762\u6458\u8981\uFF1B\u4E0D\u586B Key \u4E5F\u80FD\u7528\u3002",
    freeNote: "\u65E0\u9700 Key \u5373\u53EF\u4F7F\u7528\uFF08\u6709\u9650\u6D41\uFF09\uFF1B\u914D\u7F6E Key \u540E\u989D\u5EA6\u66F4\u9AD8\u3002",
    fields: [],
    defaultConfig: {},
    sanitizePatch() {
      return null;
    },
    snapshot() {
      return {};
    },
    search
  };
}

// src/host/providers/tavily.ts
var ID3 = "tavily";
var ENDPOINT3 = "https://api.tavily.com/search";
var CRED_REF3 = "TAVILY_API_KEY";
var FIELDS2 = [
  {
    key: "searchDepth",
    label: "\u641C\u7D22\u6DF1\u5EA6",
    kind: "select",
    options: [
      { value: "basic", label: "basic\uFF081 credit/\u6B21 \xB7 \u5FEB\uFF09" },
      { value: "advanced", label: "advanced\uFF082 credits/\u6B21 \xB7 \u8986\u76D6\u66F4\u5168\uFF09" }
    ],
    hint: "basic \u66F4\u5FEB\u66F4\u7701\uFF1Badvanced \u4F1A\u6293\u53D6\u66F4\u591A\u6765\u6E90\u3002"
  }
];
var CONFIG_SCHEMA2 = Schema.object({
  searchDepth: Schema.union([Schema.const("basic"), Schema.const("advanced")]).default("basic")
});
function createTavilyModule() {
  async function search(deps, request, signal) {
    const key = await deps.resolveKey(CRED_REF3);
    if (key === void 0) throw missingKey("Tavily", CRED_REF3);
    const config = deps.providerConfig(ID3);
    const maxResults = maxResultsOf(request.maxResults, deps.getConfig().maxResults);
    const searchDepth = config["searchDepth"] === "advanced" ? "advanced" : "basic";
    const parsed = await postJson(
      "Tavily",
      ENDPOINT3,
      {
        api_key: key,
        query: request.query,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: false
      },
      {},
      signal
    );
    if (!isRecord2(parsed) || !Array.isArray(parsed["results"])) {
      throw new Error("Tavily \u8FD4\u56DE\u4E86\u672A\u77E5\u54CD\u5E94");
    }
    const sources = [];
    for (const item of parsed["results"]) {
      if (sources.length >= maxResults) break;
      if (!isRecord2(item)) continue;
      const source = sourceOf(item["url"], item["title"], item["content"], item["published_date"]);
      if (source !== null) sources.push(source);
    }
    const answer = strOrEmpty(parsed["answer"]);
    return resultOf(sources, answer);
  }
  return {
    id: ID3,
    label: "Tavily",
    title: "Tavily AI \u641C\u7D22",
    credentialRef: CRED_REF3,
    credentialRequired: true,
    homepage: "https://tavily.com",
    description: "AI \u539F\u751F\u641C\u7D22 API\uFF0C\u6309 credits \u8BA1\u8D39\uFF1B\u9002\u5408\u901A\u7528\u95EE\u7B54\u4E0E\u8D44\u6599\u68C0\u7D22\u3002",
    freeNote: "\u514D\u8D39\u989D\u5EA6 1,000 credits/\u6708\uFF1Bbasic 1 credit/\u6B21\uFF0Cadvanced 2 credits/\u6B21\u3002",
    fields: FIELDS2,
    defaultConfig: { searchDepth: "basic" },
    configSchema: CONFIG_SCHEMA2,
    sanitizePatch(raw) {
      if (!isRecord2(raw)) return null;
      const out = {};
      if (Object.hasOwn(raw, "searchDepth")) {
        if (raw["searchDepth"] !== "basic" && raw["searchDepth"] !== "advanced") {
          throw new Error("searchDepth \u975E\u6CD5\uFF0C\u5E94\u4E3A 'basic' \u6216 'advanced'");
        }
        out["searchDepth"] = raw["searchDepth"];
      }
      return out;
    },
    snapshot(config) {
      return { searchDepth: config["searchDepth"] === "advanced" ? "advanced" : "basic" };
    },
    search
  };
}

// src/host/providers/index.ts
function createProviderModules() {
  const modules = [createTavilyModule(), createExaModule(), createFirecrawlModule()];
  const seen = /* @__PURE__ */ new Set();
  for (const module of modules) {
    if (seen.has(module.id)) throw new Error(`[dshp-search-provider] \u4F9B\u5E94\u5546 id \u91CD\u590D\uFF1A${module.id}`);
    seen.add(module.id);
  }
  return modules;
}

// src/host/index.ts
var name = "@dshp/search-provider";
var inject = ["web", "webServer"];
var ConfigSchema = buildConfigSchema(createProviderModules());
var Config = ConfigSchema;
var MAX_BODY = 64 * 1024;
var ROUTE_PREFIX = `/ext/${NS}`;
function isRecord3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function warn(message, error) {
  try {
    const reason = error === void 0 ? "" : "\uFF1A" + errorMessage(error);
    console.warn("[dshp-search-provider] " + message + reason);
  } catch {
  }
}
function apply(ctx, config) {
  const modules = createProviderModules();
  const fallbackProvider = defaultProviderId(modules);
  function getConfig() {
    const wanted = config.provider.get();
    const provider = modules.some((module) => module.id === wanted) ? wanted : fallbackProvider;
    const tavily = config.tavily.get();
    const exa = config.exa.get();
    return {
      provider,
      maxResults: typeof config.maxResults.get() === "number" ? config.maxResults.get() : 5,
      tavily: isRecord3(tavily) ? { ...tavily } : {},
      exa: isRecord3(exa) ? { ...exa } : {}
    };
  }
  async function updateConfig(patch) {
    const settings = ctx.get("settings");
    if (!settings) throw new Error("settings \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u914D\u7F6E");
    await settings.update(NS, patch);
  }
  async function resolveKey(ref) {
    const credentials = ctx.get("credentials");
    if (!credentials || typeof credentials.resolve !== "function") return void 0;
    try {
      const resolved = await credentials.resolve(ref);
      const value = typeof resolved === "string" ? resolved : resolved?.value;
      return typeof value === "string" && value.length > 0 ? value : void 0;
    } catch {
      return void 0;
    }
  }
  const deps = {
    ctx,
    resolveKey,
    getConfig,
    providerConfig(providerId) {
      const module = modules.find((item) => item.id === providerId);
      const defaults = module !== void 0 ? module.defaultConfig : {};
      const current = getConfig();
      const block = current[providerId];
      return { ...defaults, ...isRecord3(block) ? block : {} };
    }
  };
  try {
    ctx.effect(
      () => ctx.web.registerSearchProvider({
        id: HUB_ID,
        available: () => true,
        async search(request, signal) {
          const current = getConfig();
          const module = modules.find((item) => item.id === current.provider) ?? modules.find((item) => item.id === fallbackProvider);
          if (!module) throw new Error("\u6CA1\u6709\u53EF\u7528\u7684\u641C\u7D22\u540E\u7AEF");
          return module.search(deps, request, signal);
        }
      }),
      "dshp-search-provider: hub provider"
    );
    try {
      console.info(
        `[dshp-search-provider] \u5DF2\u6CE8\u518C web \u641C\u7D22\u63D0\u4F9B\u65B9\u300C${HUB_ID}\u300D\uFF0C\u540E\u7AEF\uFF1A${modules.map((module) => module.id).join(" / ")}`
      );
    } catch {
    }
  } catch (error) {
    warn("\u6CE8\u518C web \u641C\u7D22\u63D0\u4F9B\u65B9\u5931\u8D25\uFF08\u82E5\u65E7\u63D2\u4EF6\u4ECD\u6CE8\u518C\u540C\u540D id \u8BF7\u5148\u79FB\u9664\uFF09", error);
  }
  ctx.inject(["settings"], (sctx) => {
    try {
      sctx.effect(
        () => sctx.settings.configure({ auto: false }, ctx.fiber),
        "dshp-search-provider: settings page"
      );
      const selected = readWebSearchProvider(sctx);
      console.info(`[dshp-search-provider] web.searchProvider=${selected ?? "\u672A\u8BFB\u53D6\u5230"}\uFF08hub=${HUB_ID}\uFF09`);
    } catch (error) {
      warn("settings \u9875\u9762\u7B56\u7565\u6CE8\u518C\u5931\u8D25", error);
    }
  });
  function registerRoute(path, handler) {
    try {
      ctx.effect(
        () => ctx.webServer.register({ kind: "exact", path, handler }),
        `dshp-search-provider: ${path} route`
      );
    } catch (error) {
      warn(`\u6CE8\u518C\u8DEF\u7531 ${path} \u5931\u8D25`, error);
    }
  }
  registerRoute(ROUTE_PREFIX + "/state", async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
    if (!methodIs(req, "GET")) return json(res, 405, { ok: false, error: "method not allowed" });
    try {
      const current = getConfig();
      const selected = readWebSearchProvider(ctx);
      const providers = [];
      for (const module of modules) {
        const credential = await credentialState(ctx, module.credentialRef);
        providers.push({
          id: module.id,
          label: module.label,
          title: module.title,
          credentialRef: module.credentialRef,
          credentialRequired: module.credentialRequired,
          homepage: module.homepage,
          description: module.description,
          freeNote: module.freeNote,
          fields: module.fields,
          configured: credential.configured,
          ...credential.source !== void 0 ? { source: credential.source } : {}
        });
      }
      const hint = selected === null ? "\u672A\u80FD\u8BFB\u53D6 web.searchProvider\u3002\u8BF7\u786E\u8BA4 profile \u7684 web \u6761\u76EE\u6CA1\u6709\u88AB\u5176\u4ED6 patch \u8986\u76D6\uFF0C\u6216\u91CD\u542F dsh web \u8BA9\u672C\u63D2\u4EF6\u7684 patch \u751F\u6548\u3002" : selected !== HUB_ID ? `profile \u7684 web.searchProvider \u5F53\u524D\u662F\u300C${selected}\u300D\uFF0C\u641C\u7D22\u4E0D\u4F1A\u8D70\u672C\u63D2\u4EF6\u3002\u8BF7\u628A\u5B83\u6539\u4E3A\u300C${HUB_ID}\u300D\u6216\u5220\u9664\u8BE5\u8986\u76D6\u884C\u540E\u91CD\u542F dsh web\u3002` : void 0;
      return json(res, 200, {
        ok: true,
        namespace: NS,
        hubProviderId: HUB_ID,
        selectedProviderId: selected,
        webSearchConfigured: selected === HUB_ID,
        providers,
        config: snapshotConfig(current, modules),
        ...hint !== void 0 ? { selectionHint: hint } : {}
      });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });
  registerRoute(ROUTE_PREFIX + "/config", async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
    if (!methodIs(req, "POST")) return json(res, 405, { ok: false, error: "method not allowed" });
    let body;
    try {
      body = JSON.parse(await readBody(req, MAX_BODY) || "{}");
    } catch {
      return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" });
    }
    try {
      const patch = sanitizeRoutePatch(body, modules);
      if (Object.keys(patch).length > 0) await updateConfig(patch);
      return json(res, 200, { ok: true, config: snapshotConfig(getConfig(), modules) });
    } catch (error) {
      return json(res, 200, { ok: false, error: errorMessage(error) });
    }
  });
  registerRoute(ROUTE_PREFIX + "/test", async (req, res) => {
    if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
    if (!methodIs(req, "POST")) return json(res, 405, { ok: false, error: "method not allowed" });
    const startedAt = Date.now();
    let body;
    try {
      body = JSON.parse(await readBody(req, MAX_BODY) || "{}");
    } catch {
      return json(res, 200, { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON", takenMs: Date.now() - startedAt });
    }
    const input = isRecord3(body) ? body : {};
    const current = getConfig();
    const wanted = typeof input["provider"] === "string" ? input["provider"] : current.provider;
    const module = modules.find((item) => item.id === wanted);
    if (!module) {
      return json(res, 200, {
        ok: false,
        error: `\u672A\u77E5\u63D0\u4F9B\u65B9\u300C${wanted}\u300D\uFF0C\u53EF\u9009\uFF1A${modules.map((item) => item.id).join(" / ")}`,
        takenMs: Date.now() - startedAt
      });
    }
    const query = typeof input["query"] === "string" ? input["query"].trim() : "";
    if (query.length === 0) {
      return json(res, 200, { ok: false, error: "\u8BF7\u8F93\u5165\u6D4B\u8BD5\u67E5\u8BE2", takenMs: Date.now() - startedAt });
    }
    try {
      const result = await module.search(deps, { query, maxResults: current.maxResults });
      return json(res, 200, {
        ok: true,
        provider: module.id,
        sources: result.sources,
        ...result.content !== void 0 ? { content: result.content } : {},
        takenMs: Date.now() - startedAt
      });
    } catch (error) {
      return json(res, 200, {
        ok: false,
        provider: module.id,
        error: errorMessage(error),
        takenMs: Date.now() - startedAt
      });
    }
  });
}
function readWebSearchProvider(ctx) {
  const settings = ctx.get("settings");
  if (!settings || typeof settings.describe !== "function") return null;
  try {
    const descriptors = settings.describe({ redactSecrets: true });
    if (!Array.isArray(descriptors)) return null;
    const web = descriptors.find((item) => isRecord3(item) && item["ns"] === "web");
    const value = isRecord3(web) ? web["value"] : void 0;
    return isRecord3(value) && typeof value["searchProvider"] === "string" ? value["searchProvider"] : null;
  } catch {
    return null;
  }
}
async function credentialState(ctx, ref) {
  const credentials = ctx.get("credentials");
  if (!credentials || typeof credentials.describe !== "function") return { configured: false };
  try {
    const info = await credentials.describe(ref);
    const configured = isRecord3(info) && info["configured"] === true;
    const source = isRecord3(info) && typeof info["source"] === "string" ? info["source"] : void 0;
    return source !== void 0 ? { configured, source } : { configured };
  } catch {
    return { configured: false };
  }
}

export { Config, ConfigSchema, NS, apply, inject, name };
