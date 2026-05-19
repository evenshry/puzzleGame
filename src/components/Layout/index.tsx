import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, Puzzle, QrCode, List } from 'lucide-react';
import styles from './index.module.scss';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export function Layout({ children, showNavigation = true }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo} onClick={() => navigate('/create')}>
          <Heart className={styles.logoIcon} />
          <h1 className={styles.logoText}>拼图游戏</h1>
        </div>
        <p className={styles.tagline}>挑战你的拼图技能</p>
      </header>

      <main className={styles.main}>
        {showNavigation && (
          <nav className={styles.modeSelector}>
            <button
              className={`${styles.modeBtn} ${isActive('/create') ? styles.modeBtnActive : ''}`}
              onClick={() => navigate('/create')}
            >
              <Puzzle size={18} />
              <span>制作拼图</span>
            </button>
            <button
              className={`${styles.modeBtn} ${isActive('/play') ? styles.modeBtnActive : ''}`}
              onClick={() => navigate('/play')}
            >
              <QrCode size={18} />
              <span>接收拼图</span>
            </button>
            <button
              className={`${styles.modeBtn} ${isActive('/list') ? styles.modeBtnActive : ''}`}
              onClick={() => navigate('/list')}
            >
              <List size={18} />
              <span>我的拼图</span>
            </button>
          </nav>
        )}
        {children}
      </main>

      <footer className={styles.footer}>
        <p>用爱制作</p>
      </footer>
    </div>
  );
}

export default Layout;
