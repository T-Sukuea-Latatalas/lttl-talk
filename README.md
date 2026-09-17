# ラタタラ語 AI対話システム (Ratatara AI System)

人工言語「ラタタラ語」の文法・語彙データをリアルタイムに反映し、日本語で思考してからSOV語順（主語+目的語+動詞）と前置修飾ルールに従ってラタタラ語へ翻訳・対話するWebアプリケーションです。

---

## 主な機能
- **リアルタイム双方向チャット**: 日本語で返答を思考し、SOV構文と語彙辞書に沿って翻訳・対話
- **構文解析＆翻訳機**: 日本語 ⇔ ラタタラ語の双方向翻訳、SOV構文マッピング
- **文法規則エディタ**: 語順や修飾ルールのリアルタイム更新
- **語彙辞書マネージャー**: 単語の追加・編集、品詞カテゴリ分類
- **未登録語の誠実な通知**: 辞書にない語は勝手に造語せず「[語なし: 概念]」と正直に表示し、ワンクリックで辞書追加可能

---

## 本番公開ガイド (Deploy Guide)

本アプリは Vite (React 19) + Express (Node.js) の構成で動作します。

### ステップ 1: GitHub リポジトリの作成
1. 本アプリ画面右上の設定メニューから **「Export to GitHub」** または **「Download ZIP」** を選択します。
2. GitHub 上で新しいリポジトリを作成し、コードをプッシュします。

### ステップ 2: Render.com（無料）での公開手順（おすすめ）
Render では Node.js アプリを無料で公開できます。

1. [Render.com](https://render.com/) にアクセスし、アカウントを作成（GitHubでサインイン）。
2. ダッシュボードから **「New +」** -> **「Web Service」** をクリック。
3. 作成した GitHub リポジトリを選択（Connect）。
4. 設定画面で以下のように入力します：
   - **Name**: `ratatara-ai`（お好みの名前）
   - **Language**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: `Free`
5. **Environment Variables（環境変数）** に以下を追加：
   - `GEMINI_API_KEY`: ご自身の Google Gemini API キー
   - `PORT`: `3000`
6. **「Create Web Service」** をクリックすると、自動的にビルドとデプロイが行われ、専用の `https://xxx.onrender.com` というURLで世界中に公開されます！

---

### ローカルでの起動方法 (Local Development)

```bash
# 依存関係のインストール
npm install

# .env に GEMINI_API_KEY を設定
echo "GEMINI_API_KEY=your_key_here" > .env

# 開発サーバー起動
npm run dev
```
ブラウザで `http://localhost:3000` を開きます。
