#!/usr/bin/env node
// 2択問題を3択問題に自動変換するスクリプト

const fs = require('fs');
const path = require('path');

// 処理対象ファイル
const files = [
    'js/extended_questions.js',
    'js/extended_questions_2025.js',
    'js/ranked_questions.js'
];

// 3番目の選択肢候補生成器
function generateThirdChoice(choice1, choice2) {
    // 数値の場合
    const num1 = parseFloat(choice1.text.replace(/[^\d.]/g, ''));
    const num2 = parseFloat(choice2.text.replace(/[^\d.]/g, ''));

    if (!isNaN(num1) && !isNaN(num2)) {
        const diff = Math.abs(num1 - num2);
        const third = Math.max(num1, num2) + diff;
        const format = choice1.text.replace(/[\d.]+/, third.toFixed(choice1.text.includes('.') ? 2 : 0));
        return format;
    }

    // 年数の場合
    if (choice1.text.includes('年') || choice1.text.includes('歳')) {
        const year1 = parseInt(choice1.text.replace(/\D/g, ''));
        const year2 = parseInt(choice2.text.replace(/\D/g, ''));
        if (!isNaN(year1) && !isNaN(year2)) {
            const third = Math.max(year1, year2) + Math.abs(year1 - year2);
            return choice1.text.replace(/\d+/, third);
        }
    }

    // パーセントの場合
    if (choice1.text.includes('%')) {
        const per1 = parseFloat(choice1.text.replace(/[^\d.]/g, ''));
        const per2 = parseFloat(choice2.text.replace(/[^\d.]/g, ''));
        if (!isNaN(per1) && !isNaN(per2)) {
            const third = Math.max(per1, per2) + Math.abs(per1 - per2);
            return choice1.text.replace(/[\d.]+/, third.toFixed(2));
        }
    }

    // その他のパターン
    return '3）その他の選択肢';
}

// ファイル処理関数
function processFile(filePath) {
    console.log(`\n処理中: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let fixedCount = 0;

    // JSONデータを抽出（複数のパターンに対応）
    const dataMatches = content.match(/const\s+\w+\s*=\s*(\[[\s\S]*?\]);/g);

    if (!dataMatches) {
        console.log('データが見つかりません');
        return;
    }

    dataMatches.forEach(match => {
        try {
            // データ部分を抽出
            const jsonPart = match.match(/(\[[\s\S]*?\]);/)[1].slice(0, -1);
            const data = JSON.parse(jsonPart);

            data.forEach(question => {
                if (question.choices && question.choices.length === 2) {
                    // 3番目の選択肢を生成
                    const thirdChoice = {
                        id: 3,
                        text: generateThirdChoice(question.choices[0], question.choices[1])
                    };

                    question.choices.push(thirdChoice);
                    fixedCount++;

                    console.log(`修正: 問題${question.id} - "${thirdChoice.text}"`);
                }
            });

            // ファイル内容を更新
            const updatedJson = JSON.stringify(data, null, 2);
            content = content.replace(jsonPart, updatedJson);

        } catch (error) {
            console.error('JSON解析エラー:', error.message);
        }
    });

    // ファイルを保存
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`完了: ${fixedCount}問を修正`);
}

// メイン処理
console.log('=== 2択問題自動修正ツール ===');

files.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        processFile(fullPath);
    } else {
        console.log(`ファイルが見つかりません: ${fullPath}`);
    }
});

console.log('\n=== 修正完了 ===');