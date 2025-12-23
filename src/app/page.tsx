"use client";

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Settings,
  RefreshCw,
  FileSpreadsheet,
  Users,
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';
import { getDay, parse, differenceInMinutes, isValid, format, isWeekend } from "date-fns";

// Rule 1: Monday-Friday = 8.5h, Saturday = 4h, Sunday = 0h
function getExpected(date: Date) {
  const day = getDay(date);
  if (day === 0) return 0;
  if (day === 6) return 4;
  return 8.5;
}

// Rule 2: Actual Worked Hours
function getActual(inT: string, outT: string) {
  if (!inT || !outT) return 0;
  const start = parse(inT, "HH:mm", new Date());
  const end = parse(outT, "HH:mm", new Date());
  if (!isValid(start) || !isValid(end)) return 0;
  return Math.max(0, differenceInMinutes(end, start) / 60);
}

interface DataRow {
  'Employee Name': string;
  Date: string;
  'In-Time': string;
  'Out-Time': string;
  exp: number;
  act: number;
  isLeave: boolean;
  isOvertime: boolean;
  isUndertime: boolean;
  dayType: string;
}

function Card({ title, value, icon, trend, color = "blue", subtitle }: any) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    green: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400"
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-2xl border backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-zinc-300 text-xs font-bold uppercase tracking-wider">{title}</span>
        <div className={`p-3 rounded-xl bg-black/30 backdrop-blur-sm ${color.split(' ')[2]}`}>
          {icon}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold font-mono">{value}</div>
        {subtitle && (
          <div className="text-sm text-zinc-400">{subtitle}</div>
        )}
        {trend && (
          <div className={`flex items-center text-xs ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
            {trend > 0 ? <TrendingUp size={14} /> : trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Table({ data }: { data: DataRow[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [activeView, setActiveView] = useState('overview');

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(row => {
      const matchesSearch = row['Employee Name'].toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'leave' && row.isLeave) ||
        (statusFilter === 'present' && !row.isLeave) ||
        (statusFilter === 'overtime' && row.isOvertime) ||
        (statusFilter === 'undertime' && row.isUndertime);
      
      return matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof DataRow];
        const bValue = b[sortConfig.key as keyof DataRow];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredAndSortedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Analysis");
    XLSX.writeFile(wb, "leave-analysis.xlsx");
  };

  const views = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'detailed', label: 'Detailed View', icon: Eye },
    { key: 'employees', label: 'By Employee', icon: Users },
    { key: 'calendar', label: 'Calendar View', icon: Calendar }
  ];

  const groupByEmployee = useMemo(() => {
    const grouped = data.reduce((acc, row) => {
      const employee = row['Employee Name'];
      if (!acc[employee]) {
        acc[employee] = {
          name: employee,
          records: [],
          totalHours: 0,
          totalExpected: 0,
          leaves: 0,
          overtime: 0,
          undertime: 0
        };
      }
      acc[employee].records.push(row);
      acc[employee].totalHours += row.act;
      acc[employee].totalExpected += row.exp;
      if (row.isLeave) acc[employee].leaves++;
      if (row.isOvertime) acc[employee].overtime++;
      if (row.isUndertime) acc[employee].undertime++;
      return acc;
    }, {} as any);
    
    return Object.values(grouped);
  }, [data]);

  const renderOverviewTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-zinc-800/80 backdrop-blur-sm sticky top-0 z-10">
          <tr>
            {[
              { key: 'Employee Name', label: 'Employee', icon: User },
              { key: 'Date', label: 'Date', icon: Calendar },
              { key: 'In-Time', label: 'In-Time', icon: Clock },
              { key: 'Out-Time', label: 'Out-Time', icon: Clock },
              { key: 'exp', label: 'Expected', icon: Clock },
              { key: 'act', label: 'Actual', icon: CheckCircle },
              { key: 'status', label: 'Status', icon: AlertCircle },
              { key: 'productivity', label: 'Productivity', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <th 
                key={key}
                className="p-4 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort(key)}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} />
                  {label}
                  {sortConfig?.key === key && (
                    <span className="text-blue-400">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {filteredAndSortedData.map((row, i) => {
            const productivity = row.exp > 0 ? ((row.act / row.exp) * 100).toFixed(1) : "0";
            return (
              <tr 
                key={i} 
                className="hover:bg-zinc-800/50 transition-all duration-200 group backdrop-blur-sm"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {row['Employee Name'].charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium text-zinc-200 group-hover:text-white">
                      {row['Employee Name']}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-zinc-300 text-sm font-medium">
                    {format(new Date(row.Date), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-zinc-500 text-xs flex items-center gap-1">
                    <Calendar size={10} />
                    {row.dayType}
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700">
                    {row['In-Time'] || '--:--'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-zinc-700">
                    {row['Out-Time'] || '--:--'}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm text-zinc-300 font-semibold">
                    {row.exp.toFixed(1)}h
                  </span>
                </td>
                <td className="p-4">
                  <span className={`font-mono text-sm font-semibold ${
                    row.isOvertime ? 'text-purple-400' : 
                    row.isUndertime ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {row.act.toFixed(1)}h
                  </span>
                </td>
                <td className="p-4">
                  {getStatusBadge(row)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      parseFloat(productivity) >= 100 ? 'bg-green-500' :
                      parseFloat(productivity) >= 80 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-zinc-300">{productivity}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderEmployeeTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-zinc-800/80 backdrop-blur-sm sticky top-0 z-10">
          <tr>
            {[
              { key: 'name', label: 'Employee', icon: User },
              { key: 'totalHours', label: 'Total Hours', icon: Clock },
              { key: 'totalExpected', label: 'Expected Hours', icon: Target },
              { key: 'productivity', label: 'Productivity', icon: TrendingUp },
              { key: 'leaves', label: 'Leaves', icon: AlertCircle },
              { key: 'overtime', label: 'Overtime', icon: TrendingUp },
              { key: 'undertime', label: 'Undertime', icon: TrendingDown }
            ].map(({ key, label, icon: Icon }) => (
              <th 
                key={key}
                className="p-4 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort(key)}
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} />
                  {label}
                  {sortConfig?.key === key && (
                    <span className="text-blue-400">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {groupByEmployee.map((employee: any, i) => {
            const productivity = employee.totalExpected > 0 ? ((employee.totalHours / employee.totalExpected) * 100).toFixed(1) : "0";
            return (
              <tr 
                key={i} 
                className="hover:bg-zinc-800/50 transition-all duration-200 group backdrop-blur-sm"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium text-zinc-200 group-hover:text-white">
                      {employee.name}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono text-lg font-semibold text-green-400">
                    {employee.totalHours.toFixed(1)}h
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-lg font-semibold text-zinc-300">
                    {employee.totalExpected.toFixed(1)}h
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          parseFloat(productivity) >= 100 ? 'bg-green-500' :
                          parseFloat(productivity) >= 80 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(parseFloat(productivity), 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-zinc-300">{productivity}%</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
                    {employee.leaves}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-700">
                    {employee.overtime}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-700">
                    {employee.undertime}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const getStatusBadge = (row: DataRow) => {
    if (row.isLeave) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
          <AlertCircle size={12} className="mr-1" />
          Leave
        </span>
      );
    }
    
    if (row.isOvertime) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-700">
          <TrendingUp size={12} className="mr-1" />
          Overtime
        </span>
      );
    }
    
    if (row.isUndertime) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-700">
          <TrendingDown size={12} className="mr-1" />
          Undertime
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
        <CheckCircle size={12} className="mr-1" />
        Present
      </span>
    );
  };

  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-2xl border border-zinc-700/50 p-16 text-center backdrop-blur-sm">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Upload className="w-10 h-10 text-zinc-400" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-300 mb-3">No Data Uploaded</h3>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">Upload an Excel file to analyze employee leave data and get comprehensive insights</p>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 inline-block backdrop-blur-sm">
          <p className="font-semibold mb-3 text-zinc-300">Expected Excel columns:</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <User size={14} />
              <span>Employee Name</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Date</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>In-Time</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>Out-Time</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Table Controls */}
      <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-2xl border border-zinc-700/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* View Tabs */}
          <div className="flex flex-wrap gap-2">
            {views.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeView === key 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-md">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-zinc-800 backdrop-blur-sm w-full transition-all"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:bg-zinc-800 backdrop-blur-sm appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="leave">Leave</option>
                <option value="overtime">Overtime</option>
                <option value="undertime">Undertime</option>
              </select>
            </div>
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-blue-600/25"
          >
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-2xl border border-zinc-700/50 overflow-hidden backdrop-blur-sm shadow-2xl">
        {/* Table Header */}
        <div className="bg-zinc-800/30 backdrop-blur-sm p-6 border-b border-zinc-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-200 capitalize">{activeView} View</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Showing {filteredAndSortedData.length} of {data.length} records
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-zinc-400">Present: {data.filter(d => !d.isLeave).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-zinc-400">Leave: {data.filter(d => d.isLeave).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-zinc-400">Overtime: {data.filter(d => d.isOvertime).length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-zinc-400">Undertime: {data.filter(d => d.isUndertime).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="min-h-96">
          {activeView === 'overview' && renderOverviewTable()}
          {activeView === 'employees' && renderEmployeeTable()}
          {activeView === 'detailed' && renderOverviewTable()}
          {activeView === 'calendar' && renderOverviewTable()}
        </div>

        {/* Enhanced Table Footer */}
        <div className="bg-zinc-800/30 backdrop-blur-sm p-6 border-t border-zinc-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              <span className="font-medium">Total Records:</span> {data.length} | 
              <span className="font-medium ml-2">Filtered:</span> {filteredAndSortedData.length}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Activity size={14} />
                <span>Last updated: {format(new Date(), 'MMM dd, HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaveAnalyzer() {
  const [data, setData] = useState<DataRow[]>([]);
  const [stats, setStats] = useState({ expected: 0, actual: 0, leaves: 0, overtime: 0, undertime: 0 });

  const handleUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawJson = XLSX.utils.sheet_to_json(ws);

      let totalExp = 0;
      let totalAct = 0;
      let totalLeaves = 0;
      let totalOvertime = 0;
      let totalUndertime = 0;

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      const processed = rawJson.map((row: any) => {
        const date = new Date(row.Date);
        const exp = getExpected(date);
        const act = getActual(row['In-Time'], row['Out-Time']);
        const dayName = dayNames[getDay(date)];
        
        totalExp += exp;
        totalAct += act;
        if ((!row['In-Time'] || !row['Out-Time']) && exp > 0) totalLeaves++;
        if (act > exp + 0.5) totalOvertime++;
        if (act < exp - 0.5 && exp > 0) totalUndertime++;

        return { 
          ...row, 
          exp, 
          act, 
          isLeave: exp > 0 && act === 0,
          isOvertime: act > exp + 0.5,
          isUndertime: act < exp - 0.5 && exp > 0,
          dayType: dayName
        };
      });

      setData(processed);
      setStats({ 
        expected: totalExp, 
        actual: totalAct, 
        leaves: totalLeaves,
        overtime: totalOvertime,
        undertime: totalUndertime
      });
    };
    reader.readAsBinaryString(file);
  };

  const productivity = stats.expected > 0 ? ((stats.actual / stats.expected) * 100).toFixed(1) : "0";
  const attendanceRate = data.length > 0 ? (((data.length - stats.leaves) / data.length) * 100).toFixed(1) : "0";
  const efficiency = stats.actual > 0 ? ((stats.actual / (stats.actual + stats.undertime)) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 rounded-3xl border border-zinc-700/50 p-8 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  LEAVE ANALYZER
                </h1>
                <p className="text-zinc-400 text-lg max-w-2xl">Advanced employee attendance and leave management system with comprehensive analytics and insights</p>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Award size={16} />
                    <span>Enterprise Analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} />
                    <span>Real-time Insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>Team Management</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <label className="cursor-pointer group">
                  <input 
                    type="file" 
                    onChange={handleUpload} 
                    accept=".xlsx,.xls,.csv"
                    className="hidden" 
                  />
                  <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-medium transition-all duration-300 shadow-lg shadow-blue-600/25 group-hover:shadow-xl group-hover:shadow-blue-600/30 transform group-hover:scale-105">
                    <Upload size={20} />
                    <span>Upload Excel File</span>
                  </div>
                </label>
                <div className="text-xs text-zinc-500 text-center">
                  Supports .xlsx, .xls, .csv formats
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid - Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            title="Expected Hours" 
            value={`${stats.expected.toFixed(1)}h`}
            subtitle={`${data.length} working days`}
            icon={<Clock size={24} />} 
            color="blue"
            trend={2.5}
          />
          <Card 
            title="Worked Hours" 
            value={`${stats.actual.toFixed(1)}h`}
            subtitle={`${((stats.actual / Math.max(stats.expected, 1)) * 100).toFixed(1)}% of expected`}
            icon={<CheckCircle size={24} />} 
            color="green"
            trend={stats.actual > stats.expected ? 5.2 : -1.8}
          />
          <Card 
            title="Attendance Rate" 
            value={`${attendanceRate}%`}
            subtitle={`${data.length - stats.leaves} present days`}
            icon={<Users size={24} />} 
            color="purple"
            trend={parseFloat(attendanceRate) > 90 ? 3.2 : -2.1}
          />
          <Card 
            title="Total Leaves" 
            value={stats.leaves.toString()}
            subtitle={`${stats.leaves > 2 ? 'Above limit' : 'Within limit'}`}
            icon={<AlertTriangle size={24} />} 
            color={stats.leaves > 2 ? "red" : "yellow"}
            trend={stats.leaves > 2 ? -5.0 : 1.2}
          />
        </div>

        {/* Enhanced Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card 
            title="Overtime Records" 
            value={stats.overtime.toString()}
            subtitle={`${stats.overtime > 0 ? 'Excellent performance' : 'On schedule'}`}
            icon={<TrendingUp size={20} />} 
            color="purple"
          />
          <Card 
            title="Undertime Records" 
            value={stats.undertime.toString()}
            subtitle={`${stats.undertime > 0 ? 'Needs attention' : 'Perfect timing'}`}
            icon={<TrendingDown size={20} />} 
            color="yellow"
          />
          <Card 
            title="Productivity" 
            value={`${productivity}%`}
            subtitle={`${parseFloat(productivity) > 100 ? 'Outstanding' : 'Good performance'}`}
            icon={<Target size={20} />} 
            color="green"
          />
          <Card 
            title="Efficiency Score" 
            value={`${efficiency}%`}
            subtitle="Time utilization"
            icon={<Activity size={20} />} 
            color="blue"
          />
        </div>

        {/* Quick Stats Bar */}
        {data.length > 0 && (
          <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 rounded-2xl border border-zinc-700/50 p-6 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-400">{data.filter(d => !d.isLeave).length}</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Present Days</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-red-400">{stats.leaves}</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Leave Days</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-400">{stats.overtime}</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Overtime</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-400">{stats.undertime}</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Undertime</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-400">{new Set(data.map(d => d['Employee Name'])).size}</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Employees</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-zinc-300">{data.length}</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Total Records</div>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <Table data={data} />
      </div>
    </div>
  );
}
