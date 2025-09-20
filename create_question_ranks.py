#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
from pathlib import Path

def analyze_question_importance():
    """問題の重要度を分析してランク付け"""

    # FP3級頻出テーマのランク付け（出題傾向調査に基づく）
    importance_patterns = {
        # Aランク（100-75%）: 毎回出る超重要問題
        'A': [
            # 年金制度（毎回出題）
            {'keywords': ['老齢基礎年金', '年金額', '満額'], 'weight': 100},
            {'keywords': ['厚生年金', '老齢給付'], 'weight': 95},
            {'keywords': ['遺族年金', '遺族基礎年金'], 'weight': 90},

            # 相続・贈与（毎回出題）
            {'keywords': ['相続税', '基礎控除', '3,000万円', '600万円'], 'weight': 100},
            {'keywords': ['法定相続人', '相続分'], 'weight': 95},
            {'keywords': ['贈与税', '110万円', '基礎控除'], 'weight': 90},

            # 住宅ローン控除（ほぼ毎回）
            {'keywords': ['住宅ローン控除', '住宅借入金等特別控除'], 'weight': 85},

            # 小規模企業共済（頻出）
            {'keywords': ['小規模企業共済', '掛金', '70,000円'], 'weight': 80},
        ],

        # Bランク（74-50%）: よく出る重要問題
        'B': [
            # 確定拠出年金（制度改正で増加傾向）
            {'keywords': ['確定拠出年金', 'iDeCo', '個人型'], 'weight': 70},

            # 健康保険
            {'keywords': ['健康保険', '一部負担金', '3割'], 'weight': 65},
            {'keywords': ['高額療養費', '21,000円'], 'weight': 60},

            # 不動産関連
            {'keywords': ['建築基準法', '建ぺい率', '容積率'], 'weight': 65},
            {'keywords': ['借地権', '相続税評価'], 'weight': 60},

            # 金融商品
            {'keywords': ['NISA', '新NISA', '投資枠'], 'weight': 65},
            {'keywords': ['投資信託', 'シャープレシオ'], 'weight': 55},

            # 所得税
            {'keywords': ['給与所得控除', '給与収入'], 'weight': 60},
            {'keywords': ['一時所得', '特別控除', '50万円'], 'weight': 55},
        ],

        # Cランク（49-25%）: 時々出る問題
        'C': [
            # 保険関連
            {'keywords': ['生命保険', '死亡保険金', '非課税'], 'weight': 45},
            {'keywords': ['医療保険', '加入'], 'weight': 40},

            # 株式・投資
            {'keywords': ['株式', 'PER', 'PBR'], 'weight': 45},
            {'keywords': ['配当利回り', '配当性向'], 'weight': 40},

            # 税制
            {'keywords': ['所得控除', '税額控除'], 'weight': 40},
            {'keywords': ['退職所得', '退職金'], 'weight': 35},

            # 不動産詳細
            {'keywords': ['定期借地権', '事業用'], 'weight': 35},
            {'keywords': ['登記', '登録免許税'], 'weight': 30},
        ],

        # Dランク（25%未満）: 稀に出る問題
        'D': [
            # 専門的・マイナーなテーマ
            {'keywords': ['障害年金', '障害等級'], 'weight': 20},
            {'keywords': ['育児休業給付', '支給率'], 'weight': 20},
            {'keywords': ['事業承継', '特例'], 'weight': 15},
            {'keywords': ['農地', '転用'], 'weight': 10},
        ]
    }

    return importance_patterns

def calculate_question_rank(question, importance_patterns):
    """個別問題のランクを計算"""
    statement = question.get('statement', '').lower()
    choices_text = ' '.join([choice.get('text', '') for choice in question.get('choices', [])]).lower()
    full_text = statement + ' ' + choices_text

    max_weight = 0
    assigned_rank = 'D'  # デフォルト

    # 各ランクのパターンをチェック
    for rank, patterns in importance_patterns.items():
        for pattern in patterns:
            keywords = pattern['keywords']
            weight = pattern['weight']

            # キーワードマッチング
            matches = sum(1 for keyword in keywords if keyword.lower() in full_text)
            match_score = (matches / len(keywords)) * weight

            if match_score > max_weight:
                max_weight = match_score
                assigned_rank = rank

    # 重み調整（複数キーワードマッチでランクアップ）
    if max_weight >= 80:
        assigned_rank = 'A'
    elif max_weight >= 60:
        assigned_rank = 'B'
    elif max_weight >= 30:
        assigned_rank = 'C'
    else:
        assigned_rank = 'D'

    return assigned_rank, max_weight

def add_ranks_to_questions():
    """問題データベースにランク情報を追加"""

    # 既存の問題データを読み込み
    try:
        with open('parsed_questions.json', 'r', encoding='utf-8') as f:
            questions = json.load(f)
    except Exception as e:
        print(f"問題データの読み込みエラー: {e}")
        return

    importance_patterns = analyze_question_importance()

    # 各問題にランクを付与
    ranked_questions = []
    rank_stats = {'A': 0, 'B': 0, 'C': 0, 'D': 0}

    for question in questions:
        rank, weight = calculate_question_rank(question, importance_patterns)

        # 問題にランク情報を追加
        ranked_question = question.copy()
        ranked_question['rank'] = rank
        ranked_question['importance_weight'] = round(weight, 1)

        # ランク説明を追加
        rank_descriptions = {
            'A': '超重要（毎回出題レベル）',
            'B': '重要（頻出問題）',
            'C': '標準（時々出題）',
            'D': '補助（稀に出題）'
        }
        ranked_question['rank_description'] = rank_descriptions[rank]

        ranked_questions.append(ranked_question)
        rank_stats[rank] += 1

        print(f"問題ID {question.get('id', 'N/A')}: ランク{rank} (重要度: {weight:.1f})")

    # 統計情報
    print(f"\n=== ランク付け結果統計 ===")
    print(f"総問題数: {len(ranked_questions)}")
    print(f"Aランク（超重要）: {rank_stats['A']}問")
    print(f"Bランク（重要）: {rank_stats['B']}問")
    print(f"Cランク（標準）: {rank_stats['C']}問")
    print(f"Dランク（補助）: {rank_stats['D']}問")

    # ランク付き問題データを保存
    with open('ranked_questions.json', 'w', encoding='utf-8') as f:
        json.dump(ranked_questions, f, ensure_ascii=False, indent=2)

    print(f"\nランク付き問題データを ranked_questions.json に保存しました")

    # JavaScriptファイルを生成
    generate_ranked_js_file(ranked_questions, rank_stats)

    return ranked_questions, rank_stats

def generate_ranked_js_file(ranked_questions, rank_stats):
    """ランク付きJavaScriptファイルを生成"""

    # ランク別に問題を分類
    questions_by_rank = {
        'A': [q for q in ranked_questions if q.get('rank') == 'A'],
        'B': [q for q in ranked_questions if q.get('rank') == 'B'],
        'C': [q for q in ranked_questions if q.get('rank') == 'C'],
        'D': [q for q in ranked_questions if q.get('rank') == 'D']
    }

    js_content = f'''// FP3級問題データベース（重要度ランク付き版）
// 最終更新: 2025年9月 - 出題傾向分析済み

// ランク別問題データ
const rankedQuestions = {{
    'A': {json.dumps(questions_by_rank['A'], ensure_ascii=False, indent=2)},
    'B': {json.dumps(questions_by_rank['B'], ensure_ascii=False, indent=2)},
    'C': {json.dumps(questions_by_rank['C'], ensure_ascii=False, indent=2)},
    'D': {json.dumps(questions_by_rank['D'], ensure_ascii=False, indent=2)}
}};

// 全ランク付き問題
const allRankedQuestions = {json.dumps(ranked_questions, ensure_ascii=False, indent=2)};

// ランク説明
const rankDescriptions = {{
    'A': {{
        name: 'Aランク（超重要）',
        description: '毎回出題される可能性が高い（75-100%）',
        color: '#ff4444',
        priority: 1
    }},
    'B': {{
        name: 'Bランク（重要）',
        description: 'よく出題される重要問題（50-74%）',
        color: '#ff8800',
        priority: 2
    }},
    'C': {{
        name: 'Cランク（標準）',
        description: '時々出題される問題（25-49%）',
        color: '#ffcc00',
        priority: 3
    }},
    'D': {{
        name: 'Dランク（補助）',
        description: '稀に出題される問題（25%未満）',
        color: '#888888',
        priority: 4
    }}
}};

// ランク別出題関数
function getQuestionsByRank(rank, count = 10) {{
    const questions = rankedQuestions[rank] || [];
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((question, index) => ({{
        ...question,
        id: index + 1
    }}));
}}

// 重要度重み付きランダム選択
function getWeightedRandomQuestions(count = 20) {{
    const weights = {{ 'A': 0.4, 'B': 0.3, 'C': 0.2, 'D': 0.1 }};
    let selected = [];

    for (const [rank, weight] of Object.entries(weights)) {{
        const rankCount = Math.floor(count * weight);
        const rankQuestions = getQuestionsByRank(rank, rankCount);
        selected = [...selected, ...rankQuestions];
    }}

    // 不足分を補完
    while (selected.length < count) {{
        const allQuestions = [...allRankedQuestions];
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        selected.push(shuffled[0]);
    }}

    return selected.slice(0, count).map((question, index) => ({{
        ...question,
        id: index + 1
    }}));
}}

// 統計情報
console.log('=== FP3級問題ランク統計 ===');
console.log('Aランク（超重要）: {rank_stats["A"]}問');
console.log('Bランク（重要）: {rank_stats["B"]}問');
console.log('Cランク（標準）: {rank_stats["C"]}問');
console.log('Dランク（補助）: {rank_stats["D"]}問');
console.log('総問題数: {sum(rank_stats.values())}問');
'''

    output_path = 'js/ranked_questions.js'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"ランク付きJavaScriptファイルを生成: {output_path}")

def main():
    """メイン処理"""
    print("=== FP3級問題重要度ランク付けシステム ===\n")

    ranked_questions, rank_stats = add_ranks_to_questions()

    # 各ランクの代表例を表示
    print(f"\n=== 各ランクの代表例 ===")
    for rank in ['A', 'B', 'C', 'D']:
        examples = [q for q in ranked_questions if q.get('rank') == rank][:3]
        print(f"\n{rank}ランク例:")
        for example in examples:
            statement = example.get('statement', '')[:60] + '...'
            print(f"  - {statement}")

if __name__ == "__main__":
    main()