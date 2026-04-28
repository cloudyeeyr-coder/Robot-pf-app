import { useParams, useNavigate } from 'react-router';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { AlertTriangle, Shield, Phone, Mail } from 'lucide-react';

export function DisputePage() {
  const { contractId } = useParams();
  const navigate = useNavigate();

  // Mock dispute ticket number
  const disputeTicketNumber = `DIS-2026-${contractId?.slice(-3)}`;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">분쟁이 접수되었습니다</h1>
          <p className="text-gray-600">
            운영팀이 공정한 중재를 진행하겠습니다
          </p>
        </div>

        {/* Dispute Ticket */}
        <Card>
          <CardHeader>
            <CardTitle>분쟁 티켓 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">티켓 번호</span>
              <span className="font-semibold text-blue-600">{disputeTicketNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">접수일</span>
              <span className="font-semibold">
                {new Date().toLocaleDateString('ko-KR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">현재 상태</span>
              <span className="font-semibold text-orange-600">중재 진행 중</span>
            </div>
          </CardContent>
        </Card>

        {/* Fund Protection Assurance */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-6">
            <div className="flex gap-3">
              <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 mb-2">자금 보호 안내</p>
                <p className="text-sm text-green-800">
                  에스크로에 예치된 자금은 중재 완료 시까지 안전하게 보호됩니다.
                  중재 결과에 따라 적절히 처리됩니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mediation Process Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>중재 프로세스</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div className="w-0.5 h-16 bg-gray-200"></div>
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="font-semibold mb-1">분쟁 접수 완료</h3>
                  <p className="text-sm text-gray-600">
                    운영팀이 분쟁 내용을 검토하고 있습니다
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date().toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div className="w-0.5 h-16 bg-gray-200"></div>
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="font-semibold mb-1">양측 의견 청취</h3>
                  <p className="text-sm text-gray-600">
                    수요기업과 SI 파트너 양측의 입장을 확인합니다
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    예상 소요: 2~3 영업일
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div className="w-0.5 h-16 bg-gray-200"></div>
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="font-semibold mb-1">현장 실사 (필요시)</h3>
                  <p className="text-sm text-gray-600">
                    필요한 경우 전문가가 현장을 방문하여 확인합니다
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    예상 소요: 3~5 영업일
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">중재 결과 통보</h3>
                  <p className="text-sm text-gray-600">
                    공정한 판단에 따라 자금 처리 방향을 결정하고 통보드립니다
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    전체 예상 소요: 7~14 영업일
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>운영팀 연락처</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              분쟁 진행 상황이나 추가 문의사항이 있으시면 언제든지 연락주세요.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-600" />
                <a href="tel:1588-0000" className="text-blue-600 hover:underline">
                  1588-0000
                </a>
                <span className="text-gray-500">(평일 09:00-18:00)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-600" />
                <a
                  href="mailto:dispute@robotsi.com"
                  className="text-blue-600 hover:underline"
                >
                  dispute@robotsi.com
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              ※ 티켓 번호 ({disputeTicketNumber})를 알려주시면 빠른 상담이 가능합니다
            </p>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/my/contracts')}
          >
            계약 목록으로
          </Button>
        </div>
      </div>
    </div>
  );
}
