import { motion, AnimatePresence } from 'motion/react';
import { History, Clock, ChevronRight } from 'lucide-react';
import { ActionLog } from '../App';

export default function ActionHistory({ history, onUndo }: { history: ActionLog[], onUndo: () => void }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-[#0d9488]/10 text-[#0d9488] flex items-center justify-center">
              <History className="w-5 h-5" />
           </div>
           <h4 className="text-xl font-bold tracking-tight">Cleaning Logs</h4>
        </div>
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button 
              onClick={onUndo}
              className="text-[10px] font-bold text-[#0d9488] hover:text-[#0c857a] uppercase tracking-widest border border-[#0d9488]/20 px-2 py-1 rounded hover:bg-[#0d9488]/5 transition-all"
            >
              Undo Last
            </button>
          )}
          <span className="text-[10px] font-mono font-bold bg-slate-100 px-3 py-1 rounded text-slate-500 uppercase tracking-widest">
             {history.length} Events
          </span>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {history.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-center py-12 px-4 border-2 border-dashed border-[#141414]/5 rounded-3xl"
            >
               <Clock className="w-8 h-8 text-[#141414]/10 mx-auto mb-3" />
               <p className="text-xs font-medium text-[#141414]/30 uppercase tracking-widest">No actions applied yet</p>
            </motion.div>
          ) : (
            history.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="group relative pl-6 pb-6 border-l border-[#141414]/5 last:pb-0"
              >
                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#FF6321] shadow-lg shadow-[#FF6321]/20 group-hover:scale-125 transition-transform" />
                
                <div className="bg-[#0f172a]/[0.02] p-4 rounded-lg group-hover:bg-[#0f172a]/[0.04] transition-colors border border-transparent group-hover:border-[#0f172a]/5">
                   <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-[#0d9488] uppercase tracking-widest">{item.type}</span>
                      <span className="text-[9px] font-mono text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <p className="text-xs font-semibold text-[#141414]/80 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
