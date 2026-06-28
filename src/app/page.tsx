export default function Home() {
  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem', background: '#0f172a', color: '#e2e8f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#2563eb', marginBottom: '1rem' }}>AuditX API</h1>
      <p style={{ color: '#64748b' }}>Backend opérationnel.</p>
      <ul style={{ marginTop: '1.5rem', lineHeight: 2 }}>
        <li>POST /api/auth/register</li>
        <li>POST /api/auth/login</li>
        <li>GET  /api/license/check</li>
        <li>POST /api/stripe/checkout</li>
        <li>POST /api/stripe/webhook</li>
      </ul>
    </main>
  );
}
