// navigation.ts
/**
 * @file navigation.ts
 * @description 역할(Role)별 사이드바 네비게이션 메뉴, 색상, 라벨을 중앙 집중적으로 관리하는 설정 파일입니다.
 * 신규 역할 추가 또는 메뉴 변경 시 이 파일만 수정하면 Header, Sidebar 등 모든 UI에 자동 반영됩니다.
 *
 * @ai-guide
 * - 신규 역할 추가 시: UserRole 타입 → roleColors → roleLabels → navigationByRole 순서로 추가
 * - 메뉴 항목 변경 시: navigationByRole[role] 배열만 수정
 * - 아이콘은 lucide-react 에서 import 후 NavItem.icon 에 할당
 */
import { LayoutDashboard, Award, FileText, DollarSign, Activity, Settings, Calendar, LucideIcon } from 'lucide-react';
import type { UserRole } from '../types';

export interface NavItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

export const navigationByRole: Record<Exclude<UserRole, null>, NavItem[]> = {
  admin: [
    { label: '대시보드', path: '/admin', icon: LayoutDashboard },
    { label: '에스크로 관리', path: '/admin/escrow', icon: DollarSign },
    { label: 'AS SLA 모니터링', path: '/admin/as-sla', icon: Activity },
    { label: '이벤트 로그', path: '/admin/events', icon: FileText },
    { label: '분쟁 관리', path: '/admin/disputes', icon: Settings },
  ],
  manufacturer: [
    { label: '대시보드', path: '/manufacturer/dashboard', icon: LayoutDashboard },
    { label: '뱃지 관리', path: '/manufacturer/badges', icon: Award },
    { label: '제안 관리', path: '/manufacturer/proposals', icon: FileText },
  ],
  si_partner: [
    { label: '프로필 관리', path: '/partner/profile', icon: Settings },
    { label: '받은 제안', path: '/partner/proposals', icon: FileText },
    { label: '내 뱃지', path: '/partner/badges', icon: Award },
  ],
  buyer: [
    { label: 'SI 검색', path: '/search' },
    { label: '계산기', path: '/calculator' },
    { label: '내 계약', path: '/my/contracts' },
    { label: 'AS 요청', path: '/my/as-tickets' },
    { label: '방문 예약', path: '/booking' },
  ],
};

export const roleColors: Record<Exclude<UserRole, null>, string> = {
  buyer: 'bg-role-buyer text-white',
  si_partner: 'bg-role-si-partner text-white',
  manufacturer: 'bg-role-manufacturer text-white',
  admin: 'bg-role-admin text-white',
};

export const roleLabels: Record<Exclude<UserRole, null>, string> = {
  buyer: '수요기업',
  si_partner: 'SI 파트너',
  manufacturer: '제조사',
  admin: '관리자',
};

/**
 * @function getRoleColor
 * @description 역할 문자열을 받아 해당 역할의 Tailwind 배경색 클래스 문자열을 반환합니다.
 * @param {UserRole} role - 현재 사용자 역할
 * @returns {string} Tailwind CSS 클래스 문자열 (예: 'bg-role-admin text-white')
 */
export const getRoleColor = (role: UserRole): string => {
  if (!role) return 'bg-gray-400 text-white';
  return roleColors[role] || 'bg-gray-400 text-white';
};

/**
 * @function getRoleLabel
 * @description 역할 문자열을 받아 UI에 표시할 한국어 라벨을 반환합니다.
 * @param {UserRole} role - 현재 사용자 역할
 * @returns {string} 한국어 역할 라벨 (예: '관리자')
 */
export const getRoleLabel = (role: UserRole): string => {
  if (!role) return '';
  return roleLabels[role] || '';
};
