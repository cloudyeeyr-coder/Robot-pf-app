// RoleLayout.tsx
/**
 * @file RoleLayout.tsx
 * @description 인증된 사용자를 위한 공통 페이지 레이아웃 컴포넌트입니다.
 * Header, Sidebar, Footer를 포함하며, showSidebar prop으로 사이드바 노출 여부를 제어합니다.
 * 역할 정보는 내부적으로 Sidebar와 Header가 useAuth()를 통해 직접 조회합니다 (Prop Drilling 없음).
 */
import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import type { UserRole } from '../../../types';

interface RoleLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

/**
 * @component RoleLayout
 * @description 페이지 콘텐츠를 감싸는 표준 레이아웃 래퍼입니다.
 * - showSidebar가 true일 때 Sidebar와 햄버거 메뉴 버튼을 함께 렌더링합니다.
 * - '본문으로 건너뛰기' skip-link가 포함되어 접근성을 지원합니다.
 *
 * @param {ReactNode} children - 렌더링할 페이지 콘텐츠
 * @param {boolean} showSidebar - 사이드바 표시 여부 (기본값: false)
 */
export function RoleLayout({ children, showSidebar = false }: RoleLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        본문으로 건너뛰기
      </a>

      <Header onMenuClick={showSidebar ? () => setSidebarOpen(true) : undefined} />

      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <main
          id="main-content"
          className="flex-1 w-full"
          role="main"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
