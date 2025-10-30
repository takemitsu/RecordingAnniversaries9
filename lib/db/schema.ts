import { relations } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  mysqlTable,
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
    status: tinyint("status").notNull().default(0),
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

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

export type Day = typeof days.$inferSelect;
export type NewDay = typeof days.$inferInsert;
