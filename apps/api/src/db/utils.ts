import type { ColumnBaseConfig } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { SQL, StringChunk, sql } from "drizzle-orm";

type NestedKeyOf<ObjectType> = {
  [Key in keyof ObjectType &
    (number | string)]: ObjectType[Key] extends (infer ArrayType)[]
    ?
        | `${Key}.${number}`
        | `${Key}`
        | (ArrayType extends object
            ? `${Key}.${number}.${NestedKeyOf<ArrayType>}`
            : never)
    : ObjectType[Key] extends object
      ? `${Key}.${NestedKeyOf<ObjectType[Key]>}` | `${Key}`
      : `${Key}`;
}[keyof ObjectType & (number | string)];

type AtPath<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends NestedKeyOf<T[Key]>
      ? AtPath<T[Key], Rest>
      : never
    : Key extends `${number}`
      ? T extends (infer ArrayType)[]
        ? ArrayType extends object
          ? AtPath<ArrayType, Rest>
          : never
        : never
      : never
  : Path extends keyof T
    ? T[Path]
    : never;

export function jsonbField<
  T extends PgColumn<ColumnBaseConfig<"json", "PgJsonb">>,
  P extends NestedKeyOf<T["_"]["data"]>,
>(column: T, path: P) {
  const pathParts = path.split(".");
  let concatenatedSql = "";

  pathParts.forEach((part, index) => {
    if (index === pathParts.length - 1) {
      concatenatedSql += ` ->> '${part}'`;
      return;
    }
    concatenatedSql += `->> '${part}'`;
  });

  return new SQL<AtPath<T["_"]["data"], P>>([
    column,
    new StringChunk(concatenatedSql),
  ]);
}

export function createRawSqlArray(
  itemList: string[],
  castTo: "text" | "integer" | "timestamp" | "float"
) {
  const sanitizedItems: SQL[] = [sql`'{`];
  const rawItems: SQL[] = [];

  for (const item of itemList) {
    // This weird code is to sanitize the input
    const v = item
      .replace(/'/g, "''")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    const withQuotes = `"${v}"`;
    rawItems.push(sql.raw(sql`${withQuotes}`.queryChunks[1]?.toString() ?? ""));
  }

  sanitizedItems.push(sql.join(rawItems, sql`, `));
  sanitizedItems.push(sql`}'`);
  if (castTo === "integer") sanitizedItems.push(sql`::integer[]`);
  else if (castTo === "text") sanitizedItems.push(sql`::text[]`);
  else if (castTo === "timestamp") sanitizedItems.push(sql`::timestamp[]`);
  else if (castTo === "float") sanitizedItems.push(sql`::float[]`);
  else throw new Error("Invalid castTo");

  return sql.join(sanitizedItems);
}
