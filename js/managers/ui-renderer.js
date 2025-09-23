import { FormatUtil } from '../utils/format-util.js';

// UI描画を担当するクラス
export class UIRenderer {
    constructor() {
        // DOM要素のキャッシュ
        this.elements = {};
        this.initialized = false;
    }

    /**
     * UI要素を初期化
     */
    initialize() {
        try {
            this.elements = {
                // 問題表示エリア
                questionNumber: document.getElementById('questionNumber'),
                questionText: document.getElementById('questionText'),
                questionChoices: document.getElementById('questionChoices'),
                questionArea: document.querySelector('.question-area'),

                // ナビゲーション
                questionNav: document.querySelector('.question-nav'),
                navButtons: document.querySelector('.nav-buttons'),

                // コントロール
                prevBtn: document.getElementById('prevBtn'),
                nextBtn: document.getElementById('nextBtn'),
                finishBtn: document.getElementById('finishBtn'),

                // タイマー
                timer: document.getElementById('timer'),

                // モーダル
                confirmModal: document.getElementById('confirmModal'),
                confirmMessage: document.getElementById('confirmMessage'),
                confirmYesBtn: document.getElementById('confirmYes'),
                confirmNoBtn: document.getElementById('confirmNo'),

                // ランクフィルター
                rankFilter: document.querySelector('.rank-filter'),
                rankButtons: document.querySelector('.rank-buttons')
            };

            this.validateElements();
            this.initialized = true;
            console.log('UIRenderer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UIRenderer:', error);
            throw new Error('RenderError');
        }
    }

    /**
     * 必要なDOM要素が存在するかチェック
     */
    validateElements() {
        const required = [
            'questionNumber', 'questionText', 'questionChoices',
            'prevBtn', 'nextBtn', 'finishBtn', 'timer'
        ];

        const missing = required.filter(key => !this.elements[key]);
        if (missing.length > 0) {
            throw new Error(`Required elements not found: ${missing.join(', ')}`);
        }
    }

    /**
     * 問題を描画
     * @param {Object} question - 問題オブジェクト
     * @param {number} currentIndex - 現在の問題インデックス
     * @param {number} totalQuestions - 総問題数
     * @param {Object} answers - 現在の回答状況
     */
    renderQuestion(question, currentIndex, totalQuestions, answers) {
        if (!this.initialized) {
            throw new Error('UIRenderer not initialized');
        }

        try {
            // 問題番号を表示
            this.elements.questionNumber.textContent =
                FormatUtil.formatQuestionNumber(currentIndex + 1, totalQuestions);

            // 問題文を表示（HTMLとして解釈）
            this.elements.questionText.innerHTML =
                FormatUtil.sanitizeHTML(question.statement || '問題文が設定されていません');

            // ランク表示を追加
            this.renderQuestionRank(question);

            // 選択肢を描画
            this.renderChoices(question, answers[question.id]);

            console.log('Question rendered successfully:', question.id);
        } catch (error) {
            console.error('Failed to render question:', error);
            throw new Error('RenderError');
        }
    }

    /**
     * 選択肢を描画
     * @param {Object} question - 問題オブジェクト
     * @param {number} selectedAnswerId - 選択済み回答ID
     */
    renderChoices(question, selectedAnswerId) {
        this.elements.questionChoices.innerHTML = '';

        if (!question.choices || !Array.isArray(question.choices)) {
            console.error('Invalid choices data:', question.choices);
            this.elements.questionChoices.innerHTML =
                '<p class="error-message">選択肢データに問題があります</p>';
            return;
        }

        question.choices.forEach((choice, index) => {
            const choiceDiv = this.createChoiceElement(choice, index, question.id, selectedAnswerId);
            this.elements.questionChoices.appendChild(choiceDiv);
        });
    }

    /**
     * 選択肢要素を作成
     * @param {Object} choice - 選択肢オブジェクト
     * @param {number} index - 選択肢インデックス
     * @param {number} questionId - 問題ID
     * @param {number} selectedAnswerId - 選択済み回答ID
     * @returns {HTMLElement} 選択肢要素
     */
    createChoiceElement(choice, index, questionId, selectedAnswerId) {
        const choiceDiv = document.createElement('div');
        choiceDiv.classList.add('choice');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'answer';
        radio.value = choice.id;
        radio.id = `choice_${questionId}_${choice.id}`;

        if (selectedAnswerId === choice.id) {
            radio.checked = true;
            choiceDiv.classList.add('selected');
        }

        const label = document.createElement('label');
        label.htmlFor = radio.id;
        label.innerHTML = FormatUtil.sanitizeHTML(
            FormatUtil.formatChoiceText(choice.text, index)
        );

        // クリックイベントの設定
        choiceDiv.addEventListener('click', () => {
            this.selectChoice(questionId, choice.id);
        });

        choiceDiv.appendChild(radio);
        choiceDiv.appendChild(label);

        return choiceDiv;
    }

    /**
     * 選択肢を選択
     * @param {number} questionId - 問題ID
     * @param {number} choiceId - 選択肢ID
     */
    selectChoice(questionId, choiceId) {
        // 全ての選択肢の選択状態をリセット
        this.elements.questionChoices.querySelectorAll('.choice').forEach(choice => {
            choice.classList.remove('selected');
        });

        // 選択された選択肢をハイライト
        const selectedChoice = this.elements.questionChoices.querySelector(
            `input[value="${choiceId}"]`
        ).closest('.choice');
        selectedChoice.classList.add('selected');

        // カスタムイベントを発火
        this.dispatchAnswerEvent(questionId, choiceId);
    }

    /**
     * 回答選択イベントを発火
     * @param {number} questionId - 問題ID
     * @param {number} choiceId - 選択肢ID
     */
    dispatchAnswerEvent(questionId, choiceId) {
        const event = new CustomEvent('answerSelected', {
            detail: { questionId, choiceId }
        });
        document.dispatchEvent(event);
    }

    /**
     * 問題ランクを表示
     * @param {Object} question - 問題オブジェクト
     */
    renderQuestionRank(question) {
        // 既存のランク表示を削除
        const existingRank = this.elements.questionArea.querySelector('.question-rank');
        if (existingRank) {
            existingRank.remove();
        }

        // ランク情報が存在する場合のみ表示
        if (question.rank) {
            const rankInfo = FormatUtil.formatRank(question.rank);
            const rankElement = document.createElement('div');
            rankElement.className = `question-rank rank-${question.rank}`;

            rankElement.innerHTML = `
                <span class="rank-icon">${rankInfo.icon}</span>
                <span>${rankInfo.text}</span>
                <div class="rank-tooltip">${rankInfo.description}</div>
            `;

            this.elements.questionArea.appendChild(rankElement);
        }
    }

    /**
     * ナビゲーションボタンを描画
     * @param {number} totalQuestions - 総問題数
     * @param {number} currentIndex - 現在の問題インデックス
     * @param {Object} answers - 回答状況
     */
    renderNavigation(totalQuestions, currentIndex, answers) {
        if (!this.elements.navButtons) return;

        this.elements.navButtons.innerHTML = '';

        for (let i = 0; i < totalQuestions; i++) {
            const button = document.createElement('button');
            button.classList.add('nav-button');
            button.textContent = i + 1;

            // 現在の問題をハイライト
            if (i === currentIndex) {
                button.classList.add('current');
            }

            // 回答済みの問題をマーク
            const questionId = this.getQuestionIdByIndex(i);
            if (questionId && answers[questionId]) {
                button.classList.add('answered');
            }

            // クリックイベント
            button.addEventListener('click', () => {
                this.dispatchNavigationEvent(i);
            });

            this.elements.navButtons.appendChild(button);
        }
    }

    /**
     * インデックスから問題IDを取得（外部から設定される）
     * @param {number} index - 問題インデックス
     * @returns {number} 問題ID
     */
    getQuestionIdByIndex(index) {
        // この関数は外部から設定される必要がある
        return this._questionIdGetter ? this._questionIdGetter(index) : null;
    }

    /**
     * 問題ID取得関数を設定
     * @param {Function} getter - 問題ID取得関数
     */
    setQuestionIdGetter(getter) {
        this._questionIdGetter = getter;
    }

    /**
     * ナビゲーションイベントを発火
     * @param {number} index - 移動先のインデックス
     */
    dispatchNavigationEvent(index) {
        const event = new CustomEvent('navigationClicked', {
            detail: { index }
        });
        document.dispatchEvent(event);
    }

    /**
     * コントロールボタンの状態を更新
     * @param {number} currentIndex - 現在のインデックス
     * @param {number} totalQuestions - 総問題数
     */
    updateControlButtons(currentIndex, totalQuestions) {
        // デスクトップ用ボタン
        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = currentIndex === 0;
        }

        if (this.elements.nextBtn) {
            if (currentIndex === totalQuestions - 1) {
                this.elements.nextBtn.textContent = '採点する';
                this.elements.nextBtn.classList.add('finish-style');
            } else {
                this.elements.nextBtn.textContent = '次の問題へ ＞';
                this.elements.nextBtn.classList.remove('finish-style');
            }
        }

        // スマホ用ボタン
        const prevBtnMobile = document.getElementById('prevBtnMobile');
        const nextBtnMobile = document.getElementById('nextBtnMobile');

        if (prevBtnMobile) {
            prevBtnMobile.disabled = currentIndex === 0;
        }

        if (nextBtnMobile) {
            if (currentIndex === totalQuestions - 1) {
                nextBtnMobile.textContent = '採点する';
                nextBtnMobile.classList.add('finish-style');
            } else {
                nextBtnMobile.textContent = '次の問題へ ＞';
                nextBtnMobile.classList.remove('finish-style');
            }
        }
    }

    /**
     * ランクフィルターボタンを描画
     * @param {string} currentFilter - 現在のフィルター
     */
    renderRankFilter(currentFilter = 'ALL') {
        if (!this.elements.rankButtons) return;

        const ranks = [
            { key: 'ALL', label: 'すべて', icon: '📚' },
            { key: 'A', label: 'Aランク', icon: '🔥' },
            { key: 'B', label: 'Bランク', icon: '⭐' },
            { key: 'C', label: 'Cランク', icon: '📝' },
            { key: 'D', label: 'Dランク', icon: '📖' }
        ];

        this.elements.rankButtons.innerHTML = '';

        ranks.forEach(rank => {
            const button = document.createElement('button');
            button.classList.add('rank-btn', `rank-${rank.key}`);
            button.innerHTML = `${rank.icon} ${rank.label}`;

            if (currentFilter === rank.key) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                this.dispatchRankFilterEvent(rank.key);
            });

            this.elements.rankButtons.appendChild(button);
        });
    }

    /**
     * ランクフィルターイベントを発火
     * @param {string} rank - 選択されたランク
     */
    dispatchRankFilterEvent(rank) {
        const event = new CustomEvent('rankFilterChanged', {
            detail: { rank }
        });
        document.dispatchEvent(event);
    }

    /**
     * モーダルを表示
     * @param {string} message - 表示するメッセージ
     * @param {Function} onConfirm - 確認時のコールバック
     * @param {Function} onCancel - キャンセル時のコールバック
     */
    showModal(message, onConfirm, onCancel) {
        if (!this.elements.confirmModal) return;

        this.elements.confirmMessage.textContent = message;
        this.elements.confirmModal.style.display = 'block';

        // イベントリスナーを一度クリア
        const newConfirmBtn = this.elements.confirmYesBtn.cloneNode(true);
        const newCancelBtn = this.elements.confirmNoBtn.cloneNode(true);

        this.elements.confirmYesBtn.parentNode.replaceChild(newConfirmBtn, this.elements.confirmYesBtn);
        this.elements.confirmNoBtn.parentNode.replaceChild(newCancelBtn, this.elements.confirmNoBtn);

        this.elements.confirmYesBtn = newConfirmBtn;
        this.elements.confirmNoBtn = newCancelBtn;

        // 新しいイベントリスナーを設定
        this.elements.confirmYesBtn.addEventListener('click', () => {
            this.hideModal();
            if (onConfirm) onConfirm();
        });

        this.elements.confirmNoBtn.addEventListener('click', () => {
            this.hideModal();
            if (onCancel) onCancel();
        });
    }

    /**
     * モーダルを非表示
     */
    hideModal() {
        if (this.elements.confirmModal) {
            this.elements.confirmModal.style.display = 'none';
        }
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        // 既存のエラー表示を削除
        const existingError = document.querySelector('.error-banner');
        if (existingError) {
            existingError.remove();
        }

        // エラーバナーを作成
        const errorBanner = document.createElement('div');
        errorBanner.className = 'error-banner';
        errorBanner.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // ページ上部に挿入
        document.body.insertBefore(errorBanner, document.body.firstChild);

        // 5秒後に自動削除
        setTimeout(() => {
            if (errorBanner.parentNode) {
                errorBanner.remove();
            }
        }, 5000);
    }

    /**
     * ローディング状態を表示
     * @param {boolean} show - 表示/非表示
     * @param {string} message - ローディングメッセージ
     */
    showLoading(show, message = '読み込み中...') {
        let loader = document.querySelector('.custom-loader');

        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.className = 'custom-loader';
                loader.innerHTML = `
                    <div class="loader-content">
                        <div class="loader-spinner"></div>
                        <div class="loader-text">${message}</div>
                    </div>
                `;
                document.body.appendChild(loader);
            }
        } else {
            if (loader) {
                loader.remove();
            }
        }
    }

    /**
     * UIリソースをクリーンアップ
     */
    cleanup() {
        this.elements = {};
        this.initialized = false;
        this._questionIdGetter = null;

        // イベントリスナーをクリア（必要に応じて）
        document.removeEventListener('answerSelected', this.handleAnswerSelected);
        document.removeEventListener('navigationClicked', this.handleNavigationClicked);
        document.removeEventListener('rankFilterChanged', this.handleRankFilterChanged);
    }
}