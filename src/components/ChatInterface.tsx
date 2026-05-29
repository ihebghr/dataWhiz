import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Sparkles, User, Bot, BarChart3, Wand2, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, 
  AreaChart, Area, PieChart, Pie, Cell, LabelList,
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

// Use the same vibrant palettes
const CHART_PALETTES = {
  primary: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ],
  sunset: [
    '#FF6B35', '#F7931E', '#FFBE0B', '#FB5607', '#FF006E',
    '#8338EC', '#3A86FF', '#06FFA5', '#FFCA3A', '#FF5983'
  ]
};

// Same aggregation function
const aggregateData = (data: any[], xKey: string, yKey: string, chartType: string) => {
  if (!data || data.length === 0) return [];

  const isCategorical = data.some(d => typeof d[xKey] === 'string' || typeof d[xKey] === 'boolean');
  
  if (isCategorical || chartType === 'pie') {
    const grouped: any = {};
    data.forEach(item => {
      const key = String(item[xKey]);
      if (!grouped[key]) {
        grouped[key] = { [xKey]: key, [yKey]: 0, count: 0 };
      }
      const yVal = Number(item[yKey]);
      grouped[key][yKey] += isNaN(yVal) ? 1 : yVal;
      grouped[key].count += 1;
    });
    
    return Object.values(grouped)
      .sort((a: any, b: any) => b[yKey] - a[yKey])
      .slice(0, 12);
  }

  return [...data]
    .sort((a, b) => Number(a[xKey]) - Number(b[xKey]))
    .slice(0, 40);
};

const getGradientId = (color: string, index: number) => `chat-gradient-${color.replace('#', '')}-${index}`;

// Single chart component for ChatInterface
interface ChatSingleChartProps {
  chart: any;
  data: any[];
}

const ChatSingleChart: React.FC<ChatSingleChartProps> = ({ chart, data }) => {
  const ChartComponent = {
    bar: BarChart,
    line: LineChart,
    scatter: ScatterChart,
    area: AreaChart,
    pie: PieChart
  }[chart.type as 'bar' | 'line' | 'scatter' | 'area' | 'pie'] || BarChart;

  const chartData = useMemo(() => 
    aggregateData(data, chart.x, chart.y, chart.type),
    [data, chart.x, chart.y, chart.type]
  );

  const colors = CHART_PALETTES.primary;

  return (
    <div className="mt-4 p-5 bg-white/5 rounded-2xl border border-white/10 h-72 w-full">
      <h4 className="text-sm font-semibold mb-4 text-white/80 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#2dd4bf]" />
        {chart.title || 'Data Visualization'}
      </h4>
      <ResponsiveContainer width="100%" height="85%" minWidth={250} minHeight={200}>
        <ChartComponent data={chartData} margin={{ top: 10, right: 20, left: 30, bottom: 20 }}>
          <defs>
            {colors.map((color, i) => (
              <linearGradient key={i} id={getGradientId(color, i)} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1}/>
                <stop offset="100%" stopColor={color} stopOpacity={0.4}/>
              </linearGradient>
            ))}
          </defs>
          {chart.type !== 'pie' && <CartesianGrid strokeDasharray="4 4" stroke="#ffffff15" vertical={false} />}
          {chart.type !== 'pie' && (
            <XAxis 
              dataKey={chart.x} 
              stroke="#ffffff50" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#cbd5e1', fontWeight: 500 }}
              angle={-20}
              textAnchor="end"
              height={45}
            />
          )}
          {chart.type !== 'pie' && (
            <YAxis 
              stroke="#ffffff50" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#cbd5e1', fontWeight: 500 }}
            />
          )}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid #ffffff20', 
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}
            itemStyle={{ color: '#2dd4bf', fontWeight: 700 }}
            labelStyle={{ color: '#e2e8f0', marginBottom: '8px', fontWeight: 600 }}
          />
          {chart.type !== 'pie' && <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />}
          
          {chart.type === 'pie' ? (
            <Pie
              data={chartData}
              dataKey={chart.y}
              nameKey={chart.x}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={6}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: '#475569', strokeWidth: 1.5 }}
              labelStyle={{ fill: '#cbd5e1', fontSize: '10px', fontWeight: 600 }}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          ) : chart.type === 'scatter' ? (
            <Scatter name={chart.title} data={chartData}>
              {chartData.map((entry, index) => (
                <Scatter key={index} dataKey={chart.y} fill={colors[index % colors.length]} />
              ))}
            </Scatter>
          ) : chart.type === 'area' ? (
            <Area 
              type="monotone" 
              dataKey={chart.y} 
              stroke={colors[0]} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#${getGradientId(colors[0], 0)})`}
            />
          ) : chart.type === 'line' ? (
            <Line 
              type="monotone" 
              dataKey={chart.y} 
              stroke={colors[0]} 
              strokeWidth={3} 
              dot={{ r: 5, fill: colors[0], strokeWidth: 2, stroke: '#0f172a' }} 
              activeDot={{ r: 7, fill: colors[1] }}
            />
          ) : (
            <Bar 
              dataKey={chart.y} 
              radius={[8, 8, 0, 0]} 
              barSize={35}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#${getGradientId(colors[index % colors.length], index)})`} />
              ))}
            </Bar>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

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

  return (
    <div className="flex flex-col h-full bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#2dd4bf]" />
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center mb-2 border border-cyan-500/30">
              <Bot className="w-8 h-8 text-[#2dd4bf]" />
            </div>
            <h4 className="text-white font-medium text-lg">Ready to analyze your data</h4>
            <p className="text-white/40 text-sm max-w-xs">
              Ask me to visualize trends, clean columns, or explain patterns in your dataset.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-xs mt-4">
              {['Show me revenue trends', 'Find missing values', 'Clean the age column'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="text-xs text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl transition-all text-left hover:border-cyan-500/30 hover:text-[#2dd4bf]"
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
              m.role === 'user' ? 'bg-gradient-to-br from-cyan-500 to-teal-600' : 'bg-white/10 border border-white/10'
            }`}>
              {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#2dd4bf]" />}
            </div>
            <div className={`max-w-[85%] space-y-2 ${m.role === 'user' ? 'items-end' : ''}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-gradient-to-br from-cyan-600 to-teal-700 text-white rounded-tr-none shadow-lg' 
                  : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
              }`}>
                {m.content}
              </div>
              
              {m.chart && <ChatSingleChart chart={m.chart} data={data} />}
              
              {m.cleaningActions && m.cleaningActions.length > 0 && (
                <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/60 uppercase tracking-wider">
                    <Wand2 className="w-3 h-3 text-[#2dd4bf]" />
                    Suggested Cleaning
                  </div>
                  <div className="space-y-2">
                    {m.cleaningActions.map((action, idx) => (
                      <div key={idx} className="text-xs text-white/50 flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                        {action.type.replace('_', ' ')}: {action.column || action.oldName}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => onApplyActions(m.cleaningActions!, m.chart)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#0d9488] text-white text-xs font-bold rounded-xl border border-transparent transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {m.chart ? 'SAVE CHART & APPLY' : 'APPLY ACTIONS'}
                  </button>
                </div>
              )}

              {m.chart && !m.cleaningActions && (
                <div className="mt-3">
                  <button
                    onClick={() => onApplyActions([], m.chart)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#0d9488]/20 to-[#0f766e]/20 hover:from-[#0d9488]/30 hover:to-[#0f766e]/30 text-[#2dd4bf] text-xs font-bold rounded-xl border border-[#0d9488]/30 transition-all flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    SAVE TO INSIGHTS
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <Bot className="w-4 h-4 text-[#2dd4bf]" />
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#2dd4bf] animate-spin" />
              <span className="text-xs text-white/50 font-medium uppercase tracking-widest">Analyzing your data...</span>
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
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/50 focus:border-[#2dd4bf]/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#0d9488] disabled:opacity-50 disabled:hover:from-[#0d9488] disabled:hover:to-[#0f766e] text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-white/25 uppercase font-bold tracking-widest">
          Powered by Llama 3.3 via Groq
        </p>
      </div>
    </div>
  );
}
