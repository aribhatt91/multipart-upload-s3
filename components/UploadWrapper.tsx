/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
//import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useS3Upload } from '@/lib/hooks/useS3Upload';
import DropFileInput from './DropFileInput';
//import { IFile } from '@/lib/types';
import Logger from '@/lib/logger';
import { fetchUploadedFiles } from '@/lib/helpers/upload.helper';
import FileList from './FileList';

function UploadWrapper() {
    const { mutate, status, variables } = useS3Upload();

    // Fetch remote files to check for duplicates
    const { 
        data: remoteFiles = [], 
        isLoading, 
        isError, 
        error, 
        refetch     
    } = useQuery({
        queryKey: ['remote-files'],
        queryFn: fetchUploadedFiles,
        // Industry-grade configurations:
        retry: 3,                 // Automatically retry 3 times before failing
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes (prevents spamming API)
        refetchOnWindowFocus: true, // Refresh list when user comes back to the tab
    });

    Logger.log('UploadWrapper:RemoteFiles', remoteFiles);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        Logger.log('UploadWrapper::handleFileUpload::Received file', file.name);

        // Duplicate Check
        const isDuplicate = remoteFiles.some((f: any) => f.fileName === file.name);
        if (isDuplicate) {
            alert("This file has already been uploaded.");
            return;
        }

        //const id = crypto.randomUUID();
        // Logic here: 1. Save to IndexedDB, 2. Trigger Mutate
        mutate({ file });
    }


    return (<>
        <div className='flex-1 p-6 max-h-96'>
            <DropFileInput onFileChange={handleFileUpload} />
        </div>
        <div className='flex-1 p-6 max-h-96'>
            <div className='w-full flex justify-between'><h3 className='text-xl'>Files</h3><button className='bg-white py-1 px-2 outline-none text-blue-500 hover:bg-gray-200 duration-150 transition-all focus:outline-none border-0 rounded-b-sm text-sm'>Refresh</button></div>
            <div className='w-full overflow-auto'>
                <FileList isLoading={isLoading} remoteFiles={remoteFiles} />
            </div>
        </div>
    </>
    
  )
}

export default UploadWrapper