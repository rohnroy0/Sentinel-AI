import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  HelpCircle,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { fetchApi } from '../api/apiClient';

const SUGGESTED_QUESTIONS = [
  'Why is this host dangerous?',
  'Explain port 22 risks & attack paths',
  'What are the top remediation priorities?',
  'Are there any unauthenticated RCE vulnerabilities?',
];

export default function AskSentinelDrawer({ investigationId = '', statusData = null, onAskSentinel = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen, isAsking]);

  const handleAsk = async (userQuestion) => {
    const q = (userQuestion || question).trim();
    if (!q || isAsking) return;

    setQuestion('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: q, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setIsAsking(true);

    try {
      if (onAskSentinel) {
        const res = await onAskSentinel(investigationId, q);
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'sentinel',
            text: res.answer,
            evidence: res.evidence,
            recommendation: res.recommendation,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        const activeInvId = investigationId || localStorage.getItem('inv_id') || '';
        const data = await fetchApi('/agent/ask', {
          method: 'POST',
          body: JSON.stringify({ investigation_id: activeInvId, question: q }),
        });
        setChatHistory((prev) => [
          ...prev,
          {
            sender: 'sentinel',
            text: data.answer || 'No response received from Sentinel-AI.',
            evidence: data.evidence,
            recommendation: data.recommendation,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'sentinel',
          text: 'Error contacting Ask Sentinel engine. Please verify the backend service is reachable and an investigation is active.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleClearChat = () => {
    setChatHistory([]);
  };

  const findingsCount = statusData?.findings?.length || 0;
  const hostsCount = statusData?.discovered_hosts?.length || (statusData?.final_report?.total_hosts || 0);

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white rounded-full shadow-2xl border border-white/10 hover:shadow-cyan-500/25 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          aria-label="Open Ask Sentinel AI Assistant"
        >
          <span className="relative flex h-3 w-3">
            {investigationId ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            )}
          </span>
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold tracking-wide pr-1">Ask Sentinel</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/10">
            AI SOC
          </span>
        </button>
      </div>

      {/* Backdrop for Mobile / Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Sliding Side Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isExpanded ? 'w-full md:w-[680px]' : 'w-full sm:w-[460px] md:w-[500px]'}`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-dark)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--brand)]/15 border border-[var(--brand)]/30 flex items-center justify-center shrink-0 text-[var(--brand)]">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight truncate">
                  Ask Sentinel AI
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--brand)]/20 text-[var(--brand-accent)] border border-[var(--brand)]/30 font-semibold">
                  COPILOT
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Contextual reasoning over active telemetry & CVEs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse' : 'Expand width'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--surface)] transition-colors hidden sm:block"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClearChat}
              title="Clear chat history"
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-[var(--surface)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              title="Close drawer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[var(--surface)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Investigation Context Pill Banner */}
        <div className="px-4 py-2 bg-[var(--bg)] border-b border-[var(--border)] flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`inline-flex rounded-full h-2 w-2 ${investigationId ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {investigationId ? (
                <>
                  <span className="text-emerald-400 font-semibold">Context Active:</span> #{investigationId.slice(0, 8)}
                </>
              ) : (
                <span className="text-amber-400">No active investigation loaded</span>
              )}
            </span>
          </div>

          {investigationId && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
              <span>{hostsCount} Hosts</span>
              <span>·</span>
              <span className="text-rose-400 font-semibold">{findingsCount} Findings</span>
            </div>
          )}
        </div>

        {/* Chat History Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {chatHistory.length === 0 ? (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-[var(--surface-dark)] border border-[var(--border)] space-y-2.5">
                <div className="flex items-center gap-2 text-[var(--brand)] font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Interactive SOC Security Copilot</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Ask any question regarding the active network scan, correlated CVE vulnerabilities, MITRE attack paths, or mitigation strategies.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                  Suggested Inquiries
                </label>
                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map((qText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAsk(qText)}
                      className="w-full text-left p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-dark)] hover:border-[var(--brand)] hover:bg-[var(--brand)]/10 text-gray-300 hover:text-white transition-all flex items-center justify-between text-xs group"
                    >
                      <span className="truncate pr-2">{qText}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-[var(--brand)] shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'sentinel' && (
                  <div className="w-7 h-7 rounded-lg bg-[var(--brand)]/20 border border-[var(--brand)]/40 flex items-center justify-center shrink-0 text-[var(--brand)] mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-3.5 space-y-2.5 shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[var(--brand)] text-white ml-6 rounded-tr-xs'
                      : 'bg-[var(--surface-dark)] border border-[var(--border)] text-gray-200 mr-2 rounded-tl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 font-mono">
                    <span className="font-bold uppercase tracking-wider">
                      {msg.sender === 'user' ? 'You' : 'Sentinel-AI'}
                    </span>
                    <span>{msg.time}</span>
                  </div>

                  <div className="text-xs leading-relaxed whitespace-pre-line font-mono">
                    {msg.text}
                  </div>

                  {/* Evidence Pill List */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)] space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        Verified Evidence
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.evidence.map((ev, evIdx) => (
                          <span
                            key={evIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation Callout */}
                  {msg.recommendation && (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                          Remediation Action
                        </span>
                        {msg.recommendation}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-gray-700 border border-gray-600 flex items-center justify-center shrink-0 text-white mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Thinking / Loading indicator */}
          {isAsking && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-7 h-7 rounded-lg bg-[var(--brand)]/20 border border-[var(--brand)]/40 flex items-center justify-center shrink-0 text-[var(--brand)] animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[var(--surface-dark)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-muted)] flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--brand)]" />
                <span className="font-mono text-[11px]">Sentinel is analyzing telemetry & findings...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Field & Submit Action */}
        <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-dark)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking}
              placeholder="Ask Sentinel (e.g. Why is port 22 dangerous?)"
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--brand)] disabled:opacity-60 transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="px-4 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
            >
              {isAsking ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 px-1 font-mono">
            <span>Powered by Sentinel Investigation Memory</span>
            <span>Press Enter ↵</span>
          </div>
        </div>
      </div>
    </>
  );
}
