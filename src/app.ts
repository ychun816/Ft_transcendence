import fastify from 'fastify';
const app = fastify();
const port = 3000;

app.get('/', (req, res) => {
	res.send("Hello World!");
});

app.listen({ port:port }, () => {
	console.log(`App is listening on port: ${port}`);
});