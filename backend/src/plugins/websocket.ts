import { FastifyInstance } from "fastify";
import { fastifyWebsocket } from "@fastify/websocket";

export default async function websocketPlugin(fastify: FastifyInstance) {
	// Register the websocket plugin with configuration
	await fastify.register(fastifyWebsocket);

	console.log("✅ WebSocket plugin registered with configuration");
}
