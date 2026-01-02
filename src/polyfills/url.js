/**
 * URL and URLSearchParams polyfill for Static Hermes SSR
 * ES5-compatible syntax for Hermes compilation
 */

(function() {
  if (globalThis.URL && globalThis.URL.__polyfilled__) return;

  // URLSearchParams implementation
  function URLSearchParams(init) {
    this._entries = [];

    if (init === undefined || init === null) {
      return;
    }

    if (typeof init === 'string') {
      this._parseString(init);
    } else if (Array.isArray(init)) {
      for (var i = 0; i < init.length; i++) {
        var pair = init[i];
        if (pair.length !== 2) {
          throw new TypeError('Invalid URLSearchParams init sequence');
        }
        this._entries.push([String(pair[0]), String(pair[1])]);
      }
    } else if (typeof init === 'object') {
      if (init instanceof URLSearchParams) {
        this._entries = init._entries.slice();
      } else {
        var keys = Object.keys(init);
        for (var i = 0; i < keys.length; i++) {
          this._entries.push([keys[i], String(init[keys[i]])]);
        }
      }
    }
  }

  URLSearchParams.__polyfilled__ = true;

  URLSearchParams.prototype._parseString = function(str) {
    if (str.charAt(0) === '?') {
      str = str.slice(1);
    }
    if (!str) return;

    var pairs = str.split('&');
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      if (!pair) continue;
      var eqIndex = pair.indexOf('=');
      var key, value;
      if (eqIndex === -1) {
        key = pair;
        value = '';
      } else {
        key = pair.slice(0, eqIndex);
        value = pair.slice(eqIndex + 1);
      }
      this._entries.push([
        decodeURIComponent(key.replace(/\+/g, ' ')),
        decodeURIComponent(value.replace(/\+/g, ' '))
      ]);
    }
  };

  URLSearchParams.prototype.append = function(name, value) {
    this._entries.push([String(name), String(value)]);
  };

  URLSearchParams.prototype.delete = function(name, value) {
    var nameStr = String(name);
    if (value === undefined) {
      this._entries = this._entries.filter(function(e) { return e[0] !== nameStr; });
    } else {
      var valueStr = String(value);
      this._entries = this._entries.filter(function(e) {
        return !(e[0] === nameStr && e[1] === valueStr);
      });
    }
  };

  URLSearchParams.prototype.get = function(name) {
    var nameStr = String(name);
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] === nameStr) {
        return this._entries[i][1];
      }
    }
    return null;
  };

  URLSearchParams.prototype.getAll = function(name) {
    var nameStr = String(name);
    var result = [];
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] === nameStr) {
        result.push(this._entries[i][1]);
      }
    }
    return result;
  };

  URLSearchParams.prototype.has = function(name, value) {
    var nameStr = String(name);
    if (value === undefined) {
      for (var i = 0; i < this._entries.length; i++) {
        if (this._entries[i][0] === nameStr) return true;
      }
      return false;
    }
    var valueStr = String(value);
    for (var i = 0; i < this._entries.length; i++) {
      if (this._entries[i][0] === nameStr && this._entries[i][1] === valueStr) return true;
    }
    return false;
  };

  URLSearchParams.prototype.set = function(name, value) {
    var nameStr = String(name);
    var valueStr = String(value);
    var found = false;
    var newEntries = [];
    for (var i = 0; i < this._entries.length; i++) {
      var e = this._entries[i];
      if (e[0] === nameStr) {
        if (!found) {
          newEntries.push([nameStr, valueStr]);
          found = true;
        }
      } else {
        newEntries.push(e);
      }
    }
    if (!found) {
      newEntries.push([nameStr, valueStr]);
    }
    this._entries = newEntries;
  };

  URLSearchParams.prototype.sort = function() {
    this._entries.sort(function(a, b) {
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });
  };

  // application/x-www-form-urlencoded serializer
  // Spec: spaces must be encoded as '+', not '%20'
  function urlEncode(str) {
    return encodeURIComponent(str).replace(/%20/g, '+');
  }

  URLSearchParams.prototype.toString = function() {
    var parts = [];
    for (var i = 0; i < this._entries.length; i++) {
      var e = this._entries[i];
      parts.push(urlEncode(e[0]) + '=' + urlEncode(e[1]));
    }
    return parts.join('&');
  };

  URLSearchParams.prototype.forEach = function(callback, thisArg) {
    for (var i = 0; i < this._entries.length; i++) {
      var e = this._entries[i];
      callback.call(thisArg, e[1], e[0], this);
    }
  };

  // Helper to create a spec-compliant iterator
  function createIterator(entries, mapper) {
    var index = 0;
    var iterator = {
      next: function() {
        if (index >= entries.length) {
          return { value: undefined, done: true };
        }
        var value = mapper(entries[index]);
        index++;
        return { value: value, done: false };
      }
    };
    iterator[Symbol.iterator] = function() { return iterator; };
    return iterator;
  }

  URLSearchParams.prototype.entries = function() {
    return createIterator(this._entries, function(e) { return [e[0], e[1]]; });
  };

  URLSearchParams.prototype.keys = function() {
    return createIterator(this._entries, function(e) { return e[0]; });
  };

  URLSearchParams.prototype.values = function() {
    return createIterator(this._entries, function(e) { return e[1]; });
  };

  URLSearchParams.prototype[Symbol.iterator] = function() {
    return this.entries();
  };

  Object.defineProperty(URLSearchParams.prototype, 'size', {
    get: function() { return this._entries.length; }
  });

  // URL implementation
  function URL(url, base) {
    var urlStr = String(url);
    var baseUrl = null;

    if (base !== undefined) {
      baseUrl = new URL(String(base));
    }

    // Initialize properties
    this._protocol = '';
    this._username = '';
    this._password = '';
    this._hostname = '';
    this._port = '';
    this._host = '';
    this._pathname = '/';
    this._search = '';
    this._hash = '';
    this._searchParams = new URLSearchParams();

    // Parse the URL
    this._parse(urlStr, baseUrl);
  }

  URL.__polyfilled__ = true;

  URL.prototype._parse = function(urlStr, baseUrl) {
    // Protocol regex
    var protocolMatch = urlStr.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/);

    if (protocolMatch) {
      this._protocol = protocolMatch[1].toLowerCase() + ':';
      urlStr = protocolMatch[2];
    } else if (baseUrl) {
      this._protocol = baseUrl._protocol;
    } else {
      throw new TypeError('Invalid URL: ' + urlStr);
    }

    // Handle file:// URLs
    if (this._protocol === 'file:') {
      if (urlStr.slice(0, 2) === '//') {
        urlStr = urlStr.slice(2);
      }
      this._host = '';
      this._hostname = '';
      this._port = '';
      this._pathname = urlStr.split('?')[0].split('#')[0] || '/';
      this._parseSearchAndHash(urlStr);
      this._username = '';
      this._password = '';
      return;
    }

    // Check for authority (//...)
    if (urlStr.slice(0, 2) === '//') {
      urlStr = urlStr.slice(2);
      var pathStart = urlStr.search(/[/?#]/);
      var authorityStr = pathStart === -1 ? urlStr : urlStr.slice(0, pathStart);
      var pathStr = pathStart === -1 ? '' : urlStr.slice(pathStart);

      this._parseAuthority(authorityStr);
      this._parsePath(pathStr);
    } else if (baseUrl) {
      // Relative URL
      this._username = baseUrl._username;
      this._password = baseUrl._password;
      this._hostname = baseUrl._hostname;
      this._port = baseUrl._port;
      this._host = baseUrl._host;

      if (urlStr.charAt(0) === '/') {
        this._parsePath(urlStr);
      } else if (urlStr.charAt(0) === '?') {
        this._pathname = baseUrl._pathname;
        this._parseSearchAndHash(urlStr);
      } else if (urlStr.charAt(0) === '#') {
        this._pathname = baseUrl._pathname;
        this._search = baseUrl._search;
        this._searchParams = new URLSearchParams(baseUrl._search);
        this._hash = urlStr;
      } else if (urlStr === '') {
        this._pathname = baseUrl._pathname;
        this._search = baseUrl._search;
        this._searchParams = new URLSearchParams(baseUrl._search);
        this._hash = baseUrl._hash;
      } else {
        // Relative path
        var basePath = baseUrl._pathname;
        var lastSlash = basePath.lastIndexOf('/');
        var newPath = basePath.slice(0, lastSlash + 1) + urlStr;
        this._parsePath(newPath);
      }
    } else {
      throw new TypeError('Invalid URL: ' + urlStr);
    }
  };

  URL.prototype._parseAuthority = function(str) {
    // userinfo@host:port
    var userinfo = '';
    var hostPort = str;

    var atIndex = str.lastIndexOf('@');
    if (atIndex !== -1) {
      userinfo = str.slice(0, atIndex);
      hostPort = str.slice(atIndex + 1);
    }

    // Parse userinfo
    var colonIndex = userinfo.indexOf(':');
    if (colonIndex !== -1) {
      this._username = decodeURIComponent(userinfo.slice(0, colonIndex));
      this._password = decodeURIComponent(userinfo.slice(colonIndex + 1));
    } else {
      this._username = decodeURIComponent(userinfo);
      this._password = '';
    }

    // Parse host:port (handle IPv6)
    if (hostPort.charAt(0) === '[') {
      var bracketEnd = hostPort.indexOf(']');
      if (bracketEnd === -1) {
        throw new TypeError('Invalid URL: unclosed IPv6 bracket');
      }
      this._hostname = hostPort.slice(0, bracketEnd + 1);
      var afterBracket = hostPort.slice(bracketEnd + 1);
      if (afterBracket.charAt(0) === ':') {
        this._port = afterBracket.slice(1);
      } else {
        this._port = '';
      }
    } else {
      var portIndex = hostPort.lastIndexOf(':');
      if (portIndex !== -1) {
        this._hostname = hostPort.slice(0, portIndex).toLowerCase();
        this._port = hostPort.slice(portIndex + 1);
      } else {
        this._hostname = hostPort.toLowerCase();
        this._port = '';
      }
    }

    this._host = this._port ? this._hostname + ':' + this._port : this._hostname;
  };

  URL.prototype._parsePath = function(str) {
    var hashIndex = str.indexOf('#');
    var searchIndex = str.indexOf('?');

    var pathname, search, hash;

    if (hashIndex !== -1 && (searchIndex === -1 || hashIndex < searchIndex)) {
      pathname = str.slice(0, hashIndex);
      hash = str.slice(hashIndex);
      search = '';
    } else if (searchIndex !== -1) {
      pathname = str.slice(0, searchIndex);
      var hashInRest = str.indexOf('#', searchIndex);
      if (hashInRest !== -1) {
        search = str.slice(searchIndex, hashInRest);
        hash = str.slice(hashInRest);
      } else {
        search = str.slice(searchIndex);
        hash = '';
      }
    } else {
      pathname = str;
      search = '';
      hash = '';
    }

    // Normalize pathname
    this._pathname = this._normalizePath(pathname || '/');
    this._search = search;
    this._hash = hash;
    this._searchParams = new URLSearchParams(search);
  };

  URL.prototype._parseSearchAndHash = function(str) {
    var hashIndex = str.indexOf('#');
    var searchIndex = str.indexOf('?');

    if (searchIndex !== -1) {
      if (hashIndex !== -1 && hashIndex > searchIndex) {
        this._search = str.slice(searchIndex, hashIndex);
        this._hash = str.slice(hashIndex);
      } else {
        this._search = str.slice(searchIndex);
        this._hash = '';
      }
    } else if (hashIndex !== -1) {
      this._search = '';
      this._hash = str.slice(hashIndex);
    } else {
      this._search = '';
      this._hash = '';
    }

    this._searchParams = new URLSearchParams(this._search);
  };

  URL.prototype._normalizePath = function(path) {
    if (!path) return '/';

    var segments = path.split('/');
    var result = [];

    for (var i = 0; i < segments.length; i++) {
      var segment = segments[i];
      if (segment === '..') {
        result.pop();
      } else if (segment !== '.' && segment !== '') {
        result.push(segment);
      }
    }

    var normalized = '/' + result.join('/');
    if (path.charAt(path.length - 1) === '/' && normalized.charAt(normalized.length - 1) !== '/') {
      normalized += '/';
    }
    return normalized;
  };

  URL.prototype._getHref = function() {
    var result = this._protocol + '//';

    if (this._username) {
      result += encodeURIComponent(this._username);
      if (this._password) {
        result += ':' + encodeURIComponent(this._password);
      }
      result += '@';
    }

    result += this._host + this._pathname + this._search + this._hash;
    return result;
  };

  URL.prototype.toString = function() { return this._getHref(); };
  URL.prototype.toJSON = function() { return this._getHref(); };

  // Define getters and setters using Object.defineProperty
  Object.defineProperty(URL.prototype, 'href', {
    get: function() { return this._getHref(); },
    set: function(value) { this._parse(String(value), null); }
  });

  Object.defineProperty(URL.prototype, 'origin', {
    get: function() { return this._protocol + '//' + this._host; }
  });

  Object.defineProperty(URL.prototype, 'protocol', {
    get: function() { return this._protocol; },
    set: function(value) {
      var str = String(value);
      this._protocol = str.charAt(str.length - 1) === ':' ? str.toLowerCase() : str.toLowerCase() + ':';
    }
  });

  Object.defineProperty(URL.prototype, 'username', {
    get: function() { return this._username; },
    set: function(value) { this._username = String(value); }
  });

  Object.defineProperty(URL.prototype, 'password', {
    get: function() { return this._password; },
    set: function(value) { this._password = String(value); }
  });

  Object.defineProperty(URL.prototype, 'host', {
    get: function() { return this._host; },
    set: function(value) {
      var str = String(value);
      var colonIndex = str.lastIndexOf(':');
      if (colonIndex !== -1) {
        this._hostname = str.slice(0, colonIndex).toLowerCase();
        this._port = str.slice(colonIndex + 1);
      } else {
        this._hostname = str.toLowerCase();
        this._port = '';
      }
      this._host = this._port ? this._hostname + ':' + this._port : this._hostname;
    }
  });

  Object.defineProperty(URL.prototype, 'hostname', {
    get: function() { return this._hostname; },
    set: function(value) {
      this._hostname = String(value).toLowerCase();
      this._host = this._port ? this._hostname + ':' + this._port : this._hostname;
    }
  });

  Object.defineProperty(URL.prototype, 'port', {
    get: function() { return this._port; },
    set: function(value) {
      this._port = String(value);
      this._host = this._port ? this._hostname + ':' + this._port : this._hostname;
    }
  });

  Object.defineProperty(URL.prototype, 'pathname', {
    get: function() { return this._pathname; },
    set: function(value) { this._pathname = this._normalizePath(String(value)); }
  });

  Object.defineProperty(URL.prototype, 'search', {
    get: function() { return this._search; },
    set: function(value) {
      var str = String(value);
      if (str && str.charAt(0) !== '?') str = '?' + str;
      this._search = str;
      this._searchParams = new URLSearchParams(str);
    }
  });

  Object.defineProperty(URL.prototype, 'searchParams', {
    get: function() { return this._searchParams; }
  });

  Object.defineProperty(URL.prototype, 'hash', {
    get: function() { return this._hash; },
    set: function(value) {
      var str = String(value);
      if (str && str.charAt(0) !== '#') str = '#' + str;
      this._hash = str;
    }
  });

  // Static methods
  URL.canParse = function(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch (e) {
      return false;
    }
  };

  URL.parse = function(url, base) {
    try {
      return new URL(url, base);
    } catch (e) {
      return null;
    }
  };

  globalThis.URL = URL;
  globalThis.URLSearchParams = URLSearchParams;
})();
