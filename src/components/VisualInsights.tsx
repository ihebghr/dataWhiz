import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, 
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { LayoutGrid, Download, Trash2, PieChart as PieIcon } from 'lucide-react';

interface VisualInsightsProps {
  charts: any[];
  data: any[];
  onRemoveChart: (id: number) => void;
}

const COLORS = ['#0d9488', '#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

export default function VisualInsights({ charts, data, onRemoveChart }: VisualInsightsProps) {
  const renderChart = (chart: any) => {
    const ChartComponent = {
      bar: BarChart,
      line: LineChart,
      scatter: ScatterChart,
      area: AreaChart,
      pie: PieChart
    }[chart.type as 'bar' | 'line' | 'scatter' | 'area' | 'pie'] || BarChart;

    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data.slice(0, 50)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey={chart.x} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
            {chart.type === 'pie' ? (
              <Pie
                data={data.slice(0, 10)}
                dataKey={chart.y}
                nameKey={chart.x}
                cx="50%"
                cy="50%"
                outerRadius={80}
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
              <Area type="monotone" dataKey={chart.y} stroke="#0d9488" fill="#0d948830" strokeWidth={2} />
            ) : chart.type === 'line' ? (
              <Line type="monotone" dataKey={chart.y} stroke="#0d9488" strokeWidth={3} dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            ) : (
              <Bar dataKey={chart.y} fill="#0d9488" radius={[6, 6, 0, 0]} barSize={30} />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visual Insights</h2>
          <p className="text-sm text-slate-500">AI-generated visualizations from your analysis</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider">
            <Download className="w-3.5 h-3.5" /> Export All
          </button>
        </div>
      </div>

      {charts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <PieIcon className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No charts generated yet</h3>
          <p className="text-slate-500 max-w-sm mb-8">
            Ask the AI assistant to create a chart (e.g., "Create a bar chart of sales by month") and they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((chart, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative group"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 uppercase tracking-tight text-sm">{chart.title}</h3>
                <button 
                  onClick={() => onRemoveChart(idx)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {renderChart(chart)}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
