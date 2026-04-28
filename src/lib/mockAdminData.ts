// Mock data for admin dashboard
import { MOCK_CONTRACTS, MOCK_ESCROW_TX } from './mockContracts';
import { MOCK_AS_TICKETS, checkSlaCompliance } from './mockAsTickets';

export interface EventLog {
  id: string;
  type: 'signup_complete' | 'escrow_deposit_confirmed' | 'badge_issued' | 'contract_created' | 'as_ticket_created' | 'proposal_sent';
  user_id: string;
  user_name: string;
  payload_summary: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_id: string;
  before?: string;
  after?: string;
  created_at: string;
}

// Mock event logs
export const MOCK_EVENT_LOGS: EventLog[] = [
  {
    id: 'event-001',
    type: 'signup_complete',
    user_id: 'user-001',
    user_name: '서울 테크',
    payload_summary: '수요기업 회원가입 완료',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-002',
    type: 'contract_created',
    user_id: 'user-002',
    user_name: '경기 자동화',
    payload_summary: '계약 생성: 50,000,000원',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-003',
    type: 'escrow_deposit_confirmed',
    user_id: 'admin-001',
    user_name: '운영팀',
    payload_summary: '에스크로 입금 확인: contract-002',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-004',
    type: 'badge_issued',
    user_id: 'mfr-ur',
    user_name: 'Universal Robots',
    payload_summary: '인증 뱃지 발급: 서울 로보틱스',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-005',
    type: 'as_ticket_created',
    user_id: 'user-003',
    user_name: '인천 시스템',
    payload_summary: 'AS 티켓 생성: TICKET-001',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-006',
    type: 'proposal_sent',
    user_id: 'mfr-doosan',
    user_name: '두산로보틱스',
    payload_summary: '파트너십 제안: 대구 솔루션',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'event-007',
    type: 'signup_complete',
    user_id: 'user-004',
    user_name: '부산 제조',
    payload_summary: '수요기업 회원가입 완료',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock audit logs
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    admin_id: 'admin-001',
    admin_name: '김운영',
    action: 'escrow_deposit_confirmed',
    target_id: 'contract-002',
    before: 'state: pending',
    after: 'state: held',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'audit-002',
    admin_id: 'admin-001',
    admin_name: '김운영',
    action: 'escrow_released',
    target_id: 'contract-001',
    before: 'state: held',
    after: 'state: released',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper functions for admin dashboard KPIs
export function getEscrowReleasesPending(): number {
  return MOCK_CONTRACTS.filter(
    (c: any) =>
      c.status === 'release_pending' &&
      MOCK_ESCROW_TX[c.id]?.state === 'held'
  ).length;
}

export function getDisputesInProgress(): number {
  return MOCK_CONTRACTS.filter((c: any) => c.status === 'disputed').length;
}

export function getUnassignedAsTickets(): number {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

  return MOCK_AS_TICKETS.filter(
    (ticket: any) =>
      !ticket.assigned_at &&
      new Date(ticket.reported_at).getTime() < twentyFourHoursAgo
  ).length;
}

export function getSignupsThisMonth(): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return MOCK_EVENT_LOGS.filter(
    (log) =>
      log.type === 'signup_complete' &&
      new Date(log.created_at) >= monthStart
  ).length;
}

export function getEventLogsByType(type?: EventLog['type']): EventLog[] {
  if (!type) return MOCK_EVENT_LOGS;
  return MOCK_EVENT_LOGS.filter((log) => log.type === type);
}

export function getEventLogsByDateRange(startDate: Date, endDate: Date): EventLog[] {
  return MOCK_EVENT_LOGS.filter((log) => {
    const logDate = new Date(log.created_at);
    return logDate >= startDate && logDate <= endDate;
  });
}

// Calculate AS SLA metrics
export function getAsSlaMetrics() {
  const completedTickets = MOCK_AS_TICKETS.filter((t: any) => t.status === 'resolved');
  const slaCompliant = completedTickets.filter((t: any) => checkSlaCompliance(t));
  const successRate = completedTickets.length > 0
    ? Math.round((slaCompliant.length / completedTickets.length) * 100)
    : 0;

  const unassignedCount = getUnassignedAsTickets();

  // Calculate average resolution time (in hours)
  const avgResolutionTime = completedTickets.length > 0
    ? completedTickets.reduce((sum: number, ticket: any) => {
        const elapsed = new Date(ticket.resolved_at).getTime() - new Date(ticket.reported_at).getTime();
        return sum + elapsed / (1000 * 60 * 60); // Convert to hours
      }, 0) / completedTickets.length
    : 0;

  return {
    successRate,
    unassignedCount,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
  };
}

// Mock function to confirm escrow deposit
export function confirmEscrowDeposit(contractId: string, adminMemo: string): boolean {
  const escrow = MOCK_ESCROW_TX[contractId];

  if (!escrow || escrow.state !== 'pending') return false;

  escrow.state = 'held';
  escrow.held_at = new Date().toISOString();
  escrow.admin_verified_at = new Date().toISOString();

  // TODO: Create audit log
  // TODO: Notify buyer

  return true;
}

// Mock function to release escrow
export function releaseEscrow(contractId: string, adminMemo: string): boolean {
  const escrow = MOCK_ESCROW_TX[contractId];
  const contract = MOCK_CONTRACTS.find((c: any) => c.id === contractId);

  if (!escrow || escrow.state !== 'held' || !contract || contract.status !== 'release_pending') {
    return false;
  }

  escrow.state = 'released';
  escrow.released_at = new Date().toISOString();
  contract.status = 'completed';

  // TODO: Create audit log
  // TODO: Notify SI partner

  return true;
}
