/**
 * Console polyfill for Static Hermes SSR
 * Captures output to globalThis.__console__ for retrieval by host
 */

(function() {
  if (globalThis.console && globalThis.console.__polyfilled__) return;

  const output = [];

  function formatArgs(args) {
    return args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  function createLogger(level) {
    return function(...args) {
      const entry = {
        level,
        message: formatArgs(args),
        timestamp: Date.now()
      };
      output.push(entry);
    };
  }

  const console = {
    __polyfilled__: true,
    log: createLogger('log'),
    info: createLogger('info'),
    warn: createLogger('warn'),
    error: createLogger('error'),
    debug: createLogger('debug'),
    trace: createLogger('trace'),
    dir: createLogger('dir'),
    table: createLogger('table'),
    group: function() {},
    groupEnd: function() {},
    groupCollapsed: function() {},
    clear: function() { output.length = 0; },
    count: function() {},
    countReset: function() {},
    time: function() {},
    timeEnd: function() {},
    timeLog: function() {},
    assert: function(condition, ...args) {
      if (!condition) {
        createLogger('error')('Assertion failed:', ...args);
      }
    }
  };

  globalThis.console = console;
  globalThis.__console__ = {
    getOutput: function() { return output; },
    clear: function() { output.length = 0; }
  };
})();
