import { hc } from "./api-client";

export async function uploadPublic(file: File) {
	const res = await hc.api.storage.presign.$post({
		json: {
			fileName: file.name,
			contentType: file.type,
			visibility: "public",
		},
	});
	const data = await res.json();

	await fetch(data.url, {
		method: "PUT",
		body: file,
		headers: {
			"Content-Type": file.type,
			Origin: window.location.origin,
		},
	});

	return { key: data.key, publicUrl: data.publicUrl };
}

export async function deleteFile(key: string) {
	const res = await hc.api.storage[":key"].$delete({
		param: { key: encodeURIComponent(key) },
	});

	if (!res.ok) throw new Error("Failed to delete file");

	return true;
}
