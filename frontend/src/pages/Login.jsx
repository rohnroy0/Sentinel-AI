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
    <div className="min-h-screen bg-[#050816] text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Background ambient glowing gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-full px-4 py-2 transition-all duration-200 shadow-sm backdrop-blur-md group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span>SOC Enterprise Edition v1.1.0</span>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-7xl mx-auto w-full flex-1 my-6 py-4">
        
        {/* Left Side: Branding & Futuristic Visual Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-8 pr-0 lg:pr-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-2 rounded-2xl">
              <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                Autonomous Security Intelligence
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-300">
              Sentinel-AI
            </h1>
            
            <h2 className="text-lg sm:text-xl font-bold text-indigo-400 tracking-wide">
              AI-Powered Cybersecurity Investigation
            </h2>
            
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
              Detect, analyze, and respond to cyber threats using autonomous AI agents, threat intelligence, and explainable security reasoning.
            </p>
          </div>

          {/* Futuristic Network & Threat Visualization Card */}
          <div className="relative bg-[#111827]/60 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 shadow-2xl shadow-indigo-950/30 overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
            
            {/* Visual Node Links */}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200">Live Telemetry Pipeline</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md">
                  Active Agent Mode
                </span>
              </div>

              {/* Threat Path Graphic */}
              <div className="grid grid-cols-4 gap-2 text-center py-2">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset</span>
                  <span className="text-xs font-mono font-bold text-indigo-300 mt-1">Host 10.0.1</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</span>
                  <span className="text-xs font-mono font-bold text-purple-300 mt-1">OpenSSH 8.9</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vulnerability</span>
                  <span className="text-xs font-mono font-bold text-rose-400 mt-1">CVE-2023</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MITRE</span>
                  <span className="text-xs font-mono font-bold text-amber-300 mt-1">T1190</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>5-Point Explainable AI Reasoning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero Fabrication Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Modern Enterprise Login Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-[#111827]/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 shadow-2xl shadow-indigo-950/50 hover:border-indigo-500/35 transition-all duration-300">
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white tracking-tight mb-1">
                Welcome back
              </h3>
              <p className="text-slate-400 text-sm">
                Sign in to Sentinel-AI to continue your investigations.
              </p>
            </div>

            {/* Explicit Demo Environment Alert */}
            {authMode === 'demo' && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Demo Mode Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  Signing in automatically generates a session-isolated temporary demo identity.
                </p>
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enter Demo Console (Isolated Session)</span>
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-rose-300 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required={authMode !== 'demo'}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    placeholder="analyst@soc.enterprise"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <LockIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required={authMode !== 'demo'}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500/30 accent-indigo-600"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert("Please contact your SOC Administrator or Workspace Owner to reset credentials."); }}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium hover:underline"
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-95 text-white font-bold rounded-xl py-3 px-4 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
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
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-indigo-400 font-semibold hover:underline">
                  Request access
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Security Feature Highlights Section */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full pt-6 border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Card 1 */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 flex items-start gap-3.5 hover:border-indigo-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">AI-Powered Analysis</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Autonomous investigation and reasoning</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 flex items-start gap-3.5 hover:border-purple-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Threat Intelligence</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Evidence-driven vulnerability analysis</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 flex items-start gap-3.5 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <LockIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Secure & Private</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Your investigation data remains protected</p>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
