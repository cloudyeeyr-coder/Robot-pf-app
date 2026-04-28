import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../app/components/ui/card';
import { Badge } from '../app/components/ui/badge';
import { Progress } from '../app/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../app/components/ui/tabs';
import { Skeleton } from '../app/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Download,
  Star,
  Award,
  TrendingUp,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { MOCK_SI_PARTNERS } from '../lib/mockData';
import type { SiPartner } from '../lib/mockData';

export function SiPartnerDetailPage() {
  const { siPartnerId } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<SiPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      const found = MOCK_SI_PARTNERS.find((p) => p.id === siPartnerId);
      if (found) {
        setPartner(found);
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [siPartnerId]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);

    try {
      // TODO: POST /api/reports/pdf
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock download
      toast.success('PDF 다운로드가 완료되었습니다');

      // In production: trigger actual download
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `SI리포트_${partner?.company_name}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.pdf`;
      // a.click();
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">파트너를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">
            요청하신 SI 파트너 정보가 존재하지 않습니다
          </p>
          <Button onClick={() => navigate('/search')}>검색으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const tierColors = {
    Diamond: 'bg-blue-600 text-white',
    Gold: 'bg-yellow-500 text-white',
    Silver: 'bg-gray-400 text-white',
  };

  const activeBadges = partner.badges.filter((b) => {
    const now = new Date();
    const expiresAt = new Date(b.expires_at);
    return b.is_active && expiresAt > now;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{partner.company_name}</h1>
                  <Badge className={tierColors[partner.tier]}>{partner.tier}</Badge>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    주요 활동 지역: {partner.region}
                  </p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    가입일: {new Date(partner.registered_at).toLocaleDateString('ko-KR')} •
                    마지막 업데이트: {new Date(partner.updated_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {downloadingPdf ? 'PDF 생성 중...' : '기술 리포트 PDF'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Financial Grade */}
          <Card className="relative overflow-hidden border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  재무등급
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="text-4xl font-extrabold text-blue-600 tracking-tighter mb-2">
                  {partner.financial_grade}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-500 tracking-wide">
                    갱신일: {new Date(partner.financial_grade_updated_at).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-xs font-medium text-gray-400 tracking-wide">
                    ℹ️ 운영팀 사전 업데이트 기반
                  </p>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Success Rate */}
          <Card className="relative overflow-hidden border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  시공 성공률
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="text-4xl font-extrabold text-green-600 tracking-tighter mb-3">
                  {partner.success_rate}<span className="text-2xl font-bold ml-1">%</span>
                </div>
                <div className="relative pt-1 w-full mb-3">
                  <Progress value={partner.success_rate} className="h-2" />
                </div>
                <p className="text-xs font-medium text-gray-500 tracking-wide">
                  완료 {partner.completed_projects}건 / 실패 {partner.failed_projects}건
                </p>
              </CardContent>
            </div>
          </Card>

          {/* Average Rating */}
          <Card className="relative overflow-hidden border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  평균 평점
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                  <span className="text-4xl font-extrabold text-gray-900 tracking-tighter">{partner.average_rating}</span>
                </div>
                <p className="text-xs font-medium text-gray-500 tracking-wide mt-2">
                  {partner.review_count}개의 리뷰 기반
                </p>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Tabs Section */}
        <Card>
          <Tabs defaultValue="capabilities" className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="capabilities">역량 & 태그</TabsTrigger>
                <TabsTrigger value="badges">인증 뱃지</TabsTrigger>
                <TabsTrigger value="reviews">리뷰 요약</TabsTrigger>
              </TabsList>
            </div>

            {/* Capabilities Tab */}
            <TabsContent value="capabilities" className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    기술 역량 태그
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {partner.capability_tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">프로젝트 이력</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-gray-600">완료 프로젝트</div>
                      <div className="text-2xl font-bold text-green-600">
                        {partner.completed_projects}건
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-gray-600">실패 프로젝트</div>
                      <div className="text-2xl font-bold text-red-600">
                        {partner.failed_projects}건
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges" className="p-6">
              <div className="space-y-3">
                {partner.badges.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    등록된 인증 뱃지가 없습니다
                  </p>
                ) : (
                  partner.badges.map((badge) => {
                    const now = new Date();
                    const expiresAt = new Date(badge.expires_at);
                    const isExpired = expiresAt < now || !badge.is_active;

                    return (
                      <div
                        key={badge.id}
                        className={`p-4 border rounded-lg ${
                          isExpired ? 'bg-gray-50 opacity-60' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Award
                              className={`h-8 w-8 ${
                                isExpired ? 'text-gray-400' : 'text-blue-600'
                              }`}
                            />
                            <div>
                              <div className="font-semibold">
                                {badge.manufacturer_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                발급일: {new Date(badge.issued_at).toLocaleDateString('ko-KR')}
                              </div>
                              <div className="text-sm text-gray-600">
                                만료일: {new Date(badge.expires_at).toLocaleDateString('ko-KR')}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant={isExpired ? 'secondary' : 'default'}
                            className={
                              isExpired
                                ? 'bg-gray-300'
                                : 'bg-green-600 text-white'
                            }
                          >
                            {isExpired ? '만료됨' : '활성'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="p-6">
              {!partner.review_summary ? (
                <p className="text-gray-500 text-center py-8">
                  아직 리뷰 요약이 없습니다
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-green-600">
                      👍 긍정적인 피드백
                    </h3>
                    <ul className="space-y-1">
                      {partner.review_summary.positive.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 text-orange-600">
                      💡 개선 요청 사항
                    </h3>
                    <ul className="space-y-1">
                      {partner.review_summary.negative.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">종합 평가</h3>
                    <p className="text-sm text-gray-700">
                      {partner.review_summary.overall}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
