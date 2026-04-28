export const runtime = 'edge';

export async function GET() {
  const version = Date.now().toString();
  return new Response(JSON.stringify({ version }), {
    headers: { 
      'Content-Type': 'application/json', 
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
