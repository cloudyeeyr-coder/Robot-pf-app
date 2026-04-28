import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';
import { X } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    regions: string[];
    brands: string[];
    tags: string[];
    has_badge: boolean;
    tiers: string[];
  };
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전'];
const BRANDS = ['UR', '두산로보틱스', '레인보우로보틱스', 'ABB', 'KUKA', 'FANUC'];
const TAGS = ['용접', '조립', '도장', '검사', '팔레타이징', '픽앤플레이스', 'CNC 로딩', 'AGV', '협동로봇', '비전검사'];
const TIERS = ['Diamond', 'Gold', 'Silver'];

export function FilterPanel({ filters, onFilterChange, onReset, isMobile, onClose }: FilterPanelProps) {
  const toggleArrayFilter = (key: string, value: string) => {
    const current = filters[key as keyof typeof filters] as string[];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: newValue });
  };

  return (
    <Card className={`p-4 ${isMobile ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      {isMobile && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <h2 className="font-semibold text-lg">필터</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Region Filter */}
        <div>
          <Label className="text-sm font-semibold mb-3 block">지역</Label>
          <div className="space-y-2">
            {REGIONS.map((region) => (
              <div key={region} className="flex items-center space-x-2">
                <Checkbox
                  id={`region-${region}`}
                  checked={filters.regions.includes(region)}
                  onCheckedChange={() => toggleArrayFilter('regions', region)}
                />
                <label
                  htmlFor={`region-${region}`}
                  className="text-sm cursor-pointer"
                >
                  {region}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Filter */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-semibold mb-3 block">제조사 브랜드</Label>
          <div className="space-y-2">
            {BRANDS.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => toggleArrayFilter('brands', brand)}
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="text-sm cursor-pointer"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Capability Tags Filter */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-semibold mb-3 block">기술 역량</Label>
          <div className="space-y-2">
            {TAGS.map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={filters.tags.includes(tag)}
                  onCheckedChange={() => toggleArrayFilter('tags', tag)}
                />
                <label
                  htmlFor={`tag-${tag}`}
                  className="text-sm cursor-pointer"
                >
                  {tag}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Filter */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-semibold mb-3 block">등급</Label>
          <div className="space-y-2">
            {TIERS.map((tier) => (
              <div key={tier} className="flex items-center space-x-2">
                <Checkbox
                  id={`tier-${tier}`}
                  checked={filters.tiers.includes(tier)}
                  onCheckedChange={() => toggleArrayFilter('tiers', tier)}
                />
                <label
                  htmlFor={`tier-${tier}`}
                  className="text-sm cursor-pointer"
                >
                  {tier}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Badge Filter */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="has-badge" className="text-sm font-semibold">
              인증 파트너만 보기
            </Label>
            <Switch
              id="has-badge"
              checked={filters.has_badge}
              onCheckedChange={(checked) =>
                onFilterChange({ ...filters, has_badge: checked })
              }
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            활성 인증 뱃지를 보유한 파트너만 표시
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t space-y-2">
          <Button variant="outline" className="w-full" onClick={onReset}>
            필터 초기화
          </Button>
          {isMobile && (
            <Button className="w-full" onClick={onClose}>
              적용하기
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
