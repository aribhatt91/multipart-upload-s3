/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import { NextResponse } from 'next/server';
import { completeMultipartUpload } from '@/lib/helpers/s3.helper';
import { DB_CONFIG, S3_CONFIG } from '@/lib/config';
import { saveDocument } from '@/lib/helpers/db.helper';
import Logger from '@/lib/logger';
// POST /api/upload/complete
export async function POST(req: Request) {
    const body = await req.json();
    Logger.log('POST /api/upload/complete:body', body);
    const { uploadId, fileName: key, chunksUploaded: parts } = body;
    const bucket = S3_CONFIG.bucket || '';
    Logger
    if (!bucket) {
        return NextResponse.json({ error: 'S3 bucket is not configured' }, { status: 500 });
    }
    if (!key) {
        return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }
    try {
        const partsVerified = parts && Array.isArray(parts) && parts.every((part: any) => part.PartNumber && part.ETag);
        if (!partsVerified) {
            return NextResponse.json({ error: 'Invalid parts data' }, { status: 400 });
        }
        const partsMapped: { ETag: string; PartNumber: number; }[] = parts.map((part: any) => {
            return {
                ETag: part.ETag,
                PartNumber: Number(part.PartNumber)
            }
        })
        await completeMultipartUpload({ 
            uploadId,
            bucket, 
            key,
            parts: partsMapped
        });
        // Save to DB
        const publicUrl = `https://${bucket}.s3.${S3_CONFIG.region}.amazonaws.com/${key}`;
        delete body['chunksUploaded'];
        await saveDocument(DB_CONFIG.table, {
            ...body,
            publicUrl
        });
        const response = NextResponse.json({ 
            message: `Completed upload for file:  ${key}`
        });
        return response;
    }catch(error: any) {
        Logger.error(error);
        return NextResponse.json({ error: error?.message || 'Error completing upload' }, { status: 500 });
    }
    
}
