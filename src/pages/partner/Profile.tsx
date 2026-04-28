import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { siPartnerSignupSchema, type SiPartnerSignupInput } from '../../lib/schemas/auth';
import { formatPhoneNumber, formatBizRegistrationNo } from '../../lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { Textarea } from '../../app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../app/components/ui/tabs';
import { Badge } from '../../app/components/ui/badge';
import { TagInput } from '../../app/components/forms/TagInput';
import { Edit, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_SI_PARTNERS } from '../../lib/mockData';

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const SEGMENTS = ['Q1', 'Q2', 'Q3', 'Q4'];

const PREDEFINED_TAGS = [
  '용접', '조립', '도장', '검사', '팔레타이징', '픽앤플레이스',
  'CNC 로딩', 'AGV', '협동로봇', '비전검사',
];

export function PartnerProfilePage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<SiPartnerSignupInput>({
    resolver: zodResolver(siPartnerSignupSchema),
    mode: 'onChange',
  });

  const contactPhone = watch('contact_phone');
  const bizRegistrationNo = watch('biz_registration_no');
  const completedProjects = watch('completed_projects');
  const failedProjects = watch('failed_projects');
  const capabilityTags = watch('capability_tags');

  useEffect(() => {
    // Load profile data
    // In production, fetch from Firestore using user.companyId
    const mockProfile = MOCK_SI_PARTNERS[0]; // Mock data
    setProfileData(mockProfile);

    // Prefill form
    setValue('company_name', mockProfile.company_name);
    setValue('biz_registration_no', '123-45-67890'); // Mock
    setValue('region', mockProfile.region);
    setValue('segment', 'Q2'); // Mock
    setValue('contact_name', '김담당');
    setValue('contact_email', 'contact@example.com');
    setValue('contact_phone', '010-1234-5678');
    setValue('completed_projects', mockProfile.completed_projects);
    setValue('failed_projects', mockProfile.failed_projects);
    setValue('capability_tags', mockProfile.capability_tags);
  }, [user, setValue]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setValue('contact_phone', formatted, { shouldValidate: true });
  };

  const handleBizRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBizRegistrationNo(e.target.value);
    setValue('biz_registration_no', formatted, { shouldValidate: true });
  };

  const calculateSuccessRate = () => {
    const completed = completedProjects || 0;
    const failed = failedProjects || 0;
    const total = completed + failed;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const onSubmit = async (data: SiPartnerSignupInput) => {
    try {
      // TODO: Server Action to update profile in Firestore
      console.log('Profile update:', data);

      toast.success('프로필이 업데이트되었습니다');
      setEditMode(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('프로필 업데이트에 실패했습니다');
    }
  };

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">프로필 관리</h1>
          <div className="flex items-center gap-2">
            <Badge variant={profileData.status === 'approved' ? 'default' : 'secondary'}>
              {profileData.status === 'approved' ? '승인됨' : '검토 대기 중'}
            </Badge>
          </div>
        </div>
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>
            <Edit className="h-4 w-4 mr-2" />
            수정
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditMode(false)}>
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              <Check className="h-4 w-4 mr-2" />
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basics">기본 정보</TabsTrigger>
            <TabsTrigger value="history">시공 이력</TabsTrigger>
            <TabsTrigger value="capabilities">역량 태그</TabsTrigger>
          </TabsList>

          {/* Basics Tab */}
          <TabsContent value="basics">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="company_name">
                      회사명 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="company_name"
                      {...register('company_name')}
                      disabled={!editMode}
                      aria-invalid={!!errors.company_name}
                    />
                    {errors.company_name && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.company_name.message}
                      </p>
                    )}
                  </div>

                  {/* Business Registration No */}
                  <div className="space-y-2">
                    <Label htmlFor="biz_registration_no">
                      사업자등록번호 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="biz_registration_no"
                      value={bizRegistrationNo}
                      onChange={handleBizRegChange}
                      placeholder="000-00-00000"
                      disabled={!editMode}
                      aria-invalid={!!errors.biz_registration_no}
                    />
                    {errors.biz_registration_no && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.biz_registration_no.message}
                      </p>
                    )}
                  </div>

                  {/* Region */}
                  <div className="space-y-2">
                    <Label htmlFor="region">
                      주요 활동 지역 <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      value={watch('region')}
                      onValueChange={(value) => setValue('region', value as any)}
                      disabled={!editMode}
                    >
                      <SelectTrigger id="region">
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.region && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.region.message}
                      </p>
                    )}
                  </div>

                  {/* Segment */}
                  <div className="space-y-2">
                    <Label htmlFor="segment">
                      매출 분위 <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      value={watch('segment')}
                      onValueChange={(value) => setValue('segment', value as any)}
                      disabled={!editMode}
                    >
                      <SelectTrigger id="segment">
                        <SelectValue placeholder="분위 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEGMENTS.map((seg) => (
                          <SelectItem key={seg} value={seg}>
                            {seg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.segment && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.segment.message}
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
                      disabled={!editMode}
                      aria-invalid={!!errors.contact_name}
                    />
                    {errors.contact_name && (
                      <p className="text-sm text-red-600" role="alert">
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
                      disabled={!editMode}
                      aria-invalid={!!errors.contact_email}
                    />
                    {errors.contact_email && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.contact_email.message}
                      </p>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contact_phone">
                      휴대폰 번호 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={contactPhone}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000"
                      disabled={!editMode}
                      aria-invalid={!!errors.contact_phone}
                    />
                    {errors.contact_phone && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.contact_phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>시공 이력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Completed Projects */}
                  <div className="space-y-2">
                    <Label htmlFor="completed_projects">
                      완료 프로젝트 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="completed_projects"
                      type="number"
                      min="0"
                      {...register('completed_projects', { valueAsNumber: true })}
                      disabled={!editMode}
                      aria-invalid={!!errors.completed_projects}
                    />
                    {errors.completed_projects && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.completed_projects.message}
                      </p>
                    )}
                  </div>

                  {/* Failed Projects */}
                  <div className="space-y-2">
                    <Label htmlFor="failed_projects">
                      실패 프로젝트 <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="failed_projects"
                      type="number"
                      min="0"
                      {...register('failed_projects', { valueAsNumber: true })}
                      disabled={!editMode}
                      aria-invalid={!!errors.failed_projects}
                    />
                    {errors.failed_projects && (
                      <p className="text-sm text-red-600" role="alert">
                        {errors.failed_projects.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Success Rate (Read-only) */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-sm text-blue-900 font-semibold">시공 성공률 (자동 계산)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-3xl font-bold text-blue-900">
                      {calculateSuccessRate()}%
                    </div>
                    <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${calculateSuccessRate()}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities">
            <Card>
              <CardHeader>
                <CardTitle>역량 태그</CardTitle>
              </CardHeader>
              <CardContent>
                <TagInput
                  value={capabilityTags || []}
                  onChange={(tags) => setValue('capability_tags', tags, { shouldValidate: true })}
                  suggestions={PREDEFINED_TAGS}
                  maxTags={10}
                  placeholder="역량 태그를 입력하세요 (Enter로 추가)"
                  disabled={!editMode}
                />
                {errors.capability_tags && (
                  <p className="text-sm text-red-600 mt-2" role="alert">
                    {errors.capability_tags.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
