import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Prisma, PrismaClient, User, Match } from "@prisma/client";
import { extractTokenFromRequest } from "./profile.js"
import { match } from "assert";
import { request } from "http";

interface GameDataRequest {
	players: number;
	player1: User;
	player1Id: number;
	player2: User;
	player2Id?: number | null;
	score1: number;
	score2: number;
	winnerId: number | null;
	playedAt: Date;
	lasted: number;
	pointsUp: number;
	pointsDown: number;
	iaMode?: boolean;
	tournamentMode?: boolean;
	multiMode?: boolean;
}

async function findUser(prisma: PrismaClient, playerId: number)
{
	const user = await prisma.user.findUnique({
		where: {id: playerId}
	});
	return user;
}

export async function registerGameRoute(
	app: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient
)	{
	app.post("/api/game/add", async(request, reply) =>{
		try{
			const auth = extractTokenFromRequest(request);
			if (!auth) {
				return reply.status(401).send({ error: 'Unauthorized' });
			}

			console.log("AUTH GAME : ", auth);
			const gameData = request.body as GameDataRequest;
			if (!gameData) {
				reply.status(400).send({ error: "Game data not available" });
				return;
			}

			console.log("GAME DATA : ", gameData);
			console.log("PLAYER ID1 CHECK OK");
			if (!gameData.player1Id) {
				return reply.status(400).send({ error: "Player1 ID is required" });
			}

			console.log("PLAYER ID1 CHECK OK");
			const user1 = await findUser(prisma, gameData.player1Id);
			if (!user1) {
				return reply.status(400).send({
					error: `Player 1 (ID: ${gameData.player1Id}) doesn't exist`
				});
			}
			console.log("USER1 FOUND IN PRISMA");

			let user2 = null;
			if (gameData.player2Id) {
				user2 = await findUser(prisma, gameData.player2Id);
				if (!user2) {
					return reply.status(400).send({
						error: `Player 2 (ID: ${gameData.player2Id}) doesn't exist`
					});
				}
			}

			console.log("USER1 : ", user1);
			//console.log("USER2 : ", user2);
			console.log("PRISMA CREATE MATCH");
			// Création du match avec les corrections ci-dessus
			const game = await prisma.match.create({
				data: {
					players: gameData.players,
					player1Id: gameData.player1Id,
					//player1: { connect: { id: gameData.player1Id } },

					...(gameData.player2Id && user2 && {
						player2Id: gameData.player2Id,
						//player2: { connect: { id: gameData.player2Id } }
					}),

					score1: gameData.score1,
					score2: gameData.score2,
					winnerId: gameData.winnerId,
					playedAt: new Date(gameData.playedAt),
					lasted: gameData.lasted,
					pointsUp: gameData.pointsUp,
					pointsDown: gameData.pointsDown,
					iaMode: gameData.iaMode || false,
					tournamentMode: gameData.tournamentMode || false,
					multiMode: gameData.multiMode || false,
				}
			});

			console.log("GAME CREATED:", game);
			await prisma.user.update({
					where: { id: gameData.player1Id },
					data: {
						gamesPlayed: { increment: 1 },
						...(gameData.player1Id === gameData.winnerId
							? { wins: { increment: 1 } }
							: { losses: { increment: 1 } }
						),
						matchesAsPlayer1: { connect: { id: game.id } }
					}
				});
			if (gameData.player2Id){
				await prisma.user.update({
					where: { id: gameData.player2Id },
					data: {
						gamesPlayed: { increment: 1 },
						...(gameData.player1Id === gameData.winnerId
							? { wins: { increment: 1 } }
							: { losses: { increment: 1 } }
						),
						matchesAsPlayer2: { connect: { id: game.id } }
					}
				});
			}
			reply.send({
				success: true,
				gameId: game.id,
			});
		} catch (error) {
			console.error("Error while creating match:", error);
			reply.status(500).send({
				error: "Internal server error",
				details: error.message
			});
		}
	});

	app.get("/api/game/stats", async(
		request: FastifyRequest<{ Querystring: { username: string }}>,
		reply:  FastifyReply
	) => {
		const auth = extractTokenFromRequest(request);
		if (!auth) {
			return reply.status(401).send({ error: 'Unauthorized' });
		}

		const username = request.query.username as string;
		const {iaStats, tournamentStats, multiStats} = await generateStats(prisma, username)
		if (!iaStats || !tournamentStats || !multiStats)
			reply.status(400).send({ error: "No game stats" });
		reply.status(200).send({sucess:true, iaStats, tournamentStats, multiStats});
	});
}

class GlobalStat {
	winner: number = 0;
	loser: number = 0;
	lasted: number = 0;
	pointsUp: number = 0;
	pointsDown: number = 0;
	score: number = 0;
}

async function generateStats(prisma: PrismaClient, username: string)
{
	const matches = await prisma.user.findUnique({
		where: { username },
		select:{
			matchesAsPlayer1: true,
			matchesAsPlayer2: true,
			gamesPlayed: true,
		}
	});
	let iaStats = new GlobalStat;
	let tournamentStats = new GlobalStat;
	let multiStats = new GlobalStat;
	if (matches){
		await handleMatches(matches.matchesAsPlayer1, prisma, username, iaStats, tournamentStats, multiStats)
		await handleMatches(matches.matchesAsPlayer2, prisma, username, iaStats, tournamentStats, multiStats)
	}
	return {iaStats, tournamentStats, multiStats};
}

async function getWinnerStatus(prisma: PrismaClient, username: string, matche: Match): Promise <number>
{
	const user = await prisma.user.findUnique({
		where: { username },
		select:{ id: true }
	});
	if (!user) return 0;
	return matche.winnerId === user.id ? 1 : -1;
}

function addUpGameStats(matche: Match, tab: GlobalStat, winCount: number)
{
	if (winCount > 0) {
		tab.winner += 1;
	} else if (winCount < 0) {
		tab.loser += 1;
	}
	tab.lasted += matche.lasted;
	tab.pointsUp += matche.pointsUp;
	tab.pointsDown += matche.pointsDown;
	tab.score += matche.score1;
}

async function handleMatches(
	matches: Match[],
	prisma: PrismaClient,
	username: string,
	iaStats: GlobalStat,
	tournamentStats: GlobalStat,
	multiStats: GlobalStat)
{
	let iaGames = 0, tounamentGames = 0, multiGames = 0;
	for (let matche of matches)
	{
		if (matche.iaMode == true)
		{
			iaGames++;
			let winCount = await getWinnerStatus(prisma, username, matche);
			addUpGameStats(matche, iaStats, winCount);
		}
		else if (matche.tournamentMode == true)
		{
			tounamentGames++;
			let winCount = await getWinnerStatus(prisma, username, matche);
			addUpGameStats(matche, tournamentStats, winCount);
		}
		else if (matche.multiMode == true)
		{
			multiGames++;
			let winCount = await getWinnerStatus(prisma, username, matche);
			addUpGameStats(matche, multiStats, winCount);
		}
	}
}