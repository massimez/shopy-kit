import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	isNull,
	sql,
} from "drizzle-orm"; // Assuming isNull is needed here too
import type { PgTable } from "drizzle-orm/pg-core";
import type { OffsetPaginationParams } from "@/types/api";

export async function getTotal(db: any, table: any, orgId: string) {
	// Added orgId as it's needed for filtering
	const result = await db
		.select({ count: sql`count(*)` })
		.from(table)
		.where(and(eq(table.organizationId, orgId), isNull(table.deletedAt)));
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

interface WithPaginationAndTotalParams<T extends PgTable> {
	db: any;
	query: any;
	table: T;
	params: OffsetPaginationParams;
	orgId: string;
	baseFilters?: any;
}

export async function withPaginationAndTotal<
	T extends PgTable & { organizationId: any; deletedAt: any },
>(args: WithPaginationAndTotalParams<T>) {
	const { db, table, params, orgId } = args;

	// Default to organization-scoped soft delete filter
	const baseFilters =
		args.baseFilters ??
		and(eq(table.organizationId, orgId), isNull(table.deletedAt));

	// Build the base query with filters
	const baseQuery = db.select().from(table).where(baseFilters);

	// Apply pagination to get data
	const paginatedQuery = withPagination(baseQuery, table, params);

	// Build count query with same filters
	const countQuery = db
		.select({ count: count() })
		.from(table)
		.where(baseFilters);

	const [data, totalResult] = await Promise.all([paginatedQuery, countQuery]);

	return {
		data,
		total: totalResult[0]?.count ?? 0,
	};
}
