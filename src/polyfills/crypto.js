/**
 * Crypto polyfill for Static Hermes SSR
 * - crypto.getRandomValues: requires native implementation (injected via C++)
 * - crypto.randomUUID: implemented in JS using getRandomValues
 */

(function() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) return;

  // Create crypto object if it doesn't exist
  if (!globalThis.crypto) {
    globalThis.crypto = {};
  }

  const crypto = globalThis.crypto;

  // randomUUID - generates a v4 UUID using getRandomValues
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where x is random hex and y is 8, 9, a, or b
  if (!crypto.randomUUID) {
    crypto.randomUUID = function randomUUID() {
      if (!crypto.getRandomValues) {
        throw new Error('crypto.getRandomValues is not available. Native implementation required.');
      }

      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);

      // Set version (4) and variant (RFC 4122)
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

      const hex = [];
      for (let i = 0; i < 16; i++) {
        hex.push(bytes[i].toString(16).padStart(2, '0'));
      }

      return (
        hex.slice(0, 4).join('') + '-' +
        hex.slice(4, 6).join('') + '-' +
        hex.slice(6, 8).join('') + '-' +
        hex.slice(8, 10).join('') + '-' +
        hex.slice(10, 16).join('')
      );
    };
    crypto.randomUUID.__polyfilled__ = true;
  }

  // Stub for crypto.subtle - Phase 2 implementation
  if (!crypto.subtle) {
    crypto.subtle = {
      digest: function() {
        return Promise.reject(new Error('crypto.subtle.digest requires native implementation (Phase 2)'));
      },
      encrypt: function() {
        return Promise.reject(new Error('crypto.subtle.encrypt requires native implementation (Phase 2)'));
      },
      decrypt: function() {
        return Promise.reject(new Error('crypto.subtle.decrypt requires native implementation (Phase 2)'));
      },
      sign: function() {
        return Promise.reject(new Error('crypto.subtle.sign requires native implementation (Phase 2)'));
      },
      verify: function() {
        return Promise.reject(new Error('crypto.subtle.verify requires native implementation (Phase 2)'));
      },
      generateKey: function() {
        return Promise.reject(new Error('crypto.subtle.generateKey requires native implementation (Phase 2)'));
      },
      deriveKey: function() {
        return Promise.reject(new Error('crypto.subtle.deriveKey requires native implementation (Phase 2)'));
      },
      deriveBits: function() {
        return Promise.reject(new Error('crypto.subtle.deriveBits requires native implementation (Phase 2)'));
      },
      importKey: function() {
        return Promise.reject(new Error('crypto.subtle.importKey requires native implementation (Phase 2)'));
      },
      exportKey: function() {
        return Promise.reject(new Error('crypto.subtle.exportKey requires native implementation (Phase 2)'));
      },
      wrapKey: function() {
        return Promise.reject(new Error('crypto.subtle.wrapKey requires native implementation (Phase 2)'));
      },
      unwrapKey: function() {
        return Promise.reject(new Error('crypto.subtle.unwrapKey requires native implementation (Phase 2)'));
      }
    };
    crypto.subtle.__stubbed__ = true;
  }
})();
