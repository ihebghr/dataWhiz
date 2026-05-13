import { useState, useEffect } from 'react';
import { 
  Trash2, 
  Type, 
  Database, 
  Filter, 
  Eraser, 
  Columns,
  RefreshCw,
  Plus,
  AlertCircle,
  Scissors,
  Zap,
  ArrowUp,
  ArrowDown,
  Search
} from 'lucide-react';
import { DataRow, ActionLog } from '../App';

interface CleaningActionsProps {
  data: DataRow[];
  profile: any;
  onApply: (log: ActionLog, updatedData: DataRow[]) => void;
  initialColumn?: string;
}

export default function CleaningActions({ data, profile, onApply, initialColumn }: CleaningActionsProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>(initialColumn || Object.keys(profile || {})[0]);

  useEffect(() => {
    if (initialColumn) {
      setSelectedColumn(initialColumn);
    }
  }, [initialColumn]);
  
  const columns = Object.keys(profile || {});

  const applyCleaning = (type: string, description: string, logic: (row: DataRow) => DataRow | null) => {
    const updatedData = data.map(logic).filter(r => r !== null) as DataRow[];
    const log: ActionLog = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      column: selectedColumn,
      timestamp: Date.now(),
      description
    };
    onApply(log, updatedData);
  };

  // Cleaning Logic Functions
  const removeDuplicates = () => {
    const seen = new Set();
    const updatedData = data.filter(row => {
      const val = JSON.stringify(row);
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
    const log: ActionLog = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'DUPLICATES',
      timestamp: Date.now(),
      description: `Removed global duplicate rows. New count: ${updatedData.length}`
    };
    onApply(log, updatedData);
  };

  const fillMissingMean = () => {
    const stats = profile[selectedColumn];
    if (stats.type !== 'number') return;
    const mean = Number(stats.mean);
    const updatedData = data.map(row => ({
      ...row,
      [selectedColumn]: (row[selectedColumn] === null || row[selectedColumn] === '' || row[selectedColumn] === undefined) 
        ? mean 
        : row[selectedColumn]
    }));
    applyCleaning('MISSING_VALUES', `Filled missing values in '${selectedColumn}' with mean (${mean})`, (r) => r);
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'FILL',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Imputed missing values in '${selectedColumn}' using mean: ${mean}`
    }, updatedData);
  };

  const fillMissingMode = () => {
    const stats = profile[selectedColumn];
    const topVal = stats.topValues?.[0]?.[0];
    if (topVal === undefined) return;
    
    const updatedData = data.map(row => ({
      ...row,
      [selectedColumn]: (row[selectedColumn] === null || row[selectedColumn] === '' || row[selectedColumn] === undefined) 
        ? topVal 
        : row[selectedColumn]
    }));
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'FILL',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Imputed missing values in '${selectedColumn}' using mode: ${topVal}`
    }, updatedData);
  };

  const fillCustomValue = (value: any) => {
    const updatedData = data.map(row => ({
      ...row,
      [selectedColumn]: (row[selectedColumn] === null || row[selectedColumn] === '' || row[selectedColumn] === undefined) 
        ? value 
        : row[selectedColumn]
    }));
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'FILL',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Imputed missing values in '${selectedColumn}' with: ${value}`
    }, updatedData);
  };

  const roundColumn = (direction: 'up' | 'down' | 'round') => {
    const updatedData = data.map(row => {
      const val = parseFloat(String(row[selectedColumn]));
      if (isNaN(val)) return row;
      let newVal = val;
      if (direction === 'up') newVal = Math.ceil(val);
      else if (direction === 'down') newVal = Math.floor(val);
      else newVal = Math.round(val);
      return { ...row, [selectedColumn]: newVal };
    });
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'TRANSFORM',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Applied ${direction} rounding to '${selectedColumn}'.`
    }, updatedData);
  };

  const removeOutliers = () => {
    const stats = profile[selectedColumn];
    if (stats.type !== 'number') return;
    
    const values = data.map(r => parseFloat(String(r[selectedColumn]))).filter(n => !isNaN(n)).sort((a,b) => a-b);
    if (values.length < 4) return;

    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const updatedData = data.filter(row => {
      const val = parseFloat(String(row[selectedColumn]));
      if (isNaN(val)) return true;
      return val >= lowerBound && val <= upperBound;
    });

    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'OUTLIERS',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Removed outliers from '${selectedColumn}' using IQR method (Bounds: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)}).`
    }, updatedData);
  };

  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');

  const findReplace = () => {
    if (!replaceFrom) return;
    const updatedData = data.map(row => ({
      ...row,
      [selectedColumn]: String(row[selectedColumn]) === replaceFrom ? replaceTo : row[selectedColumn]
    }));
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'REPLACE',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Replaced '${replaceFrom}' with '${replaceTo}' in '${selectedColumn}'.`
    }, updatedData);
    setReplaceFrom('');
    setReplaceTo('');
  };

  const removeRowWithNull = () => {
     const updatedData = data.filter(row => {
        const val = row[selectedColumn];
        return val !== null && val !== undefined && val !== '';
     });
     onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'DROP_ROWS',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Dropped rows where '${selectedColumn}' was missing.`
    }, updatedData);
  }

  const dropColumn = () => {
    const updatedData = data.map(row => {
      const newRow = { ...row };
      delete newRow[selectedColumn];
      return newRow;
    });
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'DROP_COL',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Dropped column '${selectedColumn}'.`
    }, updatedData);
    if (columns.length > 1) setSelectedColumn(columns.find(c => c !== selectedColumn)!);
  };

  const lowercaseColumn = () => {
    const updatedData = data.map(row => ({
      ...row,
      [selectedColumn]: String(row[selectedColumn] || '').toLowerCase()
    }));
    applyCleaning('TEXT_FORMAT', `Lowercased '${selectedColumn}'`, (r) => r);
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'TEXT',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Converted '${selectedColumn}' to lowercase.`
    }, updatedData);
  }

  const replaceDecimalsWithMean = () => {
    const stats = profile[selectedColumn];
    if (stats.type !== 'number') return;
    const mean = Number(stats.mean);
    const updatedData = data.map(row => {
      const val = parseFloat(String(row[selectedColumn]));
      if (isNaN(val)) return row;
      // Check if it has a decimal part
      if (val % 1 !== 0) {
        return { ...row, [selectedColumn]: mean };
      }
      return row;
    });
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'IMPUTE_DECIMALS',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Replaced decimal values in '${selectedColumn}' with mean (${mean.toFixed(2)})`
    }, updatedData);
  };

  const trimWhitespace = () => {
    const updatedData = data.map(row => ({
      ...row,
      [selectedColumn]: typeof row[selectedColumn] === 'string' ? row[selectedColumn].trim() : row[selectedColumn]
    }));
    onApply({
      id: Math.random().toString(36).substr(2, 9),
      type: 'CLEAN_TEXT',
      column: selectedColumn,
      timestamp: Date.now(),
      description: `Trimmed extra whitespace from '${selectedColumn}'.`
    }, updatedData);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {/* Sidebar: Column Selector */}
      <div className="md:col-span-1 space-y-4">
         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4">Focus Column</p>
         <div className="flex flex-col gap-1">
            {columns.map(col => (
               <button
                  key={col}
                  onClick={() => setSelectedColumn(col)}
                  className={`
                    px-4 py-3 text-sm font-medium text-left rounded-lg transition-all
                    ${selectedColumn === col 
                      ? 'bg-[#0f172a] text-white border-l-4 border-[#2dd4bf]' 
                      : 'text-slate-600 hover:bg-[#f1f5f9] border-l-4 border-transparent'}
                  `}
               >
                  {col}
               </button>
            ))}
         </div>
      </div>

      {/* Main Panel: Actions */}
      <div className="md:col-span-3 space-y-8">
        {/* Missing Values Section */}
        <section className="bg-white border border-[#e2e8f0] rounded-lg p-8 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0d9488] flex items-center justify-center">
                <Filter className="w-5 h-5" />
             </div>
             <div>
                <h4 className="text-xl font-bold tracking-tight">Missing Values</h4>
                <p className="text-xs text-[#64748b] font-mono mt-0.5">Handle nulls and empty strings in '{selectedColumn}'</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <ActionButton 
                icon={<Trash2 className="w-4 h-4" />} 
                label="Drop Missing Rows" 
                onClick={removeRowWithNull}
                disabled={profile[selectedColumn]?.missingCount === 0}
             />
             <ActionButton 
                icon={<RefreshCw className="w-4 h-4" />} 
                label="Fill with Mean" 
                onClick={fillMissingMean}
                disabled={profile[selectedColumn]?.type !== 'number' || profile[selectedColumn]?.missingCount === 0}
             />
             {profile[selectedColumn]?.type === 'string' && (
               <>
                 <ActionButton 
                    icon={<Database className="w-4 h-4" />} 
                    label="Fill with 'NaN'" 
                    onClick={() => fillCustomValue('NaN')}
                    disabled={profile[selectedColumn]?.missingCount === 0}
                 />
                 <ActionButton 
                    icon={<Database className="w-4 h-4" />} 
                    label="Fill with 'Null'" 
                    onClick={() => fillCustomValue('Null')}
                    disabled={profile[selectedColumn]?.missingCount === 0}
                 />
                 <ActionButton 
                    icon={<Database className="w-4 h-4" />} 
                    label="Fill with 'Not available'" 
                    onClick={() => fillCustomValue('Not available')}
                    disabled={profile[selectedColumn]?.missingCount === 0}
                 />
                 <ActionButton 
                    icon={<Database className="w-4 h-4" />} 
                    label="Fill with Mode" 
                    onClick={fillMissingMode}
                    disabled={profile[selectedColumn]?.missingCount === 0}
                 />
               </>
             )}
          </div>
        </section>

        {/* Math & Precision Section */}
        {profile[selectedColumn]?.type === 'number' && (
          <section className="bg-white border border-[#e2e8f0] rounded-lg p-8 space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-xl font-bold tracking-tight">Math & Precision</h4>
                  <p className="text-xs text-[#64748b] font-mono mt-0.5">Handle decimals and outliers in '{selectedColumn}'</p>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ActionButton 
                icon={<ArrowUp className="w-4 h-4" />} 
                label="Round Up (Ceil)" 
                sublabel="e.g. 0.9 -> 1"
                onClick={() => roundColumn('up')}
              />
              <ActionButton 
                icon={<ArrowDown className="w-4 h-4" />} 
                label="Round Down (Floor)" 
                sublabel="e.g. 0.9 -> 0"
                onClick={() => roundColumn('down')}
              />
              <ActionButton 
                icon={<RefreshCw className="w-4 h-4" />} 
                label="Impute Decimals" 
                sublabel="Replace float with Mean"
                onClick={replaceDecimalsWithMean}
              />
              <ActionButton 
                icon={<Filter className="w-4 h-4" />} 
                label="Remove Outliers" 
                sublabel="IQR Method (1.5x)"
                variant="danger"
                onClick={removeOutliers}
              />
            </div>
          </section>
        )}

        {/* Find & Replace Section */}
        <section className="bg-white border border-[#e2e8f0] rounded-lg p-8 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Search className="w-5 h-5" />
             </div>
             <div>
                <h4 className="text-xl font-bold tracking-tight">Find & Replace</h4>
                <p className="text-xs text-[#64748b] font-mono mt-0.5">Fix specific values in '{selectedColumn}'</p>
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end gap-4 bg-slate-50 p-4 rounded-lg">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Find Value</label>
              <input 
                type="text" 
                value={replaceFrom}
                onChange={(e) => setReplaceFrom(e.target.value)}
                placeholder="e.g. 0.9167"
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
              />
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Replace With</label>
              <input 
                type="text" 
                value={replaceTo}
                onChange={(e) => setReplaceTo(e.target.value)}
                placeholder="e.g. 1"
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
              />
            </div>
            <button 
              onClick={findReplace}
              disabled={!replaceFrom}
              className="w-full sm:w-auto bg-[#0f172a] text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider disabled:opacity-30 h-[38px] transition-all hover:bg-[#1e293b]"
            >
              Replace
            </button>
          </div>
        </section>

        {/* Global actions */}
        <section className="bg-white border border-[#e2e8f0] rounded-lg p-8 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <Plus className="w-5 h-5" />
             </div>
             <div>
                <h4 className="text-xl font-bold tracking-tight">Global Operations</h4>
                <p className="text-xs text-[#64748b] font-mono mt-0.5">Apply actions to the entire dataset</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <ActionButton 
                icon={<Eraser className="w-4 h-4" />} 
                label="De-duplicate" 
                onClick={removeDuplicates}
                sublabel="Remove identical rows across all columns"
             />
             <ActionButton 
                icon={<Scissors className="w-4 h-4" />} 
                label="Drop Active Column" 
                onClick={dropColumn}
                variant="danger"
             />
          </div>
        </section>

        {/* Text Actions */}
        <section className="bg-white border border-[#e2e8f0] rounded-lg p-8 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#0d9488] flex items-center justify-center">
                <Type className="w-5 h-5" />
             </div>
             <div>
                <h4 className="text-xl font-bold tracking-tight">Text Formatting</h4>
                <p className="text-xs text-[#64748b] font-mono mt-0.5">Transform strings in '{selectedColumn}'</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <ActionButton 
                icon={<Type className="w-4 h-4" />} 
                label="Convert to Lowercase" 
                onClick={lowercaseColumn}
                disabled={profile[selectedColumn]?.type !== 'string'}
             />
             <ActionButton 
                icon={<Scissors className="w-4 h-4" />} 
                label="Trim Whitespace" 
                sublabel="Remove start/end spaces"
                onClick={trimWhitespace}
                disabled={profile[selectedColumn]?.type !== 'string'}
             />
          </div>
        </section>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, sublabel, onClick, disabled, variant = 'default' }: any) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`
        flex flex-col items-start text-left p-4 rounded-lg border transition-all duration-200
        ${disabled 
          ? 'opacity-40 cursor-not-allowed bg-transparent border-slate-100' 
          : variant === 'danger'
            ? 'border-red-100 bg-red-50/10 hover:bg-red-50 hover:border-red-200 group shadow-sm'
            : 'border-[#e2e8f0] hover:border-[#0d9488] hover:bg-[#0d9488]/5 hover:shadow-sm'
        }
      `}
    >
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform duration-300
        ${variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-[#0f172a] text-white'}
        ${!disabled && 'group-hover:scale-110'}
      `}>
        {icon}
      </div>
      <div>
        <p className={`text-[12px] font-bold ${variant === 'danger' ? 'text-red-700' : 'text-[#0f172a]'}`}>{label}</p>
        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1 truncate max-w-[150px]">{sublabel || 'Instant transform'}</p>
      </div>
    </button>
  );
}
