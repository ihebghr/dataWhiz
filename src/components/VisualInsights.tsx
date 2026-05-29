import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, 
  AreaChart, Area, PieChart, Pie, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { LayoutGrid, Download, Trash2, PieChart as PieIcon, BarChart3, DollarSign, Users, FileText, Sparkles } from 'lucide-react';

interface VisualInsightsProps {
  charts: any[];
  data: any[];
  profile?: any;
  onRemoveChart: (id: number) => void;
}

// Vibrant, accessible color palettes for different chart types
const CHART_PALETTES = {
  primary: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ],
  sunset: [
    '#FF6B35', '#F7931E', '#FFBE0B', '#FB5607', '#FF006E',
    '#8338EC', '#3A86FF', '#06FFA5', '#FFCA3A', '#FF5983'
  ],
  ocean: [
    '#0077B6', '#0096C7', '#00B4D8', '#48CAE4', '#90E0EF',
    '#ADE8F4', '#CAF0F8', '#023E8A', '#03045E', '#0077B6'
  ],
  forest: [
    '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2',
    '#B7E4C7', '#D8F3DC', '#1B4332', '#081C15', '#2D6A4F'
  ]
};

// Gradient definitions for each color
const getGradientId = (color: string, index: number) => `gradient-${color.replace('#', '')}-${index}`;

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: any; color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  </div>
);

// Smart data aggregation function
const aggregateData = (data: any[], xKey: string, yKey: string, chartType: string) => {
  if (!data || data.length === 0) return [];

  // For pie charts or when x is categorical, aggregate by x
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
    
    const result = Object.values(grouped)
      .sort((a: any, b: any) => b[yKey] - a[yKey])
      .slice(0, 15); // Limit to top 15 for readability
      
    return result;
  }

  // For numerical x, sort and return
  return [...data]
    .sort((a, b) => Number(a[xKey]) - Number(b[xKey]))
    .slice(0, 50);
};

// Individual chart component
interface SingleChartProps {
  chart: any;
  data: any[];
  charts: any[];
}

const SingleChart: React.FC<SingleChartProps> = ({ chart, data, charts }) => {
  const ChartComponent = {
    bar: BarChart,
    line: LineChart,
    scatter: ScatterChart,
    area: AreaChart,
    pie: PieChart
  }[chart.type as 'bar' | 'line' | 'scatter' | 'area' | 'pie'] || BarChart;

  // Aggregate and prepare data
  const chartData = aggregateData(data, chart.x, chart.y, chart.type);

  // Select palette based on chart index
  const paletteKey = Object.keys(CHART_PALETTES)[charts.indexOf(chart) % Object.keys(CHART_PALETTES).length] as keyof typeof CHART_PALETTES;
  const colors = CHART_PALETTES[paletteKey];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
        <ChartComponent data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 30 }}>
          {/* Define gradients for all colors */}
          <defs>
            {colors.map((color, i) => (
              <linearGradient key={i} id={getGradientId(color, i)} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1}/>
                <stop offset="100%" stopColor={color} stopOpacity={0.4}/>
              </linearGradient>
            ))}
            {/* Additional gradient for area charts */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[0]} stopOpacity={0.8}/>
              <stop offset="100%" stopColor={colors[0]} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          
          {chart.type !== 'pie' && <CartesianGrid strokeDasharray="6 6" stroke="#e2e8f0" vertical={false} strokeWidth={1.5} />}
          {chart.type !== 'pie' && (
            <XAxis 
              dataKey={chart.x} 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#475569', fontWeight: 600 }}
              padding={{ left: 10, right: 10 }}
              angle={-25}
              textAnchor="end"
              height={60}
            />
          )}
          {chart.type !== 'pie' && (
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#475569', fontWeight: 600 }}
              width={50}
            />
          )}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: 'none', 
              borderRadius: '16px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '16px',
              color: '#fff'
            }}
            itemStyle={{ color: colors[0], fontWeight: 700, fontSize: '13px' }}
            labelStyle={{ color: '#cbd5e1', marginBottom: '10px', fontWeight: 700, fontSize: '14px' }}
            cursor={{ fill: '#f8fafc' }}
          />
          {chart.type !== 'pie' && (
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              wrapperStyle={{ fontSize: '13px', paddingBottom: '20px', fontWeight: 600 }}
            />
          )}
          
          {chart.type === 'pie' ? (
            <Pie
              data={chartData}
              dataKey={chart.y}
              nameKey={chart.x}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={8}
              label={({ name, percent }) => `${name}\n(${(percent * 100).toFixed(0)}%)`}
              labelLine={{ stroke: '#cbd5e1', strokeWidth: 2 }}
              labelStyle={{ fill: '#334155', fontSize: '12px', fontWeight: 600 }}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          ) : chart.type === 'scatter' ? (
            <Scatter name={chart.title} data={chartData}>
              {chartData.map((entry, index) => (
                <Scatter key={index} dataKey={chart.y} fill={colors[index % colors.length]}>
                  <LabelList dataKey={chart.y} position="top" fill="#64748b" fontSize={10} fontWeight={600} />
                </Scatter>
              ))}
            </Scatter>
          ) : chart.type === 'area' ? (
            <Area 
              type="monotone" 
              dataKey={chart.y} 
              stroke={colors[0]} 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#areaGradient)"
            >
              <LabelList dataKey={chart.y} position="top" fill="#475569" fontSize={11} fontWeight={700} />
            </Area>
          ) : chart.type === 'line' ? (
            <Line 
              type="monotone" 
              dataKey={chart.y} 
              stroke={colors[0]} 
              strokeWidth={4} 
              dot={{ r: 6, fill: colors[0], strokeWidth: 3, stroke: '#fff' }} 
              activeDot={{ r: 8, fill: colors[1] }}
            >
              <LabelList dataKey={chart.y} position="top" fill="#475569" fontSize={11} fontWeight={700} />
            </Line>
          ) : (
            <Bar 
              dataKey={chart.y} 
              radius={[12, 12, 0, 0]} 
              barSize={40}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#${getGradientId(colors[index % colors.length], index)})`} />
              ))}
              <LabelList dataKey={chart.y} position="top" fill="#475569" fontSize={11} fontWeight={700} />
            </Bar>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default function VisualInsights({ charts, data, profile, onRemoveChart }: VisualInsightsProps) {

  const getKeyStats = () => {
    if (!profile || !data) return [];
    const keys = Object.keys(profile);
    return [
      { icon: FileText, label: 'Total Rows', value: data.length, color: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
      { icon: BarChart3, label: 'Total Columns', value: keys.length, color: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
      { icon: Users, label: 'Numeric Cols', value: keys.filter(k => profile[k].type === 'number').length, color: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
      { icon: DollarSign, label: 'Categorical Cols', value: keys.filter(k => profile[k].type !== 'number').length, color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    ];
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-[#0d9488]" />
            Visual Insights
          </h2>
          <p className="text-slate-500 text-base">Explore your data through AI-generated visualizations</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg hover:shadow-xl">
            <Download className="w-4 h-4" /> Export All
          </button>
        </div>
      </div>

      {/* Key Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getKeyStats().map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {charts.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center mt-8">
          <div className="w-32 h-32 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <PieIcon className="w-16 h-16 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">No visualizations yet</h3>
          <p className="text-slate-500 max-w-md mb-8 leading-relaxed text-lg">
            Ask the AI assistant a question like <span className="text-[#0d9488] font-semibold text-base">"Show me sales trends"</span> and your first visualization will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
          {charts.map((chart, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: 'spring', 
                stiffness: 280, 
                damping: 22,
                delay: idx * 0.1 
              }}
              className="bg-gradient-to-br from-white to-slate-50 border border-slate-100 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all relative group"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-[10px] text-[#0d9488] font-bold uppercase tracking-[0.25em] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {chart.type.toUpperCase()} CHART
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{chart.title}</h3>
                </div>
                <button 
                  onClick={() => onRemoveChart(idx)}
                  className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <SingleChart chart={chart} data={data} charts={charts} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
