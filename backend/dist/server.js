import fastify from 'fastify';
import { registerNewUser } from './signup.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = fastify();
const port = 3000;
let root = path.join(__dirname, 'frontend');
console.log(root);
app.register(fastifyStatic, {
    root: path.join(__dirname, '../../frontend/dist'),
    prefix: '/',
});
app.setNotFoundHandler((req, reply) => {
    if (req.raw.method === 'GET' && !req.raw.url?.startsWith('/api')) {
        reply.sendFile('index.html');
    }
    else {
        reply.status(404).send({ error: 'Not found' });
    }
});
console.log("REGISTERING NEW USER");
registerNewUser(app, prisma);
const start = async () => {
    try {
        await app.listen({ port: port });
        console.log(`App is listening on port: ${port}`);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};
start();
