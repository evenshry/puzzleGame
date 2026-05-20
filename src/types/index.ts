export type Difficulty = 4 | 9 | 16 | 25 | 36;

export type BackgroundImageOption = 'heart1' | 'heart2' | 'custom';

export interface PuzzleConfig {
  text: string;
  difficulty: Difficulty;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundImageOption?: BackgroundImageOption;
  textColor?: string;
}

export interface PuzzlePiece {
  id: number;
  originalIndex: number;
  currentIndex: number | null;
  imageData: string;
  position: Position;
  size: Size;
  total: number;
}

export interface PuzzleSlot {
  index: number;
  pieceId: number | null;
  position: Position;
  size: Size;
}

export interface PuzzleData {
  config: PuzzleConfig;
  pieces: PuzzlePiece[];
  slots: PuzzleSlot[];
  gridSize: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type GameMode = 'create' | 'solve' | 'result' | 'list';

export interface DragState {
  isDragging: boolean;
  pieceId: number | null;
  startPosition: Position;
  currentPosition: Position;
  offset: Position;
}

export type FireworkType = 'burst' | 'willow' | 'spiral' | 'double' | 'chrysanthemum';

export interface FireworkParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  trail: Position[];
  type: 'spark' | 'firework' | 'smoke';
}

export interface Firework {
  id: string;
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  explosionColors: string[];
  type: FireworkType;
  exploded: boolean;
  particles: FireworkParticle[];
  delay: number;
}

export interface CelebrationParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
  shape: 'circle' | 'heart';
}

export interface PresetColor {
  name: string;
  value: string;
}

export interface DifficultyOption {
  value: Difficulty;
  label: string;
  desc: string;
  rows: number;
  cols: number;
}

export interface SavedPuzzle {
  id: string;
  config: PuzzleConfig;
  thumbnail: string;
  createdAt: number;
  updatedAt?: number;
  name: string;
}

export interface ChallengeRecord {
  id: string;
  puzzleId: string;
  config: PuzzleConfig;
  thumbnail: string;
  puzzleName: string;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  isCompleted: boolean;
}