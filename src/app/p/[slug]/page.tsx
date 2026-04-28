import ClientPageWrapper from './ClientPageWrapper';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function Page(props: any) {
  // Lintas versi: params mungkin objek atau butuh di-unwrap, 
  // tapi untuk render awal kita teruskan saja apa adanya.
  return <ClientPageWrapper slug={props.params?.slug} />;
}
