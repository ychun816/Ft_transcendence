import fastify from "fastify";
import { registerNewUser } from "./routes/signup.js";
import { FastifyRequest } from "fastify";
import { handleLogIn } from "./routes/login.js";
import { registerProfileRoute } from "./routes/profile.js";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket"; // ✅ Import corrigé
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import websocketPlugin from "./plugins/websocket.js";
import chatWebSocketRoutes from "./routes/chat.js";
import cookie from '@fastify/cookie'
import type { FastifyCookieOptions } from '@fastify/cookie'
import { registerNotificationRoutes } from "./routes/notifications.js";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");

const prisma = new PrismaClient();

const HTTP_PORT = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3002;
const HTTPS_PORT = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : 3445;

//const PUBLIC_IP = '192.168.1.196';

let httpsOptions;
try{
	httpsOptions = {
		key: fs.readFileSync(path.join(__dirname, '../ssl/key.pem')),
		cert: fs.readFileSync(path.join(__dirname, '../ssl/cert.pem'))
	};
	console.log("✅ Certificats SSL chargés avec succès");
} catch (error) {
	  console.error("❌ Erreur lors du chargement des certificats SSL:", error.message);
}

const httpsApp = fastify({
  logger: {
    level: 'info',
  },
  https: httpsOptions,
  http2: false,
  trustProxy: true
});

const httpApp = fastify({
  logger: {
    level: 'info',
  }
});

const setupHttpsApp = async () => {
	console.log("📦 Configuration du serveur HTTPS...");

	await httpsApp.register(cookie, {
		secret: process.env.COOKIE_SECRET || 'fallback-secret-key-for-dev',
		parseOptions: {},
	} as FastifyCookieOptions);

	await httpsApp.register(fastifyWebsocket, {
		options: {
		maxPayload: 1024 * 1024 * 10,
		clientTracking: true,
		perMessageDeflate: false,
		},
	});

	await httpsApp.register(fastifyMultipart, {
		limits: {
		fileSize: 5 * 1024 * 1024,
		files: 1
		}
	});

	console.log("📁 Registering avatars static files...");
	await httpsApp.register(async function (fastify) {
		await fastify.register(fastifyStatic, {
			root: path.join(PROJECT_ROOT, "public", "avatars"),
			prefix: "/avatars/",
			decorateReply: false,
		});
	});

	// Register frontend static SECOND  
	console.log("📁 Registering frontend static files...");
	await httpsApp.register(async function (fastify) {
		await fastify.register(fastifyStatic, {
			root: path.join(__dirname, "../../frontend/src"),
			prefix: "/",
		});
	});

	console.log("🛣️ Enregistrement des routes HTTPS...");
	registerNewUser(httpsApp, prisma);
	handleLogIn(httpsApp, prisma);
	registerProfileRoute(httpsApp, prisma);

	await chatWebSocketRoutes(httpsApp, prisma);
	await registerNotificationRoutes(httpsApp, prisma);
	
	// Make sure the setNotFoundHandler comes AFTER all static registrations
	httpsApp.setNotFoundHandler((_req, reply) => {
		reply.sendFile("index.html");
	});
};

const setupHttpApp = async () => {
	console.log("📦 Configuration du serveur HTTP (redirection)...");

	httpApp.addHook('onRequest', async (request, reply) => {
		const clientHost = request.headers.host?.split(':')[0] || 'localhost';
		let redirectHost = PUBLIC_IP;

		// Si la connexion vient de localhost, rediriger vers localhost
		if (clientHost === 'localhost' || clientHost === '127.0.0.1') {
			redirectHost = 'localhost';
		}
		const httpsUrl = `https://${redirectHost}:${HTTPS_PORT}${request.url}`;
		console.log(`🔄 Redirection HTTP → HTTPS: ${request.url} → ${httpsUrl}`);
		reply.redirect(301, httpsUrl);
	});
};

const start = async () => {
	try{
		console.log("🚀 Démarrage des serveurs HTTP et HTTPS...");

		console.log("🗄️ Test de connexion à la base de données...");
		await prisma.$connect();
		console.log("✅ Base de données connectée avec succès");

		await setupHttpsApp();
		//await setupHttpApp();

		console.log(`🔒 Démarrage du serveur HTTPS sur le port ${HTTPS_PORT}...`);
		await httpsApp.listen({
			port: HTTPS_PORT,
			host: '0.0.0.0'
		});

		// console.log(`🌐 Démarrage du serveur HTTP sur le port ${HTTP_PORT}...`);
		// await httpApp.listen({
		// 	port: HTTP_PORT,
		// 	host: '0.0.0.0'
		// });

	} catch (err) {
		console.error("❌ Server startup failed:", err);
		process.exit(1);
	}
};

// process.on('SIGINT', async () => {
//     console.log('🛑 Received SIGINT, shutting down gracefully...');
//     await app.close();
//     await prisma.$disconnect();
//     process.exit(0);
// });

// process.on('SIGTERM', async () => {
//     console.log('🛑 Received SIGTERM, shutting down gracefully...');
//     await app.close();
//     await prisma.$disconnect();
//     process.exit(0);
// });

// process.on('unhandledRejection', (reason, promise) => {
//     console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
//     process.exit(1);
// });

// process.on('uncaughtException', (error) => {
//     console.error('❌ Uncaught Exception:', error);
//     process.exit(1);
// });

start();