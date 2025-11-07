#!/usr/bin/env tsx
/**
 * Data Import Script for recordingAnniversaries9
 *
 * ra8からエクスポートされたJSONファイルを読み込み、ra9のDBにインポートします。
 *
 * Usage:
 *   npm run import:data <json_file_path>
 *   npm run import:data export.json
 *   DATABASE_URL="mysql://..." npm run import:data export.json
 */

import fs from "node:fs";
import { db } from "@/lib/db";
import { anniversaries, collections, users } from "@/lib/db/schema";

// JSONフォーマットの型定義
interface ExportData {
  version: string;
  exported_at: string;
  source: string;
  stats: {
    total_users: number;
    total_collections: number;
    total_anniversaries: number;
  };
  users: UserData[];
}

interface UserData {
  old_id: number;
  new_uuid: string;
  email: string;
  name: string | null;
  email_verified: string | null;
  created_at: string;
  updated_at: string;
  collections: CollectionData[];
}

interface CollectionData {
  old_id: number;
  name: string;
  description: string | null;
  is_visible: number;
  created_at: string;
  updated_at: string;
  anniversaries: AnniversaryData[];
}

interface AnniversaryData {
  old_id: number;
  name: string;
  description: string | null;
  anniversary_date: string;
  created_at: string;
  updated_at: string;
}

// メイン処理
async function main() {
  // コマンドライン引数からファイルパスを取得
  const jsonFilePath = process.argv[2];

  if (!jsonFilePath) {
    console.error("❌ Error: JSON file path is required");
    console.error("\nUsage:");
    console.error("  npm run import:data <json_file_path>");
    console.error("\nExample:");
    console.error("  npm run import:data export.json");
    console.error(
      '  DATABASE_URL="mysql://..." npm run import:data export.json',
    );
    process.exit(1);
  }

  // ファイルが存在するか確認
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ Error: File not found: ${jsonFilePath}`);
    process.exit(1);
  }

  console.log(`\n📖 Reading ${jsonFilePath}...`);

  // JSONファイルを読み込み
  let data: ExportData;
  try {
    const jsonContent = fs.readFileSync(jsonFilePath, "utf-8");
    data = JSON.parse(jsonContent) as ExportData;
  } catch (error) {
    console.error("❌ Error: Failed to parse JSON file");
    console.error(error);
    process.exit(1);
  }

  // バージョン確認
  if (data.version !== "1.0") {
    console.error(
      `❌ Error: Unsupported JSON version: ${data.version} (expected: 1.0)`,
    );
    process.exit(1);
  }

  // 統計情報を表示
  console.log("✓ Parsed successfully:");
  console.log(`  - Users: ${data.stats.total_users}`);
  console.log(`  - Collections: ${data.stats.total_collections}`);
  console.log(`  - Anniversaries: ${data.stats.total_anniversaries}`);
  console.log(`  - Exported at: ${data.exported_at}`);
  console.log(`  - Source: ${data.source}`);

  // 確認プロンプト（環境変数で無効化可能）
  if (process.env.SKIP_CONFIRMATION !== "true") {
    console.log(
      "\n⚠️  This will import data into the database. Make sure you are using the correct DATABASE_URL.",
    );
    console.log("   Set SKIP_CONFIRMATION=true to skip this confirmation.\n");

    // ユーザーの確認を待つ（Node.js 標準入力）
    const readline = await import("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question("Continue? [y/N]: ", resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== "y") {
      console.log("❌ Import cancelled by user");
      process.exit(0);
    }
  }

  // インポート開始
  console.log("\n🚀 Starting import...\n");

  try {
    await importData(data);
    console.log("\n✅ Import completed successfully!");
    console.log(
      `Total imported: ${data.stats.total_users} users, ${data.stats.total_collections} collections, ${data.stats.total_anniversaries} anniversaries`,
    );
  } catch (error) {
    console.error("\n❌ Import failed:");
    console.error(error);
    process.exit(1);
  }
}

// データインポート処理
async function importData(data: ExportData) {
  let importedUsers = 0;
  let importedCollections = 0;
  let importedAnniversaries = 0;

  // ユーザーごとにインポート
  for (const userData of data.users) {
    try {
      // 1. ユーザーを挿入
      await db.insert(users).values({
        id: userData.new_uuid,
        email: userData.email,
        name: userData.name,
        emailVerified: userData.email_verified
          ? new Date(userData.email_verified)
          : null,
        image: null, // ra8にはないフィールド
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
      });
      importedUsers++;

      // 2. Collectionsを挿入
      for (const collectionData of userData.collections) {
        const [insertedCollection] = await db
          .insert(collections)
          .values({
            userId: userData.new_uuid,
            name: collectionData.name,
            description: collectionData.description,
            isVisible: collectionData.is_visible,
            createdAt: new Date(collectionData.created_at),
            updatedAt: new Date(collectionData.updated_at),
          })
          .$returningId();
        importedCollections++;

        // 3. Anniversariesを挿入
        if (collectionData.anniversaries.length > 0) {
          for (const anniversaryData of collectionData.anniversaries) {
            await db.insert(anniversaries).values({
              collectionId: insertedCollection.id,
              name: anniversaryData.name,
              description: anniversaryData.description,
              anniversaryDate: anniversaryData.anniversary_date,
              createdAt: new Date(anniversaryData.created_at),
              updatedAt: new Date(anniversaryData.updated_at),
            });
            importedAnniversaries++;
          }
        }
      }

      // 進捗表示
      console.log(
        `✓ Imported user: ${userData.email} (${userData.collections.length} collections, ${userData.collections.reduce((sum, c) => sum + c.anniversaries.length, 0)} anniversaries)`,
      );
    } catch (error) {
      console.error(`\n❌ Failed to import user: ${userData.email}`);
      throw error;
    }
  }

  // 統計情報の検証
  if (
    importedUsers !== data.stats.total_users ||
    importedCollections !== data.stats.total_collections ||
    importedAnniversaries !== data.stats.total_anniversaries
  ) {
    console.warn("\n⚠️  Warning: Imported data count mismatch:");
    console.warn(`  Expected: ${data.stats.total_users} users`);
    console.warn(`  Imported: ${importedUsers} users`);
    console.warn(`  Expected: ${data.stats.total_collections} collections`);
    console.warn(`  Imported: ${importedCollections} collections`);
    console.warn(`  Expected: ${data.stats.total_anniversaries} anniversaries`);
    console.warn(`  Imported: ${importedAnniversaries} anniversaries`);
  }
}

// エラーハンドリング
process.on("unhandledRejection", (error) => {
  console.error("\n❌ Unhandled error:");
  console.error(error);
  process.exit(1);
});

// 実行
main();
