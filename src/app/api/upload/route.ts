import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = req.headers.get('content-type') || '';

    // Handle JSON base64 payload
    if (contentType.includes('application/json')) {
      const { fileData, fileName, fileType } = await req.json();

      if (!fileData) {
        return NextResponse.json({ error: 'No file data provided' }, { status: 400 });
      }

      // Check size (approx 5MB limit)
      if (fileData.length > 7 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
      }

      // Allowed MIME types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
      if (fileType && !allowedTypes.includes(fileType.toLowerCase())) {
        return NextResponse.json(
          { error: 'Invalid file type. Allowed formats: PNG, JPG, WEBP, PDF.' },
          { status: 400 }
        );
      }

      // Return clean data URL
      const url = fileData.startsWith('data:') ? fileData : `data:${fileType || 'image/png'};base64,${fileData}`;

      return NextResponse.json({
        url,
        fileName: fileName || 'attachment',
        message: 'File uploaded successfully',
      });
    }

    // Handle multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file found in request' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mime = file.type || 'application/octet-stream';
    const dataUrl = `data:${mime};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}

