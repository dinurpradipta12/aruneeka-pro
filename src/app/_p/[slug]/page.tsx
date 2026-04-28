import ClientPageWrapper from './ClientPageWrapper';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return <ClientPageWrapper slug={resolvedParams.slug} />;
}
