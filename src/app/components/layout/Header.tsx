import { Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Button } from '../ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '../ui/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

import { getRoleColor, getRoleLabel, navigationByRole } from '../../../config/navigation';

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const getRoleNavigation = () => {
    if (!user || !user.role) return [];
    return navigationByRole[user.role] || [];
  };

  const isActivePath = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="container-custom h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden"
                aria-label="메뉴 열기"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}

            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-bold text-lg text-gray-900 hidden sm:inline">
                로봇 SI 매칭 플랫폼
              </span>
            </Link>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {getRoleNavigation().map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition-colors relative",
                    isActive
                      ? "text-primary-600"
                      : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <NotificationDropdown userId={user?.id || ''} />

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 h-10 px-2 hover:bg-gray-50"
                      aria-label={`User menu for ${user?.name}`}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm",
                          getRoleColor(user?.role || null)
                        )}
                        aria-hidden="true"
                      >
                        {user?.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-gray-900">
                        {user?.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                              user?.role === 'buyer' && "bg-primary-50 text-primary-700",
                              user?.role === 'si_partner' && "bg-purple-50 text-purple-700",
                              user?.role === 'manufacturer' && "bg-cyan-50 text-cyan-700",
                              user?.role === 'admin' && "bg-gray-100 text-gray-700"
                            )}
                          >
                            {getRoleLabel(user?.role || null)}
                          </span>
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>프로필 설정</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link to="/notifications" className="w-full">
                        알림 설정
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive-600">
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = '/login')}
                >
                  로그인
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm">회원가입</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => (window.location.href = '/signup/buyer')}
                    >
                      수요기업 가입
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => (window.location.href = '/signup/partner')}
                    >
                      SI 파트너 가입
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
