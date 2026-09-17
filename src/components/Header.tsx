import React from 'react';
import {
  BookOpen,
  MessageSquare,
  Languages,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'translate';
  setActiveTab: (tab: 'chat' | 'translate') => void;
  openDataManager: () => void;
  dictionaryCount: number;
  grammarCount: number;
  onResetChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openDataManager,
  dictionaryCount,
  grammarCount,
  onResetChat,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-amber-950/20">
            <span className="font-serif tracking-widest text-lg">Rt</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                ラタタラ語 AI対話
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                リアルタイム規則反映
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              日本語で思考・構想 ➔ SOV規則と最新語彙でラタタラ語に翻訳対話
            </p>
          </div>
        </div>

        {/* View Switcher & Data Manager Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="tab-chat-btn"
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>対話</span>
            </button>
            <button
              id="tab-translate-btn"
              type="button"
              onClick={() => setActiveTab('translate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'translate'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>構文・翻訳機</span>
            </button>
          </nav>

          <button
            id="open-data-manager-btn"
            type="button"
            onClick={openDataManager}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-all shadow-sm group"
            title="リアルタイム文法・辞書データの確認・更新"
          >
            <BookOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">文法・語彙辞書</span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-amber-300 font-mono">
              <span>{grammarCount}則</span>/<span>{dictionaryCount}語</span>
            </span>
          </button>

          {activeTab === 'chat' && (
            <button
              id="reset-chat-btn"
              type="button"
              onClick={onResetChat}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="会話をリセット"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
