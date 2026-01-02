/**
 * All custom polyfills - no npm packages
 */

// Custom implementations only
import './exception.js';       // DOMException
import './event.js';           // Event, CustomEvent, EventTarget
import './abort.js';           // AbortController, AbortSignal
import './base64.js';          // atob, btoa
import './url.js';             // URL, URLSearchParams
import './timers.js';          // setTimeout, setInterval (no-op for SSR)
import './console.js';         // console.log/warn/error
import './structured-clone.js';// structuredClone
import './blob.js';            // Blob, File
import './filereader.js';      // FileReader
import './crypto.js';          // crypto.randomUUID
import './fetch-types.js';     // Headers, Request, Response

globalThis.__SSR_POLYFILLS_LOADED__ = true;
globalThis.__SSR_POLYFILLS_VERSION__ = '0.2.0';
