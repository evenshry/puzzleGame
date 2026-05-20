import { useState, useCallback, useEffect, memo, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PuzzlePiece, PuzzleSlot, PuzzleData, PuzzleConfig, Firework } from "@/types";
import { checkPuzzleComplete } from "@/utils/puzzle";
import { saveProgress, clearProgress } from "@/utils/storage";
import FireworkCanvas, { launchFireworkShow } from "@/components/FireworkCanvas";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import styles from "./index.module.scss";

function generatePuzzleId(config: PuzzleConfig): string {
  return `puzzle-${config.text}-${config.difficulty}-${config.backgroundColor}-${config.textColor}-${config.backgroundImage?.length || 0}`;
}

interface PuzzleBoardProps {
  puzzleData: PuzzleData;
  puzzleId?: string;
  onComplete: () => void;
  onRestart?: () => void;
  showCelebration?: boolean;
  testCelebration?: boolean;
}

const DISPLAY_SIZE = 100;

const DroppableSlot = memo(function DroppableSlot({ slot, gridSize }: { slot: PuzzleSlot; gridSize: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.index}`,
  });

  return (
    <div
      ref={setNodeRef}
      id={`slot-${slot.index}`}
      className={`${styles.slot} ${slot.pieceId !== null ? styles.slotFilled : ""} ${isOver ? styles.slotHighlight : ""}`}
      style={{
        left: (slot.index % gridSize) * DISPLAY_SIZE,
        top: Math.floor(slot.index / gridSize) * DISPLAY_SIZE,
        width: DISPLAY_SIZE,
        height: DISPLAY_SIZE,
      }}
    />
  );
});

const SortablePiece = memo(function SortablePiece({
  piece,
  isDragging,
  gridSize,
  stackIndex = 0,
}: {
  piece: PuzzlePiece;
  isDragging: boolean;
  gridSize: number;
  stackIndex?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: piece.id });

  const isPlaced = piece.currentIndex !== null;

  let style: React.CSSProperties;

  if (isPlaced) {
    style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0 : 1,
      left: ((piece.currentIndex || 0) % gridSize) * DISPLAY_SIZE,
      top: Math.floor((piece.currentIndex || 0) / gridSize) * DISPLAY_SIZE,
      width: DISPLAY_SIZE,
      height: DISPLAY_SIZE,
      position: "absolute",
      cursor: "grab",
      zIndex: isDragging ? 100 : 10,
    };
  } else {
    const offsetX = stackIndex * 1;
    const shadowDepth = 2 + stackIndex * 1.5;

    style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      width: DISPLAY_SIZE - stackIndex * 2,
      height: DISPLAY_SIZE - stackIndex * 2,
      cursor: "grab",
      position: "absolute" as const,
      left: offsetX,
      bottom: stackIndex * 8,
      boxShadow: `${shadowDepth}px ${shadowDepth}px ${shadowDepth * 2}px rgba(0, 0, 0, 0.15)`,
      zIndex: stackIndex + 1,
      borderRadius: "8px",
    };
  }

  const className = `${styles.piece} ${isPlaced ? styles.placedPiece : styles.draggable}`;

  return (
    <div ref={setNodeRef} className={className} style={style} {...attributes} {...listeners} data-testid={`piece-${piece.id}`}>
      <img src={piece.imageData} alt={`碎片 ${piece.id + 1}`} draggable={false} />
    </div>
  );
});

const FloatingPiece = memo(function FloatingPiece({ piece }: { piece: PuzzlePiece }) {
  return (
    <div
      className={`${styles.piece} ${styles.floatingPiece}`}
      style={{
        width: DISPLAY_SIZE,
        height: DISPLAY_SIZE,
      }}
    >
      <img src={piece.imageData} alt={`碎片 ${piece.id + 1}`} draggable={false} />
    </div>
  );
});

const PuzzleBoard = memo(function PuzzleBoard({
  puzzleData,
  puzzleId,
  onComplete,
  onRestart,
  showCelebration = false,
  testCelebration = false,
}: PuzzleBoardProps) {
  const navigate = useNavigate();
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [showContent, setShowContent] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const fireworksCleanupRef = useRef<(() => void) | null>(null);
  const hasTriggeredTestRef = useRef(false);

  const resolvedPuzzleId = useMemo(() => puzzleId || generatePuzzleId(puzzleData.config), [puzzleId, puzzleData.config]);

  const [pieces, setPieces] = useState<PuzzlePiece[]>(
    puzzleData.pieces.map((p) => ({
      ...p,
      currentIndex: null,
    })),
  );
  const [slots, setSlots] = useState<PuzzleSlot[]>(puzzleData.slots);
  const [activeId, setActiveId] = useState<number | null>(null);

  const gridSize = puzzleData.gridSize;

  const handleRemoveFirework = useCallback((id: string) => {
    setFireworks((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const triggerCelebration = useCallback(() => {
    if (isCompleted) return;

    setIsCompleted(true);

    setTimeout(() => {
      onComplete();
    }, 300);
  }, [isCompleted, onComplete]);

  useEffect(() => {
    if (testCelebration && !hasTriggeredTestRef.current && !isCompleted) {
      hasTriggeredTestRef.current = true;
      triggerCelebration();
    }

    if (!testCelebration) {
      hasTriggeredTestRef.current = false;
    }
  }, [testCelebration, isCompleted, triggerCelebration]);

  useEffect(() => {
    if (!showCelebration || !isCompleted) return;

    const showTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    const initialFireworks: Firework[] = [];
    const types = ["burst", "willow", "spiral", "double", "chrysanthemum"] as const;

    for (let idx = 0; idx < 5; idx++) {
      const targetY = window.innerHeight * (0.15 + Math.random() * 0.3);
      initialFireworks.push({
        id: `initial-${idx}-${Date.now()}`,
        x: window.innerWidth * 0.15 + ((window.innerWidth * 0.7) / 5) * idx + (window.innerWidth * 0.7) / 10,
        y: window.innerHeight - 100,
        targetY,
        vy: -10,
        color: "#FFB3BA",
        explosionColors: [],
        type: types[idx % types.length],
        exploded: false,
        particles: [],
        delay: idx * 200,
      });
    }

    setTimeout(() => {
      setFireworks(initialFireworks);
    }, 100);

    fireworksCleanupRef.current = launchFireworkShow(setFireworks, 8000);

    return () => {
      clearTimeout(showTimer);
      if (fireworksCleanupRef.current) {
        fireworksCleanupRef.current();
      }
    };
  }, [showCelebration, isCompleted]);

  const handleRestart = useCallback(() => {
    setShowContent(false);
    setFireworks([]);
    setIsCompleted(false);
    hasTriggeredTestRef.current = false;
    if (fireworksCleanupRef.current) {
      fireworksCleanupRef.current();
    }
    if (onRestart) {
      onRestart();
    }
  }, [onRestart]);

  const handleCreateNew = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  useEffect(() => {
    setIsInitialized(false);
    setIsCompleted(false);
    
    const shuffledPieces = [...puzzleData.pieces].sort(() => Math.random() - 0.5);

    const piecesPerRow = gridSize;
    const gap = 6;
    const padding = 16;

    const newPieces = shuffledPieces.map((piece, i) => ({
      ...piece,
      currentIndex: null,
      position: {
        x: padding + (i % piecesPerRow) * (DISPLAY_SIZE + gap),
        y: padding + Math.floor(i / piecesPerRow) * (DISPLAY_SIZE + gap),
      },
    }));

    setPieces(newPieces);
    setSlots(puzzleData.slots);
    setIsInitialized(true);

    const clear = async () => {
      await clearProgress(resolvedPuzzleId);
    };
    clear();
  }, [puzzleData, resolvedPuzzleId, gridSize]);

  useEffect(() => {
    const save = async () => {
      if (!isCompleted && puzzleId) {
        await saveProgress(puzzleId, pieces);
      }
    };
    save();
  }, [pieces, isCompleted, puzzleId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = parseInt(event.active.id as string, 10);
    setActiveId(id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const id = parseInt(active.id as string, 10);
      setActiveId(null);

      if (!over) return;

      const overId = String(over.id);
      const piece = pieces.find((p) => p.id === id);
      if (!piece) return;

      if (overId.startsWith("slot-")) {
        const slotIndex = parseInt(overId.replace("slot-", ""), 10);
        const targetSlot = slots.find((s) => s.index === slotIndex);

        if (!targetSlot) return;

        if (targetSlot.pieceId === null) {
          setPieces((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, position: { x: targetSlot.position.x, y: targetSlot.position.y }, currentIndex: targetSlot.index } : p,
            ),
          );
          setSlots((prev) => prev.map((s) => (s.index === targetSlot.index ? { ...s, pieceId: id } : s)));

          if (piece.currentIndex !== null && piece.currentIndex !== targetSlot.index) {
            setSlots((prev) => prev.map((s) => (s.index === piece.currentIndex ? { ...s, pieceId: null } : s)));
          }
        } else if (targetSlot.pieceId !== null && targetSlot.pieceId !== id) {
          const existingPiece = pieces.find((p) => p.id === targetSlot.pieceId);
          if (!existingPiece) return;

          if (piece.currentIndex === null) {
            const gridSize = Math.sqrt(piece.total);
            const piecesPerRow = gridSize;
            const gap = 6;
            const padding = 16;

            const availableIndex = pieces.filter((p) => p.currentIndex === null).findIndex((p) => p.id === id);
            const newX = padding + (availableIndex % piecesPerRow) * (DISPLAY_SIZE + gap);
            const newY = padding + Math.floor(availableIndex / piecesPerRow) * (DISPLAY_SIZE + gap);

            setPieces((prev) =>
              prev.map((p) => {
                if (p.id === id) {
                  return { ...p, position: { x: targetSlot.position.x, y: targetSlot.position.y }, currentIndex: targetSlot.index };
                }
                if (p.id === targetSlot.pieceId) {
                  return { ...p, position: { x: newX, y: newY }, currentIndex: null };
                }
                return p;
              }),
            );

            setSlots((prev) => prev.map((s) => (s.index === targetSlot.index ? { ...s, pieceId: id } : s)));
          } else if (piece.currentIndex !== null) {
            const sourceSlot = slots.find((s) => s.index === piece.currentIndex);

            if (sourceSlot) {
              setPieces((prev) =>
                prev.map((p) => {
                  if (p.id === id) {
                    return { ...p, position: { x: targetSlot.position.x, y: targetSlot.position.y }, currentIndex: targetSlot.index };
                  }
                  if (p.id === targetSlot.pieceId) {
                    return { ...p, position: { x: sourceSlot.position.x, y: sourceSlot.position.y }, currentIndex: sourceSlot.index };
                  }
                  return p;
                }),
              );

              setSlots((prev) =>
                prev.map((s) => {
                  if (s.index === targetSlot.index) {
                    return { ...s, pieceId: id };
                  }
                  if (s.index === sourceSlot.index) {
                    return { ...s, pieceId: targetSlot.pieceId };
                  }
                  return s;
                }),
              );
            }
          }
        }
      } else {
        if (piece.currentIndex !== null) {
          setSlots((prev) => prev.map((s) => (s.index === piece.currentIndex ? { ...s, pieceId: null } : s)));
          setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, currentIndex: null } : p)));
        } else {
          const overIndex = pieces.findIndex((p) => p.id === parseInt(overId as string, 10));
          const activeIndex = pieces.findIndex((p) => p.id === id);

          if (overIndex !== -1 && activeIndex !== -1) {
            setPieces((prev) => arrayMove(prev, activeIndex, overIndex));
          }
        }
      }
    },
    [pieces, slots],
  );

  useEffect(() => {
    if (!isInitialized) return;
    
    const placedPieces = pieces.filter((p) => p.currentIndex !== null);
    if (placedPieces.length === pieces.length && checkPuzzleComplete(pieces) && !isCompleted) {
      setIsCompleted(true);
      
      if (puzzleId) {
        clearProgress(puzzleId);
      }

      setTimeout(onComplete, 300);
    }
  }, [pieces, onComplete, isCompleted, puzzleId, isInitialized]);

  const availablePieces = useMemo(() => pieces.filter((p) => p.currentIndex === null), [pieces]);
  const placedPieces = useMemo(() => pieces.filter((p) => p.currentIndex !== null), [pieces]);
  const activePiece = useMemo(() => pieces.find((p) => p.id === activeId), [pieces, activeId]);

  const progress = useMemo(() => {
    const total = pieces.length;
    const placed = placedPieces.length;
    return Math.round((placed / total) * 100);
  }, [pieces.length, placedPieces.length]);

  const allPieceIds = useMemo(() => pieces.map((p) => p.id), [pieces]);

  return (
    <>
      {showCelebration && isCompleted && (
        <>
          <FireworkCanvas fireworks={fireworks} onRemoveFirework={handleRemoveFirework} />
          <CelebrationOverlay puzzleData={puzzleData} onRestart={handleRestart} onCreateNew={handleCreateNew} showContent={showContent} />
        </>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          <div className={styles.progress}>
            <span>完成度</span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}%</span>
          </div>

          <div className={styles.gameArea}>
            <div className={styles.piecesArea}>
              <div className={styles.piecesGrid}>
                {availablePieces.map((piece, index) => (
                  <SortablePiece key={piece.id} piece={piece} isDragging={activeId === piece.id} gridSize={gridSize} stackIndex={index} />
                ))}
              </div>
            </div>

            <SortableContext items={allPieceIds} strategy={verticalListSortingStrategy}>
              <div className={styles.gridArea}>
                <div className={styles.grid} style={{ width: gridSize * DISPLAY_SIZE, height: gridSize * DISPLAY_SIZE }}>
                  {slots.map((slot) => (
                    <DroppableSlot key={`slot-${slot.index}`} slot={slot} gridSize={gridSize} />
                  ))}

                  {placedPieces.map((piece) => (
                    <SortablePiece key={piece.id} piece={piece} isDragging={activeId === piece.id} gridSize={gridSize} />
                  ))}
                </div>
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>{activePiece && <FloatingPiece piece={activePiece} />}</DragOverlay>
      </DndContext>
    </>
  );
});

export default PuzzleBoard;
