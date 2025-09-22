#!/usr/bin/env python3
"""
Script to fix JavaScript question format issues
"""
import re
import json

def clean_html_tags(text):
    """Remove HTML tags from text"""
    # Remove highlight-number spans
    text = re.sub(r'<span class="highlight-number">([^<]+)</span>', r'\1', text)
    # Remove other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Clean up any double quotes that might have been corrupted
    text = re.sub(r'"([^"]*)"([^"]*)"', r'"\1\2"', text)
    return text

def fix_statement_with_numbered_options(statement):
    """Split statement containing numbered options"""
    # Look for pattern where statement ends with question followed by numbered option
    patterns = [
        r'(.*?どれか。)\s*\n1）(.+)',
        r'(.*?どれか。)\s*1）(.+)',
        r'(.*?ものはどれか。)\s*\n1）(.+)',
        r'(.*?ものはどれか。)\s*1）(.+)'
    ]

    for pattern in patterns:
        match = re.search(pattern, statement, re.DOTALL)
        if match:
            clean_statement = match.group(1).strip()
            first_choice = match.group(2).strip()
            return clean_statement, first_choice

    return statement, None

def fix_javascript_file(file_path):
    """Fix issues in a JavaScript file"""
    print(f"Processing {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    fixes_count = 0
    fixed_questions = []

    # Split into lines for processing
    lines = content.split('\n')

    in_statement = False
    statement_buffer = ""
    current_question_id = None

    for i, line in enumerate(lines):
        # Track question IDs
        if '"id":' in line and not in_statement:
            match = re.search(r'"id":\s*(\d+)', line)
            if match:
                current_question_id = int(match.group(1))

        # Check for statement start
        if '"statement":' in line:
            in_statement = True
            statement_buffer = line
            continue

        # If we're in a statement, collect lines until we find the end
        if in_statement:
            statement_buffer += '\n' + line
            if '"choices":' in line or line.strip().endswith('",'):
                # Found end of statement
                in_statement = False

                # Extract the statement content
                statement_match = re.search(r'"statement":\s*"(.*?)"(?:,|\s*"choices")', statement_buffer, re.DOTALL)
                if statement_match:
                    original_statement = statement_match.group(1)

                    # Check if this statement has HTML corruption or numbered options
                    has_html = 'highlight-number' in original_statement or '<span' in original_statement

                    # Check if statement contains numbered options
                    fixed_statement, extracted_choice = fix_statement_with_numbered_options(original_statement)

                    if has_html or extracted_choice:
                        print(f"  Fixing question ID {current_question_id}")

                        # Clean HTML tags
                        cleaned_statement = clean_html_tags(fixed_statement)

                        # Update the statement in the content
                        updated_statement_block = statement_buffer.replace(original_statement, cleaned_statement)

                        # Replace in main content
                        content = content.replace(statement_buffer, updated_statement_block)

                        fixes_count += 1
                        fixed_questions.append({
                            'id': current_question_id,
                            'issue': 'HTML corruption' if has_html else 'Numbered options in statement',
                            'extracted_choice': extracted_choice
                        })

                statement_buffer = ""

    # Additional pass to clean any remaining HTML tags
    original_content = content
    content = re.sub(r'<span class="highlight-number">([^<]+)</span>', r'\1', content)
    content = re.sub(r'<[^>]+>', '', content)

    if content != original_content:
        additional_fixes = len(re.findall(r'<span class="highlight-number">', original_content))
        print(f"  Additional HTML tag cleanups: {additional_fixes}")
        fixes_count += additional_fixes

    # Write the fixed content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  Total fixes applied: {fixes_count}")
    return fixes_count, fixed_questions

def main():
    """Main function to fix all files"""
    files_to_fix = [
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions_2025.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/ranked_questions.js',
        '/mnt/c/Users/81805/Desktop/開発/FP3/js/extended_questions.js'
    ]

    total_fixes = 0
    all_fixed_questions = []

    for file_path in files_to_fix:
        try:
            fixes, questions = fix_javascript_file(file_path)
            total_fixes += fixes
            all_fixed_questions.extend(questions)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    print(f"\n=== SUMMARY ===")
    print(f"Total fixes applied across all files: {total_fixes}")
    print(f"Questions with issues fixed: {len(all_fixed_questions)}")

    if all_fixed_questions:
        print("\nDetailed fixes:")
        for q in all_fixed_questions:
            print(f"  Question ID {q['id']}: {q['issue']}")
            if q['extracted_choice']:
                print(f"    Extracted choice: {q['extracted_choice'][:50]}...")

if __name__ == "__main__":
    main()