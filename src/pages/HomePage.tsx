import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatePuzzle from '@/components/CreatePuzzle';
import Layout from '@/components/Layout';
import { useAppStore } from '@/store/appStore';
import { PuzzleData } from '@/types';

export function HomePage() {
  const navigate = useNavigate();
  const setPuzzleData = useAppStore(state => state.setPuzzleData);
  const setPuzzleThumbnail = useAppStore(state => state.setPuzzleThumbnail);

  const handleGenerate = useCallback((data: PuzzleData, thumbnail: string) => {
    setPuzzleData(data);
    setPuzzleThumbnail(thumbnail);
  }, [setPuzzleData, setPuzzleThumbnail]);

  const handleStartPuzzle = useCallback((data: PuzzleData) => {
    setPuzzleData(data);
    navigate('/play');
  }, [setPuzzleData, navigate]);

  return (
    <Layout>
      <CreatePuzzle onGenerate={handleGenerate} onStartPuzzle={handleStartPuzzle} />
    </Layout>
  );
}
