#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
from pathlib import Path

def load_questions():
    """問題データを読み込み"""
    try:
        with open('parsed_questions.json', 'r', encoding='utf-8') as f:
            questions = json.load(f)
        return questions
    except Exception as e:
        print(f"問題データの読み込みエラー: {e}")
        return []

def validate_question_accuracy(question):
    """問題の正確性を2025年法令基準で検証"""
    issues = []
    statement = question.get('statement', '')
    choices = question.get('choices', [])

    # 2025年最新基準
    current_standards = {
        # 年金制度
        'old_pension_amounts': {
            '816,000': '831,700',  # 2025年度老齢基礎年金
            '795,000': '831,700',
            '780,900': '831,700'
        },

        # 小規模企業共済
        'kokyo_mutual_aid': {
            'upper_limit': '70,000',  # 掛金上限（変更なし）
            'tax_treatment': '所得控除',
            'withdrawal_tax': '退職所得'
        },

        # 相続税・贈与税
        'inheritance_tax': {
            'basic_deduction': '3,000万円＋600万円×法定相続人の数',
            'gift_basic_deduction': '110万円'
        },

        # NISA制度（2024年から新NISA）
        'nisa_amounts': {
            'old_nisa_limit': '120万円',  # 旧制度
            'new_nisa_tsumitate': '120万円',  # つみたて投資枠
            'new_nisa_growth': '240万円',    # 成長投資枠
            'new_nisa_total': '360万円',     # 年間合計
            'lifetime_limit': '1,800万円'   # 生涯限度額
        },

        # 住宅ローン控除（2025年）
        'housing_loan': {
            'deduction_rate': '0.7%',
            'period_new': '13年',
            'period_used': '10年'
        }
    }

    # 古い金額や制度の検出
    outdated_patterns = [
        # 年金関連の古い金額
        (r'816,000円', '2024年度価額表記、2025年度は831,700円に変更'),
        (r'795,000円', '古い年金額、2025年度は831,700円'),
        (r'780,900円', '古い年金額、2025年度は831,700円'),

        # 旧NISA制度
        (r'つみたてNISA.*?40万円', '旧制度、新NISAはつみたて投資枠120万円'),
        (r'一般NISA.*?120万円', '旧制度、新NISAは成長投資枠240万円'),

        # 住宅ローン控除の古い制度
        (r'住宅ローン.*?1\.0%', '2025年は0.7%に変更済み'),
        (r'住宅ローン.*?1%', '2025年は0.7%に変更済み'),

        # 古い法令基準日
        (r'2023年.*?法令基準', '2025年法令基準に更新必要'),
        (r'2022年.*?法令基準', '2025年法令基準に更新必要'),
        (r'2021年.*?法令基準', '2025年法令基準に更新必要'),
        (r'平成.*?法令基準', '令和7年(2025年)法令基準に更新必要'),
    ]

    # 問題文の検証
    for pattern, issue in outdated_patterns:
        if re.search(pattern, statement, re.IGNORECASE):
            issues.append(f"問題文: {issue}")

    # 選択肢の検証
    for choice in choices:
        choice_text = choice.get('text', '')
        for pattern, issue in outdated_patterns:
            if re.search(pattern, choice_text, re.IGNORECASE):
                issues.append(f"選択肢: {issue}")

    # 特定の問題パターンの検証
    if '小規模企業共済' in statement:
        if '30,000円' in statement and '掛金' in statement:
            issues.append("小規模企業共済の掛金上限は70,000円（30,000円は古い情報）")
        if '税額控除' in statement:
            issues.append("小規模企業共済の掛金は所得控除（税額控除ではない）")
        if '一時所得' in statement and '共済金' in statement:
            issues.append("小規模企業共済の共済金は退職所得（一時所得ではない）")

    # 年金関連の検証
    if '老齢基礎年金' in statement and '満額' in statement:
        if '816,000' in statement and '2024年度価額' not in statement:
            issues.append("老齢基礎年金の満額は2025年度831,700円に更新必要")

    # 相続税の検証
    if '相続税' in statement and '基礎控除' in statement:
        if '500万円×法定相続人' in statement:
            issues.append("相続税基礎控除は600万円×法定相続人（500万円は古い）")

    return issues

def categorize_question_risk(issues):
    """問題のリスクレベルを分類"""
    if not issues:
        return "正確", []

    high_risk_keywords = ['古い年金額', '旧制度', '古い情報', '更新必要']
    medium_risk_keywords = ['2024年度価額表記', '変更済み']

    high_risk = any(any(keyword in issue for keyword in high_risk_keywords) for issue in issues)
    medium_risk = any(any(keyword in issue for keyword in medium_risk_keywords) for issue in issues)

    if high_risk:
        return "要修正", issues
    elif medium_risk:
        return "要確認", issues
    else:
        return "軽微", issues

def main():
    """メイン処理"""
    print("=== FP3級問題データベース 2025年法令適合性チェック ===\n")

    questions = load_questions()
    if not questions:
        print("問題データが見つかりません")
        return

    results = {
        "正確": [],
        "要確認": [],
        "要修正": [],
        "軽微": []
    }

    for i, question in enumerate(questions, 1):
        issues = validate_question_accuracy(question)
        risk_level, issue_list = categorize_question_risk(issues)

        results[risk_level].append({
            'id': question.get('id', i),
            'statement': question.get('statement', '')[:100] + '...',
            'issues': issue_list
        })

        # 進捗表示
        if i % 50 == 0:
            print(f"進捗: {i}/{len(questions)} 問を検証完了")

    # 結果サマリー
    print(f"\n=== 検証結果サマリー ===")
    print(f"総問題数: {len(questions)}問")
    print(f"正確（問題なし）: {len(results['正確'])}問")
    print(f"要確認（軽微な問題）: {len(results['要確認'])}問")
    print(f"軽微な問題: {len(results['軽微'])}問")
    print(f"要修正（重大な問題）: {len(results['要修正'])}問")

    # 要修正問題の詳細
    if results['要修正']:
        print(f"\n=== 要修正問題（{len(results['要修正'])}問）===")
        for item in results['要修正'][:10]:  # 最初の10問を表示
            print(f"問題ID {item['id']}: {item['statement']}")
            for issue in item['issues']:
                print(f"  - {issue}")
            print()

    # 要確認問題の詳細
    if results['要確認']:
        print(f"\n=== 要確認問題（{len(results['要確認'])}問）===")
        for item in results['要確認'][:5]:  # 最初の5問を表示
            print(f"問題ID {item['id']}: {item['statement']}")
            for issue in item['issues']:
                print(f"  - {issue}")
            print()

    # 結果をJSONファイルに保存
    output_file = 'question_validation_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n詳細な検証結果を {output_file} に保存しました")

    # 推奨アクション
    total_problematic = len(results['要修正']) + len(results['要確認'])
    if total_problematic > 0:
        print(f"\n=== 推奨アクション ===")
        print(f"- 要修正問題 {len(results['要修正'])}問: 即座に無効化または修正")
        print(f"- 要確認問題 {len(results['要確認'])}問: 内容の精査が必要")
        print(f"- 暫定的に利用可能な問題: {len(results['正確']) + len(results['軽微'])}問")

if __name__ == "__main__":
    main()