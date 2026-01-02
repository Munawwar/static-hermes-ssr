/**
 * AbortController and AbortSignal polyfill for Static Hermes SSR
 * Custom implementation - npm packages have Hermes-incompatible code
 */

(function() {
  if (globalThis.AbortController) return;

  var EventTarget = globalThis.EventTarget;
  var Event = globalThis.Event;

  // AbortSignal extends EventTarget
  function AbortSignal() {
    EventTarget.call(this);
    this._aborted = false;
    this._reason = undefined;
    this.onabort = null;
  }

  AbortSignal.prototype = Object.create(EventTarget.prototype);
  AbortSignal.prototype.constructor = AbortSignal;

  Object.defineProperty(AbortSignal.prototype, 'aborted', {
    get: function() { return this._aborted; }
  });

  Object.defineProperty(AbortSignal.prototype, 'reason', {
    get: function() { return this._reason; }
  });

  AbortSignal.prototype.throwIfAborted = function() {
    if (this._aborted) {
      throw this._reason;
    }
  };

  AbortSignal.prototype._abort = function(reason) {
    if (this._aborted) return;

    this._aborted = true;
    this._reason = reason !== undefined ? reason : new globalThis.DOMException('The operation was aborted.', 'AbortError');

    var event = new Event('abort');

    if (typeof this.onabort === 'function') {
      try {
        this.onabort(event);
      } catch (e) {
        // Suppress errors
      }
    }

    this.dispatchEvent(event);
  };

  AbortSignal.abort = function(reason) {
    var signal = new AbortSignal();
    signal._abort(reason);
    return signal;
  };

  AbortSignal.timeout = function(milliseconds) {
    var signal = new AbortSignal();
    // Note: setTimeout is stubbed in SSR, so this won't actually timeout
    return signal;
  };

  // AbortController
  function AbortController() {
    this._signal = new AbortSignal();
  }

  Object.defineProperty(AbortController.prototype, 'signal', {
    get: function() { return this._signal; }
  });

  AbortController.prototype.abort = function(reason) {
    this._signal._abort(reason);
  };

  globalThis.AbortSignal = AbortSignal;
  globalThis.AbortController = AbortController;
})();
