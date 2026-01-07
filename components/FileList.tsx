/* eslint-disable @typescript-eslint/no-explicit-any */
import { IFile } from '@/lib/types'
import { useMutationState } from '@tanstack/react-query';
import { useUploadStore } from '@/lib/store';
import Logger from '@/lib/logger';

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

const FileItem = ({ fileItem }: { fileItem: any }) => {
  return <div className='file-list__item shadow'>
    <div className='flex flex-col flex-1'>
      <div className='text-sm font-bold text-gray-500 text-ellipsis'>{fileItem.fileName}</div>
      <div className='text-sm'>{new Date(fileItem.uploadFinished).toLocaleString() }</div>
    </div>
    <div></div>
  </div>
}

function FileList({ isLoading, remoteFiles }: { isLoading: boolean, remoteFiles: IFile[] }) {
  const progressMap = useUploadStore((s) => s.progress);
  const managers = useUploadStore((s) => s.managers);

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
    <div className='file-list flex flex-col gap-1 py-6'>
      {
        activeUploads.map((upload) => (
          <div key={upload.fileName} className="file-list__item shadow">
            <div className="flex items-center gap-4">
              <ProgressCircle percentage={progressMap[upload.fileName] || 0} />
              <div className='flex flex-col flex-1'>
                <div className="text-sm font-bold text-gray-500 text-ellipsis">{upload.fileName}</div>
                <div className="text-xs text-blue-500 capitalize">{upload.status}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => managers[upload.fileName]?.pause()}
                className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
              > Pause </button>
              <button 
                onClick={() => managers[upload.fileName]?.resume()}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              > Resume </button>
            </div>
          </div>
        ))
      }
      {
        sortedList.map((item: IFile) => <FileItem fileItem={item} key={item.uploadId} />)
      }
    </div>
  )
}

export default FileList