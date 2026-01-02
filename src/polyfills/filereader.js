/**
 * FileReader polyfill for Static Hermes SSR
 * ES6 class syntax to work with ES6 EventTarget
 * Works with our custom Blob implementation
 */

(function() {
  if (globalThis.FileReader) return;

  // FileReader constants
  const EMPTY = 0;
  const LOADING = 1;
  const DONE = 2;

  // FileReader class (extends EventTarget)
  class FileReader extends globalThis.EventTarget {
    static EMPTY = EMPTY;
    static LOADING = LOADING;
    static DONE = DONE;

    constructor() {
      super();
      this.readyState = EMPTY;
      this.result = null;
      this.error = null;
      this.onloadstart = null;
      this.onprogress = null;
      this.onload = null;
      this.onabort = null;
      this.onerror = null;
      this.onloadend = null;
    }

    _dispatch(type, detail) {
      detail = detail || {};
      var event = new globalThis.Event(type);
      var keys = Object.keys(detail);
      for (var i = 0; i < keys.length; i++) {
        event[keys[i]] = detail[keys[i]];
      }

      var handler = this['on' + type];
      if (typeof handler === 'function') {
        try {
          handler.call(this, event);
        } catch (e) {
          if (globalThis.console) {
            globalThis.console.error('FileReader handler error:', e);
          }
        }
      }
      this.dispatchEvent(event);
    }

    _read(blob, format) {
      if (this.readyState === LOADING) {
        throw new globalThis.DOMException('FileReader is already reading', 'InvalidStateError');
      }

      this.readyState = LOADING;
      this.result = null;
      this.error = null;

      var size = blob.size || 0;
      var self = this;

      // Use Promise for async behavior
      Promise.resolve().then(function() {
        self._dispatch('loadstart', { loaded: 0, total: size });

        return Promise.resolve().then(function() {
          switch (format) {
            case 'arrayBuffer':
              return blob.arrayBuffer();

            case 'binaryString':
              return blob.arrayBuffer().then(function(buffer) {
                var bytes = new Uint8Array(buffer);
                var result = '';
                for (var i = 0; i < bytes.length; i++) {
                  result += String.fromCharCode(bytes[i]);
                }
                return result;
              });

            case 'dataURL':
              return blob.arrayBuffer().then(function(buffer) {
                var bytes = new Uint8Array(buffer);
                var binary = '';
                for (var i = 0; i < bytes.length; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                var base64 = globalThis.btoa(binary);
                var mediaType = blob.type || 'application/octet-stream';
                return 'data:' + mediaType + ';base64,' + base64;
              });

            case 'text':
            default:
              return blob.text();
          }
        });
      }).then(function(result) {
        self.readyState = DONE;
        self.result = result;
        self._dispatch('progress', { loaded: size, total: size });
        self._dispatch('load');
        self._dispatch('loadend');
      }).catch(function(err) {
        self.readyState = DONE;
        self.error = err;
        self._dispatch('error');
        self._dispatch('loadend');
      });
    }

    abort() {
      if (this.readyState !== LOADING) return;
      this.readyState = DONE;
      this.result = null;
      this._dispatch('abort');
      this._dispatch('loadend');
    }

    readAsArrayBuffer(blob) {
      this._read(blob, 'arrayBuffer');
    }

    readAsBinaryString(blob) {
      this._read(blob, 'binaryString');
    }

    readAsDataURL(blob) {
      this._read(blob, 'dataURL');
    }

    readAsText(blob, encoding) {
      this._read(blob, 'text');
    }
  }

  globalThis.FileReader = FileReader;
})();
