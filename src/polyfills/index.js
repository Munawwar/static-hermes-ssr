/**
 * Web API Polyfills for Static Hermes SSR
 *
 * Uses npm packages where Hermes-compatible, with custom
 * implementations for incompatible APIs.
 *
 * Import this file before your application code.
 */

// ============================================
// CUSTOM POLYFILLS (Hermes-incompatible in npm)
// ============================================

// DOMException - error subclass
import './exception.js';

// Event, CustomEvent, EventTarget - event-target-shim is NOT Hermes-compatible
import './event.js';

// Base64 encoding - atob, btoa
import './base64.js';

// URL, URLSearchParams - ES5 syntax for Hermes
import './url.js';

// Timer stubs - no-op for SSR
import './timers.js';

// Console - SSR-specific capture
import './console.js';

// Blob, File - ES5 syntax for Hermes
import './blob.js';

// FileReader - ES5 syntax for Hermes
import './filereader.js';

// crypto.randomUUID
import './crypto.js';

// HTTP types - Headers, Request, Response stubs
import './fetch-types.js';

// ============================================
// NPM PACKAGES (Hermes-compatible)
// ============================================

// AbortController, AbortSignal - works with our custom EventTarget
import { AbortController, AbortSignal } from 'abort-controller';
globalThis.AbortController = AbortController;
globalThis.AbortSignal = AbortSignal;

// structuredClone
import structuredClone from '@ungap/structured-clone';
if (!globalThis.structuredClone) {
  globalThis.structuredClone = structuredClone;
}

// ============================================
// POLYFILLS LOADED MARKER
// ============================================
globalThis.__SSR_POLYFILLS_LOADED__ = true;
globalThis.__SSR_POLYFILLS_VERSION__ = '0.3.0';
