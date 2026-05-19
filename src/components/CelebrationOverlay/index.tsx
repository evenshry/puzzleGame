import { memo, useEffect, useRef, useState } from 'react';
import { Heart, RotateCcw, Sparkles, Star } from 'lucide-react';
import { PuzzleData } from '@/types';
import { CELEBRATION_COLORS } from '@/utils/puzzle';
import styles from './index.module.scss';

interface FloatingParticle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  type: 'heart' | 'star' | 'sparkle';
  opacity: number;
}

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  type: 'square' | 'circle' | 'ribbon';
  opacity: number;
}

interface CelebrationCardProps {
  puzzleData: PuzzleData;
  onRestart: () => void;
  onCreateNew: () => void;
  show: boolean;
}

const CelebrationCard = memo(function CelebrationCard({
  puzzleData,
  onRestart,
  onCreateNew,
  show
}: CelebrationCardProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        setIsPulsing(true);
      }, 300);
    }
  }, [show]);

  return (
    <div className={`${styles.celebrationContent} ${show ? styles.visible : ''}`}>
      <div className={styles.iconWrapper}>
        <div className={`${styles.icon} ${isPulsing ? styles.pulse : ''}`}>
          <Heart className={styles.iconSvg} />
        </div>
        <div className={styles.iconRing} />
        <div className={styles.iconRing2} />
        <div className={styles.iconRing3} />
      </div>

      <h1 className={styles.celebrationTitle}>
        <span className={styles.titleStar}>✨</span>
        恭喜完成
        <span className={styles.titleStar}>✨</span>
      </h1>
      <p className={styles.celebrationSubtitle}>拼图挑战成功</p>

      {puzzleData.config.text && (
        <div className={styles.messageCard} style={{ backgroundColor: puzzleData.config.backgroundColor }}>
          <p className={styles.message}>{puzzleData.config.text}</p>
        </div>
      )}

      <div className={styles.celebrationActions}>
        <button className={styles.btnPrimary} onClick={onRestart}>
          <RotateCcw size={18} />
          再玩一次
        </button>
        <button className={styles.btnSecondary} onClick={onCreateNew}>
          <Sparkles size={18} />
          制作新拼图
        </button>
      </div>
    </div>
  );
});

interface FloatingElementsProps {
  duration?: number;
}

const FloatingElements = memo(function FloatingElements({ duration = 8000 }: FloatingElementsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<FloatingParticle[]>([]);
  const animationRef = useRef<number>();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    let isGenerating = true;

    const createParticle = (): FloatingParticle => {
      const types: ('heart' | 'star' | 'sparkle')[] = ['heart', 'star', 'sparkle'];
      return {
        id: `${Date.now()}-${Math.random()}`,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 20,
        size: Math.random() * 20 + 10,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        speedX: (Math.random() - 0.5) * 3,
        speedY: -(Math.random() * 2 + 1),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        type: types[Math.floor(Math.random() * types.length)],
        opacity: 1,
      };
    };

    for (let i = 0; i < 30; i++) {
      particlesRef.current.push(createParticle());
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        isGenerating = false;
      }

      particlesRef.current = particlesRef.current
        .map(p => ({
          ...p,
          y: p.y + p.speedY,
          x: p.x + p.speedX,
          rotation: p.rotation + p.rotationSpeed,
          speedY: p.speedY + 0.02,
        }))
        .filter(p => p.opacity > 0);

      if (isGenerating && particlesRef.current.length < 30 && Math.random() > 0.7) {
        particlesRef.current.push(createParticle());
      }

      if (particlesRef.current.length > 0) {
        forceUpdate(n => n + 1);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [duration]);

  return (
    <div ref={containerRef} className={styles.floatingElements}>
      {particlesRef.current.map(p => (
        <div
          key={p.id}
          className={`${styles.floatingItem} ${styles[p.type]}`}
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            color: p.color,
            opacity: p.opacity,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {p.type === 'heart' && <Heart />}
          {p.type === 'star' && <Star />}
          {p.type === 'sparkle' && <Sparkles />}
        </div>
      ))}
    </div>
  );
});

interface ConfettiRainProps {
  duration?: number;
}

const ConfettiRain = memo(function ConfettiRain({ duration = 8000 }: ConfettiRainProps) {
  const confettiRef = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<number>();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    let isGenerating = true;

    const createConfetti = (): ConfettiPiece => {
      const types: ('square' | 'circle' | 'ribbon')[] = ['square', 'circle', 'ribbon'];
      return {
        id: `${Date.now()}-${Math.random()}`,
        x: Math.random() * window.innerWidth,
        y: -30,
        size: Math.random() * 15 + 10,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        speedX: (Math.random() - 0.5) * 6,
        speedY: Math.random() * 4 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        type: types[Math.floor(Math.random() * types.length)],
        opacity: 1,
      };
    };

    for (let i = 0; i < 80; i++) {
      const confetti = createConfetti();
      confetti.y = -30 - Math.random() * window.innerHeight * 0.5;
      confettiRef.current.push(confetti);
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        isGenerating = false;
      }

      confettiRef.current = confettiRef.current
        .map(c => ({
          ...c,
          y: c.y + c.speedY,
          x: c.x + c.speedX,
          rotation: c.rotation + c.rotationSpeed,
          speedX: c.speedX * 0.998,
        }))
        .filter(c => c.y < window.innerHeight + 50);

      if (isGenerating) {
        while (confettiRef.current.length < 80) {
          confettiRef.current.push(createConfetti());
        }
      }

      if (confettiRef.current.length > 0) {
        forceUpdate(n => n + 1);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [duration]);

  return (
    <div className={styles.confettiContainer}>
      {confettiRef.current.map(c => (
        <div
          key={c.id}
          className={`${styles.confettiItem} ${styles[c.type]}`}
          style={{
            left: c.x,
            top: c.y,
            width: c.size,
            height: c.type === 'ribbon' ? c.size * 2 : c.size,
            backgroundColor: c.color,
            color: c.color,
            transform: `rotate(${c.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
});

const BackgroundEffects = memo(function BackgroundEffects() {
  const [stars, setStars] = useState<Array<{ id: string; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 50 }, (_, i) => ({
      id: `star-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className={styles.starfield}>
      {stars.map(star => (
        <div
          key={star.id}
          className={styles.star}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

export interface CelebrationOverlayProps {
  puzzleData: PuzzleData;
  onRestart: () => void;
  onCreateNew: () => void;
  showContent: boolean;
  duration?: number;
}

const CelebrationOverlay = memo(function CelebrationOverlay({
  puzzleData,
  onRestart,
  onCreateNew,
  showContent,
  duration = 8000,
}: CelebrationOverlayProps) {
  return (
    <>
      <BackgroundEffects />
      <FloatingElements duration={duration} />
      <ConfettiRain duration={duration} />

      <div className={styles.celebrationOverlay}>
        <CelebrationCard
          puzzleData={puzzleData}
          onRestart={onRestart}
          onCreateNew={onCreateNew}
          show={showContent}
        />
      </div>
    </>
  );
});

export default CelebrationOverlay;
