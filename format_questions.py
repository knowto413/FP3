#!/usr/bin/env python3
# 問題文の特殊表示を改善するスクリプト

import re
import json

def format_question_text(text):
    """問題文を構造化して表示を改善"""

    # 【条件】などのキーワードを強調表示用に変換
    condition_pattern = r'【([^】]+)】'
    text = re.sub(condition_pattern, r'<div class="condition-highlight">【\1】</div>', text)

    # 箇条書きの検出と変換
    # ・で始まる行を箇条書きとして変換
    bullet_lines = []
    lines = text.split('\n')
    formatted_lines = []
    in_bullet_list = False

    for line in lines:
        line = line.strip()
        if line.startswith('・') or line.startswith('●') or line.startswith('－'):
            if not in_bullet_list:
                if formatted_lines and formatted_lines[-1].strip():
                    formatted_lines.append('')
                formatted_lines.append('<div class="bullet-list">')
                in_bullet_list = True

            # 箇条書き項目を変換
            item_text = re.sub(r'^[・●－]\s*', '', line)
            formatted_lines.append(f'<div class="bullet-item">{item_text}</div>')

        elif line.startswith(('1.', '2.', '3.', '4.', '5.', '①', '②', '③', '④', '⑤')):
            if not in_bullet_list:
                if formatted_lines and formatted_lines[-1].strip():
                    formatted_lines.append('')
                formatted_lines.append('<div class="bullet-list">')
                in_bullet_list = True

            formatted_lines.append(f'<div class="bullet-item">{line}</div>')

        else:
            if in_bullet_list:
                formatted_lines.append('</div>')
                in_bullet_list = False
                if line:
                    formatted_lines.append('')

            if line:
                formatted_lines.append(line)

    if in_bullet_list:
        formatted_lines.append('</div>')

    text = '\n'.join(formatted_lines)

    # 数値（金額、年数、パーセント）を強調
    # 金額パターン
    text = re.sub(r'(\d{1,3}(?:,\d{3})*)\s*円', r'<span class="highlight-number">\1円</span>', text)
    text = re.sub(r'(\d+)\s*万円', r'<span class="highlight-number">\1万円</span>', text)

    # パーセントパターン
    text = re.sub(r'(\d+(?:\.\d+)?)\s*%', r'<span class="highlight-number">\1%</span>', text)

    # 年数パターン
    text = re.sub(r'(\d+)\s*年', r'<span class="highlight-number">\1年</span>', text)
    text = re.sub(r'(\d+)\s*歳', r'<span class="highlight-number">\1歳</span>', text)

    # データ項目をテーブル風に整理（コロンで区切られた項目）
    data_pattern = r'^([^：\n]+)：([^：\n]+)$'
    lines = text.split('\n')
    formatted_lines = []
    in_data_table = False

    for line in lines:
        line = line.strip()
        if re.match(data_pattern, line):
            if not in_data_table:
                if formatted_lines and formatted_lines[-1].strip():
                    formatted_lines.append('')
                formatted_lines.append('<div class="data-table">')
                in_data_table = True

            match = re.match(data_pattern, line)
            if match:
                label = match.group(1).strip()
                value = match.group(2).strip()
                formatted_lines.append(f'<div class="data-row"><div class="data-label">{label}</div><div class="data-value">{value}</div></div>')
        else:
            if in_data_table:
                formatted_lines.append('</div>')
                in_data_table = False
                if line:
                    formatted_lines.append('')

            if line:
                formatted_lines.append(line)

    if in_data_table:
        formatted_lines.append('</div>')

    return '\n'.join(formatted_lines)

def process_file(filename):
    """ファイルの問題文を構造化"""
    print(f"\n処理中: {filename}")

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 問題パターンを検索して修正
    pattern = r'"statement":\s*"([^"]+)"'

    def improve_statement(match):
        original = match.group(1)
        # HTMLエスケープ文字をデコード
        original = original.replace('\\n', '\n').replace('\\"', '"')

        improved = format_question_text(original)

        # HTMLタグを含む場合はエスケープ
        improved = improved.replace('"', '\\"').replace('\n', '\\n')

        print(f"構造化: {original[:50]}...")

        return f'"statement": "{improved}"'

    # statement改善
    new_content = re.sub(pattern, improve_statement, content, flags=re.DOTALL)

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

print("=== 問題文構造化ツール ===")

for file in files:
    try:
        process_file(file)
    except Exception as e:
        print(f"エラー {file}: {e}")

print("\n=== 構造化完了 ===")