import { h } from 'preact';
import Layout from '../components/Layout.jsx';

const defaultPosts = [
  { id: 1, title: "Getting Started with Static Hermes", excerpt: "Learn how to compile JavaScript to native code." },
  { id: 2, title: "Performance Benchmarks", excerpt: "Cold start vs warm execution comparison." },
  { id: 3, title: "Scaling Multi-Route SSR", excerpt: "How to handle 100+ routes in a single binary." }
];

function BlogPost({ post }) {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '4px'
    }}>
      <h3 style={{ marginTop: 0 }}>{post.title}</h3>
      <p style={{ color: '#666' }}>{post.excerpt}</p>
      <a href={`/blog/${post.id}`} style={{ color: '#007acc' }}>Read more →</a>
    </div>
  );
}

export default function BlogPage({ posts = defaultPosts }) {
  return (
    <Layout activeRoute="/blog">
      <h1>Blog</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Latest articles about Static Hermes SSR
      </p>

      {posts.map(post => <BlogPost key={post.id} post={post} />)}

      <div style={{ marginTop: '30px', padding: '15px', background: '#fff3cd', borderRadius: '4px' }}>
        <strong>💡 Component Reusability</strong>
        <p>The BlogPost component is reused {posts.length} times with different props!</p>
      </div>
    </Layout>
  );
}
