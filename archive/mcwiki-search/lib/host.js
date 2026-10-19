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

// src/host/convert.ts
var NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201D",
  ldquo: "\u201C",
  middot: "\xB7",
  bull: "\u2022",
  times: "\xD7",
  minus: "\u2212",
  ge: "\u2265",
  le: "\u2264",
  ne: "\u2260",
  asymp: "\u2248",
  deg: "\xB0",
  shy: "",
  brvbar: "\xA6",
  thinsp: " ",
  ensp: " ",
  emsp: " "
};
function decodeEntities(str) {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.replace(/&(#?[a-zA-Z0-9]+);/g, (match, body) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X";
      const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 1114111) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named = NAMED_ENTITIES[body];
    return named !== void 0 ? named : match;
  });
}
function collapseWhitespace(str) {
  return String(str).replace(/\s+/g, " ").trim();
}
function normalizeWhitespace(str) {
  return String(str).replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
}
function cleanSearchSnippet(html) {
  if (typeof html !== "string" || html.length === 0) return "";
  return collapseWhitespace(
    decodeEntities(
      String(html).replace(/<span[^>]*class="[^"]*searchmatch[^"]*"[^>]*>/g, "**").replace(/<\/span>/g, "**").replace(/<[^>]*>/g, "").replace(/\[\[([^[\]|]*)((?:\|[^[\]|]*)*)\]\]/g, (match, target, rest) => {
        const segments = String(rest).split("|").filter((s) => s.trim().length > 0);
        const last = segments.length > 0 ? segments[segments.length - 1] : target;
        return last.trim();
      }).replace(/\*\*\s*\*\*/g, " ").replace(/\*\*([^*]+)\*\*/g, (_m, inner) => `**${inner.trim()}**`).replace(/\s+([，。；：、）】」』！？])/g, "$1").replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
    )
  );
}
function cleanTitle(title) {
  return collapseWhitespace(decodeEntities(String(title))).replace(/_/g, " ");
}
function isLinkSpriteTemplate(name2) {
  return /(Link|Sprite|Icon|Image)(\d)?$/.test(name2);
}
function namedArg(body, keyName) {
  const pattern2 = new RegExp(
    `(?:^|\\n?\\|)\\s*${keyName}\\s*=([\\s\\S]*?)(?=\\n?\\|[a-zA-Z_][a-zA-Z0-9_]*\\s*=|$)`
  );
  const match = pattern2.exec(body);
  return match !== null ? match[1].trim() : void 0;
}
function splitTemplateArgs(body) {
  const args = [];
  for (const raw of body.split("|")) {
    const part = raw.trim();
    if (part.length === 0) continue;
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=/.test(part)) continue;
    args.push(part.replace(/\{\{!\}\}/g, "|"));
  }
  return args;
}
function versionLabel(code) {
  const v = String(code ?? "").toLowerCase();
  if (v === "je" || v === "java") return "Java\u7248";
  if (v === "be" || v === "bedrock") return "\u57FA\u5CA9\u7248";
  return "";
}
function resolveTemplate(body) {
  const bodyText = body.trim();
  if (bodyText.length === 0) return "";
  const barIndex = bodyText.indexOf("|");
  const name2 = (barIndex === -1 ? bodyText : bodyText.slice(0, barIndex)).trim().toLowerCase();
  if (/^__[a-z_]+__$/.test(name2)) return "";
  if (name2.startsWith("subst:") || name2.startsWith(":")) return "";
  const args = barIndex === -1 ? [] : splitTemplateArgs(bodyText.slice(barIndex + 1));
  if (name2 === "tr") return args[0] ?? "";
  if (name2 === "only" || name2 === "in") {
    const labelled = versionLabel(args[0]);
    const forValue = namedArg(bodyText, "for");
    if (forValue !== void 0 && forValue.length > 0) return `\uFF08${labelled || "\u6307\u5B9A\u7248\u672C"}\uFF1A${forValue}\uFF09`;
    return labelled;
  }
  if (name2 === "el" || name2 === "edition") return versionLabel(args[0]);
  if (name2 === "quote") return args[0] ?? "";
  if (name2 === "xp") return `${args[0] ?? "?"} \u7ECF\u9A8C`;
  if (name2 === "cd" || name2 === "cmd" || name2 === "kbd" || name2 === "samp")
    return args.length > 0 ? `\`${args[0]}\`` : "";
  if (name2 === "hp") return `${args[0] ?? "?"} HP`;
  if (name2 === "autodmg") return `${args[0] ?? "?"} \u4F24\u5BB3`;
  if (name2 === "convert") return `${args[0] ?? "?"} \u523B\uFF08ticks\uFF09`;
  if (name2 === "dropline") {
    const item = namedArg(bodyText, "name") ?? args[0] ?? "";
    if (item.length === 0) return "";
    const quantity = namedArg(bodyText, "quantity");
    const looting = namedArg(bodyText, "lootingquantity");
    let rendered = item;
    if (quantity !== void 0 && quantity.length > 0) {
      rendered += `\uFF08${quantity}${looting !== void 0 && looting.length > 0 ? `\uFF0C\u65F6\u8FD0 ${looting}` : ""}\uFF09`;
    }
    return rendered;
  }
  if (name2 === "droptable") {
    const notes = namedArg(bodyText, "notes");
    if (notes === void 0 || notes.length === 0) return "";
    return notes.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).map((line) => `\u6389\u843D\u6761\u4EF6\uFF1A${line.replace(/^[a-zA-Z0-9_.]+\s*=\s*/, "")}`).join("\n");
  }
  if (isLinkSpriteTemplate(name2) && args.length > 0) return args[0];
  return "";
}
function expandTemplates(src) {
  let text = String(src);
  let pass = 0;
  while (pass < 10) {
    const next = text.replace(/\{\{((?:[^{}]|\{[^{}]*\})*)\}\}/g, (match, body) => {
      return resolveTemplate(body);
    });
    if (next === text) break;
    text = next;
    pass += 1;
  }
  let cleaned = text;
  for (let i = 0; i < 10; i += 1) {
    const next = cleaned.replace(/\{\{(?:[^{}]|\{[^{}]*\})*\}\}/g, "");
    if (next === cleaned) break;
    cleaned = next;
  }
  return cleaned;
}
var TAG_BLOCK = /<\/?(?:ref|gallery|syntaxhighlight|source|math|chem|score|timeline|poem|onlyinclude|noinclude|includeonly|indicator|templatestyles|imagemap|categorytree)(?:\s[^>]*)?>|<ref[^>]*\/>/gi;
function stripTagBlocks(src) {
  return String(src).replace(/<!--[\s\S]*?-->/g, "").replace(TAG_BLOCK, "").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/?[a-zA-Z][^>]*>/g, "");
}
var INTERWIKI_LANG = /^(?:cs|de|en|es|fr|hu|it|ja|ko|lzh|nl|pl|pt|ru|th|tr|uk|zh|zh-hans|zh-hant|zh-cn|zh-tw|zh-hk)(?=:|-)/i;
function resolveInternalLinks(text) {
  return String(text).replace(
    /\[\[([^[\]|]*)((?:\|[^[\]|]*)*)\]\]/g,
    (match, target, rest) => {
      const t = target.trim();
      const segments = String(rest).split("|").map((s) => s.trim()).filter((s) => s.length > 0);
      const l = segments.length > 0 ? segments[segments.length - 1] : "";
      if (t.length === 0) return l;
      const lower = t.toLowerCase();
      if (/(^|:)file:|image:|category:|wikipedia:|wzh:|w:|mw:|wikt:|special:|help:|template:/.test(lower)) {
        return /^file:|^image:|^category:/.test(lower) ? "" : l || lastSegment(t);
      }
      if (INTERWIKI_LANG.test(t)) return "";
      if (t.startsWith(":")) return l || lastSegment(t.slice(1));
      const [page, section] = splitAnchor(t);
      return l || (section !== void 0 ? `${page}#${section}` : page);
    }
  );
}
function lastSegment(target) {
  const cleaned = target.startsWith(":") ? target.slice(1) : target;
  const parts = cleaned.split(/[#|]/);
  return parts[parts.length - 1] ?? cleaned;
}
function splitAnchor(target) {
  const hash = target.indexOf("#");
  if (hash === -1) return [target, void 0];
  return [target.slice(0, hash), target.slice(hash + 1)];
}
function convertQuotes(text) {
  return String(text).replace(/'''''([^'"]*?)'''''/g, "***$1***").replace(/'''([^'"]*?)'''/g, "**$1**").replace(/''([^'"]*?)''/g, "*$1*");
}
function resolveExternalLinks(text) {
  return String(text).replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, (match, _url, label) => {
    return label.trim();
  }).replace(/\[(https?:\/\/[^\s\]]+)\]/g, "$1");
}
function renderTableCell(cell) {
  let value = expandTemplates(cell);
  value = resolveInternalLinks(value);
  value = resolveExternalLinks(value);
  value = convertQuotes(value);
  value = decodeEntities(value);
  value = collapseWhitespace(value);
  if (value.includes("{{") || value.includes("[[")) value = "\u2026";
  return value.replace(/\n/g, "<br>");
}
function flattenTable(tableSrc) {
  const rows = [];
  let cells = [];
  const flushRow = () => {
    if (cells.length > 0) {
      rows.push(cells);
      cells = [];
    }
  };
  for (const rawLine of tableSrc.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("|+") || line.startsWith("|}")) continue;
    if (line.startsWith("|-")) {
      flushRow();
      continue;
    }
    const isHeader = line.startsWith("!");
    if (!isHeader && !line.startsWith("|")) continue;
    const body = line.slice(1);
    const parts = body.split(/[|!]{2}/);
    for (const part of parts) cells.push(renderTableCell(part));
  }
  flushRow();
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const lines = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const padded = [];
    for (let c = 0; c < width; c += 1) padded.push(row[c] ?? "");
    if (padded.every((cell) => cell.trim() === "")) continue;
    lines.push(`| ${padded.join(" | ")} |`);
    if (i === 0) lines.push(`| ${Array(width).fill("---").join(" | ")} |`);
  }
  return lines.join("\n");
}
function inlineCleanup(text) {
  return resolveExternalLinks(resolveInternalLinks(convertQuotes(decodeEntities(text))));
}
function resolveMaxChars(value) {
  const n = Number(value);
  if (value === void 0 || value === null || value === "" || !Number.isFinite(n) || n <= 0) return Infinity;
  return Math.floor(n);
}
function wikitextToMarkdown(wikitext, opts = {}) {
  const maxChars = resolveMaxChars(opts.maxChars);
  const pre = expandTemplates(stripTagBlocks(wikitext).replace(/-\{\}-\s*/g, ""));
  const lines = String(pre).split("\n");
  const out = [];
  let inTable = false;
  let tableBuf = [];
  let tableCount = 0;
  let tableTruncated = false;
  const emitTable = () => {
    const flat = flattenTable(tableBuf.join("\n"));
    if (flat.length > 0) out.push(flat);
    tableBuf = [];
    inTable = false;
  };
  for (const rawLine of lines) {
    const line = rawLine;
    const trimmed = line.trim();
    if (trimmed.startsWith("{|")) {
      if (inTable) emitTable();
      inTable = true;
      tableBuf = [];
      continue;
    }
    if (inTable) {
      if (trimmed.startsWith("|}")) {
        emitTable();
        continue;
      }
      tableBuf.push(line);
      tableCount += 1;
      if (tableCount > 2e3) {
        tableTruncated = true;
        inTable = false;
        tableBuf = [];
      }
      continue;
    }
    if (/^__(?:NOTOC|TOC|FORCETOC|NOEDITSECTION|NEWSECTIONLINK)__\s*$/.test(trimmed)) continue;
    const heading = /^(={2,6})\s*(.*?)\s*\1\s*$/.exec(trimmed);
    if (heading) {
      const level = Math.min(heading[1].length, 6);
      out.push(`${"#".repeat(level)} ${inlineCleanup(heading[2]).trim()}`);
      continue;
    }
    if (trimmed === "") {
      out.push("");
      continue;
    }
    if (/^[*#:;]/.test(trimmed)) {
      out.push(
        inlineCleanup(trimmed).replace(
          /^([*#:;]+)\s?(.*)$/,
          (match, marker, rest) => {
            const depth = marker.length;
            const indent = "  ".repeat(depth - 1);
            const kind = marker[0];
            if (kind === "*") return `${indent}- ${rest}`;
            if (kind === "#") return `${indent}1. ${rest}`;
            if (kind === ";") {
              const [term, ...defParts] = rest.split(":");
              const def = defParts.join(":").trim();
              return `**${(term ?? "").trim()}**${def.length > 0 ? `\uFF1A${def}` : ""}`;
            }
            return `${indent}  ${rest}`;
          }
        )
      );
      continue;
    }
    const converted = inlineCleanup(trimmed);
    if (converted === "") continue;
    if (/^(Java版|基岩版)[:：]?$/.test(converted)) continue;
    out.push(converted);
  }
  if (inTable) emitTable();
  let markdown = normalizeWhitespace(out.join("\n"));
  let truncated = tableTruncated;
  if (Number.isFinite(maxChars) && markdown.length > maxChars) {
    markdown = `${markdown.slice(0, maxChars).trimEnd()}

\u2026\uFF08\u5185\u5BB9\u8D85\u8FC7 ${maxChars} \u5B57\u7B26\u4E0A\u9650\u5DF2\u622A\u65AD\uFF0C\u53EF\u4F20 maxChars=0 \u5173\u95ED\u622A\u65AD\uFF09`;
    truncated = true;
  }
  return { markdown, truncated };
}
function markdownToPlainText(markdown, opts = {}) {
  const maxChars = resolveMaxChars(opts.maxChars);
  let text = String(markdown);
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  text = text.replace(/^#{1,6}\s+/gm, "").replace(/^\s*>\s?/gm, "");
  text = text.replace(/[*_`~]/g, "");
  text = text.replace(/^\s*[-+]\s+/gm, "\u2022 ");
  text = text.replace(/\|/g, " ").replace(/\s+/g, " ");
  let truncated = false;
  if (Number.isFinite(maxChars) && text.length > maxChars) {
    text = `${text.slice(0, maxChars).trimEnd()} \u2026\uFF08\u5DF2\u622A\u65AD\uFF09`;
    truncated = true;
  }
  return { text: text.trim(), truncated };
}
function cleanExtractText(extract, opts = {}) {
  const maxChars = resolveMaxChars(opts.maxChars);
  const text0 = collapseWhitespace(decodeEntities(String(extract ?? "")));
  let text = String(text0).replace(/\[\d+\]/g, "");
  let truncated = false;
  if (Number.isFinite(maxChars) && text.length > maxChars) {
    text = `${text.slice(0, maxChars).trimEnd()} \u2026\uFF08\u5DF2\u622A\u65AD\uFF09`;
    truncated = true;
  }
  return { text, truncated };
}

// src/host/api.ts
var API_BASE = "https://zh.minecraft.wiki/api.php";
var DEFAULT_TIMEOUT_MS = 15e3;
var DEFAULT_USER_AGENT = "mcwiki-search-dsh/1.1.0 (Minecraft Wiki query plugin; https://github.com/Yinxe/deepseek-harness-plugins)";
function isRecord(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function pageUrl(title) {
  return `${API_BASE.replace(/\/api\.php$/, "")}/w/${encodeURIComponent(String(title).replace(/ /g, "_"))}`;
}
async function requestJson(url, opts = {}) {
  const timeoutMs = opts.timeoutMs !== void 0 ? Number(opts.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
  const signals = [];
  if (opts.signal !== void 0) signals.push(opts.signal);
  signals.push(controller.signal);
  const signal = typeof AbortSignal.any === "function" && signals.length > 1 ? AbortSignal.any(signals) : signals[0];
  let response;
  const reqHeaders = {
    "user-agent": DEFAULT_USER_AGENT,
    accept: "application/json"
  };
  if (opts.headers !== void 0) Object.assign(reqHeaders, opts.headers);
  try {
    response = await fetch(url, {
      method: opts.method ?? "GET",
      headers: reqHeaders,
      ...opts.body !== void 0 ? { body: opts.body } : {},
      signal,
      redirect: "follow"
    });
  } catch (error) {
    const e = error;
    if (e && e.name === "AbortError") {
      throw new Error(
        opts.signal !== void 0 && opts.signal.aborted ? "\u8BF7\u6C42\u5DF2\u53D6\u6D88" : "\u8BF7\u6C42\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
        {
          cause: error
        }
      );
    }
    throw new Error(`\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25\uFF1A${String(e && e.message || error)}`, { cause: error });
  } finally {
    clearTimeout(timer);
  }
  let parsed = null;
  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    const info = isRecord(parsed) && isRecord(parsed["error"]) ? String(parsed["error"]["info"] ?? "") : "";
    throw new Error(`Minecraft Wiki API \u54CD\u5E94 ${response.status}${info ? `\uFF1A${info}` : ""}`);
  }
  if (parsed === null || typeof parsed !== "object")
    throw new Error("Minecraft Wiki API \u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u54CD\u5E94");
  if (isRecord(parsed) && parsed["error"] !== void 0) {
    const err = parsed["error"];
    const info = isRecord(err) ? String(err["info"] ?? err["code"] ?? "\u672A\u77E5\u9519\u8BEF") : "\u672A\u77E5\u9519\u8BEF";
    throw new Error(`Minecraft Wiki API \u9519\u8BEF\uFF1A${info}`);
  }
  return parsed;
}
function queryUrl(params) {
  const search = new URLSearchParams({ action: "query", format: "json", formatversion: "2", ...params });
  return `${API_BASE}?${search.toString()}`;
}
async function searchWiki(opts) {
  const query = typeof opts.query === "string" ? opts.query.trim() : "";
  if (query.length === 0) throw new Error("\u67E5\u8BE2\u8BCD\u4E0D\u80FD\u4E3A\u7A7A");
  const limit = Math.min(Math.max(Number(opts.limit) || 8, 1), 50);
  const data = await requestJson(
    queryUrl({
      list: "search",
      srsearch: query,
      srlimit: String(limit),
      srnamespace: "0",
      srprop: "snippet|timestamp|size|wordcount"
    }),
    { signal: opts.signal, timeoutMs: opts.timeoutMs }
  );
  const searchInfo = isRecord(data["query"]) ? data["query"]["searchinfo"] : void 0;
  const hits = isRecord(searchInfo) ? Number(searchInfo["totalhits"]) || 0 : 0;
  const rawItems = isRecord(data["query"]) ? data["query"]["search"] : void 0;
  const items = Array.isArray(rawItems) ? rawItems : [];
  const results = items.map((item) => ({
    title: cleanTitle(item["title"]),
    pageid: Number(item["pageid"]) || 0,
    url: pageUrl(item["title"]),
    snippet: cleanSearchSnippet(typeof item["snippet"] === "string" ? item["snippet"] : ""),
    updated: item["timestamp"] !== void 0 ? String(item["timestamp"]) : ""
  })).filter((item) => item.title.length > 0);
  const truncated = limit < hits;
  return {
    success: true,
    query,
    totalHits: hits,
    truncated,
    results
  };
}
function resolvePages(data, opts) {
  const query = isRecord(data["query"]) ? data["query"] : {};
  const pages = Array.isArray(query["pages"]) ? query["pages"] : [];
  const redirectedTo = {};
  if (Array.isArray(query["redirects"])) {
    for (const r of query["redirects"]) {
      if (r["from"] !== void 0 && r["to"] !== void 0) redirectedTo[String(r["from"])] = String(r["to"]);
    }
  }
  if (pages.length === 0) {
    throw new Error("\u672A\u627E\u5230\u8BE5\u9875\u9762\uFF08\u53EF\u80FD\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664\uFF09");
  }
  const page = pages[0];
  if (page === void 0 || page["missing"] === true) {
    const wanted = opts.title !== void 0 ? String(opts.title) : opts.pageid !== void 0 ? `#${String(opts.pageid)}` : "";
    throw new Error(`\u9875\u9762\u4E0D\u5B58\u5728\uFF1A${wanted}`);
  }
  const rawTitle = String(page["title"] ?? "");
  const effectiveTitle = redirectedTo[rawTitle] ?? rawTitle;
  return { page, effectiveTitle };
}
async function fetchPageIntro(opts) {
  const params = {
    prop: "extracts",
    explaintext: "1",
    exlimit: "1",
    redirects: "1"
  };
  if (!opts.wholePage) params["exintro"] = "1";
  if (opts.pageid !== void 0) params["pageids"] = String(opts.pageid);
  else if (opts.title !== void 0) params["titles"] = String(opts.title);
  else throw new Error("\u5FC5\u987B\u63D0\u4F9B title \u6216 pageid");
  const data = await requestJson(queryUrl(params), {
    signal: opts.signal,
    timeoutMs: opts.timeoutMs
  });
  const { page, effectiveTitle } = resolvePages(data, opts);
  const extract = typeof page["extract"] === "string" ? page["extract"] : "";
  const maxChars = opts.maxChars !== void 0 && Number(opts.maxChars) > 0 ? Number(opts.maxChars) : void 0;
  const cleaned = cleanExtractText(extract, maxChars === void 0 ? {} : { maxChars });
  const out = {
    success: true,
    title: cleanTitle(effectiveTitle),
    pageid: Number(page["pageid"]) || 0,
    url: pageUrl(effectiveTitle),
    section: opts.wholePage ? "page" : "intro",
    format: "text",
    text: cleaned.text,
    truncated: cleaned.truncated
  };
  if (typeof page["touched"] === "string" || typeof page["touched"] === "number") {
    return out;
  }
  return out;
}
async function fetchPageWikitext(opts) {
  const params = {
    prop: "revisions",
    rvprop: "content|timestamp",
    rvslots: "main",
    rvlimit: "1",
    redirects: "1"
  };
  if (opts.pageid !== void 0) params["pageids"] = String(opts.pageid);
  else if (opts.title !== void 0) params["titles"] = String(opts.title);
  else throw new Error("\u5FC5\u987B\u63D0\u4F9B title \u6216 pageid");
  const data = await requestJson(queryUrl(params), {
    signal: opts.signal,
    timeoutMs: opts.timeoutMs
  });
  const { page, effectiveTitle } = resolvePages(data, opts);
  const revisions = Array.isArray(page["revisions"]) ? page["revisions"] : [];
  const revision = revisions[0];
  let wikitext = "";
  if (revision !== void 0 && isRecord(revision["slots"]) && isRecord(revision["slots"]["main"])) {
    const main = revision["slots"]["main"];
    if (typeof main["*"] === "string") wikitext = main["*"];
    else if (typeof main["content"] === "string") wikitext = main["content"];
  }
  return {
    success: true,
    title: cleanTitle(effectiveTitle),
    pageid: Number(page["pageid"]) || 0,
    url: pageUrl(effectiveTitle),
    wikitext,
    updated: revision !== void 0 && revision["timestamp"] !== void 0 ? String(revision["timestamp"]) : ""
  };
}
async function fetchRandomPages(opts) {
  const limit = Math.min(Math.max(Number(opts.limit) || 5, 1), 20);
  const maxIntroChars = opts.maxIntroChars !== void 0 && Number(opts.maxIntroChars) > 0 ? Number(opts.maxIntroChars) : void 0;
  const data = await requestJson(
    queryUrl({
      list: "random",
      rnlimit: String(limit),
      rnnamespace: "0"
    }),
    { signal: opts.signal, timeoutMs: opts.timeoutMs }
  );
  const rawRandom = isRecord(data["query"]) ? data["query"]["random"] : void 0;
  const items = Array.isArray(rawRandom) ? rawRandom : [];
  const titles = items.map((item) => item["title"]).filter((title) => typeof title === "string" && title.length > 0);
  const results = [];
  if (titles.length > 0) {
    const introData = await requestJson(
      queryUrl({
        prop: "extracts",
        explaintext: "1",
        exintro: "1",
        exlimit: String(Math.min(titles.length, 20)),
        redirects: "1",
        titles: titles.join("|")
      }),
      { signal: opts.signal, timeoutMs: opts.timeoutMs }
    );
    const rawPages = isRecord(introData["query"]) ? introData["query"]["pages"] : void 0;
    const pages = Array.isArray(rawPages) ? rawPages : [];
    const byTitle = /* @__PURE__ */ new Map();
    for (const page of pages) {
      if (page !== void 0 && typeof page["title"] === "string") byTitle.set(page["title"], page);
    }
    for (const title of titles) {
      const page = byTitle.get(title);
      const extract = page !== void 0 && typeof page["extract"] === "string" ? page["extract"] : "";
      const cleaned = cleanExtractText(
        extract,
        maxIntroChars === void 0 ? {} : { maxChars: maxIntroChars }
      );
      const item = {
        title: cleanTitle(title),
        url: pageUrl(title),
        text: cleaned.text
      };
      if (page !== void 0 && page["pageid"] !== void 0) item.pageid = Number(page["pageid"]) || 0;
      results.push(item);
    }
  }
  return {
    success: true,
    results
  };
}

// src/host/config.ts
var NS = settingsNamespace("dshp-mcwiki-search");
var ConfigSchema = Schema.object({
  timeoutMs: Schema.number().step(1).min(1e3).default(DEFAULT_TIMEOUT_MS).volatile(),
  maxChars: Schema.number().step(1).min(0).default(0).volatile(),
  introMaxChars: Schema.number().step(1).min(0).default(0).volatile(),
  searchMaxResults: Schema.number().step(1).min(1).default(8).volatile()
});

// src/host/command.ts
function shortDate(v) {
  return /^\d{4}-\d{2}-\d{2}T/.test(v) ? v.slice(0, 10) : v;
}
function ok(text) {
  return { kind: "success", text };
}
function fail(text) {
  return { kind: "error", text };
}
function wikiHeadingsToMarkdown(text) {
  return text.split("\n").map((line) => {
    const m = /^(={2,5})\s*(.+?)\s*\1\s*$/.exec(line);
    if (!m) return line;
    const level = (m[1]?.length ?? 2) + 1;
    return "#".repeat(level) + " " + (m[2] ?? "");
  }).join("\n");
}
function renderList(r) {
  const head = `### \u300C${r.query}\u300D\xB7 ${r.totalHits} \u6761\u547D\u4E2D\uFF08\u663E\u793A\u524D ${r.results.length} \u6761${r.truncated ? "\uFF0C\u5DF2\u6309\u8BBE\u7F6E\u622A\u65AD" : ""}\uFF09`;
  const items = r.results.map((item, i) => {
    const lines = [`${i + 1}. **[${item.title}](${item.url})** \u2014 ${item.snippet}`];
    if (item.updated) lines.push(`   \uFF08\u66F4\u65B0\u4E8E ${shortDate(item.updated)}\uFF09`);
    return lines.join("\n");
  });
  return [head, "", ...items].join("\n");
}
async function executeMcwikiCommand(getConfig, invocation) {
  const cfg = getConfig();
  const raw = typeof invocation?.rawInput === "string" ? invocation.rawInput.trim() : "";
  if (raw.length === 0) return ok("\u7528\u6CD5\uFF1A/mcwiki <\u641C\u7D22\u8BCD\u6216\u6761\u76EE\u540D>\u2014\u2014\u56DE\u663E\u641C\u7D22\u5217\u8868\u4E0E\u7B2C\u4E00\u6761\u6761\u76EE\u8BE6\u60C5");
  const signal = invocation?.signal instanceof AbortSignal ? invocation.signal : void 0;
  const r = await searchWiki({
    query: raw,
    limit: cfg.searchMaxResults,
    signal,
    timeoutMs: cfg.timeoutMs
  });
  if (r.results.length === 0) {
    return ok(`\u300C${r.query}\u300D\u6CA1\u6709\u547D\u4E2D\u4EFB\u4F55\u6761\u76EE\uFF1B\u6362\u4E2A\u66F4\u77ED\u7684\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002`);
  }
  const first = r.results[0];
  if (first === void 0) return ok(`\u300C${r.query}\u300D\u6CA1\u6709\u547D\u4E2D\u4EFB\u4F55\u6761\u76EE\u3002`);
  let detail;
  try {
    const intro = await fetchPageIntro({
      pageid: first.pageid,
      wholePage: true,
      maxChars: cfg.maxChars,
      signal,
      timeoutMs: cfg.timeoutMs
    });
    detail = [
      `## ${intro.title}${intro.truncated ? `\uFF08\u6B63\u6587\u5DF2\u6309\u8BBE\u7F6E\u622A\u65AD\u5230 ${cfg.maxChars} \u5B57\uFF09` : ""}`,
      "",
      wikiHeadingsToMarkdown(intro.text),
      "",
      `\u6765\u6E90\uFF1A${intro.url}`
    ].join("\n");
  } catch (e) {
    detail = "> \u2014\u2014 \u8BE6\u60C5\u83B7\u53D6\u5931\u8D25\uFF08" + String(e?.message ?? e).slice(0, 120) + "\uFF09\uFF0C\u53EF\u518D\u8BD5\u4E00\u6B21 /mcwiki " + first.title + " \u2014\u2014";
  }
  return ok(
    [
      renderList(r),
      "",
      "---",
      "",
      detail,
      "",
      "> \u8BE6\u60C5\u4E3A\u7B2C\u4E00\u6761\u7684\u6574\u9875\u6587\u672C\uFF08\u4E0A\u9650\u53D6\u8BBE\u7F6E\u300C\u5168\u6587\u4E0A\u9650\u300D\uFF0C0 = \u5B8C\u6574\uFF09\uFF1B\u9700\u8981 Markdown \u5168\u6587\u8F6C\u6362\u5C31\u8BA9\u6A21\u578B\u8C03\u7528 mcwiki_get_page\u3002"
    ].join("\n")
  );
}
function registerCommand(ctx, getConfig) {
  const commands = ctx.get("commands");
  if (!commands || typeof commands.register !== "function") {
    try {
      console.info("[dshp-mcwiki-search] commands \u670D\u52A1\u672A\u6302\u8F7D\uFF0C\u8DF3\u8FC7 /mcwiki \u547D\u4EE4\u6CE8\u518C");
    } catch {
    }
    return;
  }
  ctx.effect(
    () => commands.register({
      // definitionId 为品牌字符串（官方包用包名）；AnyCtx 体系下直接传同值
      definitionId: "@dshp/mcwiki-search",
      name: "mcwiki",
      description: "\u67E5\u8BE2\u4E2D\u6587 Minecraft Wiki\uFF1A\u56DE\u663E\u641C\u7D22\u5217\u8868\u4E0E\u7B2C\u4E00\u6761\u6761\u76EE\u6B63\u6587\uFF08Markdown \u6E32\u67D3\uFF09",
      input: { hint: "<\u641C\u7D22\u8BCD\u6216\u6761\u76EE\u540D>" },
      handler: (invocation) => executeMcwikiCommand(getConfig, invocation).catch(
        (e) => fail("Minecraft Wiki \u67E5\u8BE2\u5931\u8D25\uFF1A" + String(e?.message ?? e).slice(0, 300))
      )
    }),
    "dshp-mcwiki-search: /mcwiki command"
  );
}

// src/host/routes.ts
function isRecord2(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function snapshotOf(config) {
  return {
    timeoutMs: config.timeoutMs,
    maxChars: config.maxChars,
    introMaxChars: config.introMaxChars,
    searchMaxResults: config.searchMaxResults
  };
}
function registerRoutes(ctx, getConfig, updateConfig) {
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/ext/dshp-mcwiki-search/state",
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        const config = getConfig();
        json(res, 200, {
          ok: true,
          timeoutMs: config.timeoutMs,
          maxChars: config.maxChars,
          introMaxChars: config.introMaxChars,
          searchMaxResults: config.searchMaxResults,
          config: snapshotOf(config),
          tools: ["mcwiki_search", "mcwiki_get_page", "mcwiki_random"]
        });
      }
    }),
    "dshp-mcwiki-search: state route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/ext/dshp-mcwiki-search/config",
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
        const a = isRecord2(body) ? body : {};
        try {
          const configPatch = {};
          let hasPatch = false;
          if (Object.hasOwn(a, "timeoutMs")) {
            const n = Number(a["timeoutMs"]);
            if (!Number.isFinite(n) || n < 1e3) throw new Error("timeoutMs \u975E\u6CD5\uFF0C\u5E94\u4E3A \u22651000 \u7684\u6BEB\u79D2\u6570");
            configPatch["timeoutMs"] = n;
            hasPatch = true;
          }
          if (Object.hasOwn(a, "maxChars")) {
            const n = Number(a["maxChars"]);
            if (!Number.isFinite(n) || n < 0)
              throw new Error("maxChars \u975E\u6CD5\uFF0C\u5E94\u4E3A \u22650 \u7684\u6574\u6570\uFF080 = \u4E0D\u622A\u65AD\uFF09");
            configPatch["maxChars"] = n;
            hasPatch = true;
          }
          if (Object.hasOwn(a, "introMaxChars")) {
            const n = Number(a["introMaxChars"]);
            if (!Number.isFinite(n) || n < 0)
              throw new Error("introMaxChars \u975E\u6CD5\uFF0C\u5E94\u4E3A \u22650 \u7684\u6574\u6570\uFF080 = \u4E0D\u622A\u65AD\uFF09");
            configPatch["introMaxChars"] = n;
            hasPatch = true;
          }
          if (Object.hasOwn(a, "searchMaxResults")) {
            const n = Number(a["searchMaxResults"]);
            if (!Number.isFinite(n) || n < 1) throw new Error("searchMaxResults \u975E\u6CD5\uFF0C\u5E94\u4E3A \u22651 \u7684\u6574\u6570");
            configPatch["searchMaxResults"] = n;
            hasPatch = true;
          }
          if (hasPatch) await updateConfig(configPatch);
          const config = getConfig();
          return json(res, 200, {
            ok: true,
            config: {
              timeoutMs: config.timeoutMs,
              maxChars: config.maxChars,
              introMaxChars: config.introMaxChars,
              searchMaxResults: config.searchMaxResults
            }
          });
        } catch (error) {
          return json(res, 200, { ok: false, error: String(error?.message ?? error) });
        }
      }
    }),
    "dshp-mcwiki-search: config route"
  );
  ctx.effect(
    () => ctx.webServer.register({
      kind: "exact",
      path: "/ext/dshp-mcwiki-search/test",
      handler: async (req, res) => {
        if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
        if (req.method !== "POST")
          return json(res, 405, { ok: false, error: "method not allowed" });
        const startedAt = Date.now();
        try {
          const parsed = JSON.parse(await readBody(req) || "{}");
          const p = isRecord2(parsed) ? parsed : {};
          const query = typeof p["query"] === "string" ? p["query"].trim() : "";
          if (query.length === 0) {
            return json(res, 200, { ok: false, error: "\u8BF7\u8F93\u5165\u6D4B\u8BD5\u67E5\u8BE2", takenMs: Date.now() - startedAt });
          }
          const title = typeof p["title"] === "string" ? p["title"].trim() : void 0;
          const section = p["section"] === "full" ? "full" : "intro";
          const config = getConfig();
          const search = await searchWiki({
            query,
            timeoutMs: config.timeoutMs
          });
          let page = null;
          if (search.results.length > 0) {
            const first = search.results[0];
            const target = title !== void 0 && title.length > 0 ? title : first !== void 0 ? first.title : query;
            if (section === "intro") {
              const intro = await fetchPageIntro({
                title: target,
                timeoutMs: config.timeoutMs,
                ...config.introMaxChars > 0 ? { maxChars: config.introMaxChars } : {}
              });
              page = {
                title: intro.title,
                section: "intro",
                format: "text",
                text: intro.text,
                url: intro.url
              };
            } else {
              const full = await fetchPageWikitext({
                title: target,
                timeoutMs: config.timeoutMs
              });
              const converted = wikitextToMarkdown(full.wikitext, { maxChars: 6e3 });
              page = {
                title: full.title,
                section: "full",
                format: "markdown",
                text: converted.markdown,
                url: full.url
              };
            }
          }
          return json(res, 200, {
            ok: true,
            query,
            totalHits: search.totalHits,
            results: search.results.slice(0, 5).map((item) => ({
              title: item.title,
              snippet: item.snippet,
              url: item.url,
              updated: item.updated
            })),
            page,
            takenMs: Date.now() - startedAt
          });
        } catch (error) {
          return json(res, 200, {
            ok: false,
            error: String(error?.message ?? error),
            takenMs: Date.now() - startedAt
          });
        }
      }
    }),
    "dshp-mcwiki-search: test route"
  );
}

// src/host/tools.ts
function requireQuery(value) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error("query \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32");
  return value.trim();
}
function intBetween(value, fallback, min, max, label) {
  if (value === void 0 || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`${label} \u5FC5\u987B\u662F ${min}\u2013${max} \u7684\u6574\u6570`);
  return n;
}
function requireTitle(value) {
  if (value === void 0 || value === null || String(value).trim().length === 0) {
    throw new Error("\u5FC5\u987B\u63D0\u4F9B title\uFF08\u9875\u9762\u6807\u9898\uFF09\u6216 pageid\uFF08\u9875\u9762 ID\uFF09");
  }
  return String(value).trim();
}
function optionalPageid(value) {
  if (value === void 0 || value === null || value === "") return void 0;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error("pageid \u5FC5\u987B\u662F\u6B63\u6574\u6570");
  return n;
}
function formatSearch(value) {
  const lines = [];
  lines.push(
    `\u5DF2\u5728\u4E2D\u6587 Minecraft Wiki \u641C\u7D22\u300C${value.query}\u300D\uFF0C\u5171 ${value.totalHits} \u6761\u7ED3\u679C\uFF08\u663E\u793A\u524D ${value.results.length} \u6761\uFF09\uFF1A
`
  );
  value.results.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`);
    if (item.snippet.length > 0) lines.push(`   ${item.snippet}`);
    const meta = [item.url];
    if (item.updated.length > 0) meta.push(`\u66F4\u65B0\u4E8E ${item.updated.slice(0, 10)}`);
    lines.push(`   ${meta.join(" \xB7 ")}`);
  });
  if (value.truncated) lines.push(`
\uFF08\u7ED3\u679C\u8FC7\u591A\u5DF2\u622A\u65AD\uFF0C\u53EF\u7528\u66F4\u7CBE\u786E\u7684\u5173\u952E\u8BCD\u7F29\u5C0F\u8303\u56F4\uFF09`);
  lines.push("\n\u5F15\u7528\u6765\u6E90\u65F6\u8BF7\u9644\u4E0A\u5BF9\u5E94 URL\u3002");
  return lines.join("\n");
}
function formatPage(value) {
  const lines = [];
  lines.push(`# ${value.title}`);
  lines.push(
    `\uFF08${value.section === "intro" ? "\u5F15\u8A00" : "\u5168\u6587"} \xB7 ${value.format} \xB7 \u9875\u9762ID ${value.pageid}${value.updated ? ` \xB7 \u66F4\u65B0\u4E8E ${value.updated.slice(0, 10)}` : ""}\uFF09
`
  );
  if (value.text.length > 0) lines.push(value.text);
  else lines.push("\uFF08\u8BE5\u9875\u9762\u6682\u65E0\u53EF\u7528\u6B63\u6587\uFF09");
  lines.push(`
\u6765\u6E90\uFF1A${value.url}`);
  return lines.join("\n");
}
function formatRandom(value) {
  const lines = ["\u968F\u673A\u6761\u76EE\u7684\u5F15\u8A00\uFF08AI \u53EF\u76F4\u63A5\u9605\u8BFB\uFF09\uFF1A\n"];
  value.results.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`);
    if (item.text.length > 0) lines.push(`   ${item.text}`);
    lines.push(`   ${item.url}`);
  });
  return lines.join("\n");
}
function registerTools(ctx, getConfig) {
  try {
    ctx.tools.register({
      name: "mcwiki_search",
      description: "\u641C\u7D22\u4E2D\u6587 Minecraft Wiki\uFF08zh.minecraft.wiki\uFF09\u3002\u8FD4\u56DE\u6E05\u6D17\u540E\u7684 AI \u53EF\u8BFB\u7ED3\u679C\uFF1A\u6807\u9898\u3001\u6458\u8981\u3001\u9875\u9762 URL\u3001\u66F4\u65B0\u65F6\u95F4\u3002",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: { type: "string", description: '\u641C\u7D22\u5173\u952E\u8BCD\uFF0C\u4F8B\u5982\u300C\u94BB\u77F3\u300D\u300C\u82E6\u529B\u6015\u300D\u6216 "Ancient City"\u3002' },
          limit: { type: "integer", description: "\u8FD4\u56DE\u6761\u6570\uFF0C1\u201320\uFF0C\u9ED8\u8BA4 8\u3002" }
        },
        required: ["query"]
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: { type: "boolean", const: true },
            query: { type: "string" },
            totalHits: { type: "integer" },
            truncated: { type: "boolean" },
            results: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  pageid: { type: "integer" },
                  url: { type: "string" },
                  snippet: { type: "string" },
                  updated: { type: "string" }
                },
                required: ["title", "pageid", "url"]
              }
            }
          },
          required: ["success", "query", "totalHits", "results"]
        },
        render: (_args, value) => [{ type: "text", text: formatSearch(value) }]
      },
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const config = getConfig();
        const query = requireQuery(args["query"]);
        const limit = intBetween(args["limit"], config.searchMaxResults, 1, 20, "limit");
        return searchWiki({
          signal: exec !== void 0 ? exec.signal : void 0,
          timeoutMs: config.timeoutMs,
          query,
          limit
        });
      }
    });
  } catch (e) {
    try {
      console.error(
        "[dshp-mcwiki-search] register mcwiki_search failed: " + String(e?.message ?? e)
      );
    } catch {
    }
  }
  try {
    ctx.tools.register({
      name: "mcwiki_get_page",
      description: "\u6293\u53D6\u4E2D\u6587 Minecraft Wiki \u9875\u9762\u5E76\u628A\u5185\u5BB9\u8F6C\u6362\u6210 AI \u53EF\u76F4\u63A5\u9605\u8BFB\u7684\u683C\u5F0F\uFF0C\u9ED8\u8BA4\u5B8C\u6574\u8F93\u51FA\u4E0D\u622A\u65AD\u3002section=intro \u8FD4\u56DE\u7EAF\u6587\u672C\u5F15\u8A00\uFF08\u9ED8\u8BA4\uFF09\uFF1Bsection=full \u8FD4\u56DE\u5168\u6587\uFF0Cformat=markdown \u8FD4\u56DE Markdown\uFF08\u9ED8\u8BA4\uFF09\u6216 text \u7EAF\u6587\u672C\u6216 wikitext \u539F\u59CB\u6E90\u7801\u3002\u6240\u6709\u4FE1\u606F\u4E0E\u7EC6\u8282\u90FD\u4FDD\u7559\uFF1A\u6A21\u677F/\u5F15\u7528/\u566A\u58F0\u5DF2\u6E05\u6D17\uFF0C\u6B63\u6587\u5B8C\u6574\u3002",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string", description: '\u9875\u9762\u6807\u9898\uFF0C\u4F8B\u5982\u300C\u82E6\u529B\u6015\u300D\u6216 "Diamond"\u3002\u4E0E pageid \u4E8C\u9009\u4E00\u3002' },
          pageid: { type: "integer", description: "\u9875\u9762 ID\uFF08\u6765\u81EA mcwiki_search \u7ED3\u679C\uFF09\u3002\u4E0E title \u4E8C\u9009\u4E00\u3002" },
          section: {
            type: "string",
            enum: ["intro", "full"],
            description: "intro=\u5F15\u8A00\u7EAF\u6587\u672C\uFF1Bfull=\u5168\u6587\u8F6C\u6362\u3002\u9ED8\u8BA4 intro\u3002"
          },
          format: {
            type: "string",
            enum: ["markdown", "text", "wikitext"],
            description: "full \u65F6\u7684\u8F93\u51FA\u683C\u5F0F\uFF1Amarkdown/text/wikitext\u3002\u9ED8\u8BA4 markdown\u3002"
          },
          maxChars: {
            type: "integer",
            description: "\u53EF\u9009\u8F93\u51FA\u4E0A\u9650\uFF08\u5B57\u7B26\uFF09\u30020 \u6216\u7F3A\u7701 = \u4E0D\u622A\u65AD\u3001\u5B8C\u6574\u8F93\u51FA\uFF1B\u4F20\u6B63\u6574\u6570\u624D\u622A\u65AD\uFF08\u5982\u4E0A\u4E0B\u6587\u7D27\u5F20\u65F6 20000\uFF09\u3002"
          }
        }
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: { type: "boolean", const: true },
            title: { type: "string" },
            pageid: { type: "integer" },
            url: { type: "string" },
            section: { type: "string" },
            format: { type: "string" },
            text: { type: "string" },
            updated: { type: "string" },
            truncated: { type: "boolean" }
          },
          required: ["success", "title", "pageid", "url", "section", "format", "text"]
        },
        render: (_args, value) => [{ type: "text", text: formatPage(value) }]
      },
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const config = getConfig();
        const section = args["section"] === "full" ? "full" : "intro";
        const rawFormat = args["format"];
        let format;
        if (section === "full") {
          if (rawFormat === void 0 || rawFormat === null || rawFormat === "") format = "markdown";
          else if (rawFormat === "markdown" || rawFormat === "text" || rawFormat === "wikitext")
            format = rawFormat;
          else throw new Error("format \u53EA\u80FD\u662F 'markdown'\u3001'text' \u6216 'wikitext'");
        } else {
          format = "text";
        }
        const pageid = optionalPageid(args["pageid"]);
        const title = pageid === void 0 ? requireTitle(args["title"]) : void 0;
        const requested = args["maxChars"] !== void 0 ? Number(args["maxChars"]) : NaN;
        const introMaxChars = Number.isFinite(requested) && requested > 0 ? requested : config.introMaxChars > 0 ? config.introMaxChars : void 0;
        const fullMaxChars = Number.isFinite(requested) && requested > 0 ? requested : config.maxChars > 0 ? config.maxChars : void 0;
        const common = {
          signal: exec !== void 0 ? exec.signal : void 0,
          timeoutMs: config.timeoutMs,
          ...title !== void 0 ? { title } : {},
          ...pageid !== void 0 ? { pageid } : {}
        };
        if (section === "intro") {
          const result = await fetchPageIntro({
            ...common,
            ...introMaxChars !== void 0 ? { maxChars: introMaxChars } : {}
          });
          const out2 = {
            success: true,
            title: result.title,
            pageid: result.pageid,
            url: result.url,
            section: "intro",
            format: "text",
            text: result.text,
            truncated: result.truncated
          };
          return out2;
        }
        const full = await fetchPageWikitext(common);
        if (format === "wikitext") {
          let text2 = full.wikitext;
          let truncated2 = false;
          if (fullMaxChars !== void 0 && text2.length > fullMaxChars) {
            text2 = `${text2.slice(0, fullMaxChars).trimEnd()}

\u2026\uFF08\u6E90\u7801\u8D85\u8FC7 ${fullMaxChars} \u5B57\u7B26\u4E0A\u9650\u5DF2\u622A\u65AD\uFF0C\u53EF\u4F20 maxChars=0 \u5173\u95ED\u622A\u65AD\uFF09`;
            truncated2 = true;
          }
          const out2 = {
            success: true,
            title: full.title,
            pageid: full.pageid,
            url: full.url,
            section: "full",
            format: "wikitext",
            text: text2,
            updated: full.updated,
            truncated: truncated2
          };
          return out2;
        }
        const converted = wikitextToMarkdown(
          full.wikitext,
          fullMaxChars === void 0 ? {} : { maxChars: fullMaxChars }
        );
        const plain = format === "text" ? markdownToPlainText(
          converted.markdown,
          fullMaxChars === void 0 ? {} : { maxChars: fullMaxChars }
        ) : void 0;
        const text = plain !== void 0 ? plain.text : converted.markdown;
        const truncated = plain !== void 0 ? plain.truncated : converted.truncated;
        const out = {
          success: true,
          title: full.title,
          pageid: full.pageid,
          url: full.url,
          section: "full",
          format,
          text,
          updated: full.updated,
          truncated
        };
        return out;
      }
    });
  } catch (e) {
    try {
      console.error(
        "[dshp-mcwiki-search] register mcwiki_get_page failed: " + String(e?.message ?? e)
      );
    } catch {
    }
  }
  try {
    ctx.tools.register({
      name: "mcwiki_random",
      description: "\u968F\u673A\u83B7\u53D6\u4E2D\u6587 Minecraft Wiki \u6761\u76EE\uFF08\u542B\u5F15\u8A00\u7EAF\u6587\u672C\uFF09\uFF0C\u9002\u5408\u63A2\u7D22\u672A\u77E5\u5185\u5BB9\u6216\u9A8C\u8BC1\u77E5\u8BC6\u5E93\u8986\u76D6\u3002",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", description: "\u8FD4\u56DE\u6761\u76EE\u6570\uFF0C1\u201310\uFF0C\u9ED8\u8BA4 3\u3002" }
        }
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            success: { type: "boolean", const: true },
            results: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  pageid: { type: "integer" },
                  url: { type: "string" },
                  text: { type: "string" }
                },
                required: ["title", "url"]
              }
            }
          },
          required: ["success", "results"]
        },
        render: (_args, value) => [{ type: "text", text: formatRandom(value) }]
      },
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const config = getConfig();
        return fetchRandomPages({
          signal: exec !== void 0 ? exec.signal : void 0,
          timeoutMs: config.timeoutMs,
          limit: intBetween(args["limit"], 3, 1, 10, "limit"),
          maxIntroChars: config.introMaxChars
        });
      }
    });
  } catch (e) {
    try {
      console.error(
        "[dshp-mcwiki-search] register mcwiki_random failed: " + String(e?.message ?? e)
      );
    } catch {
    }
  }
}

// src/host/index.ts
var name = "@dshp/mcwiki-search";
var inject = ["tools", "webServer"];
var Config = ConfigSchema;
function apply(ctx, config) {
  try {
    ctx.inject(["settings"], (sctx) => {
      sctx.effect(
        () => sctx.settings.configure({ auto: false }, ctx.fiber),
        "dshp-mcwiki-search: settings-page"
      );
    });
  } catch {
  }
  function getConfig() {
    return {
      timeoutMs: config.timeoutMs.get(),
      maxChars: config.maxChars.get(),
      introMaxChars: config.introMaxChars.get(),
      searchMaxResults: config.searchMaxResults.get()
    };
  }
  async function updateConfig(configPatch) {
    const settings = ctx.get("settings");
    if (!settings)
      throw new Error(
        "settings \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u6301\u4E45\u5316\u5230 profile \u6761\u76EE config\uFF08\u8BF7\u91CD\u542F DSH \u786E\u8BA4\u8BBE\u7F6E\u670D\u52A1\u5DF2\u6302\u8F7D\uFF09"
      );
    await settings.update(NS, configPatch);
  }
  registerTools(ctx, getConfig);
  registerRoutes(ctx, getConfig, updateConfig);
  try {
    registerCommand(ctx, getConfig);
  } catch (e) {
    try {
      console.error(
        "[dshp-mcwiki-search] register /mcwiki command failed: " + String(e?.message ?? e)
      );
    } catch {
    }
  }
  try {
    const systemPrompt = ctx.get("systemPrompt");
    if (systemPrompt !== void 0 && typeof systemPrompt.section === "function") {
      ctx.effect(
        () => systemPrompt.section({
          name: "tool:mcwiki",
          order: 112,
          text: "Minecraft Wiki \u67E5\u8BE2\u5DE5\u5177\uFF08mcwiki_search / mcwiki_get_page / mcwiki_random\uFF09\uFF1A\u67E5\u8BE2 Minecraft \u5B98\u65B9\u77E5\u8BC6\u5E93\uFF0C\u8FD4\u56DE\u5DF2\u6E05\u6D17\u7684 AI \u53EF\u8BFB\u6587\u672C\u3002\u641C\u5230\u7ED3\u679C\u540E\u5982\u9700\u8BE6\u60C5\uFF0C\u7528 mcwiki_get_page \u6293\u53D6\u9875\u9762\uFF1B\u5F15\u7528\u5185\u5BB9\u65F6\u9644\u4E0A\u9875\u9762 URL\u3002"
        }),
        "dshp-mcwiki-search: prompt section"
      );
    }
  } catch {
  }
}

export { Config, ConfigSchema, NS, apply, inject, name };
