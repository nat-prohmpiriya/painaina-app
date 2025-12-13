// Health check endpoint for Docker and Cloud Run
export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'customer-web',
    },
    { status: 200 }
  );
}
