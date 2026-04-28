/**
 * Landing.tsx
 * 고객 Hook 단계 랜딩페이지 — C유형 (결과 지향형) 전략 기반
 * 
 * 전략 요약:
 * - 히어로: 명확한 이득 헤드라인 + 핵심 수치 + CTA
 * - 신뢰 증거: 로고월 + 누적 수치
 * - 워크플로우: Input → Platform → Output 3단계 시각화
 * - ROI: Before/After 비교 수치
 * - 결과물 갤러리: 플랫폼 기능 쇼케이스
 * - 반복 CTA: 상단/중단/하단 배치
 */

import { Link } from 'react-router';
import { Button } from '../app/components/ui/button';
import {
  Search, Shield, Calculator, Award, ArrowRight,
  CheckCircle2, Clock, TrendingDown, TrendingUp,
  Building2, Cpu, Wrench, ChevronRight, Zap,
  BarChart3, FileCheck, Users, ShieldCheck, Bot
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

/* ─── Animated Counter Hook ─── */
function useCountUp(target: number, duration = 2000, suffix = '') {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [hasStarted, target, duration]);

  return { count, ref, suffix };
}

/* ─── Fade-in-on-scroll Hook ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

/* ─── Section Component ─── */
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, isVisible } = useFadeIn();
  return (
    <section
      id={id}
      ref={ref}
      className={`landing-section ${isVisible ? 'landing-visible' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

/* ─── Logo Wall Data ─── */
const partnerLogos = [
  { name: 'FANUC', icon: Cpu },
  { name: 'ABB Robotics', icon: Bot },
  { name: 'KUKA', icon: Cpu },
  { name: 'Universal Robots', icon: Bot },
  { name: 'Doosan Robotics', icon: Cpu },
  { name: 'Hyundai Robotics', icon: Bot },
];

/* ─── Main Component ─── */
export function LandingPage() {
  const stat1 = useCountUp(1240, 2000);
  const stat2 = useCountUp(98, 2000);
  const stat3 = useCountUp(340, 2000);
  const stat4 = useCountUp(24, 1500);

  return (
    <div className="landing-page">

      {/* ━━━ Sticky Mini Header ━━━ */}
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">R</div>
            <span className="landing-logo-text">로봇 SI 플랫폼</span>
          </Link>
          <nav className="landing-nav">
            <a href="#features" className="landing-nav-link">주요 기능</a>
            <a href="#how-it-works" className="landing-nav-link">이용 방법</a>
            <a href="#roi" className="landing-nav-link">도입 효과</a>
            <Link to="/home">
              <Button size="sm" className="landing-cta-btn">
                서비스 시작하기
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ━━━ HERO SECTION ━━━ */}
      <section className="landing-hero">
        <div className="landing-hero-bg" aria-hidden="true">
          <div className="landing-hero-gradient" />
          <div className="landing-hero-grid" />
        </div>

        <div className="landing-container landing-hero-content">
          <div className="landing-hero-badge">
            <Zap className="w-4 h-4" />
            <span>국내 1위 로봇 SI 매칭 플랫폼</span>
          </div>

          <h1 className="landing-hero-title">
            로봇 도입, 더 이상
            <br />
            <span className="landing-hero-accent">혼자 고민하지 마세요</span>
          </h1>

          <p className="landing-hero-subtitle">
            검증된 SI 파트너 매칭부터 에스크로 안전결제, AS 보증까지 —
            <br className="hidden sm:block" />
            로봇 도입의 모든 과정을 하나의 플랫폼에서 해결하세요.
          </p>

          <div className="landing-hero-cta-group">
            <Link to="/home">
              <Button size="lg" className="landing-primary-btn">
                지금 무료로 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/calculator">
              <Button size="lg" variant="outline" className="landing-outline-btn">
                ROI 먼저 계산해보기
              </Button>
            </Link>
          </div>

          {/* Hero Stats */}
          <div className="landing-hero-stats">
            <div ref={stat1.ref} className="landing-stat-item">
              <span className="landing-stat-number">{stat1.count.toLocaleString()}+</span>
              <span className="landing-stat-label">누적 매칭 건수</span>
            </div>
            <div className="landing-stat-divider" />
            <div ref={stat2.ref} className="landing-stat-item">
              <span className="landing-stat-number">{stat2.count}%</span>
              <span className="landing-stat-label">고객 만족도</span>
            </div>
            <div className="landing-stat-divider" />
            <div ref={stat3.ref} className="landing-stat-item">
              <span className="landing-stat-number">{stat3.count}+</span>
              <span className="landing-stat-label">검증 파트너사</span>
            </div>
            <div className="landing-stat-divider" />
            <div ref={stat4.ref} className="landing-stat-item">
              <span className="landing-stat-number">{stat4.count}h</span>
              <span className="landing-stat-label">긴급 AS 출동</span>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ SOCIAL PROOF — Logo Wall ━━━ */}
      <Section className="landing-logos-section">
        <div className="landing-container">
          <p className="landing-logos-label">국내외 주요 로봇 제조사와 함께합니다</p>
          <div className="landing-logos-grid">
            {partnerLogos.map((logo) => (
              <div key={logo.name} className="landing-logo-card">
                <logo.icon className="w-8 h-8 text-gray-400" />
                <span className="landing-logo-name">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ VALUE PROPOSITION — Why Us ━━━ */}
      <Section id="features" className="landing-features-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">왜 우리 플랫폼인가요?</span>
            <h2 className="landing-section-title">
              경쟁사가 아닌 <strong>우리를 선택해야 하는 이유</strong>
            </h2>
            <p className="landing-section-desc">
              기능 나열이 아닌, 고객이 직접 느낄 수 있는 혜택을 제공합니다.
            </p>
          </div>

          <div className="landing-features-grid">
            {[
              {
                icon: Search,
                title: '3분 안에 최적 파트너 매칭',
                desc: '재무등급, 시공 성공률, 제조사 인증 뱃지를 기반으로 AI가 최적의 SI 파트너를 추천합니다.',
                color: 'blue',
              },
              {
                icon: ShieldCheck,
                title: '에스크로로 100% 자금 보호',
                desc: '시공 완료 및 검수 승인 전까지 플랫폼이 자금을 안전하게 보관합니다. 사기 위험 제로.',
                color: 'emerald',
              },
              {
                icon: Wrench,
                title: 'SI 부도에도 AS 보증 유지',
                desc: 'SI 파트너가 폐업해도 24시간 내 대체 엔지니어가 출동합니다. 업계 유일 안심 보증.',
                color: 'purple',
              },
              {
                icon: BarChart3,
                title: 'RaaS로 초기 비용 75% 절감',
                desc: 'CAPEX·리스·RaaS(구독형) 3가지 옵션을 비교하고 최적의 투자 방식을 선택하세요.',
                color: 'amber',
              },
            ].map((feature, i) => (
              <div key={i} className={`landing-feature-card landing-feature-${feature.color}`}>
                <div className={`landing-feature-icon-wrap landing-feature-icon-${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ HOW IT WORKS — Input → Platform → Output (C유형 핵심) ━━━ */}
      <Section id="how-it-works" className="landing-workflow-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">이용 방법</span>
            <h2 className="landing-section-title">
              복잡한 로봇 도입, <strong>3단계로 끝</strong>
            </h2>
            <p className="landing-section-desc">
              요구사항만 입력하면, 나머지는 플랫폼이 알아서 처리합니다.
            </p>
          </div>

          <div className="landing-workflow-steps">
            {/* Step 1: Input */}
            <div className="landing-workflow-step">
              <div className="landing-step-number">1</div>
              <div className="landing-step-icon-wrap landing-step-blue">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="landing-step-title">요구사항 입력</h3>
              <p className="landing-step-desc">
                로봇 종류, 규모, 예산, 일정만 입력하세요.
                <br />5분이면 충분합니다.
              </p>
              <ul className="landing-step-list">
                <li><CheckCircle2 className="w-4 h-4" /> 업종별 맞춤 템플릿</li>
                <li><CheckCircle2 className="w-4 h-4" /> RaaS 비용 자동 계산</li>
              </ul>
            </div>

            {/* Arrow */}
            <div className="landing-workflow-arrow">
              <ChevronRight className="w-8 h-8" />
            </div>

            {/* Step 2: Platform Magic */}
            <div className="landing-workflow-step landing-step-highlight">
              <div className="landing-step-number landing-step-number-accent">2</div>
              <div className="landing-step-icon-wrap landing-step-indigo">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="landing-step-title">플랫폼이 매칭</h3>
              <p className="landing-step-desc">
                검증된 SI 파트너를 자동 매칭하고
                <br />에스크로로 안전하게 계약합니다.
              </p>
              <ul className="landing-step-list">
                <li><CheckCircle2 className="w-4 h-4" /> AI 기반 최적 매칭</li>
                <li><CheckCircle2 className="w-4 h-4" /> 에스크로 자금 보호</li>
                <li><CheckCircle2 className="w-4 h-4" /> 실시간 진행 추적</li>
              </ul>
            </div>

            {/* Arrow */}
            <div className="landing-workflow-arrow">
              <ChevronRight className="w-8 h-8" />
            </div>

            {/* Step 3: Output */}
            <div className="landing-workflow-step">
              <div className="landing-step-number">3</div>
              <div className="landing-step-icon-wrap landing-step-emerald">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="landing-step-title">도입 완료 + AS 보증</h3>
              <p className="landing-step-desc">
                시공 완료 후에도 지속적인
                <br />AS SLA 모니터링을 받으세요.
              </p>
              <ul className="landing-step-list">
                <li><CheckCircle2 className="w-4 h-4" /> 검수 완료 후 자동 정산</li>
                <li><CheckCircle2 className="w-4 h-4" /> 24h 긴급 AS 보증</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ━━━ MID CTA ━━━ */}
      <Section className="landing-mid-cta-section">
        <div className="landing-container landing-mid-cta-inner">
          <h2 className="landing-mid-cta-title">로봇 도입, 지금 바로 시작해보세요</h2>
          <p className="landing-mid-cta-desc">
            회원가입 없이도 RaaS 계산기를 무료로 이용할 수 있습니다.
          </p>
          <div className="landing-mid-cta-buttons">
            <Link to="/home">
              <Button size="lg" className="landing-primary-btn">
                SI 파트너 찾아보기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/calculator">
              <Button size="lg" variant="outline" className="landing-white-outline-btn">
                RaaS 계산기 체험
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* ━━━ ROI — Before & After (C유형 핵심) ━━━ */}
      <Section id="roi" className="landing-roi-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">도입 효과</span>
            <h2 className="landing-section-title">
              플랫폼 도입 전 vs 후, <strong>수치로 증명합니다</strong>
            </h2>
          </div>

          <div className="landing-roi-grid">
            {/* Before */}
            <div className="landing-roi-card landing-roi-before">
              <div className="landing-roi-badge-before">도입 전</div>
              <ul className="landing-roi-list">
                <li>
                  <Clock className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="landing-roi-metric">평균 3~6개월</span>
                    <span className="landing-roi-label">SI 파트너 탐색 기간</span>
                  </div>
                </li>
                <li>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="landing-roi-metric">30% 이상</span>
                    <span className="landing-roi-label">계약 사기·분쟁 위험</span>
                  </div>
                </li>
                <li>
                  <Users className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="landing-roi-metric">AS 보증 불가</span>
                    <span className="landing-roi-label">SI 폐업 시 대응 방법 없음</span>
                  </div>
                </li>
                <li>
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="landing-roi-metric">초기 비용 100%</span>
                    <span className="landing-roi-label">일시불 CAPEX 부담</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Arrow */}
            <div className="landing-roi-arrow">
              <ArrowRight className="w-10 h-10" />
            </div>

            {/* After */}
            <div className="landing-roi-card landing-roi-after">
              <div className="landing-roi-badge-after">도입 후</div>
              <ul className="landing-roi-list">
                <li>
                  <Zap className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="landing-roi-metric landing-roi-highlight">평균 3일</span>
                    <span className="landing-roi-label">AI 기반 즉시 매칭</span>
                  </div>
                </li>
                <li>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="landing-roi-metric landing-roi-highlight">분쟁 0건</span>
                    <span className="landing-roi-label">에스크로 + 검수 시스템</span>
                  </div>
                </li>
                <li>
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="landing-roi-metric landing-roi-highlight">24h 보증</span>
                    <span className="landing-roi-label">SI 폐업 시에도 긴급 AS</span>
                  </div>
                </li>
                <li>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <div>
                    <span className="landing-roi-metric landing-roi-highlight">비용 75% 절감</span>
                    <span className="landing-roi-label">RaaS 구독 모델 전환</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ━━━ OUTCOME SHOWCASE — 결과물 갤러리 (C유형 핵심) ━━━ */}
      <Section className="landing-showcase-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-tag">플랫폼 기능 미리보기</span>
            <h2 className="landing-section-title">
              이 모든 것을 <strong>하나의 플랫폼</strong>에서
            </h2>
          </div>

          <div className="landing-showcase-grid">
            {[
              {
                icon: Search,
                title: 'SI 파트너 검색',
                desc: '재무등급·인증뱃지·시공이력 기반 다차원 필터링',
                tag: '수요기업',
              },
              {
                icon: Calculator,
                title: 'RaaS 비용 계산기',
                desc: 'CAPEX vs 리스 vs RaaS 3가지 옵션 실시간 비교',
                tag: '수요기업',
              },
              {
                icon: Shield,
                title: '에스크로 결제',
                desc: '검수 승인 시까지 자금 보호 + 자동 정산',
                tag: '공통',
              },
              {
                icon: Award,
                title: '제조사 인증 뱃지',
                desc: '제조사가 직접 발급하는 공식 인증 시스템',
                tag: 'SI 파트너',
              },
              {
                icon: Building2,
                title: 'KPI 대시보드',
                desc: '매출·계약·SLA 현황을 실시간 모니터링',
                tag: '제조사/관리자',
              },
              {
                icon: Wrench,
                title: 'AS SLA 모니터링',
                desc: '응답시간·해결율·고객만족도 자동 추적',
                tag: '관리자',
              },
            ].map((item, i) => (
              <div key={i} className="landing-showcase-card">
                <div className="landing-showcase-icon">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="landing-showcase-tag">{item.tag}</div>
                <h3 className="landing-showcase-title">{item.title}</h3>
                <p className="landing-showcase-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="landing-final-cta">
        <div className="landing-container landing-final-cta-inner">
          <h2 className="landing-final-title">
            로봇 도입의 새로운 기준,
            <br />
            지금 경험해보세요
          </h2>
          <p className="landing-final-desc">
            수요기업이든, SI 파트너이든 — 각 역할에 최적화된 서비스를 제공합니다.
          </p>
          <div className="landing-final-buttons">
            <Link to="/signup/buyer">
              <Button size="lg" className="landing-white-btn">
                수요기업으로 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/signup/partner">
              <Button size="lg" variant="outline" className="landing-ghost-btn">
                SI 파트너로 참여하기
              </Button>
            </Link>
          </div>
          <p className="landing-final-note">
            회원가입은 무료이며, 2분 내로 완료됩니다.
          </p>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-footer-logo">
                <div className="landing-logo-icon">R</div>
                <span className="landing-footer-brand">로봇 SI 매칭 플랫폼</span>
              </div>
              <p className="landing-footer-about">
                로봇 도입의 모든 과정을 투명하게 연결하고,
                <br />
                안전한 거래와 지속적인 AS를 보장합니다.
              </p>
            </div>
            <div>
              <h4 className="landing-footer-heading">서비스</h4>
              <ul className="landing-footer-links">
                <li><Link to="/home">SI 파트너 검색</Link></li>
                <li><Link to="/calculator">RaaS 계산기</Link></li>
                <li><Link to="/search">파트너 상세 검색</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="landing-footer-heading">회원가입</h4>
              <ul className="landing-footer-links">
                <li><Link to="/signup/buyer">수요기업 가입</Link></li>
                <li><Link to="/signup/partner">SI 파트너 가입</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="landing-footer-heading">고객지원</h4>
              <ul className="landing-footer-links">
                <li><a href="mailto:support@robotsi.com">support@robotsi.com</a></li>
                <li><span>서울특별시 강남구 테헤란로</span></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© 2026 로봇 SI 매칭 플랫폼. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
