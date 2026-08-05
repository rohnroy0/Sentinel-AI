import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: authError } = await signUp(email, password);
    
    if (authError) {
      console.error("Supabase signup error:", authError);
      let errorMsg = authError.message || "An unexpected error occurred during signup.";
      
      // Specifically handle 500 errors which are usually SMTP/Email rate limits on Supabase
      if (authError.status === 500 || authError.code === 500) {
        errorMsg = `Server Error (500): ${authError.message}. This is typically caused by unconfigured SMTP/email settings in Supabase or reaching the email rate limit.`;
      }
      
      setError(errorMsg);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 text-[var(--text)] font-sans">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[var(--brand)]/10 rounded-2xl border border-[var(--brand)]/20 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-[var(--brand)]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-[var(--text)] mb-2">Request Access</h2>
          <p className="text-center text-[var(--text-muted)] text-sm mb-8">Create a new operator account for Sentinel-AI.</p>

          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-3">Check your email</h3>
              <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
                We've sent a verification link to <strong className="text-[var(--text)]">{email}</strong>. 
                Please verify your email address to activate your account.
              </p>
              <Link to="/login" className="w-full inline-block bg-[var(--brand)] hover:opacity-90 text-[var(--surface)] font-bold rounded-xl px-4 py-3 transition-opacity">
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--danger)]">{error}</p>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
                    placeholder="operator@soc.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[var(--text)] mb-1.5" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-colors"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-2">Password must be at least 6 characters long.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--brand)] hover:opacity-90 text-[var(--surface)] font-bold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
        
        {!submitted && (
          <div className="border-t border-[var(--border)] p-6 bg-[var(--surface-dark)] text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--brand)] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
