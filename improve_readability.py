#!/usr/bin/env python3
# 問題文の可読性改善スクリプト

import re
import json

def fix_garbled_characters(text):
    """文字化けを修正"""
    # 一般的な文字化けパターンを修正
    char_fixes = {
        '⼩': '小',
        '⼤': '大',
        '⼈': '人',
        '⽂': '文',
        '⽉': '月',
        '⽇': '日',
        '⽕': '火',
        '⽔': '水',
        '⽊': '木',
        '⾦': '金',
        '⼟': '土',
        '⽬': '目',
        '⼿': '手',
        '⾜': '足',
        '⾝': '身',
        '⼼': '心',
        '⼒': '力',
        '⽅': '方',
        '⽤': '用',
        '⾏': '行',
        '⾒': '見',
        '⾔': '言',
        '⼦': '子',
        '⼥': '女',
        '⽼': '老',
        '⻑': '長',
        '⾼': '高',
        '⼀': '一',
        '⼆': '二',
        '三': '三',
        '四': '四',
        '五': '五',
        '六': '六',
        '七': '七',
        '八': '八',
        '九': '九',
        '⼗': '十',
        '⼊': '入',
        '出': '出',
        '⽣': '生',
        '死': '死',
        '年': '年',
        '⾃': '自',
        '他': '他',
        '社': '社',
        '会': '会',
        '企': '企',
        '業': '業',
        '制': '制',
        '度': '度',
        '保': '保',
        '険': '険',
        '⾦': '金',
        '額': '額',
        '税': '税',
        '法': '法',
        '所': '所',
        '得': '得',
        '収': '収',
        '⼊': '入',
        '⽀': '支',
        '払': '払',
        '受': '受',
        '取': '取',
        '給': '給',
        '付': '付',
        '控': '控',
        '除': '除',
        '対': '対',
        '象': '象',
        '相': '相',
        '続': '続',
        '遺': '遺',
        '産': '産',
        '基': '基',
        '礎': '礎',
        '加': '加',
        '⼊': '入',
        '者': '者',
        '被': '被',
        '厚': '厚',
        '⽣': '生',
        '労': '労',
        '働': '働',
        '期': '期',
        '間': '間',
        '歳': '歳',
        '以': '以',
        '上': '上',
        '下': '下',
        '未': '未',
        '満': '満',
        '前': '前',
        '後': '後',
        '当': '当',
        '該': '該',
        '場': '場',
        '合': '合',
        '時': '時',
        '点': '点',
        '現': '現',
        '在': '在',
        '将': '将',
        '来': '来',
        '必': '必',
        '要': '要',
        '可': '可',
        '能': '能',
        '不': '不',
        '最': '最',
        '適': '適',
        '切': '切',
        '正': '正',
        '確': '確',
        '拠': '拠',
        '出': '出',
        '個': '個',
        '⼈': '人',
        '型': '型',
        '定': '定',
        '額': '額',
        '限': '限',
        '内': '内',
        '選': '選',
        '択': '択',
        '単': '単',
        '位': '位',
        '範': '範',
        '囲': '囲',
        '円': '円',
        '万': '万',
        '千': '千',
        '百': '百',
    }

    result = text
    for old, new in char_fixes.items():
        result = result.replace(old, new)

    return result

def improve_readability(text):
    """文章の可読性を改善"""
    # 文字化け修正
    text = fix_garbled_characters(text)

    # 長い文を適切に分割
    # 「。」で区切って改行
    text = text.replace('。', '。\n')

    # 「、」の後にスペースを追加（適度な間隔）
    text = re.sub(r'、(?!\s)', '、 ', text)

    # 括弧内の説明を改行
    text = re.sub(r'（([^）]{20,})）', r'\n（\1）\n', text)

    # 数値の範囲表記を見やすく
    text = re.sub(r'(\d+)円から(\d+)円', r'\1円〜\2円', text)

    # 「次のうち」の前で改行
    text = text.replace('次のうち', '\n次のうち')

    # 「以下の文章」の前で改行
    text = text.replace('以下の文章', '\n以下の文章')

    # 連続する改行を整理
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'^\n+', '', text)
    text = re.sub(r'\n+$', '', text)

    return text

def improve_choices(choices):
    """選択肢の可読性を改善"""
    improved = []

    for choice in choices:
        text = choice.get('text', '')

        # 文字化け修正
        text = fix_garbled_characters(text)

        # 選択肢番号の後にスペース
        text = re.sub(r'^([①②③1234]\))', r'\1 ', text)

        # 長い選択肢の場合は適切に改行
        if len(text) > 50:
            text = re.sub(r'、(?=.{20,})', '、\n　　', text)

        improved.append({
            **choice,
            'text': text
        })

    return improved

def process_file(filename):
    """ファイルの問題文を改善"""
    print(f"\n処理中: {filename}")

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 問題パターンを検索して修正
    pattern = r'"statement":\s*"([^"]+)"'

    def improve_statement(match):
        original = match.group(1)
        improved = improve_readability(original)

        # ログ出力（最初の50文字のみ）
        print(f"改善: {original[:50]}...")

        return f'"statement": "{improved}"'

    # statement改善
    new_content = re.sub(pattern, improve_statement, content)

    # choices改善のパターンマッチング
    choices_pattern = r'"choices":\s*\[([^\]]+)\]'

    def improve_choices_block(match):
        choices_text = match.group(1)

        # 各選択肢を抽出して改善
        choice_pattern = r'{\s*"id":\s*(\d+),\s*"text":\s*"([^"]+)"\s*}'

        def improve_single_choice(choice_match):
            choice_id = choice_match.group(1)
            choice_text = choice_match.group(2)

            # 選択肢テキストを改善
            improved_text = fix_garbled_characters(choice_text)
            improved_text = re.sub(r'^([①②③1234]\))', r'\1 ', improved_text)

            return f'{{\n      "id": {choice_id},\n      "text": "{improved_text}"\n    }}'

        improved_choices = re.sub(choice_pattern, improve_single_choice, choices_text)
        return f'"choices": [{improved_choices}]'

    new_content = re.sub(choices_pattern, improve_choices_block, new_content)

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

print("=== 問題文可読性改善ツール ===")

for file in files:
    try:
        process_file(file)
    except Exception as e:
        print(f"エラー {file}: {e}")

print("\n=== 改善完了 ===")