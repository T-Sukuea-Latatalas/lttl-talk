import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Download,
  FileText,
  Volume2,
  Search,
  Sparkles,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { DictionaryEntry, GrammarRule } from '../types';
import { exportDataAsText, parseRawDataText } from '../utils/textParser';
import { RAW_SAMPLE_TEXT } from '../data/initialData';
import { speakRatatara } from '../utils/speech';

interface DataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  grammarRules: GrammarRule[];
  dictionary: DictionaryEntry[];
  onUpdateGrammarRules: (rules: GrammarRule[]) => void;
  onUpdateDictionary: (dictionary: DictionaryEntry[]) => void;
  onResetToDefaults: () => void;
}

export const DataManagerModal: React.FC<DataManagerModalProps> = ({
  isOpen,
  onClose,
  grammarRules,
  dictionary,
  onUpdateGrammarRules,
  onUpdateDictionary,
  onResetToDefaults,
}) => {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'grammar' | 'rawText'>('dictionary');
  const [searchTerm, setSearchTerm] = useState('');

  // Add word state
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newNuance, setNewNuance] = useState('');
  const [newCategory, setNewCategory] = useState<DictionaryEntry['category']>('modifier');

  // Edit word state
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editNuance, setEditNuance] = useState('');
  const [editCategory, setEditCategory] = useState<DictionaryEntry['category']>('modifier');

  // Add/Edit grammar rule state
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleContent, setNewRuleContent] = useState('');
  const [newRuleNotes, setNewRuleNotes] = useState('');

  // Raw text import state
  const [rawText, setRawText] = useState(exportDataAsText(grammarRules, dictionary) || RAW_SAMPLE_TEXT);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  // Handle word addition
  const handleSaveNewWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;

    const entry: DictionaryEntry = {
      id: `word-${Date.now()}`,
      word: newWord.trim().toLowerCase(),
      meaning: newMeaning.trim(),
      nuance: newNuance.trim(),
      category: newCategory,
      isCustom: true,
    };

    onUpdateDictionary([...dictionary, entry]);
    setNewWord('');
    setNewMeaning('');
    setNewNuance('');
    setIsAddingWord(false);
  };

  const startEditWord = (item: DictionaryEntry) => {
    setEditingWordId(item.id);
    setEditWord(item.word);
    setEditMeaning(item.meaning);
    setEditNuance(item.nuance || '');
    setEditCategory(item.category);
  };

  const handleSaveEditWord = () => {
    if (!editWord.trim() || !editMeaning.trim() || !editingWordId) return;

    const updated = dictionary.map((item) =>
      item.id === editingWordId
        ? {
            ...item,
            word: editWord.trim().toLowerCase(),
            meaning: editMeaning.trim(),
            nuance: editNuance.trim(),
            category: editCategory,
          }
        : item
    );

    onUpdateDictionary(updated);
    setEditingWordId(null);
  };

  const handleDeleteWord = (id: string) => {
    if (confirm('この単語を辞書から削除しますか？')) {
      onUpdateDictionary(dictionary.filter((item) => item.id !== id));
    }
  };

  // Handle grammar rules
  const handleSaveNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle.trim() || !newRuleContent.trim()) return;

    const newRule: GrammarRule = {
      id: `rule-${Date.now()}`,
      title: newRuleTitle.trim(),
      content: newRuleContent.trim(),
      notes: newRuleNotes.trim(),
      order: grammarRules.length + 1,
    };

    onUpdateGrammarRules([...grammarRules, newRule]);
    setNewRuleTitle('');
    setNewRuleContent('');
    setNewRuleNotes('');
    setIsAddingRule(false);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('この文法規則を削除しますか？')) {
      onUpdateGrammarRules(grammarRules.filter((r) => r.id !== id));
    }
  };

  // Handle raw text import
  const handleApplyRawText = () => {
    try {
      const parsed = parseRawDataText(rawText);
      if (parsed.grammarRules.length === 0 && parsed.dictionary.length === 0) {
        setImportStatus('文法規則または単語データが見つかりませんでした。');
        return;
      }

      if (parsed.grammarRules.length > 0) {
        onUpdateGrammarRules(parsed.grammarRules);
      }
      if (parsed.dictionary.length > 0) {
        onUpdateDictionary(parsed.dictionary);
      }

      setImportStatus(
        `成功: 文法規則 ${parsed.grammarRules.length}件、語彙 ${parsed.dictionary.length}件をリアルタイム反映しました！`
      );
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus(`解析エラー: ${err.message}`);
    }
  };

  const handleCopyRawText = () => {
    navigator.clipboard.writeText(rawText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredDictionary = dictionary.filter(
    (item) =>
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nuance && item.nuance.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      id="data-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  リアルタイム文法・語彙辞書管理
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-mono">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ここでの変更は、AI対話および翻訳エンジンに常時リアルタイムで反映されます
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 border-b border-slate-800 bg-slate-900/60">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('dictionary')}
              className={`pb-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all ${
                activeTab === 'dictionary'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              語彙辞書 ({dictionary.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grammar')}
              className={`pb-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all ${
                activeTab === 'grammar'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              文法規則 ({grammarRules.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('rawText');
                setRawText(exportDataAsText(grammarRules, dictionary));
              }}
              className={`pb-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all ${
                activeTab === 'rawText'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              一括テキスト / CSV更新
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('初期データ（SOV語順、前置修飾、sis/kit/min/nis）にリセットしますか？')) {
                onResetToDefaults();
              }
            }}
            className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 mb-2 transition-colors"
            title="最初のプロンプト状態に復元"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">初期状態に復元</span>
          </button>
        </div>

        {/* Tab 1: Dictionary Lexicon */}
        {activeTab === 'dictionary' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="単語や意味で検索..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddingWord(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-medium transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>新しい単語を追加</span>
              </button>
            </div>

            {/* Add Word Form */}
            {isAddingWord && (
              <form
                onSubmit={handleSaveNewWord}
                className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">新しい単語の登録</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingWord(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      単語 (ラタタラ語) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      placeholder="例: suka"
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">意味 (日本語) *</label>
                    <input
                      type="text"
                      required
                      value={newMeaning}
                      onChange={(e) => setNewMeaning(e.target.value)}
                      placeholder="例: 好き、好む"
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">品詞・役割</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="modifier">修飾語 / 代名詞 (modifier)</option>
                      <option value="verb">動詞 (verb)</option>
                      <option value="noun">名詞 (noun)</option>
                      <option value="adjective">形容詞 (adjective)</option>
                      <option value="particle">助詞 (particle)</option>
                      <option value="other">その他 (other)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    ニュアンス・備考 (修飾規則や用法など)
                  </label>
                  <input
                    type="text"
                    value={newNuance}
                    onChange={(e) => setNewNuance(e.target.value)}
                    placeholder="例: 修飾する語の前に置く、肯定的な好意を表す"
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingWord(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                  >
                    保存してリアルタイム反映
                  </button>
                </div>
              </form>
            )}

            {/* Dictionary Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="p-3">単語</th>
                    <th className="p-3">意味</th>
                    <th className="p-3 hidden md:table-cell">品詞・役割</th>
                    <th className="p-3">ニュアンス・備考</th>
                    <th className="p-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDictionary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        該当する単語がありません
                      </td>
                    </tr>
                  ) : (
                    filteredDictionary.map((item) => {
                      const isEditing = editingWordId === item.id;

                      if (isEditing) {
                        return (
                          <tr key={item.id} className="bg-slate-900/80">
                            <td className="p-2">
                              <input
                                type="text"
                                value={editWord}
                                onChange={(e) => setEditWord(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-1 font-mono text-amber-300 text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editMeaning}
                                onChange={(e) => setEditMeaning(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs"
                              />
                            </td>
                            <td className="p-2 hidden md:table-cell">
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200 text-xs"
                              >
                                <option value="modifier">修飾語/代名詞</option>
                                <option value="verb">動詞</option>
                                <option value="noun">名詞</option>
                                <option value="adjective">形容詞</option>
                                <option value="particle">助詞</option>
                                <option value="other">その他</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editNuance}
                                onChange={(e) => setEditNuance(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-300 text-xs"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={handleSaveEditWord}
                                  className="p-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingWordId(null)}
                                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-amber-300 text-sm">
                                {item.word}
                              </span>
                              <button
                                type="button"
                                onClick={() => speakRatatara(item.word)}
                                className="p-1 text-slate-500 hover:text-amber-300 rounded"
                                title="発音を聞く"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-slate-200">{item.meaning}</td>
                          <td className="p-3 hidden md:table-cell">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-400">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 text-xs">
                            {item.nuance || <span className="text-slate-600">—</span>}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => startEditWord(item)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                                title="編集"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWord(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                                title="削除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Grammar Rules */}
        {activeTab === 'grammar' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                AIはこの文法規則を厳格に遵守して思考・翻訳します
              </span>
              <button
                type="button"
                onClick={() => setIsAddingRule(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>文法規則を追加</span>
              </button>
            </div>

            {/* Add Rule Form */}
            {isAddingRule && (
              <form
                onSubmit={handleSaveNewRule}
                className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">新規文法規則</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingRule(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    規則タイトル (例: #2 疑問文の語順, #時制)
                  </label>
                  <input
                    type="text"
                    required
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    placeholder="例: #疑問文"
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    規則内容 (AIが従う具体的なルール)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={newRuleContent}
                    onChange={(e) => setNewRuleContent(e.target.value)}
                    placeholder="例: 文末に助詞 ka を付けることで疑問文とする"
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">備考・解説</label>
                  <input
                    type="text"
                    value={newRuleNotes}
                    onChange={(e) => setNewRuleNotes(e.target.value)}
                    placeholder="例: イントネーションの上昇も伴う"
                    className="w-full bg-slate-900 border border-slate-750 rounded-lg p-2 text-xs text-slate-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingRule(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                  >
                    保存してリアルタイム反映
                  </button>
                </div>
              </form>
            )}

            {/* Rules List */}
            <div className="space-y-3">
              {grammarRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm">{rule.title}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                    {rule.content}
                  </p>
                  {rule.notes && (
                    <p className="text-xs text-slate-400 italic pl-1">{rule.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Raw Text & CSV Batch Sync */}
        {activeTab === 'rawText' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">
                  テキスト・CSVの一括リアルタイム同期
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyRawText}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    {copiedText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>コピー</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                下記にテキストやCSV表を直接貼り付けるだけで、文法規則と語彙辞書が解析され、即座にAI対話に反映されます。
              </p>
            </div>

            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500/80 leading-relaxed"
              placeholder={`#1 基本語順\n基本語順はSOV（主語+目的語+動詞）\n\n#修飾\n修飾する語の前に置く単語,意味,ニュアンス・備考\nsis,私。自分。,`}
            />

            {importStatus && (
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setRawText(RAW_SAMPLE_TEXT)}
                className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2"
              >
                プロンプト初期テキストをロード
              </button>

              <button
                type="button"
                onClick={handleApplyRawText}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>テキストから一括反映 (Live Sync)</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>更新内容はローカルに自動保存され、対話時に即時送信されます</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
