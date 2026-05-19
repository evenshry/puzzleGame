## 项目开发技能（React + TS + Antd + Sass 最佳实践）

### 1. 项目初始化与工具链

**推荐使用 Vite**（启动快、支持 HMR、配置简单）。

```bash
npm create vite@latest trae-solo -- --template react-ts
cd trae-solo
npm install
```

**安装依赖**：

```bash
npm install antd sass axios react-router-dom
npm install @types/node -D   # 解决路径别名类型提示
npm install -D eslint prettier husky lint-staged
```

**配置路径别名**（`vite.config.ts`）：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@styles/variables.scss";`, // 全局注入变量
      },
    },
  },
});
```

### 2. 目录结构最佳实践

```
src/
├── api/                 # API 请求层（axios 实例、接口定义）
├── assets/              # 静态资源（图片、字体）
├── components/          # 通用组件（可复用）
│   ├── Button/
│   │   ├── index.tsx
│   │   ├── index.module.scss
│   │   └── types.ts
│   └── Layout/
├── hooks/               # 自定义 Hooks
├── pages/               # 页面级组件
│   ├── Home/
│   │   ├── index.tsx
│   │   ├── index.module.scss
│   │   └── components/  # 页面私有组件
├── routes/              # 路由配置
├── store/               # 状态管理（Zustand/Redux）
├── styles/              # 全局样式
│   ├── variables.scss   # Sass 变量
│   ├── mixins.scss      # 混入
│   └── global.scss      # 全局重置
├── types/               # 全局 TS 类型声明
│   ├── api.d.ts
│   └── global.d.ts
├── utils/               # 工具函数
└── App.tsx
```

### 3. TypeScript 配置规范

**`tsconfig.json` 关键配置**：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@styles/*": ["src/styles/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. React 组件编写规范

**原则**：
- 使用函数组件 + Hooks，避免类组件
- 每个组件单独文件夹，包含 `.tsx`、`.module.scss`、`types.ts`（可选）
- 组件文件名使用 PascalCase
- Props 类型必须明确定义，使用 `interface` 而非 `type`（便于扩展）

**示例**：通用按钮组件

```tsx
// src/components/Button/index.tsx
import React from 'react';
import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import styles from './index.module.scss';

export interface ButtonProps extends AntButtonProps {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  className,
  children,
  ...rest
}) => {
  const combinedClass = `${styles.button} ${styles[variant]} ${
    fullWidth ? styles.fullWidth : ''
  } ${className || ''}`;

  return (
    <AntButton className={combinedClass} {...rest}>
      {children}
    </AntButton>
  );
};

export default Button;
```

```scss
// src/components/Button/index.module.scss
.button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;

  &.primary {
    background-color: #1677ff;
    color: white;
    &:hover {
      background-color: #4096ff;
    }
  }

  &.secondary {
    background-color: #f0f0f0;
    color: #333;
    &:hover {
      background-color: #e0e0e0;
    }
  }

  &.fullWidth {
    width: 100%;
  }
}
```

### 5. Ant Design 使用最佳实践

#### 5.1 按需加载（Vite 自动处理，无需额外插件）

Ant Design v5 使用 CSS-in-JS，无需手动按需加载，但需确保样式正确导入：

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import '@styles/global.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
```

#### 5.2 主题定制（使用 ConfigProvider 的 `theme`）

```tsx
// 定义全局主题覆盖（可放入单独的 theme.ts）
import { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#00b96b',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Button: {
      controlHeight: 40,
      fontWeight: 500,
    },
    Input: {
      controlHeight: 40,
    },
  },
};
```

#### 5.3 避免样式冲突

- 不要在全局样式中重置 Ant Design 样式
- 使用 CSS Modules 覆盖 Antd 组件样式时，通过 `:global` 或 `className` 配合 `styles`

```scss
// 覆盖 Antd Table 的表头样式
.customTable {
  :global {
    .ant-table-thead > tr > th {
      background-color: #fafafa;
      font-weight: 600;
    }
  }
}
```

### 6. Sass 样式规范

#### 6.1 全局变量与混入

```scss
// src/styles/variables.scss
$primary-color: #1677ff;
$success-color: #52c41a;
$warning-color: #faad14;
$error-color: #ff4d4f;

$spacing-unit: 8px;
$border-radius-base: 8px;

$breakpoints: (
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
);
```

```scss
// src/styles/mixins.scss
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

@mixin ellipsis($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

@mixin respond-to($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    @media (min-width: map-get($breakpoints, $breakpoint)) {
      @content;
    }
  }
}
```

#### 6.2 CSS Modules 使用

- 每个组件搭配 `*.module.scss`
- 类名使用 camelCase（便于 JS 中引用）
- 避免深层嵌套（最多 3 层）

```tsx
import styles from './index.module.scss';

<div className={styles.container}>
  <h1 className={styles.title}>Hello</h1>
</div>
```

### 7. 状态管理（推荐 Zustand）

轻量、简单、TS 支持优秀。

```bash
npm install zustand
```

**示例**：用户状态管理

```ts
// src/store/userStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        setUser: (user) => set({ user }),
        setToken: (token) => set({ token }),
        logout: () => set({ user: null, token: null }),
      }),
      { name: 'user-storage' } // 持久化到 localStorage
    )
  )
);
```

**在组件中使用**：

```tsx
import { useUserStore } from '@/store/userStore';

const Profile = () => {
  const { user, logout } = useUserStore();
  return (
    <div>
      <p>{user?.name}</p>
      <Button onClick={logout}>退出</Button>
    </div>
  );
};
```

### 8. 路由配置（React Router v6）

```tsx
// src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import { useUserStore } from '@/store/userStore';

// 路由守卫组件
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = useUserStore((state) => state.token);
  return token ? children : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        ),
      },
      // 其他需要登录的路由
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
]);
```

```tsx
// App.tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

function App() {
  return <RouterProvider router={router} />;
}
```

### 9. API 请求层（Axios + React Query）

**安装**：

```bash
npm install @tanstack/react-query axios
```

**封装 axios 实例**：

```ts
// src/api/request.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useUserStore } from '@/store/userStore';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const errMsg = (error.response?.data as any)?.message || error.message;
    message.error(errMsg);
    if (error.response?.status === 401) {
      useUserStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
```

**定义 API 类型**：

```ts
// src/types/api.d.ts
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}
```

**API 服务**：

```ts
// src/api/user.ts
import request from './request';
import { ApiResponse, LoginParams, UserInfo } from '@/types/api';

export const loginApi = (params: LoginParams): Promise<ApiResponse<{ token: string; user: UserInfo }>> => {
  return request.post('/auth/login', params);
};

export const getUserInfoApi = (): Promise<ApiResponse<UserInfo>> => {
  return request.get('/user/info');
};
```

**使用 React Query**：

```tsx
// src/hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserInfoApi, loginApi } from '@/api/user';
import { useUserStore } from '@/store/userStore';

export const useUserInfo = () => {
  return useQuery({
    queryKey: ['userInfo'],
    queryFn: getUserInfoApi,
    enabled: !!useUserStore.getState().token,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setToken, setUser } = useUserStore();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (res) => {
      const { token, user } = res.data;
      setToken(token);
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['userInfo'] });
    },
  });
};
```

### 10. 代码规范（ESLint + Prettier + Husky）

**`.eslintrc.cjs`**：

```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  settings: {
    react: { version: 'detect' },
  },
};
```

**`.prettierrc`**：

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "endOfLine": "auto"
}
```

**`package.json` 添加 lint-staged**：

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.scss": ["prettier --write"]
  }
}
```

### 11. 性能优化

#### 11.1 组件优化

- `React.memo` 包裹纯展示组件
- `useCallback` / `useMemo` 避免子组件无效重渲染

```tsx
import React, { memo, useCallback, useState } from 'react';

const ExpensiveList = memo(({ items, onItemClick }: { items: string[]; onItemClick: (item: string) => void }) => {
  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onItemClick(item)}>
          {item}
        </li>
      ))}
    </ul>
  );
});

const Parent = () => {
  const [count, setCount] = useState(0);
  const items = ['a', 'b', 'c'];

  const handleClick = useCallback((item: string) => {
    console.log(item);
  }, []);

  return (
    <>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      <ExpensiveList items={items} onItemClick={handleClick} />
    </>
  );
};
```

#### 11.2 代码分割（路由懒加载）

```tsx
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const Home = lazy(() => import('@/pages/Home'));
const About = lazy(() => import('@/pages/About'));

// 在路由配置中
{
  path: '/home',
  element: (
    <Suspense fallback={<Spin size="large" />}>
      <Home />
    </Suspense>
  ),
}
```

#### 11.3 虚拟列表（大数据量）

使用 `react-window` 或 Antd 的 `List` 组件配合虚拟滚动。

### 12. 测试（Jest + React Testing Library）

**安装**：

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @types/jest
```

**配置 `jest.config.cjs`**：

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(scss|css)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**测试示例**：

```tsx
// src/components/Button/index.test.tsx
import { render, screen } from '@testing-library/react';
import Button from './index';

test('renders button with children', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### 13. 构建与部署

**环境变量**（`.env.production`）：

```
VITE_API_BASE_URL=https://api.traesolo.com
```

**优化构建**（`vite.config.ts` 中配置分包）：

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

**部署**：执行 `npm run build`，将 `dist` 目录部署到 Nginx/CDN。

**Nginx 配置 SPA 支持**：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 总结： 开发核心原则

1. **类型优先**：所有 API、Props、State 必须有 TS 类型。
2. **样式隔离**：使用 CSS Modules + 全局变量，避免全局污染。
3. **组件复用**：Ant Design 为基础，业务组件按需封装。
4. **状态可控**：Zustand 管理全局状态，React Query 管理服务端状态。
5. **性能意识**：懒加载、虚拟列表、memo/useCallback。
6. **规范落地**：ESLint + Prettier + Husky 保证代码质量。
