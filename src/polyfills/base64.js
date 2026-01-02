/**
 * atob and btoa polyfill for Static Hermes SSR
 * Note: Hermes may already have these built-in, this is a fallback
 */

(function() {
  // Check if already available (Hermes has these built-in)
  if (globalThis.atob && globalThis.btoa) {
    return;
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  // btoa: binary string to base64
  function btoa(str) {
    if (str === undefined || str === null) {
      throw new TypeError('The string to be encoded contains characters outside of the Latin1 range.');
    }

    str = String(str);
    let result = '';

    for (let i = 0; i < str.length; i += 3) {
      const a = str.charCodeAt(i);
      const b = str.charCodeAt(i + 1);
      const c = str.charCodeAt(i + 2);

      // Check for characters outside Latin1 range
      if (a > 255 || (b !== undefined && b > 255) || (c !== undefined && c > 255)) {
        throw new DOMException(
          'The string to be encoded contains characters outside of the Latin1 range.',
          'InvalidCharacterError'
        );
      }

      result += chars[a >> 2];
      result += chars[((a & 3) << 4) | ((b || 0) >> 4)];
      result += i + 1 < str.length ? chars[((b & 15) << 2) | ((c || 0) >> 6)] : '=';
      result += i + 2 < str.length ? chars[c & 63] : '=';
    }

    return result;
  }
  btoa.__polyfilled__ = true;

  // atob: base64 to binary string
  function atob(str) {
    if (str === undefined || str === null) {
      throw new TypeError('The string to be decoded is not correctly encoded.');
    }

    str = String(str);

    // Remove whitespace
    str = str.replace(/[\t\n\f\r ]/g, '');

    // Validate length and padding
    if (str.length % 4 === 1) {
      throw new DOMException(
        'The string to be decoded is not correctly encoded.',
        'InvalidCharacterError'
      );
    }

    // Remove padding
    let len = str.length;
    if (str[len - 1] === '=') {
      len--;
      if (str[len - 1] === '=') {
        len--;
      }
    }

    // Validate characters
    for (let i = 0; i < len; i++) {
      const c = str[i];
      if (!chars.includes(c)) {
        throw new DOMException(
          'The string to be decoded is not correctly encoded.',
          'InvalidCharacterError'
        );
      }
    }

    let result = '';

    for (let i = 0; i < len; i += 4) {
      const a = lookup[str.charCodeAt(i)];
      const b = lookup[str.charCodeAt(i + 1)];
      const c = lookup[str.charCodeAt(i + 2)];
      const d = lookup[str.charCodeAt(i + 3)];

      result += String.fromCharCode((a << 2) | (b >> 4));
      if (i + 2 < len) {
        result += String.fromCharCode(((b & 15) << 4) | (c >> 2));
      }
      if (i + 3 < len) {
        result += String.fromCharCode(((c & 3) << 6) | d);
      }
    }

    return result;
  }
  atob.__polyfilled__ = true;

  globalThis.btoa = btoa;
  globalThis.atob = atob;
})();
