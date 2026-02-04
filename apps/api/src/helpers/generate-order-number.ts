export function generateOrderNumber(): string {
	const time = Math.floor(Date.now() / 1000).toString(36); // compact timestamp

	const array = new Uint32Array(1);
	crypto.getRandomValues(array);
	const rand = (array[0] % 46656).toString(36).padStart(3, "0"); // 36^3

	return `O-${time}-${rand}`;
}
