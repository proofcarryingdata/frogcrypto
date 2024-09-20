import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

export const userIdsTable = pgTable(
  "user_ids",
  {
    id: serial("id").primaryKey(),
    semaphoreId: text("semaphore_id").notNull(),
    // a local signer public key that can be used to authenticate the user as its root semaphore id
    signerPk: text("signer_pk").notNull(),
    isAdmin: boolean("is_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    semaphoreIdSignerPk: unique().on(table.semaphoreId, table.signerPk),
  })
);

export const userFeedsTable = pgTable(
  "user_feeds",
  {
    id: serial("id").primaryKey(),
    semaphoreId: text("semaphore_id").notNull(),
    feedId: text("feed_id").notNull(),
    lastFetchedAt: timestamp("last_fetched_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    semaphoreFeed: unique().on(table.semaphoreId, table.feedId),
  })
);

export type UserFeed = typeof userFeedsTable.$inferSelect;

export const userScoresTable = pgTable(
  "user_scores",
  {
    id: serial("id").primaryKey(),
    semaphoreId: text("semaphore_id").notNull(),
    score: integer("score").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    semaphoreId: unique().on(table.semaphoreId),
  })
);

export const frogsTable = pgTable(
  "frogs",
  {
    id: integer("id").primaryKey(),
    uuid: uuid("uuid").notNull(),
    frog: jsonb("frog").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uuid: unique().on(table.uuid),
  })
);
