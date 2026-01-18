import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { SemanticData, ChartType } from '../types';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Activity, FileText } from 'lucide-react';

interface DataVisualizerProps {
  data: SemanticData;
}

const COLORS = ['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#a78bfa'];

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ data }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  
  // Heuristics to guess reasonable default axes
  const { numericCols, categoricalCols, hasNumbers } = useMemo(() => {
    if (!data.data.length) return { numericCols: [], categoricalCols: [], hasNumbers: false };
    const sample = data.data[0];
    
    const num = data.columns.filter(c => typeof sample[c.key] === 'number');
    const cat = data.columns.filter(c => typeof sample[c.key] === 'string' || Array.isArray(sample[c.key]));
    
    return { numericCols: num, categoricalCols: cat, hasNumbers: num.length > 0 };
  }, [data]);

  const [xAxisKey, setXAxisKey] = useState<string>(categoricalCols[0]?.key || data.columns[0]?.key);
  const [dataKey, setDataKey] = useState<string>(numericCols[0]?.key || '');

  if (!hasNumbers) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center h-full text-center">
             <div className="bg-slate-800 p-4 rounded-full mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-xl font-semibold text-slate-200 mb-2">Text-Heavy Dataset</h3>
             <p className="text-slate-400 max-w-md">
                This table appears to contain mostly textual semantic data. 
                The <strong>Semantic Explorer</strong> tab is better suited for analyzing and categorizing this information.
             </p>
        </div>
      );
  }

  if (data.data.length === 0) return <div className="p-10 text-center text-slate-500">No data to visualize</div>;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8' }} activeDot={{ r: 8 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
            />
            <Legend />
            <Area type="monotone" dataKey={dataKey} stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
          </AreaChart>
        );
      case 'composed': 
         return (
            <PieChart>
                <Pie
                    data={data.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey={dataKey}
                    nameKey={xAxisKey}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                    {data.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
            </PieChart>
         )
      case 'bar':
      default:
        return (
          <BarChart data={data.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey={xAxisKey} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                cursor={{fill: '#1e293b'}}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                Numeric Visualizer
            </h3>
            
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button 
                    onClick={() => setChartType('bar')}
                    className={`p-2 rounded-md transition-all ${chartType === 'bar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    title="Bar Chart"
                >
                    <BarChart3 className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setChartType('line')}
                    className={`p-2 rounded-md transition-all ${chartType === 'line' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    title="Line Chart"
                >
                    <LineIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setChartType('area')}
                    className={`p-2 rounded-md transition-all ${chartType === 'area' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    title="Area Chart"
                >
                    <Activity className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setChartType('composed')}
                    className={`p-2 rounded-md transition-all ${chartType === 'composed' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    title="Pie Chart"
                >
                    <PieIcon className="w-4 h-4" />
                </button>
            </div>
        </div>

        <div className="flex gap-4 mb-4">
            <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">X-Axis (Category)</label>
                <select 
                    value={xAxisKey} 
                    onChange={(e) => setXAxisKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    {categoricalCols.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Y-Axis (Numeric Value)</label>
                <select 
                    value={dataKey} 
                    onChange={(e) => setDataKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                     {numericCols.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
            </div>
        </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};