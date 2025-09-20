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

        // フォールバックタイマー: 10秒後に強制的にローディングを終了
        this.setupFailsafe();

        // 問題をランダムに選択して初期化（非同期）
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

            // 進捗バーでローディング表示
            await this.showLoadingWithProgress();

            // 問題を生成（筆記10問+実技10問=20問）
            this.questions = await this.generateQuestions();
            console.log('生成された問題数:', this.questions ? this.questions.length : 0);

            // ローディング非表示
            await this.hideLoadingScreen();

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

                    // 正常に初期化完了したのでフォールバックタイマーをクリア
                    if (this.failsafeTimer) {
                        clearTimeout(this.failsafeTimer);
                        console.log('フォールバックタイマーをクリア');
                    }

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
            await this.hideLoadingScreen();
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

    // 進捗バー付きローディング表示
    async showLoadingWithProgress() {
        const loadingScreen = document.getElementById('loadingScreen');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const loadingMessage = document.getElementById('loadingMessage');
        
        const steps = [
            { progress: 20, message: '筆記問題を準備中...' },
            { progress: 40, message: '実技問題を準備中...' },
            { progress: 60, message: '問題をシャッフル中...' },
            { progress: 80, message: '最終調整中...' },
            { progress: 100, message: '完了！' }
        ];
        
        for (const step of steps) {
            await new Promise(resolve => {
                setTimeout(() => {
                    progressFill.style.width = step.progress + '%';
                    progressText.textContent = step.progress + '%';
                    loadingMessage.textContent = step.message;
                    resolve();
                }, 300);
            });
        }
        
        // 少し待ってから次の段階へ
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // ローディング画面を非表示
    async hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const examPage = document.getElementById('examPage');

        console.log('hideLoadingScreen開始');
        console.log('loadingScreen:', loadingScreen);
        console.log('examPage:', examPage);

        return new Promise(resolve => {
            try {
                if (loadingScreen) {
                    // アニメーションを使わずに直接切り替え
                    loadingScreen.style.opacity = '0';

                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        console.log('ローディング画面を非表示にしました');

                        if (examPage) {
                            examPage.style.display = 'block';
                            examPage.style.opacity = '1';
                            console.log('試験画面を表示しました');
                        } else {
                            console.error('examPageが見つかりません');
                        }

                        console.log('hideLoadingScreen完了');
                        resolve();
                    }, 100);
                } else {
                    console.error('loadingScreenが見つかりません');
                    if (examPage) {
                        examPage.style.display = 'block';
                    }
                    resolve();
                }
            } catch (error) {
                console.error('hideLoadingScreenでエラー:', error);
                resolve();
            }
        });
    }

    // エラー表示
    showError(message) {
        // ローディング画面を非表示
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

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

    // フォールバック機能: 一定時間後に強制的にローディングを終了
    setupFailsafe() {
        console.log('フォールバックタイマーを設定 (10秒)');
        this.failsafeTimer = setTimeout(() => {
            console.log('フォールバック実行: 強制的にローディングを終了');
            this.forceEndLoading();
        }, 10000); // 10秒後
    }

    // 強制的にローディングを終了
    forceEndLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const examPage = document.getElementById('examPage');

        console.log('強制ローディング終了開始');

        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('ローディング画面を強制非表示');
        }

        if (examPage) {
            examPage.style.display = 'block';
            console.log('試験画面を強制表示');
        }

        // 基本データで問題を生成（フォールバック）
        if (!this.questions || this.questions.length === 0) {
            console.log('フォールバック: 基本データで問題を生成');
            this.generateFallbackQuestions();
        }

        // タイマー開始
        this.setupTimer();

        // 問題がある場合は表示
        if (this.questions && this.questions.length > 0) {
            this.renderQuestion();
            this.renderNavigation();
            console.log('フォールバック完了: 問題表示');
        } else {
            this.showError('問題データの読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    // フォールバック用の問題生成
    generateFallbackQuestions() {
        try {
            let selectedQuestions = [];

            if (typeof writtenQuestions !== 'undefined' && typeof practicalQuestions !== 'undefined') {
                const shuffledWritten = this.shuffleArray([...writtenQuestions]);
                const selectedWritten = shuffledWritten.slice(0, 10);

                const shuffledPractical = this.shuffleArray([...practicalQuestions]);
                const selectedPractical = shuffledPractical.slice(0, 10);

                selectedQuestions = [...selectedWritten, ...selectedPractical];
            } else {
                console.error('基本問題データも利用できません');
                return;
            }

            this.questions = selectedQuestions.map((question, index) => ({
                ...question,
                id: index + 1
            }));

            console.log('フォールバック問題生成完了:', this.questions.length + '問');
        } catch (error) {
            console.error('フォールバック問題生成失敗:', error);
        }
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
        const question = this.questions[this.currentQuestionIndex];

        this.questionNumber.textContent = `問${this.currentQuestionIndex + 1} / ${this.questions.length}`;
        this.questionText.textContent = question.statement;

        // ランク表示を追加
        this.renderQuestionRank(question);
        
        this.questionChoices.innerHTML = '';
        
        question.choices.forEach(choice => {
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
            label.textContent = choice.text;
            
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
        
        // ナビゲーションボタンの状態更新
        this.updateNavigationButtons();
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