/**
 * Blob, File polyfill for Static Hermes SSR
 * ES5-compatible syntax for Hermes compilation
 */

(function() {
  if (globalThis.Blob && globalThis.Blob.__polyfilled__) return;

  // Helper to convert various inputs to Uint8Array
  function toUint8Array(part, endings) {
    if (part instanceof ArrayBuffer) {
      return new Uint8Array(part);
    }
    if (ArrayBuffer.isView(part)) {
      return new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
    }
    if (part instanceof Blob) {
      return part._data;
    }
    // String
    var str = String(part);
    if (endings === 'native') {
      str = str.replace(/\r\n/g, '\n');
    }
    if (globalThis.TextEncoder) {
      return new globalThis.TextEncoder().encode(str);
    }
    // Fallback: ASCII only
    var bytes = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
  }

  // Blob constructor
  function Blob(blobParts, options) {
    options = options || {};
    this._type = options.type ? String(options.type).toLowerCase() : '';
    var endings = options.endings === 'native' ? 'native' : 'transparent';

    if (!blobParts || blobParts.length === 0) {
      this._data = new Uint8Array(0);
      return;
    }

    var parts = [];
    var totalLength = 0;

    for (var i = 0; i < blobParts.length; i++) {
      var bytes = toUint8Array(blobParts[i], endings);
      parts.push(bytes);
      totalLength += bytes.length;
    }

    this._data = new Uint8Array(totalLength);
    var offset = 0;
    for (var i = 0; i < parts.length; i++) {
      this._data.set(parts[i], offset);
      offset += parts[i].length;
    }
  }

  Blob.__polyfilled__ = true;

  Object.defineProperty(Blob.prototype, 'size', {
    get: function() { return this._data.length; }
  });

  Object.defineProperty(Blob.prototype, 'type', {
    get: function() { return this._type; }
  });

  Blob.prototype.slice = function(start, end, contentType) {
    var size = this._data.length;
    var relativeStart = start === undefined ? 0 : start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
    var relativeEnd = end === undefined ? size : end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
    var span = Math.max(relativeEnd - relativeStart, 0);
    var slicedData = this._data.slice(relativeStart, relativeStart + span);
    var blob = new Blob([], { type: contentType || '' });
    blob._data = slicedData;
    return blob;
  };

  Blob.prototype.arrayBuffer = function() {
    var self = this;
    return Promise.resolve().then(function() {
      return self._data.buffer.slice(
        self._data.byteOffset,
        self._data.byteOffset + self._data.byteLength
      );
    });
  };

  Blob.prototype.text = function() {
    var self = this;
    return Promise.resolve().then(function() {
      if (globalThis.TextDecoder) {
        return new globalThis.TextDecoder().decode(self._data);
      }
      var str = '';
      for (var i = 0; i < self._data.length; i++) {
        str += String.fromCharCode(self._data[i]);
      }
      return str;
    });
  };

  Blob.prototype.bytes = function() {
    var self = this;
    return Promise.resolve().then(function() {
      return new Uint8Array(self._data);
    });
  };

  Blob.prototype.stream = function() {
    throw new Error('ReadableStream not available in SSR');
  };

  // File constructor (extends Blob)
  function File(fileBits, fileName, options) {
    options = options || {};
    Blob.call(this, fileBits, options);
    this._name = String(fileName);
    this._lastModified = options.lastModified !== undefined
      ? Number(options.lastModified)
      : Date.now();
  }

  File.__polyfilled__ = true;

  // Inherit from Blob
  File.prototype = Object.create(Blob.prototype);
  File.prototype.constructor = File;

  Object.defineProperty(File.prototype, 'name', {
    get: function() { return this._name; }
  });

  Object.defineProperty(File.prototype, 'lastModified', {
    get: function() { return this._lastModified; }
  });

  Object.defineProperty(File.prototype, 'webkitRelativePath', {
    get: function() { return ''; }
  });

  globalThis.Blob = Blob;
  globalThis.File = File;
})();
