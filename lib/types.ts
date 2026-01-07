/* eslint-disable @typescript-eslint/no-explicit-any */
export type TFunction = (...args: any[]) => any;
export type UploadStatus = 'initialized' | 'uploading' | 'paused' | 'completed' | 'aborted'
export interface IFile {
    uploadId: string
    fileName: string
    fileType?: string
    status: UploadStatus
    uploadStarted: string
    uploadFinished?: string
    chunkSize?: number
    chunksCount?: number
    chunksUploaded?: any[]
    publicUrl?: string
}