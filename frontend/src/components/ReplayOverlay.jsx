// Replay Investigation overlay — themed banner that steps through decisions.
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Cpu } from 'lucide-react';

export default function ReplayOverlay({ decisions, onStepChange, onClose }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const intervalRef = useRef(null);

  const total = decisions?.length || 0;
  const current = decisions?.[index];

  useEffect(() => {
    if (current) {
      onStepChange && onStepChange(current, index);
    }
  }, [index, current, onStepChange]);

  useEffect(() => {
    if (!playing || !total) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= total - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 2200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, total]);

  if (!total) return null;

  const progress = ((index + 1) / total) * 100;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl shadow-[var(--text)]/10 px-5 py-4 w-[min(720px,92vw)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[var(--brand)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">Investigation Replay</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Close replay"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
          className="w-9 h-9 rounded-full bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Previous step"
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="w-10 h-10 rounded-full bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white flex items-center justify-center shadow-sm shadow-[var(--brand)]/30"
          aria-label={playing ? 'Pause replay' : 'Play replay'}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => setIndex(Math.min(total - 1, index + 1))}
          disabled={index === total - 1}
          className="w-9 h-9 rounded-full bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--border)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Next step"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {current?.stage}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              Step {index + 1} / {total}
            </span>
          </div>
          <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text)] truncate">{current?.decision}</p>
        </div>
      </div>
    </div>
  );
}
