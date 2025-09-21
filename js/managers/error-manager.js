import { EXAM_CONFIG } from '../config/exam-config.js';
import { FormatUtil } from '../utils/format-util.js';

// エラー処理を一元管理するクラス
export class ErrorManager {
    constructor() {
        this.errorLog = [];
        this.isDebugMode = EXAM_CONFIG.DEBUG.ENABLE_LOGGING;
        this.errorCallbacks = new Map();

        // グローバルエラーハンドラーを設定
        this.setupGlobalErrorHandlers();
    }

    /**
     * グローバルエラーハンドラーを設定
     */
    setupGlobalErrorHandlers() {
        // JavaScript エラー
        window.addEventListener('error', (event) => {
            this.handleError('JavaScriptError', event.error || new Error(event.message), {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Promise の未処理拒否
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('UnhandledPromiseRejection', event.reason, {
                promise: event.promise
            });
        });

        // ネットワークエラー
        window.addEventListener('offline', () => {
            this.handleError('NetworkError', new Error('Network connection lost'), {
                type: 'offline'
            });
        });

        console.log('Global error handlers initialized');
    }

    /**
     * エラーを処理
     * @param {string} type - エラータイプ
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - 追加コンテキスト
     */
    handleError(type, error, context = {}) {
        const errorInfo = {
            type,
            message: error.message || error.toString(),
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // エラーログに記録
        this.logError(errorInfo);

        // エラータイプ別の処理
        this.processErrorByType(type, error, context);

        // 登録されたコールバックを実行
        this.executeCallbacks(type, errorInfo);
    }

    /**
     * エラーをログに記録
     * @param {Object} errorInfo - エラー情報
     */
    logError(errorInfo) {
        this.errorLog.push(errorInfo);

        // 最新100件のみ保持
        if (this.errorLog.length > 100) {
            this.errorLog.shift();
        }

        // デバッグモードでコンソール出力
        if (this.isDebugMode) {
            console.error('Error logged:', errorInfo);
        }

        // ローカルストレージに保存（デバッグ用）
        try {
            if (this.isDebugMode) {
                localStorage.setItem('exam_error_log', JSON.stringify(this.errorLog));
            }
        } catch (e) {
            console.warn('Failed to save error log to localStorage:', e);
        }
    }

    /**
     * エラータイプ別の処理
     * @param {string} type - エラータイプ
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    processErrorByType(type, error, context) {
        switch (type) {
            case 'QuestionLoadError':
                this.handleQuestionLoadError(error, context);
                break;

            case 'StorageError':
                this.handleStorageError(error, context);
                break;

            case 'TimerError':
                this.handleTimerError(error, context);
                break;

            case 'RenderError':
                this.handleRenderError(error, context);
                break;

            case 'NetworkError':
                this.handleNetworkError(error, context);
                break;

            case 'ValidationError':
                this.handleValidationError(error, context);
                break;

            default:
                this.handleGenericError(error, context);
                break;
        }
    }

    /**
     * 問題読み込みエラーの処理
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    handleQuestionLoadError(error, context) {
        console.error('Question load error:', error);

        this.showUserError(
            EXAM_CONFIG.MESSAGES.ERROR_QUESTION_LOAD,
            'error',
            {
                action: 'reload',
                actionText: 'ページを再読み込み',
                actionCallback: () => window.location.reload()
            }
        );
    }

    /**
     * ストレージエラーの処理
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    handleStorageError(error, context) {
        console.error('Storage error:', error);

        this.showUserError(
            'データの保存に失敗しました。ブラウザの設定を確認してください。',
            'warning',
            {
                action: 'continue',
                actionText: '続行',
                actionCallback: () => {
                    // ストレージを使わずに続行
                    this.executeCallbacks('storage_fallback', { error, context });
                }
            }
        );
    }

    /**
     * タイマーエラーの処理
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    handleTimerError(error, context) {
        console.error('Timer error:', error);

        this.showUserError(
            'タイマーに問題が発生しました。手動で時間を管理してください。',
            'warning'
        );
    }

    /**
     * 描画エラーの処理
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    handleRenderError(error, context) {
        console.error('Render error:', error);

        this.showUserError(
            EXAM_CONFIG.MESSAGES.ERROR_DISPLAY,
            'error',
            {
                action: 'retry',
                actionText: '再試行',
                actionCallback: () => {
                    this.executeCallbacks('render_retry', { error, context });
                }
            }
        );
    }

    /**
     * ネットワークエラーの処理
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    handleNetworkError(error, context) {
        console.error('Network error:', error);

        if (context.type === 'offline') {
            this.showUserError(
                'ネットワーク接続が失われました。オフラインモードで継続します。',
                'warning'
            );
        } else {
            this.showUserError(
                'ネットワークエラーが発生しました。接続を確認してください。',
                'warning'
            );
        }
    }

    /**
     * バリデーションエラーの処理
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    handleValidationError(error, context) {
        console.error('Validation error:', error);

        this.showUserError(
            `入力データに問題があります: ${error.message}`,
            'warning'
        );
    }

    /**
     * 一般的なエラーの処理
     * @param {Error} error - エラーオブジェクト
     * @param {Object} context - コンテキスト
     */
    handleGenericError(error, context) {
        console.error('Generic error:', error);

        const userMessage = FormatUtil.formatErrorMessage(error);
        this.showUserError(userMessage, 'error');
    }

    /**
     * ユーザーにエラーを表示
     * @param {string} message - エラーメッセージ
     * @param {string} severity - 重要度 (error, warning, info)
     * @param {Object} action - アクション設定
     */
    showUserError(message, severity = 'error', action = null) {
        // 既存のエラー表示を削除
        const existingError = document.querySelector('.error-notification');
        if (existingError) {
            existingError.remove();
        }

        // エラー通知を作成
        const notification = document.createElement('div');
        notification.className = `error-notification severity-${severity}`;

        const iconMap = {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        let actionHtml = '';
        if (action) {
            actionHtml = `
                <button class="error-action-btn" data-action="${action.action}">
                    ${action.actionText}
                </button>
            `;
        }

        notification.innerHTML = `
            <div class="error-notification-content">
                <div class="error-header">
                    <span class="error-icon">${iconMap[severity]}</span>
                    <span class="error-title">${severity.toUpperCase()}</span>
                    <button class="error-close-btn">×</button>
                </div>
                <div class="error-message">${message}</div>
                ${actionHtml}
            </div>
        `;

        // イベントリスナーを設定
        notification.querySelector('.error-close-btn').addEventListener('click', () => {
            notification.remove();
        });

        if (action && action.actionCallback) {
            notification.querySelector('.error-action-btn').addEventListener('click', () => {
                action.actionCallback();
                notification.remove();
            });
        }

        // ページに追加
        document.body.insertBefore(notification, document.body.firstChild);

        // 自動削除（重要度によって時間を変える）
        const autoRemoveTime = severity === 'error' ? 10000 : 5000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, autoRemoveTime);
    }

    /**
     * エラーコールバックを登録
     * @param {string} type - エラータイプ
     * @param {Function} callback - コールバック関数
     */
    onError(type, callback) {
        if (!this.errorCallbacks.has(type)) {
            this.errorCallbacks.set(type, []);
        }
        this.errorCallbacks.get(type).push(callback);
    }

    /**
     * 登録されたコールバックを実行
     * @param {string} type - エラータイプ
     * @param {Object} errorInfo - エラー情報
     */
    executeCallbacks(type, errorInfo) {
        const callbacks = this.errorCallbacks.get(type);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(errorInfo);
                } catch (e) {
                    console.error('Error in error callback:', e);
                }
            });
        }
    }

    /**
     * エラーレポートを生成
     * @returns {Object} エラーレポート
     */
    generateErrorReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalErrors: this.errorLog.length,
            errorsByType: {},
            recentErrors: this.errorLog.slice(-10), // 最新10件
            systemInfo: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            }
        };

        // エラータイプ別の集計
        this.errorLog.forEach(error => {
            const type = error.type;
            if (!report.errorsByType[type]) {
                report.errorsByType[type] = 0;
            }
            report.errorsByType[type]++;
        });

        return report;
    }

    /**
     * エラーログをクリア
     */
    clearErrorLog() {
        this.errorLog = [];
        if (this.isDebugMode) {
            localStorage.removeItem('exam_error_log');
        }
        console.log('Error log cleared');
    }

    /**
     * エラーログをエクスポート
     * @returns {string} JSON形式のエラーログ
     */
    exportErrorLog() {
        const report = this.generateErrorReport();
        return JSON.stringify(report, null, 2);
    }

    /**
     * 復旧アクション
     * @param {string} actionType - アクションタイプ
     */
    performRecoveryAction(actionType) {
        switch (actionType) {
            case 'reload':
                window.location.reload();
                break;

            case 'clear_storage':
                this.clearStorageAndReload();
                break;

            case 'reset_exam':
                this.executeCallbacks('reset_exam', {});
                break;

            default:
                console.warn('Unknown recovery action:', actionType);
                break;
        }
    }

    /**
     * ストレージをクリアしてリロード
     */
    clearStorageAndReload() {
        try {
            sessionStorage.clear();
            localStorage.removeItem('exam_error_log');
            window.location.reload();
        } catch (e) {
            console.error('Failed to clear storage:', e);
            window.location.reload();
        }
    }

    /**
     * リソースをクリーンアップ
     */
    cleanup() {
        this.errorCallbacks.clear();

        // グローバルハンドラーの削除は行わない（他の部分で使用される可能性があるため）
        console.log('ErrorManager cleaned up');
    }
}