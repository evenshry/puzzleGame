import { useState, useCallback, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, Trash2, Edit3, Check, X, Clock, Play, Trophy, Timer, Target, QrCode } from 'lucide-react';
import { SavedPuzzle, ChallengeRecord } from '@/types';
import { getSavedPuzzles, deletePuzzleById, updatePuzzleName, getChallengeRecords, deleteChallenge } from '@/utils/storage';
import QRCodeModal from '@/components/QRCodeModal';
import styles from './index.module.scss';

interface PuzzleListProps {
  onSelectPuzzle: (puzzle: SavedPuzzle) => void;
  onCreateNew?: () => void;
}

type TabType = 'created' | 'challenged';

const PuzzleList = memo(function PuzzleList({ onSelectPuzzle, onCreateNew }: PuzzleListProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [puzzles, setPuzzles] = useState<SavedPuzzle[]>([]);
  const [challenges, setChallenges] = useState<ChallengeRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPuzzle, setSelectedPuzzle] = useState<SavedPuzzle | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPuzzles = useCallback(async () => {
    const saved = await getSavedPuzzles();
    setPuzzles(saved);
  }, []);

  const loadChallenges = useCallback(async () => {
    const records = await getChallengeRecords();
    setChallenges(records.filter(c => c.isCompleted));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadPuzzles(), loadChallenges()]);
      setLoading(false);
    };
    loadData();
  }, [loadPuzzles, loadChallenges]);

  const handleDelete = useCallback(async (_e: React.MouseEvent | null, id: string) => {
    if (confirm('确定要删除这个拼图吗？')) {
      await deletePuzzleById(id);
      await loadPuzzles();
    }
  }, [loadPuzzles]);

  const handleDeleteChallenge = useCallback(async (_e: React.MouseEvent | null, id: string) => {
    if (confirm('确定要删除这条挑战记录吗？')) {
      await deleteChallenge(id);
      await loadChallenges();
    }
  }, [loadChallenges]);

  const handleStartEditClick = useCallback((puzzle: SavedPuzzle) => {
    navigate(`/edit/${puzzle.id}`);
  }, [navigate]);

  const handleSaveEdit = useCallback(async () => {
    if (editingId && editName.trim()) {
      await updatePuzzleName(editingId, editName.trim());
      await loadPuzzles();
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, loadPuzzles]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const handleReplayChallenge = useCallback((challenge: ChallengeRecord) => {
    navigate(`/play/${challenge.puzzleId}`);
  }, [navigate]);

  const handleShowQRCode = useCallback((puzzle: SavedPuzzle) => {
    setSelectedPuzzle(puzzle);
    setShowQRModal(true);
  }, []);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    }
    return `${seconds}秒`;
  };

  const renderEmptyState = (type: TabType) => {
    if (type === 'created') {
      return (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Puzzle size={48} />
          </div>
          <h3 className={styles.emptyTitle}>还没有保存的拼图</h3>
          <p className={styles.emptyDesc}>创建一个拼图并保存，之后就可以在这里快速开始拼图了</p>
          {onCreateNew && (
            <button className={styles.createBtn} onClick={onCreateNew}>
              去制作一个
            </button>
          )}
        </div>
      );
    }
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <Trophy size={48} />
        </div>
        <h3 className={styles.emptyTitle}>还没有完成的挑战</h3>
        <p className={styles.emptyDesc}>去挑战别人的拼图，完成后记录会显示在这里</p>
        {onCreateNew && (
          <button className={styles.createBtn} onClick={onCreateNew}>
            去制作一个
          </button>
        )}
      </div>
    );
  };

  const renderCreatedList = () => (
    <div className={styles.list}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Puzzle size={20} />
          我的拼图
        </h2>
        <span className={styles.count}>{puzzles.length} 个拼图</span>
      </div>

      {puzzles.length === 0 ? (
        renderEmptyState('created')
      ) : (
        <div className={styles.grid}>
          {puzzles.map((puzzle) => (
            <div key={puzzle.id} className={styles.card}>
              <div className={styles.thumbnail}>
                <img src={puzzle.thumbnail} alt={puzzle.name} />
              </div>

              <div className={styles.info}>
                {editingId === puzzle.id ? (
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={styles.editInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button className={styles.editBtn} onClick={handleSaveEdit}>
                      <Check size={14} />
                    </button>
                    <button className={styles.editBtn} onClick={handleCancelEdit}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <h3 className={styles.name}>{puzzle.name}</h3>
                )}

                <div className={styles.meta}>
                  <span className={styles.difficulty}>
                    {puzzle.config.difficulty}片
                  </span>
                  <span className={styles.date}>
                    <Clock size={12} />
                    {formatDate(puzzle.createdAt)}
                  </span>
                </div>

                <div className={styles.textPreview}>
                  {puzzle.config.text.substring(0, 30)}
                  {puzzle.config.text.length > 30 ? '...' : ''}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => onSelectPuzzle(puzzle)}
                >
                  <Play size={14} />
                  去拼图
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleStartEditClick(puzzle)}
                >
                  <Edit3 size={14} />
                  编辑
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleShowQRCode(puzzle)}
                >
                  <QrCode size={14} />
                  分享
                </button>
              </div>

              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(null, puzzle.id)}
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderChallengedList = () => (
    <div className={styles.list}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Trophy size={20} />
          我挑战的
        </h2>
        <span className={styles.count}>{challenges.length} 条记录</span>
      </div>

      {challenges.length === 0 ? (
        renderEmptyState('challenged')
      ) : (
        <div className={styles.grid}>
          {challenges.map((challenge) => (
            <div key={challenge.id} className={styles.card}>
              <div className={styles.thumbnail}>
                <img src={challenge.thumbnail} alt={challenge.puzzleName} />
                <div className={styles.completedBadge}>
                  <Trophy size={14} />
                  已完成
                </div>
              </div>

              <div className={styles.info}>
                <h3 className={styles.name}>{challenge.puzzleName}</h3>

                <div className={styles.meta}>
                  <span className={styles.difficulty}>
                    <Target size={12} />
                    {challenge.config.difficulty}片
                  </span>
                  <span className={styles.date}>
                    <Clock size={12} />
                    {formatDate(challenge.startedAt)}
                  </span>
                </div>

                <div className={styles.challengeStats}>
                  <div className={styles.statItem}>
                    <Timer size={14} />
                    <span>{challenge.duration ? formatDuration(challenge.duration) : '-'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleReplayChallenge(challenge)}
                >
                  <Play size={14} />
                  再玩一次
                </button>
              </div>

              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteChallenge(null, challenge.id)}
                title="删除"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>加载中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'created' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('created')}
        >
          <Puzzle size={16} />
          我制作的
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'challenged' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('challenged')}
        >
          <Trophy size={16} />
          我挑战的
        </button>
      </div>
      {activeTab === 'created' ? renderCreatedList() : renderChallengedList()}
      
      {showQRModal && selectedPuzzle && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          config={selectedPuzzle.config}
          thumbnail={selectedPuzzle.thumbnail}
        />
      )}
    </div>
  );
});

export default PuzzleList;
