/* -------------------------------- Logging --------------------------------- */

export function logError(context: string, error: unknown, metadata?: object) {
	console.error(`[${context}]`, {
		error: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
		timestamp: new Date().toISOString(),
		...metadata,
	});
}

export function logInfo(context: string, message: string, metadata?: object) {
	console.log(`[${context}] ${message}`, {
		timestamp: new Date().toISOString(),
		...metadata,
	});
}

export function logWarning(
	context: string,
	message: string,
	metadata?: object,
) {
	console.warn(`[${context}] ${message}`, {
		timestamp: new Date().toISOString(),
		...metadata,
	});
}
