// リファクタリングされた試験システムのメインクラス
import { EXAM_CONFIG } from './config/exam-config.js';
import { QuestionManager } from './managers/question-manager.js';
import { TimerManager } from './managers/timer-manager.js';
import { UIRenderer } from './managers/ui-renderer.js';
import { ScoreManager } from './managers/score-manager.js';
import { StorageManager } from './managers/storage-manager.js';
import { ErrorManager } from './managers/error-manager.js';

export class ExamSystem {
    constructor() {
        // 各マネージャーを初期化
        this.questionManager = new QuestionManager();
        this.timerManager = new TimerManager();
        this.uiRenderer = new UIRenderer();
        this.scoreManager = new ScoreManager();
        this.storageManager = new StorageManager();
        this.errorManager = new ErrorManager();

        // 試験状態
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.isExamStarted = false;
        this.isExamFinished = false;
        this.selectedQuestions = [];

        // 自動保存タイマー
        this.autoSaveInterval = null;

        console.log('ExamSystem initialized');
    }

    /**
     * システムを初期化
     */
    async initialize() {
        try {
            console.log('Initializing ExamSystem...');

            // エラーハンドリングの設定
            this.setupErrorHandlers();

            // UIを初期化
            this.uiRenderer.initialize();

            // UI要素に問題ID取得関数を設定
            this.uiRenderer.setQuestionIdGetter((index) => {
                return this.selectedQuestions[index]?.id || null;
            });

            // 問題データを読み込み
            await this.questionManager.loadAllQuestions();

            // 継続可能な試験があるかチェック
            if (this.storageManager.canResumeExam()) {
                await this.resumeExam();
            } else {
                // 新しい試験を準備
                this.prepareNewExam();
            }

            // イベントリスナーを設定
            this.setupEventListeners();

            console.log('ExamSystem initialization completed');
        } catch (error) {
            this.errorManager.handleError('SystemInitializationError', error);
        }
    }

    /**
     * エラーハンドラーを設定
     */
    setupErrorHandlers() {
        // 各マネージャーのエラーを処理
        this.errorManager.onError('render_retry', () => {
            this.renderCurrentQuestion();
        });

        this.errorManager.onError('storage_fallback', () => {
            console.warn('Storage fallback activated - continuing without persistence');
        });

        this.errorManager.onError('reset_exam', () => {
            this.resetExam();
        });
    }

    /**
     * 新しい試験を準備
     */
    prepareNewExam() {
        try {
            console.log('Preparing new exam...');

            // 問題を生成
            this.selectedQuestions = this.questionManager.generateWeightedRandomQuestions();

            // ランクフィルターボタンを表示
            this.uiRenderer.renderRankFilter(this.questionManager.currentRankFilter);

            // 初期状態を設定
            this.currentQuestionIndex = 0;
            this.answers = {};
            this.isExamStarted = false;
            this.isExamFinished = false;

            console.log('New exam prepared with', this.selectedQuestions.length, 'questions');
        } catch (error) {
            this.errorManager.handleError('ExamPreparationError', error);
        }
    }

    /**
     * 試験を再開
     */
    async resumeExam() {
        try {
            console.log('Resuming exam...');

            const examData = this.storageManager.loadExamData();
            const savedAnswers = this.storageManager.loadAnswers();
            const savedQuestionIndex = this.storageManager.loadCurrentQuestion();

            if (examData && examData.questions) {
                this.selectedQuestions = examData.questions;
                this.answers = savedAnswers;
                this.currentQuestionIndex = savedQuestionIndex;
                this.isExamStarted = true;

                // タイマーを開始（継続）
                this.startTimer(examData.startTime);

                // 自動保存を開始
                this.startAutoSave();

                // 現在の問題を表示
                this.renderCurrentQuestion();

                console.log('Exam resumed successfully');
            } else {
                console.log('No valid exam data found, preparing new exam');
                this.prepareNewExam();
            }
        } catch (error) {
            this.errorManager.handleError('ExamResumeError', error);
            this.prepareNewExam();
        }
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 回答選択イベント
        document.addEventListener('answerSelected', (event) => {
            this.handleAnswerSelection(event.detail.questionId, event.detail.choiceId);
        });

        // ナビゲーションクリックイベント
        document.addEventListener('navigationClicked', (event) => {
            this.navigateToQuestion(event.detail.index);
        });

        // ランクフィルター変更イベント
        document.addEventListener('rankFilterChanged', (event) => {
            this.handleRankFilterChange(event.detail.rank);
        });

        // コントロールボタン（デスクトップ）
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const finishBtn = document.getElementById('finishBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.showFinishConfirmation());
        }

        // スマホ用コントロールボタン
        const prevBtnMobile = document.getElementById('prevBtnMobile');
        const nextBtnMobile = document.getElementById('nextBtnMobile');
        const finishBtnMobile = document.getElementById('finishBtnMobile');

        if (prevBtnMobile) {
            prevBtnMobile.addEventListener('click', () => this.previousQuestion());
        }

        if (nextBtnMobile) {
            nextBtnMobile.addEventListener('click', () => this.nextQuestion());
        }

        if (finishBtnMobile) {
            finishBtnMobile.addEventListener('click', () => this.showFinishConfirmation());
        }

        console.log('Event listeners set up');
    }

    /**
     * 試験を開始
     */
    startExam() {
        if (this.isExamStarted) {
            console.warn('Exam already started');
            return;
        }

        try {
            console.log('Starting exam...');

            this.isExamStarted = true;
            const startTime = new Date();

            // 試験データを保存
            this.storageManager.saveExamData({
                questions: this.selectedQuestions,
                startTime: startTime,
                timeLimit: EXAM_CONFIG.TIME_LIMIT
            });

            // タイマーを開始
            this.startTimer(startTime);

            // 自動保存を開始
            this.startAutoSave();

            // 最初の問題を表示
            this.renderCurrentQuestion();

            console.log('Exam started successfully');
        } catch (error) {
            this.errorManager.handleError('ExamStartError', error);
        }
    }

    /**
     * タイマーを開始
     * @param {Date} startTime - 開始時刻
     */
    startTimer(startTime) {
        const timerElement = document.getElementById('timer');

        this.timerManager.initialize(timerElement, {
            onTimeUpdate: (remaining, formattedTime) => {
                // 必要に応じて追加の更新処理
            },
            onTimeWarning: (remaining) => {
                console.log('Time warning:', remaining, 'seconds remaining');
            },
            onTimeUp: () => {
                this.handleTimeUp();
            }
        });

        this.timerManager.start(startTime);
    }

    /**
     * 自動保存を開始
     */
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
        }, EXAM_CONFIG.UI.AUTO_SAVE_INTERVAL);
    }

    /**
     * 進捗を保存
     */
    saveProgress() {
        try {
            this.storageManager.saveAnswers(this.answers);
            this.storageManager.saveCurrentQuestion(this.currentQuestionIndex);
        } catch (error) {
            this.errorManager.handleError('StorageError', error);
        }
    }

    /**
     * 現在の問題を描画
     */
    renderCurrentQuestion() {
        if (!this.selectedQuestions || this.selectedQuestions.length === 0) {
            this.errorManager.handleError('RenderError', new Error('No questions available'));
            return;
        }

        try {
            const question = this.selectedQuestions[this.currentQuestionIndex];

            this.uiRenderer.renderQuestion(
                question,
                this.currentQuestionIndex,
                this.selectedQuestions.length,
                this.answers
            );

            this.uiRenderer.renderNavigation(
                this.selectedQuestions.length,
                this.currentQuestionIndex,
                this.answers
            );

            this.uiRenderer.updateControlButtons(
                this.currentQuestionIndex,
                this.selectedQuestions.length
            );

            console.log('Question rendered:', this.currentQuestionIndex + 1);
        } catch (error) {
            this.errorManager.handleError('RenderError', error);
        }
    }

    /**
     * 回答選択を処理
     * @param {number} questionId - 問題ID
     * @param {number} choiceId - 選択肢ID
     */
    handleAnswerSelection(questionId, choiceId) {
        this.answers[questionId] = choiceId;
        console.log('Answer selected:', questionId, '→', choiceId);

        // UIを更新
        this.uiRenderer.renderNavigation(
            this.selectedQuestions.length,
            this.currentQuestionIndex,
            this.answers
        );

        // 進捗を保存
        this.saveProgress();
    }

    /**
     * 指定の問題に移動
     * @param {number} index - 問題インデックス
     */
    navigateToQuestion(index) {
        if (index >= 0 && index < this.selectedQuestions.length) {
            this.currentQuestionIndex = index;
            this.renderCurrentQuestion();
            this.saveProgress();
        }
    }

    /**
     * 前の問題へ移動
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderCurrentQuestion();
            this.saveProgress();
        }
    }

    /**
     * 次の問題へ移動
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
            this.currentQuestionIndex++;
            this.renderCurrentQuestion();
            this.saveProgress();
        } else {
            this.showFinishConfirmation();
        }
    }

    /**
     * 終了確認を表示
     */
    showFinishConfirmation() {
        const unansweredCount = this.selectedQuestions.length - Object.keys(this.answers).length;

        let message;
        if (unansweredCount === 0) {
            message = EXAM_CONFIG.MESSAGES.CONFIRM_FINISH;
        } else {
            message = EXAM_CONFIG.MESSAGES.CONFIRM_FINISH_WITH_UNANSWERED
                .replace('{count}', unansweredCount);
        }

        this.uiRenderer.showModal(
            message,
            () => this.finishExam(),
            () => console.log('Finish cancelled')
        );
    }

    /**
     * 試験を終了
     */
    finishExam() {
        if (this.isExamFinished) {
            console.warn('Exam already finished');
            return;
        }

        try {
            console.log('Finishing exam...');

            this.isExamFinished = true;

            // タイマーを停止
            this.timerManager.stop();

            // 自動保存を停止
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }

            // 採点
            this.scoreManager.setExamData(
                this.selectedQuestions,
                this.answers,
                this.timerManager.startTime
            );

            const results = this.scoreManager.calculateScore();

            // スコア履歴を保存
            this.scoreManager.saveScoreHistory();

            // 結果画面に移動
            this.showResults(results);

            // 試験データをクリア
            this.storageManager.clearExamData();

            console.log('Exam finished successfully');
        } catch (error) {
            this.errorManager.handleError('ExamFinishError', error);
        }
    }

    /**
     * 時間切れの処理
     */
    handleTimeUp() {
        console.log('Time up - finishing exam automatically');

        this.uiRenderer.showModal(
            EXAM_CONFIG.MESSAGES.TIME_UP,
            () => this.finishExam(),
            null // キャンセルボタンなし
        );

        // 3秒後に自動的に終了
        setTimeout(() => {
            if (!this.isExamFinished) {
                this.finishExam();
            }
        }, 3000);
    }

    /**
     * 結果を表示
     * @param {Object} results - 採点結果
     */
    showResults(results) {
        try {
            // 結果画面のURLにリダイレクト
            const resultsData = this.scoreManager.getExportData();
            sessionStorage.setItem('exam_results', JSON.stringify(resultsData));

            // 結果画面へ移動（実際のアプリケーションでは適切なURLに変更）
            window.location.href = 'results.html';
        } catch (error) {
            this.errorManager.handleError('ResultsDisplayError', error);

            // フォールバック: コンソールに結果を表示
            console.log('Exam Results:', results);
            alert(this.scoreManager.getResultMessage());
        }
    }

    /**
     * ランクフィルター変更を処理
     * @param {string} rank - 選択されたランク
     */
    handleRankFilterChange(rank) {
        if (this.isExamStarted) {
            console.warn('Cannot change filter during exam');
            return;
        }

        try {
            console.log('Rank filter changed to:', rank);

            this.questionManager.setRankFilter(rank);
            this.prepareNewExam();

            // UIを更新
            this.uiRenderer.renderRankFilter(rank);

        } catch (error) {
            this.errorManager.handleError('FilterChangeError', error);
        }
    }

    /**
     * 試験をリセット
     */
    resetExam() {
        try {
            console.log('Resetting exam...');

            // タイマーを停止
            this.timerManager.stop();

            // 自動保存を停止
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }

            // ストレージをクリア
            this.storageManager.clearExamData();

            // 状態をリセット
            this.currentQuestionIndex = 0;
            this.answers = {};
            this.isExamStarted = false;
            this.isExamFinished = false;

            // 新しい試験を準備
            this.prepareNewExam();

            console.log('Exam reset successfully');
        } catch (error) {
            this.errorManager.handleError('ResetError', error);
        }
    }

    /**
     * システム情報を取得
     * @returns {Object} システム情報
     */
    getSystemInfo() {
        return {
            isExamStarted: this.isExamStarted,
            isExamFinished: this.isExamFinished,
            currentQuestionIndex: this.currentQuestionIndex,
            totalQuestions: this.selectedQuestions.length,
            answeredQuestions: Object.keys(this.answers).length,
            timerStatus: this.timerManager.getStatus(),
            questionStats: this.questionManager.getStatistics(),
            storageInfo: this.storageManager.getStorageInfo(),
            errorLog: this.errorManager.generateErrorReport()
        };
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        console.log('Cleaning up ExamSystem...');

        // 各マネージャーをクリーンアップ
        this.timerManager.cleanup();
        this.uiRenderer.cleanup();
        this.errorManager.cleanup();

        // 自動保存を停止
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        // イベントリスナーをクリア
        document.removeEventListener('answerSelected', this.handleAnswerSelection);
        document.removeEventListener('navigationClicked', this.navigateToQuestion);
        document.removeEventListener('rankFilterChanged', this.handleRankFilterChange);

        console.log('ExamSystem cleanup completed');
    }
}

// グローバルで使用できるようにエクスポート
window.ExamSystem = ExamSystem;