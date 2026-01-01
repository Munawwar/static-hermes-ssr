// Home page component
export function renderHome(data) {
  return `<div style="display: flex; max-width: 900px; margin: auto;">
    <div style="padding: 20px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; line-height: 1.8em;">
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <a href="/"><img src="/public/preact-logo.svg" height="64" width="64" alt="logo" /></a>
      </div>
      <a class="navitem is-active" href="/">Home</a>
      <a class="navitem" href="/about">About</a>
      <a class="navitem" href="/blog">Blog</a>
    </div>
    <div id="page-content" style="padding: 20px; padding-bottom: 50px; border-left: 2px solid #eee; min-height: 100vh;">
      <h1>Welcome</h1>
      <p>This page is rendered at <strong>${new Date().toISOString()}</strong></p>
      <ul>
        <li>Rendered to HTML using Static Hermes</li>
        <li>Counter value: <strong>${data.counter || 0}</strong></li>
        <li>Native binary execution (~0.17ms warm)</li>
      </ul>
    </div>
  </div>`;
}
