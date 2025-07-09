import { FastifyInstance } from "fastify";

export default async function chatWebSocketRoutes(fastify: FastifyInstance) {
	console.log("🔧 Registering WebSocket route: /ws/chat");

	fastify.get("/ws/chat", { websocket: true }, (connection, req) => {
		console.log("🔧 New WebSocket connection from:", req.ip);
		console.log("🔧 Request URL:", req.url);

		// Envoyer un message de bienvenue
		connection.send(
			JSON.stringify({
				type: "connection_established",
				message: "Connected to chat server",
			})
		);

		connection.on("message", (message: Buffer) => {
			try {
				const data = JSON.parse(message.toString());
				console.log("🔧 Received message:", data);

				// Save message to database
				if (data.type === "chat_message") {

					console.log("💾 Saving message to database:", data.content);
				}

				// Renvoyer le message
				connection.send(
					JSON.stringify({
						type: "chat_message",
						content: data.content,
						timestamp: data.timestamp,
					})
				);
			} catch (error) {
				console.error("❌ Error processing message:", error);
				connection.send(
					JSON.stringify({
						type: "error",
						message: "Invalid message format",
					})
				);
			}
		});

		connection.on("close", (code: number, reason: string) => {
			console.log("🔧 WebSocket connection closed:", code, reason);
		});

		connection.on("error", (error: Error) => {
			console.error("❌ WebSocket error:", error);
		});
	});

	console.log("✅ WebSocket route registered successfully");
}
