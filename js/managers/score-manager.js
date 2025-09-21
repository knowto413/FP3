import { EXAM_CONFIG } from '../config/exam-config.js';
import { FormatUtil } from '../utils/format-util.js';

// スコア管理と採点を担当するクラス
export class ScoreManager {
    constructor() {
        this.questions = [];
        this.answers = {};
        this.results = null;
        this.examStartTime = null;
        this.examEndTime = null;
    }

    /**
     * 試験データを設定
     * @param {Array} questions - 問題配列
     * @param {Object} answers - 回答データ
     * @param {Date} startTime - 開始時刻
     */
    setExamData(questions, answers, startTime) {
        this.questions = questions || [];
        this.answers = answers || {};
        this.examStartTime = startTime;
        this.examEndTime = new Date();
    }

    /**
     * 試験を採点
     * @returns {Object} 採点結果
     */
    calculateScore() {
        if (!this.questions || this.questions.length === 0) {
            throw new Error('No questions available for scoring');
        }

        const totalQuestions = this.questions.length;
        let correctAnswers = 0;
        const detailedResults = [];

        // 各問題を採点
        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[question.id];
            const isCorrect = this.isAnswerCorrect(question, userAnswer);

            if (isCorrect) {
                correctAnswers++;
            }

            detailedResults.push({
                questionNumber: index + 1,
                questionId: question.id,
                statement: question.statement,
                choices: question.choices,
                correctAnswer: this.getCorrectAnswer(question),
                userAnswer: userAnswer,
                isCorrect: isCorrect,
                rank: question.rank || 'D',
                explanation: question.explanation || ''
            });
        });

        // スコア計算
        const score = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
        const passed = score >= EXAM_CONFIG.PASSING_SCORE;

        // 試験時間計算
        const timeUsed = this.calculateTimeUsed();

        // 結果オブジェクト作成
        this.results = {
            totalQuestions,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            score,
            passed,
            timeUsed,
            startTime: this.examStartTime,
            endTime: this.examEndTime,
            detailedResults,
            statistics: this.calculateStatistics(detailedResults)
        };

        console.log('Exam scored:', this.results);
        return this.results;
    }

    /**
     * 回答が正解かチェック
     * @param {Object} question - 問題オブジェクト
     * @param {number} userAnswer - ユーザーの回答ID
     * @returns {boolean} 正解かどうか
     */
    isAnswerCorrect(question, userAnswer) {
        if (!question.choices || !Array.isArray(question.choices)) {
            return false;
        }

        // 正解の選択肢を見つける
        const correctChoice = question.choices.find(choice => choice.isCorrect || choice.correct);

        if (!correctChoice) {
            // 正解が明示的に設定されていない場合、最初の選択肢を正解とする
            return userAnswer === question.choices[0]?.id;
        }

        return userAnswer === correctChoice.id;
    }

    /**
     * 正解の選択肢を取得
     * @param {Object} question - 問題オブジェクト
     * @returns {Object} 正解の選択肢
     */
    getCorrectAnswer(question) {
        if (!question.choices || !Array.isArray(question.choices)) {
            return null;
        }

        const correctChoice = question.choices.find(choice => choice.isCorrect || choice.correct);
        return correctChoice || question.choices[0];
    }

    /**
     * 試験時間を計算
     * @returns {number} 使用時間（秒）
     */
    calculateTimeUsed() {
        if (!this.examStartTime || !this.examEndTime) {
            return 0;
        }

        return Math.floor((this.examEndTime - this.examStartTime) / 1000);
    }

    /**
     * 統計情報を計算
     * @param {Array} detailedResults - 詳細結果
     * @returns {Object} 統計情報
     */
    calculateStatistics(detailedResults) {
        const stats = {
            byRank: {},
            averageScore: 0,
            timePerQuestion: 0,
            unansweredCount: 0
        };

        // ランク別統計
        const rankStats = {};
        detailedResults.forEach(result => {
            const rank = result.rank;
            if (!rankStats[rank]) {
                rankStats[rank] = { total: 0, correct: 0 };
            }
            rankStats[rank].total++;
            if (result.isCorrect) {
                rankStats[rank].correct++;
            }

            // 未回答数をカウント
            if (result.userAnswer === undefined || result.userAnswer === null) {
                stats.unansweredCount++;
            }
        });

        // ランク別正答率を計算
        Object.entries(rankStats).forEach(([rank, data]) => {
            stats.byRank[rank] = {
                total: data.total,
                correct: data.correct,
                accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0
            };
        });

        // 平均スコア
        stats.averageScore = this.results ? this.results.score * 100 : 0;

        // 問題あたりの平均時間
        const timeUsed = this.calculateTimeUsed();
        stats.timePerQuestion = this.questions.length > 0 ? timeUsed / this.questions.length : 0;

        return stats;
    }

    /**
     * 結果をエクスポート用にフォーマット
     * @returns {Object} エクスポート用結果データ
     */
    getExportData() {
        if (!this.results) {
            throw new Error('No results available for export');
        }

        const formatted = FormatUtil.formatExamSummary(this.results);

        return {
            examInfo: {
                date: this.examEndTime?.toISOString(),
                totalQuestions: this.results.totalQuestions,
                timeLimit: EXAM_CONFIG.TIME_LIMIT,
                passingScore: EXAM_CONFIG.PASSING_SCORE
            },
            results: {
                score: this.results.score,
                scoreText: formatted.scoreText,
                passed: this.results.passed,
                statusText: formatted.statusText,
                correctAnswers: this.results.correctAnswers,
                timeUsed: this.results.timeUsed,
                timeText: formatted.timeText
            },
            statistics: this.results.statistics,
            detailedResults: this.results.detailedResults.map(result => ({
                questionNumber: result.questionNumber,
                statement: result.statement.substring(0, 100) + '...', // 省略
                userAnswer: result.userAnswer,
                correctAnswer: result.correctAnswer?.id,
                isCorrect: result.isCorrect,
                rank: result.rank
            }))
        };
    }

    /**
     * 合格判定のメッセージを取得
     * @returns {string} 判定メッセージ
     */
    getResultMessage() {
        if (!this.results) return '';

        const { passed, score, correctAnswers, totalQuestions } = this.results;
        const scorePercent = Math.round(score * 100);

        if (passed) {
            return `🎉 合格おめでとうございます！\n正答率: ${scorePercent}% (${correctAnswers}/${totalQuestions}問正解)`;
        } else {
            const needed = Math.ceil(EXAM_CONFIG.PASSING_SCORE * totalQuestions);
            return `📚 不合格です。もう一度挑戦してください。\n正答率: ${scorePercent}% (${correctAnswers}/${totalQuestions}問正解)\n合格には${needed}問以上の正解が必要です。`;
        }
    }

    /**
     * ランク別の弱点分析を取得
     * @returns {Array} 弱点分析結果
     */
    getWeaknessAnalysis() {
        if (!this.results || !this.results.statistics) return [];

        const analysis = [];
        const rankStats = this.results.statistics.byRank;

        Object.entries(rankStats).forEach(([rank, stats]) => {
            if (stats.accuracy < 60) { // 60%未満を弱点とする
                const rankInfo = FormatUtil.formatRank(rank);
                analysis.push({
                    rank,
                    rankName: rankInfo.text,
                    accuracy: stats.accuracy,
                    correct: stats.correct,
                    total: stats.total,
                    suggestion: this.getSuggestionByRank(rank)
                });
            }
        });

        // 正答率の低い順にソート
        analysis.sort((a, b) => a.accuracy - b.accuracy);

        return analysis;
    }

    /**
     * ランク別の学習提案を取得
     * @param {string} rank - ランク
     * @returns {string} 学習提案
     */
    getSuggestionByRank(rank) {
        const suggestions = {
            'A': '最重要・頻出問題です。重点的に復習し、類似問題も解いて理解を深めましょう。',
            'B': '重要な基本問題です。テキストを見直し、基礎知識を固めましょう。',
            'C': '標準的な問題です。過去問を多く解いて慣れることが重要です。',
            'D': '参考問題ですが、知識の幅を広げるために復習をお勧めします。'
        };

        return suggestions[rank] || '復習をお勧めします。';
    }

    /**
     * スコア履歴を保存（ローカルストレージ）
     */
    saveScoreHistory() {
        if (!this.results) return;

        try {
            const history = this.getScoreHistory();
            const newRecord = {
                date: this.examEndTime.toISOString(),
                score: this.results.score,
                passed: this.results.passed,
                correctAnswers: this.results.correctAnswers,
                totalQuestions: this.results.totalQuestions,
                timeUsed: this.results.timeUsed
            };

            history.push(newRecord);

            // 最新20件のみ保持
            if (history.length > 20) {
                history.splice(0, history.length - 20);
            }

            localStorage.setItem('exam_score_history', JSON.stringify(history));
            console.log('Score history saved');
        } catch (error) {
            console.error('Failed to save score history:', error);
        }
    }

    /**
     * スコア履歴を取得
     * @returns {Array} スコア履歴
     */
    getScoreHistory() {
        try {
            const data = localStorage.getItem('exam_score_history');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load score history:', error);
            return [];
        }
    }

    /**
     * 結果をリセット
     */
    reset() {
        this.questions = [];
        this.answers = {};
        this.results = null;
        this.examStartTime = null;
        this.examEndTime = null;
    }
}