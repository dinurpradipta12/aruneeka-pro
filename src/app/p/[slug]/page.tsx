import dynamic from 'next/dynamic';

const ClientPage = dynamic(() => import('./ClientPage'), { ssr: false });

export const runtime = 'edge';
export const dynamicRoute = 'force-dynamic';

export default function Page() {
  return <ClientPage />;
}
