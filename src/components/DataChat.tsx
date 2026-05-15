import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface DataChatProps {
  data: any[];
  profile: any;
}

export default function DataChat({ data, profile }: DataChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create a context from a sample of the data (limit to avoid token issues)
      const context = data.slice(0, 100); 
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          context,
          profile
        })
      });

      if (!response.ok) throw new Error('Failed to get response from AI');

      const chatData = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatData.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while analyzing your data. Please try again.",
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
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Powered by RAG</p>
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
            <h4 className="text-sm font-bold text-slate-900 mb-1">Ask me anything about your data</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
              I can help you find trends, calculate totals, or summarize your dataset.
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
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-[#0f172a] text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none'
                }`}>
                  {m.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
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
              <span className="text-[10px] font-bold uppercase tracking-widest">Analyzing...</span>
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
            placeholder="Ask about your data..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-[#0d9488] text-white rounded-lg hover:bg-[#0c857a] disabled:opacity-50 disabled:hover:bg-[#0d9488] transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-2 text-[9px] text-slate-400 text-center font-medium">
          Note: I analyze a sample of your data to provide answers.
        </p>
      </div>
    </div>
  );
}
