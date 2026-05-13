import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Check, LogIn, Sparkles, Shield, Zap } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeroProps {
  onUpload: (data: any) => void;
  user: User | null;
  onLogin: () => void;
}

export default function Hero({ onUpload, user, onLogin }: HeroProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onUpload(data);
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="py-12 flex flex-col items-center text-center">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <span className="px-4 py-1.5 bg-[#0d9488]/10 text-[#0d9488] rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-[#0d9488]/20">
          Intelligent Data Preparation — Free to Use
        </span>
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="text-6xl md:text-7xl font-bold tracking-tight mb-6 max-w-3xl leading-[0.9] text-[#0f172a]">
        Clean your data <span className="text-[#0d9488]">effortlessly</span> with AI.
      </motion.h1>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-lg text-[#64748b] max-w-xl mb-6 leading-relaxed">
        Upload any CSV, Excel, or JSON file. Profile your data, identify anomalies, and apply smart cleaning steps — <strong className="text-[#0f172a]">no account needed</strong> to get started.
      </motion.p>

      {/* Feature pills */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="flex gap-3 mb-10 flex-wrap justify-center">
        {[
          { icon: Zap, text: 'Free to use' },
          { icon: Shield, text: 'No data stored' },
          { icon: Sparkles, text: 'AI-powered' },
        ].map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-full text-[11px] font-semibold text-[#475569] shadow-sm">
            <Icon className="w-3 h-3 text-[#0d9488]" /> {text}
          </span>
        ))}
      </motion.div>

      {/* Upload Zone */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
        className={`relative w-full max-w-2xl group transition-all duration-500 ease-[0.16,1,0.3,1] ${isDragging ? 'scale-[1.02]' : 'scale-100'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }}>
        <div
          className={`relative z-10 border-2 border-dashed p-16 rounded-xl flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-500
            ${isDragging ? 'bg-[#0d9488]/5 border-[#0d9488]' : 'bg-white border-[#e2e8f0] hover:border-[#0d9488]/40 hover:bg-[#f8fafc]'}
            ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
          onClick={() => fileInputRef.current?.click()}>
          <div className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-500 shadow-xl
            ${isDragging ? 'bg-[#0d9488] text-white scale-110' : isUploading ? 'bg-[#0d9488] text-white' : 'bg-[#0f172a] text-white'}`}>
            {isUploading ? (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-10 h-10" />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1 text-[#0f172a]">
              {isUploading ? 'Processing your file...' : 'Click or drag to upload'}
            </h3>
            <p className="text-[#64748b] font-mono text-xs uppercase tracking-wider font-bold">CSV, XLSX, XLS, or JSON · Max 50MB</p>
          </div>
          <div className="flex gap-4 mt-2">
            {['Auto Profiling', 'Type Detection', 'Anomaly Analysis'].map(f => (
              <span key={f} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#475569]">
                <Check className="w-3 h-3 text-[#0d9488]" /> {f}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-[#0d9488] blur-[120px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" />
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls,.json"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-6 px-6 py-4 bg-red-50 border border-red-100 text-red-500 rounded-2xl flex items-center gap-3 text-sm font-medium">
          <Sparkles className="w-4 h-4" /> {error}
        </motion.div>
      )}

      {/* Sign-in CTA (softer, secondary) */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10">
        {user ? (
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[#2dd4bf]" />
            Hi {user.displayName?.split(' ')[0]}, your cleaned files will sync to Google Drive
          </p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-[#64748b]">Want to download results or save to Google Drive?</p>
            <button onClick={onLogin}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-[#e2e8f0] text-[#0f172a] rounded-xl font-bold shadow-sm hover:shadow-md hover:border-[#0d9488]/30 transition-all text-sm">
              <LogIn className="w-4 h-4 text-[#0d9488]" /> Sign in with Google
            </button>
          </div>
        )}
      </motion.div>

      {/* Trust section */}
      <div className="mt-20 w-full border-t border-[#141414]/5 pt-10">
        <p className="text-[10px] font-bold text-[#141414]/30 uppercase tracking-[0.3em] mb-6">Trusted by data teams at</p>
        <div className="flex justify-center items-center gap-12 opacity-20 filter grayscale">
          <span className="text-2xl font-extrabold tracking-tighter">DATA<span className="font-light">CUBE</span></span>
          <span className="text-xl font-bold italic font-serif">CleanFlow</span>
          <span className="text-2xl font-mono uppercase tracking-tighter">Analyzo_</span>
          <span className="text-xl font-medium tracking-tight">Grid<span className="text-[#FF6321]">Logic</span></span>
        </div>
      </div>
    </div>
  );
}
