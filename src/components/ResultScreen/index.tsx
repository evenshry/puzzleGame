import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, RotateCcw, Sparkles } from 'lucide-react';
import { PuzzleConfig, CelebrationParticle } from '@/types';
import { CELEBRATION_COLORS } from '@/utils/puzzle';
import styles from './index.module.scss';

interface ResultScreenProps {
  config: PuzzleConfig;
  onRestart: () => void;
}

const ResultScreen = memo(function ResultScreen({ config, onRestart }: ResultScreenProps) {
  const navigate = useNavigate();
  const [particles, setParticles] = useState<CelebrationParticle[]>([]);
  const [showContent, setShowContent] = useState(false);

  const createParticle = useCallback((): CelebrationParticle => {
    return {
      id: `${Date.now()}-${Math.random()}`,
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 20,
      size: Math.random() * 16 + 8,
      color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
      speedX: (Math.random() - 0.5) * 4,
      speedY: -(Math.random() * 3 + 2),
      opacity: 1,
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'circle' : 'heart',
    };
  }, []);

  useEffect(() => {
    const createInterval = setInterval(() => {
      if (particles.length < 50) {
        setParticles((prev) => [...prev, createParticle()]);
      }
    }, 100);

    const animationFrame = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.speedY,
            x: p.x + p.speedX,
            opacity: p.opacity - 0.008,
            rotation: p.rotation + 2,
          }))
          .filter((p) => p.opacity > 0)
      );
    }, 16);

    const showTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => {
      clearInterval(createInterval);
      clearInterval(animationFrame);
      clearTimeout(showTimer);
    };
  }, [createParticle, particles.length]);

  const handleRestart = useCallback(() => {
    setParticles([]);
    setShowContent(false);
    onRestart();
  }, [onRestart]);

  const handleCreateNew = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  return (
    <div className={styles.overlay}>
      <div className={styles.particles}>
        {particles.map((p) => (
          <div
            key={p.id}
            className={`${styles.particle} ${p.shape === 'heart' ? styles.heart : styles.circle}`}
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}
      </div>

      <div className={`${styles.content} ${showContent ? styles.visible : ''}`}>
        <div className={styles.iconWrapper}>
          <div className={styles.icon}>
            <Heart className={styles.iconSvg} />
          </div>
          <div className={styles.iconRing} />
          <div className={styles.iconRing2} />
        </div>

        <h1 className={styles.title}>恭喜完成！</h1>
        <p className={styles.subtitle}>拼图挑战成功</p>

        <div className={styles.messageCard} style={{ backgroundColor: config.backgroundColor }}>
          <p className={styles.message}>{config.text}</p>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleRestart}>
            <RotateCcw size={18} />
            再玩一次
          </button>
          <button className={styles.btnSecondary} onClick={handleCreateNew}>
            <Sparkles size={18} />
            制作新拼图
          </button>
        </div>
      </div>
    </div>
  );
});

export default ResultScreen;
