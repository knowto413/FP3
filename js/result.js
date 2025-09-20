class ResultManager {
    constructor() {
        this.examData = this.loadExamData();
        this.score = this.calculateScore();
        
        this.initializeElements();
        this.initializeEventListeners();
        this.renderResults();
    }
    
    initializeElements() {
        this.resultStatus = document.getElementById('resultStatus');
        this.scoreText = document.getElementById('scoreText');
        this.scoreDetail = document.getElementById('scoreDetail');
        this.timeInfo = document.getElementById('timeInfo');
        this.resultsList = document.getElementById('resultsList');
        this.retryBtn = document.getElementById('retryBtn');
        this.twitterShare = document.getElementById('twitterShare');
        this.facebookShare = document.getElementById('facebookShare');
    }
    
    initializeEventListeners() {
        this.retryBtn.addEventListener('click', () => {
            // セッションデータをクリア
            sessionStorage.removeItem('examAnswers');
            sessionStorage.removeItem('examResult');
            sessionStorage.removeItem('examStartTime');
            
            // トップページに戻る
            window.location.href = 'index.html';
        });
        
        this.twitterShare.addEventListener('click', () => this.shareOnTwitter());
        this.facebookShare.addEventListener('click', () => this.shareOnFacebook());
    }
    
    loadExamData() {
        const data = sessionStorage.getItem('examResult');
        if (!data) {
            // データがない場合はトップページにリダイレクト
            window.location.href = 'index.html';
            return null;
        }
        return JSON.parse(data);
    }
    
    calculateScore() {
        let correctCount = 0;
        
        // セッションストレージから使用した問題を取得
        const examQuestions = this.examData.questions || questions.slice(0, 10);
        
        examQuestions.forEach(question => {
            const userAnswer = this.examData.answers[question.id];
            if (userAnswer === question.answerId) {
                correctCount++;
            }
        });
        
        return {
            correct: correctCount,
            total: examQuestions.length,
            percentage: Math.round((correctCount / examQuestions.length) * 100),
            passed: correctCount >= Math.ceil(examQuestions.length * 0.6) // 60%以上で合格
        };
    }
    
    renderResults() {
        // 合格/不合格の表示
        this.resultStatus.textContent = this.score.passed ? '合格' : '不合格';
        this.resultStatus.classList.add(this.score.passed ? 'pass' : 'fail');
        
        // スコア情報の表示
        this.scoreText.textContent = `あなたのスコア: ${this.score.percentage}点`;
        this.scoreDetail.textContent = `(${this.score.total}問中${this.score.correct}問正解)`;
        
        // 所要時間の表示
        const timeSpent = Math.floor(this.examData.timeSpent / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;
        this.timeInfo.textContent = `所要時間: ${minutes}分${seconds}秒`;
        
        // 問題別結果の表示
        this.renderDetailedResults();
    }
    
    renderDetailedResults() {
        this.resultsList.innerHTML = '';
        
        // セッションストレージから使用した問題を取得
        const examQuestions = this.examData.questions || questions.slice(0, 10);
        
        examQuestions.forEach((question, index) => {
            const userAnswer = this.examData.answers[question.id];
            const isCorrect = userAnswer === question.answerId;
            
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
            
            // 結果ヘッダー
            const resultHeader = document.createElement('div');
            resultHeader.classList.add('result-header');
            resultHeader.innerHTML = `
                <div class="question-info">
                    <span class="result-icon ${isCorrect ? 'correct' : 'incorrect'}">
                        ${isCorrect ? '✓' : '✗'}
                    </span>
                    <span class="question-number">問${index + 1}</span>
                </div>
                <div class="answer-info">
                    <span class="your-answer ${isCorrect ? '' : 'incorrect'}">
                        あなたの解答: ${this.getChoiceText(question, userAnswer) || '未回答'}
                    </span>
                    ${!isCorrect ? `<br><span class="correct-answer">正解: ${this.getChoiceText(question, question.answerId)}</span>` : ''}
                </div>
                <span class="expand-icon">▼</span>
            `;
            
            // 解説エリア
            const explanation = document.createElement('div');
            explanation.classList.add('explanation');
            explanation.innerHTML = `
                <h4>問題:</h4>
                <p>${question.statement}</p>
                <h4>解説:</h4>
                <p>${question.explanation}</p>
            `;
            
            // クリックで解説の表示/非表示を切り替え
            resultHeader.addEventListener('click', () => {
                explanation.classList.toggle('show');
                const expandIcon = resultHeader.querySelector('.expand-icon');
                expandIcon.textContent = explanation.classList.contains('show') ? '▲' : '▼';
            });
            
            resultItem.appendChild(resultHeader);
            resultItem.appendChild(explanation);
            this.resultsList.appendChild(resultItem);
        });
    }
    
    getChoiceText(question, choiceId) {
        const choice = question.choices.find(c => c.id === choiceId);
        return choice ? choice.text : null;
    }
    
    shareOnTwitter() {
        const text = `FP3級CBTデモ試験で${this.score.percentage}点を獲得しました！ #FP3級 #CBT #資格試験`;
        const url = window.location.origin;
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
    
    shareOnFacebook() {
        const url = window.location.origin;
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
}

// ページ読み込み時に結果表示
document.addEventListener('DOMContentLoaded', function() {
    new ResultManager();
});