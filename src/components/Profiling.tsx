import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Type, 
  Hash, 
  Layers, 
  AlertTriangle, 
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';

export default function Profiling({ profile, data, isLoading, onViewAnalysis }: { profile: any, data: any[], isLoading: boolean, onViewAnalysis: (col: string) => void }) {
  if (isLoading || !profile) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-64 bg-white border border-[#141414]/10 rounded-[32px]" />
        ))}
      </div>
    );
  }

  const columns = Object.keys(profile);
  
  const overallCompleteness = useMemo(() => {
    const totalCells = columns.length * data.length;
    if (totalCells === 0) return 100;
    const missingCells = columns.reduce((acc, col) => acc + (profile[col].missingCount || 0), 0);
    return ((totalCells - missingCells) / totalCells) * 100;
  }, [profile, data, columns]);

  const statsSummary = useMemo(() => {
    return columns.map(col => ({
      name: col,
      score: 100 - profile[col].missingPercentage,
      type: profile[col].type
    }));
  }, [profile, columns]);

  return (
    <div className="space-y-8">
      {/* Health Dashboard Header */}
      <div className="bg-[#0f172a] rounded-lg p-8 text-white relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-2 uppercase">Dataset Health</h3>
            <p className="text-slate-400 text-sm">Overall quality score based on completeness and integrity</p>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[#2dd4bf]">{overallCompleteness.toFixed(1)}%</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Integrity Score</span>
            </div>
          </div>
          
          <div className="md:col-span-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#2dd4bf' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {statsSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score < 80 ? '#f43f5e' : '#2dd4bf'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#2dd4bf]/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {columns.map(col => {
        const stats = profile[col];
        const isNumeric = stats.type === 'number';

        return (
          <div key={col} className="bg-white border border-[#e2e8f0] rounded-lg p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0f172a] text-white flex items-center justify-center">
                  {isNumeric ? <Hash className="w-5 h-5" /> : <Type className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-[#0f172a] truncate max-w-[120px]">{col}</h4>
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">{stats.type}</p>
                </div>
              </div>
              {stats.missingPercentage > 0 && (
                <div className="bg-red-50 text-red-600 px-3 py-1 rounded flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-red-100">
                  <AlertTriangle className="w-3 h-3" /> {stats.missingPercentage}% Miss
                </div>
              )}
            </div>

            <div className="flex-1">
              {isNumeric ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <StatBox label="Mean" value={stats.mean} />
                    <StatBox label="Median" value={stats.median} />
                    <StatBox label="Min" value={stats.min} />
                    <StatBox label="Max" value={stats.max} />
                  </div>
                  <div className="pt-4 border-t border-[#e2e8f0]">
                     <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3">Health Profile</p>
                     <HealthBar percentage={100 - stats.missingPercentage} label="Completeness" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-3">Top Values</p>
                  <div className="space-y-3">
                    {stats.topValues?.map(([val, count]: [string, number], i: number) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#475569] truncate truncate max-w-[80%]">{val || '(Empty)'}</span>
                          <span className="text-[10px] font-mono text-[#94a3b8] font-bold">{count}</span>
                        </div>
                        <div className="h-1 w-full bg-[#f1f5f9] rounded-full overflow-hidden">
                           <div className="h-full bg-[#2dd4bf] transition-all duration-500" style={{ width: `${(count / data.length) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => onViewAnalysis(col)}
              className="mt-8 flex items-center justify-center gap-2 w-full py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#64748b] hover:text-[#0d9488] hover:bg-[#0d9488]/5 rounded-lg transition-all border border-[#e2e8f0]"
            >
              View Analysis <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: any }) {
  return (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800 font-mono truncate">{value}</p>
    </div>
  );
}

function HealthBar({ percentage, label }: { percentage: number, label: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span className={percentage < 70 ? 'text-rose-500' : 'text-[#0d9488]'}>{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${percentage < 70 ? 'bg-rose-400' : 'bg-[#2dd4bf]'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
