// Mock robot models for RaaS calculator

export interface RobotModel {
  id: string;
  code: string;
  name: string;
  brand: string;
  base_price: number; // CAPEX price
  category: string;
}

export const MOCK_ROBOT_MODELS: RobotModel[] = [
  {
    id: 'model-001',
    code: 'UR5e',
    name: 'Universal Robots UR5e',
    brand: 'UR',
    base_price: 45000000,
    category: '협동로봇',
  },
  {
    id: 'model-002',
    code: 'UR10e',
    name: 'Universal Robots UR10e',
    brand: 'UR',
    base_price: 65000000,
    category: '협동로봇',
  },
  {
    id: 'model-003',
    code: 'M0617',
    name: '두산로보틱스 M0617',
    brand: '두산',
    base_price: 38000000,
    category: '협동로봇',
  },
  {
    id: 'model-004',
    code: 'M1013',
    name: '두산로보틱스 M1013',
    brand: '두산',
    base_price: 52000000,
    category: '협동로봇',
  },
  {
    id: 'model-005',
    code: 'RB-Y1',
    name: '레인보우로보틱스 RB-Y1',
    brand: '레인보우',
    base_price: 42000000,
    category: '협동로봇',
  },
  {
    id: 'model-006',
    code: 'IRB 1200',
    name: 'ABB IRB 1200',
    brand: 'ABB',
    base_price: 55000000,
    category: '산업용로봇',
  },
  {
    id: 'model-007',
    code: 'KR AGILUS',
    name: 'KUKA KR AGILUS',
    brand: 'KUKA',
    base_price: 62000000,
    category: '산업용로봇',
  },
  {
    id: 'model-008',
    code: 'M-10iD',
    name: 'FANUC M-10iD',
    brand: 'FANUC',
    base_price: 58000000,
    category: '산업용로봇',
  },
];

export function searchRobotModels(query: string): RobotModel[] {
  if (!query) return MOCK_ROBOT_MODELS;

  const lowerQuery = query.toLowerCase();
  return MOCK_ROBOT_MODELS.filter(
    (model) =>
      model.code.toLowerCase().includes(lowerQuery) ||
      model.name.toLowerCase().includes(lowerQuery) ||
      model.brand.toLowerCase().includes(lowerQuery)
  );
}

export function getRobotModelById(id: string): RobotModel | undefined {
  return MOCK_ROBOT_MODELS.find((m) => m.id === id);
}

export function getRobotModelByCode(code: string): RobotModel | undefined {
  return MOCK_ROBOT_MODELS.find((m) => m.code === code);
}

// Calculate RaaS comparison results
export interface RaasCalculationResult {
  capex: {
    total_cost: number;
    monthly_depreciation: number;
  };
  lease: {
    monthly_payment: number;
    total_cost: number;
    residual_value: number;
  };
  raas: {
    monthly_subscription: number;
    total_cost: number;
    included_services: string[];
  };
  cheapest_option: 'capex' | 'lease' | 'raas';
}

export function calculateRaasComparison(
  basePrice: number,
  quantity: number,
  termMonths: number
): RaasCalculationResult {
  // CAPEX calculation
  const capex_total = basePrice * quantity;
  const capex_monthly_depreciation = capex_total / 60; // 5-year depreciation

  // Lease calculation (interest rate ~5% annual)
  const lease_monthly_rate = 0.05 / 12;
  const lease_monthly = (basePrice * quantity * lease_monthly_rate * Math.pow(1 + lease_monthly_rate, termMonths)) / (Math.pow(1 + lease_monthly_rate, termMonths) - 1);
  const lease_total = lease_monthly * termMonths;
  const lease_residual = basePrice * quantity * 0.1; // 10% residual

  // RaaS calculation (monthly subscription model)
  // RaaS typically 1.8-2.2% of CAPEX per month including maintenance
  const raas_monthly = (basePrice * quantity * 0.02);
  const raas_total = raas_monthly * termMonths;

  // Determine cheapest option
  const costs = {
    capex: capex_total,
    lease: lease_total - lease_residual,
    raas: raas_total,
  };

  const cheapest_option = Object.entries(costs).reduce((min, [key, value]) =>
    value < costs[min as keyof typeof costs] ? key : min
  , 'capex') as 'capex' | 'lease' | 'raas';

  return {
    capex: {
      total_cost: capex_total,
      monthly_depreciation: capex_monthly_depreciation,
    },
    lease: {
      monthly_payment: lease_monthly,
      total_cost: lease_total,
      residual_value: lease_residual,
    },
    raas: {
      monthly_subscription: raas_monthly,
      total_cost: raas_total,
      included_services: [
        '로봇 하드웨어 제공',
        '정기 점검 및 유지보수',
        '소프트웨어 업데이트',
        '24시간 기술 지원',
        '부품 교체 (소모품 포함)',
      ],
    },
    cheapest_option,
  };
}
