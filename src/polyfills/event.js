/**
 * Event, CustomEvent, EventTarget polyfill for Static Hermes SSR
 * Custom implementation - npm packages have Hermes-incompatible code
 */

(function() {
  if (globalThis.EventTarget) return;

  // Event class
  class Event {
    constructor(type, options) {
      options = options || {};
      this.type = type;
      this.bubbles = Boolean(options.bubbles);
      this.cancelable = Boolean(options.cancelable);
      this.composed = Boolean(options.composed);
      this.defaultPrevented = false;
      this.timeStamp = Date.now();
      this.target = null;
      this.currentTarget = null;
      this.eventPhase = 0;
      this.isTrusted = false;
      this._stopPropagation = false;
      this._stopImmediatePropagation = false;
    }

    preventDefault() {
      if (this.cancelable) {
        this.defaultPrevented = true;
      }
    }

    stopPropagation() {
      this._stopPropagation = true;
    }

    stopImmediatePropagation() {
      this._stopPropagation = true;
      this._stopImmediatePropagation = true;
    }

    composedPath() {
      return this.target ? [this.target] : [];
    }
  }

  // CustomEvent class
  class CustomEvent extends Event {
    constructor(type, options) {
      super(type, options);
      options = options || {};
      this.detail = options.detail !== undefined ? options.detail : null;
    }
  }

  // EventTarget class
  class EventTarget {
    constructor() {
      this._listeners = {};
    }

    addEventListener(type, callback, options) {
      if (callback === null || callback === undefined) return;

      var capture = typeof options === 'boolean' ? options : Boolean(options && options.capture);
      var once = typeof options === 'object' ? Boolean(options.once) : false;

      if (!this._listeners[type]) {
        this._listeners[type] = [];
      }

      var listeners = this._listeners[type];
      var listener = { callback: callback, capture: capture, once: once };

      // Check for duplicates
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i].callback === callback && listeners[i].capture === capture) {
          return;
        }
      }
      listeners.push(listener);
    }

    removeEventListener(type, callback, options) {
      var capture = typeof options === 'boolean' ? options : Boolean(options && options.capture);
      var listeners = this._listeners[type];
      if (!listeners) return;

      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i].callback === callback && listeners[i].capture === capture) {
          listeners.splice(i, 1);
          return;
        }
      }
    }

    dispatchEvent(event) {
      event.target = this;
      event.currentTarget = this;
      event.eventPhase = 2; // AT_TARGET

      var listeners = this._listeners[event.type];
      if (!listeners) return !event.defaultPrevented;

      // Clone to avoid mutation during iteration
      var listenersToCall = listeners.slice();

      for (var i = 0; i < listenersToCall.length; i++) {
        var listener = listenersToCall[i];
        if (event._stopImmediatePropagation) break;

        try {
          if (typeof listener.callback === 'function') {
            listener.callback.call(this, event);
          } else if (listener.callback && typeof listener.callback.handleEvent === 'function') {
            listener.callback.handleEvent(event);
          }
        } catch (e) {
          // Suppress errors in handlers
        }

        if (listener.once) {
          this.removeEventListener(event.type, listener.callback, {
            capture: listener.capture
          });
        }
      }

      return !event.defaultPrevented;
    }
  }

  globalThis.Event = Event;
  globalThis.CustomEvent = CustomEvent;
  globalThis.EventTarget = EventTarget;
})();
