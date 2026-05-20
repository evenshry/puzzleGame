import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PuzzleBoard from '@/components/PuzzleBoard';
import Layout from '@/components/Layout';
import { useAppStore } from '@/store/appStore';
import { generatePuzzleAsync } from '@/utils/puzzle';
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
  const isLoading = useRef(false);

  useEffect(() => {
    if (isLoading.current) return;
    
    if (id) {
      isLoading.current = true;
      const loadAndStart = async () => {
        const savedPuzzle = await getPuzzleById(id);
        if (savedPuzzle) {
          const data = await generatePuzzleAsync(savedPuzzle.config, false);
          setPuzzleData(data);
          setPuzzleConfig(savedPuzzle.config);
          
          const challenge = await startChallenge(id);
          if (challenge) {
            challengeIdRef.current = challenge.id;
            startTimeRef.current = Date.now();
          }
        }
        isLoading.current = false;
      };
      loadAndStart();
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const shareData = hashParams.get('share');
    
    if (shareData) {
      isLoading.current = true;
      const loadFromShare = async () => {
        try {
          let base64Decoded = atob(shareData);
          let jsonString = base64Decoded;
          
          if (base64Decoded.includes('%')) {
            jsonString = decodeURIComponent(base64Decoded);
          }
          
          const config = JSON.parse(jsonString);
          const data = await generatePuzzleAsync(config, false);
          setPuzzleData(data);
          setPuzzleConfig(config);
          startTimeRef.current = Date.now();
        } catch (error) {
          console.error('Failed to parse share data:', error);
        }
        isLoading.current = false;
      };
      loadFromShare();
      return;
    }
  }, [id, setPuzzleData, setPuzzleConfig]);

  const handleComplete = useCallback(async () => {
    if (challengeIdRef.current) {
      const duration = Date.now() - startTimeRef.current;
      await completeChallenge(challengeIdRef.current, duration);
    }
  }, []);

  const handleRestart = useCallback(async () => {
    if (puzzleConfig) {
      const data = await generatePuzzleAsync(puzzleConfig);
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
