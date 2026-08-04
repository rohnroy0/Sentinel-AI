import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, AlertCircle, ScanLine, ChevronRight } from 'lucide-react';
import { uploadScan, startInvestigation } from '../api/investigationService';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

const SAMPLE_SCANS = [
  { label: 'Linux / Web baseline', file: 'sample_scan.txt' },
  { label: 'Windows Server (AD + IIS + SMB)', file: 'windows_scan.txt' },
  { label: 'DevOps stack (Jenkins, Redis, Mongo, Postgres)', file: 'devops_scan.txt' },
];

export default function UploadScan() {
  const [dragActive, setDragActive] = useState(false);
  const [scanContent, setScanContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const text = await file.text();
      setScanContent(text);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      setScanContent(text);
    }
  };

  const handleLoadSample = async (filename) => {
    try {
      const res = await fetch(`/demo_data/${filename}`);
      if (!res.ok) throw new Error('Could not load sample');
      const text = await res.text();
      setScanContent(text);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    if (!scanContent.trim()) {
      setError('Please provide scan data.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await uploadScan(scanContent);
      const investigationId = response.investigationId;
      localStorage.setItem('inv_id', investigationId);
      await startInvestigation(investigationId);
      navigate(`/app/investigation/${investigationId}`);
    } catch (err) {
      setError(err.message || 'Failed to start investigation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investigation"
        title="Upload Scan Findings"
        description="Upload Nmap XML, JSON, or raw text. Sentinel parses services, applies rules, scores risk, and builds attack chains — all auditable."
      />

      {error && (
        <div className="bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-xl p-4 flex items-center text-[var(--danger)]">
          <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Card padding="p-0">
        {/* Drop zone */}
        <div className="p-8 border-b border-[var(--border)]">
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-[var(--brand)] bg-[var(--sidebar)]'
                : 'border-[var(--border-strong)] bg-[var(--bg)] hover:border-[var(--text-subtle)]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
              dragActive ? 'bg-[var(--sidebar-active)]' : 'bg-[var(--surface)] border border-[var(--border)]'
            }`}>
              <UploadCloud className={`w-7 h-7 ${dragActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Drag and drop your scan file</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Supported formats: Nmap XML, TXT, JSON</p>
            <label className="inline-flex items-center gap-2 bg-[var(--text)] hover:opacity-90 text-[var(--surface)] px-5 py-2.5 rounded-lg cursor-pointer transition-colors text-sm font-semibold">
              Browse files
              <input type="file" className="hidden" accept=".xml,.txt,.json" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {/* Sample scans */}
        <div className="px-8 pt-6 pb-2 border-b border-[var(--border)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Sample scans</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SCANS.map((s) => (
              <button
                key={s.file}
                type="button"
                onClick={() => handleLoadSample(s.file)}
                className="inline-flex items-center gap-1.5 bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              >
                <ScanLine className="w-3.5 h-3.5 text-[var(--brand)]" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Raw input */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--text-muted)]" />
              Raw input
            </h3>
            {scanContent && (
              <span className="text-xs font-semibold bg-[var(--success-bg)] text-[var(--code-text)] border border-[var(--success-border)] px-2.5 py-1 rounded-full">
                Data loaded · {scanContent.length.toLocaleString()} chars
              </span>
            )}
          </div>
          <textarea
            className="w-full h-48 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 text-[var(--text)] font-mono text-sm focus:outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 transition resize-none"
            placeholder="Or paste your scan output here…"
            value={scanContent}
            onChange={(e) => setScanContent(e.target.value)}
          />
        </div>

        <div className="px-8 py-5 bg-[var(--bg)] border-t border-[var(--border)] rounded-b-xl flex justify-between items-center">
          <p className="text-xs text-[var(--text-muted)]">Sentinel will store the scan and run the 8-stage pipeline.</p>
          <button
            onClick={handleSubmit}
            disabled={!scanContent.trim() || loading}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
              !scanContent.trim() || loading
                ? 'bg-[var(--border)] text-[var(--text-subtle)] cursor-not-allowed'
                : 'bg-[var(--brand)] hover:bg-[var(--brand-700)] text-white shadow-sm shadow-[var(--brand)]/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Initializing engine…</span>
              </>
            ) : (
              <>
                <span>Start investigation</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
}
