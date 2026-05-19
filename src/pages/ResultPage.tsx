import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import ResultScreen from '@/components/ResultScreen';
import Layout from '@/components/Layout';
import { useAppStore } from '@/store/appStore';
import { generatePuzzle } from '@/utils/puzzle';
import styles from '@/App.module.scss';

const CURRENT_PUZZLE_ID_KEY = 'current-puzzle-id';

export function ResultPage() {
  const navigate = useNavigate();
  const puzzleConfig = useAppStore(state => state.puzzleConfig);
  const setPuzzleData = useAppStore(state => state.setPuzzleData);
  const [puzzleId, setPuzzleId] = useState<string>('');

  useEffect(() => {
    try {
      const savedId = localStorage.getItem(CURRENT_PUZZLE_ID_KEY);
      if (savedId) {
        setPuzzleId(savedId);
      }
    } catch (error) {
      console.error('Failed to load puzzle ID:', error);
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (puzzleConfig) {
      const data = generatePuzzle(puzzleConfig);
      setPuzzleData(data);
      if (puzzleId) {
        navigate(`/play/${puzzleId}`);
      } else {
        navigate('/play');
      }
    }
  }, [puzzleConfig, setPuzzleData, navigate, puzzleId]);

  const handleCreateNew = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  if (!puzzleConfig) {
    return (
      <Layout>
        <div className={styles.emptyState}>
          <Sparkles size={64} />
          <p>还没有完成的拼图</p>
          <button className={styles.createBtn} onClick={handleCreateNew}>
            去制作一个
          </button>
        </div>
      </Layout>
    );
  }

  return <ResultScreen config={puzzleConfig} onRestart={handleRestart} />;
}
