// 翻訳管理クラス
class TranslationManager {
    constructor() {
        this.translationCache = new Map();
        this.isTranslating = false;
    }

    // 英語かどうかを判定する
    isEnglishText(text) {
        // 英語の文字（アルファベット）が50%以上含まれている場合は英語と判定
        const englishChars = text.match(/[a-zA-Z]/g) || [];
        const totalChars = text.replace(/\s/g, '').length;
        return totalChars > 0 && (englishChars.length / totalChars) > 0.5;
    }

    // MyMemory Translation APIを使用して翻訳
    async translateText(text, targetLang = 'ja', timeout = 5000) {
        if (!text || !this.isEnglishText(text)) {
            return text;
        }

        // キャッシュチェック
        const cacheKey = `${text}_${targetLang}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        try {
            // タイムアウト制御
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // MyMemory Translation API（無料）を使用
            const encodedText = encodeURIComponent(text);
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`,
                { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.responseStatus === 200 && data.responseData) {
                const translatedText = data.responseData.translatedText;
                
                // キャッシュに保存
                this.translationCache.set(cacheKey, translatedText);
                
                return translatedText;
            } else {
                throw new Error('Translation failed');
            }
        } catch (error) {
            console.warn('翻訳に失敗しました:', error);
            
            // フォールバック: 簡単な英語表現の置換
            return this.fallbackTranslation(text);
        }
    }

    // フォールバック翻訳（基本的な英語表現の置換）
    fallbackTranslation(text) {
        const translations = {
            'What': '何',
            'Which': 'どの',
            'How': 'どのように',
            'When': 'いつ',
            'Where': 'どこで',
            'Who': '誰',
            'Why': 'なぜ',
            'True': '正しい',
            'False': '間違い',
            'Yes': 'はい',
            'No': 'いいえ',
            'the': '',
            'is': 'は',
            'are': 'は',
            'and': 'と',
            'or': 'または',
            'of': 'の',
            'in': 'の中で',
            'on': 'の上で',
            'at': 'で',
            'to': 'に',
            'for': 'のために',
            'with': 'と一緒に',
            'by': 'によって'
        };

        let translatedText = text;
        
        // 基本的な単語を置換
        for (const [english, japanese] of Object.entries(translations)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translatedText = translatedText.replace(regex, japanese);
        }

        return translatedText + ' (自動翻訳)';
    }

    // 問題全体を翻訳
    async translateQuestion(question) {
        const translatedQuestion = { ...question };
        
        try {
            // 問題文を翻訳
            if (this.isEnglishText(question.statement)) {
                translatedQuestion.statement = await this.translateText(question.statement);
            }

            // 選択肢を翻訳
            if (question.choices && question.choices.length > 0) {
                translatedQuestion.choices = await Promise.all(
                    question.choices.map(async (choice) => ({
                        ...choice,
                        text: await this.translateText(choice.text)
                    }))
                );
            }

            // 解説を翻訳
            if (question.explanation && this.isEnglishText(question.explanation)) {
                translatedQuestion.explanation = await this.translateText(question.explanation);
            }

        } catch (error) {
            console.warn('問題の翻訳に失敗しました:', error);
            // 翻訳に失敗した場合は元の問題を返す
            return question;
        }

        return translatedQuestion;
    }

    // 複数の問題を翻訳
    async translateQuestions(questions) {
        const translatedQuestions = [];
        
        for (const question of questions) {
            const translatedQuestion = await this.translateQuestion(question);
            translatedQuestions.push(translatedQuestion);
        }
        
        return translatedQuestions;
    }

    // キャッシュクリア
    clearCache() {
        this.translationCache.clear();
    }
}

// 翻訳管理インスタンスをグローバルに作成
const translationManager = new TranslationManager();