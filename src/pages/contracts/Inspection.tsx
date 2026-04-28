import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Textarea } from '../../app/components/ui/textarea';
import { Label } from '../../app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../app/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { getContractById } from '../../lib/mockContracts';
import { useAuth } from '../../contexts/AuthContext';

export function InspectionPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [approveMemo, setApproveMemo] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCategory, setRejectCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const contractData = getContractById(contractId!);

      if (!contractData) {
        setLoading(false);
        return;
      }

      // Check ownership
      if (contractData.buyer_company_id !== user?.companyId) {
        navigate('/403');
        return;
      }

      // Check if contract is in inspecting status
      if (contractData.status !== 'inspecting') {
        toast.error('이 계약은 검수 단계가 아닙니다');
        navigate('/my/contracts');
        return;
      }

      setContract(contractData);
      setLoading(false);
    };

    loadData();
  }, [contractId, user, navigate]);

  const handleApprove = async () => {
    setSubmitting(true);

    try {
      // TODO: Server Action
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update contract status to release_pending
      // Notify admin
      // Create event log

      toast.success('검수 합격이 승인되었습니다. Admin에게 방출 대기 알림이 전송되었습니다.');
      navigate('/my/contracts');
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('승인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
      setApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) {
      toast.error('거절 사유를 최소 10자 이상 입력해주세요');
      return;
    }

    if (!rejectCategory) {
      toast.error('거절 카테고리를 선택해주세요');
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Server Action
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update contract status to disputed
      // Notify ops team
      // Create dispute record

      toast.success('검수 거절이 접수되었습니다. 분쟁 절차로 전환됩니다.');
      navigate(`/contracts/${contractId}/dispute`);
    } catch (error) {
      console.error('Rejection failed:', error);
      toast.error('거절 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
      setRejectModal(false);
    }
  };

  // Calculate deadline countdown
  const getDeadlineInfo = () => {
    if (!contract?.inspection_deadline) {
      return { daysLeft: 7, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }

    const deadline = new Date(contract.inspection_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let color = 'text-green-600';
    let bgColor = 'bg-green-50';

    if (daysLeft <= 1) {
      color = 'text-red-600';
      bgColor = 'bg-red-50';
    } else if (daysLeft <= 3) {
      color = 'text-orange-600';
      bgColor = 'bg-orange-50';
    }

    return { daysLeft, color, bgColor };
  };

  const deadlineInfo = contract ? getDeadlineInfo() : { daysLeft: 7, color: 'text-gray-600', bgColor: 'bg-gray-100' };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">검수 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">계약을 찾을 수 없습니다</h2>
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
          <h1 className="text-2xl font-bold mb-2">시공 검수</h1>
          <p className="text-gray-600">
            시공이 완료되었습니다. 검수를 진행해주세요.
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
              <span className="font-semibold">
                {contract.amount.toLocaleString('ko-KR')}원
              </span>
            </div>
            {contract.construction_completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">시공 완료일</span>
                <span className="font-semibold">
                  {new Date(contract.construction_completed_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deadline Warning */}
        <Card className={deadlineInfo.bgColor}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className={`h-6 w-6 ${deadlineInfo.color}`} />
              <div className="flex-1">
                <p className={`font-semibold ${deadlineInfo.color}`}>
                  검수 기한 {deadlineInfo.daysLeft > 0 ? `D-${deadlineInfo.daysLeft}` : 'D-Day'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  기한 내 미응답 시 자동으로 분쟁 접수됩니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SI Completion Report Summary */}
        <Card>
          <CardHeader>
            <CardTitle>시공 완료 보고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                SI 파트너가 제출한 시공 완료 보고서입니다.
                현장 확인 후 검수 합격 또는 거절을 선택해주세요.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ※ 실제 환경에서는 시공 보고서 상세 내용이 여기에 표시됩니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Approve Section */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              검수 합격
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              시공이 계약 조건에 맞게 완료되었고, 모든 항목이 정상 작동하는 경우 승인해주세요.
            </p>

            <div className="space-y-2">
              <Label htmlFor="approve-memo">메모 (선택사항)</Label>
              <Textarea
                id="approve-memo"
                placeholder="검수 관련 메모를 작성할 수 있습니다 (최대 500자)"
                value={approveMemo}
                onChange={(e) => setApproveMemo(e.target.value.slice(0, 500))}
                rows={3}
              />
              <p className="text-xs text-gray-500 text-right">
                {approveMemo.length}/500
              </p>
            </div>

            <Button
              onClick={() => setApproveModal(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              검수 합격
            </Button>
          </CardContent>
        </Card>

        {/* Reject Section */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              검수 거절
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              시공 결과가 계약 조건에 미달하거나 문제가 있는 경우 거절할 수 있습니다.
            </p>

            <div className="space-y-2">
              <Label htmlFor="reject-category">
                거절 사유 카테고리 <span className="text-red-600">*</span>
              </Label>
              <Select value={rejectCategory} onValueChange={setRejectCategory}>
                <SelectTrigger id="reject-category">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">품질 미달</SelectItem>
                  <SelectItem value="spec">사양 불일치</SelectItem>
                  <SelectItem value="delay">납기 지연</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reject-reason">
                상세 사유 <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="거절 사유를 상세히 작성해주세요 (10~1000자)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value.slice(0, 1000))}
                rows={5}
                className={rejectReason.length > 0 && rejectReason.length < 10 ? 'border-red-300' : ''}
              />
              <div className="flex justify-between text-xs">
                <span className={rejectReason.length < 10 ? 'text-red-600' : 'text-gray-500'}>
                  {rejectReason.length < 10 ? `최소 10자 이상 입력해주세요 (현재 ${rejectReason.length}자)` : ''}
                </span>
                <span className="text-gray-500">{rejectReason.length}/1000</span>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  검수 거절 시 분쟁 접수로 전환됩니다. 운영팀이 중재를 진행합니다.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setRejectModal(true)}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              검수 거절
            </Button>
          </CardContent>
        </Card>

        {/* Approve Confirmation Modal */}
        <Dialog open={approveModal} onOpenChange={setApproveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>검수 합격 승인</DialogTitle>
              <DialogDescription>
                검수 합격을 승인하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                승인 시 Admin에게 방출 대기 알림이 전송되며, 에스크로 자금이 SI 파트너에게 지급됩니다.
              </p>
              {approveMemo && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">메모:</p>
                  <p className="text-sm">{approveMemo}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveModal(false)}>
                취소
              </Button>
              <Button onClick={handleApprove} disabled={submitting}>
                {submitting ? '처리 중...' : '승인'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Confirmation Modal */}
        <Dialog open={rejectModal} onOpenChange={setRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>검수 거절 확인</DialogTitle>
              <DialogDescription>
                검수 거절 시 분쟁 접수로 전환됩니다. 계속하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">카테고리:</p>
                  <p className="text-sm font-semibold">
                    {rejectCategory === 'quality' && '품질 미달'}
                    {rejectCategory === 'spec' && '사양 불일치'}
                    {rejectCategory === 'delay' && '납기 지연'}
                    {rejectCategory === 'other' && '기타'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">상세 사유:</p>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                    {rejectReason}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectModal(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={submitting}>
                {submitting ? '처리 중...' : '거절 및 분쟁 접수'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
