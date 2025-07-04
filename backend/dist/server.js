import fastify from 'fastify';
import { registerNewUser } from './signup.js';
import { handleLogIn } from './login.js';
import { registerProfileRoute } from './profile.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.js';
/*To do AGT:
 - Add Error management to signup and login;
 - Add rules to passwords and username;
 - Fix image display;
 - User profiles display stats, such as wins and losses.
 - Match History including 1v1 games, dates, and relevant details, accessible to logged-in users.
 - Implement Google Sign-In
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, "../../");
const prisma = new PrismaClient();
// logger.info(prisma);
const app = fastify({ logger: false, disableRequestLogging: false });
let root = path.join(__dirname, 'frontend');
logger.info(root); //info
app.register(fastifyStatic, {
    root: path.join(__dirname, '../../frontend/src'),
    prefix: '/',
});
app.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html');
});
app.register(fastifyStatic, {
    root: path.join(PROJECT_ROOT, 'public'),
    prefix: '/public/',
    decorateReply: false
});
logger.info("REGISTERING NEW USER");
registerNewUser(app, prisma);
logger.info("LOGGING IN NEW USER");
handleLogIn(app, prisma);
logger.info("GET USER INFO FOR FRONTEND");
registerProfileRoute(app, prisma);
const start = async () => {
    try {
        await app.listen({ port: 3000, host: '0.0.0.0' });
        logger.info(`App is listening on port: 3000`);
    }
    catch (err) {
        if (typeof err === 'string')
            logger.error(err);
        else
            console.error(err);
        process.exit(1);
    }
};
start();
