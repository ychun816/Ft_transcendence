import { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = PrismaClient();

//Add avatar file management with fastify-multipart

function getFieldValue(field: any): string | undefined {
	if (!field) return undefined;
	if (Array.isArray(field)) field = field[0];
	if (typeof field.value === 'string') return field.value;
	if (Buffer.isBuffer(field.value)) return field.value.toString();
	return undefined;
}

export async function registerNewUser(app: FastifyInstance) {
	app.register(fastifyMultipart);
	app.post('/api/signup', async (request, reply) => {
		const data = await request.file();
		if (data){
			const { username, password } = data.fields;
			const usernameValue = getFieldValue(username);
			const passwordValue = getFieldValue(password);
			// PRINT DEBUG SIGNUP FORM
			console.log(`usernameValue: ${usernameValue}`);
			console.log(`passwordValue: ${passwordValue}`);
			// END PRINT DEBUG SIGNUP FORM
			if (!usernameValue || !passwordValue){
				reply.code(400).send({ error: "Invalid user info: missing username or password." });
				return ;
			}
			const avatarFile = data.file;
			const hashedPassword = await bcrypt.hash(passwordValue, 10);
			try {
				await prisma.user.create({
					data: {
						username: usernameValue,
						passwordHash: hashedPassword,
						//avatarUrl: avatarFile,
					}
				});
				reply.code(200).send({ sucess: true });
			} catch {
				reply.code(400).send({ error: "Failed to import User data to the DB" });
			}
		}
	});
}