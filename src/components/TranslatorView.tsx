import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Layers,
  Send,
  BookOpen,
  Info,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { DictionaryEntry, GrammarRule, TranslationResult } from '../types';
import { speakRatatara } from '../utils/speech';

interface TranslatorViewProps {
  grammarRules: GrammarRule[];
  dictionary: DictionaryEntry[];
  onSendToChat: (text: string) => void;
  onAddWord: (word: string, meaning: string, role?: string) => void;
}

// Helper to render text with missing words highlighted
const renderRatataraWithMissingHighlights = (
  text: string,
  onAddWord: (word: string, meaning: string, role?: string) => void
) => {
  if (!text) return null;
  const regex = /\[(?:語なし|未登録):\s*([^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const concept = match[1].trim();
    parts.push(
      <button
        key={`missing-${match.index}`}
        type="button"
        onClick={() => onAddWord('', concept, 'verb')}
        className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg bg-rose-950/90 border border-rose-500/80 text-rose-300 font-sans text-xs font-semibold hover:bg-rose-900/90 hover:border-rose-400 transition-all cursor-pointer align-middle shadow-sm group"
        title="この概念は辞書に存在しません（クリックして辞書に単語を登録）"
      >
        <AlertTriangle className="w-3 h-3 text-rose-400 group-hover:scale-110 transition-transform" />
        <span>[語なし: {concept}]</span>
        <PlusCircle className="w-2.5 h-2.5 text-emerald-400 ml-0.5" />
      </button>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
};

export const TranslatorView: React.FC<TranslatorViewProps> = ({
  grammarRules,
  dictionary,
  onSendToChat,
  onAddWord,
}) => {
  const [sourceText, setSourceText] = useState('私はあなたを愛しています');
  const [direction, setDirection] = useState<'ja-to-ratatara' | 'ratatara-to-ja'>('ja-to-ratatara');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!sourceText.trim() || isTranslating) return;

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: sourceText.trim(),
          direction,
          grammarRules,
          dictionary,
        }),
      });

      const json = await response.json();
      if (!response.ok || json.error) {
        throw new Error(json.error || '翻訳処理に失敗しました');
      }

      setResult(json.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'エラーが発生しました');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const swapDirection = () => {
    setDirection((prev) => (prev === 'ja-to-ratatara' ? 'ratatara-to-ja' : 'ja-to-ratatara'));
    if (result) {
      setSourceText(result.translatedText);
      setResult(null);
    }
  };

  return (
    <div id="translator-view" className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Intro */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">ラタタラ語 構文翻訳機</h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/40">
              SOV構文解析エンジン
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            日本語で思考・構想した文を、基本語順（主語+目的語+動詞）と前置修飾ルールに従ってラタタラ語に翻訳・解析します。
          </p>
        </div>

        {/* Translation Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">
                {direction === 'ja-to-ratatara' ? '日本語' : 'ラタタラ語'}
              </span>
              <button
                type="button"
                onClick={swapDirection}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                title="翻訳方向を切り替え"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-amber-400">
                {direction === 'ja-to-ratatara' ? 'ラタタラ語 (SOV)' : '日本語'}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>最新辞書 {dictionary.length}語 連動</span>
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <textarea
              id="translate-input"
              rows={3}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder={
                direction === 'ja-to-ratatara'
                  ? '翻訳したい日本語文を入力（例: 私の友人はあなたを知っている）'
                  : '翻訳したいラタタラ語文を入力（例: sis kit ...）'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/70 transition-colors"
            />

            {/* Quick samples */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span className="text-[11px] text-slate-500">例文:</span>
              <button
                type="button"
                onClick={() => setSourceText('私はあなたを信じます')}
                className="hover:text-amber-300 underline underline-offset-2"
              >
                「私はあなたを信じます」
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setSourceText('彼は私のそれを見る')}
                className="hover:text-amber-300 underline underline-offset-2"
              >
                「彼は私のそれを見る」
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => setSourceText('あなたの友人は彼を歓迎する')}
                className="hover:text-amber-300 underline underline-offset-2"
              >
                「あなたの友人は彼を歓迎する」
              </button>
            </div>
          </div>

          {/* Translate Button */}
          <button
            id="do-translate-btn"
            type="button"
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isTranslating}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {isTranslating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>SOV文法照合＆翻訳中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>翻訳＆構文解析を実行</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Translation Results */}
        {result && (
          <div className="space-y-4">
            {/* Main Result Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  翻訳結果
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => speakRatatara(result.translatedText)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="ラタタラ語音声発音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.translatedText)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="コピー"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendToChat(result.translatedText)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors ml-2"
                    title="この文をチャット対話で使用する"
                  >
                    <Send className="w-3 h-3" />
                    <span>チャットで使用</span>
                  </button>
                </div>
              </div>

              {/* Output Text */}
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-900/40">
                <div className="font-mono text-lg sm:text-xl font-bold text-amber-200 tracking-wide">
                  {renderRatataraWithMissingHighlights(result.translatedText, onAddWord)}
                </div>
              </div>

              {/* Missing Word Notification Banner (Honestly reports missing words instead of coining) */}
              {result.missingWords && result.missingWords.length > 0 && (
                <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>【語彙不足通知】勝手な造語を行わず、語がないことを正直に表示しています</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    辞書に該当するラタタラ語が存在しないため、AIによる勝手な造語を控え「[語なし: 概念]」として正直に出力しています。以下の単語を辞書に登録すると、次回からその単語を使用して翻訳できます。
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {result.missingWords.map((mw, mwIdx) => (
                      <div
                        key={mwIdx}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-rose-500/30 text-rose-200"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-sm">「{mw.concept}」</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {mw.role}
                            </span>
                          </div>
                          {mw.reason && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{mw.reason}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddWord('', mw.concept, mw.role)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-600 text-emerald-200 text-xs font-medium transition-colors shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>辞書に登録</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thought Process in Japanese */}
              {result.thoughtInJapanese && (
                <div className="text-xs sm:text-sm text-slate-300 space-y-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    日本語での構想・思考プロセス:
                  </span>
                  <p className="pl-5 border-l-2 border-amber-500/40 text-slate-300 italic">
                    「{result.thoughtInJapanese}」
                  </p>
                </div>
              )}

              {/* SOV Structure visual blocks */}
              {result.sovStructure && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-400">
                    SOV語順構造マッピング:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] font-bold text-amber-400 uppercase">
                        S: 主語 (Subject)
                      </div>
                      <div className="font-mono font-medium text-slate-100 text-sm mt-1">
                        {result.sovStructure.subject || '（省略/文脈）'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase">
                        O: 目的語 (Object)
                      </div>
                      <div className="font-mono font-medium text-slate-100 text-sm mt-1">
                        {result.sovStructure.object || '（目的語なし）'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">
                        V: 動詞 (Verb)
                      </div>
                      <div className="font-mono font-medium text-slate-100 text-sm mt-1">
                        {result.sovStructure.verb || '—'}
                      </div>
                    </div>
                  </div>

                  {result.sovStructure.modifiers && result.sovStructure.modifiers.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2">
                      <span className="font-semibold text-amber-300">前置修飾要素:</span>
                      <span className="font-mono">
                        {result.sovStructure.modifiers.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              <div className="pt-2 border-t border-slate-800 text-xs sm:text-sm text-slate-300 space-y-1">
                <span className="font-semibold text-slate-400">文法適用・解説:</span>
                <p className="leading-relaxed text-slate-300">{result.explanation}</p>
              </div>

              {/* Word breakdown table */}
              {result.words && result.words.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400">単語分解:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">単語 (ラタタラ語)</th>
                          <th className="p-2.5">意味</th>
                          <th className="p-2.5">構文上の役割</th>
                          <th className="p-2.5 text-right">辞書操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {result.words.map((w, idx) => {
                          const isMissing =
                            w.isMissing ||
                            w.word.includes('語なし') ||
                            w.word.includes('未登録');
                          const exists = dictionary.some(
                            (d) => d.word.toLowerCase() === w.word.toLowerCase()
                          );
                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-slate-800/30 ${
                                isMissing ? 'bg-rose-950/20' : ''
                              }`}
                            >
                              <td className="p-2.5 font-mono font-bold">
                                {isMissing ? (
                                  <span className="inline-flex items-center gap-1.5 text-rose-300">
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                    <span>{w.word}</span>
                                  </span>
                                ) : (
                                  <span className="text-amber-300">{w.word}</span>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-200">{w.meaning}</td>
                              <td className="p-2.5 text-slate-400">
                                {isMissing ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-900/40 text-rose-300 border border-rose-800/40">
                                    語なし (未登録)
                                  </span>
                                ) : (
                                  w.role
                                )}
                              </td>
                              <td className="p-2.5 text-right">
                                {exists ? (
                                  <span className="text-emerald-400 text-[11px] font-medium">
                                    ✓ 辞書登録済
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddWord(
                                        isMissing ? '' : w.word,
                                        w.meaning,
                                        w.role
                                      )
                                    }
                                    className={`px-2 py-1 rounded text-[11px] transition-colors ${
                                      isMissing
                                        ? 'bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 font-medium'
                                        : 'bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-700 text-indigo-200'
                                    }`}
                                  >
                                    + 辞書に追加
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
