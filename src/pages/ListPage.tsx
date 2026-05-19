import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PuzzleList from '@/components/PuzzleList';
import Layout from '@/components/Layout';
import { SavedPuzzle } from '@/types';

export function ListPage() {
  const navigate = useNavigate();

  const handleSelectPuzzle = useCallback((savedPuzzle: SavedPuzzle) => {
    navigate(`/play/${savedPuzzle.id}`);
  }, [navigate]);

  const handleCreateNew = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  return (
    <Layout>
      <PuzzleList onSelectPuzzle={handleSelectPuzzle} onCreateNew={handleCreateNew} />
    </Layout>
  );
}
