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
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getProposalsBySiPartnerId,
  respondToProposal,
  getDaysUntilDeadline,
  type PartnerProposal,
} from '../../lib/mockBadges';
import { useAuth } from '../../contexts/AuthContext';

const rejectReasonSchema = z.object({
  reason: z.string().max(500, '최대 500자까지 입력 가능합니다').optional(),
});

type RejectReasonInput = z.infer<typeof rejectReasonSchema>;

export function PartnerProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<PartnerProposal[]>([]);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<PartnerProposal | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const siPartnerId = 'si-0005'; // Mock SI partner ID

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RejectReasonInput>({
    resolver: zodResolver(rejectReasonSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = () => {
    const allProposals = getProposalsBySiPartnerId(siPartnerId);
    setProposals(allProposals);
  };

  const handleAcceptClick = (proposal: PartnerProposal) => {
    setSelectedProposal(proposal);
    setAcceptModalOpen(true);
  };

  const handleRejectClick = (proposal: PartnerProposal) => {
    setSelectedProposal(proposal);
    setRejectModalOpen(true);
  };

  const confirmAccept = async () => {
    if (!selectedProposal) return;

    try {
      // TODO: Server Action to respond to proposal in Firestore
      respondToProposal(selectedProposal.id, true);

      toast.success('파트너십이 체결되었습니다!');
      loadProposals();
      setAcceptModalOpen(false);
      setSelectedProposal(null);
    } catch (error) {
      console.error('Accept failed:', error);
      toast.error('제안 수락에 실패했습니다');
    }
  };

  const onSubmitReject = async (data: RejectReasonInput) => {
    if (!selectedProposal) return;

    try {
      // TODO: Server Action to respond to proposal in Firestore
      respondToProposal(selectedProposal.id, false, data.reason);

      toast.success('제안을 거절했습니다');
      loadProposals();
      setRejectModalOpen(false);
      setSelectedProposal(null);
      reset();
    } catch (error) {
      console.error('Reject failed:', error);
      toast.error('제안 거절에 실패했습니다');
    }
  };

  const getStatusBadge = (status: PartnerProposal['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">대기 중</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-600">수락됨</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거절됨</Badge>;
      case 'expired':
        return <Badge variant="secondary">기한 만료</Badge>;
    }
  };

  const getDeadlineText = (proposal: PartnerProposal) => {
    if (proposal.status !== 'pending') {
      return new Date(proposal.deadline).toLocaleDateString('ko-KR');
    }

    const daysLeft = getDaysUntilDeadline(proposal.deadline);
    if (daysLeft < 0) {
      return <span className="text-red-600">기한 초과</span>;
    }
    if (daysLeft <= 2) {
      return (
        <span className="text-red-600 font-semibold">
          D-{daysLeft}
        </span>
      );
    }
    return <span>D-{daysLeft}</span>;
  };

  const filteredProposals = proposals.filter(p => {
    if (activeTab === 'all') return true;
    return p.status === activeTab;
  });

  const statusCounts = {
    all: proposals.length,
    pending: proposals.filter(p => p.status === 'pending').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
    expired: proposals.filter(p => p.status === 'expired').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">파트너십 제안</h1>
        <p className="text-gray-600">제조사로부터 받은 파트너십 제안</p>
      </div>

      {/* Proposals Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>제안 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">전체 ({statusCounts.all})</TabsTrigger>
              <TabsTrigger value="pending">대기 중 ({statusCounts.pending})</TabsTrigger>
              <TabsTrigger value="accepted">수락됨 ({statusCounts.accepted})</TabsTrigger>
              <TabsTrigger value="rejected">거절됨 ({statusCounts.rejected})</TabsTrigger>
              <TabsTrigger value="expired">만료됨 ({statusCounts.expired})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제조사명</TableHead>
                      <TableHead>제안일</TableHead>
                      <TableHead>응답 기한</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>메시지</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          제안 내역이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProposals.map((proposal) => {
                        const daysLeft = getDaysUntilDeadline(proposal.deadline);
                        const isExpiringSoon = daysLeft >= 0 && daysLeft <= 2;

                        return (
                          <TableRow
                            key={proposal.id}
                            className={isExpiringSoon && proposal.status === 'pending' ? 'bg-yellow-50' : ''}
                          >
                            <TableCell className="font-medium">
                              {proposal.manufacturer_name}
                            </TableCell>
                            <TableCell>
                              {new Date(proposal.sent_at).toLocaleDateString('ko-KR')}
                            </TableCell>
                            <TableCell>{getDeadlineText(proposal)}</TableCell>
                            <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm text-gray-600 truncate">
                                {proposal.message || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {proposal.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleAcceptClick(proposal)}
                                  >
                                    수락
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectClick(proposal)}
                                  >
                                    거절
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Accept Confirmation Modal */}
      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>제안 수락</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold mb-1">파트너십 체결 확인</p>
                <p>제안을 수락하면 자동으로 파트너십 뱃지가 발급됩니다.</p>
              </div>
            </div>

            {selectedProposal && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">제조사</p>
                  <p className="font-semibold">{selectedProposal.manufacturer_name}</p>
                </div>
                {selectedProposal.message && (
                  <div>
                    <p className="text-sm text-gray-600">제안 메시지</p>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedProposal.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAcceptModalOpen(false);
                setSelectedProposal(null);
              }}
            >
              취소
            </Button>
            <Button onClick={confirmAccept}>
              수락하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>제안 거절</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-semibold mb-1">제안 거절</p>
                <p>거절 시 제조사에게 알림이 전송됩니다.</p>
              </div>
            </div>

            {selectedProposal && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">제조사</p>
                <p className="font-semibold">{selectedProposal.manufacturer_name}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitReject)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">거절 사유 (선택사항)</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  placeholder="거절 사유를 작성해주세요"
                  rows={4}
                  aria-describedby={errors.reason ? 'reason-error' : undefined}
                  aria-invalid={!!errors.reason}
                />
                {errors.reason && (
                  <p id="reason-error" className="text-sm text-red-600" role="alert">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setSelectedProposal(null);
                    reset();
                  }}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                  {isSubmitting ? '처리 중...' : '거절하기'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
