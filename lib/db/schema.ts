import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
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

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .onUpdateNow(),
});

export const accounts = mysqlTable(
  "accounts",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
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

export const sessions = mysqlTable("sessions", {
  sessionToken: varchar("session_token", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const authenticators = mysqlTable(
  "authenticators",
  {
    credentialID: varchar("credential_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    credentialPublicKey: varchar("credential_public_key", {
      length: 255,
    }).notNull(),
    counter: int("counter").notNull(),
    credentialDeviceType: varchar("credential_device_type", {
      length: 255,
    }).notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: varchar("transports", { length: 255 }),
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const collections = mysqlTable(
  "collections",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    isVisible: tinyint("is_visible", { unsigned: true }).notNull().default(1),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => ({
    userIdIdx: index("collections_user_id_index").on(table.userId),
  }),
);

export const anniversaries = mysqlTable(
  "anniversaries",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    collectionId: bigint("collection_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    anniversaryDate: date("anniversary_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => ({
    collectionIdIdx: index("anniversaries_collection_id_index").on(
      table.collectionId,
    ),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  anniversaries: many(anniversaries),
}));

export const anniversariesRelations = relations(anniversaries, ({ one }) => ({
  collection: one(collections, {
    fields: [anniversaries.collectionId],
    references: [collections.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Authenticator = typeof authenticators.$inferSelect;
export type NewAuthenticator = typeof authenticators.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

export type Anniversary = typeof anniversaries.$inferSelect;
export type NewAnniversary = typeof anniversaries.$inferInsert;
