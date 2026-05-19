import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PuzzleConfig, PuzzleData } from '@/types';

interface AppState {
  puzzleData: PuzzleData | null;
  setPuzzleData: (data: PuzzleData | null) => void;
  
  puzzleConfig: PuzzleConfig | null;
  setPuzzleConfig: (config: PuzzleConfig | null) => void;
  
  puzzleThumbnail: string;
  setPuzzleThumbnail: (thumbnail: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      puzzleData: null,
      setPuzzleData: (data) => set({ puzzleData: data }),
      
      puzzleConfig: null,
      setPuzzleConfig: (config) => set({ puzzleConfig: config }),
      
      puzzleThumbnail: '',
      setPuzzleThumbnail: (thumbnail) => set({ puzzleThumbnail: thumbnail }),
    }),
    {
      name: 'puzzle-app-storage',
      partialize: (state) => ({
        // 只持久化 config 和 thumbnail，puzzleData 太大
        puzzleConfig: state.puzzleConfig,
        puzzleThumbnail: state.puzzleThumbnail,
      }),
    }
  )
);
