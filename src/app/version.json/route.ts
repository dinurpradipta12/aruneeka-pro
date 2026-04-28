import { APP_VERSION } from '@/lib/version';

export const runtime = 'edge';

// Temporary handler to stop the 404 noise from old browser caches
export async function GET() {
  return new Response(JSON.stringify({ version: APP_VERSION }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
