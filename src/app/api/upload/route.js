import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { s3Client, bucketName } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Get file extension and validate if it's an image
    const fileExtension = file.name.split('.').pop() || 'png';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return Response.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Generate unique file key
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const key = `uploads/qr-${uniqueId}.${fileExtension.toLowerCase()}`;

    // Upload to Cloudflare R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: file.type || 'image/png',
      })
    );

    // Return the proxy URL
    const fileUrl = `/api/uploads?key=${encodeURIComponent(key)}`;

    return Response.json({ 
      success: true, 
      url: fileUrl,
      key: key
    });
  } catch (error) {
    console.error('Upload API Error:', error);
    return Response.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
