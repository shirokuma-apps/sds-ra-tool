# SDS リスクアセスメントツール

塗装工事向け化学物質リスクアセスメント表の自動生成Webアプリ。  
鈴木興業株式会社 + 竹林塗装工業の2社限定MVP（Step 1）。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| バックエンド | Google Apps Script（GAS）JavaScript |
| DB | Google Spreadsheet（11シート） |
| フロントエンド | HTML + CSS + JS（HtmlService） |
| PDF | CSS @media print + window.print() |
| ローカル開発 | clasp（rootDir: src/） |
| バージョン管理 | GitHub（master ブランチ） |

## 重要な制約

- **GASはJavaScriptのみ。** claspはTypeScriptをコンパイルせず生のまま送信するため `.ts` ファイルは使用しない。
- `src/` 配下のファイルのみ clasp push の対象（`.clasp.json` の rootDir 設定）。
- `.clasp.json` は Git 除外（scriptId を含むため）。
- `data/`、`scripts/credentials.json`、`scripts/token.json` は Git 除外。

## 主要コマンド

```bash
# GASにデプロイ
clasp push --force

# GitHub に push
git push

# 両方まとめて
clasp push --force && git push
```

## ディレクトリ構成

```
sds-ra-tool/
├── src/                        # clasp push の対象（GASソース）
│   ├── appsscript.json         # タイムゾーン・webapp設定（clasp createで上書きされるので注意）
│   ├── Code.js                 # doGet エントリーポイント
│   ├── db.js                   # Spreadsheet操作（DbService オブジェクト）
│   └── templates/
│       ├── index.html          # 検索画面
│       └── report.html         # PDFテンプレート（A4 2ページ）
├── scripts/
│   ├── normalize_sds_reference.py  # SDS正規化スクリプト（Python）
│   └── import_to_sheets.py         # Spreadsheet一括インポート（gspread）
├── docs/reference/             # 参考PDF（ネオリバー.pdf など）
├── data/                       # Git除外（元データ・正規化済みExcel）
├── SPEC.md                     # 仕様書（一部情報が古い）
├── PROGRESS.md                 # 進捗・決定事項ログ
└── CLAUDE.md                   # このファイル
```

## アーキテクチャ

### データフロー
1. ブラウザ → GAS Web App URL（`doGet`）
2. `index.html` で材料名検索 → `google.script.run.searchMaterials(query)`
3. 材料選択 + 実施者・日付入力 → `?page=report&id=X&implementor=Y&date=Z` で別ウィンドウ
4. `report.html` で `DbService.getMaterialData(id)` を呼び、全シートをJOIN
5. ブラウザの印刷機能でPDF出力

### Spreadsheet構成（ID: `1wiMXoDid6Z0RWVEHwTQd3fDnHMQ-SWqHxaxt_ytw3vA`）
`material_id` をFKとして全シートを紐づける。

| シート名 | 内容 |
|---|---|
| 材料マスタ | 材料一覧（material_id, 材料名, 頭文字, GHSフラグ9列） |
| 化学物質マスタ | ユニーク化学物質（483件） |
| 有害性マスタ | ユニーク有害性（67件） |
| 材料×化学物質 | 含有率・推定濃度（material_id + chemical_id） |
| 材料×有害性 | 有害性点数（material_id + hazard_id） |
| リスク低減措置 | |
| 保護具 | |
| 応急処置 | |
| 緊急対応_消火剤 | |
| 緊急対応_消火方法 | |
| 緊急対応_漏出時措置 | |

### GHSアイコン
Google Drive で公開済み。`uc?export=view&id=FILE_ID` 形式で `report.html` に埋め込み。  
Drive ファイルIDは `report.html` 内の `GHS_IDS` オブジェクトに定義済み。

## GAS固有の注意点

- `appsscript.json` に `"timeZone": "Asia/Tokyo"` と `"webapp"` セクションが必須。`clasp create` で上書きされたら復元すること。
- テンプレート構文: `<?= 値 ?>` （エスケープあり）、`<?!= 値 ?>` （エスケープなし・HTML/JSON埋め込み用）
- スクリプトプロパティ `SPREADSHEET_ID` にSpreadsheet IDを設定済み（GASエディタ > プロジェクトの設定）
- Web App は「デプロイを管理」から再デプロイしないとコード変更が反映されない（URLは固定）

## 残タスク（Step 1）

- [ ] GHSアイコン画像の確認・差し替え（必要に応じて）
- [ ] 竹林さんへのURL共有・フィードバック

## Step 2 以降（未着手）

- SDS PDF → AI（Gemini or Claude API）解析 → Spreadsheet自動登録
- 複数材料の一括PDF生成
- 認証・ユーザー管理
