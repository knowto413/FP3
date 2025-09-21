// 試験システムの設定を一元管理
export const EXAM_CONFIG = {
    // 基本設定
    TIME_LIMIT: 30 * 60, // 30分（秒）
    QUESTIONS_COUNT: 20, // 問題数
    PASSING_SCORE: 0.6, // 合格ライン（60%）

    // ランク別出題比率
    RANK_WEIGHTS: {
        'A': 0.10, // 10%
        'B': 0.25, // 25%
        'C': 0.35, // 35%
        'D': 0.30  // 30%
    },

    // UI設定
    UI: {
        AUTO_SAVE_INTERVAL: 1000, // 自動保存間隔（ms）
        TIMER_UPDATE_INTERVAL: 1000, // タイマー更新間隔（ms）
        WARNING_TIME: 5 * 60, // 警告時間（5分）
        DANGER_TIME: 1 * 60   // 危険時間（1分）
    },

    // デバッグ設定
    DEBUG: {
        ENABLE_LOGGING: true,
        MOCK_DATA: false,
        SKIP_TIMER: false
    },

    // ストレージキー
    STORAGE_KEYS: {
        ANSWERS: 'exam_answers',
        START_TIME: 'exam_start_time',
        CURRENT_QUESTION: 'current_question_index',
        EXAM_DATA: 'exam_data'
    },

    // メッセージ
    MESSAGES: {
        CONFIRM_FINISH: '試験を終了して採点しますか？',
        CONFIRM_FINISH_WITH_UNANSWERED: '未解答の問題が{count}問あります。試験を終了しますか？',
        TIME_UP: '制限時間に達しました。試験を終了します。',
        ERROR_QUESTION_LOAD: '問題の読み込みに失敗しました。ページを再読み込みしてください。',
        ERROR_DISPLAY: '画面の表示に失敗しました。ページを再読み込みしてください。'
    }
};