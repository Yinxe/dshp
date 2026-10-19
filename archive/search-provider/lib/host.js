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
function methodIs(req, method) {
  return req.method === method;
}

// src/host/config.ts
var NS = settingsNamespace("dshp-search-provider");
var ROUTE_BASE = `/ext/${NS}`;
var MAX_RESULTS = 10;
var DEFAULT_MAX_RESULTS = 5;
function isRecord(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function clampInt(v, min, max) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < min || n > max) return void 0;
  return n;
}
function defaultProviderId(modules) {
  return modules[0]?.id ?? "tavily";
}
function buildConfigSchema(modules) {
  const defaults = defaultProviderId(modules);
  const shape = {
    provider: Schema.union(modules.map((m) => Schema.const(m.id))).default(defaults).volatile(),
    maxResults: Schema.number().step(1).min(1).max(MAX_RESULTS).default(DEFAULT_MAX_RESULTS).volatile()
  };
  for (const m of modules) shape[m.id] = m.configSchema.volatile();
  return Schema.object(shape);
}
function isKnownProvider(id, modules) {
  return typeof id === "string" && modules.some((m) => m.id === id);
}
function providerIds(modules) {
  return modules.map((m) => m.id).join(" / ");
}
function sanitizeRoutePatch(raw, modules) {
  if (!isRecord(raw)) throw new Error("\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON \u5BF9\u8C61");
  const out = {};
  if (Object.hasOwn(raw, "provider")) {
    if (!isKnownProvider(raw["provider"], modules)) {
      throw new Error(`provider \u975E\u6CD5\uFF0C\u5E94\u4E3A\u5DF2\u6CE8\u518C\u4F9B\u5E94\u5546\u4E4B\u4E00\uFF1A${providerIds(modules)}`);
    }
    out["provider"] = raw["provider"];
  }
  if (Object.hasOwn(raw, "maxResults")) {
    const n = clampInt(raw["maxResults"], 1, MAX_RESULTS);
    if (n === void 0) throw new Error(`maxResults \u975E\u6CD5\uFF0C\u5E94\u4E3A 1-${MAX_RESULTS} \u7684\u6574\u6570`);
    out["maxResults"] = n;
  }
  for (const m of modules) {
    if (!Object.hasOwn(raw, m.id)) continue;
    const block = m.sanitizePatch(raw[m.id]);
    if (block !== null) out[m.id] = block;
  }
  return out;
}
function snapshotConfig(config, modules) {
  const out = {
    provider: config.provider,
    maxResults: typeof config.maxResults === "number" ? config.maxResults : DEFAULT_MAX_RESULTS
  };
  for (const m of modules) out[m.id] = m.snapshot({ ...m.defaultConfig, ...readBlock(config, m.id) });
  return out;
}
function readBlock(config, providerId) {
  const raw = config[providerId];
  return isRecord(raw) ? raw : {};
}

// src/host/providers/base.ts
function isRecord2(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function numOrNull(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function strOrEmpty(v) {
  return typeof v === "string" ? v : "";
}
function extractApiDetail(parsed, fallback) {
  if (isRecord2(parsed)) {
    const d = parsed["detail"];
    if (isRecord2(d) && typeof d["error"] === "string" && d["error"].length > 0) return d["error"];
    for (const k of ["error", "message"]) {
      const v = parsed[k];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return fallback;
}
var PROVIDER_ID_RE = /^[a-z0-9][a-z0-9-]{1,30}$/;
var CRED_REF_RE = /^[A-Z][A-Z0-9_]{2,63}$/;
function checkModuleShape(m) {
  if (!isRecord2(m)) return "\u6A21\u5757\u4E3A\u7A7A";
  const id = m["id"];
  if (typeof id !== "string" || !PROVIDER_ID_RE.test(id)) return `id \u975E\u6CD5\uFF08${String(id)}\uFF09`;
  for (const key of ["label", "title", "homepage", "description"]) {
    const v = m[key];
    if (typeof v !== "string" || v.length === 0) return `\u4F9B\u5E94\u5546 ${id} \u7F3A\u5C11 ${key}`;
  }
  const ref = m["credentialRef"];
  if (typeof ref !== "string" || !CRED_REF_RE.test(ref))
    return `\u4F9B\u5E94\u5546 ${id} \u7684 credentialRef \u975E\u6CD5\uFF08${String(ref)}\uFF09`;
  if (!Array.isArray(m["fields"])) return `\u4F9B\u5E94\u5546 ${id} \u7F3A\u5C11 fields \u6570\u7EC4`;
  if (!isRecord2(m["defaultConfig"])) return `\u4F9B\u5E94\u5546 ${id} \u7F3A\u5C11 defaultConfig \u5BF9\u8C61`;
  if (m["configSchema"] === void 0) return `\u4F9B\u5E94\u5546 ${id} \u7F3A\u5C11 configSchema`;
  for (const key of ["sanitizePatch", "snapshot", "search", "stateExtras"]) {
    if (typeof m[key] !== "function") return `\u4F9B\u5E94\u5546 ${id} \u7F3A\u5C11 ${key}()`;
  }
  return "";
}
function createWebSearchProvider(module, deps) {
  return {
    id: module.id,
    available() {
      return true;
    },
    search(request, signal) {
      return module.search(deps, request, signal);
    }
  };
}
function registerExactRoute(ctx, path, label, handler) {
  try {
    ctx.effect(
      () => ctx.webServer.register({
        kind: "exact",
        path,
        handler: async (req, res) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
          return handler(req, res);
        }
      }),
      label
    );
  } catch (error) {
    try {
      console.warn(
        `[dshp-search-provider] \u6CE8\u518C\u8DEF\u7531 ${path} \u5931\u8D25\uFF1A${String(error?.message ?? error)}`
      );
    } catch {
    }
  }
}
async function readJsonObject(req) {
  try {
    const parsed = JSON.parse(await readBody(req) || "{}");
    if (!isRecord2(parsed)) return { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON \u5BF9\u8C61" };
    return { ok: true, value: parsed };
  } catch (error) {
    const message = String(error?.message ?? error);
    if (message === "payload-too-large") return { ok: false, error: "\u8BF7\u6C42\u4F53\u8D85\u8FC7 1MB \u4E0A\u9650" };
    return { ok: false, error: "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON" };
  }
}

// src/host/providers/tavily.ts
var ID = "tavily";
var ENDPOINT = "https://api.tavily.com/search";
var USAGE_ENDPOINT = "https://api.tavily.com/usage";
var USAGE_CACHE_TTL_MS = 60 * 1e3;
var MAX_RESULTS2 = 10;
var CRED_REF = "TAVILY_API_KEY";
var CONFIG_SCHEMA = Schema.object({
  searchDepth: Schema.union([Schema.const("basic"), Schema.const("advanced")]).default("basic")
});
var FIELDS = [
  {
    key: "searchDepth",
    label: "\u641C\u7D22\u6DF1\u5EA6",
    kind: "select",
    options: [
      { value: "basic", label: "basic\uFF081 credit/\u6B21 \xB7 \u5FEB\uFF09" },
      { value: "advanced", label: "advanced\uFF082 credits/\u6B21 \xB7 \u5168\uFF09" }
    ],
    hint: "\u6309\u6B21\u8BA1\u8D39\uFF1Abasic 1 credit/\u6B21\uFF0Cadvanced 2 credits/\u6B21\uFF08\u8986\u76D6\u66F4\u591A\u6765\u6E90\uFF09\u3002"
  }
];
function sanitizeUsagePayload(parsed) {
  const pickCounts = (src) => {
    const s = isRecord2(src) ? src : {};
    const limit = s["limit"];
    return {
      usage: numOrNull(s["usage"]),
      limit: Object.hasOwn(s, "limit") && limit === null ? null : numOrNull(limit),
      search_usage: numOrNull(s["search_usage"]),
      extract_usage: numOrNull(s["extract_usage"]),
      crawl_usage: numOrNull(s["crawl_usage"]),
      map_usage: numOrNull(s["map_usage"]),
      research_usage: numOrNull(s["research_usage"])
    };
  };
  const keyRaw = isRecord2(parsed["key"]) ? parsed["key"] : {};
  const key = pickCounts(keyRaw);
  const acc = isRecord2(parsed["account"]) ? parsed["account"] : {};
  const accLimit = acc["plan_limit"];
  const account = {
    current_plan: strOrEmpty(acc["current_plan"]),
    plan_usage: numOrNull(acc["plan_usage"]),
    plan_limit: Object.hasOwn(acc, "plan_limit") && accLimit === null ? null : numOrNull(accLimit),
    paygo_usage: numOrNull(acc["paygo_usage"]),
    paygo_limit: numOrNull(acc["paygo_limit"]),
    search_usage: numOrNull(acc["search_usage"]),
    extract_usage: numOrNull(acc["extract_usage"]),
    crawl_usage: numOrNull(acc["crawl_usage"]),
    map_usage: numOrNull(acc["map_usage"]),
    research_usage: numOrNull(acc["research_usage"])
  };
  return { key, account };
}
function createTavilyModule() {
  let usageCache = null;
  async function fetchUsage(deps) {
    const key = await deps.resolveKey(CRED_REF);
    if (key === void 0) {
      throw new Error(
        "Tavily \u7528\u91CF\u67E5\u8BE2\u7F3A\u5C11 API Key\u300CTAVILY_API_KEY\u300D\uFF1A\u8BF7\u6253\u5F00 \u8BBE\u7F6E \u2192 AI \u641C\u7D22 \u914D\u7F6E\u5BC6\u94A5\u540E\u91CD\u8BD5\u3002"
      );
    }
    const headers = { accept: "application/json", authorization: `Bearer ${key}` };
    let response;
    try {
      response = await fetch(USAGE_ENDPOINT, { method: "GET", headers });
    } catch (error) {
      throw new Error(`Tavily usage \u8BF7\u6C42\u5931\u8D25\uFF1A${String(error?.message ?? error)}`, {
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
      const detail = extractApiDetail(parsed, `HTTP ${response.status}`);
      if (response.status === 401) throw new Error(`Tavily API Key \u65E0\u6548\u6216\u7F3A\u5931\uFF08401\uFF09\uFF1A${detail}`);
      if (response.status === 429) {
        throw new Error(
          `Tavily usage \u8BF7\u6C42\u88AB\u9650\u6D41\uFF08429\uFF0C10 \u5206\u949F\u6700\u591A 10 \u6B21\uFF09\uFF1A${detail}\u3002\u5DF2\u505A 60 \u79D2\u670D\u52A1\u7AEF\u7F13\u5B58\uFF0C\u8BF7\u7A0D\u540E\u70B9\u201C\u5237\u65B0\u7528\u91CF\u201D\u91CD\u8BD5\u3002`
        );
      }
      throw new Error(`Tavily usage \u67E5\u8BE2\u5931\u8D25\uFF1A${detail}`);
    }
    if (!isRecord2(parsed) || !isRecord2(parsed["key"]) || !isRecord2(parsed["account"])) {
      throw new Error("Tavily usage \u8FD4\u56DE\u4E86\u672A\u77E5\u54CD\u5E94");
    }
    return sanitizeUsagePayload(parsed);
  }
  async function getUsageCached(deps, { force = false } = {}) {
    const now = Date.now();
    const hit = usageCache !== null && !force && now - usageCache.fetchedAt < USAGE_CACHE_TTL_MS;
    if (hit && usageCache !== null) return { ...usageCache, cached: true };
    const usage = await fetchUsage(deps);
    usageCache = { usage, fetchedAt: now };
    return { ...usageCache, cached: false };
  }
  async function search(deps, request, signal) {
    const key = await deps.resolveKey(CRED_REF);
    if (key === void 0) {
      throw new Error("Tavily \u641C\u7D22\u7F3A\u5C11 API Key\u300CTAVILY_API_KEY\u300D\uFF1A\u8BF7\u6253\u5F00 \u8BBE\u7F6E \u2192 AI \u641C\u7D22 \u914D\u7F6E\u5BC6\u94A5\u540E\u91CD\u8BD5\u3002");
    }
    const global = deps.getConfig();
    const cfg = deps.providerConfig(ID);
    const fallbackMax = typeof global.maxResults === "number" && global.maxResults >= 1 ? Math.min(global.maxResults, MAX_RESULTS2) : 5;
    const maxResults = Math.min(
      Math.max(Math.floor(Number(request.maxResults)) || fallbackMax, 1),
      MAX_RESULTS2
    );
    const searchDepth = cfg["searchDepth"] === "advanced" ? "advanced" : "basic";
    const body = JSON.stringify({
      api_key: key,
      query: request.query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_answer: false
    });
    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body,
        ...signal === void 0 ? {} : { signal }
      });
    } catch (error) {
      if (signal !== void 0 && signal.aborted) {
        const err = new Error("Tavily \u641C\u7D22\u5DF2\u53D6\u6D88");
        err.name = "AbortError";
        throw err;
      }
      throw new Error(`Tavily \u8BF7\u6C42\u5931\u8D25\uFF1A${String(error?.message ?? error)}`, { cause: error });
    }
    try {
      const parsed = await response.json();
      if (!response.ok) {
        const detail = extractApiDetail(parsed, `HTTP ${response.status}`);
        throw new Error(`Tavily API \u9519\u8BEF\uFF1A${detail}`);
      }
      if (!isRecord2(parsed) || !Array.isArray(parsed["results"])) {
        throw new Error("Tavily \u8FD4\u56DE\u4E86\u672A\u77E5\u54CD\u5E94");
      }
      const sources = [];
      for (const item of parsed["results"]) {
        if (!isRecord2(item) || typeof item["url"] !== "string" || item["url"].length === 0) continue;
        const source = { url: item["url"] };
        if (typeof item["title"] === "string" && item["title"].length > 0) source.title = item["title"];
        if (typeof item["content"] === "string" && item["content"].length > 0)
          source.snippet = item["content"];
        if (typeof item["published_date"] === "string" && item["published_date"].length > 0) {
          source.publishedAt = item["published_date"];
        }
        sources.push(source);
      }
      return { sources, truncated: false };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Tavily")) throw error;
      throw new Error(`Tavily \u8FD4\u56DE\u4E86\u65E0\u6CD5\u89E3\u6790\u7684\u54CD\u5E94\uFF1A${String(error?.message ?? error)}`, {
        cause: error
      });
    }
  }
  function registerRoutes2(deps) {
    registerExactRoute(
      deps.ctx,
      `${ROUTE_BASE}/${ID}/usage`,
      "dshp-search-provider: tavily usage route",
      async (req, res) => {
        if (!methodIs(req, "GET")) return json(res, 405, { ok: false, error: "method not allowed" });
        const startedAt = Date.now();
        let force = false;
        try {
          const u = new URL(String(req.url ?? "/"), "http://localhost");
          const f = u.searchParams.get("force");
          force = f === "1" || f === "true";
        } catch {
        }
        try {
          const snap = await getUsageCached(deps, { force });
          return json(res, 200, {
            ok: true,
            usage: snap.usage,
            cached: snap.cached,
            fetchedAt: snap.fetchedAt,
            takenMs: Date.now() - startedAt
          });
        } catch (error) {
          const stale = usageCache !== null ? { usage: usageCache.usage, fetchedAt: usageCache.fetchedAt } : null;
          return json(res, 200, {
            ok: false,
            error: String(error?.message ?? error),
            takenMs: Date.now() - startedAt,
            ...stale !== null ? { stale } : {}
          });
        }
      }
    );
  }
  return {
    id: ID,
    label: "Tavily",
    title: "Tavily AI \u641C\u7D22",
    credentialRef: CRED_REF,
    homepage: "https://docs.tavily.com/documentation/api-reference/endpoint/usage",
    description: "Tavily \u641C\u7D22 API\uFF1A\u6309 credits \u8BA1\u8D39\uFF0Cbasic/advanced \u4E24\u6863\u6DF1\u5EA6\u3002",
    fields: FIELDS,
    defaultConfig: { searchDepth: "basic" },
    configSchema: CONFIG_SCHEMA,
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
    search,
    registerRoutes: registerRoutes2,
    async stateExtras() {
      return {
        usageMeta: {
          endpoint: "GET https://api.tavily.com/usage",
          cacheTtlMs: USAGE_CACHE_TTL_MS,
          rateLimit: "10 req / 10min\uFF08\u5F00\u53D1\u4E0E\u751F\u4EA7\u4E00\u81F4\uFF09",
          billing: "\u6309 credits \u8BA1\uFF1Abasic \u641C\u7D22 1/\u6B21\u3001advanced 2/\u6B21",
          hasCache: usageCache !== null,
          fetchedAt: usageCache !== null ? usageCache.fetchedAt : null
        }
      };
    }
  };
}

// src/host/providers/index.ts
function createProviderModules() {
  const modules = [createTavilyModule()];
  const seen = /* @__PURE__ */ new Set();
  for (const m of modules) {
    const err = checkModuleShape(m);
    if (err.length > 0) throw new Error(`[dshp-search-provider] \u975E\u6CD5\u4F9B\u5E94\u5546\u6A21\u5757\uFF1A${err}`);
    if (seen.has(m.id)) throw new Error(`[dshp-search-provider] \u4F9B\u5E94\u5546 id \u91CD\u590D\uFF1A${m.id}`);
    seen.add(m.id);
  }
  return modules;
}

// src/host/routes.ts
async function credentialState(ctx, ref) {
  const creds = ctx.get("credentials");
  if (creds === void 0) return { configured: false };
  try {
    const info = await creds.describe(ref);
    const configured = info?.configured === true;
    const source = typeof info?.source === "string" ? info.source : void 0;
    return source !== void 0 ? { configured, source } : { configured };
  } catch {
    return { configured: false };
  }
}
function selectionHintOf(config, selected, registered) {
  if (selected !== null && selected !== registered) {
    return `profile patch \u56FA\u5B9A\u4E86 web.searchProvider: ${selected}\uFF0C\u4F46\u63D2\u4EF6\u5F53\u524D\u53EA\u6CE8\u518C\u4E86\u300C${registered ?? "\u65E0"}\u300D\uFF08settings \u91CC\u9009\u7684\u662F ${config.provider}\uFF09\uFF0C\u641C\u7D22\u4F1A\u62A5 WEB_PROVIDER_CONFIGURED_MISSING\u3002\u60F3\u5B8C\u5168\u7531\u8BBE\u7F6E\u9875\u52A8\u6001\u5207\u6362\uFF1A\u5220\u9664 cordis.patch.yml \u91CC web \u6761\u76EE\u7684 searchProvider \u4E00\u884C\uFF0C\u91CD\u542F dsh web \u540E\u751F\u6548\u3002`;
  }
  return void 0;
}
async function stateResponse(deps) {
  const config = deps.getConfig();
  const selected = deps.selectedProviderId();
  const registered = deps.registeredProviderId();
  const providers = [];
  for (const m of deps.modules) {
    const cred = await credentialState(deps.ctx, m.credentialRef);
    providers.push({
      id: m.id,
      label: m.label,
      title: m.title,
      credentialRef: m.credentialRef,
      homepage: m.homepage,
      description: m.description,
      fields: m.fields,
      configured: cred.configured,
      ...cred.source !== void 0 ? { source: cred.source } : {},
      selected: registered === m.id
    });
  }
  const extras = {};
  for (const m of deps.modules) {
    try {
      extras[m.id] = await m.stateExtras(deps.providerDeps);
    } catch (error) {
      extras[m.id] = { error: String(error?.message ?? error) };
    }
  }
  const hint = selectionHintOf(config, selected, registered);
  return {
    ok: true,
    namespace: NS,
    selectedProviderId: selected,
    registeredProviderId: registered,
    providers,
    config: snapshotConfig(config, deps.modules),
    extras,
    ...hint !== void 0 ? { selectionHint: hint } : {}
  };
}
function registerRoutes(deps) {
  const base = `/ext/${NS}`;
  register(deps.ctx, `${base}/state`, "dshp-search-provider: state route", async (req, res) => {
    if (!methodIs(req, "GET")) return json(res, 405, { ok: false, error: "method not allowed" });
    try {
      return json(res, 200, await stateResponse(deps));
    } catch (error) {
      return json(res, 200, { ok: false, error: String(error?.message ?? error) });
    }
  });
  register(deps.ctx, `${base}/config`, "dshp-search-provider: config route", async (req, res) => {
    if (!methodIs(req, "POST")) return json(res, 405, { ok: false, error: "method not allowed" });
    const body = await readJsonObject(req);
    if (!body.ok) return json(res, 200, { ok: false, error: body.error });
    try {
      const patch = sanitizeRoutePatch(body.value, deps.modules);
      if (Object.keys(patch).length > 0) await deps.updateConfig(patch);
      return json(res, 200, { ok: true, config: snapshotConfig(deps.getConfig(), deps.modules) });
    } catch (error) {
      return json(res, 200, { ok: false, error: String(error?.message ?? error) });
    }
  });
  register(deps.ctx, `${base}/test`, "dshp-search-provider: test route", async (req, res) => {
    if (!methodIs(req, "POST")) return json(res, 405, { ok: false, error: "method not allowed" });
    const startedAt = Date.now();
    const body = await readJsonObject(req);
    if (!body.ok) return json(res, 200, { ok: false, error: body.error, takenMs: Date.now() - startedAt });
    const config = deps.getConfig();
    const wanted = typeof body.value["provider"] === "string" ? body.value["provider"] : config.provider;
    const module = deps.modules.find((m) => m.id === wanted);
    if (module === void 0) {
      return json(res, 200, {
        ok: false,
        error: `\u672A\u77E5\u63D0\u4F9B\u65B9\u300C${wanted}\u300D\uFF0C\u53EF\u9009\uFF1A${deps.modules.map((m) => m.id).join(" / ")}`,
        takenMs: Date.now() - startedAt
      });
    }
    const query = typeof body.value["query"] === "string" ? body.value["query"].trim() : "";
    if (query.length === 0) {
      return json(res, 200, { ok: false, error: "\u8BF7\u8F93\u5165\u6D4B\u8BD5\u67E5\u8BE2", takenMs: Date.now() - startedAt });
    }
    try {
      const result = await module.search(deps.providerDeps, { query, maxResults: config.maxResults });
      return json(res, 200, {
        ok: true,
        provider: module.id,
        sources: result.sources,
        takenMs: Date.now() - startedAt
      });
    } catch (error) {
      return json(res, 200, {
        ok: false,
        provider: module.id,
        error: String(error?.message ?? error),
        takenMs: Date.now() - startedAt
      });
    }
  });
}
function register(ctx, path, label, handler) {
  try {
    ctx.effect(
      () => ctx.webServer.register({
        kind: "exact",
        path,
        handler: async (req, res) => {
          if (!sameOrigin(req)) return json(res, 403, { ok: false, error: "forbidden" });
          return handler(req, res);
        }
      }),
      label
    );
  } catch (error) {
    try {
      console.warn(
        `[dshp-search-provider] \u6CE8\u518C\u8DEF\u7531 ${path} \u5931\u8D25\uFF1A${String(error?.message ?? error)}`
      );
    } catch {
    }
  }
}

// src/host/index.ts
var name = "@dshp/search-provider";
var inject = ["web", "webServer"];
var ConfigSchema = buildConfigSchema(createProviderModules());
var Config = ConfigSchema;
function isRecord3(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function apply(ctx, config) {
  const modules = createProviderModules();
  function getConfig() {
    const out = {
      provider: config.provider.get(),
      maxResults: config.maxResults.get()
    };
    for (const m of modules) {
      const block = config[m.id]?.get();
      out[m.id] = isRecord3(block) ? { ...m.defaultConfig, ...block } : { ...m.defaultConfig };
    }
    return out;
  }
  async function updateConfig(configPatch) {
    const settings = ctx.get("settings");
    if (!settings) {
      throw new Error(
        "settings \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u6301\u4E45\u5316\u5230 profile \u6761\u76EE config\uFF08\u8BF7\u91CD\u542F DSH \u786E\u8BA4\u8BBE\u7F6E\u670D\u52A1\u5DF2\u6302\u8F7D\uFF09"
      );
    }
    await settings.update(NS, configPatch);
  }
  const providerDeps = {
    ctx,
    async resolveKey(credentialRef) {
      const creds = ctx.get("credentials");
      if (creds === void 0) return void 0;
      try {
        const resolved = await creds.resolve(credentialRef);
        const value = resolved?.value;
        return typeof value === "string" && value.length > 0 ? value : void 0;
      } catch {
        return void 0;
      }
    },
    getConfig,
    providerConfig(providerId) {
      const module = modules.find((m) => m.id === providerId);
      const defaults = module !== void 0 ? module.defaultConfig : {};
      return { ...defaults, ...readBlock(getConfig(), providerId) };
    },
    updateConfig
  };
  let registeredId = null;
  let disposeRegistered = null;
  let registerAttempts = 0;
  function registerActiveProvider() {
    const id = getConfig().provider;
    if (registeredId === id && id !== null) return;
    if (disposeRegistered !== null) {
      try {
        disposeRegistered();
      } catch {
      }
      disposeRegistered = null;
      registeredId = null;
    }
    const module = modules.find((m) => m.id === id);
    if (module === void 0) {
      try {
        console.warn(`[dshp-search-provider] settings \u91CC\u9009\u4E86\u672A\u77E5\u63D0\u4F9B\u65B9\u300C${id}\u300D\uFF0C\u672A\u6CE8\u518C\u4EFB\u4F55\u63D0\u4F9B\u65B9`);
      } catch {
      }
      return;
    }
    try {
      disposeRegistered = ctx.web.registerSearchProvider(createWebSearchProvider(module, providerDeps));
      registeredId = id;
      try {
        console.info(`[dshp-search-provider] \u5DF2\u6CE8\u518C\u63D0\u4F9B\u65B9\u300C${id}\u300D\uFF0C\u641C\u7D22\u5373\u65F6\u8D70\u8BE5\u63D0\u4F9B\u65B9`);
      } catch {
      }
    } catch (error) {
      registerAttempts += 1;
      if (registerAttempts <= 3) {
        try {
          console.warn(
            `[dshp-search-provider] \u6CE8\u518C\u63D0\u4F9B\u65B9\u300C${id}\u300D\u5931\u8D25\uFF08\u82E5\u65E7\u63D2\u4EF6 @dshp-inx/tavily-search \u4ECD\u88C5\u7740\u8BF7\u5148\u79FB\u9664\uFF09\uFF1A${String(
              error?.message ?? error
            )}`
          );
        } catch {
        }
      }
    }
  }
  try {
    ctx.inject(["settings"], (sctx) => {
      try {
        sctx.effect(
          () => sctx.settings.configure({ auto: false }, ctx.fiber),
          "dshp-search-provider: settings-page"
        );
      } catch (error) {
        try {
          console.warn(
            `[dshp-search-provider] settings \u9875\u9762\u7B56\u7565\u6CE8\u518C\u5931\u8D25\uFF1A${String(error?.message ?? error)}`
          );
        } catch {
        }
      }
    });
  } catch (error) {
    try {
      console.warn(
        `[dshp-search-provider] settings \u6BB5\u6CE8\u518C\u5931\u8D25\uFF1A${String(error?.message ?? error)}`
      );
    } catch {
    }
  }
  ctx.effect(
    () => ctx.on("loader/volatile-update", () => {
      try {
        registerActiveProvider();
      } catch {
      }
    }),
    "dshp-search-provider: provider switch on volatile update"
  );
  for (const m of modules) {
    if (typeof m.registerRoutes === "function") {
      try {
        m.registerRoutes(providerDeps);
      } catch (error) {
        try {
          console.warn(
            `[dshp-search-provider] \u63D0\u4F9B\u65B9\u300C${m.id}\u300D\u4E13\u5C5E\u8DEF\u7531\u6CE8\u518C\u5931\u8D25\uFF1A${String(error?.message ?? error)}`
          );
        } catch {
        }
      }
    }
  }
  ctx.effect(() => {
    registerActiveProvider();
    return () => {
      if (disposeRegistered !== null) {
        try {
          disposeRegistered();
        } catch {
        }
        disposeRegistered = null;
        registeredId = null;
      }
    };
  }, "dshp-search-provider: active provider registration");
  registerRoutes({
    ctx,
    modules,
    getConfig,
    updateConfig,
    providerDeps,
    selectedProviderId() {
      const web = ctx.get("web");
      const id = web?.searchProviderId;
      return typeof id === "string" && id.length > 0 ? id : null;
    },
    registeredProviderId() {
      return registeredId;
    }
  });
  try {
    console.info(`[dshp-search-provider] \u52A8\u6001\u9009\u578B\u5C31\u7EEA\uFF1A\u5F53\u524D\u63D0\u4F9B\u65B9 ${registeredId ?? "\uFF08\u672A\u6CE8\u518C\uFF09"}`);
  } catch {
  }
}

export { Config, ConfigSchema, NS, apply, inject, name };
