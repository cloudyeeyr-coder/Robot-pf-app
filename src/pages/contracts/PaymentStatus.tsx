import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Badge } from '../../app/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import {
  getContractById,
  getEscrowByContractId,
  simulateEscrowStateChange,
  BANK_ACCOUNT_INFO,
} from '../../lib/mockContracts';
import { useAuth } from '../../contexts/AuthContext';

const POLLING_INTERVAL = 30000; // 30 seconds

export function PaymentStatusPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [escrow, setEscrow] = useState<any>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    // Initial load
    const loadData = () => {
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
    };

    loadData();
  }, [contractId, user, navigate]);

  // Polling effect
  useEffect(() => {
    if (!polling || !contractId) return;

    const interval = setInterval(() => {
      const newState = simulateEscrowStateChange(contractId);
      const updatedEscrow = getEscrowByContractId(contractId);
      setEscrow(updatedEscrow);

      // Stop polling if state is held or disputed
      if (newState === 'held' || contract?.status === 'disputed') {
        setPolling(false);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [polling, contractId, contract?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상태 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!contract || !escrow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">정보를 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/my/contracts')}>계약 목록으로</Button>
        </div>
      </div>
    );
  }

  const currentStep =
    escrow.state === 'pending' ? 1 :
    escrow.state === 'held' && !contract.status.includes('warranty') ? 2 :
    3;

  const steps = [
    {
      number: 1,
      title: '입금 대기 중',
      completedTitle: '입금 완료',
      description: '계좌로 입금을 기다리고 있습니다',
      completed: escrow.state !== 'pending',
    },
    {
      number: 2,
      title: 'Admin 확인 중',
      completedTitle: '예치 완료',
      description: '운영팀이 입금을 확인하고 있습니다',
      completed: escrow.state === 'held',
    },
    {
      number: 3,
      title: '보증서 발급 대기',
      completedTitle: '보증서 발급 완료',
      description: 'AS 보증서가 발급되었습니다',
      completed: false, // In real app, check warranty status
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">입금 확인 상태</h1>
          <p className="text-gray-600">
            {contract.si_partner_name} • {contract.amount.toLocaleString('ko-KR')}원
          </p>
        </div>

        {/* Status Banner */}
        {contract.status === 'disputed' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">분쟁이 접수되었습니다</p>
                <p className="text-sm text-yellow-800">
                  운영팀에서 중재를 진행하고 있습니다. 자금은 중재 완료 시까지 에스크로에 안전하게 보호됩니다.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate(`/contracts/${contractId}/dispute`)}
                >
                  분쟁 상세 보기
                </Button>
              </div>
            </div>
          </div>
        )}

        {escrow.state === 'held' && contract.status !== 'disputed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-1">
                  에스크로 예치가 완료되었습니다!
                </p>
                <p className="text-sm text-green-800">
                  자금이 안전하게 보호되고 있습니다. 시공이 완료되면 검수를 진행해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <Card>
          <CardHeader>
            <CardTitle>처리 단계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex gap-4">
                  {/* Step Number */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step.completed
                          ? 'bg-green-600 text-white'
                          : currentStep === step.number
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-16 ${
                          step.completed ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-8">
                    <h3 className="font-semibold mb-1">
                      {step.completed ? step.completedTitle : step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {step.description}
                    </p>

                    {/* Additional Info */}
                    {step.number === 1 && step.completed && escrow.held_at && (
                      <p className="text-xs text-gray-500">
                        입금 확인: {new Date(escrow.held_at).toLocaleString('ko-KR')}
                      </p>
                    )}
                    {step.number === 2 && step.completed && escrow.admin_verified_at && (
                      <p className="text-xs text-gray-500">
                        Admin 확인: {new Date(escrow.admin_verified_at).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Escrow Details */}
        <Card>
          <CardHeader>
            <CardTitle>에스크로 상세 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">예치 금액</span>
              <span className="font-semibold">
                {escrow.amount.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">현재 상태</span>
              <Badge
                variant={
                  escrow.state === 'held' ? 'default' :
                  escrow.state === 'pending' ? 'secondary' :
                  'outline'
                }
              >
                {escrow.state === 'pending' && '입금 대기'}
                {escrow.state === 'held' && '예치 완료'}
                {escrow.state === 'released' && '방출 완료'}
                {escrow.state === 'refunded' && '환불 완료'}
              </Badge>
            </div>
            {escrow.held_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">예치 완료 시각</span>
                <span className="font-semibold">
                  {new Date(escrow.held_at).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Polling Indicator */}
        {polling && escrow.state === 'pending' && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>30초마다 자동으로 상태를 확인하고 있습니다...</span>
          </div>
        )}

        {/* Re-show Bank Info if still pending */}
        {escrow.state === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>입금 계좌 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">은행</span>
                  <span className="font-semibold">{BANK_ACCOUNT_INFO.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">계좌번호</span>
                  <span className="font-semibold">{BANK_ACCOUNT_INFO.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예금주</span>
                  <span className="font-semibold">{BANK_ACCOUNT_INFO.account_holder}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/my/contracts')}
          >
            계약 목록으로
          </Button>
          {escrow.state === 'held' && (
            <Button
              className="flex-1 gap-2"
              onClick={() => navigate(`/contracts/${contractId}/warranty`)}
            >
              보증서 확인하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
