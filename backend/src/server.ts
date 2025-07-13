import fastify from "fastify";
import { registerNewUser } from "./routes/signup.js";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");

const prisma = new PrismaClient();
const app = fastify({ 
    logger: true
});

const start = async () => {
    try {
        console.log("🚀 Starting server...");
        
        console.log("📦 Registering plugins...");
        await app.register(cookie, {
            secret: process.env.COOKIE_SECRET || 'fallback-secret-key',
            parseOptions: {},
        } as FastifyCookieOptions);
                
        await app.register(fastifyWebsocket, {
            options: {
                maxPayload: 1024 * 1024 * 10, // 10MB
                clientTracking: true,
                perMessageDeflate: false,
            },
        });
        
        await app.register(fastifyMultipart, {
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
                files: 1
            }
        });
        
        console.log("📂 Registering static files...");
        await app.register(fastifyStatic, {
            root: path.join(__dirname, "../../frontend/src"),
            prefix: "/",
        });
        
        await app.register(fastifyStatic, {
            root: path.join(PROJECT_ROOT, "public"),
            prefix: "/public/",
            decorateReply: false,
        });
        
        app.setNotFoundHandler((_req, reply) => {
            reply.sendFile("index.html");
        });
        
        console.log("🗄️ Testing database connection...");
        await prisma.$connect();
        console.log("✅ Database connected successfully");
        
        console.log("🛣️ Registering routes...");
        
        console.log("REGISTERING NEW USER");
        registerNewUser(app, prisma);
        
        console.log("LOGGING IN NEW USER");
        handleLogIn(app, prisma);
        
        console.log("GET USER INFO FOR FRONTEND");
        registerProfileRoute(app, prisma);
        
        console.log("🔌 Registering WebSocket routes...");
        await chatWebSocketRoutes(app, prisma);
        // Register WebSocket routes
        await registerNotificationRoutes(app, prisma);
        console.log("🎧 Starting to listen...");
        await app.listen({ 
            port: 3002,
            host: '0.0.0.0'
        });
        
        console.log(`🎉 Server is listening on port: 3002`);
        console.log(`🌐 Access your app at: http://localhost:3002`);
        
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