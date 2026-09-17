import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Volume2,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  PlusCircle,
  Brain,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage, DictionaryEntry, GrammarRule, ThoughtProcess } from '../types';
import { speakRatatara } from '../utils/speech';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onAddWordFromAI: (word: string, meaning: string, role?: string) => void;
  grammarRules: GrammarRule[];
  dictionary: DictionaryEntry[];
}

const STARTER_PROMPTS = [
  'こんにちは！',
  '私はあなたを見ます',
  'sis kit （私 あなた）',
  '彼はそれを持っていますか？',
];

// Helper to render Ratatara text with missing word tokens highlighted
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
        className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-lg bg-rose-950/80 border border-rose-500/80 text-rose-300 font-sans text-xs font-semibold hover:bg-rose-900/90 hover:border-rose-400 transition-all cursor-pointer align-middle shadow-sm group"
        title="この概念はラタタラ語に存在しません（クリックして辞書に単語を登録）"
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

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onAddWordFromAI,
  grammarRules,
  dictionary,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleBreakdown = (id: string) => {
    setExpandedBreakdowns((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div id="chat-view" className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-12 px-4 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-amber-950/40">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                人工言語「ラタタラ語」へようこそ
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                AIはまず<strong className="text-amber-300">「日本語で返答を思考」</strong>し、
                リアルタイムで更新される<strong className="text-indigo-300">「基本語順（SOV）」</strong>と
                <strong className="text-indigo-300">「修飾規則（前置）」</strong>および語彙辞書に忠実に基づいて
                ラタタラ語に翻訳して返答します。
              </p>
            </div>

            {/* Current Active Rules preview card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-left shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400 uppercase tracking-wider">
                <span>リアルタイム適用中の基礎ルール</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                  ACTIVE
                </span>
              </div>
              <ul className="text-xs sm:text-sm text-slate-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>基本語順:</strong> SOV（主語 S + 目的語 O + 動詞 V）
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>修飾規則:</strong> 修飾する語を被修飾語の前に置く（前置修飾）
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>
                    <strong>基本代名詞/修飾詞:</strong>{' '}
                    <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-mono">sis</code> (私),{' '}
                    <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-mono">kit</code> (あなた),{' '}
                    <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-mono">min</code> (彼/彼女),{' '}
                    <code className="bg-slate-800 text-amber-300 px-1 py-0.5 rounded font-mono">nis</code> (それ)
                  </span>
                </li>
              </ul>
            </div>

            {/* Quick Starters */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">会話のきっかけを選んで試す:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(prompt)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-600/50 text-xs text-slate-300 hover:text-white transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            const breakdownOpen = expandedBreakdowns[message.id] ?? true;

            return (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl mx-auto w-full`}
              >
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-xs font-medium text-slate-400">
                    {isUser ? 'あなた' : 'ラタタラ語 AI'}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {isUser ? (
                  /* User Bubble */
                  <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-xl text-sm sm:text-base leading-relaxed shadow-md">
                    {message.content}
                  </div>
                ) : (
                  /* Assistant Bubble */
                  <div className="w-full space-y-3">
                    {/* Step 1: Thought in Japanese */}
                    {message.thoughtProcess && (
                      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-300 space-y-1.5 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                          <Brain className="w-4 h-4 text-amber-400" />
                          <span>思考プロセス（日本語で返答を考案）</span>
                        </div>
                        <p className="text-slate-200 pl-6 italic border-l-2 border-amber-500/40">
                          「{message.thoughtProcess.thoughtInJapanese}」
                        </p>
                      </div>
                    )}

                    {/* Step 2: Ratatara Translation & Speech Output */}
                    <div className="bg-gradient-to-b from-slate-900 to-slate-900/95 border border-indigo-500/30 rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-100 shadow-md space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                            ラタタラ語返答
                          </span>
                          <span className="text-xs text-slate-400">
                            (SOV & 修飾前置適用)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              speakRatatara(
                                message.thoughtProcess?.ratataraReply || message.content
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="発音を聞く"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                message.id,
                                message.thoughtProcess?.ratataraReply || message.content
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="コピー"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Main Ratatara Sentence */}
                      <div className="font-mono text-base sm:text-lg font-semibold tracking-wide text-amber-200 leading-relaxed selection:bg-amber-500/30">
                        {renderRatataraWithMissingHighlights(
                          message.thoughtProcess?.ratataraReply || message.content,
                          onAddWordFromAI
                        )}
                      </div>

                      {/* Missing Word Notification Banner (Honestly reports missing words instead of coining) */}
                      {message.thoughtProcess?.missingWords &&
                        message.thoughtProcess.missingWords.length > 0 && (
                          <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 space-y-2 text-xs">
                            <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>【語彙不足通知】勝手な造語を行わず、未登録（語なし）として表示しています</span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              以下の概念は現在のラタタラ語辞書に登録されていません。AIは勝手な造語を控え、未登録として正直に明示しました。
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {message.thoughtProcess.missingWords.map((mw, mwIdx) => (
                                <div
                                  key={mwIdx}
                                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-rose-500/30 text-rose-200"
                                >
                                  <span className="font-semibold text-white">「{mw.concept}」</span>
                                  <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                                    {mw.role}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onAddWordFromAI('', mw.concept, mw.role)}
                                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 underline underline-offset-2 ml-1"
                                    title="この概念に対応する単語を辞書に登録"
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    <span>辞書に単語を登録</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Japanese Translation of the Ratatara response */}
                      {message.thoughtProcess?.japaneseTranslation && (
                        <p className="text-xs sm:text-sm text-slate-300 pt-1 border-t border-slate-800/60">
                          <span className="text-slate-500 mr-2">【和訳】</span>
                          {message.thoughtProcess.japaneseTranslation}
                        </p>
                      )}
                    </div>

                    {/* Step 3: Grammar breakdown & vocabulary tags */}
                    {message.thoughtProcess && (
                      <div className="bg-slate-900/60 border border-slate-800/70 rounded-xl overflow-hidden text-xs">
                        <button
                          type="button"
                          onClick={() => toggleBreakdown(message.id)}
                          className="w-full px-3.5 py-2 flex items-center justify-between text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>語順構造 (SOV)・修飾ルール解説 & 使用語彙</span>
                          </span>
                          {breakdownOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {breakdownOpen && (
                          <div className="px-3.5 py-3 border-t border-slate-800/60 space-y-3 bg-slate-950/40">
                            {/* Grammar explanation */}
                            <p className="text-slate-300 leading-relaxed">
                              {message.thoughtProcess.grammarBreakdown}
                            </p>

                            {/* Vocabulary list */}
                            {message.thoughtProcess.vocabularyUsed &&
                              message.thoughtProcess.vocabularyUsed.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                                  <span className="text-[11px] font-semibold text-slate-400">
                                    使用された語彙・構文要素:
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {message.thoughtProcess.vocabularyUsed.map((v, vIdx) => {
                                      // Check if already in dictionary or missing
                                      const isMissing =
                                        v.isMissing ||
                                        v.word.includes('語なし') ||
                                        v.word.includes('未登録');
                                      const exists = dictionary.some(
                                        (d) => d.word.toLowerCase() === v.word.toLowerCase()
                                      );

                                      return (
                                        <div
                                          key={vIdx}
                                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] ${
                                            isMissing
                                              ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                                              : exists
                                              ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                                              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                                          }`}
                                        >
                                          {isMissing && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                                          <span className="font-mono font-bold text-amber-300">
                                            {v.word}
                                          </span>
                                          <span className="text-slate-400">: {v.meaning}</span>
                                          <span className="px-1 rounded bg-slate-900 text-[10px] text-slate-400 border border-slate-800">
                                            {isMissing ? '未登録語' : v.role}
                                          </span>
                                          {!exists && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                onAddWordFromAI(
                                                  isMissing ? '' : v.word,
                                                  v.meaning,
                                                  v.role
                                                )
                                              }
                                              className="ml-1 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5"
                                              title="リアルタイム辞書にこの単語を登録"
                                            >
                                              <PlusCircle className="w-3 h-3" />
                                              <span className="text-[10px]">辞書へ</span>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Suggested reply chips */}
                    {message.thoughtProcess?.suggestedReplies &&
                      message.thoughtProcess.suggestedReplies.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-medium text-slate-500">
                            おすすめの次の発話候補:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {message.thoughtProcess.suggestedReplies.map((reply, rIdx) => (
                              <button
                                key={rIdx}
                                type="button"
                                onClick={() => onSendMessage(reply.ratatara)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all text-left"
                              >
                                <span className="font-mono text-amber-300 font-medium">
                                  {reply.ratatara}
                                </span>
                                <span className="text-slate-400">({reply.japanese})</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex flex-col items-start max-w-3xl mx-auto w-full space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
              <span>ラタタラ語 AI</span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs sm:text-sm text-slate-300 space-y-2.5 max-w-lg shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 font-medium">
                <Brain className="w-4 h-4 animate-spin" />
                <span>1. 日本語で返答を思考中...</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-400 font-medium">
                <Sparkles className="w-4 h-4" />
                <span>2. 最新文法（SOV・修飾前置）と語彙辞書をリアルタイム適用中...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></span>
                <span>3. ラタタラ語に翻訳・構文出力中...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-slate-900/90 border-t border-slate-800 p-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-amber-600/70 transition-colors shadow-inner"
        >
          <textarea
            id="chat-input-textarea"
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="日本語またはラタタラ語で入力... (Enterで送信、Shift+Enterで改行)"
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 resize-none text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-0 p-1.5 min-h-[44px]"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
          >
            <span>送信</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="max-w-3xl mx-auto text-[11px] text-slate-500 text-center mt-2">
          入力された内容に基づき、リアルタイム辞書＆文法（SOV・前置修飾）を参照して対話します
        </p>
      </div>
    </div>
  );
};
