import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Prisma, PrismaClient, User, Match } from "@prisma/client";
import { extractTokenFromRequest } from "./profile.js";
import { GameManager } from "../game/GameManager.js";

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

interface CreateGameRequest {
	mode: 'solo' | 'versus' | 'multi' | 'tournoi';
}

async function findUser(prisma: PrismaClient, playerId: number) {
	const user = await prisma.user.findUnique({
		where: {id: playerId}
	});
	return user;
}

// ✅ FONCTION UTILITAIRE POUR VALIDER LES MODES
function isValidMode(mode: string): mode is 'solo' | 'versus' | 'multi' | 'tournoi' {
	return ['solo', 'versus', 'multi', 'tournoi'].includes(mode);
}

// ✅ FONCTION UTILITAIRE POUR LES INFOS DES MODES
function getModeInfo(mode: 'solo' | 'versus' | 'multi' | 'tournoi') {
	const modeInfos = {
		solo: {
			name: 'Solo',
			description: 'Joueur contre IA',
			players: 1,
			hasAI: true,
			scoreToWin: 5
		},
		versus: {
			name: 'Versus', 
			description: 'Joueur contre Joueur',
			players: 2,
			hasAI: false,
			scoreToWin: 5
		},
		multi: {
			name: 'Multi',
			description: 'Équipe contre Équipe (2v2)',
			players: 4,
			hasAI: false,
			scoreToWin: 5
		},
		tournoi: {
			name: 'Tournoi',
			description: 'Match de tournoi',
			players: 2,
			hasAI: false,
			scoreToWin: 3
		}
	};

	return modeInfos[mode];
}

export async function registerGameRoute(
	app: FastifyInstance<any, any, any, any>,
	prisma: PrismaClient,
	gameManager: GameManager
) {
	// =============== SERVER-SIDE PONG API ROUTES ===============

	// Créer une nouvelle partie
	app.post("/api/game/create", async (request, reply) => {
		try {
			const body = request.body as CreateGameRequest;
			const { mode } = body;

			if (!mode || !isValidMode(mode)) {
				return reply.status(400).send({ 
					error: 'Invalid game mode',
					validModes: ['solo', 'versus', 'multi', 'tournoi'],
					received: mode
				});
			}

			const gameId = gameManager.createGame(mode);
			const modeInfo = getModeInfo(mode);

			console.log(`🎮 API: Created ${mode} game: ${gameId}`);

			reply.send({
				success: true,
				gameId,
				mode,
				modeInfo,
				message: `${modeInfo.name} game created: ${gameId}`,
				websocketUrl: `/ws/game/${gameId}`,
				playersNeeded: modeInfo.players,
				hasAI: modeInfo.hasAI
			});
		} catch (error: any) {
			console.error('❌ Error creating game:', error);
			reply.status(500).send({ 
				error: 'Failed to create game',
				details: error.message 
			});
		}
	});

	// Obtenir l'état d'une partie spécifique
	app.get("/api/game/:gameId/state", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			// ✅ CORRECTION TYPESCRIPT : Casting pour accéder aux propriétés
			const response = {
				success: true,
				gameId,
				timestamp: Date.now(),
				state: gameState,
				serverInfo: {
					isServerSide: true,
					version: "2.0.0",
					mode: (gameState.state as any).game_mode || 'unknown'
				}
			};

			reply.send(response);
		} catch (error: any) {
			console.error('❌ Error getting game state:', error);
			reply.status(500).send({ 
				error: 'Failed to get game state',
				details: error.message 
			});
		}
	});

	// Obtenir seulement la position de la balle
	app.get("/api/game/:gameId/ball", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			const speed = Math.sqrt(
				gameState.ball.ball_dir_x ** 2 + 
				gameState.ball.ball_dir_y ** 2
			);

			reply.send({
				success: true,
				gameId,
				timestamp: Date.now(),
				ball: {
					x: gameState.ball.ball_x,
					y: gameState.ball.ball_y,
					dirX: gameState.ball.ball_dir_x,
					dirY: gameState.ball.ball_dir_y,
					speed: parseFloat(speed.toFixed(2)),
					angle: (gameState.ball as any).angle || 0
				}
			});
		} catch (error: any) {
			console.error('❌ Error getting ball position:', error);
			reply.status(500).send({ 
				error: 'Failed to get ball position',
				details: error.message 
			});
		}
	});

	// ✅ CORRECTION TYPESCRIPT : Gestion des différents types de paddles
	app.get("/api/game/:gameId/paddles", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			let paddlesData: any;

			// ✅ CORRECTION : Casting pour accéder aux propriétés
			const paddle = gameState.paddle as any;

			// Vérifier si c'est le mode multi (4 raquettes)
			if (paddle.paddles) {
				paddlesData = {
					mode: 'multi',
					team1: {
						p1_y: paddle.paddles.p1_y,
						p2_y: paddle.paddles.p2_y
					},
					team2: {
						p3_y: paddle.paddles.p3_y,
						p4_y: paddle.paddles.p4_y
					}
				};
			} else {
				// Mode solo/versus (2 raquettes)
				paddlesData = {
					mode: 'versus',
					left: paddle.left_paddle_y,
					right: paddle.right_paddle_y
				};
			}

			reply.send({
				success: true,
				gameId,
				timestamp: Date.now(),
				paddles: paddlesData
			});
		} catch (error: any) {
			console.error('❌ Error getting paddle positions:', error);
			reply.status(500).send({ 
				error: 'Failed to get paddle positions',
				details: error.message 
			});
		}
	});

	// Obtenir le score actuel
	app.get("/api/game/:gameId/score", async (request, reply) => {
		try {
			const { gameId } = request.params as { gameId: string };
			const gameState = gameManager.getGameState(gameId);

			if (!gameState) {
				return reply.status(404).send({ error: 'Game not found' });
			}

			reply.send({
				success: true,
				gameId,
				timestamp: Date.now(),
				score: {
					left: gameState.state.left_score,
					right: gameState.state.right_score,
					scoreToWin: gameState.config.score_to_win
				},
				gameStatus: {
					running: gameState.state.game_running,
					paused: gameState.state.is_paused,
					countdownActive: (gameState.state as any).count_down_active,
					mode: (gameState.state as any).game_mode || 'unknown'
				},
				config: {
					ballSpeed: gameState.config.ball_speed,
					paddleSpeed: gameState.config.paddle_speed,
					canvasSize: {
						width: gameState.config.canvas_width,
						height: gameState.config.canvas_height
					}
				}
			});
		} catch (error: any) {
			console.error('❌ Error getting game score:', error);
			reply.status(500).send({ 
				error: 'Failed to get game score',
				details: error.message 
			});
		}
	});

	// Lister toutes les parties actives
	app.get("/api/games", async (request, reply) => {
		try {
			const games = gameManager.getAllGames();
			const stats = gameManager.getStats();

			const enrichedGames = games.map(game => {
				const gameState = gameManager.getGameState(game.id);
				return {
					...game,
					status: gameState ? {
						running: gameState.state.game_running,
						paused: gameState.state.is_paused,
						score: {
							left: gameState.state.left_score,
							right: gameState.state.right_score
						}
					} : null,
					age: Date.now() - game.createdAt
				};
			});

			reply.send({
				success: true,
				games: enrichedGames,
				totalGames: games.length,
				serverStats: {
					totalConnections: stats.totalConnections,
					memoryUsage: stats.memoryUsage,
					uptime: stats.uptime
				},
				lastUpdate: Date.now()
			});
		} catch (error: any) {
			console.error('❌ Error listing games:', error);
			reply.status(500).send({ 
				error: 'Failed to list games',
				details: error.message 
			});
		}
	});

	// Informations sur les modes de jeu disponibles
	app.get("/api/game/modes", async (request, reply) => {
		try {
			const modes = ['solo', 'versus', 'multi', 'tournoi'].map(mode => ({
				mode,
				info: getModeInfo(mode as any)
			}));

			reply.send({
				success: true,
				modes,
				totalModes: modes.length
			});
		} catch (error: any) {
			console.error('❌ Error getting game modes:', error);
			reply.status(500).send({ 
				error: 'Failed to get game modes',
				details: error.message 
			});
		}
	});

	// =============== ANCIENNES API POUR SAUVEGARDER LES MATCHES ===============

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
			console.log("PRISMA CREATE MATCH");
			
			const game = await prisma.match.create({
				data: {
					players: gameData.players,
					player1Id: gameData.player1Id,

					...(gameData.player2Id && user2 && {
						player2Id: gameData.player2Id,
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

			console.log("✅ GAME CREATED (SERVER-SIDE):", game);
			
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
						...(gameData.player2Id === gameData.winnerId
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
				serverSide: true,
				message: "Match saved successfully"
			});
		} catch (error: any) {
			console.error("❌ Error while creating match:", error);
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
		const statResults = await generateStats(prisma, username)
        if (statResults === null) {
            console.log(`❌ stat Results not found for user: ${username}`);
            return reply.status(404).send({ error: 'stat Results not found for user' });
        }

		const {iaStats, tournamentStats, multiStats} = statResults;
		if (!iaStats || !tournamentStats || !multiStats)
			return reply.status(400).send({ error: "No game stats" });
		
		console.log("✅ iaStats: ", iaStats);
		console.log("✅ tournamentStats: ", tournamentStats);
		console.log("✅ multiStats: ", multiStats);
		
		return reply.status(200).send({
			success: true, 
			iaStats, 
			tournamentStats, 
			multiStats,
			serverSide: true,
			generatedAt: new Date().toISOString()
		});
	});
}

// =============== CLASSES ET FONCTIONS UTILITAIRES ===============

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
	if (!matches)
		return null;
	
	let iaStats = new GlobalStat;
	let tournamentStats = new GlobalStat;
	let multiStats = new GlobalStat;
	
	if (matches.matchesAsPlayer1.length > 0 || matches.matchesAsPlayer2.length > 0){
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