#!/usr/bin/env python3
import re
import os

def analyze_ranked_questions():
    """ranked_questions.jsから2択問題を特定する"""
    file_path = 'js/ranked_questions.js'
    print(f'=== {os.path.basename(file_path)} の分析 ===')

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 問題ブロックを抽出（{から}まで）
        question_pattern = r'\{\s*"id":\s*(\d+),.*?"choices":\s*\[(.*?)\],.*?"answerId":\s*\d+.*?\}'
        matches = re.findall(question_pattern, content, re.DOTALL)

        print(f'見つかった問題ブロック数: {len(matches)}')

        two_choice_questions = []

        for match in matches:
            question_id = match[0]
            choices_content = match[1]

            # 選択肢の数を数える（"id": で始まるパターンを探す）
            choice_count = len(re.findall(r'"id":\s*\d+', choices_content))

            if choice_count == 2:
                # 問題文を抽出
                statement_match = re.search(r'"statement":\s*"([^"]*)"', content[content.find(f'"id": {question_id}'):])
                statement = statement_match.group(1) if statement_match else "問題文が見つかりません"
                statement_preview = statement[:100] + ('...' if len(statement) > 100 else '')

                # 選択肢番号が含まれているかチェック
                has_choice_numbers = bool(re.search(r'[①②③④⑤12345][）\)]', statement))

                # 選択肢のテキストを抽出
                choice_texts = re.findall(r'"text":\s*"([^"]*)"', choices_content)

                two_choice_questions.append({
                    'id': question_id,
                    'statement': statement,
                    'statement_preview': statement_preview,
                    'choices_count': choice_count,
                    'has_choice_numbers': has_choice_numbers,
                    'choices': choice_texts
                })

        print(f'選択肢が2つの問題: {len(two_choice_questions)}件')

        for i, q in enumerate(two_choice_questions, 1):
            print(f'\n{i}. 問題ID: {q["id"]}')
            print(f'   問題文: {q["statement_preview"]}')
            print(f'   選択肢数: {q["choices_count"]}')
            print(f'   選択肢番号含有: {"あり" if q["has_choice_numbers"] else "なし"}')
            print(f'   選択肢:')
            for j, choice in enumerate(q['choices'], 1):
                print(f'     {j}. {choice[:80]}{"..." if len(choice) > 80 else ""}')

        return two_choice_questions

    except Exception as e:
        print(f'エラーが発生しました: {e}')
        return []

if __name__ == "__main__":
    analyze_ranked_questions()