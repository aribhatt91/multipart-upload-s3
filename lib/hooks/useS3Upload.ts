/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUploadStore } from '@/lib/store';
import FileUploadManager from '@/lib/FileUploadManager';
import Logger from '../logger';

export const useS3Upload = () => {
    const queryClient = useQueryClient();
    const { setProgress, setManager } = useUploadStore();

    return useMutation({
        mutationKey: ['upload-s3'],
        mutationFn: async ({ file }: { file: File }) => {
            try {
                const manager = new FileUploadManager(file, (id: string, pct: number) => {
                    Logger.log('useS3Upload:useMutation::progress', id, pct);
                    setProgress(id, pct);
                }, 5);   
                
                setManager(file.name, manager);
                Logger.log('useS3Upload:useMutation::', file.name, manager);
                const res = await manager.upload();
                Logger.log('useS3Upload:useMutation::result', res);
                return res;
            }catch(error) {
                Logger.error('useS3Upload:useMutation::error', error);
                throw error;
            }
            
        },
        onSuccess: (data: any, variables) => {
            Logger.log('useS3Upload:useMutation::onSuccess');
            // 1. Refresh the right-hand list once a file moves to the remote DB
            queryClient.invalidateQueries({ queryKey: ['remote-files'] });
            // 2. IMPORTANT: Remove this specific mutation from the cache
            // This makes it disappear from useMutationState immediately
            queryClient.getMutationCache().findAll({ mutationKey: ['upload-s3'] })
                .forEach((mutation) => {
                // If the ID matches the one we just finished, remove it
                if ((mutation.state.variables as any)?.file?.name === variables?.file?.name) {
                    queryClient.getMutationCache().remove(mutation);
                }
                });

            Logger.info('CLEANUP_COMPLETE', variables?.file?.name);
        },
        onError: (error, variables) => {
        // Logic only runs if mutationFn throws
        // This is where you'd trigger a notification or 'Failed' UI state
        Logger.error('MUTATION_ERROR_UI_FEEDBACK', variables.file.name);
        },

        onSettled: (data, error, variables) => {
        // Runs on BOTH success and error (like a 'finally' block)
        // Good for cleanup logic
        }
    });
};