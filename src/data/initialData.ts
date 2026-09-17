import { DictionaryEntry, GrammarRule } from '../types';

export const INITIAL_GRAMMAR_RULES: GrammarRule[] = [
  {
    id: 'rule-sov',
    title: '#1 基本語順',
    content: '基本語順はSOV（主語+目的語+動詞）',
    notes: '文を構成する際、主語(S)が先頭、次に目的語(O)、末尾に動詞(V)が配置されます。',
    order: 1,
  },
  {
    id: 'rule-modifier',
    title: '#修飾',
    content: '修飾する語の前に置く（前置修飾）',
    notes: '被修飾語（名詞や動詞など）の直前に、それを限定・修飾する語（sis, kit, min, nisなど）を配置します。',
    order: 2,
  },
];

export const INITIAL_DICTIONARY: DictionaryEntry[] = [
  {
    id: 'word-sis',
    word: 'sis',
    meaning: '私。自分。',
    nuance: '一人称代名詞。修飾語として名詞の前に置くと「私の〜」の所有表現にもなる。',
    category: 'modifier',
  },
  {
    id: 'word-kit',
    word: 'kit',
    meaning: 'あなた',
    nuance: '二人称代名詞。名詞の前に置くと「あなたの〜」となる。',
    category: 'modifier',
  },
  {
    id: 'word-min',
    word: 'min',
    meaning: '彼、彼女',
    nuance: '三人称単数代名詞（性別不問）。前置で「彼/彼女の」となる。',
    category: 'modifier',
  },
  {
    id: 'word-nis',
    word: 'nis',
    meaning: 'それ',
    nuance: '指示代名詞（事物）。前置で「その〜」となる。',
    category: 'modifier',
  },
];

export const RAW_SAMPLE_TEXT = `#1 基本語順
基本語順はSOV（主語+目的語+動詞）

#修飾
修飾する語の前に置く単語,意味,ニュアンス・備考
sis,私。自分。,
kit,あなた,
min,彼、彼女,
nis,それ,`;
