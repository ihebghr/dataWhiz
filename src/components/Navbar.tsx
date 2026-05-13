import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  Database, 
  Zap, 
  Shield, 
  Sparkles, 
  LogIn, 
  Cloud, 
  Download, 
  ChevronDown, 
  FileText, 
  FileCode, 
  FileJson,
  ExternalLink
} from 'lucide-react';

export default function Navbar({ 
  onReset, 
  user, 
  onLogin, 
  onDownload,
  hasData 
}: { 
  onReset: () => void, 
  user: User | null, 
  onLogin: () => void,
  onDownload: (type: 'local' | 'drive' | 'json' | 'pdf') => void,
  hasData: boolean
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <nav className="h-20 flex items-center px-8 border-b border-[#141414]/5 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div onClick={onReset} className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-[#141414] p-2 rounded-xl group-hover:scale-110 transition-transform">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tighter">DATAWHIZ <span className="text-[#0d9488]">AI</span></h1>
            <p className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-[0.2em] -mt-1">Cleaning Suite v1.0</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#141414]/50 hover:text-[#0d9488] transition-colors cursor-default"><Zap className="w-4 h-4" />Quick Clean</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#141414]/50 hover:text-[#0d9488] transition-colors cursor-default"><Sparkles className="w-4 h-4" />AI Engine</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#141414]/50 hover:text-[#0d9488] transition-colors cursor-default"><Shield className="w-4 h-4" />Privacy First</span>
        </div>

        <div className="flex items-center gap-4">
          {hasData && (
            <div className="relative">
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md active:scale-95"
              >
                <Download className="w-3.5 h-3.5" /> 
                Export Data
                <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showExportMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowExportMenu(false)}
                      className="fixed inset-0 z-10"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-20 overflow-hidden"
                    >
                      <div className="px-4 py-2 mb-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select Format</p>
                      </div>
                      
                      <button 
                        onClick={() => { onDownload('local'); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0d9488] transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        Download CSV (.csv)
                      </button>

                      <button 
                        onClick={() => { onDownload('json'); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0d9488] transition-colors"
                      >
                        <FileJson className="w-4 h-4 text-slate-400" />
                        Download JSON (.json)
                      </button>

                      <button 
                        onClick={() => { onDownload('pdf'); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0d9488] transition-colors"
                      >
                        <FileCode className="w-4 h-4 text-slate-400" />
                        Download PDF (.pdf)
                      </button>

                      <div className="h-px bg-slate-100 my-1 mx-2" />

                      <button 
                        onClick={() => { onDownload('drive'); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        <Cloud className="w-4 h-4" />
                        Save to Google Drive
                        <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 pl-3 border-l border-[#141414]/10">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-[#141414] uppercase leading-none">{user.displayName?.split(' ')[0]}</p>
                  <p className="text-[9px] font-medium text-[#141414]/40">Authenticated</p>
                </div>
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  className="w-9 h-9 rounded-full border-2 border-[#2dd4bf] shadow-sm" alt="avatar" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-[10px] font-bold text-[#141414]/40 uppercase tracking-wider">Guest Mode</span>
              <button onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-[#0c857a] transition-all shadow-sm">
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
