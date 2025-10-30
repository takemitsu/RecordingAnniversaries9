import { relations } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

// Users Table
// 既存のLaravelプロジェクトと互換性を保つ
export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true })
    .primaryKey()
    .autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { mode: "date" }),
  password: varchar("password", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  rememberToken: varchar("remember_token", { length: 100 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .onUpdateNow(),
});

// Entities Table (記念日グループ)
// ソフトデリート対応
export const entities = mysqlTable(
  "entities",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    desc: text("desc"),
    status: tinyint("status", { unsigned: true }).notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .onUpdateNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" }), // ソフトデリート
  },
  (table) => ({
    userIdIdx: index("entities_user_id_index").on(table.userId),
  }),
);

// Days Table (個別の記念日)
// ソフトデリート対応
// 注意: anniv_at は DATE 型（datetime ではない）
export const days = mysqlTable(
  "days",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    entityId: bigint("entity_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    desc: text("desc"),
    annivAt: date("anniv_at", { mode: "string" }).notNull(), // DATE型（日付のみ）
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .onUpdateNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" }), // ソフトデリート
  },
  (table) => ({
    entityIdIdx: index("days_entity_id_index").on(table.entityId),
  }),
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  entities: many(entities),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
  user: one(users, {
    fields: [entities.userId],
    references: [users.id],
  }),
  days: many(days),
}));

export const daysRelations = relations(days, ({ one }) => ({
  entity: one(entities, {
    fields: [days.entityId],
    references: [entities.id],
  }),
}));

// Auth.js用テーブル
// OAuth連携情報
export const accounts = mysqlTable(
  "accounts",
  {
    userId: bigint("userId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

// Auth.jsセッション（既存のLaravelのsessionsテーブルと区別）
export const authSessions = mysqlTable("auth_sessions", {
  sessionToken: varchar("sessionToken", { length: 255 })
    .notNull()
    .primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

export type Day = typeof days.$inferSelect;
export type NewDay = typeof days.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;
