import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PuzzleBoard from '@/components/PuzzleBoard';
import Layout from '@/components/Layout';
import { useAppStore } from '@/store/appStore';
import { generatePuzzle } from '@/utils/puzzle';
import { getPuzzleById, startChallenge, completeChallenge } from '@/utils/storage';
import styles from '@/App.module.scss';

export function PlayPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const puzzleData = useAppStore(state => state.puzzleData);
  const setPuzzleData = useAppStore(state => state.setPuzzleData);
  const setPuzzleConfig = useAppStore(state => state.setPuzzleConfig);
  const puzzleConfig = useAppStore(state => state.puzzleConfig);
  const challengeIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (puzzleData) return;

    if (id) {
      const loadAndStart = async () => {
        const savedPuzzle = await getPuzzleById(id);
        if (savedPuzzle) {
          const data = generatePuzzle(savedPuzzle.config, false);
          setPuzzleData(data);
          setPuzzleConfig(savedPuzzle.config);
          
          const challenge = await startChallenge(id);
          if (challenge) {
            challengeIdRef.current = challenge.id;
            startTimeRef.current = Date.now();
          }
        }
      };
      loadAndStart();
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const shareData = urlParams.get('share');
    if (shareData) {
      try {
        const config = JSON.parse(atob(shareData));
        const data = generatePuzzle(config, false);
        setPuzzleData(data);
        setPuzzleConfig(config);
        startTimeRef.current = Date.now();
      } catch (error) {
        console.error('Failed to parse share data:', error);
      }
    }
  }, [id, puzzleData, setPuzzleData, setPuzzleConfig]);

  const handleComplete = useCallback(async () => {
    if (challengeIdRef.current) {
      const duration = Date.now() - startTimeRef.current;
      await completeChallenge(challengeIdRef.current, duration);
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (puzzleConfig) {
      const data = generatePuzzle(puzzleConfig);
      setPuzzleData(data);
      startTimeRef.current = Date.now();
    }
  }, [puzzleConfig, setPuzzleData]);

  const handleCreateNew = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  if (!puzzleData) {
    return (
      <Layout>
        <div className={styles.emptyState}>
          <Sparkles size={64} />
          <p>暂无拼图</p>
          <button className={styles.createBtn} onClick={handleCreateNew}>
            去制作一个
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PuzzleBoard 
        puzzleData={puzzleData} 
        puzzleId={id} 
        onComplete={handleComplete}
        onRestart={handleRestart}
        showCelebration={true}
      />
    </Layout>
  );
}
