import ClientPageWrapper from './ClientPageWrapper';

// Mengelabui Cloudflare agar tidak memaksa Edge shim yang crash (bug next-on-pages)
export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <ClientPageWrapper />;
}


