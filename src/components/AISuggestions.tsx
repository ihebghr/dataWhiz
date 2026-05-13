import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, ArrowRight, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractJSON } from '../lib/aiUtils';

interface AISuggestionsProps {
  profile: any;
  onApplySuggestedAction: (action: string, column: string, reason: string) => void;
}

export default function AISuggestions({ profile, onApplySuggestedAction }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const summary = Object.entries(profile).map(([col, stats]: [string, any]) => {
          let details = `type=${stats.type}, missing=${stats.missingPercentage}%, unique=${stats.uniqueCount}`;
          if (stats.type === 'number') {
            details += `, mean=${stats.mean}, min=${stats.min}, max=${stats.max}`;
          }
          return `${col}: ${details}`;
      }).join('\n');

      const prompt = `
        You are an expert data scientist. Analyze this dataset profile and suggest 3 high-impact cleaning or transformation actions.
        IMPORTANT: Your response must be a valid JSON object with a "suggestions" key containing the list of suggestions.
        
        Summary:
        ${summary}

        Schema:
        {
          "suggestions": [
            { "type": "IMPUTE", "column": "col_name", "action": "Fill with Mean", "reason": "Reason why..." },
            { "type": "ROUND", "column": "col_name", "action": "Round Up", "reason": "Found decimals in integer column..." },
            { "type": "OUTLIER", "column": "col_name", "action": "Remove Outliers", "reason": "Wide range detected..." }
          ]
        }
      `;

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = 'AI request failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const result = extractJSON(data.text);
      if (!Array.isArray(result)) throw new Error('AI response was not an array of suggestions');
      setSuggestions(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate AI suggestions.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#0f172a] text-white p-8 rounded-lg space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
        <Wand2 className="w-48 h-48 rotate-12" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
            Smart Engine <span className="text-[10px] bg-[#0d9488] px-2 py-0.5 rounded font-bold uppercase tracking-wider">AI</span>
          </h3>
        </div>
        <p className="text-white/40 text-sm leading-relaxed max-w-sm">
          Our specialized agent identifies hidden patterns and vulnerabilities.
        </p>

        <AnimatePresence mode="wait">
          {!suggestions ? (
            <motion.div
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <button 
                onClick={generateSuggestions}
                disabled={isGenerating}
                className={`
                  w-full py-3 bg-[#1e293b] hover:bg-[#334155] transition-all rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing Patterns...
                  </>
                ) : (
                  <>
                    Analyze Dataset <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 space-y-4"
            >
              {suggestions.map((s, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#2dd4bf] uppercase tracking-widest px-2 py-0.5 bg-[#2dd4bf]/10 rounded">
                      {s.type}
                    </span>
                    <button 
                      onClick={() => onApplySuggestedAction(s.action, s.column, s.reason)}
                      className="text-[10px] font-bold text-white/40 hover:text-[#2dd4bf] uppercase tracking-widest flex items-center gap-1"
                    >
                      Apply <Sparkles className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold mb-1">{s.action} <span className="text-white/40 italic">on {s.column}</span></h4>
                  <p className="text-[11px] text-white/50 leading-relaxed font-medium">{s.reason}</p>
                </div>
              ))}
              <button 
                onClick={() => setSuggestions(null)}
                className="w-full text-[10px] font-bold text-white/20 hover:text-white/40 uppercase tracking-widest py-2"
              >
                Clear Suggestions
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-start gap-3 text-xs leading-tight">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
