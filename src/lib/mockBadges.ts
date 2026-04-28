// Mock data for manufacturer badges and partner proposals

export interface Badge {
  id: string;
  si_partner_id: string;
  si_partner_name: string;
  manufacturer_id: string;
  manufacturer_name: string;
  issued_at: string;
  expires_at: string;
  is_active: boolean;
  revoked_at?: string;
  revoke_reason?: string;
}

export interface PartnerProposal {
  id: string;
  manufacturer_id: string;
  manufacturer_name: string;
  si_partner_id: string;
  si_partner_name: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sent_at: string;
  deadline: string;
  responded_at?: string;
  response_reason?: string;
}

// Mock badges
export const MOCK_BADGES: Badge[] = [
  {
    id: 'badge-001',
    si_partner_id: 'si-0001',
    si_partner_name: '서울 로보틱스 1',
    manufacturer_id: 'mfr-ur',
    manufacturer_name: 'Universal Robots',
    issued_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: 'badge-002',
    si_partner_id: 'si-0002',
    si_partner_name: '경기 자동화 2',
    manufacturer_id: 'mfr-ur',
    manufacturer_name: 'Universal Robots',
    issued_at: new Date(Date.now() - 330 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
  },
  {
    id: 'badge-003',
    si_partner_id: 'si-0003',
    si_partner_name: '인천 시스템 3',
    manufacturer_id: 'mfr-doosan',
    manufacturer_name: '두산로보틱스',
    issued_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: false,
  },
  {
    id: 'badge-004',
    si_partner_id: 'si-0004',
    si_partner_name: '부산 엔지니어링 4',
    manufacturer_id: 'mfr-ur',
    manufacturer_name: 'Universal Robots',
    issued_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 265 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: false,
    revoked_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    revoke_reason: '품질 기준 미달로 인한 철회',
  },
];

// Mock proposals
export const MOCK_PROPOSALS: PartnerProposal[] = [
  {
    id: 'proposal-001',
    manufacturer_id: 'mfr-ur',
    manufacturer_name: 'Universal Robots',
    si_partner_id: 'si-0005',
    si_partner_name: '대구 솔루션 5',
    message: 'UR 협동로봇 전문 파트너로 함께 성장하고 싶습니다.',
    status: 'pending',
    sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proposal-002',
    manufacturer_id: 'mfr-doosan',
    manufacturer_name: '두산로보틱스',
    si_partner_id: 'si-0006',
    si_partner_name: '광주 자동화 6',
    message: '두산 협동로봇의 우수한 성능을 고객에게 전달할 파트너를 찾고 있습니다.',
    status: 'accepted',
    sent_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    responded_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'proposal-003',
    manufacturer_id: 'mfr-ur',
    manufacturer_name: 'Universal Robots',
    si_partner_id: 'si-0007',
    si_partner_name: '대전 테크 7',
    status: 'rejected',
    sent_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    responded_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    response_reason: '현재 다른 제조사와 협력 중입니다.',
  },
  {
    id: 'proposal-004',
    manufacturer_id: 'mfr-ur',
    manufacturer_name: 'Universal Robots',
    si_partner_id: 'si-0008',
    si_partner_name: '울산 엔지니어링 8',
    message: '울산 지역 협력 파트너를 찾고 있습니다.',
    status: 'expired',
    sent_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper functions
export function getBadgesByManufacturerId(manufacturerId: string): Badge[] {
  return MOCK_BADGES.filter(b => b.manufacturer_id === manufacturerId);
}

export function getBadgesBySiPartnerId(siPartnerId: string): Badge[] {
  return MOCK_BADGES.filter(b => b.si_partner_id === siPartnerId);
}

export function getActiveBadgeCount(manufacturerId: string): number {
  return MOCK_BADGES.filter(
    b => b.manufacturer_id === manufacturerId && b.is_active && new Date(b.expires_at) > new Date()
  ).length;
}

export function getExpiringBadges(manufacturerId: string, daysThreshold: number = 30): Badge[] {
  const thresholdDate = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);
  return MOCK_BADGES.filter(
    b =>
      b.manufacturer_id === manufacturerId &&
      b.is_active &&
      new Date(b.expires_at) <= thresholdDate &&
      new Date(b.expires_at) > new Date()
  );
}

export function getProposalsByManufacturerId(manufacturerId: string): PartnerProposal[] {
  return MOCK_PROPOSALS.filter(p => p.manufacturer_id === manufacturerId);
}

export function getProposalsBySiPartnerId(siPartnerId: string): PartnerProposal[] {
  return MOCK_PROPOSALS.filter(p => p.si_partner_id === siPartnerId);
}

export function getPendingProposalsCount(manufacturerId: string): number {
  return MOCK_PROPOSALS.filter(
    p => p.manufacturer_id === manufacturerId && p.status === 'pending'
  ).length;
}

export function getProposalById(proposalId: string): PartnerProposal | undefined {
  return MOCK_PROPOSALS.find(p => p.id === proposalId);
}

export function getDaysUntilDeadline(deadline: string): number {
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return days;
}

export function getDaysUntilExpiry(expiresAt: string): number {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return days;
}

// Simulate badge revocation
export function revokeBadge(badgeId: string, reason: string): boolean {
  const badge = MOCK_BADGES.find(b => b.id === badgeId);
  if (!badge) return false;

  badge.is_active = false;
  badge.revoked_at = new Date().toISOString();
  badge.revoke_reason = reason;
  return true;
}

// Simulate badge issuance
export function issueBadge(
  siPartnerId: string,
  siPartnerName: string,
  manufacturerId: string,
  manufacturerName: string,
  expiresAt: string
): Badge {
  const newBadge: Badge = {
    id: `badge-${Date.now()}`,
    si_partner_id: siPartnerId,
    si_partner_name: siPartnerName,
    manufacturer_id: manufacturerId,
    manufacturer_name: manufacturerName,
    issued_at: new Date().toISOString(),
    expires_at: expiresAt,
    is_active: true,
  };

  MOCK_BADGES.push(newBadge);
  return newBadge;
}

// Simulate proposal response
export function respondToProposal(
  proposalId: string,
  accept: boolean,
  reason?: string
): boolean {
  const proposal = MOCK_PROPOSALS.find(p => p.id === proposalId);
  if (!proposal) return false;

  proposal.status = accept ? 'accepted' : 'rejected';
  proposal.responded_at = new Date().toISOString();
  if (reason) {
    proposal.response_reason = reason;
  }

  // If accepted, auto-issue badge
  if (accept) {
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    issueBadge(
      proposal.si_partner_id,
      proposal.si_partner_name,
      proposal.manufacturer_id,
      proposal.manufacturer_name,
      expiresAt
    );
  }

  return true;
}

// Simulate sending proposal
export function sendProposal(
  manufacturerId: string,
  manufacturerName: string,
  siPartnerId: string,
  siPartnerName: string,
  message?: string
): PartnerProposal {
  const newProposal: PartnerProposal = {
    id: `proposal-${Date.now()}`,
    manufacturer_id: manufacturerId,
    manufacturer_name: manufacturerName,
    si_partner_id: siPartnerId,
    si_partner_name: siPartnerName,
    message,
    status: 'pending',
    sent_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  };

  MOCK_PROPOSALS.push(newProposal);
  return newProposal;
}
