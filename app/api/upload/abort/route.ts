/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import { NextResponse } from 'next/server';
import { abortMultipartUpload } from '@/lib/helpers/s3.helper';
import { DB_CONFIG, S3_CONFIG } from '@/lib/config';
import { saveDocument } from '@/lib/helpers/db.helper';

// POST /api/upload/abort
export async function POST(req: Request) {
    const body = await req.json();
    const { uploadId, fileName: key } = body;
    const bucket = S3_CONFIG.bucket || '';
    if (!bucket) {
        return NextResponse.json({ error: 'S3 bucket is not configured' }, { status: 500 });
    }
    if (!key) {
        return NextResponse.json({ error: 'Missing key or contentType' }, { status: 400 });
    }
    try {
        await abortMultipartUpload({ 
            uploadId,
            bucket, 
            key
        });
        
        // Save to DB
        delete body['chunksUploaded'];
        await saveDocument(DB_CONFIG.table, body);

        const response = NextResponse.json({ 
            message: `Aborted upload for file:  ${key}`
        });
        return response;
    }catch(error: any) {
        console.error(error);
        return NextResponse.json({ error: error?.message || 'Error aborting upload' }, { status: 500 });
    }
}
