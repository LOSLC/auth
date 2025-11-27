import * as pg from "drizzle-orm/pg-core";

export const files = pg.pgTable("files", {
  id: pg.uuid("id").defaultRandom().primaryKey().notNull(),
  userId: pg.text("user_id").notNull(),
  name: pg.text("name").notNull(),
  url: pg.text("url"),
  pbRecordId: pg.text("pb_record_id"),
  createdAt: pg.timestamp("created_at").defaultNow().notNull(),
  protected: pg.boolean("protected").default(false).notNull(),
});

export type FileInfo = typeof files.$inferSelect;
export type NewFileInfo = typeof files.$inferInsert;
