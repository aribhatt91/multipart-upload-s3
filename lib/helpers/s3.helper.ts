import "server-only";
import {
    UploadPartCommand,
    S3Client,
    CreateMultipartUploadCommand,
    AbortMultipartUploadCommand,  
    CompleteMultipartUploadCommand,
    ListPartsCommand,
    DeleteObjectCommand
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CONFIG } from "../config";
import Logger from "../logger";

const s3 = new S3Client({ region: S3_CONFIG.region });

export async function getSignedPartUrl({
  bucket,
  key,
  uploadId,
  partNumber,
}: {bucket: string, key: string, uploadId: string, partNumber: number}) {
  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return getSignedUrl(s3, command, { expiresIn: 60 });
}

export async function initiateMultipartUpload({ 
    bucket, 
    key, 
    contentType 
}: {bucket: string, key: string, contentType: string}) {
  try {
    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });
    const res = await s3.send(command);
    Logger.log('s3.helper:initiateMultipartUpload::res', res);
    const { UploadId } = res;
    return UploadId;
  }catch(error) {
    Logger.error('s3.helper:initiateMultipartUpload::error', error);
    throw error;
  }
}

export async function completeMultipartUpload({
  bucket,
  key,
  uploadId,
  parts,
}: {bucket: string, key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]}) {
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });

  await s3.send(command);
}

export async function abortMultipartUpload({
  bucket,
  key,
  uploadId,
}: {bucket: string, key: string, uploadId: string}) {
  const command = new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
  });

  await s3.send(command);
}


export async function getUploadStatus({ 
    bucket, 
    key,
    uploadId
}: {bucket: string, key: string, uploadId: string}) {
  /* const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  try {
    const response = await s3.send(command);
    return {
      exists: true,
      size: response.ContentLength,
      lastModified: response.LastModified,
    };
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return { exists: false };
    } else {
      throw error;
    }
  } */
}
/**
 * Deletes a file from S3.
 * @param bucketName - The name of the S3 bucket.
 * @param key - The 'path' or Key of the file in the bucket.
 */
export async function removeFile(bucketName: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    // NOTE: S3 DeleteObject is 'idempotent'. 
    // If the file doesn't exist, it still returns 204 (Success).
    await s3.send(command);
    
    Logger.log(`S3: successfully deleted ${key}`);
  } catch (error) {
    // In production, log to a service like Sentry/Datadog
    Logger.error("S3_DELETE_ERROR:", error);
    throw new Error(`Failed to delete file from S3: ${key}`);
  }
}

