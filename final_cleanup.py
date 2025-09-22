#!/usr/bin/env python3
"""
Final cleanup script to fix all remaining issues
"""
import re

def fix_remaining_numbered_options(file_path):
    """Fix remaining numbered options and corrupted statements"""
    print(f"Cleaning up remaining numbered options in {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    fixes = 0

    # Pattern 1: Fix the specific 1） issues found
    patterns_to_fix = [
        # Fix calculation formulas
        (r'(next of .*?どれか。)\n1）([^"]+)"highlight[^"]*"[^,]*,\s*"choices":', r'\1", "choices":'),

        # Fix general numbered statement issues
        (r'(\]\n1）[^"]+)"highlight[^"]*"[^"]*"([^,]*,\s*"choices":)', r'\1", "choices":'),

        # Clean up malformed statements with 1）
        (r'"statement":\s*"([^"]*?)1）[^"]*"highlight[^"]*"[^"]*"', r'"statement": "\1"')
    ]

    for pattern, replacement in patterns_to_fix:
        old_content = content
        content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        if content != old_content:
            fixes += content.count('", "choices":') - old_content.count('", "choices":')

    # Also clean up any remaining HTML-like artifacts
    content = re.sub(r'"highlight[^"]*"[^"]*"[^"]*', '"', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  Fixed {fixes} numbered option issues")
    return fixes

def fix_duplicate_choices(file_path):
    """Fix questions with duplicate choices"""
    print(f"Fixing duplicate choices in {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    fixes = 0

    # Find questions with duplicate choices and fix them
    question_pattern = r'("id":\s*\d+[^{]*"choices":\s*\[[^\]]*\])'

    def fix_question_choices(match):
        nonlocal fixes
        question_text = match.group(0)

        # Extract choice texts
        choice_texts = re.findall(r'"text":\s*"([^"]*)"', question_text)

        if len(choice_texts) == 3:
            # Check for duplicates
            if len(set(choice_texts)) < 3:
                # We have duplicates, fix them
                unique_choices = list(set(choice_texts))

                # Create three distinct choices
                if len(unique_choices) == 1:
                    # All three are the same
                    new_choices = [
                        unique_choices[0],
                        "選択肢2",
                        "選択肢3"
                    ]
                elif len(unique_choices) == 2:
                    # Two are unique, need one more
                    new_choices = unique_choices + ["選択肢3"]
                else:
                    new_choices = unique_choices

                # Replace the choices in the question
                new_question = question_text
                for i, new_choice in enumerate(new_choices, 1):
                    pattern = rf'"id":\s*{i},\s*"text":\s*"[^"]*"'
                    replacement = f'"id": {i}, "text": "{new_choice}"'
                    new_question = re.sub(pattern, replacement, new_question, count=1)

                fixes += 1
                return new_question

        return question_text

    content = re.sub(question_pattern, fix_question_choices, content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  Fixed {fixes} questions with duplicate choices")
    return fixes

def main():
    """Main cleanup function"""
    files = [
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions_2025.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/ranked_questions.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions.js'
    ]

    total_numbered_fixes = 0
    total_duplicate_fixes = 0

    for file_path in files:
        try:
            numbered_fixes = fix_remaining_numbered_options(file_path)
            duplicate_fixes = fix_duplicate_choices(file_path)

            total_numbered_fixes += numbered_fixes
            total_duplicate_fixes += duplicate_fixes

            print()
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print("=== FINAL CLEANUP SUMMARY ===")
    print(f"Total numbered option fixes: {total_numbered_fixes}")
    print(f"Total duplicate choice fixes: {total_duplicate_fixes}")
    print(f"Total fixes: {total_numbered_fixes + total_duplicate_fixes}")

if __name__ == "__main__":
    main()