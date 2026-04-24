---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[API] API-026: Monitoring 도메인 — Slack Webhook 알림 인터페이스 (에스크로 오류율, AS 미배정, RaaS 성능, LCP) 정의"
labels: 'feature, backend, api-contract, monitoring, priority:high'
assignees: ''
---

## :dart: Summary
- 기능명: [API-026] Slack Webhook 알림 인터페이스 정의
- 목적: 운영 모니터링용 **Slack Webhook 알림 인터페이스**를 정의한다. 에스크로 오류율 ≥ 0.1%, AS 24시간 미배정, RaaS 계산기 응답 ≥ 3초, LCP p95 > 2초 등 **4대 핵심 메트릭 임계치 위반 시** 운영팀 Slack 채널에 즉시 알림을 발송한다.

## :link: References (Spec & Context)
- SRS: [`06_SRS-v1.md#REQ-FUNC-033~036`](../../docs/06_SRS-v1.md) — 운영 모니터링 4대 메트릭
- 태스크 리스트: [`07_TASK-LIST-v1.md#API-026`](../07_TASK-LIST-v1.md)

## :white_check_mark: Task Breakdown (실행 계획)

### 1단계: 4대 모니터링 메트릭 인터페이스
  ```typescript
  export enum MonitoringMetric {
    ESCROW_ERROR_RATE   = 'escrow_error_rate',
    AS_UNASSIGNED_24H   = 'as_unassigned_24h',
    RAAS_CALC_LATENCY   = 'raas_calc_latency',
    LCP_P95             = 'lcp_p95',
  }

  export const METRIC_THRESHOLDS: Record<MonitoringMetric, MetricThreshold> = {
    [MonitoringMetric.ESCROW_ERROR_RATE]: {
      threshold: 0.001,     // ≥ 0.1%
      unit: 'ratio',
      comparison: 'gte',
      alertMessage: '에스크로 결제 오류율이 0.1%를 초과했습니다',
    },
    [MonitoringMetric.AS_UNASSIGNED_24H]: {
      threshold: 1,         // ≥ 1건
      unit: 'count',
      comparison: 'gte',
      alertMessage: '24시간 이상 미배정 AS 티켓이 존재합니다',
    },
    [MonitoringMetric.RAAS_CALC_LATENCY]: {
      threshold: 3000,      // ≥ 3초 (ms)
      unit: 'ms',
      comparison: 'gte',
      alertMessage: 'RaaS 계산기 응답 시간이 3초를 초과합니다',
    },
    [MonitoringMetric.LCP_P95]: {
      threshold: 2000,      // > 2초 (ms)
      unit: 'ms',
      comparison: 'gt',
      alertMessage: 'LCP p95가 2초를 초과합니다',
    },
  };

  export interface MetricThreshold {
    threshold: number;
    unit: 'ratio' | 'count' | 'ms';
    comparison: 'gt' | 'gte' | 'lt' | 'lte';
    alertMessage: string;
  }
  ```

### 2단계: Slack Webhook Payload 구조
  ```typescript
  export interface SlackAlertPayload {
    channel: string;              // Slack 채널 ID
    username: 'Robot-PF Monitor';
    icon_emoji: ':rotating_light:';
    attachments: [{
      color: 'danger' | 'warning';
      title: string;              // 메트릭명
      text: string;               // alertMessage
      fields: {
        title: string;            // '현재값' | '임계치' | '감지 시각'
        value: string;
        short: boolean;
      }[];
      ts: number;                 // Unix timestamp
    }];
  }
  ```

### 3단계: 알림 발송 함수 인터페이스
  ```typescript
  export interface SendSlackAlertRequest {
    metric: MonitoringMetric;
    currentValue: number;
    detectedAt: string;
    additionalContext?: Record<string, string>;
  }

  export interface SendSlackAlertResponse {
    success: boolean;
    slackResponseStatus: number;
    sentAt: string;
  }
  ```

### 4단계: 에러 코드
  ```typescript
  export enum SlackAlertErrorCode {
    WEBHOOK_URL_MISSING = 'MON_026_WEBHOOK_MISSING',
    WEBHOOK_FAILED      = 'MON_026_WEBHOOK_FAILED',
    INVALID_METRIC      = 'MON_026_INVALID_METRIC',
    RATE_LIMITED         = 'MON_026_RATE_LIMITED',
  }
  ```

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 에스크로 오류율 임계치 초과 알림**
- **Given:** 에스크로 오류율이 0.15% (임계치 0.1% 초과)
- **When:** CRON이 메트릭을 감지
- **Then:** Slack Webhook 발송, 현재값·임계치·시각 포함

**Scenario 2: AS 24시간 미배정 알림**
- **Given:** reported 후 24시간 경과한 AS 티켓 2건 존재
- **When:** CRON-007이 감지
- **Then:** Slack 알림, 티켓 ID·지역·긴급도 포함

**Scenario 3: Webhook URL 미설정**
- **Given:** 환경변수 `SLACK_WEBHOOK_URL` 미설정
- **When:** 알림 발송 시도
- **Then:** `MON_026_WEBHOOK_MISSING` 에러, 폴백 로깅

## :gear: Technical & Non-Functional Constraints
- **구현:** `lib/infra/slack/send-alert.ts` 순수 함수
- **Webhook:** Slack Incoming Webhook URL (환경변수)
- **Rate Limit:** 동일 메트릭 알림 최소 간격 5분 (중복 방지)
- **폴백:** Webhook 실패 시 서버 로그에 기록 (알림 유실 방지)
- **연계:** CRON-003~007 배치 작업에서 호출

## :checkered_flag: Definition of Done (DoD)
- [ ] 4대 메트릭 임계치 인터페이스 정의 완료
- [ ] Slack Webhook Payload 구조 정의 완료
- [ ] 에러 코드 정의, ESLint 경고 0건

## :construction: Dependencies & Blockers
### Depends on
| Task ID | 설명 | 상태 |
|:---|:---|:---:|
| — | 외부 의존성 없음 (Slack Webhook URL만 필요) | — |

### Blocks
| Task ID | 설명 |
|:---|:---|
| CRON-003 | 에스크로 오류율 모니터링 |
| CRON-007 | AS 24시간 미배정 모니터링 |
| CRON-008 | RaaS 성능 모니터링 |
| CRON-009 | LCP 성능 모니터링 |
