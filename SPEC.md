# SDS リスクアセスメントツール 仕様書

## プロジェクト概要

### 目的
塗装工事における化学物質リスクアセスメント表（法令義務）の作成を自動化する。
現行のExcel+VBAマクロによる作業を、Google Apps Script（GAS）Webアプリに置き換えて効率化する。

### 背景
- 同元請業者の下で働く複数の塗装業者が、同じリスクアセスメント書類の作成に時間を取られている
- 竹林塗装工業のExcelシステムが参考モデル（VBAで材料選択→PDF印刷）
- 新規材料のSDS登録に1件20〜30分かかっている（目視での手動入力）
- 将来的にAI（Claude API）でSDS PDF解析→自動登録まで拡張予定

### フェーズ計画

| フェーズ | 対象 | 内容 |
|---|---|---|
| **Step 1（現在）** | 鈴木興業 + 竹林塗装 | MVP：材料検索 + PDF生成 |
| Step 2 | 元請ネットワーク数社 | SDS AI解析・登録、複数材料一括生成 |
| Step 3 | 業界展開 | OSS公開 or SaaS化を判断 |

---

## 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| 言語 | TypeScript | claspでローカル開発・Gitバージョン管理 |
| バックエンド | Google Apps Script | doGet / doPost |
| フロントエンド | HTML + CSS + 最小限JS | HtmlService.createTemplateFromFile |
| PDF生成 | CSS @media print + window.print() | ブラウザのPDF印刷機能を利用 |
| データベース | Google Spreadsheet | 複数シート構成 |
| ホスト | GAS Web App | Googleインフラ、費用ゼロ |
| バージョン管理 | GitHub | clasp push でGASに同期 |

### ローカル開発環境
```
npm install -g @google/clasp
clasp login
clasp push --watch
```

---

## Step 1 MVP 機能仕様

### 機能一覧

| # | 機能 | 説明 | 優先度 |
|---|---|---|---|
| 1 | 材料検索 | 材料名（部分一致）で検索、一覧表示 | Must |
| 2 | PDF生成 | 材料を選択し、実施者・日付を入力してA4・2ページを印刷/PDF保存 | Must |
| 3 | 初期データインポート | 正規化済みExcelをGoogle Spreadsheetへ一括登録 | Must |

### MVP 対象外（Step 2以降）
- SDS PDFのAI解析・自動登録
- 材料の手動追加・編集UI
- 複数材料の一括PDF生成
- ユーザー管理・会社ごとの権限管理
- 認証（ログイン機能）

---

## PDF出力仕様

### 方式
- GAS Web App が report.html をHTMLとして返す
- CSS `@page { size: A4; }` と `@media print` でA4・2ページにレイアウト
- ブラウザの「印刷 → PDFに保存」でダウンロード

### ページ構成

**表面（Page 1）**
- STEP 1: 業務の内容（材料名）
- GHS絵表示 9種（フラグがONのもののみ表示）
- STEP 2: 化学物質の名称・含有率
- STEP 3: リスクアセスメント結果
  - 特定した有害性（テキスト）
  - リスクマトリックス（重篤度×発生可能性）
  - 見積もったリスク（点数・優先度）
- STEP 4: リスク低減措置の内容
- STEP 5: 周知方法（固定文言）
- 会社名・実施者・実施日欄

**裏面（Page 2）**
- STEP 6: 保護具（皮膚・眼・呼吸・手）
- STEP 7: 応急処置（吸入・皮膚付着・眼・飲込・応急措置者の保護）
- STEP 8: 緊急対応
  - 消火剤（種別ごとの適否）
  - 消火方法
  - 漏出時措置（人体・環境・封じ込め）

### GHS画像

フラグがONのアイコンのみ表示する（バツ印付き画像・GHS_BOX列は使用しない）。
標準PNG 9種を `src/static/ghs/` に同梱。

| ファイル名 | 対応フラグ | 危険有害性 |
|---|---|---|
| flame.png | GHS_可燃 | 可燃性/引火性 |
| oxidizer.png | GHS_支燃 | 支燃性/酸化性 |
| explosion.png | GHS_爆発 | 爆発性 |
| corrosive.png | GHS_腐食 | 腐食性 |
| gas_cylinder.png | GHS_ガス | 高圧ガス |
| skull.png | GHS_毒性1 | 急性毒性（区分1〜3） |
| exclamation.png | GHS_毒性2 | 急性毒性（区分4）・刺激性 |
| environment.png | GHS_環境 | 水性環境有害性 |
| health_hazard.png | GHS_臓器 | 臓器毒性・発がん性 |

---

## データベース設計

→ 別途設計・整理予定（`data/SDS情報DB_正規化.xlsx` を再設計中）

Google Spreadsheet 上の複数シートとして構成する。
`material_id` を主キーとして各シートを紐づける。

---

## ディレクトリ構成

```
sds-ra-tool/
├── data/
│   ├── SDS情報DB_元データ.xlsx      # 元の横長Excel（変更禁止・Git除外）
│   └── SDS情報DB_正規化.xlsx        # 正規化済み（DB設計後に再生成・Git除外）
├── docs/
│   └── reference/                   # 参考PDFファイル
├── scripts/
│   └── normalize_sds_reference.py   # 正規化スクリプト（Python）
├── src/                             # GASソース（TypeScript）
│   ├── appsscript.json
│   ├── Code.ts                      # エントリーポイント（doGet/doPost）
│   ├── db.ts                        # Spreadsheet操作
│   ├── pdf.ts                       # PDF生成ロジック
│   └── templates/
│       ├── index.html               # 検索・メイン画面
│       └── report.html              # PDFテンプレート（A4・2ページ）
├── .clasp.json                      # claspプロジェクト設定（Git除外）
├── .claspignore
├── tsconfig.json
├── package.json
├── .gitignore
├── SPEC.md
└── PROGRESS.md
```
