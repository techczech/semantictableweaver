import React from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { SemanticData } from '../types';

interface AnalysisPanelProps {
  data: SemanticData;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-semibold text-slate-200">Gemini Insight</h3>
        </div>
        
        <div className="space-y-4">
            <div>
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Dataset Title</h4>
                <p className="text-lg font-medium text-white">{data.suggestedTitle}</p>
            </div>

            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-1">Summary</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {data.summary}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-2xl font-bold text-white block">{data.data.length}</span>
                    <span className="text-xs text-slate-500">Total Rows</span>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-2xl font-bold text-white block">{data.columns.length}</span>
                    <span className="text-xs text-slate-500">Dimensions (Columns)</span>
                </div>
            </div>
        </div>
    </div>
  );
};