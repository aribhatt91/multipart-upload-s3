import { NextRequest, NextResponse } from 'next/server';
import { getSignedPartUrl } from '@/lib/helpers/s3.helper';
import Logger from '@/lib/logger';
import { S3_CONFIG } from '@/lib/config';
// POST /api/upload/part-url
export async function POST(req: NextRequest) {
  /* try {

  }catch(error) {
    Logger.log('POST /api/upload/part-url::error', error);
    NextResponse.json()
  } */
  const { uploadId, partNumber, key } = await req.json();

  const signedUrl = await getSignedPartUrl({
    bucket: S3_CONFIG.bucket || '',
    key,
    uploadId,
    partNumber,
  });

  Logger.log('POST /api/upload/part-url::res', signedUrl);

  return NextResponse.json({ signedUrl });
}
