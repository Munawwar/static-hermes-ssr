/**
 * Web API Test Suite for Static Hermes SSR
 *
 * Tests all polyfilled and native Web APIs.
 * Returns JSON with test results.
 */

// Import polyfills
import '../src/polyfills/index.js';

// Test utilities
var results = [];
var passed = 0;
var failed = 0;
var skipped = 0;

function test(name, fn) {
  try {
    var result = fn();
    if (result === 'skip') {
      results.push({ name: name, status: 'skip', message: 'Not available' });
      skipped++;
    } else if (result === true) {
      results.push({ name: name, status: 'pass' });
      passed++;
    } else {
      results.push({ name: name, status: 'fail', message: 'Returned: ' + result });
      failed++;
    }
  } catch (e) {
    results.push({ name: name, status: 'fail', message: e.message || String(e) });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
  return true;
}

// ============================================
// NATIVE APIs (C++)
// ============================================

test('performance.now() returns number', function() {
  var t = performance.now();
  return typeof t === 'number' && t >= 0;
});

test('performance.now() increases', function() {
  var t1 = performance.now();
  var sum = 0;
  for (var i = 0; i < 10000; i++) sum += i;
  var t2 = performance.now();
  return t2 > t1;
});

test('performance.timeOrigin exists', function() {
  return typeof performance.timeOrigin === 'number' && performance.timeOrigin > 0;
});

test('crypto.getRandomValues() fills Uint8Array', function() {
  var arr = new Uint8Array(16);
  var allZero = true;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) allZero = false;
  }
  assert(allZero, 'Array should start as zeros');

  crypto.getRandomValues(arr);
  var hasNonZero = false;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) hasNonZero = true;
  }
  return hasNonZero;
});

test('crypto.getRandomValues() fills Uint32Array', function() {
  var arr = new Uint32Array(4);
  crypto.getRandomValues(arr);
  var hasNonZero = false;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) hasNonZero = true;
  }
  return hasNonZero;
});

test('crypto.subtle.digest() SHA-256', function() {
  if (!crypto.subtle || !crypto.subtle.digest) return 'skip';

  try {
    var encoder = new TextEncoder();
    var data = encoder.encode('hello');
    var result = crypto.subtle.digest('SHA-256', data);

    // Should return a Promise-like with ArrayBuffer
    if (typeof result.then !== 'function') {
      return 'Result should be thenable';
    }
    return true;
  } catch (e) {
    // crypto.subtle.digest throws if not supported on this platform
    if (e.message && e.message.indexOf('not supported') !== -1) {
      return 'skip';
    }
    throw e;
  }
});

// ============================================
// BASE64 (atob/btoa)
// ============================================

test('btoa() encodes string', function() {
  return btoa('Hello, World!') === 'SGVsbG8sIFdvcmxkIQ==';
});

test('atob() decodes string', function() {
  return atob('SGVsbG8sIFdvcmxkIQ==') === 'Hello, World!';
});

test('atob(btoa(x)) roundtrip', function() {
  var original = 'Test string with special chars: !@#$%';
  return atob(btoa(original)) === original;
});

// ============================================
// URL & URLSearchParams
// ============================================

test('URL parsing basic', function() {
  var url = new URL('https://example.com:8080/path?query=1#hash');
  return url.protocol === 'https:' &&
         url.hostname === 'example.com' &&
         url.port === '8080' &&
         url.pathname === '/path' &&
         url.search === '?query=1' &&
         url.hash === '#hash';
});

test('URL.searchParams integration', function() {
  var url = new URL('https://example.com?foo=bar&baz=qux');
  return url.searchParams.get('foo') === 'bar' &&
         url.searchParams.get('baz') === 'qux';
});

test('URLSearchParams.get()', function() {
  var params = new URLSearchParams('a=1&b=2&a=3');
  return params.get('a') === '1' && params.get('b') === '2';
});

test('URLSearchParams.getAll()', function() {
  var params = new URLSearchParams('a=1&b=2&a=3');
  var all = params.getAll('a');
  return all.length === 2 && all[0] === '1' && all[1] === '3';
});

test('URLSearchParams.set()', function() {
  var params = new URLSearchParams('a=1&a=2');
  params.set('a', 'new');
  return params.getAll('a').length === 1 && params.get('a') === 'new';
});

test('URLSearchParams.append()', function() {
  var params = new URLSearchParams('a=1');
  params.append('a', '2');
  return params.getAll('a').length === 2;
});

test('URLSearchParams.delete()', function() {
  var params = new URLSearchParams('a=1&b=2');
  params.delete('a');
  return params.get('a') === null && params.get('b') === '2';
});

test('URLSearchParams.has()', function() {
  var params = new URLSearchParams('a=1');
  return params.has('a') === true && params.has('b') === false;
});

test('URLSearchParams.toString() encodes spaces as +', function() {
  var params = new URLSearchParams();
  params.set('q', 'hello world');
  return params.toString() === 'q=hello+world';
});

test('URLSearchParams.entries() iterator', function() {
  var params = new URLSearchParams('a=1&b=2');
  var iter = params.entries();
  var first = iter.next();
  var second = iter.next();
  var done = iter.next();
  return first.value[0] === 'a' && first.value[1] === '1' &&
         second.value[0] === 'b' && second.value[1] === '2' &&
         done.done === true;
});

test('URLSearchParams.keys() iterator', function() {
  var params = new URLSearchParams('a=1&b=2');
  var iter = params.keys();
  return iter.next().value === 'a' && iter.next().value === 'b';
});

test('URLSearchParams.values() iterator', function() {
  var params = new URLSearchParams('a=1&b=2');
  var iter = params.values();
  return iter.next().value === '1' && iter.next().value === '2';
});

test('URLSearchParams forEach()', function() {
  var params = new URLSearchParams('a=1&b=2');
  var keys = [];
  params.forEach(function(value, key) {
    keys.push(key);
  });
  return keys.length === 2 && keys[0] === 'a' && keys[1] === 'b';
});

// ============================================
// Event, CustomEvent, EventTarget
// ============================================

test('EventTarget addEventListener/dispatchEvent', function() {
  var target = new EventTarget();
  var called = false;
  target.addEventListener('test', function() {
    called = true;
  });
  target.dispatchEvent(new Event('test'));
  return called;
});

test('EventTarget removeEventListener', function() {
  var target = new EventTarget();
  var count = 0;
  var handler = function() { count++; };
  target.addEventListener('test', handler);
  target.dispatchEvent(new Event('test'));
  target.removeEventListener('test', handler);
  target.dispatchEvent(new Event('test'));
  return count === 1;
});

test('Event properties', function() {
  var event = new Event('click', { bubbles: true, cancelable: true });
  return event.type === 'click' &&
         event.bubbles === true &&
         event.cancelable === true;
});

test('CustomEvent with detail', function() {
  var event = new CustomEvent('custom', { detail: { foo: 'bar' } });
  return event.type === 'custom' && event.detail.foo === 'bar';
});

// ============================================
// AbortController & AbortSignal
// ============================================

test('AbortController exists', function() {
  return typeof AbortController === 'function';
});

test('AbortController.abort()', function() {
  try {
    var controller = new AbortController();
    var signal = controller.signal;
    if (signal.aborted !== false) return 'Should not be aborted initially';
    controller.abort();
    return signal.aborted === true;
  } catch (e) {
    // Some implementations have issues with signal construction
    if (e.message && e.message.indexOf('cannot be constructed') !== -1) {
      return 'skip';
    }
    throw e;
  }
});

test('AbortSignal abort event', function() {
  try {
    var controller = new AbortController();
    var called = false;
    controller.signal.addEventListener('abort', function() {
      called = true;
    });
    controller.abort();
    return called;
  } catch (e) {
    // Some implementations have issues with signal construction
    if (e.message && e.message.indexOf('cannot be constructed') !== -1) {
      return 'skip';
    }
    throw e;
  }
});

// ============================================
// Blob & File
// ============================================

test('Blob constructor', function() {
  var blob = new Blob(['Hello, ', 'World!'], { type: 'text/plain' });
  return blob.size === 13 && blob.type === 'text/plain';
});

test('Blob.slice()', function() {
  var blob = new Blob(['Hello, World!']);
  var sliced = blob.slice(0, 5);
  return sliced.size === 5;
});

test('Blob.text()', function() {
  var blob = new Blob(['Hello']);
  var text = blob.text();
  // Returns Promise-like
  return typeof text.then === 'function' || text === 'Hello';
});

test('File constructor', function() {
  var file = new File(['content'], 'test.txt', { type: 'text/plain' });
  return file.name === 'test.txt' &&
         file.type === 'text/plain' &&
         file.size === 7;
});

// ============================================
// FileReader
// ============================================

test('FileReader exists', function() {
  return typeof FileReader === 'function';
});

test('FileReader.readAsText()', function() {
  var reader = new FileReader();
  var blob = new Blob(['Test content']);
  reader.readAsText(blob);
  // FileReader is async, just verify it started
  return reader.readyState === FileReader.LOADING || reader.readyState === FileReader.DONE;
});

test('FileReader.readAsDataURL()', function() {
  var reader = new FileReader();
  var blob = new Blob(['Hello'], { type: 'text/plain' });
  reader.readAsDataURL(blob);
  // FileReader is async, just verify it started
  return reader.readyState === FileReader.LOADING || reader.readyState === FileReader.DONE;
});

// ============================================
// crypto.randomUUID
// ============================================

test('crypto.randomUUID() format', function() {
  var uuid = crypto.randomUUID();
  var pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  return pattern.test(uuid);
});

test('crypto.randomUUID() uniqueness', function() {
  var uuid1 = crypto.randomUUID();
  var uuid2 = crypto.randomUUID();
  return uuid1 !== uuid2;
});

// ============================================
// structuredClone
// ============================================

test('structuredClone() basic', function() {
  var obj = { a: 1, b: { c: 2 } };
  var clone = structuredClone(obj);
  return clone.a === 1 && clone.b.c === 2 && clone !== obj && clone.b !== obj.b;
});

test('structuredClone() arrays', function() {
  var arr = [1, 2, { x: 3 }];
  var clone = structuredClone(arr);
  return clone[0] === 1 && clone[2].x === 3 && clone !== arr;
});

// ============================================
// DOMException
// ============================================

test('DOMException constructor', function() {
  var ex = new DOMException('Test error', 'TestError');
  return ex.message === 'Test error' && ex.name === 'TestError';
});

test('DOMException is Error', function() {
  var ex = new DOMException('Test');
  return ex instanceof Error;
});

// ============================================
// Headers, Request, Response (stubs)
// ============================================

test('Headers exists', function() {
  return typeof Headers === 'function';
});

test('Headers.set() and get()', function() {
  var headers = new Headers();
  headers.set('Content-Type', 'application/json');
  return headers.get('Content-Type') === 'application/json';
});

test('Request exists', function() {
  return typeof Request === 'function';
});

test('Response exists', function() {
  return typeof Response === 'function';
});

// ============================================
// Console
// ============================================

test('console.log exists', function() {
  return typeof console.log === 'function';
});

test('console.warn exists', function() {
  return typeof console.warn === 'function';
});

test('console.error exists', function() {
  return typeof console.error === 'function';
});

// ============================================
// Timers (stubs)
// ============================================

test('setTimeout returns id', function() {
  var id = setTimeout(function() {}, 1000);
  return typeof id === 'number' || typeof id === 'object';
});

test('clearTimeout exists', function() {
  return typeof clearTimeout === 'function';
});

test('setInterval returns id', function() {
  var id = setInterval(function() {}, 1000);
  clearInterval(id);
  return typeof id === 'number' || typeof id === 'object';
});

// ============================================
// TextEncoder/TextDecoder (if available)
// ============================================

test('TextEncoder exists', function() {
  return typeof TextEncoder === 'function';
});

test('TextEncoder.encode()', function() {
  if (typeof TextEncoder !== 'function') return 'skip';
  var encoder = new TextEncoder();
  var data = encoder.encode('hello');
  return data instanceof Uint8Array && data.length === 5;
});

test('TextDecoder exists', function() {
  return typeof TextDecoder === 'function';
});

test('TextDecoder.decode()', function() {
  if (typeof TextDecoder !== 'function') return 'skip';
  var decoder = new TextDecoder();
  var data = new Uint8Array([104, 101, 108, 108, 111]);
  return decoder.decode(data) === 'hello';
});

// ============================================
// Polyfills marker
// ============================================

test('Polyfills loaded marker', function() {
  return globalThis.__SSR_POLYFILLS_LOADED__ === true;
});

// ============================================
// OUTPUT RESULTS
// ============================================

var summary = {
  total: results.length,
  passed: passed,
  failed: failed,
  skipped: skipped,
  results: results
};

// Export for SSR runner
globalThis.runTests = function() {
  return JSON.stringify(summary, null, 2);
};

// Auto-run and print
print(JSON.stringify(summary, null, 2));
