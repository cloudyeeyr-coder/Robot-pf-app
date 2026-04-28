// Sidebar.tsx
/**
 * @file Sidebar.tsx
 * @description 역할별 사이드 네비게이션 메뉴를 렌더링하는 레이아웃 컴포넌트입니다.
 * useAuth() 훅을 통해 현재 역할을 자동 식별하며, navigation.ts config에서 메뉴 항목을 읽어옵니다.
 * 모바일 환경에서는 backdrop 오버레이와 함께 슬라이드 인/아웃 애니메이션을 지원합니다.
 */
import { Link, useLocation } from 'react-router';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import { navigationByRole } from '../../../config/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * @component Sidebar
 * @description 현재 인증된 사용자의 역할(role)을 기반으로 사이드바 메뉴를 자동 구성합니다.
 * - role이 없거나 해당 역할의 메뉴가 없으면 null을 반환합니다.
 * - isOpen prop으로 모바일 열림/닫힘 상태를 제어합니다.
 *
 * @param {boolean} isOpen - 모바일에서 사이드바 열림 여부 (기본값: true)
 * @param {() => void} onClose - 모바일 사이드바 닫기 콜백
 */
export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  
  if (!user || !user.role) return null;
  
  const navigation = navigationByRole[user.role] || [];

  if (navigation.length === 0) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r z-50 transition-transform duration-300',
          'w-64 lg:w-60 lg:sticky lg:top-16',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <h2 className="font-semibold">메뉴</h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4" aria-label="주요 네비게이션">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={onClose}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
