import React, { useState, useCallback } from 'react';
import { Upload, FileText, Type, AlertCircle, Wand2, FileJson, Clock, Trash2, ArrowRight, Database } from 'lucide-react';
import { SemanticData, SavedTable } from '../types';
import { validateTableData } from '../services/tableData';

interface InputSectionProps {
  onProcess: (content: string, type: 'text' | 'image', mimeType?: string) => void;
  onImport: (data: SemanticData) => void;
  savedTables: SavedTable[];
  onLoadSaved: (table: SavedTable) => void;
  onDeleteSaved: (id: string) => void;
  isProcessing: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ 
  onProcess, 
  onImport,
  savedTables,
  onLoadSaved,
  onDeleteSaved,
  isProcessing 
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    
    if (file.name.endsWith('.json') || file.type === 'application/json') {
        // Handle JSON Import
        reader.onload = (event) => {
            try {
                if (event.target?.result) {
                    const parsed = JSON.parse(event.target.result as string);
                    if (parsed.columns && parsed.data) {
                        onImport(validateTableData(parsed));
                    } else {
                        alert("Invalid TabWeaver JSON format.");
                    }
                }
            } catch (e) {
                alert("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        return;
    }

    if (file.type.startsWith('image/')) {
      reader.onload = (event) => {
        if (event.target?.result) {
          onProcess(event.target.result as string, 'image', file.type);
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'text/csv' || file.type === 'text/markdown' || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
      reader.onload = (event) => {
        if (event.target?.result) {
          onProcess(event.target.result as string, 'text');
        }
      };
      reader.readAsText(file);
    } else {
        alert('Unsupported file type. Please upload CSV, Markdown, JSON, or an Image.');
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onProcess(textInput, 'text');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [onProcess, onImport]);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            {/* Tabs */}
            <div className="flex border-b border-slate-800">
            <button
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === 'file' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
                <Upload className="w-4 h-4" />
                Upload File
            </button>
            <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                activeTab === 'text' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
                <Type className="w-4 h-4" />
                Paste Text
            </button>
            </div>

            {/* Content */}
            <div className="p-8">
            {activeTab === 'file' ? (
                <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                    dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileChange}
                    accept=".csv,.md,.json,image/*"
                    disabled={isProcessing}
                />
                <div className="flex flex-col items-center gap-4 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div>
                    <p className="text-lg font-medium text-white mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-slate-400">CSV, Markdown, JSON (Import), or Images</p>
                    </div>
                </div>
                </div>
            ) : (
                <div className="space-y-4">
                <textarea
                    className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Paste your CSV or Markdown table here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={isProcessing}
                />
                <div className="flex justify-end">
                    <button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                    {isProcessing ? 'Weaving...' : 'Weave Table'}
                    {!isProcessing && <Wand2 className="w-4 h-4" />}
                    </button>
                </div>
                </div>
            )}
            
            <div className="mt-6 flex items-start gap-2 text-xs text-slate-500 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-indigo-400" />
                <p>
                TabWeaver uses Gemini 2.5 to semantically analyze your input. For JSON files, no AI processing is needed - they load instantly.
                </p>
            </div>
            </div>
        </div>

        {/* Saved Tables Library */}
        {savedTables.length > 0 && (
             <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">Saved Tables</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedTables.map((table) => (
                        <div key={table.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-slate-200 truncate pr-2">{table.name}</h4>
                                <button 
                                    onClick={() => onDeleteSaved(table.id)}
                                    className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(table.timestamp)}
                                </span>
                                <span>•</span>
                                <span>{table.data.data.length} Rows</span>
                            </div>
                            <button 
                                onClick={() => onLoadSaved(table)}
                                className="w-full py-2 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                            >
                                Load Table
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>
        )}
    </div>
  );
};