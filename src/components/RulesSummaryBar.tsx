import React from 'react';
import { Sparkles, Plus, Edit3, ArrowRight } from 'lucide-react';
import { DictionaryEntry, GrammarRule } from '../types';

interface RulesSummaryBarProps {
  grammarRules: GrammarRule[];
  dictionary: DictionaryEntry[];
  onOpenDataManager: () => void;
  onQuickAddWord: () => void;
}

export const RulesSummaryBar: React.FC<RulesSummaryBarProps> = ({
  grammarRules,
  dictionary,
  onOpenDataManager,
  onQuickAddWord,
}) => {
  return (
    <div
      id="rules-summary-bar"
      className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2.5 text-xs text-slate-300"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-medium text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold tracking-wide">適用中の文法規則:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {grammarRules.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200"
                title={rule.notes || rule.content}
              >
                <span className="font-medium text-amber-300 mr-1">{rule.title}:</span>
                <span className="truncate max-w-[200px]">{rule.content}</span>
              </span>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-1 text-slate-400 pl-2 border-l border-slate-800">
            <span className="text-slate-400">主要語彙:</span>
            <div className="flex items-center gap-1">
              {dictionary.slice(0, 6).map((item) => (
                <span
                  key={item.id}
                  className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-750 font-mono text-[11px] text-indigo-300"
                  title={`${item.meaning} (${item.nuance || ''})`}
                >
                  {item.word} <span className="text-slate-400 font-sans">({item.meaning.slice(0, 4)})</span>
                </span>
              ))}
              {dictionary.length > 6 && (
                <span className="text-slate-500 text-[10px]">+{dictionary.length - 6}語</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onQuickAddWord}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-700/50 text-indigo-200 hover:text-white transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>単語追加</span>
          </button>
          <button
            type="button"
            onClick={onOpenDataManager}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>データ管理</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
