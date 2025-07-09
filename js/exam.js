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
        
        // 問題をランダムに選択して初期化（非同期）
        this.initializeQuestions();
    }

    async initializeQuestions() {
        try {
            // 進捗バーでローディング表示
            await this.showLoadingWithProgress();
            
            // 問題を生成（筆記10問+実技10問=20問）
            this.questions = await this.generateQuestions();
            
            // ローディング非表示
            await this.hideLoadingScreen();
            
            // タイマー開始
            this.setupTimer();
            
            // 問題が取得できた場合のみ表示
            if (this.questions && this.questions.length > 0) {
                this.renderQuestion();
                this.renderNavigation();
            } else {
                this.showError('問題の読み込みに失敗しました。ページを再読み込みしてください。');
            }
            
        } catch (error) {
            console.error('問題の初期化に失敗:', error);
            await this.hideLoadingScreen();
            this.showError('問題の読み込みに失敗しました。ページを再読み込みしてください。');
        }
    }

    // 問題を生成（筆記10問+実技10問）
    async generateQuestions() {
        return new Promise((resolve) => {
            // 筆記問題から10問をランダム選択
            const shuffledWritten = this.shuffleArray([...writtenQuestions]);
            const selectedWritten = shuffledWritten.slice(0, 10);
            
            // 実技問題から10問をランダム選択
            const shuffledPractical = this.shuffleArray([...practicalQuestions]);
            const selectedPractical = shuffledPractical.slice(0, 10);
            
            // 問題を結合してIDを振り直し
            const allQuestions = [...selectedWritten, ...selectedPractical].map((question, index) => ({
                ...question,
                id: index + 1
            }));
            
            // 少し遅延を入れてローディング画面を見せる
            setTimeout(() => {
                resolve(allQuestions);
            }, 100);
        });
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
        
        return new Promise(resolve => {
            loadingScreen.style.animation = 'fadeOut 0.5s ease-in-out';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                examPage.style.display = 'block';
                examPage.style.animation = 'fadeIn 0.5s ease-in-out';
                resolve();
            }, 500);
        });
    }

    // エラー表示
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `<p style="color: red; text-align: center; font-size: 18px;">${message}</p>`;
        const questionArea = document.querySelector('.question-area');
        if (questionArea) {
            questionArea.appendChild(errorDiv);
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