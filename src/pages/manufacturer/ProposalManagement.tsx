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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../app/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../app/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  getProposalsByManufacturerId,
  sendProposal,
  getDaysUntilDeadline,
  getBadgesBySiPartnerId,
  type PartnerProposal,
} from '../../lib/mockBadges';
import { MOCK_SI_PARTNERS } from '../../lib/mockData';
import { useAuth } from '../../contexts/AuthContext';

const sendProposalSchema = z.object({
  si_partner_id: z.string().min(1, 'SI 파트너를 선택해주세요'),
  message: z.string().max(1000, '최대 1000자까지 입력 가능합니다').optional(),
});

type SendProposalInput = z.infer<typeof sendProposalSchema>;

export function ProposalManagementPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<PartnerProposal[]>([]);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const manufacturerId = 'mfr-ur';
  const manufacturerName = 'Universal Robots';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<SendProposalInput>({
    resolver: zodResolver(sendProposalSchema),
    mode: 'onChange',
  });

  const selectedPartnerId = watch('si_partner_id');
  const selectedPartner = MOCK_SI_PARTNERS.find(p => p.id === selectedPartnerId);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = () => {
    const allProposals = getProposalsByManufacturerId(manufacturerId);
    setProposals(allProposals);
  };

  // Filter partners: prioritize those without active badge from this manufacturer
  const filteredPartners = MOCK_SI_PARTNERS.filter((p) => {
    const matchesSearch =
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  }).sort((a, b) => {
    // Partners without badges come first
    const aBadges = getBadgesBySiPartnerId(a.id).filter(
      badge => badge.manufacturer_id === manufacturerId && badge.is_active
    );
    const bBadges = getBadgesBySiPartnerId(b.id).filter(
      badge => badge.manufacturer_id === manufacturerId && badge.is_active
    );

    if (aBadges.length === 0 && bBadges.length > 0) return -1;
    if (aBadges.length > 0 && bBadges.length === 0) return 1;
    return 0;
  });

  const onSubmit = async (data: SendProposalInput) => {
    try {
      // Check for duplicate pending proposal
      const existingProposal = proposals.find(
        p => p.si_partner_id === data.si_partner_id && p.status === 'pending'
      );

      if (existingProposal) {
        toast.error('이미 대기 중인 제안이 있습니다');
        return;
      }

      const partner = MOCK_SI_PARTNERS.find(p => p.id === data.si_partner_id);
      if (!partner) {
        toast.error('파트너를 찾을 수 없습니다');
        return;
      }

      // TODO: Server Action to create proposal in Firestore
      const newProposal = sendProposal(
        manufacturerId,
        manufacturerName,
        data.si_partner_id,
        partner.company_name,
        data.message
      );

      toast.success(`${partner.company_name}에 제안이 발송되었습니다. SI의 응답 기한은 5영업일입니다.`);
      loadProposals();
      setSendModalOpen(false);
      reset();
    } catch (error) {
      console.error('Proposal send failed:', error);
      toast.error('제안 발송에 실패했습니다');
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
      return <span className="text-red-600">D-{daysLeft}</span>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">파트너 제안</h1>
          <p className="text-gray-600">SI 파트너에게 파트너십 제안 발송</p>
        </div>
        <Button onClick={() => setSendModalOpen(true)}>
          파트너 제안 발송
        </Button>
      </div>

      {/* Proposals Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>제안 현황</CardTitle>
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
                      <TableHead>파트너사명</TableHead>
                      <TableHead>발송일</TableHead>
                      <TableHead>응답 기한</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>메시지</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          제안 내역이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProposals.map((proposal) => (
                        <TableRow key={proposal.id}>
                          <TableCell className="font-medium">
                            {proposal.si_partner_name}
                          </TableCell>
                          <TableCell>
                            {new Date(proposal.sent_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>{getDeadlineText(proposal)}</TableCell>
                          <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-gray-600">
                            {proposal.message || '-'}
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

      {/* Send Proposal Modal */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>파트너 제안 발송</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* SI Partner Combobox */}
            <div className="space-y-2">
              <Label htmlFor="si_partner">
                SI 파트너 <span className="text-red-600">*</span>
              </Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="si_partner"
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboboxOpen}
                    className="w-full justify-between"
                    aria-invalid={!!errors.si_partner_id}
                  >
                    {selectedPartner ? selectedPartner.company_name : 'SI 파트너 선택...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="파트너사명 검색..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>파트너를 찾을 수 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {filteredPartners.map((partner) => {
                          const hasBadge = getBadgesBySiPartnerId(partner.id).some(
                            badge => badge.manufacturer_id === manufacturerId && badge.is_active
                          );

                          return (
                            <CommandItem
                              key={partner.id}
                              value={partner.id}
                              onSelect={() => {
                                setValue('si_partner_id', partner.id, { shouldValidate: true });
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedPartnerId === partner.id ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              <div className="flex-1">
                                {partner.company_name}
                                {hasBadge && (
                                  <span className="ml-2 text-xs text-gray-500">(뱃지 보유)</span>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500">
                뱃지가 없는 파트너가 우선 표시됩니다
              </p>
              {errors.si_partner_id && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.si_partner_id.message}
                </p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">제안 메시지 (선택사항)</Label>
              <Textarea
                id="message"
                {...register('message')}
                placeholder="파트너에게 전달할 메시지를 작성해주세요"
                rows={4}
                aria-describedby={errors.message ? 'message-error' : undefined}
                aria-invalid={!!errors.message}
              />
              <div className="flex justify-between text-xs">
                <span>
                  {errors.message && (
                    <span id="message-error" className="text-red-600" role="alert">
                      {errors.message.message}
                    </span>
                  )}
                </span>
                <span className="text-gray-500">
                  {watch('message')?.length || 0}/1000
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSendModalOpen(false);
                  reset();
                }}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '발송 중...' : '파트너 제안 발송'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
