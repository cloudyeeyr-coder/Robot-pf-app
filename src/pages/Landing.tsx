/**
 * Landing.tsx — S.H.I.E.L.D. 로봇 도입 감리단 컨셉
 * 6개 AI 에이전트가 고객의 자금과 프로젝트를 완전 통제
 */
import { Link } from 'react-router';
import { Button } from '../app/components/ui/button';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { SHIELD_AGENTS, HERO_STATS, PAIN_QUOTES, MARKET_STATS, PERSONA_CTAS } from './landing-data';

function useCountUp(target: number, dur = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let cur = 0; const inc = target / 60;
    const iv = setInterval(() => { cur += inc; if (cur >= target) { setCount(target); clearInterval(iv); } else setCount(Math.floor(cur)); }, dur / 60);
    return () => clearInterval(iv);
  }, [started, target, dur]);
  return { count, ref };
}

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, vis } = useFadeIn();
  return <section id={id} ref={ref} className={`landing-section ${vis ? 'landing-visible' : ''} ${className}`}>{children}</section>;
}

function useWaitlist() {
  const [n, setN] = useState(47);
  useEffect(() => { const iv = setInterval(() => setN(p => Math.random() > 0.6 ? p + 1 : p), 12000); return () => clearInterval(iv); }, []);
  return n;
}

const agentColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  red:     { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', glow: 'rgba(220,38,38,0.15)' },
  blue:    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', glow: 'rgba(37,99,235,0.15)' },
  amber:   { bg: '#fffbeb', text: '#d97706', border: '#fde68a', glow: 'rgba(217,119,6,0.15)' },
  emerald: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', glow: 'rgba(5,150,105,0.15)' },
  purple:  { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', glow: 'rgba(124,58,237,0.15)' },
  slate:   { bg: '#f8fafc', text: '#475569', border: '#e2e8f0', glow: 'rgba(71,85,105,0.1)' },
};

const ctaColors: Record<string, { accent: string; bg: string; border: string }> = {
  red:   { accent: '#dc2626', bg: '#fff5f5', border: '#fecaca' },
  blue:  { accent: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  slate: { accent: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
};

export function LandingPage() {
  const counters = HERO_STATS.map(s => ({ ...s, c: useCountUp(s.value) }));
  const waitlist = useWaitlist();

  return (
    <div className="landing-page" style={{ background: '#f8fafc' }}>

      {/* ── Header ── */}
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon" style={{ background: 'linear-gradient(135deg,#dc2626,#7f1d1d)' }}>S</div>
            <span className="landing-logo-text" style={{ fontWeight: 800 }}>S.H.I.E.L.D. 로봇 보증 플랫폼</span>
          </Link>
          <nav className="landing-nav">
            <a href="#why" className="landing-nav-link">왜 필요한가</a>
            <a href="#shield" className="landing-nav-link">6중 감리 시스템</a>
            <a href="#cta" className="landing-nav-link">사전 예약</a>
            <Link to="/home">
              <Button size="sm" style={{ background: '#dc2626', color: '#fff', fontWeight: 700, borderRadius: 8 }}>
                사전 예약하기
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)', padding: '140px 0 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div style={{ position: 'absolute', top: '30%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle,rgba(220,38,38,0.12),transparent 70%)', borderRadius: '50%' }} />
        <div className="landing-container" style={{ textAlign: 'center', maxWidth: 860, position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 999, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', fontSize: 13, fontWeight: 700, marginBottom: 28 }}>
            <AlertTriangle style={{ width: 16, height: 16 }} />
            SI 업체 파산·잠적·AS 단절 — 6중 AI 감리 시스템이 원천 차단합니다
          </div>

          <h1 style={{ fontSize: 'clamp(28px,5vw,54px)', fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 12 }}>
            영업사원의 약속은 믿지 마세요.
          </h1>
          <h2 style={{ fontSize: 'clamp(22px,4vw,44px)', fontWeight: 900, lineHeight: 1.25, marginBottom: 24 }}>
            <span style={{ color: '#f87171' }}>S.H.I.E.L.D.</span>
            <span style={{ color: '#e2e8f0' }}> 시스템이 지킵니다.</span>
          </h2>

          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#94a3b8', lineHeight: 1.8, maxWidth: 700, margin: '0 auto 16px' }}>
            계약이 시작되는 순간, <strong style={{ color: '#e2e8f0' }}>6개의 특화 AI 에이전트</strong>가 동시에 가동됩니다.
          </p>
          <p style={{ fontSize: 'clamp(14px,1.8vw,17px)', color: '#64748b', lineHeight: 1.8, maxWidth: 660, margin: '0 auto 40px' }}>
            재무 AI가 업체 파산 리스크를 감시하고, 에스크로 AI가 귀하의 자금 100%를 통제하며,<br />
            A/S 관제 AI가 고장 시 50km 내 엔지니어를 무조건 출동시킵니다.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <Link to="/home">
              <Button size="lg" style={{ background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: 16, height: 54, padding: '0 32px', borderRadius: 12, boxShadow: '0 0 30px rgba(220,38,38,0.4)', border: 'none' }}>
                S.H.I.E.L.D. 보호 시작하기 <ArrowRight style={{ width: 20, height: 20, marginLeft: 8 }} />
              </Button>
            </Link>
            <Link to="/calculator">
              <Button size="lg" variant="outline" style={{ borderColor: '#334155', color: '#94a3b8', height: 54, padding: '0 28px', borderRadius: 12 }}>
                RaaS 비용 시뮬레이션
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b', borderRadius: 16, padding: '24px 16px', maxWidth: 740, margin: '0 auto' }}>
            {counters.map((s, i) => (
              <div key={i} ref={s.c.ref} style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 'clamp(20px,2.5vw,34px)', fontWeight: 900, color: s.highlight ? '#34d399' : '#fff', marginBottom: 4 }}>
                  {s.c.count}{s.suffix}
                </span>
                <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY: Real Quotes ── */}
      <Section id="why" className="py-20 bg-white">
        <div className="landing-container" style={{ maxWidth: 820 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <AlertTriangle style={{ width: 44, height: 44, color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.4, marginBottom: 12 }}>
              이것은 가상이 아닙니다.<br /><span style={{ color: '#dc2626' }}>실제 현장 인터뷰 발언</span>입니다.
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 36 }}>
            {PAIN_QUOTES.map((q, i) => (
              <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '28px 32px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -16, left: 24, fontSize: 56, color: '#fca5a5', fontWeight: 900, lineHeight: 1 }}>"</span>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', lineHeight: 1.6, marginBottom: 10, paddingTop: 8 }}>{q.quote}</p>
                <p style={{ fontSize: 13, color: '#94a3b8' }}>— <strong style={{ color: '#64748b' }}>{q.name}</strong>, {q.role} <span style={{ marginLeft: 8, fontSize: 11, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>{q.aos}</span></p>
              </div>
            ))}
          </div>
          <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 16, padding: '28px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', lineHeight: 1.6 }}>
              단순 매칭 플랫폼은 <span style={{ color: '#dc2626' }}>계약 후 책임지지 않습니다.</span><br />
              S.H.I.E.L.D.는 <span style={{ color: '#2563eb' }}>배달의민족 + K-Car 수준의 무한 책임</span>을 AI 시스템으로 구현합니다.
            </p>
          </div>
        </div>
      </Section>

      {/* ── S.H.I.E.L.D. 6 Agents ── */}
      <Section id="shield" style={{ padding: '80px 0', background: 'linear-gradient(160deg,#0f172a,#1e1b4b)' }}>
        <div className="landing-container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,42px)', fontWeight: 900, color: '#fff', marginBottom: 16 }}>
              <span style={{ color: '#f87171' }}>S.H.I.E.L.D.</span> — 절대 실패할 수 없는 6중 AI 감리 시스템
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 580, margin: '0 auto' }}>
              계약 시작과 동시에 6개의 특화 AI 에이전트가 독립적으로 가동되어 리스크를 교차 검증합니다.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
            {SHIELD_AGENTS.map((agent, i) => {
              const c = agentColors[agent.color];
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 20, padding: '32px 28px', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
                  className="hover:scale-[1.02]">
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 3, background: c.text }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: c.bg, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <agent.icon style={{ width: 26, height: 26 }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: c.text }}>{agent.letter}</span>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{agent.code}</span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{agent.title}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 12, fontStyle: 'italic' }}>{agent.subtitle}</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 16 }}>{agent.desc}</p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: 99 }}>✓ {agent.persona}</span>
                </div>
              );
            })}
          </div>

          {/* Shield acronym footer */}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {SHIELD_AGENTS.map((a) => (
              <div key={a.letter} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 20px' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: agentColors[a.color].text }}>{a.letter}</span>
                <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>{a.code.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Market Proof ── */}
      <Section style={{ padding: '64px 0', background: '#fff' }}>
        <div className="landing-container" style={{ maxWidth: 820 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>시장이 증명하는 폭발적 수요</h2>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>경쟁사 마로솔: 2021년 9억 → 2022년 51억 (5.8배 급성장), 2023 상반기 수주 100억</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {MARKET_STATS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '24px 12px', background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 3 Persona CTA Cards ── */}
      <Section id="cta" style={{ padding: '80px 0', background: 'linear-gradient(160deg,#eff6ff,#faf5ff,#fef2f2)' }}>
        <div className="landing-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="landing-section-title">나에게 맞는 <strong>다음 스텝</strong>을 선택하세요</h2>
            <p style={{ marginTop: 16, color: '#dc2626', fontWeight: 700, fontSize: 16 }}>
              🔥 현재 대기 리스트 <span style={{ fontSize: 24, fontWeight: 900 }}>{waitlist}명</span> 등록 완료 — 선착순 100명 한정 에스크로 수수료 면제
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {PERSONA_CTAS.map((cta, i) => {
              const c = ctaColors[cta.color];
              return (
                <div key={i} style={{ background: '#fff', borderRadius: 20, padding: '36px 28px', border: `2px solid ${c.border}`, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: c.accent, background: c.bg, padding: '4px 12px', borderRadius: 99, alignSelf: 'flex-start', marginBottom: 12 }}>{cta.badge}</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>{cta.persona}</p>
                  <h3 style={{ fontSize: 21, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{cta.title}</h3>
                  <p style={{ fontSize: 13, fontWeight: 600, color: c.accent, marginBottom: 14 }}>{cta.subtitle}</p>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 8 }}>{cta.desc}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 20 }}>입력 정보: {cta.fields}</p>
                  <div style={{ marginTop: 'auto' }}>
                    <Link to={cta.link}>
                      <Button style={{ width: '100%', background: cta.color === 'slate' ? '#1e293b' : c.accent, color: '#fff', fontWeight: 700, height: 48, borderRadius: 12, border: 'none' }}>
                        {cta.title} <ArrowRight style={{ width: 16, height: 16, marginLeft: 8 }} />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Final Urgency CTA ── */}
      <section style={{ padding: '80px 0', background: '#0f172a', borderTop: '6px solid #dc2626' }}>
        <div className="landing-container" style={{ textAlign: 'center', maxWidth: 700 }}>
          <Calendar style={{ width: 44, height: 44, color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.35 }}>
            절대 고철이 될 수 없는 구조,<br /><span style={{ color: '#f87171' }}>지금 S.H.I.E.L.D. 보호를 선점하세요</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', marginBottom: 32, lineHeight: 1.8 }}>
            안심 보증 수요 폭발로 로컬 파트너 배정이 지연될 수 있습니다.<br />
            <strong style={{ color: '#e2e8f0' }}>선착순 100명</strong> 한정 에스크로 수수료 면제 프로모션 진행 중.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <Link to="/home">
              <Button size="lg" style={{ background: '#dc2626', color: '#fff', fontWeight: 800, fontSize: 16, height: 54, padding: '0 32px', borderRadius: 12, boxShadow: '0 0 30px rgba(220,38,38,0.35)', border: 'none' }}>
                프로모션 대기 등록 <ArrowRight style={{ width: 18, height: 18, marginLeft: 8 }} />
              </Button>
            </Link>
            <Link to="/home">
              <Button size="lg" variant="outline" style={{ borderColor: '#334155', color: '#94a3b8', height: 54, padding: '0 28px', borderRadius: 12 }}>
                무상 컨설팅 신청
              </Button>
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['등록 시 비용 없음', 'S.H.I.E.L.D. 6중 보호', '24h 내 담당자 연락'].map((t, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981' }} />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-footer-logo">
                <div className="landing-logo-icon" style={{ background: '#dc2626', width: 28, height: 28, fontSize: 11, borderRadius: 8 }}>S</div>
                <span className="landing-footer-brand">S.H.I.E.L.D. 로봇 SI 안심 보증 플랫폼</span>
              </div>
              <p className="landing-footer-about">
                Solvency · Hardware · Investment · Escrow · Local A/S · Dispute<br />
                6중 AI 감리 시스템으로 절대 실패할 수 없는 로봇 도입을 구현합니다.
              </p>
            </div>
            <div>
              <h4 className="landing-footer-heading">핵심 서비스</h4>
              <ul className="landing-footer-links">
                <li><Link to="/home">파트너 매칭</Link></li>
                <li><Link to="/calculator">RaaS 계산기</Link></li>
                <li><Link to="/search">투명 평판 검색</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="landing-footer-heading">회원가입</h4>
              <ul className="landing-footer-links">
                <li><Link to="/signup/buyer">수요기업</Link></li>
                <li><Link to="/signup/partner">SI 파트너</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="landing-footer-heading">고객 지원</h4>
              <ul className="landing-footer-links">
                <li><a href="mailto:support@robotsi.com">support@robotsi.com</a></li>
                <li><span>서울 강남구 테헤란로</span></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">© 2026 S.H.I.E.L.D. 로봇 SI 안심 보증 플랫폼. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
