import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, BarChart3, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, 
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  chart?: any;
  cleaningActions?: any[];
}

interface ChatInterfaceProps {
  data: any[];
  profile: any;
  onApplyActions: (actions: any[], chart?: any) => void;
  onChartGenerated?: (chart: any) => void;
}

const COLORS = ['#0d9488', '#0f766e', '#14b8a6', '#2dd4bf', '#5eead4'];

export default function ChatInterface({ data, profile, onApplyActions, onChartGenerated }: ChatInterfaceProps) {
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

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          dataSample: data.slice(0, 10),
          profile,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const result = await response.json();
      
      if (result.chart && onChartGenerated) {
        onChartGenerated(result.chart);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.reply,
        chart: result.chart,
        cleaningActions: result.cleaningActions
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = (chart: any) => {
    if (!chart || !chart.type || !chart.x || !chart.y) return null;

    const ChartComponent = {
      bar: BarChart,
      line: LineChart,
      scatter: ScatterChart,
      area: AreaChart,
      pie: PieChart
    }[chart.type as 'bar' | 'line' | 'scatter' | 'area' | 'pie'] || BarChart;

    return (
      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10 h-64 w-full">
        <h4 className="text-sm font-medium mb-4 text-white/70">{chart.title || 'Data Visualization'}</h4>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data.slice(0, 50)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey={chart.x} stroke="#ffffff50" fontSize={12} />
            <YAxis stroke="#ffffff50" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', color: '#fff' }}
              itemStyle={{ color: '#0d9488' }}
            />
            <Legend />
            {chart.type === 'pie' ? (
              <Pie
                data={data.slice(0, 10)}
                dataKey={chart.y}
                nameKey={chart.x}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#0d9488"
                label
              >
                {data.slice(0, 10).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            ) : chart.type === 'scatter' ? (
              <Scatter name={chart.title} data={data.slice(0, 50)} fill="#0d9488" />
            ) : chart.type === 'area' ? (
              <Area type="monotone" dataKey={chart.y} stroke="#0d9488" fill="#0d948830" />
            ) : chart.type === 'line' ? (
              <Line type="monotone" dataKey={chart.y} stroke="#0d9488" strokeWidth={2} dot={{ r: 4 }} />
            ) : (
              <Bar dataKey={chart.y} fill="#0d9488" radius={[4, 4, 0, 0]} />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#0d9488]" />
          <h3 className="font-bold text-white tracking-tight uppercase text-sm">DataWhiz AI Assistant</h3>
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-white/40 uppercase font-bold">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
              <Bot className="w-8 h-8 text-white/20" />
            </div>
            <h4 className="text-white font-medium">Ready to analyze your data</h4>
            <p className="text-white/40 text-sm max-w-xs">
              Ask me to visualize trends, clean columns, or explain patterns in your dataset.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs mt-4">
              {['Show me revenue trends', 'Find missing values', 'Clean the age column'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="text-xs text-white/50 bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-lg transition-colors text-left"
                >
                  "{hint}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              m.role === 'user' ? 'bg-[#0d9488]' : 'bg-white/10'
            }`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#0d9488]" />}
            </div>
            <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-[#0d9488] text-white rounded-tr-none' 
                  : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
              }`}>
                {m.content}
              </div>
              
              {m.chart && renderChart(m.chart)}
              
              {m.cleaningActions && m.cleaningActions.length > 0 && (
                <div className="mt-2 p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase tracking-wider">
                    <Wand2 className="w-3 h-3 text-[#0d9488]" />
                    Suggested Cleaning
                  </div>
                  <div className="space-y-1">
                    {m.cleaningActions.map((action, idx) => (
                      <div key={idx} className="text-xs text-white/40 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[#0d9488]"></div>
                        {action.type.replace('_', ' ')}: {action.column || action.oldName}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => onApplyActions(m.cleaningActions!, m.chart)}
                    className="w-full py-2 bg-[#0d9488]/20 hover:bg-[#0d9488]/30 text-[#2dd4bf] text-xs font-bold rounded-lg border border-[#0d9488]/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {m.chart ? 'SAVE CHART & APPLY' : 'APPLY ACTIONS'}
                  </button>
                </div>
              )}

              {m.chart && !m.cleaningActions && (
                <div className="mt-2">
                  <button
                    onClick={() => onApplyActions([], m.chart)}
                    className="w-full py-2 bg-[#0d9488]/20 hover:bg-[#0d9488]/30 text-[#2dd4bf] text-xs font-bold rounded-lg border border-[#0d9488]/30 transition-all flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-3 h-3" />
                    SAVE TO INSIGHTS
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[#0d9488]" />
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#0d9488] animate-spin" />
              <span className="text-xs text-white/40 font-medium uppercase tracking-widest">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your data..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 disabled:hover:bg-[#0d9488] text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-center text-white/20 uppercase font-bold tracking-widest">
          Powered by Llama 3.3 via Groq
        </p>
      </div>
    </div>
  );
}
