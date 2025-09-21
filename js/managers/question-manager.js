import { EXAM_CONFIG } from '../config/exam-config.js';
import { ShuffleUtil } from '../utils/shuffle-util.js';

// 問題管理を担当するクラス
export class QuestionManager {
    constructor() {
        this.allQuestions = [];
        this.extendedQuestions = [];
        this.extendedQuestions2025 = [];
        this.rankedQuestions = [];
        this.selectedQuestions = [];
        this.currentRankFilter = 'ALL';
    }

    /**
     * 全ての問題データを読み込み
     */
    async loadAllQuestions() {
        try {
            // グローバル変数から問題データを取得
            this.extendedQuestions = window.extendedQuestions || [];
            this.extendedQuestions2025 = window.extendedQuestions2025 || [];
            this.rankedQuestions = window.rankedQuestions || [];

            // 全問題を統合
            this.allQuestions = [
                ...this.extendedQuestions,
                ...this.extendedQuestions2025,
                ...this.rankedQuestions
            ];

            console.log(`Total questions loaded: ${this.allQuestions.length}`);
            return this.allQuestions;
        } catch (error) {
            console.error('Failed to load questions:', error);
            throw new Error('QuestionLoadError');
        }
    }

    /**
     * ランクフィルターを設定
     * @param {string} rank - フィルターするランク（A, B, C, D, ALL）
     */
    setRankFilter(rank) {
        this.currentRankFilter = rank;
    }

    /**
     * 現在のフィルターに基づいて問題を取得
     * @returns {Array} フィルターされた問題配列
     */
    getFilteredQuestions() {
        if (this.currentRankFilter === 'ALL') {
            return this.allQuestions;
        }
        return this.allQuestions.filter(q => q.rank === this.currentRankFilter);
    }

    /**
     * 重み付きランダム選択で問題を生成
     * @param {number} count - 生成する問題数
     * @returns {Array} 選択された問題配列
     */
    generateWeightedRandomQuestions(count = EXAM_CONFIG.QUESTIONS_COUNT) {
        const filteredQuestions = this.getFilteredQuestions();

        if (filteredQuestions.length === 0) {
            throw new Error('No questions available for the selected filter');
        }

        // ランク別に問題を分類
        const questionsByRank = this.groupQuestionsByRank(filteredQuestions);

        // ランク別に必要な問題数を計算
        const requiredCounts = this.calculateRankCounts(count);

        let selected = [];

        // 各ランクから必要数を選択
        Object.entries(requiredCounts).forEach(([rank, neededCount]) => {
            const rankQuestions = questionsByRank[rank] || [];
            if (rankQuestions.length > 0) {
                const selectedFromRank = ShuffleUtil.randomSelect(rankQuestions, neededCount);
                selected.push(...selectedFromRank);
            }
        });

        // 不足分を補完
        selected = this.fillRemainingQuestions(selected, filteredQuestions, count);

        // 最終的にシャッフル
        this.selectedQuestions = ShuffleUtil.enhancedShuffle(selected);

        console.log(`Generated ${this.selectedQuestions.length} questions`);
        this.logRankDistribution();

        return this.selectedQuestions;
    }

    /**
     * 問題をランク別にグループ化
     * @param {Array} questions - 問題配列
     * @returns {Object} ランク別問題オブジェクト
     */
    groupQuestionsByRank(questions) {
        return questions.reduce((groups, question) => {
            const rank = question.rank || 'D';
            if (!groups[rank]) {
                groups[rank] = [];
            }
            groups[rank].push(question);
            return groups;
        }, {});
    }

    /**
     * ランク別必要問題数を計算
     * @param {number} totalCount - 総問題数
     * @returns {Object} ランク別問題数
     */
    calculateRankCounts(totalCount) {
        const weights = EXAM_CONFIG.RANK_WEIGHTS;
        return {
            'A': Math.round(totalCount * weights.A),
            'B': Math.round(totalCount * weights.B),
            'C': Math.round(totalCount * weights.C),
            'D': Math.round(totalCount * weights.D)
        };
    }

    /**
     * 不足分の問題を補完
     * @param {Array} selected - 既に選択された問題
     * @param {Array} allQuestions - 全問題
     * @param {number} targetCount - 目標問題数
     * @returns {Array} 補完された問題配列
     */
    fillRemainingQuestions(selected, allQuestions, targetCount) {
        if (selected.length >= targetCount) {
            return selected.slice(0, targetCount);
        }

        const selectedIds = new Set(selected.map(q => q.id));
        const remaining = allQuestions.filter(q => !selectedIds.has(q.id));

        const needed = targetCount - selected.length;
        const additional = ShuffleUtil.randomSelect(remaining, needed);

        return [...selected, ...additional];
    }

    /**
     * ランク分布をログ出力
     */
    logRankDistribution() {
        const distribution = this.selectedQuestions.reduce((dist, question) => {
            const rank = question.rank || 'D';
            dist[rank] = (dist[rank] || 0) + 1;
            return dist;
        }, {});

        console.log('Question rank distribution:', distribution);
    }

    /**
     * 問題を検索
     * @param {string} query - 検索クエリ
     * @param {Array} questions - 検索対象の問題配列
     * @returns {Array} 検索結果
     */
    searchQuestions(query, questions = this.allQuestions) {
        if (!query || query.trim() === '') {
            return questions;
        }

        const searchTerm = query.toLowerCase().trim();
        return questions.filter(question => {
            return question.statement.toLowerCase().includes(searchTerm) ||
                   question.choices.some(choice =>
                       choice.text.toLowerCase().includes(searchTerm)
                   );
        });
    }

    /**
     * 問題の統計情報を取得
     * @returns {Object} 統計情報
     */
    getStatistics() {
        const total = this.allQuestions.length;
        const byRank = this.groupQuestionsByRank(this.allQuestions);

        const rankStats = Object.entries(byRank).reduce((stats, [rank, questions]) => {
            stats[rank] = {
                count: questions.length,
                percentage: ((questions.length / total) * 100).toFixed(1)
            };
            return stats;
        }, {});

        return {
            total,
            bySource: {
                extended: this.extendedQuestions.length,
                extended2025: this.extendedQuestions2025.length,
                ranked: this.rankedQuestions.length
            },
            byRank: rankStats,
            averageChoices: this.calculateAverageChoices()
        };
    }

    /**
     * 平均選択肢数を計算
     * @returns {number} 平均選択肢数
     */
    calculateAverageChoices() {
        if (this.allQuestions.length === 0) return 0;

        const totalChoices = this.allQuestions.reduce((sum, question) => {
            return sum + (question.choices ? question.choices.length : 0);
        }, 0);

        return (totalChoices / this.allQuestions.length).toFixed(1);
    }

    /**
     * 問題の妥当性をチェック
     * @param {Object} question - チェックする問題
     * @returns {Object} バリデーション結果
     */
    validateQuestion(question) {
        const errors = [];

        if (!question.id) errors.push('ID is missing');
        if (!question.statement || question.statement.trim() === '') {
            errors.push('Statement is empty');
        }
        if (!question.choices || !Array.isArray(question.choices)) {
            errors.push('Choices is not an array');
        } else {
            if (question.choices.length < 2) {
                errors.push('Insufficient choices (minimum 2)');
            }
            question.choices.forEach((choice, index) => {
                if (!choice.text || choice.text.trim() === '') {
                    errors.push(`Choice ${index + 1} text is empty`);
                }
                if (typeof choice.id !== 'number') {
                    errors.push(`Choice ${index + 1} ID is not a number`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 全問題の妥当性をチェック
     * @returns {Object} 全体のバリデーション結果
     */
    validateAllQuestions() {
        const results = {
            valid: 0,
            invalid: 0,
            errors: []
        };

        this.allQuestions.forEach((question, index) => {
            const validation = this.validateQuestion(question);
            if (validation.isValid) {
                results.valid++;
            } else {
                results.invalid++;
                results.errors.push({
                    questionIndex: index,
                    questionId: question.id,
                    errors: validation.errors
                });
            }
        });

        return results;
    }
}