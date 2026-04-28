import { Link } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../app/components/ui/card';
import { Search, Calculator, Shield, Award } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            로봇 SI 안심 보증 매칭 플랫폼
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            검증된 SI 파트너를 찾고, 에스크로로 안전하게 계약하고,
            <br />
            만약의 상황에서도 AS를 보장받으세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/search">
              <Button size="lg">SI 파트너 찾기</Button>
            </Link>
            <Link to="/calculator">
              <Button size="lg" variant="outline">RaaS 계산기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            왜 우리 플랫폼인가요?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Search className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>검증된 SI 검색</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  재무등급, 시공 성공률, 제조사 인증 뱃지로 검증된 파트너만 만나세요
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>에스크로 보호</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  시공 완료 및 검수 승인 전까지 플랫폼이 자금을 안전하게 보관합니다
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>긴급 AS 보증</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  SI 부도/폐업 시에도 24시간 내 대체 엔지니어가 출동합니다
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calculator className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>RaaS 계산기</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  일시불, 리스, RaaS 옵션을 비교하고 최적의 투자 방식을 선택하세요
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg mb-8 text-blue-100">
            수요기업이신가요? SI 파트너이신가요?
            <br />
            각 역할에 맞는 서비스를 제공합니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup/buyer">
              <Button size="lg" variant="secondary">수요기업 가입</Button>
            </Link>
            <Link to="/signup/partner">
              <Button size="lg" variant="outline" className="text-white border-white bg-blue-600 hover:bg-blue-700">SI 파트너 가입</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
