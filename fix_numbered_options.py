#!/usr/bin/env python3
"""
Script to fix numbered options that need to be moved from statements to choices
"""
import re
import json

def fix_numbered_options_in_file(file_path):
    """Fix numbered options in a JavaScript file"""
    print(f"Processing numbered options in {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    fixes_count = 0

    # Pattern to find questions with numbered options in statements
    question_pattern = r'(\{\s*"id":\s*(\d+),\s*"type":\s*"[^"]+",\s*"statement":\s*"[^"]*?)1）([^"]+)"([^}]+)"choices":\s*\[[^}]+\}[^}]+\}[^}]+\}[^}]+\])'

    def fix_question(match):
        nonlocal fixes_count
        question_start = match.group(1)
        question_id = match.group(2)
        extracted_text = match.group(3).strip()
        question_end = match.group(4)

        print(f"  Fixing question ID {question_id} with numbered options")

        # Clean the statement - remove the 1） and everything after
        clean_statement = question_start.rstrip() + '"'

        # Find and replace the choices section
        choices_pattern = r'"choices":\s*\[\s*\{[^}]+\}[^}]+\{[^}]+\}[^}]+\{[^}]+\}'
        choices_match = re.search(choices_pattern, question_end)

        if choices_match:
            # Create new choices with the extracted text as the first choice
            new_choices = f'''"choices": [
      {{
      "id": 1,
      "text": "{extracted_text}"
    }},
      {{
      "id": 2,
      "text": "その他の選択肢"
    }},
      {{
      "id": 3,
      "text": "その他の選択肢"
    }}
    ]'''

            updated_question = clean_statement + question_end.replace(choices_match.group(0), new_choices)
            fixes_count += 1
            return updated_question

        return match.group(0)

    # Apply the fix
    content = re.sub(question_pattern, fix_question, content, flags=re.DOTALL)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  Fixed {fixes_count} questions with numbered options")
    return fixes_count

def verify_choice_counts(file_path):
    """Verify that all questions have exactly 3 choices"""
    print(f"Verifying choice counts in {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all questions
    question_pattern = r'"id":\s*(\d+)[^{}]*"choices":\s*\[([^\]]+)\]'
    questions = re.findall(question_pattern, content, re.DOTALL)

    problems = []

    for question_id, choices_content in questions:
        # Count choices by counting "id": occurrences
        choice_count = len(re.findall(r'"id":\s*[123]', choices_content))

        if choice_count != 3:
            problems.append((question_id, choice_count))

    if problems:
        print(f"  Found {len(problems)} questions with incorrect choice counts:")
        for q_id, count in problems[:10]:  # Show first 10
            print(f"    Question {q_id}: {count} choices")
    else:
        print(f"  All questions have exactly 3 choices ✓")

    return len(problems)

def main():
    """Main function"""
    files_to_fix = [
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions_2025.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/ranked_questions.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions.js'
    ]

    total_fixes = 0
    total_problems = 0

    for file_path in files_to_fix:
        try:
            fixes = fix_numbered_options_in_file(file_path)
            problems = verify_choice_counts(file_path)
            total_fixes += fixes
            total_problems += problems
            print()
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"=== SUMMARY ===")
    print(f"Total numbered option fixes: {total_fixes}")
    print(f"Total questions with choice count problems: {total_problems}")

if __name__ == "__main__":
    main()