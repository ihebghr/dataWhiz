import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ExternalLink, X, Cloud } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileLink: string | null;
  fileName: string;
}

export default function SuccessModal({ isOpen, onClose, fileLink, fileName }: SuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header with Pattern */}
            <div className="h-24 bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center relative">
              <div className="absolute top-3 right-3">
                <button 
                  onClick={onClose}
                  className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg"
              >
                <CheckCircle2 size={32} className="text-emerald-500" />
              </motion.div>
            </div>

            <div className="p-8 text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Successfully Uploaded!
              </h3>
              <p className="text-slate-500 mb-6">
                Your file <span className="font-semibold text-slate-700">"{fileName}"</span> has been saved to your <span className="text-teal-600 font-medium">DataWhiz AI</span> folder in Google Drive.
              </p>

              <div className="space-y-3">
                {fileLink && (
                  <a
                    href={fileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg group"
                  >
                    <Cloud size={18} />
                    View in Google Drive
                    <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {/* Bottom Accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 to-emerald-500" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
