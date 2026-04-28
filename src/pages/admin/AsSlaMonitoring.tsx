import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { KpiCard } from '../../app/components/dashboard/KpiCard';
import { Badge } from '../../app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../app/components/ui/tabs';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { getAsSlaMetrics } from '../../lib/mockAdminData';
import { MOCK_AS_TICKETS, checkSlaCompliance } from '../../lib/mockAsTickets';

type AsTicketStatus = 'reported' | 'assigned' | 'dispatched' | 'resolved';

export function AsSlaMonitoringPage() {
  const [metrics, setMetrics] = useState({
    successRate: 0,
    unassignedCount: 0,
    avgResolutionTime: 0,
  });
  const [tickets, setTickets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'in_progress' | 'completed' | 'sla_missed'>('all');

  useEffect(() => {
    const slaMetrics = getAsSlaMetrics();
    setMetrics(slaMetrics);
    setTickets(MOCK_AS_TICKETS);
  }, []);

  const getStatusBadge = (status: AsTicketStatus) => {
    switch (status) {
      case 'reported':
        return <Badge className="bg-yellow-500">접수됨</Badge>;
      case 'assigned':
        return <Badge variant="default">배정됨</Badge>;
      case 'dispatched':
        return <Badge variant="default" className="bg-blue-600">출동 중</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600">완료</Badge>;
    }
  };

  const getPriorityBadge = (priority: 'normal' | 'urgent') => {
    return priority === 'urgent' ? (
      <Badge variant="destructive">긴급</Badge>
    ) : (
      <Badge variant="secondary">일반</Badge>
    );
  };

  const getSlaStatus = (ticket: any) => {
    if (ticket.status !== 'resolved') return null;
    const compliant = checkSlaCompliance(ticket);
    return compliant ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    );
  };

  const isUnassigned = (ticket: any) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    return !ticket.assigned_at && new Date(ticket.reported_at).getTime() < twentyFourHoursAgo;
  };

  const filteredTickets = tickets.filter((ticket) => {
    switch (activeTab) {
      case 'unassigned':
        return isUnassigned(ticket);
      case 'in_progress':
        return ticket.status !== 'resolved';
      case 'completed':
        return ticket.status === 'resolved';
      case 'sla_missed':
        return ticket.status === 'resolved' && !checkSlaCompliance(ticket);
      default:
        return true;
    }
  });

  const statusCounts = {
    all: tickets.length,
    unassigned: tickets.filter(isUnassigned).length,
    in_progress: tickets.filter((t) => t.status !== 'resolved').length,
    completed: tickets.filter((t) => t.status === 'resolved').length,
    sla_missed: tickets.filter((t) => t.status === 'resolved' && !checkSlaCompliance(t)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">AS SLA 모니터링</h1>
        <p className="text-gray-600">AS 티켓 목표 달성률 및 현황</p>
      </div>

      {/* SLA Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="24시간 목표 달성률"
          value={`${metrics.successRate}%`}
          icon={CheckCircle}
          description={metrics.successRate >= 95 ? "목표 달성 (목표: ≥95%)" : "목표 미달 (목표: ≥95%)"}
          color={metrics.successRate >= 95 ? "text-green-600" : "text-red-600"}
          bgColor={metrics.successRate >= 95 ? "bg-green-100" : "bg-red-100"}
        />
        <KpiCard
          title="미배정 건수 (24시간 초과)"
          value={`${metrics.unassignedCount}건`}
          icon={Clock}
          description={metrics.unassignedCount > 0 ? "즉시 조치 필요" : "모두 배정됨"}
          color={metrics.unassignedCount === 0 ? "text-green-600" : "text-red-600"}
          bgColor={metrics.unassignedCount === 0 ? "bg-green-100" : "bg-red-100"}
        />
        <KpiCard
          title="평균 해결 시간"
          value={`${metrics.avgResolutionTime}시간`}
          icon={Clock}
          description="목표: ≤24시간"
        />
      </div>

      {/* AS Tickets Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>AS 티켓 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList>
              <TabsTrigger value="all">전체 ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="unassigned">미배정 ({statusCounts.unassigned})</TabsTrigger>
              <TabsTrigger value="in_progress">진행 중 ({statusCounts.in_progress})</TabsTrigger>
              <TabsTrigger value="completed">완료 ({statusCounts.completed})</TabsTrigger>
              <TabsTrigger value="sla_missed">SLA 미충족 ({statusCounts.sla_missed})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>티켓 번호</TableHead>
                      <TableHead>계약 ID</TableHead>
                      <TableHead>긴급도</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>접수일</TableHead>
                      <TableHead>배정일</TableHead>
                      <TableHead>해결일</TableHead>
                      <TableHead>SLA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          해당하는 티켓이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => {
                        const isSlaViolation =
                          ticket.status === 'resolved' && !checkSlaCompliance(ticket);

                        return (
                          <TableRow
                            key={ticket.id}
                            className={isSlaViolation ? 'bg-red-50' : ''}
                          >
                            <TableCell className="font-mono text-sm">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {ticket.contract_id}
                            </TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(ticket.reported_at).toLocaleDateString('ko-KR')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {ticket.assigned_at
                                ? new Date(ticket.assigned_at).toLocaleDateString('ko-KR')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {ticket.resolved_at
                                ? new Date(ticket.resolved_at).toLocaleDateString('ko-KR')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {getSlaStatus(ticket) || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
