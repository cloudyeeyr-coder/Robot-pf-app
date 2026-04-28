import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Label } from '../../app/components/ui/label';
import { Textarea } from '../../app/components/ui/textarea';
import { Badge } from '../../app/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../app/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../app/components/ui/dialog';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_CONTRACTS, MOCK_ESCROW_TX } from '../../lib/mockContracts';
import { confirmEscrowDeposit, releaseEscrow } from '../../lib/mockAdminData';

const adminMemoSchema = z.object({
  memo: z.string().min(1, '메모를 입력해주세요').max(500, '최대 500자까지 입력 가능합니다'),
});

type AdminMemoInput = z.infer<typeof adminMemoSchema>;

type EscrowState = 'pending' | 'held' | 'released' | 'refunded';

export function EscrowManagementPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | EscrowState>('all');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const {
    register: registerConfirm,
    handleSubmit: handleSubmitConfirm,
    formState: { errors: confirmErrors, isSubmitting: isConfirming },
    reset: resetConfirm,
  } = useForm<AdminMemoInput>({
    resolver: zodResolver(adminMemoSchema),
    mode: 'onChange',
  });

  const {
    register: registerRelease,
    handleSubmit: handleSubmitRelease,
    formState: { errors: releaseErrors, isSubmitting: isReleasing },
    reset: resetRelease,
  } = useForm<AdminMemoInput>({
    resolver: zodResolver(adminMemoSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = () => {
    // Combine contract data with escrow data
    const contractsWithEscrow = MOCK_CONTRACTS.map((contract) => ({
      ...contract,
      escrow: MOCK_ESCROW_TX[contract.id],
    }));
    setContracts(contractsWithEscrow);
  };

  const handleConfirmClick = (contract: any) => {
    setSelectedContract(contract);
    setConfirmModalOpen(true);
  };

  const handleReleaseClick = (contract: any) => {
    setSelectedContract(contract);
    setReleaseModalOpen(true);
  };

  const onSubmitConfirm = async (data: AdminMemoInput) => {
    if (!selectedContract) return;

    try {
      // TODO: Server Action to confirm escrow deposit
      const success = confirmEscrowDeposit(selectedContract.id, data.memo);

      if (success) {
        toast.success('입금이 확인되었습니다');
        loadContracts();
        setConfirmModalOpen(false);
        setSelectedContract(null);
        resetConfirm();
      } else {
        toast.error('입금 확인에 실패했습니다');
      }
    } catch (error) {
      console.error('Confirm deposit failed:', error);
      toast.error('입금 확인에 실패했습니다');
    }
  };

  const onSubmitRelease = async (data: AdminMemoInput) => {
    if (!selectedContract) return;

    try {
      // TODO: Server Action to release escrow
      const success = releaseEscrow(selectedContract.id, data.memo);

      if (success) {
        toast.success('에스크로가 방출되었습니다');
        loadContracts();
        setReleaseModalOpen(false);
        setSelectedContract(null);
        resetRelease();
      } else {
        toast.error('방출 처리에 실패했습니다');
      }
    } catch (error) {
      console.error('Release escrow failed:', error);
      toast.error('방출 처리에 실패했습니다');
    }
  };

  const getStateBadge = (state: EscrowState) => {
    switch (state) {
      case 'pending':
        return <Badge className="bg-yellow-500">예치 대기</Badge>;
      case 'held':
        return <Badge variant="default">예치 완료</Badge>;
      case 'released':
        return <Badge variant="default" className="bg-green-600">방출 완료</Badge>;
      case 'refunded':
        return <Badge variant="destructive">환불됨</Badge>;
      default:
        return <Badge variant="secondary">알 수 없음</Badge>;
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    if (!contract.escrow) return false;
    if (activeTab === 'all') return true;
    return contract.escrow.state === activeTab;
  });

  const statusCounts = {
    all: contracts.filter((c) => c.escrow).length,
    pending: contracts.filter((c) => c.escrow?.state === 'pending').length,
    held: contracts.filter((c) => c.escrow?.state === 'held').length,
    released: contracts.filter((c) => c.escrow?.state === 'released').length,
    refunded: contracts.filter((c) => c.escrow?.state === 'refunded').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">에스크로 관리</h1>
        <p className="text-gray-600">계약금 예치 및 방출 관리</p>
      </div>

      {/* Escrow Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>에스크로 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList>
              <TabsTrigger value="all">전체 ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="pending">예치 대기 ({statusCounts.pending})</TabsTrigger>
              <TabsTrigger value="held">방출 대기 ({statusCounts.held})</TabsTrigger>
              <TabsTrigger value="released">완료 ({statusCounts.released})</TabsTrigger>
              <TabsTrigger value="refunded">환불 ({statusCounts.refunded})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>계약 ID</TableHead>
                      <TableHead>수요기업</TableHead>
                      <TableHead>SI 파트너</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>예치일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          해당하는 에스크로가 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-mono text-sm">
                            {contract.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {contract.buyer_company_name}
                          </TableCell>
                          <TableCell>{contract.si_partner_name}</TableCell>
                          <TableCell>
                            {contract.amount.toLocaleString('ko-KR')}원
                          </TableCell>
                          <TableCell>{getStateBadge(contract.escrow.state)}</TableCell>
                          <TableCell className="text-sm">
                            {contract.escrow.held_at
                              ? new Date(contract.escrow.held_at).toLocaleDateString('ko-KR')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {contract.escrow.state === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmClick(contract)}
                              >
                                입금 확인
                              </Button>
                            )}
                            {contract.escrow.state === 'held' &&
                              contract.status === 'release_pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleReleaseClick(contract)}
                                >
                                  방출 확인
                                </Button>
                              )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirm Deposit Modal */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>입금 확인</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">입금 확인 처리</p>
                <p>입금이 확인되면 에스크로가 예치 상태로 전환됩니다.</p>
              </div>
            </div>

            {selectedContract && (
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-sm text-gray-600">계약 ID</p>
                  <p className="font-mono font-semibold">{selectedContract.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">금액</p>
                  <p className="font-semibold">
                    {selectedContract.amount.toLocaleString('ko-KR')}원
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitConfirm(onSubmitConfirm)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="confirm-memo">
                  관리자 메모 <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="confirm-memo"
                  {...registerConfirm('memo')}
                  placeholder="입금 확인 메모를 작성해주세요"
                  rows={3}
                  aria-describedby={confirmErrors.memo ? 'confirm-memo-error' : undefined}
                  aria-invalid={!!confirmErrors.memo}
                />
                {confirmErrors.memo && (
                  <p id="confirm-memo-error" className="text-sm text-red-600" role="alert">
                    {confirmErrors.memo.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConfirmModalOpen(false);
                    setSelectedContract(null);
                    resetConfirm();
                  }}
                  disabled={isConfirming}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isConfirming}>
                  {isConfirming ? '처리 중...' : '입금 확인'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Release Escrow Modal */}
      <Dialog open={releaseModalOpen} onOpenChange={setReleaseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>에스크로 방출</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold mb-1">수기 송금 완료 확인</p>
                <p>SI 파트너에게 수기로 송금 완료 후 확인 처리해주세요.</p>
              </div>
            </div>

            {selectedContract && (
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-sm text-gray-600">계약 ID</p>
                  <p className="font-mono font-semibold">{selectedContract.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SI 파트너</p>
                  <p className="font-semibold">{selectedContract.si_partner_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">금액</p>
                  <p className="font-semibold">
                    {selectedContract.amount.toLocaleString('ko-KR')}원
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitRelease(onSubmitRelease)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="release-memo">
                  관리자 메모 <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="release-memo"
                  {...registerRelease('memo')}
                  placeholder="방출 처리 메모를 작성해주세요"
                  rows={3}
                  aria-describedby={releaseErrors.memo ? 'release-memo-error' : undefined}
                  aria-invalid={!!releaseErrors.memo}
                />
                {releaseErrors.memo && (
                  <p id="release-memo-error" className="text-sm text-red-600" role="alert">
                    {releaseErrors.memo.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReleaseModalOpen(false);
                    setSelectedContract(null);
                    resetRelease();
                  }}
                  disabled={isReleasing}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isReleasing}>
                  {isReleasing ? '처리 중...' : '방출 확인'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
