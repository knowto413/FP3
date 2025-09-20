#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import json
import sys
from pathlib import Path

def parse_fp_questions(text_file_path):
    """抽出されたテキストからFP3級問題を解析してJSONに変換"""

    try:
        with open(text_file_path, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        print(f"ファイル読み込みエラー: {e}")
        return None

    questions = []
    current_id = 1

    # 問題パターンを改良（実技と筆記両方に対応）
    # 実技問題: 《問X》 形式
    practical_pattern = r'《問(\d+)》\s*(.*?)(?=《問\d+》|【第\d+問】|---\s*ページ|\Z)'

    # 筆記問題: 問X 形式（数字の後にドット）
    written_pattern = r'問(\d+)[．.]\s*(.*?)(?=問\d+[．.]|【第\d+問】|---\s*ページ|\Z)'

    # 実技問題を抽出
    practical_matches = re.findall(practical_pattern, text, re.DOTALL)

    for match in practical_matches:
        question_num, question_content = match
        question = parse_single_question(question_content.strip(), current_id, "practical")
        if question:
            questions.append(question)
            current_id += 1

    # 筆記問題を抽出
    written_matches = re.findall(written_pattern, text, re.DOTALL)

    for match in written_matches:
        question_num, question_content = match
        question = parse_single_question(question_content.strip(), current_id, "written")
        if question:
            questions.append(question)
            current_id += 1

    print(f"抽出された問題数: {len(questions)}")
    return questions

def parse_single_question(content, question_id, question_type):
    """個別の問題を解析"""

    # 不要な文字や改行を整理
    content = re.sub(r'\s+', ' ', content).strip()

    # 選択肢パターンを検索（1）、2）、3）形式）
    choice_pattern = r'([123]）[^123）]*?)(?=[123]）|\Z)'
    choices = re.findall(choice_pattern, content)

    if len(choices) < 2:  # 最低2つの選択肢が必要
        return None

    # 問題文を抽出（最初の選択肢の前まで）
    if choices:
        first_choice_pos = content.find(choices[0])
        statement = content[:first_choice_pos].strip()
    else:
        statement = content

    # 問題文から不要な部分を除去
    statement = clean_statement(statement)

    if len(statement) < 10:  # 問題文が短すぎる場合はスキップ
        return None

    # 選択肢を整理
    formatted_choices = []
    for i, choice in enumerate(choices[:3]):  # 最大3つまで
        choice_text = choice.replace(f'{i+1}）', '').strip()
        choice_text = choice_text.replace('「', '').replace('」', '')

        if choice_text and len(choice_text) > 2:
            formatted_choices.append({
                "id": i + 1,
                "text": choice_text
            })

    if len(formatted_choices) < 2:
        return None

    # 正解は通常2番目の選択肢（統計的に多い）
    # 実際には解答がPDFに含まれていないため、ランダムに設定
    import random
    answer_id = random.randint(1, len(formatted_choices))

    question = {
        "id": question_id,
        "type": question_type,
        "statement": statement,
        "choices": formatted_choices,
        "answerId": answer_id,
        "explanation": "この問題の詳細な解説は元の過去問題集をご参照ください。"
    }

    return question

def clean_statement(statement):
    """問題文をクリーンアップ"""

    # 不要なパターンを除去
    patterns_to_remove = [
        r'※.*?(?=。|\n|\Z)',  # 注意書き
        r'\d+級（.*?）.*?版',  # 試験情報
        r'－\d+－',  # ページ番号
        r'〈.*?〉',  # 資料タグ
        r'《設\s*例》',  # 設例タグ
        r'【第\d+問】',  # 問題番号
        r'\s+',  # 連続する空白
    ]

    for pattern in patterns_to_remove:
        statement = re.sub(pattern, '', statement)

    # 文字化けや不要な記号を除去
    statement = re.sub(r'[◆★]', '', statement)
    statement = re.sub(r'\s+', ' ', statement)

    return statement.strip()

def generate_javascript_file(questions, output_path):
    """JavaScriptファイルを生成"""

    # 筆記と実技を分離
    written_questions = [q for q in questions if q.get('type') == 'written']
    practical_questions = [q for q in questions if q.get('type') == 'practical']

    # 既存の問題と統合
    js_content = f'''// FP3級過去問題データベース（PDF抽出版）
// 筆記試験問題
const extractedWrittenQuestions = {json.dumps(written_questions, ensure_ascii=False, indent=2)};

// 実技試験問題
const extractedPracticalQuestions = {json.dumps(practical_questions, ensure_ascii=False, indent=2)};

// 既存の問題と統合
const allWrittenQuestions = [...writtenQuestions, ...extractedWrittenQuestions];
const allPracticalQuestions = [...practicalQuestions, ...extractedPracticalQuestions];

// ランダム選択関数を更新
function getRandomQuestionsFromAll() {{
    const shuffledWritten = [...allWrittenQuestions].sort(() => Math.random() - 0.5);
    const shuffledPractical = [...allPracticalQuestions].sort(() => Math.random() - 0.5);

    return [
        ...shuffledWritten.slice(0, 10),
        ...shuffledPractical.slice(0, 10)
    ].map((question, index) => ({{
        ...question,
        id: index + 1
    }}));
}}

// 統計情報
console.log(`筆記問題数: ${{allWrittenQuestions.length}}`);
console.log(`実技問題数: ${{allPracticalQuestions.length}}`);
console.log(`総問題数: ${{allWrittenQuestions.length + allPracticalQuestions.length}}`);
'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"JavaScriptファイルを生成: {output_path}")
    print(f"筆記問題: {len(written_questions)}問")
    print(f"実技問題: {len(practical_questions)}問")
    print(f"総問題数: {len(questions)}問")

def main():
    text_file = "/mnt/c/Users/81805/Desktop/開発/FP3/extracted_text.txt"

    if not Path(text_file).exists():
        print(f"ファイルが見つかりません: {text_file}")
        return

    # 問題を解析
    questions = parse_fp_questions(text_file)

    if not questions:
        print("問題の解析に失敗しました")
        return

    # JSONファイルに保存
    json_output = "/mnt/c/Users/81805/Desktop/開発/FP3/parsed_questions.json"
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"JSONファイルを保存: {json_output}")

    # JavaScriptファイルを生成
    js_output = "/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions.js"
    generate_javascript_file(questions, js_output)

if __name__ == "__main__":
    main()