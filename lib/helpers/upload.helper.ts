/* eslint-disable @typescript-eslint/no-explicit-any */

import { UploadStatus, IFile } from "../types";
import Logger from "../logger";

export async function initialiseMultipartUpload(fileName: string, contentType: string) {
    try {
        const res = await fetch('/api/upload/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName,
                contentType
            }),
        });
        if(!res.ok) {
            Logger.error('initialiseMultipartUpload::error', res);
            throw new Error(res.statusText);
        }
        const { uploadId } = await res.json();
        Logger.log('initialiseMultipartUpload::res', res);
        return uploadId;
    } catch (error) {
        Logger.error('initialiseMultipartUpload::error', error);
        throw error;
    }
}

export async function uploadFilePart(uploadId: string, chunk: any, partNumber: number, key: string, signal: any = null) {
    try {
        const res = await fetch('/api/upload/part-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadId,
                partNumber,
                key
            }),
            signal
        });

        if(!res.ok) {
            Logger.error('uploadFilePart::error', res);
            throw new Error("Error fetching signed URL: " + res.statusText);
        }

        const { signedUrl } = await res.json();

        // Upload chunk DIRECTLY to S3
        const uploadRes = await fetch(signedUrl, {
            method: 'PUT',
            body: chunk,
        });

        if(!uploadRes.ok) {
            Logger.error('uploadFilePart::error', uploadRes);
            throw new Error(`Error uploading chunk:${partNumber} signed URL: ${uploadRes.statusText}`);
        }

        // Save ETag returned by S3
        const eTag = uploadRes.headers.get('etag');

        const part = {
            PartNumber: partNumber,
            ETag: eTag,
        };
        return part;
    } catch (error) {
        console.error(`Error uploading part ${partNumber}:`, error);
        throw error;
    }
}

async function getUploadStatus(bucket: string, key: string, uploadId: string) {}

export async function abortMultipartUpload(uploadObj: any) {
    try {
        const res = await fetch('/api/upload/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadObj),
        });
        return res.json();
    }catch(error) {
        console.error('error completing upload', error);
        throw error;
    }
}

export async function completeMultipartUpload(uploadObject: any) {
    try {
        const res = await fetch('/api/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadObject),
        });
        if(!res.ok) {
            throw new Error(res.statusText);
        }
        return res.json();
    }catch(error) {
        console.error('error completing upload', error);
        throw error;
    }
    
}

export const fetchUploadedFiles = async () => {
    let response: any = await fetch('/api/upload/list');
    if (!response.ok) {
        // This allows TanStack Query to trigger the 'error' state properly
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: Failed to fetch files`);
    }
    response = await response.json();
    Logger.log('fetchUploadedFiles::response', response?.data);
    return response?.data;
};


