import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
export async function registerProfileRoute(app, prisma) {
    app.get('/api/profile', async (request, reply) => {
        const username = request.query.username; // RECUPERER LE USERNAME DU JWT
        const { code, data } = await getUserInfo(username, prisma);
        reply.status(code).send(data);
    });
    app.post('/api/profile/avatar', async (request, reply) => {
        const username = request.query.username; // RECUPERER LE USERNAME DU JWT
        updateAvatar(prisma, username, request);
    });
}
async function getUserInfo(username, prisma) {
    if (!username) {
        return { code: 401, data: { error: "Not authenticated" } };
    }
    const user = await prisma.user.findUnique({
        where: { username },
        select: { username: true, avatarUrl: true }
    });
    if (!user) {
        return { code: 404, data: { error: "User not found" } };
    }
    return { code: 200, data: user };
}
async function updateAvatar(prisma, username, request) {
    const parts = request.parts();
    let avatarFile = null;
    for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "avatar")
            avatarFile = part;
    }
    const uploadPath = path.join(__dirname, "../../public/avatars", `${username}.png`);
    await pipeline(avatarFile.file, fs.createWriteStream(uploadPath));
    const avatarUrl = `/avatars/${username}.png`;
    await prisma.user.update({
        where: { username },
        data: { avatarUrl }
    });
}
