import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Trash2, 
  Download, 
  LayoutDashboard,
  FileSpreadsheet,
  Wand2,
  History,
  Zap,
  Sparkles,
  User as UserIcon,
  LogOut,
  Cloud,
  Lock,
  MessageSquare,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import { extractJSON } from './lib/aiUtils';
import { auth, loginWithGoogle, handleRedirectResult } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { uploadToGoogleDrive, convertToCSV } from './lib/driveService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import DataPreview from './components/DataPreview';
import Profiling from './components/Profiling';
import CleaningActions from './components/CleaningActions';
import ActionHistory from './components/ActionHistory';
import AISuggestions from './components/AISuggestions';
import ChatInterface from './components/ChatInterface';
import VisualInsights from './components/VisualInsights';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SuccessModal from './components/SuccessModal';

export type DataRow = Record<string, any>;

export interface ActionLog {
  id: string;
  type: string;
  column?: string;
  timestamp: number;
  description: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [data, setData] = useState<DataRow[] | null>(null);
  const [originalData, setOriginalData] = useState<DataRow[] | null>(null);
  const [pastStates, setPastStates] = useState<DataRow[][]>([]);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; rows: number; columns: number } | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [history, setHistory] = useState<ActionLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'preview' | 'profile' | 'cleaning' | 'chat' | 'insights'>('chat');
  const [isQuickCleaning, setIsQuickCleaning] = useState(false);
  const [generatedCharts, setGeneratedCharts] = useState<any[]>([]);
  const [activeCleaningColumn, setActiveCleaningColumn] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<'download' | 'drive'>('download');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [driveFileLink, setDriveFileLink] = useState<string | null>(null);
  const [lastUploadedFileName, setLastUploadedFileName] = useState('');
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    // Handle redirect result for mobile/deployed logins
    handleRedirectResult().catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onFileUpload = useCallback(async (res: any) => {
    setData(res.fullData);
    setOriginalData(res.fullData);
    setFileInfo({ name: res.fileName, size: res.size, rows: res.rows, columns: res.columns });
    setIsProcessing(true);
    try {
      const hasDriveToken = sessionStorage.getItem('google_drive_token');
      if (user && hasDriveToken) {
        try {
          const csvContent = convertToCSV(res.fullData);
          await uploadToGoogleDrive(`raw_${res.fileName}`, csvContent, 'text/csv');
        } catch (driveErr) { console.error("Failed to sync to Drive:", driveErr); }
      }
      const profileRes = await fetch('/api/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: res.fullData })
      });
      const profileData = await profileRes.json();
      setProfile(profileData);
      if (profileData) setActiveCleaningColumn(Object.keys(profileData)[0]);
      setView('chat');
    } catch (err) { console.error(err); }
    finally { setIsProcessing(false); }
    setPastStates([]);
  }, [user]);

  const handleApplyAction = useCallback((newLog: ActionLog, updatedData: DataRow[]) => {
    setData(current => { if (current) setPastStates(prev => [...prev, current]); return updatedData; });
    setHistory(prev => [newLog, ...prev]);
    setIsProcessing(true);
    fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: updatedData }) })
      .then(r => r.json()).then(p => setProfile(p)).finally(() => setIsProcessing(false));
  }, []);

  const handleUndo = useCallback(() => {
    if (pastStates.length === 0 || !data) return;
    const previousState = pastStates[pastStates.length - 1];
    setPastStates(prev => prev.slice(0, -1));
    setHistory(prev => prev.slice(1));
    setData(previousState);
    setIsProcessing(true);
    fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: previousState }) })
      .then(r => r.json()).then(p => setProfile(p)).finally(() => setIsProcessing(false));
  }, [pastStates, data]);

  const handleReset = useCallback(() => {
    if (confirm('Revert all changes?')) { setData(originalData); setHistory([]); setPastStates([]); }
  }, [originalData]);

  const performDownload = useCallback(async (target: 'local' | 'drive' | 'json' | 'pdf', loggedUser: User) => {
    if (!data || !data.length) return;
    const fileNameBase = fileInfo?.name.split('.')[0] || 'data';
    const fileName = `cleaned_${fileNameBase}`;

    if (target === 'drive') {
      setIsProcessing(true);
      try {
        const csvString = '\uFEFF' + convertToCSV(data);
        const result = await uploadToGoogleDrive(`${fileName}.csv`, csvString, 'text/csv');
        setDriveFileLink(result.webViewLink);
        setLastUploadedFileName(`${fileName}.csv`);
        setShowSuccessModal(true);
      } catch (err: any) {
        console.error("Drive upload error:", err);
        if (err.message === 'GOOGLE_AUTH_EXPIRED') {
          setAuthModalReason('drive');
          setShowAuthModal(true);
        } else {
          alert(err.message || "Failed to save to Drive. Please try again.");
        }
      } finally { setIsProcessing(false); }
      return;
    }

    if (target === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url); link.setAttribute("download", `${fileName}.json`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    if (target === 'pdf') {
      const doc = new jsPDF();
      const headers = Object.keys(data[0]);
      const body = data.map(row => headers.map(h => String(row[h] || '')));
      
      doc.text("DataWhiz AI - Cleaned Export", 14, 15);
      autoTable(doc, {
        head: [headers],
        body: body.slice(0, 100), // Limit to 100 for performance/readability in PDF
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [13, 148, 136] }
      });
      doc.save(`${fileName}.pdf`);
      return;
    }

    // Default to CSV local
    const csvString = '\uFEFF' + convertToCSV(data);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url); link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, fileInfo, setAuthModalReason, setShowAuthModal]);

  const handleDownload = useCallback((target: 'local' | 'drive' | 'json' | 'pdf' = 'local') => {
    const hasDriveToken = sessionStorage.getItem('google_drive_token');
    if (!user && (target === 'drive' || target === 'local' || target === 'json' || target === 'pdf')) {
      // Allow local downloads without login if preferred, but user requested to move to navbar near profile
      // For now, let's keep the auth requirement if you want it near the profile/user section
      if (!user) {
        setAuthModalReason(target === 'drive' ? 'drive' : 'download');
        setShowAuthModal(true);
        return;
      }
    }
    if (target === 'drive' && !hasDriveToken) {
      setAuthModalReason('drive');
      setShowAuthModal(true);
      return;
    }
    performDownload(target, user!);
  }, [user, performDownload]);

  const handleLoginAndContinue = useCallback(async () => {
    try {
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);
      setShowAuthModal(false);
      setTimeout(() => performDownload(authModalReason, loggedInUser), 500);
    } catch (err) { console.error('Login failed', err); }
  }, [authModalReason, performDownload]);

  const handleQuickClean = useCallback(async () => {
    if (!profile || !data) return;
    setIsQuickCleaning(true); setIsProcessing(true);
    try {
      const summary = JSON.stringify({
        total_rows: data.length,
        columns: Object.entries(profile).map(([name, stats]: [string, any]) => ({
          name,
          type: stats.type,
          missing_pct: stats.missingPercentage,
          unique_count: stats.uniqueCount,
          sample_values: stats.topValues?.slice(0, 3).map((v: any) => v[0])
        }))
      }, null, 2);
      
      const SYSTEM_PROMPT = `You are a principal data engineer with 20 years of production experience 
 across financial systems, healthcare records, e-commerce pipelines, and IoT sensor data. 
 
 Your governing principle: DATA IS INNOCENT UNTIL PROVEN CORRUPT. 
 Every row has value. Every drop must be justified like deleting production records. 
 
 CRITICAL: The user's Quality Score depends on DATA COMPLETENESS. 
 Dropping rows KILLS the score. You MUST preserve the total row count.
 
 ══════════════════════════════════════════════════════ 
 PHASE 0 — FORENSIC RECONNAISSANCE 
 ══════════════════════════════════════════════════════ 
 Classify every column and detect locale-specific formatting traps.
 
 ══════════════════════════════════════════════════════ 
 PHASE 1 — ENCODING AND STRUCTURAL REPAIR 
 ══════════════════════════════════════════════════════ 
 ENCODING_FIX: Repair mojibake and control characters.
 
 ══════════════════════════════════════════════════════ 
 PHASE 2 — SEPARATOR AND TYPE NORMALIZATION 
 ══════════════════════════════════════════════════════ 
 SMART_FIX: Normalize separators (dot/comma) dataset-wide. 
 CAST_TYPE: Convert to correct semantic type.
 
 ══════════════════════════════════════════════════════ 
 PHASE 3 — NULL STRATEGY (COMPLETENESS FIRST)
 ══════════════════════════════════════════════════════ 
 - NEVER drop rows for missing values. 
 - If null% < 30% → use IMPUTE (median for numeric, mode for categorical).
 - If null% > 30% → use FILL_SENTINEL (e.g., "UNKNOWN", "MISSING", 0, -1).
 - Goal: 0% missing values while KEEPING 100% of rows.
 
 ══════════════════════════════════════════════════════ 
 PHASE 4 — OUTLIER AND CONSTRAINT REPAIR 
 ══════════════════════════════════════════════════════ 
 SMART_FIX: Round fractional ages, handle impossible values (age < 0).
 
 ══════════════════════════════════════════════════════ 
 PHASE 5 — NORMALIZATION 
 ══════════════════════════════════════════════════════ 
 STANDARDIZE: Lowercase + trim categorical strings.
 
 ══════════════════════════════════════════════════════ 
 PHASE 6 — VALIDATION 
 ══════════════════════════════════════════════════════ 
 If any action would drop rows, REVISE to use FILL_SENTINEL.
 
 AVAILABLE ACTIONS: ENCODING_FIX, SMART_FIX, CAST_TYPE, IMPUTE, FILL_SENTINEL, STANDARDIZE, REMOVE_DUPLICATES.
 
 DATASET SUMMARY:
 ${summary}
 
 OUTPUT: Valid JSON only.
 {
   "actions": [
     { "order": 1, "type": "ACTION_TYPE", "column": "col_name", "action": "description", "reason": "why" }
   ]
 }`;

      const aiResponse = await fetch('/api/ai/generate', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          prompt: SYSTEM_PROMPT,
          model: "llama-3.1-8b-instant" // Force faster model for Quick Clean to avoid Vercel timeouts
        }) 
      });

      if (!aiResponse.ok) { 
        const t = await aiResponse.text(); 
        let m = 'AI request failed'; 
        try { m = JSON.parse(t).error || m; } catch(e){m=t||m;} 
        throw new Error(`API Error (${aiResponse.status}): ${m}`); 
      }
      
      const aiData = await aiResponse.json();
      if (!aiData.text) {
        throw new Error("AI returned no plan. Please try again.");
      }

      const plan = extractJSON(aiData.text);
      const actions = plan.actions || (Array.isArray(plan) ? plan : null);
      
      if (!actions || !Array.isArray(actions)) {
        console.error("Invalid AI plan:", plan);
        throw new Error('AI response was not in the expected format (array of actions)');
      }
      
      if (actions.length === 0) {
        alert("Expert AI analyzed the data and found it to be within quality thresholds.");
        return;
      }
      
      let currentData = [...data]; 
      const appliedLogs: ActionLog[] = [];
      const sortedActions = [...actions].sort((a, b) => (a.order || 0) - (b.order || 0));

      for (const action of sortedActions) {
        const { column, type, action: actionDesc } = action; 
        if (!column || !data[0] || (!data[0].hasOwnProperty(column) && column !== 'all')) continue;

        const la = (actionDesc || '').toLowerCase();
        const lt = (type || '').toUpperCase();
        let changed = false;
        let logDesc = actionDesc;

        // More robust matching including substrings
        if (lt === 'ENCODING_FIX' || la.includes('encoding') || la.includes('character')) {
          currentData = currentData.map(r => {
            let val = String(r[column] || '');
            val = val.replace(/Ã©/g, 'é').replace(/â€™/g, "'").replace(/â€œ/g, '"');
            val = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
            return { ...r, [column]: val.trim() };
          });
          changed = true;
          logDesc = `Encoding repair on ${column}`;
        }
        else if (lt === 'IMPUTE' || lt === 'FILL_SENTINEL' || la.includes('impute') || la.includes('fill') || la.includes('null')) {
          const s = profile[column];
          if (s) {
            let fillVal: any = null;
            if (la.includes('mean') && s.type === 'number') fillVal = Number(s.mean);
            else if (la.includes('median') && s.type === 'number') fillVal = Number(s.median || s.mean);
            else fillVal = s.topValues?.[0]?.[0] || 'UNKNOWN';

            currentData = currentData.map(r => ({
              ...r,
              [column]: (r[column] === null || r[column] === '' || r[column] === undefined) ? fillVal : r[column]
            }));
            changed = true;
            logDesc = `Filled missing ${column} with ${fillVal}`;
          }
        } 
        else if (lt === 'STANDARDIZE' || la.includes('standardize') || la.includes('lower') || la.includes('trim') || la.includes('format')) {
          currentData = currentData.map(r => ({ ...r, [column]: String(r[column] || '').toLowerCase().trim().replace(/\s+/g, ' ') }));
          changed = true;
          logDesc = `Standardized ${column}`;
        }
        else if (lt === 'SMART_FIX' || la.includes('smart') || la.includes('repair') || la.includes('fix') || la.includes('clean')) {
          const s = profile[column];
          currentData = currentData.map(r => {
            let val = String(r[column] || '').replace(',', '.').trim();
            if (column.toLowerCase().includes('age')) {
              const num = parseFloat(val);
              if (!isNaN(num)) return { ...r, [column]: Math.round(num) };
            }
            if (s?.type === 'number') {
              const num = parseFloat(val);
              if (!isNaN(num)) return { ...r, [column]: num };
            }
            return { ...r, [column]: val };
          });
          changed = true;
          logDesc = `Smart repaired ${column}`;
        }
        else if (lt === 'CAST_TYPE' || la.includes('cast') || la.includes('convert')) {
          if (la.includes('int')) {
            currentData = currentData.map(r => {
              const val = String(r[column] || '').replace(',', '.').trim();
              const num = parseFloat(val);
              return isNaN(num) ? r : { ...r, [column]: Math.round(num) };
            });
            changed = true;
            logDesc = `Casted ${column} to Integer`;
          } else if (la.includes('date')) {
            currentData = currentData.map(r => {
              const d = new Date(String(r[column]));
              return isNaN(d.getTime()) ? r : { ...r, [column]: d.toISOString().split('T')[0] };
            });
            changed = true;
            logDesc = `Casted ${column} to Date`;
          }
        }
        else if (lt === 'DROP_MISSING' || la.includes('drop missing') || la.includes('remove missing')) {
          const initialCount = currentData.length;
          const filtered = currentData.filter(r => r[column] !== null && r[column] !== '' && r[column] !== undefined);
          if ((initialCount - filtered.length) / initialCount < 0.05) { // Increased threshold to 5%
            currentData = filtered;
            changed = true;
            logDesc = `Dropped ${initialCount - filtered.length} rows with missing ${column}`;
          } else {
            const s = profile[column];
            const fillVal = s?.topValues?.[0]?.[0] || 'MISSING';
            currentData = currentData.map(r => ({
              ...r,
              [column]: (r[column] === null || r[column] === '' || r[column] === undefined) ? fillVal : r[column]
            }));
            changed = true;
            logDesc = `Safeguard: Filled missing ${column} instead of dropping rows`;
          }
        }
        else if (lt === 'REMOVE_DUPLICATES' || la.includes('duplicate')) {
          const initialCount = currentData.length;
          const seen = new Set();
          currentData = currentData.filter(row => {
            const val = JSON.stringify(row);
            if (seen.has(val)) return false;
            seen.add(val);
            return true;
          });
          if (currentData.length < initialCount) {
            changed = true;
            logDesc = `Removed ${initialCount - currentData.length} duplicates`;
          }
        }

        if (changed) {
          appliedLogs.push({ 
            id: Math.random().toString(36).substr(2, 9), 
            type: 'AI_EXPERT_CLEAN', 
            column: column === 'all' ? undefined : column, 
            timestamp: Date.now(), 
            description: logDesc 
          });
        }
      }

      if (appliedLogs.length > 0) {
        setPastStates(prev => [...prev, data]);
        setData(currentData);
        setHistory(prev => [...appliedLogs, ...prev]);
        
        // Refresh profile with new data
        const profileRes = await fetch('/api/profile', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ data: currentData }) 
        });
        
        if (profileRes.ok) {
          const p = await profileRes.json();
          setProfile(p);
        }
        
        setView('profile');
      } else {
        alert("Expert AI analyzed the data and found it to be within quality thresholds.");
      }
    } catch (err: any) { 
      console.error("Expert Clean error:", err);
      alert(`Expert Clean failed: ${err.message || 'Unknown error'}`); 
    }
    finally { setIsQuickCleaning(false); setIsProcessing(false); }
  }, [profile, data]);

  const handleAISuggest = useCallback((action: string, column: string, reason: string) => {
    const la = action.toLowerCase();
    let updatedData = [...data!];
    let desc = `AI RECOMMENDED: ${action} on ${column}`;
    let changed = false;

    if (la.includes('mean')) {
      const s = profile[column];
      if (s?.type === 'number') {
        const mean = Number(s.mean);
        updatedData = data!.map(r => ({ ...r, [column]: (r[column] === null || r[column] === '' || r[column] === undefined) ? mean : r[column] }));
        changed = true;
        desc = `Imputed ${column} with mean (${mean.toFixed(2)})`;
      }
    } else if (la.includes('mode')) {
      const s = profile[column];
      const mode = s?.topValues?.[0]?.[0];
      if (mode !== undefined) {
        updatedData = data!.map(r => ({ ...r, [column]: (r[column] === null || r[column] === '' || r[column] === undefined) ? mode : r[column] }));
        changed = true;
        desc = `Imputed ${column} with mode (${mode})`;
      }
    } else if (la.includes('round')) {
      updatedData = data!.map(r => {
        const v = parseFloat(String(r[column]));
        if (isNaN(v)) return r;
        return { ...r, [column]: Math.round(v) };
      });
      changed = true;
      desc = `AI ROUNDING: ${action}`;
    } else if (la.includes('outlier')) {
      const s = profile[column];
      if (s?.type === 'number') {
        const vals = data!.map(r => parseFloat(String(r[column]))).filter(n => !isNaN(n)).sort((a, b) => a - b);
        const q1 = vals[Math.floor(vals.length * 0.25)];
        const q3 = vals[Math.floor(vals.length * 0.75)];
        const iqr = q3 - q1;
        updatedData = data!.filter(r => {
          const v = parseFloat(String(r[column]));
          if (isNaN(v)) return true;
          return v >= (q1 - 1.5 * iqr) && v <= (q3 + 1.5 * iqr);
        });
        changed = true;
        desc = `AI OUTLIER CLEAN: ${action}`;
      }
    } else if (la.includes('lower') || la.includes('standardize') || la.includes('trim') || la.includes('uppercase')) {
      const isUpper = la.includes('uppercase');
      updatedData = data!.map(r => ({ ...r, [column]: isUpper ? String(r[column] || '').toUpperCase().trim() : String(r[column] || '').toLowerCase().trim() }));
      changed = true;
      desc = `${isUpper ? 'Uppercased' : 'Standardized'} ${column}`;
    } else if (la.includes('drop missing') || la.includes('remove missing')) {
      updatedData = data!.filter(r => r[column] !== null && r[column] !== '' && r[column] !== undefined);
      changed = true;
      desc = `Dropped missing values in ${column}`;
    } else if (la.includes('cast') || la.includes('convert to')) {
      if (la.includes('int')) {
        updatedData = data!.map(r => {
          const val = String(r[column] || '').replace(',', '.').trim();
          const num = parseFloat(val);
          return isNaN(num) ? r : { ...r, [column]: Math.round(num) };
        });
        changed = true;
        desc = `Casted ${column} to Integer (rounded)`;
      } else if (la.includes('date')) {
        updatedData = data!.map(r => {
          const d = new Date(String(r[column]));
          return isNaN(d.getTime()) ? r : { ...r, [column]: d.toISOString().split('T')[0] };
        });
        changed = true;
        desc = `Formatted ${column} as Date`;
      } else if (la.includes('float')) {
        updatedData = data!.map(r => {
          const val = String(r[column] || '').replace(',', '.').trim();
          const num = parseFloat(val);
          return isNaN(num) ? r : { ...r, [column]: num };
        });
        changed = true;
        desc = `Casted ${column} to Float`;
      }
    } else if (la.includes('smart') || la.includes('repair') || la.includes('logic')) {
      const s = profile[column];
      updatedData = data!.map(r => {
        let val = String(r[column] || '').replace(',', '.').trim();
        if (column.toLowerCase().includes('age')) {
          const num = parseFloat(val);
          if (!isNaN(num)) return { ...r, [column]: Math.round(num) };
        }
        if (s?.type === 'number') {
          const num = parseFloat(val);
          if (!isNaN(num)) return { ...r, [column]: num };
        }
        return { ...r, [column]: val };
      });
      changed = true;
      desc = `Smart repaired values in ${column}`;
    }

    if (changed) {
      handleApplyAction({ id: Math.random().toString(36).substr(2, 9), type: 'AI_RECO', column, timestamp: Date.now(), description: desc }, updatedData);
    } else {
      alert("AI Suggestion: " + action + "\nTry applying this manually.");
    }
  }, [data, profile, handleApplyAction]);

  const handleApplyAIChatActions = useCallback(async (actions: any[], chart?: any) => {
    if (!data || !profile) return;
    
    if (chart) {
      setGeneratedCharts(prev => [chart, ...prev]);
      setView('insights');
      setShowChat(false);
    }

    if (!actions || actions.length === 0) return;
    
    let currentData = [...data];
    const appliedLogs: ActionLog[] = [];

    for (const action of actions) {
      const { type, column, oldName, newName, value, to } = action;
      let changed = false;
      let logDesc = "";

      if (type === 'rename_column' && oldName && newName) {
        currentData = currentData.map(r => {
          const newRow = { ...r };
          newRow[newName] = r[oldName];
          delete newRow[oldName];
          return newRow;
        });
        changed = true;
        logDesc = `Renamed ${oldName} to ${newName}`;
      } else if (type === 'remove_column' && column) {
        currentData = currentData.map(r => {
          const newRow = { ...r };
          delete newRow[column];
          return newRow;
        });
        changed = true;
        logDesc = `Removed column ${column}`;
      } else if (type === 'fill_missing' && column) {
        let fillVal = value;
        const s = profile[column];
        if (value === 'median' && s?.type === 'number') fillVal = s.median;
        else if (value === 'mean' && s?.type === 'number') fillVal = s.mean;
        else if (value === 'zero') fillVal = 0;
        
        currentData = currentData.map(r => ({
          ...r,
          [column]: (r[column] === null || r[column] === '' || r[column] === undefined) ? fillVal : r[column]
        }));
        changed = true;
        logDesc = `Filled missing values in ${column} with ${fillVal}`;
      } else if (type === 'drop_missing' && column) {
        const initialCount = currentData.length;
        currentData = currentData.filter(r => r[column] !== null && r[column] !== '' && r[column] !== undefined);
        changed = true;
        logDesc = `Dropped ${initialCount - currentData.length} rows with missing ${column}`;
      } else if (type === 'convert_type' && column && to) {
        currentData = currentData.map(r => {
          let val = r[column];
          if (to === 'number') val = Number(val);
          else if (to === 'string') val = String(val);
          else if (to === 'date') val = new Date(val).toISOString().split('T')[0];
          return { ...r, [column]: val };
        });
        changed = true;
        logDesc = `Converted ${column} to ${to}`;
      }

      if (changed) {
        appliedLogs.push({
          id: Math.random().toString(36).substr(2, 9),
          type: 'AI_CHAT_ACTION',
          column: column || oldName,
          timestamp: Date.now(),
          description: logDesc
        });
      }
    }

    if (appliedLogs.length > 0) {
      setPastStates(prev => [...prev, data]);
      setData(currentData);
      setHistory(prev => [...appliedLogs, ...prev]);
      
      // Refresh profile
      setIsProcessing(true);
      try {
        const profileRes = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: currentData })
        });
        const p = await profileRes.json();
        setProfile(p);
      } catch (err) {
        console.error("Profile refresh failed:", err);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [data, profile]);

  return (
    <div className="h-screen bg-[#f8fafc] text-[#1e293b] font-sans selection:bg-[#2dd4bf] selection:text-[#0f172a] overflow-hidden flex">
      <AnimatePresence mode="wait">
        {!data ? (
          <div className="w-full flex flex-col">
            <Navbar 
              onReset={() => {}} 
              user={user} 
              onLogin={loginWithGoogle} 
              onDownload={handleDownload}
              hasData={false}
            />
            <main className="flex-1 overflow-y-auto px-6 py-12">
              <motion.div key="landing" initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}} className="max-w-7xl mx-auto">
                <Hero onUpload={onFileUpload} user={user} onLogin={loginWithGoogle} />
              </motion.div>
            </main>
          </div>
        ) : (
          <div className="flex w-full h-full">
            <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col border-r border-[#334155]">
              <div className="p-6 border-b border-[#1e293b]">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-[#2dd4bf] font-bold">◆</span>
                  <span className="font-bold tracking-tighter uppercase">DataWhiz AI</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-6">
                <div className="px-6 mb-4"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account</h3></div>
                <div className="px-6 mb-6">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 p-2 bg-[#1e293b] rounded-lg border border-slate-700">
                        <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-8 h-8 rounded-full" alt="avatar" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{user.displayName || 'User'}</p>
                          <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <button onClick={() => { signOut(auth); setView('preview'); }} className="flex items-center gap-2 text-[10px] font-bold text-red-400 hover:text-red-300 transition-all uppercase tracking-widest">
                        <LogOut className="w-3 h-3" /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button onClick={loginWithGoogle} className="w-full flex items-center justify-center gap-2 py-3 bg-[#2dd4bf] text-[#0f172a] text-[10px] font-bold uppercase tracking-widest rounded hover:bg-[#26bba8] transition-all">
                        <UserIcon className="w-4 h-4" /> Sign In with Google
                      </button>
                      <p className="text-[9px] text-slate-500 text-center leading-relaxed">Sign in to download or save to Drive</p>
                    </div>
                  )}
                </div>
                <div className="px-6 mb-4"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operations</h3></div>
                <nav className="space-y-1">
                  {([
                    {id:'chat',label:'AI Analyst',icon:Sparkles},
                    {id:'insights',label:'Visual Insights',icon:PieIcon},
                    {id:'preview',label:'Data Preview',icon:LayoutDashboard},
                    {id:'profile',label:'Profiling',icon:BarChart3},
                    {id:'cleaning',label:'Cleaning',icon:Wand2}
                  ] as const).map(t => (
                    <button key={t.id} onClick={() => setView(t.id as any)}
                      className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${view===t.id?'bg-[#1e293b] text-white border-l-4 border-[#2dd4bf]':'hover:bg-[#1e293b]/50 hover:text-white border-l-4 border-transparent'}`}>
                      <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                  ))}
                  <button onClick={handleUndo} disabled={pastStates.length===0}
                    className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium hover:bg-[#1e293b]/50 hover:text-white transition-all border-l-4 border-transparent disabled:opacity-30 disabled:hover:bg-transparent">
                    <History className="w-4 h-4" /> Undo Action
                  </button>
                  <button onClick={handleQuickClean} disabled={isQuickCleaning||!profile}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all border-l-4 border-transparent ${isQuickCleaning?'bg-[#0d9488]/10 text-[#2dd4bf]':'hover:bg-[#0d9488]/10 hover:text-[#2dd4bf]'}`}>
                    <Zap className={`w-4 h-4 ${isQuickCleaning?'animate-bounce':''}`} /> Quick Clean (AI)
                  </button>
                </nav>
                <div className="px-6 mt-12 mb-4"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global</h3></div>
                <nav>
                  <button onClick={handleReset} className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-all border-l-4 border-transparent">
                    <Trash2 className="w-4 h-4" /> Reset Data
                  </button>
                </nav>
              </div>
              <div className="p-6 border-t border-[#1e293b]">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>v1.0.4 Release</span>
                  <div className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-pulse" />
                </div>
              </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden bg-white">
              <Navbar 
                onReset={() => setView('preview')} 
                user={user} 
                onLogin={loginWithGoogle} 
                onDownload={handleDownload}
                hasData={true}
              />
              <header className="h-16 flex items-center justify-between px-8 border-b border-[#e2e8f0] shrink-0 bg-white">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[#0f172a]">{fileInfo?.name}</span>
                  <span className="px-3 py-1 bg-[#f1f5f9] text-[#475569] text-[10px] font-bold rounded uppercase tracking-wider">{data.length} Rows</span>
                  <span className="px-3 py-1 bg-[#f1f5f9] text-[#475569] text-[10px] font-bold rounded uppercase tracking-wider">{fileInfo?.columns} Cols</span>
                  {history.length > 0 && <span className="px-3 py-1 bg-[#0d9488]/10 text-[#0d9488] text-[10px] font-bold rounded uppercase tracking-wider">{history.length} Actions</span>}
                </div>
                <div className="flex gap-3 items-center">
                  {!user && (
                    <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                      <Lock className="w-3 h-3" /><span>Sign in to export</span>
                    </div>
                  )}
                  <div className="flex bg-[#0d9488] rounded-lg shadow-sm border border-[#0d9488]">
                    <button onClick={() => handleDownload('local')}
                      className="flex items-center gap-2 px-4 py-2 text-white text-[12px] font-bold border-r border-[#ffffff]/20 hover:bg-[#0c857a] transition-all">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button onClick={() => handleDownload('drive')}
                      className="flex items-center gap-2 px-4 py-2 text-white text-[12px] font-bold hover:bg-[#0c857a] transition-all" title="Save to Google Drive">
                      <Cloud className="w-3.5 h-3.5" /> Drive
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {view === 'chat' && (
                      <motion.div key="chat-view" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="h-full flex flex-col gap-6">
                        <div className="flex-1 min-h-0 bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-inner flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 bg-[#0d9488]/10 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-10 h-10 text-[#0d9488]" />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Data Analyst</h2>
                          <p className="text-slate-500 max-w-md mb-8">
                            I'm ready to help you analyze this dataset. You can ask me questions, request charts, or ask for cleaning suggestions using the chat assistant on the right.
                          </p>
                          <button 
                            onClick={() => setShowChat(true)}
                            className="px-6 py-3 bg-[#0d9488] text-white rounded-xl font-bold hover:bg-[#0c857a] transition-all flex items-center gap-2 shadow-lg shadow-[#0d9488]/20"
                          >
                            <MessageSquare className="w-5 h-5" />
                            Open AI Assistant
                          </button>
                        </div>
                        <div className="h-1/3 border-t border-slate-200 pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-[#0d9488]" />
                              Live Data Preview
                            </h3>
                            <button onClick={() => setView('preview')} className="text-[10px] font-bold text-[#0d9488] hover:underline uppercase">View Full Dataset</button>
                          </div>
                          <div className="h-full overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                            <DataPreview data={data.slice(0, 10)} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {view === 'insights' && (
                      <motion.div key="insights-view" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                        <VisualInsights 
                          charts={generatedCharts} 
                          data={data} 
                          onRemoveChart={(idx) => setGeneratedCharts(prev => prev.filter((_, i) => i !== idx))} 
                        />
                      </motion.div>
                    )}
                    {view === 'preview' && (
                      <motion.div key="pv" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                        <section className="grid grid-cols-4 bg-[#e2e8f0] gap-[1px] border border-[#e2e8f0] rounded-lg overflow-hidden mb-8 shadow-sm">
                          <StatCard label="Total Rows" value={data.length} />
                          <StatCard label="Columns" value={fileInfo?.columns || 0} />
                          <StatCard label="Actions Applied" value={history.length} />
                          <StatCard label="Can Undo" value={pastStates.length > 0 ? 'Yes' : 'No'} />
                        </section>
                        <DataPreview data={data} />
                      </motion.div>
                    )}
                    {view === 'profile' && (
                      <motion.div key="pr" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
                        <Profiling profile={profile} data={data} isLoading={isProcessing} onViewAnalysis={(col) => { setActiveCleaningColumn(col); setView('cleaning'); }} />
                      </motion.div>
                    )}
                    {view === 'cleaning' && (
                      <motion.div key="cl" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8">
                        <div className="grid grid-cols-12 gap-8">
                          <div className="col-span-12 space-y-8">
                            <CleaningActions data={data} profile={profile} onApply={handleApplyAction} initialColumn={activeCleaningColumn || undefined} />
                          </div>
                        </div>
                        <div className="pt-8 border-t border-slate-200">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#0d9488]/10 text-[#0d9488] flex items-center justify-center">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[#0f172a] uppercase tracking-wider">Live Data Preview</h3>
                              <p className="text-[10px] text-[#64748b] font-mono">Real-time view of your dataset</p>
                            </div>
                          </div>
                          <DataPreview data={data} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Fixed-Position Slide-out Chat Panel */}
                <AnimatePresence>
                  {showChat && (
                    <>
                      {/* Backdrop to close when clicking outside */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowChat(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
                      />
                      
                      <motion.aside 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[450px] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col z-50 border-l border-slate-200"
                      >
                        <div className="flex-1 overflow-hidden flex flex-col">
                          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#0d9488] flex items-center justify-center text-white shadow-lg shadow-[#0d9488]/20">
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">DataWhiz AI</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Expert Assistant</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setShowChat(false)}
                              className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                            >
                              <ChevronRight className="w-6 h-6" />
                            </button>
                          </div>
                          
                          <div className="flex-1 overflow-hidden p-4">
                            <ChatInterface 
                              data={data} 
                              profile={profile} 
                              onApplyActions={handleApplyAIChatActions} 
                            />
                          </div>
                          
                          <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <div className="mb-2 px-2 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
                              <button onClick={handleUndo} disabled={history.length === 0} className="text-[10px] font-bold text-[#0d9488] hover:underline uppercase disabled:opacity-30">Undo</button>
                            </div>
                            <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                              <ActionHistory history={history} onUndo={handleUndo} />
                            </div>
                          </div>
                        </div>
                      </motion.aside>
                    </>
                  )}
                </AnimatePresence>

                {!showChat && (
                  <motion.button 
                    initial={{ scale: 0, x: 100 }}
                    animate={{ scale: 1, x: 0 }}
                    onClick={() => setShowChat(true)}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-[#0d9488] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:bg-[#0c857a] hover:scale-105 transition-all z-40 group"
                  >
                    <MessageSquare className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </div>
                    <span className="absolute right-20 bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest shadow-lg">
                      Open AI Assistant
                    </span>
                  </motion.button>
                )}
              </div>

              <footer className="h-16 flex items-center justify-between px-8 border-t border-[#e2e8f0] bg-white">
                <div className="flex gap-6 items-center">
                  <span className="text-[12px] font-bold text-[#0f172a]">Recent Actions:</span>
                  <div className="flex gap-4">
                    {history.slice(0, 2).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-[#64748b]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                        {h.type}: {h.column || 'Global'}
                      </div>
                    ))}
                    {history.length > 2 && <span className="text-[11px] text-[#94a3b8]">+{history.length - 2} more</span>}
                    {history.length === 0 && <span className="text-[11px] text-[#94a3b8] italic">None yet</span>}
                  </div>
                </div>
                <div className="text-[12px] text-[#64748b]">Showing {Math.min(data.length, 50)} of {data.length} rows</div>
              </footer>
            </main>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAuthModal(false)}>
            <motion.div initial={{scale:0.9,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0,y:20}}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 bg-[#0d9488]/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                {authModalReason === 'drive' ? <Cloud className="w-7 h-7 text-[#0d9488]" /> : <Download className="w-7 h-7 text-[#0d9488]" />}
              </div>
              <h2 className="text-2xl font-bold text-center text-[#0f172a] mb-2">
                {authModalReason === 'drive' ? 'Save to Google Drive' : 'Download Your Data'}
              </h2>
              <p className="text-[#64748b] text-center text-sm mb-8 leading-relaxed">
                {authModalReason === 'drive'
                  ? 'Sign in with Google to save your cleaned dataset directly to your Drive.'
                  : 'Sign in with Google to download your cleaned dataset. Quick and secure.'}
              </p>
              <button onClick={handleLoginAndContinue}
                className="w-full py-4 bg-[#0f172a] text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-[#1e293b] transition-all hover:scale-[1.02] active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button onClick={() => setShowAuthModal(false)} className="w-full py-3 text-[#64748b] text-sm font-medium mt-3 hover:text-[#0f172a] transition-colors">
                Maybe later — stay as guest
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isProcessing && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#0d9488] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-[#0f172a]">Processing...</p>
          </div>
        </div>
      )}

      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        fileLink={driveFileLink}
        fileName={lastUploadedFileName}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: any }) {
  return (
    <div className="bg-white p-5 flex flex-col gap-1 transition-colors hover:bg-slate-50">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-2xl font-bold text-slate-900 leading-none">{value}</span>
    </div>
  );
}
