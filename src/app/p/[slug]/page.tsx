import ClientPageWrapper from './ClientPageWrapper';

// Cloudflare Pages WAJIB edge runtime untuk semua non-static routes
export const runtime = 'edge';

export default function Page() {
  return <ClientPageWrapper />;
}
