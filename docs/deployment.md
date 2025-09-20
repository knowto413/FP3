# GitHub Pagesデプロイ手順

## 1. GitHubリポジトリ作成

1. GitHubにログイン
2. 「New repository」をクリック
3. リポジトリ名: `FP3` または任意の名前
4. 「Public」に設定
5. 「Create repository」をクリック

## 2. ローカルリポジトリの設定

```bash
# 既に実行済み
git init
git add .
git commit -m "Initial commit: FP3級CBTデモ試験システム"
```

## 3. GitHubリポジトリに接続

```bash
# あなたのGitHubユーザー名とリポジトリ名に置き換え
git remote add origin https://github.com/YOUR_USERNAME/FP3.git
git branch -M main
git push -u origin main
```

## 4. GitHub Pagesの有効化

1. GitHubリポジトリページで「Settings」タブをクリック
2. 左サイドバーの「Pages」をクリック
3. 「Source」で「Deploy from a branch」を選択
4. 「Branch」で「main」を選択
5. 「Folder」で「/ (root)」を選択
6. 「Save」をクリック

## 5. デプロイ確認

- 数分後にサイトが利用可能になります
- URL: `https://YOUR_USERNAME.github.io/FP3/`

## 📝 注意事項

- GitHub Pagesは静的サイトのみサポート
- 変更はpush後数分で反映
- カスタムドメインも設定可能