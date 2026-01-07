'use server';
import { NextResponse } from 'next/server';
import { initiateMultipartUpload } from '@/lib/helpers/s3.helper';
import { S3_CONFIG } from '@/lib/config';
import Logger from '@/lib/logger';
// POST /api/upload/init
export async function POST(req: Request) {
    const { fileName: key, contentType } = await req.json();
    const bucket = S3_CONFIG.bucket || '';
    Logger.log('POST /api/upload/init', key, bucket);
    if (!bucket) {
        return NextResponse.json({ error: 'S3 bucket is not configured' }, { status: 500 });
    }
    if (!key || !contentType) {
        return NextResponse.json({ error: 'Missing key or contentType' }, { status: 400 });
    }
    const uploadId = await initiateMultipartUpload({ 
        bucket,
        key,
        contentType 
    });
    const response = NextResponse.json({ uploadId });
    return response;
}
