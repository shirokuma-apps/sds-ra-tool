"""
SDS情報DB_正規化.xlsx → Google Spreadsheet インポートスクリプト

事前準備:
  pip install gspread

初回のみ:
  Google Cloud Console で OAuth2 認証情報を作成し、
  credentials.json を scripts/ フォルダに配置する。
  https://docs.gspread.org/en/latest/oauth2.html#for-end-users-using-oauth-client-id

実行:
  python scripts/import_to_sheets.py
"""

import gspread
import pandas as pd
from pathlib import Path
import time

SPREADSHEET_ID = '1wiMXoDid6Z0RWVEHwTQd3fDnHMQ-SWqHxaxt_ytw3vA'
EXCEL_FILE     = 'data/SDS情報DB_正規化.xlsx'
CREDENTIALS    = 'scripts/credentials.json'
TOKEN_FILE     = 'scripts/token.json'

SHEET_NAMES = [
    '材料マスタ',
    '化学物質マスタ',
    '材料×化学物質',
    '有害性マスタ',
    '材料×有害性',
    'リスク低減措置',
    '保護具',
    '応急処置',
    '緊急対応_消火剤',
    '緊急対応_消火方法',
    '緊急対応_漏出時措置',
]

def clean_value(v):
    """NaN・float整数を整理"""
    if pd.isna(v):
        return ''
    if isinstance(v, float) and v == int(v):
        return int(v)
    return v

def df_to_values(df: pd.DataFrame) -> list:
    """DataFrame → gspread.update() 用の2次元リスト"""
    headers = df.columns.tolist()
    rows = [[clean_value(cell) for cell in row] for row in df.itertuples(index=False)]
    return [headers] + rows

def main():
    print("Google Sheets に接続中...")
    gc = gspread.oauth(
        credentials_filename=CREDENTIALS,
        authorized_user_filename=TOKEN_FILE,
    )
    ss = gc.open_by_key(SPREADSHEET_ID)
    print(f"接続OK: {ss.title}\n")

    existing = {ws.title: ws for ws in ss.worksheets()}

    for sheet_name in SHEET_NAMES:
        df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name)
        values = df_to_values(df)
        rows_count = len(values) - 1

        if sheet_name in existing:
            ws = existing[sheet_name]
            ws.clear()
        else:
            ws = ss.add_worksheet(
                title=sheet_name,
                rows=rows_count + 10,
                cols=len(df.columns) + 2
            )

        ws.update(values, value_input_option='RAW')
        print(f"  ✅ {sheet_name}: {rows_count}行")

        # Sheets API の書き込みレート制限を回避
        time.sleep(1)

    print("\n完了: すべてのシートをインポートしました")

if __name__ == '__main__':
    main()
