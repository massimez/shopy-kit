import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { jsonValidator } from "@/lib/utils/validator";
import { adminMiddleware } from "@/middleware/admin";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	cleanupOrphanFiles,
	commitUploadsByFileKeys,
	createFolder,
	deleteFolder,
	deleteUploadedFile,
	listFolders,
	listUploads,
	moveUploadedFile,
	type PresignParams,
	presignUpload,
} from "./storage.service";

const presignSchema = z.object({
	fileName: z.string(),
	contentType: z.string(),
	visibility: z.enum(["public", "private"]).optional().default("public"),
	size: z.number().optional(),
	folderId: z.string().nullable().optional(),
});

const commitSchema = z.object({
	fileKeys: z.array(z.string()),
});

// ---------------------------------------------------
// 🚀 Router
// ---------------------------------------------------

const storageRoutes = createRouter()
	// STEP 1: Request presigned upload URL + create pending upload record
	.post(
		"/presign",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(presignSchema),
		async (c) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: <>
				const user = c.get("user")!;
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const tenantId = activeOrgId || user?.id;
				const presignParams: PresignParams = c.req.valid("json");

				const result = await presignUpload(
					presignParams,
					user,
					tenantId,
					activeOrgId,
				);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "presign upload");
			}
		},
	)

	// STEP 2: Commit the upload once the file is successfully uploaded
	.post(
		"/commit",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(commitSchema),
		async (c) => {
			try {
				const commitParams = c.req.valid("json");
				const result = await commitUploadsByFileKeys(commitParams.fileKeys);

				if (result.error) {
					return c.json(
						createErrorResponse("CommitError", result.error, [
							{
								code: "UPLOAD_COMMIT_FAILED",
								path: [],
								message: result.error,
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(result.data, "Uploads committed successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "commit uploads");
			}
		},
	)

	// DELETE: Remove uploaded file (with ownership validation)
	.delete(
		"/:key",
		authMiddleware,
		hasOrgPermission("storage:delete"),
		async (c) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: <>
				const user = c.get("user")!;
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { key } = c.req.param();

				const result = await deleteUploadedFile(key, user, activeOrgId);

				if (result.error) {
					return c.json(
						createErrorResponse("ForbiddenError", result.error, [
							{
								code: "FILE_ACCESS_DENIED",
								path: ["key"],
								message: result.error,
							},
						]),
						403,
					);
				}

				return c.json(
					createSuccessResponse(result.data, "File deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete upload");
			}
		},
	)

	// PATCH: Move uploaded file
	.patch(
		"/:key",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(z.object({ folderId: z.string().nullable() })),
		async (c) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: <>
				const user = c.get("user")!;
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { key } = c.req.param();
				const { folderId } = c.req.valid("json");

				const result = await moveUploadedFile(key, folderId, user, activeOrgId);

				if (result.error) {
					return c.json(
						createErrorResponse("MoveError", result.error, [
							{
								code: "FILE_MOVE_FAILED",
								path: ["folderId"],
								message: result.error,
							},
						]),
						400,
					);
				}

				return c.json(
					createSuccessResponse(result.data, "File moved successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "move upload");
			}
		},
	)

	// POST: Cleanup orphan files (admin only or scheduled job)
	.post("/cleanup", authMiddleware, adminMiddleware, async (c) => {
		try {
			const result = await cleanupOrphanFiles();
			return c.json(
				createSuccessResponse(result, "Orphan files cleaned up successfully"),
			);
		} catch (error) {
			return handleRouteError(c, error, "cleanup orphan files");
		}
	})

	// GET: List uploads
	// FOLDERS: Create a new folder
	.post(
		"/folders",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(
			z.object({
				name: z.string().min(1),
				parentId: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: <>
				const user = c.get("user")!;
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { name, parentId } = c.req.valid("json");

				const result = await createFolder(
					{ name, parentId, organizationId: activeOrgId },
					user,
				);

				return c.json(
					createSuccessResponse(result, "Folder created successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "create folder");
			}
		},
	)

	// FOLDERS: List folders
	.get(
		"/folders",
		authMiddleware,
		hasOrgPermission("storage:read"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const query = c.req.query();
				const parentId = query.parentId;

				const result = await listFolders(
					activeOrgId,
					parentId === "null" || parentId === undefined ? null : parentId,
				);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "list folders");
			}
		},
	)

	// FOLDERS: Delete folder
	.delete(
		"/folders/:id",
		authMiddleware,
		hasOrgPermission("storage:delete"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.param();

				await deleteFolder(id, activeOrgId);

				return c.json(
					createSuccessResponse(null, "Folder deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete folder");
			}
		},
	)

	// GET: List uploads
	.get("/", authMiddleware, hasOrgPermission("storage:read"), async (c) => {
		try {
			// biome-ignore lint/style/noNonNullAssertion: <>
			const user = c.get("user")!;
			const activeOrgId = c.get("session")?.activeOrganizationId as string;
			const {
				page = "1",
				limit = "50",
				status,
				search,
				folderId,
			} = c.req.query();

			const offset =
				(Number.parseInt(page, 10) - 1) * Number.parseInt(limit, 10);

			const result = await listUploads(user, {
				organizationId: activeOrgId,
				status: status as "pending" | "committed" | "deleted",
				limit: Number.parseInt(limit, 10),
				offset,
				search,
				folderId:
					folderId === "null" || folderId === undefined ? null : folderId,
			});

			return c.json(createSuccessResponse(result));
		} catch (error) {
			return handleRouteError(c, error, "list uploads");
		}
	});

export default storageRoutes;
