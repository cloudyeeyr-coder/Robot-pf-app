// PricingPlanCard.tsx
/**
 * @file PricingPlanCard.tsx
 * @description RaaS 비용 계산기에서 일시불(CAPEX), 리스, RaaS(OPEX)의 각 요금제 비교 옵션을 보여주기 위한 전용 카드 컴포넌트입니다.
 * 추천 플랜에 대한 시각적 하이라이트 기능과 동적인 상호작용 효과를 제공합니다.
 */
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { memo } from 'react';
import { cn } from '../../../lib/utils';

interface PricingPlanCardProps {
  title: string;
  isRecommended: boolean;
  primaryLabel: string;
  primaryValue: number;
  secondaryLabel: string;
  secondaryValue: number | string;
  tertiaryLabel?: string;
  tertiaryValue?: number | string | React.ReactNode;
  onQuoteRequest: () => void;
  planId: 'capex' | 'lease' | 'raas';
}

/**
 * @component PricingPlanCard
 * @description 각 요금제(일시불, 리스, RaaS)의 주요 비용 및 부가 정보를 시각적으로 렌더링합니다.
 * React.memo를 적용하여 불필요한 리렌더링을 방지합니다.
 * 
 * @param {PricingPlanCardProps} props - 타이틀, 추천 여부, 라벨, 값 및 견적 요청 핸들러
 */
export const PricingPlanCard = memo(function PricingPlanCard({
  title,
  isRecommended,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  tertiaryLabel,
  tertiaryValue,
  onQuoteRequest,
  planId,
}: PricingPlanCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 ease-out group flex flex-col h-full",
      isRecommended ? "border-2 border-green-500 shadow-md scale-[1.01]" : "border border-gray-100 hover:shadow-xl hover:-translate-y-1"
    )}>
      {/* Subtle hover gradient */}
      {!isRecommended && <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
      {isRecommended && <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent opacity-100" />}

      <div className="relative z-10 flex flex-col flex-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold tracking-tight text-gray-900">{title}</CardTitle>
            {isRecommended && (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm px-3 py-1 text-xs tracking-wider uppercase font-bold">
                추천
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{primaryLabel}</p>
            <p className="text-4xl font-extrabold text-gray-900 tracking-tighter">
              {primaryValue.toLocaleString('ko-KR')}<span className="text-xl font-bold text-gray-500 tracking-normal ml-1">원</span>
            </p>
          </div>
          
          <div className="space-y-4 pt-5 border-t border-gray-100/80">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{secondaryLabel}</p>
              <p className="text-base font-bold text-gray-800">
                {typeof secondaryValue === 'number'
                  ? `${secondaryValue.toLocaleString('ko-KR')}원`
                  : secondaryValue}
              </p>
            </div>
            
            {tertiaryLabel && tertiaryValue && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{tertiaryLabel}</p>
                {typeof tertiaryValue === 'number' ? (
                  <p className="text-base font-bold text-gray-800">
                    {tertiaryValue.toLocaleString('ko-KR')}원
                  </p>
                ) : (
                  <div className="text-sm font-medium text-gray-700 leading-relaxed">{tertiaryValue}</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto pt-6">
            <Button
              variant={isRecommended ? "default" : "outline"}
              className={cn(
                "w-full h-12 text-sm font-bold tracking-wide rounded-xl shadow-sm transition-all duration-300",
                isRecommended ? "bg-green-600 hover:bg-green-700 text-white hover:shadow-md" : "hover:bg-blue-50"
              )}
              onClick={onQuoteRequest}
            >
              이 플랜으로 견적 요청
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
});
