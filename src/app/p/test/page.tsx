// Halaman statis murni (tanpa Edge runtime) untuk pengujian isolasi total
export default function TestPage() {
  return (
    <div style={{ padding: '100px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '900' }}>Static Test Success</h1>
      <p>Jika Anda melihat ini, berarti sistem folder /p/ bekerja untuk halaman statis.</p>
    </div>
  );
}
