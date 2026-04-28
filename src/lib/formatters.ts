/**
 * 사업자등록번호 자동 하이픈 추가
 * 입력: "1234567890" → 출력: "123-45-67890"
 */
export function formatBizRegistrationNo(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  }
}

/**
 * 전화번호 자동 하이픈 추가
 * 입력: "01012345678" → 출력: "010-1234-5678"
 */
export function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
}

/**
 * 시공 성공률 계산
 */
export function calculateSuccessRate(completed: number, failed: number): number {
  const total = completed + failed;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100 * 10) / 10; // 소수점 1자리
}
