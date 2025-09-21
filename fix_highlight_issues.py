#!/usr/bin/env python3
# 問題文の不適切なハイライト表示を修正するスクリプト

import re
import json

def fix_inappropriate_highlights(text):
    """不適切なハイライト表示を修正"""

    # 年号（西暦）のハイライトを削除
    text = re.sub(r'<span class="highlight-number">(\d{4})</span>', r'\1', text)

    # 歳のハイライトで、60歳などの年齢に関するものは残すが、不適切なものを削除
    # 文脈から判断して修正
    text = re.sub(r'<span class="highlight-number">(\d+)</span>歳', r'\1歳', text)
    text = re.sub(r'(\d+)歳(?!.*から|.*以上|.*未満|.*まで)', r'\1歳', text)

    # 年のハイライトで、期間や年齢に関するもの以外を削除
    text = re.sub(r'<span class="highlight-number">(\d+)</span>年(?!.*以上|.*未満|.*間|.*から|.*まで)', r'\1年', text)

    # 金額以外の数値のハイライトを削除（ただし、金額や重要な数値は保持）
    # 単純な数字（万円、円、%以外）のハイライトを削除
    text = re.sub(r'<span class="highlight-number">(\d+)</span>(?!円|万円|%|歳|年)', r'\1', text)

    # 金額のハイライトは保持（正しいもの）
    # 重要な数値（掛金、限度額など）のハイライトは保持

    # 問題選択肢の番号のハイライトを削除
    text = re.sub(r'<span class="highlight-number">(\d+)</span>）', r'\1）', text)

    # 年数の期間表記のハイライトを削除（10年以上など）
    text = re.sub(r'<span class="highlight-number">(\d+)</span>年(?=以上|以下|未満|超)', r'\1年', text)

    # 選択肢内の数値のハイライトを削除
    text = re.sub(r'① <span class="highlight-number">(\d+)</span>', r'① \1', text)
    text = re.sub(r'② <span class="highlight-number">([^<]+)</span>', r'② \1', text)
    text = re.sub(r'③ <span class="highlight-number">([^<]+)</span>', r'③ \1', text)

    return text

def process_file(filename):
    """ファイルの不適切なハイライトを修正"""
    print(f"\n処理中: {filename}")

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 問題パターンを検索して修正
    pattern = r'"statement":\s*"([^"]+)"'

    def fix_statement(match):
        original = match.group(1)
        # HTMLエスケープ文字をデコード
        original = original.replace('\\n', '\n').replace('\\"', '"')

        fixed = fix_inappropriate_highlights(original)

        # HTMLタグを含む場合はエスケープ
        fixed = fixed.replace('"', '\\"').replace('\n', '\\n')

        print(f"修正: {original[:50]}...")

        return f'"statement": "{fixed}"'

    # statement修正
    new_content = re.sub(pattern, fix_statement, content, flags=re.DOTALL)

    # 選択肢も修正
    choice_pattern = r'"text":\s*"([^"]+)"'

    def fix_choice_text(match):
        original = match.group(1)
        fixed = fix_inappropriate_highlights(original)
        return f'"text": "{fixed}"'

    new_content = re.sub(choice_pattern, fix_choice_text, new_content)

    # ファイル保存
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"完了: {filename}")

# メイン処理
files = [
    '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions.js',
    '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions_2025.js',
    '/mnt/c/Users/81805/Desktop/開発/FP3/js/ranked_questions.js'
]

print("=== 不適切なハイライト修正ツール ===")

for file in files:
    try:
        process_file(file)
    except Exception as e:
        print(f"エラー {file}: {e}")

print("\n=== 修正完了 ===")