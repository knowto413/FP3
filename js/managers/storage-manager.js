import { EXAM_CONFIG } from '../config/exam-config.js';

// ストレージ操作を管理するクラス
export class StorageManager {
    constructor() {
        this.storageKeys = EXAM_CONFIG.STORAGE_KEYS;
    }

    /**
     * 回答データを保存
     * @param {Object} answers - 回答データ
     */
    saveAnswers(answers) {
        try {
            sessionStorage.setItem(this.storageKeys.ANSWERS, JSON.stringify(answers));
        } catch (error) {
            console.error('Failed to save answers:', error);
            throw new Error('StorageError');
        }
    }

    /**
     * 回答データを読み込み
     * @returns {Object} 回答データ
     */
    loadAnswers() {
        try {
            const data = sessionStorage.getItem(this.storageKeys.ANSWERS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load answers:', error);
            return {};
        }
    }

    /**
     * 試験開始時刻を保存
     * @param {Date} startTime - 開始時刻
     */
    saveStartTime(startTime) {
        try {
            sessionStorage.setItem(this.storageKeys.START_TIME, startTime.toISOString());
        } catch (error) {
            console.error('Failed to save start time:', error);
            throw new Error('StorageError');
        }
    }

    /**
     * 試験開始時刻を読み込み
     * @returns {Date|null} 開始時刻
     */
    loadStartTime() {
        try {
            const data = sessionStorage.getItem(this.storageKeys.START_TIME);
            return data ? new Date(data) : null;
        } catch (error) {
            console.error('Failed to load start time:', error);
            return null;
        }
    }

    /**
     * 現在の問題インデックスを保存
     * @param {number} index - 問題インデックス
     */
    saveCurrentQuestion(index) {
        try {
            sessionStorage.setItem(this.storageKeys.CURRENT_QUESTION, index.toString());
        } catch (error) {
            console.error('Failed to save current question:', error);
        }
    }

    /**
     * 現在の問題インデックスを読み込み
     * @returns {number} 問題インデックス
     */
    loadCurrentQuestion() {
        try {
            const data = sessionStorage.getItem(this.storageKeys.CURRENT_QUESTION);
            return data ? parseInt(data, 10) : 0;
        } catch (error) {
            console.error('Failed to load current question:', error);
            return 0;
        }
    }

    /**
     * 試験データ全体を保存
     * @param {Object} examData - 試験データ
     */
    saveExamData(examData) {
        try {
            const dataToSave = {
                questions: examData.questions,
                startTime: examData.startTime,
                timeLimit: examData.timeLimit,
                savedAt: new Date().toISOString()
            };
            sessionStorage.setItem(this.storageKeys.EXAM_DATA, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Failed to save exam data:', error);
            throw new Error('StorageError');
        }
    }

    /**
     * 試験データ全体を読み込み
     * @returns {Object|null} 試験データ
     */
    loadExamData() {
        try {
            const data = sessionStorage.getItem(this.storageKeys.EXAM_DATA);
            if (!data) return null;

            const examData = JSON.parse(data);
            // 開始時刻をDateオブジェクトに変換
            if (examData.startTime) {
                examData.startTime = new Date(examData.startTime);
            }
            return examData;
        } catch (error) {
            console.error('Failed to load exam data:', error);
            return null;
        }
    }

    /**
     * 全ての試験関連データをクリア
     */
    clearExamData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                sessionStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Failed to clear exam data:', error);
        }
    }

    /**
     * ストレージの使用状況をチェック
     * @returns {Object} ストレージ使用状況
     */
    getStorageInfo() {
        try {
            const used = JSON.stringify(sessionStorage).length;
            const available = 5 * 1024 * 1024; // 5MB（概算）

            return {
                used,
                available,
                usagePercentage: (used / available) * 100,
                isNearLimit: (used / available) > 0.8
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return { used: 0, available: 0, usagePercentage: 0, isNearLimit: false };
        }
    }

    /**
     * ストレージが利用可能かチェック
     * @returns {boolean} ストレージ利用可能性
     */
    isStorageAvailable() {
        try {
            const testKey = '_storage_test_';
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.error('Storage not available:', error);
            return false;
        }
    }

    /**
     * 試験の継続が可能かチェック
     * @returns {boolean} 継続可能性
     */
    canResumeExam() {
        const examData = this.loadExamData();
        if (!examData || !examData.startTime) return false;

        const elapsed = (new Date() - examData.startTime) / 1000;
        return elapsed < EXAM_CONFIG.TIME_LIMIT;
    }
}