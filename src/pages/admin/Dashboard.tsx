import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { KpiCard } from '../../app/components/dashboard/KpiCard';
import { DollarSign, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import {
  getEscrowReleasesPending,
  getDisputesInProgress,
  getUnassignedAsTickets,
  getSignupsThisMonth,
} from '../../lib/mockAdminData';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState({
    escrowReleases: 0,
    disputes: 0,
    unassignedAs: 0,
    signups: 0,
  });

  useEffect(() => {
    setKpis({
      escrowReleases: getEscrowReleasesPending(),
      disputes: getDisputesInProgress(),
      unassignedAs: getUnassignedAsTickets(),
      signups: getSignupsThisMonth(),
    });
  }, []);

  const kpiCards = [
    {
      title: '에스크로 방출 대기',
      value: `${kpis.escrowReleases}건`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      path: '/admin/escrow',
      description: '검수 완료 후 방출 대기 중',
    },
    {
      title: '분쟁 진행 건수',
      value: `${kpis.disputes}건`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      path: '/admin/disputes',
      description: '중재 진행 중',
    },
    {
      title: 'AS 미배정 건수',
      value: `${kpis.unassignedAs}건`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      path: '/admin/as-sla',
      description: '24시간 초과',
    },
    {
      title: '이번 달 가입 완료',
      value: `${kpis.signups}개사`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      path: '/admin/events',
      description: '신규 가입',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">운영 대시보드</h1>
        <p className="text-gray-600">플랫폼 전체 현황 모니터링</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            bgColor={kpi.bgColor}
            description={kpi.description}
            onClick={() => navigate(kpi.path)}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 액션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/admin/escrow')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-semibold mb-1">에스크로 관리</div>
              <div className="text-sm text-gray-600">입금 확인 및 방출 처리</div>
            </button>
            <button
              onClick={() => navigate('/admin/as-sla')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-semibold mb-1">AS SLA 모니터링</div>
              <div className="text-sm text-gray-600">AS 티켓 목표 달성률</div>
            </button>
            <button
              onClick={() => navigate('/admin/disputes')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-semibold mb-1">분쟁 관리</div>
              <div className="text-sm text-gray-600">중재 진행 현황</div>
            </button>
            <button
              onClick={() => navigate('/admin/events')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <div className="font-semibold mb-1">이벤트 로그</div>
              <div className="text-sm text-gray-600">플랫폼 활동 로그</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* System Health (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>시스템 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">에스크로 시스템</span>
              <span className="text-sm font-semibold text-green-600">정상</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AS 배정 시스템</span>
              <span className="text-sm font-semibold text-green-600">정상</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">알림 발송</span>
              <span className="text-sm font-semibold text-green-600">정상</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
