// シャッフル関連のユーティリティ関数
export class ShuffleUtil {
    /**
     * Fisher-Yatesアルゴリズムによる配列のシャッフル
     * @param {Array} array - シャッフルする配列
     * @returns {Array} シャッフルされた新しい配列
     */
    static fisherYatesShuffle(array) {
        const shuffled = [...array]; // 元の配列をコピー

        for (let i = shuffled.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
        }

        return shuffled;
    }

    /**
     * 配列から指定された数の要素をランダムに選択
     * @param {Array} array - 選択元の配列
     * @param {number} count - 選択する要素数
     * @returns {Array} 選択された要素の配列
     */
    static randomSelect(array, count) {
        if (count >= array.length) {
            return this.fisherYatesShuffle(array);
        }

        const shuffled = this.fisherYatesShuffle(array);
        return shuffled.slice(0, count);
    }

    /**
     * 複数のランダムシードを使用した高度なシャッフル
     * @param {Array} array - シャッフルする配列
     * @param {number} iterations - シャッフル回数
     * @returns {Array} シャッフルされた配列
     */
    static enhancedShuffle(array, iterations = 3) {
        let result = [...array];

        for (let i = 0; i < iterations; i++) {
            result = this.fisherYatesShuffle(result);
        }

        return result;
    }

    /**
     * 重み付きランダム選択
     * @param {Array} items - 選択する項目の配列
     * @param {Array} weights - 各項目の重み
     * @returns {*} 選択された項目
     */
    static weightedRandom(items, weights) {
        if (items.length !== weights.length) {
            throw new Error('Items and weights arrays must have the same length');
        }

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }

        return items[items.length - 1]; // フォールバック
    }
}