// KpiCard.tsx
/**
 * @file KpiCard.tsx
 * @description 대시보드 및 통계 요약 화면에서 핵심 성과 지표(KPI)를 일관성 있게 보여주는 공통 UI 컴포넌트입니다.
 * Tailwind CSS와 Framer Motion/CSS 트랜지션을 활용하여 프리미엄 다이내믹 호버 효과를 포함하고 있습니다.
 */
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface KpiCardProps {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  description?: string;
  onClick?: () => void;
  color?: string; // Tailwind text color class
  bgColor?: string; // Tailwind bg color class
  className?: string;
}

/**
 * @component KpiCard
 * @description 제목, 수치, 아이콘 및 부가 설명을 받아 KPI 형식의 카드를 렌더링합니다.
 * 클릭(onClick) 이벤트가 주입되면 호버 효과 및 클릭 상호작용이 활성화됩니다.
 *
 * @param {KpiCardProps} props - 타이틀, 값, 아이콘 등 렌더링을 위한 속성 객체
 */
export function KpiCard({
  title,
  value,
  icon: Icon,
  description,
  onClick,
  color = 'text-gray-600',
  bgColor = 'bg-gray-100',
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out group",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* 호버 시 나타나는 은은한 그라데이션 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</CardTitle>
          <div className={cn("p-2 rounded-full", bgColor)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-extrabold text-gray-900 tracking-tighter">{value}</div>
          {description && (
            <p className="text-xs text-gray-500 mt-2 font-medium tracking-wide">{description}</p>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
