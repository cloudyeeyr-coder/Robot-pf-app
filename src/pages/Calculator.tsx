// Calculator.tsx
/**
 * @file Calculator.tsx
 * @description 로봇 도입 방식(일시불, 리스, RaaS)에 따른 총 소유 비용(TCO) 및 누적 비용(ROI)을 비교하는 계산기 페이지입니다.
 * 비즈니스 로직은 useCalculatorData 훅으로 분리되어 있으며, 이 컴포넌트는 UI 렌더링에 집중합니다.
 */
import { useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../app/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../app/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../app/components/ui/popover';
import { QuoteRequestModal } from '../app/components/calculator/QuoteRequestModal';
import { PricingPlanCard } from '../app/components/calculator/PricingPlanCard';
import { CalculatorCharts } from '../app/components/calculator/CalculatorCharts';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCalculatorData } from '../hooks/useCalculatorData';

/**
 * @component CalculatorPage
 * @description 계산기 입력 폼(조건), 결과 비교 카드(PricingPlanCard), 그리고 차트(CalculatorCharts)를 조합하여 렌더링하는 메인 페이지 컴포넌트입니다.
 */
export function CalculatorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    open, setOpen,
    searchQuery, setSearchQuery,
    selectedModel,
    results,
    quoteModalOpen, setQuoteModalOpen,
    selectedPlan,
    quantity, termMonths,
    register, handleSubmit, errors, setValue,
    filteredModels,
    handleSelectModel,
    onSubmit,
    handleQuoteRequestClick
  } = useCalculatorData();

  const handleQuoteRequest = (plan: 'capex' | 'lease' | 'raas') => {
    if (!user) {
      navigate('/login');
      return;
    }
    handleQuoteRequestClick(plan);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">RaaS 비용 계산기</h1>
          <p className="text-gray-600">
            로봇 도입 방식(일시불/리스/RaaS)별 비용을 비교해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>계산 조건 입력</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Robot Model Combobox */}
                  <div className="space-y-2">
                    <Label htmlFor="robot_model">
                      로봇 모델 <span className="text-red-600">*</span>
                    </Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          id="robot_model"
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                          aria-invalid={!!errors.robot_model}
                        >
                          {selectedModel ? selectedModel.name : '모델 선택...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="모델 코드나 이름으로 검색..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>모델을 찾을 수 없습니다.</CommandEmpty>
                            <CommandGroup>
                              {filteredModels.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.code}
                                  onSelect={() => handleSelectModel(model)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedModel?.id === model.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  />
                                  <div>
                                    <div className="font-semibold">{model.code}</div>
                                    <div className="text-sm text-gray-600">{model.name}</div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.robot_model && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.robot_model.message}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      수량 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      {...register('quantity', { valueAsNumber: true })}
                      aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                      aria-invalid={!!errors.quantity}
                    />
                    {errors.quantity && (
                      <p id="quantity-error" className="text-sm text-red-600" role="alert">
                        {errors.quantity.message}
                      </p>
                    )}
                  </div>

                  {/* Term */}
                  <div className="space-y-2">
                    <Label htmlFor="term_months">
                      계약 기간 <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      value={termMonths}
                      onValueChange={(value) => setValue('term_months', value as any)}
                    >
                      <SelectTrigger id="term_months">
                        <SelectValue placeholder="기간 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12개월</SelectItem>
                        <SelectItem value="24">24개월</SelectItem>
                        <SelectItem value="36">36개월</SelectItem>
                        <SelectItem value="48">48개월</SelectItem>
                        <SelectItem value="60">60개월</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.term_months && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.term_months.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedModel}
                  >
                    비교 계산
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {!results ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <p className="text-gray-500">
                    왼쪽 폼에서 조건을 입력하고 '비교 계산'을 눌러주세요
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PricingPlanCard
                    title="일시불 (CAPEX)"
                    isRecommended={results.cheapest_option === 'capex'}
                    primaryLabel="총 구매 비용"
                    primaryValue={results.capex.total_cost}
                    secondaryLabel="월 감가상각비"
                    secondaryValue={results.capex.monthly_depreciation}
                    onQuoteRequest={() => handleQuoteRequest('capex')}
                    planId="capex"
                  />
                  
                  <PricingPlanCard
                    title="리스"
                    isRecommended={results.cheapest_option === 'lease'}
                    primaryLabel="월 리스료"
                    primaryValue={results.lease.monthly_payment}
                    secondaryLabel="총 리스 비용"
                    secondaryValue={results.lease.total_cost}
                    tertiaryLabel="잔존가치"
                    tertiaryValue={results.lease.residual_value}
                    onQuoteRequest={() => handleQuoteRequest('lease')}
                    planId="lease"
                  />
                  
                  <PricingPlanCard
                    title="RaaS (OPEX)"
                    isRecommended={results.cheapest_option === 'raas'}
                    primaryLabel="월 구독료"
                    primaryValue={results.raas.monthly_subscription}
                    secondaryLabel="총 구독 비용"
                    secondaryValue={results.raas.total_cost}
                    tertiaryLabel="포함 서비스"
                    tertiaryValue={
                      <ul className="text-xs space-y-0.5 mt-1">
                        {results.raas.included_services.slice(0, 3).map((service, i) => (
                          <li key={i}>• {service}</li>
                        ))}
                        {results.raas.included_services.length > 3 && (
                          <li>+{results.raas.included_services.length - 3}개 더보기</li>
                        )}
                      </ul>
                    }
                    onQuoteRequest={() => handleQuoteRequest('raas')}
                    planId="raas"
                  />
                </div>

                {/* Charts */}
                <CalculatorCharts results={results} termMonths={termMonths} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quote Request Modal */}
      {selectedModel && (
        <QuoteRequestModal
          open={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          selectedPlan={selectedPlan}
          robotModel={selectedModel.code}
          quantity={quantity}
          termMonths={termMonths}
        />
      )}
    </div>
  );
}
