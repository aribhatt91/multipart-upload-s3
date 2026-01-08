/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';
import { NextResponse } from 'next/server';
import { removeFile } from '@/lib/helpers/s3.helper';
import { DB_CONFIG, S3_CONFIG } from '@/lib/config';
import { deleteDocumentById } from '@/lib/helpers/db.helper';
import Logger from '@/lib/logger';

// DELETE /api/upload/remove
export async function DELETE(req: Request) {
    const body = await req.json();
    Logger.log('DELETE /api/upload/remove:body', body);
    const { uploadId, fileName: key } = body;
    const bucket = S3_CONFIG.bucket || '';
    Logger
    if (!bucket) {
        return NextResponse.json({ error: 'S3 bucket is not configured' }, { status: 500 });
    }
    if (!key) {
        return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }
    try {
        // Remove from S3 Storage
        await removeFile(bucket, key);
        // Save to DB
        await deleteDocumentById(DB_CONFIG.table, uploadId);
        const response = NextResponse.json({ 
            message: `Removed file:  ${key}`
        });
        return response;
    }catch(error: any) {
        Logger.error(error);
        return NextResponse.json({ error: error?.message || 'Error removing file' }, { status: 500 });
    }
}
