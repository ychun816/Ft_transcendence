import { FastifyInstance } from "fastify";
import { FastifyRequest } from "fastify";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import bcrypt from "bcrypt";
import { PROJECT_ROOT } from "../server.js";
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { request } from "http";

const secretKey = process.env.COOKIE_SECRET;

function getFieldValue(field: any): string | undefined {
	if (!field) return undefined;
	if (Array.isArray(field)) field = field[0];
	if (typeof field.value === "string") return field.value;
	if (Buffer.isBuffer(field.value)) return field.value.toString();
	return undefined;
}

function extractTokenFromRequest(request: FastifyRequest): { userId: number; username: string } | null {
	const authHeader = request.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}

	const token = authHeader.substring(7);
	try {
		const decoded = jwt.verify(token, secretKey || 'fallback-secret-key') as any;
		return { userId: decoded.id, username: decoded.username };
	} catch (error) {
		console.error('JWT verification error:', error);
		return null;
	}
}

export async function registerProfileRoute(
	app: FastifyInstance,
	prisma: PrismaClient
) {
	app.get(
		"/api/profile",
		async (
			request: FastifyRequest<{ Querystring: { username: string } }>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const username = request.query.username as string;
			if (!username) {
				reply.status(400).send({ error: "Username is required" });
				return;
			}
			const { code, data } = await getUserInfo(username, prisma);
			reply.status(code).send(data);
		}
	);

	// HANDLE AVATAR REQUEST
	app.post("/api/profile/avatar", async (request: FastifyRequest, reply) => {
		const auth = extractTokenFromRequest(request);
		if (!auth) {
			return reply.status(401).send({ error: 'Unauthorized' });
		}

		const file = await request.file();
		console.log("file: ", file);
		if (!file) {
			reply.status(400).send({ error: "Avatar file is required" });
			return;
		}

		const username = auth.username;
		console.log("username: ", username);
		if (!username) {
			reply.status(400).send({ error: "Username is required" });
			return;
		}
		console.log("ABOUT TO UPDATE AVATAR");
		const avatarPath = await updateAvatar(prisma, username, file);
		console.log("avatarPath: ", avatarPath);
		reply.status(200).send({ success: true, avatarPath });
	});

	// HANDLE USERNAME REQUEST
	app.post(
		"/api/profile/username",
		async (
			request: FastifyRequest<{
				Querystring: { username: string; newUsername: string };
			}>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const { username, newUsername } = request.body as {
				username: string;
				newUsername: string;
			};

			// Use the username from the JWT token for security
			const currentUsername = auth.username;
			if (!currentUsername || !newUsername) {
				reply.status(400).send({ error: "Username is required" });
				return;
			}
			try {
				await updateUsername(prisma, currentUsername, newUsername);
				reply.status(200).send({ success: true });
			} catch (err) {
				reply
					.status(400)
					.send({
						error: "Username already exists or update failed",
					});
			}
		}
	);

	// HANDLE PASSWORD REQUEST
	app.post(
		"/api/profile/password",
		async (
			request: FastifyRequest<{
				Querystring: { username: string; newPassword: string };
			}>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const { username, newPassword } = request.body as {
				username: string;
				newPassword: string;
			};

			// Use the username from the JWT token for security
			const currentUsername = auth.username;
			if (!currentUsername || !newPassword) {
				reply.status(400).send({ error: "Username and password are required" });
				return;
			}
			try {
				await updatePassword(prisma, currentUsername, newPassword);
				reply.status(200).send({ success: true });
			} catch (err) {
				reply.status(400).send({ error: "Update failed" });
			}
		}
	);

	// HANDLE MATCH HISTORY DISPLAY
	app.get(
		"/api/profile/matches",
		async (
			request: FastifyRequest<{ Querystring: { username: string } }>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const username = request.query.username as string;
			const user = await prisma.user.findUnique({ where: { username } });
			if (!user) {
				reply.status(404).send({ error: "User not found" });
			} else {
				const matches = await prisma.match.findMany({
					where: {
						OR: [{ player1Id: user.id }, { player2Id: user.id }],
					},
					orderBy: { playedAt: "desc" },
					include: {
						player1: { select: { username: true } },
						player2: { select: { username: true } },
					},
				});
				console.log("Matches : ", matches);
				reply.status(200).send(matches);
			}
		}
	);

	app.get(
		"/api/profile/friends",
		async (
			request: FastifyRequest<{ Querystring: { username: string } }>,
			reply
		) => {
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			const username = request.query.username as string;
			try
			{
				const user = await prisma.user.findUnique({
					where: { username },
					select: {
						id: true,
						friends: {
							select: {
								id: true,
								username: true,
								avatarUrl: true,
								gamesPlayed: true,
							}
						}
					}
				});
				if (!user)
					reply.status(404).send({ error: "User not found" });
				console.log("Friends: ", user?.friends);
				reply.status(200).send(user?.friends);
			} catch (error) {
				console.error("Error fetching friends:", error);
				reply.status(500).send({ error: "Internal server error" });
			}
		}
	);
}

async function getUserInfo(username: string, prisma: PrismaClient) {
	if (!username) {
		return { code: 401, data: { error: "Not authenticated" } };
	}
	const user = await prisma.user.findUnique({
		where: { username },
		select: {
			username: true,
			avatarUrl: true,
			passwordHash: true,
			gamesPlayed:true,
			wins: true,
			losses: true,
			createdAt: true,
		},
	});
	if (!user) {
		return { code: 404, data: { error: "User not found" } };
	}
	return { code: 200, data: user };
}

async function updateUsername(
	prisma: PrismaClient,
	username: string,
	newUsername: string
) {
	await prisma.user.update({
		where: { username },
		data: { username: newUsername },
	});
}

async function updatePassword(
	prisma: PrismaClient,
	username: string,
	newPassword: string
) {
	const hashedPassword = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({
		where: { username },
		data: { passwordHash: hashedPassword },
	});
}

// async function updateAvatar(prisma: PrismaClient, username: string, file: any): Promise<string> {
// 	const uploadPath = path.join(PROJECT_ROOT, "./public/avatars", `${username}.png`);
// 	console.log("uploadPath: ", uploadPath);
// 	await pipeline(file, fs.createWriteStream(uploadPath));
// 	if (fs.existsSync(uploadPath)) {
// 		console.log("✅ Fichier sauvegardé avec succès");
// 		const stats = fs.statSync(uploadPath);
// 		console.log("📁 Taille du fichier:", stats.size, "bytes");
// 	} else {
// 		console.log("❌ Fichier non trouvé après sauvegarde");
// 	}
// 	const avatarPath = `/avatars/${username}.png`;
// 	console.log("avatarPath: ", avatarPath);

// 	await prisma.user.update({
// 		where: { username },
// 		data: { avatarUrl: avatarPath }
// 	});
// 	return avatarPath;
// }

async function updateAvatar(
	prisma: PrismaClient,
	username: string,
	file: any
): Promise<string> {
	const ext = path.extname(file.filename) || ".png";
	const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
	const timestamp = Date.now();
	const hash = createHash('md5').update(safeUsername + timestamp).digest('hex').substring(0, 8);

	const fileName = `${safeUsername}_${hash}${ext}`;
	const uploadPath = path.join(
		PROJECT_ROOT,
		"./public/avatars/",
		`${fileName}`
	);
	console.log("uploadPath: ", uploadPath);

	await pipeline(file, fs.createWriteStream(uploadPath));
	if (fs.existsSync(uploadPath)) {
		console.log("✅ Fichier sauvegardé avec succès");
		const stats = fs.statSync(uploadPath);
		console.log("📁 Taille du fichier:", stats.size, "bytes");
	}
	const avatarPath = `/public/avatars/${fileName}`;
	console.log("avatarPath: ", avatarPath);

	await prisma.user.update({
		where: { username },
		data: { avatarUrl: avatarPath },
	});
	return avatarPath;
}
