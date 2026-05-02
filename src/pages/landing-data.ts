import { Lock, Cpu, TrendingUp, ShieldCheck, MapPin, Scale } from 'lucide-react';

/* ─── S.H.I.E.L.D. 6 Agents ─── */
export const SHIELD_AGENTS = [
  {
    letter: 'S',
    code: 'Solvency AI',
    title: '재무 리스크 감시',
    subtitle: '"이 업체가 계약금만 받고 도망갈 확률은 0%인가?"',
    desc: 'SI 업체의 신용등급·자본 흐름·파산 리스크를 실시간 스크리닝. 재무 위험 징후 발생 시 즉시 에스크로 자금 동결 및 알림.',
    icon: TrendingUp,
    color: 'red',
    persona: '조상필 대표 Pain 해소',
  },
  {
    letter: 'H',
    code: 'Hardware & Tech AI',
    title: '기술 적합성 검증',
    subtitle: '"이 업체가 우리 공장과 같은 걸 성공해 본 적 있는가?"',
    desc: '과거 시공 레퍼런스와 고객 공정의 Fit을 분석. 납기율·성공률·실패율을 수치로 공개해 영업 멘트가 아닌 데이터로 판단.',
    icon: Cpu,
    color: 'blue',
    persona: '김도진 팀장 Pain 해소',
  },
  {
    letter: 'I',
    code: 'Investment ROI AI',
    title: '투자 효율 분석',
    subtitle: '"3천만 원 일시불 vs 월 구독, 어느 것이 진짜 이득인가?"',
    desc: 'CAPEX·리스·RaaS(월~100만 원) 3가지 옵션을 공정별 ROI로 즉시 비교. 현금 흐름 부담 없이 최적 투자 방식 선택.',
    icon: TrendingUp,
    color: 'amber',
    persona: '초기 CAPEX 부담 해소',
  },
  {
    letter: 'E',
    code: 'Escrow Execution AI',
    title: '에스크로 자금 통제',
    subtitle: '"내 돈이 약속을 지켰을 때만 지급되는가?"',
    desc: '계약금 100% 락업(Lock-up). 시공 단계별 검수가 완벽히 끝났을 때만 자금 해제. SI 파산 시 전액 자동 환불 집행.',
    icon: Lock,
    color: 'emerald',
    persona: '계약 파기 리스크 제로화',
  },
  {
    letter: 'L',
    code: 'Local A/S AI',
    title: '로컬 유지보수 관제',
    subtitle: '"고장 시 24시간 안에 수리기사가 무조건 오는가?"',
    desc: '전국 제조사 인증 파트너망 실시간 추적. 고장 접수 즉시 반경 50km 내 최적 엔지니어 자동 출동 명령. SI 파산 후에도 유지.',
    icon: MapPin,
    color: 'purple',
    persona: '고철 방치 트라우마 원천 차단',
  },
  {
    letter: 'D',
    code: 'Dispute Resolution AI',
    title: '분쟁 징후 예측',
    subtitle: '"싸움이 나기 전에 플랫폼이 먼저 개입하는가?"',
    desc: '커뮤니케이션 로그·진척도 데이터를 분석해 납기 지연·분쟁 징후 조기 감지. 징후 발생 시 O2O 휴먼 컨설턴트 선제 파견.',
    icon: Scale,
    color: 'slate',
    persona: '소통 단절·시공 지연 스트레스 해소',
  },
];

/* ─── Hero Stats ─── */
export const HERO_STATS = [
  { value: 100, suffix: '%', label: '계약금 에스크로 보호', highlight: false },
  { value: 50, suffix: 'km', label: '로컬 AS 출동 반경', highlight: false },
  { value: 24, suffix: 'h', label: '긴급 출동 보장', highlight: false },
  { value: 0, suffix: '%', label: '도입 실패 리스크', highlight: true },
];

/* ─── Real Quotes ─── */
export const PAIN_QUOTES = [
  { quote: '내 돈 3천만 원이 고철덩어리가 됐어', name: '조상필', role: '영세 제조업 대표', aos: 'P9 — Importance 5.0 / Satisfaction 1.0' },
  { quote: '기안 올릴 때 이 업체가 부도나면 누가 책임지나 하는 압박감이 큽니다', name: '김도진', role: '중견기업 생산기술 팀장', aos: 'P1 — Importance 4.8 / Satisfaction 2.0' },
];

/* ─── Market Stats ─── */
export const MARKET_STATS = [
  { value: '7조 원', label: '국내 로봇 시장 규모 (2024)' },
  { value: '1위', label: '세계 로봇 밀도 (1,012대/만 명)' },
  { value: '5.8배', label: '경쟁사 마로솔 1년 성장 (9억→51억)' },
  { value: '44.2%', label: 'CAPEX 부담으로 도입 주저 SME' },
];

/* ─── 3 Persona CTAs ─── */
export const PERSONA_CTAS = [
  {
    persona: '조상필 대표님께',
    badge: '🔴 Primary CTA — 극단 사용자',
    title: '지금 사전 예약하기',
    subtitle: '무한 AS 보증 1호 파트너 선점',
    desc: '출시 전 S.H.I.E.L.D. 보호 서비스 우선 배정 + 에스크로 보증료 20% 할인 쿠폰 즉시 발급.',
    fields: '회사명 / 담당자 연락처 / 도입 예정 로봇 유형',
    color: 'red',
    link: '/home',
  },
  {
    persona: '김도진 팀장님께',
    badge: '🔵 Secondary CTA — 기안 담당자',
    title: '업종 맞춤 SI 알림 설정',
    subtitle: '기안용 레퍼런스 리포트 자동 발송 (PDF 1-Click)',
    desc: '업종·지역·로봇 브랜드 선택 시, 조건 맞는 SI 신규 등록 즉시 알림 + H.AI 검증 리포트 자동 발송.',
    fields: '업종 / 지역 / 선호 로봇 브랜드',
    color: 'blue',
    link: '/home',
  },
  {
    persona: '강혁진 영업팀장님께',
    badge: '⚫ Nurturing CTA — 파트너/제조사',
    title: '파트너 인증 대기 리스트 등록',
    subtitle: '정식 오픈 시 얼리버드 혜택 우선 안내',
    desc: 'SI 업체·로봇 제조사·도입 희망 기업 구분 선택 → 역할별 온보딩 가이드 + S.H.I.E.L.D. 파트너십 우선 협의.',
    fields: '회사 유형 / 회사명 / 연락처',
    color: 'slate',
    link: '/home',
  },
];
