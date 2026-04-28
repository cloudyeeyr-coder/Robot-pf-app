export interface BookingSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h format)
  region_si: string; // 시/도
  region_gu: string; // 구/군
  manager_name: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  buyer_id: string;
  slot_id: string;
  booking_number: string;
  date: string;
  time: string;
  region_si: string;
  region_gu: string;
  address: string;
  topic: string;
  manager_name: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

// Korean regions (수도권 priority)
export const REGIONS_SI_DO = [
  '서울특별시',
  '경기도',
  '인천광역시',
  '부산광역시',
  '대구광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
];

export const REGIONS_GU_GUN: Record<string, string[]> = {
  서울특별시: [
    '강남구',
    '강동구',
    '강북구',
    '강서구',
    '관악구',
    '광진구',
    '구로구',
    '금천구',
    '노원구',
    '도봉구',
    '동대문구',
    '동작구',
    '마포구',
    '서대문구',
    '서초구',
    '성동구',
    '성북구',
    '송파구',
    '양천구',
    '영등포구',
    '용산구',
    '은평구',
    '종로구',
    '중구',
    '중랑구',
  ],
  경기도: [
    '수원시',
    '성남시',
    '고양시',
    '용인시',
    '부천시',
    '안산시',
    '안양시',
    '남양주시',
    '화성시',
    '평택시',
    '의정부시',
    '시흥시',
    '파주시',
    '김포시',
    '광명시',
    '광주시',
    '군포시',
    '하남시',
  ],
  인천광역시: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구'],
  부산광역시: [
    '중구',
    '서구',
    '동구',
    '영도구',
    '부산진구',
    '동래구',
    '남구',
    '북구',
    '해운대구',
    '사하구',
    '금정구',
    '강서구',
    '연제구',
    '수영구',
    '사상구',
  ],
};

// Mock available slots (next 30 days)
export const MOCK_BOOKING_SLOTS: BookingSlot[] = [
  // 서울 강남구 - 4/25 (금)
  {
    id: 'slot-001',
    date: '2026-04-25',
    time: '10:00',
    region_si: '서울특별시',
    region_gu: '강남구',
    manager_name: '김',
    is_available: true,
  },
  {
    id: 'slot-002',
    date: '2026-04-25',
    time: '14:00',
    region_si: '서울특별시',
    region_gu: '강남구',
    manager_name: '이',
    is_available: true,
  },
  {
    id: 'slot-003',
    date: '2026-04-25',
    time: '16:00',
    region_si: '서울특별시',
    region_gu: '강남구',
    manager_name: '박',
    is_available: false, // booked
  },
  // 서울 강남구 - 4/28 (월)
  {
    id: 'slot-004',
    date: '2026-04-28',
    time: '10:00',
    region_si: '서울특별시',
    region_gu: '강남구',
    manager_name: '최',
    is_available: true,
  },
  {
    id: 'slot-005',
    date: '2026-04-28',
    time: '14:00',
    region_si: '서울특별시',
    region_gu: '강남구',
    manager_name: '정',
    is_available: true,
  },
  // 서울 강남구 - 4/29 (화)
  {
    id: 'slot-006',
    date: '2026-04-29',
    time: '10:00',
    region_si: '서울특별시',
    region_gu: '강남구',
    manager_name: '김',
    is_available: true,
  },
  // 경기도 성남시 - 4/25 (금)
  {
    id: 'slot-007',
    date: '2026-04-25',
    time: '10:00',
    region_si: '경기도',
    region_gu: '성남시',
    manager_name: '강',
    is_available: true,
  },
  {
    id: 'slot-008',
    date: '2026-04-25',
    time: '16:00',
    region_si: '경기도',
    region_gu: '성남시',
    manager_name: '조',
    is_available: true,
  },
  // 경기도 성남시 - 4/30 (수)
  {
    id: 'slot-009',
    date: '2026-04-30',
    time: '14:00',
    region_si: '경기도',
    region_gu: '성남시',
    manager_name: '윤',
    is_available: true,
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking-001',
    buyer_id: 'buyer-001',
    slot_id: 'slot-003',
    booking_number: 'BK2026-001',
    date: '2026-04-25',
    time: '16:00',
    region_si: '서울특별시',
    region_gu: '강남구',
    address: '서울특별시 강남구 테헤란로 123 ABC빌딩 5층',
    topic: '협동로봇 도입 상담 및 현장 평가',
    manager_name: '박',
    status: 'confirmed',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function getAvailableSlots(
  regionSi: string,
  regionGu: string,
  date: string
): BookingSlot[] {
  return MOCK_BOOKING_SLOTS.filter(
    (slot) =>
      slot.region_si === regionSi &&
      slot.region_gu === regionGu &&
      slot.date === date &&
      slot.is_available
  );
}

export function findNearestAvailableDate(
  regionSi: string,
  regionGu: string,
  fromDate: string
): string | null {
  const from = new Date(fromDate);
  const availableSlots = MOCK_BOOKING_SLOTS.filter(
    (slot) =>
      slot.region_si === regionSi &&
      slot.region_gu === regionGu &&
      slot.is_available &&
      new Date(slot.date) > from
  );

  if (availableSlots.length === 0) return null;

  // Sort by date and return the earliest
  availableSlots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return availableSlots[0].date;
}

export function bookSlot(
  buyerId: string,
  slotId: string,
  address: string,
  topic: string
): Booking {
  const slot = MOCK_BOOKING_SLOTS.find((s) => s.id === slotId);
  if (!slot || !slot.is_available) {
    throw new Error('Slot not available');
  }

  // Mark slot as unavailable
  slot.is_available = false;

  const bookingNumber = `BK${new Date().getFullYear()}-${String(MOCK_BOOKINGS.length + 1).padStart(3, '0')}`;

  const booking: Booking = {
    id: `booking-${Date.now()}`,
    buyer_id: buyerId,
    slot_id: slotId,
    booking_number: bookingNumber,
    date: slot.date,
    time: slot.time,
    region_si: slot.region_si,
    region_gu: slot.region_gu,
    address,
    topic,
    manager_name: slot.manager_name,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  };

  MOCK_BOOKINGS.push(booking);
  return booking;
}

export function cancelBooking(bookingId: string): boolean {
  const booking = MOCK_BOOKINGS.find((b) => b.id === bookingId);
  if (!booking) return false;

  booking.status = 'cancelled';

  // Free up the slot
  const slot = MOCK_BOOKING_SLOTS.find((s) => s.id === booking.slot_id);
  if (slot) {
    slot.is_available = true;
  }

  return true;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// Korean public holidays 2026 (simplified - major ones)
export const KOREAN_HOLIDAYS_2026 = [
  '2026-01-01', // 신정
  '2026-02-16', // 설날 전날
  '2026-02-17', // 설날
  '2026-02-18', // 설날 다음날
  '2026-03-01', // 삼일절
  '2026-05-05', // 어린이날
  '2026-05-24', // 부처님 오신 날
  '2026-06-06', // 현충일
  '2026-08-15', // 광복절
  '2026-09-27', // 추석 전날
  '2026-09-28', // 추석
  '2026-09-29', // 추석 다음날
  '2026-10-03', // 개천절
  '2026-10-09', // 한글날
  '2026-12-25', // 크리스마스
];

export function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return KOREAN_HOLIDAYS_2026.includes(dateStr);
}

export function isBookableDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    date >= today &&
    date <= maxDate &&
    !isWeekend(date) &&
    !isHoliday(date)
  );
}
