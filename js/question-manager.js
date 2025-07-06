// 問題管理クラス
class QuestionManager {
    constructor() {
        this.allQuestions = questions; // questions.jsから読み込み
        this.selectedQuestions = [];
        this.questionCount = 10; // デフォルト問題数
        this.apiQuestions = []; // API取得問題
    }

    // 問題数を設定
    setQuestionCount(count) {
        this.questionCount = Math.min(count, this.allQuestions.length);
    }

    // 問題をランダムに選択
    selectRandomQuestions() {
        const shuffled = this.shuffleArray([...this.allQuestions]);
        this.selectedQuestions = shuffled.slice(0, this.questionCount);
        
        // 選択された問題のIDを1から連番に振り直し
        this.selectedQuestions.forEach((question, index) => {
            question.originalId = question.id;
            question.id = index + 1;
        });
        
        return this.selectedQuestions;
    }

    // 配列をシャッフル（Fisher-Yates法）
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 現在選択されている問題を取得
    getSelectedQuestions() {
        return this.selectedQuestions;
    }

    // 特定の問題を取得
    getQuestion(id) {
        return this.selectedQuestions.find(q => q.id === id);
    }

    // 問題数を取得
    getQuestionCount() {
        return this.selectedQuestions.length;
    }

    // 問題の選択肢もシャッフル
    shuffleChoices() {
        this.selectedQuestions.forEach(question => {
            const correctAnswer = question.choices.find(choice => choice.id === question.answerId);
            
            // 選択肢をシャッフル
            const shuffledChoices = this.shuffleArray([...question.choices]);
            
            // 新しいIDを割り当て
            shuffledChoices.forEach((choice, index) => {
                choice.originalId = choice.id;
                choice.id = index + 1;
            });
            
            // 正解のIDを更新
            question.answerId = shuffledChoices.find(choice => choice.originalId === correctAnswer.id).id;
            question.choices = shuffledChoices;
        });
    }

    // 外部APIから問題を取得
    async fetchQuestionsFromAPI() {
        try {
            // Quiz APIを使用（例：Open Trivia Database）
            const response = await fetch('https://opentdb.com/api.php?amount=10&category=28&difficulty=medium&type=multiple');
            const data = await response.json();
            
            if (data.results) {
                this.apiQuestions = data.results.map((item, index) => ({
                    id: this.allQuestions.length + index + 1,
                    statement: this.decodeHtml(item.question),
                    choices: this.shuffleArray([
                        ...item.incorrect_answers.map((answer, i) => ({
                            id: i + 1,
                            text: this.decodeHtml(answer)
                        })),
                        {
                            id: item.incorrect_answers.length + 1,
                            text: this.decodeHtml(item.correct_answer)
                        }
                    ]).map((choice, i) => ({
                        id: i + 1,
                        text: choice.text
                    })),
                    answerId: null, // 後で設定
                    explanation: "外部APIから取得した問題のため、詳細な解説はありません。"
                }));
                
                // 正解IDを設定
                this.apiQuestions.forEach(question => {
                    const correctChoice = question.choices.find(choice => 
                        choice.text === this.decodeHtml(data.results[question.id - this.allQuestions.length - 1].correct_answer)
                    );
                    question.answerId = correctChoice ? correctChoice.id : 1;
                });

                // 英語の問題を翻訳
                this.apiQuestions = await translationManager.translateQuestions(this.apiQuestions);
            }
        } catch (error) {
            console.warn('外部APIから問題を取得できませんでした:', error);
            this.apiQuestions = [];
        }
    }

    // HTMLエンティティをデコード
    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    // 問題セットを初期化
    async initializeQuestions(count = 10, shuffleChoices = false) {
        this.setQuestionCount(count);
        
        try {
            // APIから問題を取得
            await this.fetchQuestionsFromAPI();
            
            // APIから取得した問題と既存の問題を組み合わせ
            this.allQuestions = [...questions, ...this.apiQuestions];
        } catch (error) {
            console.warn('API取得に失敗しました。既存問題のみを使用します。', error);
            // API取得に失敗した場合は既存問題のみ使用
            this.allQuestions = questions;
        }
        
        this.selectRandomQuestions();
        
        if (shuffleChoices) {
            this.shuffleChoices();
        }
        
        return this.selectedQuestions;
    }
}

// 問題管理インスタンスをグローバルに作成
const questionManager = new QuestionManager();