import { h } from 'preact';
import Layout from '../components/Layout.jsx';

export default function HomePage({ counter = 0, routeCount = 0 }) {
  return (
    <Layout activeRoute="/">
      <h1>Welcome to Static Hermes SSR</h1>
      <p>This page is rendered at <strong>{new Date().toISOString()}</strong></p>
      <ul>
        <li>Rendered to HTML using Static Hermes + Preact</li>
        <li>Counter value: <strong>{counter}</strong></li>
        <li>Native binary execution (~0.17ms warm)</li>
        <li>Handling {routeCount} routes in one ~7MB binary</li>
      </ul>
      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '4px' }}>
        <strong>🎯 Real Preact Components</strong>
        <p>This is a real Preact component with JSX, bundled with esbuild!</p>
      </div>
    </Layout>
  );
}
