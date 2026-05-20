import { useNavigate } from 'react-router-dom';
import { Heart, Puzzle, QrCode, List, Sparkles } from 'lucide-react';
import styles from './index.module.scss';

export function WelcomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Puzzle size={24} />,
      title: '制作拼图',
      description: '上传照片，自定义切割方式，创建专属拼图',
      path: '/create',
    },
    {
      icon: <QrCode size={24} />,
      title: '接收拼图',
      description: '扫描二维码，挑战好友分享的拼图',
      path: '/play',
    },
    {
      icon: <List size={24} />,
      title: '我的拼图',
      description: '查看和管理已保存的拼图作品',
      path: '/list',
    },
  ];

  return (
    <div className={styles.welcome}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoWrapper}>
            <Heart className={styles.logoIcon} />
            <Sparkles className={styles.sparkle} />
          </div>
          <h1 className={styles.title}>拼图游戏</h1>
          <p className={styles.subtitle}>用爱制作，用心拼凑</p>
          <p className={styles.description}>
            将美好瞬间变成有趣的拼图挑战，与好友分享这份快乐
          </p>
        </div>
        <div className={styles.heroDecoration}>
          <div className={styles.floatingHeart}></div>
          <div className={styles.floatingHeart}></div>
          <div className={styles.floatingHeart}></div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>选择你的模式</h2>
          <div className={styles.cardGrid}>
            {features.map((feature) => (
              <button
                key={feature.path}
                className={styles.card}
                onClick={() => navigate(feature.path)}
              >
                <div className={styles.cardIcon}>{feature.icon}</div>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardDescription}>{feature.description}</p>
                <div className={styles.cardArrow}>&rarr;</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>用爱制作</p>
      </footer>
    </div>
  );
}
