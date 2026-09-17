import { DictionaryEntry, GrammarRule } from '../types';

/**
 * Parses raw text formatted like the user's prompt:
 *
 * #1 基本語順
 * 基本語順はSOV（主語+目的語+動詞）
 *
 * #修飾
 * 修飾する語の前に置く単語,意味,ニュアンス・備考
 * sis,私。自分。,
 * kit,あなた,
 * min,彼、彼女,
 * nis,それ,
 */
export function parseRawDataText(text: string): {
  grammarRules: GrammarRule[];
  dictionary: DictionaryEntry[];
} {
  const lines = text.split(/\r?\n/);
  const grammarRules: GrammarRule[] = [];
  const dictionary: DictionaryEntry[] = [];

  let currentSectionTitle = '';
  let currentSectionContentLines: string[] = [];
  let isCsvTable = false;
  let ruleOrder = 1;

  function commitRule() {
    if (currentSectionTitle && currentSectionContentLines.length > 0) {
      grammarRules.push({
        id: `rule-${Date.now()}-${ruleOrder}`,
        title: currentSectionTitle,
        content: currentSectionContentLines.join('\n').trim(),
        order: ruleOrder++,
      });
    }
    currentSectionTitle = '';
    currentSectionContentLines = [];
    isCsvTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    // Check if line is a header like #1 基本語順 or #修飾
    if (line.startsWith('#')) {
      commitRule();
      currentSectionTitle = line;
      continue;
    }

    // Check if it's a CSV row
    if (line.includes(',')) {
      const parts = parseCsvLine(line);
      // If this is a CSV header row (e.g. "修飾する語の前に置く単語,意味,ニュアンス・備考")
      if (
        parts[0].includes('単語') ||
        parts[0].includes('語') ||
        parts[1]?.includes('意味')
      ) {
        isCsvTable = true;
        // Optionally save the column header as context for the grammar rule if available
        if (currentSectionTitle && !currentSectionContentLines.length) {
          currentSectionContentLines.push(`表: ${line}`);
        }
        continue;
      }

      if (parts.length >= 2) {
        const word = parts[0]?.trim();
        const meaning = parts[1]?.trim();
        const nuance = parts[2]?.trim() || '';

        if (word && meaning) {
          dictionary.push({
            id: `word-${word}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            word,
            meaning,
            nuance,
            category: 'modifier',
            isCustom: true,
          });
          continue;
        }
      }
    }

    // Non-csv normal rule line
    currentSectionContentLines.push(rawLine);
  }

  commitRule();

  return { grammarRules, dictionary };
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

export function exportDataAsText(
  grammarRules: GrammarRule[],
  dictionary: DictionaryEntry[]
): string {
  let output = '';

  grammarRules.forEach((rule) => {
    output += `${rule.title.startsWith('#') ? rule.title : '#' + rule.title}\n`;
    output += `${rule.content}\n\n`;
  });

  if (dictionary.length > 0) {
    output += `#語彙一覧 (辞書)\n`;
    output += `単語,意味,ニュアンス・備考,品詞\n`;
    dictionary.forEach((item) => {
      output += `"${item.word}","${item.meaning}","${item.nuance || ''}","${item.category}"\n`;
    });
  }

  return output.trim();
}
