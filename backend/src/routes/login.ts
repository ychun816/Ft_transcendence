import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export const activeSessions = new Map<string, { userId: number; username: string; expiresAt: Date }>();

const secretKey = process.env.COOKIE_SECRET;

export async function handleLogIn(app: FastifyInstance, prisma: PrismaClient){
	console.log("DEBUG LOGIN MANAGEMENT");
	// app.register(cookie, {
	// 	secret: secretKey,
	// 	parseOptions: {},
	// } as FastifyCookieOptions);
	// console.log("DEBUG LOGIN MANAGEMENT 2");

	app.post("/api/login", async (request: FastifyRequest, reply: FastifyReply) => {
			const { username, password } = request.body as { username: string; password: string };

			console.log(username);
			console.log(password);
			try{
				const user = await prisma.user.findUnique({
					where: { username }
				});
				if (!user)
					return reply.status(401).send({success: false, message: "User not found"});
				const passwordCheck = await bcrypt.compare(password, user.passwordHash);
				if (!passwordCheck)
					return reply.status(401).send({success: false, message: "Wrong password"});
				//const token = generateJWT(username,prisma);
				const sessionToken = randomBytes(32).toString('hex');
				const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

				activeSessions.set(sessionToken, {
					userId: user.id,
					username: user.username,
					expiresAt,
				});

				reply.setCookie('sessionId', sessionToken, {
					httpOnly: true,
					secure: true,
					sameSite: 'strict',
					maxAge: 24 * 60 * 60,
					path: '/'
				}).send({success: true});

			} catch (err) {
				console.error('Login error:', err);
				reply.status(500).send({
					success: false,
					message: "Internal server error"
				});
			}
	});

	app.get("/api/me", async (request: FastifyRequest, reply: FastifyReply) =>{
		const sessionId = request.cookies.sessionId;
		if (!sessionId)
			return reply.status(401).send({success: false, message: "Not authenticated"});
		const session = activeSessions.get(sessionId);
		if (!session || session.expiresAt < new Date()) {
			activeSessions.delete(sessionId);
			return reply.status(401).send({ error: "Session expired" });
		}
		try {
			const user = await prisma.user.findUnique({
				where: { id: session.userId },
				select: { id: true, username: true, avatarUrl: true }
			});

			if (!user) {
				activeSessions.delete(sessionId);
				return reply.status(401).send({ error: "User not found" });
			}
			reply.send(user);
		} catch (error) {
			console.error('Get user error:', error);
			reply.status(500).send({ error: "Internal server error" });
		}
	});

	app.post("/api/logout", async (request, reply) => {
		const sessionId = request.cookies.sessionId;

		if (sessionId) {
			activeSessions.delete(sessionId);
		}
		reply.clearCookie('sessionId');
		reply.send({ success: true });
	});
}

export function requireAuth(sessionMap: Map<string, any>) {
	return async (request: any, reply: any) => {
		const sessionId = request.cookies.sessionId;

		if (!sessionId) {
			return reply.status(401).send({ error: "Authentication required" });
		}

		const session = sessionMap.get(sessionId);
		if (!session || session.expiresAt < new Date()) {
			sessionMap.delete(sessionId);
			return reply.status(401).send({ error: "Session expired" });
		}

		request.user = session;
	};
}

export async function secureRoutes(app: FastifyInstance, prisma: PrismaClient) {
    const authMiddleware = requireAuth(activeSessions);

    // Appliquer le middleware aux routes protégées
    app.addHook('preHandler', async (request, reply) => {
        const protectedPaths = [
            '/api/login',
            '/api/profile',
            '/api/profile/avatar',
            '/api/profile/username',
            '/api/profile/password',
            '/api/profile/matches',
            '/api/game',
            '/api/chat'
        ];

        const isProtected = protectedPaths.some(path => 
            request.url.startsWith(path)
        );

        if (isProtected) {
            await authMiddleware(request, reply);
        }
    });
}

// async function generateJWT(username: string, prisma: PrismaClient){
// 	const user = await prisma.user.findUnique({
// 		where: { username }
// 	});
// 	const token = jwt.sign({
// 		id: user?.id,
// 		username: user?.username},
// 		secretKey,
// 		{ expiresIn: '1h' }
// 	);
// 	return token;
// }
