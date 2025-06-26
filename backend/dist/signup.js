import fastifyMultipart from '@fastify/multipart';
import * as bcrypt from 'bcrypt';
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
//Add avatar file management with fastify-multipart
// function getFieldValue(field: any): string | undefined {
// 	if (!field) return undefined;
// 	if (Array.isArray(field)) field = field[0];
// 	if (typeof field.value === 'string') return field.value;
// 	if (Buffer.isBuffer(field.value)) return field.value.toString();
// 	return undefined;
// }
export async function registerNewUser(app, prisma) {
    console.log("DEBUG");
    app.register(fastifyMultipart);
    console.log("DEBUG2");
    app.post('/api/signup', async (request, reply) => {
        console.log("DEBUG3");
        const parts = request.parts();
        const fields = {};
        let avatarFile = null;
        console.log("DEBUG4");
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
        // PRINT DEBUG SIGNUP FORM
        console.log(`usernameValue: ${usernameValue}`);
        console.log(`passwordValue: ${passwordValue}`);
        // END PRINT DEBUG SIGNUP FORM
        if (!usernameValue || !passwordValue) {
            reply.code(400).send({ error: "Invalid user info: missing username or password." });
            return;
        }
        const hashedPassword = await bcrypt.hash(passwordValue, 10);
        try {
            let avatarPath = "";
            const avatarsDir = path.join(__dirname, "../../public/avatars");
            if (!fs.existsSync(avatarsDir)) {
                fs.mkdirSync(avatarsDir, { recursive: true });
            }
            const uploadPath = path.join(avatarsDir, `${usernameValue}.png`);
            if (!avatarFile) {
                avatarPath = "";
            }
            else {
                await pipeline(avatarFile.file, fs.createWriteStream(uploadPath));
                avatarPath = `/avatars/${usernameValue}.png`;
            }
            const created = await prisma.user.create({
                data: {
                    username: usernameValue,
                    passwordHash: hashedPassword,
                    email: "",
                    avatarUrl: avatarPath,
                }
            });
            // PRINT DEBUG DB USER CREATION
            console.log('Created user:', created);
            console.log("User inserted correctly");
            // END PRINT DEBUG DB USER CREATION
            reply.code(200).send({ sucess: true });
        }
        catch (err) {
            console.error("Erreur lors de la création de l'utilisateur :", err);
            reply.code(400).send({ error: "Failed to import User data to the DB" });
        }
        console.log("DEBUG5");
    });
}
