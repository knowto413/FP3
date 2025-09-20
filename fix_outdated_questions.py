#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
from pathlib import Path

def load_validation_results():
    """検証結果を読み込み"""
    try:
        with open('question_validation_results.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"検証結果の読み込みエラー: {e}")
        return {}

def load_original_questions():
    """元の問題データを読み込み"""
    try:
        with open('parsed_questions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"問題データの読み込みエラー: {e}")
        return []

def fix_pension_amounts(question):
    """年金額を2025年度に修正"""
    fixed_question = question.copy()

    # 2025年度の正しい年金額
    correct_amounts = {
        '795,000': '831,700',
        '816,000': '831,700',
        '780,900': '831,700'
    }

    # 問題文の修正
    statement = fixed_question.get('statement', '')
    for old_amount, new_amount in correct_amounts.items():
        statement = statement.replace(old_amount, new_amount)

    # 年度表記の修正
    statement = re.sub(r'20\d{2}年度価額', '2025年度価額', statement)
    statement = re.sub(r'平成\d+年度価額', '2025年度（令和7年度）価額', statement)

    fixed_question['statement'] = statement

    # 選択肢の修正
    if 'choices' in fixed_question:
        for choice in fixed_question['choices']:
            choice_text = choice.get('text', '')
            for old_amount, new_amount in correct_amounts.items():
                choice_text = choice_text.replace(old_amount, new_amount)
            choice['text'] = choice_text

    # 解説の修正
    if 'explanation' in fixed_question:
        explanation = fixed_question['explanation']
        for old_amount, new_amount in correct_amounts.items():
            explanation = explanation.replace(old_amount, new_amount)
        explanation = re.sub(r'20\d{2}年度価額', '2025年度価額', explanation)
        fixed_question['explanation'] = explanation + "\n※2025年法令基準日対応版に修正済み"

    return fixed_question

def create_updated_questions_file():
    """修正された問題ファイルを作成"""
    validation_results = load_validation_results()
    original_questions = load_original_questions()

    if not validation_results or not original_questions:
        print("必要なファイルが見つかりません")
        return

    # 要修正問題のIDを取得
    problematic_ids = set()
    for item in validation_results.get('要修正', []):
        problematic_ids.add(item['id'])

    print(f"要修正問題: {len(problematic_ids)}問")
    print(f"問題ID: {sorted(problematic_ids)}")

    # 問題を修正・無効化
    valid_questions = []
    invalid_questions = []
    fixed_questions = []

    for question in original_questions:
        question_id = question.get('id')

        if question_id in problematic_ids:
            # 年金額問題の場合は修正を試行
            if '老齢基礎年金' in question.get('statement', '') and '年金額' in question.get('statement', ''):
                try:
                    fixed_question = fix_pension_amounts(question)
                    fixed_question['status'] = 'fixed'
                    fixed_question['fix_note'] = '2025年度年金額に修正'
                    valid_questions.append(fixed_question)
                    fixed_questions.append(fixed_question)
                    print(f"問題ID {question_id}: 年金額を2025年度に修正")
                except Exception as e:
                    question['status'] = 'invalid'
                    question['invalid_reason'] = f'修正失敗: {str(e)}'
                    invalid_questions.append(question)
                    print(f"問題ID {question_id}: 修正失敗により無効化")
            else:
                # その他の要修正問題は無効化
                question['status'] = 'invalid'
                question['invalid_reason'] = '法令改正により内容が不正確'
                invalid_questions.append(question)
                print(f"問題ID {question_id}: 法令改正により無効化")
        else:
            # 問題なしの問題はそのまま有効
            question['status'] = 'valid'
            valid_questions.append(question)

    # 結果の統計
    print(f"\n=== 修正結果 ===")
    print(f"有効な問題: {len(valid_questions)}問")
    print(f"  - 修正済み: {len(fixed_questions)}問")
    print(f"  - 元々正確: {len(valid_questions) - len(fixed_questions)}問")
    print(f"無効化された問題: {len(invalid_questions)}問")

    # 更新されたJavaScriptファイルを生成
    generate_updated_js_file(valid_questions, invalid_questions)

    # 修正レポートを保存
    save_fix_report(valid_questions, invalid_questions, fixed_questions)

def generate_updated_js_file(valid_questions, invalid_questions):
    """更新されたJavaScriptファイルを生成"""

    # 筆記と実技を分離
    written_questions = [q for q in valid_questions if q.get('type') == 'written']
    practical_questions = [q for q in valid_questions if q.get('type') == 'practical']

    js_content = f'''// FP3級過去問題データベース（2025年法令対応版）
// 最終更新: 2025年9月 - 法令改正対応済み

// 筆記試験問題（2025年法令対応）
const extractedWrittenQuestions = {json.dumps(written_questions, ensure_ascii=False, indent=2)};

// 実技試験問題（2025年法令対応）
const extractedPracticalQuestions = {json.dumps(practical_questions, ensure_ascii=False, indent=2)};

// 無効化された問題（参考用）
const invalidatedQuestions = {json.dumps(invalid_questions, ensure_ascii=False, indent=2)};

// 既存の問題と統合
const allWrittenQuestions = [...writtenQuestions, ...extractedWrittenQuestions];
const allPracticalQuestions = [...practicalQuestions, ...extractedPracticalQuestions];

// ランダム選択関数を更新（2025年法令対応版）
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

// 統計情報（2025年法令対応版）
console.log('=== FP3級問題データベース統計（2025年法令対応版）===');
console.log(`筆記問題数: ${{allWrittenQuestions.length}}`);
console.log(`実技問題数: ${{allPracticalQuestions.length}}`);
console.log(`有効問題数: ${{allWrittenQuestions.length + allPracticalQuestions.length}}`);
console.log(`無効化問題数: ${{invalidatedQuestions.length}}`);
console.log('法令基準日: 2025年4月1日');
'''

    output_path = 'js/extended_questions_2025.js'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"2025年法令対応版JavaScriptファイルを生成: {output_path}")

def save_fix_report(valid_questions, invalid_questions, fixed_questions):
    """修正レポートを保存"""
    report = {
        'summary': {
            'total_original': len(valid_questions) + len(invalid_questions),
            'valid_questions': len(valid_questions),
            'fixed_questions': len(fixed_questions),
            'invalid_questions': len(invalid_questions),
            'update_date': '2025年9月',
            'law_reference_date': '2025年4月1日'
        },
        'fixed_questions': fixed_questions,
        'invalid_questions': invalid_questions,
        'validation_notes': [
            '老齢基礎年金の満額を2025年度価額（831,700円）に修正',
            '古い年度表記を2025年度に更新',
            '修正不可能な問題は無効化処理'
        ]
    }

    with open('question_fix_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"修正レポートを保存: question_fix_report.json")

if __name__ == "__main__":
    create_updated_questions_file()