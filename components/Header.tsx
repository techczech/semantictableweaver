import React from 'react';
import { Database, Wand2 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              TabWeaver
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">Create and explore semantic tables</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full border border-indigo-400/20">
               <Wand2 className="w-3 h-3" />
               <span>Powered by Gemini 2.5</span>
            </div>
        </div>
      </div>
    </header>
  );
};
