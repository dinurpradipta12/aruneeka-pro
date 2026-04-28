import { APP_VERSION } from '@/lib/version';

export const runtime = 'edge';

export async function GET() {
  return new Response(JSON.stringify({ version: APP_VERSION }), {
    headers: { 
      'Content-Type': 'application/json', 
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
