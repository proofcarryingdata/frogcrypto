import { pgTable, unique, serial, text, timestamp, uuid, jsonb, boolean, integer, pgEnum } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const socialRequestStatus = pgEnum("social_request_status", ['pending', 'connected', 'declined'])



export const userFeeds = pgTable("user_feeds", {
	id: serial("id").primaryKey().notNull(),
	semaphoreId: text("semaphore_id").notNull(),
	feedId: text("feed_id").notNull(),
	lastFetchedAt: timestamp("last_fetched_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		userFeedsSemaphoreIdFeedIdUnique: unique("user_feeds_semaphore_id_feed_id_unique").on(table.semaphoreId, table.feedId),
	}
});

export const frogs = pgTable("frogs", {
	id: serial("id").primaryKey().notNull(),
	uuid: uuid("uuid").notNull(),
	frog: jsonb("frog").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
},
(table) => {
	return {
		frogsUuidUnique: unique("frogs_uuid_unique").on(table.uuid),
	}
});

export const userIds = pgTable("user_ids", {
	id: serial("id").primaryKey().notNull(),
	semaphoreId: text("semaphore_id").notNull(),
	signerPk: text("signer_pk").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	isAdmin: boolean("is_admin").default(false).notNull(),
},
(table) => {
	return {
		userIdsSemaphoreIdSignerPkUnique: unique("user_ids_semaphore_id_signer_pk_unique").on(table.semaphoreId, table.signerPk),
	}
});

export const userScores = pgTable("user_scores", {
	id: serial("id").primaryKey().notNull(),
	score: integer("score").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	semaphoreId: text("semaphore_id").notNull(),
	friendCount: integer("friend_count").default(0).notNull(),
},
(table) => {
	return {
		userScoresSemaphoreIdUnique: unique("user_scores_semaphore_id_unique").on(table.semaphoreId),
	}
});

export const socialRequests = pgTable("social_requests", {
	id: serial("id").primaryKey().notNull(),
	party1: text("party1").notNull(),
	party2: text("party2").notNull(),
	party1Pod: text("party1_pod"),
	party1PodTimestamp: timestamp("party1_pod_timestamp", { mode: 'string' }),
	party2Pod: text("party2_pod"),
	party2PodTimestamp: timestamp("party2_pod_timestamp", { mode: 'string' }),
	status: socialRequestStatus("status").default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	version: integer("version").default(1).notNull(),
},
(table) => {
	return {
		socialRequestsParty1Party2Unique: unique("social_requests_party1_party2_unique").on(table.party1, table.party2),
	}
});