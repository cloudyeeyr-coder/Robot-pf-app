export interface Notification {
  id: string;
  recipient_id: string;
  type: 'escrow' | 'as' | 'badge' | 'proposal' | 'system';
  title: string;
  body: string;
  deep_link: string;
  is_read: boolean;
  created_at: string;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  // Very Recent (< 1 hour)
  {
    id: 'notif-001',
    recipient_id: 'buyer-001',
    type: 'escrow',
    title: '에스크로 예치가 완료되었습니다',
    body: '계약 #C-2026-0042에 대한 에스크로 예치가 완료되었습니다. 총 ₩85,000,000원이 안전하게 보관되었습니다.',
    deep_link: '/contracts/C-2026-0042/payment/status',
    is_read: false,
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3분 전
  },
  {
    id: 'notif-002',
    recipient_id: 'buyer-001',
    type: 'as',
    title: 'AS 엔지니어가 배정되었습니다',
    body: 'AS 티켓 #AS-1823에 김기술 엔지니어가 배정되었습니다. 연락처: 010-1234-5678',
    deep_link: '/contracts/C-2026-0021/as/AS-1823',
    is_read: false,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25분 전
  },
  {
    id: 'notif-003',
    recipient_id: 'buyer-001',
    type: 'system',
    title: '견적 요청이 접수되었습니다',
    body: 'RaaS 계산기 견적 요청 #QT-2026-087이 접수되었습니다. 2영업일 내 연락드리겠습니다.',
    deep_link: '/',
    is_read: false,
    created_at: new Date(Date.now() - 48 * 60 * 1000).toISOString(), // 48분 전
  },

  // Recent (1-12 hours)
  {
    id: 'notif-004',
    recipient_id: 'si_partner-001',
    type: 'proposal',
    title: '새로운 파트너십 제안이 도착했습니다',
    body: 'Universal Robots에서 파트너십을 제안했습니다. 응답 기한: 5영업일 (D-5)',
    deep_link: '/partner/proposals',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
  },
  {
    id: 'notif-005',
    recipient_id: 'buyer-001',
    type: 'system',
    title: '현장 방문 예약이 확정되었습니다',
    body: '2026년 4월 28일 14:00 서울 강남구 방문 예약이 확정되었습니다. 예약번호: BK2026-042',
    deep_link: '/booking/BK2026-042',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
  },
  {
    id: 'notif-006',
    recipient_id: 'si_partner-001',
    type: 'badge',
    title: '인증 뱃지가 발급되었습니다',
    body: 'Universal Robots로부터 파트너십 뱃지를 받았습니다. 유효기간: 1년',
    deep_link: '/partner/badges',
    is_read: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8시간 전
  },

  // Yesterday
  {
    id: 'notif-007',
    recipient_id: 'buyer-001',
    type: 'system',
    title: '검수 기한이 다가옵니다',
    body: '계약 C-2026-0035의 검수 기한이 3일 남았습니다. 기한 내 검수를 완료해주세요.',
    deep_link: '/contracts/C-2026-0035/inspection',
    is_read: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 어제
  },
  {
    id: 'notif-008',
    recipient_id: 'si_partner-001',
    type: 'as',
    title: 'AS 티켓이 접수되었습니다',
    body: '새로운 AS 요청이 접수되었습니다. 티켓 #AS-1824 - 용접 정밀도 저하',
    deep_link: '/contracts/C-2026-0013/as/AS-1824',
    is_read: true,
    created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // 2-7 days ago
  {
    id: 'notif-009',
    recipient_id: 'manufacturer-001',
    type: 'proposal',
    title: 'SI 파트너가 제안을 수락했습니다',
    body: '로봇시스템즈가 파트너십 제안을 수락했습니다. 인증 뱃지가 자동 발급되었습니다.',
    deep_link: '/manufacturer/proposals',
    is_read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
  },
  {
    id: 'notif-010',
    recipient_id: 'buyer-001',
    type: 'escrow',
    title: '에스크로 자금이 방출되었습니다',
    body: '계약 C-2026-0018에 대한 에스크로 자금 ₩62,000,000원이 SI 파트너에게 방출되었습니다.',
    deep_link: '/contracts/C-2026-0018/payment/status',
    is_read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
  },
  {
    id: 'notif-011',
    recipient_id: 'si_partner-001',
    type: 'badge',
    title: '뱃지가 곧 만료됩니다',
    body: '두산로보틱스 인증 뱃지가 7일 후 만료됩니다. 파트너십 갱신이 필요합니다.',
    deep_link: '/partner/badges',
    is_read: true,
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4일 전
  },
  {
    id: 'notif-012',
    recipient_id: 'admin-001',
    type: 'system',
    title: '새로운 분쟁이 접수되었습니다',
    body: '계약 C-2026-0029에서 검수 거절로 분쟁이 발생했습니다. 중재가 필요합니다.',
    deep_link: '/admin/disputes',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
  },
  {
    id: 'notif-013',
    recipient_id: 'buyer-001',
    type: 'as',
    title: 'AS 작업이 완료되었습니다',
    body: 'AS 티켓 #AS-1812가 완료되었습니다. 엔지니어 평가를 남겨주세요.',
    deep_link: '/contracts/C-2026-0008/as/AS-1812',
    is_read: true,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6일 전
  },

  // 1-2 weeks ago
  {
    id: 'notif-014',
    recipient_id: 'si_partner-001',
    type: 'proposal',
    title: '제안이 만료되었습니다',
    body: '레인보우로보틱스로부터의 파트너십 제안이 응답 기한 초과로 만료되었습니다.',
    deep_link: '/partner/proposals',
    is_read: true,
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8일 전
  },
  {
    id: 'notif-015',
    recipient_id: 'buyer-001',
    type: 'system',
    title: '프로필 검토가 승인되었습니다',
    body: '수요기업 프로필 검토가 완료되어 승인되었습니다. 이제 모든 서비스를 이용하실 수 있습니다.',
    deep_link: '/',
    is_read: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10일 전
  },
  {
    id: 'notif-016',
    recipient_id: 'manufacturer-001',
    type: 'badge',
    title: '뱃지가 철회되었습니다',
    body: '(주)신성시스템의 인증 뱃지를 철회했습니다. 사유: 계약 불이행',
    deep_link: '/manufacturer/badges',
    is_read: true,
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11일 전
  },
  {
    id: 'notif-017',
    recipient_id: 'buyer-001',
    type: 'escrow',
    title: '에스크로 입금 확인 완료',
    body: '계약 C-2026-0005의 에스크로 입금이 운영팀에 의해 확인되었습니다.',
    deep_link: '/contracts/C-2026-0005/payment/status',
    is_read: true,
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12일 전
  },
  {
    id: 'notif-018',
    recipient_id: 'si_partner-001',
    type: 'system',
    title: '계약이 체결되었습니다',
    body: '(주)한빛정밀과의 신규 계약이 체결되었습니다. 계약금액: ₩95,000,000원',
    deep_link: '/partner/profile',
    is_read: true,
    created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(), // 13일 전
  },
  {
    id: 'notif-019',
    recipient_id: 'admin-001',
    type: 'system',
    title: 'AS SLA 목표 미달 경고',
    body: '이번 주 AS SLA 달성률이 92%로 목표(95%) 미달입니다. 미배정 티켓을 확인하세요.',
    deep_link: '/admin/as-sla',
    is_read: true,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14일 전
  },
  {
    id: 'notif-020',
    recipient_id: 'buyer-001',
    type: 'system',
    title: '보증서가 발급되었습니다',
    body: '계약 C-2026-0001의 로봇 보증서(PDF)가 발급되었습니다. 다운로드하여 보관하세요.',
    deep_link: '/contracts/C-2026-0001/warranty',
    is_read: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15일 전
  },
];

export function getNotificationsByUser(userId: string): Notification[] {
  return MOCK_NOTIFICATIONS.filter((n) => n.recipient_id === userId);
}

export function getUnreadCount(userId: string): number {
  return MOCK_NOTIFICATIONS.filter(
    (n) => n.recipient_id === userId && !n.is_read
  ).length;
}

export function markAsRead(notificationId: string): boolean {
  const notification = MOCK_NOTIFICATIONS.find((n) => n.id === notificationId);
  if (!notification) return false;
  notification.is_read = true;
  return true;
}

export function markAllAsRead(userId: string): boolean {
  MOCK_NOTIFICATIONS.forEach((n) => {
    if (n.recipient_id === userId) {
      n.is_read = true;
    }
  });
  return true;
}

export function getNotificationIcon(type: Notification['type']): string {
  switch (type) {
    case 'escrow':
      return '💰';
    case 'as':
      return '🔧';
    case 'badge':
      return '🏅';
    case 'proposal':
      return '🤝';
    case 'system':
      return '⚙️';
  }
}

export function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const past = new Date(timestamp).getTime();
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return new Date(timestamp).toLocaleDateString('ko-KR');
}
