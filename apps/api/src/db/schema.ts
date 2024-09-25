import { FrogCryptoFrogData } from "@pcd/passport-interface";
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
  pgEnum,
} from "drizzle-orm/pg-core";

// Define the enum
export const socialRequestStatusEnum = pgEnum("social_request_status", [
  "pending",
  "connected",
  "declined",
]);

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
    frog: jsonb("frog")
      .$type<Omit<FrogCryptoFrogData, "id" | "uuid">>()
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uuid: unique().on(table.uuid),
  })
);

export const socialRequestsTable = pgTable(
  "social_requests",
  {
    id: serial("id").primaryKey(),
    party1: text("party1").notNull(),
    party2: text("party2").notNull(),
    party1POD: text("party1_pod"),
    party1PODTimestamp: timestamp("party1_pod_timestamp"),
    party2POD: text("party2_pod"),
    party2PODTimestamp: timestamp("party2_pod_timestamp"),
    status: socialRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
    version: integer("version").notNull().default(1),
  },
  (table) => ({
    uniqueRequest: unique().on(table.party1, table.party2),
  })
);

export const spiritFrogsTable = pgTable(
  "spirit_frogs",
  {
    id: serial("id").primaryKey(),
    frogId: integer("frog_id").notNull(),
    pod: text("pod").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueFrogId: unique().on(table.frogId),
  })
);
