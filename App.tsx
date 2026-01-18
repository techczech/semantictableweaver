import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { SmartTable } from './components/SmartTable';
import { DataVisualizer } from './components/DataVisualizer';
import { AnalysisPanel } from './components/AnalysisPanel';
import { processTableInput } from './services/geminiService';
import { SemanticData, ProcessingState, SavedTable } from './types';
import { RefreshCw, AlertTriangle, Table2, BarChart2, Save, Download, Share2 } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingState>('idle');
  const [data, setData] = useState<SemanticData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'insights'>('explorer');
  const [savedTables, setSavedTables] = useState<SavedTable[]>([]);

  // Load saved tables on mount
  useEffect(() => {
    const stored = localStorage.getItem('tabweaver_tables');
    if (stored) {
        try {
            setSavedTables(JSON.parse(stored));
        } catch (e) {
            console.error("Failed to parse saved tables", e);
        }
    }
  }, []);

  const saveTablesToStorage = (tables: SavedTable[]) => {
      localStorage.setItem('tabweaver_tables', JSON.stringify(tables));
      setSavedTables(tables);
  };

  const handleProcess = async (content: string, type: 'text' | 'image', mimeType?: string) => {
    setStatus('processing');
    setErrorMessage(null);
    try {
      const result = await processTableInput(content, type, mimeType);
      setData(result);
      setStatus('analyzed');
      setActiveTab('explorer');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    }
  };

  const handleDirectImport = (importedData: SemanticData) => {
      setData(importedData);
      setStatus('analyzed');
      setActiveTab('explorer');
  };

  const handleSaveTable = () => {
      if (!data) return;
      const name = prompt("Enter a name for this table:", data.suggestedTitle || "Untitled Table");
      if (!name) return;

      const newTable: SavedTable = {
          id: crypto.randomUUID(),
          name,
          timestamp: Date.now(),
          data
      };

      const updated = [newTable, ...savedTables];
      saveTablesToStorage(updated);
  };

  const handleDeleteTable = (id: string) => {
      if (window.confirm("Are you sure you want to delete this saved table?")) {
          const updated = savedTables.filter(t => t.id !== id);
          saveTablesToStorage(updated);
      }
  };

  const handleLoadSaved = (table: SavedTable) => {
      setData(table.data);
      setStatus('analyzed');
      setActiveTab('explorer');
  };

  const handleExportJSON = () => {
      if (!data) return;
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(data.suggestedTitle || "tabweaver_export").replace(/\s+/g, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setStatus('idle');
    setData(null);
    setErrorMessage(null);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-inter">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {status === 'idle' && (
          <>
            <div className="text-center max-w-3xl mx-auto mt-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                Create and explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">semantic tables</span>.
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Convert flat CSVs, Markdown, or Images into rich, interactive, and semantic data structures.
                Sort within cells, categorize, visualize, and save your work locally.
              </p>
            </div>
            <InputSection 
                onProcess={handleProcess} 
                onImport={handleDirectImport}
                isProcessing={false} 
                savedTables={savedTables}
                onLoadSaved={handleLoadSaved}
                onDeleteSaved={handleDeleteTable}
            />
          </>
        )}

        {status === 'processing' && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
            </div>
            <h3 className="mt-8 text-xl font-semibold text-white">Weaving your data...</h3>
            <p className="text-slate-400 mt-2">Gemini is analyzing semantic structure and text patterns.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
             <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 max-w-md text-center">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Processing Failed</h3>
                <p className="text-red-200 mb-6">{errorMessage}</p>
                <button 
                    onClick={handleReset}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                    Try Again
                </button>
             </div>
          </div>
        )}

        {status === 'analyzed' && data && (
          <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
            {/* Header Actions */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 bg-slate-950 pb-2 border-b border-slate-800/50 sticky top-16 z-40">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white truncate max-w-[200px] sm:max-w-md" title={data.suggestedTitle}>
                        {data.suggestedTitle}
                    </h2>
                    <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700">
                         <button onClick={handleSaveTable} className="p-1.5 hover:text-indigo-400 transition-colors text-slate-400" title="Save to Library">
                            <Save className="w-4 h-4" />
                         </button>
                         <button onClick={handleExportJSON} className="p-1.5 hover:text-indigo-400 transition-colors text-slate-400 border-l border-slate-700" title="Export JSON">
                            <Download className="w-4 h-4" />
                         </button>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-1 rounded-lg flex items-center border border-slate-700 shadow-sm">
                      <button
                        onClick={() => setActiveTab('explorer')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'explorer' 
                            ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <Table2 className="w-4 h-4" />
                        Explorer
                      </button>
                      <button
                        onClick={() => setActiveTab('insights')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'insights' 
                            ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                      >
                        <BarChart2 className="w-4 h-4" />
                        Insights
                      </button>
                  </div>
              </div>
              
              <button 
                onClick={handleReset}
                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg border border-slate-800"
              >
                <RefreshCw className="w-4 h-4" />
                New Analysis
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 relative">
                {activeTab === 'explorer' && (
                    <div className="absolute inset-0">
                        <SmartTable data={data} />
                    </div>
                )}

                {activeTab === 'insights' && (
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-auto animate-fade-in pb-20">
                        {/* Summary Panel */}
                        <div className="lg:col-span-1 h-fit">
                            <AnalysisPanel data={data} />
                        </div>
                        
                        {/* Visualization Panel */}
                        <div className="lg:col-span-2 min-h-[500px]">
                            <DataVisualizer data={data} />
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;