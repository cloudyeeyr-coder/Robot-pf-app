// useCalculatorData.ts
/**
 * @file useCalculatorData.ts
 * @description CalculatorPage에서 사용되는 폼 상태 관리, 데이터 페칭, 계산 로직을 분리한 커스텀 훅입니다.
 * UI와 비즈니스 로직을 분리하여 유지보수성을 높이고, react-hook-form을 통한 효율적인 폼 관리를 지원합니다.
 * 
 * @sequence 함수 호출 구조 및 순서:
 * 1. 훅 초기화 시 react-hook-form(useForm) 인스턴스 생성 및 기본값 설정
 * 2. watch()를 통해 수량(quantity), 기간(term_months) 입력값 실시간 감시
 * 3. 사용자 검색어 입력 시 -> filteredModels (useMemo) 업데이트
 * 4. 사용자가 모델 선택 시 -> handleSelectModel() -> 상태 업데이트 및 폼 값 검증
 * 5. '비교 계산' 제출 시 -> onSubmit() -> calculateRaasComparison() 실행 -> results(TCO 데이터) 도출
 * 6. 견적 요청 클릭 시 -> handleQuoteRequestClick() -> 선택된 플랜 지정 및 모달 열기
 */
import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { raasCalcInputSchema, type RaasCalcInput } from '../lib/schemas/raas';
import {
  searchRobotModels,
  calculateRaasComparison,
  type RobotModel,
  type RaasCalculationResult,
} from '../lib/mockRobotModels';

/**
 * @hook useCalculatorData
 * @description 로봇 모델 검색, 선택된 모델의 RaaS TCO(총 소유 비용) 계산, 그리고 견적 요청 폼의 상태를 종합적으로 관리합니다.
 * 
 * @returns {Object} 폼 객체(register, errors), 상태 변수(results, open, selectedModel), 이벤트 핸들러(onSubmit, handleSelectModel 등)
 */
export function useCalculatorData() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<RobotModel | null>(null);
  const [results, setResults] = useState<RaasCalculationResult | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'capex' | 'lease' | 'raas'>('raas');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RaasCalcInput>({
    resolver: zodResolver(raasCalcInputSchema),
    mode: 'onChange',
    defaultValues: {
      robot_model: '',
      quantity: 1,
      term_months: '36',
    },
  });

  const quantity = watch('quantity');
  const termMonths = watch('term_months');

  // useMemo to prevent unnecessary filtering on every render if searchQuery hasn't changed
  const filteredModels = useMemo(() => searchRobotModels(searchQuery), [searchQuery]);

  const handleSelectModel = useCallback((model: RobotModel) => {
    setSelectedModel(model);
    setValue('robot_model', model.code, { shouldValidate: true });
    setOpen(false);
  }, [setValue]);

  const onSubmit = useCallback((data: RaasCalcInput) => {
    if (!selectedModel) return;

    const calculation = calculateRaasComparison(
      selectedModel.base_price,
      data.quantity,
      parseInt(data.term_months)
    );

    setResults(calculation);
  }, [selectedModel]);

  const handleQuoteRequestClick = useCallback((plan: 'capex' | 'lease' | 'raas') => {
    setSelectedPlan(plan);
    setQuoteModalOpen(true);
  }, []);

  return {
    // State
    open,
    setOpen,
    searchQuery,
    setSearchQuery,
    selectedModel,
    results,
    quoteModalOpen,
    setQuoteModalOpen,
    selectedPlan,
    
    // Form data
    quantity,
    termMonths,
    register,
    handleSubmit,
    errors,
    setValue,
    
    // Computed/Handlers
    filteredModels,
    handleSelectModel,
    onSubmit,
    handleQuoteRequestClick
  };
}
