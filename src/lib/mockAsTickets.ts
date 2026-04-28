// Mock data for AS tickets

export type AsTicketStatus = 'reported' | 'assigned' | 'dispatched' | 'resolved';
export type AsPriority = 'normal' | 'urgent';

export interface AsTicket {
  id: string;
  contract_id: string;
  buyer_company_id: string;
  si_partner_id: string;
  symptom_description: string;
  priority: AsPriority;
  photos?: string[];
  status: AsTicketStatus;
  reported_at: string;
  assigned_at?: string;
  dispatched_at?: string;
  resolved_at?: string;
  engineer_name?: string;
  engineer_contact?: string;
  ticket_number: string;
}

// Mock AS tickets
export const MOCK_AS_TICKETS: AsTicket[] = [
  {
    id: 'AS-2024-041',
    contract_id: 'C2024-001',
    buyer_company_id: 'buyer-001',
    si_partner_id: 'si-0001',
    symptom_description: '로봇 팔이 정해진 위치로 이동하지 않고 계속 에러가 발생합니다.',
    priority: 'urgent',
    status: 'resolved',
    reported_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    assigned_at: new Date(Date.now() - 24.5 * 60 * 60 * 1000).toISOString(),
    dispatched_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    engineer_name: '김기술',
    engineer_contact: '010-1234-5678',
    ticket_number: 'AS-2024-041',
  },
  {
    id: 'AS-2024-042',
    contract_id: 'C2024-002',
    buyer_company_id: 'buyer-001',
    si_partner_id: 'si-0002',
    symptom_description: '그리퍼가 제품을 제대로 잡지 못합니다.',
    priority: 'normal',
    status: 'assigned',
    reported_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    assigned_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    engineer_name: '이수리',
    engineer_contact: '010-2345-6789',
    ticket_number: 'AS-2024-042',
  },
  {
    id: 'AS-2024-043',
    contract_id: 'C2024-003',
    buyer_company_id: 'buyer-002',
    si_partner_id: 'si-0003',
    symptom_description: '센서 오류로 안전 정지가 자주 발생합니다.',
    priority: 'urgent',
    status: 'dispatched',
    reported_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    assigned_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    dispatched_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    engineer_name: '박정비',
    engineer_contact: '010-3456-7890',
    ticket_number: 'AS-2024-043',
  },
  {
    id: 'AS-2024-044',
    contract_id: 'C2024-004',
    buyer_company_id: 'buyer-003',
    si_partner_id: 'si-0001',
    symptom_description: '용접 불량이 발생합니다.',
    priority: 'normal',
    status: 'resolved',
    reported_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    assigned_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    dispatched_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    engineer_name: '최기사',
    engineer_contact: '010-4567-8901',
    ticket_number: 'AS-2024-044',
  },
  {
    id: 'AS-2024-045',
    contract_id: 'C2024-005',
    buyer_company_id: 'buyer-004',
    si_partner_id: 'si-0002',
    symptom_description: '프로그램이 중간에 멈춥니다.',
    priority: 'normal',
    status: 'reported',
    reported_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    ticket_number: 'AS-2024-045',
  },
];

// Simulate AS ticket state progression
let ticketStateSimulation: { [key: string]: number } = {};

export function simulateAsTicketProgress(ticketId: string): AsTicketStatus {
  const ticket = MOCK_AS_TICKETS.find((t) => t.id === ticketId);
  if (!ticket) return 'reported';

  if (!ticketStateSimulation[ticketId]) {
    ticketStateSimulation[ticketId] = 0;
  }

  ticketStateSimulation[ticketId]++;

  const cycles = ticketStateSimulation[ticketId];

  // Simulate progression: reported (0-2) → assigned (3-5) → dispatched (6-8) → resolved (9+)
  if (cycles >= 9 && ticket.status !== 'resolved') {
    ticket.status = 'resolved';
    ticket.resolved_at = new Date().toISOString();
  } else if (cycles >= 6 && ticket.status === 'assigned') {
    ticket.status = 'dispatched';
    ticket.dispatched_at = new Date().toISOString();
  } else if (cycles >= 3 && ticket.status === 'reported') {
    ticket.status = 'assigned';
    ticket.assigned_at = new Date().toISOString();
    ticket.engineer_name = '김기술';
    ticket.engineer_contact = '010-1234-5678';
  }

  return ticket.status;
}

export function getAsTicketById(ticketId: string): AsTicket | undefined {
  return MOCK_AS_TICKETS.find((t) => t.id === ticketId);
}

export function createAsTicket(data: {
  contract_id: string;
  buyer_company_id: string;
  si_partner_id: string;
  symptom_description: string;
  priority: AsPriority;
  photos?: string[];
}): AsTicket {
  const ticketNumber = `AS-2026-${String(MOCK_AS_TICKETS.length + 1).padStart(3, '0')}`;
  const newTicket: AsTicket = {
    id: `AS-2026-${String(MOCK_AS_TICKETS.length + 1).padStart(3, '0')}`,
    ...data,
    status: 'reported',
    reported_at: new Date().toISOString(),
    ticket_number: ticketNumber,
  };

  MOCK_AS_TICKETS.push(newTicket);
  return newTicket;
}

// Calculate SLA compliance
export function checkSlaCompliance(ticket: AsTicket): boolean {
  if (!ticket.resolved_at) return false;

  const reportedTime = new Date(ticket.reported_at).getTime();
  const resolvedTime = new Date(ticket.resolved_at).getTime();
  const elapsedHours = (resolvedTime - reportedTime) / (1000 * 60 * 60);

  return elapsedHours <= 24;
}

// Calculate elapsed time from target
export function getElapsedTime(startTime: string, targetHours: number): {
  elapsed: number;
  target: number;
  isOverdue: boolean;
} {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsedHours = Math.floor((now - start) / (1000 * 60 * 60));

  return {
    elapsed: elapsedHours,
    target: targetHours,
    isOverdue: elapsedHours > targetHours,
  };
}
