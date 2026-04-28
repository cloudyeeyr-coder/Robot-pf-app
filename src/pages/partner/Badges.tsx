import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { KpiCard } from '../../app/components/dashboard/KpiCard';
import { Badge } from '../../app/components/ui/badge';
import { Award, AlertCircle } from 'lucide-react';
import {
  getBadgesBySiPartnerId,
  getDaysUntilExpiry,
  type Badge as BadgeType,
} from '../../lib/mockBadges';
import { useAuth } from '../../contexts/AuthContext';

export function PartnerBadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeType[]>([]);

  const siPartnerId = 'si-0001'; // Mock SI partner ID

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = () => {
    const allBadges = getBadgesBySiPartnerId(siPartnerId);
    setBadges(allBadges);
  };

  const activeBadges = badges.filter(b => b.is_active && new Date(b.expires_at) > new Date());
  const expiredBadges = badges.filter(b => !b.is_active && !b.revoked_at);
  const revokedBadges = badges.filter(b => !!b.revoked_at);

  const getStatusBadge = (badge: BadgeType) => {
    if (badge.revoked_at) {
      return <Badge variant="destructive">철회됨</Badge>;
    }
    if (!badge.is_active || new Date(badge.expires_at) < new Date()) {
      return <Badge variant="secondary">만료됨</Badge>;
    }

    const daysLeft = getDaysUntilExpiry(badge.expires_at);
    if (daysLeft <= 7) {
      return <Badge variant="destructive">D-{daysLeft}</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge className="bg-yellow-500">D-{daysLeft}</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  const BadgeCard = ({ badge }: { badge: BadgeType }) => {
    const daysLeft = getDaysUntilExpiry(badge.expires_at);
    const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;
    const isActive = badge.is_active && new Date(badge.expires_at) > new Date();

    return (
      <Card className={isExpiringSoon ? 'border-yellow-500' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${
                  isActive
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Award className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{badge.manufacturer_name}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  인증 파트너 뱃지
                </p>
              </div>
            </div>
            {getStatusBadge(badge)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">발급일</p>
              <p className="font-medium">
                {new Date(badge.issued_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">만료일</p>
              <p className="font-medium">
                {new Date(badge.expires_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-900">
                <p className="font-semibold">만료 임박</p>
                <p>뱃지가 곧 만료됩니다. 제조사에 문의하여 갱신하세요.</p>
              </div>
            </div>
          )}

          {badge.revoked_at && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-900 font-semibold mb-1">철회됨</p>
              <p className="text-xs text-red-800">
                철회일: {new Date(badge.revoked_at).toLocaleDateString('ko-KR')}
              </p>
              {badge.revoke_reason && (
                <p className="text-xs text-red-800 mt-1">
                  사유: {badge.revoke_reason}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">인증 뱃지</h1>
        <p className="text-gray-600">제조사로부터 받은 파트너 인증 뱃지</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="활성 뱃지"
          value={activeBadges.length}
          icon={Award}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <KpiCard
          title="만료된 뱃지"
          value={expiredBadges.length}
          icon={Award}
          color="text-gray-400"
          bgColor="bg-gray-100"
        />
        <KpiCard
          title="철회된 뱃지"
          value={revokedBadges.length}
          icon={AlertCircle}
          color="text-red-600"
          bgColor="bg-red-100"
        />
      </div>

      {/* Active Badges */}
      {activeBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">활성 뱃지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Expired Badges */}
      {expiredBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">만료된 뱃지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expiredBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Revoked Badges */}
      {revokedBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">철회된 뱃지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {revokedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {badges.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 뱃지가 없습니다</h3>
            <p className="text-gray-600 mb-4">
              제조사로부터 파트너십 제안을 받으면 뱃지가 발급됩니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
