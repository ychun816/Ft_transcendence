import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = PrismaClient();
//Add avatar file management with fastify-multipart
export async function registerNewUser(app) {
    app.post('/api/signup', async (request, reply) => {
        const data = await request.file();
        const { username, password } = data.fields;
        const avatarFile = data.file;
        const hashedPassword = await bcrypt.hash(password.value, 10);
        try {
            await prisma.user.create({
                data: {
                    username: username.value,
                    passwordHash: hashedPassword,
                    //avatarUrl: avatarFile,
                }
            });
            reply.code(200).send({ sucess: true });
        }
        catch {
            reply.code(400).send({ error: "Failed to import User data to the DB" });
        }
    });
}
