// Blog page component
export function renderBlog(data) {
  const posts = data.posts || [
    { id: 1, title: "Getting Started with Static Hermes", excerpt: "Learn how to compile JavaScript to native code." },
    { id: 2, title: "Performance Benchmarks", excerpt: "Cold start vs warm execution comparison." },
    { id: 3, title: "Scaling Multi-Route SSR", excerpt: "How to handle 100+ routes in a single binary." }
  ];

  const postsHtml = posts.map(post => `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
      <h3 style="margin-top: 0;">${post.title}</h3>
      <p style="color: #666;">${post.excerpt}</p>
      <a href="/blog/${post.id}" style="color: #007acc;">Read more →</a>
    </div>
  `).join('');

  return `<div style="display: flex; max-width: 900px; margin: auto;">
    <div style="padding: 20px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; line-height: 1.8em;">
      <div style="margin-top: 20px; margin-bottom: 10px;">
        <a href="/"><img src="/public/preact-logo.svg" height="64" width="64" alt="logo" /></a>
      </div>
      <a class="navitem" href="/">Home</a>
      <a class="navitem" href="/about">About</a>
      <a class="navitem is-active" href="/blog">Blog</a>
    </div>
    <div id="page-content" style="padding: 20px; padding-bottom: 50px; border-left: 2px solid #eee; min-height: 100vh;">
      <h1>Blog</h1>
      <p style="color: #666; margin-bottom: 30px;">Latest articles about Static Hermes SSR</p>
      ${postsHtml}
    </div>
  </div>`;
}
