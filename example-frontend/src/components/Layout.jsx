import { h } from 'preact';

function NavLink({ href, active, children }) {
  const className = active ? 'navitem is-active' : 'navitem';
  return <a className={className} href={href}>{children}</a>;
}

export default function Layout({ activeRoute, children }) {
  return (
    <div style={{ display: 'flex', maxWidth: '900px', margin: 'auto' }}>
      <div style={{
        padding: '20px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: '1.8em'
      }}>
        <div style={{ marginTop: '20px', marginBottom: '10px' }}>
          <a href="/">
            <img src="/public/preact-logo.svg" height="64" width="64" alt="logo" />
          </a>
        </div>
        <NavLink href="/" active={activeRoute === '/'}>Home</NavLink>
        <NavLink href="/about" active={activeRoute === '/about'}>About</NavLink>
        <NavLink href="/blog" active={activeRoute === '/blog'}>Blog</NavLink>
      </div>

      <div style={{
        padding: '20px',
        paddingBottom: '50px',
        borderLeft: '2px solid #eee',
        minHeight: '100vh'
      }}>
        {children}
      </div>
    </div>
  );
}
