import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { KpiCard } from '../../app/components/dashboard/KpiCard';
import { Input } from '../../app/components/ui/input';
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
import { Award, Clock, TrendingUp, Users } from 'lucide-react';
import {
  getBadgesByManufacturerId,
  getActiveBadgeCount,
  getExpiringBadges,
  getPendingProposalsCount,
  getDaysUntilExpiry,
  type Badge as BadgeType,
} from '../../lib/mockBadges';
import { useAuth } from '../../contexts/AuthContext';

export function ManufacturerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<BadgeType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');

  useEffect(() => {
    // In production, user.companyId would be the manufacturer_id
    const manufacturerId = 'mfr-ur'; // Mock manufacturer ID
    const allBadges = getBadgesByManufacturerId(manufacturerId);
    setBadges(allBadges);
    setFilteredBadges(allBadges);
  }, [user]);

  useEffect(() => {
    let filtered = badges;

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.si_partner_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(b => b.is_active && new Date(b.expires_at) > new Date());
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(b => !b.is_active && !b.revoked_at);
      } else if (statusFilter === 'revoked') {
        filtered = filtered.filter(b => !!b.revoked_at);
      }
    }

    setFilteredBadges(filtered);
  }, [badges, searchQuery, statusFilter]);

  const manufacturerId = 'mfr-ur';
  const activeCount = getActiveBadgeCount(manufacturerId);
  const pendingProposals = getPendingProposalsCount(manufacturerId);
  const expiringBadges = getExpiringBadges(manufacturerId, 30);
  const newPartnersThisMonth = 0; // Mock data

  const getStatusBadge = (badge: BadgeType) => {
    if (badge.revoked_at) {
      return <Badge variant="destructive">철회됨</Badge>;
    }
    if (!badge.is_active || new Date(badge.expires_at) < new Date()) {
      return <Badge variant="secondary">만료됨</Badge>;
    }

    const daysLeft = getDaysUntilExpiry(badge.expires_at);
    if (daysLeft <= 7) {
      return <Badge variant="destructive">활성 (D-{daysLeft})</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge className="bg-yellow-500">활성 (D-{daysLeft})</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">파트너 현황</h1>
        <p className="text-gray-600">인증 파트너 관리 대시보드</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="활성 파트너"
          value={`${activeCount}개사`}
          icon={Users}
          description="현재 뱃지 보유 중"
          onClick={() => navigate('/manufacturer/badges')}
        />
        <KpiCard
          title="대기 중인 제안"
          value={`${pendingProposals}건`}
          icon={Clock}
          description="응답 대기 중"
          onClick={() => navigate('/manufacturer/proposals')}
        />
        <KpiCard
          title="만료 예정 뱃지"
          value={`${expiringBadges.length}건`}
          icon={Award}
          description="30일 이내 만료"
          className="hover:border-yellow-500"
        />
        <KpiCard
          title="이번 달 신규"
          value={`${newPartnersThisMonth}개사`}
          icon={TrendingUp}
          description="신규 파트너십 체결"
        />
      </div>

      {/* Partner Table */}
      <Card>
        <CardHeader>
          <CardTitle>파트너 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="파트너사명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="sm:max-w-[180px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="expired">만료됨</SelectItem>
                <SelectItem value="revoked">철회됨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파트너사명</TableHead>
                  <TableHead>발급일</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBadges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      조건에 맞는 파트너가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBadges.map((badge) => {
                    const daysLeft = getDaysUntilExpiry(badge.expires_at);
                    const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

                    return (
                      <TableRow
                        key={badge.id}
                        className={isExpiringSoon ? 'bg-yellow-50' : ''}
                      >
                        <TableCell className="font-medium">
                          {badge.si_partner_name}
                        </TableCell>
                        <TableCell>
                          {new Date(badge.issued_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {new Date(badge.expires_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>{getStatusBadge(badge)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {badge.revoke_reason || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
