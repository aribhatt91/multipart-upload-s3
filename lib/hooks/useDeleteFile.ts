/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

    // 2. The "Magic" Step: Refreshing the list
    onSuccess: () => {
      // This tells TanStack Query: "The 'remote-files' data is old. Fetch it again!"
      queryClient.invalidateQueries({ queryKey: ['remote-files'] });
      
      // Optional: Show a success toast
      console.log("File deleted and list refreshed");
    },

    onError: (err) => {
      console.error("Delete failed:", err.message);
    }
  });
};