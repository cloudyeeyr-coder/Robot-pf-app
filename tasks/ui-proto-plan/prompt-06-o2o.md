# Firebase Studio MVP 프롬프트 — 6회차: O2O 예약 캘린더 (Phase 2 사전 골격)

## 전제 조건
1~5회차 완료 상태. 전체 플랫폼 기능 동작 중.

## 이번 회차 목표
- UI-012: O2O 매니저 파견 예약 캘린더 UI
- Phase 2 대비 DB 스키마·DTO·UI 골격을 미리 확보한다.
- 실제 매니저 배정 로직·SMS/카카오 알림은 구현하지 않는다.

---

## [UI-012] O2O 매니저 파견 예약 캘린더

### 경로
```
/app/booking/page.tsx                    ← 예약 캘린더 메인
/app/booking/[bookingId]/page.tsx        ← 예약 완료 확인 페이지
```
- `buyer` 역할 필수

---

### Phase 2 안내 배너 (페이지 상단 고정)
```
🚧 현재 수도권(서울·경기·인천) 지역에서 시범 운영 중입니다.
   정식 출시 시 전국으로 확대될 예정입니다.
```
shadcn/ui `Alert` 컴포넌트, `variant="default"`, 닫기 버튼 없음

---

### 예약 캘린더 메인 (`/booking`)

**레이아웃**:
- 데스크탑: 좌측 캘린더(420px) + 우측 슬롯 목록
- 모바일: 상단 캘린더 + 하단 슬롯 스크롤

---

#### 1단계: 지역 + 날짜 선택

**지역 선택** — 2단 드롭다운:
```
시/도 Select → 구/군 Select (연동)
```
지원 지역 (수도권):
- 서울: 강남구, 강동구, 강북구, 강서구, 관악구, 광진구, 구로구, 금천구, 노원구, 도봉구, 동대문구, 동작구, 마포구, 서대문구, 서초구, 성동구, 성북구, 송파구, 양천구, 영등포구, 용산구, 은평구, 종로구, 중구, 중랑구
- 경기: 수원시, 성남시, 고양시, 용인시, 부천시, 안산시, 화성시, 안양시, 남양주시, 의정부시
- 인천: 중구, 동구, 미추홀구, 연수구, 남동구, 부평구, 계양구, 서구

지원하지 않는 지역 선택 시:
```
"해당 지역은 아직 서비스 준비 중입니다.
 수도권(서울·경기·인천)에서 먼저 이용해보세요."
```

**날짜 선택** — shadcn/ui `Calendar`:
- 오늘 이전 날짜 비활성화
- 주말(토·일) 비활성화
- 한국 공휴일 비활성화 (2026년 주요 공휴일 하드코딩):
  ```typescript
  const holidays2026 = [
    '2026-01-01', // 신정
    '2026-01-28', // 설날 연휴
    '2026-01-29', // 설날
    '2026-01-30', // 설날 연휴
    '2026-03-01', // 삼일절
    '2026-05-05', // 어린이날
    '2026-05-25', // 부처님오신날
    '2026-06-06', // 현충일
    '2026-08-15', // 광복절
    '2026-09-24', // 추석 연휴
    '2026-09-25', // 추석
    '2026-09-26', // 추석 연휴
    '2026-10-03', // 개천절
    '2026-10-09', // 한글날
    '2026-12-25', // 성탄절
  ];
  ```
- 선택 가능 범위: 오늘 ~ 30일 후
- 키보드: 화살표 이동, Enter 선택

지역 + 날짜 모두 선택되면 자동으로 슬롯 조회 트리거

---

#### 2단계: 가용 슬롯 표시

**슬롯 조회** (Supabase Mock 데이터 기반):
- 지역 + 날짜 조합으로 슬롯 조회
- 로딩 중: Skeleton 카드 3개

**슬롯 카드 목록**:
```
┌──────────────────────────────────┐
│ 오전 10:00                       │
│ 매니저: K씨 (이니셜만 표시)      │
│                  [예약하기 →]    │
├──────────────────────────────────┤
│ 오후 14:00                       │
│ 매니저: L씨                      │
│                  [예약하기 →]    │
├──────────────────────────────────┤
│ 오후 16:00                       │
│ 매니저: P씨                      │
│                  [예약하기 →]    │
└──────────────────────────────────┘
```
- 매니저 정보: 이니셜만 표시 (실명 비공개)
- 슬롯 카드: `role="option"`, 선택 시 `aria-selected="true"`

**슬롯 0건 시** (REQ-FUNC-026):
```
📅 선택하신 날짜에 가용 매니저가 없습니다.

가장 가까운 가용 일정: 2026-05-03 (토요일 제외 다음 영업일 자동 계산)
[추천 일정으로 예약하기] 버튼

또는
[대기 예약 신청하기] 버튼
```
- 대기 예약 신청 → Supabase `o2o_booking` INSERT (status='waiting')
- Toast "대기 예약이 접수되었습니다. 슬롯이 생기면 연락드립니다."

---

#### 3단계: 예약 확정 폼

슬롯 선택 시 폼 펼침 (슬롯 목록 하단 또는 모달):

**선택 정보 요약**:
```
선택 일정: 2026-05-01 (금) 오후 14:00
지역: 서울 강남구
```

**Zod 스키마**:
```typescript
const bookingSchema = z.object({
  address_detail: z.string().min(1, '방문 주소를 입력해주세요'),
  memo: z.string().max(500).optional(),
});
```

**폼 필드**:
- 방문 주소 상세: `Input` (필수, 건물명·층수 등 상세 입력)
- 상담 희망 내용: `Textarea` (선택, max 500자)

**"예약 확정" 버튼**:
→ Supabase `o2o_booking` INSERT (status='confirmed')
→ 성공 → `/booking/[bookingId]` 리다이렉트

---

### 예약 완료 확인 페이지 (`/booking/[bookingId]`)

```
✅ 예약이 확정되었습니다!

예약 번호: #BOOKING-XXXXXXXX
일정: 2026-05-01 (금) 오후 14:00
지역: 서울 강남구
주소: (입력한 상세 주소)

📱 SMS와 카카오톡으로 예약 확인 메시지가 발송됩니다.
   (서비스 출시 후 활성화 예정)

[예약 목록 보기] 버튼 → /my/contracts 또는 별도 예약 목록 페이지
```

---

### Mock 슬롯 데이터

Phase 2 전까지 Supabase에 아래 Mock 슬롯 데이터를 사용:

```sql
-- 임시 매니저 슬롯 테이블 (Phase 2에서 실제 매니저 DB로 교체)
CREATE TABLE manager_slot_mock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_city VARCHAR(50) NOT NULL,   -- 예: '서울'
  region_district VARCHAR(50),         -- 예: '강남구'
  available_date DATE NOT NULL,
  slot_time VARCHAR(10) NOT NULL,      -- 예: '10:00', '14:00', '16:00'
  manager_initial VARCHAR(5) NOT NULL, -- 예: 'K씨'
  is_booked BOOLEAN DEFAULT FALSE
);

-- Mock 데이터 INSERT (향후 7일, 서울 강남·서초·송파 중심)
INSERT INTO manager_slot_mock (region_city, region_district, available_date, slot_time, manager_initial)
SELECT
  '서울',
  district,
  (CURRENT_DATE + n)::DATE,
  slot_time,
  initial
FROM
  (VALUES ('강남구'), ('서초구'), ('송파구'), ('마포구'), ('강서구')) AS d(district),
  generate_series(1, 14) AS n,
  (VALUES ('10:00', 'K씨'), ('14:00', 'L씨'), ('16:00', 'P씨')) AS s(slot_time, initial)
WHERE EXTRACT(DOW FROM (CURRENT_DATE + n)) NOT IN (0, 6); -- 주말 제외
```

---

### 예약 목록 (간단 버전)

`/app/my/bookings/page.tsx` (간략 구현):

**내 예약 목록 테이블**:
| 예약 번호 | 일정 | 지역 | 상태 | 액션 |
|---|---|---|---|---|
- 상태: confirmed(녹색) / waiting(노란) / completed(회색) / cancelled(빨간)
- "취소" 버튼 → `AlertDialog` 확인 → status='cancelled' UPDATE

---

## 완료 기준

- [ ] Phase 2 안내 배너 표시
- [ ] 지역 2단 드롭다운 동작 (시/도 → 구/군 연동)
- [ ] 지원 지역 외 선택 시 "서비스 준비 중" 안내
- [ ] 캘린더: 주말·공휴일 비활성화, 선택 가능 범위(오늘~30일) 제한
- [ ] 지역+날짜 선택 시 Mock 슬롯 자동 조회 + Skeleton 로딩
- [ ] 슬롯 카드 목록 표시, 선택 시 예약 폼 펼침
- [ ] 슬롯 0건: 가장 가까운 가용 일정 추천 + 대기 예약 버튼
- [ ] 예약 확정 → o2o_booking INSERT → 완료 확인 페이지 리다이렉트
- [ ] 완료 페이지: 예약 정보 요약 + "알림 발송 예정" 안내
- [ ] 예약 목록 페이지 및 취소 기능
- [ ] 캘린더 키보드 네비게이션 (화살표, Enter)
- [ ] 모바일 반응형 (상단 캘린더 + 하단 슬롯 스크롤)
- [ ] ESLint / TypeScript 경고 0건

---

## Phase 2 확장 포인트 (현재 TODO 주석으로 표시)

```typescript
// TODO(Phase 2): 실제 매니저 DB 연동 (manager_slot_mock → manager_availability)
// TODO(Phase 2): SMS 알림 발송 (Coolsms API 연동)
// TODO(Phase 2): 카카오 알림톡 발송
// TODO(Phase 2): 매니저 앱에서 방문 보고서 등록 기능
// TODO(Phase 2): 전국 지역 확대
// TODO(Phase 2): 예약 변경(일정 수정) 기능
```
