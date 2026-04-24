---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-025: Notification 도메인 — 알림 발송 (POST /api/notifications/send) Route Handler DTO, 채널별(카카오/SMS/이메일/내부) 규격 정의"
labels: 'feature, backend, api-contract, notification, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-025] 알림 발송 (`POST /api/notifications/send`) Route Handler DTO 및 채널별 규격 정의
- 목적: 플랫폼 전체에서 사용하는 **통합 알림 발송 API**의 Request/Response DTO, 4개 채널(카카오알림톡/SMS/이메일/내부알림함) 규격, 에러 코드를 정의한다. 에스크로 상태 변경, AS 배정, 뱃지 발급 등 모든 도메인에서 공통으로 호출하는 인프라 API이다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-033`](../../docs/06_SRS-v1.md) — 알림 발송 시스템
- API Endpoint: [`06_SRS-v1.md#6.1 Endpoint #27`](../../docs/06_SRS-v1.md)
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-025`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: Request DTO
  ```typescript
  export interface SendNotificationRequest {
    recipientId: string;
    recipientType: 'buyer' | 'si_partner' | 'manufacturer' | 'admin';
    channels: NotificationChannel[];
    templateId: string;
    templateParams: Record<string, string>;
    priority?: 'normal' | 'urgent';
  }

  export enum NotificationChannel {
    KAKAO_ALIMTALK = 'kakao_alimtalk',
    SMS            = 'sms',
    EMAIL          = 'email',
    INTERNAL       = 'internal',
  }
  ```

### 2단계: Zod 스키마
  ```typescript
  export const sendNotificationSchema = z.object({
    recipientId: z.string().min(1),
    recipientType: z.enum(['buyer', 'si_partner', 'manufacturer', 'admin']),
    channels: z.array(z.nativeEnum(NotificationChannel)).min(1, '최소 1개 채널 선택'),
    templateId: z.string().min(1),
    templateParams: z.record(z.string()),
    priority: z.enum(['normal', 'urgent']).default('normal'),
  });
  ```

### 3단계: 채널별 규격
  ```typescript
  export interface ChannelConfig {
    [NotificationChannel.KAKAO_ALIMTALK]: {
      senderKey: string;
      templateCode: string;
      buttonUrl?: string;
    };
    [NotificationChannel.SMS]: {
      senderPhone: string;
      maxLength: 90;
    };
    [NotificationChannel.EMAIL]: {
      fromAddress: string;
      subject: string;
      htmlTemplate: string;
    };
    [NotificationChannel.INTERNAL]: {
      storedInDb: true;       // DB-014 NOTIFICATION 테이블 저장
      readStatus: 'unread';
    };
  }
  ```

### 4단계: Response DTO
  ```typescript
  export interface SendNotificationSuccessResponse {
    success: true;
    data: {
      notificationId: string;
      channelResults: {
        channel: NotificationChannel;
        sent: boolean;
        sentAt?: string;
        failReason?: string;
      }[];
    };
  }
  ```

### 5단계: 에러 코드
  ```typescript
  export enum SendNotificationErrorCode {
    VALIDATION_ERROR    = 'NTF_025_VALIDATION',
    RECIPIENT_NOT_FOUND = 'NTF_025_RECIPIENT_NOT_FOUND',
    TEMPLATE_NOT_FOUND  = 'NTF_025_TEMPLATE_NOT_FOUND',
    CHANNEL_FAILED      = 'NTF_025_CHANNEL_FAILED',
    RATE_LIMITED         = 'NTF_025_RATE_LIMITED',
    INTERNAL_ERROR      = 'NTF_025_INTERNAL',
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 다채널 동시 발송**
- **Given:** 유효한 수신자, channels: ['internal', 'email']
- **When:** `POST /api/notifications/send` 호출
- **Then:** 내부알림함 저장 + 이메일 발송, 채널별 결과 반환

**Scenario 2: 일부 채널 실패**
- **Given:** SMS 발송 실패 (통신사 오류)
- **When:** channels: ['sms', 'internal']로 발송
- **Then:** internal 성공, sms 실패 (failReason 포함), 전체 응답은 200 (부분 성공)

**Scenario 3: 존재하지 않는 템플릿**
- **Given:** 유효하지 않은 templateId
- **When:** 발송 시도
- **Then:** `NTF_025_TEMPLATE_NOT_FOUND` 에러 404

## :gear: Technical & Non-Functional Constraints
- **구현:** Route Handler (`POST /api/notifications/send`)
- **성능:** 알림 발송 p95 ≤ 3초 (외부 채널 포함)
- **재시도:** 외부 채널 실패 시 3회 재시도 (exponential backoff)
- **MVP 범위:** 카카오/SMS는 Phase 2, MVP는 internal + email만 구현

## :checkered_flag: Definition of Done (DoD)
- [ ] Request/Response DTO, 채널별 규격 정의 완료
- [ ] 에러 코드 정의, ESLint 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| DB-014 | `NOTIFICATION` 테이블 스키마 | 필수 |

### Blocks
| Task ID | 설명 |
|:---|:---|
| FC-025 | 알림 발송 Command 로직 (internal + email) |
| API-004~010 | 모든 에스크로/AS/뱃지 액션의 알림 발송 호출부 |
