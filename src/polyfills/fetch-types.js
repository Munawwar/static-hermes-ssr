/**
 * Headers, Request, Response polyfill for Static Hermes SSR
 * Note: fetch() itself requires native implementation for network I/O
 */

(function() {
  if (globalThis.Headers && globalThis.Headers.__polyfilled__) return;

  // Headers class
  class Headers {
    static __polyfilled__ = true;

    constructor(init) {
      this._headers = new Map();

      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this.append(key, value);
        });
      } else if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.append(key, value);
        }
      } else if (init && typeof init === 'object') {
        for (const key of Object.keys(init)) {
          this.append(key, init[key]);
        }
      }
    }

    _normalizeKey(key) {
      return String(key).toLowerCase();
    }

    append(name, value) {
      const key = this._normalizeKey(name);
      const existing = this._headers.get(key);
      if (existing) {
        this._headers.set(key, existing + ', ' + String(value));
      } else {
        this._headers.set(key, String(value));
      }
    }

    delete(name) {
      this._headers.delete(this._normalizeKey(name));
    }

    get(name) {
      return this._headers.get(this._normalizeKey(name)) || null;
    }

    has(name) {
      return this._headers.has(this._normalizeKey(name));
    }

    set(name, value) {
      this._headers.set(this._normalizeKey(name), String(value));
    }

    *entries() {
      for (const [key, value] of this._headers) {
        yield [key, value];
      }
    }

    *keys() {
      for (const key of this._headers.keys()) {
        yield key;
      }
    }

    *values() {
      for (const value of this._headers.values()) {
        yield value;
      }
    }

    [Symbol.iterator]() {
      return this.entries();
    }

    forEach(callback, thisArg) {
      for (const [key, value] of this._headers) {
        callback.call(thisArg, value, key, this);
      }
    }

    getSetCookie() {
      // In SSR context, we don't have real cookies
      return [];
    }
  }

  // Body mixin implementation (shared between Request and Response)
  const BodyMixin = {
    async arrayBuffer() {
      if (this._bodyUsed) {
        throw new TypeError('Body has already been consumed');
      }
      this._bodyUsed = true;

      if (this._body instanceof ArrayBuffer) {
        return this._body;
      }
      if (this._body instanceof Blob) {
        return await this._body.arrayBuffer();
      }
      if (typeof this._body === 'string') {
        if (globalThis.TextEncoder) {
          const bytes = new TextEncoder().encode(this._body);
          return bytes.buffer;
        }
        // Fallback
        const bytes = new Uint8Array(this._body.length);
        for (let i = 0; i < this._body.length; i++) {
          bytes[i] = this._body.charCodeAt(i);
        }
        return bytes.buffer;
      }
      return new ArrayBuffer(0);
    },

    async blob() {
      if (this._bodyUsed) {
        throw new TypeError('Body has already been consumed');
      }
      this._bodyUsed = true;

      if (this._body instanceof Blob) {
        return this._body;
      }
      const buffer = await this.arrayBuffer();
      return new Blob([buffer], { type: this.headers.get('content-type') || '' });
    },

    async bytes() {
      const buffer = await this.arrayBuffer();
      return new Uint8Array(buffer);
    },

    async formData() {
      throw new Error('FormData parsing not implemented in SSR polyfill');
    },

    async json() {
      const text = await this.text();
      return JSON.parse(text);
    },

    async text() {
      if (this._bodyUsed) {
        throw new TypeError('Body has already been consumed');
      }
      this._bodyUsed = true;

      if (typeof this._body === 'string') {
        return this._body;
      }
      if (this._body instanceof Blob) {
        return await this._body.text();
      }
      if (this._body instanceof ArrayBuffer || ArrayBuffer.isView(this._body)) {
        if (globalThis.TextDecoder) {
          return new TextDecoder().decode(this._body);
        }
        // Fallback
        const bytes = new Uint8Array(this._body);
        let str = '';
        for (let i = 0; i < bytes.length; i++) {
          str += String.fromCharCode(bytes[i]);
        }
        return str;
      }
      return '';
    }
  };

  // Request class
  class Request {
    static __polyfilled__ = true;

    constructor(input, init = {}) {
      if (input instanceof Request) {
        this._url = input.url;
        this._method = init.method || input.method;
        this._headers = new Headers(init.headers || input.headers);
        this._body = init.body !== undefined ? init.body : input._body;
        this._mode = init.mode || input.mode;
        this._credentials = init.credentials || input.credentials;
        this._cache = init.cache || input.cache;
        this._redirect = init.redirect || input.redirect;
        this._referrer = init.referrer !== undefined ? init.referrer : input.referrer;
        this._referrerPolicy = init.referrerPolicy || input.referrerPolicy;
        this._integrity = init.integrity || input.integrity;
        this._keepalive = init.keepalive !== undefined ? init.keepalive : input.keepalive;
        this._signal = init.signal || input.signal;
      } else {
        this._url = String(input);
        this._method = (init.method || 'GET').toUpperCase();
        this._headers = new Headers(init.headers);
        this._body = init.body || null;
        this._mode = init.mode || 'cors';
        this._credentials = init.credentials || 'same-origin';
        this._cache = init.cache || 'default';
        this._redirect = init.redirect || 'follow';
        this._referrer = init.referrer !== undefined ? init.referrer : 'about:client';
        this._referrerPolicy = init.referrerPolicy || '';
        this._integrity = init.integrity || '';
        this._keepalive = init.keepalive || false;
        this._signal = init.signal || null;
      }

      this._bodyUsed = false;
    }

    get url() { return this._url; }
    get method() { return this._method; }
    get headers() { return this._headers; }
    get body() { return this._body; }
    get bodyUsed() { return this._bodyUsed; }
    get mode() { return this._mode; }
    get credentials() { return this._credentials; }
    get cache() { return this._cache; }
    get redirect() { return this._redirect; }
    get referrer() { return this._referrer; }
    get referrerPolicy() { return this._referrerPolicy; }
    get integrity() { return this._integrity; }
    get keepalive() { return this._keepalive; }
    get signal() { return this._signal; }

    get destination() { return ''; }

    clone() {
      if (this._bodyUsed) {
        throw new TypeError('Cannot clone a Request with a used body');
      }
      return new Request(this);
    }
  }

  // Add Body mixin methods to Request
  Object.assign(Request.prototype, BodyMixin);

  // Response class
  class Response {
    static __polyfilled__ = true;

    constructor(body, init = {}) {
      this._body = body || null;
      this._headers = new Headers(init.headers);
      this._status = init.status !== undefined ? init.status : 200;
      this._statusText = init.statusText !== undefined ? init.statusText : '';
      this._ok = this._status >= 200 && this._status < 300;
      this._type = init.type || 'default';
      this._url = init.url || '';
      this._redirected = init.redirected || false;
      this._bodyUsed = false;
    }

    get body() { return this._body; }
    get bodyUsed() { return this._bodyUsed; }
    get headers() { return this._headers; }
    get ok() { return this._ok; }
    get redirected() { return this._redirected; }
    get status() { return this._status; }
    get statusText() { return this._statusText; }
    get type() { return this._type; }
    get url() { return this._url; }

    clone() {
      if (this._bodyUsed) {
        throw new TypeError('Cannot clone a Response with a used body');
      }
      return new Response(this._body, {
        headers: this._headers,
        status: this._status,
        statusText: this._statusText,
        type: this._type,
        url: this._url,
        redirected: this._redirected
      });
    }

    static error() {
      const response = new Response(null, { status: 0 });
      response._type = 'error';
      return response;
    }

    static redirect(url, status = 302) {
      if (![301, 302, 303, 307, 308].includes(status)) {
        throw new RangeError('Invalid redirect status');
      }
      return new Response(null, {
        status,
        headers: { Location: url }
      });
    }

    static json(data, init = {}) {
      const headers = new Headers(init.headers);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
      return new Response(JSON.stringify(data), {
        ...init,
        headers
      });
    }
  }

  // Add Body mixin methods to Response
  Object.assign(Response.prototype, BodyMixin);

  // fetch stub - throws error since network I/O requires native implementation
  function fetch(input, init) {
    return Promise.reject(
      new Error('fetch() is not available in SSR context. Network I/O requires native implementation.')
    );
  }
  fetch.__polyfilled__ = true;
  fetch.__stubbed__ = true;

  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
  globalThis.fetch = fetch;
})();
