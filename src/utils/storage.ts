import { SavedPuzzle, PuzzleConfig, ChallengeRecord, PuzzlePiece } from '@/types';
import { indexedDBManager } from './indexedDB';

const STORE_PUZZLES = 'saved_puzzles';
const STORE_PROGRESS = 'puzzle_progress';
const STORE_CHALLENGES = 'challenge_records';

export interface PuzzleProgress {
  puzzleId: string;
  pieces: Array<{
    id: number;
    currentIndex: number | null;
  }>;
  timestamp: number;
}

export const getSavedPuzzles = async (): Promise<SavedPuzzle[]> => {
  try {
    const puzzles = await indexedDBManager.getAll<SavedPuzzle>(STORE_PUZZLES);
    return puzzles.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

export const savePuzzle = async (config: PuzzleConfig, thumbnail: string, name?: string): Promise<SavedPuzzle> => {
  const saved = await getSavedPuzzles();
  const id = `puzzle_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const newPuzzle: SavedPuzzle = {
    id,
    config,
    thumbnail,
    createdAt: Date.now(),
    name: name || `拼图 ${saved.length + 1}`,
  };

  await indexedDBManager.set(STORE_PUZZLES, newPuzzle);
  
  return newPuzzle;
};

export const getPuzzleById = async (id: string): Promise<SavedPuzzle | null> => {
  try {
    return await indexedDBManager.get<SavedPuzzle>(STORE_PUZZLES, id);
  } catch {
    return null;
  }
};

export const deletePuzzleById = async (id: string): Promise<boolean> => {
  try {
    const puzzle = await getPuzzleById(id);
    if (!puzzle) return false;

    await indexedDBManager.remove(STORE_PUZZLES, id);
    await indexedDBManager.remove(STORE_PROGRESS, id);
    return true;
  } catch {
    return false;
  }
};

export const updatePuzzleName = async (id: string, name: string): Promise<boolean> => {
  try {
    const puzzle = await getPuzzleById(id);
    if (!puzzle) return false;

    const updatedPuzzle: SavedPuzzle = {
      ...puzzle,
      name,
      updatedAt: Date.now(),
    };

    await indexedDBManager.set(STORE_PUZZLES, updatedPuzzle);
    return true;
  } catch {
    return false;
  }
};

export const updatePuzzleConfig = async (
  id: string,
  config: PuzzleConfig,
  thumbnail: string,
  name?: string
): Promise<boolean> => {
  try {
    const puzzle = await getPuzzleById(id);
    if (!puzzle) return false;

    const updatedPuzzle: SavedPuzzle = {
      ...puzzle,
      config,
      thumbnail,
      name: name !== undefined ? name : puzzle.name,
      updatedAt: Date.now(),
    };

    await indexedDBManager.set(STORE_PUZZLES, updatedPuzzle);
    await indexedDBManager.remove(STORE_PROGRESS, id);
    return true;
  } catch {
    return false;
  }
};

export const getProgress = async (puzzleId: string): Promise<PuzzleProgress | null> => {
  try {
    return await indexedDBManager.get<PuzzleProgress>(STORE_PROGRESS, puzzleId);
  } catch {
    return null;
  }
};

export const saveProgress = async (puzzleId: string, pieces: PuzzlePiece[]): Promise<void> => {
  const progress: PuzzleProgress = {
    puzzleId,
    pieces: pieces.map(p => ({
      id: p.id,
      currentIndex: p.currentIndex,
    })),
    timestamp: Date.now(),
  };
  await indexedDBManager.set(STORE_PROGRESS, progress);
};

export const clearProgress = async (puzzleId: string): Promise<void> => {
  await indexedDBManager.remove(STORE_PROGRESS, puzzleId);
};

export const getChallengeRecords = async (): Promise<ChallengeRecord[]> => {
  try {
    const records = await indexedDBManager.getAll<ChallengeRecord>(STORE_CHALLENGES);
    return records.sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
};

export const startChallenge = async (puzzleId: string): Promise<ChallengeRecord | null> => {
  const puzzle = await getPuzzleById(puzzleId);
  if (!puzzle) return null;

  const id = `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  const newRecord: ChallengeRecord = {
    id,
    puzzleId,
    config: puzzle.config,
    thumbnail: puzzle.thumbnail,
    puzzleName: puzzle.name,
    startedAt: Date.now(),
    isCompleted: false,
  };

  await indexedDBManager.set(STORE_CHALLENGES, newRecord);
  
  return newRecord;
};

export const completeChallenge = async (challengeId: string, duration: number): Promise<boolean> => {
  try {
    const record = await getChallengeById(challengeId);
    if (!record) return false;

    const updatedRecord: ChallengeRecord = {
      ...record,
      completedAt: Date.now(),
      duration,
      isCompleted: true,
    };

    await indexedDBManager.set(STORE_CHALLENGES, updatedRecord);
    await clearProgress(record.puzzleId);
    return true;
  } catch {
    return false;
  }
};

export const getChallengeById = async (id: string): Promise<ChallengeRecord | null> => {
  try {
    return await indexedDBManager.get<ChallengeRecord>(STORE_CHALLENGES, id);
  } catch {
    return null;
  }
};

export const deleteChallenge = async (id: string): Promise<boolean> => {
  try {
    const record = await getChallengeById(id);
    if (!record) return false;

    await indexedDBManager.remove(STORE_CHALLENGES, id);
    return true;
  } catch {
    return false;
  }
};
