/**
 * Multi-Route SSR Router with Preact
 *
 * This demonstrates the scalable architecture:
 * - Real Preact components with JSX
 * - All routes bundled into ONE file by esbuild
 * - Compiled to native binary by shermes
 * - Add 100 routes, still ~7MB (runtime is the overhead)
 */

import { h } from 'preact';
import render from 'preact-render-to-string';
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import BlogPage from './pages/BlogPage.jsx';

// Route registry - maps routes to Preact components
const routes = {
  '/': HomePage,
  '/home': HomePage,
  '/about': AboutPage,
  '/blog': BlogPage,
};

/**
 * Render a page component to HTML string
 */
function renderRoute(route, data) {
  const Component = routes[route];

  if (!Component) {
    // 404 page
    return `<html>
      <head><title>404 - Not Found</title></head>
      <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: auto;">
        <h1>404 - Not Found</h1>
        <p>Route "<strong>${route}</strong>" does not exist.</p>
        <p>Available routes:</p>
        <ul>
          ${Object.keys(routes).map(r => `<li><a href="${r}">${r}</a></li>`).join('\n          ')}
        </ul>
      </body>
    </html>`;
  }

  // Add route count to data
  data.routeCount = Object.keys(routes).length;

  // Render Preact component to HTML
  return render(h(Component, data));
}

/**
 * Global entry point called from C++ wrapper
 *
 * Expected JSON format:
 * {
 *   "route": "/about",
 *   "user": "Alice",
 *   ... component props
 * }
 */
globalThis.renderPage = function(jsonString) {
  const input = JSON.parse(jsonString);
  const { route = '/', ...data } = input;

  return renderRoute(route, data);
};
