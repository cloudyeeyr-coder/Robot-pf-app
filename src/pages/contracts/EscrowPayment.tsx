import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../app/components/ui/card';
import { toast } from 'sonner';
import { Copy, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import {
  getContractById,
  getEscrowByContractId,
  BANK_ACCOUNT_INFO,
} from '../../lib/mockContracts';
import { useAuth } from '../../contexts/AuthContext';

export function EscrowPaymentPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [escrow, setEscrow] = useState<any>(null);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      const contractData = getContractById(contractId!);
      const escrowData = getEscrowByContractId(contractId!);

      if (!contractData) {
        setLoading(false);
        return;
      }

      // Check ownership
      if (contractData.buyer_company_id !== user?.companyId) {
        navigate('/403');
        return;
      }

      setContract(contractData);
      setEscrow(escrowData);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [contractId, user, navigate]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('복사되었습니다');
    } catch (error) {
      toast.error('복사에 실패했습니다');
    }
  };

  const handleConfirmDeposit = () => {
    navigate(`/contracts/${contractId}/payment/status`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">계약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">계약을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">요청하신 계약 정보가 존재하지 않습니다</p>
          <Button onClick={() => navigate('/my/contracts')}>계약 목록으로</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">에스크로 결제</h1>
          <p className="text-gray-600">
            안전한 거래를 위해 에스크로 서비스를 이용합니다
          </p>
        </div>

        {/* Contract Summary */}
        <Card>
          <CardHeader>
            <CardTitle>계약 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">SI 파트너</span>
              <span className="font-semibold">{contract.si_partner_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">계약 금액</span>
              <span className="font-semibold text-blue-600 text-lg">
                {contract.amount.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">계약일</span>
              <span className="font-semibold">
                {new Date(contract.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              입금 계좌 정보
            </CardTitle>
            <CardDescription>
              아래 계좌로 계약 금액을 입금해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">은행명</span>
                <span className="font-semibold">{BANK_ACCOUNT_INFO.bank_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">예금주</span>
                <span className="font-semibold">{BANK_ACCOUNT_INFO.account_holder}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-gray-600">계좌번호</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {BANK_ACCOUNT_INFO.account_number}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(BANK_ACCOUNT_INFO.account_number)}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    복사
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-green-900">안전 보장</p>
                  <p className="text-sm text-green-800">
                    입금하신 자금은 시공 완료 및 검수 승인 전까지 에스크로 계좌에 안전하게 보호됩니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>• 입금자명은 계약서의 회사명과 동일해야 합니다</p>
              <p>• 평균 입금 확인 소요 시간: 1~2 영업일</p>
              <p>• 입금 확인 후 자동으로 알림을 보내드립니다</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/my/contracts')}
          >
            나중에 하기
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleConfirmDeposit}
          >
            입금 완료했습니다
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
