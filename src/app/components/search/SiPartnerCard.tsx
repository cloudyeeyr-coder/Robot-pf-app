import { Link } from 'react-router';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Star, Award } from 'lucide-react';
import { Progress } from '../ui/progress';
import type { SiPartner } from '../../../lib/mockData';

interface SiPartnerCardProps {
  partner: SiPartner;
}

export function SiPartnerCard({ partner }: SiPartnerCardProps) {
  const tierColors = {
    Diamond: 'bg-blue-600 text-white',
    Gold: 'bg-yellow-500 text-white',
    Silver: 'bg-gray-400 text-white',
  };

  const activeBadges = partner.badges.filter(b => {
    const now = new Date();
    const expiresAt = new Date(b.expires_at);
    return b.is_active && expiresAt > now;
  });

  const visibleTags = partner.capability_tags.slice(0, 5);
  const remainingTags = partner.capability_tags.length - 5;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{partner.company_name}</h3>
              <Badge className={tierColors[partner.tier]}>
                {partner.tier}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{partner.region}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Rate */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">시공 성공률</span>
            <span className="font-semibold text-blue-600">{partner.success_rate}%</span>
          </div>
          <Progress value={partner.success_rate} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            완료 {partner.completed_projects}건 / 전체 {partner.completed_projects + partner.failed_projects}건
          </p>
        </div>

        {/* Capability Tags */}
        <div>
          <p className="text-sm text-gray-600 mb-2">기술 역량</p>
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {remainingTags > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remainingTags} more
              </Badge>
            )}
          </div>
        </div>

        {/* Badges */}
        {activeBadges.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
              <Award className="h-4 w-4" />
              인증 뱃지
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeBadges.map((badge) => (
                <Badge key={badge.id} variant="outline" className="text-xs">
                  {badge.manufacturer_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{partner.average_rating}</span>
            <span className="text-sm text-gray-500">
              ({partner.review_count}개 리뷰)
            </span>
          </div>
          <Link to={`/search/${partner.id}`}>
            <Button size="sm">상세 보기</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
