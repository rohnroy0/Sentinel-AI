import { Link } from 'react-router-dom';
import {
  Shield, Network, Activity, Clock, FileText, Crosshair,
  ArrowRight, ChevronRight, Cpu, Sparkles, CheckCircle2,
  AlertTriangle, Bug, Server, Search, Database, Lock,
  Terminal, Code, FileCheck, Layers, Eye, Users, SearchCode,
  Zap, GitBranch, BookOpen
} from 'lucide-react';
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-indigo-500/30">
      
      {/* 1. Nav */}
      <nav className="sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-[var(--sidebar)] border border-[var(--sidebar-active)] flex items-center justify-center shadow-sm group-hover:border-[var(--brand)] transition-colors">
              <Cpu className="w-5 h-5 text-[var(--brand)]" />
            </div>
            <span className="text-base font-extrabold tracking-widest text-[var(--text)]">SENTINEL-AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--text-muted)]">
            <a href="#demo" className="hover:text-[var(--text)] transition-colors">Platform</a>
            <a href="#how-it-works" className="hover:text-[var(--text)] transition-colors">How it Works</a>
            <a href="#features" className="hover:text-[var(--text)] transition-colors">Features</a>
            <a href="#open-source" className="hover:text-[var(--text)] transition-colors">Open Source</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="text-sm font-semibold bg-[var(--brand)] hover:bg-[var(--brand-700)] text-[var(--on-primary)] px-5 py-2 rounded-md transition-colors"
            >
              Start Investigation
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[var(--sidebar)] border border-[var(--sidebar-active)] rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-4 h-4 text-[var(--brand)]" />
            <span className="text-xs font-semibold text-[var(--brand)] tracking-wide uppercase">v1.0 is live</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-normal tracking-[-1.5px] text-[var(--text)] leading-[1.05] mb-6">
            Autonomous AI-Powered <br className="hidden md:block" />
            <span className="text-[var(--brand)]">
              Security Operations Platform
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-3xl mx-auto leading-relaxed mb-10">
            Analyze network exposures, identify vulnerabilities, map attacker paths, and generate explainable security intelligence using AI-driven investigation workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/app/upload"
              className="inline-flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-[var(--on-primary)] px-8 py-4 rounded-md font-semibold transition-all hover:scale-[1.02]"
            >
              <span>Start Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] px-8 py-4 rounded-md font-semibold transition-all hover:scale-[1.02]"
            >
              <span>Explore How It Works</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Product Demo Preview */}
      <section id="demo" className="py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-6">
            <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-widest">Live Platform Preview</p>
          </div>
          {/* Dashboard mockup container */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Window header */}
            <div className="h-12 border-b border-[var(--border)] bg-[var(--bg)] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="ml-4 px-3 py-1 bg-[var(--surface)] border border-[var(--border)] rounded text-xs text-[var(--text-muted)] font-mono flex items-center gap-2">
                <Lock className="w-3 h-3" /> sentinel.local/app/dashboard
              </div>
            </div>
            
            {/* Dashboard Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[var(--bg)]">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Risk Score */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-4">Risk Exposure Score</h3>
                  <div className="flex items-end gap-4">
                    <span className="text-5xl font-extrabold text-[var(--danger)]">84</span>
                    <span className="text-sm font-medium text-[var(--danger)] bg-[var(--danger-bg)] px-2 py-1 rounded mb-1">Critical</span>
                  </div>
                </div>
                {/* Findings */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center justify-between">
                    Top Findings <span className="text-xs bg-[var(--sidebar-active)] text-[var(--brand)] px-2 py-0.5 rounded">Sample UI</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--danger)] mt-1.5"></div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">Unauthenticated Redis Access</p>
                        <p className="text-xs text-[var(--text-muted)]">Port 6379 • 192.168.1.105</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--warning)] mt-1.5"></div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">Outdated OpenSSH (CVE-2023-38408)</p>
                        <p className="text-xs text-[var(--text-muted)]">Port 22 • 192.168.1.50</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column (Attack Journey) */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-4">MITRE ATT&CK Journey</h3>
                  <div className="relative border-l-2 border-[var(--border-strong)] ml-3 space-y-6 pb-2">
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[var(--surface)] border-2 border-[var(--warning)]"></div>
                      <p className="text-xs font-bold text-[var(--warning)] uppercase tracking-wider mb-1">Initial Access</p>
                      <p className="text-sm text-[var(--text)] font-semibold bg-[var(--surface-2)] p-2 rounded border border-[var(--border)] inline-block">Exploit Public-Facing Application (T1190)</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[var(--surface)] border-2 border-[var(--danger)]"></div>
                      <p className="text-xs font-bold text-[var(--danger)] uppercase tracking-wider mb-1">Execution</p>
                      <p className="text-sm text-[var(--text)] font-semibold bg-[var(--surface-2)] p-2 rounded border border-[var(--border)] inline-block">Command and Scripting Interpreter (T1059)</p>
                    </div>
                  </div>
                </div>

                {/* Decision Log Timeline */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-[var(--text)] mb-4">AI Decision Log</h3>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="flex gap-3 text-[var(--text-muted)]">
                      <span className="text-[var(--brand)]">[Parser]</span>
                      <span>Discovered network assets: 5 hosts, 12 open ports.</span>
                    </div>
                    <div className="flex gap-3 text-[var(--text-muted)]">
                      <span className="text-[var(--brand)]">[Rule Engine]</span>
                      <span>Matched service fingerprint "Redis 6.0.9" to known risk profile.</span>
                    </div>
                    <div className="flex gap-3 text-[var(--text)]">
                      <span className="text-purple-400">[AI Agent]</span>
                      <span>Inferred high probability of data exfiltration due to missing auth on public IP.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. What is Sentinel-AI? */}
      <section className="py-20 bg-[var(--surface-2)] border-y border-[var(--border)]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Shield className="w-12 h-12 text-[var(--brand)] mx-auto mb-6" />
          <h2 className="text-4xl font-serif font-normal tracking-[-1px] text-[var(--text)] mb-6">What is Sentinel-AI?</h2>
          <p className="text-lg text-[var(--text-muted)] leading-relaxed">
            Sentinel-AI is an autonomous security investigation platform that transforms raw network scan data into actionable security intelligence. 
            It combines <span className="text-[var(--text)] font-semibold">network discovery</span>, <span className="text-[var(--text)] font-semibold">vulnerability intelligence</span>, <span className="text-[var(--text)] font-semibold">AI reasoning</span>, and <span className="text-[var(--text)] font-semibold">MITRE ATT&CK mapping</span> to provide context-aware risk analysis and remediation guidance.
          </p>
        </div>
      </section>

      {/* 5. Problem Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-[var(--text)] mb-4">The problem with traditional scanning</h2>
          <p className="text-[var(--text-muted)]">Why lists of vulnerabilities are no longer enough.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[var(--surface)] border border-[var(--danger-border)] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <AlertTriangle className="w-32 h-32 text-[var(--danger)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--danger)] mb-4">Traditional Scanners</h3>
            <ul className="space-y-4 text-[var(--text-muted)]">
              <li className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--danger)]" /> Only list isolated vulnerabilities</li>
              <li className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--danger)]" /> Generate overwhelming, noisy results</li>
              <li className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--danger)]" /> Lack understanding of attack context</li>
              <li className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--danger)]" /> Require hours of manual analyst review</li>
            </ul>
          </div>
          
          <div className="bg-[var(--surface)] border border-[var(--brand)] rounded-2xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(79,70,229,0.1)]">
             <div className="absolute top-0 right-0 p-6 opacity-10">
              <Shield className="w-32 h-32 text-[var(--brand)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--brand)] mb-4">Sentinel-AI Approach</h3>
            <ul className="space-y-4 text-[var(--text-muted)]">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--brand)]" /> Understands full security context</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--brand)]" /> Correlates findings into actionable intelligence</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--brand)]" /> Builds realistic attacker journeys</li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--brand)]" /> Explains why specific risks matter to you</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Investigation Lifecycle Section */}
      <section className="py-20 bg-[var(--surface-2)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[var(--text)]">The Investigation Lifecycle</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { icon: Server, label: 'Collect', desc: 'Ingest raw network data' },
              { icon: SearchCode, label: 'Analyze', desc: 'Parse and fingerprint' },
              { icon: GitBranch, label: 'Correlate', desc: 'Link vulnerabilities' },
              { icon: Eye, label: 'Understand', desc: 'Apply AI reasoning' },
              { icon: Activity, label: 'Prioritize', desc: 'Score actual risk' },
              { icon: CheckCircle2, label: 'Remediate', desc: 'Generate exact fixes' }
            ].map((step, i) => (
              <div key={step.label} className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center mb-4 relative">
                  <step.icon className="w-5 h-5 text-[var(--brand)]" />
                  {i < 5 && <div className="hidden md:block absolute top-1/2 left-full w-full h-[2px] bg-[var(--border)] -z-10"></div>}
                </div>
                <h4 className="font-bold text-[var(--text)]">{step.label}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Deterministic Pipeline vs AI SOC Agent */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-[var(--text)] mb-4">Dual-Engine Architecture</h2>
          <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
            Sentinel-AI provides both a high-speed deterministic pipeline for standard analysis and an autonomous AI agent for complex reasoning. Both workflows operate seamlessly within the platform.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Pipeline */}
          <div className="bg-[var(--surface)] rounded-2xl p-8 border border-[var(--border)]">
            <h3 className="text-xl font-bold text-[var(--text)] mb-6 flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-500" /> Deterministic Pipeline
            </h3>
            <div className="flex flex-col items-center text-sm font-mono space-y-2">
              <div className="bg-[var(--bg)] border border-[var(--border)] px-6 py-3 rounded-lg w-full text-center text-[var(--text)]">Nmap Input</div>
              <ArrowRight className="w-5 h-5 text-[var(--text-muted)] rotate-90" />
              <div className="bg-[var(--surface-2)] border border-[var(--border)] px-6 py-3 rounded-lg w-full text-center text-[var(--text-muted)]">Rule Engine & CVE Lookup</div>
              <ArrowRight className="w-5 h-5 text-[var(--text-muted)] rotate-90" />
              <div className="bg-[var(--sidebar)] border border-[var(--brand)] px-6 py-3 rounded-lg w-full text-center text-[var(--brand)] font-bold">Structured Security Dashboard</div>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-8 text-center">Fast, rule-based processing for standard vulnerability assessment.</p>
          </div>

          {/* AI Agent */}
          <div className="bg-[var(--surface)] rounded-2xl p-8 border border-[var(--border)] shadow-[0_0_40px_rgba(168,85,247,0.05)] relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" /> AI SOC Agent
            </h3>
             <div className="flex flex-col items-center text-sm font-mono space-y-2 relative z-10">
              <div className="flex w-full gap-2">
                <div className="bg-[var(--bg)] border border-[var(--border)] px-4 py-3 rounded-lg flex-1 text-center text-[var(--text)]">Security Goal</div>
                <div className="bg-[var(--bg)] border border-[var(--border)] px-4 py-3 rounded-lg flex-1 text-center text-[var(--text)]">Network Data</div>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--text-muted)] rotate-90" />
              <div className="bg-[var(--surface-2)] border border-[var(--border)] px-6 py-3 rounded-lg w-full text-center text-[var(--text-muted)]">AI Planner & Tool Selection</div>
              <ArrowRight className="w-5 h-5 text-[var(--text-muted)] rotate-90" />
              <div className="bg-purple-900/30 border border-purple-500/50 px-6 py-3 rounded-lg w-full text-center text-purple-300 font-bold">Explainable Investigation</div>
            </div>
             <p className="text-sm text-[var(--text-muted)] mt-8 text-center relative z-10">Dynamic, goal-driven reasoning for complex threat modeling.</p>
          </div>
        </div>
      </section>

      {/* 8. Core Features Section */}
      <section id="features" className="py-24 bg-[var(--surface-2)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[var(--text)]">Platform Capabilities</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Cpu, title: 'AI SOC Agent', desc: 'An autonomous AI analyst that investigates security goals and provides evidence-backed reasoning.' },
              { icon: Search, title: 'Vulnerability Intelligence', desc: 'Matches vulnerabilities precisely using deep product and version-based analysis.' },
              { icon: Network, title: 'Attack Chain Visualization', desc: 'Shows realistic attacker movement using evidence-backed graphs and MITRE mapping.' },
              { icon: FileText, title: 'Decision Log', desc: 'Transparent AI reasoning showing why a decision was made, evidence used, and next actions.' },
              { icon: Activity, title: 'Risk Dashboard', desc: 'Provides a comprehensive security posture overview prioritized by actual impact.' },
              { icon: Shield, title: 'Remediation Engine', desc: 'Generates prioritized fixes and concrete actions to secure exposed assets.' }
            ].map((feature) => (
              <div key={feature.title} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--brand)] transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center mb-5 group-hover:bg-[var(--brand)]/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-[var(--text)] group-hover:text-[var(--brand)] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text)] mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Explainable AI Focus */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-[var(--text)] mb-6">Explainable Security Intelligence</h2>
            <p className="text-lg text-[var(--text-muted)] leading-relaxed mb-8">
              Sentinel-AI doesn't just provide opaque results. Every finding is backed by transparent reasoning, ensuring security teams can trust and verify the AI's logic.
            </p>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--brand)]/20 text-[var(--brand)] flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-bold text-[var(--text)]">Decision</h4>
                  <p className="text-sm text-[var(--text-muted)]">"Apache service identified as vulnerable"</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--brand)]/20 text-[var(--brand)] flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-bold text-[var(--text)]">Why</h4>
                  <p className="text-sm text-[var(--text-muted)]">"Version 2.4.49 matched known vulnerability (CVE-2021-41773)"</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--brand)]/20 text-[var(--brand)] flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-bold text-[var(--text)]">Evidence</h4>
                  <p className="text-sm text-[var(--text-muted)]">"Host 10.0.0.5, Port 80, Banner: Apache/2.4.49"</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--brand)]/20 text-[var(--brand)] flex items-center justify-center font-bold">4</div>
                <div>
                  <h4 className="font-bold text-[var(--text)]">Action</h4>
                  <p className="text-sm text-[var(--text-muted)]">"Upgrade to Apache 2.4.51 or restrict directory traversal"</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Code/Log visualization */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-xl p-6 font-mono text-sm shadow-2xl">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <pre className="text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
<span className="text-purple-400">agent</span>.reasoning_trace(<span className="text-green-300">target</span>=<span className="text-blue-300">"10.0.0.5"</span>)
<br/>
<span className="text-gray-500"># Evaluating collected evidence...</span>
&gt; Found: Apache/2.4.49
&gt; Correlating with NVD Database...
<span className="text-red-400">! MATCH: CVE-2021-41773 (Path Traversal)</span>
<br/>
<span className="text-gray-500"># Generating attack path</span>
&gt; Internet Exposure -&gt; Exploit Public Application -&gt; LFI
<br/>
<span className="text-blue-400">return</span> <span className="text-yellow-300">Finding</span>(
  severity=<span className="text-red-400">"HIGH"</span>,
  confidence=<span className="text-green-400">0.95</span>,
  remediation=<span className="text-blue-300">"Update immediately"</span>
)
            </pre>
          </div>
        </div>
      </section>

      {/* 10. Architecture Section */}
      <section className="py-24 bg-[var(--surface-2)] border-y border-[var(--border)]">
         <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-[var(--text)]">Architecture Overview</h2>
            <p className="text-[var(--text-muted)] mt-2">End-to-end autonomous analysis pipeline.</p>
          </div>
          
          <div className="flex flex-col items-center">
            {/* User Layer */}
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 text-[var(--text-muted)] mb-2" />
              <div className="bg-[var(--surface)] border border-[var(--border)] px-6 py-2 rounded-lg text-sm font-semibold">User</div>
            </div>
            <div className="w-px h-8 bg-[var(--border-strong)]"></div>
            <div className="text-xs font-mono text-[var(--text-muted)] mb-1">Upload Scan</div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] rotate-90 mb-2" />
            
            {/* Frontend */}
            <div className="bg-[var(--sidebar)] border border-[var(--brand)] px-8 py-3 rounded-lg text-sm font-bold text-[var(--text)]">React Frontend</div>
            <div className="w-px h-8 bg-[var(--brand)]/30"></div>
            
            {/* Backend */}
             <div className="bg-[var(--sidebar)] border border-[var(--brand)] px-8 py-3 rounded-lg text-sm font-bold text-[var(--text)]">FastAPI Backend</div>
             <div className="w-px h-8 bg-[var(--brand)]/30"></div>

             {/* Engine Box */}
             <div className="w-full max-w-2xl border-2 border-[var(--border-strong)] rounded-xl p-6 bg-[var(--surface)] shadow-lg relative">
              <div className="absolute -top-3 left-6 bg-[var(--surface)] px-2 text-xs font-bold uppercase tracking-widest text-[var(--brand)]">AI Investigation Engine</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {['Parser', 'Rule Engine', 'CVE Lookup', 'Risk Engine', 'MITRE Mapper', 'Attack Builder', 'Planner Node', 'Report Gen'].map(node => (
                  <div key={node} className="bg-[var(--bg)] border border-[var(--border)] p-3 text-center rounded text-xs font-mono text-[var(--text)] shadow-sm">
                    {node}
                  </div>
                ))}
              </div>
             </div>
             
             <div className="w-px h-8 bg-[var(--border-strong)] mt-4"></div>
             <ArrowRight className="w-4 h-4 text-[var(--text-muted)] rotate-90 mb-2" />
             <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 rounded-lg text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
               Security Intelligence
             </div>
          </div>
         </div>
      </section>

      {/* 11. Security & Privacy Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Lock className="w-10 h-10 text-[var(--brand)] mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-[var(--text)]">Security & Privacy by Design</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[var(--bg)] border border-[var(--border)] p-6 rounded-xl">
            <h4 className="font-bold text-[var(--text)] mb-2">User-Owned Data</h4>
            <p className="text-sm text-[var(--text-muted)]">Your investigations, scans, and results remain private and isolated to your environment.</p>
          </div>
          <div className="bg-[var(--bg)] border border-[var(--border)] p-6 rounded-xl">
            <h4 className="font-bold text-[var(--text)] mb-2">Secure Architecture</h4>
            <p className="text-sm text-[var(--text-muted)]">Built with secure authentication and environment-based secrets management.</p>
          </div>
          <div className="bg-[var(--bg)] border border-[var(--border)] p-6 rounded-xl">
             <h4 className="font-bold text-[var(--text)] mb-2">No Credential Exposure</h4>
            <p className="text-sm text-[var(--text-muted)]">The agent analyzes topology and vulnerabilities without requiring direct asset credentials.</p>
          </div>
        </div>
      </section>

      {/* 12. GitHub / Open Source Section */}
      <section id="open-source" className="py-20 bg-[#0D1117] border-y border-[#30363D] text-gray-300">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <GitBranch className="w-12 h-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Built for learning, research, and security innovation</h2>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
            Sentinel-AI leverages modern open-source frameworks. Explore the architecture, contribute to the agent engine, or run it locally.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="px-4 py-2 bg-[#161B22] border border-[#30363D] rounded-full text-sm font-mono flex items-center gap-2"><Code className="w-4 h-4"/> React & Tailwind CSS</div>
            <div className="px-4 py-2 bg-[#161B22] border border-[#30363D] rounded-full text-sm font-mono flex items-center gap-2"><Server className="w-4 h-4"/> FastAPI & Python</div>
            <div className="px-4 py-2 bg-[#161B22] border border-[#30363D] rounded-full text-sm font-mono flex items-center gap-2"><Cpu className="w-4 h-4"/> LangGraph AI Agents</div>
            <div className="px-4 py-2 bg-[#161B22] border border-[#30363D] rounded-full text-sm font-mono flex items-center gap-2"><Database className="w-4 h-4"/> SQLite / Supabase</div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <a href="https://github.com/rohnroy0/Sentinel-AI" className="inline-flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold transition-colors">
              <GitBranch className="w-5 h-5" /> View Repository
            </a>
            <a href="https://github.com/rohnroy0/Sentinel-AI/blob/main/ARCHITECTURE.md" className="inline-flex items-center gap-2 bg-[#21262D] border border-[#30363D] hover:bg-[#30363D] text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              <BookOpen className="w-5 h-5" /> Documentation
            </a>
          </div>
        </div>
      </section>

      {/* 13. Why Sentinel-AI? */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-extrabold text-[var(--text)] text-center mb-12">Why choose Sentinel-AI?</h2>
        <div className="space-y-4">
          {[
            'Autonomous, AI-assisted security investigation',
            'Explainable AI decisions with transparent reasoning traces',
            'Evidence-based attack paths grounded in raw scan data',
            'Human-readable security reports tailored for executives and engineers',
            'Significantly reduces manual SOC analysis time for routine tasks'
          ].map(point => (
            <div key={point} className="flex items-center gap-4 bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-[var(--success)] shrink-0" />
              <p className="text-[var(--text)] font-medium">{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 14. Getting Started */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="bg-[var(--brand)] rounded-xl p-16 text-center shadow-lg">
          <h2 className="text-4xl font-serif font-normal tracking-[-1px] text-[var(--on-primary)] mb-12">Start investigating in minutes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
             <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-[var(--on-primary)]/20 z-0"></div>
            {[
              'Create Account',
              'Upload Nmap Scan',
              'Define Goal',
              'Start AI Agent',
              'Review Findings'
            ].map((step, i) => (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[var(--bg)] text-[var(--brand)] font-bold flex items-center justify-center text-lg mb-4">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-[var(--on-primary)]">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <Link
              to="/app/upload"
              className="inline-flex items-center justify-center gap-2 bg-[var(--bg)] hover:bg-[var(--surface-2)] text-[var(--text)] px-8 py-4 rounded-md font-semibold transition-colors"
            >
              Launch Platform <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 15. Footer */}
      <footer className="bg-[var(--bg)] border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--brand)]" />
              <span className="text-sm font-extrabold tracking-widest text-[var(--text)]">SENTINEL-AI</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Autonomous intelligence for modern cybersecurity operations
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <a href="https://github.com/rohnroy0/Sentinel-AI/blob/main/ARCHITECTURE.md" className="hover:text-[var(--text)] transition-colors">Documentation</a>
            <a href="https://github.com/rohnroy0/Sentinel-AI" className="hover:text-[var(--text)] transition-colors">GitHub</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">About</a>
            <a href="#" className="hover:text-[var(--text)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
