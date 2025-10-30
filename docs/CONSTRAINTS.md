# プロジェクト制約事項

## 🚨 重要な制約

### 既存MySQLデータベースへの変更禁止

**絶対に守ること**: 既存のMySQLデータベース（recordingAnniversaries8が使用中）への変更は一切認めない

#### 禁止事項
- ❌ テーブル構造の変更（ALTER TABLE）
- ❌ 新規テーブルの作成（CREATE TABLE）
- ❌ カラムの追加・削除・変更
- ❌ インデックスの追加・削除
- ❌ マイグレーションの実行
- ❌ 既存データの更新・削除

#### 許可事項
- ✅ 既存データの読み取り（SELECT）
- ✅ 新規データの追加（INSERT）- recordingAnniversaries9からのみ
- ✅ recordingAnniversaries9が追加したデータの更新・削除

#### 理由
recordingAnniversaries8（Laravel版）が動作中のため、データベーススキーマやデータを変更すると既存システムが動かなくなる。

#### 実装方針
1. **既存スキーマに合わせる**: Drizzleスキーマは既存のテーブル構造を正確に反映
2. **読み取り専用として扱う**: 既存データは読み取りのみ
3. **共存可能な設計**: recordingAnniversaries8とrecordingAnniversaries9が同じDBを安全に共有できる設計

#### WebAuthn対応について
既存DBに`webauthn_credentials`テーブルが存在しない場合：
- **選択肢1**: Auth.jsのセッションのみで運用（Passkey機能は後回し）
- **選択肢2**: 別のDBまたはストレージを使用
- **選択肢3**: ユーザーに確認を取ってからテーブル追加を検討

## その他の制約

### Node.js バージョン
- Next.js 16 は Node.js 20.9+ が必要

### 日付型
- 記念日フィールドは必ずDATE型（datetime不可）

### ソフトデリート
- `entities`と`days`は`deleted_at`でソフトデリート対応
- 既存の論理削除データも正しく扱う

### 文字コード
- 既存DBの文字コード設定を確認して合わせる必要がある
