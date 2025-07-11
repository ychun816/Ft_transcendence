import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { fastifyMultipart, Multipart } from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import { UserSignUpCheck } from "../other/signUpCheck.js"
import * as bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
import { PROJECT_ROOT } from "../server.js";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fillUserInArray(
	parts: AsyncIterableIterator<Multipart>,
	reply: FastifyReply
) {
	const fields: Record<string, any> = {};
	let avatarFile: any = null;
	for await (const part of parts) {
		if (part.type === "file" && part.fieldname === "avatar") {
			avatarFile = part;
		} else if (part.type === "field") {
			fields[part.fieldname] = part.value;
		}
	}
	const usernameValue = fields.username;
	const passwordValue = fields.password;

	console.log("usernameValue: ", usernameValue);
	console.log("passwordValue: ", passwordValue);
	if (!usernameValue || !passwordValue) {
		reply
			.code(400)
			.send({
				error: "Invalid user info: missing username or password.",
			});
		return null;
	}
	const hashedPassword = await bcrypt.hash(passwordValue, 10);
	return { usernameValue, passwordValue, hashedPassword, avatarFile };
}

async function saveAvatar(avatarFile: any, username: string): Promise<string> {
	console.log("PROJECT_ROOT", PROJECT_ROOT);
	const avatarsDir = path.join(PROJECT_ROOT, "./public/avatars");
	if (!fs.existsSync(avatarsDir)) {
		fs.mkdirSync(avatarsDir, { recursive: true });
	}

	const safeUsername = username.replace(/[^a-zA-Z0-9_-]/g, '');
	const timestamp = Date.now();
	const hash = createHash('md5').update(safeUsername + timestamp).digest('hex').substring(0, 8);
	const ext = avatarFile.mimetype === 'image/jpeg' ? 'jpg' : 'png';

	const fileName = `${safeUsername}_${hash}.${ext}`;
	const uploadPath = path.join(avatarsDir, fileName);
	await pipeline(avatarFile.file, fs.createWriteStream(uploadPath));
	return `./public/avatars/${fileName}`;
}

async function createUser(
	prisma: PrismaClient,
	username: string,
	hashedPassword: string,
	avatarPath: string
) {
	const existingUser = await prisma.user.findUnique({
		where: { username }
	});

	if (existingUser) {
		throw new Error("Username already exists");
	}
	console.log("About to create new user");
	console.log("avatarUrl: ", avatarPath);
	const user = await prisma.user.create({
		data: {
			username,
			passwordHash: hashedPassword,
			email: "",
			avatarUrl: avatarPath || null,
		},
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true
        }
	});
	return user;
}

export async function registerNewUser(
	app: FastifyInstance,
	prisma: PrismaClient
) {
	app.post("/api/signup", async (request, reply) => {
		const parts = request.parts();
		const userData = await fillUserInArray(parts, reply);
		if (!userData){return;}
		const userInfoForValidation = {
			username: userData.usernameValue,
			password: userData.passwordValue,
			avatar: userData.avatarFile
		};
		console.log("userInfoForValidation: ", userInfoForValidation);
		const checkResult = UserSignUpCheck(userInfoForValidation);
		if (checkResult === true){
			const { usernameValue, hashedPassword, avatarFile } =
				userData;
			console.log("AFTER USER SIGNUP CHECK");
			try {
				let avatarPath = "";
				if (avatarFile)
					avatarPath = await saveAvatar(avatarFile, usernameValue);
				const created = await createUser(
					prisma,
					usernameValue,
					hashedPassword,
					avatarPath
				);

				console.log("Created user:", created);
				reply.code(200).send({ success: true });
			} catch (err: any) {
				console.error("Signup error:", err);
				if (err.message === "Username already exists") {
					reply.code(409).send({ error: "Username already exists" });
				} else {
					reply.code(500).send({
						error: "Failed to create account. Please try again."
					});
				}
			}
		} else {
			reply.code(400).send({ error: checkResult });
			return ;
		}
	});
}
