import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
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
import { Calendar } from '../../app/components/ui/calendar';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Check, ChevronsUpDown, CalendarIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getBadgesByManufacturerId,
  issueBadge,
  revokeBadge,
  getDaysUntilExpiry,
  type Badge as BadgeType,
} from '../../lib/mockBadges';
import { MOCK_SI_PARTNERS } from '../../lib/mockData';
import { useAuth } from '../../contexts/AuthContext';

const issueBadgeSchema = z.object({
  si_partner_id: z.string().min(1, 'SI 파트너를 선택해주세요'),
  expires_at: z.date({ required_error: '만료일을 선택해주세요' }),
  memo: z.string().max(500, '최대 500자까지 입력 가능합니다').optional(),
});

type IssueBadgeInput = z.infer<typeof issueBadgeSchema>;

const revokeBadgeSchema = z.object({
  reason: z.string()
    .min(10, '철회 사유를 최소 10자 이상 입력해주세요')
    .max(500, '최대 500자까지 입력 가능합니다'),
});

type RevokeBadgeInput = z.infer<typeof revokeBadgeSchema>;

export function BadgeManagementPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const manufacturerId = 'mfr-ur';
  const manufacturerName = 'Universal Robots';

  const {
    register: registerIssue,
    handleSubmit: handleSubmitIssue,
    formState: { errors: issueErrors, isSubmitting: isIssuing },
    setValue: setIssueValue,
    watch: watchIssue,
    reset: resetIssue,
  } = useForm<IssueBadgeInput>({
    resolver: zodResolver(issueBadgeSchema),
    mode: 'onChange',
  });

  const {
    register: registerRevoke,
    handleSubmit: handleSubmitRevoke,
    formState: { errors: revokeErrors, isSubmitting: isRevoking },
    reset: resetRevoke,
  } = useForm<RevokeBadgeInput>({
    resolver: zodResolver(revokeBadgeSchema),
    mode: 'onChange',
  });

  const selectedPartnerId = watchIssue('si_partner_id');
  const selectedDate = watchIssue('expires_at');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = () => {
    const allBadges = getBadgesByManufacturerId(manufacturerId);
    setBadges(allBadges);
  };

  const filteredPartners = MOCK_SI_PARTNERS.filter(
    (p) =>
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPartner = MOCK_SI_PARTNERS.find(p => p.id === selectedPartnerId);

  const onSubmitIssue = async (data: IssueBadgeInput) => {
    try {
      // Check for existing active badge
      const existingBadge = badges.find(
        b =>
          b.si_partner_id === data.si_partner_id &&
          b.is_active &&
          new Date(b.expires_at) > new Date()
      );

      if (existingBadge) {
        toast.error('이미 활성 뱃지가 존재합니다');
        return;
      }

      const partner = MOCK_SI_PARTNERS.find(p => p.id === data.si_partner_id);
      if (!partner) {
        toast.error('파트너를 찾을 수 없습니다');
        return;
      }

      // TODO: Server Action to create badge in Firestore
      const newBadge = issueBadge(
        data.si_partner_id,
        partner.company_name,
        manufacturerId,
        manufacturerName,
        data.expires_at.toISOString()
      );

      toast.success(`${partner.company_name}에 뱃지가 발급되었습니다`);
      loadBadges();
      setIssueModalOpen(false);
      resetIssue();
    } catch (error) {
      console.error('Badge issuance failed:', error);
      toast.error('뱃지 발급에 실패했습니다');
    }
  };

  const onSubmitRevoke = async (data: RevokeBadgeInput) => {
    if (!selectedBadge) return;

    try {
      // TODO: Server Action to revoke badge in Firestore
      revokeBadge(selectedBadge.id, data.reason);

      toast.success(`${selectedBadge.si_partner_name}의 뱃지가 철회되었습니다`);
      loadBadges();
      setRevokeModalOpen(false);
      setSelectedBadge(null);
      resetRevoke();
    } catch (error) {
      console.error('Badge revocation failed:', error);
      toast.error('뱃지 철회에 실패했습니다');
    }
  };

  const handleRevokeClick = (badge: BadgeType) => {
    setSelectedBadge(badge);
    setRevokeModalOpen(true);
  };

  const getStatusBadge = (badge: BadgeType) => {
    if (badge.revoked_at) {
      return <Badge variant="destructive">철회됨</Badge>;
    }
    if (!badge.is_active || new Date(badge.expires_at) < new Date()) {
      return <Badge variant="secondary">만료됨</Badge>;
    }

    const daysLeft = getDaysUntilExpiry(badge.expires_at);
    if (daysLeft <= 7) {
      return <Badge variant="destructive">활성 (D-{daysLeft})</Badge>;
    }
    if (daysLeft <= 30) {
      return <Badge className="bg-yellow-500">활성 (D-{daysLeft})</Badge>;
    }
    return <Badge variant="default">활성</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">뱃지 관리</h1>
          <p className="text-gray-600">파트너 인증 뱃지 발급 및 관리</p>
        </div>
        <Button onClick={() => setIssueModalOpen(true)}>
          뱃지 발급
        </Button>
      </div>

      {/* Badge Table */}
      <Card>
        <CardHeader>
          <CardTitle>발급 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파트너사명</TableHead>
                  <TableHead>발급일</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>철회일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      발급된 뱃지가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  badges.map((badge) => {
                    const daysLeft = getDaysUntilExpiry(badge.expires_at);
                    const isExpiringSoon = daysLeft > 0 && daysLeft <= 7;

                    return (
                      <TableRow
                        key={badge.id}
                        className={isExpiringSoon ? 'bg-yellow-50' : ''}
                      >
                        <TableCell className="font-medium">
                          {badge.si_partner_name}
                        </TableCell>
                        <TableCell>
                          {new Date(badge.issued_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {new Date(badge.expires_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>{getStatusBadge(badge)}</TableCell>
                        <TableCell>
                          {badge.revoked_at
                            ? new Date(badge.revoked_at).toLocaleDateString('ko-KR')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {badge.is_active && !badge.revoked_at && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRevokeClick(badge)}
                            >
                              철회
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Issue Badge Modal */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>뱃지 발급</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitIssue(onSubmitIssue)} className="space-y-4 mt-4">
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
                    aria-invalid={!!issueErrors.si_partner_id}
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
                        {filteredPartners.map((partner) => (
                          <CommandItem
                            key={partner.id}
                            value={partner.id}
                            onSelect={() => {
                              setIssueValue('si_partner_id', partner.id, { shouldValidate: true });
                              setComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedPartnerId === partner.id ? 'opacity-100' : 'opacity-0'
                              }`}
                            />
                            {partner.company_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {issueErrors.si_partner_id && (
                <p className="text-sm text-red-600" role="alert">
                  {issueErrors.si_partner_id.message}
                </p>
              )}
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expires_at">
                만료일 <span className="text-red-600">*</span>
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="expires_at"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    aria-invalid={!!issueErrors.expires_at}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, 'PPP', { locale: ko })
                    ) : (
                      <span>날짜 선택</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setIssueValue('expires_at', date, { shouldValidate: true });
                        setDatePickerOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
              {issueErrors.expires_at && (
                <p className="text-sm text-red-600" role="alert">
                  {issueErrors.expires_at.message}
                </p>
              )}
            </div>

            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="memo">발급 메모 (선택사항)</Label>
              <Textarea
                id="memo"
                {...registerIssue('memo')}
                placeholder="발급 관련 메모를 작성해주세요"
                rows={3}
                aria-describedby={issueErrors.memo ? 'memo-error' : undefined}
                aria-invalid={!!issueErrors.memo}
              />
              {issueErrors.memo && (
                <p id="memo-error" className="text-sm text-red-600" role="alert">
                  {issueErrors.memo.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIssueModalOpen(false);
                  resetIssue();
                }}
                disabled={isIssuing}
              >
                취소
              </Button>
              <Button type="submit" disabled={isIssuing}>
                {isIssuing ? '발급 중...' : '뱃지 발급'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke Badge Modal */}
      <Dialog open={revokeModalOpen} onOpenChange={setRevokeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>뱃지 철회</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">철회 시 주의사항</p>
                <p>철회 시 SI 프로필에서 즉시 비노출됩니다. 이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>

            {selectedBadge && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">대상 파트너</p>
                <p className="font-semibold">{selectedBadge.si_partner_name}</p>
              </div>
            )}

            <form onSubmit={handleSubmitRevoke(onSubmitRevoke)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">
                  철회 사유 <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="reason"
                  {...registerRevoke('reason')}
                  placeholder="철회 사유를 상세히 작성해주세요 (최소 10자)"
                  rows={4}
                  aria-describedby={revokeErrors.reason ? 'reason-error' : undefined}
                  aria-invalid={!!revokeErrors.reason}
                />
                {revokeErrors.reason && (
                  <p id="reason-error" className="text-sm text-red-600" role="alert">
                    {revokeErrors.reason.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRevokeModalOpen(false);
                    setSelectedBadge(null);
                    resetRevoke();
                  }}
                  disabled={isRevoking}
                >
                  취소
                </Button>
                <Button type="submit" variant="destructive" disabled={isRevoking}>
                  {isRevoking ? '철회 중...' : '뱃지 철회'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
