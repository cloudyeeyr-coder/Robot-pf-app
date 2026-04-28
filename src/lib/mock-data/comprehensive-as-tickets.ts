// MOCK-005: Comprehensive AS Tickets (10 records)

import type { AsTicket, AsTicketStatus, AsPriority } from '../mockAsTickets';

export const COMPREHENSIVE_AS_TICKETS: AsTicket[] = [
  // Just Reported (3 tickets)
  {
    id: 'AS-2026-001',
    contract_id: 'C2026-001',
    buyer_company_id: 'buyer-001',
    si_partner_id: 'si-0001',
    symptom_description: '로봇 암 Z축 이동 중 정지, 에러 코드 E-421 발생. 리셋 후에도 동일 증상 반복됩니다.',
    priority: 'urgent',
    status: 'reported',
    reported_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
    ticket_number: 'AS-2026-001',
  },
  {
    id: 'AS-2026-002',
    contract_id: 'C2026-002',
    buyer_company_id: 'buyer-002',
    si_partner_id: 'si-0004',
    symptom_description: '용접 정밀도 저하, 용접선 틀어짐 1.5mm 초과. 생산 품질 기준 미달입니다.',
    priority: 'normal',
    status: 'reported',
    reported_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
    ticket_number: 'AS-2026-002',
  },
  {
    id: 'AS-2026-003',
    contract_id: 'C2026-003',
    buyer_company_id: 'buyer-003',
    si_partner_id: 'si-0007',
    symptom_description: '비전 카메라 인식률 급락, 80% → 50%로 하락. 조명 조정했으나 개선 없음.',
    priority: 'urgent',
    status: 'reported',
    reported_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1시간 전
    ticket_number: 'AS-2026-003',
  },

  // Assigned (3 tickets - showing elapsed time vs 4h target)
  {
    id: 'AS-2026-004',
    contract_id: 'C2026-004',
    buyer_company_id: 'buyer-004',
    si_partner_id: 'si-0002',
    symptom_description: '그리퍼 작동 오류, 제품 낙하 발생. 공압 압력은 정상 범위입니다.',
    priority: 'urgent',
    status: 'assigned',
    reported_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7시간 전
    assigned_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6시간 전 (배정까지 1시간 소요)
    engineer_name: '김기술',
    engineer_contact: '010-1234-5678',
    ticket_number: 'AS-2026-004',
  },
  {
    id: 'AS-2026-005',
    contract_id: 'C2026-005',
    buyer_company_id: 'buyer-005',
    si_partner_id: 'si-0003',
    symptom_description: '센서 오류로 안전 정지 자주 발생. 라이트 커튼 오작동 의심됩니다.',
    priority: 'urgent',
    status: 'assigned',
    reported_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4시간 전
    assigned_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3시간 전
    engineer_name: '이수리',
    engineer_contact: '010-2345-6789',
    ticket_number: 'AS-2026-005',
  },
  {
    id: 'AS-2026-006',
    contract_id: 'C2026-006',
    buyer_company_id: 'buyer-006',
    si_partner_id: 'si-0005',
    symptom_description: 'PLC 통신 단절 간헐적 발생, 3시간마다 재부팅 필요합니다.',
    priority: 'normal',
    status: 'assigned',
    reported_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10시간 전
    assigned_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8시간 전
    engineer_name: '박정비',
    engineer_contact: '010-3456-7890',
    ticket_number: 'AS-2026-006',
  },

  // Dispatched (2 tickets)
  {
    id: 'AS-2026-007',
    contract_id: 'C2026-007',
    buyer_company_id: 'buyer-007',
    si_partner_id: 'si-0006',
    symptom_description: '도장 로봇 분사 패턴 불균일, 코팅 두께 편차 심함. 노즐 교체 필요 예상.',
    priority: 'normal',
    status: 'dispatched',
    reported_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), // 15시간 전
    assigned_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14시간 전
    dispatched_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
    engineer_name: '최기사',
    engineer_contact: '010-4567-8901',
    ticket_number: 'AS-2026-007',
  },
  {
    id: 'AS-2026-008',
    contract_id: 'C2026-008',
    buyer_company_id: 'buyer-008',
    si_partner_id: 'si-0008',
    symptom_description: 'AGV 경로 이탈, 자기 테이프 인식 불량. 청소 후에도 증상 지속.',
    priority: 'urgent',
    status: 'dispatched',
    reported_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6시간 전
    assigned_at: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(), // 5.5시간 전
    dispatched_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1시간 전
    engineer_name: '임도현',
    engineer_contact: '010-5678-9012',
    ticket_number: 'AS-2026-008',
  },

  // Resolved (2 tickets - 1 SLA met ✅, 1 SLA missed ❌)
  {
    id: 'AS-2026-009',
    contract_id: 'C2026-009',
    buyer_company_id: 'buyer-009',
    si_partner_id: 'si-0009',
    symptom_description: '팔레타이징 로봇 스택 높이 오차, 상품 낙하 위험. 엔코더 재설정 필요.',
    priority: 'normal',
    status: 'resolved',
    reported_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30시간 전
    assigned_at: new Date(Date.now() - 29 * 60 * 60 * 1000).toISOString(),
    dispatched_at: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 22시간 소요 (SLA ✅)
    engineer_name: '한민지',
    engineer_contact: '010-6789-0123',
    ticket_number: 'AS-2026-009',
  },
  {
    id: 'AS-2026-010',
    contract_id: 'C2026-010',
    buyer_company_id: 'buyer-010',
    si_partner_id: 'si-0010',
    symptom_description: '용접 토치 각도 이상, 불량률 30% 이상 발생. 캘리브레이션 전면 재실시 필요.',
    priority: 'urgent',
    status: 'resolved',
    reported_at: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 50시간 전
    assigned_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    dispatched_at: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 30시간 소요 (SLA ❌ - 24시간 초과)
    engineer_name: '서준호',
    engineer_contact: '010-7890-1234',
    ticket_number: 'AS-2026-010',
  },
];

export function getAsTicketStats() {
  const total = COMPREHENSIVE_AS_TICKETS.length;
  const byStatus = {
    reported: COMPREHENSIVE_AS_TICKETS.filter((t) => t.status === 'reported').length,
    assigned: COMPREHENSIVE_AS_TICKETS.filter((t) => t.status === 'assigned').length,
    dispatched: COMPREHENSIVE_AS_TICKETS.filter((t) => t.status === 'dispatched').length,
    resolved: COMPREHENSIVE_AS_TICKETS.filter((t) => t.status === 'resolved').length,
  };

  const byPriority = {
    urgent: COMPREHENSIVE_AS_TICKETS.filter((t) => t.priority === 'urgent').length,
    normal: COMPREHENSIVE_AS_TICKETS.filter((t) => t.priority === 'normal').length,
  };

  return { total, byStatus, byPriority };
}
