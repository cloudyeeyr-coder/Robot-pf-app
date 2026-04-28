import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Textarea } from '../../app/components/ui/textarea';
import { Label } from '../../app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../app/components/ui/radio-group';
import { Input } from '../../app/components/ui/input';
import { toast } from 'sonner';
import { AlertTriangle, Upload, X } from 'lucide-react';
import { getContractById } from '../../lib/mockContracts';
import { createAsTicket } from '../../lib/mockAsTickets';
import { useAuth } from '../../contexts/AuthContext';

const asTicketSchema = z.object({
  symptom_description: z.string()
    .min(20, '증상을 최소 20자 이상 상세히 작성해주세요')
    .max(2000, '최대 2000자까지 입력 가능합니다'),
  priority: z.enum(['normal', 'urgent'], {
    errorMap: () => ({ message: '우선순위를 선택해주세요' })
  }),
});

type AsTicketInput = z.infer<typeof asTicketSchema>;

export function NewAsTicketPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AsTicketInput>({
    resolver: zodResolver(asTicketSchema),
    mode: 'onChange',
    defaultValues: {
      priority: 'normal',
    },
  });

  const priority = watch('priority');

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

      setContract(contractData);
      setLoading(false);
    };

    loadData();
  }, [contractId, user, navigate]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > 5) {
      toast.error('최대 5개까지 업로드 가능합니다');
      return;
    }

    // Check file size (10MB each)
    const oversized = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AsTicketInput) => {
    setSubmitting(true);

    try {
      // TODO: Firebase Storage upload for photos
      // TODO: Server Action to create AS ticket
      // TODO: Notify SI partner and AS company

      // Mock create ticket
      const newTicket = createAsTicket({
        contract_id: contractId!,
        buyer_company_id: contract.buyer_company_id,
        si_partner_id: contract.si_partner_id,
        symptom_description: data.symptom_description,
        priority: data.priority,
        photos: photos.map(p => p.name), // In production: upload URLs
      });

      toast.success(`긴급 AS 요청이 접수되었습니다 (티켓번호: ${newTicket.ticket_number})`);
      navigate(`/contracts/${contractId}/as/${newTicket.id}`);
    } catch (error) {
      console.error('AS ticket creation failed:', error);
      toast.error('요청 접수에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정보를 불러오는 중...</p>
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">긴급 AS 요청</h1>
          <p className="text-gray-600">
            {contract.si_partner_name} • {contract.amount.toLocaleString('ko-KR')}원
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Priority */}
          <Card>
            <CardHeader>
              <CardTitle>
                우선순위 <span className="text-red-600">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={priority}
                onValueChange={(value) => setValue('priority', value as 'normal' | 'urgent')}
              >
                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="normal" id="normal" />
                  <div className="flex-1">
                    <Label htmlFor="normal" className="font-semibold cursor-pointer">
                      일반 AS
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      일반적인 고장이나 문의사항
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <div className="flex-1">
                    <Label htmlFor="urgent" className="font-semibold cursor-pointer">
                      긴급 AS
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      SI 부도·폐업·연락두절로 인한 긴급 상황
                    </p>
                  </div>
                </div>
              </RadioGroup>

              {priority === 'urgent' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      긴급 AS는 SI 파트너의 부도·폐업·연락두절이 확인된 경우에만 접수 가능합니다.
                      4시간 내 엔지니어 배정, 24시간 내 현장 출동이 보장됩니다.
                    </p>
                  </div>
                </div>
              )}

              {errors.priority && (
                <p className="text-sm text-red-600 mt-2" role="alert">
                  {errors.priority.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Symptom Description */}
          <Card>
            <CardHeader>
              <CardTitle>
                증상 설명 <span className="text-red-600">*</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                {...register('symptom_description')}
                placeholder="발생한 문제를 상세히 설명해주세요&#10;&#10;예시:&#10;- 언제부터 문제가 발생했나요?&#10;- 어떤 증상이 나타나나요?&#10;- 생산에 영향을 미치나요?"
                rows={8}
                aria-describedby={errors.symptom_description ? 'symptom-error' : undefined}
                aria-invalid={!!errors.symptom_description}
              />
              <div className="flex justify-between text-xs">
                <span>
                  {errors.symptom_description && (
                    <span id="symptom-error" className="text-red-600" role="alert">
                      {errors.symptom_description.message}
                    </span>
                  )}
                </span>
                <span className="text-gray-500">
                  {watch('symptom_description')?.length || 0}/2000
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>현장 사진 (선택사항)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label
                  htmlFor="photo-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      클릭하여 사진 업로드
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      최대 5개, 각 10MB 이하
                    </p>
                  </div>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg p-2 bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-xs text-gray-600 truncate">
                          {photo.name}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {(photo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/contracts/${contractId}`)}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? '접수 중...' : 'AS 요청 접수'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
