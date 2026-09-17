import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { DictionaryEntry } from '../types';

interface QuickAddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
  initialMeaning?: string;
  initialRole?: string;
  onAddWord: (entry: DictionaryEntry) => void;
}

export const QuickAddWordModal: React.FC<QuickAddWordModalProps> = ({
  isOpen,
  onClose,
  initialWord = '',
  initialMeaning = '',
  initialRole = 'modifier',
  onAddWord,
}) => {
  const [word, setWord] = useState(initialWord);
  const [meaning, setMeaning] = useState(initialMeaning);
  const [nuance, setNuance] = useState('');
  const [category, setCategory] = useState<DictionaryEntry['category']>('modifier');

  useEffect(() => {
    if (isOpen) {
      setWord(initialWord);
      setMeaning(initialMeaning);
      setNuance('');
      if (initialRole.includes('動詞') || initialRole.includes('V')) {
        setCategory('verb');
      } else if (initialRole.includes('名詞') || initialRole.includes('S') || initialRole.includes('O')) {
        setCategory('noun');
      } else if (initialRole.includes('修飾') || initialRole.includes('M')) {
        setCategory('modifier');
      } else {
        setCategory('modifier');
      }
    }
  }, [isOpen, initialWord, initialMeaning, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) return;

    onAddWord({
      id: `word-${Date.now()}`,
      word: word.trim().toLowerCase(),
      meaning: meaning.trim(),
      nuance: nuance.trim(),
      category,
      isCustom: true,
    });

    onClose();
  };

  return (
    <div
      id="quick-add-word-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">語彙辞書に登録</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              単語 (ラタタラ語) *
            </label>
            <input
              type="text"
              required
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="例: suka, rat, bano..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">意味 (日本語) *</label>
            <input
              type="text"
              required
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="例: 好き、見る、友人..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">品詞・役割</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="modifier">修飾語 / 代名詞 (modifier)</option>
              <option value="verb">動詞 (verb)</option>
              <option value="noun">名詞 (noun)</option>
              <option value="adjective">形容詞 (adjective)</option>
              <option value="particle">助詞 (particle)</option>
              <option value="other">その他</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">ニュアンス・用法</label>
            <input
              type="text"
              value={nuance}
              onChange={(e) => setNuance(e.target.value)}
              placeholder="例: 修飾する語の前に置く、親しい間柄で用いる"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>登録して即時反映</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
