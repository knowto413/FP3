#!/usr/bin/env python3
# 2択問題を3択問題に修正するPythonスクリプト

import re
import json

def generate_third_choice(choice1_text, choice2_text):
    """3番目の選択肢を生成"""

    # 数値の抽出と処理
    nums1 = re.findall(r'[\d,]+(?:\.\d+)?', choice1_text.replace(',', ''))
    nums2 = re.findall(r'[\d,]+(?:\.\d+)?', choice2_text.replace(',', ''))

    if nums1 and nums2:
        try:
            num1 = float(nums1[0])
            num2 = float(nums2[0])
            diff = abs(num1 - num2)
            third_num = max(num1, num2) + diff

            # 整数の場合は整数で返す
            if '.' not in nums1[0] and '.' not in nums2[0]:
                third_num = int(third_num)

            # 元の形式を保持して置換
            result = choice2_text
            for num in nums2:
                result = result.replace(num, str(third_num), 1)
                break
            return result
        except:
            pass

    # パーセント処理
    if '%' in choice1_text and '%' in choice2_text:
        per1 = re.findall(r'(\d+(?:\.\d+)?)%', choice1_text)
        per2 = re.findall(r'(\d+(?:\.\d+)?)%', choice2_text)
        if per1 and per2:
            try:
                p1 = float(per1[0])
                p2 = float(per2[0])
                p3 = max(p1, p2) + abs(p1 - p2)
                return choice2_text.replace(per2[0] + '%', f'{p3:.1f}%')
            except:
                pass

    # デフォルトの3番目の選択肢
    if '1）' in choice1_text or '2）' in choice2_text:
        return '3）その他の選択肢'
    elif '①' in choice1_text or '②' in choice2_text:
        return '③その他の選択肢'
    else:
        return 'その他の選択肢'

def fix_file(filename):
    """ファイル内の2択問題を3択に修正"""
    print(f"\n処理中: {filename}")

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 問題パターンを検索して修正
    pattern = r'(\s*"choices":\s*\[\s*{\s*"id":\s*1,\s*"text":\s*"([^"]+)"\s*},\s*{\s*"id":\s*2,\s*"text":\s*"([^"]+)"\s*}\s*\])'

    def replace_choice(match):
        full_match = match.group(1)
        choice1_text = match.group(2)
        choice2_text = match.group(3)

        # 3番目の選択肢を生成
        choice3_text = generate_third_choice(choice1_text, choice2_text)

        # 新しい3択形式に置換
        new_choices = f'''    "choices": [
      {{
        "id": 1,
        "text": "{choice1_text}"
      }},
      {{
        "id": 2,
        "text": "{choice2_text}"
      }},
      {{
        "id": 3,
        "text": "{choice3_text}"
      }}
    ]'''

        print(f"修正: {choice1_text[:30]}... → 3択に変換")
        return new_choices

    # 置換実行
    new_content = re.sub(pattern, replace_choice, content)

    # ファイル保存
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 修正数をカウント
    count = len(re.findall(pattern, content))
    print(f"修正完了: {count}問")

# メイン処理
files = [
    '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions.js',
    '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions_2025.js',
    '/mnt/c/Users/81805/Desktop/開発/FP3/js/ranked_questions.js'
]

print("=== 2択問題自動修正ツール ===")

for file in files:
    try:
        fix_file(file)
    except Exception as e:
        print(f"エラー {file}: {e}")

print("\n=== 修正完了 ===")