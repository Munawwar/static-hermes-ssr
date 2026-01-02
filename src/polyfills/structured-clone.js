/**
 * structuredClone polyfill for Static Hermes SSR
 * Custom implementation - npm packages have Hermes-incompatible code
 */

(function() {
  if (globalThis.structuredClone) return;

  function structuredClone(value) {
    // Handle primitive types
    if (value === null || value === undefined) {
      return value;
    }

    var type = typeof value;
    if (type === 'boolean' || type === 'number' || type === 'string' || type === 'bigint') {
      return value;
    }

    // Handle Date
    if (value instanceof Date) {
      return new Date(value.getTime());
    }

    // Handle RegExp
    if (value instanceof RegExp) {
      return new RegExp(value.source, value.flags);
    }

    // Handle ArrayBuffer
    if (value instanceof ArrayBuffer) {
      var clone = new ArrayBuffer(value.byteLength);
      new Uint8Array(clone).set(new Uint8Array(value));
      return clone;
    }

    // Handle TypedArrays
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      var TypedArrayConstructor = value.constructor;
      var buffer = structuredClone(value.buffer);
      return new TypedArrayConstructor(buffer, value.byteOffset, value.length);
    }

    // Handle DataView
    if (value instanceof DataView) {
      var buffer = structuredClone(value.buffer);
      return new DataView(buffer, value.byteOffset, value.byteLength);
    }

    // Handle Map
    if (value instanceof Map) {
      var clone = new Map();
      value.forEach(function(v, k) {
        clone.set(structuredClone(k), structuredClone(v));
      });
      return clone;
    }

    // Handle Set
    if (value instanceof Set) {
      var clone = new Set();
      value.forEach(function(v) {
        clone.add(structuredClone(v));
      });
      return clone;
    }

    // Handle Error types
    if (value instanceof Error) {
      var ErrorConstructor = value.constructor;
      var clone = new ErrorConstructor(value.message);
      clone.name = value.name;
      if (value.stack) {
        clone.stack = value.stack;
      }
      return clone;
    }

    // Handle Array
    if (Array.isArray(value)) {
      return value.map(function(item) { return structuredClone(item); });
    }

    // Handle plain objects
    if (type === 'object') {
      var clone = {};
      var keys = Object.keys(value);
      for (var i = 0; i < keys.length; i++) {
        clone[keys[i]] = structuredClone(value[keys[i]]);
      }
      return clone;
    }

    // Functions and symbols cannot be cloned
    throw new globalThis.DOMException(
      'The object could not be cloned.',
      'DataCloneError'
    );
  }

  globalThis.structuredClone = structuredClone;
})();
