/**
 * Timer stubs for Static Hermes SSR
 * These are no-op stubs since SSR is synchronous
 * They return IDs but callbacks are never executed
 */

(function() {
  if (globalThis.setTimeout && globalThis.setTimeout.__polyfilled__) return;

  let nextId = 1;
  const activeTimers = new Set();

  function setTimeout(callback, delay, ...args) {
    const id = nextId++;
    activeTimers.add(id);
    // Callback is never called in SSR context
    return id;
  }
  setTimeout.__polyfilled__ = true;
  setTimeout.__stubbed__ = true;

  function clearTimeout(id) {
    activeTimers.delete(id);
  }
  clearTimeout.__polyfilled__ = true;

  function setInterval(callback, delay, ...args) {
    const id = nextId++;
    activeTimers.add(id);
    // Callback is never called in SSR context
    return id;
  }
  setInterval.__polyfilled__ = true;
  setInterval.__stubbed__ = true;

  function clearInterval(id) {
    activeTimers.delete(id);
  }
  clearInterval.__polyfilled__ = true;

  function setImmediate(callback, ...args) {
    const id = nextId++;
    activeTimers.add(id);
    // In SSR, we could optionally execute immediately
    // but for consistency with setTimeout, we don't
    return id;
  }
  setImmediate.__polyfilled__ = true;
  setImmediate.__stubbed__ = true;

  function clearImmediate(id) {
    activeTimers.delete(id);
  }
  clearImmediate.__polyfilled__ = true;

  function requestAnimationFrame(callback) {
    const id = nextId++;
    // No-op in SSR
    return id;
  }
  requestAnimationFrame.__polyfilled__ = true;
  requestAnimationFrame.__stubbed__ = true;

  function cancelAnimationFrame(id) {
    // No-op
  }
  cancelAnimationFrame.__polyfilled__ = true;

  function requestIdleCallback(callback, options) {
    const id = nextId++;
    // No-op in SSR
    return id;
  }
  requestIdleCallback.__polyfilled__ = true;
  requestIdleCallback.__stubbed__ = true;

  function cancelIdleCallback(id) {
    // No-op
  }
  cancelIdleCallback.__polyfilled__ = true;

  // queueMicrotask - this one we CAN implement using Promise
  function queueMicrotask(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Argument must be a function');
    }
    Promise.resolve().then(callback).catch(err => {
      // Report error asynchronously
      Promise.resolve().then(() => { throw err; });
    });
  }
  queueMicrotask.__polyfilled__ = true;

  globalThis.setTimeout = setTimeout;
  globalThis.clearTimeout = clearTimeout;
  globalThis.setInterval = setInterval;
  globalThis.clearInterval = clearInterval;
  globalThis.setImmediate = setImmediate;
  globalThis.clearImmediate = clearImmediate;
  globalThis.requestAnimationFrame = requestAnimationFrame;
  globalThis.cancelAnimationFrame = cancelAnimationFrame;
  globalThis.requestIdleCallback = requestIdleCallback;
  globalThis.cancelIdleCallback = cancelIdleCallback;

  if (!globalThis.queueMicrotask) {
    globalThis.queueMicrotask = queueMicrotask;
  }
})();
