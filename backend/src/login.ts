import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function handleLogIn(app: FastifyInstance, prisma: PrismaClient){
	console.log("DEBUG LOGIN MANAGEMENT");
	app.post("/api/login", async (request, reply) => {
			const { username, password } = request.body as { username: string; password: string };

			const user = await prisma.user.findUnique({
				where: { username }
			});
			if (!user)
				return reply.status(401).send({success: false, message: "User not found"});
			const passwordCheck = await bcrypt.compare(password, user.passwordHash);
			if (!passwordCheck)
				return reply.status(401).send({success: false, message: "Wrong password"});
			reply.send( {success: true});
	});
}