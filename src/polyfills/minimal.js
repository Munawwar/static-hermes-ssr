/**
 * Minimal Web API Polyfills for Static Hermes SSR
 *
 * Lightweight version with only essential polyfills.
 * ~30KB bundled, suitable for size-constrained environments.
 */

// ============================================
// CUSTOM URL (lighter than core-js-pure)
// ============================================
import './url.js';

// ============================================
// NPM PACKAGES (essential only)
// ============================================

// Event, EventTarget (event-target-shim)
import { EventTarget, Event } from 'event-target-shim';
globalThis.EventTarget = EventTarget;
globalThis.Event = Event;

// CustomEvent
if (!globalThis.CustomEvent) {
  class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.detail = options.detail !== undefined ? options.detail : null;
    }
  }
  globalThis.CustomEvent = CustomEvent;
}

// AbortController, AbortSignal (abort-controller)
import { AbortController, AbortSignal } from 'abort-controller';
globalThis.AbortController = AbortController;
globalThis.AbortSignal = AbortSignal;

// ============================================
// CUSTOM IMPLEMENTATIONS (SSR-specific)
// ============================================

// DOMException
import './exception.js';

// Base64 fallback
import './base64.js';

// Timer stubs
import './timers.js';

// Console capture
import './console.js';

// ============================================
// POLYFILLS LOADED MARKER
// ============================================
globalThis.__SSR_POLYFILLS_LOADED__ = true;
globalThis.__SSR_POLYFILLS_VERSION__ = '0.1.0-minimal';
