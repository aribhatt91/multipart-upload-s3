/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Logger from '../logger';

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 1. The function that actually calls your API
    mutationFn: async (fileRecord: any) => {
      const response = await fetch('/api/upload/remove', {
        method: 'DELETE',
        body: JSON.stringify(fileRecord),
      });
      if (!response.ok) throw new Error('Failed to delete');
      return response.json();
    },

    // Refreshing the list
    onSuccess: () => {
      // This tells TanStack Query: "The 'remote-files' data is old. Fetch it again!"
      queryClient.invalidateQueries({ queryKey: ['remote-files'] });
      // Optional: Show a success toast
      Logger.log("File deleted and list refreshed");
    },

    onError: (err) => {
      Logger.error("Delete failed:", err.message);
    }
  });
};