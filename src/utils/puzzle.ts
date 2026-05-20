import { PuzzleConfig, PuzzlePiece, PuzzleSlot, PuzzleData, BackgroundImageOption } from '@/types';

const CANVAS_SIZE = 400;
const PIECE_GAP = 10;

export const BACKGROUND_IMAGE_MAP: Record<Exclude<BackgroundImageOption, 'custom'>, string> = {
  heart1: 'background/heart1.jpg',
  heart2: 'background/heart2.jpg',
};

export const getBackgroundImagePath = (option: BackgroundImageOption): string | undefined => {
  if (option === 'custom') return undefined;
  return BACKGROUND_IMAGE_MAP[option];
};

export interface PieceLayoutConfig {
  id: number;
  row: number;
  col: number;
  position: { x: number; y: number };
}

export const generatePuzzle = (config: PuzzleConfig, autoShuffle: boolean = true): PuzzleData => {
  const gridSize = Math.sqrt(config.difficulty);
  const pieceSize = CANVAS_SIZE / gridSize;

  const fullImageCanvas = createFullImageCanvas(config);
  
  const pieceLayouts = generatePieceLayouts(gridSize, pieceSize);
  
  const pieces = generatePieceImages(
    fullImageCanvas,
    gridSize,
    pieceSize,
    pieceLayouts,
    config.backgroundColor
  );
  
  const slots = createPuzzleSlots(gridSize, pieceSize);

  if (autoShuffle) {
    shufflePieces(pieces, gridSize, pieceSize);
  }

  return {
    config,
    pieces,
    slots,
    gridSize,
  };
};

export const generatePuzzleAsync = async (config: PuzzleConfig, autoShuffle: boolean = true): Promise<PuzzleData> => {
  const gridSize = Math.sqrt(config.difficulty);
  const pieceSize = CANVAS_SIZE / gridSize;

  const fullImageCanvas = await createFullImageCanvasAsync(config);
  
  const pieceLayouts = generatePieceLayouts(gridSize, pieceSize);
  
  const pieces = generatePieceImages(
    fullImageCanvas,
    gridSize,
    pieceSize,
    pieceLayouts,
    config.backgroundColor
  );
  
  const slots = createPuzzleSlots(gridSize, pieceSize);

  if (autoShuffle) {
    shufflePieces(pieces, gridSize, pieceSize);
  }

  return {
    config,
    pieces,
    slots,
    gridSize,
  };
};

const getBackgroundImageSrc = (config: PuzzleConfig): string | undefined => {
  if (config.backgroundImageOption && config.backgroundImageOption !== 'custom') {
    return BACKGROUND_IMAGE_MAP[config.backgroundImageOption];
  }
  return config.backgroundImage;
};

const createFullImageCanvas = (config: PuzzleConfig): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const backgroundImageSrc = getBackgroundImageSrc(config);
  if (backgroundImageSrc) {
    drawBackgroundImageSync(ctx, backgroundImageSrc, config.text);
  }

  drawText(ctx, config.text, config.textColor);

  return canvas;
};

const createFullImageCanvasAsync = async (config: PuzzleConfig): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const backgroundImageSrc = getBackgroundImageSrc(config);
  if (backgroundImageSrc) {
    await drawBackgroundImageAsync(ctx, backgroundImageSrc, config.text);
  }

  drawText(ctx, config.text, config.textColor);

  return canvas;
};

const drawBackgroundImageSync = (ctx: CanvasRenderingContext2D, imageData: string, text: string): void => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  if (img.complete) {
    drawImageToCanvas(ctx, img, text);
    return;
  }
  
  img.onload = () => {
    drawImageToCanvas(ctx, img, text);
  };
  
  img.onerror = () => {
    console.warn('Failed to load background image:', imageData);
  };
  
  img.src = imageData;
};

const drawBackgroundImageAsync = (ctx: CanvasRenderingContext2D, imageData: string, text: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      drawImageToCanvas(ctx, img, text);
      resolve();
    };
    
    img.onerror = () => {
      console.warn('Failed to load background image:', imageData);
      resolve();
    };
    
    img.src = imageData;
  });
};

const drawImageToCanvas = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, text: string): void => {
  if (text && text.trim()) {
    ctx.globalAlpha = 0.25;
  } else {
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.globalAlpha = 1;
};

const drawText = (ctx: CanvasRenderingContext2D, text: string, textColor: string = '#2a2a2a'): void => {
  const padding = CANVAS_SIZE * 0.08;
  const availableWidth = CANVAS_SIZE - padding * 2;
  const availableHeight = CANVAS_SIZE - padding * 2;

  const result = calculateOptimalTextLayout(ctx, text, availableWidth, availableHeight);

  ctx.font = `bold ${result.fontSize}px 'Caveat', cursive`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';

  const totalTextHeight = result.lines.length * result.lineHeight;
  let startY = (CANVAS_SIZE - totalTextHeight) / 2 + result.lineHeight / 2;

  result.lines.forEach((line) => {
    ctx.textAlign = 'center';
    ctx.fillText(line.text, CANVAS_SIZE / 2, startY);
    startY += result.lineHeight;
  });
};

interface TextLayoutResult {
  fontSize: number;
  lineHeight: number;
  lines: Array<{ text: string; width: number; align: CanvasTextAlign }>;
}

const calculateOptimalTextLayout = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number
): TextLayoutResult => {
  let fontSize = 120;
  const minFontSize = 14;

  while (fontSize >= minFontSize) {
    ctx.font = `bold ${fontSize}px 'Caveat', cursive`;
    const lineHeight = fontSize * 1.2;

    const lines = wrapTextToLines(ctx, text, maxWidth);
    const totalHeight = lines.length * lineHeight;

    if (totalHeight <= maxHeight) {
      return {
        fontSize,
        lineHeight,
        lines,
      };
    }

    fontSize -= 2;
  }

  ctx.font = `bold ${minFontSize}px 'Caveat', cursive`;
  return {
    fontSize: minFontSize,
    lineHeight: minFontSize * 1.2,
    lines: wrapTextToLines(ctx, text, maxWidth),
  };
};

const wrapTextToLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): Array<{ text: string; width: number; align: CanvasTextAlign }> => {
  const lines: Array<{ text: string; width: number; align: CanvasTextAlign }> = [];
  const paragraphs = text.split('\n');

  paragraphs.forEach((paragraph) => {
    if (paragraph.trim() === '') {
      if (lines.length > 0) {
        lines[lines.length - 1].text += ' ';
      }
      return;
    }

    const chars = paragraph.split('');
    let currentLine = '';
    let currentWidth = 0;

    chars.forEach((char) => {
      const charWidth = ctx.measureText(char).width;

      if (currentWidth + charWidth > maxWidth && currentLine !== '') {
        lines.push({
          text: currentLine,
          width: ctx.measureText(currentLine).width,
          align: 'left',
        });
        currentLine = char;
        currentWidth = charWidth;
      } else {
        currentLine += char;
        currentWidth += charWidth;
      }
    });

    if (currentLine) {
      lines.push({
        text: currentLine,
        width: ctx.measureText(currentLine).width,
        align: 'left',
      });
    }
  });

  return lines;
};

const generatePieceLayouts = (
  gridSize: number,
  pieceSize: number
): PieceLayoutConfig[] => {
  const layouts: PieceLayoutConfig[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const id = row * gridSize + col;

      layouts.push({
        id,
        row,
        col,
        position: {
          x: col * pieceSize,
          y: row * pieceSize,
        },
      });
    }
  }

  return layouts;
};

const generatePieceImages = (
  fullImageCanvas: HTMLCanvasElement,
  gridSize: number,
  pieceSize: number,
  pieceLayouts: PieceLayoutConfig[],
  backgroundColor: string
): PuzzlePiece[] => {
  const pieces: PuzzlePiece[] = [];
  const total = gridSize * gridSize;

  pieceLayouts.forEach((layout) => {
    const pieceImageData = renderPieceImage(
      fullImageCanvas,
      layout,
      pieceSize,
      backgroundColor
    );

    pieces.push({
      id: layout.id,
      originalIndex: layout.id,
      currentIndex: null,
      imageData: pieceImageData,
      position: { x: 0, y: 0 },
      size: { width: pieceSize, height: pieceSize },
      total,
    });
  });

  return pieces;
};

const renderPieceImage = (
  fullImageCanvas: HTMLCanvasElement,
  layout: PieceLayoutConfig,
  pieceSize: number,
  backgroundColor: string
): string => {
  const pieceCanvas = document.createElement('canvas');
  pieceCanvas.width = pieceSize;
  pieceCanvas.height = pieceSize;
  const ctx = pieceCanvas.getContext('2d')!;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, pieceSize, pieceSize);

  const sourceX = layout.col * pieceSize;
  const sourceY = layout.row * pieceSize;

  ctx.drawImage(
    fullImageCanvas,
    sourceX,
    sourceY,
    pieceSize,
    pieceSize,
    0,
    0,
    pieceSize,
    pieceSize
  );

  return pieceCanvas.toDataURL('image/jpeg', 0.95);
};

const createPuzzleSlots = (gridSize: number, pieceSize: number): PuzzleSlot[] => {
  const slots: PuzzleSlot[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const index = row * gridSize + col;

      slots.push({
        index,
        pieceId: null,
        position: { x: col * pieceSize, y: row * pieceSize },
        size: { width: pieceSize, height: pieceSize },
      });
    }
  }

  return slots;
};

const shufflePieces = (
  pieces: PuzzlePiece[],
  gridSize: number,
  pieceSize: number
): void => {
  const shuffled = [...pieces];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const startX = CANVAS_SIZE + 30;
  const startY = 10;
  const piecesPerRow = Math.ceil(gridSize * 1.5);

  shuffled.forEach((piece, i) => {
    piece.position = {
      x: startX + (i % piecesPerRow) * (pieceSize + 5),
      y: startY + Math.floor(i / piecesPerRow) * (pieceSize + 5),
    };
    piece.currentIndex = null;
  });
};

export const addGapToPieces = (pieces: PuzzlePiece[], gridSize: number, pieceSize: number): void => {
  pieces.forEach((piece) => {
    if (piece.currentIndex !== null) {
      const row = Math.floor(piece.currentIndex / gridSize);
      const col = piece.currentIndex % gridSize;
      piece.position = {
        x: col * (pieceSize + PIECE_GAP),
        y: row * (pieceSize + PIECE_GAP),
      };
    }
  });
};

export const removeGapFromPieces = (pieces: PuzzlePiece[], gridSize: number, pieceSize: number): void => {
  pieces.forEach((piece) => {
    if (piece.currentIndex !== null) {
      const row = Math.floor(piece.currentIndex / gridSize);
      const col = piece.currentIndex % gridSize;
      piece.position = {
        x: col * pieceSize,
        y: row * pieceSize,
      };
    }
  });
};

export const shuffleAllPieces = (
  pieces: PuzzlePiece[],
  gridSize: number,
  pieceSize: number
): void => {
  const shuffled = [...pieces];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const startX = CANVAS_SIZE + 30;
  const startY = 10;
  const piecesPerRow = Math.ceil(gridSize * 1.5);

  shuffled.forEach((piece, i) => {
    piece.position = {
      x: startX + (i % piecesPerRow) * (pieceSize + 5),
      y: startY + Math.floor(i / piecesPerRow) * (pieceSize + 5),
    };
    piece.currentIndex = null;
  });
};

export const checkPuzzleComplete = (pieces: PuzzlePiece[]): boolean => {
  return pieces.every((piece) => piece.id === piece.currentIndex);
};

export const PRESET_COLORS = [
  '#FFE4E1', '#FFB6C1', '#FFC0CB',
  '#E6E6FA', '#DDA0DD', '#EE82EE',
  '#B0E0E6', '#87CEEB', '#87CEFA',
  '#98FB98', '#90EE90', '#00FA9A',
  '#FFFACD', '#FAFAD2', '#FFDAB9',
  '#FFE4B5',
];

export const getRandomColor = (): string => {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
};

export const DIFFICULTY_OPTIONS = [
  { value: 9 as const, label: '简单', desc: '9片', rows: 3, cols: 3 },
  { value: 16 as const, label: '中等', desc: '16片', rows: 4, cols: 4 },
  { value: 25 as const, label: '困难', desc: '25片', rows: 5, cols: 5 },
  { value: 36 as const, label: '噩梦', desc: '36片', rows: 6, cols: 6 },
];

export const CANVAS_CONFIG = {
  SIZE: CANVAS_SIZE,
  PIECE_GAP: PIECE_GAP,
};

export const DRAG_CONFIG = {
  SNAP_THRESHOLD: 0.3,
  ANIMATION_DURATION: 100,
};

export const CELEBRATION_COLORS = [
  '#FF6B9D',
  '#FFC0CB',
  '#FFE4E1',
  '#FFE4B5',
  '#FFDAB9',
  '#E6E6FA',
];

export const PRESET_TEXT_COLORS = [
  '#2a2a2a',
  '#1a1a1a',
  '#4a4a4a',
  '#8B4513',
  '#DC143C',
  '#FF1493',
  '#8B0000',
  '#006400',
  '#00008B',
  '#4B0082',
  '#FFFFFF',
  '#333333',
];

export const getRandomTextColor = (): string => {
  return PRESET_TEXT_COLORS[Math.floor(Math.random() * PRESET_TEXT_COLORS.length)];
};