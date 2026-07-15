var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-HgXlqV/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout2) => this.#layout = layout2;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "_Hono");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "_Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = /* @__PURE__ */ __name(class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "_Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = /* @__PURE__ */ __name((value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}, "trimCookieWhitespace");
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) {
      continue;
    }
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = cookieValue.indexOf("%") !== -1 ? tryDecode(cookieValue, decodeURIComponent_) : cookieValue;
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) {
    throw new Error("Invalid cookie name");
  }
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path", "sameSite", "priority"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var generateCookie = /* @__PURE__ */ __name((name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
}, "generateCookie");
var setCookie = /* @__PURE__ */ __name((c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
}, "setCookie");
var deleteCookie = /* @__PURE__ */ __name((c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
}, "deleteCookie");

// src/auth.ts
var PBKDF2_ITERATIONS = 1e5;
var PBKDF2_HASH = "SHA-256";
var KEY_LENGTH_BITS = 256;
function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}
__name(fromHex, "fromHex");
function randomSaltHex() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}
__name(randomSaltHex, "randomSaltHex");
async function deriveHash(password, saltHex) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH
    },
    keyMaterial,
    KEY_LENGTH_BITS
  );
  return toHex(derived);
}
__name(deriveHash, "deriveHash");
async function hashPassword(password) {
  const salt = randomSaltHex();
  const hash = await deriveHash(password, salt);
  return { hash, salt };
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash, salt) {
  const candidate = await deriveHash(password, salt);
  if (candidate.length !== hash.length)
    return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}
__name(verifyPassword, "verifyPassword");
function base64UrlEncode(data) {
  let bytes;
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = new Uint8Array(data);
  }
  let binary = "";
  for (const b of bytes)
    binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "===".slice((padded.length + 3) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}
__name(base64UrlDecode, "base64UrlDecode");
async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(hmacKey, "hmacKey");
async function signSession(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64UrlEncode(JSON.stringify(header));
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput));
  const signaturePart = base64UrlEncode(signature);
  return `${signingInput}.${signaturePart}`;
}
__name(signSession, "signSession");
async function verifySession(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3)
    return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const signingInput = `${headerPart}.${payloadPart}`;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signaturePart),
    new TextEncoder().encode(signingInput)
  );
  if (!valid)
    return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart)));
    if (payload.exp < Math.floor(Date.now() / 1e3))
      return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifySession, "verifySession");
var SESSION_COOKIE_NAME = "surikata_session";
var SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

// src/middleware/session.ts
async function loadSession(c, next) {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (token) {
    const payload = await verifySession(token, c.env.JWT_SECRET);
    if (payload) {
      c.set("user", { id: payload.uid, username: payload.username });
    }
  }
  await next();
}
__name(loadSession, "loadSession");
async function requireAuthSmart(c, next) {
  const user = c.get("user");
  if (user)
    return next();
  const path = c.req.path;
  const isApi = path.startsWith("/articles/") || path.startsWith("/admin/feeds/");
  if (isApi) {
    return c.json({ error: "unauthorized" }, 401);
  }
  return c.redirect("/login");
}
__name(requireAuthSmart, "requireAuthSmart");

// src/views/layout.ts
function layout(opts) {
  const { title, activeNav, username, bodyHtml, extraHead } = opts;
  const nav = username ? `
    <nav class="hidden md:flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white sticky top-0 z-20">
      <a href="/" class="text-lg font-semibold tracking-tight text-gray-900">Surikata</a>
      <div class="flex items-center gap-4 text-sm">
        <a href="/" class="${activeNav === "home" ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900"}">Feed</a>
        <a href="/admin" class="${activeNav === "admin" ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-900"}">Manage Sources</a>
        <span class="text-gray-400">${username}</span>
        <form method="post" action="/logout"><button class="text-gray-500 hover:text-gray-900">Logout</button></form>
      </div>
    </nav>
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex items-stretch justify-around" style="padding-bottom: env(safe-area-inset-bottom)">
      <a href="/" class="flex-1 flex flex-col items-center justify-center py-2.5 text-xs ${activeNav === "home" ? "text-gray-900" : "text-gray-400"}">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>
        <span class="mt-0.5">Feed</span>
      </a>
      <a href="/admin" class="flex-1 flex flex-col items-center justify-center py-2.5 text-xs ${activeNav === "admin" ? "text-gray-900" : "text-gray-400"}">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>
        <span class="mt-0.5">Sources</span>
      </a>
      <form method="post" action="/logout" class="flex-1">
        <button type="submit" class="w-full h-full flex flex-col items-center justify-center py-2.5 text-xs text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span class="mt-0.5">Logout</span>
        </button>
      </form>
    </nav>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${title} \xB7 Surikata</title>
  <link rel="stylesheet" href="/styles.css" />
  ${extraHead || ""}
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen ${username ? "pb-16 md:pb-0" : ""}">
  ${nav}
  <main class="max-w-2xl mx-auto w-full">
    ${bodyHtml}
  </main>
  <script src="/app.js"><\/script>
</body>
</html>`;
}
__name(layout, "layout");

// src/routes/auth.ts
var authRoutes = new Hono2();
function isHttps(c) {
  return c.req.url.startsWith("https://");
}
__name(isHttps, "isHttps");
function loginPage(error, mode = "login") {
  return layout({
    title: "Log in",
    bodyHtml: `
      <div class="min-h-screen flex items-center justify-center px-4">
        <div class="w-full max-w-sm">
          <h1 class="text-2xl font-semibold text-center mb-1 tracking-tight">Surikata</h1>
          <p class="text-center text-gray-500 text-sm mb-6">Your minimalist RSS reader</p>

          ${error ? `<div class="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">${error}</div>` : ""}

          <div class="flex mb-6 rounded-lg bg-gray-100 p-1 text-sm font-medium">
            <button type="button" data-tab="login" class="tab-btn flex-1 py-2 rounded-md ${mode === "login" ? "bg-white shadow text-gray-900" : "text-gray-500"}">Log in</button>
            <button type="button" data-tab="register" class="tab-btn flex-1 py-2 rounded-md ${mode === "register" ? "bg-white shadow text-gray-900" : "text-gray-500"}">Register</button>
          </div>

          <form id="login-form" method="post" action="/login" class="space-y-3 ${mode === "register" ? "hidden" : ""}">
            <input name="username" placeholder="Username" required autocomplete="username"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
            <div class="relative">
              <input name="password" type="password" placeholder="Password" required autocomplete="current-password"
                class="password-input w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
              <button type="button" class="toggle-password absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400" aria-label="Show password">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Log in</button>
          </form>

          <form id="register-form" method="post" action="/register" class="space-y-3 ${mode === "login" ? "hidden" : ""}">
            <input name="username" placeholder="Username" required autocomplete="username"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
            <div class="relative">
              <input id="register-password" name="password" type="password" placeholder="Password (min 8 chars)" required minlength="8" autocomplete="new-password"
                class="password-input w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
              <button type="button" class="toggle-password absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400" aria-label="Show password">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <div class="relative">
              <input id="register-confirm-password" name="confirm_password" type="password" placeholder="Confirm password" required minlength="8" autocomplete="new-password"
                class="password-input w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
              <button type="button" class="toggle-password absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400" aria-label="Show password">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <p id="register-password-error" class="text-sm text-red-600 hidden">Passwords do not match.</p>
            <button type="submit" class="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Create account</button>
          </form>
        </div>
      </div>
      <script>
        document.querySelectorAll('.tab-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
            document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
            document.querySelectorAll('.tab-btn').forEach((b) => {
              b.classList.toggle('bg-white', b === btn);
              b.classList.toggle('shadow', b === btn);
              b.classList.toggle('text-gray-900', b === btn);
              b.classList.toggle('text-gray-500', b !== btn);
            });
          });
        });

        document.querySelectorAll('.toggle-password').forEach((btn) => {
          btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            btn.classList.toggle('text-gray-900', !showing);
            btn.classList.toggle('text-gray-400', showing);
          });
        });

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
          const pw = document.getElementById('register-password');
          const confirmPw = document.getElementById('register-confirm-password');
          const errorEl = document.getElementById('register-password-error');
          registerForm.addEventListener('submit', (e) => {
            if (pw.value !== confirmPw.value) {
              e.preventDefault();
              errorEl.classList.remove('hidden');
              confirmPw.focus();
            } else {
              errorEl.classList.add('hidden');
            }
          });
          confirmPw.addEventListener('input', () => {
            errorEl.classList.toggle('hidden', pw.value === confirmPw.value);
          });
        }
      <\/script>
    `
  });
}
__name(loginPage, "loginPage");
authRoutes.get("/login", (c) => {
  const user = c.get("user");
  if (user)
    return c.redirect("/");
  return c.html(loginPage());
});
authRoutes.post("/login", async (c) => {
  const body = await c.req.parseBody();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) {
    return c.html(loginPage("Username and password are required."), 400);
  }
  const row = await c.env.DB.prepare(
    "SELECT id, username, password_hash, password_salt FROM users WHERE username = ?"
  ).bind(username).first();
  if (!row) {
    return c.html(loginPage("Invalid username or password."), 401);
  }
  const valid = await verifyPassword(password, row.password_hash, row.password_salt);
  if (!valid) {
    return c.html(loginPage("Invalid username or password."), 401);
  }
  const token = await signSession(
    { uid: row.id, username: row.username, exp: Math.floor(Date.now() / 1e3) + SESSION_TTL_SECONDS },
    c.env.JWT_SECRET
  );
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
  return c.redirect("/");
});
authRoutes.post("/register", async (c) => {
  const body = await c.req.parseBody();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirm_password || "");
  if (!username || password.length < 8) {
    return c.html(loginPage("Username required; password must be at least 8 characters.", "register"), 400);
  }
  if (password !== confirmPassword) {
    return c.html(loginPage("Passwords do not match.", "register"), 400);
  }
  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (existing) {
    return c.html(loginPage("That username is already taken.", "register"), 409);
  }
  const { hash, salt } = await hashPassword(password);
  const result = await c.env.DB.prepare(
    "INSERT INTO users (username, password_hash, password_salt) VALUES (?, ?, ?)"
  ).bind(username, hash, salt).run();
  const userId = result.meta.last_row_id;
  const token = await signSession(
    { uid: userId, username, exp: Math.floor(Date.now() / 1e3) + SESSION_TTL_SECONDS },
    c.env.JWT_SECRET
  );
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps(c),
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
  return c.redirect("/");
});
authRoutes.post("/logout", (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
  return c.redirect("/login");
});

// src/views/article-card.ts
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escapeHtml, "escapeHtml");
function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, "&#39;");
}
__name(escapeAttr, "escapeAttr");
function renderArticleCard(a) {
  const opacityClass = a.isRead ? "opacity-50" : "";
  return `
    <article class="article-card border border-gray-200 rounded-xl p-4 bg-white ${opacityClass}" data-link="${escapeAttr(a.link)}">
      <div class="flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-500 mb-1">${escapeHtml(a.sourceName)}</div>
          <a href="${escapeAttr(a.link)}" target="_blank" rel="noopener" class="article-link block text-base font-semibold text-gray-900 leading-snug mb-1 hover:underline">
            ${escapeHtml(a.title)}
          </a>
          ${a.perex ? `<p class="text-sm text-gray-600 leading-snug">${escapeHtml(a.perex)}</p>` : ""}
        </div>
        ${a.imageUrl ? `<img src="${escapeAttr(a.imageUrl)}" alt="" class="w-20 h-20 object-cover rounded-lg flex-shrink-0" loading="lazy" onerror="this.remove()" />` : ""}
      </div>
      <div class="flex items-center gap-2 mt-3">
        <button type="button" class="btn-readlater flex items-center justify-center w-10 h-10 rounded-lg ${a.isReadLater ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}" aria-label="Read later">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${a.isReadLater ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button type="button" class="btn-favorite flex items-center justify-center w-10 h-10 rounded-lg ${a.isFavorite ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"}" aria-label="Favorite">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${a.isFavorite ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></polygon></svg>
        </button>
      </div>
    </article>`;
}
__name(renderArticleCard, "renderArticleCard");
function renderArticleList(articles) {
  if (articles.length === 0) {
    return `<div class="text-center text-gray-400 text-sm py-16">No articles here yet.</div>`;
  }
  return `<div class="space-y-3">${articles.map(renderArticleCard).join("")}</div>`;
}
__name(renderArticleList, "renderArticleList");

// src/routes/feeds.ts
var feedRoutes = new Hono2();
function parseFilters(c) {
  const source = c.req.query("source") || "all";
  const hideRead = c.req.query("hideRead") === "1";
  const viewParam = c.req.query("view");
  const view = viewParam === "readlater" || viewParam === "favorites" ? viewParam : "feed";
  return { source, hideRead, view };
}
__name(parseFilters, "parseFilters");
async function fetchFeedArticles(db, userId, filters) {
  const query = `
    SELECT
      a.link, a.title, a.perex, a.image_url AS imageUrl, uf.feed_name AS sourceName, a.feed_url,
      EXISTS(SELECT 1 FROM read_articles ra WHERE ra.user_id = ?1 AND ra.article_link = a.link) AS isRead,
      EXISTS(SELECT 1 FROM read_later rl WHERE rl.user_id = ?1 AND rl.article_link = a.link) AS isReadLater,
      EXISTS(SELECT 1 FROM favorites fv WHERE fv.user_id = ?1 AND fv.article_link = a.link) AS isFavorite
    FROM articles a
    JOIN user_feeds uf ON uf.feed_url = a.feed_url AND uf.user_id = ?1
    WHERE (?2 = 'all' OR a.feed_url = ?2)
    ORDER BY a.published_at DESC, a.id DESC
    LIMIT 150
  `;
  const { results } = await db.prepare(query).bind(userId, filters.source).all();
  let rows = results.map((r) => ({
    link: r.link,
    title: r.title,
    perex: r.perex,
    imageUrl: r.imageUrl,
    sourceName: r.sourceName,
    isRead: !!r.isRead,
    isReadLater: !!r.isReadLater,
    isFavorite: !!r.isFavorite
  }));
  if (filters.hideRead) {
    rows = rows.filter((r) => !r.isRead);
  }
  return rows;
}
__name(fetchFeedArticles, "fetchFeedArticles");
async function fetchReadLaterArticles(db, userId) {
  const { results } = await db.prepare(
    `SELECT rl.article_link AS link, rl.title, rl.perex, rl.image_url AS imageUrl, rl.source AS sourceName,
        EXISTS(SELECT 1 FROM read_articles ra WHERE ra.user_id = ?1 AND ra.article_link = rl.article_link) AS isRead,
        1 AS isReadLater,
        EXISTS(SELECT 1 FROM favorites fv WHERE fv.user_id = ?1 AND fv.article_link = rl.article_link) AS isFavorite
      FROM read_later rl WHERE rl.user_id = ?1 ORDER BY rl.saved_at DESC`
  ).bind(userId).all();
  return results.map((r) => ({
    link: r.link,
    title: r.title,
    perex: r.perex,
    imageUrl: r.imageUrl,
    sourceName: r.sourceName,
    isRead: !!r.isRead,
    isReadLater: true,
    isFavorite: !!r.isFavorite
  }));
}
__name(fetchReadLaterArticles, "fetchReadLaterArticles");
async function fetchFavoriteArticles(db, userId) {
  const { results } = await db.prepare(
    `SELECT fv.article_link AS link, fv.title, fv.perex, fv.image_url AS imageUrl, fv.source AS sourceName,
        EXISTS(SELECT 1 FROM read_articles ra WHERE ra.user_id = ?1 AND ra.article_link = fv.article_link) AS isRead,
        EXISTS(SELECT 1 FROM read_later rl WHERE rl.user_id = ?1 AND rl.article_link = fv.article_link) AS isReadLater,
        1 AS isFavorite
      FROM favorites fv WHERE fv.user_id = ?1 ORDER BY fv.saved_at DESC`
  ).bind(userId).all();
  return results.map((r) => ({
    link: r.link,
    title: r.title,
    perex: r.perex,
    imageUrl: r.imageUrl,
    sourceName: r.sourceName,
    isRead: !!r.isRead,
    isReadLater: !!r.isReadLater,
    isFavorite: true
  }));
}
__name(fetchFavoriteArticles, "fetchFavoriteArticles");
async function getArticlesForFilters(db, userId, filters) {
  if (filters.view === "readlater")
    return fetchReadLaterArticles(db, userId);
  if (filters.view === "favorites")
    return fetchFavoriteArticles(db, userId);
  return fetchFeedArticles(db, userId, filters);
}
__name(getArticlesForFilters, "getArticlesForFilters");
function renderChips(sources, activeSource) {
  const allChip = `<button type="button" class="chip flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${activeSource === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-source="all">All</button>`;
  const chips = sources.map(
    (s) => `<button type="button" class="chip flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${activeSource === s.feed_url ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-source="${s.feed_url}">${s.feed_name}</button>`
  ).join("");
  return `<div class="flex gap-2 overflow-x-auto px-4 py-3 -mx-4 scrollbar-hide">${allChip}${chips}</div>`;
}
__name(renderChips, "renderChips");
feedRoutes.get("/", async (c) => {
  const user = c.get("user");
  const filters = parseFilters(c);
  const { results: sources } = await c.env.DB.prepare(
    "SELECT feed_url, feed_name FROM user_feeds WHERE user_id = ? ORDER BY feed_name"
  ).bind(user.id).all();
  const articles = await getArticlesForFilters(c.env.DB, user.id, filters);
  const body = `
    <div class="sticky top-0 md:top-[57px] z-10 bg-gray-50/95 backdrop-blur border-b border-gray-200">
      ${renderChips(sources, filters.source)}
      <div class="flex items-center gap-2 px-4 pb-3 text-sm">
        <button type="button" id="toggle-hideread" class="toggle-btn px-3 py-1.5 rounded-full ${filters.hideRead ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-active="${filters.hideRead}">Hide Read</button>
        <button type="button" id="toggle-readlater" class="toggle-btn px-3 py-1.5 rounded-full ${filters.view === "readlater" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-view="readlater">Read Later</button>
        <button type="button" id="toggle-favorites" class="toggle-btn px-3 py-1.5 rounded-full ${filters.view === "favorites" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}" data-view="favorites">Favorites</button>
        <button type="button" id="mark-all-read" class="ml-auto px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">Mark all read</button>
      </div>
    </div>
    <div id="feed-list" class="p-4">
      ${renderArticleList(articles)}
    </div>
  `;
  return c.html(
    layout({
      title: "Feed",
      activeNav: "home",
      username: user.username,
      bodyHtml: body
    })
  );
});
feedRoutes.get("/partials/feed", async (c) => {
  const user = c.get("user");
  const filters = parseFilters(c);
  const articles = await getArticlesForFilters(c.env.DB, user.id, filters);
  return c.html(renderArticleList(articles));
});
feedRoutes.post("/articles/read", async (c) => {
  const user = c.get("user");
  const { link } = await c.req.json();
  if (!link)
    return c.json({ error: "link required" }, 400);
  await c.env.DB.prepare(
    "INSERT INTO read_articles (user_id, article_link) VALUES (?, ?) ON CONFLICT (user_id, article_link) DO NOTHING"
  ).bind(user.id, link).run();
  return c.json({ ok: true });
});
feedRoutes.post("/articles/mark-all-read", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const filters = {
    source: body.source || "all",
    hideRead: false,
    view: body.view === "readlater" || body.view === "favorites" ? body.view : "feed"
  };
  const articles = await getArticlesForFilters(c.env.DB, user.id, filters);
  const unread = articles.filter((a) => !a.isRead);
  if (unread.length > 0) {
    const stmt = c.env.DB.prepare(
      "INSERT INTO read_articles (user_id, article_link) VALUES (?, ?) ON CONFLICT (user_id, article_link) DO NOTHING"
    );
    await c.env.DB.batch(unread.map((a) => stmt.bind(user.id, a.link)));
  }
  return c.json({ ok: true, marked: unread.length });
});
feedRoutes.post("/articles/toggle-readlater", async (c) => {
  const user = c.get("user");
  const meta = await c.req.json();
  if (!meta.link)
    return c.json({ error: "link required" }, 400);
  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM read_later WHERE user_id = ? AND article_link = ?"
  ).bind(user.id, meta.link).first();
  if (existing) {
    await c.env.DB.prepare("DELETE FROM read_later WHERE user_id = ? AND article_link = ?").bind(user.id, meta.link).run();
    return c.json({ ok: true, active: false });
  }
  await c.env.DB.prepare(
    "INSERT INTO read_later (user_id, article_link, title, source, perex, image_url) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(user.id, meta.link, meta.title, meta.source, meta.perex, meta.imageUrl).run();
  return c.json({ ok: true, active: true });
});
feedRoutes.post("/articles/toggle-favorite", async (c) => {
  const user = c.get("user");
  const meta = await c.req.json();
  if (!meta.link)
    return c.json({ error: "link required" }, 400);
  const existing = await c.env.DB.prepare(
    "SELECT 1 FROM favorites WHERE user_id = ? AND article_link = ?"
  ).bind(user.id, meta.link).first();
  if (existing) {
    await c.env.DB.prepare("DELETE FROM favorites WHERE user_id = ? AND article_link = ?").bind(user.id, meta.link).run();
    return c.json({ ok: true, active: false });
  }
  await c.env.DB.prepare(
    "INSERT INTO favorites (user_id, article_link, title, source, perex, image_url) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(user.id, meta.link, meta.title, meta.source, meta.perex, meta.imageUrl).run();
  return c.json({ ok: true, active: true });
});

// src/types.ts
var PRESET_FEEDS = [
  { name: "Den\xEDk Alarm", url: "https://denikalarm.cz/feed" },
  { name: "Druh\xE1 sm\u011Bna", url: "https://druhasmena.cz/rss" },
  { name: "Page Not Found", url: "https://pagenotfound.cz/rss" }
];

// src/rss/discover.ts
function resolveUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}
__name(resolveUrl, "resolveUrl");
async function discoverFeeds(pageUrl) {
  let res;
  try {
    res = await fetch(pageUrl, { headers: { "User-Agent": "SurikataRSSReader/1.0" } });
  } catch {
    return [];
  }
  if (!res.ok)
    return [];
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("html"))
    return [];
  const html = await res.text();
  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  const feeds = [];
  for (const tag of linkTags) {
    const relMatch = tag.match(/rel=["']([^"']+)["']/i);
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    const titleMatch = tag.match(/title=["']([^"']+)["']/i);
    if (!relMatch || !hrefMatch)
      continue;
    if (!/alternate/i.test(relMatch[1]))
      continue;
    const type = typeMatch?.[1] || "";
    if (!/rss\+xml|atom\+xml/i.test(type))
      continue;
    feeds.push({
      url: resolveUrl(hrefMatch[1], pageUrl),
      title: titleMatch ? titleMatch[1] : null
    });
  }
  const seen = /* @__PURE__ */ new Set();
  return feeds.filter((f) => {
    if (seen.has(f.url))
      return false;
    seen.add(f.url);
    return true;
  });
}
__name(discoverFeeds, "discoverFeeds");
function looksLikeFeedUrl(url) {
  return /\/(feed|rss|atom)(\.xml)?\/?$|\.(rss|xml|atom)(\?.*)?$/i.test(url);
}
__name(looksLikeFeedUrl, "looksLikeFeedUrl");

// src/routes/admin.ts
var adminRoutes = new Hono2();
function escapeHtml2(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
__name(escapeHtml2, "escapeHtml");
async function renderAdminPage(c, subscribedUrls, customFeeds, message) {
  const user = c.get("user");
  const presetsHtml = PRESET_FEEDS.map(
    (f) => `
    <label class="flex items-center justify-between py-3 border-b border-gray-100">
      <span class="text-sm font-medium text-gray-900">${escapeHtml2(f.name)}</span>
      <input type="checkbox" class="preset-toggle w-5 h-5 accent-gray-900" data-url="${escapeHtml2(f.url)}" data-name="${escapeHtml2(f.name)}" ${subscribedUrls.has(f.url) ? "checked" : ""} />
    </label>`
  ).join("");
  const customHtml = customFeeds.filter((f) => !PRESET_FEEDS.some((p) => p.url === f.feed_url)).map(
    (f) => `
    <div class="flex items-center justify-between py-3 border-b border-gray-100">
      <div class="min-w-0 pr-3">
        <div class="text-sm font-medium text-gray-900 truncate">${escapeHtml2(f.feed_name)}</div>
        <div class="text-xs text-gray-400 truncate">${escapeHtml2(f.feed_url)}</div>
      </div>
      <button type="button" class="remove-feed flex-shrink-0 text-red-500 text-sm" data-url="${escapeHtml2(f.feed_url)}">Remove</button>
    </div>`
  ).join("");
  const body = `
    <div class="p-4 space-y-6">
      ${message ? `<div class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">${escapeHtml2(message)}</div>` : ""}

      <section>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Preset Feeds</h2>
        <div class="bg-white rounded-xl border border-gray-200 px-4">${presetsHtml}</div>
      </section>

      <section>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Custom Feed</h2>
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <input id="custom-url" type="text" placeholder="Paste a website or RSS feed URL"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm" />
          <button type="button" id="discover-btn" class="w-full py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800">Find Feed</button>
          <div id="discover-results" class="space-y-2"></div>
        </div>
      </section>

      <section>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Subscriptions</h2>
        <div class="bg-white rounded-xl border border-gray-200 px-4">
          ${customHtml || `<div class="text-sm text-gray-400 py-3">No custom feeds yet.</div>`}
        </div>
      </section>
    </div>
  `;
  return c.html(
    layout({
      title: "Manage Sources",
      activeNav: "admin",
      username: user.username,
      bodyHtml: body
    })
  );
}
__name(renderAdminPage, "renderAdminPage");
adminRoutes.get("/admin", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    "SELECT feed_url, feed_name FROM user_feeds WHERE user_id = ? ORDER BY feed_name"
  ).bind(user.id).all();
  const subscribedUrls = new Set(results.map((r) => r.feed_url));
  return renderAdminPage(c, subscribedUrls, results);
});
adminRoutes.post("/admin/feeds/toggle-preset", async (c) => {
  const user = c.get("user");
  const { url, name, subscribe } = await c.req.json();
  if (!url || !name)
    return c.json({ error: "url and name required" }, 400);
  if (subscribe) {
    await c.env.DB.prepare(
      "INSERT INTO user_feeds (user_id, feed_url, feed_name) VALUES (?, ?, ?) ON CONFLICT (user_id, feed_url) DO NOTHING"
    ).bind(user.id, url, name).run();
  } else {
    await c.env.DB.prepare("DELETE FROM user_feeds WHERE user_id = ? AND feed_url = ?").bind(user.id, url).run();
  }
  return c.json({ ok: true });
});
adminRoutes.post("/admin/feeds/discover", async (c) => {
  const { url } = await c.req.json();
  if (!url)
    return c.json({ error: "url required" }, 400);
  let candidateUrl = url.trim();
  if (!/^https?:\/\//i.test(candidateUrl)) {
    candidateUrl = "https://" + candidateUrl;
  }
  if (looksLikeFeedUrl(candidateUrl)) {
    return c.json({ feeds: [{ url: candidateUrl, title: null }] });
  }
  const feeds = await discoverFeeds(candidateUrl);
  if (feeds.length === 0) {
    return c.json({ feeds: [{ url: candidateUrl, title: null }], fallback: true });
  }
  return c.json({ feeds });
});
adminRoutes.post("/admin/feeds/add", async (c) => {
  const user = c.get("user");
  const { url, name } = await c.req.json();
  if (!url)
    return c.json({ error: "url required" }, 400);
  await c.env.DB.prepare(
    "INSERT INTO user_feeds (user_id, feed_url, feed_name) VALUES (?, ?, ?) ON CONFLICT (user_id, feed_url) DO UPDATE SET feed_name = excluded.feed_name"
  ).bind(user.id, url, name || url).run();
  return c.json({ ok: true });
});
adminRoutes.post("/admin/feeds/remove", async (c) => {
  const user = c.get("user");
  const { url } = await c.req.json();
  if (!url)
    return c.json({ error: "url required" }, 400);
  await c.env.DB.prepare("DELETE FROM user_feeds WHERE user_id = ? AND feed_url = ?").bind(user.id, url).run();
  return c.json({ ok: true });
});

// src/rss/parser.ts
var PEREX_MAX_LENGTH = 200;
function decodeEntities(text) {
  return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}
__name(decodeEntities, "decodeEntities");
function stripCdata(text) {
  const match2 = text.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return match2 ? match2[1] : text;
}
__name(stripCdata, "stripCdata");
function stripHtmlTags(text) {
  return text.replace(/<[^>]*>/g, "");
}
__name(stripHtmlTags, "stripHtmlTags");
function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match2 = block.match(re);
  if (!match2)
    return null;
  return decodeEntities(stripCdata(match2[1]).trim());
}
__name(extractTag, "extractTag");
function extractAttr(block, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*/?>`, "i");
  const match2 = block.match(re);
  return match2 ? match2[1] : null;
}
__name(extractAttr, "extractAttr");
function truncatePerex(text) {
  if (!text)
    return null;
  const clean = stripHtmlTags(text).replace(/\s+/g, " ").trim();
  if (clean.length <= PEREX_MAX_LENGTH)
    return clean;
  return clean.slice(0, PEREX_MAX_LENGTH).trim() + "\u2026";
}
__name(truncatePerex, "truncatePerex");
function extractImage(block) {
  const enclosureUrl = extractAttr(block, "enclosure", "url");
  if (enclosureUrl && /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(enclosureUrl)) {
    return enclosureUrl;
  }
  const enclosureType = extractAttr(block, "enclosure", "type");
  if (enclosureUrl && enclosureType && enclosureType.startsWith("image/")) {
    return enclosureUrl;
  }
  const mediaContent = extractAttr(block, "media:content", "url");
  if (mediaContent)
    return mediaContent;
  const mediaThumb = extractAttr(block, "media:thumbnail", "url");
  if (mediaThumb)
    return mediaThumb;
  const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch)
    return imgMatch[1];
  return null;
}
__name(extractImage, "extractImage");
function isAtom(xml) {
  return /<feed[\s>]/i.test(xml) && /xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(xml);
}
__name(isAtom, "isAtom");
function parseRssItems(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks) {
    const link = extractTag(block, "link");
    const title = extractTag(block, "title");
    if (!link || !title)
      continue;
    const description = extractTag(block, "description") || extractTag(block, "content:encoded");
    items.push({
      link: link.trim(),
      title,
      perex: truncatePerex(description),
      imageUrl: extractImage(block),
      publishedAt: extractTag(block, "pubDate") || extractTag(block, "dc:date")
    });
  }
  return items;
}
__name(parseRssItems, "parseRssItems");
function parseAtomEntries(xml) {
  const items = [];
  const entryBlocks = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const block of entryBlocks) {
    let link = extractAttr(block, "link", "href");
    if (!link)
      link = extractTag(block, "link");
    const title = extractTag(block, "title");
    if (!link || !title)
      continue;
    const summary = extractTag(block, "summary") || extractTag(block, "content");
    items.push({
      link: link.trim(),
      title,
      perex: truncatePerex(summary),
      imageUrl: extractImage(block),
      publishedAt: extractTag(block, "published") || extractTag(block, "updated")
    });
  }
  return items;
}
__name(parseAtomEntries, "parseAtomEntries");
function parseFeed(xml) {
  try {
    return isAtom(xml) ? parseAtomEntries(xml) : parseRssItems(xml);
  } catch {
    return [];
  }
}
__name(parseFeed, "parseFeed");
async function fetchAndParseFeed(feedUrl) {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "SurikataRSSReader/1.0" }
  });
  if (!res.ok)
    return [];
  const xml = await res.text();
  return parseFeed(xml);
}
__name(fetchAndParseFeed, "fetchAndParseFeed");

// src/scheduled.ts
async function handleScheduled(env) {
  const { results } = await env.DB.prepare(
    "SELECT DISTINCT feed_url FROM user_feeds"
  ).all();
  const feedUrls = results.map((r) => r.feed_url);
  await Promise.allSettled(
    feedUrls.map(async (feedUrl) => {
      const articles = await fetchAndParseFeed(feedUrl);
      if (articles.length === 0)
        return;
      const stmt = env.DB.prepare(
        `INSERT INTO articles (feed_url, link, title, perex, image_url, published_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (feed_url, link) DO UPDATE SET
           title = excluded.title,
           perex = excluded.perex,
           image_url = excluded.image_url,
           published_at = excluded.published_at`
      );
      const batch = articles.map(
        (a) => stmt.bind(feedUrl, a.link, a.title, a.perex, a.imageUrl, a.publishedAt)
      );
      await env.DB.batch(batch);
    })
  );
}
__name(handleScheduled, "handleScheduled");

// src/index.ts
var app = new Hono2();
app.use("*", loadSession);
app.route("/", authRoutes);
app.use("*", requireAuthSmart);
app.route("/", feedRoutes);
app.route("/", adminRoutes);
var src_default = {
  fetch: app.fetch,
  async scheduled(_event, env) {
    await handleScheduled(env);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-scheduled.ts
var scheduled = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  const url = new URL(request.url);
  if (url.pathname === "/__scheduled") {
    const cron = url.searchParams.get("cron") ?? "";
    await middlewareCtx.dispatch("scheduled", { cron });
    return new Response("Ran scheduled event");
  }
  const resp = await middlewareCtx.next(request, env);
  if (request.headers.get("referer")?.endsWith("/__scheduled") && url.pathname === "/favicon.ico" && resp.status === 500) {
    return new Response(null, { status: 404 });
  }
  return resp;
}, "scheduled");
var middleware_scheduled_default = scheduled;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-HgXlqV/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_scheduled_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-HgXlqV/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
