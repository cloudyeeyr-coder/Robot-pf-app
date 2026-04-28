import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../app/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../app/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MOCK_EVENT_LOGS, getEventLogsByType, type EventLog } from '../../lib/mockAdminData';

const EVENT_TYPE_LABELS: Record<EventLog['type'], string> = {
  signup_complete: '회원가입',
  contract_created: '계약 생성',
  escrow_deposit_confirmed: '에스크로 확인',
  badge_issued: '뱃지 발급',
  as_ticket_created: 'AS 티켓',
  proposal_sent: '제안 발송',
};

const EVENT_TYPE_COLORS: Record<EventLog['type'], string> = {
  signup_complete: 'bg-green-100 text-green-800',
  contract_created: 'bg-blue-100 text-blue-800',
  escrow_deposit_confirmed: 'bg-purple-100 text-purple-800',
  badge_issued: 'bg-yellow-100 text-yellow-800',
  as_ticket_created: 'bg-red-100 text-red-800',
  proposal_sent: 'bg-indigo-100 text-indigo-800',
};

export function EventLogsPage() {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [selectedType, setSelectedType] = useState<EventLog['type'] | 'all'>('all');

  useEffect(() => {
    loadLogs();
  }, [selectedType]);

  const loadLogs = () => {
    if (selectedType === 'all') {
      setLogs(MOCK_EVENT_LOGS);
    } else {
      setLogs(getEventLogsByType(selectedType));
    }
  };

  // Prepare chart data (group by event type)
  const chartData = Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => {
    const count = MOCK_EVENT_LOGS.filter((log) => log.type === type).length;
    return {
      name: label,
      count,
    };
  });

  const getTypeBadge = (type: EventLog['type']) => {
    return (
      <Badge className={EVENT_TYPE_COLORS[type]}>
        {EVENT_TYPE_LABELS[type]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">이벤트 로그</h1>
        <p className="text-gray-600">플랫폼 활동 로그 및 통계</p>
      </div>

      {/* Event Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>이벤트 유형별 발생 건수</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="발생 건수" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Event Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>이벤트 로그</CardTitle>
            <Select
              value={selectedType}
              onValueChange={(v: any) => setSelectedType(v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="이벤트 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이벤트 유형</TableHead>
                  <TableHead>사용자 ID</TableHead>
                  <TableHead>사용자명</TableHead>
                  <TableHead>페이로드 요약</TableHead>
                  <TableHead>발생 시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      이벤트 로그가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getTypeBadge(log.type)}</TableCell>
                      <TableCell className="font-mono text-sm">{log.user_id}</TableCell>
                      <TableCell className="font-medium">{log.user_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {log.payload_summary}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString('ko-KR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
