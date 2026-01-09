/* eslint-disable @typescript-eslint/no-explicit-any */
import { IFile, TFunction } from '@/lib/types'
import { useMutationState } from '@tanstack/react-query';
import { useUploadStore } from '@/lib/store';
import Logger from '@/lib/logger';
import { useDeleteFile } from '@/lib/hooks/useDeleteFile';

function ProgressCircle({ percentage }: { percentage: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
          className="text-blue-600" />
      </svg>
      <span className="absolute text-[10px] font-bold">{percentage}%</span>
    </div>
  );
}

const EmptyState = () => {
  return <div className='h-96 w-full p-8 flex justify-center items-center'>
    <div className='text-sm text-center text-gray-400'>Such Empty. Much Wow!</div>
  </div>
}

const FileItemSkeleton = () => {
  return (<div className='file-list__item shadow animate-pulse'>
    <div className='flex flex-col flex-1'>
      <div className='w-2/5 h-2 mb-2 bg-gray-300 rounded-full'></div>
      <div className='w-1/5 h-2 mb-2 bg-gray-300 rounded-full'></div>
    </div>
  </div>)
}

const LoadingState = () => {
  return (<>
  <FileItemSkeleton />
  <FileItemSkeleton />
  <FileItemSkeleton />
  <FileItemSkeleton />
  </>)
}

const FileItem = ({ fileItem }: { fileItem: any }) => {
  const { mutate: deleteFile, isPending } = useDeleteFile();
  return <div className='file-list__item shadow'>
    <div className='flex flex-col flex-1'>
      <div className='text-sm font-bold text-gray-500 text-ellipsis'>{fileItem.fileName}</div>
      <div className='text-sm'>{new Date(fileItem.uploadFinished).toLocaleString() }</div>
    </div>
    <div className='p-2'>
      <button 
          onClick={() => deleteFile(fileItem)}
          disabled={isPending}
          className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-200"
        >{isPending ? "Removing": "Remove"}</button>
    </div>
  </div>
}

const ActiveFileItem = ({ activeFileItem }: { activeFileItem: any }) => {
  const managers = useUploadStore((s) => s.managers);
  const progressMap = useUploadStore((s) => s.progress);
  const manager = managers[activeFileItem.fileName];
  const pause = manager?.pause,
  resume = manager?.resume,
  state = manager?.getState();
  //Logger.log('ActiveFileItem::', activeFileItem, manager, state);
  return (
    <div key={activeFileItem.fileName} className="file-list__item shadow">
      <div className="flex items-center gap-4">
        <ProgressCircle percentage={progressMap[activeFileItem.fileName] || 0} />
        <div className='flex flex-col flex-1'>
          <div className="text-sm font-bold text-gray-500 text-ellipsis">{activeFileItem.fileName}</div>
          <div className="text-xs text-blue-500 capitalize">{state}</div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => {
            if(state === 'paused') {
              resume();
            }else {
              pause();
            }
          }}
          className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
        > {state === 'paused' ? 'Resume' : 'Pause'} </button>
      </div>
    </div>
  )
}

function FileList({ isLoading, remoteFiles }: { isLoading: boolean, remoteFiles: IFile[] }) {
  const activeUploads = useMutationState({
    filters: { mutationKey: ['upload-s3'] },
    select: (mutation) => ({
      fileName: (mutation.state.variables as any)?.file.name,
      status: mutation.state.status,
    }),
  });

  const sortedList = (remoteFiles || []).sort((a:IFile, b:IFile) => a.uploadStarted > b.uploadStarted ? 0 : 1);
  Logger.log('FileItem:sortedList', sortedList);
  return (
    <div className='file-list flex flex-col gap-2 py-6'>
      {
        activeUploads.map((upload) => (
          <ActiveFileItem 
            key={upload.fileName}
            activeFileItem={upload}
          />
        ))
      }
      {
        sortedList.map((item: IFile) => <FileItem fileItem={item} key={item.uploadId} />)
      }
      {
        !isLoading && !activeUploads.length && !sortedList.length && <EmptyState/>
      }
      {
        isLoading && !activeUploads.length && !sortedList.length && <LoadingState/> 
      }
    </div>
  )
}

export default FileList