// Node.js環境での問題データベーステスト
const fs = require('fs');
const path = require('path');

// questions.jsファイルを読み込み
const questionsPath = path.join(__dirname, 'js', 'questions.js');
const extendedPath = path.join(__dirname, 'js', 'extended_questions.js');

try {
    // JavaScriptファイルを評価
    const questionsCode = fs.readFileSync(questionsPath, 'utf8');
    const extendedCode = fs.readFileSync(extendedPath, 'utf8');

    // グローバル変数を定義
    global.console = console;

    eval(questionsCode);
    eval(extendedCode);

    console.log('=== 問題データベーステスト結果 ===');
    console.log(`筆記問題数: ${writtenQuestions.length}`);
    console.log(`実技問題数: ${practicalQuestions.length}`);

    if (typeof extractedPracticalQuestions !== 'undefined') {
        console.log(`PDF抽出実技問題数: ${extractedPracticalQuestions.length}`);
    }

    // ランダム問題生成のテスト
    console.log('\n=== ランダム問題生成テスト ===');
    for (let i = 0; i < 3; i++) {
        const randomQuestions = getRandomQuestions();
        console.log(`テスト${i+1}: ${randomQuestions.length}問生成`);

        // 問題のサンプルを表示
        if (randomQuestions.length > 0) {
            const sample = randomQuestions[0];
            console.log(`  問題例: ${sample.statement.substring(0, 50)}...`);
            console.log(`  選択肢数: ${sample.choices.length}`);
        }
    }

    console.log('\n✅ 問題データベースのテストが完了しました！');

} catch (error) {
    console.error('❌ テストエラー:', error.message);
}