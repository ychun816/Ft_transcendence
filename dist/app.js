"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const app = (0, fastify_1.default)();
const port = 3000;
app.get('/', (req, res) => {
    res.send("Hello World!");
});
app.listen({ port: port }, () => {
    console.log(`App is listening on port: ${port}`);
});
