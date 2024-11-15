import { integer, serial, smallint, varchar } from "drizzle-orm/pg-core";

import type { DataTableType, DataType } from "../types/table-data-type";
import { createDataColumns } from "../utils/create-data-columns";
import { lumpikTable } from "../utils/lumpik-table";
import { shops } from "./shops.table";

export const shopComments = lumpikTable("shop_comments", {
  id: serial("id").primaryKey(),
  rate: smallint("rate").notNull(),
  comment: varchar("comment", { length: 255 }).notNull(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, {
      onDelete: "cascade",
    }),
  ...createDataColumns(),
});

export type ShopComment<T extends DataType = "select"> = DataTableType<
  typeof shopComments,
  T
>;
