import { s3Client, bucketName } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return Response.json({ error: 'Missing file key' }, { status: 400 });
    }

    // Fetch the file from Cloudflare R2
    const data = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    // Convert the ReadableStream of the body to stream response
    const bodyStream = data.Body;
    const headers = new Headers();
    headers.set('Content-Type', data.ContentType || 'image/png');
    // Set cache control for performance
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(bodyStream, {
      headers,
    });
  } catch (error) {
    console.error('Proxy Error fetching file from R2:', error);
    return Response.json({ error: 'File not found' }, { status: 404 });
  }
}
