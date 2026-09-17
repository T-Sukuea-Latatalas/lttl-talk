export interface DictionaryEntry {
  id: string;
  word: string;
  meaning: string;
  nuance?: string;
  category: 'modifier' | 'pronoun' | 'noun' | 'verb' | 'adjective' | 'particle' | 'other';
  isCustom?: boolean;
}

export interface GrammarRule {
  id: string;
  title: string;
  content: string;
  notes?: string;
  order: number;
}

export interface MissingWordInfo {
  concept: string; // 辞書に存在しなかった意味・概念（例: 「見る」「愛する」）
  role: string;    // 文法上の役割（例: 動詞(V)、目的語(O)など）
  reason?: string; // 単語が存在しないことの正直な説明
}

export interface VocabularyUsage {
  word: string;
  meaning: string;
  role: string;
  isMissing?: boolean; // 辞書になく勝手に作らず未登録とした語
}

export interface ThoughtProcess {
  thoughtInJapanese: string;
  ratataraReply: string;
  japaneseTranslation: string;
  grammarBreakdown: string;
  vocabularyUsed: VocabularyUsage[];
  missingWords?: MissingWordInfo[];
  suggestedReplies?: Array<{ ratatara: string; japanese: string }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thoughtProcess?: ThoughtProcess;
}

export interface TranslationResult {
  translatedText: string;
  thoughtInJapanese: string;
  sovStructure?: {
    subject?: string;
    object?: string;
    verb?: string;
    modifiers?: string[];
  };
  explanation: string;
  words: Array<{
    word: string;
    meaning: string;
    role: string;
    isMissing?: boolean;
  }>;
  missingWords?: MissingWordInfo[];
}
