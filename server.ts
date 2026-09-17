import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function extractFriendlyErrorMessage(err: any): string {
  const raw = String(err?.message || err || "");
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.code === 429 || parsed.error?.status === "RESOURCE_EXHAUSTED") {
        return "API利用枠の制限（1分間あたりの回数上限）に達しました。約30秒ほど待ってから再度送信してください。";
      }
      if (parsed.error?.code === 503 || parsed.error?.status === "UNAVAILABLE") {
        return "AIモデルが一時的な混雑状態です。数秒後に再度お試しください。";
      }
    }
  } catch (_) {
    // Ignore JSON parsing errors
  }

  if (raw.includes("429") || raw.includes("Quota exceeded") || raw.includes("RESOURCE_EXHAUSTED")) {
    return "API利用制限（短時間でのリクエスト集中）に達しました。少し待ってから再度送信してください。";
  }
  if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
    return "AIモデルが一時的な混雑状態です。数秒後に再度お試しください。";
  }

  return "対話の処理中にエラーが発生しました。もう一度お試しください。";
}

async function generateWithRetry(params: any, retries = 3, delayMs = 1200) {
  const ai = getAi();
  const candidateModels = [params.model || "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  for (let attempt = 0; attempt < candidateModels.length; attempt++) {
    const currentModel = candidateModels[attempt];
    try {
      return await ai.models.generateContent({
        ...params,
        model: currentModel,
      });
    } catch (err: any) {
      console.warn(`Model ${currentModel} attempt failed:`, err?.message || err);
      const isTransient =
        err?.status === 503 ||
        String(err?.message || "").includes("503") ||
        String(err?.message || "").includes("high demand") ||
        String(err?.message || "").includes("UNAVAILABLE");

      if (isTransient && attempt < candidateModels.length - 1) {
        console.warn(`Switching to backup model for next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (attempt === candidateModels.length - 1) {
        throw err;
      }
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Chat API
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages = [],
        newMessage,
        grammarRules = [],
        dictionary = [],
      } = req.body;

      if (!newMessage || typeof newMessage !== "string") {
        return res.status(400).json({ error: "newMessage is required" });
      }

      const ai = getAi();

      // Format grammar rules and dictionary into prompt context
      const grammarContext = grammarRules
        .map((r: { title: string; content: string }) => `【${r.title}】: ${r.content}`)
        .join("\n");

      const dictionaryContext = dictionary
        .map(
          (w: { word: string; meaning: string; nuance?: string; category?: string }) =>
            `- 単語: "${w.word}" | 意味: "${w.meaning}" | 備考/ニュアンス: "${w.nuance || "-"}" | 品詞: "${w.category || "-"}"`
        )
        .join("\n");

      const conversationHistory = messages
        .slice(-10)
        .map(
          (m: { role: string; content: string; thoughtProcess?: { ratataraTranslation?: string; japaneseReply?: string } }) => {
            if (m.role === "user") {
              return `ユーザー: ${m.content}`;
            } else {
              return `AI (ラタタラ語): ${m.thoughtProcess?.ratataraTranslation || m.content} (日本語思考: ${m.thoughtProcess?.japaneseReply || ""})`;
            }
          }
        )
        .join("\n");

      const systemInstruction = `あなたは人工言語「ラタタラ語」の厳格なネイティブスピーカー兼言語学者AIです。
ユーザーとラタタラ語または日本語で対話します。

【最重要・厳格な指示：勝手な造語の禁止と未登録語の正直な開示】
1. まず、ユーザーの入力に対して「日本語で返答を思考」します。
2. 次に、リアルタイムで提供されている以下のラタタラ語データ（文法規則・基本語順・語彙辞書）に基づいて翻訳・構文構築を行います。
3. 基本語順はSOV（主語 + 目的語 + 動詞）です。
4. 修飾規則：修飾する語の直前に対象語を修飾する語を置きます（前置修飾。例: sis=私, kit=あなた, min=彼/彼女, nis=それ などの代名詞や修飾語は修飾対象の直前に置く）。
5. ★【絶対遵守】ない単語が必要になった場合は、勝手に語を作らず、語がないことを正直に表示してください。
   - 辞書に載っていない単語や概念を勝手に造語・命名することは固く禁じられています。
   - 必要な概念が辞書に存在しない場合は、ラタタラ語文中において「[語なし: 該当概念]」（例: "sis kit [語なし: 愛する]"、"sis [語なし: 友人] [語なし: 見る]"）のように正直に表記してください。
   - 思考プロセス（thoughtInJapanese）や文法解説でも、「『○○』を表すラタタラ語が辞書に存在しないため、勝手に造語せず語なし（未登録）であることを正直に示しました」と明記してください。
   - missingWords 配列に、辞書に存在しなかった語の情報を記載してください。
6. 返答は必ず指定されたJSONフォーマットのみで出力してください。

【現在のリアルタイム文法規則】
${grammarContext || "基本語順: SOV (主語+目的語+動詞)\n修飾: 修飾する語の前に置く"}

【現在のリアルタイム語彙辞書（登録されている単語のみ使用可能）】
${dictionaryContext || "sis: 私\nkit: あなた\nmin: 彼、彼女\nnis: それ"}
`;

      const prompt = `【これまでの会話履歴】
${conversationHistory || "(開始)"}

【ユーザーからの最新メッセージ】
${newMessage}

上記に基づき、まずは日本語で返答を思考してください。辞書にない単語が必要な場合は勝手に語を作らず、語がないことを正直に明記・表示してJSONで出力してください。`;

      const response = await generateWithRetry({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thoughtInJapanese: {
                type: Type.STRING,
                description: "日本語で熟考した返答内容の思考プロセス（語がない場合の判断も明記）",
              },
              ratataraReply: {
                type: Type.STRING,
                description: "ラタタラ語返答文。辞書にない単語は勝手に作らず [語なし: 意味] と正直に表記する",
              },
              japaneseTranslation: {
                type: Type.STRING,
                description: "ラタタラ語文の日本語対訳・直訳",
              },
              grammarBreakdown: {
                type: Type.STRING,
                description: "SOV語順や修飾ルールの解説、および辞書にない単語があった場合はその旨の正直な解説",
              },
              vocabularyUsed: {
                type: Type.ARRAY,
                description: "文中で使用された語彙リスト（辞書にある語、および語なしプレースホルダー）",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    role: { type: Type.STRING, description: "主語(S)/目的語(O)/動詞(V)/修飾語(M)/未登録語 など" },
                    isMissing: { type: Type.BOOLEAN, description: "辞書に該当する語がなく勝手な造語を控えた語かどうか" },
                  },
                  required: ["word", "meaning", "role"],
                },
              },
              missingWords: {
                type: Type.ARRAY,
                description: "文の表現に必要だったが現在の辞書に存在せず、勝手に作らず正直に報告した単語リスト",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING, description: "必要だった概念・意味（例: 見る、話す、本）" },
                    role: { type: Type.STRING, description: "構文上の役割（動詞(V)、目的語(O)など）" },
                    reason: { type: Type.STRING, description: "辞書に存在しない旨の正直な説明" },
                  },
                  required: ["concept", "role", "reason"],
                },
              },
              suggestedReplies: {
                type: Type.ARRAY,
                description: "ユーザーが次に使える会話候補（2〜3件）",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ratatara: { type: Type.STRING },
                    japanese: { type: Type.STRING },
                  },
                  required: ["ratatara", "japanese"],
                },
              },
            },
            required: [
              "thoughtInJapanese",
              "ratataraReply",
              "japaneseTranslation",
              "grammarBreakdown",
              "vocabularyUsed",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Chat error:", err);
      res.status(500).json({
        error: extractFriendlyErrorMessage(err),
      });
    }
  });

  // Translation / Parsing API
  app.post("/api/translate", async (req, res) => {
    try {
      const {
        sourceText,
        direction = "ja-to-ratatara", // 'ja-to-ratatara' | 'ratatara-to-ja'
        grammarRules = [],
        dictionary = [],
      } = req.body;

      if (!sourceText || typeof sourceText !== "string") {
        return res.status(400).json({ error: "sourceText is required" });
      }

      const ai = getAi();

      const grammarContext = grammarRules
        .map((r: { title: string; content: string }) => `【${r.title}】: ${r.content}`)
        .join("\n");

      const dictionaryContext = dictionary
        .map(
          (w: { word: string; meaning: string; nuance?: string; category?: string }) =>
            `- "${w.word}": ${w.meaning} (${w.nuance || ""}) [${w.category || ""}]`
        )
        .join("\n");

      const systemInstruction = `あなたは人工言語「ラタタラ語」の厳格な専門翻訳・構文解析AIです。
最新の文法規則と登録された語彙辞書データに極めて忠実に基づいて翻訳と構文解析を行います。

【基本原則】
- 基本語順: SOV（主語+目的語+動詞）
- 修飾語: 修飾する語の前に置く（例: sis=私, kit=あなた, min=彼/彼女, nis=それ）
- 日本語からラタタラ語への翻訳の際は、まず文意を明確にし、SOV構造に再構成してからラタタラ語へ写像します。

【★最重要・絶対遵守規則：勝手な造語の禁止と未登録語の正直な開示】
- ない単語が必要になった場合は、勝手に語を作らず、語がないことを正直に表示してください。
- 辞書に存在しない単語・概念を勝手に造語・命名することは厳禁です。
- 該当する語が辞書に存在しない場合は、ラタタラ語文中において「[語なし: 該当概念]」（例: "sis kit [語なし: 愛する]"）のように正直に表記してください。
- 思考プロセス（thoughtInJapanese）や解説（explanation）でも、「『○○』に該当するラタタラ語が辞書に存在しないため、勝手に造語せず語なしとして明示しました」と正直に記述してください。
- missingWords 配列に、辞書になく勝手な造語を控えたすべての概念・語を記載してください。

【現在の文法規則】
${grammarContext}

【現在の登録語彙辞書（使用可能な語）】
${dictionaryContext}
`;

      const prompt = `翻訳方向: ${
        direction === "ja-to-ratatara" ? "日本語 → ラタタラ語" : "ラタタラ語 → 日本語"
      }
対象テキスト:
${sourceText}

ない単語が必要になった場合は勝手に語を作らず、語がないことを正直に明記・表示してJSONフォーマットで出力してください。`;

      const response = await generateWithRetry({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translatedText: {
                type: Type.STRING,
                description: "翻訳結果。辞書にない単語は勝手に作らず [語なし: 意味] と正直に表記する",
              },
              thoughtInJapanese: {
                type: Type.STRING,
                description: "思考プロセス・構文の組み立て思考（語がない場合の判断も含む）",
              },
              sovStructure: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING, description: "主語 (S)" },
                  object: { type: Type.STRING, description: "目的語 (O)" },
                  verb: { type: Type.STRING, description: "動詞 (V)" },
                  modifiers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "修飾語・前置された単語 (M)",
                  },
                },
              },
              explanation: {
                type: Type.STRING,
                description: "文法や構文の解説、辞書に存在しない単語があった場合の正直な報告",
              },
              words: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    role: { type: Type.STRING },
                    isMissing: { type: Type.BOOLEAN, description: "辞書にないため勝手な造語をせず語なしとした単語かどうか" },
                  },
                  required: ["word", "meaning", "role"],
                },
              },
              missingWords: {
                type: Type.ARRAY,
                description: "現在の辞書に存在しなかったため、勝手に作らず正直に報告した単語リスト",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concept: { type: Type.STRING, description: "必要だった概念・意味（例: 見る、信じる、愛する）" },
                    role: { type: Type.STRING, description: "文法上の役割（動詞(V)など）" },
                    reason: { type: Type.STRING, description: "語が存在しないことの正直な説明" },
                  },
                  required: ["concept", "role", "reason"],
                },
              },
            },
            required: ["translatedText", "thoughtInJapanese", "explanation", "words"],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("Translate error:", err);
      res.status(500).json({
        error: extractFriendlyErrorMessage(err),
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
