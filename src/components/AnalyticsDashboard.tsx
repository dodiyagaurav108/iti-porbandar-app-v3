import React, { useState, useMemo, useEffect } from "react";
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Users, 
  BookOpen, 
  Layers, 
  Award, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  UserCheck, 
  FileDown, 
  Info,
  Database,
  Undo2
} from "lucide-react";
import { Student, Batch, Trade, User, StudentStatus } from "../types";
import { 
  exportAnalyticsStatsExcel, 
  exportAnalyticsStatsPDF, 
  exportAnalyticsStatsWord,
  exportScholarshipSummaryExcel,
  exportScholarshipSummaryPDF,
  exportScholarshipSummaryWord,
  exportTradeAnalyticsExcel,
  exportTradeAnalyticsPDF,
  exportTradeAnalyticsWord,
  exportBatchAnalyticsExcel,
  exportBatchAnalyticsPDF,
  exportBatchAnalyticsWord,
  exportMonthlyAnalyticsExcel,
  exportMonthlyAnalyticsPDF,
  exportMonthlyAnalyticsWord
} from "../utils/exportUtils";

interface AnalyticsDashboardProps {
  students: Student[];
  batches: Batch[];
  sis: User[];
  tradeObjects: Trade[];
  onDataImported?: () => void;
}

export default function AnalyticsDashboard({ 
  students, 
  batches, 
  sis, 
  tradeObjects,
  onDataImported 
}: AnalyticsDashboardProps) {
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrade, setSelectedTrade] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSi, setSelectedSi] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Hover states for SVG chart tooltips
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // Backup & Restore states
  const [backupStatus, setBackupStatus] = useState("Idle");
  const [backupHistory, setBackupHistory] = useState<string[]>([]);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Load local backup logs on mount
  useEffect(() => {
    const savedLogs = sessionStorage.getItem("iti_porbandar_backup_logs");
    if (savedLogs) {
      try {
        setBackupHistory(JSON.parse(savedLogs));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Automatic Daily Backup Logic (Offline Safe)
    const lastBackupTime = sessionStorage.getItem("iti_porbandar_last_backup_time");
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (!lastBackupTime || now - parseInt(lastBackupTime) > oneDay) {
      triggerAutomaticBackup();
    }
  }, []);

  // Filter batches list based on selected trade/S.I.
  const filteredBatchesForDropdown = useMemo(() => {
    return batches.filter(b => {
      if (selectedTrade && b.tradeName !== selectedTrade) return false;
      if (selectedSi && b.assignedSIId !== selectedSi) return false;
      return true;
    });
  }, [batches, selectedTrade, selectedSi]);

  // Main Filter Logic for student cohort
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Search filter (Name, Father, Surname, Enrollment, Mobile)
      const fullName = `${s.studentName} ${s.fatherName} ${s.surname}`.toLowerCase();
      const enrollment = s.enrollmentNumber.toLowerCase();
      const mobile = (s.studentMobileNumber || "").toLowerCase();
      if (searchTerm && 
          !fullName.includes(searchTerm.toLowerCase()) && 
          !enrollment.includes(searchTerm.toLowerCase()) &&
          !mobile.includes(searchTerm.toLowerCase())) {
        return false;
      }

      // 2. Trade filter
      if (selectedTrade && s.trade !== selectedTrade) return false;

      // 3. Batch filter
      if (selectedBatch && s.batchId !== selectedBatch) return false;

      // 4. S.I. Instructor filter
      if (selectedSi) {
        const batch = batches.find(b => b.id === s.batchId);
        if (!batch || batch.assignedSIId !== selectedSi) return false;
      }

      // 5. Month filter (Admission Month)
      if (selectedMonth) {
        const date = new Date(s.admissionDate);
        if (isNaN(date.getTime())) return false;
        const mLabel = date.toLocaleString("en-US", { month: "long", year: "numeric" });
        if (mLabel !== selectedMonth) return false;
      }

      return true;
    });
  }, [students, batches, searchTerm, selectedTrade, selectedBatch, selectedSi, selectedMonth]);

  // Extract distinct months for Month Filter dropdown
  const admissionMonthsList = useMemo(() => {
    const monthsSet = new Set<string>();
    students.forEach(s => {
      if (s.admissionDate) {
        const d = new Date(s.admissionDate);
        if (!isNaN(d.getTime())) {
          monthsSet.add(d.toLocaleString("en-US", { month: "long", year: "numeric" }));
        }
      }
    });
    return Array.from(monthsSet).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }, [students]);

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTrade("");
    setSelectedBatch("");
    setSelectedSi("");
    setSelectedMonth("");
  };

  // Compute Real-time Statistics based on filtered context
  const stats = useMemo(() => {
    const totalStudents = filteredStudents.length;
    const totalOnRoll = filteredStudents.filter(s => s.currentStatus === StudentStatus.ACTIVE).length;
    const totalNamkami = filteredStudents.filter(s => s.currentStatus === StudentStatus.EXIT_NAMKAMI).length;
    const totalRajinamu = filteredStudents.filter(s => s.currentStatus === StudentStatus.EXIT_RAJINAMU).length;
    const totalPassout = filteredStudents.filter(s => s.currentStatus === StudentStatus.EXIT_PASSOUT).length;
    
    // Filtered trades and batches sizes
    const activeTradeNames = new Set(filteredStudents.map(s => s.trade));
    const activeBatchIds = new Set(filteredStudents.map(s => s.batchId));
    
    // Fallback to original length if no trade/batch/SI filter is selected to keep it clean
    const totalTradesDisplay = selectedTrade ? 1 : (activeTradeNames.size || tradeObjects.length);
    const totalBatchesDisplay = selectedBatch ? 1 : (activeBatchIds.size || batches.length);
    const totalSisDisplay = selectedSi ? 1 : sis.length;

    return {
      totalTrades: totalTradesDisplay,
      totalBatches: totalBatchesDisplay,
      totalSis: totalSisDisplay,
      totalStudents,
      totalOnRoll,
      totalNamkami,
      totalRajinamu,
      totalPassout,
      totalExited: totalStudents - totalOnRoll
    };
  }, [filteredStudents, tradeObjects, batches, sis, selectedTrade, selectedBatch, selectedSi]);

  // Scholarship Distribution Calculation
  const scholarshipSummary = useMemo(() => {
    let dgCount = 0; // Digital Gujarat
    let isCount = 0; // Institute Stipend
    let otherCount = 0; // Other Scholarship
    let noneCount = 0; // No Scholarship

    let dgActive = 0;
    let isActive = 0;
    let otherActive = 0;
    let noneActive = 0;

    filteredStudents.forEach(s => {
      const type = (s.scholarshipType || "").trim().toLowerCase();
      const isActiveStatus = s.currentStatus === StudentStatus.ACTIVE;
      
      if (type.includes("digital gujarat") || type === "digital gujarat") {
        dgCount++;
        if (isActiveStatus) dgActive++;
      } else if (type.includes("stipend") || type.includes("institute stipend") || type === "institute stipend") {
        isCount++;
        if (isActiveStatus) isActive++;
      } else if (type === "none" || !s.scholarshipType || type === "") {
        noneCount++;
        if (isActiveStatus) noneActive++;
      } else {
        otherCount++;
        if (isActiveStatus) otherActive++;
      }
    });

    const total = filteredStudents.length || 1;
    return [
      { type: "Digital Gujarat (ડિજિટલ ગુજરાત)", count: dgCount, activeCount: dgActive, percentage: (dgCount / total) * 100, color: "bg-indigo-600", border: "border-indigo-600", fill: "#2563EB" },
      { type: "Institute Stipend (સંસ્થા સ્ટાઇપેન્ડ)", count: isCount, activeCount: isActive, percentage: (isCount / total) * 100, color: "bg-emerald-500", border: "border-emerald-500", fill: "#22C55E" },
      { type: "Other Scholarship (અન્ય શિષ્યવૃત્તિ)", count: otherCount, activeCount: otherActive, percentage: (otherCount / total) * 100, color: "bg-amber-500", border: "border-amber-500", fill: "#F59E0B" },
      { type: "No Scholarship (કોઈ નહીં)", count: noneCount, activeCount: noneActive, percentage: (noneCount / total) * 100, color: "bg-slate-300", border: "border-slate-300", fill: "#06B6D4" }
    ];
  }, [filteredStudents]);

  // Trade-wise Capacities and Filled Seats Summary
  const tradeAnalytics = useMemo(() => {
    return tradeObjects.map(t => {
      // Find batches for this trade
      const tradeBatches = batches.filter(b => b.tradeName.toLowerCase() === t.name.toLowerCase());
      // Total seats = 24 seats per batch (as per standard ITI configuration)
      const totalSeats = tradeBatches.length > 0 ? tradeBatches.length * 24 : 24;
      
      // Filter student roster belonging to this trade in the active filtered set
      const tradeStudents = filteredStudents.filter(s => s.trade.toLowerCase() === t.name.toLowerCase());
      const filledSeats = tradeStudents.length;
      const vacantSeats = Math.max(0, totalSeats - filledSeats);
      const onRollStudents = tradeStudents.filter(s => s.currentStatus === StudentStatus.ACTIVE).length;
      const fillRate = totalSeats > 0 ? (filledSeats / totalSeats) * 100 : 0;

      return {
        id: t.id,
        name: t.name,
        totalSeats,
        filledSeats,
        vacantSeats,
        onRollStudents,
        fillRate,
        isActive: t.isActive !== false
      };
    }).sort((a, b) => b.fillRate - a.fillRate);
  }, [tradeObjects, batches, filteredStudents]);

  // Batch-wise Enrollment Summary
  const batchAnalytics = useMemo(() => {
    return batches.filter(b => {
      if (selectedTrade && b.tradeName !== selectedTrade) return false;
      if (selectedSi && b.assignedSIId !== selectedSi) return false;
      if (selectedBatch && b.id !== selectedBatch) return false;
      return true;
    }).map(b => {
      const batchStudents = filteredStudents.filter(s => s.batchId === b.id);
      const totalStudents = batchStudents.length;
      const onRollStudents = batchStudents.filter(s => s.currentStatus === StudentStatus.ACTIVE).length;

      return {
        id: b.id,
        name: b.displayName,
        assignedSI: b.assignedSIName || "⚠️ Unassigned",
        totalStudents,
        onRollStudents,
        session: b.academicSession,
        year: b.year,
        shift: b.shift
      };
    }).sort((a, b) => b.totalStudents - a.totalStudents);
  }, [batches, filteredStudents, selectedTrade, selectedSi, selectedBatch]);

  // Chronological Monthly Statistics
  const monthlyTimelineData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; admissions: number; exits: number; dateKey: Date }> = {};
    
    // Gather admission months
    filteredStudents.forEach(s => {
      if (s.admissionDate) {
        const d = new Date(s.admissionDate);
        if (!isNaN(d.getTime())) {
          const mLabel = d.toLocaleString("en-US", { month: "long", year: "numeric" });
          if (!monthlyMap[mLabel]) {
            monthlyMap[mLabel] = { month: mLabel, admissions: 0, exits: 0, dateKey: new Date(d.getFullYear(), d.getMonth(), 1) };
          }
          monthlyMap[mLabel].admissions++;
        }
      }
      
      // Gather exits
      if (s.currentStatus !== StudentStatus.ACTIVE && s.exitEffectiveDate) {
        const d = new Date(s.exitEffectiveDate);
        if (!isNaN(d.getTime())) {
          const mLabel = d.toLocaleString("en-US", { month: "long", year: "numeric" });
          if (!monthlyMap[mLabel]) {
            monthlyMap[mLabel] = { month: mLabel, admissions: 0, exits: 0, dateKey: new Date(d.getFullYear(), d.getMonth(), 1) };
          }
          monthlyMap[mLabel].exits++;
        }
      }
    });

    // Convert map to sorted array
    const sortedData = Object.values(monthlyMap).sort((a, b) => a.dateKey.getTime() - b.dateKey.getTime());

    // Calculate rolling active cumulative on-roll
    let runningOnRoll = 0;
    const finalData = sortedData.map(item => {
      runningOnRoll += item.admissions - item.exits;
      return {
        ...item,
        onRoll: Math.max(0, runningOnRoll)
      };
    });

    return finalData;
  }, [filteredStudents]);

  // Dynamic S.I. List for S.I. Filter Dropdown
  const activeSisList = useMemo(() => {
    return sis.filter(user => user.isActive !== false);
  }, [sis]);

  // Offline backup automatic triggers
  const triggerAutomaticBackup = () => {
    setBackupStatus("Backing up...");
    setTimeout(() => {
      try {
        const dbSnapshot = {
          exportTimestamp: new Date().toISOString(),
          students,
          batches,
          sis,
          tradeObjects,
          source: "ITI Porbandar Offline Auto-Backup Engine"
        };
        const dateStr = new Date().toLocaleDateString();
        const timeStr = new Date().toLocaleTimeString();
        const logMsg = `Auto-Backup created on ${dateStr} at ${timeStr} (Offline Safe, ${students.length} trainees, ${batches.length} batches)`;
        
        sessionStorage.setItem("iti_porbandar_backup_database", JSON.stringify(dbSnapshot));
        sessionStorage.setItem("iti_porbandar_last_backup_time", new Date().getTime().toString());
        
        let logs: string[] = [];
        const savedLogs = sessionStorage.getItem("iti_porbandar_backup_logs");
        if (savedLogs) {
          try { logs = JSON.parse(savedLogs); } catch (e) {}
        }
        logs.unshift(logMsg);
        logs = logs.slice(0, 10); // Keep last 10 logs
        sessionStorage.setItem("iti_porbandar_backup_logs", JSON.stringify(logs));
        
        setBackupHistory(logs);
        setBackupStatus("Completed");
      } catch (err: any) {
        console.error(err);
        setBackupStatus("Failed: " + err.message);
      }
    }, 1000);
  };

  // Force Manual Backup Download (.json)
  const handleDownloadBackupFile = () => {
    try {
      const dbSnapshot = {
        exportTimestamp: new Date().toISOString(),
        students,
        batches,
        sis,
        tradeObjects,
        source: "ITI Porbandar Trainee Management System"
      };
      
      const blob = new Blob([JSON.stringify(dbSnapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ITI_PORBANDAR_DATABASE_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert("Offline database backup file downloaded successfully!");
    } catch (e: any) {
      alert("Failed to download database backup: " + e.message);
    }
  };

  // Restore database from uploaded JSON file
  const handleRestoreDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setRestoreError(null);
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);
        
        if (!parsed.students || !parsed.batches || !parsed.sis) {
          throw new Error("Invalid backup format. Missing students, batches, or S.I. database keys.");
        }

        // Restore into sessionStorage
        sessionStorage.setItem("iti_porbandar_students", JSON.stringify(parsed.students));
        sessionStorage.setItem("iti_porbandar_batches", JSON.stringify(parsed.batches));
        sessionStorage.setItem("iti_porbandar_sis", JSON.stringify(parsed.sis));
        if (parsed.tradeObjects) {
          sessionStorage.setItem("iti_porbandar_trades", JSON.stringify(parsed.tradeObjects));
        }

        alert(`Database successfully restored! Loaded ${parsed.students.length} Students, ${parsed.batches.length} Batches, and ${parsed.sis.length} S.I. Instructors.`);
        
        // Reload page to re-render all states
        if (onDataImported) {
          onDataImported();
        } else {
          window.location.reload();
        }
      } catch (err: any) {
        setRestoreError(err.message);
        alert("Restore failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // SVG Chart Dimensions & Computations
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 25;

  const maxValInTimeline = useMemo(() => {
    if (monthlyTimelineData.length === 0) return 10;
    let m = 0;
    monthlyTimelineData.forEach(d => {
      if (d.admissions > m) m = d.admissions;
      if (d.exits > m) m = d.exits;
      if (d.onRoll > m) m = d.onRoll;
    });
    return Math.max(10, m + 2);
  }, [monthlyTimelineData]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. TOP HEADER & TITLE ROW */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp size={22} className="text-indigo-600 animate-pulse" />
            Institute Performance & Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time offline enrollment, scholarship allotments, trade capacity ratios, and chronological exit summaries.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={triggerAutomaticBackup}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} className={backupStatus === "Backing up..." ? "animate-spin text-indigo-600" : ""} />
            {backupStatus === "Backing up..." ? "Saving Auto-Backup..." : "Create Auto-Backup"}
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC SEARCH & MULTI-FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Filter size={14} className="text-indigo-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">Cohort Search & Data Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* General Search Input */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Trainee</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Name, roll or mobile..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Trade Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter Academic Trade</label>
            <select
              value={selectedTrade}
              onChange={e => { setSelectedTrade(e.target.value); setSelectedBatch(""); }}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              <option value="">All Registered Trades ({tradeObjects.length})</option>
              {tradeObjects.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter Batch Allotment</label>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              <option value="">All Batches ({filteredBatchesForDropdown.length})</option>
              {filteredBatchesForDropdown.map(b => (
                <option key={b.id} value={b.id}>{b.displayName} ({b.academicSession})</option>
              ))}
            </select>
          </div>

          {/* S.I. Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter S.I. Instructor</label>
            <select
              value={selectedSi}
              onChange={e => { setSelectedSi(e.target.value); setSelectedBatch(""); }}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              <option value="">All S.I. Supervisors ({activeSisList.length})</option>
              {activeSisList.map(si => (
                <option key={si.id} value={si.id}>{si.name}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter Admission Month</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            >
              <option value="">All Admissions ({admissionMonthsList.length} months)</option>
              {admissionMonthsList.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Applied filters summary and Reset button */}
        {(searchTerm || selectedTrade || selectedBatch || selectedSi || selectedMonth) && (
          <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 text-xs mt-2">
            <span className="font-semibold text-slate-500">
              Active Filters: {filteredStudents.length} of {students.length} trainees match.
            </span>
            <button 
              onClick={handleResetFilters}
              className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider flex items-center gap-1"
            >
              <Undo2 size={12} /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. REAL-TIME STATS BENTO GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">1. Real-Time Cohort Statistics</h3>
          
          <div className="flex gap-1.5">
            <button 
              onClick={() => exportAnalyticsStatsExcel(stats, `ITI_RealTime_Stats_Report`)}
              className="p-1.5 bg-white border border-slate-200 text-emerald-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Export Stats to Excel"
            >
              <FileSpreadsheet size={12} /> <span className="hidden sm:inline">Excel</span>
            </button>
            <button 
              onClick={() => exportAnalyticsStatsPDF(stats, `ITI_RealTime_Stats_Report`)}
              className="p-1.5 bg-white border border-slate-200 text-rose-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Export Stats to PDF"
            >
              <FileDown size={12} /> <span className="hidden sm:inline">PDF</span>
            </button>
            <button 
              onClick={() => exportAnalyticsStatsWord(stats, `ITI_RealTime_Stats_Report`)}
              className="p-1.5 bg-white border border-slate-200 text-blue-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Export Stats to Word"
            >
              <FileText size={12} /> <span className="hidden sm:inline">Word</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Total Trades */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-3xs min-h-[100px] hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Trades</span>
              <BookOpen size={16} className="text-indigo-500" />
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-slate-800">{stats.totalTrades}</span>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Curriculums</span>
            </div>
          </div>

          {/* Total Batches */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-3xs min-h-[100px] hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Batches</span>
              <Layers size={16} className="text-indigo-500" />
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-slate-800">{stats.totalBatches}</span>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Allotments</span>
            </div>
          </div>

          {/* Total S.I. */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-3xs min-h-[100px] hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total S.I.</span>
              <Users size={16} className="text-indigo-500" />
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-slate-800">{stats.totalSis}</span>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Supervisors</span>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-indigo-600 p-4 rounded-2xl flex flex-col justify-between shadow-xs min-h-[100px] text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-100 uppercase tracking-wider">Total Registered</span>
              <Award size={16} className="text-indigo-100" />
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black">{stats.totalStudents}</span>
              <span className="text-[9px] font-bold text-indigo-100 bg-white/20 px-2 py-0.5 rounded border border-white/20">All-Time</span>
            </div>
          </div>

          {/* On-Roll Students */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-3xs min-h-[100px] hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> On-Roll Active
              </span>
              <UserCheck size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-slate-800">{stats.totalOnRoll}</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">ચાલુ</span>
            </div>
          </div>

          {/* Name Cut */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-3xs min-h-[100px] hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Name Cut (Namkami)</span>
              <div className="text-[10px] font-bold text-amber-500">🚪</div>
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-slate-800">{stats.totalNamkami}</span>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">નામકમી</span>
            </div>
          </div>

          {/* Resigned */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-3xs min-h-[100px] hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Resigned (Rajinamu)</span>
              <div className="text-[10px]">✏️</div>
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-slate-800">{stats.totalRajinamu}</span>
              <span className="text-[9px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">રાજીનામું</span>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-3xs min-h-[100px] hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Completed (Passout)</span>
              <div className="text-[10px]">🎓</div>
            </div>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-black text-slate-800">{stats.totalPassout}</span>
              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">પાસ આઉટ</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. SCHOLARSHIP SUMMARY & CHRONOLOGICAL CHART ROW */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Scholarship Summary Panel (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-3xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Award size={14} className="text-indigo-600" /> Scholarship Allocation
              </h3>
              <div className="flex gap-1">
                <button 
                  onClick={() => exportScholarshipSummaryExcel(scholarshipSummary, `ITI_Scholarship_Summary_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export Scholarship stats to Excel"
                >
                  <FileSpreadsheet size={10} />
                </button>
                <button 
                  onClick={() => exportScholarshipSummaryPDF(scholarshipSummary, `ITI_Scholarship_Summary_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export Scholarship stats to PDF"
                >
                  <FileDown size={10} />
                </button>
                <button 
                  onClick={() => exportScholarshipSummaryWord(scholarshipSummary, `ITI_Scholarship_Summary_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export Scholarship stats to Word"
                >
                  <FileText size={10} />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Breakdown of student schemes filtered by your currently selected demographic cohort:
            </p>

            <div className="space-y-4">
              {scholarshipSummary.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                      {item.type}
                    </span>
                    <span className="font-extrabold text-slate-800">
                      {item.count} <span className="text-[10px] text-slate-400 font-medium">({item.percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className={`${item.color} h-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  
                  {/* On Roll count sub-stat */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pl-4">
                    <span>On-Roll Recipient Active Count:</span>
                    <span className="font-bold text-slate-600">{item.activeCount} active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Info size={12} className="text-slate-400 shrink-0" />
            <span>Scholarship data synchronizes live with student registry profiles.</span>
          </div>
        </div>

        {/* Chronological Monthly SVG Admissions vs Exits Chart (col-span-8) */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-3xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-600" /> Chronological Admission & Exit Monthly Analytics
              </h3>
              
              <div className="flex gap-1.5">
                <button 
                  onClick={() => exportMonthlyAnalyticsExcel(monthlyTimelineData, `ITI_Monthly_Admissions_Exits_Report`)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-emerald-600 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Export Monthly stats to Excel"
                >
                  <FileSpreadsheet size={11} /> <span className="hidden sm:inline">Excel</span>
                </button>
                <button 
                  onClick={() => exportMonthlyAnalyticsPDF(monthlyTimelineData, `ITI_Monthly_Admissions_Exits_Report`)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-rose-600 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Export Monthly stats to PDF"
                >
                  <FileDown size={11} /> <span className="hidden sm:inline">PDF</span>
                </button>
                <button 
                  onClick={() => exportMonthlyAnalyticsWord(monthlyTimelineData, `ITI_Monthly_Admissions_Exits_Report`)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Export Monthly stats to Word"
                >
                  <FileText size={11} /> <span className="hidden sm:inline">Word</span>
                </button>
              </div>
            </div>

            {monthlyTimelineData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 h-[220px]">
                <span className="text-3xl">📊</span>
                <p className="text-xs font-bold text-slate-600">No chronological timeline data available</p>
                <p className="text-[10px]">Add admissions or process student exits with valid dates to generate analytics.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Legend Indicator */}
                <div className="flex items-center gap-4 text-xs font-semibold px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-indigo-600 rounded"></span>
                    <span className="text-slate-600">New Admissions (પ્રવેશ)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-rose-500 rounded"></span>
                    <span className="text-slate-600">Exits (નામકમી / રાજીનામું)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-amber-500 rounded"></span>
                    <span className="text-slate-600">Cumulative On-Roll (ચાલુ)</span>
                  </div>
                </div>

                {/* SVG Native Graph */}
                <div className="relative w-full overflow-x-auto pt-2">
                  <svg 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                    className="w-full min-w-[450px] overflow-visible"
                    style={{ height: `${chartHeight}px` }}
                  >
                    {/* Horizontal Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                      const yVal = paddingTop + ratio * (chartHeight - paddingTop - paddingBottom);
                      const displayVal = Math.round(maxValInTimeline * (1 - ratio));
                      return (
                        <g key={index}>
                          <line 
                            x1={paddingLeft} 
                            y1={yVal} 
                            x2={chartWidth - paddingRight} 
                            y2={yVal} 
                            stroke="rgba(255, 255, 255, 0.08)" 
                            strokeWidth="0.5" 
                            strokeDasharray="3 3"
                          />
                          <text 
                            x={paddingLeft - 8} 
                            y={yVal + 3} 
                            fontSize="8" 
                            className="fill-slate-400 font-bold font-mono" 
                            textAnchor="end"
                          >
                            {displayVal}
                          </text>
                        </g>
                      );
                    })}

                    {/* Rendering chronological monthly bars and cumulative lines */}
                    {monthlyTimelineData.map((d, index) => {
                      const count = monthlyTimelineData.length;
                      const graphWidth = chartWidth - paddingLeft - paddingRight;
                      const segmentWidth = graphWidth / count;
                      const xBase = paddingLeft + index * segmentWidth;
                      
                      // Bar coordinates
                      const barWidth = Math.max(3, segmentWidth * 0.25);
                      
                      const admissionsHeight = (d.admissions / maxValInTimeline) * (chartHeight - paddingTop - paddingBottom);
                      const exitsHeight = (d.exits / maxValInTimeline) * (chartHeight - paddingTop - paddingBottom);
                      
                      const yAdmissions = chartHeight - paddingBottom - admissionsHeight;
                      const yExits = chartHeight - paddingBottom - exitsHeight;

                      // Cumulative Line Coordinates
                      const xLine = xBase + segmentWidth * 0.5;
                      const yLine = chartHeight - paddingBottom - (d.onRoll / maxValInTimeline) * (chartHeight - paddingTop - paddingBottom);

                      return (
                        <g 
                          key={index}
                          onMouseEnter={() => setHoveredMonthIndex(index)}
                          onMouseLeave={() => setHoveredMonthIndex(null)}
                          className="cursor-pointer"
                        >
                          {/* Hover highlight background */}
                          {hoveredMonthIndex === index && (
                            <rect 
                              x={xBase} 
                              y={paddingTop} 
                              width={segmentWidth} 
                              height={chartHeight - paddingTop - paddingBottom} 
                              fill="rgba(255, 255, 255, 0.05)" 
                              opacity="0.5"
                            />
                          )}

                          {/* Admissions Bar */}
                          <rect 
                            x={xBase + segmentWidth * 0.15} 
                            y={yAdmissions} 
                            width={barWidth} 
                            height={admissionsHeight} 
                            fill="#2563EB" 
                            rx="1"
                          />

                          {/* Exits Bar */}
                          <rect 
                            x={xBase + segmentWidth * 0.15 + barWidth + 2} 
                            y={yExits} 
                            width={barWidth} 
                            height={exitsHeight} 
                            fill="#EF4444" 
                            rx="1"
                          />

                          {/* Line Plot Dot for Cumulative On-Roll */}
                          <circle 
                            cx={xLine} 
                            cy={yLine} 
                            r="3" 
                            fill="#F59E0B" 
                            stroke="#111827" 
                            strokeWidth="1"
                          />

                          {/* Axis label */}
                          <text 
                            x={xBase + segmentWidth * 0.5} 
                            y={chartHeight - 8} 
                            fontSize="8" 
                            className="fill-slate-500 font-extrabold text-center" 
                            textAnchor="middle"
                          >
                            {d.month.split(" ")[0].slice(0, 3)} '{d.month.split(" ")[1].slice(-2)}
                          </text>
                        </g>
                      );
                    })}

                    {/* SVG Line path for Cumulative Trend */}
                    {monthlyTimelineData.length > 1 && (
                      <path 
                        d={monthlyTimelineData.map((d, index) => {
                          const count = monthlyTimelineData.length;
                          const segmentWidth = (chartWidth - paddingLeft - paddingRight) / count;
                          const xLine = paddingLeft + index * segmentWidth + segmentWidth * 0.5;
                          const yLine = chartHeight - paddingBottom - (d.onRoll / maxValInTimeline) * (chartHeight - paddingTop - paddingBottom);
                          return `${index === 0 ? 'M' : 'L'} ${xLine} ${yLine}`;
                        }).join(" ")}
                        fill="none" 
                        stroke="#F59E0B" 
                        strokeWidth="1.5"
                      />
                    )}
                  </svg>

                  {/* Interactive Chart Tooltip Popup */}
                  {hoveredMonthIndex !== null && monthlyTimelineData[hoveredMonthIndex] && (
                    <div className="absolute top-0 right-0 bg-slate-900 text-white rounded-lg p-2.5 shadow-md text-[10px] space-y-1 font-sans border border-slate-700 animate-fadeIn">
                      <p className="font-extrabold text-indigo-300 uppercase">{monthlyTimelineData[hoveredMonthIndex].month}</p>
                      <div className="flex justify-between gap-6">
                        <span>Admissions:</span>
                        <span className="font-black text-emerald-400">+{monthlyTimelineData[hoveredMonthIndex].admissions}</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span>Exits:</span>
                        <span className="font-black text-rose-400">-{monthlyTimelineData[hoveredMonthIndex].exits}</span>
                      </div>
                      <div className="flex justify-between gap-6 border-t border-slate-700 pt-1 mt-1">
                        <span>Active On-Roll:</span>
                        <span className="font-black text-amber-400">{monthlyTimelineData[hoveredMonthIndex].onRoll} trainees</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between mt-4">
            <span className="flex items-center gap-1 text-indigo-600 font-bold">
              ● Live Timeline Trend Calculation (Offline Database State Engine)
            </span>
            <span>Total analyzed cohort points: {monthlyTimelineData.length} months</span>
          </div>
        </div>

      </div>

      {/* 5. TRADE-WISE SUMMARY & BATCH-WISE SUMMARY TABLES */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Trade-wise Enrolment Table (col-span-6) */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-3xs p-5 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-600" /> Trade-wise Seat Allotments
              </h3>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => exportTradeAnalyticsExcel(tradeAnalytics, `ITI_Trade_Capacity_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export to Excel"
                >
                  <FileSpreadsheet size={11} />
                </button>
                <button 
                  onClick={() => exportTradeAnalyticsPDF(tradeAnalytics, `ITI_Trade_Capacity_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export to PDF"
                >
                  <FileDown size={11} />
                </button>
                <button 
                  onClick={() => exportTradeAnalyticsWord(tradeAnalytics, `ITI_Trade_Capacity_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export to Word"
                >
                  <FileText size={11} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-200">
                    <th className="px-3 py-2">Trade Name</th>
                    <th className="px-3 py-2 text-center">Total Seats</th>
                    <th className="px-3 py-2 text-center">Filled</th>
                    <th className="px-3 py-2 text-center">On-Roll</th>
                    <th className="px-3 py-2 text-right">Fill Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tradeAnalytics.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">No trade capacity data found</td>
                    </tr>
                  ) : (
                    tradeAnalytics.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 font-medium">
                        <td className="px-3 py-3 font-bold text-slate-800">{t.name}</td>
                        <td className="px-3 py-3 text-center font-mono text-slate-600">{t.totalSeats}</td>
                        <td className="px-3 py-3 text-center font-mono text-slate-600">{t.filledSeats}</td>
                        <td className="px-3 py-3 text-center font-mono text-emerald-600 font-bold">{t.onRollStudents}</td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-indigo-600">{t.fillRate.toFixed(1)}%</span>
                            <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                              <div 
                                className="bg-indigo-600 h-full"
                                style={{ width: `${Math.min(100, t.fillRate)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            * Standard intake capacity is calculated as <span className="font-bold">24 seats per batch unit</span>.
          </div>
        </div>

        {/* Batch-wise Enrolment Table (col-span-6) */}
        <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-3xs p-5 flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" /> Batch-wise Cohort Allotments
              </h3>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => exportBatchAnalyticsExcel(batchAnalytics, `ITI_Batch_Allotment_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export to Excel"
                >
                  <FileSpreadsheet size={11} />
                </button>
                <button 
                  onClick={() => exportBatchAnalyticsPDF(batchAnalytics, `ITI_Batch_Allotment_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export to PDF"
                >
                  <FileDown size={11} />
                </button>
                <button 
                  onClick={() => exportBatchAnalyticsWord(batchAnalytics, `ITI_Batch_Allotment_Report`)}
                  className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded"
                  title="Export to Word"
                >
                  <FileText size={11} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-200">
                    <th className="px-3 py-2">Batch Name</th>
                    <th className="px-3 py-2">Assigned S.I.</th>
                    <th className="px-3 py-2 text-center">Total Students</th>
                    <th className="px-3 py-2 text-center">Active On-Roll</th>
                    <th className="px-3 py-2 text-right">Academic Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batchAnalytics.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">No active batch summary data</td>
                    </tr>
                  ) : (
                    batchAnalytics.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 font-medium">
                        <td className="px-3 py-3 font-bold text-slate-800">
                          <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded border border-slate-200">
                            {b.name}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600 font-bold">{b.assignedSI}</td>
                        <td className="px-3 py-3 text-center font-mono text-slate-600">{b.totalStudents}</td>
                        <td className="px-3 py-3 text-center font-mono text-emerald-600 font-bold">{b.onRollStudents}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-500 font-bold">{b.session}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            Batch data displays current student headcount and corresponding S.I. assignment roles.
          </div>
        </div>

      </div>

      {/* 6. OFFLINE BACKUP, SECURITY & RECOVERY SYSTEM PANEL */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Database className="text-amber-500 animate-pulse" size={20} />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Offline Secure Backup & Recovery Engine</h3>
              <p className="text-[10px] text-slate-400">100% Client-Side Private Encryption. Never transmits training secrets outside the sandboxed browser environment.</p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-800 text-amber-400 font-bold px-2.5 py-1 rounded-full border border-slate-700 uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck size={12} /> Local Backup Status: Enabled (Active)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left panel - logs and manual triggers */}
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              To protect your database against browser cache clears or system failures, download encrypted backups regularly.
            </p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <button 
                onClick={handleDownloadBackupFile}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow hover:shadow-indigo-900/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} /> Download Secure Backup JSON
              </button>
            </div>

            {/* Auto Backup Log Highlights */}
            <div className="space-y-1.5 pt-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Automated Backup Audit History</p>
              <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-2 max-h-[110px] overflow-y-auto font-mono text-[9px] text-slate-400">
                {backupHistory.length === 0 ? (
                  <p className="text-center py-4 text-slate-600">No backup logs registered in current session.</p>
                ) : (
                  backupHistory.map((log, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 border-b border-slate-900/50 pb-1.5 last:border-0 last:pb-0">
                      <span>✓ {log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right panel - restore interface */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-1.5">
                <Upload size={14} /> Restore Database File
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Restore S.I.s, Trades, Batches, and Trainees instantly by uploading a previously downloaded <span className="font-bold text-slate-200">.json</span> database snapshot file. 
              </p>
              <p className="text-[10px] text-rose-400 font-semibold leading-normal">
                ⚠️ WARNING: Restoring will overwrite all existing student, batch, and supervisor records in this browser's active cache.
              </p>
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="sr-only">Choose backup file</span>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleRestoreDatabase}
                  className="block w-full text-xs text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-xs file:font-black file:uppercase file:tracking-wider
                    file:bg-slate-800 file:text-amber-400
                    hover:file:bg-slate-700
                    cursor-pointer"
                />
              </label>
              {restoreError && (
                <p className="text-[10px] text-rose-500 font-bold mt-2 font-mono">
                  Error: {restoreError}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
