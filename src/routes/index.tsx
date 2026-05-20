import { createHashRouter } from 'react-router-dom';
import { WelcomePage } from '../pages/Welcome';
import { HomePage } from '../pages/HomePage';
import { PlayPage } from '../pages/PlayPage';
import { ListPage } from '../pages/ListPage';
import { ResultPage } from '../pages/ResultPage';
import { EditPage } from '../pages/EditPage';

const basePath = import.meta.env.PROD ? '/puzzleGame' : '';

export const router = createHashRouter(
  [
    {
      path: '/',
      element: <WelcomePage />,
      errorElement: <ErrorFallback />,
    },
    {
      path: '/create',
      element: <HomePage />,
    },
    {
      path: '/edit/:id',
      element: <EditPage />,
    },
    {
      path: '/play',
      element: <PlayPage />,
    },
    {
      path: '/play/:id',
      element: <PlayPage />,
    },
    {
      path: '/list',
      element: <ListPage />,
    },
    {
      path: '/result',
      element: <ResultPage />,
    },
  ]
);

function ErrorFallback() {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <h1>出错了</h1>
      <p>页面不存在或发生了错误</p>
      <button
        onClick={() => window.location.href = `${basePath}/#/create`}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1677ff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '1rem'
        }}
      >
        返回首页
      </button>
    </div>
  );
}