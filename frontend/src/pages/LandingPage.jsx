import { Link } from 'react-router-dom';
import {
  Shield, Network, Activity, Clock, FileText, Crosshair,
  ArrowRight, ChevronRight, Cpu, Sparkles, CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      title: 'Autonomous Investigation',
      icon: Shield,
      desc: 'AI agent autonomously investigates security findings and correlates related threats without manual intervention.',
    },
    {
      title: 'Attack Chain Discovery',
      icon: Network,
      desc: 'Automatically maps multi-step attack paths connecting disparate vulnerabilities into a cohesive chain.',
    },
    {
      title: 'Risk Prioritization',
      icon: Activity,
      desc: 'Calculates risk deterministically based on severity, likelihood, and impact to highlight what matters most.',
    },
    {
      title: 'AI Reasoning Timeline',
      icon: Clock,
      desc: 'Watch the investigation unfold in real-time with an auditable decision log mapping every backend process.',
    },
    {
      title: 'Security Report Generation',
      icon: FileText,
      desc: 'Generates professional executive summaries and actionable remediation plans instantly.',
    },
    {
      title: 'MITRE ATT&CK Mapping',
      icon: Crosshair,
      desc: 'Maps all identified threats directly to the MITRE ATT&CK framework via our structured knowledge base.',
    },
  ];

  const stats = [
    { value: '19+', label: 'Services covered' },
    { value: '8', label: 'Pipeline stages' },
    { value: '100%', label: 'Auditable decisions' },
    { value: '< 2s', label: 'Median run time' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      {/* Top nav */}
      <nav className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shadow-sm">
              <Cpu className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <span className="text-base font-extrabold tracking-widest text-[var(--text)]">SENTINEL</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[var(--text)] transition-colors">How it works</a>
            <a href="#security" className="hover:text-[var(--text)] transition-colors">Security</a>
            <a href="#pricing" className="hover:text-[var(--text)] transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] px-3 py-2 transition-colors">
              Log in
            </button>
            <Link
              to="/app/upload"
              className="text-sm font-semibold bg-[var(--text)] hover:opacity-90 text-[var(--surface)] px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Start Investigation
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--sidebar)] border border-[var(--sidebar-active)] rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span className="text-xs font-semibold text-[var(--brand)]">Sentinel Engine v1.0 is live</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--text)] leading-tight mb-6">
            AI Security Misconfiguration
            <br className="hidden md:block" />
            <span className="text-[var(--brand)]">Investigation Agent</span>
          </h1>

          <p className="text-lg text-[var(--text-muted)] max-w-3xl mx-auto leading-relaxed mb-10">
            Sentinel is a modern cybersecurity investigation platform powered by an autonomous AI agent
            that analyzes security misconfigurations, correlates findings, prioritizes risks, builds
            attack chains, and generates actionable remediation recommendations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/app/upload"
              className="inline-flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-[var(--brand)]/20"
            >
              <span>Start Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text)] px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <span>See how it works</span>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-5">
                <p className="text-2xl font-extrabold text-[var(--text)]">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand)] mb-2">Features</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-4">
            Enterprise-grade AI investigation
          </h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
            Sentinel orchestrates a deterministic security pipeline enriched by an AI engine to
            provide clear, auditable, and actionable results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 hover:shadow-md hover:border-[var(--border-strong)] transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand)] mb-2">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text)] mb-4">
              From raw scan to executive report
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
              The 8-stage Sentinel pipeline runs end-to-end in seconds, with every decision auditable.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '01', label: 'Upload', desc: 'Drop in Nmap, JSON, or raw text.' },
              { step: '02', label: 'Parse', desc: 'Services, evidence, and assets extracted.' },
              { step: '03', label: 'Score', desc: 'Deterministic rules + risk engine.' },
              { step: '04', label: 'Report', desc: 'Executive summary + remediation plan.' },
            ].map((s) => (
              <div key={s.step} className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">Step {s.step}</p>
                <h3 className="text-lg font-extrabold text-[var(--text)] mt-2">{s.label}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="security" className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl p-10 md:p-14 text-white text-center shadow-lg shadow-[#4F46E5]/20">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-4 text-white" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Ready to investigate?</h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-6">
            Run a full Sentinel investigation in under two seconds. No credit card required.
          </p>
          <Link
            to="/app/upload"
            className="inline-flex items-center gap-2 bg-white text-[#4F46E5] hover:bg-[#F1F3F7] px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <span>Start Investigation</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-[var(--brand)]" />
            </div>
            <span className="text-xs font-bold tracking-widest text-[var(--text)]">SENTINEL</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Sentinel AI Security. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
