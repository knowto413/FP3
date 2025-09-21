import { EXAM_CONFIG } from '../config/exam-config.js';
import { FormatUtil } from '../utils/format-util.js';

// タイマー管理を担当するクラス
export class TimerManager {
    constructor() {
        this.startTime = null;
        this.endTime = null;
        this.timeLimit = EXAM_CONFIG.TIME_LIMIT;
        this.timerInterval = null;
        this.isRunning = false;
        this.isPaused = false;
        this.pausedTime = 0;

        // DOM要素
        this.timerElement = null;

        // コールバック関数
        this.onTimeUpdate = null;
        this.onTimeWarning = null;
        this.onTimeUp = null;
    }

    /**
     * タイマーを初期化
     * @param {HTMLElement} timerElement - タイマー表示要素
     * @param {Object} callbacks - コールバック関数
     */
    initialize(timerElement, callbacks = {}) {
        this.timerElement = timerElement;
        this.onTimeUpdate = callbacks.onTimeUpdate;
        this.onTimeWarning = callbacks.onTimeWarning;
        this.onTimeUp = callbacks.onTimeUp;

        // デバッグモードでタイマーをスキップ
        if (EXAM_CONFIG.DEBUG.SKIP_TIMER) {
            console.log('Timer skipped (debug mode)');
            return;
        }
    }

    /**
     * タイマーを開始
     * @param {Date} startTime - 開始時刻（継続の場合）
     */
    start(startTime = null) {
        if (this.isRunning) {
            console.warn('Timer is already running');
            return;
        }

        this.startTime = startTime || new Date();
        this.isRunning = true;
        this.isPaused = false;

        console.log('Timer started at:', this.startTime);

        // タイマー更新を開始
        this.startTimerUpdate();
    }

    /**
     * タイマーを停止
     */
    stop() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.endTime = new Date();

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        console.log('Timer stopped at:', this.endTime);
    }

    /**
     * タイマーを一時停止
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.pausedTime = this.getElapsedTime();

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        console.log('Timer paused at:', this.pausedTime, 'seconds');
    }

    /**
     * タイマーを再開
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return;

        this.isPaused = false;

        // 開始時刻を調整して一時停止時間を除外
        const pauseDuration = this.getElapsedTime() - this.pausedTime;
        this.startTime = new Date(this.startTime.getTime() + pauseDuration * 1000);

        this.startTimerUpdate();
        console.log('Timer resumed');
    }

    /**
     * タイマー更新を開始
     */
    startTimerUpdate() {
        this.updateDisplay();

        this.timerInterval = setInterval(() => {
            this.updateDisplay();
            this.checkTimeStatus();
        }, EXAM_CONFIG.UI.TIMER_UPDATE_INTERVAL);
    }

    /**
     * タイマー表示を更新
     */
    updateDisplay() {
        if (!this.timerElement || !this.isRunning) return;

        const remaining = this.getRemainingTime();
        const formattedTime = FormatUtil.formatTime(remaining);

        this.timerElement.textContent = formattedTime;

        // 時間の状態に応じてクラスを更新
        this.updateTimerClass(remaining);

        // コールバック実行
        if (this.onTimeUpdate) {
            this.onTimeUpdate(remaining, formattedTime);
        }
    }

    /**
     * タイマーのCSSクラスを更新
     * @param {number} remaining - 残り時間（秒）
     */
    updateTimerClass(remaining) {
        if (!this.timerElement) return;

        this.timerElement.classList.remove('warning', 'danger');

        if (remaining <= EXAM_CONFIG.UI.DANGER_TIME) {
            this.timerElement.classList.add('danger');
        } else if (remaining <= EXAM_CONFIG.UI.WARNING_TIME) {
            this.timerElement.classList.add('warning');
        }
    }

    /**
     * 時間の状態をチェック
     */
    checkTimeStatus() {
        const remaining = this.getRemainingTime();

        // 警告時間に達した場合
        if (remaining === EXAM_CONFIG.UI.WARNING_TIME && this.onTimeWarning) {
            this.onTimeWarning(remaining);
        }

        // 時間切れの場合
        if (remaining <= 0) {
            this.handleTimeUp();
        }
    }

    /**
     * 時間切れの処理
     */
    handleTimeUp() {
        this.stop();

        if (this.timerElement) {
            this.timerElement.textContent = '00:00';
            this.timerElement.classList.add('danger');
        }

        console.log('Time up!');

        if (this.onTimeUp) {
            this.onTimeUp();
        }
    }

    /**
     * 経過時間を取得（秒）
     * @returns {number} 経過時間
     */
    getElapsedTime() {
        if (!this.startTime) return 0;

        const now = this.endTime || new Date();
        return Math.floor((now - this.startTime) / 1000);
    }

    /**
     * 残り時間を取得（秒）
     * @returns {number} 残り時間
     */
    getRemainingTime() {
        if (!this.isRunning) return 0;

        const elapsed = this.getElapsedTime();
        const remaining = Math.max(0, this.timeLimit - elapsed);
        return remaining;
    }

    /**
     * 制限時間を設定
     * @param {number} timeLimit - 制限時間（秒）
     */
    setTimeLimit(timeLimit) {
        this.timeLimit = timeLimit;
        console.log('Time limit set to:', timeLimit, 'seconds');
    }

    /**
     * タイマーの状態を取得
     * @returns {Object} タイマー状態
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            startTime: this.startTime,
            endTime: this.endTime,
            elapsedTime: this.getElapsedTime(),
            remainingTime: this.getRemainingTime(),
            timeLimit: this.timeLimit,
            progress: this.getProgress()
        };
    }

    /**
     * 進捗率を取得（0-1）
     * @returns {number} 進捗率
     */
    getProgress() {
        if (this.timeLimit === 0) return 1;
        return Math.min(1, this.getElapsedTime() / this.timeLimit);
    }

    /**
     * 時間延長
     * @param {number} additionalTime - 追加時間（秒）
     */
    extendTime(additionalTime) {
        this.timeLimit += additionalTime;
        console.log(`Time extended by ${additionalTime} seconds. New limit: ${this.timeLimit}`);
    }

    /**
     * タイマーをリセット
     */
    reset() {
        this.stop();
        this.startTime = null;
        this.endTime = null;
        this.pausedTime = 0;
        this.timeLimit = EXAM_CONFIG.TIME_LIMIT;

        if (this.timerElement) {
            this.timerElement.textContent = FormatUtil.formatTime(this.timeLimit);
            this.timerElement.classList.remove('warning', 'danger');
        }

        console.log('Timer reset');
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        this.stop();
        this.timerElement = null;
        this.onTimeUpdate = null;
        this.onTimeWarning = null;
        this.onTimeUp = null;
    }
}