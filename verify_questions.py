#!/usr/bin/env python3
"""
Script to verify question format and identify remaining issues
"""
import re
import json

def verify_file(file_path):
    """Verify questions in a file"""
    print(f"Verifying {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all questions with their full structure
    # Look for id, statement, and choices
    questions = []

    # Split content by question objects
    question_blocks = re.findall(r'\{\s*"id":\s*(\d+).*?"choices":\s*\[.*?\].*?\}', content, re.DOTALL)

    print(f"  Found {len(question_blocks)} questions")

    # Count questions with choice issues
    choice_issues = 0
    statement_issues = 0

    # Look for questions with duplicate choices
    duplicate_choice_pattern = r'"text":\s*"([^"]{50,})"[^}]*\}[^}]*\{[^}]*"text":\s*"\1"'
    duplicates = re.findall(duplicate_choice_pattern, content)

    if duplicates:
        print(f"  Found {len(duplicates)} questions with duplicate choices")
        choice_issues += len(duplicates)

    # Look for statements still containing numbered options
    numbered_statements = re.findall(r'"statement":[^"]*"[^"]*1）[^"]*"', content)
    if numbered_statements:
        print(f"  Found {len(numbered_statements)} statements still containing 1）")
        statement_issues += len(numbered_statements)

    # Look for HTML tags still remaining
    html_tags = re.findall(r'<[^>]+>', content)
    if html_tags:
        print(f"  Found {len(html_tags)} remaining HTML tags")
        print(f"    Examples: {html_tags[:5]}")

    return {
        'questions': len(question_blocks),
        'choice_issues': choice_issues,
        'statement_issues': statement_issues,
        'html_tags': len(html_tags)
    }

def get_detailed_question_info(file_path, question_id):
    """Get detailed info about a specific question"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the specific question
    pattern = rf'"id":\s*{question_id}[^{{]*\{{[^{{]*"statement":[^"]*"([^"]*)"[^[]*"choices":\s*\[([^\]]*)\]'
    match = re.search(pattern, content, re.DOTALL)

    if match:
        statement = match.group(1)
        choices_content = match.group(2)

        # Count choices
        choice_count = len(re.findall(r'"id":\s*[123]', choices_content))

        # Check for duplicate text
        choice_texts = re.findall(r'"text":\s*"([^"]*)"', choices_content)
        has_duplicates = len(choice_texts) != len(set(choice_texts))

        return {
            'statement': statement[:100] + "..." if len(statement) > 100 else statement,
            'choice_count': choice_count,
            'has_duplicates': has_duplicates,
            'choice_texts': [text[:50] + "..." if len(text) > 50 else text for text in choice_texts]
        }

    return None

def main():
    """Main verification function"""
    files = [
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions_2025.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/ranked_questions.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions.js'
    ]

    total_issues = 0

    for file_path in files:
        try:
            result = verify_file(file_path)
            total_issues += result['choice_issues'] + result['statement_issues'] + result['html_tags']
            print()
        except Exception as e:
            print(f"Error verifying {file_path}: {e}")

    # Check specific question mentioned by user
    print("=== Checking Question ID 3 ===")
    for file_path in files:
        info = get_detailed_question_info(file_path, 3)
        if info:
            print(f"File: {file_path.split('/')[-1]}")
            print(f"  Statement: {info['statement']}")
            print(f"  Choice count: {info['choice_count']}")
            print(f"  Has duplicates: {info['has_duplicates']}")
            print(f"  Choices: {info['choice_texts']}")
            print()

    print(f"Total remaining issues across all files: {total_issues}")

if __name__ == "__main__":
    main()