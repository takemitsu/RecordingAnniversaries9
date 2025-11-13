export default async function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
      <div className="px-4 py-6 md:px-8 md:py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          プライバシーポリシー
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            最終更新日: {lastUpdated}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. 基本方針
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Recording
              Anniversaries（以下「本サービス」）は、個人が開発・運営する非営利のWebアプリケーションです。
              ユーザーの個人情報保護に努めますが、個人開発プロジェクトのため、完全なセキュリティは保証できません。
              ご利用は自己責任でお願いします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. 収集する情報
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  2.1 OAuth認証情報
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>GoogleのOAuth認証で取得する公開情報</li>
                  <li>
                    ユーザーID、表示名、メールアドレス、プロフィール画像URL等
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  2.2 Passkey認証情報
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>WebAuthn（Passkey）認証で生成される認証情報</li>
                  <li>
                    Credential
                    ID、公開鍵、認証デバイス情報（デバイス名、登録日時等）
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  2.3 サービス利用情報
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    登録したCollection（記念日グループ）の名前・説明・表示設定
                  </li>
                  <li>
                    登録したAnniversary（記念日）の名前・日付・説明・表示設定
                  </li>
                  <li>アクセスログ、利用状況データ</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. 情報の利用目的
            </h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>本サービスの提供・運営</li>
              <li>ユーザー認証・識別</li>
              <li>記念日管理機能の提供</li>
              <li>サービス改善のための分析</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              4. 情報の共有・公開
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  4.1 公開される情報
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>
                    登録した記念日情報は、表示設定に応じて他のユーザーには公開されません（プライベート設計）
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  4.2 第三者への提供
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              5. 情報の管理・削除
            </h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                アカウント削除時にユーザー情報は削除されますが、完全な削除には時間がかかる場合があります
              </li>
              <li>個人開発のため、完全なデータ削除は保証できません</li>
              <li>データの復旧・回復サービスは提供していません</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              6. セキュリティ
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                ⚠️ 重要な注意事項
              </p>
              <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>
                  本サービスは個人開発プロジェクトのため、企業レベルのセキュリティは保証できません
                </li>
                <li>データの漏洩、消失、改ざん等のリスクがあります</li>
                <li>機密情報や重要な個人情報の登録は避けてください</li>
                <li>利用は完全に自己責任となります</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              7. 外部サービス
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              本サービスは以下の外部サービスを利用しています：
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
              <li>Google OAuth認証プロバイダー</li>
              <li>WebAuthn（Passkey）認証</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              これらのサービスにはそれぞれのプライバシーポリシーが適用されます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              8. 使用しているアイコン
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              本サービスは GitHub Octicons (MIT License) を使用しています。
              Copyright (c) GitHub, Inc.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              9. 免責事項
            </h2>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1">
                <li>
                  本サービスの利用により生じた損害について、開発者は一切の責任を負いません
                </li>
                <li>サービスの継続性、安定性、セキュリティは保証されません</li>
                <li>予告なくサービスが終了する可能性があります</li>
                <li>データのバックアップは各自で行ってください</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              10. 本ポリシーの変更
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              本ポリシーは予告なく変更される場合があります。
              重要な変更がある場合は、サービス内で通知します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              11. お問い合わせ
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              本ポリシーに関するお問い合わせは、
              <a
                href="https://github.com/takemitsu/RecordingAnniversaries9/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 underline"
              >
                GitHubのIssues
              </a>
              でお願いします。
              ただし、個人開発のため迅速な対応は保証できません。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
