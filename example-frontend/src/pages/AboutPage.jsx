import { h } from 'preact';
import Layout from '../components/Layout.jsx';

export default function AboutPage({ user = 'Anonymous', routeCount = 0 }) {
  return (
    <Layout activeRoute="/about">
      <h1>About Static Hermes SSR</h1>
      <p>This project demonstrates compiling JavaScript to native code using Facebook's Static Hermes compiler.</p>

      <h2>Key Features:</h2>
      <ul>
        <li><strong>AOT Compilation</strong>: JavaScript compiled to C, then to native machine code</li>
        <li><strong>Fast Cold Start</strong>: ~2.7ms (vs Node.js ~10-12ms)</li>
        <li><strong>Fast Warm Execution</strong>: ~0.17ms with persistent server</li>
        <li><strong>Low Memory</strong>: ~8MB (vs Node.js ~40-50MB)</li>
        <li><strong>Single Binary</strong>: All {routeCount} routes in one ~7MB binary</li>
      </ul>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '4px' }}>
        <p>👤 User context: <strong>{user}</strong></p>
        <p>🚀 Built with real Preact components</p>
      </div>
    </Layout>
  );
}
