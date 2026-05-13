import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { DataRow } from '../App';

export default function DataPreview({ data }: { data: DataRow[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  if (data.length === 0) return null;

  const columns = Object.keys(data[0]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (searchTerm) {
      result = result.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig]);

  const previewData = filteredAndSortedData.slice(0, 50);

  const toggleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between bg-[#f8fafc] gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">Dataset Explorer</h3>
          <p className="text-[10px] text-[#64748b] font-mono mt-0.5 uppercase tracking-widest">
            {searchTerm ? `Found ${filteredAndSortedData.length} records` : `Showing top 50 rows`}
          </p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
          <input 
            type="text"
            placeholder="Search dataset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs text-[#1e293b] focus:outline-none focus:ring-1 focus:ring-[#0d9488] transition-all w-full md:w-64"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border-b border-r border-[#e2e8f0] w-12 text-center">#</th>
              {columns.map(col => (
                <th 
                  key={col} 
                  onClick={() => toggleSort(col)}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#64748b] bg-[#f8fafc] border-b border-r border-[#e2e8f0] min-w-[150px] cursor-pointer hover:bg-[#f1f5f9] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    {col}
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronUp className={`w-3 h-3 -mb-1 ${sortConfig?.key === col && sortConfig.direction === 'asc' ? 'text-[#0d9488]' : 'text-slate-300'}`} />
                      <ChevronDown className={`w-3 h-3 ${sortConfig?.key === col && sortConfig.direction === 'desc' ? 'text-[#0d9488]' : 'text-slate-300'}`} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#f1f5f9] transition-colors group">
                <td className="px-4 py-2.5 text-[11px] font-mono text-[#94a3b8] border-b border-r border-[#f1f5f9] text-center bg-[#f8fafc]/50 group-hover:bg-[#f1f5f9]">
                  {idx + 1}
                </td>
                {columns.map(col => (
                  <td key={col} className="px-4 py-2.5 text-[#334155] border-b border-r border-[#f1f5f9] whitespace-nowrap">
                    {row[col] === null || row[col] === undefined || row[col] === '' ? (
                      <span className="text-[#cbd5e1] italic font-serif">NaN</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="p-12 text-center">
          <Search className="w-8 h-8 text-[#cbd5e1] mx-auto mb-4" />
          <p className="text-sm text-[#64748b] font-medium">No records matching "{searchTerm}"</p>
        </div>
      )}

      {filteredAndSortedData.length > 50 && (
        <div className="px-8 py-6 bg-[#f8fafc] border-t border-[#e2e8f0] text-center">
          <p className="text-xs text-[#64748b] font-medium uppercase tracking-widest">
            + {filteredAndSortedData.length - 50} more records
          </p>
        </div>
      )}
    </div>
  );
}
