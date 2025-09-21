#!/usr/bin/env python3
import json
import re
import os

def analyze_file(file_path):
    """指定されたファイルから選択肢が2つの問題を特定する"""
    print(f"\n=== {os.path.basename(file_path)} の分析 ===")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # JavaScriptファイルから配列データを抽出
        # extractedWrittenQuestions または extractedPracticalQuestions を探す
        written_match = re.search(r'const extractedWrittenQuestions = (\[.*?\]);', content, re.DOTALL)
        practical_match = re.search(r'const extractedPracticalQuestions = (\[.*?\]);', content, re.DOTALL)

        all_questions = []

        if written_match:
            try:
                written_questions = json.loads(written_match.group(1))
                all_questions.extend(written_questions)
                print(f"筆記試験問題: {len(written_questions)}件")
            except json.JSONDecodeError as e:
                print(f"筆記試験問題のJSONパースエラー: {e}")

        if practical_match:
            try:
                practical_questions = json.loads(practical_match.group(1))
                all_questions.extend(practical_questions)
                print(f"実技試験問題: {len(practical_questions)}件")
            except json.JSONDecodeError as e:
                print(f"実技試験問題のJSONパースエラー: {e}")

        # rankedQuestions の場合
        ranked_match = re.search(r'const rankedQuestions = (\[.*?\]);', content, re.DOTALL)
        if ranked_match:
            try:
                ranked_questions = json.loads(ranked_match.group(1))
                all_questions.extend(ranked_questions)
                print(f"ランク付き問題: {len(ranked_questions)}件")
            except json.JSONDecodeError as e:
                print(f"ランク付き問題のJSONパースエラー: {e}")

        print(f"総問題数: {len(all_questions)}件")

        # 選択肢が2つの問題を特定
        two_choice_questions = []

        for question in all_questions:
            if 'choices' in question and len(question['choices']) == 2:
                # 問題文の最初の100文字を取得
                statement = question.get('statement', '')
                statement_preview = statement[:100] + ('...' if len(statement) > 100 else '')

                # 問題文に選択肢番号が含まれているかチェック
                has_choice_numbers = bool(re.search(r'[①②③④⑤12345][）\)]', statement))

                two_choice_questions.append({
                    'id': question.get('id', 'N/A'),
                    'statement': statement,
                    'statement_preview': statement_preview,
                    'choices_count': len(question['choices']),
                    'has_choice_numbers': has_choice_numbers,
                    'choices': question['choices']
                })

        print(f"\n選択肢が2つの問題: {len(two_choice_questions)}件")

        for i, q in enumerate(two_choice_questions, 1):
            print(f"\n{i}. 問題ID: {q['id']}")
            print(f"   問題文: {q['statement_preview']}")
            print(f"   選択肢数: {q['choices_count']}")
            print(f"   選択肢番号含有: {'あり' if q['has_choice_numbers'] else 'なし'}")
            print(f"   選択肢:")
            for choice in q['choices']:
                print(f"     - {choice.get('text', choice.get('content', 'N/A'))}")

        return two_choice_questions

    except FileNotFoundError:
        print(f"ファイルが見つかりません: {file_path}")
        return []
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return []

def main():
    base_path = "/mnt/c/Users/81805/Desktop/開発/FP3/js"
    files_to_analyze = [
        "extended_questions.js",
        "extended_questions_2025.js",
        "ranked_questions.js"
    ]

    all_two_choice_questions = {}

    for filename in files_to_analyze:
        file_path = os.path.join(base_path, filename)
        two_choice_questions = analyze_file(file_path)
        all_two_choice_questions[filename] = two_choice_questions

    # 総括
    print("\n" + "="*80)
    print("総括")
    print("="*80)

    total_two_choice = 0
    for filename, questions in all_two_choice_questions.items():
        count = len(questions)
        total_two_choice += count
        print(f"{filename}: {count}件の2択問題")

    print(f"\n全体での2択問題総数: {total_two_choice}件")

if __name__ == "__main__":
    main()