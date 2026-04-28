// Mock data for contracts and escrow

export type ContractStatus =
  | 'pending'
  | 'escrow_held'
  | 'inspecting'
  | 'release_pending'
  | 'completed'
  | 'disputed'
  | 'refunded';

export type EscrowState = 'pending' | 'held' | 'released' | 'refunded';

export interface Contract {
  id: string;
  buyer_company_id: string;
  buyer_company_name: string;
  si_partner_id: string;
  si_partner_name: string;
  amount: number;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  construction_completed_at?: string;
  inspection_deadline?: string;
}

export interface EscrowTransaction {
  id: string;
  contract_id: string;
  state: EscrowState;
  amount: number;
  held_at?: string;
  admin_verified_at?: string;
  released_at?: string;
  refunded_at?: string;
}

export interface Warranty {
  id: string;
  contract_id: string;
  as_company: string;
  as_contact: string;
  as_email: string;
  coverage_scope: string;
  period_months: number;
  issued_at: string;
  pdf_url?: string;
}

// Mock contracts
export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'contract-001',
    buyer_company_id: 'company-buyer',
    buyer_company_name: '서울 테크',
    si_partner_id: 'si-0001',
    si_partner_name: '서울 로보틱스 1',
    amount: 50000000,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'contract-002',
    buyer_company_id: 'company-buyer',
    buyer_company_name: '서울 테크',
    si_partner_id: 'si-0002',
    si_partner_name: '경기 자동화 2',
    amount: 75000000,
    status: 'escrow_held',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'contract-004',
    buyer_company_id: 'company-buyer',
    buyer_company_name: '서울 테크',
    si_partner_id: 'si-0004',
    si_partner_name: '부산 엔지니어링 4',
    amount: 45000000,
    status: 'inspecting',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    construction_completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    inspection_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'contract-003',
    buyer_company_id: 'company-buyer',
    buyer_company_name: '서울 테크',
    si_partner_id: 'si-0003',
    si_partner_name: '인천 시스템 3',
    amount: 30000000,
    status: 'disputed',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock escrow transactions
export const MOCK_ESCROW_TX: { [key: string]: EscrowTransaction } = {
  'contract-001': {
    id: 'escrow-001',
    contract_id: 'contract-001',
    state: 'pending',
    amount: 50000000,
  },
  'contract-002': {
    id: 'escrow-002',
    contract_id: 'contract-002',
    state: 'held',
    amount: 75000000,
    held_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    admin_verified_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'contract-003': {
    id: 'escrow-003',
    contract_id: 'contract-003',
    state: 'held',
    amount: 30000000,
    held_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    admin_verified_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

// Mock warranties
export const MOCK_WARRANTIES: { [key: string]: Warranty } = {
  'contract-002': {
    id: 'warranty-002',
    contract_id: 'contract-002',
    as_company: '24시 로봇 케어',
    as_contact: '1588-9999',
    as_email: 'support@robotcare.com',
    coverage_scope: '로봇 시스템 전체 (하드웨어, 소프트웨어, 부품 교체 포함)',
    period_months: 12,
    issued_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pdf_url: '/mock/warranty-002.pdf',
  },
};

// Helper functions
export function getContractById(contractId: string): Contract | undefined {
  return MOCK_CONTRACTS.find(c => c.id === contractId);
}

export function getEscrowByContractId(contractId: string): EscrowTransaction | undefined {
  return MOCK_ESCROW_TX[contractId];
}

export function getWarrantyByContractId(contractId: string): Warranty | undefined {
  return MOCK_WARRANTIES[contractId];
}

// Simulate escrow state transition (for polling simulation)
let escrowStateSimulation: { [key: string]: number } = {};

export function simulateEscrowStateChange(contractId: string): EscrowState {
  if (!escrowStateSimulation[contractId]) {
    escrowStateSimulation[contractId] = 0;
  }

  const escrow = MOCK_ESCROW_TX[contractId];
  if (!escrow) return 'pending';

  // Simulate transition after 3 polling cycles (90 seconds)
  escrowStateSimulation[contractId]++;

  if (escrow.state === 'pending' && escrowStateSimulation[contractId] >= 3) {
    escrow.state = 'held';
    escrow.held_at = new Date().toISOString();
    escrow.admin_verified_at = new Date().toISOString();
  }

  return escrow.state;
}

// Bank account info (server-side only in production)
export const BANK_ACCOUNT_INFO = {
  bank_name: '신한은행',
  account_number: '110-123-456789',
  account_holder: '로봇SI매칭플랫폼(주)',
};
