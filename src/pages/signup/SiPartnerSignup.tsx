import { useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../app/components/ui/tabs';
import { toast } from 'sonner';
import { siPartnerSignupSchema, type SiPartnerSignupInput } from '../../lib/schemas/auth';
import { formatBizRegistrationNo, formatPhoneNumber, calculateSuccessRate } from '../../lib/formatters';
import { TagInput } from '../../app/components/forms/TagInput';

const PREDEFINED_TAGS = [
  '용접', '조립', '도장', '검사', '팔레타이징',
  '픽앤플레이스', 'CNC 로딩', 'AGV', '협동로봇', '비전검사'
];

export function SiPartnerSignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SiPartnerSignupInput>({
    resolver: zodResolver(siPartnerSignupSchema),
    mode: 'onChange',
    defaultValues: {
      completed_projects: 0,
      failed_projects: 0,
      capability_tags: [],
    },
  });

  const completedProjects = watch('completed_projects') || 0;
  const failedProjects = watch('failed_projects') || 0;
  const capabilityTags = watch('capability_tags') || [];

  const successRate = useMemo(() => {
    return calculateSuccessRate(completedProjects, failedProjects);
  }, [completedProjects, failedProjects]);

  const onSubmit = async (data: SiPartnerSignupInput) => {
    setLoading(true);

    try {
      // TODO: Firestore si_partners 컬렉션에 저장
      // TODO: si_profiles 컬렉션 생성 (status: 'pending_review')
      // TODO: Firebase Auth 사용자 생성

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('SI Partner signup data (PII masked):', {
        ...data,
        contact_phone: '***-****-' + data.contact_phone.slice(-4),
        contact_email: data.contact_email.replace(/(.{2}).*@/, '$1***@'),
        success_rate: successRate,
      });

      toast.success('회원가입 신청이 완료되었습니다!');
      navigate('/signup/partner/pending');
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
            <CardTitle className="text-2xl">SI 파트너 회원가입</CardTitle>
            <CardDescription>
              시스템 통합 파트너로 등록하시려면 아래 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basics" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basics">기본 정보</TabsTrigger>
                  <TabsTrigger value="history">시공 이력</TabsTrigger>
                  <TabsTrigger value="capabilities">역량</TabsTrigger>
                </TabsList>

                {/* 기본 정보 탭 */}
                <TabsContent value="basics" className="space-y-4 mt-6">
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
                        주요 활동 지역 <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        onValueChange={(value) => setValue('region', value as any)}
                        defaultValue={watch('region')}
                      >
                        <SelectTrigger id="region">
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
                        <p className="text-sm text-red-600" role="alert">
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
                        <SelectTrigger id="segment">
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
                        <p className="text-sm text-red-600" role="alert">
                          {errors.segment.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_name">
                      담당자명 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="contact_name"
                      {...register('contact_name')}
                      aria-invalid={!!errors.contact_name}
                    />
                    {errors.contact_name && (
                      <p className="text-sm text-red-600" role="alert">
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
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-red-600" role="alert">
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
                      maxLength={13}
                    />
                    {errors.contact_phone && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.contact_phone.message}
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* 시공 이력 탭 */}
                <TabsContent value="history" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="completed_projects">
                      완료한 프로젝트 수 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="completed_projects"
                      type="number"
                      min="0"
                      {...register('completed_projects', { valueAsNumber: true })}
                    />
                    {errors.completed_projects && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.completed_projects.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="failed_projects">
                      실패한 프로젝트 수 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="failed_projects"
                      type="number"
                      min="0"
                      {...register('failed_projects', { valueAsNumber: true })}
                    />
                    {errors.failed_projects && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.failed_projects.message}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">시공 성공률 (자동 계산)</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {successRate}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      완료 {completedProjects}건 / 전체 {completedProjects + failedProjects}건
                    </div>
                  </div>
                </TabsContent>

                {/* 역량 탭 */}
                <TabsContent value="capabilities" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="capability_tags">
                      기술 역량 태그 <span className="text-red-600">*</span>
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      최소 1개, 최대 10개까지 선택 가능합니다. 목록에 없는 태그도 직접 입력할 수 있습니다.
                    </p>
                    <TagInput
                      value={capabilityTags}
                      onChange={(tags) => setValue('capability_tags', tags)}
                      suggestions={PREDEFINED_TAGS}
                      placeholder="태그를 선택하거나 직접 입력하세요"
                      maxTags={10}
                      error={errors.capability_tags?.message}
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">추천 태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_TAGS.filter(tag => !capabilityTags.includes(tag)).map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (capabilityTags.length < 10) {
                              setValue('capability_tags', [...capabilityTags, tag]);
                            }
                          }}
                          disabled={capabilityTags.length >= 10}
                        >
                          + {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '신청 중...' : '회원가입 신청'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
