/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
interface UploadStore {
  progress: Record<string, number>;
  managers: Record<string, any>; // Stores FileUploadManager instances
  setProgress: (id: string, pct: number) => void;
  setManager: (id: string, manager: any) => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  progress: {},
  managers: {},
  setProgress: (id, pct) => 
    set((state) => ({ progress: { ...state.progress, [id]: pct } })),
  setManager: (id, manager) => 
    set((state) => ({ managers: { ...state.managers, [id]: manager } })),
}));