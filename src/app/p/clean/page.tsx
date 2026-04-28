'use client';

// Halaman ini tidak mengimpor apapun dari @/components untuk isolasi total
export default function CleanPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#916DD5',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900' }}>CLEAN PAGE SUCCESS</h1>
        <p>Jika Anda melihat ini, berarti routing Cloudflare BEKERJA.</p>
        <p>Masalahnya ada pada salah satu komponen di /components/.</p>
      </div>
    </div>
  );
}
