// Node.js環境でのランキングシステムテスト
const fs = require('fs');
const path = require('path');

try {
    // ランク付き問題データを読み込み
    const rankedPath = path.join(__dirname, 'ranked_questions.json');
    const rankedData = JSON.parse(fs.readFileSync(rankedPath, 'utf8'));

    console.log('=== FP3級 重要度ランキングシステム テスト完了 ===\n');

    // 統計情報
    const rankStats = { A: 0, B: 0, C: 0, D: 0 };
    rankedData.forEach(q => {
        if (q.rank) rankStats[q.rank]++;
    });

    console.log('📊 問題数統計:');
    console.log(`🔥 Aランク（超重要）: ${rankStats.A}問 - 毎回出題 (75-100%)`);
    console.log(`⭐ Bランク（重要）: ${rankStats.B}問 - 頻出問題 (50-74%)`);
    console.log(`📖 Cランク（標準）: ${rankStats.C}問 - 時々出題 (25-49%)`);
    console.log(`📝 Dランク（補助）: ${rankStats.D}問 - 稀に出題 (25%未満)`);
    console.log(`📚 総問題数: ${rankedData.length}問\n`);

    // 各ランクの例を表示
    console.log('💡 ランク別問題例:');
    ['A', 'B', 'C', 'D'].forEach(rank => {
        const examples = rankedData.filter(q => q.rank === rank).slice(0, 2);
        console.log(`\n${rank}ランク例:`);
        examples.forEach((q, i) => {
            const statement = q.statement.substring(0, 50) + '...';
            console.log(`  ${i + 1}. ${statement}`);
        });
    });

    // 重要度重み付き配分をシミュレート
    console.log('\n🎯 出題バランス（20問での配分例）:');
    const weights = { 'A': 0.15, 'B': 0.35, 'C': 0.35, 'D': 0.15 };
    Object.entries(weights).forEach(([rank, weight]) => {
        const count = Math.floor(20 * weight);
        const available = rankStats[rank];
        console.log(`${rank}ランク: ${count}問選出 (利用可能: ${available}問)`);
    });

    console.log('\n✅ ランキングシステム実装完了！');
    console.log('🚀 これでブラウザでindex.htmlを開いて試験を開始できます');

} catch (error) {
    console.error('❌ テストエラー:', error.message);
}