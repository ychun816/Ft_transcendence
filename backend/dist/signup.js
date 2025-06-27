import { fastifyMultipart } from '@fastify/multipart';
import * as bcrypt from 'bcrypt';
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { pipeline } from "stream/promises";
const __dirname = dirname(fileURLToPath(import.meta.url));
async function fillUserInArray(parts, reply) {
    const fields = {};
    let avatarFile = null;
    for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'avatar') {
            avatarFile = part;
        }
        else if (part.type === 'field') {
            fields[part.fieldname] = part.value;
        }
    }
    const usernameValue = fields.username;
    const passwordValue = fields.password;
    if (!usernameValue || !passwordValue) {
        reply.code(400).send({ error: "Invalid user info: missing username or password." });
        return null;
    }
    const hashedPassword = await bcrypt.hash(passwordValue, 10);
    return { usernameValue, passwordValue, hashedPassword, avatarFile };
}
async function saveAvatar(avatarFile, username) {
    const avatarsDir = path.join(__dirname, "../../public/avatars");
    if (!fs.existsSync(avatarsDir)) {
        fs.mkdirSync(avatarsDir, { recursive: true });
    }
    const uploadPath = path.join(avatarsDir, `${username}.png`);
    await pipeline(avatarFile.file, fs.createWriteStream(uploadPath));
    return `/avatars/${username}.png`;
}
async function createUser(prisma, username, hashedPassword, avatarPath) {
    return await prisma.user.create({
        data: {
            username,
            passwordHash: hashedPassword,
            email: "",
            avatarUrl: avatarPath,
        }
    });
}
export async function registerNewUser(app, prisma) {
    app.register(fastifyMultipart);
    app.post('/api/signup', async (request, reply) => {
        const parts = request.parts();
        const userData = await fillUserInArray(parts, reply);
        if (!userData)
            return;
        const { usernameValue, passwordValue, hashedPassword, avatarFile } = userData;
        try {
            let avatarPath = "";
            if (avatarFile)
                avatarPath = await saveAvatar(avatarFile, usernameValue);
            const created = await createUser(prisma, usernameValue, hashedPassword, avatarPath);
            console.log('Created user:', created);
            reply.code(200).send({ success: true });
        }
        catch (err) {
            reply.code(400).send({ error: "Failed to import User data to the DB" });
        }
    });
}
