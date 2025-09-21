// フォーマット関連のユーティリティ関数
export class FormatUtil {
    /**
     * 秒数を MM:SS 形式にフォーマット
     * @param {number} seconds - 秒数
     * @returns {string} フォーマットされた時間文字列
     */
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * スコアをパーセント形式にフォーマット
     * @param {number} score - スコア（0-1）
     * @param {number} precision - 小数点以下の桁数
     * @returns {string} フォーマットされたスコア文字列
     */
    static formatScore(score, precision = 1) {
        return `${(score * 100).toFixed(precision)}%`;
    }

    /**
     * 問題文のHTMLを安全にサニタイズ
     * @param {string} html - HTMLテキスト
     * @returns {string} サニタイズされたHTML
     */
    static sanitizeHTML(html) {
        // 基本的なHTMLサニタイゼーション
        return html
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // script タグを削除
            .replace(/javascript:/gi, '') // javascript: プロトコルを削除
            .replace(/on\w+\s*=/gi, ''); // イベントハンドラを削除
    }

    /**
     * 問題番号をフォーマット
     * @param {number} current - 現在の問題番号
     * @param {number} total - 総問題数
     * @returns {string} フォーマットされた問題番号
     */
    static formatQuestionNumber(current, total) {
        return `問${current} / ${total}`;
    }

    /**
     * ランク情報をアイコン付きでフォーマット
     * @param {string} rank - ランク（A, B, C, D）
     * @returns {string} フォーマットされたランク表示
     */
    static formatRank(rank) {
        const rankIcons = {
            'A': '🔥',
            'B': '⭐',
            'C': '📝',
            'D': '📚'
        };

        const rankDescriptions = {
            'A': '最重要（頻出・難問）',
            'B': '重要（頻出）',
            'C': '標準（基本問題）',
            'D': '参考（補助問題）'
        };

        const icon = rankIcons[rank] || '📝';
        const description = rankDescriptions[rank] || '標準問題';

        return {
            icon,
            text: `${rank}ランク`,
            description
        };
    }

    /**
     * エラーメッセージをユーザーフレンドリーにフォーマット
     * @param {Error} error - エラーオブジェクト
     * @returns {string} ユーザー向けエラーメッセージ
     */
    static formatErrorMessage(error) {
        const userFriendlyMessages = {
            'NetworkError': 'ネットワーク接続に問題があります。',
            'QuestionLoadError': '問題の読み込みに失敗しました。',
            'StorageError': 'データの保存に失敗しました。',
            'TimerError': 'タイマーに問題が発生しました。',
            'RenderError': '画面の表示に問題が発生しました。'
        };

        return userFriendlyMessages[error.name] ||
               '予期しないエラーが発生しました。ページを再読み込みしてください。';
    }

    /**
     * 選択肢テキストをフォーマット
     * @param {string} text - 選択肢テキスト
     * @param {number} index - 選択肢のインデックス
     * @returns {string} フォーマットされた選択肢テキスト
     */
    static formatChoiceText(text, index) {
        const markers = ['①', '②', '③', '④', '⑤'];
        const marker = markers[index] || `${index + 1}）`;

        // 既存のマーカーを削除してから新しいマーカーを追加
        const cleanText = text.replace(/^[①②③④⑤\d]+[）)]?\s*/, '');
        return `${marker} ${cleanText}`;
    }

    /**
     * 試験結果のサマリーをフォーマット
     * @param {Object} results - 試験結果オブジェクト
     * @returns {Object} フォーマットされた結果
     */
    static formatExamSummary(results) {
        const { score, totalQuestions, correctAnswers, timeUsed, passed } = results;

        return {
            scoreText: this.formatScore(score),
            resultText: `${correctAnswers}問正解 / ${totalQuestions}問中`,
            timeText: this.formatTime(timeUsed),
            statusText: passed ? '合格' : '不合格',
            statusClass: passed ? 'pass' : 'fail'
        };
    }
}