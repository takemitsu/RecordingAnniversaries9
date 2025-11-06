import crypto from "node:crypto";
import { test as setup } from "@playwright/test";
import * as schema from "@/lib/db/schema";
import { getTestDb } from "./helpers/db-seed";

const authFile = "e2e/.auth/user.json";

/**
 * Setup Project: 認証状態を作成
 * Database strategyに対応した直接セッション作成方式
 */
setup("authenticate", async ({ browser }) => {
  console.log("🔐 Authenticating E2E user...");

  // セッショントークン生成
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日後

  // テストDBに直接セッションを作成
  const db = await getTestDb();
  await db.insert(schema.sessions).values({
    userId: "e2e-user-id",
    sessionToken,
    expires,
  });

  console.log(`✅ Session created: ${sessionToken}`);

  // ブラウザコンテキストを作成
  const context = await browser.newContext();

  // Cookieをブラウザに追加（重要: ブラウザコンテキストに追加）
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      expires: expires.getTime() / 1000,
      httpOnly: true, // Auth.js必須属性
      secure: false, // HTTPなのでfalse
      sameSite: "Lax",
    },
  ]);

  console.log("🍪 Cookie added to browser context");

  // 認証が有効か確認（ページを開いてテスト）
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");

  // リダイレクトされていないか確認
  const currentUrl = page.url();
  if (currentUrl.includes("/auth/signin")) {
    throw new Error(`❌ Authentication failed: redirected to ${currentUrl}`);
  }

  console.log(`✅ Authentication verified: ${currentUrl}`);

  // ブラウザの状態をStorage Stateとして保存
  await context.storageState({ path: authFile });

  console.log(`✅ Storage state saved to ${authFile}`);
  console.log(`🍪 Cookie: ${sessionToken.substring(0, 30)}...`);

  await context.close();
});
