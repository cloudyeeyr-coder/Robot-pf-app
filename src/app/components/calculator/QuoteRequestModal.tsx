import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quoteRequestSchema, type QuoteRequestInput } from '../../../lib/schemas/raas';
import { formatPhoneNumber } from '../../../lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

interface QuoteRequestModalProps {
  open: boolean;
  onClose: () => void;
  selectedPlan: 'capex' | 'lease' | 'raas';
  robotModel: string;
  quantity: number;
  termMonths: string;
}

export function QuoteRequestModal({
  open,
  onClose,
  selectedPlan,
  robotModel,
  quantity,
  termMonths,
}: QuoteRequestModalProps) {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [quoteId, setQuoteId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<QuoteRequestInput>({
    resolver: zodResolver(quoteRequestSchema),
    mode: 'onChange',
    defaultValues: {
      robot_model: robotModel,
      quantity,
      term_months: termMonths,
      selected_plan: selectedPlan,
      contact_name: user?.name || '',
      contact_email: user?.email || '',
      contact_phone: '',
      additional_requests: '',
    },
  });

  const contactPhone = watch('contact_phone');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('contact_phone', formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: QuoteRequestInput) => {
    try {
      // TODO: Server Action to create quote_leads in Firestore
      // TODO: Trigger Firebase Function to notify admin via Slack + email

      // Mock quote creation
      const mockQuoteId = `QUOTE-${Date.now().toString(36).toUpperCase()}`;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setQuoteId(mockQuoteId);
      setSuccess(true);
    } catch (error) {
      console.error('Quote request failed:', error);
      toast.error('요청에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setQuoteId('');
    onClose();
  };

  const planLabels = {
    capex: '일시불 (CAPEX)',
    lease: '리스',
    raas: 'RaaS (OPEX)',
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">요청 완료!</h2>
            <p className="text-gray-600 mb-4">
              운영팀이 2영업일 내 연락드립니다.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">견적 요청 번호</p>
              <p className="font-mono font-semibold text-lg">{quoteId}</p>
            </div>
            <Button onClick={handleClose} className="w-full">
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>견적 요청</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Plan Summary */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-semibold">
              선택한 플랜: {planLabels[selectedPlan]}
            </p>
          </div>

          {/* Robot Model */}
          <div className="space-y-2">
            <Label htmlFor="robot_model">
              로봇 모델 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="robot_model"
              {...register('robot_model')}
              aria-describedby={errors.robot_model ? 'robot-model-error' : undefined}
              aria-invalid={!!errors.robot_model}
            />
            {errors.robot_model && (
              <p id="robot-model-error" className="text-sm text-red-600" role="alert">
                {errors.robot_model.message}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              수량 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              {...register('quantity', { valueAsNumber: true })}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              aria-invalid={!!errors.quantity}
            />
            {errors.quantity && (
              <p id="quantity-error" className="text-sm text-red-600" role="alert">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* Term */}
          <div className="space-y-2">
            <Label htmlFor="term_months">
              계약 기간 <span className="text-red-600">*</span>
            </Label>
            <Select
              value={watch('term_months')}
              onValueChange={(value) => setValue('term_months', value)}
            >
              <SelectTrigger id="term_months">
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12개월</SelectItem>
                <SelectItem value="24">24개월</SelectItem>
                <SelectItem value="36">36개월</SelectItem>
                <SelectItem value="48">48개월</SelectItem>
                <SelectItem value="60">60개월</SelectItem>
              </SelectContent>
            </Select>
            {errors.term_months && (
              <p className="text-sm text-red-600" role="alert">
                {errors.term_months.message}
              </p>
            )}
          </div>

          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="contact_name">
              담당자명 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contact_name"
              {...register('contact_name')}
              aria-describedby={errors.contact_name ? 'contact-name-error' : undefined}
              aria-invalid={!!errors.contact_name}
            />
            {errors.contact_name && (
              <p id="contact-name-error" className="text-sm text-red-600" role="alert">
                {errors.contact_name.message}
              </p>
            )}
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">
              이메일 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contact_email"
              type="email"
              {...register('contact_email')}
              aria-describedby={errors.contact_email ? 'contact-email-error' : undefined}
              aria-invalid={!!errors.contact_email}
            />
            {errors.contact_email && (
              <p id="contact-email-error" className="text-sm text-red-600" role="alert">
                {errors.contact_email.message}
              </p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">
              휴대폰 번호 <span className="text-red-600">*</span>
            </Label>
            <Input
              id="contact_phone"
              type="tel"
              value={contactPhone}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              aria-describedby={errors.contact_phone ? 'contact-phone-error' : undefined}
              aria-invalid={!!errors.contact_phone}
            />
            {errors.contact_phone && (
              <p id="contact-phone-error" className="text-sm text-red-600" role="alert">
                {errors.contact_phone.message}
              </p>
            )}
          </div>

          {/* Additional Requests */}
          <div className="space-y-2">
            <Label htmlFor="additional_requests">
              추가 요청사항 (선택사항)
            </Label>
            <Textarea
              id="additional_requests"
              {...register('additional_requests')}
              placeholder="추가로 문의하실 사항이 있다면 작성해주세요"
              rows={3}
              aria-describedby={errors.additional_requests ? 'additional-error' : undefined}
              aria-invalid={!!errors.additional_requests}
            />
            <div className="flex justify-between text-xs">
              <span>
                {errors.additional_requests && (
                  <span id="additional-error" className="text-red-600" role="alert">
                    {errors.additional_requests.message}
                  </span>
                )}
              </span>
              <span className="text-gray-500">
                {watch('additional_requests')?.length || 0}/500
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? '요청 중...' : '견적 요청하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
