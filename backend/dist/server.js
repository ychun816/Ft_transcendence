import fastify from "fastify";
import { registerNewUser } from "./routes/signup.js";
import { handleLogIn } from "./routes/login.js";
import { registerProfileRoute } from "./routes/profile.js";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { fastifyWebsocket } from "@fastify/websocket";
import chatWebSocketRoutes from "./routes/chat.js";
/*To do AGT:
 - Add Error management to signup and login;
 - Add rules to passwords and username;
 - Users can add others as friends and view their online status.
 - Fix image display;
 - Test Match History with data;
 - Implement Google Sign-In
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");
const prisma = new PrismaClient();
// console.log(prisma);
const app = fastify();
let root = path.join(__dirname, "frontend");
console.log(root);
app.register(fastifyStatic, {
    root: path.join(__dirname, "../../frontend/src"),
    prefix: "/",
});
app.setNotFoundHandler((_req, reply) => {
    reply.sendFile("index.html");
});
app.register(fastifyStatic, {
    root: path.join(PROJECT_ROOT, "public"),
    prefix: "/public/",
    decorateReply: false,
});
console.log("REGISTERING NEW USER");
registerNewUser(app, prisma);
console.log("LOGGING IN NEW USER");
handleLogIn(app, prisma);
console.log("GET USER INFO FOR FRONTEND");
registerProfileRoute(app, prisma);
// Register WebSocket plugin with configuration
await app.register(fastifyWebsocket, {
    options: {
        maxPayload: 1024 * 1024 * 10, // 10MB max message size
        clientTracking: true, // Track connected clients
        perMessageDeflate: false, // Disable compression for small messages
    },
});
// Register WebSocket routes
await chatWebSocketRoutes(app);
const start = async () => {
    try {
        await app.listen({ port: 3001, host: "0.0.0.0" });
        console.log(`App is listening on port: 3001`);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};
start();
