import { Link } from 'react-router';
import { Button } from '../../app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../app/components/ui/card';
import { CheckCircle, Clock, Mail, Phone } from 'lucide-react';

export function PartnerPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">가입 신청이 접수되었습니다</CardTitle>
          <CardDescription className="text-base">
            운영팀에서 검토 후 승인 시 알림을 보내드립니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 예상 검토 기간 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">예상 검토 기간</h3>
                <p className="text-sm text-gray-600">
                  접수일로부터 <strong>2~3 영업일</strong> 내에 검토가 완료됩니다
                </p>
              </div>
            </div>
          </div>

          {/* 검토 프로세스 */}
          <div>
            <h3 className="font-semibold mb-3">검토 프로세스</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <div className="font-medium">서류 검토</div>
                  <div className="text-sm text-gray-600">
                    사업자등록번호, 회사 정보 확인
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <div className="font-medium">이력 확인</div>
                  <div className="text-sm text-gray-600">
                    시공 이력 및 역량 검증
                  </div>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <div className="font-medium">승인 완료</div>
                  <div className="text-sm text-gray-600">
                    이메일 및 문자로 알림 발송
                  </div>
                </div>
              </li>
            </ol>
          </div>

          {/* 연락처 정보 */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">문의사항이 있으신가요?</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-600" />
                <a
                  href="mailto:partner@robotsi.com"
                  className="text-blue-600 hover:underline"
                >
                  partner@robotsi.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-600" />
                <a href="tel:1588-0000" className="text-blue-600 hover:underline">
                  1588-0000
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              평일 09:00 - 18:00 (주말 및 공휴일 제외)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">홈으로</Button>
            </Link>
            <Link to="/login" className="flex-1">
              <Button className="w-full">로그인</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
