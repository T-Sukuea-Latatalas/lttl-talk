/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RulesSummaryBar } from './components/RulesSummaryBar';
import { ChatView } from './components/ChatView';
import { TranslatorView } from './components/TranslatorView';
import { DataManagerModal } from './components/DataManagerModal';
import { QuickAddWordModal } from './components/QuickAddWordModal';
import { ChatMessage, DictionaryEntry, GrammarRule } from './types';
import { INITIAL_DICTIONARY, INITIAL_GRAMMAR_RULES } from './data/initialData';

const LOCAL_STORAGE_RULES_KEY = 'ratatara_grammar_rules_v1';
const LOCAL_STORAGE_DICT_KEY = 'ratatara_dictionary_v1';
const LOCAL_STORAGE_CHAT_KEY = 'ratatara_chat_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'translate'>('chat');
  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick add word modal state
  const [quickAddModal, setQuickAddModal] = useState<{
    isOpen: boolean;
    word?: string;
    meaning?: string;
    role?: string;
  }>({
    isOpen: false,
  });

  // State for Grammar Rules
  const [grammarRules, setGrammarRules] = useState<GrammarRule[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_RULES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read grammar rules from localStorage', e);
    }
    return INITIAL_GRAMMAR_RULES;
  });

  // State for Dictionary
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DICT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read dictionary from localStorage', e);
    }
    return INITIAL_DICTIONARY;
  });

  // State for Chat Messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read chat history from localStorage', e);
    }
    return [];
  });

  // Persist grammar rules
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RULES_KEY, JSON.stringify(grammarRules));
    } catch (e) {
      console.error('Failed to save grammar rules', e);
    }
  }, [grammarRules]);

  // Persist dictionary
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_DICT_KEY, JSON.stringify(dictionary));
    } catch (e) {
      console.error('Failed to save dictionary', e);
    }
  }, [dictionary]);

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('Failed to save chat history', e);
    }
  }, [messages]);

  // Handle sending a message in Chat
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          newMessage: text,
          grammarRules,
          dictionary,
        }),
      });

      const json = await response.json();
      if (!response.ok || json.error) {
        throw new Error(json.error || '対話の応答生成に失敗しました');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: json.data.ratataraReply,
        timestamp: Date.now(),
        thoughtProcess: {
          thoughtInJapanese: json.data.thoughtInJapanese,
          ratataraReply: json.data.ratataraReply,
          japaneseTranslation: json.data.japaneseTranslation,
          grammarBreakdown: json.data.grammarBreakdown,
          vocabularyUsed: json.data.vocabularyUsed,
          missingWords: json.data.missingWords,
          suggestedReplies: json.data.suggestedReplies,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '対話処理中にエラーが発生しました。もう一度お試しください。',
        timestamp: Date.now(),
        thoughtProcess: {
          thoughtInJapanese: `エラー内容: ${err?.message || '通信エラー'}`,
          ratataraReply: '...',
          japaneseTranslation: '通信エラーが発生しました。',
          grammarBreakdown: 'サーバー接続を確認してください。',
          vocabularyUsed: [],
        },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    if (confirm('会話履歴を消去して最初からやり直しますか？')) {
      setMessages([]);
      localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
    }
  };

  const handleResetToDefaults = () => {
    setGrammarRules(INITIAL_GRAMMAR_RULES);
    setDictionary(INITIAL_DICTIONARY);
    localStorage.setItem(LOCAL_STORAGE_RULES_KEY, JSON.stringify(INITIAL_GRAMMAR_RULES));
    localStorage.setItem(LOCAL_STORAGE_DICT_KEY, JSON.stringify(INITIAL_DICTIONARY));
    setIsDataManagerOpen(false);
  };

  const handleAddWordFromAI = (word: string, meaning: string, role?: string) => {
    setQuickAddModal({
      isOpen: true,
      word,
      meaning,
      role,
    });
  };

  const handleAddQuickWord = (entry: DictionaryEntry) => {
    // Check if word already exists
    const exists = dictionary.some((d) => d.word.toLowerCase() === entry.word.toLowerCase());
    if (exists) {
      setDictionary((prev) =>
        prev.map((d) => (d.word.toLowerCase() === entry.word.toLowerCase() ? entry : d))
      );
    } else {
      setDictionary((prev) => [...prev, entry]);
    }
  };

  const handleSendToChatFromTranslator = (text: string) => {
    setActiveTab('chat');
    handleSendMessage(text);
  };

  return (
    <div id="ratatara-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openDataManager={() => setIsDataManagerOpen(true)}
        dictionaryCount={dictionary.length}
        grammarCount={grammarRules.length}
        onResetChat={handleResetChat}
      />

      {/* Rules and Vocabulary Quick Summary Bar */}
      <RulesSummaryBar
        grammarRules={grammarRules}
        dictionary={dictionary}
        onOpenDataManager={() => setIsDataManagerOpen(true)}
        onQuickAddWord={() =>
          setQuickAddModal({
            isOpen: true,
            word: '',
            meaning: '',
            role: 'modifier',
          })
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'chat' ? (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onAddWordFromAI={handleAddWordFromAI}
            grammarRules={grammarRules}
            dictionary={dictionary}
          />
        ) : (
          <TranslatorView
            grammarRules={grammarRules}
            dictionary={dictionary}
            onSendToChat={handleSendToChatFromTranslator}
            onAddWord={(w, m, r) => handleAddWordFromAI(w, m, r)}
          />
        )}
      </main>

      {/* Live Data & Grammar Rules Manager Modal */}
      <DataManagerModal
        isOpen={isDataManagerOpen}
        onClose={() => setIsDataManagerOpen(false)}
        grammarRules={grammarRules}
        dictionary={dictionary}
        onUpdateGrammarRules={setGrammarRules}
        onUpdateDictionary={setDictionary}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Quick Add Word Modal */}
      <QuickAddWordModal
        isOpen={quickAddModal.isOpen}
        onClose={() => setQuickAddModal({ isOpen: false })}
        initialWord={quickAddModal.word}
        initialMeaning={quickAddModal.meaning}
        initialRole={quickAddModal.role}
        onAddWord={handleAddQuickWord}
      />
    </div>
  );
}
