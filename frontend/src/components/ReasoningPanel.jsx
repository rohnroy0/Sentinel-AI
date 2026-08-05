import React, { useState } from 'react';
import { Brain, MessageSquare, Send, Cpu, CheckCircle, Sparkles, Terminal } from 'lucide-react';
import { fetchApi } from '../api/apiClient';
import { useInvestigation } from '../context/InvestigationContext';

export default function ReasoningPanel({ reasoningSteps = [], investigationId = '', onAskSentinel }) {
  const { investigationId: contextInvId } = useInvestigation();
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    const activeInvId = investigationId || contextInvId || '';
    if (!question.trim() || !activeInvId) return;

    const userQ = question;
    setQuestion('');
    setChatHistory((prev) => [...prev, { sender: 'user', text: userQ }]);
    setIsAsking(true);

    try {
      if (onAskSentinel) {
        const res = await onAskSentinel(activeInvId, userQ);
        setChatHistory((prev) => [
          ...prev,
          { sender: 'sentinel', text: res.answer, evidence: res.evidence, recommendation: res.recommendation },
        ]);
      } else {
        const data = await fetchApi('/agent/ask', {
          method: 'POST',
          body: JSON.stringify({ investigation_id: activeInvId, question: userQ }),
        });
        setChatHistory((prev) => [
          ...prev,
          { sender: 'sentinel', text: data.answer, evidence: data.evidence, recommendation: data.recommendation },
        ]);
      }
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'sentinel', text: 'Error contacting Ask Sentinel engine. Please try again.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-sm space-y-5">
      {/* Reasoning Steps Audit Log */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2.5">
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Autonomous Agent Reasoning Log
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg)] px-2 py-0.5 rounded border border-[var(--border)]">
            {reasoningSteps.length} Steps Recorded
          </span>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {reasoningSteps.length === 0 ? (
            <div className="p-4 text-xs text-gray-500 italic bg-[var(--bg)] border border-[var(--border)] rounded-lg text-center font-mono">
              Awaiting autonomous agent reasoning trajectory...
            </div>
          ) : (
            reasoningSteps.map((step, idx) => (
              <div key={idx} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-xs space-y-1.5 transition-all hover:border-[var(--border-strong)]">
                <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Stage: {step.stage}
                  </span>
                  <span className="font-mono text-gray-400 text-[10px] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                    {step.tool || step.action}
                  </span>
                </div>
                <p className="text-gray-300 font-mono text-[11px] leading-relaxed">
                  {step.reason || step.action || step.summary}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Embedded Quick Ask Sentinel Bar */}
      <div className="border-t border-[var(--border)] pt-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Ask Sentinel</h4>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Floating copilot also available
          </span>
        </div>

        {chatHistory.length > 0 && (
          <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 mb-2.5 max-h-40 overflow-y-auto space-y-2 text-xs">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg text-[11px] ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/15 border border-blue-500/30 ml-4 text-blue-200'
                    : 'bg-emerald-500/10 border border-emerald-500/20 mr-4 text-emerald-300'
                }`}
              >
                <div className="font-bold text-[9px] uppercase mb-0.5 opacity-75 font-mono">
                  {msg.sender === 'user' ? 'You' : 'Sentinel-AI'}
                </div>
                <div className="whitespace-pre-line font-mono">{msg.text}</div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAsk} className="flex space-x-2">
          <input
            type="text"
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--brand)] font-mono"
            placeholder="Ask a quick follow-up question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            type="submit"
            disabled={isAsking}
            className="px-3.5 py-2 bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
