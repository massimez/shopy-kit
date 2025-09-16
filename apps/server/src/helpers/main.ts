import { asc, desc, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { OffsetPaginationParams } from "@/types/api";

export async function getTotal(db: any, table: any) {
	const result = await db.select({ count: sql`count(*)` }).from(table);
	return result[0].count;
}

// Simple helper to apply pagination to any query
export function withPagination<T extends PgTable>(
	query: any,
	table: T,
	params: OffsetPaginationParams,
) {
	const { limit, offset, orderBy, direction } = params;

	let result = query.limit(limit).offset(offset);

	if (orderBy) {
		const columns = getTableColumns(table);
		const column = columns[orderBy as keyof typeof columns];

		if (column) {
			const order = direction === "desc" ? desc(column) : asc(column);
			result = result.orderBy(order);
		}
	}

	return result;
}

export async function withPaginationAndTotal<T extends PgTable>(
	db: any,
	query: any,
	table: T,
	params: OffsetPaginationParams,
) {
	const paginatedQuery = withPagination(query, table, params);

	const [data, totalResult] = await Promise.all([
		paginatedQuery,
		db.select({ count: sql`count(*)` }).from(table),
	]);

	return {
		data,
		total: totalResult[0].count,
	};
}
