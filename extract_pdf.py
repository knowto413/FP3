#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import PyPDF2
import sys
import os

def extract_text_from_pdf(pdf_path):
    """PDFファイルからテキストを抽出する"""
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            print(f"PDFページ数: {len(reader.pages)}")
            
            for page_num, page in enumerate(reader.pages):
                print(f"\n--- ページ {page_num + 1} ---")
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- ページ {page_num + 1} ---\n"
                    text += page_text
                    print(page_text[:500] + "..." if len(page_text) > 500 else page_text)
                else:
                    print("テキストが抽出できませんでした")
            
            return text
            
    except Exception as e:
        print(f"エラー: {e}")
        return None

if __name__ == "__main__":
    pdf_path = "/mnt/c/Users/81805/Desktop/開発/FP3/まとめ.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"ファイルが見つかりません: {pdf_path}")
        sys.exit(1)
    
    text = extract_text_from_pdf(pdf_path)
    
    if text:
        # テキストファイルに保存
        output_path = "/mnt/c/Users/81805/Desktop/開発/FP3/extracted_text.txt"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"\n抽出されたテキストを {output_path} に保存しました")
    else:
        print("テキストの抽出に失敗しました")