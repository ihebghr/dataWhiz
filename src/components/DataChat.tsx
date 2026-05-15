import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare, Wand2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isAction?: boolean;
  actions?: any[];
}

interface DataChatProps {
  data: any[];
  profile: any;
  onApplyActions: (actions: any[]) => void;
}

export default function DataChat({ data, profile, onApplyActions }: DataChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (isCleaning = false) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const context = data.slice(0, 100); 
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentInput,
          context,
          profile,
          isCleaningRequest: isCleaning
        })
      });

      if (!response.ok) throw new Error('Failed to get response from AI');

      const chatData = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatData.message,
        timestamp: Date.now(),
        isAction: chatData.isAction,
        actions: chatData.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error analyzing your data. Please try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0d9488] flex items-center justify-center text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Data Assistant</h3>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Analysis & Cleaning</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0d9488]/10 text-[#0d9488] rounded-full">
          <Sparkles className="w-3 h-3" />
          <span className="text-[10px] font-bold uppercase">Ready</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#f8fafc]/50"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">How can I help with your data today?</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[250px]">
              You can ask questions or give instructions like "make names uppercase" or "fill nulls in Age with mean".
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-[#0d9488] text-white'
                }`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#0f172a] text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none'
                  }`}>
                    {m.content?.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                    ))}
                  </div>
                  
                  {m.isAction && !m.actions && (
                    <button 
                      onClick={() => { setInput(`Yes, please clean: ${messages[messages.indexOf(m)-1]?.content}`); handleSend(true); }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#0d9488]/10 text-[#0d9488] text-[10px] font-bold uppercase rounded-lg self-start hover:bg-[#0d9488]/20 transition-all"
                    >
                      <Wand2 className="w-3 h-3" /> Generate Cleaning Plan
                    </button>
                  )}

                  {m.actions && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposed Actions</p>
                      {m.actions.map((act: any, i: number) => (
                        <div key={i} className="text-[11px] text-slate-600 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0d9488] mt-1 shrink-0" />
                          <span><strong>{act.type}</strong> on {act.column}: {act.action}</span>
                        </div>
                      ))}
                      <button 
                        onClick={() => onApplyActions(m.actions!)}
                        className="w-full mt-2 py-2 bg-[#0d9488] text-white text-[10px] font-bold uppercase rounded hover:bg-[#0c857a] transition-all"
                      >
                        Apply Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-3 items-center text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Thinking...</span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or give a command..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0c857a] disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
