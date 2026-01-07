
/* eslint-disable @typescript-eslint/no-explicit-any */
import LocalDBHelper from "./helpers/localdb.helper";
import { abortMultipartUpload, completeMultipartUpload, initialiseMultipartUpload, uploadFilePart } from "./helpers/upload.helper";
import { UploadStatus } from "./types";
import Logger from '@/lib/logger';

interface LocalState {
    uploadId: string
    uploadStatus: UploadStatus
}

class FileUploadManager {// 1. A private static instance of the class
    private activeController: AbortController | null = null;
    private uploadId: string | null;
    private static db: LocalDBHelper;
    private state: UploadStatus;
    private file: File;
    private progressFunction: (fileName: string, progress: number) => void;
    private chunkSize: number;
    

    constructor(file: File, progressFunction: (fileName: string, progress: number) => void, chunkSize: number = 5) {
        if(!FileUploadManager.db) {
            FileUploadManager.db = LocalDBHelper.getInstance()
        }
        this.file = file;
        this.progressFunction = progressFunction;
        this.state = 'initialized';
        this.uploadId = null;
        this.chunkSize = chunkSize || 5;
    }

    getState() {
        return this.state;
    }

    async upload() {
        try {
            Logger.log('FileUploadManager::Starting Upload', this.file.name, this.file.size);
            const CHUNK_SIZE = this.chunkSize * 1024 * 1024
            if(!this.file) {
                Logger.error('Upload in progress. Only one upload at a time!');
                throw new Error('Missing file.');
            }  

            const fileName = this.file.name,
            fileType = this.file.type,
            fileSize = this.file.size;
            
            /* if(this.getState() && this.getState() !== 'completed' || this.getState() !== 'aborted') {
                Logger.error('Upload in progress. Only one upload at a time!');
                throw new Error('Upload in progress. Only one upload at a time!')
            } */
            const parts = [];
            const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
            Logger.log('FileUploadManager::Splitted file', totalParts);
            
            // Initialize upload
            const uploadId = await initialiseMultipartUpload(fileName, fileType);
            if(!uploadId) {
                throw new Error('Upload ID not returned');
            }
            this.activeController = new AbortController();
            this.uploadId = uploadId;
            const uploadObj = {
                uploadId,
                fileName,
                fileType,
                uploadStarted: Date.now(),
                chunkSize: CHUNK_SIZE,
                chunksUploaded: [],
                chunksCount: totalParts,
                status: 'initialized'
            }
            await FileUploadManager.db.save('uploads', uploadObj);

            // Upload in parts
            for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
                if(this.getState() === 'paused') {
                    Logger.log('Upload paused');
                    await FileUploadManager.db.save('uploads', {
                        ...uploadObj,
                        chunksUploaded: parts,
                        status: 'paused'
                    });
                    return;
                }
                Logger.log('FileUploadManager::uploading part:', partNumber);
                const start = (partNumber - 1) * CHUNK_SIZE;
                const end = partNumber * CHUNK_SIZE;
                const chunk = this.file.slice(start, end);
                // Get signed URL
                const res = await uploadFilePart(uploadId, chunk, partNumber, fileName, this.activeController.signal);
                parts.push(res);
                // Update DB with progress
                await FileUploadManager.db.save('uploads', {
                    ...uploadObj,
                    chunksUploaded: parts,
                    status: partNumber === totalParts ? 'completed' : 'uploading'
                });
                this.state = parts.length === totalParts ? 'completed' : 'uploading';
                Logger.log('FileUploadManager::finished uploading part:', partNumber);
                if(this.state === 'completed') {
                    const complted = this.complete({
                        ...uploadObj,
                        chunksUploaded: parts,
                        tatus: 'completed'
                    });
                    this.progressFunction(this.file.name, 100);
                    return complted;
                }else {
                    this.progressFunction(this.file.name, Math.round((parts.length/totalParts)*100));
                }
                
            }
        }catch(error) {
            Logger.error('FileUploadManager::error', error);
            throw error;
        }finally {
            this.activeController = null;
        }
    }

    private async complete(uploadRecord: any) {
        try {
            
            uploadRecord['status'] = 'completed';
            uploadRecord['uploadFinished'] = Date.now();
            Logger.log('FileUploadManager:complete::', uploadRecord);
            const res = await completeMultipartUpload(uploadRecord);  
            // Delete the record from Local DB
            FileUploadManager.db.delete('uploads', uploadRecord.uploadId);
            // Ready for next upload
            this.state = 'completed';
            return uploadRecord;
        }catch (error) {
            Logger.error(error);
            throw error;
        }

    }
    async pause() {
        const uploadRecord = await FileUploadManager.db.get('uploads', this.uploadId || "");
        if (!uploadRecord) {
            throw new Error('No upload record found to resume');
        }
        uploadRecord['status'] = 'paused';
        await FileUploadManager.db.save('uploads', uploadRecord);
        this.state = 'paused';
        if(this.activeController) {
            this.activeController.abort();
        }
    }

    async resume() {
        const uploadId = this.uploadId || "";
        const uploadRecord = await FileUploadManager.db.get('uploads', uploadId);
        if (!uploadRecord) {
            throw new Error('No upload record found to resume');
        }
        if(!this.file) {
            throw new Error('Missing file.');
        }
        
        const { fileName, chunksUploaded, chunkSize: CHUNK_SIZE, chunksCount: totalParts } = uploadRecord;
        if(!this.file || this.file.name !== fileName) {
            throw new Error('File mismatch on resume');
        }
        this.state = 'uploading';
        const parts = chunksUploaded || [];

        // Upload in parts
        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            if(!parts.find((p: any) => p.PartNumber === partNumber)) {
                continue; // Skip already uploaded parts
            }
            if(this.getState() === 'paused') {
                Logger.log('Upload paused');
                return;
            }
            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = partNumber * CHUNK_SIZE;
            const chunk = this.file.slice(start, end);
            // Get signed URL
            const res = await uploadFilePart(uploadId, chunk, partNumber, fileName);
            parts.push(res);
            // Update DB with progress
            await FileUploadManager.db.save('uploads', {
                ...uploadRecord,
                chunksUploaded: parts,
                status: partNumber === totalParts ? 'completed' : 'uploading'
            });
            this.state = parts.length === totalParts ? 'completed' : 'uploading';
            
            if(this.state === 'completed') {
                const complted = this.complete({
                    ...uploadRecord,
                    chunksUploaded: parts,
                    tatus: 'completed'
                });
                this.progressFunction(this.file.name, 100);
                return complted;
            }else {
                this.progressFunction(this.file.name, Math.round((parts.length/totalParts)*100));
            }
        }
    }

    async abort() {
        const uploadRecord = await FileUploadManager.db.get('uploads', this.uploadId || "");
        if (!uploadRecord) {
            throw new Error('No upload record found to abort');
        }
        uploadRecord['status'] = 'aborted';
        if(this.activeController){
            this.activeController.abort();
        }
        await abortMultipartUpload(uploadRecord);
        this.state = 'aborted';
    }

    static async getUploadingFileList() {
        try {
            const records = await FileUploadManager.db.getAll('uploads');
            return records || [];
        }catch(error) {
            Logger.error('Error fetching currently uploading files', error);
            throw error;
        }
    }
}

export default FileUploadManager;
