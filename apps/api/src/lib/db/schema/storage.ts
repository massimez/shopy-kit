import {
	bigint,
	foreignKey,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { softAudit } from "./helpers/common";
import { organization } from "./organization";

export const organizationStorageLimits = pgTable(
	"organization_storage_limits",
	{
		organizationId: text("organization_id")
			.primaryKey()
			.references(() => organization.id, { onDelete: "cascade" }),
		storageLimit: bigint("storage_limit", { mode: "number" })
			.notNull()
			.default(1073741824), // 1GB default
		currentUsage: bigint("current_usage", { mode: "number" })
			.notNull()
			.default(0),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
);

export const storageFolders = pgTable(
	"storage_folders",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: varchar("name", { length: 255 }).notNull(),
		parentId: uuid("parent_id"),
		organizationId: text("organization_id"),
		...softAudit,
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
		}).onDelete("cascade"),
	],
);

export const uploads = pgTable(
	"uploads",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		fileKey: text("file_key").notNull(),
		bucket: varchar("bucket", { length: 100 }).notNull(),
		contentType: varchar("content_type", { length: 100 }),
		size: integer("size"), // in bytes

		//structured metadata (like dimensions, thumbnails, etc.)
		metadata: jsonb("metadata").default(null),

		folderId: uuid("folder_id"),

		// Who initiated the upload (optional)
		userId: text("user_id"),
		organizationId: text("organization_id"),

		// Upload status
		status: varchar("status", { length: 20 })
			.notNull()
			.$default(() => "pending"), // "pending" | "committed" | "failed"

		// When the upload token was generated
		expiresAt: timestamp("expires_at", { withTimezone: true }).defaultNow(),

		// Audit fields
		...softAudit,
	},
	(table) => [
		foreignKey({
			columns: [table.folderId],
			foreignColumns: [storageFolders.id],
		}).onDelete("set null"),
	],
);
