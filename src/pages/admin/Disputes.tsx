import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../app/components/ui/table';
import { AlertTriangle } from 'lucide-react';
import { MOCK_CONTRACTS } from '../../lib/mockContracts';

export function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = () => {
    const disputedContracts = MOCK_CONTRACTS.filter(
      (contract) => contract.status === 'disputed'
    );
    setDisputes(disputedContracts);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">분쟁 관리</h1>
        <p className="text-gray-600">계약 분쟁 중재 현황</p>
      </div>

      {/* Summary Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">
                현재 진행 중인 분쟁: {disputes.length}건
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                모든 분쟁 건은 운영팀이 중재하며, 자금은 에스크로에 안전하게 보호됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>분쟁 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="text-center py-16">
              <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">진행 중인 분쟁이 없습니다</h3>
              <p className="text-gray-600">
                분쟁이 발생하면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>계약 ID</TableHead>
                    <TableHead>수요기업</TableHead>
                    <TableHead>SI 파트너</TableHead>
                    <TableHead>계약금액</TableHead>
                    <TableHead>분쟁 접수일</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-sm">
                        {dispute.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {dispute.buyer_company_name}
                      </TableCell>
                      <TableCell>{dispute.si_partner_name}</TableCell>
                      <TableCell>
                        {dispute.amount.toLocaleString('ko-KR')}원
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(dispute.updated_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">중재 진행 중</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mediation Process Info */}
      <Card>
        <CardHeader>
          <CardTitle>중재 프로세스</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">분쟁 접수 확인</h4>
                <p className="text-sm text-gray-600">
                  수요기업이 검수 거절 시 자동으로 분쟁으로 전환됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">양측 의견 청취</h4>
                <p className="text-sm text-gray-600">
                  수요기업과 SI 파트너 양측의 입장을 확인합니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">현장 확인 (필요시)</h4>
                <p className="text-sm text-gray-600">
                  필요한 경우 운영팀이 현장을 방문하여 확인합니다.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                  4
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">중재 결정</h4>
                <p className="text-sm text-gray-600">
                  운영팀이 공정한 기준으로 중재 결정을 내립니다. (에스크로 방출 or 환불)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
