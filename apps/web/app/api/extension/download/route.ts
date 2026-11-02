import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const zipPath = path.join(process.cwd(), 'public', 'downloads', 'silent-qa-flight-recorder.zip');

    if (!fs.existsSync(zipPath)) {
      // Check in apps/web/public/downloads as fallback
      const altPath = path.join(process.cwd(), 'apps', 'web', 'public', 'downloads', 'silent-qa-flight-recorder.zip');
      if (fs.existsSync(altPath)) {
        const fileBuffer = fs.readFileSync(altPath);
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="silent-qa-flight-recorder-v1.0.0.zip"',
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
      return NextResponse.json({ error: 'Extension package not found. Run package script.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(zipPath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="silent-qa-flight-recorder-v1.0.0.zip"',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Download error' }, { status: 500 });
  }
}

