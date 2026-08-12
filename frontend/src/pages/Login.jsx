import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertCircle,
  LogIn,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock as LockIcon,
  Shield,
  Brain,
  Activity,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { signIn, authMode } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: authError } = await signIn(email, password);
    
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate('/app');
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    await signIn('evaluator@soc.demo', 'demo-password');
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]">
          <span className="w-2 h-2 rounded-full bg-[var(--brand)]" />
          <span>SOC Enterprise Edition v1.1.0</span>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center max-w-7xl mx-auto w-full flex-1 my-6 py-4">
        
        {/* Left Side: Branding & Futuristic Visual Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-8 pr-0 lg:pr-6">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-serif font-normal tracking-[-1.5px] text-[var(--text)]">
              Sentinel-AI
            </h1>
            
            <h2 className="text-xl font-bold text-[var(--brand)] tracking-wide">
              AI-Powered Cybersecurity Investigation
            </h2>
            
            <p className="text-[var(--text-muted)] text-lg leading-relaxed max-w-xl">
              Detect, analyze, and respond to cyber threats using autonomous AI agents, threat intelligence, and explainable security reasoning.
            </p>
          </div>

          {/* Product Chrome Visual Panel */}
          <div className="dark bg-[var(--bg)] border border-[var(--border)] rounded-xl p-6 shadow-md overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--brand)]" />
                  <span className="text-xs font-bold text-[var(--text)]">Live Telemetry Pipeline</span>
                </div>
                <span className="text-[10px] font-mono bg-[var(--success-bg)] text-[var(--success)] px-2 py-0.5 rounded-md">
                  Active Agent Mode
                </span>
              </div>

              {/* Threat Path Graphic */}
              <div className="grid grid-cols-4 gap-2 text-center py-2">
                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Asset</span>
                  <span className="text-xs font-mono font-bold text-[var(--text)] mt-1">Host 10.0.1</span>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Service</span>
                  <span className="text-xs font-mono font-bold text-[var(--text)] mt-1">OpenSSH 8.9</span>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Vulnerability</span>
                  <span className="text-xs font-mono font-bold text-[var(--danger)] mt-1">CVE-2023</span>
                </div>
                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-md p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">MITRE</span>
                  <span className="text-xs font-mono font-bold text-[var(--warning)] mt-1">T1190</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                  <span>5-Point Explainable AI Reasoning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                  <span>Zero Fabrication Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Modern Enterprise Login Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8">
            
            <div className="mb-8">
              <h3 className="text-3xl font-serif font-normal tracking-tight text-[var(--text)] mb-2">
                Welcome back
              </h3>
              <p className="text-[var(--text-muted)] text-sm">
                Sign in to Sentinel-AI to continue your investigations.
              </p>
            </div>

            {/* Explicit Demo Environment Alert */}
            {authMode === 'demo' && (
              <div className="mb-6 p-4 bg-[var(--success-bg)] border border-[var(--success)] rounded-lg">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-[var(--success)] shrink-0" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--success)]">
                    Demo Mode Active
                  </span>
                </div>
                <p className="text-xs text-[var(--text)] mb-3 leading-relaxed">
                  Signing in automatically generates a session-isolated temporary demo identity.
                </p>
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="w-full bg-[var(--success)] hover:opacity-90 text-[var(--bg)] font-bold text-xs py-2.5 rounded-md transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enter Demo Console (Isolated Session)</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-[var(--danger-bg)] border border-[var(--danger)] rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-[var(--text)] leading-relaxed">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required={authMode !== 'demo'}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-md pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--brand)] transition-colors"
                    placeholder="analyst@soc.enterprise"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <LockIcon className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required={authMode !== 'demo'}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-md pl-10 pr-10 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--brand)] transition-colors"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg)] text-[var(--brand)] focus:ring-[var(--brand)]"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert("Please contact your SOC Administrator or Workspace Owner to reset credentials."); }}
                  className="text-[var(--brand)] hover:text-[var(--brand-700)] transition-colors font-medium hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--brand)] hover:bg-[var(--brand-700)] text-[var(--on-primary)] font-bold rounded-md py-3 px-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Card Footer */}
            <div className="mt-8 pt-5 border-t border-[var(--border)] text-center">
              <p className="text-xs text-[var(--text-muted)]">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[var(--brand)] font-semibold hover:underline">
                  Request access
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Security Feature Highlights Section */}
      <footer className="max-w-7xl mx-auto w-full pt-6 border-t border-[var(--border)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Card 1 */}
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3.5 hover:border-[var(--brand)] transition-colors">
            <div className="w-10 h-10 rounded-md bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[var(--text)]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text)]">AI-Powered Analysis</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Autonomous investigation and reasoning</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3.5 hover:border-[var(--brand)] transition-colors">
            <div className="w-10 h-10 rounded-md bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-[var(--text)]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text)]">Threat Intelligence</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Evidence-driven vulnerability analysis</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3.5 hover:border-[var(--brand)] transition-colors">
            <div className="w-10 h-10 rounded-md bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center shrink-0">
              <LockIcon className="w-5 h-5 text-[var(--text)]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[var(--text)]">Secure & Private</h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Your investigation data remains protected</p>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
