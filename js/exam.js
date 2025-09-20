class ExamManager {
    constructor() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.timeLimit = 30 * 60; // 30分（秒）- 筆記+実技の20問対応
        this.remainingTime = this.timeLimit;
        this.timerInterval = null;
        this.startTime = parseInt(sessionStorage.getItem('examStartTime')) || Date.now();

        this.initializeElements();
        this.initializeEventListeners();
        this.loadAnswers();

        // 直接問題を初期化（ローディング画面なし）
        this.initializeQuestions();
    }

    async initializeQuestions() {
        try {
            console.log('=== 問題初期化開始 ===');

            // データの存在確認
            console.log('writtenQuestions:', typeof writtenQuestions !== 'undefined' ? writtenQuestions.length : 'undefined');
            console.log('practicalQuestions:', typeof practicalQuestions !== 'undefined' ? practicalQuestions.length : 'undefined');
            console.log('allRankedQuestions:', typeof allRankedQuestions !== 'undefined' ? allRankedQuestions.length : 'undefined');
            console.log('rankedQuestions:', typeof rankedQuestions !== 'undefined' ? Object.keys(rankedQuestions) : 'undefined');

            // 問題を生成（筆記10問+実技10問=20問）
            this.questions = await this.generateQuestions();
            console.log('生成された問題数:', this.questions ? this.questions.length : 0);

            // タイマー開始
            this.setupTimer();

            // 問題が取得できた場合のみ表示
            if (this.questions && this.questions.length > 0) {
                console.log('問題表示開始:', this.questions.length + '問');
                console.log('最初の問題:', this.questions[0]);

                try {
                    this.renderQuestion();
                    console.log('renderQuestion完了');

                    this.renderNavigation();
                    console.log('renderNavigation完了');

                    console.log('=== 初期化完了 ===');
                } catch (renderError) {
                    console.error('レンダリングエラー:', renderError);
                    this.showError('画面の表示に失敗しました。ページを再読み込みしてください。');
                }
            } else {
                console.error('問題データが空です');
                this.showError('問題の読み込みに失敗しました。ページを再読み込みしてください。');
            }

        } catch (error) {
            console.error('問題の初期化に失敗:', error);
            console.error('エラー詳細:', error.stack);
            this.showError('問題の読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    // 問題を生成（ランク重み付き、または完全ランダム）
    async generateQuestions() {
        return new Promise((resolve, reject) => {
            try {
                let selectedQuestions = [];

                // データの存在確認
                const hasRankedData = typeof allRankedQuestions !== 'undefined' && allRankedQuestions && allRankedQuestions.length > 0;
                const hasBasicData = typeof writtenQuestions !== 'undefined' && typeof practicalQuestions !== 'undefined';

                console.log('データ確認:', {
                    hasRankedData,
                    hasBasicData,
                    writtenCount: typeof writtenQuestions !== 'undefined' ? writtenQuestions.length : 0,
                    practicalCount: typeof practicalQuestions !== 'undefined' ? practicalQuestions.length : 0
                });

                // ランク付き問題データが利用可能な場合
                if (hasRankedData) {
                    // 重要度重み付きランダム選択
                    selectedQuestions = this.getWeightedRandomQuestions(20);
                    console.log('ランク重み付き問題を生成しました:', selectedQuestions.length);
                } else if (hasBasicData) {
                    // 従来の筆記10問+実技10問
                    const shuffledWritten = this.shuffleArray([...writtenQuestions]);
                    const selectedWritten = shuffledWritten.slice(0, 10);

                    const shuffledPractical = this.shuffleArray([...practicalQuestions]);
                    const selectedPractical = shuffledPractical.slice(0, 10);

                    selectedQuestions = [...selectedWritten, ...selectedPractical];
                    console.log('従来方式で問題を生成しました:', selectedQuestions.length);
                } else {
                    console.error('問題データが見つかりません');
                    reject(new Error('問題データが見つかりません'));
                    return;
                }

                if (selectedQuestions.length === 0) {
                    console.error('選択された問題が0件です');
                    reject(new Error('選択された問題が0件です'));
                    return;
                }

                // IDを振り直し
                const allQuestions = selectedQuestions.map((question, index) => ({
                    ...question,
                    id: index + 1
                }));

                console.log('最終的な問題数:', allQuestions.length);

                // 少し遅延を入れてローディング画面を見せる
                setTimeout(() => {
                    resolve(allQuestions);
                }, 100);

            } catch (error) {
                console.error('generateQuestions内でエラー:', error);
                reject(error);
            }
        });
    }

    // 重要度重み付きランダム選択
    getWeightedRandomQuestions(count = 20) {
        const weights = { 'A': 0.15, 'B': 0.35, 'C': 0.35, 'D': 0.15 };
        let selected = [];

        for (const [rank, weight] of Object.entries(weights)) {
            const rankCount = Math.floor(count * weight);
            const rankQuestions = this.getQuestionsByRank(rank, rankCount);
            selected = [...selected, ...rankQuestions];
        }

        // 不足分を補完
        while (selected.length < count) {
            const allQuestions = [...allRankedQuestions];
            const shuffled = allQuestions.sort(() => Math.random() - 0.5);
            const candidate = shuffled[0];

            // 重複チェック
            const exists = selected.some(q => q.originalId === candidate.originalId);
            if (!exists) {
                selected.push(candidate);
            }
        }

        return selected.slice(0, count);
    }

    // ランク別問題取得
    getQuestionsByRank(rank, count) {
        if (typeof rankedQuestions === 'undefined') return [];

        const questions = rankedQuestions[rank] || [];
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    // 配列をシャッフル
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }


    // エラー表示
    showError(message) {

        // エラー表示エリアを作成
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #ff4757;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        errorDiv.innerHTML = `
            <h2 style="color: #ff4757; margin: 0 0 15px 0;">エラーが発生しました</h2>
            <p style="color: #333; margin: 0 0 15px 0; font-size: 16px;">${message}</p>
            <button onclick="location.reload()" style="
                background: #ff4757;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">ページを再読み込み</button>
            <div style="margin-top: 15px; font-size: 12px; color: #666;">
                <p>開発者ツール（F12）のコンソールでエラー詳細を確認できます</p>
            </div>
        `;

        document.body.appendChild(errorDiv);
    }

    initializeElements() {
        this.questionNavButtons = document.getElementById('questionNavButtons');
        this.questionNumber = document.getElementById('questionNumber');
        this.questionText = document.getElementById('questionText');
        this.questionChoices = document.getElementById('questionChoices');
        this.timer = document.getElementById('timer');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.finishBtn = document.getElementById('finishBtn');
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmYes = document.getElementById('confirmYes');
        this.confirmNo = document.getElementById('confirmNo');
        this.timeupModal = document.getElementById('timeupModal');
    }
    
    initializeEventListeners() {
        this.prevBtn.addEventListener('click', () => this.previousQuestion());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.finishBtn.addEventListener('click', () => this.showFinishConfirmation());
        this.confirmYes.addEventListener('click', () => this.finishExam());
        this.confirmNo.addEventListener('click', () => this.hideModal());

        // ランクフィルターのイベントリスナー
        this.initializeRankFilter();
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && !this.prevBtn.disabled) {
                this.previousQuestion();
            } else if (e.key === 'ArrowRight') {
                this.nextQuestion();
            } else if (e.key === 'Enter' && e.ctrlKey) {
                this.showFinishConfirmation();
            }
        });
    }
    
    loadAnswers() {
        const saved = sessionStorage.getItem('examAnswers');
        if (saved) {
            this.answers = JSON.parse(saved);
        }
    }
    
    saveAnswers() {
        sessionStorage.setItem('examAnswers', JSON.stringify(this.answers));
    }
    
    setupTimer() {
        // 経過時間を計算
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        this.remainingTime = Math.max(0, this.timeLimit - elapsed);
        
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.updateTimerDisplay();
            
            if (this.remainingTime <= 0) {
                this.timeUp();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.timer.textContent = timeStr;
        
        // 警告色の設定
        this.timer.classList.remove('warning', 'danger');
        if (this.remainingTime <= 60) {
            this.timer.classList.add('danger');
        } else if (this.remainingTime <= 300) {
            this.timer.classList.add('warning');
        }
    }
    
    timeUp() {
        clearInterval(this.timerInterval);
        this.showTimeupModal();
        setTimeout(() => {
            this.finishExam();
        }, 2000);
    }
    
    showTimeupModal() {
        this.timeupModal.style.display = 'block';
    }
    
    renderNavigation() {
        this.questionNavButtons.innerHTML = '';
        
        for (let i = 0; i < this.questions.length; i++) {
            const button = document.createElement('button');
            button.textContent = (i + 1).toString();
            button.classList.add('nav-button');
            
            if (i === this.currentQuestionIndex) {
                button.classList.add('current');
            }
            if (this.answers[i + 1]) {
                button.classList.add('answered');
            }
            
            button.addEventListener('click', () => this.goToQuestion(i));
            this.questionNavButtons.appendChild(button);
        }
    }
    
    renderQuestion() {
        try {
            console.log('renderQuestion開始');
            console.log('currentQuestionIndex:', this.currentQuestionIndex);
            console.log('questions.length:', this.questions ? this.questions.length : 'undefined');

            const question = this.questions[this.currentQuestionIndex];
            console.log('現在の問題:', question);

            if (!question) {
                console.error('問題が取得できません');
                this.showError('問題データが見つかりません');
                return;
            }

            // DOM要素の存在確認
            console.log('questionNumber:', this.questionNumber);
            console.log('questionText:', this.questionText);
            console.log('questionChoices:', this.questionChoices);

            if (!this.questionNumber || !this.questionText || !this.questionChoices) {
                console.error('必要なDOM要素が見つかりません');
                this.showError('画面要素の初期化に失敗しました');
                return;
            }

            this.questionNumber.textContent = `問${this.currentQuestionIndex + 1} / ${this.questions.length}`;
            this.questionText.textContent = question.statement || '問題文が設定されていません';

            console.log('問題文設定完了:', question.statement);

            // ランク表示を追加
            this.renderQuestionRank(question);

            this.questionChoices.innerHTML = '';

            if (!question.choices || !Array.isArray(question.choices)) {
                console.error('選択肢データが正しくありません:', question.choices);
                this.showError('選択肢データに問題があります');
                return;
            }

            console.log('選択肢数:', question.choices.length);

            question.choices.forEach((choice, index) => {
                console.log(`選択肢${index + 1}:`, choice);

                const choiceDiv = document.createElement('div');
                choiceDiv.classList.add('choice');

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'answer';
                radio.value = choice.id;
                radio.id = `choice_${choice.id}`;

                // 保存された回答があれば復元
                if (this.answers[question.id] === choice.id) {
                    radio.checked = true;
                    choiceDiv.classList.add('selected');
                }

                const label = document.createElement('label');
                label.htmlFor = `choice_${choice.id}`;
                label.textContent = choice.text || `選択肢${index + 1}`;

                choiceDiv.appendChild(radio);
                choiceDiv.appendChild(label);

                // 選択肢のクリックイベント
                choiceDiv.addEventListener('click', () => {
                    // 他の選択肢から selected クラスを削除
                    document.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
                    choiceDiv.classList.add('selected');
                    radio.checked = true;

                    this.answers[question.id] = choice.id;
                    this.saveAnswers();
                    this.renderNavigation();
                });

                this.questionChoices.appendChild(choiceDiv);
            });

            console.log('選択肢レンダリング完了');

            // ナビゲーションボタンの状態更新
            this.updateNavigationButtons();

            console.log('renderQuestion完了');

        } catch (error) {
            console.error('renderQuestionでエラー:', error);
            console.error('エラー詳細:', error.stack);
            this.showError('問題の表示でエラーが発生しました');
        }
    }

    renderQuestionRank(question) {
        // 既存のランク表示を削除
        const existingRank = document.querySelector('.question-rank');
        if (existingRank) {
            existingRank.remove();
        }

        // ランク情報が存在する場合のみ表示
        if (question.rank) {
            const rankElement = document.createElement('div');
            rankElement.className = `question-rank rank-${question.rank}`;

            const rankIcon = this.getRankIcon(question.rank);
            const rankName = this.getRankName(question.rank);
            const rankDescription = question.rank_description || this.getRankDescription(question.rank);

            rankElement.innerHTML = `
                <span class="rank-icon">${rankIcon}</span>
                <span>${question.rank}ランク</span>
                <div class="rank-tooltip">${rankDescription}</div>
            `;

            const questionArea = document.querySelector('.question-area');
            questionArea.appendChild(rankElement);
        }
    }

    getRankIcon(rank) {
        const icons = {
            'A': '🔥',
            'B': '⭐',
            'C': '📖',
            'D': '📝'
        };
        return icons[rank] || '📝';
    }

    getRankName(rank) {
        const names = {
            'A': '超重要',
            'B': '重要',
            'C': '標準',
            'D': '補助'
        };
        return names[rank] || '標準';
    }

    getRankDescription(rank) {
        const descriptions = {
            'A': '毎回出題される可能性が高い（75-100%）',
            'B': 'よく出題される重要問題（50-74%）',
            'C': '時々出題される問題（25-49%）',
            'D': '稀に出題される問題（25%未満）'
        };
        return descriptions[rank] || '標準的な問題';
    }

    initializeRankFilter() {
        const rankButtons = document.querySelectorAll('.rank-btn');

        rankButtons.forEach(button => {
            button.addEventListener('click', () => {
                // アクティブボタンを切り替え
                rankButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const selectedRank = button.dataset.rank;
                this.showRankStatistics(selectedRank);
            });
        });
    }

    showRankStatistics(rank) {
        if (typeof rankedQuestions === 'undefined') return;

        let totalCount = 0;
        if (rank === 'ALL') {
            totalCount = Object.values(rankedQuestions).reduce((sum, questions) => sum + questions.length, 0);
        } else {
            totalCount = rankedQuestions[rank] ? rankedQuestions[rank].length : 0;
        }

        console.log(`${rank === 'ALL' ? '全問題' : rank + 'ランク'}：${totalCount}問利用可能`);

        // 将来的にはUI上に統計情報を表示する
        // this.updateRankDisplay(rank, totalCount);
    }

    updateNavigationButtons() {
        this.prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.questions.length - 1) {
            this.nextBtn.textContent = '結果を見る';
        } else {
            this.nextBtn.textContent = '次の問題へ ＞';
        }
    }
    
    goToQuestion(index) {
        this.currentQuestionIndex = index;
        this.renderQuestion();
        this.renderNavigation();
    }
    
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
            this.renderNavigation();
        }
    }
    
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
            this.renderNavigation();
        } else {
            this.showFinishConfirmation();
        }
    }
    
    showFinishConfirmation() {
        const unansweredCount = this.questions.length - Object.keys(this.answers).length;
        
        if (unansweredCount === 0) {
            this.confirmMessage.textContent = '試験を終了して採点しますか？';
        } else {
            this.confirmMessage.textContent = `未解答の問題が${unansweredCount}問あります。試験を終了しますか？`;
        }
        
        this.confirmModal.style.display = 'block';
    }
    
    hideModal() {
        this.confirmModal.style.display = 'none';
    }
    
    finishExam() {
        clearInterval(this.timerInterval);
        
        // 結果データを保存
        const examData = {
            answers: this.answers,
            questions: this.questions,
            startTime: this.startTime,
            endTime: Date.now(),
            timeSpent: Date.now() - this.startTime
        };
        
        sessionStorage.setItem('examResult', JSON.stringify(examData));
        
        // 結果画面に遷移
        window.location.href = 'result.html';
    }
}

// ページ読み込み時に試験開始
document.addEventListener('DOMContentLoaded', function() {
    new ExamManager();
});