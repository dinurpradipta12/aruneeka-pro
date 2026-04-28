export const runtime = 'edge';

export async function GET() {
  const version = Date.now().toString();
  return Response.json({ version });
}
