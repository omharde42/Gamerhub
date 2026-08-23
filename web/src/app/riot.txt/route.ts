export const dynamic = 'force-static';

export function GET() {
  return new Response('71dcd910-804e-42e8-8e2a-91d7bb1b93af\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
