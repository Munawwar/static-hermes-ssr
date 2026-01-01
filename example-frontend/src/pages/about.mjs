// About page component
export function renderAbout(data) {
  return `<div style="display: flex; max-width: 900px; margin: auto;">
    <div style="padding: 20px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; line-height: 1.8em;">
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <a href="/"><img src="/public/preact-logo.svg" height="64" width="64" alt="logo" /></a>
      </div>
      <a class="navitem" href="/">Home</a>
      <a class="navitem is-active" href="/about">About</a>
      <a class="navitem" href="/blog">Blog</a>
    </div>
    <div id="page-content" style="padding: 20px; padding-bottom: 50px; border-left: 2px solid #eee; min-height: 100vh;">
      <h1>About Static Hermes SSR</h1>
      <p>This project demonstrates compiling JavaScript to native code using Facebook's Static Hermes compiler.</p>
      <h2>Key Features:</h2>
      <ul>
        <li><strong>AOT Compilation</strong>: JavaScript compiled to C, then to native machine code</li>
        <li><strong>Fast Cold Start</strong>: ~2.7ms (vs Node.js ~10-12ms)</li>
        <li><strong>Fast Warm Execution</strong>: ~0.17ms with persistent server</li>
        <li><strong>Low Memory</strong>: ~8MB (vs Node.js ~40-50MB)</li>
        <li><strong>Single Binary</strong>: All ${data.routeCount || 3} routes in one ~7MB binary</li>
      </ul>
      <p>User context: ${data.user || 'Anonymous'}</p>
    </div>
  </div>`;
}
