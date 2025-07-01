import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
const secretKey = 'abcde12345';
export async function handleLogIn(app, prisma) {
    console.log("DEBUG LOGIN MANAGEMENT");
    app.post("/api/login", async (request, reply) => {
        try {
            const { username, password } = request.body;
            const user = await prisma.user.findUnique({ where: { username } });
            if (!user)
                return reply.status(401).send({ success: false, message: "User not found" });
            const passwordCheck = await bcrypt.compare(password, user.passwordHash);
            if (!passwordCheck)
                return reply.status(401).send({ success: false, message: "Wrong password" });
            reply.send({ success: true });
        }
        catch (err) {
            console.error(err);
            reply.status(500).send({ success: false, message: "Internal server error" });
        }
    });
}

async function generateJWT(username, prisma) {
    const user = await prisma.user.findUnique({
        where: { username }
    });
    const token = jwt.sign({
        id: user?.id,
        username: user?.username
    }, secretKey, { expiresIn: '1h' });
    return token;
}
