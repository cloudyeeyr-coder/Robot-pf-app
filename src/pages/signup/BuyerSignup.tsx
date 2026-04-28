import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../app/components/ui/select';
import { toast } from 'sonner';
import { buyerSignupSchema, type BuyerSignupInput } from '../../lib/schemas/auth';
import { formatBizRegistrationNo, formatPhoneNumber } from '../../lib/formatters';

export function BuyerSignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BuyerSignupInput>({
    resolver: zodResolver(buyerSignupSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: BuyerSignupInput) => {
    setLoading(true);

    try {
      // TODO: Firebase Firestore에 buyer_companies 컬렉션에 저장
      // TODO: Firebase Auth 사용자 생성
      // TODO: event_logs 컬렉션에 signup_complete 이벤트 로깅

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 중복 체크 시뮬레이션 (409 에러)
      if (data.biz_registration_no === '123-45-67890') {
        toast.error('이미 등록된 사업자등록번호입니다');
        return;
      }

      console.log('Buyer signup data (PII masked):', {
        ...data,
        contact_phone: '***-****-' + data.contact_phone.slice(-4),
        contact_email: data.contact_email.replace(/(.{2}).*@/, '$1***@'),
      });

      toast.success('회원가입이 완료되었습니다!');
      navigate('/search');
    } catch (error) {
      console.error('Signup failed:', error);
      toast.error('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">수요기업 회원가입</CardTitle>
            <CardDescription>
              로봇 SI 파트너 매칭 서비스를 이용하실 기업 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 회사 정보 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">회사 정보</h3>

                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    회사명 <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    {...register('company_name')}
                    aria-describedby={errors.company_name ? 'company_name-error' : undefined}
                    aria-invalid={!!errors.company_name}
                  />
                  {errors.company_name && (
                    <p id="company_name-error" className="text-sm text-red-600" role="alert">
                      {errors.company_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biz_registration_no">
                    사업자등록번호 <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="biz_registration_no"
                    placeholder="123-45-67890"
                    {...register('biz_registration_no')}
                    onChange={(e) => {
                      const formatted = formatBizRegistrationNo(e.target.value);
                      setValue('biz_registration_no', formatted);
                    }}
                    aria-describedby={errors.biz_registration_no ? 'biz-error' : undefined}
                    aria-invalid={!!errors.biz_registration_no}
                    maxLength={12}
                  />
                  {errors.biz_registration_no && (
                    <p id="biz-error" className="text-sm text-red-600" role="alert">
                      {errors.biz_registration_no.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">
                      지역 <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('region', value as any)}
                      defaultValue={watch('region')}
                    >
                      <SelectTrigger id="region" aria-describedby={errors.region ? 'region-error' : undefined}>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="서울">서울</SelectItem>
                        <SelectItem value="경기">경기</SelectItem>
                        <SelectItem value="인천">인천</SelectItem>
                        <SelectItem value="부산">부산</SelectItem>
                        <SelectItem value="대구">대구</SelectItem>
                        <SelectItem value="광주">광주</SelectItem>
                        <SelectItem value="대전">대전</SelectItem>
                        <SelectItem value="울산">울산</SelectItem>
                        <SelectItem value="세종">세종</SelectItem>
                        <SelectItem value="강원">강원</SelectItem>
                        <SelectItem value="충북">충북</SelectItem>
                        <SelectItem value="충남">충남</SelectItem>
                        <SelectItem value="전북">전북</SelectItem>
                        <SelectItem value="전남">전남</SelectItem>
                        <SelectItem value="경북">경북</SelectItem>
                        <SelectItem value="경남">경남</SelectItem>
                        <SelectItem value="제주">제주</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.region && (
                      <p id="region-error" className="text-sm text-red-600" role="alert">
                        {errors.region.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segment">
                      기업 규모 <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => setValue('segment', value as any)}
                      defaultValue={watch('segment')}
                    >
                      <SelectTrigger id="segment" aria-describedby={errors.segment ? 'segment-error' : undefined}>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1 (매출 1000억 이상)</SelectItem>
                        <SelectItem value="Q2">Q2 (매출 500-1000억)</SelectItem>
                        <SelectItem value="Q3">Q3 (매출 100-500억)</SelectItem>
                        <SelectItem value="Q4">Q4 (매출 100억 미만)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.segment && (
                      <p id="segment-error" className="text-sm text-red-600" role="alert">
                        {errors.segment.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 담당자 정보 */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg">담당자 정보</h3>

                <div className="space-y-2">
                  <Label htmlFor="contact_name">
                    담당자명 <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="contact_name"
                    {...register('contact_name')}
                    aria-describedby={errors.contact_name ? 'contact_name-error' : undefined}
                    aria-invalid={!!errors.contact_name}
                  />
                  {errors.contact_name && (
                    <p id="contact_name-error" className="text-sm text-red-600" role="alert">
                      {errors.contact_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">
                    이메일 <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="your@company.com"
                    {...register('contact_email')}
                    aria-describedby={errors.contact_email ? 'email-error' : undefined}
                    aria-invalid={!!errors.contact_email}
                  />
                  {errors.contact_email && (
                    <p id="email-error" className="text-sm text-red-600" role="alert">
                      {errors.contact_email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">
                    연락처 <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="contact_phone"
                    placeholder="010-1234-5678"
                    {...register('contact_phone')}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setValue('contact_phone', formatted);
                    }}
                    aria-describedby={errors.contact_phone ? 'phone-error' : undefined}
                    aria-invalid={!!errors.contact_phone}
                    maxLength={13}
                  />
                  {errors.contact_phone && (
                    <p id="phone-error" className="text-sm text-red-600" role="alert">
                      {errors.contact_phone.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '가입 중...' : '회원가입'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
